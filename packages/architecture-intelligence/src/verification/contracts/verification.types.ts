/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Domain Contracts, Typed Specifications & Verification Models
 */

// 1. Severity & Status Definitions
export type TestSeverity = "critical" | "high" | "medium" | "low";

export type TestStatus = "draft" | "active" | "retired";

export type TestCategory =
  | "graph_topology"
  | "component_configuration"
  | "security"
  | "reliability"
  | "availability"
  | "scalability"
  | "performance"
  | "capacity"
  | "cost"
  | "deployment"
  | "network"
  | "api_contracts"
  | "data"
  | "database"
  | "messaging"
  | "caching"
  | "observability"
  | "disaster_recovery"
  | "migration"
  | "governance";

export type TestScopeLevel =
  | "organization"
  | "workspace"
  | "project"
  | "architecture"
  | "environment"
  | "component"
  | "api"
  | "data_asset"
  | "critical_journey"
  | "region";

export interface TestScope {
  level: TestScopeLevel;
  targetIds?: string[];
  environment?: "production" | "staging" | "development" | "all";
}

// 2. Safe Declarative Assertion DSL
export type AssertionOperator =
  | "equals"
  | "not_equals"
  | "exists"
  | "missing"
  | "greater_than"
  | "less_than"
  | "in_set"
  | "all"
  | "any"
  | "none"
  | "graph_reachable"
  | "path_exists"
  | "relationship_count"
  | "evidence_present"
  | "evidence_fresh"
  | "engine_finding_absent";

export interface ArchitectureAssertion {
  operator: AssertionOperator;
  /** Property path into component data or context (e.g. "data.nodeType", "data.backupPolicy.exists") */
  path?: string;
  /** Target expected value for comparison */
  targetValue?: any;
  /** Node ID source for graph reachability or path exists */
  fromNodeId?: string;
  /** Node ID destination for graph reachability or path exists */
  toNodeId?: string;
  /** Evidence type requirement for evidence_present or evidence_fresh */
  evidenceType?: string;
  /** Max allowed age in hours for evidence_fresh */
  maxAgeHours?: number;
  /** Engine ID for engine_finding_absent (e.g. "security", "spof", "dr") */
  engine?: string;
  /** Severity threshold for finding checks */
  minSeverity?: TestSeverity;
  /** Child assertion nodes for composite operators (all, any, none) */
  children?: ArchitectureAssertion[];
}

// 3. Architecture Requirement
export interface ArchitectureRequirement {
  id: string;
  projectId: string;
  version: string;
  title: string;
  description: string;
  category: TestCategory;
  criticality: TestSeverity;
  owner: string;
  scope: TestScope;
  status: "active" | "draft" | "deprecated";
  createdAt: string;
  updatedAt: string;
}

