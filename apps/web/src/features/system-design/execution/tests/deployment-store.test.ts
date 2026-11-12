import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createDeploymentPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Deployment & Progressive Delivery Workspace (Phase 05.4.19)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleDeploymentWorkspace(false);
    store.setDeploymentScenario(null);
  });

  it("toggles Deployment workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isDeploymentWorkspaceOpen).toBe(false);

    store.toggleDeploymentWorkspace(true);
    expect(useExecutionStore.getState().isDeploymentWorkspaceOpen).toBe(true);

    store.toggleDeploymentWorkspace(false);
    expect(useExecutionStore.getState().isDeploymentWorkspaceOpen).toBe(false);
  });

  it("loads multi_stage_canary and canary_error_regression presets via setScenarioPreset", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("multi_stage_canary");

    let state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("multi_stage_canary");
    expect(state.activeDeploymentScenario?.presetId).toBe("multi_stage_canary");
    expect(state.isDeploymentWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.playbackState.status).toBe("playing");

    const lastOk = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastOk?.runtimeState?.deploymentState?.deployments["dep_checkout_v2"]?.state
    ).toBe("COMPLETED");

    store.setScenarioPreset("canary_error_regression");
    state = useExecutionStore.getState();
    const lastErr = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastErr?.runtimeState?.deploymentState?.deployments["dep_checkout_v2"]?.state
    ).toBe("ROLLED_BACK");
    expect(
      lastErr?.runtimeState?.deploymentState?.metrics.gatesFailed
    ).toBeGreaterThanOrEqual(1);
  });

  it("reconstructs exact intermediate deployment state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createDeploymentPresetScenario("canary_error_regression");
    store.runDeploymentSimulation(scenario);

    const state = useExecutionStore.getState();
    expect(state.trace!.frames.length).toBeGreaterThan(2);

    const midIndex = Math.floor(state.trace!.frames.length / 2);
    store.seekToStep(midIndex);
    const midState = useExecutionStore.getState();
    expect(midState.playbackState.currentStepIndex).toBe(midIndex);
    expect(
      midState.playbackState.currentFrame?.runtimeState?.deploymentState
        ?.virtualTimeMs
    ).toBe(state.trace!.frames[midIndex]!.virtualTimeMs);

    store.previousStep();
    const prevState = useExecutionStore.getState();
    expect(prevState.playbackState.currentStepIndex).toBe(midIndex - 1);
  });

  it("closes Deployment workspace cleanly when toggleExecutionMode(false) is invoked", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("blue_green_success");
    expect(useExecutionStore.getState().isDeploymentWorkspaceOpen).toBe(true);

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isDeploymentWorkspaceOpen).toBe(false);
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

