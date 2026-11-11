import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class IdempotencyStrategy implements IRecommendationStrategy {
  public readonly id = "strat_idempotency";
  public readonly name = "Mutating Idempotency & Deduplication";
  public readonly category = "data-integrity";
  public readonly description = "Enforce client-generated idempotency keys and consumer deduplication caches to guarantee exactly-once processing outcomes across retries.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;

    const idempotencyFindings = group.findings.filter(
      (f) =>
        f.ruleId.startsWith("REL-IDEM") ||
        f.ruleId === "REL-MSG-002" ||
        f.category === "idempotency" ||
        f.category === "messaging"
    );

    if (idempotencyFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    const proposedOperations: GraphOperation[] = [
      {
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          idempotencyEnabled: true,
          idempotencyHeader: "Idempotency-Key",
          deduplicationTtlSeconds: 86400,
          deduplicationStorage: "redis-distributed",
        },
      },
    ];

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Enforce Idempotency & Deduplication on ${targetNode.label || targetNode.id}`,
      summary: `Mandate client-supplied 'Idempotency-Key' headers and distributed deduplication storage on "${targetNode.label || targetNode.id}" to prevent duplicate payments, double orders, or double-processed queue messages when network retries occur.`,
      priority: "critical",
      benefits: [
        "Completely eliminates duplicate financial charges and erroneous duplicate entity creation.",
        "Allows safe, aggressive automated retries across transient network partitions.",
        "Guarantees deterministic execution semantics over at-least-once delivery fabrics.",
      ],
      tradeoffs: [
        "Requires distributed fast-access key-value store (e.g. Redis) to cache idempotency tokens.",
        "Requires client applications to generate stable UUID v4 idempotency keys before retrying.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "neutral",
        scalability: "positive",
        security: "positive",
        dataConsistency: "positive",
        operationalComplexity: "medium",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "Set deduplication TTL according to maximum client retry window (typically 24–48 hours).",
          "Return cached HTTP response payload verbatim upon duplicate key detection.",
        ],
      },
      assumptions: [
        "Fast key-value cache or database table available for checking idempotency tokens.",
      ],
      prerequisites: [
        "Define stable client key generation protocol (e.g. clientRequestId UUID).",
      ],
      conflictsWith: [],
      dependsOn: [],
      proposedOperations,
      documentationId: "idempotency-patterns",
    };
  }
}
