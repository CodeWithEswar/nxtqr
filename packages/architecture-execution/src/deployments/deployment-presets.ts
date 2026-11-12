import type { DeploymentScenario } from "./deployment-schemas";

export interface DeploymentPresetMeta {
  id: DeploymentPresetId;
  label: string;
  description: string;
  category:
    | "strategies"
    | "health_capacity"
    | "progressive_gates"
    | "compatibility_ops";
}

export type DeploymentPresetId =
  | "recreate_success"
  | "recreate_downtime"
  | "rolling_update_success"
  | "rolling_update_surge"
  | "rolling_insufficient_capacity"
  | "readiness_failure"
  | "liveness_restart"
  | "crash_loop"
  | "blue_green_success"
  | "blue_green_switch"
  | "blue_green_rollback"
  | "canary_one_percent"
  | "multi_stage_canary"
  | "canary_latency_regression"
  | "canary_error_regression"
  | "insufficient_canary_samples"
  | "canary_gate_failure"
  | "automatic_rollback"
  | "manual_rollback"
  | "rollback_failure"
  | "paused_rollout"
  | "resumed_rollout"
  | "feature_flag_rollout"
  | "feature_flag_misconfiguration"
  | "db_expand_and_contract"
  | "incompatible_db_migration"
  | "event_schema_incompatibility"
  | "multi_service_rollout"
  | "regional_rollout"
  | "regional_rollback"
  | "routing_propagation_delay"
  | "long_lived_draining"
  | "deploy_telemetry_loss"
  | "deployment_incident_investigation"
  | "recovery_verification"
  | "strategy_comparison";

