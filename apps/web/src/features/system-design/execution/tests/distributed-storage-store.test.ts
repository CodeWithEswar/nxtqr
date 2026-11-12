import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createDistributedStoragePresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Distributed Storage Workspace (Phase 05.4.15)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleDistributedStorageWorkspace(false);
    store.setDistributedStorageScenario(null);
  });

  it("toggles Distributed Storage workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isDistributedStorageWorkspaceOpen).toBe(false);

    store.toggleDistributedStorageWorkspace(true);
    expect(useExecutionStore.getState().isDistributedStorageWorkspaceOpen).toBe(
      true
    );

    store.toggleDistributedStorageWorkspace(false);
    expect(useExecutionStore.getState().isDistributedStorageWorkspaceOpen).toBe(
      false
    );
  });

  it("loads live_shard_migration and quorum_write presets via setScenarioPreset and auto-runs simulation", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("live_shard_migration");

    let state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("live_shard_migration");
    expect(state.activeDistributedStorageScenario?.presetId).toBe(
      "live_shard_migration"
    );
    expect(state.isDistributedStorageWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.playbackState.status).toBe("playing");

    const lastMigFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastMigFrame?.runtimeState?.distributedStorageState?.metrics
        .migrationsCompleted
    ).toBeGreaterThanOrEqual(1);

    store.setScenarioPreset("quorum_write");
    state = useExecutionStore.getState();
    const lastQuorumFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastQuorumFrame?.runtimeState?.distributedStorageState?.replicationMode
    ).toBe("leaderless");
    expect(
      lastQuorumFrame?.runtimeState?.distributedStorageState?.quorumConfig
        ?.overlapStrong
    ).toBe(true);
  });

  it("reconstructs exact intermediate storage state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createDistributedStoragePresetScenario(
      "live_shard_migration"
    );
    store.runDistributedStorageSimulation(scenario);

    const state = useExecutionStore.getState();
    expect(state.trace!.frames.length).toBeGreaterThan(2);

    const midIndex = Math.floor(state.trace!.frames.length / 2);
    store.seekToStep(midIndex);
    const frameAtMid = useExecutionStore.getState().playbackState.currentFrame;
    expect(
      frameAtMid?.runtimeState?.distributedStorageState?.virtualTimeMs
    ).toBe(
      state.trace!.frames[midIndex]?.runtimeState?.distributedStorageState
        ?.virtualTimeMs
    );

    store.previousStep();
    const frameAtPrev = useExecutionStore.getState().playbackState.currentFrame;
    expect(
      frameAtPrev?.runtimeState?.distributedStorageState?.virtualTimeMs
    ).toBe(
      state.trace!.frames[midIndex - 1]?.runtimeState?.distributedStorageState
        ?.virtualTimeMs
    );
  });

  it("closes Distributed Storage drawer on toggleExecutionMode(false)", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("basic_hash_partitioning");
    expect(useExecutionStore.getState().isDistributedStorageWorkspaceOpen).toBe(
      true
    );

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isDistributedStorageWorkspaceOpen).toBe(
      false
    );
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

