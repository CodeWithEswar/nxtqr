import type {
  PartitionState,
  ConsumerPosition,
} from "../streaming-schemas";

export interface PartitionLagSummary {
  partitionId: string;
  topicId: string;
  logStartOffset: number;
  logEndOffset: number;
  currentFetchOffset: number;
  committedNextOffset: number;
  committedLag: number;
  fetchLag: number;
}

export class StreamLagCalculator {
  /**
   * Computes committed and fetch lag for a single partition.
   */
  public static calculatePartitionLag(
    partition: PartitionState,
    position?: ConsumerPosition
  ): PartitionLagSummary {
    const logStartOffset = partition.logStartOffset;
    const logEndOffset = partition.nextOffset;

    const committedNextOffset =
      position?.committedNextOffset !== undefined
        ? position.committedNextOffset
        : logStartOffset;

    const currentFetchOffset =
      position?.currentFetchOffset !== undefined
        ? position.currentFetchOffset
        : committedNextOffset;

    const committedLag = Math.max(0, logEndOffset - committedNextOffset);
    const fetchLag = Math.max(0, logEndOffset - currentFetchOffset);

    return {
      partitionId: partition.id,
      topicId: partition.topicId,
      logStartOffset,
      logEndOffset,
      currentFetchOffset,
      committedNextOffset,
      committedLag,
      fetchLag,
    };
  }

  /**
   * Computes total consumer lag for a group across all relevant partitions.
   */
  public static calculateGroupLag(
    partitions: Record<string, PartitionState>,
    positions: Record<string, ConsumerPosition>
  ): {
    totalCommittedLag: number;
    totalFetchLag: number;
    partitionLags: Record<string, PartitionLagSummary>;
  } {
    let totalCommittedLag = 0;
    let totalFetchLag = 0;
    const partitionLags: Record<string, PartitionLagSummary> = {};

    for (const [partitionId, partition] of Object.entries(partitions)) {
      const position = positions[partitionId];
      const summary = this.calculatePartitionLag(partition, position);
      partitionLags[partitionId] = summary;
      totalCommittedLag += summary.committedLag;
      totalFetchLag += summary.fetchLag;
    }

    return {
      totalCommittedLag,
      totalFetchLag,
      partitionLags,
    };
  }
}

