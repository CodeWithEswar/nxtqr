import { z } from "zod";
import {
  recommendationFeasibilitySchema,
  graphOperationSchema,
} from "../../scalability/schemas/scalability.schemas";

export const AnalysisEngineSourceSchema = z.enum([
  "validation",
  "health",
  "bottlenecks",
  "spof",
  "security",
  "scalability",
  "reliability",
]);

export const UnifiedSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const UnifiedConfidenceSchema = z.enum(["high", "medium", "low"]);

export const RecommendationPrioritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

export const RecommendationFeasibilitySchema = recommendationFeasibilitySchema;

export const RecommendationLifecycleSchema = z.enum([
  "new",
  "reviewed",
  "planned",
  "applied",
  "dismissed",
  "superseded",
]);

export const UnifiedEvidenceReferenceSchema = z.object({
  kind: z.enum(["node", "edge", "property", "boundary", "capability", "metric", "path"]),
  elementId: z.string().optional(),
  propertyKey: z.string().optional(),
  expectedValue: z.unknown().optional(),
  actualValue: z.unknown().optional(),
  description: z.string(),
});

export const UnifiedFindingSchema = z.object({
  id: z.string(),
  sourceEngine: AnalysisEngineSourceSchema,
  ruleId: z.string(),
  severity: UnifiedSeveritySchema,
  confidence: UnifiedConfidenceSchema,
  category: z.string(),
  title: z.string(),
  explanation: z.string(),
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  evidence: z.array(UnifiedEvidenceReferenceSchema),
  assumptions: z.array(z.string()),
  remediationHint: z.string().optional(),
  rawFindingId: z.string(),
});

export const RootCauseClassificationSchema = z.enum([
  "supported-root-cause",
  "potential-root-cause",
  "insufficient-evidence",
]);

export const RootCauseAssessmentSchema = z.object({
  type: RootCauseClassificationSchema,
  title: z.string(),
  explanation: z.string(),
  confidence: UnifiedConfidenceSchema,
  evidence: z.array(z.string()),
});

export const CorrelatedFindingGroupSchema = z.object({
  id: z.string(),
  primaryNodeId: z.string().optional(),
  primaryEdgeId: z.string().optional(),
  sharedComponentIds: z.array(z.string()),
  sourceEngines: z.array(AnalysisEngineSourceSchema),
  findings: z.array(UnifiedFindingSchema),
  rootCauseCandidate: RootCauseAssessmentSchema,
});

export const ImpactDirectionSchema = z.enum([
  "positive",
  "neutral",
  "negative",
  "variable",
]);

export const TradeoffEvaluationSchema = z.object({
  reliability: ImpactDirectionSchema,
  performance: ImpactDirectionSchema,
  scalability: ImpactDirectionSchema,
  security: ImpactDirectionSchema,
  dataConsistency: ImpactDirectionSchema,
  operationalComplexity: z.enum(["low", "medium", "high"]),
  costDirection: z.enum(["increase", "neutral", "decrease"]),
  reversibility: z.enum(["high", "medium", "low"]),
  tradeoffNotes: z.array(z.string()),
});

export const AlternativeStrategyOptionSchema = z.object({
  strategyId: z.string(),
  title: z.string(),
  explanation: z.string(),
  tradeoffSummary: z.string(),
});

export const GraphOperationSchema = graphOperationSchema;

export const UnifiedRecommendationSchema = z.object({
  id: z.string(),
  strategyId: z.string(),
  title: z.string(),
  summary: z.string(),
  sourceFindingIds: z.array(z.string()),
  sourceEngines: z.array(AnalysisEngineSourceSchema),
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  evidence: z.array(UnifiedEvidenceReferenceSchema),
  assumptions: z.array(z.string()),
  prerequisites: z.array(z.string()),
  dependsOn: z.array(z.string()),
  benefits: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  tradeoffDetails: TradeoffEvaluationSchema,
  conflictsWith: z.array(z.string()),
  feasibility: RecommendationFeasibilitySchema,
  feasibilityReason: z.string().optional(),
  confidence: UnifiedConfidenceSchema,
  priority: RecommendationPrioritySchema,
  score: z.number(),
  documentationId: z.string().optional(),
  proposedOperations: z.array(GraphOperationSchema),
  alternativeStrategies: z.array(AlternativeStrategyOptionSchema).optional(),
  lifecycleState: RecommendationLifecycleSchema,
});

export const RecommendationConflictSchema = z.object({
  recommendationAId: z.string(),
  recommendationBId: z.string(),
  conflictType: z.enum([
    "direct-incompatibility",
    "contention-amplification",
    "consistency-tradeoff",
    "prerequisite-violation",
  ]),
  explanation: z.string(),
  resolutionOptions: z.array(z.string()),
});

export const ImprovementPlanStepSchema = z.object({
  stepNumber: z.number(),
  recommendationId: z.string(),
  title: z.string(),
  strategyId: z.string(),
  operations: z.array(GraphOperationSchema),
  prerequisitesMet: z.boolean(),
  affectedNodeIds: z.array(z.string()),
});

export const ImprovementPlanSchema = z.object({
  id: z.string(),
  targetRecommendationIds: z.array(z.string()),
  orderedSteps: z.array(ImprovementPlanStepSchema),
  totalOperations: z.number(),
  hasConflicts: z.boolean(),
  conflicts: z.array(RecommendationConflictSchema),
  hasCycles: z.boolean(),
  cycles: z.array(z.array(z.string())),
  estimatedComplexity: z.enum(["low", "medium", "high"]),
  isExecutable: z.boolean(),
});

export const RecommendationSummarySchema = z.object({
  totalRecommendations: z.number(),
  byPriority: z.record(RecommendationPrioritySchema, z.number()),
  byFeasibility: z.record(RecommendationFeasibilitySchema, z.number()),
  byLifecycle: z.record(RecommendationLifecycleSchema, z.number()),
  conflictsDetected: z.number(),
  topPriorityId: z.string().optional(),
});

export const UnifiedRecommendationReportSchema = z.object({
  revision: z.string(),
  timestamp: z.string(),
  totalFindingsAnalyzed: z.number(),
  findingsByEngine: z.record(AnalysisEngineSourceSchema, z.number()),
  correlatedGroups: z.array(CorrelatedFindingGroupSchema),
  recommendations: z.array(UnifiedRecommendationSchema),
  conflicts: z.array(RecommendationConflictSchema),
  plan: ImprovementPlanSchema,
  summary: RecommendationSummarySchema,
});
