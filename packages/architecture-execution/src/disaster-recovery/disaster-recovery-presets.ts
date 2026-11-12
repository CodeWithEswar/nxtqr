import type { DisasterRecoveryScenario } from "./disaster-recovery-schemas";

export interface DisasterRecoveryPresetMeta {
  id: DisasterRecoveryPresetId;
  label: string;
  description: string;
  category:
    | "architectures"
    | "failures_fencing"
    | "replication_rpo"
    | "backups_restore"
    | "routing_continuity";
}

export type DisasterRecoveryPresetId =
  | "healthy_active_passive"
  | "healthy_active_active"
  | "warm_standby"
  | "cold_standby"
  | "single_az_outage"
  | "complete_regional_outage"
  | "regional_network_partition"
  | "delayed_failure_detection"
  | "false_positive_detection"
  | "auto_failover_success"
  | "manual_failover_success"
  | "secondary_unavailable"
  | "insufficient_standby_capacity"
  | "sync_replication"
  | "async_replication_lag"
  | "acknowledged_write_loss"
  | "zero_acknowledged_loss"
  | "split_brain_risk"
  | "successful_fencing"
  | "failed_fencing"
  | "dns_failover"
  | "stale_dns_cache"
  | "glb_failover"
  | "session_loss_failover"
  | "cache_cold_start_recovery"
  | "queue_backlog_recovery"
  | "backup_restoration"
  | "corrupted_backup"
  | "missing_incremental_backup"
  | "pitr_recovery"
  | "interrupted_restore"
  | "dependency_recovery_failure"
  | "rpo_exceeded"
  | "rto_exceeded"
  | "successful_failback"
  | "failed_failback"
  | "active_active_conflict"
  | "dr_drill"
  | "recovery_incident_rca"
  | "dr_strategy_comparison";

