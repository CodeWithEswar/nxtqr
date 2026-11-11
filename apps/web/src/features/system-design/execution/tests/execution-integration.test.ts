import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

const mockNodes: BaseNode[] = [
  {
    id: "node_client",
    type: "client",
    label: "Web Browser",
    position: { x: 50, y: 100 },
    data: {},
  },
  {
    id: "node_gateway",
    type: "api_gateway",
    label: "Edge Gateway",
    position: { x: 250, y: 100 },
    data: {},
  },
  {
    id: "node_service",
    type: "service",
    label: "Order Service",
    position: { x: 450, y: 100 },
    data: {},
  },
  {
    id: "node_db",
    type: "database",
    label: "PostgreSQL Database",
    position: { x: 650, y: 100 },
    data: {},
  },
];

const mockEdges: BaseEdge[] = [
  {
    id: "edge_client_gw",
    source: "node_client",
    target: "node_gateway",
    data: {},
  },
  {
    id: "edge_gw_srv",
    source: "node_gateway",
    target: "node_service",
    data: {},
  },
  {
    id: "edge_srv_db",
    source: "node_service",
    target: "node_db",
    data: {},
  },
];

describe("Architecture Execution Store & Canvas Integration", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.updateConfiguration({
      entryNodeId: "node_client",
      request: {
        id: "req_test",
        method: "GET",
        path: "/api/orders/list",
        headers: {},
      },
    });
  });

  it("should initialize with default idle state", () => {
    const state = useExecutionStore.getState();
    expect(state.playbackState.status).toBe("idle");
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
    expect(updated.playbackState.currentFrame?.activeNodeIds).toContain("node_client");
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
});
