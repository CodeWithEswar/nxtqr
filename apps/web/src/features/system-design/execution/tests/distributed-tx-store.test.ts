import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createDistributedTransactionPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Distributed Transactions Workspace (Phase 05.4.14)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleDistributedTxWorkspace(false);
    store.setDistributedTxScenario(null);
  });

  it("toggles Distributed Transactions workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isDistributedTxWorkspaceOpen).toBe(false);

    store.toggleDistributedTxWorkspace(true);
    expect(useExecutionStore.getState().isDistributedTxWorkspaceOpen).toBe(true);

    store.toggleDistributedTxWorkspace(false);
    expect(useExecutionStore.getState().isDistributedTxWorkspaceOpen).toBe(false);
  });

  it("loads 2PC and Saga presets via setScenarioPreset and auto-runs simulation", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("successful_2pc");

    let state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("successful_2pc");
    expect(state.activeDistributedTxScenario?.protocol).toBe("two_phase_commit");
    expect(state.isDistributedTxWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.playbackState.status).toBe("playing");

    const last2PCFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      last2PCFrame?.runtimeState?.distributedTransactionState?.twoPCTransactions[
        "TX-104"
      ]?.decision
    ).toBe("COMMIT");

    store.setScenarioPreset("reverse_compensation");
    state = useExecutionStore.getState();
    const lastSagaFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastSagaFrame?.runtimeState?.distributedTransactionState?.saga?.state
    ).toBe("COMPENSATED");
  });

  it("reconstructs exact intermediate 2PC / Saga state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createDistributedTransactionPresetScenario(
      "reverse_compensation"
    );
    store.runDistributedTxSimulation(scenario);

    const trace = useExecutionStore.getState().trace!;
    expect(trace.frames.length).toBeGreaterThan(6);

    store.seekToStep(trace.frames.length - 1);
    expect(
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.distributedTransactionState?.saga?.state
    ).toBe("COMPENSATED");

    store.seekToStep(2);
    expect(
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.distributedTransactionState?.saga?.state
    ).toBe("RUNNING");

    store.previousStep();
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(1);
  });

  it("closes Distributed Transactions workspace on toggleExecutionMode(false)", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("successful_saga_choreography");
    expect(useExecutionStore.getState().isDistributedTxWorkspaceOpen).toBe(true);

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isDistributedTxWorkspaceOpen).toBe(false);
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

