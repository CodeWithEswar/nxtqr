import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  ExecutionSnapshotManager,
  ExecutionPlanner,
  PlaybackController,
  type ExecutionConfiguration,
} from "../index";

describe("Architecture Execution Engine (Phase 05.4.1)", () => {
  const sampleNodes: BaseNode[] = [
    {
      id: "node_client",
      type: "client",
      position: { x: 0, y: 0 },
      label: "Web Browser",
      data: { componentType: "client" },
    },
    {
      id: "node_gateway",
      type: "api-gateway",
      position: { x: 200, y: 0 },
      label: "API Gateway",
      data: { componentType: "api-gateway", rateLimitRps: 5000 },
    },
    {
      id: "node_service",
      type: "service",
      position: { x: 400, y: 0 },
      label: "Order Service",
      data: { componentType: "service", concurrency: 16 },
    },
    {
      id: "node_database",
      type: "database",
      position: { x: 600, y: 0 },
      label: "Postgres DB",
      data: { componentType: "database" },
    },
  ];

  const sampleEdges: BaseEdge[] = [
    {
      id: "edge_client_gw",
      source: "node_client",
      target: "node_gateway",
      data: { protocol: "https" },
    },
    {
      id: "edge_gw_srv",
      source: "node_gateway",
      target: "node_service",
      data: { protocol: "grpc" },
    },
    {
      id: "edge_srv_db",
      source: "node_service",
      target: "node_database",
      data: { protocol: "tcp" },
    },
  ];

  const defaultConfig: ExecutionConfiguration = {
    version: 1,
    entryNodeId: "node_client",
    request: {
      id: "req_test_01",
      method: "POST",
      path: "/api/orders/checkout",
      headers: { "content-type": "application/json" },
      body: { orderId: "ord_1001", amount: 99.99 },
    },
    routing: {
      mode: "deterministic",
      selectedBranches: {},
    },
    limits: {
      maxEvents: 100,
      maxHops: 50,
      maxDurationMs: 30000,
    },
    timing: {
      nodeDurationMs: 200,
      edgeDurationMs: 300,
    },
  };

  it("creates and validates immutable architecture snapshot", () => {
    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_demo_01",
      "rev_v1",
      "Test Architecture",
      sampleNodes,
      sampleEdges,
      defaultConfig
    );

    expect(snapshot.snapshotHash).toBeDefined();
    expect(snapshot.snapshotHash.startsWith("snap_")).toBe(true);

    const validation = ExecutionSnapshotManager.validateSnapshot(snapshot);
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it("plans deterministic execution through client -> gateway -> service -> database (Acceptance Scenario 1)", () => {
    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_demo_01",
      "rev_v1",
      "Test Architecture",
      sampleNodes,
      sampleEdges,
      defaultConfig
    );

    const trace = ExecutionPlanner.planExecution(snapshot, defaultConfig);

    expect(trace.outcome).toBe("success");
    expect(trace.totalHops).toBe(4);
    expect(trace.visitedNodeIds).toEqual([
      "node_client",
      "node_gateway",
      "node_service",
      "node_database",
    ]);
    expect(trace.traversedEdgeIds).toEqual([
      "edge_client_gw",
      "edge_gw_srv",
      "edge_srv_db",
    ]);

    // Check ordered sequence of events
    const eventTypes = trace.events.map((e) => e.type);
    expect(eventTypes).toContain("run.started");
    expect(eventTypes).toContain("node.entered");
    expect(eventTypes).toContain("edge.traversed");
    expect(eventTypes).toContain("node.exited");
    expect(eventTypes).toContain("run.completed");

    // Check monotonic virtual timestamps
    for (let i = 1; i < trace.events.length; i++) {
      expect(trace.events[i].atMs).toBeGreaterThanOrEqual(trace.events[i - 1].atMs);
      expect(trace.events[i].sequence).toBe(trace.events[i - 1].sequence + 1);
    }

    // Check frames generation
    expect(trace.frames.length).toBe(trace.events.length);
    expect(trace.frames[0].activeNodeIds).toContain("node_client");
  });

  it("handles branching with deterministic explicit selection (Acceptance Scenario 2)", () => {
    const branchingNodes: BaseNode[] = [
      { id: "node_gw", type: "api-gateway", position: { x: 0, y: 0 }, label: "Gateway", data: {} },
      { id: "node_srv_a", type: "service", position: { x: 200, y: -50 }, label: "Service A", data: {} },
      { id: "node_srv_b", type: "service", position: { x: 200, y: 50 }, label: "Service B", data: {} },
    ];

    const branchingEdges: BaseEdge[] = [
      { id: "edge_gw_a", source: "node_gw", target: "node_srv_a", data: { pathPrefix: "/api/a" } },
      { id: "edge_gw_b", source: "node_gw", target: "node_srv_b", data: { pathPrefix: "/api/b" } },
    ];

    const branchConfig: ExecutionConfiguration = {
      ...defaultConfig,
      entryNodeId: "node_gw",
      request: {
        ...defaultConfig.request,
        path: "/api/b/items",
      },
      routing: {
        mode: "deterministic",
        selectedBranches: {
          node_gw: "edge_gw_b",
        },
      },
    };

    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_branch",
      "rev_1",
      "Branch Architecture",
      branchingNodes,
      branchingEdges,
      branchConfig
    );

    const trace = ExecutionPlanner.planExecution(snapshot, branchConfig);

    expect(trace.outcome).toBe("success");
    expect(trace.visitedNodeIds).toContain("node_srv_b");
    expect(trace.visitedNodeIds).not.toContain("node_srv_a");
    expect(trace.traversedEdgeIds).toContain("edge_gw_b");

    const routeEvent = trace.events.find((e) => e.type === "route.selected");
    expect(routeEvent).toBeDefined();
    if (routeEvent && routeEvent.type === "route.selected") {
      expect(routeEvent.selectedEdgeId).toBe("edge_gw_b");
      expect(routeEvent.targetNodeId).toBe("node_srv_b");
    }
  });

  it("bounds cycles gracefully and avoids infinite traversal (Acceptance Scenario 3)", () => {
    const cyclicNodes: BaseNode[] = [
      { id: "node_a", type: "service", position: { x: 0, y: 0 }, label: "Worker A", data: {} },
      { id: "node_b", type: "service", position: { x: 200, y: 0 }, label: "Worker B", data: {} },
    ];

    const cyclicEdges: BaseEdge[] = [
      { id: "edge_a_to_b", source: "node_a", target: "node_b", data: {} },
      { id: "edge_b_to_a", source: "node_b", target: "node_a", data: {} },
    ];

    const cyclicConfig: ExecutionConfiguration = {
      ...defaultConfig,
      entryNodeId: "node_a",
      limits: {
        maxEvents: 50,
        maxHops: 10,
        maxDurationMs: 10000,
      },
    };

    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_cycle",
      "rev_1",
      "Cyclic Architecture",
      cyclicNodes,
      cyclicEdges,
      cyclicConfig
    );

    const trace = ExecutionPlanner.planExecution(snapshot, cyclicConfig);

    expect(trace.outcome).toBe("limit-exceeded");
    expect(trace.terminalReason).toContain("loop detected");
    expect(trace.events[trace.events.length - 1].type).toBe("run.completed");
  });

  it("verifies deterministic replay property", () => {
    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_demo_01",
      "rev_v1",
      "Test Architecture",
      sampleNodes,
      sampleEdges,
      defaultConfig
    );

    const traceA = ExecutionPlanner.planExecution(snapshot, defaultConfig);
    const traceB = ExecutionPlanner.planExecution(snapshot, defaultConfig);

    expect(traceA.events.length).toBe(traceB.events.length);
    expect(traceA.totalDurationMs).toBe(traceB.totalDurationMs);
    expect(traceA.visitedNodeIds).toEqual(traceB.visitedNodeIds);
    expect(traceA.traversedEdgeIds).toEqual(traceB.traversedEdgeIds);

    for (let i = 0; i < traceA.events.length; i++) {
      expect(traceA.events[i].type).toBe(traceB.events[i].type);
      expect(traceA.events[i].atMs).toBe(traceB.events[i].atMs);
      expect(traceA.events[i].sequence).toBe(traceB.events[i].sequence);
    }
  });

  it("controls playback: play, pause, step next/prev, seek, speed", () => {
    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_demo_01",
      "rev_v1",
      "Test Architecture",
      sampleNodes,
      sampleEdges,
      defaultConfig
    );

    const trace = ExecutionPlanner.planExecution(snapshot, defaultConfig);
    const controller = new PlaybackController(1);

    controller.loadTrace(trace);
    expect(controller.getState().status).toBe("ready");
    expect(controller.getState().currentStepIndex).toBe(0);

    // Step next
    controller.nextStep();
    expect(controller.getState().currentStepIndex).toBe(1);
    expect(controller.getState().status).toBe("paused");

    // Step previous
    controller.previousStep();
    expect(controller.getState().currentStepIndex).toBe(0);

    // Seek
    controller.seekToStep(4);
    expect(controller.getState().currentStepIndex).toBe(4);

    // Speed
    controller.setSpeed(2);
    expect(controller.getState().speed).toBe(2);

    // Restart
    controller.restart();
    expect(controller.getState().currentStepIndex).toBe(0);
    expect(controller.getState().status).toBe("ready");

    // Stop
    controller.stop();
    expect(controller.getState().status).toBe("stopped");

    controller.destroy();
  });
});
