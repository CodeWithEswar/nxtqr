/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Zod Runtime Validation Schemas
 */

import { z } from "zod";

export const AnalyzerCategorySchema = z.enum([
  "foundation",
  "risk",
  "optimization",
  "data",
  "interface",
  "operations",
  "governance",
  "evolution",
  "quality",
]);

export const ExecutionModeSchema = z.enum(["local", "server"]);

export const AnalyzerExecutionStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "skipped",
  "blocked",
  "cached",
]);

export const AssessmentCompletenessSchema = z.enum(["completed", "partial", "failed", "cancelled"]);

export const FindingSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "informational",
]);

export const AnalyzerDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: AnalyzerCategorySchema,
  dependencies: z.array(z.string()),
  inputSelectors: z.array(z.string()),
  outputKinds: z.array(z.string()),
  executionMode: ExecutionModeSchema,
  deterministic: z.boolean(),
  timeoutMs: z.number().int().positive(),
  requiresEvidence: z.boolean().optional(),
});

export const NormalizedFindingSchema = z.object({
  id: z.string().min(1),
  sourceAnalyzerId: z.string().min(1),
  category: z.string(),
  severity: FindingSeveritySchema,
  title: z.string(),
  description: z.string(),
  affectedComponentIds: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  confidence: z.enum(["verified", "modeled", "assumed", "unknown"]),
  remediationRecommendation: z.string().optional(),
  fingerprint: z.string(),
});

export const NormalizedEvidenceReferenceSchema = z.object({
  id: z.string().min(1),
  source: z.string(),
  type: z.string(),
  owner: z.string(),
  observedAt: z.string(),
  importedAt: z.string(),
  contentHash: z.string(),
  freshnessWindowHours: z.number().nonnegative(),
  isVerified: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

export const OrchestrationConfigurationSchema = z.object({
  maxConcurrency: z.number().int().min(1).max(16).default(4),
  overallTimeoutMs: z.number().int().positive().default(30000),
  enableCache: z.boolean().default(true),
  failFast: z.boolean().default(false),
});

export const AnalyzerResultEnvelopeSchema = z.object({
  analyzerId: z.string().min(1),
  analyzerVersion: z.string().min(1),
  architectureRevisionId: z.string(),
  status: z.enum(["completed", "partial", "failed"]),
  output: z.any().optional(),
  findings: z.array(NormalizedFindingSchema),
  evidenceIds: z.array(z.string()),
  durationMs: z.number().nonnegative(),
  errorMessage: z.string().optional(),
  executedAt: z.string(),
});

export const CorrelationGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  primaryCategory: z.string(),
  sharedComponentIds: z.array(z.string()),
  findingIds: z.array(z.string()),
  findingsCount: z.number().int().nonnegative(),
  findings: z.array(NormalizedFindingSchema),
  candidateRootCause: z.string(),
  recommendedUnifiedAction: z.string(),
});

export const ContradictionTypeSchema = z.enum([
  "topology_mismatch",
  "redundancy_conflict",
  "rto_verification_gap",
  "security_boundary_conflict",
  "scenario_assumption_conflict",
]);

export const ContradictionRecordSchema = z.object({
  id: z.string().min(1),
  type: ContradictionTypeSchema,
  description: z.string(),
  involvedAnalyzerIds: z.array(z.string()),
  involvedFindingIds: z.array(z.string()),
  affectedComponentIds: z.array(z.string()),
  explanation: z.string(),
  resolutionGuidance: z.string(),
});

export const OrchestratedRecommendationSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  category: z.string(),
  severity: FindingSeveritySchema,
  description: z.string(),
  affectedComponentIds: z.array(z.string()),
  correlatedFindingIds: z.array(z.string()),
  remediationSteps: z.array(z.string()),
  effort: z.enum(["low", "medium", "high"]),
  prerequisiteRecommendationIds: z.array(z.string()).optional(),
});
