import { z } from "zod";

// ========================
// Enumerations & Primitives
// ========================

export const RecoveryArchitectureSchema = z.enum([
  "active_passive",
  "active_active",
  "warm_standby",
  "cold_standby",
  "backup_only",
]);
export type RecoveryArchitecture = z.infer<typeof RecoveryArchitectureSchema>;

export const RegionHealthStateSchema = z.enum([
  "HEALTHY",
  "DEGRADED",
  "PARTITIONED",
  "UNAVAILABLE",
  "RECOVERING",
  "RESTORED",
]);
export type RegionHealthState = z.infer<typeof RegionHealthStateSchema>;

export const FailoverLifecycleStateSchema = z.enum([
  "IDLE",
  "FAILURE_DETECTED",
  "ASSESSING",
  "FENCING_PRIMARY",
  "VALIDATING_SECONDARY",
  "PROMOTING_SECONDARY",
  "RECONFIGURING_ROUTING",
  "RESTORING_DEPENDENCIES",
  "VERIFYING",
  "COMPLETED",
  "FAILED",
  "PAUSED",
]);
export type FailoverLifecycleState = z.infer<
  typeof FailoverLifecycleStateSchema
>;

export const RestoreLifecycleStateSchema = z.enum([
  "IDLE",
  "REQUESTED",
  "VALIDATING_BACKUP",
  "PROVISIONING_TARGET",
  "RESTORING_SNAPSHOT",
  "REPLAYING_LOGS",
  "VERIFYING_INTEGRITY",
  "RESTORING_SERVICES",
  "COMPLETED",
  "FAILED",
  "PAUSED",
]);
export type RestoreLifecycleState = z.infer<
  typeof RestoreLifecycleStateSchema
>;

export const FailbackLifecycleStateSchema = z.enum([
  "IDLE",
  "REQUESTED",
  "VALIDATING_ORIGINAL_REGION",
  "REBUILDING_DATA",
  "CATCHING_UP_REPLICATION",
  "VERIFYING_CONSISTENCY",
  "RECONFIGURING_OWNERSHIP",
  "SHIFTING_TRAFFIC",
  "VERIFYING",
  "COMPLETED",
  "FAILED",
]);
export type FailbackLifecycleState = z.infer<
  typeof FailbackLifecycleStateSchema
>;

export const ReplicationModeSchema = z.enum([
  "synchronous",
  "asynchronous",
  "semi_synchronous",
  "log_based",
  "snapshot_based",
]);
export type ReplicationMode = z.infer<typeof ReplicationModeSchema>;

export const ServiceRecoveryTierSchema = z.enum([
  "tier_0_critical",
  "tier_1_high",
  "tier_2_standard",
  "tier_3_deferred",
]);
export type ServiceRecoveryTier = z.infer<typeof ServiceRecoveryTierSchema>;

export const DataLossClassificationSchema = z.enum([
  "NO_ACKNOWLEDGED_LOSS",
  "LOSS_OF_UNACKNOWLEDGED_WRITES",
  "LOSS_OF_ACKNOWLEDGED_WRITES",
  "MISSING_HISTORICAL_DATA",
  "INCONSISTENT_RECOVERED_STATE",
  "UNKNOWN",
]);
export type DataLossClassification = z.infer<
  typeof DataLossClassificationSchema
>;

// ========================
// Scenario Config Schemas
// ========================

export const AvailabilityZoneConfigSchema = z.object({
  id: z.string().min(1),
  regionId: z.string().min(1),
  healthy: z.boolean().default(true),
  capacityPct: z.number().min(0).max(100).default(50),
});
export type AvailabilityZoneConfig = z.infer<
  typeof AvailabilityZoneConfigSchema
>;

export const RecoveryRegionConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  role: z.enum(["primary", "secondary", "witness", "backup_vault"]),
  zones: z.array(AvailabilityZoneConfigSchema).min(1),
  computeCapacityRps: z.number().min(0).default(100),
  provisionedPct: z.number().min(0).max(100).default(100),
  provisioningDelayMs: z.number().min(0).default(0),
  baseLatencyMs: z.number().min(1).default(18),
  initialWeightPct: z.number().min(0).max(100).default(100),
  isIdentityPrimary: z.boolean().default(false),
});
export type RecoveryRegionConfig = z.infer<typeof RecoveryRegionConfigSchema>;

