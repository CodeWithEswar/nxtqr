/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Zod Runtime Validation Schemas
 */

import { z } from "zod";

export const OperationalTierSchema = z.enum([
  "tier_1_mission_critical",
  "tier_2_business_critical",
  "tier_3_supporting",
]);

export const OperationalAssetSchema = z.object({
  id: z.string().min(1),
  componentId: z.string().min(1),
  name: z.string().min(1),
  tier: OperationalTierSchema,
  environment: z.string().min(1),
  region: z.string().min(1),
  ownerId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const CriticalJourneySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  entryPointComponentId: z.string().min(1),
  traversedComponentIds: z.array(z.string()),
  recoveryPriority: z.number().int().min(1).max(5),
  maxAllowedDowntimeSeconds: z.number().nonnegative(),
});

export const IncidentCategorySchema = z.enum([
  "service_outage",
  "database_outage",
  "network_failure",
  "dns_failure",
  "api_gateway_failure",
  "authentication_outage",
  "queue_backlog",
  "data_corruption",
  "storage_exhaustion",
  "regional_outage",
  "dependency_outage",
  "security_incident",
  "deployment_regression",
  "capacity_exhaustion",
  "configuration_failure",
]);

export const IncidentSeveritySchema = z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]);

export const ScenarioAssumptionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  isVerified: z.boolean(),
});

export const IncidentScenarioSchema = z.object({
  id: z.string().min(1),
  architectureId: z.string().min(1),
  architectureRevisionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: IncidentCategorySchema,
  affectedComponentIds: z.array(z.string()),
  affectedJourneyIds: z.array(z.string()),
  severity: IncidentSeveritySchema,
  assumptions: z.array(ScenarioAssumptionSchema),
  triggerCondition: z.string().min(1),
  expectedFailureMode: z.string().min(1),
  ownerRole: z.string().min(1),
  playbookId: z.string().optional(),
  recoveryStrategyId: z.string().optional(),
  evidenceIds: z.array(z.string()),
  createdAt: z.string(),
});

export const IncidentImpactSchema = z.object({
  scenarioId: z.string().min(1),
  directFailedComponentIds: z.array(z.string()),
  propagatedComponentIds: z.array(z.string()),
  impactedJourneyIds: z.array(z.string()),
  impactedRegions: z.array(z.string()),
  blastRadiusScore: z.number().min(0).max(100),
  isCriticalJourneyDisrupted: z.boolean(),
  propagationPath: z.array(
    z.object({
      fromComponentId: z.string(),
      toComponentId: z.string(),
      reason: z.string(),
    })
  ),
});

export const IncidentRoleSchema = z.enum([
  "incident_commander",
  "technical_lead",
  "communications_lead",
  "recovery_engineer",
  "scribe",
  "observer",
]);

export const ResponseOwnershipSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  primaryOwner: z.string().min(1),
  secondaryOwner: z.string().optional(),
  team: z.string().min(1),
  escalationPolicyId: z.string().min(1),
  onCallRotation: z.string().optional(),
  lastVerifiedAt: z.string().optional(),
});

export const EscalationLevelSchema = z.object({
  levelNumber: z.number().int().min(1),
  delayMinutes: z.number().nonnegative(),
  notifyRoles: z.array(IncidentRoleSchema),
  targetChannel: z.string().min(1),
  targetRoleName: z.string().min(1),
});

export const EscalationPolicySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  serviceId: z.string().optional(),
  levels: z.array(EscalationLevelSchema),
  fallbackContact: z.string().min(1),
  acknowledgementTimeoutMinutes: z.number().positive(),
});

export const RunbookStepTypeSchema = z.enum([
  "instruction",
  "observation",
  "decision",
  "verification",
  "approval",
  "escalation",
  "recovery",
  "rollback",
  "documentation",
]);

export const RunbookStepSchema = z.object({
  id: z.string().min(1),
  stepNumber: z.number().int().min(1),
  type: RunbookStepTypeSchema,
  title: z.string().min(1),
  details: z.string().min(1),
  preconditions: z.array(z.string()).optional(),
  expectedObservation: z.string().optional(),
  failureBranchStepId: z.string().optional(),
  isDestructive: z.boolean(),
  requiresApproval: z.boolean(),
  verificationGate: z.string().optional(),
  estimatedMinutes: z.number().nonnegative().optional(),
});

export const OperationalRunbookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  purpose: z.string().min(1),
  applicableComponentIds: z.array(z.string()),
  incidentScenarioIds: z.array(z.string()),
  revision: z.string().min(1),
  steps: z.array(RunbookStepSchema),
  safetyWarnings: z.array(z.string()),
  prerequisites: z.array(z.string()),
  rollbackGuidance: z.string().min(1),
  owner: z.string().min(1),
  reviewDate: z.string().min(1),
  isApproved: z.boolean(),
  approvalReviewer: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DisasterRecoveryStrategyTypeSchema = z.enum([
  "backup_restore",
  "pilot_light",
  "warm_standby",
  "hot_standby",
  "active_passive",
  "active_active",
  "multi_region_failover",
]);

