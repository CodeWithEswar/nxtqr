import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  ExecutionSnapshotManager,
  ExecutionPlanner,
  PriorityQueue,
  type ExecutionConfiguration,
} from "../index";

describe("Distributed Execution Engine (Phase 05.4.3)", () => {
  const distributedNodes: BaseNode[] = [
    {
      id: "client_1",
      type: "client",
      position: { x: 0, y: 100 },
      label: "Web Browser",
      data: { componentType: "client" },
    },
    {
      id: "order_service",
      type: "service",
      position: { x: 250, y: 100 },
      label: "Order Service",
      data: { componentType: "service" },
    },
    {
      id: "payment_service",
      type: "service",
      position: { x: 500, y: 20 },
      label: "Payment Service",
      data: { componentType: "service" },
    },
    {
      id: "inventory_service",
      type: "service",
      position: { x: 500, y: 180 },
      label: "Inventory Service",
      data: { componentType: "service" },
    },
    {
      id: "order_events_queue",
      type: "queue",
      position: { x: 500, y: 320 },
      label: "Order Events Topic",
      data: { componentType: "queue" },
    },
    {
      id: "email_worker",
      type: "worker",
      position: { x: 750, y: 260 },
      label: "Email Worker",
      data: { componentType: "worker" },
    },
    {
      id: "analytics_worker",
      type: "worker",
      position: { x: 750, y: 380 },
      label: "Analytics Worker",
      data: { componentType: "worker" },
    },
    {
      id: "settlement_queue",
      type: "queue",
      position: { x: 500, y: 500 },
      label: "Settlement Job Queue",
      data: { componentType: "queue" },
    },
    {
      id: "settlement_worker",
      type: "worker",
      position: { x: 750, y: 500 },
      label: "Settlement Worker",
      data: { componentType: "worker" },
    },
    {
      id: "dead_letter_queue",
      type: "queue",
      position: { x: 750, y: 620 },
      label: "Dead Letter Queue",
      data: { componentType: "queue" },
    },
    {
      id: "fraud_service",
      type: "service",
      position: { x: 500, y: -60 },
      label: "Fraud Detection Service",
      data: { componentType: "service" },
    },
  ];

  const distributedEdges: BaseEdge[] = [
    { id: "e_client_order", source: "client_1", target: "order_service", data: {} },
    { id: "e_order_pay", source: "order_service", target: "payment_service", data: {} },
    { id: "e_order_inv", source: "order_service", target: "inventory_service", data: {} },
    { id: "e_order_fraud", source: "order_service", target: "fraud_service", data: {} },
    { id: "e_order_q", source: "order_service", target: "order_events_queue", data: {} },
    { id: "e_q_email", source: "order_events_queue", target: "email_worker", data: {} },
    { id: "e_q_analytics", source: "order_events_queue", target: "analytics_worker", data: {} },
    { id: "e_order_settle_q", source: "order_service", target: "settlement_queue", data: {} },
    { id: "e_settle_q_wkr", source: "settlement_queue", target: "settlement_worker", data: {} },
    { id: "e_settle_dlq", source: "settlement_worker", target: "dead_letter_queue", data: {} },
  ];

  const snapshot = ExecutionSnapshotManager.createSnapshot(
    "arch_dist_test",
    "rev_1",
    "Distributed Architecture Snapshot",
    distributedNodes,
    distributedEdges
  );

  it("PriorityQueue orders tasks by timestamp, priority, and sequence", () => {
    const pq = new PriorityQueue<string>();
    pq.push("task_100ms_low", 100, 10, 1);
    pq.push("task_50ms", 50, 5, 2);
    pq.push("task_100ms_high", 100, 1, 3);
    pq.push("task_10ms", 10, 5, 4);

    expect(pq.pop()).toBe("task_10ms");
    expect(pq.pop()).toBe("task_50ms");
    expect(pq.pop()).toBe("task_100ms_high");
    expect(pq.pop()).toBe("task_100ms_low");
    expect(pq.isEmpty).toBe(true);
  });

  it("executes Scenario 1: Parallel Fan-Out with Fan-In Synchronization and Critical Path", () => {
    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "parallel-fanout",
      request: {
        id: "req_dist_1",
        method: "POST",
        path: "/api/v1/orders",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 100, maxHops: 50, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 50, edgeDurationMs: 40 },
    };

    const trace = ExecutionPlanner.planExecution(snapshot, config);

    expect(trace.outcome).toBe("success");
    expect(trace.events.length).toBeGreaterThan(0);

    // Verify fan-out started and both branches completed
    const fanoutEvt = trace.events.find((e) => e.type === "parallel.fanout.started");
    expect(fanoutEvt).toBeDefined();

    const branchCompletedEvts = trace.events.filter((e) => e.type === "parallel.branch.completed");
    expect(branchCompletedEvts.length).toBe(2);

    // Verify barrier satisfied
    const barrierEvt = trace.events.find((e) => e.type === "parallel.join.satisfied");
    expect(barrierEvt).toBeDefined();

    // Verify spans & critical path
    expect(trace.spans).toBeDefined();
    expect(trace.spans!.length).toBeGreaterThanOrEqual(3); // root + payment + inventory
    expect(trace.criticalPathSpanIds).toBeDefined();
    expect(trace.criticalPathSpanIds!.length).toBeGreaterThan(0);

    // Payment (180ms) should be on the critical path rather than inventory (120ms)
    expect(trace.criticalPathSpanIds).toContain("span_branch_payment");

    // Final response should be HTTP 201
    const lastFrame = trace.frames[trace.frames.length - 1];
    expect(lastFrame.activeResponse?.status).toBe(201);
  });

  it("executes Scenario 2: Asynchronous Message Queue with Pub/Sub Workers", () => {
    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "async-queue-workers",
      request: {
        id: "req_dist_2",
        method: "POST",
        path: "/api/v1/checkout",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 100, maxHops: 50, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 50, edgeDurationMs: 40 },
    };

    const trace = ExecutionPlanner.planExecution(snapshot, config);
    expect(trace.outcome).toBe("success");

    const events = trace.events;

    // Verify message lifecycle events
    expect(events.some((e) => e.type === "message.created")).toBe(true);
    expect(events.some((e) => e.type === "message.published")).toBe(true);
    expect(events.some((e) => e.type === "message.enqueued")).toBe(true);

    // Pub/Sub: both email_worker and analytics_worker must receive and acknowledge
    const deliveryEvts = events.filter((e) => e.type === "message.delivered");
    expect(deliveryEvts.length).toBe(2);

    const ackEvts = events.filter((e) => e.type === "message.acknowledged");
    expect(ackEvts.length).toBe(2);
  });

  it("executes Scenario 3: Message Failure, Exponential Retry Backoff & Dead-Letter Routing", () => {
    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "message-retry-dlq",
      request: {
        id: "req_dist_3",
        method: "POST",
        path: "/api/v1/settlements",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 100, maxHops: 50, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 50, edgeDurationMs: 40 },
    };

    const trace = ExecutionPlanner.planExecution(snapshot, config);

    const events = trace.events;

    // Verify NACK occurred
    const nackEvts = events.filter((e) => e.type === "message.nacked");
    expect(nackEvts.length).toBeGreaterThanOrEqual(1);

    // Verify retry scheduled
    const retryEvt = events.find((e) => e.type === "message.retry.scheduled");
    expect(retryEvt).toBeDefined();

    // Verify dead-lettered after exhausting retries
    const dlqEvt = events.find((e) => e.type === "message.deadlettered");
    expect(dlqEvt).toBeDefined();
    expect((dlqEvt as any).dlqId).toBe("dead_letter_queue");
  });

  it("executes Scenario 4: Fan-In Barrier with Partial Branch Failure under Policy 'all'", () => {
    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "fanin-partial-failure",
      request: {
        id: "req_dist_4",
        method: "POST",
        path: "/api/v1/orders/sensitive",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 100, maxHops: 50, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 50, edgeDurationMs: 40 },
    };

    const trace = ExecutionPlanner.planExecution(snapshot, config);

    expect(trace.outcome).toBe("failure");

    const events = trace.events;

    // Fraud branch failed while inventory succeeded
    expect(events.some((e) => e.type === "parallel.branch.failed")).toBe(true);
    expect(events.some((e) => e.type === "parallel.branch.completed")).toBe(true);

    // Barrier failed
    const barrierFailed = events.find((e) => e.type === "parallel.join.failed");
    expect(barrierFailed).toBeDefined();

    // Overall response returned HTTP 500
    const lastFrame = trace.frames[trace.frames.length - 1];
    expect(lastFrame.activeResponse?.status).toBe(500);
  });
});