export const RegionalServiceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  kind: z.enum([
    "gateway",
    "load_balancer",
    "application",
    "database",
    "cache",
    "queue",
    "storage",
    "identity",
    "external_dep",
  ]),
  tier: ServiceRecoveryTierSchema.default("tier_0_critical"),
  regionIds: z.array(z.string()).min(1),
  dependencyIds: z.array(z.string()).default([]),
  sessionMode: z
    .enum(["stateless", "region_local", "replicated"])
    .default("stateless"),
  cacheWarmupDelayMs: z.number().min(0).default(0),
});
export type RegionalServiceConfig = z.infer<
  typeof RegionalServiceConfigSchema
>;

export const StandbyConfigurationSchema = z.object({
  computeScaleRatio: z.number().min(0).max(2).default(1),
  scaleUpDurationMs: z.number().min(0).default(0),
  storageThroughputRps: z.number().min(1).default(100),
  queueConsumerCapacityRps: z.number().min(1).default(80),
});
export type StandbyConfiguration = z.infer<typeof StandbyConfigurationSchema>;

export const RecoveryPolicyConfigSchema = z.object({
  id: z.string().min(1),
  architecture: RecoveryArchitectureSchema.default("active_passive"),
  preferredSecondaryRegionId: z.string().min(1),
  failoverMode: z.enum(["automatic", "manual"]).default("automatic"),
  routingStrategy: z.enum(["dns_failover", "global_lb"]).default("global_lb"),
  dnsTtlMs: z.number().min(0).default(120),
  probeIntervalMs: z.number().min(10).default(20),
  failureThreshold: z.number().int().min(1).default(2),
  fencingRequired: z.boolean().default(true),
  fencingMode: z
    .enum(["lease_expiry", "fencing_token", "quorum_ownership", "none"])
    .default("fencing_token"),
  allowUnsafeSplitBrainPromotion: z.boolean().default(false),
  minimumViableRecoveryEnabled: z.boolean().default(false),
  autoVerificationRequired: z.boolean().default(true),
  standby: StandbyConfigurationSchema.default({}),
  activeActiveOwnership: z
    .enum(["region_owned", "partition_owned", "single_writer", "multi_writer"])
    .default("region_owned"),
  activeActiveConflictPolicy: z
    .enum(["last_writer_wins", "reject_conflict", "manual_resolution"])
    .default("last_writer_wins"),
});
export type RecoveryPolicyConfig = z.infer<typeof RecoveryPolicyConfigSchema>;

export const RecoveryObjectiveConfigSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  targetRpoMs: z.number().min(0).default(60),
  targetRtoMs: z.number().min(0).default(220),
  rtoStartEvent: z
    .enum(["failure_detected", "failure_started"])
    .default("failure_started"),
  verificationPolicyId: z.string().default("verif_health_and_data"),
});
export type RecoveryObjectiveConfig = z.infer<
  typeof RecoveryObjectiveConfigSchema
>;

export const DrReplicationConfigSchema = z.object({
  id: z.string().min(1),
  sourceRegionId: z.string().min(1),
  targetRegionId: z.string().min(1),
  mode: ReplicationModeSchema.default("asynchronous"),
  baseLagMs: z.number().min(0).default(25),
  applyDelayMs: z.number().min(0).default(10),
  durabilityFlushDelayMs: z.number().min(0).default(10),
  quorumNodesTotal: z.number().int().min(1).default(3),
  quorumRequired: z.number().int().min(1).default(2),
});
export type DrReplicationConfig = z.infer<typeof DrReplicationConfigSchema>;

