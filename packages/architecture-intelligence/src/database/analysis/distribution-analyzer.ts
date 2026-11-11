/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Partition Pruning, Sharding & Read Replica Distribution Analyzer
 */

import type {
  DatabaseSchema,
  QueryWorkload,
  ShardingTopology,
  ReadReplicaRoutingConfig,
  DatabaseArchitectureFinding,
} from "../contracts/database.types";

export class DistributionAnalyzer {
  public static analyze(
    schema: DatabaseSchema,
    workloads: QueryWorkload[] = [],
    sharding?: ShardingTopology,
    readReplicaRouting?: ReadReplicaRoutingConfig
  ): DatabaseArchitectureFinding[] {
    const findings: DatabaseArchitectureFinding[] = [];

    // 1. Partition Pruning Analysis
    for (const table of schema.tables) {
      if (table.partitionConfig && table.partitionConfig.partitionType !== "none") {
        const partKeys = table.partitionConfig.partitionKeyColumnNames.map((k) => k.toLowerCase());

        for (const workload of workloads) {
          if (workload.targetTableNames.map((t) => t.toLowerCase()).includes(table.name.toLowerCase())) {
            const hasPartitionKeyInQuery = partKeys.some((k) =>
              workload.queryFingerprint.toLowerCase().includes(k)
            );

            if (!hasPartitionKeyInQuery && workload.frequencyPerMinute > 50) {
              findings.push({
                id: `finding-partition-pruning-failure-${table.id}-${workload.id}`,
                category: "unbounded_table_scan",
                severity: "high",
                affectedTableId: table.id,
                affectedQueryId: workload.id,
                title: `Partition Pruning Ineffective for Query "${workload.queryName}" on "${table.name}"`,
                explanation: `Table "${table.name}" is partitioned by (${table.partitionConfig.partitionKeyColumnNames.join(", ")}), but query "${workload.queryName}" does not filter by the partition key. The query planner cannot prune partitions and must scan every partition, negating partition performance benefits.`,
                evidence: [
                  `Table: ${table.name} (${table.partitionConfig.partitionType} partition)`,
                  `Partition Key: ${table.partitionConfig.partitionKeyColumnNames.join(", ")}`,
                  `Query: ${workload.queryName}`,
                  `Fingerprint: ${workload.queryFingerprint}`,
                ],
                riskAnalysis:
                  "High I/O amplification as all partition B-Trees and heap files are scanned in parallel.",
                remediation: `Include the partition key (${table.partitionConfig.partitionKeyColumnNames.join(", ")}) in the WHERE predicate of query "${workload.queryName}".`,
              });
            }
          }
        }
      }
    }

    // 2. Sharding Cross-Shard Join & Scatter-Gather Analysis
    if (sharding && sharding.strategy !== "none") {
      const shardKeys = sharding.shardKeyColumnNames.map((k) => k.toLowerCase());

      for (const workload of workloads) {
        const whereClause = workload.queryFingerprint.toLowerCase().split(/\bwhere\b/)[1] || "";
        const hasShardKeyInWhere = shardKeys.some((k) => whereClause.includes(k));

        if (!hasShardKeyInWhere && workload.queryType === "select" && workload.frequencyPerMinute > 20) {
          findings.push({
            id: `finding-cross-shard-scatter-${workload.id}`,
            category: "cross_shard_join_bottleneck",
            severity: "high",
            affectedQueryId: workload.id,
            title: `Cross-Shard Scatter-Gather Query Hazard on "${workload.queryName}"`,
            explanation: `Query "${workload.queryName}" executes across a ${sharding.totalShards}-node sharded database without specifying the shard key (${sharding.shardKeyColumnNames.join(", ")}). The routing proxy must broadcast this query to all ${sharding.totalShards} shards and merge the results, multiplying network and CPU load by ${sharding.totalShards}x.`,
            evidence: [
              `Sharding Strategy: ${sharding.strategy}`,
              `Total Shards: ${sharding.totalShards}`,
              `Shard Key: ${sharding.shardKeyColumnNames.join(", ")}`,
              `Query: ${workload.queryName} (${workload.frequencyPerMinute} rpm)`,
            ],
            riskAnalysis:
              "Query latency bounded by the slowest shard, proxy memory saturation, and massive cluster-wide CPU exhaustion.",
            remediation: `Restructure query "${workload.queryName}" to filter by the shard key (${sharding.shardKeyColumnNames.join(", ")}) or maintain an indexed secondary lookup table.`,
          });
        }
      }
    }

    // 3. Read Replica Lag & Session Consistency
    if (readReplicaRouting && readReplicaRouting.strategy !== "primary_only") {
      if (readReplicaRouting.maxAllowableLagMs > 100 && readReplicaRouting.readAfterWriteGracePeriodSeconds === 0) {
        findings.push({
          id: `finding-replica-routing-lag`,
          category: "transaction_isolation_anomaly",
          severity: "medium",
          title: `Stale Read Hazard on Read Replica Routing (${readReplicaRouting.maxAllowableLagMs}ms Lag)`,
          explanation: `Read replica routing uses "${readReplicaRouting.strategy}" across ${readReplicaRouting.replicaCount} replicas with up to ${readReplicaRouting.maxAllowableLagMs}ms allowable lag, but no read-after-write grace period is configured. Clients will observe stale state immediately following confirmed mutations.`,
          evidence: [
            `Routing Strategy: ${readReplicaRouting.strategy}`,
            `Replicas: ${readReplicaRouting.replicaCount}`,
            `Max Allowable Lag: ${readReplicaRouting.maxAllowableLagMs}ms`,
            `Read-After-Write Grace Period: 0s`,
          ],
          riskAnalysis:
            "User-facing data inconsistency where refreshed views intermittently omit recently created or updated entities.",
          remediation:
            "Configure a 5-10 second read-after-write grace period routing client queries to primary following any write operation.",
        });
      }
    }

    return findings;
  }
}