// 4. Architecture Test & Version
export interface ArchitectureTest {
  id: string;
  projectId: string;
  version: string;
  title: string;
  description: string;
  category: TestCategory;
  scope: TestScope;
  assertion: ArchitectureAssertion;
  severity: TestSeverity;
  status: TestStatus;
  requirementIds: string[];
  requiredEvidenceTypes: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArchitectureTestVersion {
  id: string;
  testId: string;
  version: string;
  snapshot: ArchitectureTest;
  changeSummary: string;
  author: string;
  createdAt: string;
}

// 5. Architecture Test Suite
export interface ArchitectureTestSuite {
  id: string;
  projectId: string;
  version: string;
  title: string;
  description: string;
  category: string;
  /** Pinned test IDs included in this suite */
  testIds: string[];
  /** Optional dependency suites that must run prior to this suite */
  dependencySuiteIds: string[];
  status: TestStatus;
  createdBy: string;
  createdAt: string;
}

// 6. Verification Evidence
export interface VerificationEvidence {
  id: string;
  evidenceType: string;
  source: string;
  owner: string;
  architectureRevisionId: string;
  observedAt: string;
  importedAt: string;
  contentHash: string;
  freshnessWindowHours: number;
  isVerified: boolean;
  metadata?: Record<string, any>;
}

// 7. Four-State Test Evaluation Outcome
export type TestEvaluationStatus = "pass" | "fail" | "unknown" | "not_applicable";

export interface VerificationResult {
  id: string;
  testId: string;
  testVersion: string;
  architectureRevisionId: string;
  status: TestEvaluationStatus;
  applicabilityReason?: string;
  explanation: string;
  evidenceIds: string[];
  affectedComponentIds: string[];
  evaluatorVersion: string;
  evaluatedAt: string;
  durationMs: number;
}

// 8. Verification Run & Summary
export interface VerificationRunSummary {
  total: number;
  passed: number;
  failed: number;
  unknown: number;
  notApplicable: number;
  passRatePercent: number;
  executionDurationMs: number;
}

export interface VerificationRun {
  id: string;
  projectId: string;
  architectureRevisionId: string;
  suiteId?: string;
  suiteVersion?: string;
  status: "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt: string;
  evaluatorVersion: string;
  results: VerificationResult[];
  summary: VerificationRunSummary;
}

// 9. Verification Baseline & Regression Analysis
export interface VerificationBaseline {
  id: string;
  projectId: string;
  title: string;
  architectureRevisionId: string;
  runId: string;
  suiteVersion: string;
  createdAt: string;
  createdBy: string;
  description?: string;
}

export type RegressionType =
  | "new_failure"
  | "resolved_failure"
  | "new_unknown"
  | "changed_applicability"
  | "missing_evidence"
  | "changed_test_definition";

export type VerificationRegressionClassification =
  | "architecture_change"
  | "test_definition_change"
  | "evidence_change"
  | "evaluator_change"
  | "unknown";

export interface RegressionDifference {
  id: string;
  type: RegressionType;
  testId: string;
  testTitle: string;
  baselineStatus?: TestEvaluationStatus;
  candidateStatus?: TestEvaluationStatus;
  classification: VerificationRegressionClassification;
  description: string;
  affectedComponentIds: string[];
}

export interface RegressionAnalysisResult {
  baselineId: string;
  baselineRunId: string;
  candidateRunId: string;
  regressions: RegressionDifference[];
  hasRegressions: boolean;
  summary: {
    newFailuresCount: number;
    resolvedFailuresCount: number;
    newUnknownsCount: number;
    affectedComponents: string[];
  };
}

// 10. Readiness Gates & Gate Evaluation
export type GateCategory =
  | "architecture_review"
  | "production_readiness"
  | "security_readiness"
  | "reliability_readiness"
  | "migration_readiness"
  | "disaster_recovery_readiness"
  | "governance_readiness";

export type GateStatus = "passed" | "failed" | "blocked" | "unknown" | "approved_with_exception";

export interface BlockingRules {
  allowUnknown: boolean;
  blockOnAnyFailure: boolean;
  requireFreshEvidence: boolean;
  minPassRatePercent: number;
}

export interface ReadinessGate {
  id: string;
  projectId: string;
  version: string;
  title: string;
  description: string;
  category: GateCategory;
  requiredTestIds: string[];
  requiredSuiteIds: string[];
  requiredEvidenceTypes: string[];
  blockingRules: BlockingRules;
  approvalPolicyId?: string;
  status: TestStatus;
}

export interface GateException {
  id: string;
  gateId: string;
  testId: string;
  justification: string;
  compensatingControls: string;
  approvedBy: string;
  expiresAt: string;
  status: "active" | "expired" | "revoked";
}

export interface GateEvaluationResult {
  gateId: string;
  gateVersion: string;
  status: GateStatus;
  evaluatedAt: string;
  passedTestsCount: number;
  failedTestsCount: number;
  unknownTestsCount: number;
  notApplicableCount: number;
  activeExceptionsCount: number;
  blockingReasons: string[];
  notes: string[];
}

// 11. Requirement Traceability & Coverage
export interface TraceabilityItem {
  requirementId: string;
  requirementTitle: string;
  criticality: TestSeverity;
  linkedTestIds: string[];
  latestStatus: TestEvaluationStatus | "no_tests";
  coveredComponentsCount: number;
  evidenceAttachedCount: number;
}

export interface VerificationCoverageResult {
  totalRequirementsCount: number;
  coveredRequirementsCount: number;
  requirementCoveragePercent: number;
  totalComponentsCount: number;
  testedComponentsCount: number;
  componentCoveragePercent: number;
  evidenceTypesRequiredCount: number;
  evidenceTypesSuppliedCount: number;
  evidenceCoveragePercent: number;
}

// 12. Complete Verification Project & Analysis
export interface VerificationProject {
  id: string;
  name: string;
  requirements: ArchitectureRequirement[];
  tests: ArchitectureTest[];
  suites: ArchitectureTestSuite[];
  evidenceCatalog: VerificationEvidence[];
  baselines: VerificationBaseline[];
  gates: ReadinessGate[];
  exceptions: GateException[];
  runs: VerificationRun[];
}

export interface VerificationAnalysisResult {
  run: VerificationRun;
  gateEvaluations: GateEvaluationResult[];
  regressions?: RegressionAnalysisResult;
  traceability: TraceabilityItem[];
  coverage: VerificationCoverageResult;
  evaluatedAt: string;
}