export const DISASTER_RECOVERY_PRESET_METADATA: DisasterRecoveryPresetMeta[] = [
  { id: "healthy_active_passive", label: "Healthy Active-Passive", description: "Baseline active-passive cluster with primary serving 100% and standby replicating continuously.", category: "architectures" },
  { id: "healthy_active_active", label: "Healthy Active-Active", description: "Multi-region simultaneous serving with configured write ownership and conflict policy.", category: "architectures" },
  { id: "warm_standby", label: "Warm Standby Scale-Up", description: "Partially provisioned standby scales to full capacity during regional failover.", category: "architectures" },
  { id: "cold_standby", label: "Cold Standby Provisioning", description: "Zero running compute in secondary requires full provisioning and restore latency.", category: "architectures" },
  { id: "single_az_outage", label: "Single Availability-Zone Outage", description: "Single AZ fails inside primary region; regional capacity degrades without full failover.", category: "failures_fencing" },
  { id: "complete_regional_outage", label: "Complete Regional Outage", description: "Entire primary region becomes UNAVAILABLE; full automatic failover restores service.", category: "failures_fencing" },
  { id: "regional_network_partition", label: "Regional Network Partition", description: "Primary is partitioned from standby while still alive locally, requiring fencing.", category: "failures_fencing" },
  { id: "delayed_failure_detection", label: "Delayed Failure Detection", description: "Long probe intervals delay failover detection and increase achieved RTO.", category: "failures_fencing" },
  { id: "false_positive_detection", label: "False-Positive Health Blip", description: "Brief transient degradation stays below failure threshold without false failover.", category: "failures_fencing" },
  { id: "auto_failover_success", label: "Successful Automatic Failover", description: "Automatic controller detects outage, fences primary, promotes secondary, and verifies.", category: "failures_fencing" },
  { id: "manual_failover_success", label: "Successful Manual Failover", description: "Controller holds in FAILURE_DETECTED until explicit operator failover command.", category: "failures_fencing" },
  { id: "secondary_unavailable", label: "Secondary Region Unavailable", description: "Both primary and preferred secondary are down; failover halts safely as FAILED.", category: "failures_fencing" },
  { id: "insufficient_standby_capacity", label: "Insufficient Standby Capacity", description: "Standby promotes cleanly but sheds requests due to compute capacity deficit.", category: "routing_continuity" },
  { id: "sync_replication", label: "Synchronous Replication Safety", description: "Sync writes wait for durable secondary ack; partitions halt writes instead of losing data.", category: "replication_rpo" },
  { id: "async_replication_lag", label: "Asynchronous Replication Lag", description: "Primary acknowledges writes faster than replication stream delivers to standby.", category: "replication_rpo" },
  { id: "acknowledged_write_loss", label: "Acknowledged Write Loss", description: "Sudden primary crash leaves recent acknowledged async writes missing from secondary.", category: "replication_rpo" },
  { id: "zero_acknowledged_loss", label: "Zero Acknowledged Write Loss", description: "Synchronous replication mode achieves RPO=0 under defined durability assumptions.", category: "replication_rpo" },
  { id: "split_brain_risk", label: "Split-Brain Risk Exposure", description: "Unsafe policy bypasses broken fencing and flags conflicting primary ownership.", category: "failures_fencing" },
  { id: "successful_fencing", label: "Successful Fencing (Epoch Bump)", description: "Monotonically increasing fencing epoch blocks stale primary writes.", category: "failures_fencing" },
  { id: "failed_fencing", label: "Failed Fencing Blocks Promotion", description: "Safe recovery policy refuses promotion when primary fencing cannot be established.", category: "failures_fencing" },
  { id: "dns_failover", label: "DNS Failover (TTL Convergence)", description: "DNS failover updates records cleanly while respecting resolver TTL expiry.", category: "routing_continuity" },
  { id: "stale_dns_cache", label: "Stale DNS Cache Window", description: "Clients honoring cached TTL continue hitting failed region during transition.", category: "routing_continuity" },
  { id: "glb_failover", label: "Global Load-Balancer Failover", description: "Global LB health-checked routing converges rapidly without DNS TTL tail.", category: "routing_continuity" },
  { id: "session_loss_failover", label: "Session Loss After Failover", description: "Region-local sessions are invalidated upon primary outage requiring re-auth.", category: "routing_continuity" },
  { id: "cache_cold_start_recovery", label: "Cache Cold-Start Warmup", description: "Warming regional Redis cache adds transient latency after promotion.", category: "routing_continuity" },
  { id: "queue_backlog_recovery", label: "Queue Backlog Recovery", description: "Secondary message consumers drain accumulated backlog before verification.", category: "routing_continuity" },
  { id: "backup_restoration", label: "Snapshot Backup Restoration", description: "Restores verified full+incremental chain to recovery storage and replays logs.", category: "backups_restore" },
  { id: "corrupted_backup", label: "Corrupted Backup Rejection", description: "Checksum verification catches corrupt backup artifact and fails restore cleanly.", category: "backups_restore" },
  { id: "missing_incremental_backup", label: "Missing Incremental Chain Link", description: "Broken incremental dependency chain blocks unsafe partial snapshot restore.", category: "backups_restore" },
  { id: "pitr_recovery", label: "Point-in-Time Recovery (PITR)", description: "Selects exact PITR timestamp and replays committed transaction logs cleanly.", category: "backups_restore" },
  { id: "interrupted_restore", label: "Interrupted Then Resumed Restore", description: "Fault pauses log replay mid-restore; resume completes idempotently without duplicates.", category: "backups_restore" },
  { id: "dependency_recovery_failure", label: "Recovery Dependency Failure", description: "Unhealthy upstream dependency blocks dependent application verification.", category: "routing_continuity" },
  { id: "rpo_exceeded", label: "RPO Objective Exceeded", description: "Elevated async replication lag causes achieved RPO to exceed configured target.", category: "replication_rpo" },
  { id: "rto_exceeded", label: "RTO Objective Exceeded", description: "Cold provisioning + DNS TTL delay exceed strict RTO target despite eventual recovery.", category: "replication_rpo" },
  { id: "successful_failback", label: "Successful Regional Failback", description: "Original primary recovers, rebuilds data, catches up replication, and reclaims ownership.", category: "architectures" },
  { id: "failed_failback", label: "Failed Failback (Stale Primary)", description: "Safety guard blocks failback when original primary has stale data or lag.", category: "architectures" },
  { id: "active_active_conflict", label: "Active-Active Write Conflict", description: "Concurrent multi-region writes trigger explicit conflict resolution visibility.", category: "replication_rpo" },
  { id: "dr_drill", label: "Scheduled Disaster Recovery Drill", description: "End-to-end game-day outage drill generating full RPO/RTO & control scorecard.", category: "architectures" },
  { id: "recovery_incident_rca", label: "Recovery Incident Investigation", description: "Correlates regional failure, alert, fencing, promotion, and resolution timeline.", category: "architectures" },
  { id: "dr_strategy_comparison", label: "Strategy Comparison Reference", description: "Standard regional outage baseline for comparing Active-Passive vs Standby/Sync.", category: "architectures" },
];

