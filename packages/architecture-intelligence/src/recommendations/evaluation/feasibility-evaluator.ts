import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { UnifiedRecommendation, RecommendationFeasibility } from "../contracts/recommendations.types";

export class FeasibilityEvaluator {
  public static evaluateFeasibility(
    recommendation: UnifiedRecommendation,
    nodes: BaseNode[],
    _edges: BaseEdge[]
  ): {
    feasibility: RecommendationFeasibility;
    feasibilityReason?: string;
  } {
    const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));

    // 1. Check if affected components exist
    const affectedExistingNodes = recommendation.affectedNodeIds.map((id) => nodeMap.get(id)).filter(Boolean) as BaseNode[];
    if (recommendation.affectedNodeIds.length > 0 && affectedExistingNodes.length === 0) {
      return {
        feasibility: "not-applicable",
        feasibilityReason: "Target components no longer exist in the current architecture graph revision.",
      };
    }

    // 2. Check if the recommendation is already fully implemented
    for (const node of affectedExistingNodes) {
      if (recommendation.strategyId === "strat_caching" && (node.data?.cachingEnabled === true || node.data?.componentType === "in-memory-cache")) {
        return {
          feasibility: "not-applicable",
          feasibilityReason: `Component "${node.label || node.id}" already has caching configured or is a cache.`,
        };
      }

      if (recommendation.strategyId === "strat_read_replicas" && Number(node.data?.readReplicas || 0) >= 2) {
        return {
          feasibility: "not-applicable",
          feasibilityReason: `Component "${node.label || node.id}" already has 2+ read replicas configured.`,
        };
      }

      if (recommendation.strategyId === "strat_circuit_breaker" && node.data?.circuitBreakerEnabled === true) {
        return {
          feasibility: "not-applicable",
          feasibilityReason: `Circuit breaker is already enabled on "${node.label || node.id}".`,
        };
      }

      if (recommendation.strategyId === "strat_idempotency" && node.data?.idempotencyEnabled === true) {
        return {
          feasibility: "not-applicable",
          feasibilityReason: `Idempotency enforcement is already declared on "${node.label || node.id}".`,
        };
      }

      if (recommendation.strategyId === "strat_rate_limiting" && node.data?.rateLimitingEnabled === true) {
        return {
          feasibility: "not-applicable",
          feasibilityReason: `Rate limiting is already configured on "${node.label || node.id}".`,
        };
      }

      if (recommendation.strategyId === "strat_failover_readiness" && node.data?.automatedFailover === true) {
        return {
          feasibility: "not-applicable",
          feasibilityReason: `Automated failover controller is already declared on "${node.label || node.id}".`,
        };
      }
    }

    // 3. Check for stateful blockers on horizontal scaling
    if (recommendation.strategyId === "strat_horizontal_scaling") {
      const statefulNode = affectedExistingNodes.find(
        (n) => n.data?.sessionStorage === "local-memory" || n.data?.isStateful === true
      );
      if (statefulNode) {
        return {
          feasibility: "conditional",
          feasibilityReason: `Requires externalizing session state from "${statefulNode.label || statefulNode.id}" before scaling instances.`,
        };
      }
    }

    // Default to the strategy's calculated feasibility
    return {
      feasibility: recommendation.feasibility,
      feasibilityReason: recommendation.feasibilityReason,
    };
  }
}
