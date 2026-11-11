import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class RetryTimeoutStrategy implements IRecommendationStrategy {
  public readonly id = "strat_retry_timeout";
  public readonly name = "Aligned Timeout & Bounded Retry Policy";
  public readonly category = "resilience";
  public readonly description = "Configure bounded retries with exponential backoff & full jitter, and enforce monotonic deadline budgets across call paths.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap, edgeMap } = context;

    const retryTimeoutFindings = group.findings.filter(
      (f) =>
        f.ruleId.startsWith("REL-RETRY") ||
        f.ruleId.startsWith("REL-TIME") ||
        f.category === "retry-policy" ||
        f.category === "timeout"
    );

    if (retryTimeoutFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    const targetEdgeId = group.primaryEdgeId || retryTimeoutFindings[0].affectedEdgeIds[0];
    const targetEdge = targetEdgeId ? edgeMap.get(targetEdgeId) : undefined;

    const hasDeadlineInversion = retryTimeoutFindings.some((f) => f.ruleId === "REL-TIME-002");

    const proposedOperations: GraphOperation[] = [];

    if (targetNode) {
      proposedOperations.push({
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          retries: 3,
          backoffStrategy: "exponential-jitter",
          backoffType: "exponential",
          jitter: true,
          jitterEnabled: true,
          baseBackoffMs: 200,
          maxBackoffMs: 2000,
          timeoutMs: hasDeadlineInversion ? 1500 : 2000,
        },
      });
    }

    if (targetEdge) {
      // update edge configuration
      proposedOperations.push({
        type: "update_node_config",
        nodeId: targetEdge.source,
        configUpdates: {
          outboundTimeoutMs: 1500,
        },
      });
    }

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: hasDeadlineInversion
        ? `Resolve Deadline Inversion & Align Timeouts on ${targetNode?.label || targetNodeId || "Call Path"}`
        : `Bound Retries & Add Jitter on ${targetNode?.label || targetNodeId || "Call Path"}`,
      summary: `Enforce a strict timeout hierarchy ($T_{caller} > T_{callee}$) and cap retries at 3 with exponential backoff and randomized jitter to prevent self-inflicted retry storms and zombie connection pool exhaustion.`,
      priority: "high",
      benefits: [
        "Eliminates caller 504 timeouts while downstream workers are still actively computing.",
        "Prevents retry amplification (e.g., $(R_A+1) \\times (R_B+1)$ cascading request spikes).",
        "Breaks phase-locked synchronization of concurrent retrying callers via full jitter.",
      ],
      tradeoffs: [
        "Slow downstream requests will fail faster with explicit cancellation.",
        "Requires distributed context deadline propagation (e.g. gRPC deadlines / HTTP headers).",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "neutral",
        security: "neutral",
        dataConsistency: "neutral",
        operationalComplexity: "low",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "Zero hardware provision cost.",
          "Must verify that downstream mutating operations are idempotent before auto-retrying.",
        ],
      },
      assumptions: [
        "Network transport supports request cancellation propagation.",
        "Mutating endpoints invoked by retrying callers enforce idempotency keys.",
      ],
      prerequisites: [
        "Ensure mutating APIs handle Idempotency-Key headers before enabling retries.",
      ],
      conflictsWith: [
        "non-idempotent-mutation-without-dedup",
      ],
      dependsOn: [],
      proposedOperations,
      documentationId: "timeouts-and-retries",
    };
  }
}
