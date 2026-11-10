import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import type { SecurityFinding } from "../schemas/security.schemas";
import { ExposureResolver } from "../engine/exposure-resolver";

export class ExposureAnalyzer implements ISecurityAnalyzer {
  public readonly id = "security-exposure-analyzer";
  public readonly category = "public-exposure";

  public analyze(context: SecurityEvaluationContext): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const exposureResult = ExposureResolver.analyzeExposure(
      context.nodes,
      context.edges,
      context.nodeProfiles
    );

    // Rule SEC-EXP-001: Data Persistence Directly Accessible from Public Clients
    for (const nodeId of exposureResult.exposedDatabaseNodeIds) {
      const profile = context.nodeProfiles.get(nodeId);
      if (!profile) continue;

      const inEdges = context.incomingEdgesMap.get(nodeId) || [];
      findings.push({
        id: `SEC-EXP-001-${nodeId}`,
        ruleId: "SEC-EXP-001",
        dimension: "security",
        category: "public-exposure",
        severity: "critical",
        classification: "modeled-conflict",
        strideCategory: "information-disclosure",
        title: `Direct Public Ingress to Data Persistence Layer (${profile.nodeName})`,
        explanation: `Database or storage component "${profile.nodeName}" is configured with public exposure or has direct connections from untrusted client components. Databases should reside in private networks behind mediating application services.`,
        affectedNodeIds: [nodeId],
        affectedEdgeIds: inEdges.map((e) => e.id),
        evidence: [
          {
            kind: "node",
            elementId: nodeId,
            propertyKey: "exposure",
            expectedValue: "private",
            actualValue: profile.exposure,
            description: `Database node is publicly exposed or receives direct traffic from client tiers.`,
          },
        ],
        assumptions: [
          "Databases must never accept direct connections from public clients or internet-facing networks.",
        ],
        confidence: "high",
        recommendationIds: ["REC-SEC-EXP-001"],
        documentationId: "sec-database-isolation",
        deductionWeight: 25,
      });
    }

    // Rule SEC-EXP-002: Public Administrative / Control Interface
    for (const nodeId of exposureResult.exposedAdminNodeIds) {
      const profile = context.nodeProfiles.get(nodeId);
      if (!profile) continue;

      findings.push({
        id: `SEC-EXP-002-${nodeId}`,
        ruleId: "SEC-EXP-002",
        dimension: "security",
        category: "public-exposure",
        severity: "high",
        classification: "potential-risk",
        strideCategory: "elevation-of-privilege",
        title: `Administrative Interface Exposed to Public Ingress (${profile.nodeName})`,
        explanation: `Privileged administrative interface "${profile.nodeName}" is accessible from the public internet without private network segmentation or dedicated perimeter bastion controls.`,
        affectedNodeIds: [nodeId],
        affectedEdgeIds: (context.incomingEdgesMap.get(nodeId) || []).map((e) => e.id),
        evidence: [
          {
            kind: "node",
            elementId: nodeId,
            propertyKey: "isAdministrative",
            expectedValue: "private network containment",
            actualValue: "public access",
            description: `Administrative interface is not restricted to internal private network.`,
          },
        ],
        assumptions: [
          "Management consoles must be restricted to internal corporate subnets or protected VPNs.",
        ],
        confidence: "high",
        recommendationIds: ["REC-SEC-EXP-002"],
        documentationId: "sec-admin-isolation",
        deductionWeight: 15,
      });
    }

    return findings;
  }
}

