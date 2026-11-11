/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Master Architecture Orchestration Engine
 */

import type {
  CanonicalAnalysisContext,
  UnifiedArchitectureAssessment,
  AssessmentCompleteness,
  ExecutionPlan,
} from "../contracts/orchestration.types";
import { AnalyzerRegistry, analyzerRegistry } from "../registry/analyzer-registry";
import { STANDARD_ANALYZERS } from "../registry/standard-analyzers";
import { ExecutionPlanner } from "../planner/execution-planner";
import { InvalidationPlanner, type ChangeDelta, type InvalidationResult } from "../planner/invalidation-planner";
import { WaveScheduler } from "../execution/scheduler";
import { AnalysisContextBuilder, type BuildContextOptions } from "../execution/context-builder";
import { AnalysisResultCache, analysisResultCache } from "../execution/result-cache";
import { FindingCorrelator } from "../correlation/finding-correlator";
import { ContradictionDetector } from "../correlation/contradiction-detector";

export class ArchitectureOrchestrationEngine {
  private registry: AnalyzerRegistry;
  private cache: AnalysisResultCache;

  constructor(
    registry: AnalyzerRegistry = analyzerRegistry,
    cache: AnalysisResultCache = analysisResultCache
  ) {
    this.registry = registry;
    this.cache = cache;

    // Ensure standard analyzers are registered
    for (const analyzer of STANDARD_ANALYZERS) {
      if (!this.registry.has(analyzer.definition.id)) {
        this.registry.register(analyzer);
      }
    }
  }

  public getRegistry(): AnalyzerRegistry {
    return this.registry;
  }

  public getCache(): AnalysisResultCache {
    return this.cache;
  }

  /**
   * Plans the execution of requested analyzers against the dependency graph.
   */
  public planAnalysis(
    revisionId: string,
    requestedAnalyzerIds?: string[],
    cachedAnalyzerIds?: string[]
  ): ExecutionPlan {
    const definitions = this.registry.getAllDefinitions();
    return ExecutionPlanner.createPlan({
      revisionId,
      requestedAnalyzerIds,
      cachedAnalyzerIds,
      definitions,
    });
  }

  /**
   * Plans dependency-aware cache invalidation for architectural mutations.
   */
  public planInvalidation(delta: ChangeDelta): InvalidationResult {
    const planner = new InvalidationPlanner(this.registry.getAllDefinitions());
    return planner.planInvalidation(delta);
  }

  /**
   * Master entry point: Orchestrates unified architecture intelligence analysis.
   */
  public async orchestrateAnalysis(
    contextInput: CanonicalAnalysisContext | BuildContextOptions,
    requestedAnalyzerIds?: string[],
    signal?: AbortSignal
  ): Promise<UnifiedArchitectureAssessment> {
    const context: CanonicalAnalysisContext =
      "graphIndex" in contextInput
        ? contextInput
        : AnalysisContextBuilder.build(contextInput);

    // 1. Identify currently cached analyzers for this revision
    const definitions = this.registry.getAllDefinitions();
    const cachedAnalyzerIds: string[] = [];

    if (context.configuration.enableCache) {
      for (const def of definitions) {
        if (
          this.cache.has({
            projectId: context.projectId,
            revisionHash: context.revisionHash,
            analyzerId: def.id,
            analyzerVersion: def.version,
          })
        ) {
          cachedAnalyzerIds.push(def.id);
        }
      }
    }

    // 2. Generate multi-wave execution plan
    const plan = ExecutionPlanner.createPlan({
      revisionId: context.revisionId,
      requestedAnalyzerIds,
      cachedAnalyzerIds,
      definitions,
    });

    // 3. Execute plan wave-by-wave
    const schedulerResult = await WaveScheduler.execute(
      context,
      plan,
      this.registry,
      this.cache,
      signal
    );

    // 4. Correlate findings, deduplicate, cluster, and derive recommendations
    const correlationResult = FindingCorrelator.correlate(
      schedulerResult.allFindings,
      context.nodes
    );

    // 5. Detect contradictions across analyzer outputs
    const contradictions = ContradictionDetector.detectContradictions(
      correlationResult.deduplicatedFindings,
      context
    );

    // 6. Compute counts and completeness status
    let completedCount = 0;
    let failedCount = 0;
    let blockedCount = 0;
    let cachedCount = 0;

    for (const record of schedulerResult.runRecords) {
      if (record.status === "completed") completedCount++;
      else if (record.status === "cached") cachedCount++;
      else if (record.status === "failed") failedCount++;
      else if (record.status === "blocked") blockedCount++;
    }

    let completenessStatus: AssessmentCompleteness = "completed";
    if (schedulerResult.cancelled) {
      completenessStatus = "cancelled";
    } else if (failedCount > 0) {
      completenessStatus = completedCount > 0 ? "partial" : "failed";
    }

    const criticalCount = correlationResult.deduplicatedFindings.filter(
      (f) => f.severity === "critical"
    ).length;
    const highCount = correlationResult.deduplicatedFindings.filter(
      (f) => f.severity === "high"
    ).length;
    const mediumCount = correlationResult.deduplicatedFindings.filter(
      (f) => f.severity === "medium"
    ).length;
    const lowCount = correlationResult.deduplicatedFindings.filter(
      (f) => f.severity === "low" || f.severity === "informational"
    ).length;

    // Health score: 100 base, deducted by finding severities
    const rawScore = 100 - criticalCount * 25 - highCount * 12 - mediumCount * 5 - lowCount * 1;
    const healthScore = Math.max(0, Math.min(100, rawScore));

    return {
      id: `assess-${context.revisionId}-${Date.now()}`,
      architectureRevisionId: context.revisionId,
      completenessStatus,
      analyzersRun: schedulerResult.runRecords.length,
      analyzersCompleted: completedCount,
      analyzersFailed: failedCount,
      analyzersBlocked: blockedCount,
      analyzersCached: cachedCount,
      executionDurationMs: schedulerResult.durationMs,
      analyzerRuns: schedulerResult.runRecords,
      totalFindingsCount: correlationResult.deduplicatedFindings.length,
      criticalFindingsCount: criticalCount,
      highFindingsCount: highCount,
      mediumFindingsCount: mediumCount,
      lowFindingsCount: lowCount,
      findings: correlationResult.deduplicatedFindings,
      correlationGroups: correlationResult.correlationGroups,
      contradictions,
      recommendations: correlationResult.unifiedRecommendations,
      healthScore,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const architectureOrchestrationEngine = new ArchitectureOrchestrationEngine();
