import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class CachingStrategy implements IRecommendationStrategy {
  public readonly id = "strat_caching";
  public readonly name = "Application Caching Layer";
  public readonly category = "caching";
  public readonly description = "Introduce an in-memory caching layer (e.g. Redis) to offload read pressure from saturated storage systems.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap, edges } = context;
    const targetNode = group.primaryNodeId ? nodeMap.get(group.primaryNodeId) : undefined;
    if (!targetNode) return null;

    const componentType = ((targetNode.data?.componentType as string) || targetNode.type || "").toLowerCase();
    const isPersistence =
      componentType.includes("database") ||
      componentType.includes("sql") ||
      componentType.includes("postgres") ||
      componentType.includes("storage");

    const hasReadPressure = group.findings.some(
      (f) =>
        f.ruleId === "BTK-DB-001" ||
        f.ruleId === "strat_caching" ||
        f.category === "database-contention" ||
        f.category === "scalability-constraint" ||
        f.title.toLowerCase().includes("read") ||
        f.title.toLowerCase().includes("database")
    );

    if (!isPersistence && !hasReadPressure) return null;

    // Feasibility: Check if data is purely write-heavy
    const writeOnly = targetNode.data?.workloadPattern === "write-heavy";
    const feasibility = writeOnly ? "conditional" : "applicable";
    const feasibilityReason = writeOnly
      ? "Cache provides negligible read-offload for write-heavy mutation workloads; cache invalidation may cause negative net benefit."
      : "High read-to-write ratio makes in-memory caching highly effective for relieving storage contention.";

    // Generate Graph Operations: insert cache or update node config
    const proposedOperations: GraphOperation[] = [];
    const inboundEdges = edges.filter((e) => e.target === targetNode.id);

    if (inboundEdges.length > 0) {
      const edgeToCache = inboundEdges[0];
      proposedOperations.push({
        type: "insert_mediator",
        replaceEdgeId: edgeToCache.id,
        mediatorNode: {
          id: `cache_${targetNode.id}`,
          type: "infrastructure",
          position: {
            x: Math.round((targetNode.position?.x || 100) - 120),
            y: Math.round((targetNode.position?.y || 100) - 60),
          },
          label: `${targetNode.label || targetNode.id} Cache`,
          data: {
            componentType: "in-memory-cache",
            cacheStrategy: "lookaside",
            ttlSeconds: 300,
            evictionPolicy: "lru",
            declaredCapacityRps: 5000,
          },
        },
        inProtocol: "tcp",
        outProtocol: "tcp",
      });
    } else {
      proposedOperations.push({
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: { cachingEnabled: true, cacheTtlSeconds: 300 },
      });
    }

    return {
      isApplicable: true,
      feasibility,
      feasibilityReason,
      title: `Deploy Caching Layer for ${targetNode.label || targetNode.id}`,
      summary: `Introduce an in-memory caching layer in front of "${targetNode.label || targetNode.id}" to absorb repeated query traffic, drastically cutting database read latency and connection consumption.`,
      priority: group.rootCauseCandidate.type === "supported-root-cause" ? "critical" : "high",
      benefits: [
        "Reduces database read I/O by 60%–85% for cacheable queries.",
        "Drops p99 read latency from disk lookups to sub-millisecond RAM retrieval.",
        "Prevents database connection pool exhaustion during peak traffic surges.",
      ],
      tradeoffs: [
        "Introduces cache invalidation complexity on entity updates.",
        "Potential window of stale data under eventual consistency.",
        "Increases infrastructure memory footprints and cost.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "positive",
        security: "neutral",
        dataConsistency: "negative",
        operationalComplexity: "medium",
        costDirection: "increase",
        reversibility: "high",
        tradeoffNotes: [
          "Choose an appropriate TTL (e.g. 60–300s) to balance freshness vs read relief.",
          "Must define invalidation handlers or pub/sub cache purge on mutations.",
        ],
      },
      assumptions: [
        "Query access patterns exhibit temporal or spatial locality (frequently requested keys).",
        "Application clients can tolerate bounded eventual consistency for cached reads.",
      ],
      prerequisites: [
        "Identify cacheable read queries and configure explicit TTL boundaries.",
      ],
      conflictsWith: [
        "strict-acid-consistency-requirement",
      ],
      dependsOn: [],
      proposedOperations,
      alternativeStrategies: [
        {
          strategyId: "strat_read_replicas",
          title: "Horizontal Database Read Replicas",
          explanation: "Distributes SQL queries across database follower instances without cache invalidation logic.",
          tradeoffSummary: "Eliminates cache invalidation code, but replication lag still requires consideration and storage cost is higher.",
        },
        {
          strategyId: "strat_query_optimization",
          title: "Index & Query Plan Optimization",
          explanation: "Add covering composite indexes to eliminate full table scans before adding hardware.",
          tradeoffSummary: "Zero infrastructure cost, but reaches hardware throughput ceilings as total user volume scales.",
        },
      ],
      documentationId: "caching-patterns",
    };
  }
}
