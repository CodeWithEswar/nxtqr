import type {
  AssignmentStrategy,
  ConsumerInstanceConfig,
} from "../streaming-schemas";

export class PartitionAssignor {
  /**
   * Computes partition assignments for active consumers in a group.
   * Ensures that within a group, each partition is assigned to at most one consumer.
   */
  public static assignPartitions(
    strategy: AssignmentStrategy,
    partitionIds: string[],
    consumers: ConsumerInstanceConfig[],
    previousAssignments: Record<string, string[]> = {}
  ): Record<string, string[]> {
    const activeConsumers = consumers
      .filter((c) => c.isAlive)
      .map((c) => c.id)
      .sort();

    const assignments: Record<string, string[]> = {};
    for (const c of consumers) {
      assignments[c.id] = [];
    }

    if (activeConsumers.length === 0 || partitionIds.length === 0) {
      return assignments;
    }

    const sortedPartitions = [...partitionIds].sort();

    switch (strategy) {
      case "range": {
        const numPartitions = sortedPartitions.length;
        const numConsumers = activeConsumers.length;
        const basePartitionsPerConsumer = Math.floor(numPartitions / numConsumers);
        const consumersWithExtra = numPartitions % numConsumers;

        let partitionIndex = 0;
        for (let i = 0; i < numConsumers; i++) {
          const consumerId = activeConsumers[i];
          const count =
            basePartitionsPerConsumer + (i < consumersWithExtra ? 1 : 0);
          assignments[consumerId] = sortedPartitions.slice(
            partitionIndex,
            partitionIndex + count
          );
          partitionIndex += count;
        }
        break;
      }

      case "round_robin": {
        for (let i = 0; i < sortedPartitions.length; i++) {
          const consumerId = activeConsumers[i % activeConsumers.length];
          assignments[consumerId].push(sortedPartitions[i]);
        }
        break;
      }

      case "sticky": {
        // Retain previous valid assignments for active consumers
        const assignedPartitions = new Set<string>();
        const targetPerConsumer = Math.ceil(
          sortedPartitions.length / activeConsumers.length
        );

        for (const consumerId of activeConsumers) {
          const prev = previousAssignments[consumerId] || [];
          for (const p of prev) {
            if (
              sortedPartitions.includes(p) &&
              !assignedPartitions.has(p) &&
              assignments[consumerId].length < targetPerConsumer
            ) {
              assignments[consumerId].push(p);
              assignedPartitions.add(p);
            }
          }
        }

        // Distribute remaining unassigned partitions to consumers with fewest assignments
        const unassigned = sortedPartitions.filter((p) => !assignedPartitions.has(p));
        for (const p of unassigned) {
          // Find consumer with minimal assigned partitions
          let minConsumer = activeConsumers[0];
          let minCount = assignments[minConsumer].length;

          for (const c of activeConsumers) {
            if (assignments[c].length < minCount) {
              minConsumer = c;
              minCount = assignments[c].length;
            }
          }
          assignments[minConsumer].push(p);
        }
        break;
      }
    }

    return assignments;
  }
}
