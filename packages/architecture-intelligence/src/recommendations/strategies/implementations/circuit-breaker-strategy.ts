import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class CircuitBreakerStrategy implements IRecommendationStrategy {
  public readonly id = "strat_circuit_breaker";
  public readonly name = "Circuit Breaker & Fallback Isolation";
  public readonly category = "resilience";
  public readonly description = "Isolate callers from degraded dependencies by opening a circuit breaker and routing traffic to a degraded fallback path.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;

    const cbFindings = group.findings.filter(
      (f) =>
        f.ruleId.startsWith("REL-CB") ||
        f.ruleId === "REL-CASC-001" ||
        f.category === "circuit-breaker" ||
        f.category === "cascading-failure"
    );

    if (cbFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    const proposedOperations: GraphOperation[] = [
      {
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          hasCircuitBreaker: true,
          hasFallback: true,
          circuitBreakerEnabled: true,
          failureRateThreshold: 50,
          slowCallRateThreshold: 70,
          slowCallDurationThresholdMs: 2000,
          waitDurationInOpenStateMs: 10000,
          permittedNumberOfCallsInHalfOpenState: 10,
          fallbackAction: "return_cached_or_degraded",
        },
      },
    ];

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Enable Circuit Breaker with Fallback on ${targetNode.label || targetNode.id}`,
      summary: `Equip "${targetNode.label || targetNode.id}" with an automated circuit breaker to trip open when downstream error rates exceed 50%, short-circuiting doomed calls immediately and preserving upstream threads.`,
      priority: "high",
      benefits: [
        "Prevents uncontained cascading collapse when downstream dependencies slow down or fail.",
        "Gives struggling downstream services recovery headroom by stopping incoming call traffic.",
        "Provides predictable, immediate client degradation responses rather than 30-second timeouts.",
      ],
      tradeoffs: [
        "Requires designing a meaningful, safe fallback response (cached data or partial view).",
        "Improperly high threshold sensitivity can cause flapping in half-open state.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "positive",
        security: "neutral",
        dataConsistency: "variable",
        operationalComplexity: "medium",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "NEVER configure degraded 'approved' fallback on financial payments or order authorization.",
          "Tune waitDurationInOpenStateMs according to the downstream service's cold restart time.",
        ],
      },
      assumptions: [
        "Application runtime supports circuit breaker instrumentation (e.g. Resilience4j / Envoy filter / Polly).",
      ],
      prerequisites: [
        "Implement explicit fallback handler that returns safe default or cached state.",
      ],
      conflictsWith: [
        "financial-transaction-approved-fallback",
      ],
      dependsOn: [],
      proposedOperations,
      documentationId: "circuit-breaker-pattern",
    };
  }
}
