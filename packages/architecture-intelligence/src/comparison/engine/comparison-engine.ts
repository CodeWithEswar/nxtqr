import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ArchitectureSnapshot,
  ArchitectureComparisonResult,
  ComparisonSummary,
  MultiEngineAnalysisBundle,
} from "../contracts/comparison.types";
import { SnapshotResolver } from "./snapshot-resolver";
import { IdentityMatcher, type IdentityMatcherOptions } from "./identity-matcher";
import { SemanticDiff, type SemanticDiffOptions } from "./semantic-diff";
import { DependencyDiff } from "./dependency-diff";
import { RegressionDetector } from "./regression-detector";
import { AnalysisComparator } from "./analysis-comparator";

export interface CompareArchitecturesOptions extends IdentityMatcherOptions, SemanticDiffOptions {
  baselineAnalyses?: MultiEngineAnalysisBundle;
  candidateAnalyses?: MultiEngineAnalysisBundle;
}

export class ComparisonEngine {
  private cache = new Map<string, ArchitectureComparisonResult>();

  public compareSnapshots(
    baseline: ArchitectureSnapshot,
    candidate: ArchitectureSnapshot,
    options: CompareArchitecturesOptions = {}
  ): ArchitectureComparisonResult {
    const cacheKey = `${baseline.revision}::${candidate.revision}::${Boolean(options.detectVisualChanges)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // 1. Identity Resolution
    const matchResolution = IdentityMatcher.match(
      baseline.nodes,
      candidate.nodes,
      baseline.edges,
      candidate.edges,
      options
    );

    // 2. Semantic Graph Diffing
    const changes = SemanticDiff.diff(
      baseline.nodes,
      candidate.nodes,
      baseline.edges,
      candidate.edges,
      matchResolution,
      options
    );

    // 3. Multi-Engine Analysis Comparison
    const analysisComparison = AnalysisComparator.compareAnalyses(
      options.baselineAnalyses || {},
      options.candidateAnalyses || {}
    );

    // 4. Regression Detection
    const regressions = RegressionDetector.detectRegressions(
      baseline.nodes,
      candidate.nodes,
      baseline.edges,
      candidate.edges,
      changes,
      analysisComparison
    );

    // 5. Dependency Analysis
    DependencyDiff.analyzeDependencies(
      baseline.nodes,
      candidate.nodes,
      baseline.edges,
      candidate.edges,
      changes
    );

    // 6. Summary Calculation
    const summary = this.buildSummary(changes, regressions, analysisComparison);

    // 7. Verify scenario compatibility
    const bScenario = baseline.workloadScenario?.id;
    const cScenario = candidate.workloadScenario?.id;
    const isCompatibleScenarios = !bScenario || !cScenario || bScenario === cScenario;

    const notes: string[] = [];
    if (!isCompatibleScenarios) {
      notes.push(
        `Comparison evaluated under differing workload scenarios: "${bScenario}" vs "${cScenario}". Capacity metrics reflect changed workload assumptions.`
      );
    }
    if (matchResolution.uncertainNodeMatches.length > 0) {
      notes.push(
        `${matchResolution.uncertainNodeMatches.length} component match(es) require manual user verification.`
      );
    }

    const result: ArchitectureComparisonResult = {
      id: `comp_${baseline.revision.slice(0, 8)}_${candidate.revision.slice(0, 8)}`,
      baselineSnapshot: baseline,
      candidateSnapshot: candidate,
      changes,
      regressions,
      analysisComparison,
      summary,
      comparedAt: new Date().toISOString(),
      isCompatibleScenarios,
      notes,
    };

    if (this.cache.size > 20) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, result);

    return result;
  }

  public compareGraphs(
    baselineNodes: BaseNode[],
    baselineEdges: BaseEdge[],
    candidateNodes: BaseNode[],
    candidateEdges: BaseEdge[],
    options: CompareArchitecturesOptions & {
      baselineTitle?: string;
      candidateTitle?: string;
    } = {}
  ): ArchitectureComparisonResult {
    const baselineSnapshot = SnapshotResolver.createSnapshot({
      title: options.baselineTitle || "Baseline Architecture",
      nodes: baselineNodes,
      edges: baselineEdges,
      provenance: "current-draft",
    });

    const candidateSnapshot = SnapshotResolver.createSnapshot({
      title: options.candidateTitle || "Candidate Architecture",
      nodes: candidateNodes,
      edges: candidateEdges,
      provenance: "what-if-proposal",
    });

    return this.compareSnapshots(baselineSnapshot, candidateSnapshot, options);
  }

  private buildSummary(
    changes: ArchitectureComparisonResult["changes"],
    regressions: ArchitectureComparisonResult["regressions"],
    analysisComparison: ArchitectureComparisonResult["analysisComparison"]
  ): ComparisonSummary {
    let addedNodesCount = 0;
    let removedNodesCount = 0;
    let modifiedNodesCount = 0;
    let unchangedNodesCount = 0;
    let addedEdgesCount = 0;
    let removedEdgesCount = 0;
    let modifiedEdgesCount = 0;
    let configurationChangesCount = 0;

    for (const c of changes) {
      if (c.entityType === "node") {
        if (c.kind === "added") addedNodesCount++;
        else if (c.kind === "removed") removedNodesCount++;
        else if (c.kind === "modified") {
          modifiedNodesCount++;
          configurationChangesCount += c.fieldDeltas.length;
        } else if (c.kind === "unchanged") unchangedNodesCount++;
      } else if (c.entityType === "edge") {
        if (c.kind === "added") addedEdgesCount++;
        else if (c.kind === "removed") removedEdgesCount++;
        else if (c.kind === "modified") {
          modifiedEdgesCount++;
          configurationChangesCount += c.fieldDeltas.length;
        }
      }
    }

    const introducedFindingsCount =
      (analysisComparison.health?.introducedFindingCount || 0) +
      (analysisComparison.bottlenecks?.newBottlenecks.length || 0) +
      (analysisComparison.security?.newSecurityRisks.length || 0);

    const resolvedFindingsCount =
      (analysisComparison.health?.resolvedFindingCount || 0) +
      (analysisComparison.bottlenecks?.resolvedBottlenecks.length || 0) +
      (analysisComparison.security?.resolvedSecurityIssues.length || 0);

    const supportedRegressionsCount = regressions.filter(
      (r) => r.classification === "supported-regression"
    ).length;

    const keyTradeoffs: string[] = [];
    if (addedNodesCount > 0 && configurationChangesCount > 0) {
      keyTradeoffs.push(
        `Added ${addedNodesCount} component(s) with ${configurationChangesCount} config updates. Enhances architecture capability but adds operational maintenance surface.`
      );
    }
    if (analysisComparison.spof && analysisComparison.spof.eliminatedSpofNodeIds.length > 0) {
      keyTradeoffs.push(
        `Eliminated ${analysisComparison.spof.eliminatedSpofNodeIds.length} Single Point(s) of Failure.`
      );
    }
    if (supportedRegressionsCount > 0) {
      keyTradeoffs.push(
        `Warning: ${supportedRegressionsCount} supported regression(s) detected. High availability or security controls require attention.`
      );
    }

    let overallAssessment: ComparisonSummary["overallAssessment"] = "neutral";
    if (supportedRegressionsCount > 0) {
      overallAssessment = "regressed";
    } else if (resolvedFindingsCount > introducedFindingsCount) {
      overallAssessment = "improved";
    } else if (introducedFindingsCount > 0 && resolvedFindingsCount > 0) {
      overallAssessment = "mixed";
    } else if (addedNodesCount > 0 || modifiedNodesCount > 0) {
      overallAssessment = "improved";
    }

    return {
      addedNodesCount,
      removedNodesCount,
      modifiedNodesCount,
      unchangedNodesCount,
      addedEdgesCount,
      removedEdgesCount,
      modifiedEdgesCount,
      configurationChangesCount,
      introducedFindingsCount,
      resolvedFindingsCount,
      regressionsCount: regressions.length,
      supportedRegressionsCount,
      keyTradeoffs,
      overallAssessment,
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const comparisonEngine = new ComparisonEngine();
