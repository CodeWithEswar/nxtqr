import type { GraphValidationResult } from "@nxtqr/architecture-validation";
import type { HealthFinding } from "../../contracts/health.types";
import type { BottleneckFinding } from "../../bottlenecks/contracts/bottleneck.types";
import type { FailureFinding } from "../../failure-analysis/contracts/failure.types";
import type { SecurityFinding } from "../../security-analysis/schemas/security.schemas";
import type { ScalabilityRecommendation } from "../../scalability/schemas/scalability.schemas";
import type { ReliabilityFinding } from "../../reliability/schemas/reliability.schemas";
import type { GraphOperation } from "../../scalability/schemas/scalability.schemas";

export interface UnifiedEvidenceReference {
  kind: "node" | "edge" | "property" | "boundary" | "capability" | "metric" | "path";
  elementId?: string;
  propertyKey?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  description: string;
}

export type EvidenceReference = UnifiedEvidenceReference;

export interface MultiEngineAnalysisInputs {
  validation?: GraphValidationResult;
  healthFindings?: HealthFinding[];
  bottleneckFindings?: BottleneckFinding[];
  failureFindings?: FailureFinding[];
  securityFindings?: SecurityFinding[];
  scalabilityRecommendations?: ScalabilityRecommendation[];
  reliabilityFindings?: ReliabilityFinding[];
}

export type AnalysisEngineSource =
  | "validation"
  | "health"
  | "bottlenecks"
  | "spof"
  | "security"
  | "scalability"
  | "reliability";

export type UnifiedSeverity = "critical" | "high" | "medium" | "low" | "info";
export type UnifiedConfidence = "high" | "medium" | "low";
export type RecommendationPriority = "critical" | "high" | "medium" | "low";
export type RecommendationFeasibility =
  | "applicable"
  | "conditional"
  | "not-applicable"
  | "insufficient-evidence";

export type RecommendationLifecycle =
  | "new"
  | "reviewed"
  | "planned"
  | "applied"
  | "dismissed"
  | "superseded";

export interface UnifiedFinding {
  id: string;
  sourceEngine: AnalysisEngineSource;
  ruleId: string;
  severity: UnifiedSeverity;
  confidence: UnifiedConfidence;
  category: string;
  title: string;
  explanation: string;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  evidence: UnifiedEvidenceReference[];
  assumptions: string[];
  remediationHint?: string;
  rawFindingId: string;
}

export type RootCauseClassification =
  | "supported-root-cause"
  | "potential-root-cause"
  | "insufficient-evidence";

export interface RootCauseAssessment {
  type: RootCauseClassification;
  title: string;
  explanation: string;
  confidence: UnifiedConfidence;
  evidence: string[];
}

export interface CorrelatedFindingGroup {
  id: string;
  primaryNodeId?: string;
  primaryEdgeId?: string;
  sharedComponentIds: string[];
  sourceEngines: AnalysisEngineSource[];
  findings: UnifiedFinding[];
  rootCauseCandidate: RootCauseAssessment;
}

export type ImpactDirection = "positive" | "neutral" | "negative" | "variable";

export interface TradeoffEvaluation {
  reliability: ImpactDirection;
  performance: ImpactDirection;
  scalability: ImpactDirection;
  security: ImpactDirection;
  dataConsistency: ImpactDirection;
  operationalComplexity: "low" | "medium" | "high";
  costDirection: "increase" | "neutral" | "decrease";
  reversibility: "high" | "medium" | "low";
  tradeoffNotes: string[];
}

export interface AlternativeStrategyOption {
  strategyId: string;
  title: string;
  explanation: string;
  tradeoffSummary: string;
}

export interface UnifiedRecommendation {
  id: string;
  strategyId: string;
  title: string;
  summary: string;
  sourceFindingIds: string[];
  sourceEngines: AnalysisEngineSource[];
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  evidence: EvidenceReference[];
  assumptions: string[];
  prerequisites: string[];
  dependsOn: string[];
  benefits: string[];
  tradeoffs: string[];
  tradeoffDetails: TradeoffEvaluation;
  conflictsWith: string[];
  feasibility: RecommendationFeasibility;
  feasibilityReason?: string;
  confidence: UnifiedConfidence;
  priority: RecommendationPriority;
  score: number;
  documentationId?: string;
  proposedOperations: GraphOperation[];
  alternativeStrategies?: AlternativeStrategyOption[];
  lifecycleState: RecommendationLifecycle;
}

export interface RecommendationConflict {
  recommendationAId: string;
  recommendationBId: string;
  conflictType:
    | "direct-incompatibility"
    | "contention-amplification"
    | "consistency-tradeoff"
    | "prerequisite-violation";
  explanation: string;
  resolutionOptions: string[];
}

export interface ImprovementPlanStep {
  stepNumber: number;
  recommendationId: string;
  title: string;
  strategyId: string;
  operations: GraphOperation[];
  prerequisitesMet: boolean;
  affectedNodeIds: string[];
}

export interface ImprovementPlan {
  id: string;
  targetRecommendationIds: string[];
  orderedSteps: ImprovementPlanStep[];
  totalOperations: number;
  hasConflicts: boolean;
  conflicts: RecommendationConflict[];
  hasCycles: boolean;
  cycles: string[][];
  estimatedComplexity: "low" | "medium" | "high";
  isExecutable: boolean;
}

export interface RecommendationSummary {
  totalRecommendations: number;
  byPriority: Record<RecommendationPriority, number>;
  byFeasibility: Record<RecommendationFeasibility, number>;
  byLifecycle: Record<RecommendationLifecycle, number>;
  conflictsDetected: number;
  topPriorityId?: string;
}

export interface UnifiedRecommendationReport {
  revision: string;
  timestamp: string;
  totalFindingsAnalyzed: number;
  findingsByEngine: Record<AnalysisEngineSource, number>;
  correlatedGroups: CorrelatedFindingGroup[];
  recommendations: UnifiedRecommendation[];
  conflicts: RecommendationConflict[];
  plan: ImprovementPlan;
  summary: RecommendationSummary;
}
