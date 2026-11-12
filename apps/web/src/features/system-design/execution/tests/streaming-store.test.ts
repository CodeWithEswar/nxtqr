import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createStreamingPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Streaming Execution & Workspace Integration (Phase 05.4.9)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleStreamingWorkspace(false);
    store.setStreamingScenario(null);
  });

  it("toggles streaming execution workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isStreamingWorkspaceOpen).toBe(false);

    store.toggleStreamingWorkspace(true);
    expect(useExecutionStore.getState().isStreamingWorkspaceOpen).toBe(true);

    store.toggleStreamingWorkspace(false);
    expect(useExecutionStore.getState().isStreamingWorkspaceOpen).toBe(false);
  });

  it("loads streaming scenario preset and runs execution automatically", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("single_partition_basic");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("single_partition_basic");
    expect(state.activeStreamingScenario).toBeDefined();
    expect(state.isStreamingWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.trace?.outcome).toBe("success");
    expect(state.playbackState.status).toBe("playing");
  });

  it("runs streaming simulation for consumer crash and rebalance", () => {
    const store = useExecutionStore.getState();
    const scenario = createStreamingPresetScenario("consumer_crash_rebalance");

    const success = store.runStreamingSimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.activeStreamingScenario?.id).toBe("consumer_crash_rebalance");
    expect(state.trace).toBeDefined();
    expect(state.trace?.events.some((e: any) => e.type === "stream.rebalance.started")).toBe(true);
    expect(state.trace?.events.some((e: any) => e.type === "stream.partition.assigned")).toBe(true);
  });

  it("runs streaming simulation for key-based ordering", () => {
    const store = useExecutionStore.getState();
    const scenario = createStreamingPresetScenario("key_based_ordering");

    const success = store.runStreamingSimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace).toBeDefined();
    const keySelectedEvents = state.trace?.events.filter(
      (e: any) => e.type === "stream.partition.selected" && e.keyUsed === "customer-42"
    );
    expect(keySelectedEvents && keySelectedEvents.length > 0).toBe(true);
    // All customer-42 events must have identical partitionIndex
    const firstPartition = (keySelectedEvents![0] as any).partitionIndex;
    for (const evt of keySelectedEvents!) {
      expect((evt as any).partitionIndex).toBe(firstPartition);
    }
  });

  it("runs streaming simulation for dead-letter queue fallback routing", () => {
    const store = useExecutionStore.getState();
    const scenario = createStreamingPresetScenario("dead_letter_queue_routing");

    const success = store.runStreamingSimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace).toBeDefined();
    expect(state.trace?.events.some((e: any) => e.type === "stream.dlq.record.appended")).toBe(true);
  });
});

