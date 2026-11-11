/**
 * Architecture Messaging Intelligence — Fan-Out & Competing Consumers Analyzer
 *
 * Analyzes event broadcast topology, distinguishing topic fan-out (publish-subscribe)
 * from competing consumer work-queues. Identifies message stealing anomalies,
 * consumer worker idle starvation, and downstream traffic amplification.
 */

import {
  MessagingTopology,
  MessagingDestination,
  MessagingFinding,
} from "../contracts/messaging.types";

export interface FanoutAnalysisResult {
  findings: MessagingFinding[];
  fanoutRatios: Record<string, number>; // destinationId -> number of distinct consumer groups / services
}

export class FanoutAnalyzer {
  public analyze(topology: MessagingTopology): FanoutAnalysisResult {
    const findings: MessagingFinding[] = [];
    const fanoutRatios: Record<string, number> = {};

    const destinationMap = new Map<string, MessagingDestination>(
      topology.destinations.map((d) => [d.id, d])
    );

    // Group consumers by destination
    const consumersByDest = new Map<string, typeof topology.consumers>();
    for (const consumer of topology.consumers) {
      const list = consumersByDest.get(consumer.destinationId) || [];
      list.push(consumer);
      consumersByDest.set(consumer.destinationId, list);
    }

    // Group consumer groups by destination
    const groupsByDest = new Map<string, typeof topology.consumerGroups>();
    for (const group of topology.consumerGroups) {
      const list = groupsByDest.get(group.destinationId) || [];
      list.push(group);
      groupsByDest.set(group.destinationId, list);
    }

    for (const [destId, consumers] of consumersByDest.entries()) {
      const destination = destinationMap.get(destId);
      if (!destination) continue;

      const groups = groupsByDest.get(destId) || [];
      const distinctServices = new Set(consumers.map((c) => c.serviceId));
      const fanoutDegree = Math.max(groups.length, distinctServices.size);
      fanoutRatios[destId] = fanoutDegree;

      // 1. Accidental Message Stealing on Point-to-Point Queue
      // If a destination is a queue (not topic/pubsub) and multiple distinct services consume from it
      // without being part of the same consumer group, they will compete and steal messages
      if (
        destination.type === "queue" &&
        distinctServices.size > 1 &&
        groups.length === 0
      ) {
        findings.push({
          id: `fanout-queue-stealing-${destination.id}`,
          category: "competing_consumer_hazard",
          severity: "high",
          affectedDestinationId: destination.id,
          title: `Accidental Competing Consumers on Queue: ${destination.name}`,
          explanation: `Multiple distinct consumer services (${Array.from(distinctServices).join(
            ", "
          )}) consume from point-to-point queue "${
            destination.name
          }". In a point-to-point queue, each message is delivered to only ONE consumer. Services will compete and steal messages from each other instead of receiving all broadcast events.`,
          evidence: [
            `Destination type: ${destination.type}`,
            `Distinct consumer services: ${Array.from(distinctServices).join(", ")}`,
            `Configured consumer groups: 0`,
          ],
          riskAnalysis:
            "Silent data omission: services receive partial subsets of messages, breaking event-driven choreography and downstream consistency.",
          remediation:
            "Replace queue with a Topic or Pub/Sub exchange, and configure dedicated subscriber queues or subscription filters for each distinct consumer service.",
        });
      }

      // 2. High Fan-out Traffic Amplification
      // When a single topic fans out to 6+ independent consumer groups/services
      if (
        (destination.type === "topic" || destination.type === "stream") &&
        fanoutDegree >= 6
      ) {
        findings.push({
          id: `fanout-amplification-${destination.id}`,
          category: "consumer_lag_spike",
          severity: "medium",
          affectedDestinationId: destination.id,
          title: `High Fan-out Amplification on ${destination.name} (${fanoutDegree} Consumers)`,
          explanation: `Topic "${destination.name}" fans out to ${fanoutDegree} independent consumer groups/services. Downstream traffic, network egress, and broker connection handling scale proportionally to publish rate × ${fanoutDegree}.`,
          evidence: [
            `Destination type: ${destination.type}`,
            `Fan-out degree: ${fanoutDegree}`,
            `Consumer groups: ${groups.map((g) => g.groupId).join(", ") || "None"}`,
          ],
          riskAnalysis:
            "Broker I/O saturation, network egress cost surge, and cascading lag if multiple consumer groups fall behind simultaneously.",
          remediation:
            "Evaluate event filtering (e.g. SNS message attributes or Kafka consumer side filtering) to deliver only relevant events to respective consumer groups.",
        });
      }

      // 3. Partitioned Topic Worker Oversubscription / Idle Starvation
      // If active workers in a group exceed the partition count
      if (destination.partitioning && destination.partitioning.partitionCount > 0) {
        for (const group of groups) {
          if (group.activeWorkersCount > destination.partitioning.partitionCount) {
            const idleWorkers =
              group.activeWorkersCount - destination.partitioning.partitionCount;
            findings.push({
              id: `partition-worker-idle-${group.id}`,
              category: "partition_skew",
              severity: "medium",
              affectedDestinationId: destination.id,
              title: `Idle Worker Starvation in Consumer Group "${group.groupId}" (${idleWorkers} Idle)`,
              explanation: `Consumer group "${group.groupId}" has ${group.activeWorkersCount} active worker instances, but destination "${destination.name}" only has ${destination.partitioning.partitionCount} partitions. In partition-assigned messaging (e.g. Kafka, Azure Event Hubs), a single partition can only be consumed by at most one worker per group. ${idleWorkers} workers are completely idle.`,
              evidence: [
                `Topic partitions: ${destination.partitioning.partitionCount}`,
                `Active workers: ${group.activeWorkersCount}`,
                `Idle workers: ${idleWorkers}`,
              ],
              riskAnalysis:
                "Wasted compute resources, false perception of horizontal scaling capacity, and rebalance delays.",
              remediation: `Increase partition count on "${destination.name}" to at least ${group.activeWorkersCount}, or scale down worker replica count to match partition count (${destination.partitioning.partitionCount}).`,
            });
          }
        }
      }
    }

    return { findings, fanoutRatios };
  }
}
