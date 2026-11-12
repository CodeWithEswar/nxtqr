import { z } from "zod";

// ========================
// Enums & State Machines
// ========================

export const DeploymentStrategySchema = z.enum([
  "recreate",
  "rolling_update",
  "blue_green",
  "canary",
  "progressive_delivery",
  "regional_rollout",
  "feature_flag_rollout",
]);
export type DeploymentStrategy = z.infer<typeof DeploymentStrategySchema>;

export type DeploymentLifecycleState =
  | "CREATED"
  | "VALIDATING"
  | "SCHEDULED"
  | "STARTING"
  | "PROGRESSING"
  | "PAUSED"
  | "PROMOTING"
  | "COMPLETED"
  | "ROLLING_BACK"
  | "ROLLED_BACK"
  | "FAILED"
  | "CANCELLED";

export type DeployReplicaLifecycleState =
  | "PENDING"
  | "SCHEDULING"
  | "STARTING"
  | "RUNNING_NOT_READY"
  | "READY"
  | "TERMINATING"
  | "TERMINATED"
  | "FAILED";

export type RollbackLifecycleState =
  | "NONE"
  | "REQUESTED"
  | "VALIDATING"
  | "ROUTING_REVERTING"
  | "CAPACITY_RESTORING"
  | "VERIFYING"
  | "COMPLETED"
  | "FAILED";

export type GateOutcome = "PASS" | "FAIL" | "INCONCLUSIVE" | "NO_DATA" | "ERROR";

// ========================
// Config Schemas
// ========================

export const DeployProbeConfigSchema = z.object({
  initialDelayMs: z.number().min(0).default(20),
  periodMs: z.number().min(10).default(40),
  timeoutMs: z.number().min(5).default(25),
  successThreshold: z.number().int().min(1).default(1),
  failureThreshold: z.number().int().min(1).default(2),
});
export type DeployProbeConfig = z.infer<typeof DeployProbeConfigSchema>;

export const ReleaseArtifactSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  version: z.string().min(1),
  buildId: z.string().default("build-001"),
  digest: z.string().default("sha256:synthetic-001"),
  configRevision: z.string().default("cfg-v1"),
  createdAtMs: z.number().min(0).default(0),
  dbSchemaVersion: z.number().int().min(1).default(1),
  apiContractVersion: z.string().default("v1"),
  eventSchemaVersion: z.number().int().min(1).default(1),
});
export type ReleaseArtifact = z.infer<typeof ReleaseArtifactSchema>;

export const ApplicationRevisionSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  artifactId: z.string().min(1),
  version: z.string().min(1),
  desiredReplicas: z.number().int().min(1).max(100).default(3),
  cpuRequestUnits: z.number().min(0.1).max(32).default(1),
  startupDurationMs: z.number().min(0).default(40),
  drainingGraceMs: z.number().min(0).default(50),
  longLivedConnections: z.boolean().default(false),
  baseLatencyMs: z.number().min(1).max(5000).default(45),
  baseErrorRate: z.number().min(0).max(1).default(0.005),
  baseSaturationPct: z.number().min(0).max(100).default(35),
  readinessProbe: DeployProbeConfigSchema.default({}),
  livenessProbe: DeployProbeConfigSchema.default({}),
  startupProbe: DeployProbeConfigSchema.optional(),
  featureFlagDefaults: z.record(z.boolean()).default({}),
  available: z.boolean().default(true),
  immutable: z.literal(true).default(true),
});
export type ApplicationRevision = z.infer<typeof ApplicationRevisionSchema>;

export const CanaryStageConfigSchema = z.object({
  id: z.string().min(1),
  targetWeightPercent: z.number().min(0).max(100),
  minimumDurationMs: z.number().min(0).default(80),
  minimumEligibleRequests: z.number().int().min(0).default(10),
  promotionGateIds: z.array(z.string()).default([]),
  cohortTag: z.string().optional(),
});
export type CanaryStageConfig = z.infer<typeof CanaryStageConfigSchema>;