export const DEPLOYMENT_PRESET_METADATA: DeploymentPresetMeta[] = [
  { id: "recreate_success", label: "Successful Recreate", description: "Old replicas terminate completely before candidate v2 replicas become READY.", category: "strategies" },
  { id: "recreate_downtime", label: "Recreate Downtime Window", description: "Highlights noHealthyEndpoints downtime gap during Recreate termination.", category: "strategies" },
  { id: "rolling_update_success", label: "Successful Rolling Update", description: "Zero-downtime incremental replica replacement respecting availability budgets.", category: "strategies" },
  { id: "rolling_update_surge", label: "Rolling Update with 50% Surge", description: "Rounds maxSurge up and maxUnavailable down per Kubernetes semantics.", category: "strategies" },
  { id: "rolling_insufficient_capacity", label: "Rolling Update Insufficient Capacity", description: "Cluster capacity exhaustion leaves surge replicas PENDING and hits progress deadline.", category: "health_capacity" },
  { id: "readiness_failure", label: "Readiness Probe Failure", description: "Unready v2 replica is excluded from routing endpoints without restarting container.", category: "health_capacity" },
  { id: "liveness_restart", label: "Liveness Probe Restart", description: "Liveness failures exceed failureThreshold and trigger container restart.", category: "health_capacity" },
  { id: "crash_loop", label: "CrashLoopBackOff Recovery", description: "Startup crashes trigger exponential restart backoff and automated rollback.", category: "health_capacity" },
  { id: "blue_green_success", label: "Successful Blue-Green", description: "Green passes readiness and receives 100% cutover while Blue remains on standby.", category: "strategies" },
  { id: "blue_green_switch", label: "Blue-Green Instant Switch", description: "Immediate atomic routing switch from Blue v1 to verified Green v2.", category: "strategies" },
  { id: "blue_green_rollback", label: "Blue-Green Instant Rollback", description: "Standby Blue environment restores 100% traffic immediately upon v2 regression.", category: "strategies" },
  { id: "canary_one_percent", label: "Canary 1% Traffic Split", description: "Routes 1% initial cohort to candidate v2 before progressive scaling.", category: "progressive_gates" },
  { id: "multi_stage_canary", label: "Multi-Stage Canary (10%→50%→100%)", description: "Advances cleanly across weighted stages after passing sample & error gates.", category: "progressive_gates" },
  { id: "canary_latency_regression", label: "Canary Latency Regression", description: "Candidate p95 spike trips p95 latency gate and triggers automatic rollback.", category: "progressive_gates" },
  { id: "canary_error_regression", label: "Canary Error-Rate Regression", description: "Candidate error surge violates error_rate & delta gates and rolls back.", category: "progressive_gates" },
  { id: "insufficient_canary_samples", label: "Insufficient Canary Samples", description: "Gate holds rollout in INCONCLUSIVE state until minimum sample count arrives.", category: "progressive_gates" },
  { id: "canary_gate_failure", label: "Canary Gate Failure Hold", description: "Evaluates FAIL gate and pauses rollout for operator review when auto-rollback disabled.", category: "progressive_gates" },
  { id: "automatic_rollback", label: "Automatic Policy Rollback", description: "Policy detects gate breach and reverts traffic + terminates candidate replicas.", category: "progressive_gates" },
  { id: "manual_rollback", label: "Manual Operator Rollback", description: "Operator command issues explicit rollback mid-rollout.", category: "progressive_gates" },
  { id: "rollback_failure", label: "Rollback Failure (No Standby)", description: "Rollback fails when previous revision is unavailable or incompatible.", category: "compatibility_ops" },
  { id: "paused_rollout", label: "Paused Rollout", description: "Manual pause freezes stage progression without cancelling active replicas.", category: "progressive_gates" },
  { id: "resumed_rollout", label: "Paused Then Resumed Rollout", description: "Resumes cleanly from persisted canary stage without restarting from zero.", category: "progressive_gates" },
  { id: "feature_flag_rollout", label: "Feature Flag Rollout", description: "Code deployed with deterministic percentage & tenant targeting rules.", category: "compatibility_ops" },
  { id: "feature_flag_misconfiguration", label: "Feature Flag Misconfiguration", description: "Illustrates inverted default exposure when targeting rule misconfigures.", category: "compatibility_ops" },
  { id: "db_expand_and_contract", label: "Database Expand-and-Contract", description: "Compatible schema expansion supports dual v1/v2 coexistence during rollout.", category: "compatibility_ops" },
  { id: "incompatible_db_migration", label: "Incompatible DB Migration", description: "Destructive irreversible schema change triggers rollback blockage warning.", category: "compatibility_ops" },
  { id: "event_schema_incompatibility", label: "Event Schema Incompatibility", description: "Consumer contract mismatch halts rollout cleanly.", category: "compatibility_ops" },
  { id: "multi_service_rollout", label: "Multi-Service Dependency Order", description: "Payment v2 completes rollout before Checkout v2 begins.", category: "compatibility_ops" },
  { id: "regional_rollout", label: "Multi-Region Rollout", description: "Canary rolls out across us-east-1 and eu-west-1 regions.", category: "strategies" },
  { id: "regional_rollback", label: "Regional Rollback", description: "Fault localized to eu-west-1 initiates rollback safely.", category: "compatibility_ops" },
  { id: "routing_propagation_delay", label: "Routing Propagation Delay", description: "Models staggered endpoint weight propagation window before shift takes effect.", category: "health_capacity" },
  { id: "long_lived_draining", label: "Long-Lived Connection Draining", description: "Grace period allows active WebSocket/streaming connections to drain cleanly.", category: "health_capacity" },
  { id: "deploy_telemetry_loss", label: "Telemetry Loss Hold (NO_DATA)", description: "Telemetry loss produces NO_DATA gate outcome and prevents silent promotion.", category: "progressive_gates" },
  { id: "deployment_incident_investigation", label: "Deployment Incident Investigation", description: "Correlates canary regression event timeline with automated recovery.", category: "compatibility_ops" },
  { id: "recovery_verification", label: "Post-Rollback Recovery Verification", description: "Verifies stable revision handles 100% traffic cleanly after rollback completes.", category: "progressive_gates" },
  { id: "strategy_comparison", label: "Strategy Comparison Reference", description: "Baseline canary rollout contrasted against Recreate, Rolling, and Blue-Green.", category: "strategies" },
];

