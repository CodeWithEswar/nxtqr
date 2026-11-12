import { describe, it, expect } from "vitest";
import {
  DISASTER_RECOVERY_PRESET_METADATA,
  DisasterRecoveryExecutionEngine,
  compareRecoveryStrategies,
  createDisasterRecoveryPresetScenario,
  type DisasterRecoveryPresetId,
} from "../index";

describe("DisasterRecoveryExecutionEngine — Phase 05.4.20 (Multi-Region Failover, Backups, RPO/RTO & Business Continuity)", () => {
  it("executes all 40 disaster recovery presets deterministically with zero invariant violations", () => {
    expect(DISASTER_RECOVERY_PRESET_METADATA).toHaveLength(40);

    for (const meta of DISASTER_RECOVERY_PRESET_METADATA) {
      const s1 = createDisasterRecoveryPresetScenario(meta.id);
      const s2 = createDisasterRecoveryPresetScenario(meta.id);
      const t1 = DisasterRecoveryExecutionEngine.runScenario(s1);
      const t2 = DisasterRecoveryExecutionEngine.runScenario(s2);

      expect(t1.frames.length).toBeGreaterThanOrEqual(2);
      expect(t1.events.length).toBe(t2.events.length);
      expect(t1.snapshotHash).toBe(t2.snapshotHash);

      const last1 = t1.frames[t1.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
      const last2 = t2.frames[t2.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
      expect(last1.invariants.allPassed, `Preset ${meta.id} invariant violations: ${last1.invariants.violations.join("; ")}`).toBe(true);
      expect(last1.metrics.achievedRpoMs).toBe(last2.metrics.achievedRpoMs);
      expect(last1.metrics.achievedRtoMs).toBe(last2.metrics.achievedRtoMs);
    }
  });

  it("verifies fencing, promotion, routing convergence, and RTO/RPO measurement under regional outage", () => {
    const tFail = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("auto_failover_success")
    );
    const sFail = tFail.frames[tFail.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sFail.failover.state).toBe("COMPLETED");
    expect(sFail.fencing.fencingEstablished).toBe(true);
    expect(sFail.fencing.epoch).toBeGreaterThanOrEqual(2);
    expect(sFail.routing.converged).toBe(true);
    expect(sFail.metrics.achievedRtoMs).not.toBeNull();

    // Failed fencing halts unsafe promotion
    const tBadFence = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("failed_fencing")
    );
    const sBadFence = tBadFence.frames[tBadFence.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sBadFence.failover.state).toBe("FAILED");
    expect(sBadFence.fencing.splitBrainRisk).toBe(true);

    // Split-brain unsafe override explicitly flags splitBrainRisk
    const tSb = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("split_brain_risk")
    );
    const sSb = tSb.frames[tSb.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sSb.fencing.splitBrainRisk).toBe(true);
  });

  it("distinguishes synchronous zero acknowledged write loss from asynchronous write loss & backup chain verification", () => {
    const tSync = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("zero_acknowledged_loss")
    );
    const sSync = tSync.frames[tSync.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sSync.metrics.missingAcknowledgedWrites).toBe(0);
    expect(sSync.objectiveEvaluations[0]!.dataLossClassification).toBe("NO_ACKNOWLEDGED_LOSS");

    const tAsyncLoss = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("acknowledged_write_loss")
    );
    const sAsyncLoss = tAsyncLoss.frames[tAsyncLoss.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sAsyncLoss.metrics.missingAcknowledgedWrites).toBeGreaterThan(0);
    expect(sAsyncLoss.objectiveEvaluations[0]!.rpoMet).toBe(false);

    // Corrupted backup NEVER silently passes
    const tCorrupt = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("corrupted_backup")
    );
    const sCorrupt = tCorrupt.frames[tCorrupt.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sCorrupt.restore.state).toBe("FAILED");
    expect(sCorrupt.restore.integrityVerified).toBe(false);

    // PITR recovery completes cleanly with monotonic ordered log replay
    const tPitr = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("pitr_recovery")
    );
    const sPitr = tPitr.frames[tPitr.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sPitr.restore.state).toBe("COMPLETED");
    expect(sPitr.restore.replayedLsnIds.length).toBeGreaterThanOrEqual(1);
  });

  it("verifies DNS TTL stale window vs GLB, standby capacity deficit, dependency cycles, and failback safety", () => {
    const tStaleDns = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("stale_dns_cache")
    );
    const sStaleDns = tStaleDns.frames[tStaleDns.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    const tGlb = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("glb_failover")
    );
    const sGlb = tGlb.frames[tGlb.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sStaleDns.metrics.lostRequests).toBeGreaterThan(sGlb.metrics.lostRequests);

    // Capacity deficit sheds load explicitly
    const tCap = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("insufficient_standby_capacity")
    );
    const sCap = tCap.frames[tCap.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sCap.metrics.recoveryCapacityDeficitRps).toBeGreaterThan(0);

    // Dependency cycle detection blocks unsafe completion
    const cyc = createDisasterRecoveryPresetScenario("complete_regional_outage");
    cyc.services[0]!.dependencyIds = ["checkout-api"];
    const tCyc = DisasterRecoveryExecutionEngine.runScenario(cyc);
    const sCyc = tCyc.frames[tCyc.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
    expect(sCyc.hasCircularDependencies).toBe(true);
    expect(sCyc.failover.state).toBe("FAILED");

    // Successful failback & blocked stale failback
    const tFbOk = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("successful_failback")
    );
    expect(tFbOk.frames[tFbOk.frames.length - 1]!.runtimeState!.disasterRecoveryState!.failback.state).toBe("COMPLETED");

    const tFbFail = DisasterRecoveryExecutionEngine.runScenario(
      createDisasterRecoveryPresetScenario("failed_failback")
    );
    expect(tFbFail.frames[tFbFail.frames.length - 1]!.runtimeState!.disasterRecoveryState!.failback.state).toBe("FAILED");
  });

  it("compares recovery strategies cleanly and enforces randomized-seed invariants", () => {
    const cmp = compareRecoveryStrategies(
      createDisasterRecoveryPresetScenario("cold_standby"),
      createDisasterRecoveryPresetScenario("warm_standby")
    );
    expect(cmp.baselineLabel).toBe("Cold Standby Provisioning");
    expect(cmp.variantLabel).toBe("Warm Standby Scale-Up");

    const sampleIds: DisasterRecoveryPresetId[] = [
      "complete_regional_outage",
      "sync_replication",
      "backup_restoration",
      "successful_failback",
    ];
    for (const pid of sampleIds) {
      for (const seed of [7, 42, 313, 999]) {
        const s = createDisasterRecoveryPresetScenario(pid);
        s.seed = seed;
        const t = DisasterRecoveryExecutionEngine.runScenario(s);
        const last = t.frames[t.frames.length - 1]!.runtimeState!.disasterRecoveryState!;
        expect(last.invariants.allPassed).toBe(true);
      }
    }
  });
});

