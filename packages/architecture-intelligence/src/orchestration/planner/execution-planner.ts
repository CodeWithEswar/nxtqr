/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Execution Plan Generator & Wave Scheduler
 */

import type {
  ExecutionPlan,
  ExecutionWave,
  AnalyzerDefinition,
} from "../contracts/orchestration.types";
import { AnalyzerDependencyGraph } from "./dependency-graph";

export interface PlanGenerationOptions {
  revisionId: string;
  requestedAnalyzerIds?: string[];
  cachedAnalyzerIds?: string[];
  definitions: AnalyzerDefinition[];
}

export class ExecutionPlanner {
  /**
   * Generates a deterministic multi-wave execution plan for requested analyzers.
   */
  public static createPlan(options: PlanGenerationOptions): ExecutionPlan {
    const { revisionId, definitions } = options;
    const depGraph = new AnalyzerDependencyGraph(definitions);

    // 1. Detect any cycle upfront
    const cycleResult = depGraph.detectCycles();
    if (cycleResult.hasCycles) {
      throw new Error(
        `Dependency cycle detected in analyzer configuration: ${cycleResult.cyclePath?.join(" -> ")}`
      );
    }

    // 2. Resolve target analyzer set
    const allRegisteredIds = definitions.map((d) => d.id);
    const requested =
      options.requestedAnalyzerIds && options.requestedAnalyzerIds.length > 0
        ? options.requestedAnalyzerIds
        : allRegisteredIds;

    // Verify all requested analyzers exist
    for (const reqId of requested) {
      if (!depGraph.getDefinition(reqId)) {
        throw new Error(`Requested analyzer '${reqId}' is not registered in the analyzer catalog.`);
      }
    }

    // Transitively resolve all required upstream analyzers
    const transitiveSet = depGraph.resolveTransitiveDependencies(requested);
    const resolvedOrder = depGraph.getTopologicalOrder(Array.from(transitiveSet));

    // 3. Compute execution waves
    const cachedSet = new Set(options.cachedAnalyzerIds || []);
    const completedSet = new Set<string>(cachedSet);
    const remainingSet = new Set<string>(
      resolvedOrder.filter((id) => !cachedSet.has(id))
    );

    const waves: ExecutionWave[] = [];
    let waveIndex = 0;

    while (remainingSet.size > 0) {
      const currentWaveAnalyzers: string[] = [];

      for (const analyzerId of remainingSet) {
        const deps = depGraph.getDirectDependencies(analyzerId);
        // An analyzer is ready if all its dependencies within the resolved plan are already completed/cached
        const dependenciesMet = deps.every(
          (dep) => !transitiveSet.has(dep) || completedSet.has(dep)
        );

        if (dependenciesMet) {
          currentWaveAnalyzers.push(analyzerId);
        }
      }

      if (currentWaveAnalyzers.length === 0) {
        throw new Error(
          `Wave planning deadlock detected. Remaining unresolved analyzers: ${Array.from(
            remainingSet
          ).join(", ")}`
        );
      }

      // Sort stably for deterministic scheduling
      currentWaveAnalyzers.sort();

      waves.push({
        waveIndex,
        analyzerIds: currentWaveAnalyzers,
      });

      for (const id of currentWaveAnalyzers) {
        remainingSet.delete(id);
        completedSet.add(id);
      }

      waveIndex++;
    }

    return {
      id: `plan-${revisionId}-${Date.now()}`,
      architectureRevisionId: revisionId,
      requestedAnalyzerIds: requested,
      resolvedExecutionOrder: resolvedOrder,
      waves,
      cachedAnalyzerIds: Array.from(cachedSet).filter((id) => transitiveSet.has(id)).sort(),
      totalEstimatedAnalyzers: resolvedOrder.length,
      createdAt: new Date().toISOString(),
    };
  }
}
