import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { DEFAULT_WORKLOAD_SCENARIOS } from "../../bottlenecks/scenarios/scenario-registry";
import { bottleneckEngine } from "../../bottlenecks/engine/bottleneck-engine";
import {
  toBottleneckScenario,
  type IScalabilityStrategyEvaluator,
  type ScalabilityEvaluationContext,
} from "../contracts/scalability.types";
import type {
  ScalabilityAnalysisReport,
  ScalabilityRecommendation,
  ScalabilityStrategy,
} from "../schemas/scalability.schemas";
import { HorizontalScalingEvaluator } from "../strategies/horizontal-scaling";
import { CachingEvaluator } from "../strategies/caching";
import { DatabaseScalingEvaluator } from "../strategies/database-scaling";
import { AsynchronousProcessingEvaluator } from "../strategies/asynchronous-processing";
import { RateLimitingEvaluator } from "../strategies/rate-limiting";
import { RecommendationRankingEngine } from "./ranking-engine";
import { WhatIfEngine } from "../planner/what-if-engine";
import type { WhatIfPlan } from "../schemas/scalability.schemas";

export class ScalabilityRecommendationsEngine {
  private evaluators: IScalabilityStrategyEvaluator[] = [
    new HorizontalScalingEvaluator(),
    new CachingEvaluator(),
    new DatabaseScalingEvaluator(),
    new AsynchronousProcessingEvaluator(),
    new RateLimitingEvaluator(),
  ];

  private cache: {
    revisionHash: string;
    scenarioId: string;
    report: ScalabilityAnalysisReport;
  } | null = null;

  public evaluateGraph(
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenario: any = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
  ): ScalabilityAnalysisReport {
    const revisionHash = this.computeRevisionHash(nodes, edges);
    if (this.cache && this.cache.revisionHash === revisionHash && this.cache.scenarioId === scenario.id) {
      return this.cache.report;
    }

    // 1. Analyze bottlenecks under the given workload scenario
    const bottleneckScenario = toBottleneckScenario(scenario);
    const bottleneckReport = bottleneckEngine.analyzeGraph(nodes, edges, bottleneckScenario);

    // 2. Build maps
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

    // 3. Build context
    const context: ScalabilityEvaluationContext = {
      nodes,
      edges,
      nodeMap,
      outgoingEdgesMap,
      incomingEdgesMap,
      scenario,
      bottleneckReport,
    };

    // 4. Run all strategy evaluators
    const rawRecommendations: ScalabilityRecommendation[] = [];
    for (const evaluator of this.evaluators) {
      try {
        const recs = evaluator.evaluate(context);
        rawRecommendations.push(...recs);
      } catch (err) {
        console.error(`Scalability strategy evaluator error:`, err);
      }
    }

    // 5. Deduplicate recommendations by ID
    const uniqueMap = new Map<string, ScalabilityRecommendation>();
    for (const rec of rawRecommendations) {
      uniqueMap.set(rec.id, rec);
    }
    const deduped = Array.from(uniqueMap.values());

    // 6. Rank recommendations
    const ranked = RecommendationRankingEngine.rank(deduped);

    // 7. Calculate summary
    let applicableCount = 0;
    let conditionalCount = 0;
    let highConfidenceCount = 0;
    const strategyCounts: Record<string, number> = {};

    for (const rec of ranked) {
      if (rec.feasibility === "applicable") applicableCount++;
      else if (rec.feasibility === "conditional") conditionalCount++;
      if (rec.confidence === "high") highConfidenceCount++;
      strategyCounts[rec.strategy] = (strategyCounts[rec.strategy] || 0) + 1;
    }

    let topStrategy: ScalabilityStrategy | undefined = undefined;
    let maxStrategyCount = 0;
    for (const [strat, count] of Object.entries(strategyCounts)) {
      if (count > maxStrategyCount) {
        maxStrategyCount = count;
        topStrategy = strat as ScalabilityStrategy;
      }
    }

    const report: ScalabilityAnalysisReport = {
      id: `scale_report_${Date.now()}`,
      analyzedAt: new Date().toISOString(),
      revisionHash,
      scenarioId: scenario.id,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      recommendations: ranked,
      summary: {
        totalRecommendations: ranked.length,
        applicableCount,
        conditionalCount,
        highConfidenceCount,
        topStrategy,
      },
    };

    this.cache = { revisionHash, scenarioId: scenario.id, report };
    return report;
  }

  public createWhatIfPlan(
    nodes: BaseNode[],
    edges: BaseEdge[],
    recommendation: ScalabilityRecommendation,
    scenario: any = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
  ): WhatIfPlan {
    const { plan } = WhatIfEngine.createPlan(nodes, edges, recommendation, scenario);
    return plan;
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

export const scalabilityRecommendationsEngine = new ScalabilityRecommendationsEngine();