export const PromotionGateConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  metric: z
    .enum([
      "error_rate",
      "error_rate_delta",
      "p95_latency_ms",
      "p99_latency_ms",
      "slo_compliance",
      "saturation_pct",
      "manual_approval",
    ])
    .default("error_rate"),
  maxThreshold: z.number().optional(),
  minThreshold: z.number().optional(),
  windowType: z.enum(["fixed", "rolling", "stage_relative"]).default("stage_relative"),
  consecutiveRequired: z.number().int().min(1).default(1),
  treatNoDataAsPass: z.boolean().default(false),
  manualApproved: z.boolean().optional(),
});
export type PromotionGateConfig = z.infer<typeof PromotionGateConfigSchema>;

export const RollbackPolicyConfigSchema = z.object({
  autoRollbackOnGateFail: z.boolean().default(true),
  autoRollbackOnProgressDeadline: z.boolean().default(true),
  autoRollbackOnHealthFail: z.boolean().default(true),
  holdOnInconclusive: z.boolean().default(true),
  progressDeadlineMs: z.number().min(50).default(1500),
  preserveOldRevisionAfterBlueGreen: z.boolean().default(true),
});
export type RollbackPolicyConfig = z.infer<typeof RollbackPolicyConfigSchema>;

export const FeatureFlagRuleSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["percentage", "tenant", "cohort", "region", "prerequisite"]),
  targetValues: z.array(z.string()).default([]),
  percentage: z.number().min(0).max(100).optional(),
  prerequisiteFlagKey: z.string().optional(),
  serveValue: z.boolean().default(true),
});

export const FeatureFlagConfigSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  defaultValue: z.boolean().default(false),
  revision: z.number().int().min(1).default(1),
  staleCacheDelayMs: z.number().min(0).default(0),
  misconfiguredRule: z.boolean().default(false),
  rules: z.array(FeatureFlagRuleSchema).default([]),
});
export type FeatureFlagConfig = z.infer<typeof FeatureFlagConfigSchema>;

export const SchemaMigrationPlanSchema = z.object({
  id: z.string().min(1),
  databaseId: z.string().default("orders-db"),
  mode: z
    .enum(["compatible_expand_contract", "incompatible_destructive"])
    .default("compatible_expand_contract"),
  phase: z
    .enum(["none", "expand", "backfill", "switch", "contract"])
    .default("expand"),
  irreversibleMutation: z.boolean().default(false),
  rollbackCompatible: z.boolean().default(true),
});
export type SchemaMigrationPlan = z.infer<typeof SchemaMigrationPlanSchema>;

export const DeploymentFaultConfigSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  durationMs: z.number().min(10).optional(),
  type: z.enum([
    "replica_startup_failure",
    "readiness_failure",
    "liveness_failure",
    "crash_loop",
    "image_pull_failure",
    "insufficient_capacity",
    "routing_misconfiguration",
    "routing_propagation_delay",
    "latency_regression",
    "error_rate_regression",
    "dependency_incompatibility",
    "migration_incompatibility",
    "event_schema_incompatibility",
    "feature_flag_misconfiguration",
    "region_failure",
    "telemetry_loss",
    "rollback_failure",
  ]),
  targetRevisionId: z.string().optional(),
  targetRegion: z.string().optional(),
  errorRate: z.number().min(0).max(1).optional(),
  latencyMs: z.number().min(1).optional(),
  description: z.string().default("Simulated deployment fault"),
});
export type DeploymentFaultConfig = z.infer<typeof DeploymentFaultConfigSchema>;

export const DeploymentCommandSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  command: z.enum(["pause", "resume", "manual_rollback", "cancel", "approve_gate"]),
  gateId: z.string().optional(),
  description: z.string().default("Operator command"),
});

export const DeploymentConfigSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  strategy: DeploymentStrategySchema.default("rolling_update"),
  stableRevisionId: z.string().min(1),
  candidateRevisionId: z.string().min(1),
  dependsOnDeploymentIds: z.array(z.string()).default([]),
  maxSurge: z.union([z.number().int().min(0), z.string()]).default(1),
  maxUnavailable: z.union([z.number().int().min(0), z.string()]).default(0),
  clusterCapacityUnits: z.number().min(1).default(12),
  routingMode: z.enum(["random_weighted", "header_cohort", "region_cohort"]).default("random_weighted"),
  routingPropagationDelayMs: z.number().min(0).default(0),
  regions: z.array(z.string()).default(["us-east-1"]),
  stages: z.array(CanaryStageConfigSchema).default([]),
  gates: z.array(PromotionGateConfigSchema).default([]),
  rollbackPolicy: RollbackPolicyConfigSchema.default({}),
  migrationPlan: SchemaMigrationPlanSchema.optional(),
});
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;

