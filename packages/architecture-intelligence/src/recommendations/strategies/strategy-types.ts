import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphOperation } from "../../scalability/schemas/scalability.schemas";
import type {
  CorrelatedFindingGroup,
  UnifiedFinding,
  RecommendationFeasibility,
  RecommendationPriority,
  TradeoffEvaluation,
  AlternativeStrategyOption,
} from "../contracts/recommendations.types";

export interface StrategyContext {
  nodes: BaseNode[];
  edges: BaseEdge[];
  group: CorrelatedFindingGroup;
  allFindings: UnifiedFinding[];
  nodeMap: Map<string, BaseNode>;
  edgeMap: Map<string, BaseEdge>;
}

export interface StrategyEvaluationResult {
  isApplicable: boolean;
  feasibility: RecommendationFeasibility;
  feasibilityReason?: string;
  title: string;
  summary: string;
  priority: RecommendationPriority;
  benefits: string[];
  tradeoffs: string[];
  tradeoffDetails: TradeoffEvaluation;
  assumptions: string[];
  prerequisites: string[];
  conflictsWith: string[];
  dependsOn: string[];
  proposedOperations: GraphOperation[];
  alternativeStrategies?: AlternativeStrategyOption[];
  documentationId?: string;
}

export interface IRecommendationStrategy {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  evaluate(context: StrategyContext): StrategyEvaluationResult | null;
}
