import { z } from "zod";
import { BaseNodeSchema, BaseEdgeSchema } from "@nxtqr/graph-schema";
import { UnifiedEvidenceReferenceSchema } from "../../recommendations/schemas/recommendations.schemas";

export const ChangeKindSchema = z.enum(["added", "removed", "modified", "unchanged"]);
export const EntityTypeSchema = z.enum(["node", "edge", "configuration"]);

export const ChangeCategorySchema = z.enum([
  "topology",
  "configuration",
  "dependency",
  "deployment",
  "security",
  "reliability",
  "scalability",
  "capacity",
  "data-flow",
  "operational",
  "visual-only",
]);

export const RegressionClassificationSchema = z.enum([
  "supported-regression",
  "potential-regression",
  "insufficient-evidence",
]);

export const ArchitectureSnapshotSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable().optional(),
  architectureId: z.string().optional(),
  title: z.string(),
  revision: z.string(),
  schemaVersion: z.number().default(1),
  nodes: z.array(BaseNodeSchema),
  edges: z.array(BaseEdgeSchema),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  provenance: z.enum([
    "current-draft",
    "saved-version",
    "what-if-proposal",
    "imported",
    "preset",
  ]),
});

export const FieldDeltaSchema = z.object({
  fieldPath: z.string(),
  baselineValue: z.unknown().optional(),
  candidateValue: z.unknown().optional(),
  unit: z.string().optional(),
  isNormalized: z.boolean().optional(),
});

export const ChangeImpactSchema = z.object({
  directlyAffectedNodeIds: z.array(z.string()),
  indirectlyAffectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  reliabilityImplications: z.array(z.string()),
  securityImplications: z.array(z.string()),
  scalabilityImplications: z.array(z.string()),
  capacityDeltaRps: z.number().optional(),
});

export const ArchitectureChangeSchema = z.object({
  id: z.string(),
  kind: ChangeKindSchema,
  entityType: EntityTypeSchema,
  baselineId: z.string().optional(),
  candidateId: z.string().optional(),
  nodeType: z.string().optional(),
  label: z.string().optional(),
  changedFields: z.array(z.string()),
  fieldDeltas: z.array(FieldDeltaSchema),
  categories: z.array(ChangeCategorySchema),
  impact: ChangeImpactSchema,
  evidence: z.array(UnifiedEvidenceReferenceSchema),
});

export const ArchitecturalRegressionSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  title: z.string(),
  explanation: z.string(),
  category: z.enum(["security", "reliability", "scalability", "resilience", "capacity"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  classification: RegressionClassificationSchema,
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  evidence: z.array(UnifiedEvidenceReferenceSchema),
});

export const HealthComparisonSchema = z.object({
  baselineScore: z.number(),
  candidateScore: z.number(),
  scoreDelta: z.number(),
  introducedFindingCount: z.number(),
  resolvedFindingCount: z.number(),
});

export const BottleneckComparisonSchema = z.object({
  baselineCriticalCount: z.number(),
  candidateCriticalCount: z.number(),
  resolvedBottlenecks: z.array(z.string()),
  newBottlenecks: z.array(z.string()),
  capacityHeadroomMultiplier: z.number(),
});

export const SpofComparisonSchema = z.object({
  baselineSpofCount: z.number(),
  candidateSpofCount: z.number(),
  eliminatedSpofNodeIds: z.array(z.string()),
  newSpofNodeIds: z.array(z.string()),
  blastRadiusDelta: z.number(),
});

export const SecurityComparisonSchema = z.object({
  baselineVulnerabilityCount: z.number(),
  candidateVulnerabilityCount: z.number(),
  resolvedSecurityIssues: z.array(z.string()),
  newSecurityRisks: z.array(z.string()),
  unprotectedExposureAdded: z.boolean(),
});

export const ScalabilityComparisonSchema = z.object({
  baselineHeadroomRps: z.number(),
  candidateHeadroomRps: z.number(),
  capacityGainRatio: z.number(),
  newScalingConstraints: z.array(z.string()),
});

export const ReliabilityComparisonSchema = z.object({
  baselineResilienceScore: z.number(),
  candidateResilienceScore: z.number(),
  newCascadingRisks: z.array(z.string()),
  resolvedCascadingRisks: z.array(z.string()),
  retryAmplificationEliminated: z.boolean(),
});

export const RecommendationComparisonSchema = z.object({
  newRecommendations: z.array(z.string()),
  resolvedRecommendations: z.array(z.string()),
  unchangedRecommendations: z.array(z.string()),
});

export const EngineAnalysisComparisonSchema = z.object({
  health: HealthComparisonSchema.optional(),
  bottlenecks: BottleneckComparisonSchema.optional(),
  spof: SpofComparisonSchema.optional(),
  security: SecurityComparisonSchema.optional(),
  scalability: ScalabilityComparisonSchema.optional(),
  reliability: ReliabilityComparisonSchema.optional(),
  recommendations: RecommendationComparisonSchema.optional(),
});

export const ComparisonSummarySchema = z.object({
  addedNodesCount: z.number(),
  removedNodesCount: z.number(),
  modifiedNodesCount: z.number(),
  unchangedNodesCount: z.number(),
  addedEdgesCount: z.number(),
  removedEdgesCount: z.number(),
  modifiedEdgesCount: z.number(),
  configurationChangesCount: z.number(),
  introducedFindingsCount: z.number(),
  resolvedFindingsCount: z.number(),
  regressionsCount: z.number(),
  supportedRegressionsCount: z.number(),
  keyTradeoffs: z.array(z.string()),
  overallAssessment: z.enum(["improved", "regressed", "mixed", "neutral"]),
});

export const ArchitectureComparisonResultSchema = z.object({
  id: z.string(),
  baselineSnapshot: ArchitectureSnapshotSchema,
  candidateSnapshot: ArchitectureSnapshotSchema,
  changes: z.array(ArchitectureChangeSchema),
  regressions: z.array(ArchitecturalRegressionSchema),
  analysisComparison: EngineAnalysisComparisonSchema,
  summary: ComparisonSummarySchema,
  comparedAt: z.string(),
  isCompatibleScenarios: z.boolean(),
  notes: z.array(z.string()),
});

