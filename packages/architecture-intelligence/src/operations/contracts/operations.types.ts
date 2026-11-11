/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Domain Contracts & Typed Interfaces
 */

// --- Operational Assets & Journeys ---

export type OperationalTier = "tier_1_mission_critical" | "tier_2_business_critical" | "tier_3_supporting";

export interface OperationalAsset {
  id: string;
  componentId: string;
  name: string;
  tier: OperationalTier;
  environment: string;
  region: string;
  ownerId: string;
  metadata?: Record<string, unknown>;
}

export interface CriticalJourney {
  id: string;
  title: string;
  description: string;
  entryPointComponentId: string;
  traversedComponentIds: string[];
  recoveryPriority: number; // 1 (highest) to 5
  maxAllowedDowntimeSeconds: number;
}

// --- Incident Scenarios & Classification ---

export type IncidentCategory =
  | "service_outage"
  | "database_outage"
  | "network_failure"
  | "dns_failure"
  | "api_gateway_failure"
  | "authentication_outage"
  | "queue_backlog"
  | "data_corruption"
  | "storage_exhaustion"
  | "regional_outage"
  | "dependency_outage"
  | "security_incident"
  | "deployment_regression"
  | "capacity_exhaustion"
  | "configuration_failure";

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

export interface ScenarioAssumption {
  id: string;
  description: string;
  isVerified: boolean;
}

export interface IncidentScenario {
  id: string;
  architectureId: string;
  architectureRevisionId: string;
  title: string;
  description: string;
  category: IncidentCategory;
  affectedComponentIds: string[];
  affectedJourneyIds: string[];
  severity: IncidentSeverity;
  assumptions: ScenarioAssumption[];
  triggerCondition: string;
  expectedFailureMode: string;
  ownerRole: string;
  playbookId?: string;
  recoveryStrategyId?: string;
  evidenceIds: string[];
  createdAt: string;
}

export interface IncidentImpact {
  scenarioId: string;
  directFailedComponentIds: string[];
  propagatedComponentIds: string[];
  impactedJourneyIds: string[];
  impactedRegions: string[];
  blastRadiusScore: number; // 0 - 100
  isCriticalJourneyDisrupted: boolean;
  propagationPath: Array<{ fromComponentId: string; toComponentId: string; reason: string }>;
}

// --- Ownership, Roles & Escalation ---

export type IncidentRole =
  | "incident_commander"
  | "technical_lead"
  | "communications_lead"
  | "recovery_engineer"
  | "scribe"
  | "observer";

export interface ResponseOwnership {
  id: string;
  serviceId: string;
  primaryOwner: string;
  secondaryOwner?: string;
  team: string;
  escalationPolicyId: string;
  onCallRotation?: string;
  lastVerifiedAt?: string;
}

export interface EscalationLevel {
  levelNumber: number;
  delayMinutes: number;
  notifyRoles: IncidentRole[];
  targetChannel: string;
  targetRoleName: string;
}

export interface EscalationPolicy {
  id: string;
  name: string;
  serviceId?: string;
  levels: EscalationLevel[];
  fallbackContact: string;
  acknowledgementTimeoutMinutes: number;
}

// --- Runbooks & Playbooks ---

export type RunbookStepType =
  | "instruction"
  | "observation"
  | "decision"
  | "verification"
  | "approval"
  | "escalation"
  | "recovery"
  | "rollback"
  | "documentation";

export interface RunbookStep {
  id: string;
  stepNumber: number;
  type: RunbookStepType;
  title: string;
  details: string;
  preconditions?: string[];
  expectedObservation?: string;
  failureBranchStepId?: string;
  isDestructive: boolean;
  requiresApproval: boolean;
  verificationGate?: string;
  estimatedMinutes?: number;
}

export interface OperationalRunbook {
  id: string;
  title: string;
  purpose: string;
  applicableComponentIds: string[];
  incidentScenarioIds: string[];
  revision: string;
  steps: RunbookStep[];
  safetyWarnings: string[];
  prerequisites: string[];
  rollbackGuidance: string;
  owner: string;
  reviewDate: string;
  isApproved: boolean;
  approvalReviewer?: string;
  tags?: string[];
}

export type RunbookCoverageStatus = "documented" | "reviewed" | "exercised" | "verified" | "missing" | "unknown";

export interface RunbookCoverageItem {
  componentId: string;
  componentName: string;
  tier: OperationalTier;
  hasRunbook: boolean;
  runbookId?: string;
  coverageStatus: RunbookCoverageStatus;
  lastExercisedAt?: string;
  evidenceId?: string;
}

// --- Disaster Recovery, Objectives & Dependencies ---

export type DisasterRecoveryStrategyType =
  | "backup_restore"
  | "pilot_light"
  | "warm_standby"
  | "hot_standby"
  | "active_passive"
  | "active_active"
  | "multi_region_failover";

export interface RecoveryObjective {
  id: string;
  serviceId: string;
  serviceName: string;
  journeyId?: string;
  rtoTargetSeconds: number;
  rpoTargetSeconds: number;
  supportingStrategyType: DisasterRecoveryStrategyType;
  observedRtoSeconds?: number;
  observedRpoSeconds?: number;
  isRtoVerified: boolean;
  isRpoVerified: boolean;
  evidenceIds: string[];
}

export interface RecoveryDependency {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  dependencyType: "infrastructure" | "identity" | "data" | "network" | "secrets";
  isBlocking: boolean;
  description?: string;
}

