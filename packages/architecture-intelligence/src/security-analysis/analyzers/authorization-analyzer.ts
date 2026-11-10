import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";

export class AuthorizationAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-authorization-analyzer";
  public readonly category = "authorization";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const [nodeId, profile] of context.nodeProfiles.entries()) {
      // Rule SEC-AUTHZ-001: Missing Authorization Policy on Privileged or Administrative Interfaces
      if (profile.isAdministrative || profile.requiresAuthz) {
        const hasAuthzControl =
          profile.controlsPresent.includes("authz-policy") ||
          (context.incomingEdgesMap.get(nodeId) || []).some((e) => {
            const srcProfile = context.nodeProfiles.get(e.source);
            return srcProfile && srcProfile.controlsPresent.includes("authz-policy");
          });

        if (!hasAuthzControl) {
          findings.push({
            id: `SEC-AUTHZ-001-${nodeId}`,
            ruleId: "SEC-AUTHZ-001",
            dimension: "security",
            category: "authorization",
            severity: "high",
            classification: "missing-configuration",
            strideCategory: "elevation-of-privilege",
            title: `Authorization Mechanism Not Modeled for Privileged Interface (${profile.nodeName})`,
            explanation: `Component "${profile.nodeName}" performs privileged or administrative operations but does not model an authorization mechanism (RBAC, ABAC, or Policy Engine). Authentication alone does not verify permissions.`,
            affectedNodeIds: [nodeId],
            affectedEdgeIds: [],
            evidence: [
              {
                kind: "node",
                elementId: nodeId,
                propertyKey: "isAdministrative",
                expectedValue: "Authorization Policy or Policy Engine Bound",
                actualValue: "None modeled",
                description: `Privileged interface lacks bound authorization or policy verification rules.`,
              },
            ],
            assumptions: [
              "Privileged interfaces require deterministic authorization checks to prevent privilege escalation.",
            ],
            confidence: "high",
            recommendationIds: ["REC-SEC-AUTHZ-001"],
            documentationId: "sec-authz-policy",
            deductionWeight: 15,
          });
        }
      }
    }

    return findings;
  }
}
