import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

const mockNodes: BaseNode[] = [
  {
    id: "client_1",
    type: "client",
    label: "Web Browser",
    position: { x: 50, y: 100 },
    data: { componentType: "client" },
  },
  {
    id: "gateway_1",
    type: "api_gateway",
    label: "Edge Gateway",
    position: { x: 250, y: 100 },
    data: { componentType: "api_gateway" },
  },
  {
    id: "product_service",
    type: "service",
    label: "Product Service",
    position: { x: 450, y: 100 },
    data: { componentType: "service" },
  },
  {
    id: "redis_cache",
    type: "cache",
    label: "Redis Cache",
    position: { x: 650, y: 50 },
    data: { componentType: "cache" },
  },
  {
    id: "postgres_db",
    type: "database",
    label: "PostgreSQL Database",
    position: { x: 650, y: 180 },
    data: { componentType: "database" },
  },
];

const mockEdges: BaseEdge[] = [
  {
    id: "edge_client_gw",
    source: "client_1",
    target: "gateway_1",
    data: {},
  },
  {
    id: "edge_gw_srv",
    source: "gateway_1",
    target: "product_service",
    data: {},
  },
  {
    id: "edge_srv_cache",
    source: "product_service",
    target: "redis_cache",
    data: {},
  },
  {
    id: "edge_srv_db",
    source: "product_service",
    target: "postgres_db",
    data: {},
  },
];

