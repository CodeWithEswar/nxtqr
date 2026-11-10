import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  SecurityAnalysisReport,
  SecurityFinding,
  NodeSecurityProfile,
} from "../schemas/security.schemas";
import type { ISecurityAnalyzer, SecurityEvaluationContext } from "../contracts/security.types";
import { SecurityContextResolver } from "./security-context-resolver";
import { TrustBoundaryResolver } from "./trust-boundary-resolver";
import { AuthenticationAnalyzer } from "../analyzers/authentication-analyzer";
import { AuthorizationAnalyzer } from "../analyzers/authorization-analyzer";
import { TransportSecurityAnalyzer } from "../analyzers/transport-security-analyzer";
import { ExposureAnalyzer } from "../analyzers/exposure-analyzer";
import { SecretsAnalyzer } from "../analyzers/secrets-analyzer";
import { NetworkSegmentationAnalyzer } from "../analyzers/network-segmentation-analyzer";
import { SensitiveDataAnalyzer } from "../analyzers/sensitive-data-analyzer";
import { ApiSecurityAnalyzer } from "../analyzers/api-security-analyzer";
import { ThirdPartyAnalyzer } from "../analyzers/third-party-analyzer";

export class SecurityAnalysisEngine {
  private analyzers: ISecurityAnalyzer[] = [
    new AuthenticationAnalyzer(),
    new AuthorizationAnalyzer(),
    new TransportSecurityAnalyzer(),
    new ExposureAnalyzer(),
    new SecretsAnalyzer(),
    new NetworkSegmentationAnalyzer(),
    new SensitiveDataAnalyzer(),
    new ApiSecurityAnalyzer(),
    new ThirdPartyAnalyzer(),
  ];

  private cache: {
    revisionHash: string;
    report: SecurityAnalysisReport;
  } | null = null;

  public analyzeGraph(nodes: BaseNode[], edges: BaseEdge[]): SecurityAnalysisReport {
    const revisionHash = this.computeRevisionHash(nodes, edges);
    if (this.cache && this.cache.revisionHash === revisionHash) {
      return this.cache.report;
    }

    const nodeMap = new Map<string, BaseNode>();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    const outgoingEdgesMap = new Map<string, BaseEdge[]>();
    const incomingEdgesMap = new Map<string, BaseEdge[]>();
    for (const edge of edges) {
      if (!outgoingEdgesMap.has(edge.source)) outgoingEdgesMap.set(edge.source, []);
      outgoingEdgesMap.get(edge.source)!.push(edge);

      if (!incomingEdgesMap.has(edge.target)) incomingEdgesMap.set(edge.target, []);
      incomingEdgesMap.get(edge.target)!.push(edge);
    }

    // 1. Resolve security profiles
    const nodeProfiles = SecurityContextResolver.resolveAllProfiles(nodes, edges);

    // 2. Resolve trust boundaries and crossings
    const { boundaries, crossings } = TrustBoundaryResolver.resolveBoundariesAndCrossings(
      nodes,
      edges,
      nodeProfiles
    );

    // 3. Build context
    const context: SecurityEvaluationContext = {
      nodes,
      edges,
      nodeMap,
      outgoingEdgesMap,
      incomingEdgesMap,
      nodeProfiles,
      trustBoundaries: boundaries,
      crossings,
    };

    // 4. Run all analyzers
    const findings: SecurityFinding[] = [];
    for (const analyzer of this.analyzers) {
      try {
        const analyzerFindings = analyzer.analyze(context);
        findings.push(...analyzerFindings);
      } catch (err) {
        console.error(`Security analyzer ${analyzer.id} error:`, err);
      }
    }

    // 5. Deduplicate findings by ID
    const uniqueFindingsMap = new Map<string, SecurityFinding>();
    for (const f of findings) {
      uniqueFindingsMap.set(f.id, f);
    }
    const dedupedFindings = Array.from(uniqueFindingsMap.values());

    // Sort findings: critical -> high -> medium -> low -> info
    const severityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };
    dedupedFindings.sort(
      (a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)
    );

    // 6. Compute summary counts
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let infoCount = 0;
    let unverifiedControlsCount = 0;
    let missingConfigsCount = 0;
    let modeledConflictsCount = 0;

    for (const f of dedupedFindings) {
      if (f.severity === "critical") criticalCount++;
      else if (f.severity === "high") highCount++;
      else if (f.severity === "medium") mediumCount++;
      else if (f.severity === "low") lowCount++;
      else if (f.severity === "info") infoCount++;

      if (f.classification === "unverified-control") unverifiedControlsCount++;
      else if (f.classification === "missing-configuration") missingConfigsCount++;
      else if (f.classification === "modeled-conflict") modeledConflictsCount++;
    }

    // 7. Update boundary findings counts
    for (const b of boundaries) {
      b.findingsCount = dedupedFindings.filter(
        (f) =>
          f.affectedNodeIds.some((id) => b.containedNodeIds.includes(id)) ||
          f.affectedEdgeIds.some((id) => b.crossingEdgeIds.includes(id))
      ).length;
    }

    // Convert nodeProfiles map to record
    const nodeProfilesRecord: Record<string, NodeSecurityProfile> = {};
    for (const [id, profile] of nodeProfiles.entries()) {
      nodeProfilesRecord[id] = profile;
    }

    const report: SecurityAnalysisReport = {
      id: `sec-report-${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      revisionHash,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      findings: dedupedFindings,
      summary: {
        totalFindings: dedupedFindings.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        infoCount,
        publicExposureCount: Array.from(nodeProfiles.values()).filter((p) => p.exposure === "public")
          .length,
        trustBoundaryCrossingsCount: crossings.length,
        unverifiedControlsCount,
        missingConfigsCount,
        modeledConflictsCount,
      },
      trustBoundaries: boundaries,
      crossings,
      nodeProfiles: nodeProfilesRecord,
    };

    this.cache = { revisionHash, report };
    return report;
  }

  private computeRevisionHash(nodes: BaseNode[], edges: BaseEdge[]): string {
    const nodeKey = nodes
      .map(
        (n) =>
          `${n.id}:${n.type}:${JSON.stringify(n.data || {})}:${
            (n as { parentId?: string }).parentId || ""
          }`
      )
      .sort()
      .join("|");
    const edgeKey = edges
      .map((e) => `${e.id}:${e.source}->${e.target}:${JSON.stringify(e.data || {})}`)
      .sort()
      .join("|");
    return `${nodes.length}_${edges.length}_${this.simpleHash(nodeKey + "::" + edgeKey)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}

export const securityAnalysisEngine = new SecurityAnalysisEngine();
