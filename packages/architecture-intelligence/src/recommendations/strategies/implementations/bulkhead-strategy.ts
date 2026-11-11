import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class BulkheadStrategy implements IRecommendationStrategy {
  public readonly id = "strat_bulkhead";
  public readonly name = "Bulkhead Isolation";
  public readonly category = "resilience";
  public readonly description = "Partition resource pools (threads, connections, memory) so failures or traffic spikes in one feature cannot starve mission-critical workloads.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;

    const bulkheadFindings = group.findings.filter(
      (f) => f.ruleId === "REL-BULK-001" || f.category === "bulkhead"
    );

    if (bulkheadFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    const proposedOperations: GraphOperation[] = [
      {
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          bulkheadIsolation: true,
          poolType: "partitioned",
          criticalThreadPoolSize: 50,
          auxiliaryThreadPoolSize: 15,
          maxConcurrentCallsPerRoute: 25,
        },
      },
    ];

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Partition Worker & Connection Bulkheads on ${targetNode.label || targetNode.id}`,
      summary: `Isolate thread and connection allocations on "${targetNode.label || targetNode.id}" into dedicated bulkheads so high-latency calls to optional/external dependencies cannot exhaust worker threads needed for mission-critical paths.`,
      priority: "high",
      benefits: [
        "Eliminates noisy-neighbor thread starvation across heterogeneous operations.",
        "Guarantees SLA headroom for core revenue-generating endpoints during background batch spikes.",
        "Constrains memory allocation per route to prevent out-of-memory crashes.",
      ],
      tradeoffs: [
        "Slightly reduces overall resource efficiency due to static pool partitioning.",
        "Requests exceeding route pool limits are immediately rejected with 429/503.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "neutral",
        scalability: "positive",
        security: "neutral",
        dataConsistency: "neutral",
        operationalComplexity: "medium",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "Tune pool sizes using 95th percentile concurrency measurements rather than arbitrary guesswork.",
        ],
      },
      assumptions: [
        "Compute runtime supports route-level thread pool execution or semaphore limiting.",
      ],
      prerequisites: [],
      conflictsWith: [],
      dependsOn: [],
      proposedOperations,
      documentationId: "bulkhead-isolation",
    };
  }
}
