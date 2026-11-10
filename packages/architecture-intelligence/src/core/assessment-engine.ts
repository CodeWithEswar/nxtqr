import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { architectureValidationEngine, type GraphValidationResult } from "@nxtqr/architecture-validation";
import type {
  HealthAssessmentReport,
  HealthDimension,
  DimensionAssessment,
  ScoringPolicy,
} from "../contracts/health.types";
import { DEFAULT_SCORING_POLICY } from "../scoring/scoring-policy";
import { calculateOverallAssessment } from "../scoring/score-calculator";
import { GraphIndex } from "./graph-index";
import { FindingAggregator } from "./finding-aggregator";
import { ReliabilityAnalyzer } from "../analyzers/reliability";
import { ScalabilityAnalyzer } from "../analyzers/scalability";
import { SecurityAnalyzer } from "../analyzers/security";
import { PerformanceAnalyzer } from "../analyzers/performance";
import { MaintainabilityAnalyzer } from "../analyzers/maintainability";
import { OperationsAnalyzer } from "../analyzers/operations";

export class ArchitectureHealthEngine {
  public static readonly RULESET_VERSION = "1.0.0";
  public static readonly SCORING_POLICY_VERSION = "1.0.0";

  private readonly reliabilityAnalyzer = new ReliabilityAnalyzer();
  private readonly scalabilityAnalyzer = new ScalabilityAnalyzer();
  private readonly securityAnalyzer = new SecurityAnalyzer();
  private readonly performanceAnalyzer = new PerformanceAnalyzer();
  private readonly maintainabilityAnalyzer = new MaintainabilityAnalyzer();
  private readonly operationsAnalyzer = new OperationsAnalyzer();

  // LRU / Revision cache
  private cachedRevision: string | null = null;
  private cachedReport: HealthAssessmentReport | null = null;

  /**
   * Generates a deterministic hash representing the structural & semantic state of the graph
   */
  public computeGraphRevision(nodes: BaseNode[], edges: BaseEdge[]): string {
    const nodeKeys = nodes
      .map((n) => `${n.id}:${n.type}:${JSON.stringify(n.data || {})}`)
      .sort()
      .join("|");
    const edgeKeys = edges
      .map((e) => `${e.id}:${e.source}->${e.target}:${JSON.stringify(e.data || {})}`)
      .sort()
      .join("|");
    
    // Quick string hash
    let hash = 0;
    const combined = `${nodeKeys}#${edgeKeys}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return `rev_${Math.abs(hash).toString(36)}_${nodes.length}n_${edges.length}e`;
  }

  /**
   * Main assessment execution entry point
   */
  public assessGraph(
    nodes: BaseNode[],
    edges: BaseEdge[],
    policy: ScoringPolicy = DEFAULT_SCORING_POLICY,
    userAssumptions?: Record<string, unknown>
  ): HealthAssessmentReport {
    const startTime = Date.now();
    const revision = this.computeGraphRevision(nodes, edges);

    if (this.cachedRevision === revision && this.cachedReport) {
      return this.cachedReport;
    }

    // Step 1: Run graph validation from Phase 05.3.1
    let validationResult: GraphValidationResult;
    try {
      validationResult = architectureValidationEngine.validateGraph(nodes, edges);
    } catch {
      validationResult = {
        valid: false,
        findings: [],
        findingsByNode: {},
        findingsByEdge: {},
        validatedAt: Date.now(),
        summary: {
          errors: 0,
          warnings: 0,
          info: 0,
          totalFindings: 0,
          componentCount: nodes.length,
          connectionCount: edges.length,
          byCategory: {
            component: 0,
            connection: 0,
            relationship: 0,
            structural: 0,
            dependency: 0,
            integrity: 0,
          },
          isValid: true,
        },
      };
    }

    // Step 2: Build Graph Index & Precompute graph properties
    const index = new GraphIndex(nodes, edges);

    // Step 3: Execute all six analyzers
    const context = {
      graphRevision: revision,
      nodes,
      edges,
      validationResult,
      index,
      scoringPolicy: policy,
      userAssumptions,
    };

    const relAssessment = this.reliabilityAnalyzer.analyze(context);
    const scaleAssessment = this.scalabilityAnalyzer.analyze(context);
    const secAssessment = this.securityAnalyzer.analyze(context);
    const perfAssessment = this.performanceAnalyzer.analyze(context);
    const maintAssessment = this.maintainabilityAnalyzer.analyze(context);
    const opsAssessment = this.operationsAnalyzer.analyze(context);

    const dimensions: Record<HealthDimension, DimensionAssessment> = {
      reliability: relAssessment,
      scalability: scaleAssessment,
      security: secAssessment,
      performance: perfAssessment,
      maintainability: maintAssessment,
      operations: opsAssessment,
    };

    // Step 4: Aggregate findings deterministically
    const aggregator = new FindingAggregator();
    for (const d of Object.values(dimensions)) {
      aggregator.addMany(d.findings);
    }

    const allFindings = aggregator.getSortedFindings();
    const findingsByNode = aggregator.getFindingsByNode();
    const findingsByEdge = aggregator.getFindingsByEdge();

    // Step 5: Calculate overall score
    const overall = calculateOverallAssessment(dimensions, policy);

    const duration = Math.max(1, Date.now() - startTime);

    const report: HealthAssessmentReport = {
      id: `health_report_${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      graphRevision: revision,
      rulesetVersion: ArchitectureHealthEngine.RULESET_VERSION,
      scoringPolicyVersion: ArchitectureHealthEngine.SCORING_POLICY_VERSION,
      overallScore: overall.overallScore,
      overallGrade: overall.overallGrade,
      status: overall.status,
      dimensions,
      allFindings,
      findingsByNode,
      findingsByEdge,
      metrics: {
        totalComponents: nodes.length,
        totalConnections: edges.length,
        totalBoundaries: index.boundaries.length,
        criticalPathsCount: index.criticalPaths.length,
        cyclesDetectedCount: index.sccResult.cycles.length,
        articulationPointsCount: index.articulationResult.articulationPoints.size,
        executionTimeMs: duration,
      },
      validationPassed: validationResult.valid,
      validationErrorsCount: validationResult.summary.errors,
    };

    this.cachedRevision = revision;
    this.cachedReport = report;

    return report;
  }

  public reset(): void {
    this.cachedRevision = null;
    this.cachedReport = null;
  }
}

export const architectureHealthEngine = new ArchitectureHealthEngine();
