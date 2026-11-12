import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import { RuntimeStateHelper } from "../domain/runtime-state";
import { VirtualClock } from "../engine/virtual-clock";
import { DeterministicRandom } from "../resilience/deterministic-random";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import {
  advanceRestoreStateMachine,
  createScheduledBackup,
  validateBackupChain,
} from "./backups/backup-restore-engine";
import {
  detectDependencyCycles,
  stepDependencyRecovery,
  stepGlobalRoutingAndCapacity,
} from "./continuity/failover-routing-continuity";
import {
  type ActiveActiveConflictRecord,
  type BackupArtifact,
  type BackupChainValidation,
  type DependencyRecoveryNodeState,
  type DisasterRecoveryScenario,
  DisasterRecoveryScenarioSchema,
  type DurableWriteRecord,
  type FailbackOperation,
  type FailoverOperation,
  type FencingTokenRuntime,
  type ModeledDisasterRecoveryRuntimeState,
  type RecoveryDrillReport,
  type RecoveryIncidentRuntime,
  type RegionHealthState,
  type RegionRuntimeStatus,
  type ReplicationPosition,
  type RestoreOperation,
  type RoutingConvergenceRuntime,
} from "./disaster-recovery-schemas";
import { DisasterRecoveryInvariantMonitor } from "./invariants/dr-invariants";
import {
  evaluateRecoveryObjectives,
  stepWritesAndReplication,
} from "./replication/replication-rpo-engine";

const TICK_STEP_MS = 20;

const VALID_REGION_TRANSITIONS: Record<RegionHealthState, Set<RegionHealthState>> = {
  HEALTHY: new Set(["HEALTHY", "DEGRADED", "PARTITIONED", "UNAVAILABLE"]),
  DEGRADED: new Set(["HEALTHY", "DEGRADED", "PARTITIONED", "UNAVAILABLE", "RECOVERING", "RESTORED"]),
  PARTITIONED: new Set(["HEALTHY", "DEGRADED", "PARTITIONED", "UNAVAILABLE", "RECOVERING", "RESTORED"]),
  UNAVAILABLE: new Set(["UNAVAILABLE", "RECOVERING", "RESTORED"]),
  RECOVERING: new Set(["RECOVERING", "UNAVAILABLE", "RESTORED", "HEALTHY"]),
  RESTORED: new Set(["RESTORED", "HEALTHY", "DEGRADED", "UNAVAILABLE"]),
};