export const BackupPolicyConfigSchema = z.object({
  id: z.string().min(1),
  datasetId: z.string().min(1),
  scheduleIntervalMs: z.number().min(20).default(120),
  retentionCount: z.number().int().min(1).default(5),
  storageRegionId: z.string().min(1),
  backupType: z
    .enum(["full", "incremental", "differential"])
    .default("incremental"),
  integrityCheckEnabled: z.boolean().default(true),
  encrypted: z.boolean().default(true),
  corruptNextBackup: z.boolean().default(false),
  missingIncrementalId: z.string().optional(),
});
export type BackupPolicyConfig = z.infer<typeof BackupPolicyConfigSchema>;

export const RegionalFailureConfigSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  durationMs: z.number().min(10).optional(),
  type: z.enum([
    "region_outage",
    "az_outage",
    "network_partition",
    "secondary_outage",
    "false_positive_health_blip",
    "fencing_failure",
    "backup_corruption",
    "missing_incremental_chain",
    "restore_interruption",
    "dependency_failure",
    "identity_outage",
    "replication_spike",
    "stale_dns_cache",
    "failback_blocked_stale",
    "active_active_conflict",
  ]),
  targetRegionId: z.string().default("us-east-1"),
  targetZoneId: z.string().optional(),
  targetServiceId: z.string().optional(),
  extraLagMs: z.number().min(0).optional(),
  description: z.string().default("Synthetic disaster event"),
});
export type RegionalFailureConfig = z.infer<typeof RegionalFailureConfigSchema>;

export const DisasterRecoveryCommandSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  command: z.enum([
    "trigger_manual_failover",
    "pause_failover",
    "resume_failover",
    "trigger_backup",
    "trigger_restore",
    "pause_restore",
    "resume_restore",
    "trigger_pitr",
    "trigger_failback",
    "recover_region",
  ]),
  targetRegionId: z.string().optional(),
  backupId: z.string().optional(),
  pitrTargetMs: z.number().min(0).optional(),
  description: z.string().default("Operator recovery action"),
});
export type DisasterRecoveryCommand = z.infer<
  typeof DisasterRecoveryCommandSchema
>;

export const DisasterRecoveryScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  presetId: z.string().optional(),
  label: z.string().default("Disaster Recovery Scenario"),
  architectureRevisionId: z.string().default("rev_001"),
  seed: z.number().int().default(42),
  regions: z.array(RecoveryRegionConfigSchema).min(2),
  services: z.array(RegionalServiceConfigSchema).min(1),
  recoveryPolicies: z.array(RecoveryPolicyConfigSchema).min(1),
  replication: z.array(DrReplicationConfigSchema).min(1),
  backups: z.array(BackupPolicyConfigSchema).default([]),
  objectives: z.array(RecoveryObjectiveConfigSchema).min(1),
  failures: z.array(RegionalFailureConfigSchema).default([]),
  commands: z.array(DisasterRecoveryCommandSchema).default([]),
  trafficRps: z.number().min(1).max(400).default(60),
  limits: z.object({
    maxRegions: z.number().int().min(2).max(20).default(10),
    maxServices: z.number().int().min(1).max(120).default(100),
    maxReplicas: z.number().int().min(1).max(500).default(200),
    maxBackups: z.number().int().min(1).max(300).default(100),
    maxRecords: z.number().int().min(10).max(5000).default(1000),
    maxEvents: z.number().int().min(10).max(10000).default(2500),
    maxVirtualDurationMs: z.number().min(100).max(30000).default(900),
  }),
});
export type DisasterRecoveryScenario = z.infer<
  typeof DisasterRecoveryScenarioSchema
>;

// ========================
// Runtime Domain Models
// ========================

export interface DurableWriteRecord {
  lsn: number;
  id: string;
  atMs: number;
  regionId: string;
  acknowledgedToClient: boolean;
  durableOnPrimary: boolean;
  receivedOnSecondary: boolean;
  appliedOnSecondary: boolean;
  durableOnSecondary: boolean;
  checksum: string;
  bytes: number;
}

export interface ReplicationPosition {
  streamId: string;
  sourceRegionId: string;
  targetRegionId: string;
  mode: ReplicationMode;
  primaryCommittedLsn: number;
  secondaryReceivedLsn: number;
  secondaryAppliedLsn: number;
  secondaryDurableLsn: number;
  recordLag: number;
  byteLag: number;
  timeLagMs: number;
  applyLagMs: number;
  durableLagMs: number;
  blockedBySyncQuorum: boolean;
}

