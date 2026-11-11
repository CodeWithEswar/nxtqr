/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Zod Runtime Validation Schemas
 */

import { z } from "zod";

export const TestSeveritySchema = z.enum(["critical", "high", "medium", "low"]);

export const TestStatusSchema = z.enum(["draft", "active", "retired"]);

export const TestCategorySchema = z.enum([
  "graph_topology",
  "component_configuration",
  "security",
  "reliability",
  "availability",
  "scalability",
  "performance",
  "capacity",
  "cost",
  "deployment",
  "network",
  "api_contracts",
  "data",
  "database",
  "messaging",
  "caching",
  "observability",
  "disaster_recovery",
  "migration",
  "governance",
]);

export const TestScopeLevelSchema = z.enum([
  "organization",
  "workspace",
  "project",
  "architecture",
  "environment",
  "component",
  "api",
  "data_asset",
  "critical_journey",
  "region",
]);

export const TestScopeSchema = z.object({
  level: TestScopeLevelSchema,
  targetIds: z.array(z.string()).optional(),
  environment: z.enum(["production", "staging", "development", "all"]).optional(),
});

export const AssertionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "exists",
  "missing",
  "greater_than",
  "less_than",
  "in_set",
  "all",
  "any",
  "none",
  "graph_reachable",
  "path_exists",
  "relationship_count",
  "evidence_present",
  "evidence_fresh",
  "engine_finding_absent",
]);

export const ArchitectureAssertionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    operator: AssertionOperatorSchema,
    path: z.string().optional(),
    targetValue: z.any().optional(),
    fromNodeId: z.string().optional(),
    toNodeId: z.string().optional(),
    evidenceType: z.string().optional(),
    maxAgeHours: z.number().nonnegative().optional(),
    engine: z.string().optional(),
    minSeverity: TestSeveritySchema.optional(),
    children: z.array(ArchitectureAssertionSchema).optional(),
  })
);

export const ArchitectureRequirementSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  category: TestCategorySchema,
  criticality: TestSeveritySchema,
  owner: z.string(),
  scope: TestScopeSchema,
  status: z.enum(["active", "draft", "deprecated"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ArchitectureTestSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  category: TestCategorySchema,
  scope: TestScopeSchema,
  assertion: ArchitectureAssertionSchema,
  severity: TestSeveritySchema,
  status: TestStatusSchema,
  requirementIds: z.array(z.string()),
  requiredEvidenceTypes: z.array(z.string()),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ArchitectureTestSuiteSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  testIds: z.array(z.string()),
  dependencySuiteIds: z.array(z.string()),
  status: TestStatusSchema,
  createdBy: z.string(),
  createdAt: z.string(),
});

export const VerificationEvidenceSchema = z.object({
  id: z.string(),
  evidenceType: z.string(),
  source: z.string(),
  owner: z.string(),
  architectureRevisionId: z.string(),
  observedAt: z.string(),
  importedAt: z.string(),
  contentHash: z.string(),
  freshnessWindowHours: z.number().nonnegative(),
  isVerified: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

export const TestEvaluationStatusSchema = z.enum(["pass", "fail", "unknown", "not_applicable"]);

export const VerificationResultSchema = z.object({
  id: z.string(),
  testId: z.string(),
  testVersion: z.string(),
  architectureRevisionId: z.string(),
  status: TestEvaluationStatusSchema,
  applicabilityReason: z.string().optional(),
  explanation: z.string(),
  evidenceIds: z.array(z.string()),
  affectedComponentIds: z.array(z.string()),
  evaluatorVersion: z.string(),
  evaluatedAt: z.string(),
  durationMs: z.number().nonnegative(),
});

export const BlockingRulesSchema = z.object({
  allowUnknown: z.boolean(),
  blockOnAnyFailure: z.boolean(),
  requireFreshEvidence: z.boolean(),
  minPassRatePercent: z.number().min(0).max(100),
});

export const ReadinessGateSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  version: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum([
    "architecture_review",
    "production_readiness",
    "security_readiness",
    "reliability_readiness",
    "migration_readiness",
    "disaster_recovery_readiness",
    "governance_readiness",
  ]),
  requiredTestIds: z.array(z.string()),
  requiredSuiteIds: z.array(z.string()),
  requiredEvidenceTypes: z.array(z.string()),
  blockingRules: BlockingRulesSchema,
  approvalPolicyId: z.string().optional(),
  status: TestStatusSchema,
});

export const GateExceptionSchema = z.object({
  id: z.string(),
  gateId: z.string(),
  testId: z.string(),
  justification: z.string(),
  compensatingControls: z.string(),
  approvedBy: z.string(),
  expiresAt: z.string(),
  status: z.enum(["active", "expired", "revoked"]),
});

