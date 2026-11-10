import type { AnalyzerContext, DimensionAssessment, HealthFinding } from "../contracts/health.types";
import type { IAnalyzer } from "./analyzer-interface";
import { calculateDimensionScore } from "../scoring/score-calculator";

export class SecurityAnalyzer implements IAnalyzer {
  public analyze(context: AnalyzerContext): DimensionAssessment {
    const { nodes, edges, index, scoringPolicy } = context;
    const findings: HealthFinding[] = [];
    const assumptionsEvaluated: string[] = [];

    const evidenceCount = nodes.length + edges.length;

    // Rule 1: Direct Client / Public Exposure of Internal Database or Cache
    for (const edge of edges) {
      const srcNode = index.nodeMap.get(edge.source);
      const tgtNode = index.nodeMap.get(edge.target);

      if (srcNode && tgtNode) {
        const isClient =
          srcNode.type.includes("browser") ||
          srcNode.type.includes("mobile") ||
          srcNode.type.includes("desktop") ||
          srcNode.type.includes("client");
        const isDataStore = index.dataStoreIds.includes(tgtNode.id) || index.cacheIds.includes(tgtNode.id);

        assumptionsEvaluated.push(`Edge ${edge.id} direct client-to-data isolation check`);

        if (isClient && isDataStore) {
          findings.push({
            id: `SEC-EXPOSE-001:${edge.id}`,
            ruleId: "SEC-EXPOSE-001",
            dimension: "security",
            severity: "critical",
            title: `Direct Client Access to Internal Datastore: ${tgtNode.label || tgtNode.type}`,
            explanation: `Client "${srcNode.label || srcNode.type}" is directly connected to internal datastore "${tgtNode.label || tgtNode.type}" without an intervening application service or API Gateway. Exposes database ports directly to end users.`,
            evidence: [
              {
                kind: "edge",
                elementId: edge.id,
                description: `Direct connection from client ${srcNode.id} to storage ${tgtNode.id}.`,
              },
            ],
            affectedNodeIds: [srcNode.id, tgtNode.id],
            affectedEdgeIds: [edge.id],
            assumptions: ["Direct connection is not secured via client-side scoped BaaS tokens."],
            confidence: "high",
            recommendationIds: ["REC-SEC-001"],
            documentationId: "api-gateway",
          });
        }
      }
    }

    // Rule 2: Unencrypted Ingress Protocol (HTTP / Plaintext TCP)
    for (const edge of edges) {
      const proto = String(edge.data?.protocol || edge.data?.protocolFamily || "").toUpperCase();
      const isPlaintext = proto === "HTTP" || proto === "TCP" || proto === "TELNET" || proto === "WS";
      const srcNode = index.nodeMap.get(edge.source);

      if (srcNode && index.entryPointIds.includes(srcNode.id) && isPlaintext) {
        assumptionsEvaluated.push(`Edge ${edge.id} transport layer encryption check`);

        findings.push({
          id: `SEC-UNENC-001:${edge.id}`,
          ruleId: "SEC-UNENC-001",
          dimension: "security",
          severity: "high",
          title: `Unencrypted Transport Protocol on Ingress: ${proto}`,
          explanation: `Ingress connection uses unencrypted protocol "${proto}" instead of TLS/HTTPS. Traffic is vulnerable to interception and man-in-the-middle tampering.`,
          evidence: [
            {
              kind: "edge",
              elementId: edge.id,
              propertyKey: "protocol",
              expectedValue: "HTTPS or TLS",
              actualValue: proto,
              description: `Plaintext transport protocol on ingress boundary.`,
            },
          ],
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id],
          assumptions: ["Assumes transport is not wrapped in an unmodeled mTLS sidecar mesh."],
          confidence: "high",
          recommendationIds: ["REC-SEC-002"],
          documentationId: "https-endpoint",
        });
      }
    }

    // Rule 3: Unencrypted Datastore at Rest
    for (const dbId of index.dataStoreIds) {
      const dbNode = index.nodeMap.get(dbId);
      if (dbNode) {
        const data = dbNode.data || {};
        assumptionsEvaluated.push(`Datastore ${dbId} encryption at rest check`);

        if (data.encryptionAtRest === false || data.encrypted === false) {
          findings.push({
            id: `SEC-REST-001:${dbId}`,
            ruleId: "SEC-REST-001",
            dimension: "security",
            severity: "high",
            title: `Encryption at Rest Disabled: ${dbNode.label || dbNode.type}`,
            explanation: `Storage component "${dbNode.label || dbNode.type}" explicitly has encryption at rest disabled. Stored disk blocks are unencrypted if physical storage is compromised.`,
            evidence: [
              {
                kind: "node",
                elementId: dbId,
                propertyKey: "encryptionAtRest",
                expectedValue: true,
                actualValue: false,
                description: `Encryption at rest explicitly disabled.`,
              },
            ],
            affectedNodeIds: [dbId],
            affectedEdgeIds: [],
            assumptions: ["Assumes underlying physical disks are not hardware-level self-encrypting (SED)."],
            confidence: "high",
            recommendationIds: ["REC-SEC-003"],
            documentationId: "object-storage",
          });
        }
      }
    }

    // Rule 4: Trust Boundary Crossings without declared Authentication
    for (const crossing of index.trustCrossings) {
      const edge = index.edgeMap.get(crossing.edgeId);
      assumptionsEvaluated.push(`Trust boundary crossing edge ${crossing.edgeId} authentication check`);

      const hasAuth =
        edge?.data?.authenticated === true ||
        Boolean(edge?.data?.authMethod) ||
        Boolean(edge?.data?.tokenType) ||
        Boolean(edge?.data?.credentials);

      if (!hasAuth) {
        const src = index.nodeMap.get(crossing.sourceNodeId);
        const tgt = index.nodeMap.get(crossing.targetNodeId);

        findings.push({
          id: `SEC-TRUST-001:${crossing.edgeId}`,
          ruleId: "SEC-TRUST-001",
          dimension: "security",
          severity: "high",
          title: `Unauthenticated Trust Boundary Crossing`,
          explanation: `Connection from "${src?.label || src?.type}" into protected boundary "${crossing.targetBoundaryId}" for target "${tgt?.label || tgt?.type || crossing.targetNodeId}" has no declared authentication or token exchange mechanism.`,
          evidence: [
            {
              kind: "boundary",
              elementId: crossing.targetBoundaryId,
              description: `Traffic crosses into trust boundary without verified authentication metadata.`,
            },
          ],
          affectedNodeIds: [crossing.sourceNodeId, crossing.targetNodeId],
          affectedEdgeIds: [crossing.edgeId],
          assumptions: ["Authentication is not verified via network IP allowlists or VPC peering."],
          confidence: "medium",
          recommendationIds: ["REC-SEC-004"],
          documentationId: "trust-boundary",
        });
      }
    }

    const summary =
      findings.length === 0
        ? "Architecture enforces strong perimeter isolation, encryption, and secure boundary crossings."
        : `Identified ${findings.length} security findings including unencrypted transport or exposed internal datastores.`;

    return calculateDimensionScore(
      "security",
      findings,
      evidenceCount,
      assumptionsEvaluated,
      summary,
      scoringPolicy
    );
  }
}
