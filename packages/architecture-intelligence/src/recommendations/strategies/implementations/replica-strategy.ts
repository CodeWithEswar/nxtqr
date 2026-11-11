import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class ReplicaStrategy implements IRecommendationStrategy {
  public readonly id = "strat_read_replicas";
  public readonly name = "Database Read Replicas";
  public readonly category = "database-scaling";
  public readonly description = "Provision follower read replicas with load distribution to separate read queries from the primary write node.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;
    const targetNode = group.primaryNodeId ? nodeMap.get(group.primaryNodeId) : undefined;
    if (!targetNode) return null;

    const componentType = ((targetNode.data?.componentType as string) || targetNode.type || "").toLowerCase();
    const isDb =
      componentType.includes("database") ||
      componentType.includes("postgres") ||
      componentType.includes("sql") ||
      componentType.includes("relational");

    const hasScaleOrSpofIssue = group.findings.some(
      (f) =>
        f.ruleId === "BTK-DB-001" ||
        f.ruleId === "SPOF-SINGLE-INSTANCE" ||
        f.ruleId === "SPOF-DATABASE-HA" ||
        f.ruleId === "strat_read_replicas" ||
        f.category === "database-contention" ||
        f.category === "single-point-of-failure" ||
        f.title.toLowerCase().includes("database")
    );

    if (!isDb && !hasScaleOrSpofIssue) return null;

    const currentReplicas = Number(targetNode.data?.readReplicas || 0);
    if (currentReplicas >= 2) return null; // already replicated

    const proposedOperations: GraphOperation[] = [
      {
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          readReplicas: 2,
          readWriteSplitEnabled: true,
          replicationType: "asynchronous",
        },
      },
    ];

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Scale Read Replicas for ${targetNode.label || targetNode.id}`,
      summary: `Deploy horizontal follower read replicas for "${targetNode.label || targetNode.id}" to absorb heavy analytical and read workloads, safeguarding primary write availability.`,
      priority: group.rootCauseCandidate.type === "supported-root-cause" ? "critical" : "high",
      benefits: [
        "Linearly scales read query capacity across multiple read-only database nodes.",
        "Eliminates primary single point of failure for read traffic.",
        "Prevents long-running analytical queries from blocking transactional mutations.",
      ],
      tradeoffs: [
        "Asynchronous replication lag can cause read-your-own-writes inconsistencies.",
        "Requires connection pooling routers (e.g. PgBouncer / ProxySQL) to route reads vs writes.",
        "Multiplies compute and storage provisioned cost.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "positive",
        security: "neutral",
        dataConsistency: "variable",
        operationalComplexity: "medium",
        costDirection: "increase",
        reversibility: "high",
        tradeoffNotes: [
          "Use read-your-writes sticky routing for immediate post-mutation views.",
          "Monitor replication delay metrics (e.g., PostgreSQL pg_stat_replication).",
        ],
      },
      assumptions: [
        "Database engine supports asynchronous or semi-synchronous physical/logical replication.",
        "Application ORM or connection layer supports separate read and write database endpoints.",
      ],
      prerequisites: [
        "Configure read-write splitting connection pooler or database router.",
      ],
      conflictsWith: [
        "strict-read-after-write-linearizability",
      ],
      dependsOn: [],
      proposedOperations,
      alternativeStrategies: [
        {
          strategyId: "strat_caching",
          title: "In-Memory Caching Layer",
          explanation: "Caches database query results in Redis rather than running queries against replica databases.",
          tradeoffSummary: "Significantly cheaper and faster for small repetitive query keys, but requires invalidation code.",
        },
      ],
      documentationId: "database-replication",
    };
  }
}
