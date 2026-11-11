/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Domain Contracts & Typed Specifications
 */

// 1. Core Identifiers & Provenance
export type GovernanceSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "informational";

export type PolicyLifecycleStatus =
  | "draft"
  | "review"
  | "approved"
  | "active"
  | "deprecated"
  | "retired";

export type EvaluationStatus =
  | "pass"
  | "fail"
  | "unknown"
  | "not_applicable";

export type PolicyCategory =
  | "security"
  | "reliability"
  | "data_protection"
  | "network"
  | "api_governance"
  | "database"
  | "messaging"
  | "observability"
  | "cost"
  | "technology_standards"
  | "infrastructure";

export type GovernanceScopeLevel =
  | "organization"
  | "workspace"
  | "project"
  | "environment";

export type EnvironmentType =
  | "production"
  | "staging"
  | "development"
  | "all";

export type DataClassificationType =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export type EvidenceType =
  | "architecture_graph"
  | "security_configuration"
  | "deployment_metadata"
  | "data_classification"
  | "api_contract"
  | "telemetry_metric"
  | "audit_log"
  | "human_review"
  | "backup_verification"
  | "database_schema";

export type ExceptionStatus =
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired"
  | "revoked";

export type FrameworkSupportStrength =
  | "direct_technical_support"
  | "partial_technical_support"
  | "supporting_evidence"
  | "requires_human_assessment";

export interface GovernanceProvenance {
  source: "declared_policy" | "imported_standard" | "system_guardrail" | "modeled_governance";
  author: string;
  timestamp: string;
  graphRevision?: string;
  confirmed: boolean;
}

// 2. Policy-as-Code Declarative Rule AST
export type RuleOperator =
  | "equals"
  | "not_equals"
  | "exists"
  | "missing"
  | "greater_than"
  | "less_than"
  | "in_set"
  | "not_in_set"
  | "all"
  | "any"
  | "none"
  | "graph_reachable"
  | "graph_path_exists"
  | "relationship_count"
  | "attribute_matches";

export interface PolicyRule {
  id: string;
  targetProperty?: string;
  operator: RuleOperator;
  expectedValue?: string | number | boolean | string[];
  negate?: boolean;
  children?: PolicyRule[];
  description?: string;
}

// 3. Policy Scope
export interface GovernanceScope {
  level: GovernanceScopeLevel;
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  environments?: EnvironmentType[];
  componentTypes?: string[];
  dataClassifications?: DataClassificationType[];
  regions?: string[];
  tags?: string[];
}

// 4. Framework Reference & Control Mapping
export interface FrameworkReference {
  frameworkId: string; // e.g. "nist_800_53_r5", "soc_2_tsc_2017", "iso_27001_2022", "owasp_asvs_4", "pci_dss_4", "gdpr"
  frameworkName: string;
  frameworkVersion: string;
  controlId: string; // e.g. "AC-3", "CC6.1", "A.8.24", "V5.1.1"
  controlTitle: string;
  sourceUrl?: string;
}

export interface ControlMapping {
  framework: FrameworkReference;
  supportStrength: FrameworkSupportStrength;
  coverageNotes: string;
  disclaimer: "Non-Certification: Technical architecture verification only. Does not constitute regulatory or legal compliance certification.";
}

// 5. Governance Policy
export interface GovernancePolicy {
  id: string;
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  version: string; // Semantic version e.g. "1.2.0"
  title: string;
  description: string;
  category: PolicyCategory;
  severity: GovernanceSeverity;
  status: PolicyLifecycleStatus;
  scope: GovernanceScope;
  rule: PolicyRule;
  requiredEvidenceTypes: EvidenceType[];
  remediationGuidance: string;
  controlMappings?: ControlMapping[];
  provenance: GovernanceProvenance;
  createdAt: string;
  updatedAt: string;
}

// 6. Policy Bundles
export type StandardBundleType =
  | "baseline_architecture"
  | "production_readiness"
  | "cloud_security_guardrails"
  | "data_privacy_gdpr"
  | "zero_trust_network"
  | "financial_compliance"
  | "custom";

export interface PolicyBundle {
  id: string;
  bundleType: StandardBundleType;
  name: string;
  description: string;
  version: string;
  policyIds: string[];
  isMandatory: boolean;
  provenance: GovernanceProvenance;
}

// 7. Evidence Artifact
export interface EvidenceArtifact {
  id: string;
  evidenceType: EvidenceType;
  sourceIdentifier: string; // e.g. "graph_schema_rev_12", "aws_alb_config", "postgres_backup_plan"
  resourceId?: string;
  observedAt: string;
  freshnessWindowSeconds: number; // e.g. 86400 (24 hours)
  integrityHash: string; // SHA-256 content fingerprint
  content: Record<string, any>;
  owner: string;
  provenance: GovernanceProvenance;
}

// 8. Compensating Controls & Policy Exceptions
export interface CompensatingControl {
  id: string;
  title: string;
  description: string;
  owner: string;
  evidenceArtifactIds: string[];
  reviewStatus: "verified" | "unverified";
}

