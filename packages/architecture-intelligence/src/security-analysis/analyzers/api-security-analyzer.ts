import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";

export class ApiSecurityAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-api-analyzer";
  public readonly category = "api-security";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const [nodeId, profile] of context.nodeProfiles.entries()) {
      const isPublicApiIngress =
        (profile.componentType === "api-gateway" ||
          profile.componentType === "web-server" ||
          profile.componentType === "load-balancer") &&
        profile.exposure === "public";

      if (isPublicApiIngress) {
        const inEdges = context.incomingEdgesMap.get(nodeId) || [];
        const hasRateLimiting =
          profile.controlsPresent.includes("rate-limiter") ||
          profile.controlsPresent.includes("ddos-shield") ||
          inEdges.some((e) => {
            const srcProfile = context.nodeProfiles.get(e.source);
            return srcProfile && (srcProfile.controlsPresent.includes("rate-limiter") || srcProfile.controlsPresent.includes("ddos-shield"));
          });

        if (!hasRateLimiting) {
          findings.push({
            id: `SEC-API-001-${nodeId}`,
            ruleId: "SEC-API-001",
            dimension: "security",
            category: "api-security",
            severity: "medium",
            classification: "missing-configuration",
            strideCategory: "denial-of-service",
            title: `Rate Limiting / Request Throttling Not Modeled for Public Ingress (${profile.nodeName})`,
            explanation: `Public-facing entrypoint "${profile.nodeName}" does not specify rate limiting or DDoS throttling controls. Ingress endpoints without rate limiting are susceptible to automated credential attacks and denial of service.`,
            affectedNodeIds: [nodeId],
            affectedEdgeIds: inEdges.map((e) => e.id),
            evidence: [
              {
                kind: "node",
                elementId: nodeId,
                propertyKey: "rateLimiting",
                expectedValue: "Rate Limiter or DDoS Shield Bound",
                actualValue: "None modeled",
                description: `Public gateway accepts unbounded traffic without rate limiting guardrails.`,
              },
            ],
            assumptions: [
              "Public entrypoints should enforce rate limiting or upstream DDoS mitigation to prevent resource exhaustion.",
            ],
            confidence: "medium",
            recommendationIds: ["REC-SEC-API-001"],
            documentationId: "sec-rate-limiting",
            deductionWeight: 10,
          });
        }
      }
    }

    return findings;
  }
}