function buildBaseDeploymentScenario(id: DeploymentPresetId): DeploymentScenario {
  const meta =
    DEPLOYMENT_PRESET_METADATA.find((p) => p.id === id) ??
    DEPLOYMENT_PRESET_METADATA[0]!;

  return {
    version: 1,
    id: `dep_${id}`,
    presetId: id,
    label: meta.label,
    architectureRevisionId: "rev_001",
    seed: 77,
    services: [
      {
        id: "checkout",
        label: "Checkout Service",
        region: "us-east-1",
        dependencyIds: ["orders-db"],
      },
    ],
    releases: [
      {
        id: "rel_v1",
        serviceId: "checkout",
        version: "v1.0.0",
        buildId: "b-100",
        digest: "sha256:synthetic-v1",
        configRevision: "cfg-1",
        createdAtMs: 0,
        dbSchemaVersion: 1,
        apiContractVersion: "v1",
        eventSchemaVersion: 1,
      },
      {
        id: "rel_v2",
        serviceId: "checkout",
        version: "v2.0.0",
        buildId: "b-200",
        digest: "sha256:synthetic-v2",
        configRevision: "cfg-2",
        createdAtMs: 0,
        dbSchemaVersion: 1,
        apiContractVersion: "v1",
        eventSchemaVersion: 1,
      },
    ],
    revisions: [
      {
        id: "rev_v1",
        serviceId: "checkout",
        artifactId: "rel_v1",
        version: "v1",
        desiredReplicas: 3,
        cpuRequestUnits: 1,
        startupDurationMs: 20,
        drainingGraceMs: 60,
        longLivedConnections: false,
        baseLatencyMs: 42,
        baseErrorRate: 0.005,
        baseSaturationPct: 34,
        readinessProbe: {
          initialDelayMs: 10,
          periodMs: 40,
          timeoutMs: 20,
          successThreshold: 1,
          failureThreshold: 2,
        },
        livenessProbe: {
          initialDelayMs: 20,
          periodMs: 40,
          timeoutMs: 20,
          successThreshold: 1,
          failureThreshold: 2,
        },
        featureFlagDefaults: { "new-checkout": false },
        available: true,
        immutable: true,
      },
      {
        id: "rev_v2",
        serviceId: "checkout",
        artifactId: "rel_v2",
        version: "v2",
        desiredReplicas: 3,
        cpuRequestUnits: 1,
        startupDurationMs: 30,
        drainingGraceMs: 60,
        longLivedConnections: false,
        baseLatencyMs: 38,
        baseErrorRate: 0.004,
        baseSaturationPct: 32,
        readinessProbe: {
          initialDelayMs: 10,
          periodMs: 40,
          timeoutMs: 20,
          successThreshold: 1,
          failureThreshold: 2,
        },
        livenessProbe: {
          initialDelayMs: 20,
          periodMs: 40,
          timeoutMs: 20,
          successThreshold: 1,
          failureThreshold: 2,
        },
        featureFlagDefaults: { "new-checkout": true },
        available: true,
        immutable: true,
      },
    ],
    deployments: [
      {
        id: "dep_checkout_v2",
        serviceId: "checkout",
        strategy: "canary",
        stableRevisionId: "rev_v1",
        candidateRevisionId: "rev_v2",
        dependsOnDeploymentIds: [],
        maxSurge: 1,
        maxUnavailable: 0,
        clusterCapacityUnits: 12,
        routingMode: "random_weighted",
        routingPropagationDelayMs: 0,
        regions: ["us-east-1"],
        stages: [
          {
            id: "stage_10",
            targetWeightPercent: 10,
            minimumDurationMs: 120,
            minimumEligibleRequests: 2,
            promotionGateIds: ["gate_err", "gate_lat"],
          },
          {
            id: "stage_50",
            targetWeightPercent: 50,
            minimumDurationMs: 120,
            minimumEligibleRequests: 6,
            promotionGateIds: ["gate_err", "gate_lat"],
          },
          {
            id: "stage_100",
            targetWeightPercent: 100,
            minimumDurationMs: 80,
            minimumEligibleRequests: 4,
            promotionGateIds: ["gate_err"],
          },
        ],
        gates: [
          {
            id: "gate_err",
            name: "Canary Error Rate <= 2%",
            metric: "error_rate",
            maxThreshold: 0.02,
            windowType: "stage_relative",
            consecutiveRequired: 1,
            treatNoDataAsPass: false,
          },
          {
            id: "gate_lat",
            name: "Canary p95 Latency <= 180ms",
            metric: "p95_latency_ms",
            maxThreshold: 180,
            windowType: "stage_relative",
            consecutiveRequired: 1,
            treatNoDataAsPass: false,
          },
        ],
        rollbackPolicy: {
          autoRollbackOnGateFail: true,
          autoRollbackOnProgressDeadline: true,
          autoRollbackOnHealthFail: true,
          holdOnInconclusive: true,
          progressDeadlineMs: 1200,
          preserveOldRevisionAfterBlueGreen: true,
        },
      },
    ],
    featureFlags: [
      {
        id: "ff_1",
        key: "new-checkout",
        defaultValue: false,
        revision: 1,
        staleCacheDelayMs: 0,
        misconfiguredRule: false,
        rules: [
          {
            id: "r_cohort_internal",
            kind: "cohort",
            targetValues: ["internal"],
            serveValue: true,
          },
          {
            id: "r_pct_50",
            kind: "percentage",
            targetValues: [],
            percentage: 50,
            serveValue: true,
          },
        ],
      },
    ],
    traffic: {
      requestsPerSecond: 120,
      startAtMs: 0,
      endAtMs: 760,
      syntheticIdentities: [
        { id: "user-1", tenant: "tenant-a", cohort: "general", region: "us-east-1" },
        { id: "user-2", tenant: "tenant-a", cohort: "internal", region: "us-east-1" },
        { id: "user-3", tenant: "tenant-b", cohort: "beta", region: "eu-west-1" },
      ],
    },
    faults: [],
    commands: [],
    limits: {
      maxServices: 50,
      maxRevisions: 50,
      maxReplicas: 120,
      maxRolloutSteps: 20,
      maxEvents: 2500,
      maxVirtualDurationMs: 5000,
    },
  };
}

