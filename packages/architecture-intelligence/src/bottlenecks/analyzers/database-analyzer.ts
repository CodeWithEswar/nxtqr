import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  BottleneckFinding,
  WorkloadScenario,
  NodeUtilization,
} from "../contracts/bottleneck.types";
import type { NodeTrafficDemand } from "../engine/traffic-resolver";
import type { ResolvedComponentCapacity } from "../engine/capacity-resolver";
import { CapacityResolver } from "../engine/capacity-resolver";

export class DatabaseAnalyzer {
  public static analyze(
    _nodes: BaseNode[],
    index: GraphIndex,
    demandMap: Map<string, NodeTrafficDemand>,
    capacityMap: Map<string, ResolvedComponentCapacity>,
    scenario: WorkloadScenario
  ): { findings: BottleneckFinding[]; dbUtilizations: Record<string, NodeUtilization> } {
    const findings: BottleneckFinding[] = [];
    const dbUtilizations: Record<string, NodeUtilization> = {};

    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (!dbNode) continue;

      const demand = demandMap.get(dbId) || { totalRps: 0, readRps: 0, writeRps: 0, bandwidthMbps: 0 };
      const cap = capacityMap.get(dbId);
      const capacityOps = cap?.capacityOps ?? 2000;
      const totalOps = Math.round(demand.totalRps);

      const ratio = Math.round((totalOps / Math.max(1, capacityOps)) * 100) / 100;
      const status = CapacityResolver.getUtilizationStatus(ratio);

      // Connection pool estimation
      const queryDurationMs = cap?.processingTimeMs || 8;
      const connectionPoolSize = Number(dbNode.data?.connectionPoolSize || 100);
      const estimatedActiveConnections = Math.round(totalOps * (queryDurationMs / 1000) * 10) / 10;

      dbUtilizations[dbId] = {
        nodeId: dbId,
        demandRps: totalOps,
        demandReadRps: Math.round(demand.readRps),
        demandWriteRps: Math.round(demand.writeRps),
        declaredCapacityRps: capacityOps,
        utilizationRatio: ratio,
        status,
        concurrencyDemand: estimatedActiveConnections,
        bandwidthDemandMbps: demand.bandwidthMbps,
        details: `Demand: ${totalOps} ops/s (${Math.round(demand.readRps)} R / ${Math.round(demand.writeRps)} W) | Capacity: ${capacityOps} ops/s`,
      };

      // Rule BOT-DB-001: Database Operation Saturation
      if (ratio >= 0.85) {
        const isCritical = ratio > 1.0;
        findings.push({
          id: `BOT-DB-001:${dbId}`,
          ruleId: "BOT-DB-001",
          bottleneckType: "database_contention",
          severity: isCritical ? "critical" : "high",
          title: `Database Throughput Saturation: ${dbNode.label || dbNode.type}`,
          explanation: `Database "${dbNode.label || dbNode.type}" faces ${totalOps} operations/sec (${Math.round(demand.readRps)} reads, ${Math.round(demand.writeRps)} writes) against a capacity limit of ${capacityOps} ops/sec under the "${scenario.name}" scenario (${Math.round(ratio * 100)}% utilization). High query queueing and locking will occur.`,
          affectedNodeIds: [dbId],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "metric",
              elementId: dbId,
              propertyKey: "utilizationRatio",
              expectedValue: "< 0.85 (85%)",
              actualValue: `${Math.round(ratio * 100)}%`,
              description: `Database query throughput exceeds capacity threshold.`,
            },
          ],
          assumptions: [
            `Read ratio is ${Math.round(scenario.parameters.readRatio * 100)}% under scenario "${scenario.name}".`,
            `Average query execution latency is estimated at ${queryDurationMs}ms.`,
          ],
          calculations: [
            {
              formula: "utilizationRatio = demandOps / declaredCapacityOps",
              variables: {
                demandOps: totalOps,
                declaredCapacityOps: capacityOps,
              },
              result: ratio,
              unit: "ratio",
              explanation: "Database workload relative to maximum IOPS/transaction limit.",
            },
          ],
          recommendationIds: ["REC-BOT-DB-001"],
          confidence: "high",
          tradeOffs: [
            "Adding read replicas adds replication lag and increases monthly database hosting costs.",
            "Sharding / partitioning requires distributed query routing and breaks single-transaction guarantees.",
          ],
        });
      }

      // Rule BOT-DB-POOL-001: Connection Pool Exhaustion
      if (estimatedActiveConnections > connectionPoolSize) {
        findings.push({
          id: `BOT-DB-POOL-001:${dbId}`,
          ruleId: "BOT-DB-POOL-001",
          bottleneckType: "database_contention",
          severity: "high",
          title: `Database Connection Pool Exhaustion: ${dbNode.label || dbNode.type}`,
          explanation: `Estimated concurrent database connections (${estimatedActiveConnections}) exceed the declared connection pool size (${connectionPoolSize}) on "${dbNode.label || dbNode.type}". Upstream application workers will block or time out waiting for available connections.`,
          affectedNodeIds: [dbId],
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "metric",
              elementId: dbId,
              propertyKey: "concurrencyDemand",
              expectedValue: `<= ${connectionPoolSize} connections`,
              actualValue: `${estimatedActiveConnections} connections`,
              description: `Concurrent database connections exceed connection pool limit.`,
            },
          ],
          assumptions: [
            `Queries hold connection locks for an average of ${queryDurationMs}ms.`,
          ],
          calculations: [
            {
              formula: "concurrentConnections = totalOps * (queryDurationMs / 1000)",
              variables: {
                totalOps,
                queryDurationMs,
              },
              result: estimatedActiveConnections,
              unit: "connections",
              explanation: "Active concurrent database sockets required simultaneously.",
            },
          ],
          recommendationIds: ["REC-BOT-DB-002"],
          confidence: "high",
          tradeOffs: [
            "Increasing database connection limits increases server memory allocation and OS thread context switching.",
            "Connection pool proxies (PgBouncer) add an extra network hop and do not support prepared statements across clients in transaction mode.",
          ],
        });
      }
    }

    return { findings, dbUtilizations };
  }
}