export interface ExceptionAuditEntry {
  action: "requested" | "approved" | "rejected" | "revoked" | "expired";
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface PolicyException {
  id: string;
  policyId: string;
  policyVersion: string;
  resourceScope: string[]; // Resource IDs or ["*"]
  justification: string;
  compensatingControls: CompensatingControl[];
  requesterId: string;
  approverId?: string;
  status: ExceptionStatus;
  startDate: string;
  expirationDate: string;
  isExpired: boolean;
  auditHistory: ExceptionAuditEntry[];
  provenance: GovernanceProvenance;
}

// 9. Policy Evaluation & Finding
export interface PolicyEvaluation {
  id: string;
  policyId: string;
  policyVersion: string;
  policyTitle: string;
  category: PolicyCategory;
  severity: GovernanceSeverity;
  resourceId?: string;
  resourceName?: string;
  status: EvaluationStatus;
  isApplicable: boolean;
  applicableReason?: string;
  evidenceIds: string[];
  missingEvidenceTypes: EvidenceType[];
  explanation: string;
  remediationGuidance: string;
  exceptionId?: string;
  hasActiveException: boolean;
  evaluatedAt: string;
  evaluatorVersion: string;
}

export interface GovernanceFinding {
  id: string;
  policyId: string;
  policyVersion: string;
  title: string;
  category: PolicyCategory;
  severity: GovernanceSeverity;
  affectedResourceIds: string[];
  evaluationStatus: EvaluationStatus;
  summary: string;
  rationale: string;
  remediation: string;
  hasApprovedException: boolean;
  exceptionId?: string;
  evidenceIds: string[];
  provenance: GovernanceProvenance;
}

// 10. Governance Baseline & Drift
export interface GovernanceBaseline {
  id: string;
  projectId: string;
  architectureRevision: string;
  bundleVersions: Record<string, string>;
  evaluations: PolicyEvaluation[];
  activeExceptionIds: string[];
  createdAt: string;
  createdBy: string;
}

export interface GovernanceDriftItem {
  id: string;
  policyId: string;
  resourceId?: string;
  driftType:
    | "new_policy_violation"
    | "resolved_violation"
    | "expired_exception"
    | "stale_evidence"
    | "policy_version_changed"
    | "applicability_changed";
  description: string;
  severity: GovernanceSeverity;
  baselineStatus?: EvaluationStatus;
  currentStatus?: EvaluationStatus;
  detectedAt: string;
}

export interface GovernanceDrift {
  baselineId: string;
  currentRevision: string;
  driftItems: GovernanceDriftItem[];
  totalNewViolations: number;
  totalResolvedViolations: number;
  totalExpiredExceptions: number;
  hasRegressions: boolean;
  analyzedAt: string;
}

// 11. What-If Policy Simulation
export interface PolicySimulationCandidate {
  candidatePolicyVersions?: Record<string, string>;
  candidateGraphDiff?: {
    addedNodes?: string[];
    removedNodes?: string[];
    modifiedAttributes?: Record<string, any>;
  };
  candidateExceptions?: PolicyException[];
}

export interface PolicySimulationResult {
  simulatedEvaluations: PolicyEvaluation[];
  newViolationsCount: number;
  resolvedViolationsCount: number;
  netComplianceImpact: "improved" | "degraded" | "neutral";
  details: string[];
}

// 12. Aggregate Summary & Topology
export interface GovernanceAnalysisSummary {
  totalPoliciesCount: number;
  activePoliciesCount: number;
  evaluatedRulesCount: number;
  passedCount: number;
  failedCount: number;
  unknownCount: number;
  notApplicableCount: number;
  criticalViolationsCount: number;
  highViolationsCount: number;
  mediumViolationsCount: number;
  lowViolationsCount: number;
  activeExceptionsCount: number;
  expiredExceptionsCount: number;
  staleEvidenceCount: number;
  hasBlockingViolations: boolean;
}

export interface GovernanceResourceTarget {
  id: string;
  name?: string;
  environment?: EnvironmentType;
  componentType?: string;
  dataClassification?: DataClassificationType;
  geographicRegion?: string;
  tags?: string[];
  properties?: Record<string, any>;
}

export interface GovernanceArchitectureTopology {
  id: string;
  projectId: string;
  architectureId: string;
  graphRevision: string;
  version: number;
  policies: GovernancePolicy[];
  bundles: PolicyBundle[];
  evidence: EvidenceArtifact[];
  exceptions: PolicyException[];
  baselines: GovernanceBaseline[];
  resources?: GovernanceResourceTarget[];
  provenance?: GovernanceProvenance;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceAnalysisResult {
  topologyId: string;
  summary: GovernanceAnalysisSummary;
  evaluations: PolicyEvaluation[];
  findings: GovernanceFinding[];
  drift?: GovernanceDrift;
  analyzedAt: string;
}