export const RecoveryObjectiveSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  serviceName: z.string().min(1),
  journeyId: z.string().optional(),
  rtoTargetSeconds: z.number().nonnegative(),
  rpoTargetSeconds: z.number().nonnegative(),
  supportingStrategyType: DisasterRecoveryStrategyTypeSchema,
  observedRtoSeconds: z.number().nonnegative().optional(),
  observedRpoSeconds: z.number().nonnegative().optional(),
  isRtoVerified: z.boolean(),
  isRpoVerified: z.boolean(),
  evidenceIds: z.array(z.string()),
});

export const RecoveryDependencySchema = z.object({
  id: z.string().min(1),
  sourceComponentId: z.string().min(1),
  targetComponentId: z.string().min(1),
  dependencyType: z.enum(["infrastructure", "identity", "data", "network", "secrets"]),
  isBlocking: z.boolean(),
  description: z.string().optional(),
});

export const BackupCapabilitySchema = z.object({
  id: z.string().min(1),
  componentId: z.string().min(1),
  componentName: z.string().min(1),
  backupType: z.enum(["full", "incremental", "snapshot", "point_in_time", "replication", "object_versioning"]),
  scheduleExpression: z.string().min(1),
  retentionDays: z.number().int().positive(),
  isEncrypted: z.boolean(),
  storageLocation: z.string().min(1),
  lastSuccessfulBackupAt: z.string().optional(),
  lastRestoreTestAt: z.string().optional(),
  restoreVerified: z.boolean(),
  evidenceIds: z.array(z.string()),
});

export const FailoverProcedureSchema = z.object({
  id: z.string().min(1),
  componentId: z.string().min(1),
  primaryRegion: z.string().min(1),
  secondaryRegion: z.string().min(1),
  failoverType: z.enum(["automatic", "manual"]),
  healthCheckType: z.string().min(1),
  dataSyncLagMaxSeconds: z.number().nonnegative(),
  failbackProcedure: z.string().min(1),
  readinessVerified: z.boolean(),
  readinessNotes: z.array(z.string()),
});

export const TabletopInjectSchema = z.object({
  id: z.string().min(1),
  minuteOffset: z.number().int().nonnegative(),
  title: z.string().min(1),
  eventDescription: z.string().min(1),
  injectedFailure: z.string().min(1),
  expectedResponseRole: IncidentRoleSchema,
});

export const TabletopObservationSchema = z.object({
  id: z.string().min(1),
  timestampMinute: z.number().int().nonnegative(),
  observer: z.string().min(1),
  note: z.string().min(1),
  wasExpected: z.boolean(),
  associatedInjectId: z.string().optional(),
});

export const TabletopExerciseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  scenarioId: z.string().min(1),
  facilitator: z.string().min(1),
  participants: z.array(z.object({ name: z.string(), role: IncidentRoleSchema })),
  scheduledDate: z.string().min(1),
  status: z.enum(["scheduled", "in_progress", "completed"]),
  assumptions: z.array(z.string()),
  injects: z.array(TabletopInjectSchema),
  observations: z.array(TabletopObservationSchema),
  findings: z.array(z.string()),
  actionItems: z.array(z.object({ task: z.string(), owner: z.string(), dueDate: z.string() })),
  completedAt: z.string().optional(),
});

export const OperationalFindingSchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    "missing_runbook",
    "missing_owner",
    "untested_recovery",
    "rto_unverified",
    "rpo_unverified",
    "recovery_dependency_cycle",
    "missing_backup_evidence",
    "untested_restore",
    "stale_runbook",
    "unmapped_critical_journey",
    "single_region_dependency",
  ]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  title: z.string().min(1),
  description: z.string().min(1),
  affectedComponentIds: z.array(z.string()),
  remediationRecommendation: z.string().min(1),
});

export const ReadinessDimensionSchema = z.enum([
  "ownership",
  "detection",
  "runbook_coverage",
  "dr_strategy",
  "backup_readiness",
  "failover_readiness",
  "verification_evidence",
  "exercise_cadence",
]);

export const ReadinessStatusSchema = z.enum(["ready", "not_ready", "unknown", "not_applicable"]);

export const ReadinessDimensionScoreSchema = z.object({
  dimension: ReadinessDimensionSchema,
  status: ReadinessStatusSchema,
  passedCriteriaCount: z.number().int().nonnegative(),
  totalCriteriaCount: z.number().int().positive(),
  coveragePercent: z.number().min(0).max(100),
  notes: z.array(z.string()),
});

export const ReadinessAssessmentSchema = z.object({
  id: z.string().min(1),
  architectureRevisionId: z.string().min(1),
  status: ReadinessStatusSchema,
  overallScorePercent: z.number().min(0).max(100),
  dimensionScores: z.array(ReadinessDimensionScoreSchema),
  findings: z.array(OperationalFindingSchema),
  evaluatedAt: z.string(),
  evaluatorVersion: z.string(),
  summaryNotes: z.array(z.string()),
});

export const OperationsAnalysisResultSchema = z.object({
  project: z.any(),
  impactAnalyses: z.array(IncidentImpactSchema),
  runbookCoverage: z.array(z.any()),
  recoveryPlan: z.object({
    criticalPathSeconds: z.number().nonnegative(),
    criticalPathStepsCount: z.number().int().nonnegative(),
    hasCycles: z.boolean(),
    topologicalSequence: z.array(z.string()),
    cycleComponentIds: z.array(z.string()).optional(),
  }),
  readiness: ReadinessAssessmentSchema,
  drift: z.any(),
  summary: z.any(),
});

