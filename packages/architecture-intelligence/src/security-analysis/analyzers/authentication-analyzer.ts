import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";

export class AuthenticationAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-authentication-analyzer";
  public readonly category = "authentication";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const [nodeId, profile] of context.nodeProfiles.entries()) {
      // Rule SEC-AUTH-001: Public Ingress Without Authentication Policy or Explicit Anonymous Access
      if (
        profile.exposure === "public" &&
        !profile.isAnonymousAllowed &&
        !profile.componentType.includes("browser") &&
        !profile.componentType.includes("client") &&
        profile.componentType !== "static-website"
      ) {
        const inEdges = context.incomingEdgesMap.get(nodeId) || [];
        const hasAuthUpstreamOrLocal =
          profile.controlsPresent.includes("auth-service") ||
          inEdges.some((e) => {
            const srcProfile = context.nodeProfiles.get(e.source);
            return srcProfile && srcProfile.controlsPresent.includes("auth-service");
          });

        if (!hasAuthUpstreamOrLocal) {
          findings.push({
            id: `SEC-AUTH-001-${nodeId}`,
            ruleId: "SEC-AUTH-001",
            dimension: "security",
            category: "authentication",
            severity: "high",
            classification: "missing-configuration",
            strideCategory: "spoofing",
            title: `Authentication Policy Not Modeled for Public Ingress (${profile.nodeName})`,
            explanation: `Public-facing ingress component "${profile.nodeName}" does not specify an authentication requirement or explicit anonymous-access policy. Unauthenticated access may permit spoofed or untracked requests.`,
            affectedNodeIds: [nodeId],
            affectedEdgeIds: inEdges.map((e) => e.id),
            evidence: [
              {
                kind: "node",
                elementId: nodeId,
                propertyKey: "exposure",
                expectedValue: "authenticated or explicit anonymous",
                actualValue: profile.exposure,
                description: `Component has public exposure with no authentication service connection or isAnonymousAllowed declaration.`,
              },
            ],
            assumptions: [
              "Public endpoints without explicit anonymous access policy require client identity verification.",
            ],
            confidence: "high",
            recommendationIds: ["REC-SEC-AUTH-001"],
            documentationId: "sec-auth-ingress",
            deductionWeight: 15,
          });
        }
      }
    }

    return findings;
  }
}

