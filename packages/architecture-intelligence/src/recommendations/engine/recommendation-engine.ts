import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  UnifiedRecommendationReport,
  UnifiedRecommendation,
  MultiEngineAnalysisInputs,
  RecommendationSummary,
  RecommendationPriority,
  RecommendationFeasibility,
  RecommendationLifecycle,
} from "../contracts/recommendations.types";
import { FindingNormalizer } from "../correlation/finding-normalizer";
import { CorrelationEngine } from "../correlation/correlation-engine";
import { strategyRegistry } from "../strategies/strategy-registry";
import { FeasibilityEvaluator } from "../evaluation/feasibility-evaluator";
import { ConflictDetector } from "../evaluation/conflict-detector";
import { RankingEngine } from "../evaluation/ranking-engine";
import { ImprovementPlanner } from "../planner/improvement-planner";

import type { GraphOperation } from "../../scalability/schemas/scalability.schemas";

export interface RecommendationEngineOptions {
  includeNotApplicable?: boolean;
  minScoreThreshold?: number;
  lifecycleOverrides?: Map<string, RecommendationLifecycle> | Record<string, RecommendationLifecycle>;
}

export class RecommendationEngine {
  private cache: Map<string, UnifiedRecommendationReport> = new Map();
  private allRecommendationsHistory: Map<string, UnifiedRecommendation> = new Map();

  public generateRecommendations(
    nodes: BaseNode[],
    edges: BaseEdge[],
    inputs: MultiEngineAnalysisInputs,
    options: RecommendationEngineOptions = {}
  ): UnifiedRecommendationReport {
    const revision = this.computeRevision(nodes, edges, inputs);

    if (this.cache.has(revision) && !options.lifecycleOverrides) {
      return this.cache.get(revision)!;
    }

    // 1. Normalize all incoming multi-engine findings
    const { findings, findingsByEngine } = FindingNormalizer.normalizeAll(inputs);

    // 2. Correlate related findings into coherent problem groups with evidence-backed root cause
    const correlatedGroups = CorrelationEngine.correlateFindings(findings, nodes, edges);

    // 3. Resolve candidate recommendations across groups using declarative strategy registry
    const rawRecommendations: UnifiedRecommendation[] = [];
    for (const group of correlatedGroups) {
      const recs = strategyRegistry.evaluateGroup(group, nodes, edges, findings);
      rawRecommendations.push(...recs);
    }

    // 4. Deduplicate recommendations by (strategyId + primaryTarget)
    const dedupedMap = new Map<string, UnifiedRecommendation>();
    for (const rec of rawRecommendations) {
      if (!dedupedMap.has(rec.id)) {
        dedupedMap.set(rec.id, rec);
      } else {
        // Merge evidence and source findings
        const existing = dedupedMap.get(rec.id)!;
        existing.sourceFindingIds = Array.from(
          new Set([...existing.sourceFindingIds, ...rec.sourceFindingIds])
        );
        existing.sourceEngines = Array.from(
          new Set([...existing.sourceEngines, ...rec.sourceEngines])
        );
        existing.evidence = [...existing.evidence, ...rec.evidence];
      }
    }

    // 5. Evaluate feasibility against component capabilities and current architecture
    const evaluated: UnifiedRecommendation[] = [];
    for (const rec of dedupedMap.values()) {
      const feasibilityResult = FeasibilityEvaluator.evaluateFeasibility(rec, nodes, edges);
      rec.feasibility = feasibilityResult.feasibility;
      if (feasibilityResult.feasibilityReason) {
        rec.feasibilityReason = feasibilityResult.feasibilityReason;
      }

      if (!options.includeNotApplicable && rec.feasibility === "not-applicable") {
        continue;
      }

      // 1. Resolve explicit lifecycle overrides if provided
      let explicitOverride: RecommendationLifecycle | undefined;
      if (options.lifecycleOverrides) {
        if (options.lifecycleOverrides instanceof Map) {
          explicitOverride = options.lifecycleOverrides.get(rec.id);
        } else {
          explicitOverride = (options.lifecycleOverrides as Record<string, RecommendationLifecycle>)[rec.id];
        }
      }

      if (explicitOverride) {
        rec.lifecycleState = explicitOverride;
      } else if (this.areProposedOperationsSatisfied(rec.proposedOperations, nodes, edges)) {
        // 2. Deterministically detect if proposed changes have already been applied to the graph
        rec.lifecycleState = "applied";
      }

      evaluated.push(rec);
    }

    // Remember all evaluated recommendations across historical runs
    for (const rec of evaluated) {
      this.allRecommendationsHistory.set(rec.id, rec);
    }

    // Preserve previously applied recommendations whose underlying findings are now resolved
    if (options.lifecycleOverrides) {
      const overridesEntries = options.lifecycleOverrides instanceof Map
        ? Array.from(options.lifecycleOverrides.entries())
        : Object.entries(options.lifecycleOverrides);

      for (const [recId, state] of overridesEntries) {
        if (state === "applied" && !evaluated.some((r) => r.id === recId)) {
          const historicalRec = this.allRecommendationsHistory.get(recId);
          if (historicalRec) {
            evaluated.push({
              ...historicalRec,
              lifecycleState: "applied",
            });
          }
        }
      }
    }

    // 6. Detect conflicting recommendations
    const conflicts = ConflictDetector.detectConflicts(evaluated, nodes);

    // Update rec.conflictsWith references
    for (const conflict of conflicts) {
      const recA = evaluated.find((r) => r.id === conflict.recommendationAId);
      const recB = evaluated.find((r) => r.id === conflict.recommendationBId);
      if (recA && !recA.conflictsWith.includes(conflict.recommendationBId)) {
        recA.conflictsWith.push(conflict.recommendationBId);
      }
      if (recB && !recB.conflictsWith.includes(conflict.recommendationAId)) {
        recB.conflictsWith.push(conflict.recommendationAId);
      }
    }

    // 7. Deterministic prioritization and ranking
    const ranked = RankingEngine.rankRecommendations(evaluated);
    const filtered = options.minScoreThreshold
      ? ranked.filter((r) => r.score >= options.minScoreThreshold!)
      : ranked;

    // 8. Build Dependency-Aware Improvement Plan
    const plan = ImprovementPlanner.createPlan(filtered, conflicts);

    // 9. Build Summary Metrics
    const byPriority: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    const byFeasibility: Record<RecommendationFeasibility, number> = {
      applicable: 0,
      conditional: 0,
      "not-applicable": 0,
      "insufficient-evidence": 0,
    };
    const byLifecycle: Record<RecommendationLifecycle, number> = {
      new: 0,
      reviewed: 0,
      planned: 0,
      applied: 0,
      dismissed: 0,
      superseded: 0,
    };

    for (const rec of filtered) {
      byPriority[rec.priority] = (byPriority[rec.priority] || 0) + 1;
      byFeasibility[rec.feasibility] = (byFeasibility[rec.feasibility] || 0) + 1;
      byLifecycle[rec.lifecycleState] = (byLifecycle[rec.lifecycleState] || 0) + 1;
    }

    const summary: RecommendationSummary = {
      totalRecommendations: filtered.length,
      byPriority,
      byFeasibility,
      byLifecycle,
      conflictsDetected: conflicts.length,
      topPriorityId: filtered[0]?.id,
    };

    const report: UnifiedRecommendationReport = {
      revision,
      timestamp: new Date().toISOString(),
      totalFindingsAnalyzed: findings.length,
      findingsByEngine,
      correlatedGroups,
      recommendations: filtered,
      conflicts,
      plan,
      summary,
    };

    this.cache.set(revision, report);
    return report;
  }