export interface FencingTokenRuntime {
  epoch: number;
  holderRegionId: string;
  fencedRegions: string[];
  mode: RecoveryPolicyConfig["fencingMode"];
  fencingEstablished: boolean;
  staleWritesRejected: number;
  splitBrainRisk: boolean;
  splitBrainReason?: string;
}

export interface BackupArtifact {
  id: string;
  datasetId: string;
  type: "full" | "incremental" | "differential";
  createdAtMs: number;
  completedAtMs: number;
  baseBackupId?: string;
  parentBackupId?: string;
  includedLogPosition: number;
  integrity: "valid" | "corrupt" | "unknown";
  checksum: string;
  storageRegionId: string;
  sizeBytes: number;
  retained: boolean;
}

export interface BackupChainValidation {
  targetBackupId: string;
  valid: boolean;
  chainIds: string[];
  missingIds: string[];
  corruptIds: string[];
  reason: string;
}

export interface RestoreOperation {
  id: string;
  state: RestoreLifecycleState;
  backupId: string;
  targetRegionId: string;
  pitrTargetMs?: number;
  targetLsn?: number;
  startedAtMs?: number;
  completedAtMs?: number;
  recordsRestored: number;
  totalRecordsToRestore: number;
  logsAppliedLsn: number;
  paused: boolean;
  integrityVerified: boolean;
  failureReason?: string;
  replayedLsnIds: number[];
}

export interface FailoverOperation {
  id: string;
  state: FailoverLifecycleState;
  architecture: RecoveryArchitecture;
  sourcePrimaryRegionId: string;
  targetSecondaryRegionId: string;
  triggerMode: "automatic" | "manual";
  failureStartedAtMs?: number;
  failureDetectedAtMs?: number;
  fencedAtMs?: number;
  promotedAtMs?: number;
  routingUpdatedAtMs?: number;
  routingConvergedAtMs?: number;
  completedAtMs?: number;
  paused: boolean;
  failureReason?: string;
  timeline: Array<{ atMs: number; phase: string; summary: string }>;
}

export interface FailbackOperation {
  id: string;
  state: FailbackLifecycleState;
  originalRegionId: string;
  activeStandbyRegionId: string;
  requestedAtMs?: number;
  completedAtMs?: number;
  dataRebuildProgressPct: number;
  replicationCatchupPct: number;
  failureReason?: string;
}

export interface RoutingConvergenceRuntime {
  strategy: "dns_failover" | "global_lb";
  dnsTtlMs: number;
  regionalWeightsPct: Record<string, number>;
  observedTrafficPct: Record<string, number>;
  staleClientsPct: number;
  failedRequestsDuringWindow: number;
  successfulRequestsDuringWindow: number;
  converged: boolean;
  convergenceDurationMs: number | null;
}

export interface DependencyRecoveryNodeState {
  serviceId: string;
  label: string;
  kind: RegionalServiceConfig["kind"];
  tier: ServiceRecoveryTier;
  dependencyIds: string[];
  recovered: boolean;
  blockedByIds: string[];
  degradedReason?: string;
  cacheColdPenaltyMs: number;
  queueBacklogDepth: number;
}

export interface ActiveActiveConflictRecord {
  id: string;
  atMs: number;
  key: string;
  regionA: string;
  regionB: string;
  policy: RecoveryPolicyConfig["activeActiveConflictPolicy"];
  resolution: "superseded_lww" | "rejected" | "manual_hold";
  discardedRegion: string;
  explanation: string;
}

export interface RecoveryObjectiveEvaluation {
  objectiveId: string;
  serviceId: string;
  targetRpoMs: number;
  targetRtoMs: number;
  achievedRpoMs: number | null;
  achievedRtoMs: number | null;
  rpoMet: boolean;
  rtoMet: boolean;
  missingAcknowledgedWrites: number;
  missingUnacknowledgedWrites: number;
  dataLossClassification: DataLossClassification;
  lastAcknowledgedWriteAtMs: number | null;
  lastRecoverableWriteAtMs: number | null;
  rtoMeasurementNote: string;
  rpoMeasurementNote: string;
}

