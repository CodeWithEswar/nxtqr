/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Bounded Concurrency Multi-Wave Execution Scheduler
 */

import type {
  CanonicalAnalysisContext,
  ExecutionPlan,
  AnalyzerResultEnvelope,
  AnalyzerRunRecord,
  NormalizedFinding,
} from "../contracts/orchestration.types";
import { AnalyzerRegistry } from "../registry/analyzer-registry";
import { AnalysisResultCache, analysisResultCache } from "./result-cache";

export interface SchedulerExecutionResult {
  envelopes: Map<string, AnalyzerResultEnvelope>;
  runRecords: AnalyzerRunRecord[];
  allFindings: NormalizedFinding[];
  durationMs: number;
  completedWavesCount: number;
  cancelled: boolean;
  failed: boolean;
}

export class WaveScheduler {
  /**
   * Executes an execution plan wave-by-wave with bounded concurrency and cancellation safety.
   */
  public static async execute(
    context: CanonicalAnalysisContext,
    plan: ExecutionPlan,
    registry: AnalyzerRegistry,
    cache: AnalysisResultCache = analysisResultCache,
    signal?: AbortSignal
  ): Promise<SchedulerExecutionResult> {
    const startTime = performance.now();
    const envelopes = new Map<string, AnalyzerResultEnvelope>();
    const runRecords: AnalyzerRunRecord[] = [];
    const allFindings: NormalizedFinding[] = [];

    let cancelled = false;
    let failed = false;
    let completedWavesCount = 0;

    // 1. Process pre-cached analyzers in the plan
    for (const cachedId of plan.cachedAnalyzerIds) {
      const def = registry.get(cachedId)?.definition;
      const cached = def
        ? cache.get({
            projectId: context.projectId,
            revisionHash: context.revisionHash,
            analyzerId: def.id,
            analyzerVersion: def.version,
          })
        : undefined;

      runRecords.push({
        analyzerId: cachedId,
        status: "cached",
        durationMs: 0,
        findingsCount: cached?.findings.length || 0,
        isCached: true,
      });

      if (cached) {
        envelopes.set(cachedId, cached);
        allFindings.push(...cached.findings);
        context.sharedFindings.set(cachedId, cached.findings);
      }
    }

    // 2. Execute remaining multi-wave analyzers
    for (const wave of plan.waves) {
      if (signal?.aborted || cancelled) {
        cancelled = true;
        // Mark all remaining analyzers as cancelled
        for (const id of wave.analyzerIds) {
          runRecords.push({
            analyzerId: id,
            status: "cancelled",
            durationMs: 0,
            findingsCount: 0,
            isCached: false,
            errorMessage: "Execution cancelled by caller.",
          });
        }
        continue;
      }

      if (failed && context.configuration.failFast) {
        // Skip remaining waves if failFast is triggered
        for (const id of wave.analyzerIds) {
          runRecords.push({
            analyzerId: id,
            status: "blocked",
            durationMs: 0,
            findingsCount: 0,
            isCached: false,
            errorMessage: "Execution blocked due to fail-fast policy.",
          });
        }
        continue;
      }

      // Execute analyzers in wave with bounded concurrency
      const waveResults = await this.executeWaveAnalyzers(
        wave.analyzerIds,
        context,
        registry,
        cache,
        signal
      );

      for (const res of waveResults) {
        runRecords.push(res.record);
        if (res.envelope) {
          envelopes.set(res.record.analyzerId, res.envelope);
          allFindings.push(...res.envelope.findings);
          // Update context sharedFindings progressively so downstream waves can read them
          context.sharedFindings.set(res.record.analyzerId, res.envelope.findings);
        }
        if (res.record.status === "failed") {
          failed = true;
        }
        if (res.record.status === "cancelled") {
          cancelled = true;
        }
      }

      completedWavesCount++;
    }

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));

    return {
      envelopes,
      runRecords,
      allFindings,
      durationMs,
      completedWavesCount,
      cancelled,
      failed,
    };
  }

  private static async executeWaveAnalyzers(
    analyzerIds: string[],
    context: CanonicalAnalysisContext,
    registry: AnalyzerRegistry,
    cache: AnalysisResultCache,
    signal?: AbortSignal
  ): Promise<Array<{ envelope?: AnalyzerResultEnvelope; record: AnalyzerRunRecord }>> {
    const concurrency = Math.max(1, context.configuration.maxConcurrency);
    const results: Array<{ envelope?: AnalyzerResultEnvelope; record: AnalyzerRunRecord }> = [];

    // Worker pool queue pattern
    let index = 0;
    const executeNext = async (): Promise<void> => {
      while (index < analyzerIds.length) {
        const currentIndex = index++;
        const analyzerId = analyzerIds[currentIndex];
        const res = await this.runSingleAnalyzer(analyzerId, context, registry, cache, signal);
        results.push(res);
      }
    };

    const workers: Promise<void>[] = [];
    const poolSize = Math.min(concurrency, analyzerIds.length);
    for (let i = 0; i < poolSize; i++) {
      workers.push(executeNext());
    }

    await Promise.all(workers);
    return results;
  }

  private static async runSingleAnalyzer(
    analyzerId: string,
    context: CanonicalAnalysisContext,
    registry: AnalyzerRegistry,
    cache: AnalysisResultCache,
    signal?: AbortSignal
  ): Promise<{ envelope?: AnalyzerResultEnvelope; record: AnalyzerRunRecord }> {
    const analyzer = registry.get(analyzerId);
    if (!analyzer) {
      return {
        record: {
          analyzerId,
          status: "failed",
          durationMs: 0,
          findingsCount: 0,
          isCached: false,
          errorMessage: `Analyzer '${analyzerId}' is not registered in the analyzer registry.`,
        },
      };
    }

    const cacheKey = {
      projectId: context.projectId,
      revisionHash: context.revisionHash,
      analyzerId: analyzer.definition.id,
      analyzerVersion: analyzer.definition.version,
    };

    // 1. Cache hit check
    if (context.configuration.enableCache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return {
          envelope: cached,
          record: {
            analyzerId,
            status: "cached",
            durationMs: 0,
            findingsCount: cached.findings.length,
            isCached: true,
          },
        };
      }
    }

    // 2. Cancellation check
    if (signal?.aborted) {
      return {
        record: {
          analyzerId,
          status: "cancelled",
          durationMs: 0,
          findingsCount: 0,
          isCached: false,
          errorMessage: "Execution cancelled before analyzer run.",
        },
      };
    }

    const start = performance.now();
    const timeoutMs = analyzer.definition.timeoutMs || 10000;

    try {
      // Race execution with timeout
      let timeoutHandle: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Analyzer '${analyzerId}' timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      });

      const analysisPromise = analyzer.analyze(context, signal);
      const envelope = await Promise.race([analysisPromise, timeoutPromise]);
      clearTimeout(timeoutHandle);

      const durationMs = Math.max(1, Math.round(performance.now() - start));

      // Cache the result
      if (context.configuration.enableCache && envelope.status === "completed") {
        cache.set(cacheKey, envelope);
      }

      return {
        envelope,
        record: {
          analyzerId,
          status: "completed",
          startedAt: envelope.executedAt,
          completedAt: new Date().toISOString(),
          durationMs,
          findingsCount: envelope.findings.length,
          isCached: false,
        },
      };
    } catch (err: any) {
      const durationMs = Math.max(1, Math.round(performance.now() - start));
      const isAbort = signal?.aborted || err.name === "AbortError";
      return {
        record: {
          analyzerId,
          status: isAbort ? "cancelled" : "failed",
          durationMs,
          findingsCount: 0,
          isCached: false,
          errorMessage: err.message || String(err),
        },
      };
    }
  }
}