function buildBaseDrScenario(id: DisasterRecoveryPresetId): DisasterRecoveryScenario {
  const meta =
    DISASTER_RECOVERY_PRESET_METADATA.find((p) => p.id === id) ??
    DISASTER_RECOVERY_PRESET_METADATA[0]!;

  return {
    version: 1,
    id: `dr_${id}`,
    presetId: id,
    label: meta.label,
    architectureRevisionId: "rev_001",
    seed: 108,
    trafficRps: 80,
    regions: [
      {
        id: "us-east-1",
        label: "US-East (Primary)",
        role: "primary",
        zones: [
          { id: "use1-a", regionId: "us-east-1", healthy: true, capacityPct: 50 },
          { id: "use1-b", regionId: "us-east-1", healthy: true, capacityPct: 50 },
        ],
        computeCapacityRps: 140,
        provisionedPct: 100,
        provisioningDelayMs: 0,
        baseLatencyMs: 18,
        initialWeightPct: 100,
        isIdentityPrimary: true,
      },
      {
        id: "us-west-2",
        label: "US-West (Secondary)",
        role: "secondary",
        zones: [
          { id: "usw2-a", regionId: "us-west-2", healthy: true, capacityPct: 50 },
          { id: "usw2-b", regionId: "us-west-2", healthy: true, capacityPct: 50 },
        ],
        computeCapacityRps: 140,
        provisionedPct: 100,
        provisioningDelayMs: 0,
        baseLatencyMs: 24,
        initialWeightPct: 0,
        isIdentityPrimary: false,
      },
    ],
    services: [
      {
        id: "postgres-db",
        label: "Primary Database",
        kind: "database",
        tier: "tier_0_critical",
        regionIds: ["us-east-1", "us-west-2"],
        dependencyIds: [],
        sessionMode: "stateless",
        cacheWarmupDelayMs: 0,
      },
      {
        id: "redis-cache",
        label: "Session/Read Cache",
        kind: "cache",
        tier: "tier_1_high",
        regionIds: ["us-east-1", "us-west-2"],
        dependencyIds: ["postgres-db"],
        sessionMode: "replicated",
        cacheWarmupDelayMs: 0,
      },
      {
        id: "checkout-api",
        label: "Checkout API",
        kind: "application",
        tier: "tier_0_critical",
        regionIds: ["us-east-1", "us-west-2"],
        dependencyIds: ["postgres-db", "redis-cache"],
        sessionMode: "stateless",
        cacheWarmupDelayMs: 0,
      },
      {
        id: "analytics-worker",
        label: "Analytics Queue Consumer",
        kind: "queue",
        tier: "tier_2_standard",
        regionIds: ["us-east-1", "us-west-2"],
        dependencyIds: ["checkout-api"],
        sessionMode: "stateless",
        cacheWarmupDelayMs: 0,
      },
    ],
    recoveryPolicies: [
      {
        id: "pol_primary",
        architecture: "active_passive",
        preferredSecondaryRegionId: "us-west-2",
        failoverMode: "automatic",
        routingStrategy: "global_lb",
        dnsTtlMs: 120,
        probeIntervalMs: 20,
        failureThreshold: 2,
        fencingRequired: true,
        fencingMode: "fencing_token",
        allowUnsafeSplitBrainPromotion: false,
        minimumViableRecoveryEnabled: false,
        autoVerificationRequired: true,
        standby: {
          computeScaleRatio: 1,
          scaleUpDurationMs: 0,
          storageThroughputRps: 140,
          queueConsumerCapacityRps: 100,
        },
        activeActiveOwnership: "region_owned",
        activeActiveConflictPolicy: "last_writer_wins",
      },
    ],
    replication: [
      {
        id: "rep_primary_to_sec",
        sourceRegionId: "us-east-1",
        targetRegionId: "us-west-2",
        mode: "asynchronous",
        baseLagMs: 20,
        applyDelayMs: 10,
        durabilityFlushDelayMs: 10,
        quorumNodesTotal: 3,
        quorumRequired: 2,
      },
    ],
    backups: [
      {
        id: "bkp_pol_daily",
        datasetId: "ds_orders",
        scheduleIntervalMs: 80,
        retentionCount: 6,
        storageRegionId: "us-west-2",
        backupType: "incremental",
        integrityCheckEnabled: true,
        encrypted: true,
        corruptNextBackup: false,
      },
    ],
    objectives: [
      {
        id: "obj_checkout",
        serviceId: "checkout-api",
        targetRpoMs: 80,
        targetRtoMs: 260,
        rtoStartEvent: "failure_started",
        verificationPolicyId: "verif_health_and_data",
      },
    ],
    failures: [],
    commands: [],
    limits: {
      maxRegions: 10,
      maxServices: 100,
      maxReplicas: 200,
      maxBackups: 100,
      maxRecords: 1000,
      maxEvents: 2500,
      maxVirtualDurationMs: 700,
    },
  };
}

