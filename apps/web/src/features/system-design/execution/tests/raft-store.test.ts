import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createRaftPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Distributed Consensus & Raft Workspace (Phase 05.4.13)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleRaftWorkspace(false);
    store.setRaftScenario(null);
  });

  it("toggles Raft Consensus workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isRaftWorkspaceOpen).toBe(false);

    store.toggleRaftWorkspace(true);
    expect(useExecutionStore.getState().isRaftWorkspaceOpen).toBe(true);

    store.toggleRaftWorkspace(false);
    expect(useExecutionStore.getState().isRaftWorkspaceOpen).toBe(false);
  });

  it("loads Raft preset via setScenarioPreset and auto-runs simulation", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("single_command_replication");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("single_command_replication");
    expect(state.activeRaftScenario).toBeDefined();
    expect(state.isRaftWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.playbackState.status).toBe("playing");

    const lastFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(lastFrame?.runtimeState?.raftState?.nodes["node-a"]?.stateMachine["x"]).toBe(42);
    expect(lastFrame?.runtimeState?.raftState?.invariants.allPassed).toBe(true);
  });

  it("reconstructs exact intermediate Raft log and commit state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createRaftPresetScenario("multiple_command_replication");
    store.runRaftSimulation(scenario);

    const trace = useExecutionStore.getState().trace!;
    expect(trace.frames.length).toBeGreaterThan(6);

    store.seekToStep(trace.frames.length - 1);
    const finalApplied =
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.raftState?.nodes["node-a"]?.volatile.lastApplied ?? 0;
    expect(finalApplied).toBe(3);

    store.seekToStep(1);
    const earlyApplied =
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.raftState?.nodes["node-a"]?.volatile.lastApplied ?? 0;
    expect(earlyApplied).toBeLessThan(finalApplied);

    store.seekToStep(4);
    store.previousStep();
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(3);
  });

  it("closes Raft workspace when toggleExecutionMode(false) is called", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("initial_leader_election");
    expect(useExecutionStore.getState().isRaftWorkspaceOpen).toBe(true);

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isRaftWorkspaceOpen).toBe(false);
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

