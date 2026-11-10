import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";

const SECURE_PROTOCOLS = new Set([
  "https",
  "https/rest",
  "tls",
  "mtls",
  "wss",
  "grpc/tls",
  "grpc/http2",
  "ssh",
  "ipsec",
]);

export class TransportSecurityAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-transport-analyzer";
  public readonly category = "transport-security";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Rule SEC-TLS-001: Plaintext Protocol Crossing Perimeter or Trust Boundary
    for (const crossing of context.crossings) {
      if (!crossing.isEncryptedInTransit) {
        findings.push({
          id: `SEC-TLS-001-${crossing.edgeId}`,
          ruleId: "SEC-TLS-001",
          dimension: "security",
          category: "transport-security",
          severity: "high",
          classification: "potential-risk",
          strideCategory: "information-disclosure",
          title: `Plaintext Transport Protocol Crossing Trust Boundary (${crossing.protocol.toUpperCase()})`,
          explanation: `Connection crossing "${crossing.boundaryName}" uses protocol "${crossing.protocol}" without declared transport encryption (TLS). In-transit network traffic is susceptible to eavesdropping and packet tampering.`,
          affectedNodeIds: [crossing.sourceNodeId, crossing.targetNodeId],
          affectedEdgeIds: [crossing.edgeId],
          evidence: [
            {
              kind: "edge",
              elementId: crossing.edgeId,
              propertyKey: "protocol",
              expectedValue: "HTTPS / TLS / WSS",
              actualValue: crossing.protocol,
              description: `Cross-boundary connection lacks encryption in transit.`,
            },
          ],
          assumptions: [
            "All traffic crossing public network or trust boundaries must be encrypted in transit.",
          ],
          confidence: "high",
          recommendationIds: ["REC-SEC-TLS-001"],
          documentationId: "sec-transport-encryption",
          deductionWeight: 15,
        });
      }
    }

    // Rule SEC-TLS-002: Database Ingress Lacking Transport Encryption
    for (const edge of context.edges) {
      const targetProfile = context.nodeProfiles.get(edge.target);
      if (!targetProfile) continue;

      const isDataStore =
        targetProfile.componentType.includes("database") ||
        targetProfile.componentType.includes("storage");

      if (isDataStore) {
        const edgeData = (edge.data || {}) as Record<string, unknown>;
        const protocol = ((edgeData.protocol as string) || "tcp").toLowerCase();
        const isEncrypted = Boolean(
          (edgeData.encryptionInTransit ??
          edgeData.tls ??
          edgeData.ssl ??
          SECURE_PROTOCOLS.has(protocol)) ||
          targetProfile.enforcesTls
        );

        if (!isEncrypted) {
          findings.push({
            id: `SEC-TLS-002-${edge.id}`,
            ruleId: "SEC-TLS-002",
            dimension: "security",
            category: "transport-security",
            severity: "medium",
            classification: "missing-configuration",
            strideCategory: "information-disclosure",
            title: `Transport Encryption Not Specified for Database Connection (${targetProfile.nodeName})`,
            explanation: `Connection to database "${targetProfile.nodeName}" does not specify in-transit transport encryption (TLS/SSL). Unencrypted database connections may leak SQL queries, connection credentials, and record payloads across internal networks.`,
            affectedNodeIds: [edge.source, edge.target],
            affectedEdgeIds: [edge.id],
            evidence: [
              {
                kind: "edge",
                elementId: edge.id,
                propertyKey: "encryptionInTransit",
                expectedValue: true,
                actualValue: false,
                description: `Database client connection does not enforce TLS/SSL.`,
              },
            ],
            assumptions: [
              "Production persistence connections require TLS to protect query parameters and tabular records.",
            ],
            confidence: "high",
            recommendationIds: ["REC-SEC-TLS-002"],
            documentationId: "sec-database-tls",
            deductionWeight: 10,
          });
        }
      }
    }

    return findings;
  }
}
