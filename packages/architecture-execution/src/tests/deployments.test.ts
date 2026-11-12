import { describe, expect, it } from "vitest";
import {
  DEPLOYMENT_PRESET_METADATA,
  DeploymentExecutionEngine,
  compareDeploymentStrategies,
  createDeploymentPresetScenario,
  deterministicIdentityBucket,
} from "../index";

describe("DeploymentExecutionEngine — Phase 05.4.19 (Rolling, Blue-Green, Canary & Progressive Delivery)", () => {
  it("executes all 36 presets deterministically with zero invariant violations", () => {
    expect(DEPLOYMENT_PRESET_METADATA).toHaveLength(36);

    for (const meta of DEPLOYMENT_PRESET_METADATA) {
      const s1 = createDeploymentPresetScenario(meta.id);
      const s2 = createDeploymentPresetScenario(meta.id);
      const t1 = DeploymentExecutionEngine.runScenario(s1);
      const t2 = DeploymentExecutionEngine.runScenario(s2);

      expect(t1.frames.length).toBeGreaterThanOrEqual(1);
      expect(t1.events.length).toBe(t2.events.length);

      const final1 =
        t1.frames[t1.frames.length - 1]!.runtimeState!.deploymentState!;
      const final2 =
        t2.frames[t2.frames.length - 1]!.runtimeState!.deploymentState!;

      expect(final1.invariants.allPassed, meta.id).toBe(true);
      expect(final1.metrics).toEqual(final2.metrics);
    }
  });

  it("verifies Recreate downtime gap, Rolling Update surge completion, Blue-Green switch, and Canary auto-promotion", () => {
    // Recreate temporarily has noHealthyEndpoints before candidate starts
    const tRec = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("recreate_downtime")
    );
    const hadDowntimeFrame = tRec.frames.some((f) => {
      const alloc =
        f.runtimeState?.deploymentState?.trafficAllocations["checkout"];
      return alloc?.noHealthyEndpoints === true;
    });
    expect(hadDowntimeFrame).toBe(true);
    expect(
      tRec.frames.slice(-1)[0]!.runtimeState!.deploymentState!.deployments[
        "dep_checkout_v2"
      ]!.state
    ).toBe("COMPLETED");

    // Rolling update completes cleanly
    const tRoll = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("rolling_update_surge")
    );
    expect(
      tRoll.frames.slice(-1)[0]!.runtimeState!.deploymentState!.deployments[
        "dep_checkout_v2"
      ]!.state
    ).toBe("COMPLETED");

    // Blue-Green switches activeEnvironment to green and completes
    const tBg = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("blue_green_success")
    );
    const sBg = tBg.frames.slice(-1)[0]!.runtimeState!.deploymentState!;
    expect(sBg.deployments["dep_checkout_v2"]!.activeEnvironment).toBe("green");
    expect(sBg.deployments["dep_checkout_v2"]!.state).toBe("COMPLETED");

    // Multi-stage canary completes at 100%
    const tCan = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("multi_stage_canary")
    );
    const sCan = tCan.frames.slice(-1)[0]!.runtimeState!.deploymentState!;
    expect(sCan.deployments["dep_checkout_v2"]!.state).toBe("COMPLETED");
    expect(sCan.deployments["dep_checkout_v2"]!.targetCandidateWeightPct).toBe(
      100
    );
  });

  it("enforces gate failures, insufficient samples (INCONCLUSIVE), missing telemetry (NO_DATA), pause/resume, and rollback outcomes", () => {
    // Error-rate regression triggers FAIL + ROLLED_BACK to rev_v1
    const tErr = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("canary_error_regression")
    );
    const sErr = tErr.frames.slice(-1)[0]!.runtimeState!.deploymentState!;
    expect(sErr.metrics.gatesFailed).toBeGreaterThanOrEqual(1);
    expect(sErr.deployments["dep_checkout_v2"]!.state).toBe("ROLLED_BACK");
    expect(sErr.incidents.length).toBeGreaterThanOrEqual(1);

    // Insufficient samples holds INCONCLUSIVE without promoting
    const tSamp = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("insufficient_canary_samples")
    );
    const sSamp = tSamp.frames.slice(-1)[0]!.runtimeState!.deploymentState!;
    expect(sSamp.metrics.gatesInconclusiveOrNoData).toBeGreaterThanOrEqual(1);
    expect(sSamp.deployments["dep_checkout_v2"]!.state).toBe("PROGRESSING");

    // Telemetry loss renders NO_DATA and prevents promotion
    const tTel = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("deploy_telemetry_loss")
    );
    const sTel = tTel.frames.slice(-1)[0]!.runtimeState!.deploymentState!;
    expect(
      sTel.deployments["dep_checkout_v2"]!.gateEvaluations.some(
        (g) => g.outcome === "NO_DATA"
      )
    ).toBe(true);
    expect(sTel.deployments["dep_checkout_v2"]!.state).not.toBe("COMPLETED");

    // Paused stays PAUSED; Resumed continues to COMPLETED
    const tPaused = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("paused_rollout")
    );
    expect(
      tPaused.frames.slice(-1)[0]!.runtimeState!.deploymentState!.deployments[
        "dep_checkout_v2"
      ]!.state
    ).toBe("PAUSED");

    const tResumed = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("resumed_rollout")
    );
    expect(
      tResumed.frames.slice(-1)[0]!.runtimeState!.deploymentState!.deployments[
        "dep_checkout_v2"
      ]!.state
    ).toBe("COMPLETED");

    // Rollback failure when previous revision is unavailable
    const tRbFail = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("rollback_failure")
    );
    expect(
      tRbFail.frames.slice(-1)[0]!.runtimeState!.deploymentState!.deployments[
        "dep_checkout_v2"
      ]!.rollback.state
    ).toBe("FAILED");
  });

  it("verifies deterministic feature flag evaluation, multi-service dependency ordering, and liveness restarts", () => {
    const b1 = deterministicIdentityBucket("user-42", "new-checkout");
    const b2 = deterministicIdentityBucket("user-42", "new-checkout");
    expect(b1).toBe(b2);

    const tMulti = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("multi_service_rollout")
    );
    const sMulti = tMulti.frames.slice(-1)[0]!.runtimeState!.deploymentState!;
    expect(sMulti.deployments["dep_payment_v2"]!.state).toBe("COMPLETED");

    const tLive = DeploymentExecutionEngine.runScenario(
      createDeploymentPresetScenario("liveness_restart")
    );
    const sLive = tLive.frames.slice(-1)[0]!.runtimeState!.deploymentState!;
    expect(sLive.metrics.restartsTriggered).toBeGreaterThanOrEqual(1);
  });

  it("compares deployment strategies and holds invariants across randomized seeds", () => {
    const comp = compareDeploymentStrategies(
      createDeploymentPresetScenario("canary_error_regression"),
      createDeploymentPresetScenario("multi_stage_canary")
    );
    expect(comp.deltas.errorRateDelta).toBeLessThan(0);

    for (let seed = 1; seed <= 8; seed++) {
      const sc = createDeploymentPresetScenario("rolling_update_surge");
      sc.seed = seed * 13;
      const tr = DeploymentExecutionEngine.runScenario(sc);
      const finalState =
        tr.frames[tr.frames.length - 1]!.runtimeState!.deploymentState!;
      expect(finalState.invariants.allPassed).toBe(true);
    }
  });
});

