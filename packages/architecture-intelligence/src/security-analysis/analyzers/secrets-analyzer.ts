import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";

export class SecretsAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-secrets-analyzer";
  public readonly category = "secrets-management";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Check if system as a whole has any secrets manager modeled
    const systemHasSecretManager = Array.from(context.nodeProfiles.values()).some((p) =>
      p.controlsPresent.includes("secrets-vault")
    );

    for (const [nodeId, profile] of context.nodeProfiles.entries()) {
      // Rule SEC-SEC-001: Credential-Dependent Component Lacks Secret Management Integration
      if (profile.usesSecrets && !profile.hasSecretManagerBound && !systemHasSecretManager) {
        // Only trigger if node is a critical backend compute or data store that manages credentials
        const isBackendWorkerOrStore =
          profile.componentType.includes("database") ||
          profile.componentType === "compute-instance" ||
          profile.componentType === "kubernetes-cluster" ||
          profile.componentType === "payment-gateway";

        if (isBackendWorkerOrStore) {
          findings.push({
            id: `SEC-SEC-001-${nodeId}`,
            ruleId: "SEC-SEC-001",
            dimension: "security",
            category: "secrets-management",
            severity: "medium",
            classification: "missing-configuration",
            strideCategory: "information-disclosure",
            title: `Secrets Management Architecture Not Modeled for (${profile.nodeName})`,
            explanation: `Component "${profile.nodeName}" depends on authentication credentials, API keys, or database passwords, but no Secrets Manager or Key Management Service (KMS) is modeled in the architecture. Unmanaged credentials lead to static secret sprawl and delayed rotation.`,
            affectedNodeIds: [nodeId],
            affectedEdgeIds: [],
            evidence: [
              {
                kind: "node",
                elementId: nodeId,
                propertyKey: "usesSecrets",
                expectedValue: "Secrets Manager or KMS connection",
                actualValue: "unbound",
                description: `Credential-dependent component has no modeled vault or secret injection mechanism.`,
              },
            ],
            assumptions: [
              "Production services requiring database credentials or third-party API keys should integrate with a centralized secrets manager.",
            ],
            confidence: "medium",
            recommendationIds: ["REC-SEC-SEC-001"],
            documentationId: "sec-secrets-vault",
            deductionWeight: 10,
          });
        }
      }
    }

    return findings;
  }
}