export function createDisasterRecoveryPresetScenario(
  presetId: DisasterRecoveryPresetId
): DisasterRecoveryScenario {
  const s = buildBaseDrScenario(presetId);

  switch (presetId) {
    case "healthy_active_passive":
      return s;

    case "healthy_active_active":
      s.recoveryPolicies[0]!.architecture = "active_active";
      s.regions[0]!.initialWeightPct = 50;
      s.regions[1]!.initialWeightPct = 50;
      return s;

    case "warm_standby":
      s.recoveryPolicies[0]!.architecture = "warm_standby";
      s.regions[1]!.provisionedPct = 40;
      s.recoveryPolicies[0]!.standby.scaleUpDurationMs = 80;
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Primary region outage triggers warm standby scale-up" }];
      return s;

    case "cold_standby":
      s.recoveryPolicies[0]!.architecture = "cold_standby";
      s.regions[1]!.provisionedPct = 0;
      s.regions[1]!.provisioningDelayMs = 180;
      s.objectives[0]!.targetRtoMs = 200;
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Primary region outage forces cold standby provisioning delay" }];
      return s;

    case "single_az_outage":
      s.failures = [{ id: "f_az", atMs: 140, type: "az_outage", targetRegionId: "us-east-1", targetZoneId: "use1-a", description: "Zone use1-a unavailable; use1-b continues serving degraded" }];
      return s;

    case "complete_regional_outage":
    case "auto_failover_success":
    case "dr_drill":
    case "recovery_incident_rca":
    case "dr_strategy_comparison":
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Complete regional power/network failure in us-east-1" }];
      return s;

    case "regional_network_partition":
      s.failures = [{ id: "f_part", atMs: 140, type: "network_partition", targetRegionId: "us-east-1", description: "Primary us-east-1 partitioned from us-west-2 while still reachable locally" }];
      return s;

    case "delayed_failure_detection":
      s.recoveryPolicies[0]!.probeIntervalMs = 80;
      s.recoveryPolicies[0]!.failureThreshold = 3;
      s.objectives[0]!.targetRtoMs = 220;
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Slow probe intervals delay detection by 240ms" }];
      return s;

    case "false_positive_detection":
      s.recoveryPolicies[0]!.failureThreshold = 3;
      s.failures = [{ id: "f_fp", atMs: 140, durationMs: 40, type: "false_positive_health_blip", targetRegionId: "us-east-1", description: "Transient 40ms probe blip recovers before failover threshold" }];
      return s;

    case "manual_failover_success":
      s.recoveryPolicies[0]!.failoverMode = "manual";
      s.failures = [{ id: "f_out", atMs: 120, type: "region_outage", targetRegionId: "us-east-1", description: "Primary outage awaiting operator manual approval" }];
      s.commands = [{ id: "c_man", atMs: 240, command: "trigger_manual_failover", description: "Operator initiates verified manual failover" }];
      return s;

    case "secondary_unavailable":
      s.failures = [
        { id: "f_sec", atMs: 100, type: "secondary_outage", targetRegionId: "us-west-2", description: "Secondary us-west-2 suffers simultaneous outage" },
        { id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Primary us-east-1 fails with no eligible secondary" },
      ];
      return s;

    case "insufficient_standby_capacity":
      s.regions[1]!.computeCapacityRps = 50;
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Standby us-west-2 lacks compute headroom for full 80 RPS load" }];
      return s;

    case "sync_replication":
    case "zero_acknowledged_loss":
      s.replication[0]!.mode = "synchronous";
      s.replication[0]!.baseLagMs = 0;
      s.replication[0]!.durabilityFlushDelayMs = 0;
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Outage under synchronous durability achieves zero acknowledged write loss" }];
      return s;

    case "async_replication_lag":
    case "acknowledged_write_loss":
    case "rpo_exceeded":
      s.replication[0]!.mode = "asynchronous";
      s.replication[0]!.baseLagMs = 140;
      s.objectives[0]!.targetRpoMs = 40;
      s.failures = [{ id: "f_out", atMs: 200, type: "region_outage", targetRegionId: "us-east-1", description: "High async lag leaves acknowledged writes missing upon primary outage" }];
      return s;

    case "split_brain_risk":
      s.recoveryPolicies[0]!.allowUnsafeSplitBrainPromotion = true;
      s.failures = [
        { id: "f_part", atMs: 140, type: "network_partition", targetRegionId: "us-east-1", description: "Partition separates primary and secondary" },
        { id: "f_ff", atMs: 160, type: "fencing_failure", targetRegionId: "us-east-1", description: "Fencing call fails while unsafe policy permits promotion" },
      ];
      return s;

    case "successful_fencing":
      s.failures = [{ id: "f_part", atMs: 140, type: "network_partition", targetRegionId: "us-east-1", description: "Fencing token bumps epoch and rejects stale primary writes" }];
      return s;

    case "failed_fencing":
      s.recoveryPolicies[0]!.allowUnsafeSplitBrainPromotion = false;
      s.failures = [
        { id: "f_part", atMs: 140, type: "network_partition", targetRegionId: "us-east-1", description: "Partitioned primary" },
        { id: "f_ff", atMs: 160, type: "fencing_failure", targetRegionId: "us-east-1", description: "Fencing lease revocation failed; safe controller halts promotion" },
      ];
      return s;

    case "dns_failover":
      s.recoveryPolicies[0]!.routingStrategy = "dns_failover";
      s.recoveryPolicies[0]!.dnsTtlMs = 120;
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "DNS A-record weight update waits on 120ms resolver TTL expiry" }];
      return s;

    case "stale_dns_cache":
    case "rto_exceeded":
      s.recoveryPolicies[0]!.routingStrategy = "dns_failover";
      s.recoveryPolicies[0]!.dnsTtlMs = 180;
      s.objectives[0]!.targetRtoMs = 180;
      s.failures = [
        { id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Primary fails during high DNS TTL window" },
        { id: "f_dns", atMs: 160, type: "stale_dns_cache", targetRegionId: "us-east-1", description: "Recursive resolvers cache stale primary IP past initial TTL" },
      ];
      return s;

    case "glb_failover":
      s.recoveryPolicies[0]!.routingStrategy = "global_lb";
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Global LB withdraws unhealthy us-east-1 backend rapidly" }];
      return s;

    case "session_loss_failover":
      s.services[2]!.sessionMode = "region_local";
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Region-local sessions lost during failover; users re-authenticate" }];
      return s;

    case "cache_cold_start_recovery":
      s.services[1]!.cacheWarmupDelayMs = 120;
      s.failures = [{ id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Promoted region cold Redis cache incurs 45ms warmup penalty" }];
      return s;

    case "queue_backlog_recovery":
      s.services[3]!.tier = "tier_0_critical";
      s.failures = [
        { id: "f_out", atMs: 140, type: "region_outage", targetRegionId: "us-east-1", description: "Failover accumulates queue backlog for secondary workers" },
      ];
      return s;

    case "backup_restoration":
      s.recoveryPolicies[0]!.architecture = "backup_only";
      s.commands = [
        { id: "c_rst", atMs: 220, command: "trigger_restore", targetRegionId: "us-west-2", description: "Restore verified snapshot + log segments cleanly" },
      ];
      return s;

    case "corrupted_backup":
      s.backups[0]!.corruptNextBackup = true;
      s.commands = [
        { id: "c_rst", atMs: 180, command: "trigger_restore", targetRegionId: "us-west-2", description: "Attempt restore on corrupted checksum backup" },
      ];
      return s;

    case "missing_incremental_backup":
      s.failures = [
        { id: "f_chain", atMs: 120, type: "missing_incremental_chain", targetRegionId: "us-west-2", description: "Missing intermediate incremental segment breaks chain completeness" },
      ];
      s.commands = [
        { id: "c_rst", atMs: 220, command: "trigger_restore", targetRegionId: "us-west-2", description: "Attempt restore against incomplete incremental chain" },
      ];
      return s;

    case "pitr_recovery":
      s.commands = [
        { id: "c_pitr", atMs: 240, command: "trigger_pitr", targetRegionId: "us-west-2", pitrTargetMs: 180, description: "Point-in-time recovery target t=180ms" },
      ];
      return s;

    case "interrupted_restore":
      s.failures = [
        { id: "f_int", atMs: 260, durationMs: 60, type: "restore_interruption", targetRegionId: "us-west-2", description: "Transient storage blip pauses log replay" },
      ];
      s.commands = [
        { id: "c_rst", atMs: 180, command: "trigger_restore", targetRegionId: "us-west-2", description: "Start snapshot + log replay restore" },
        { id: "c_res", atMs: 360, command: "resume_restore", targetRegionId: "us-west-2", description: "Resume interrupted restore idempotently" },
      ];
      return s;

    case "dependency_recovery_failure":
      s.failures = [
        { id: "f_out", atMs: 120, type: "region_outage", targetRegionId: "us-east-1", description: "Primary regional outage" },
        { id: "f_dep", atMs: 140, type: "dependency_failure", targetRegionId: "us-west-2", targetServiceId: "postgres-db", description: "Standby postgres-db failed to come ready; blocks checkout-api recovery" },
      ];
      return s;

    case "successful_failback":
      s.failures = [
        { id: "f_out", atMs: 100, durationMs: 200, type: "region_outage", targetRegionId: "us-east-1", description: "Primary fails over to us-west-2" },
      ];
      s.commands = [
        { id: "c_rec", atMs: 340, command: "recover_region", targetRegionId: "us-east-1", description: "Original region us-east-1 infrastructure restored" },
        { id: "c_fb", atMs: 400, command: "trigger_failback", targetRegionId: "us-east-1", description: "Catch up replication and reclaim primary ownership cleanly" },
      ];
      return s;

    case "failed_failback":
      s.failures = [
        { id: "f_out", atMs: 100, durationMs: 200, type: "region_outage", targetRegionId: "us-east-1", description: "Primary fails over" },
        { id: "f_stale", atMs: 360, type: "failback_blocked_stale", targetRegionId: "us-east-1", description: "Original primary holds un-synced stale state blocking failback" },
      ];
      s.commands = [
        { id: "c_rec", atMs: 340, command: "recover_region", targetRegionId: "us-east-1", description: "Original region comes online with stale state" },
        { id: "c_fb", atMs: 380, command: "trigger_failback", targetRegionId: "us-east-1", description: "Failback rejected due to unverified data catch-up" },
      ];
      return s;

    case "active_active_conflict":
      s.recoveryPolicies[0]!.architecture = "active_active";
      s.recoveryPolicies[0]!.activeActiveConflictPolicy = "last_writer_wins";
      s.regions[0]!.initialWeightPct = 50;
      s.regions[1]!.initialWeightPct = 50;
      s.failures = [
        { id: "f_aa", atMs: 160, type: "active_active_conflict", targetRegionId: "us-east-1", description: "Concurrent writes in us-east-1 and us-west-2 conflict" },
      ];
      return s;
  }
}

