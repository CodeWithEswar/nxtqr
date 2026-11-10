import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";

export class NetworkSegmentationAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-network-segmentation-analyzer";
  public readonly category = "network-segmentation";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Rule SEC-NET-001: Flat Network Layout — Client Direct Access to Persistence
    for (const edge of context.edges) {
      const srcProfile = context.nodeProfiles.get(edge.source);
      const tgtProfile = context.nodeProfiles.get(edge.target);
      if (!srcProfile || !tgtProfile) continue;

      const isClient =
        srcProfile.componentType.includes("browser") ||
        srcProfile.componentType.includes("client") ||
        srcProfile.componentType.includes("application");

      const isDataStore =
        tgtProfile.componentType.includes("database") ||
        tgtProfile.componentType.includes("storage");

      if (isClient && isDataStore) {
        findings.push({
          id: `SEC-NET-001-${edge.id}`,
          ruleId: "SEC-NET-001",
          dimension: "security",
          category: "network-segmentation",
          severity: "critical",
          classification: "modeled-conflict",
          strideCategory: "elevation-of-privilege",
          title: `Missing Network Segmentation: Client Directly Connected to Database (${srcProfile.nodeName} → ${tgtProfile.nodeName})`,
          explanation: `Direct network routing from front-end client "${srcProfile.nodeName}" to data store "${tgtProfile.nodeName}" violates multi-tier defense-in-depth principles. Client requests should be mediated by an API Gateway or application service.`,
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id],
          evidence: [
            {
              kind: "edge",
              elementId: edge.id,
              propertyKey: "segmentationTier",
              expectedValue: "DMZ → Application Tier → Database Tier",
              actualValue: "Client → Database Direct",
              description: `Unsegmented edge bypasses intermediate application security tiers.`,
            },
          ],
          assumptions: [
            "Databases must reside in an isolated data tier accessible only to authenticated backend application workers.",
          ],
          confidence: "high",
          recommendationIds: ["REC-SEC-NET-001"],
          documentationId: "sec-network-segmentation",
          deductionWeight: 20,
        });
      }
    }

    return findings;
  }
}

