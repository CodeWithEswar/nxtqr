/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Zod Runtime Validation Schemas
 */

import { z } from "zod";

export const GovernanceSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "informational",
]);

export const PolicyLifecycleStatusSchema = z.enum([
  "draft",
  "review",
  "approved",
  "active",
  "deprecated",
  "retired",
]);

export const EvaluationStatusSchema = z.enum([
  "pass",
  "fail",
  "unknown",
  "not_applicable",
]);

export const PolicyCategorySchema = z.enum([
  "security",
  "reliability",
  "data_protection",
  "network",
  "api_governance",
  "database",
  "messaging",
  "observability",
  "cost",
  "technology_standards",
  "infrastructure",
]);

export const GovernanceScopeLevelSchema = z.enum([
  "organization",
  "workspace",
  "project",
  "environment",
]);

export const EnvironmentTypeSchema = z.enum([
  "production",
  "staging",
  "development",
  "all",
]);

export const DataClassificationTypeSchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
]);

export const EvidenceTypeSchema = z.enum([
  "architecture_graph",
  "security_configuration",
  "deployment_metadata",
  "data_classification",
  "api_contract",
  "telemetry_metric",
  "audit_log",
  "human_review",
  "backup_verification",
  "database_schema",
]);

export const ExceptionStatusSchema = z.enum([
  "requested",
  "under_review",
  "approved",
  "rejected",
  "expired",
  "revoked",
]);

export const FrameworkSupportStrengthSchema = z.enum([
  "direct_technical_support",
  "partial_technical_support",
  "supporting_evidence",
  "requires_human_assessment",
]);

export const GovernanceProvenanceSchema = z.object({
  source: z.enum([
    "declared_policy",
    "imported_standard",
    "system_guardrail",
    "modeled_governance",
  ]),
  author: z.string().min(1),
  timestamp: z.string(),
  graphRevision: z.string().optional(),
  confirmed: z.boolean(),
});

export const RuleOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "exists",
  "missing",
  "greater_than",
  "less_than",
  "in_set",
  "not_in_set",
  "all",
  "any",
  "none",
  "graph_reachable",
  "graph_path_exists",
  "relationship_count",
  "attribute_matches",
]);

// Recursive PolicyRule schema with depth safety
export const PolicyRuleSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    targetProperty: z.string().optional(),
    operator: RuleOperatorSchema,
    expectedValue: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
    ]).optional(),
    negate: z.boolean().optional(),
    children: z.array(PolicyRuleSchema).optional(),
    description: z.string().optional(),
  })
);

export const GovernanceScopeSchema = z.object({
  level: GovernanceScopeLevelSchema,
  organizationId: z.string().min(1),
  workspaceId: z.string().optional(),
  projectId: z.string().optional(),
  environments: z.array(EnvironmentTypeSchema).optional(),
  componentTypes: z.array(z.string()).optional(),
  dataClassifications: z.array(DataClassificationTypeSchema).optional(),
  regions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const FrameworkReferenceSchema = z.object({
  frameworkId: z.string().min(1),
  frameworkName: z.string().min(1),
  frameworkVersion: z.string().min(1),
  controlId: z.string().min(1),
  controlTitle: z.string().min(1),
  sourceUrl: z.string().optional(),
});

export const ControlMappingSchema = z.object({
  framework: FrameworkReferenceSchema,
  supportStrength: FrameworkSupportStrengthSchema,
  coverageNotes: z.string().min(1),
  disclaimer: z.literal(
    "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification."
  ),
});

export const GovernancePolicySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().optional(),
  projectId: z.string().optional(),
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: PolicyCategorySchema,
  severity: GovernanceSeveritySchema,
  status: PolicyLifecycleStatusSchema,
  scope: GovernanceScopeSchema,
  rule: PolicyRuleSchema,
  requiredEvidenceTypes: z.array(EvidenceTypeSchema),
  remediationGuidance: z.string().min(1),
  controlMappings: z.array(ControlMappingSchema).optional(),
  provenance: GovernanceProvenanceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const StandardBundleTypeSchema = z.enum([
  "baseline_architecture",
  "production_readiness",
  "cloud_security_guardrails",
  "data_privacy_gdpr",
  "zero_trust_network",
  "financial_compliance",
  "custom",
]);

export const PolicyBundleSchema = z.object({
  id: z.string().min(1),
  bundleType: StandardBundleTypeSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().min(1),
  policyIds: z.array(z.string()),
  isMandatory: z.boolean(),
  provenance: GovernanceProvenanceSchema,
});

export const EvidenceArtifactSchema = z.object({
  id: z.string().min(1),
  evidenceType: EvidenceTypeSchema,
  sourceIdentifier: z.string().min(1),
  resourceId: z.string().optional(),
  observedAt: z.string(),
  freshnessWindowSeconds: z.number().int().positive(),
  integrityHash: z.string().min(8),
  content: z.record(z.any()),
  owner: z.string().min(1),
  provenance: GovernanceProvenanceSchema,
});

export const CompensatingControlSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  owner: z.string().min(1),
  evidenceArtifactIds: z.array(z.string()),
  reviewStatus: z.enum(["verified", "unverified"]),
});

