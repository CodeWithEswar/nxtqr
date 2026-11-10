import { z } from "zod";

export const HealthDimensionSchema = z.enum([
  "reliability",
  "scalability",
  "security",
  "performance",
  "maintainability",
  "operations",
]);

export const HealthSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const HealthConfidenceSchema = z.enum(["high", "medium", "low"]);

export const AssessmentStatusSchema = z.enum([
  "assessed",
  "insufficient-evidence",
  "not-assessed",
]);

export const HealthGradeSchema = z.enum(["A", "B", "C", "D", "F", "N/A"]);

export const EvidenceReferenceSchema = z.object({
  kind: z.enum(["node", "edge", "property", "boundary", "capability", "metric"]),
  elementId: z.string().optional(),
  propertyKey: z.string().optional(),
  expectedValue: z.unknown().optional(),
  actualValue: z.unknown().optional(),
  description: z.string(),
});

export const HealthRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  dimension: HealthDimensionSchema,
  effort: z.enum(["low", "medium", "high"]),
  impact: z.enum(["low", "medium", "high"]),
  actionableStep: z.string(),
  suggestedComponentTypes: z.array(z.string()).optional(),
  suggestedConfigChanges: z.record(z.unknown()).optional(),
});

export const HealthFindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  dimension: HealthDimensionSchema,
  severity: HealthSeveritySchema,
  title: z.string(),
  explanation: z.string(),
  evidence: z.array(EvidenceReferenceSchema),
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  assumptions: z.array(z.string()),
  confidence: HealthConfidenceSchema,
  recommendationIds: z.array(z.string()),
  documentationId: z.string().optional(),
  deductionWeight: z.number().optional(),
});

export const DimensionAssessmentSchema = z.object({
  dimension: HealthDimensionSchema,
  status: AssessmentStatusSchema,
  score: z.number().nullable(),
  grade: HealthGradeSchema,
  findings: z.array(HealthFindingSchema),
  findingsCount: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
    info: z.number(),
  }),
  evidenceCoveragePercent: z.number(),
  summary: z.string(),
  assumptionsEvaluated: z.array(z.string()),
  deductions: z.array(
    z.object({
      reason: z.string(),
      points: z.number(),
      ruleId: z.string(),
    })
  ),
});

export const AssessmentMetricsSchema = z.object({
  totalComponents: z.number(),
  totalConnections: z.number(),
  totalBoundaries: z.number(),
  criticalPathsCount: z.number(),
  cyclesDetectedCount: z.number(),
  articulationPointsCount: z.number(),
  executionTimeMs: z.number(),
});

export const HealthAssessmentReportSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  graphRevision: z.string(),
  rulesetVersion: z.string(),
  scoringPolicyVersion: z.string(),
  overallScore: z.number().nullable(),
  overallGrade: HealthGradeSchema,
  status: z.enum(["assessed", "insufficient-evidence", "partial"]),
  dimensions: z.record(HealthDimensionSchema, DimensionAssessmentSchema),
  allFindings: z.array(HealthFindingSchema),
  findingsByNode: z.record(z.string(), z.array(HealthFindingSchema)),
  findingsByEdge: z.record(z.string(), z.array(HealthFindingSchema)),
  metrics: AssessmentMetricsSchema,
  validationPassed: z.boolean(),
  validationErrorsCount: z.number(),
});

export const ScoringPolicySchema = z.object({
  version: z.string(),
  dimensionWeights: z.record(HealthDimensionSchema, z.number()),
  severityDeductions: z.record(HealthSeveritySchema, z.number()),
  maxDeductionPerRule: z.number(),
  minComponentsForScoring: z.number(),
  confidenceMultipliers: z.record(HealthConfidenceSchema, z.number()),
});
