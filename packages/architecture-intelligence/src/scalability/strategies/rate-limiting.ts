import type { IScalabilityStrategyEvaluator, ScalabilityEvaluationContext } from "../contracts/scalability.types";
import type { ScalabilityRecommendation } from "../schemas/scalability.schemas";

export class RateLimitingEvaluator implements IScalabilityStrategyEvaluator {
  public readonly strategy = "rate-limiting";

  public evaluate(context: ScalabilityEvaluationContext): ScalabilityRecommendation[] {
    const recommendations: ScalabilityRecommendation[] = [];

    // Find external quota or unthrottled ingress findings
    const quotaFindings = context.bottleneckReport.findings.filter(
      (f) => f.bottleneckType === "external_quota" || f.bottleneckType === "service_saturation"
    );

    for (const finding of quotaFindings) {
      for (const nodeId of finding.affectedNodeIds) {
        const node = context.nodeMap.get(nodeId);
        if (!node) continue;

        const rawData = (node.data || {}) as Record<string, unknown>;
        const componentType = (rawData.componentType as string) || node.type || "";
        const label = (rawData.label as string) || nodeId;

        const isIngressOrGateway =
          componentType === "api-gateway" ||
          componentType === "web-server" ||
          componentType === "load-balancer" ||
          componentType === "payment-gateway" ||
          componentType === "external-dependency";

        if (isIngressOrGateway && !rawData.rateLimitRps) {
          recommendations.push({
            id: `REC-SCALE-RATELIMIT-${nodeId}`,
            strategy: "rate-limiting",
            title: `Configure Ingress Rate Limiting & Backpressure on (${label})`,
            summary: `Traffic surges risk overwhelming downstream services or exceeding third-party provider quotas. Configuring token-bucket rate limiting rejects or queues burst requests with HTTP 429 Too Many Requests.`,
            affectedNodeIds: [nodeId],
            affectedEdgeIds: (context.incomingEdgesMap.get(nodeId) || []).map((e) => e.id),
            sourceFindingIds: [finding.id],
            feasibility: "applicable",
            feasibilityReasoning: "Component is an ingress gateway or external integration interface capable of admission control.",
            evidence: [
              {
                kind: "node",
                elementId: nodeId,
                propertyKey: "rateLimitRps",
                expectedValue: "Configured Rate Limiter (Token Bucket)",
                actualValue: "Unthrottled",
                description: `Ingress endpoint accepts unbounded traffic without rate limiting guardrails.`,
              },
            ],
            assumptions: [
              "Clients implement exponential backoff with jitter on HTTP 429 responses.",
              "Rate limiting policy can be partitioned by API key, IP address, or user tenant.",
            ],
            prerequisites: [
              "Define per-client quota tiers (e.g. 100 req/s standard, 500 req/s premium).",
            ],
            benefits: [
              "Prevents cascading service degradation by dropping load before internal queues saturate.",
              "Guarantees compliance with external third-party API rate quotas.",
            ],
            tradeoffs: {
              implementationComplexity: "low",
              operationalComplexity: "low",
              reversibility: "easy",
              reliabilityImplications: "Protects critical system stability during distributed denial of service or traffic spikes.",
              securityImplications: "Prevents brute-force and automated scraping attacks.",
              consistencyImplications: "No impact on data consistency.",
              costImpact: "Negligible.",
            },
            confidence: "high",
            rankScore: 82,
            proposedOperations: [
              {
                type: "update_node_config",
                nodeId,
                configUpdates: {
                  rateLimitRps: 2000,
                  rateLimitPolicy: "token-bucket-distributed",
                },
              },
            ],
            documentationId: "scale-rate-limiting",
          });
        }
      }
    }

    return recommendations;
  }
}