export interface BackupCapability {
  id: string;
  componentId: string;
  componentName: string;
  backupType: "full" | "incremental" | "snapshot" | "point_in_time" | "replication" | "object_versioning";
  scheduleExpression: string;
  retentionDays: number;
  isEncrypted: boolean;
  storageLocation: string;
  lastSuccessfulBackupAt?: string;
  lastRestoreTestAt?: string;
  restoreVerified: boolean;
  evidenceIds: string[];
}

export interface FailoverProcedure {
  id: string;
  componentId: string;
  primaryRegion: string;
  secondaryRegion: string;
  failoverType: "automatic" | "manual";
  healthCheckType: string;
  dataSyncLagMaxSeconds: number;
  failbackProcedure: string;
  readinessVerified: boolean;
  readinessNotes: string[];
}

// --- Tabletop Exercises ---

export interface TabletopInject {
  id: string;
  minuteOffset: number;
  title: string;
  eventDescription: string;
  injectedFailure: string;
  expectedResponseRole: IncidentRole;
}

export interface TabletopObservation {
  id: string;
  timestampMinute: number;
  observer: string;
  note: string;
  wasExpected: boolean;
  associatedInjectId?: string;
}

export interface TabletopExercise {
  id: string;
  title: string;
  scenarioId: string;
  facilitator: string;
  participants: Array<{ name: string; role: IncidentRole }>;
  scheduledDate: string;
  status: "scheduled" | "in_progress" | "completed";
  assumptions: string[];
  injects: TabletopInject[];
  observations: TabletopObservation[];
  findings: string[];
  actionItems: Array<{ task: string; owner: string; dueDate: string }>;
  completedAt?: string;
}

// --- Operational Evidence & Findings ---

export type OperationalEvidenceType =
  | "backup_log"
  | "restore_test"
  | "failover_drill"
  | "tabletop_record"
  | "runbook_review"
  | "telemetry_proof";

export interface OperationalEvidence {
  id: string;
  evidenceType: OperationalEvidenceType;
  sourceUri: string;
  contentHash: string;
  recordedAt: string;
  verifiedBy: string;
  notes: string;
}

export type OperationalFindingCategory =
  | "missing_runbook"
  | "missing_owner"
  | "untested_recovery"
  | "rto_unverified"
  | "rpo_unverified"
  | "recovery_dependency_cycle"
  | "missing_backup_evidence"
  | "untested_restore"
  | "stale_runbook"
  | "unmapped_critical_journey"
  | "single_region_dependency";

export interface OperationalFinding {
  id: string;
  category: OperationalFindingCategory;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedComponentIds: string[];
  remediationRecommendation: string;
}

// --- Readiness Evaluation & Dimensions ---

export type ReadinessDimension =
  | "ownership"
  | "detection"
  | "runbook_coverage"
  | "dr_strategy"
  | "backup_readiness"
  | "failover_readiness"
  | "verification_evidence"
  | "exercise_cadence";

export type ReadinessStatus = "ready" | "not_ready" | "unknown" | "not_applicable";

export interface ReadinessDimensionScore {
  dimension: ReadinessDimension;
  status: ReadinessStatus;
  passedCriteriaCount: number;
  totalCriteriaCount: number;
  coveragePercent: number; // 0 - 100
  notes: string[];
}

export interface ReadinessAssessment {
  id: string;
  architectureRevisionId: string;
  status: ReadinessStatus;
  overallScorePercent: number; // 0 - 100
  dimensionScores: ReadinessDimensionScore[];
  findings: OperationalFinding[];
  evaluatedAt: string;
  evaluatorVersion: string;
  summaryNotes: string[];
}

// --- Operational Drift ---

export interface OperationalDriftItem {
  id: string;
  itemType: "stale_runbook" | "unmapped_service" | "missing_owner" | "untested_objective" | "expired_exercise";
  severity: "critical" | "high" | "medium";
  description: string;
  affectedComponentId?: string;
  suggestedAction: string;
}

export interface OperationalDriftResult {
  hasDrift: boolean;
  driftItems: OperationalDriftItem[];
  staleRunbooksCount: number;
  unmappedServicesCount: number;
  evaluatedAt: string;
}

// --- Master Project & Analysis Result ---

export interface OperationalProject {
  id: string;
  architectureId: string;
  architectureRevisionId: string;
  title: string;
  scenarios: IncidentScenario[];
  journeys: CriticalJourney[];
  ownerships: ResponseOwnership[];
  escalationPolicies: EscalationPolicy[];
  runbooks: OperationalRunbook[];
  objectives: RecoveryObjective[];
  dependencies: RecoveryDependency[];
  backupCapabilities: BackupCapability[];
  failoverProcedures: FailoverProcedure[];
  tabletopExercises: TabletopExercise[];
  evidence: OperationalEvidence[];
}

export interface RecoveryPlanResult {
  criticalPathSeconds: number;
  criticalPathStepsCount: number;
  hasCycles: boolean;
  topologicalSequence: string[];
  cycleComponentIds?: string[];
}

export interface OperationalSummary {
  totalScenariosCount: number;
  totalRunbooksCount: number;
  approvedRunbooksCount: number;
  totalCriticalJourneysCount: number;
  tier1CoveragePercent: number;
  verifiedObjectivesCount: number;
  unverifiedObjectivesCount: number;
  criticalFindingsCount: number;
  highFindingsCount: number;
  overallReadinessStatus: ReadinessStatus;
}

export interface OperationsAnalysisResult {
  project: OperationalProject;
  impactAnalyses: IncidentImpact[];
  runbookCoverage: RunbookCoverageItem[];
  recoveryPlan: RecoveryPlanResult;
  readiness: ReadinessAssessment;
  drift: OperationalDriftResult;
  summary: OperationalSummary;
}
