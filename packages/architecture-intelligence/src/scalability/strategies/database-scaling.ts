import type { IScalabilityStrategyEvaluator, ScalabilityEvaluationContext } from "../contracts/scalability.types";
import type { ScalabilityRecommendation } from "../schemas/scalability.schemas";

export class DatabaseScalingEvaluator implements IScalabilityStrategyEvaluator {
  public readonly strategy = "read-replication";

  public evaluate(context: ScalabilityEvaluationContext): ScalabilityRecommendation[] {
    const recommendations: ScalabilityRecommendation[] = [];

    for (const [nodeId, utilization] of Object.entries(context.bottleneckReport.nodeUtilization)) {
      const node = context.nodeMap.get(nodeId);
      if (!node) continue;

      const rawData = (node.data || {}) as Record<string, unknown>;
      const componentType = (rawData.componentType as string) || node.type || "";
      const label = (rawData.label as string) || nodeId;

      if (!componentType.includes("database")) continue;

      const currentReplicas = Number(rawData.readReplicas || 0);
      const isReadDominant = context.scenario.parameters.readRatio >= 0.70;
      const isWriteDominant = context.scenario.parameters.readRatio <= 0.40;

      // 1. Read Replication Strategy
      if (isReadDominant && currentReplicas === 0 && (utilization.status === "exceeding_capacity" || utilization.status === "near_saturation")) {
        const sourceFindings = context.bottleneckReport.findings
          .filter((f) => f.affectedNodeIds.includes(nodeId))
          .map((f) => f.id);

        recommendations.push({
          id: `REC-SCALE-DB-READ-${nodeId}`,
          strategy: "read-replication",
          title: `Deploy Read Replicas for Database Read Isolation (${label})`,
          summary: `Primary database "${label}" handles both transactional writes and analytical/lookup reads simultaneously. Adding 2 read replicas isolates read traffic and scales read capacity without impacting primary write locks.`,
          affectedNodeIds: [nodeId],
          affectedEdgeIds: (context.incomingEdgesMap.get(nodeId) || []).map((e) => e.id),
          sourceFindingIds: sourceFindings,
          feasibility: "applicable",
          feasibilityReasoning: `Component is a relational database and current workload is ${(context.scenario.parameters.readRatio * 100).toFixed(0)}% read operations.`,
          evidence: [
            {
              kind: "metric",
              elementId: nodeId,
              propertyKey: "demandReadRps",
              expectedValue: "Distributed Read Replica Pool",
              actualValue: `${Math.round(utilization.demandReadRps)} rps on Primary`,
              description: `All ${Math.round(utilization.demandReadRps)} read queries target the single primary instance.`,
            },
          ],
          assumptions: [
            "Application queries can tolerate asynchronous replication lag (typically 10-100ms) for secondary reads.",
            "Database clients use a connection router (e.g. PgBouncer/ProxySQL) directing SELECT to replicas and INSERT/UPDATE to primary.",
          ],
          prerequisites: [
            "Enable binary replication logging on the primary instance.",
            "Separate read-only data sources from read-write sources in application data access layer.",
          ],
          benefits: [
            "Multiplies read throughput by ~2.5x to 3x across replica nodes.",
            "Protects primary instance CPU and lock tables for critical write transactions.",
          ],
          tradeoffs: {
            implementationComplexity: "medium",
            operationalComplexity: "medium",
            reversibility: "easy",
            reliabilityImplications: "Read replicas provide warm failover standbys in disaster recovery.",
            securityImplications: "Replication stream must be encrypted via TLS across availability zones.",
            consistencyImplications: "Eventual consistency: readers may observe slightly stale records immediately after write.",
            costImpact: "Proportional cost increase for database replica instances and cross-AZ replication bandwidth.",
          },
          confidence: "high",
          rankScore: 88,
          proposedOperations: [
            {
              type: "update_node_config",
              nodeId,
              configUpdates: {
                readReplicas: 2,
                replicaRouting: "read-replica-pool",
                asynchronousReplication: true,
              },
            },
          ],
          documentationId: "scale-database-read",
        });
      }

      // 2. Partitioning or Sharding Strategy (Write Heavy)
      if (isWriteDominant && (utilization.status === "exceeding_capacity" || utilization.demandWriteRps > 1500)) {
        recommendations.push({
          id: `REC-SCALE-DB-SHARD-${nodeId}`,
          strategy: "sharding",
          title: `Evaluate Horizontal Table Partitioning or Key-Based Sharding (${label})`,
          summary: `High write volume of ${Math.round(utilization.demandWriteRps)} writes/s exceeds single-instance storage write IOPS. Read replicas cannot resolve write bottlenecks; evaluate table partitioning or horizontal sharding by customer/tenant ID.`,
          affectedNodeIds: [nodeId],
          affectedEdgeIds: [],
          sourceFindingIds: [],
          feasibility: "conditional",
          feasibilityReasoning: "Sharding introduces significant application complexity (cross-shard joins, distributed transactions). Only apply after query optimization and connection pooling have been exhausted.",
          evidence: [
            {
              kind: "metric",
              elementId: nodeId,
              propertyKey: "demandWriteRps",
              expectedValue: "< 1000 writes/s",
              actualValue: `${Math.round(utilization.demandWriteRps)} writes/s`,
              description: `Write volume exceeds single-primary transaction engine capacity.`,
            },
          ],
          assumptions: [
            "Workload has an identifiable shard key with uniform distribution (e.g. tenant_id or user_id).",
            "Queries across shards can be minimized or handled via secondary indexing.",
          ],
          prerequisites: [
            "Conduct schema access pattern audit to identify natural partition boundaries.",
            "Verify distributed transaction support in application layer.",
          ],
          benefits: [
            "Unlocks linear write throughput expansion across independent database shards.",
            "Keeps individual table index sizes small enough to reside entirely in RAM.",
          ],
          tradeoffs: {
            implementationComplexity: "high",
            operationalComplexity: "high",
            reversibility: "difficult",
            reliabilityImplications: "Failure of a single shard affects a partition of users rather than entire platform.",
            securityImplications: "Multi-shard connection management requires distributed secret distribution.",
            consistencyImplications: "Distributed transactions (2PC/Sagas) required for cross-shard operations.",
            costImpact: "High: multiple primary database instances and shard routing proxies required.",
          },
          confidence: "medium",
          rankScore: 65,
          proposedOperations: [
            {
              type: "update_node_config",
              nodeId,
              configUpdates: {
                shardingEnabled: true,
                partitioningStrategy: "hash-based-tenant-sharding",
              },
            },
          ],
          documentationId: "scale-database-sharding",
        });
      }
    }

    return recommendations;
  }
}