export const ExceptionAuditEntrySchema = z.object({
  action: z.enum(["requested", "approved", "rejected", "revoked", "expired"]),
  performedBy: z.string().min(1),
  timestamp: z.string(),
  notes: z.string().optional(),
});

export const PolicyExceptionSchema = z.object({
  id: z.string().min(1),
  policyId: z.string().min(1),
  policyVersion: z.string().min(1),
  resourceScope: z.array(z.string()),
  justification: z.string().min(1),
  compensatingControls: z.array(CompensatingControlSchema),
  requesterId: z.string().min(1),
  approverId: z.string().optional(),
  status: ExceptionStatusSchema,
  startDate: z.string(),
  expirationDate: z.string(),
  isExpired: z.boolean(),
  auditHistory: z.array(ExceptionAuditEntrySchema),
  provenance: GovernanceProvenanceSchema,
});

export const PolicyEvaluationSchema = z.object({
  id: z.string().min(1),
  policyId: z.string().min(1),
  policyVersion: z.string().min(1),
  policyTitle: z.string().min(1),
  category: PolicyCategorySchema,
  severity: GovernanceSeveritySchema,
  resourceId: z.string().optional(),
  resourceName: z.string().optional(),
  status: EvaluationStatusSchema,
  isApplicable: z.boolean(),
  applicableReason: z.string().optional(),
  evidenceIds: z.array(z.string()),
  missingEvidenceTypes: z.array(EvidenceTypeSchema),
  explanation: z.string().min(1),
  remediationGuidance: z.string().min(1),
  exceptionId: z.string().optional(),
  hasActiveException: z.boolean(),
  evaluatedAt: z.string(),
  evaluatorVersion: z.string().min(1),
});

export const GovernanceFindingSchema = z.object({
  id: z.string().min(1),
  policyId: z.string().min(1),
  policyVersion: z.string().min(1),
  title: z.string().min(1),
  category: PolicyCategorySchema,
  severity: GovernanceSeveritySchema,
  affectedResourceIds: z.array(z.string()),
  evaluationStatus: EvaluationStatusSchema,
  summary: z.string().min(1),
  rationale: z.string().min(1),
  remediation: z.string().min(1),
  hasApprovedException: z.boolean(),
  exceptionId: z.string().optional(),
  evidenceIds: z.array(z.string()),
  provenance: GovernanceProvenanceSchema,
});

export const GovernanceResourceTargetSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  environment: EnvironmentTypeSchema.optional(),
  componentType: z.string().optional(),
  dataClassification: DataClassificationTypeSchema.optional(),
  geographicRegion: z.string().optional(),
  tags: z.array(z.string()).optional(),
  properties: z.record(z.any()).optional(),
});

export const GovernanceArchitectureTopologySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  graphRevision: z.string().min(1),
  version: z.number().int().positive(),
  policies: z.array(GovernancePolicySchema),
  bundles: z.array(PolicyBundleSchema),
  evidence: z.array(EvidenceArtifactSchema),
  exceptions: z.array(PolicyExceptionSchema),
  baselines: z.array(z.any()),
  resources: z.array(GovernanceResourceTargetSchema).optional(),
  provenance: GovernanceProvenanceSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