export const DeploymentServiceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  region: z.string().default("us-east-1"),
  dependencyIds: z.array(z.string()).default([]),
});

export const DeploymentScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  presetId: z.string().optional(),
  label: z.string().default("Deployment Scenario"),
  architectureRevisionId: z.string().default("rev_001"),
  seed: z.number().int().default(42),
  services: z.array(DeploymentServiceConfigSchema).min(1),
  releases: z.array(ReleaseArtifactSchema).default([]),
  revisions: z.array(ApplicationRevisionSchema).min(1),
  deployments: z.array(DeploymentConfigSchema).min(1),
  featureFlags: z.array(FeatureFlagConfigSchema).default([]),
  traffic: z.object({
    requestsPerSecond: z.number().min(1).max(500).default(40),
    startAtMs: z.number().min(0).default(0),
    endAtMs: z.number().min(100).default(800),
    syntheticIdentities: z
      .array(z.object({ id: z.string(), tenant: z.string(), cohort: z.string(), region: z.string() }))
      .default([
        { id: "user-1", tenant: "tenant-a", cohort: "general", region: "us-east-1" },
        { id: "user-2", tenant: "tenant-a", cohort: "internal", region: "us-east-1" },
        { id: "user-3", tenant: "tenant-b", cohort: "beta", region: "eu-west-1" },
      ]),
  }),
  faults: z.array(DeploymentFaultConfigSchema).default([]),
  commands: z.array(DeploymentCommandSchema).default([]),
  limits: z.object({
    maxServices: z.number().int().min(1).max(100).default(50),
    maxRevisions: z.number().int().min(1).max(200).default(50),
    maxReplicas: z.number().int().min(1).max(500).default(120),
    maxRolloutSteps: z.number().int().min(1).max(100).default(20),
    maxEvents: z.number().int().min(10).max(10000).default(2500),
    maxVirtualDurationMs: z.number().min(100).max(30000).default(5000),
  }),
});
export type DeploymentScenario = z.infer<typeof DeploymentScenarioSchema>;

// ========================
// Runtime Domain Models
// ========================

export interface DeployReplicaRuntime {
  id: string;
  serviceId: string;
  revisionId: string;
  region: string;
  nodeId: string;
  state: DeployReplicaLifecycleState;
  startedAtMs: number;
  readyAtMs?: number;
  readinessPassed: boolean;
  livenessPassed: boolean;
  startupPassed: boolean;
  consecutiveReadinessFailures: number;
  consecutiveLivenessFailures: number;
  restartCount: number;
  nextRestartAtMs?: number;
  drainingStartedAtMs?: number;
  activeRequests: number;
  longLivedSessions: number;
}

export interface DeployProbeResult {
  id: string;
  atMs: number;
  replicaId: string;
  probeType: "startup" | "readiness" | "liveness";
  passed: boolean;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  transitionNote: string;
}

export interface TrafficAllocationRuntime {
  serviceId: string;
  weights: Array<{ revisionId: string; percentage: number }>;
  noHealthyEndpoints: boolean;
  propagationPendingUntilMs?: number;
}

export interface GateEvaluationRuntime {
  gateId: string;
  gateName: string;
  metric: PromotionGateConfig["metric"];
  evaluatedAtMs: number;
  observedValue: number | null;
  baselineValue: number | null;
  thresholdLabel: string;
  sampleCount: number;
  outcome: GateOutcome;
  consecutivePasses: number;
  explanation: string;
}

export interface RollbackOperationRuntime {
  state: RollbackLifecycleState;
  reason?: string;
  fromRevisionId: string;
  toRevisionId: string;
  requestedAtMs?: number;
  completedAtMs?: number;
  failureReason?: string;
  irreversibleDataWarning: boolean;
}

