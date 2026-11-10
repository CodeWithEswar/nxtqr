import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";
import { DataFlowResolver } from "../engine/data-flow-resolver";

export class SensitiveDataAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-sensitive-data-analyzer";
  public readonly category = "sensitive-data";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const flowIssues = DataFlowResolver.analyzeSensitiveFlows(
      context.nodes,
      context.edges,
      context.nodeProfiles
    );

    for (const issue of flowIssues) {
      const srcProfile = context.nodeProfiles.get(issue.sourceNodeId);
      const tgtProfile = context.nodeProfiles.get(issue.targetNodeId);
      if (!srcProfile || !tgtProfile) continue;

      if (issue.flowIssue === "unencrypted-transit") {
        findings.push({
          id: `SEC-DATA-001-${issue.edgeId}`,
          ruleId: "SEC-DATA-001",
          dimension: "security",
          category: "sensitive-data",
          severity: "high",
          classification: "potential-risk",
          strideCategory: "information-disclosure",
          title: `Sensitive Data (${issue.dataSensitivity.toUpperCase()}) Transmitted Over Insecure Edge`,
          explanation: `Data classified as "${issue.dataSensitivity}" is transmitted between "${srcProfile.nodeName}" and "${tgtProfile.nodeName}" without explicit transport encryption. Eavesdropping could compromise confidential records or PII.`,
          affectedNodeIds: [issue.sourceNodeId, issue.targetNodeId],
          affectedEdgeIds: [issue.edgeId],
          evidence: [
            {
              kind: "edge",
              elementId: issue.edgeId,
              propertyKey: "dataSensitivity",
              expectedValue: "Encrypted In-Transit",
              actualValue: "Plaintext Edge",
              description: `Confidential or restricted data payload traverses unencrypted link.`,
            },
          ],
          assumptions: [
            "Data classified as confidential or restricted must always use encrypted channels in transit.",
          ],
          confidence: "high",
          recommendationIds: ["REC-SEC-DATA-001"],
          documentationId: "sec-data-tokenization",
          deductionWeight: 15,
        });
      } else if (issue.flowIssue === "unmasked-third-party") {
        findings.push({
          id: `SEC-DATA-002-${issue.edgeId}`,
          ruleId: "SEC-DATA-002",
          dimension: "security",
          category: "sensitive-data",
          severity: "high",
          classification: "missing-configuration",
          strideCategory: "information-disclosure",
          title: `Sensitive Data Sent to External Third-Party Without Tokenization / Masking (${tgtProfile.nodeName})`,
          explanation: `Data classified as "${issue.dataSensitivity}" flows from "${srcProfile.nodeName}" to external third party "${tgtProfile.nodeName}" without modeled tokenization, masking, or field-level encryption.`,
          affectedNodeIds: [issue.sourceNodeId, issue.targetNodeId],
          affectedEdgeIds: [issue.edgeId],
          evidence: [
            {
              kind: "edge",
              elementId: issue.edgeId,
              propertyKey: "tokenized",
              expectedValue: true,
              actualValue: false,
              description: `Sensitive data payload sent to external provider without explicit tokenization.`,
            },
          ],
          assumptions: [
            "Outbound data to third-party providers should be minimized or tokenized to comply with privacy regulations.",
          ],
          confidence: "medium",
          recommendationIds: ["REC-SEC-DATA-001"],
          documentationId: "sec-data-tokenization",
          deductionWeight: 15,
        });
      } else if (issue.flowIssue === "unscrubbed-telemetry") {
        findings.push({
          id: `SEC-DATA-003-${issue.edgeId}`,
          ruleId: "SEC-DATA-003",
          dimension: "security",
          category: "sensitive-data",
          severity: "medium",
          classification: "missing-configuration",
          strideCategory: "information-disclosure",
          title: `Sensitive Data Streamed to Logging / Telemetry Without Redaction (${tgtProfile.nodeName})`,
          explanation: `Data classified as "${issue.dataSensitivity}" is routed into telemetry aggregator "${tgtProfile.nodeName}" without explicit PII scrubbing or redaction filters. Logging credentials or PII violates data protection guidelines.`,
          affectedNodeIds: [issue.sourceNodeId, issue.targetNodeId],
          affectedEdgeIds: [issue.edgeId],
          evidence: [
            {
              kind: "edge",
              elementId: issue.edgeId,
              propertyKey: "redacted",
              expectedValue: true,
              actualValue: false,
              description: `Telemetry feed contains sensitive payload without redaction controls.`,
            },
          ],
          assumptions: [
            "Logging and observability pipelines must scrub secrets, access tokens, and PII prior to long-term indexing.",
          ],
          confidence: "medium",
          recommendationIds: ["REC-SEC-DATA-002"],
          documentationId: "sec-log-redaction",
          deductionWeight: 10,
        });
      }
    }

    return findings;
  }
}