  public computeRevision(
    nodes: BaseNode[],
    edges: BaseEdge[],
    inputs: MultiEngineAnalysisInputs
  ): string {
    const nodeSig = nodes.map((n) => `${n.id}:${n.data?.componentType || n.type}`).sort().join("|");
    const edgeSig = edges.map((e) => `${e.source}->${e.target}`).sort().join("|");
    const counts = [
      inputs.validation?.findings?.length || 0,
      inputs.healthFindings?.length || 0,
      inputs.bottleneckFindings?.length || 0,
      inputs.failureFindings?.length || 0,
      inputs.securityFindings?.length || 0,
      inputs.scalabilityRecommendations?.length || 0,
      inputs.reliabilityFindings?.length || 0,
    ].join("_");

    return `rec_${nodes.length}_${edges.length}_${counts}_${hashString(`${nodeSig}::${edgeSig}`)}`;
  }

  public areProposedOperationsSatisfied(
    operations: GraphOperation[] | undefined,
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): boolean {
    if (!operations || operations.length === 0) return false;

    for (const op of operations) {
      switch (op.type) {
        case "update_node_config": {
          const node = nodes.find((n) => n.id === op.nodeId);
          if (!node) return false;
          const data = (node.data || {}) as Record<string, unknown>;
          for (const [k, v] of Object.entries(op.configUpdates)) {
            if (data[k] !== v) return false;
          }
          break;
        }
        case "adjust_instances": {
          const node = nodes.find((n) => n.id === op.nodeId);
          if (!node) return false;
          const data = (node.data || {}) as Record<string, unknown>;
          if (data.replicas !== op.newReplicas) return false;
          break;
        }
        case "add_node": {
          const node = nodes.find((n) => n.id === op.node.id);
          if (!node) return false;
          break;
        }
        case "add_edge": {
          const edge = edges.find(
            (e) => e.id === op.edge.id || (e.source === op.edge.source && e.target === op.edge.target)
          );
          if (!edge) return false;
          break;
        }
        case "delete_edge": {
          const edge = edges.find((e) => e.id === op.edgeId);
          if (edge) return false;
          break;
        }
        case "insert_mediator": {
          const mediatorNode = nodes.find((n) => n.id === op.mediatorNode.id);
          if (!mediatorNode) return false;
          const oldEdge = edges.find((e) => e.id === op.replaceEdgeId);
          if (oldEdge) return false;
          break;
        }
        default:
          return false;
      }
    }

    return true;
  }
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export const recommendationEngine = new RecommendationEngine();
