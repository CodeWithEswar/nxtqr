import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { IRecommendationStrategy, StrategyContext, StrategyEvaluationResult } from "./strategy-types";
import type {
  CorrelatedFindingGroup,
  UnifiedFinding,
  UnifiedRecommendation,
} from "../contracts/recommendations.types";
import { CachingStrategy } from "./implementations/caching-strategy";
import { ReplicaStrategy } from "./implementations/replica-strategy";
import { RetryTimeoutStrategy } from "./implementations/retry-timeout-strategy";
import { CircuitBreakerStrategy } from "./implementations/circuit-breaker-strategy";
import { BulkheadStrategy } from "./implementations/bulkhead-strategy";
import { IdempotencyStrategy } from "./implementations/idempotency-strategy";
import { QueueDecouplingStrategy } from "./implementations/queue-decoupling-strategy";
import { RateLimitingStrategy } from "./implementations/rate-limiting-strategy";
import { SecurityControlsStrategy } from "./implementations/security-controls-strategy";
import { HorizontalScalingStrategy } from "./implementations/horizontal-scaling-strategy";
import { FailoverStrategy } from "./implementations/failover-strategy";
import { GracefulDegradationStrategy } from "./implementations/graceful-degradation-strategy";

export class StrategyRegistry {
  private static instance: StrategyRegistry;
  private strategies: Map<string, IRecommendationStrategy> = new Map();

  private constructor() {
    this.register(new CachingStrategy());
    this.register(new ReplicaStrategy());
    this.register(new RetryTimeoutStrategy());
    this.register(new CircuitBreakerStrategy());
    this.register(new BulkheadStrategy());
    this.register(new IdempotencyStrategy());
    this.register(new QueueDecouplingStrategy());
    this.register(new RateLimitingStrategy());
    this.register(new SecurityControlsStrategy());
    this.register(new HorizontalScalingStrategy());
    this.register(new FailoverStrategy());
    this.register(new GracefulDegradationStrategy());
  }

  public static getInstance(): StrategyRegistry {
    if (!StrategyRegistry.instance) {
      StrategyRegistry.instance = new StrategyRegistry();
    }
    return StrategyRegistry.instance;
  }

  public register(strategy: IRecommendationStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  public get(id: string): IRecommendationStrategy | undefined {
    return this.strategies.get(id);
  }

  public list(): IRecommendationStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Resolves recommendations for a correlated finding group by evaluating applicable strategies.
   * Performs deduplication so overlapping strategies merge evidence rather than duplicating recommendations.
   */
  public evaluateGroup(
    group: CorrelatedFindingGroup,
    nodes: BaseNode[],
    edges: BaseEdge[],
    allFindings: UnifiedFinding[]
  ): UnifiedRecommendation[] {
    const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));
    const edgeMap = new Map<string, BaseEdge>(edges.map((e) => [e.id, e]));

    const context: StrategyContext = {
      nodes,
      edges,
      group,
      allFindings,
      nodeMap,
      edgeMap,
    };

    const recommendations: UnifiedRecommendation[] = [];
    const seenStrategyIds = new Set<string>();

    for (const strategy of this.strategies.values()) {
      if (seenStrategyIds.has(strategy.id)) continue;

      const evalResult: StrategyEvaluationResult | null = strategy.evaluate(context);
      if (!evalResult || !evalResult.isApplicable) continue;

      seenStrategyIds.add(strategy.id);

      // Collect all evidence from group findings
      const combinedEvidence = group.findings.flatMap((f) => f.evidence);

      // Merge affected nodes and edges
      const affectedNodes = Array.from(
        new Set([
          ...(group.primaryNodeId ? [group.primaryNodeId] : []),
          ...group.sharedComponentIds,
          ...group.findings.flatMap((f) => f.affectedNodeIds),
        ])
      );

      const affectedEdges = Array.from(
        new Set([
          ...(group.primaryEdgeId ? [group.primaryEdgeId] : []),
          ...group.findings.flatMap((f) => f.affectedEdgeIds),
        ])
      );

      // Build stable recommendation ID
      const targetKey = group.primaryNodeId || group.primaryEdgeId || "global";
      const recId = `rec_${strategy.id}_${targetKey}`;

      recommendations.push({
        id: recId,
        strategyId: strategy.id,
        title: evalResult.title,
        summary: evalResult.summary,
        sourceFindingIds: group.findings.map((f) => f.id),
        sourceEngines: group.sourceEngines,
        affectedNodeIds: affectedNodes,
        affectedEdgeIds: affectedEdges,
        evidence: combinedEvidence,
        assumptions: evalResult.assumptions,
        prerequisites: evalResult.prerequisites,
        dependsOn: evalResult.dependsOn,
        benefits: evalResult.benefits,
        tradeoffs: evalResult.tradeoffs,
        tradeoffDetails: evalResult.tradeoffDetails,
        conflictsWith: evalResult.conflictsWith,
        feasibility: evalResult.feasibility,
        feasibilityReason: evalResult.feasibilityReason,
        confidence: group.rootCauseCandidate.confidence,
        priority: evalResult.priority,
        score: 0, // calculated in RankingEngine
        documentationId: evalResult.documentationId,
        proposedOperations: evalResult.proposedOperations,
        alternativeStrategies: evalResult.alternativeStrategies,
        lifecycleState: "new",
      });
    }

    return recommendations;
  }
}

export const strategyRegistry = StrategyRegistry.getInstance();
