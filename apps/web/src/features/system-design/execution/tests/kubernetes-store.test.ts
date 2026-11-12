import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createKubernetesPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Kubernetes Scheduling & Orchestration Workspace (Phase 05.4.10)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleKubernetesWorkspace(false);
    store.setKubernetesScenario(null);
  });

  it("toggles Kubernetes orchestration workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isKubernetesWorkspaceOpen).toBe(false);

    store.toggleKubernetesWorkspace(true);
    expect(useExecutionStore.getState().isKubernetesWorkspaceOpen).toBe(true);

    store.toggleKubernetesWorkspace(false);
    expect(useExecutionStore.getState().isKubernetesWorkspaceOpen).toBe(false);
  });

  it("loads Kubernetes preset and runs execution automatically", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("basic_pod_scheduling");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("basic_pod_scheduling");
    expect(state.activeKubernetesScenario).toBeDefined();
    expect(state.isKubernetesWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.trace?.outcome).toBe("success");
    expect(state.playbackState.status).toBe("playing");
  });

  it("runs Kubernetes simulation for rolling update and tracks revision transitions", () => {
    const store = useExecutionStore.getState();
    const scenario = createKubernetesPresetScenario("rolling_update");

    const success = store.runKubernetesSimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace).toBeDefined();
    const finalFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(finalFrame?.runtimeState?.kubernetesState?.deployments["dep-api"]?.currentRevision).toBe(2);
    expect(finalFrame?.runtimeState?.kubernetesState?.deployments["dep-api"]?.rolloutState).toBe("stable");
  });

  it("reconstructs exact intermediate Kubernetes state across playback step-backward and seek", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("rolling_update");

    const trace = useExecutionStore.getState().trace!;
    const total = trace.frames.length;
    expect(total).toBeGreaterThan(5);

    // Seek to end, then back to frame 0
    store.pause();
    store.seekToStep(total - 1);
    const endIdx = useExecutionStore.getState().playbackState.currentStepIndex;
    expect(endIdx).toBe(total - 1);
    expect(
      trace.frames[endIdx]?.runtimeState?.kubernetesState?.deployments["dep-api"]?.currentRevision
    ).toBe(2);

    store.seekToStep(1);
    store.previousStep();
    const startIdx = useExecutionStore.getState().playbackState.currentStepIndex;
    expect(startIdx).toBe(0);
    expect(
      trace.frames[startIdx]?.runtimeState?.kubernetesState?.deployments["dep-api"]?.currentRevision
    ).toBe(1);
  });

  it("resets isKubernetesWorkspaceOpen when exiting execution mode", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("node_failure_recovery");
    expect(useExecutionStore.getState().isKubernetesWorkspaceOpen).toBe(true);

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isKubernetesWorkspaceOpen).toBe(false);
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});
