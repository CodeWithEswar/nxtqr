import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "../strategy-types";
import type { GraphOperation } from "../../../scalability/schemas/scalability.schemas";

export class RateLimitingStrategy implements IRecommendationStrategy {
  public readonly id = "strat_rate_limiting";
  public readonly name = "Ingress Rate Limiting & Load Shedding";
  public readonly category = "traffic-management";
  public readonly description = "Deploy token-bucket rate limiting and load shedding at public ingress boundaries to protect downstream services from volumetric saturation.";

  public evaluate(context: StrategyContext): StrategyEvaluationResult | null {
    const { group, nodeMap } = context;

    const rateFindings = group.findings.filter(
      (f) =>
        f.ruleId === "REL-BACK-001" ||
        f.ruleId === "BTK-NET-001" ||
        f.ruleId === "scale_rate_limiting" ||
        f.category === "backpressure" ||
        f.category === "rate-limiting"
    );

    if (rateFindings.length === 0) return null;

    const targetNodeId = group.primaryNodeId;
    const targetNode = targetNodeId ? nodeMap.get(targetNodeId) : undefined;
    if (!targetNode) return null;

    const proposedOperations: GraphOperation[] = [
      {
        type: "update_node_config",
        nodeId: targetNode.id,
        configUpdates: {
          rateLimitingEnabled: true,
          algorithm: "token-bucket",
          rateLimitRps: 2000,
          burstCapacity: 500,
          loadSheddingThresholdCpu: 85,
        },
      },
    ];

    return {
      isApplicable: true,
      feasibility: "applicable",
      title: `Configure Rate Limiting & Load Shedding on ${targetNode.label || targetNode.id}`,
      summary: `Enforce token-bucket rate limits and automated CPU/latency load shedding on "${targetNode.label || targetNode.id}" to reject excess traffic with HTTP 429 before it can crash internal compute and database clusters.`,
      priority: "high",
      benefits: [
        "Shields internal microservices and databases from malicious or accidental denial-of-service surges.",
        "Guarantees SLA stability for high-priority authenticated clients during peak traffic events.",
        "Provides graceful fast-failure responses rather than slow hanging connections.",
      ],
      tradeoffs: [
        "Clients exceeding rate quota receive 429 Too Many Requests errors.",
        "Requires distributed token state (e.g. Redis sliding window) when running multiple gateway replicas.",
      ],
      tradeoffDetails: {
        reliability: "positive",
        performance: "positive",
        scalability: "positive",
        security: "positive",
        dataConsistency: "neutral",
        operationalComplexity: "low",
        costDirection: "neutral",
        reversibility: "high",
        tradeoffNotes: [
          "Return standard Retry-After headers in 429 responses to guide client backoff behavior.",
        ],
      },
      assumptions: [
        "Ingress gateway supports rate limiting filters or web application firewall (WAF) modules.",
      ],
      prerequisites: [],
      conflictsWith: [],
      dependsOn: [],
      proposedOperations,
      documentationId: "rate-limiting-and-shedding",
    };
  }
}
