import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createTrafficControlPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Traffic Control Workspace (Phase 05.4.16)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleTrafficControlWorkspace(false);
    store.setTrafficControlScenario(null);
  });

  it("toggles Traffic Control workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isTrafficControlWorkspaceOpen).toBe(false);

    store.toggleTrafficControlWorkspace(true);
    expect(useExecutionStore.getState().isTrafficControlWorkspaceOpen).toBe(
      true
    );

    store.toggleTrafficControlWorkspace(false);
    expect(useExecutionStore.getState().isTrafficControlWorkspaceOpen).toBe(
      false
    );
  });

  it("loads token_bucket_burst and backpressure_propagation presets via setScenarioPreset", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("token_bucket_burst");

    let state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("token_bucket_burst");
    expect(state.activeTrafficControlScenario?.presetId).toBe(
      "token_bucket_burst"
    );
    expect(state.isTrafficControlWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.playbackState.status).toBe("playing");

    const lastTb = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastTb?.runtimeState?.trafficControlState?.metrics.rateLimitRejections
    ).toBeGreaterThanOrEqual(1);

    store.setScenarioPreset("backpressure_propagation");
    state = useExecutionStore.getState();
    const lastBp = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastBp?.runtimeState?.trafficControlState?.backpressure.activatedCount
    ).toBeGreaterThanOrEqual(1);
  });

  it("reconstructs exact intermediate traffic control state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createTrafficControlPresetScenario("token_bucket_burst");
    store.runTrafficControlSimulation(scenario);

    const state = useExecutionStore.getState();
    expect(state.trace!.frames.length).toBeGreaterThan(2);

    const midIndex = Math.floor(state.trace!.frames.length / 2);
    store.seekToStep(midIndex);
    const frameAtMid = useExecutionStore.getState().playbackState.currentFrame;
    expect(
      frameAtMid?.runtimeState?.trafficControlState?.metrics.offeredRequests
    ).toBe(
      state.trace!.frames[midIndex]?.runtimeState?.trafficControlState?.metrics
        .offeredRequests
    );

    store.previousStep();
    const frameAtPrev = useExecutionStore.getState().playbackState.currentFrame;
    expect(
      frameAtPrev?.runtimeState?.trafficControlState?.virtualTimeMs
    ).toBe(
      state.trace!.frames[midIndex - 1]?.runtimeState?.trafficControlState
        ?.virtualTimeMs
    );
  });

  it("closes Traffic Control drawer on toggleExecutionMode(false)", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("sliding_window_log");
    expect(useExecutionStore.getState().isTrafficControlWorkspaceOpen).toBe(
      true
    );

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isTrafficControlWorkspaceOpen).toBe(
      false
    );
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

