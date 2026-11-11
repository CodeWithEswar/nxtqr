/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Multi-Discipline Finding Correlator & Unified Recommendation Generator
 */

import type {
  NormalizedFinding,
  CorrelationGroup,
  OrchestratedRecommendation,
  FindingSeverity,
} from "../contracts/orchestration.types";
import type { BaseNode } from "@nxtqr/graph-schema";

export interface CorrelatorResult {
  deduplicatedFindings: NormalizedFinding[];
  correlationGroups: CorrelationGroup[];
  unifiedRecommendations: OrchestratedRecommendation[];
}

export class FindingCorrelator {
  /**
   * Correlates findings across different analyzer domains, deduplicates by fingerprint,
   * clusters by shared architectural components, and generates unified recommendations.
   */
  public static correlate(
    findings: NormalizedFinding[],
    nodes: BaseNode[] = []
  ): CorrelatorResult {
    const nodeNameMap = new Map<string, string>();
    for (const node of nodes) {
      nodeNameMap.set(node.id, (node.data as any)?.label || (node.data as any)?.name || node.id);
    }

    // 1. Deduplicate findings with identical fingerprints
    const fingerprintMap = new Map<string, NormalizedFinding>();
    for (const finding of findings) {
      const existing = fingerprintMap.get(finding.fingerprint);
      if (!existing) {
        fingerprintMap.set(finding.fingerprint, { ...finding });
      } else {
        // Merge evidence and choose higher severity
        const mergedEvidence = Array.from(
          new Set([...existing.evidenceIds, ...finding.evidenceIds])
        );
        const higherSeverity = this.pickHigherSeverity(existing.severity, finding.severity);
        fingerprintMap.set(finding.fingerprint, {
          ...existing,
          severity: higherSeverity,
          evidenceIds: mergedEvidence,
        });
      }
    }
    const deduplicatedFindings = Array.from(fingerprintMap.values());

    // 2. Cluster findings by shared affectedComponentIds
    const componentClusters = new Map<string, NormalizedFinding[]>();
    for (const finding of deduplicatedFindings) {
      for (const componentId of finding.affectedComponentIds) {
        if (!componentClusters.has(componentId)) {
          componentClusters.set(componentId, []);
        }
        componentClusters.get(componentId)!.push(finding);
      }
    }

    const correlationGroups: CorrelationGroup[] = [];
    const groupedFindingIds = new Set<string>();

    for (const [componentId, clusterFindings] of componentClusters.entries()) {
      // If there are multiple findings from different analyzers targeting the same component
      const distinctAnalyzers = new Set(clusterFindings.map((f) => f.sourceAnalyzerId));
      if (clusterFindings.length >= 2 || distinctAnalyzers.size >= 2) {
        const componentName = nodeNameMap.get(componentId) || componentId;
        const analyzerList = Array.from(distinctAnalyzers).join(", ");
        const groupId = `cg-${componentId}`;

        for (const f of clusterFindings) {
          groupedFindingIds.add(f.id);
        }

        correlationGroups.push({
          id: groupId,
          title: `Compound Architectural Vulnerabilities on ${componentName}`,
          primaryCategory: "multi-discipline-risk",
          sharedComponentIds: [componentId],
          findingIds: clusterFindings.map((f) => f.id),
          findingsCount: clusterFindings.length,
          findings: clusterFindings,
          candidateRootCause: `Component '${componentName}' presents multiple architectural risks detected across [${analyzerList}]. It serves as a shared bottleneck or single point of failure.`,
          recommendedUnifiedAction: `Perform holistic hardening on '${componentName}': introduce redundant replicas, apply security boundaries, and verify failover runbooks.`,
        });
      }
    }

    // 3. Generate Unified Recommendations
    const unifiedRecommendations: OrchestratedRecommendation[] = [];
    let recIdx = 1;

    // First: Recommendations from Correlation Groups
    for (const group of correlationGroups) {
      const topSeverity = group.findings.reduce<FindingSeverity>(
        (acc, f) => this.pickHigherSeverity(acc, f.severity),
        "informational"
      );

      const steps: string[] = [
        `Review and address specific findings on ${group.sharedComponentIds.join(", ")}:`,
        ...group.findings.map((f) => `• [${f.sourceAnalyzerId}] ${f.title}`),
        `Verify architectural failover and disaster recovery capabilities under peak load.`,
      ];

      unifiedRecommendations.push({
        id: `rec-group-${recIdx++}`,
        title: `Consolidated Remediation: ${group.title}`,
        category: "architecture-hardening",
        severity: topSeverity,
        description: group.candidateRootCause,
        affectedComponentIds: group.sharedComponentIds,
        correlatedFindingIds: group.findingIds,
        remediationSteps: steps,
        effort: topSeverity === "critical" ? "high" : "medium",
      });
    }

    // Second: Recommendations for critical/high standalone findings not in a group
    for (const finding of deduplicatedFindings) {
      if (
        !groupedFindingIds.has(finding.id) &&
        (finding.severity === "critical" || finding.severity === "high")
      ) {
        unifiedRecommendations.push({
          id: `rec-standalone-${recIdx++}`,
          title: `Remediate: ${finding.title}`,
          category: finding.category,
          severity: finding.severity,
          description: finding.description,
          affectedComponentIds: finding.affectedComponentIds,
          correlatedFindingIds: [finding.id],
          remediationSteps: [
            finding.remediationRecommendation ||
              `Address the issue identified by ${finding.sourceAnalyzerId} on target components: ${finding.affectedComponentIds.join(
                ", "
              )}`,
          ],
          effort: finding.severity === "critical" ? "medium" : "low",
        });
      }
    }

    return {
      deduplicatedFindings,
      correlationGroups,
      unifiedRecommendations,
    };
  }

  private static pickHigherSeverity(a: FindingSeverity, b: FindingSeverity): FindingSeverity {
    const rank: Record<FindingSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      informational: 0,
    };
    return (rank[a] ?? 0) >= (rank[b] ?? 0) ? a : b;
  }
}