export function createDeploymentPresetScenario(
  presetId: DeploymentPresetId
): DeploymentScenario {
  const s = buildBaseDeploymentScenario(presetId);
  const dep = s.deployments[0]!;

  switch (presetId) {
    case "multi_stage_canary":
    case "strategy_comparison":
      return s;

    case "recreate_success":
    case "recreate_downtime":
      dep.strategy = "recreate";
      dep.stages = [];
      dep.gates = [];
      return s;

    case "rolling_update_success":
      dep.strategy = "rolling_update";
      dep.maxSurge = 1;
      dep.maxUnavailable = 0;
      dep.stages = [];
      return s;

    case "rolling_update_surge":
      dep.strategy = "rolling_update";
      s.revisions[0]!.desiredReplicas = 4;
      s.revisions[1]!.desiredReplicas = 4;
      dep.maxSurge = "50%";
      dep.maxUnavailable = "25%";
      dep.stages = [];
      return s;

    case "rolling_insufficient_capacity":
      dep.strategy = "rolling_update";
      dep.clusterCapacityUnits = 3; // full with 3 stable replicas
      dep.rollbackPolicy.progressDeadlineMs = 240;
      dep.stages = [];
      s.faults = [
        {
          id: "flt_cap",
          atMs: 40,
          type: "insufficient_capacity",
          description: "Cluster CPU exhausted; cannot schedule v2 surge replicas",
        },
      ];
      return s;

    case "readiness_failure":
      dep.strategy = "rolling_update";
      dep.stages = [];
      s.faults = [
        {
          id: "flt_ready",
          atMs: 80,
          durationMs: 280,
          type: "readiness_failure",
          targetRevisionId: "rev_v2",
          description: "Candidate v2 readiness probe failing cleanly without restarts",
        },
      ];
      return s;

    case "liveness_restart":
      dep.strategy = "rolling_update";
      dep.stages = [];
      s.faults = [
        {
          id: "flt_live",
          atMs: 80,
          durationMs: 120,
          type: "liveness_failure",
          targetRevisionId: "rev_v2",
          description: "Candidate v2 liveness probe failed twice -> triggers restart",
        },
      ];
      return s;

    case "crash_loop":
      dep.strategy = "rolling_update";
      dep.stages = [];
      s.faults = [
        {
          id: "flt_crash",
          atMs: 20,
          type: "crash_loop",
          targetRevisionId: "rev_v2",
          description: "Candidate v2 crashes immediately at startup (CrashLoopBackOff)",
        },
      ];
      return s;

    case "blue_green_success":
    case "blue_green_switch":
      dep.strategy = "blue_green";
      dep.stages = [];
      dep.gates = [];
      return s;

    case "blue_green_rollback":
      dep.strategy = "blue_green";
      dep.stages = [];
      s.commands = [
        {
          id: "cmd_bg_rb",
          atMs: 240,
          command: "manual_rollback",
          description: "Instant cutover back to standby Blue revision",
        },
      ];
      return s;

    case "canary_one_percent":
      dep.stages[0]!.targetWeightPercent = 1;
      dep.stages[0]!.minimumEligibleRequests = 1;
      return s;

    case "canary_latency_regression":
    case "deployment_incident_investigation":
      s.faults = [
        {
          id: "flt_lat_reg",
          atMs: 80,
          type: "latency_regression",
          targetRevisionId: "rev_v2",
          latencyMs: 360,
          description: "Candidate v2 regression adds +360ms p95 latency",
        },
      ];
      return s;

    case "canary_error_regression":
    case "automatic_rollback":
    case "recovery_verification":
      s.faults = [
        {
          id: "flt_err_reg",
          atMs: 80,
          type: "error_rate_regression",
          targetRevisionId: "rev_v2",
          errorRate: 0.35,
          description: "Candidate v2 throws 35% HTTP 500 errors",
        },
      ];
      return s;

    case "insufficient_canary_samples":
      dep.stages[0]!.targetWeightPercent = 10;
      dep.stages[0]!.minimumEligibleRequests = 500;
      dep.stages[0]!.minimumDurationMs = 900;
      return s;

    case "canary_gate_failure":
      dep.rollbackPolicy.autoRollbackOnGateFail = false;
      s.faults = [
        {
          id: "flt_gate_hold",
          atMs: 80,
          type: "error_rate_regression",
          targetRevisionId: "rev_v2",
          errorRate: 0.3,
          description: "Candidate error spike fails gate and holds rollout in PAUSED",
        },
      ];
      return s;

    case "manual_rollback":
      s.commands = [
        {
          id: "cmd_man_rb",
          atMs: 240,
          command: "manual_rollback",
          description: "Operator manually aborted canary and restored v1",
        },
      ];
      return s;

    case "rollback_failure":
      s.revisions[0]!.available = false;
      s.faults = [
        {
          id: "flt_rb_err",
          atMs: 120,
          type: "error_rate_regression",
          targetRevisionId: "rev_v2",
          errorRate: 0.35,
          description: "Regression triggers rollback while v1 artifact is unavailable",
        },
      ];
      return s;

    case "paused_rollout":
      s.commands = [
        {
          id: "cmd_pause",
          atMs: 160,
          command: "pause",
          description: "Operator paused canary before promoting to 50%",
        },
      ];
      return s;

    case "resumed_rollout":
      s.commands = [
        {
          id: "cmd_pause_1",
          atMs: 160,
          command: "pause",
          description: "Temporary pause at stage 10%",
        },
        {
          id: "cmd_resume_1",
          atMs: 320,
          command: "resume",
          description: "Resumed progressive rollout from persisted stage",
        },
      ];
      return s;

    case "feature_flag_rollout":
      dep.strategy = "feature_flag_rollout";
      dep.stages = [
        {
          id: "ff_stage_all",
          targetWeightPercent: 100,
          minimumDurationMs: 120,
          minimumEligibleRequests: 5,
          promotionGateIds: ["gate_err"],
        },
      ];
      return s;

    case "feature_flag_misconfiguration":
      dep.strategy = "feature_flag_rollout";
      s.featureFlags[0]!.misconfiguredRule = true;
      return s;

    case "db_expand_and_contract":
      dep.strategy = "rolling_update";
      dep.stages = [];
      dep.migrationPlan = {
        id: "mig_expand_contract",
        databaseId: "orders-db",
        mode: "compatible_expand_contract",
        phase: "expand",
        irreversibleMutation: false,
        rollbackCompatible: true,
      };
      return s;

    case "incompatible_db_migration":
      dep.migrationPlan = {
        id: "mig_destructive",
        databaseId: "orders-db",
        mode: "incompatible_destructive",
        phase: "contract",
        irreversibleMutation: true,
        rollbackCompatible: false,
      };
      s.faults = [
        {
          id: "flt_mig_bad",
          atMs: 120,
          type: "migration_incompatibility",
          description: "Destructive column drop breaks v1 rollback compatibility",
        },
      ];
      return s;

    case "event_schema_incompatibility":
      s.faults = [
        {
          id: "flt_evt_bad",
          atMs: 120,
          type: "event_schema_incompatibility",
          description: "Consumer rejects incompatible v2 Kafka event schema",
        },
      ];
      return s;

    case "multi_service_rollout": {
      s.services.push({
        id: "payment",
        label: "Payment Service",
        region: "us-east-1",
        dependencyIds: [],
      });
      s.revisions.push(
        { ...s.revisions[0]!, id: "pay_v1", serviceId: "payment" },
        { ...s.revisions[1]!, id: "pay_v2", serviceId: "payment" }
      );
      s.deployments = [
        {
          ...dep,
          id: "dep_payment_v2",
          serviceId: "payment",
          strategy: "rolling_update",
          stableRevisionId: "pay_v1",
          candidateRevisionId: "pay_v2",
          stages: [],
          gates: [],
        },
        {
          ...dep,
          dependsOnDeploymentIds: ["dep_payment_v2"],
        },
      ];
      return s;
    }

    case "regional_rollout":
    case "regional_rollback":
      dep.strategy = "regional_rollout";
      dep.regions = ["us-east-1", "eu-west-1"];
      if (presetId === "regional_rollback") {
        s.faults = [
          {
            id: "flt_reg_eu",
            atMs: 160,
            type: "error_rate_regression",
            targetRegion: "eu-west-1",
            errorRate: 0.4,
            description: "eu-west-1 error spike triggers rollback",
          },
        ];
      }
      return s;

    case "routing_propagation_delay":
      dep.routingPropagationDelayMs = 80;
      return s;

    case "long_lived_draining":
      dep.strategy = "rolling_update";
      dep.stages = [];
      s.revisions[0]!.longLivedConnections = true;
      s.revisions[0]!.drainingGraceMs = 160;
      return s;

    case "deploy_telemetry_loss":
      s.faults = [
        {
          id: "flt_tel_loss",
          atMs: 40,
          type: "telemetry_loss",
          description: "Collector telemetry outage renders promotion gates NO_DATA",
        },
      ];
      return s;
  }
}