describe("Architecture Execution Store & Canvas Integration", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.updateConfiguration({
      entryNodeId: "client_1",
      request: {
        id: "req_test",
        method: "GET",
        path: "/api/products/42",
        headers: {},
      },
    });
  });

  it("should initialize with default idle state", () => {
    const state = useExecutionStore.getState();
    expect(["idle", "stopped"]).toContain(state.playbackState.status);
    expect(state.configuration.request.method).toBe("GET");
    expect(state.isExecutionModeActive).toBe(false);
  });

  it("should execute trace from entry node through graph", () => {
    const store = useExecutionStore.getState();
    const success = store.runExecution(mockNodes, mockEdges);

    expect(success).toBe(true);

    const updated = useExecutionStore.getState();
    expect(updated.isExecutionModeActive).toBe(true);
    expect(updated.activeRun).not.toBeNull();
    expect(updated.trace).not.toBeNull();
    expect(updated.trace?.events.length).toBeGreaterThan(0);
    expect(updated.playbackState.totalSteps).toBe(updated.trace?.frames.length);

    // Initial frame corresponds to run start or entry node
    expect(updated.playbackState.currentFrame).not.toBeNull();
    expect(updated.playbackState.currentFrame?.activeNodeIds).toContain("client_1");
  });

  it("should support manual step navigation (next, previous, seek)", () => {
    const store = useExecutionStore.getState();
    store.runExecution(mockNodes, mockEdges);
    store.pause();

    const totalSteps = useExecutionStore.getState().playbackState.totalSteps;
    expect(totalSteps).toBeGreaterThan(2);

    // Step forward
    store.nextStep();
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(1);

    // Step forward again
    store.nextStep();
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(2);

    // Step back
    store.previousStep();
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(1);

    // Direct seek
    store.seekToStep(totalSteps - 1);
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(totalSteps - 1);
  });

  it("should toggle playback speed and UI drawers", () => {
    const store = useExecutionStore.getState();

    // Toggle speed
    store.setSpeed(2);
    expect(useExecutionStore.getState().playbackState.speed).toBe(2);

    // Toggle UI sections
    store.toggleTimeline(true);
    expect(useExecutionStore.getState().isTimelineOpen).toBe(true);

    store.toggleExecutionInspector(true);
    expect(useExecutionStore.getState().isExecutionInspectorOpen).toBe(true);

    store.toggleConfigDialog(true);
    expect(useExecutionStore.getState().isConfigDialogOpen).toBe(true);
  });

  it("should properly stop and reset playback state", () => {
    const store = useExecutionStore.getState();
    store.runExecution(mockNodes, mockEdges);
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(true);

    store.stop();
    const stoppedState = useExecutionStore.getState();
    expect(stoppedState.isExecutionModeActive).toBe(false);
    expect(stoppedState.playbackState.status).toBe("stopped");
    expect(stoppedState.playbackState.currentStepIndex).toBe(0);
  });

  it("should execute cache-miss scenario with modeled DB query and cache population", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("cache-miss");
    const success = store.runExecution(mockNodes, mockEdges);

    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    const events = state.trace?.events || [];

    // Verify cache.miss and database.read.completed occurred
    expect(events.some((e) => e.type === "cache.miss")).toBe(true);
    expect(events.some((e) => e.type === "database.read.completed")).toBe(true);
    expect(events.some((e) => e.type === "cache.write")).toBe(true);

    // Final frame should have response with HTTP 200 and cache populated
    const finalFrame = state.trace?.frames[state.trace.frames.length - 1];
    expect(finalFrame?.activeResponse?.status).toBe(200);
    expect(finalFrame?.activeResponse?.headers["x-cache"]).toBe("MISS");
    expect(Boolean(finalFrame?.runtimeState?.cache["products:42"])).toBe(true);
  });

  it("should execute cache-hit scenario bypassing database access", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("cache-hit");
    const success = store.runExecution(mockNodes, mockEdges);

    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    const events = state.trace?.events || [];

    // Verify cache.hit occurred and DB read was bypassed
    expect(events.some((e) => e.type === "cache.hit")).toBe(true);
    expect(events.some((e) => e.type === "database.read.started")).toBe(false);

    // Final response has x-cache: HIT
    const finalFrame = state.trace?.frames[state.trace.frames.length - 1];
    expect(finalFrame?.activeResponse?.status).toBe(200);
    expect(finalFrame?.activeResponse?.headers["x-cache"]).toBe("HIT");
  });

  it("should restore exact modeled runtime state on backward step and seek", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("cache-miss");
    store.runExecution(mockNodes, mockEdges);
    store.pause();

    const frames = useExecutionStore.getState().trace?.frames || [];
    const lastIndex = frames.length - 1;

    // In frame 0, cache does not have products:42
    store.seekToStep(0);
    let curState = useExecutionStore.getState().playbackState.currentFrame?.runtimeState;
    expect(Boolean(curState?.cache["products:42"])).toBe(false);

    // In final frame, cache does have products:42
    store.seekToStep(lastIndex);
    curState = useExecutionStore.getState().playbackState.currentFrame?.runtimeState;
    expect(Boolean(curState?.cache["products:42"])).toBe(true);

    // Step back to frame 0 restores empty cache
    store.seekToStep(0);
    curState = useExecutionStore.getState().playbackState.currentFrame?.runtimeState;
    expect(Boolean(curState?.cache["products:42"])).toBe(false);
  });

  it("should execute parallel-fanout scenario with causal branches, fan-in barrier and critical path", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("parallel-fanout");
    const success = store.runExecution(mockNodes, mockEdges);

    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    const events = state.trace?.events || [];

    // Verify fan-out, branch creation and fan-in join occurred
    expect(events.some((e) => e.type === "parallel.fanout.started")).toBe(true);
    expect(events.some((e) => e.type === "parallel.branch.created")).toBe(true);
    expect(events.some((e) => e.type === "parallel.branch.completed")).toBe(true);
    expect(events.some((e) => e.type === "parallel.join.satisfied")).toBe(true);

    // Verify spans and critical path
    const finalFrame = state.trace?.frames[state.trace.frames.length - 1];
    expect(finalFrame?.runtimeState?.activeSpans.length).toBeGreaterThan(0);
    expect(finalFrame?.runtimeState?.criticalPathSpanIds.length).toBeGreaterThan(0);

    // Verify distributed timeline and drawer toggles
    store.toggleDistributedTimeline(true);
    expect(useExecutionStore.getState().isDistributedTimelineOpen).toBe(true);

    store.toggleTraceWaterfall(true);
    expect(useExecutionStore.getState().isTraceWaterfallOpen).toBe(true);

    store.toggleSequenceView(true);
    expect(useExecutionStore.getState().isSequenceViewOpen).toBe(true);
  });

  it("should execute async-queue-workers scenario with message queuing and worker acknowledgments", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("async-queue-workers");
    const success = store.runExecution(mockNodes, mockEdges);

    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    const events = state.trace?.events || [];

    // Verify messaging lifecycle
    expect(events.some((e) => e.type === "message.published")).toBe(true);
    expect(events.some((e) => e.type === "message.enqueued")).toBe(true);
    expect(events.some((e) => e.type === "message.processing.completed")).toBe(true);
    expect(events.some((e) => e.type === "message.acknowledged")).toBe(true);

    // Queue state in runtime snapshot
    const finalFrame = state.trace?.frames[state.trace.frames.length - 1];
    const orderEventsQueue =
      finalFrame?.runtimeState?.queues["queue_order_events"] ||
      finalFrame?.runtimeState?.queues["order_events_queue"];
    expect(orderEventsQueue).toBeDefined();
    expect(orderEventsQueue?.acknowledgedMessageIds.length).toBeGreaterThanOrEqual(1);
  });

  it("should execute message-retry-dlq scenario with NACK, exponential retry and dead-letter routing", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("message-retry-dlq");
    const success = store.runExecution(mockNodes, mockEdges);

    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    const events = state.trace?.events || [];

    // Verify retry & DLQ lifecycle
    expect(events.some((e) => e.type === "message.nacked")).toBe(true);
    expect(events.some((e) => e.type === "message.retry.scheduled")).toBe(true);
    expect(events.some((e) => e.type === "message.deadlettered")).toBe(true);

    // Verify DLQ queue received dead-lettered message
    const finalFrame = state.trace?.frames[state.trace.frames.length - 1];
    const dlq =
      finalFrame?.runtimeState?.queues["queue_dlq"] ||
      finalFrame?.runtimeState?.queues["dead_letter_queue"];
    expect(dlq).toBeDefined();
    expect(dlq?.deadLetteredMessageIds.length).toBeGreaterThanOrEqual(1);
  });
});
