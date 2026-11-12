import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createDisasterRecoveryPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Disaster Recovery & Business Continuity Workspace (Phase 05.4.20)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleDisasterRecoveryWorkspace(false);
    store.setDisasterRecoveryScenario(null);
  });

  it("toggles Disaster Recovery workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isDisasterRecoveryWorkspaceOpen).toBe(false);

    store.toggleDisasterRecoveryWorkspace(true);
    expect(useExecutionStore.getState().isDisasterRecoveryWorkspaceOpen).toBe(true);

    store.toggleDisasterRecoveryWorkspace(false);
    expect(useExecutionStore.getState().isDisasterRecoveryWorkspaceOpen).toBe(false);
  });

  it("loads auto_failover_success and failed_fencing presets via setScenarioPreset", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("auto_failover_success");

    let state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("auto_failover_success");
    expect(state.activeDisasterRecoveryScenario?.presetId).toBe("auto_failover_success");
    expect(state.isDisasterRecoveryWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.playbackState.status).toBe("playing");

    const lastOk = state.trace!.frames[state.trace!.frames.length - 1];
    expect(lastOk?.runtimeState?.disasterRecoveryState?.failover.state).toBe(
      "COMPLETED"
    );

    store.setScenarioPreset("failed_fencing");
    state = useExecutionStore.getState();
    const lastBlocked = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastBlocked?.runtimeState?.disasterRecoveryState?.failover.state
    ).toBe("FAILED");
    expect(
      lastBlocked?.runtimeState?.disasterRecoveryState?.fencing.splitBrainRisk
    ).toBe(true);
  });

  it("reconstructs exact intermediate disaster recovery state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createDisasterRecoveryPresetScenario("auto_failover_success");
    store.runDisasterRecoverySimulation(scenario);

    const state = useExecutionStore.getState();
    expect(state.trace!.frames.length).toBeGreaterThan(2);

    const midIndex = Math.floor(state.trace!.frames.length / 2);
    store.seekToStep(midIndex);
    const midState = useExecutionStore.getState();
    expect(midState.playbackState.currentStepIndex).toBe(midIndex);
    expect(
      midState.playbackState.currentFrame?.runtimeState?.disasterRecoveryState
        ?.virtualTimeMs
    ).toBe(state.trace!.frames[midIndex]!.virtualTimeMs);

    store.previousStep();
    const prevState = useExecutionStore.getState();
    expect(prevState.playbackState.currentStepIndex).toBe(midIndex - 1);
  });

  it("closes Disaster Recovery workspace cleanly when toggleExecutionMode(false) is invoked", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("healthy_active_passive");
    expect(useExecutionStore.getState().isDisasterRecoveryWorkspaceOpen).toBe(true);

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isDisasterRecoveryWorkspaceOpen).toBe(false);
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

