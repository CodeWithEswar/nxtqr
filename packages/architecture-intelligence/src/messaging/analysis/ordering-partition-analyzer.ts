/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Ordering & Partitioning Scope Analyzer
 */

import type {
  MessagingDestination,
  ConsumerGroup,
  MessagingFinding,
} from "../contracts/messaging.types";

export class OrderingPartitionAnalyzer {
  public static analyze(
    destinations: MessagingDestination[],
    consumerGroups: ConsumerGroup[]
  ): MessagingFinding[] {
    const findings: MessagingFinding[] = [];

    for (const dest of destinations) {
      const partConfig = dest.partitioning;

      // 1. Invalid Global Ordering Claim on Partitioned Destination
      if (dest.orderingScope === "global" && partConfig && partConfig.partitionCount > 1) {
        findings.push({
          id: `finding-ordering-violation-${dest.id}`,
          category: "ordering_violation",
          severity: "critical",
          affectedDestinationId: dest.id,
          title: `Impossible Global Ordering Guarantee on Partitioned ${dest.name}`,
          explanation: `Destination "${dest.name}" specifies a 'global' ordering scope but is configured with ${partConfig.partitionCount} partitions. Distributed partitions are processed in parallel and do not preserve global ordering across partitions.`,
          evidence: [
            `Destination: ${dest.name}`,
            `orderingScope: global`,
            `partitionCount: ${partConfig.partitionCount}`,
            `assignmentStrategy: ${partConfig.assignmentStrategy}`,
          ],
          riskAnalysis: `Downstream consumers consuming from multiple partitions will observe events out of sequence (e.g. OrderCancelled processed before OrderCreated), leading to state corruption and invalid business transitions.`,
          remediation: `Adjust ordering scope to 'key' (with an explicit partition key) or 'partition', or reduce partition count to 1 if strict total global ordering is truly required (understanding the single-thread throughput ceiling).`,
        });
      }

      // 2. Missing Partition Key on Keyed Ordering Scope
      if (
        (dest.orderingScope === "key" || dest.orderingScope === "message_group") &&
        (!partConfig?.partitionKeyField || partConfig.partitionKeyField.trim() === "")
      ) {
        findings.push({
          id: `finding-missing-partition-key-${dest.id}`,
          category: "ordering_violation",
          severity: "high",
          affectedDestinationId: dest.id,
          title: `Missing Partition Key Definition on ${dest.name}`,
          explanation: `Destination "${dest.name}" requires '${dest.orderingScope}' ordering, but no partition key field ('partitionKeyField') is defined in the configuration.`,
          evidence: [
            `Destination: ${dest.name}`,
            `orderingScope: ${dest.orderingScope}`,
            `partitionKeyField: undefined`,
          ],
          riskAnalysis: `Without an explicit partition key, producers or client SDKs default to round-robin or random distribution, scattering related entity events across random partitions and breaking causal ordering.`,
          remediation: `Specify an explicit, high-cardinality business key field (e.g. 'orderId', 'userId', or 'tenantId') as the partition key.`,
        });
      }

      // 3. Partition Count vs Consumer Group Workers Underutilization
      const groups = consumerGroups.filter((g) => g.destinationId === dest.id);
      for (const group of groups) {
        if (partConfig && partConfig.partitionCount > 0 && group.activeWorkersCount > partConfig.partitionCount) {
          const idleWorkers = group.activeWorkersCount - partConfig.partitionCount;
          findings.push({
            id: `finding-partition-worker-mismatch-${group.id}`,
            category: "partition_skew",
            severity: "medium",
            affectedDestinationId: dest.id,
            title: `Excess Idle Workers in Consumer Group ${group.groupId}`,
            explanation: `Consumer group "${group.groupId}" has ${group.activeWorkersCount} active workers assigned to destination "${dest.name}", which only has ${partConfig.partitionCount} partitions.`,
            evidence: [
              `Consumer Group: ${group.groupId}`,
              `Active Workers: ${group.activeWorkersCount}`,
              `Partitions: ${partConfig.partitionCount}`,
              `Idle Workers: ${idleWorkers}`,
            ],
            riskAnalysis: `In standard partition assignment (e.g. Kafka or Pub/Sub), at most one worker per consumer group can read from a given partition concurrently. ${idleWorkers} workers will sit completely idle, wasting compute resources without increasing throughput.`,
            remediation: `Increase topic partitions to match or exceed consumer concurrency, or scale down consumer replicas to ${partConfig.partitionCount} instances.`,
          });
        }
      }
    }

    return findings;
  }
}

