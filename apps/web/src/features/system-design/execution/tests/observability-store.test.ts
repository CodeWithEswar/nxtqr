import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createObservabilityPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Observability Workspace (Phase 05.4.17)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleObservabilityWorkspace(false);
    store.setObservabilityScenario(null);
  });

  it("toggles Observability workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isObservabilityWorkspaceOpen).toBe(false);

    store.toggleObservabilityWorkspace(true);
    expect(useExecutionStore.getState().isObservabilityWorkspaceOpen).toBe(
      true
    );

    store.toggleObservabilityWorkspace(false);
    expect(useExecutionStore.getState().isObservabilityWorkspaceOpen).toBe(
      false
    );
  });

  it("loads database_slowdown and successful_mitigation presets via setScenarioPreset", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("database_slowdown");

    let state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("database_slowdown");
    expect(state.activeObservabilityScenario?.presetId).toBe(
      "database_slowdown"
    );
    expect(state.isObservabilityWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.playbackState.status).toBe("playing");

    const lastSlow = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastSlow?.runtimeState?.observabilityState?.metrics.incidentsDetected
    ).toBeGreaterThanOrEqual(1);

    store.setScenarioPreset("successful_mitigation");
    state = useExecutionStore.getState();
    const lastMitigated = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastMitigated?.runtimeState?.observabilityState?.metrics.incidentsResolved
    ).toBeGreaterThanOrEqual(1);
  });

  it("reconstructs exact intermediate observability state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createObservabilityPresetScenario("database_slowdown");
    store.runObservabilitySimulation(scenario);

    const state = useExecutionStore.getState();
    expect(state.trace!.frames.length).toBeGreaterThan(2);

    const midIndex = Math.floor(state.trace!.frames.length / 2);
    store.seekToStep(midIndex);
    const frameAtMid = useExecutionStore.getState().playbackState.currentFrame;
    expect(
      frameAtMid?.runtimeState?.observabilityState?.metrics.totalTraces
    ).toBe(
      state.trace!.frames[midIndex]?.runtimeState?.observabilityState?.metrics
        .totalTraces
    );

    store.previousStep();
    const frameAtPrev = useExecutionStore.getState().playbackState.currentFrame;
    expect(
      frameAtPrev?.runtimeState?.observabilityState?.virtualTimeMs
    ).toBe(
      state.trace!.frames[midIndex - 1]?.runtimeState?.observabilityState
        ?.virtualTimeMs
    );
  });

  it("closes observability workspace on toggleExecutionMode(false)", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("slo_breach");
    expect(useExecutionStore.getState().isObservabilityWorkspaceOpen).toBe(
      true
    );

    store.toggleExecutionMode(false);
    const after = useExecutionStore.getState();
    expect(after.isExecutionModeActive).toBe(false);
    expect(after.isObservabilityWorkspaceOpen).toBe(false);
  });
});

