import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";

export class ThirdPartyAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-third-party-analyzer";
  public readonly category = "third-party-integration";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const [nodeId, profile] of context.nodeProfiles.entries()) {
      const isWebhookHandler =
        profile.nodeName.toLowerCase().includes("webhook") ||
        profile.componentType.includes("webhook") ||
        (context.nodes.find((n) => n.id === nodeId)?.data?.isWebhookHandler as boolean) === true;

      if (isWebhookHandler) {
        const rawData = (context.nodes.find((n) => n.id === nodeId)?.data || {}) as Record<string, unknown>;
        const hasSignatureVerification = Boolean(
          rawData.verifiesSignature ||
          rawData.hmacVerification ||
          rawData.verifyHmac ||
          profile.controlsPresent.includes("auth-service")
        );

        if (!hasSignatureVerification) {
          findings.push({
            id: `SEC-EXT-001-${nodeId}`,
            ruleId: "SEC-EXT-001",
            dimension: "security",
            category: "third-party-integration",
            severity: "high",
            classification: "missing-configuration",
            strideCategory: "tampering",
            title: `Cryptographic Signature Verification Not Modeled for Inbound Webhook (${profile.nodeName})`,
            explanation: `Component "${profile.nodeName}" receives third-party webhooks without modeled HMAC signature verification. Without signature validation, malicious actors can forge inbound events or replay recorded transactions.`,
            affectedNodeIds: [nodeId],
            affectedEdgeIds: (context.incomingEdgesMap.get(nodeId) || []).map((e) => e.id),
            evidence: [
              {
                kind: "node",
                elementId: nodeId,
                propertyKey: "verifiesSignature",
                expectedValue: true,
                actualValue: false,
                description: `Webhook intake endpoint lacks signature verification configuration.`,
              },
            ],
            assumptions: [
              "Third-party webhooks must cryptographically verify incoming payload signatures before executing state changes.",
            ],
            confidence: "high",
            recommendationIds: ["REC-SEC-EXT-001"],
            documentationId: "sec-webhook-verification",
            deductionWeight: 15,
          });
        }
      }
    }

    return findings;
  }
}