export interface RegionRuntimeStatus {
  id: string;
  label: string;
  role: RecoveryRegionConfig["role"];
  state: RegionHealthState;
  activeZones: number;
  totalZones: number;
  provisionedPct: number;
  computeCapacityRps: number;
  effectiveCapacityRps: number;
  currentLoadRps: number;
  overloaded: boolean;
  errorRate: number;
  eligibleForPromotion: boolean;
  sessionsLostCount: number;
}

export interface RecoveryIncidentRuntime {
  id: string;
  severity: "sev1" | "sev2";
  status: "detected" | "mitigating" | "resolved";
  detectedAtMs: number;
  resolvedAtMs?: number;
  summary: string;
  evidence: Array<{ atMs: number; source: string; detail: string }>;
}

export interface RecoveryDrillReport {
  scenarioId: string;
  scenarioLabel: string;
  architecture: RecoveryArchitecture;
  objectivesMet: boolean;
  achievedRpoMs: number | null;
  achievedRtoMs: number | null;
  missingAcknowledgedWrites: number;
  capacityShortfallRps: number;
  failedControls: string[];
  successfulControls: string[];
  blockers: string[];
  recommendations: string[];
  assumptions: string[];
}

export interface DrInvariantReport {
  allPassed: boolean;
  regionTransitionsValidOk: boolean;
  replicationMonotonicOk: boolean;
  durableNeverExceedsReceivedOk: boolean;
  recoveryPointsValidOk: boolean;
  backupChainsCompleteOk: boolean;
  corruptBackupsNeverPassOk: boolean;
  logReplayOrderedOk: boolean;
  fencingBlocksStaleWritesOk: boolean;
  promotionSafetyRespectedOk: boolean;
  splitBrainExplicitOk: boolean;
  routingConvergenceValidOk: boolean;
  serviceVerificationRequiredOk: boolean;
  rpoDerivedFromDataOk: boolean;
  rtoDerivedFromEventsOk: boolean;
  failbackValidatedOk: boolean;
  cycleCheckEnforcedOk: boolean;
  violations: string[];
}

export interface DisasterRecoveryMetrics {
  virtualTimeMs: number;
  detectionTimeMs: number | null;
  fencingDurationMs: number | null;
  promotionDurationMs: number | null;
  routingConvergenceTimeMs: number | null;
  serviceRestorationTimeMs: number | null;
  achievedRpoMs: number | null;
  achievedRtoMs: number | null;
  missingAcknowledgedWrites: number;
  missingUnacknowledgedWrites: number;
  lostRequests: number;
  successfulRequests: number;
  maxReplicationLagMs: number;
  backupsValidCount: number;
  backupsCorruptCount: number;
  staleWritesRejected: number;
  standbyUtilizationPct: number;
  recoveryCapacityDeficitRps: number;
  minimumViableRecovered: boolean;
  fullRecoveryAchieved: boolean;
}

export interface ModeledDisasterRecoveryRuntimeState {
  virtualTimeMs: number;
  architecture: RecoveryArchitecture;
  regions: Record<string, RegionRuntimeStatus>;
  replicationStreams: Record<string, ReplicationPosition>;
  recentWrites: DurableWriteRecord[];
  fencing: FencingTokenRuntime;
  failover: FailoverOperation;
  failback: FailbackOperation;
  routing: RoutingConvergenceRuntime;
  backups: BackupArtifact[];
  lastChainValidation: BackupChainValidation | null;
  restore: RestoreOperation;
  dependencies: Record<string, DependencyRecoveryNodeState>;
  hasCircularDependencies: boolean;
  conflicts: ActiveActiveConflictRecord[];
  objectiveEvaluations: RecoveryObjectiveEvaluation[];
  incidents: RecoveryIncidentRuntime[];
  drillReport: RecoveryDrillReport;
  caveats: string[];
  invariants: DrInvariantReport;
  metrics: DisasterRecoveryMetrics;
}