export interface FeatureFlagEvalRuntime {
  key: string;
  revision: number;
  misconfigured: boolean;
  sampleResults: Array<{
    identityId: string;
    region: string;
    cohort: string;
    enabled: boolean;
    ruleMatched: string;
  }>;
}

export interface RevisionTelemetryStats {
  revisionId: string;
  version: string;
  requests: number;
  errors: number;
  errorRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  saturationPct: number;
  observedSharePct: number;
}

export interface DeploymentRuntimeInstance {
  id: string;
  serviceId: string;
  strategy: DeploymentStrategy;
  state: DeploymentLifecycleState;
  stableRevisionId: string;
  candidateRevisionId: string;
  activeEnvironment: "blue" | "green";
  currentStageIndex: number;
  totalStages: number;
  currentStageId?: string;
  stageStartedAtMs: number;
  targetCandidateWeightPct: number;
  observedCandidateWeightPct: number;
  maxSurgeCount: number;
  maxUnavailableCount: number;
  desiredReplicas: number;
  availableReplicas: number;
  readyStableReplicas: number;
  readyCandidateReplicas: number;
  surgeReplicas: number;
  unavailableReplicas: number;
  pendingCapacityReplicas: number;
  paused: boolean;
  pauseReason?: string;
  gateEvaluations: GateEvaluationRuntime[];
  rollback: RollbackOperationRuntime;
  migrationStatus: string;
  compatibilityStatus: "compatible" | "incompatible_api" | "incompatible_event" | "incompatible_db";
  regionalStatus: Record<string, { weightPct: number; healthy: boolean; rolledBack: boolean }>;
  timeline: Array<{ atMs: number; kind: string; summary: string }>;
}

export interface DeployIncidentRuntime {
  id: string;
  deploymentId: string;
  severity: "sev1" | "sev2";
  status: "detected" | "mitigating" | "resolved";
  detectedAtMs: number;
  resolvedAtMs?: number;
  correlatedRevisionId: string;
  causalStatus: "temporal_correlation" | "verified_simulated_causal";
  summary: string;
  evidence: Array<{ atMs: number; source: string; detail: string }>;
}

export interface DeploymentPostureMetrics {
  virtualTimeMs: number;
  activeDeployments: number;
  completedDeployments: number;
  rolledBackDeployments: number;
  failedDeployments: number;
  totalReplicas: number;
  readyReplicas: number;
  unreadyReplicas: number;
  restartsTriggered: number;
  totalRequests: number;
  totalErrors: number;
  candidateErrorRate: number;
  stableErrorRate: number;
  candidateP95Ms: number;
  stableP95Ms: number;
  gatesPassed: number;
  gatesFailed: number;
  gatesInconclusiveOrNoData: number;
  deploymentDurationMs: number | null;
  rollbackDurationMs: number | null;
}

export interface DeployInvariantReport {
  allPassed: boolean;
  revisionsImmutableOk: boolean;
  replicaTransitionsValidOk: boolean;
  unreadyNotRoutedOk: boolean;
  rollingBudgetsRespectedOk: boolean;
  trafficWeightsValidOk: boolean;
  canaryGatesRespectedOk: boolean;
  missingSamplesNeverSilentPassOk: boolean;
  failedGateBlocksPromotionOk: boolean;
  rollbackEligibleRevisionOk: boolean;
  rollbackPreservesIrreversibleDataOk: boolean;
  pausedDoesNotAdvanceOk: boolean;
  featureFlagDeterministicOk: boolean;
  metricsFromEventsOk: boolean;
  violations: string[];
}

export interface ModeledDeploymentRuntimeState {
  virtualTimeMs: number;
  deployments: Record<string, DeploymentRuntimeInstance>;
  revisions: Record<string, ApplicationRevision>;
  replicas: Record<string, DeployReplicaRuntime>;
  recentProbes: DeployProbeResult[];
  trafficAllocations: Record<string, TrafficAllocationRuntime>;
  revisionStats: Record<string, RevisionTelemetryStats>;
  featureFlags: FeatureFlagEvalRuntime[];
  incidents: DeployIncidentRuntime[];
  caveats: string[];
  invariants: DeployInvariantReport;
  metrics: DeploymentPostureMetrics;
}

