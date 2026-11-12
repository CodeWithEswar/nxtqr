import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createServiceMeshPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Microservices & Service Mesh Workspace (Phase 05.4.12)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleServiceMeshWorkspace(false);
    store.setServiceMeshScenario(null);
  });

  it("toggles Service Mesh workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isServiceMeshWorkspaceOpen).toBe(false);

    store.toggleServiceMeshWorkspace(true);
    expect(useExecutionStore.getState().isServiceMeshWorkspaceOpen).toBe(true);

    store.toggleServiceMeshWorkspace(false);
    expect(useExecutionStore.getState().isServiceMeshWorkspaceOpen).toBe(false);
  });

  it("loads Service Mesh preset via setScenarioPreset and auto-runs simulation", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("circuit_breaker_opening");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("circuit_breaker_opening");
    expect(state.activeServiceMeshScenario).toBeDefined();
    expect(state.isServiceMeshWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.playbackState.status).toBe("playing");

    const lastFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastFrame?.runtimeState?.serviceMeshState?.circuits["payments"]?.state
    ).toBe("open");
    expect(
      lastFrame?.runtimeState?.serviceMeshState?.metrics.circuitRejectionCount
    ).toBeGreaterThan(0);
  });

  it("reconstructs exact intermediate Service Mesh state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createServiceMeshPresetScenario("half_open_recovery");
    store.runServiceMeshSimulation(scenario);

    const trace = useExecutionStore.getState().trace!;
    expect(trace.frames.length).toBeGreaterThan(6);

    store.seekToStep(trace.frames.length - 1);
    expect(
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.serviceMeshState?.circuits["payments"]?.state
    ).toBe("closed");

    store.seekToStep(2);
    const earlyCalls =
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.serviceMeshState?.metrics.totalRootRequests ?? 0;
    expect(earlyCalls).toBeLessThanOrEqual(2);

    store.seekToStep(trace.frames.length - 1);
    store.previousStep();
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(
      trace.frames.length - 2
    );
  });

  it("resets Service Mesh workspace state when exiting execution mode", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("basic_service_request");
    expect(useExecutionStore.getState().isServiceMeshWorkspaceOpen).toBe(true);

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isServiceMeshWorkspaceOpen).toBe(false);
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