export class DisasterRecoveryExecutionEngine {
  public static runScenario(rawScenario: DisasterRecoveryScenario): ExecutionTrace {
    const scenario = DisasterRecoveryScenarioSchema.parse(rawScenario);
    const clock = new VirtualClock(0);
    const rng = new DeterministicRandom(scenario.seed);
    const policy = scenario.recoveryPolicies[0]!;

    const primaryRegionCfg =
      scenario.regions.find((r) => r.role === "primary") ?? scenario.regions[0]!;
    const secondaryRegionCfg =
      scenario.regions.find((r) => r.id === policy.preferredSecondaryRegionId) ??
      scenario.regions.find((r) => r.id !== primaryRegionCfg.id) ??
      scenario.regions[1]!;

    // Initialize runtime maps
    const regions: Record<string, RegionRuntimeStatus> = {};
    const regionalWeightsPct: Record<string, number> = {};
    const observedTrafficPct: Record<string, number> = {};
    for (const r of scenario.regions) {
      const healthyZones = r.zones.filter((z) => z.healthy).length;
      const effCap = Math.round(
        (r.computeCapacityRps * r.provisionedPct * healthyZones) /
          (100 * Math.max(1, r.zones.length))
      );
      regions[r.id] = {
        id: r.id,
        label: r.label,
        role: r.role,
        state: healthyZones < r.zones.length ? "DEGRADED" : "HEALTHY",
        activeZones: healthyZones,
        totalZones: r.zones.length,
        provisionedPct: r.provisionedPct,
        computeCapacityRps: r.computeCapacityRps,
        effectiveCapacityRps: effCap,
        currentLoadRps: 0,
        overloaded: false,
        errorRate: 0,
        eligibleForPromotion:
          r.id === secondaryRegionCfg.id &&
          policy.architecture !== "backup_only" &&
          healthyZones > 0,
        sessionsLostCount: 0,
      };
      regionalWeightsPct[r.id] = r.initialWeightPct;
      observedTrafficPct[r.id] = r.initialWeightPct;
    }

    // Normalize initial weights to 100
    const weightSum = Object.values(regionalWeightsPct).reduce((a, b) => a + b, 0);
    if (weightSum !== 100) {
      regionalWeightsPct[primaryRegionCfg.id] = 100;
      for (const r of scenario.regions) {
        if (r.id !== primaryRegionCfg.id) regionalWeightsPct[r.id] = 0;
        observedTrafficPct[r.id] = regionalWeightsPct[r.id]!;
      }
    }

    const replicationStreams: Record<string, ReplicationPosition> = {};
    for (const rc of scenario.replication) {
      replicationStreams[rc.id] = {
        streamId: rc.id,
        sourceRegionId: rc.sourceRegionId,
        targetRegionId: rc.targetRegionId,
        mode: rc.mode,
        primaryCommittedLsn: 0,
        secondaryReceivedLsn: 0,
        secondaryAppliedLsn: 0,
        secondaryDurableLsn: 0,
        recordLag: 0,
        byteLag: 0,
        timeLagMs: rc.baseLagMs,
        applyLagMs: rc.applyDelayMs,
        durableLagMs: rc.durabilityFlushDelayMs,
        blockedBySyncQuorum: false,
      };
    }

    const cycleCheck = detectDependencyCycles(scenario.services);
    const dependencies: Record<string, DependencyRecoveryNodeState> = {};
    for (const s of scenario.services) {
      dependencies[s.id] = {
        serviceId: s.id,
        label: s.label,
        kind: s.kind,
        tier: s.tier,
        dependencyIds: [...s.dependencyIds],
        recovered: true,
        blockedByIds: [],
        cacheColdPenaltyMs: 0,
        queueBacklogDepth: s.kind === "queue" ? 5 : 0,
      };
    }

    const writeHistory: DurableWriteRecord[] = [];
    const backups: BackupArtifact[] = [];
    const conflicts: ActiveActiveConflictRecord[] = [];
    const incidents: RecoveryIncidentRuntime[] = [];
    let lastChainValidation: BackupChainValidation | null = null;

    const fencing: FencingTokenRuntime = {
      epoch: 1,
      holderRegionId: primaryRegionCfg.id,
      fencedRegions: [],
      mode: policy.fencingMode,
      fencingEstablished: false,
      staleWritesRejected: 0,
      splitBrainRisk: false,
    };

    const failover: FailoverOperation = {
      id: `fo_${scenario.id}`,
      state: "IDLE",
      architecture: policy.architecture,
      sourcePrimaryRegionId: primaryRegionCfg.id,
      targetSecondaryRegionId: secondaryRegionCfg.id,
      triggerMode: policy.failoverMode,
      paused: false,
      timeline: [],
    };

    const failback: FailbackOperation = {
      id: `fb_${scenario.id}`,
      state: "IDLE",
      originalRegionId: primaryRegionCfg.id,
      activeStandbyRegionId: secondaryRegionCfg.id,
      dataRebuildProgressPct: 0,
      replicationCatchupPct: 0,
    };

    const routing: RoutingConvergenceRuntime = {
      strategy: policy.routingStrategy,
      dnsTtlMs: policy.dnsTtlMs,
      regionalWeightsPct,
      observedTrafficPct,
      staleClientsPct: 0,
      failedRequestsDuringWindow: 0,
      successfulRequestsDuringWindow: 0,
      converged: true,
      convergenceDurationMs: null,
    };

    const restore: RestoreOperation = {
      id: `rst_${scenario.id}`,
      state: "IDLE",
      backupId: "",
      targetRegionId: secondaryRegionCfg.id,
      recordsRestored: 0,
      totalRecordsToRestore: 0,
      logsAppliedLsn: 0,
      paused: false,
      integrityVerified: false,
      replayedLsnIds: [],
    };

    const baseRuntime = RuntimeStateHelper.createInitialState();
    const frames: VisualizationFrame[] = [];
    const allEvents: ExecutionTrace["events"] = [];
    let seq = 0;

    let activePrimaryRegionId = primaryRegionCfg.id;
    let consecutiveProbeFailures = 0;
    let failureStartedAtMs: number | null = null;
    let failureDetectedAtMs: number | null = null;
    let fencingStartedAtMs: number | null = null;
    let promotionStartedAtMs: number | null = null;
    let routingUpdatedAtMs: number | null = null;
    let recoveryStartedAtMs = 0;
    let verifiedAtMs: number | null = null;
    let standbyProvisionReadyAtMs: number | null = null;
    let restoredLogsMaxLsn = 0;
    let minimumViableRecovered = true;
    let fullRecoveryAchieved = true;
    let invalidRegionTransitionSeen = false;
    let replicationBackwardsSeen = false;

    const transitionRegionState = (
      regionId: string,
      nextState: RegionHealthState
    ) => {
      const reg = regions[regionId];
      if (!reg || reg.state === nextState) return;
      if (!VALID_REGION_TRANSITIONS[reg.state]?.has(nextState)) {
        invalidRegionTransitionSeen = true;
      }
      reg.state = nextState;
      reg.eligibleForPromotion =
        reg.id === secondaryRegionCfg.id &&
        policy.architecture !== "backup_only" &&
        (nextState === "HEALTHY" || nextState === "DEGRADED" || nextState === "RESTORED") &&
        reg.activeZones > 0;
    };

    const buildSnapshot = (nowMs: number): ModeledDisasterRecoveryRuntimeState => {
      const objEvals = evaluateRecoveryObjectives({
        objectives: scenario.objectives,
        writeHistory,
        restoredLogsMaxLsn,
        failureStartedAtMs,
        failureDetectedAtMs,
        verifiedAtMs,
        isFailedOutcome:
          failover.state === "FAILED" || restore.state === "FAILED",
        architecture: policy.architecture,
        hasInconsistentConflict: conflicts.some(
          (c) => c.resolution === "manual_hold"
        ),
      });

      const primaryEval = objEvals[0];
      const maxLagMs = Math.max(
        0,
        ...Object.values(replicationStreams).map((s) => s.timeLagMs)
      );
      const secReg = regions[secondaryRegionCfg.id];
      const standbyUtil =
        secReg && secReg.effectiveCapacityRps > 0
          ? Math.min(
              100,
              Math.round((secReg.currentLoadRps / secReg.effectiveCapacityRps) * 100)
            )
          : 0;
      const capacityDeficitRps = Object.values(regions).reduce(
        (acc, r) =>
          r.overloaded ? acc + Math.max(0, r.currentLoadRps - r.effectiveCapacityRps) : acc,
        0
      );

      const invariants = DisasterRecoveryInvariantMonitor.verify({
        invalidRegionTransitionSeen,
        replicationBackwardsSeen,
        replicationStreams,
        lastChainValidation,
        backups,
        restore,
        fencing,
        failover,
        failback,
        routing,
        objectives: objEvals,
        hasCircularDependencies: cycleCheck.hasCycle,
      });

      const failedControls: string[] = [];
      const successfulControls: string[] = [];
      const blockers: string[] = [];
      if (fencing.fencingEstablished) {
        successfulControls.push(
          `Primary fenced at epoch ${fencing.epoch} (${fencing.mode})`
        );
      } else if (fencing.splitBrainRisk) {
        failedControls.push("Primary fencing failed — split-brain risk exposed");
        blockers.push(fencing.splitBrainReason ?? "Fencing unavailable");
      }
      if (primaryEval && !primaryEval.rpoMet) {
        failedControls.push(
          `RPO objective exceeded (${primaryEval.achievedRpoMs ?? "unmet"}ms > ${primaryEval.targetRpoMs}ms)`
        );
      } else if (primaryEval) {
        successfulControls.push("RPO target satisfied under modeled writes");
      }
      if (primaryEval && !primaryEval.rtoMet) {
        failedControls.push(
          `RTO objective exceeded (${primaryEval.achievedRtoMs ?? "unmet"}ms > ${primaryEval.targetRtoMs}ms)`
        );
      } else if (primaryEval) {
        successfulControls.push("RTO target satisfied with verified readiness");
      }
      if (capacityDeficitRps > 0) {
        failedControls.push(
          `Secondary capacity deficit of ${capacityDeficitRps} req/s triggered load shedding`
        );
      }
      if (restore.state === "FAILED" && restore.failureReason) {
        failedControls.push(`Backup restoration blocked: ${restore.failureReason}`);
        blockers.push(restore.failureReason);
      } else if (restore.state === "COMPLETED") {
        successfulControls.push(
          `Backup ${restore.backupId} & log replay (LSN ${restore.logsAppliedLsn}) verified`
        );
      }

      const drillReport: RecoveryDrillReport = {
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        architecture: policy.architecture,
        objectivesMet: objEvals.every((o) => o.rpoMet && o.rtoMet),
        achievedRpoMs: primaryEval?.achievedRpoMs ?? null,
        achievedRtoMs: primaryEval?.achievedRtoMs ?? null,
        missingAcknowledgedWrites: primaryEval?.missingAcknowledgedWrites ?? 0,
        capacityShortfallRps: capacityDeficitRps,
        failedControls,
        successfulControls,
        blockers,
        recommendations: [
          ...(primaryEval && !primaryEval.rpoMet
            ? [
                "Switch critical tier writes to synchronous/semi-synchronous replication or shorten RPO lag budget.",
              ]
            : []),
          ...(capacityDeficitRps > 0
            ? [
                "Increase warm/standby compute scale ratio to match full primary regional traffic.",
              ]
            : []),
          ...(policy.routingStrategy === "dns_failover" && routing.staleClientsPct > 0
            ? [
                "Reduce DNS record TTL or migrate failover routing to a Global Load Balancer health-checked endpoint.",
              ]
            : []),
          ...(fencing.splitBrainRisk
            ? [
                "Enable quorum-backed ownership / storage fencing tokens before permitting automatic secondary promotion.",
              ]
            : []),
        ],
        assumptions: [
          "All regions, backups, write LSNs, and routing convergence windows use synthetic virtual time.",
          "Routing convergence alone does not imply RTO completion; dependent services and data integrity must verify.",
          "Synchronous replication preserves zero acknowledged write loss at the expense of write availability during network partitions.",
        ],
      };

      return {
        virtualTimeMs: nowMs,
        architecture: policy.architecture,
        regions: JSON.parse(JSON.stringify(regions)),
        replicationStreams: JSON.parse(JSON.stringify(replicationStreams)),
        recentWrites: writeHistory.slice(-40),
        fencing: { ...fencing, fencedRegions: [...fencing.fencedRegions] },
        failover: JSON.parse(JSON.stringify(failover)),
        failback: { ...failback },
        routing: JSON.parse(JSON.stringify(routing)),
        backups: JSON.parse(JSON.stringify(backups)),
        lastChainValidation: lastChainValidation
          ? { ...lastChainValidation }
          : null,
        restore: JSON.parse(JSON.stringify(restore)),
        dependencies: JSON.parse(JSON.stringify(dependencies)),
        hasCircularDependencies: cycleCheck.hasCycle,
        conflicts: [...conflicts],
        objectiveEvaluations: objEvals,
        incidents: JSON.parse(JSON.stringify(incidents)),
        drillReport,
        caveats: drillReport.assumptions,
        invariants,
        metrics: {
          virtualTimeMs: nowMs,
          detectionTimeMs:
            failureStartedAtMs !== null && failureDetectedAtMs !== null
              ? Math.max(0, failureDetectedAtMs - failureStartedAtMs)
              : null,
          fencingDurationMs:
            fencingStartedAtMs !== null && failover.fencedAtMs !== undefined
              ? Math.max(0, failover.fencedAtMs - fencingStartedAtMs)
              : null,
          promotionDurationMs:
            promotionStartedAtMs !== null && failover.promotedAtMs !== undefined
              ? Math.max(0, failover.promotedAtMs - promotionStartedAtMs)
              : null,
          routingConvergenceTimeMs: routing.convergenceDurationMs,
          serviceRestorationTimeMs:
            failureStartedAtMs !== null && verifiedAtMs !== null
              ? Math.max(0, verifiedAtMs - failureStartedAtMs)
              : null,
          achievedRpoMs: primaryEval?.achievedRpoMs ?? null,
          achievedRtoMs: primaryEval?.achievedRtoMs ?? null,
          missingAcknowledgedWrites: primaryEval?.missingAcknowledgedWrites ?? 0,
          missingUnacknowledgedWrites:
            primaryEval?.missingUnacknowledgedWrites ?? 0,
          lostRequests: routing.failedRequestsDuringWindow,
          successfulRequests: routing.successfulRequestsDuringWindow,
          maxReplicationLagMs: maxLagMs,
          backupsValidCount: backups.filter((b) => b.integrity === "valid").length,
          backupsCorruptCount: backups.filter((b) => b.integrity === "corrupt")
            .length,
          staleWritesRejected: fencing.staleWritesRejected,
          standbyUtilizationPct: standbyUtil,
          recoveryCapacityDeficitRps: capacityDeficitRps,
          minimumViableRecovered,
          fullRecoveryAchieved,
        },
      };
    };

    const emitFrame = (
      nowMs: number,
      summary: string,
      activeNodeIds: string[],
      eventPayload: Record<string, unknown>
    ) => {
      if (allEvents.length >= scenario.limits.maxEvents) return;
      const evt = {
        id: `dr_evt_${++seq}`,
        sequence: seq,
        atMs: nowMs,
        durationMs: 10,
        ...eventPayload,
      } as unknown as ExecutionTrace["events"][number];
      allEvents.push(evt);
      const cloned = RuntimeStateHelper.cloneState(baseRuntime);
      cloned.disasterRecoveryState = buildSnapshot(nowMs);
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: nowMs,
        activeNodeIds: Array.from(new Set(activeNodeIds)),
        activeEdgeIds: [],
        activeEvent: { ...evt, explanation: summary },
        direction: "request",
        stepTitle: String(eventPayload.type ?? "Recovery Event"),
        stepExplanation: summary,
        runtimeState: cloned,
      });
    };

    emitFrame(
      0,
      `Multi-region architecture initialized (${policy.architecture}; primary=${primaryRegionCfg.id}, standby=${secondaryRegionCfg.id})`,
      [primaryRegionCfg.id],
      {
        type: "recovery.objective.evaluated",
        objectiveId: scenario.objectives[0]?.id ?? "obj_1",
        rpoMet: true,
        rtoMet: true,
        explanation: scenario.label,
      }
    );

    const maxTicks = Math.min(
      scenario.limits.maxVirtualDurationMs,
      20000
    );

    for (let t = TICK_STEP_MS; t <= maxTicks; t += TICK_STEP_MS) {
      clock.setTime(t);
      const nowMs = clock.now();

      const activeFailures = scenario.failures.filter(
        (f) =>
          f.atMs <= nowMs &&
          (f.durationMs === undefined || nowMs <= f.atMs + f.durationMs)
      );

      // Process faults arriving exactly at nowMs
      for (const f of scenario.failures) {
        if (f.atMs !== nowMs) continue;
        if (f.type === "region_outage") {
          transitionRegionState(f.targetRegionId, "UNAVAILABLE");
          for (const z of regions[f.targetRegionId]?.totalZones
            ? Array.from({ length: regions[f.targetRegionId]!.totalZones })
            : []) {
            void z;
          }
          if (regions[f.targetRegionId]) regions[f.targetRegionId]!.activeZones = 0;
          if (failureStartedAtMs === null) failureStartedAtMs = nowMs;
          // Track region-local sessions lost when primary becomes unavailable
          for (const s of scenario.services) {
            if (s.sessionMode === "region_local" && regions[f.targetRegionId]) {
              regions[f.targetRegionId]!.sessionsLostCount += 120;
            }
          }
          incidents.push({
            id: `dr_inc_${incidents.length + 1}`,
            severity: "sev1",
            status: "detected",
            detectedAtMs: nowMs,
            summary: f.description,
            evidence: [{ atMs: nowMs, source: "region_health", detail: f.description }],
          });
          emitFrame(nowMs, f.description, [f.targetRegionId], {
            type: "recovery.region.unavailable",
            regionId: f.targetRegionId,
            newState: "UNAVAILABLE",
            reason: f.description,
          });
        } else if (f.type === "az_outage") {
          const reg = regions[f.targetRegionId];
          if (reg) {
            reg.activeZones = Math.max(1, reg.activeZones - 1);
            transitionRegionState(reg.id, "DEGRADED");
          }
          emitFrame(nowMs, f.description, [f.targetRegionId], {
            type: "recovery.region.degraded",
            regionId: f.targetRegionId,
            newState: "DEGRADED",
            reason: f.description,
          });
        } else if (f.type === "network_partition") {
          transitionRegionState(f.targetRegionId, "PARTITIONED");
          if (failureStartedAtMs === null) failureStartedAtMs = nowMs;
          incidents.push({
            id: `dr_inc_${incidents.length + 1}`,
            severity: "sev1",
            status: "detected",
            detectedAtMs: nowMs,
            summary: f.description,
            evidence: [{ atMs: nowMs, source: "network_partition", detail: f.description }],
          });
          emitFrame(nowMs, f.description, [f.targetRegionId], {
            type: "recovery.region.degraded",
            regionId: f.targetRegionId,
            newState: "PARTITIONED",
            reason: f.description,
          });
        } else if (f.type === "secondary_outage") {
          transitionRegionState(secondaryRegionCfg.id, "UNAVAILABLE");
          if (regions[secondaryRegionCfg.id]) {
            regions[secondaryRegionCfg.id]!.activeZones = 0;
          }
          emitFrame(nowMs, f.description, [secondaryRegionCfg.id], {
            type: "recovery.region.unavailable",
            regionId: secondaryRegionCfg.id,
            newState: "UNAVAILABLE",
            reason: f.description,
          });
        } else if (f.type === "false_positive_health_blip") {
          transitionRegionState(f.targetRegionId, "DEGRADED");
          emitFrame(nowMs, f.description, [f.targetRegionId], {
            type: "recovery.region.degraded",
            regionId: f.targetRegionId,
            newState: "DEGRADED",
            reason: f.description,
          });
        }
      }

      // Recover transient false-positive blip when duration expires
      for (const f of scenario.failures) {
        if (
          f.type === "false_positive_health_blip" &&
          f.durationMs !== undefined &&
          nowMs === f.atMs + f.durationMs
        ) {
          transitionRegionState(f.targetRegionId, "HEALTHY");
        }
      }

      // Process operator commands scheduled at nowMs
      for (const cmd of scenario.commands) {
        if (cmd.atMs !== nowMs) continue;
        if (cmd.command === "pause_failover") {
          failover.paused = true;
          failover.state = "PAUSED";
        } else if (cmd.command === "resume_failover") {
          failover.paused = false;
          failover.state = "ASSESSING";
        } else if (cmd.command === "trigger_manual_failover") {
          if (failover.state === "IDLE" || failover.state === "FAILURE_DETECTED") {
            failover.state = "ASSESSING";
            failover.triggerMode = "manual";
            if (failureStartedAtMs === null) failureStartedAtMs = nowMs;
            if (failureDetectedAtMs === null) failureDetectedAtMs = nowMs;
            emitFrame(nowMs, cmd.description, [primaryRegionCfg.id, secondaryRegionCfg.id], {
              type: "recovery.failover.requested",
              fromRegionId: primaryRegionCfg.id,
              toRegionId: secondaryRegionCfg.id,
              mode: "manual",
            });
          }
        } else if (cmd.command === "trigger_backup") {
          const pol = scenario.backups[0];
          if (pol) {
            const latestDur = Object.values(replicationStreams)[0]?.secondaryDurableLsn ?? 0;
            const res = createScheduledBackup({
              policy: pol,
              nowMs,
              durableLsn: latestDur,
              existingBackups: backups,
              corruptOverride: activeFailures.some((f) => f.type === "backup_corruption"),
              skipForMissingChainFault: activeFailures.some(
                (f) => f.type === "missing_incremental_chain"
              ),
            });
            if (res.artifact) {
              backups.push(res.artifact);
            }
          }
        } else if (cmd.command === "trigger_restore" || cmd.command === "trigger_pitr") {
          const chosenBkp =
            backups.find((b) => b.id === cmd.backupId) ?? backups[backups.length - 1];
          if (chosenBkp) {
            restore.id = `rst_${nowMs}`;
            restore.backupId = chosenBkp.id;
            restore.targetRegionId = cmd.targetRegionId ?? secondaryRegionCfg.id;
            restore.pitrTargetMs = cmd.pitrTargetMs;
            const maxAvailableLsn = writeHistory
              .filter(
                (w) =>
                  cmd.pitrTargetMs === undefined || w.atMs <= cmd.pitrTargetMs
              )
              .slice(-1)[0]?.lsn;
            restore.targetLsn = maxAvailableLsn ?? chosenBkp.includedLogPosition;
            restore.state = "REQUESTED";
            restore.paused = false;
            emitFrame(nowMs, `Restore requested from backup '${chosenBkp.id}'`, [restore.targetRegionId], {
              type: "recovery.restore.started",
              restoreId: restore.id,
              backupId: chosenBkp.id,
              targetRegionId: restore.targetRegionId,
            });
          }
        } else if (cmd.command === "resume_restore") {
          if (restore.state === "PAUSED") {
            restore.paused = false;
            restore.state = "REPLAYING_LOGS";
          }
        } else if (cmd.command === "recover_region") {
          const targetId = cmd.targetRegionId ?? primaryRegionCfg.id;
          if (regions[targetId]) {
            regions[targetId]!.activeZones = regions[targetId]!.totalZones;
            transitionRegionState(targetId, "RESTORED");
          }
        } else if (cmd.command === "trigger_failback") {
          failback.state = "REQUESTED";
          failback.requestedAtMs = nowMs;
          emitFrame(nowMs, cmd.description, [failback.originalRegionId], {
            type: "recovery.failback.started",
            originalRegionId: failback.originalRegionId,
          });
        }
      }

      // Scheduled automatic backups
      for (const bPol of scenario.backups) {
        if (nowMs % bPol.scheduleIntervalMs === 0 && backups.length < scenario.limits.maxBackups) {
          const primaryReg = regions[primaryRegionCfg.id];
          if (primaryReg && primaryReg.state !== "UNAVAILABLE") {
            const latestDur =
              writeHistory.filter((w) => w.durableOnPrimary).slice(-1)[0]?.lsn ?? 0;
            const res = createScheduledBackup({
              policy: bPol,
              nowMs,
              durableLsn: latestDur,
              existingBackups: backups,
              corruptOverride: activeFailures.some((f) => f.type === "backup_corruption"),
              skipForMissingChainFault: activeFailures.some(
                (f) => f.type === "missing_incremental_chain"
              ),
            });
            if (res.artifact) {
              backups.push(res.artifact);
              if (res.artifact.integrity === "corrupt") {
                emitFrame(
                  nowMs,
                  `Backup '${res.artifact.id}' completed with CORRUPT checksum`,
                  [res.artifact.storageRegionId],
                  {
                    type: "recovery.backup.failed",
                    backupId: res.artifact.id,
                    reason: "Checksum mismatch detected during verification.",
                  }
                );
              } else {
                emitFrame(
                  nowMs,
                  `Backup '${res.artifact.id}' (${res.artifact.type}) stored cleanly in ${res.artifact.storageRegionId} at LSN ${res.artifact.includedLogPosition}`,
                  [res.artifact.storageRegionId],
                  {
                    type: "recovery.backup.completed",
                    backupId: res.artifact.id,
                    includedLogPosition: res.artifact.includedLogPosition,
                    integrity: res.artifact.integrity,
                  }
                );
              }
            }
          }
        }
      }

      // Step durable writes & replication positions
      const prevStreamDur: Record<string, number> = {};
      for (const [sid, st] of Object.entries(replicationStreams)) {
        prevStreamDur[sid] = st.secondaryDurableLsn;
      }

      const extraLag = activeFailures
        .filter((f) => f.type === "replication_spike")
        .reduce((acc, f) => acc + (f.extraLagMs ?? 80), 0);

      const writeStep = stepWritesAndReplication({
        nowMs,
        stepDurationMs: TICK_STEP_MS,
        architecture: policy.architecture,
        policy,
        regions,
        replicationConfigs: scenario.replication,
        replicationStreams,
        writeHistory,
        activeConflicts: conflicts,
        extraReplicationLagMs: extraLag,
        hasConflictFault: activeFailures.some((f) => f.type === "active_active_conflict"),
        fencingHolderRegionId: fencing.holderRegionId,
        rng,
      });

      for (const nw of writeStep.newWrites) {
        if (writeHistory.length < scenario.limits.maxRecords) {
          writeHistory.push(nw);
        }
      }
      fencing.staleWritesRejected += writeStep.staleWritesRejected;
      if (writeStep.newConflict) {
        conflicts.push(writeStep.newConflict);
      }

      for (const [sid, st] of Object.entries(replicationStreams)) {
        if (st.secondaryDurableLsn < (prevStreamDur[sid] ?? 0)) {
          replicationBackwardsSeen = true;
        }
      }

      // Failure detection probes against primary region
      const primaryReg = regions[primaryRegionCfg.id];
      const primaryUnhealthy =
        primaryReg &&
        (primaryReg.state === "UNAVAILABLE" ||
          primaryReg.state === "PARTITIONED" ||
          (primaryReg.state === "DEGRADED" &&
            !activeFailures.some((f) => f.type === "false_positive_health_blip")));

      if (
        primaryUnhealthy &&
        failover.state === "IDLE" &&
        nowMs % policy.probeIntervalMs === 0
      ) {
        consecutiveProbeFailures += 1;
        if (consecutiveProbeFailures >= policy.failureThreshold) {
          failureDetectedAtMs = nowMs;
          failover.failureStartedAtMs = failureStartedAtMs ?? nowMs;
          failover.failureDetectedAtMs = nowMs;
          failover.state = "FAILURE_DETECTED";
          failover.timeline.push({
            atMs: nowMs,
            phase: "FAILURE_DETECTED",
            summary: `Detected outage/partition on '${primaryRegionCfg.id}' after ${consecutiveProbeFailures} failed probes.`,
          });
          emitFrame(
            nowMs,
            `Failure detected on '${primaryRegionCfg.id}' (detection delay=${Math.max(
              0,
              nowMs - (failureStartedAtMs ?? nowMs)
            )}ms)`,
            [primaryRegionCfg.id],
            {
              type: "recovery.failure.detected",
              regionId: primaryRegionCfg.id,
              detectionDelayMs: Math.max(0, nowMs - (failureStartedAtMs ?? nowMs)),
            }
          );

          if (policy.failoverMode === "automatic") {
            failover.state = "ASSESSING";
            emitFrame(
              nowMs,
              `Automatic failover requested from '${primaryRegionCfg.id}' to '${secondaryRegionCfg.id}'`,
              [primaryRegionCfg.id, secondaryRegionCfg.id],
              {
                type: "recovery.failover.requested",
                fromRegionId: primaryRegionCfg.id,
                toRegionId: secondaryRegionCfg.id,
                mode: "automatic",
              }
            );
          }
        }
      } else if (!primaryUnhealthy && failover.state === "IDLE") {
        consecutiveProbeFailures = 0;
      }

      // Failover state machine progression
      if (!failover.paused) {
        if (failover.state === "ASSESSING") {
          if (cycleCheck.hasCycle) {
            failover.state = "FAILED";
            failover.failureReason = `Circular recovery dependency detected: ${cycleCheck.cycleNodes.join(" -> ")}`;
          } else {
            failover.state = "FENCING_PRIMARY";
            fencingStartedAtMs = nowMs;
          }
        } else if (failover.state === "FENCING_PRIMARY") {
          const fenceBroken = activeFailures.some(
            (f) => f.type === "fencing_failure"
          );
          if (policy.fencingRequired && fenceBroken) {
            fencing.fencingEstablished = false;
            fencing.splitBrainRisk = true;
            fencing.splitBrainReason =
              "Primary fencing failed (partitioned primary lease/token could not be revoked).";
            if (!policy.allowUnsafeSplitBrainPromotion) {
              failover.state = "FAILED";
              failover.failureReason = fencing.splitBrainReason;
              emitFrame(nowMs, fencing.splitBrainReason, [primaryRegionCfg.id], {
                type: "recovery.primary.fenced",
                regionId: primaryRegionCfg.id,
                epoch: fencing.epoch,
                success: false,
              });
            } else {
              failover.state = "VALIDATING_SECONDARY";
            }
          } else {
            fencing.epoch += 1;
            fencing.fencingEstablished = true;
            fencing.fencedRegions = [primaryRegionCfg.id];
            failover.fencedAtMs = nowMs;
            failover.timeline.push({
              atMs: nowMs,
              phase: "FENCING_PRIMARY",
              summary: `Primary '${primaryRegionCfg.id}' fenced at epoch ${fencing.epoch} (${policy.fencingMode}).`,
            });
            emitFrame(
              nowMs,
              `Primary '${primaryRegionCfg.id}' fenced at epoch ${fencing.epoch}`,
              [primaryRegionCfg.id],
              {
                type: "recovery.primary.fenced",
                regionId: primaryRegionCfg.id,
                epoch: fencing.epoch,
                success: true,
              }
            );
            failover.state = "VALIDATING_SECONDARY";
          }
        } else if (failover.state === "VALIDATING_SECONDARY") {
          const sec = regions[secondaryRegionCfg.id];
          if (!sec || sec.state === "UNAVAILABLE" || policy.architecture === "backup_only") {
            const msg =
              policy.architecture === "backup_only"
                ? "Backup-only recovery requires explicit backup restore to newly provisioned target."
                : `Preferred secondary '${secondaryRegionCfg.id}' is UNAVAILABLE; promotion blocked.`;
            failover.state = "FAILED";
            failover.failureReason = msg;
            emitFrame(nowMs, msg, [secondaryRegionCfg.id], {
              type: "recovery.secondary.validated",
              regionId: secondaryRegionCfg.id,
              eligible: false,
            });
          } else {
            // Account for warm/cold standby provisioning/scale-up delay
            const provDelay =
              secondaryRegionCfg.provisioningDelayMs +
              policy.standby.scaleUpDurationMs;
            if (standbyProvisionReadyAtMs === null) {
              standbyProvisionReadyAtMs = nowMs + provDelay;
            }
            if (nowMs >= standbyProvisionReadyAtMs) {
              sec.provisionedPct = 100;
              promotionStartedAtMs = nowMs;
              failover.state = "PROMOTING_SECONDARY";
              emitFrame(
                nowMs,
                `Secondary '${secondaryRegionCfg.id}' validated and provisioned (100%)`,
                [secondaryRegionCfg.id],
                {
                  type: "recovery.secondary.validated",
                  regionId: secondaryRegionCfg.id,
                  eligible: true,
                }
              );
            }
          }
        } else if (failover.state === "PROMOTING_SECONDARY") {
          fencing.holderRegionId = secondaryRegionCfg.id;
          activePrimaryRegionId = secondaryRegionCfg.id;
          failover.promotedAtMs = nowMs;
          recoveryStartedAtMs = nowMs;
          failover.timeline.push({
            atMs: nowMs,
            phase: "PROMOTING_SECONDARY",
            summary: `Secondary '${secondaryRegionCfg.id}' promoted to authoritative primary at epoch ${fencing.epoch}.`,
          });
          emitFrame(
            nowMs,
            `Secondary '${secondaryRegionCfg.id}' promoted to Primary (epoch ${fencing.epoch})`,
            [secondaryRegionCfg.id],
            {
              type: "recovery.secondary.promoted",
              regionId: secondaryRegionCfg.id,
              epoch: fencing.epoch,
            }
          );
          failover.state = "RECONFIGURING_ROUTING";
        } else if (failover.state === "RECONFIGURING_ROUTING") {
          for (const rid of Object.keys(routing.regionalWeightsPct)) {
            routing.regionalWeightsPct[rid] =
              rid === secondaryRegionCfg.id ? 100 : 0;
          }
          routing.converged = false;
          routingUpdatedAtMs = nowMs;
          failover.routingUpdatedAtMs = nowMs;
          emitFrame(
            nowMs,
            `Updated ${policy.routingStrategy} routing: 100% weight -> ${secondaryRegionCfg.id}`,
            [secondaryRegionCfg.id],
            {
              type: "recovery.routing.updated",
              strategy: policy.routingStrategy,
              weightsPct: { ...routing.regionalWeightsPct },
            }
          );
          failover.state = "RESTORING_DEPENDENCIES";
        }
      }

      // Advance restore state machine if active
      const restoreRes = advanceRestoreStateMachine({
        restore,
        backups,
        regions,
        maxRecoverableLsn:
          writeHistory.filter((w) => w.durableOnPrimary).slice(-1)[0]?.lsn ?? 0,
        nowMs,
        interruptedFault: activeFailures.some(
          (f) => f.type === "restore_interruption"
        ),
        missingIncrementalFault: activeFailures.some(
          (f) => f.type === "missing_incremental_chain"
        ),
      });
      if (restoreRes.chainValidation) {
        lastChainValidation = restoreRes.chainValidation;
      }
      if (restoreRes.completed) {
        restoredLogsMaxLsn = Math.max(restoredLogsMaxLsn, restore.logsAppliedLsn);
        emitFrame(
          nowMs,
          `Backup restore & PITR log replay completed up to LSN ${restore.logsAppliedLsn}`,
          [restore.targetRegionId],
          {
            type: "recovery.restore.completed",
            restoreId: restore.id,
            logsAppliedLsn: restore.logsAppliedLsn,
          }
        );
      } else if (restoreRes.failedReason) {
        emitFrame(
          nowMs,
          `Restore FAILED: ${restoreRes.failedReason}`,
          [restore.targetRegionId],
          {
            type: "recovery.restore.failed",
            restoreId: restore.id,
            reason: restoreRes.failedReason,
          }
        );
      }

      // Step global traffic routing convergence & regional capacity
      const trafficStep = stepGlobalRoutingAndCapacity({
        nowMs,
        scenario,
        policy,
        routing,
        routingUpdatedAtMs,
        hasStaleDnsFault: activeFailures.some((f) => f.type === "stale_dns_cache"),
        regions,
      });
      if (trafficStep.convergedNow) {
        failover.routingConvergedAtMs = nowMs;
        emitFrame(
          nowMs,
          `Traffic converged 100% onto '${secondaryRegionCfg.id}' (${policy.routingStrategy})`,
          [secondaryRegionCfg.id],
          {
            type: "recovery.routing.converged",
            targetRegionId: secondaryRegionCfg.id,
            convergenceTimeMs: routing.convergenceDurationMs ?? 0,
          }
        );
      }

      // Step Dependency Recovery DAG & Minimum Viable Recovery
      const failedSvcSet = new Set(
        activeFailures
          .filter((f) => f.type === "dependency_failure" && f.targetServiceId)
          .map((f) => f.targetServiceId!)
      );
      const depStatus = stepDependencyRecovery({
        services: scenario.services,
        dependencies,
        activeRegionId: activePrimaryRegionId,
        regions,
        failedServiceIds: failedSvcSet,
        identityOutage: activeFailures.some((f) => f.type === "identity_outage"),
        nowMs,
        recoveryStartedAtMs,
        policy,
      });
      minimumViableRecovered = depStatus.mvrRecovered;
      fullRecoveryAchieved = depStatus.fullRecovered;

      // Verify service + data recovery -> COMPLETED (never equates routing cutover alone with recovery!)
      if (
        !failover.paused &&
        failover.state === "RESTORING_DEPENDENCIES" &&
        routing.converged &&
        (depStatus.fullRecovered ||
          (policy.minimumViableRecoveryEnabled && depStatus.mvrRecovered)) &&
        !cycleCheck.hasCycle
      ) {
        failover.state = "VERIFYING";
      } else if (!failover.paused && failover.state === "VERIFYING") {
        failover.state = "COMPLETED";
        failover.completedAtMs = nowMs;
        verifiedAtMs = nowMs;
        if (incidents[0]) {
          incidents[0].status = "resolved";
          incidents[0].resolvedAtMs = nowMs;
        }
        failover.timeline.push({
          atMs: nowMs,
          phase: "COMPLETED",
          summary: `Service readiness, dependencies & data continuity verified on '${secondaryRegionCfg.id}'.`,
        });
        emitFrame(
          nowMs,
          `Failover & recovery verification COMPLETED on '${secondaryRegionCfg.id}'`,
          [secondaryRegionCfg.id],
          {
            type: "recovery.failover.completed",
            state: "COMPLETED",
            achievedRtoMs:
              failureStartedAtMs !== null
                ? Math.max(0, nowMs - failureStartedAtMs)
                : null,
          }
        );
      }

      // Failback state machine progression when triggered
      if (failback.state === "REQUESTED") {
        failback.state = "VALIDATING_ORIGINAL_REGION";
      } else if (failback.state === "VALIDATING_ORIGINAL_REGION") {
        const orig = regions[failback.originalRegionId];
        const blockedFault = activeFailures.some(
          (f) => f.type === "failback_blocked_stale"
        );
        if (!orig || orig.state === "UNAVAILABLE" || blockedFault) {
          failback.state = "FAILED";
          failback.failureReason =
            blockedFault
              ? "Failback blocked: original primary holds stale data or replication has not caught up."
              : `Original region '${failback.originalRegionId}' is still UNAVAILABLE.`;
        } else {
          failback.state = "REBUILDING_DATA";
          failback.dataRebuildProgressPct = 50;
        }
      } else if (failback.state === "REBUILDING_DATA") {
        failback.dataRebuildProgressPct = 100;
        failback.state = "CATCHING_UP_REPLICATION";
        failback.replicationCatchupPct = 50;
      } else if (failback.state === "CATCHING_UP_REPLICATION") {
        failback.replicationCatchupPct = 100;
        failback.state = "VERIFYING_CONSISTENCY";
      } else if (failback.state === "VERIFYING_CONSISTENCY") {
        failback.state = "RECONFIGURING_OWNERSHIP";
        fencing.epoch += 1;
        fencing.holderRegionId = failback.originalRegionId;
        activePrimaryRegionId = failback.originalRegionId;
      } else if (failback.state === "RECONFIGURING_OWNERSHIP") {
        failback.state = "SHIFTING_TRAFFIC";
        for (const rid of Object.keys(routing.regionalWeightsPct)) {
          routing.regionalWeightsPct[rid] =
            rid === failback.originalRegionId ? 100 : 0;
        }
      } else if (failback.state === "SHIFTING_TRAFFIC") {
        failback.state = "COMPLETED";
        failback.completedAtMs = nowMs;
        transitionRegionState(failback.originalRegionId, "HEALTHY");
        emitFrame(
          nowMs,
          `Failback COMPLETED: ownership & 100% traffic restored to '${failback.originalRegionId}'`,
          [failback.originalRegionId],
          {
            type: "recovery.failback.completed",
            state: "COMPLETED",
            originalRegionId: failback.originalRegionId,
          }
        );
      }
    }

    // Ensure final frame accurately reflects end-of-horizon metrics/RPO/RTO/invariants
    const lastFrame = frames[frames.length - 1];
    if (!lastFrame || lastFrame.virtualTimeMs < maxTicks) {
      const snap = buildSnapshot(maxTicks);
      const primaryObj = snap.objectiveEvaluations[0];
      emitFrame(
        maxTicks,
        `Simulation horizon completed (${scenario.label})`,
        [activePrimaryRegionId],
        {
          type: "recovery.objective.evaluated",
          objectiveId: primaryObj?.objectiveId ?? "obj_1",
          rpoMet: primaryObj?.rpoMet ?? true,
          rtoMet: primaryObj?.rtoMet ?? true,
        }
      );
    }

    const finalState = frames[frames.length - 1]?.runtimeState?.disasterRecoveryState;
    const failedInv = finalState?.invariants.allPassed === false;

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: primaryRegionCfg.id,
      request: {
        id: `dr_req_${scenario.id}`,
        method: "POST",
        path: "/disaster-recovery",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: scenario.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: maxTicks,
      },
      timing: {
        nodeDurationMs: 20,
        edgeDurationMs: 10,
      },
      presetId: scenario.presetId ?? "custom",
    };

    return {
      runId: `dr_run_${scenario.id}_${scenario.seed}`,
      architectureId: "arch_disaster_recovery_sim",
      architectureRevisionId: scenario.architectureRevisionId,
      snapshotHash: `dr_${scenario.id}_${frames.length}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: scenario.regions.map((r) => r.id),
      traversedEdgeIds: [],
      configuration,
      events: allEvents,
      totalDurationMs: maxTicks,
      totalEvents: allEvents.length,
      totalHops: scenario.regions.length + allEvents.length,
      outcome: failedInv ? "failure" : "success",
      terminalReason: failedInv
        ? finalState?.invariants.violations.join("; ")
        : `Disaster recovery simulation completed at ${maxTicks}ms (${frames.length} snapshots).`,
      frames,
    };
  }
}

// Re-export chain validator for direct UI backup chain inspection
export { validateBackupChain };
