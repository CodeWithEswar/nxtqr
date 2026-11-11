import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";

export class GracefulDegradationStrategy implements IRecommendationStrategy {
  public readonly id = "strat_graceful_degradation";
  public readonly name = "Graceful Degradation Fallback Handler";
  public readonly category = "resilience";
  public readonly description = "Implement static/cached fallback handlers for non-critical downstream dependencies to ensure core user journeys complete during outages.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;

    const degradationFindings = group.findings.filter(
      (f) =>
        f.ruleId === "REL-DEGR-001" ||
        f.ruleId === "REL-DEGR-002" ||
        f.category === "graceful-degradation"
    );

    if (degradationFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    const componentType = ((targetNode.data?.componentType as string) || targetNode.type || "").toLowerCase();
    const isFinancial =
      componentType.includes("payment") ||
      componentType.includes("billing") ||
      componentType.includes("checkout") ||
      componentType.includes("order");

    const hasUnsafeApprovedFallback = degradationFindings.some((f) => f.ruleId === "REL-DEGR-002");

    // Critical safety constraint from prompt:
    // Strictly forbid degraded "success/approved" fallback on financial transactions!
    if (isFinancial || hasUnsafeApprovedFallback) {
      return {
        isApplicable: true,
        feasibility: "applicable",
        title: `Remove Unsafe Fallback & Enforce Fail-Closed Policy on ${targetNode.label || targetNode.id}`,
        summary: `Under NO circumstances may financial, payment, or order authorization endpoints fall back to an 'approved' or 'success' response during dependency failure. Enforce fail-closed semantics or queue for asynchronous verified settlement.`,
        priority: "critical",
        benefits: [
          "Eliminates catastrophic financial loss and unauthorized free order fulfillment during outages.",
          "Maintains absolute financial ledger integrity and PCI compliance.",
        ],
        tradeoffs: [
          "Users will receive explicit payment-pending or try-again errors during downstream payment provider outages.",
        ],
        tradeoffDetails: {
          reliability: "positive",
          performance: "neutral",
          scalability: "neutral",
          security: "positive",
          dataConsistency: "positive",
          operationalComplexity: "low",
          costDirection: "neutral",
          reversibility: "high",
          tradeoffNotes: [
            "Financial transactions must fail closed or transition to an unverified pending queue with strict idempotency.",
          ],
        },
        assumptions: [
          "Payment processing layer handles explicit 503 Service Unavailable or Pending status codes.",
        ],
        prerequisites: [],
        conflictsWith: [
          "degraded-approved-financial-fallback",
        ],
        dependsOn: [],
        proposedOperations: [
          {
            type: "update_node_config",
            nodeId: targetNode.id,
            configUpdates: {
              fallbackMode: "fail-closed",
              allowApprovedFallback: false,
              degradationAction: "return_pending_or_error",
            },
          },
        ],
        documentationId: "financial-degradation-invariants",
      };
    }

    // Standard optional dependency graceful degradation
    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Add Graceful Degradation Fallback for ${targetNode.label || targetNode.id}`,
      summary: `Equip "${targetNode.label || targetNode.id}" with an asynchronous fallback response (returning cached recommendations, static defaults, or empty secondary widgets) so outages in optional features do not fail primary page loads.`,
      priority: "medium",
      benefits: [
        "Keeps 95%+ of application functionality operating when auxiliary services (search, recommendations, analytics) fail.",
        "Prevents user-facing HTTP 500 errors on optional interface widgets.",
      ],
      tradeoffs: [
        "Users experience slightly degraded UI (e.g. generic recommendations or missing avatar icons).",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "positive",
        security: "neutral",
        dataConsistency: "neutral",
        operationalComplexity: "low",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "Ensure client UI gracefully handles null or cached fallback payloads.",
        ],
      },
      assumptions: [
        "Dependency is classified as optional or auxiliary rather than mission-critical.",
      ],
      prerequisites: [],
      conflictsWith: [],
      dependsOn: [],
      proposedOperations: [
        {
          type: "update_node_config",
          nodeId: targetNode.id,
          configUpdates: {
            fallbackMode: "cached-or-empty",
            fallbackTtlSeconds: 3600,
          },
        },
      ],
      documentationId: "graceful-degradation-patterns",
    };
  }
}
