import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  UnifiedRecommendation,
  RecommendationConflict,
} from "../contracts/recommendations.types";

export class ConflictDetector {
  public static detectConflicts(
    recommendations: UnifiedRecommendation[],
    nodes: BaseNode[]
  ): RecommendationConflict[] {
    const conflicts: RecommendationConflict[] = [];
    const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));

    for (let i = 0; i < recommendations.length; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const recA = recommendations[i];
        const recB = recommendations[j];

        // 1. Caching vs Database Read Replicas on same node (competing strategies)
        const sharesTargetNode = recA.affectedNodeIds.some((id) =>
          recB.affectedNodeIds.includes(id)
        );

        if (
          sharesTargetNode &&
          ((recA.strategyId === "strat_caching" && recB.strategyId === "strat_read_replicas") ||
            (recA.strategyId === "strat_read_replicas" && recB.strategyId === "strat_caching"))
        ) {
          conflicts.push({
            recommendationAId: recA.id,
            recommendationBId: recB.id,
            conflictType: "direct-incompatibility",
            explanation: `Both "${recA.title}" and "${recB.title}" propose separate infrastructure layers to solve read contention on the same database. Applying both simultaneously multiplies operational complexity and infrastructure costs unnecessarily.`,
            resolutionOptions: [
              "Choose Application Caching for repetitive identical query keys with acceptable eventual consistency.",
              "Choose Read Replicas for analytical, large-result, or heterogeneous SQL query workloads.",
            ],
          });
        }

        // 2. Aggressive Retries vs Overloaded Downstream Dependency
        const isRetrying =
          recA.strategyId === "strat_retry_timeout" ||
          recB.strategyId === "strat_retry_timeout";
        const isOverloaded =
          recA.sourceFindingIds.some((id) => id.includes("BTK") || id.includes("capacity")) ||
          recB.sourceFindingIds.some((id) => id.includes("BTK") || id.includes("capacity"));

        if (sharesTargetNode && isRetrying && isOverloaded) {
          conflicts.push({
            recommendationAId: recA.id,
            recommendationBId: recB.id,
            conflictType: "contention-amplification",
            explanation: `Increasing retry attempts while the downstream dependency is already suffering from throughput saturation risks causing a catastrophic retry storm that prevents dependency recovery.`,
            resolutionOptions: [
              "Deploy Circuit Breaker and rate limiting before enabling retry policies.",
              "Ensure retries strictly use exponential backoff with randomized full jitter and max 3 attempts.",
            ],
          });
        }

        // 3. Queue Decoupling vs Synchronous RPC Requirement
        if (
          sharesTargetNode &&
          ((recA.strategyId === "strat_queue_decoupling" && recB.strategyId === "strat_circuit_breaker") ||
            (recA.strategyId === "strat_circuit_breaker" && recB.strategyId === "strat_queue_decoupling"))
        ) {
          conflicts.push({
            recommendationAId: recA.id,
            recommendationBId: recB.id,
            conflictType: "consistency-tradeoff",
            explanation: `Queue decoupling converts synchronous RPC calls into asynchronous messaging, which alters the interaction model that circuit breakers protect.`,
            resolutionOptions: [
              "If the operation requires immediate client acknowledgement, keep synchronous RPC and apply Circuit Breaking.",
              "If the operation can be performed in the background, apply Queue Decoupling and remove synchronous circuit breakers.",
            ],
          });
        }

        // 4. Horizontal Scaling on Stateful Node
        if (recA.strategyId === "strat_horizontal_scaling" || recB.strategyId === "strat_horizontal_scaling") {
          const targetNode = nodeMap.get(recA.affectedNodeIds[0] || recB.affectedNodeIds[0]);
          if (targetNode?.data?.sessionStorage === "local-memory") {
            conflicts.push({
              recommendationAId: recA.id,
              recommendationBId: recB.id,
              conflictType: "prerequisite-violation",
              explanation: `Horizontal scaling cannot be applied to "${targetNode.label || targetNode.id}" while user session state is stored in local memory.`,
              resolutionOptions: [
                "Externalize session state to a shared Redis session store before scaling instances.",
              ],
            });
          }
        }
      }
    }

    return conflicts;
  }
}
