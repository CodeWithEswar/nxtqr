import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  ExecutionSnapshotManager,
  RequestLifecyclePlanner,
  getScenarioPreset,
  type ExecutionConfiguration,
} from "../index";

describe("Request Lifecycle & Component Behavior Engine (Phase 05.4.2)", () => {
  const cacheMissNodes: BaseNode[] = [
    {
      id: "client_1",
      type: "client",
      position: { x: 0, y: 0 },
      label: "Web Browser",
      data: { componentType: "client" },
    },
    {
      id: "gateway_1",
      type: "api_gateway",
      position: { x: 200, y: 0 },
      label: "API Gateway",
      data: { componentType: "api_gateway" },
    },
    {
      id: "product_service",
      type: "service",
      position: { x: 400, y: 0 },
      label: "Product Service",
      data: { componentType: "service" },
    },
    {
      id: "redis_cache",
      type: "cache",
      position: { x: 600, y: -80 },
      label: "Redis Cache",
      data: { componentType: "cache" },
    },
    {
      id: "postgres_db",
      type: "database",
      position: { x: 600, y: 80 },
      label: "PostgreSQL Database",
      data: { componentType: "database" },
    },
  ];

  const cacheMissEdges: BaseEdge[] = [
    { id: "e_cl_gw", source: "client_1", target: "gateway_1", data: {} },
    { id: "e_gw_srv", source: "gateway_1", target: "product_service", data: {} },
    { id: "e_srv_cache", source: "product_service", target: "redis_cache", data: {} },
    { id: "e_srv_db", source: "product_service", target: "postgres_db", data: {} },
  ];

  it("executes Guided Example 82: Cache Miss with DB Read, Cache Write, and Response Propagation", () => {
    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "cache-miss",
      scenario: getScenarioPreset("cache-miss"),
      request: {
        id: "req_product_42",
        method: "GET",
        path: "/api/products/42",
        headers: { "content-type": "application/json" },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 100, maxHops: 50, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 100, edgeDurationMs: 150 },
    };

    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_cache_miss",
      "rev_1",
      "Cache Miss Architecture",
      cacheMissNodes,
      cacheMissEdges,
      config
    );

    const trace = RequestLifecyclePlanner.planLifecycle(snapshot, config);

    expect(trace.outcome).toBe("success");
    expect(trace.events.length).toBeGreaterThan(6);

    const eventTypes = trace.events.map((e) => e.type);

    // 1. Client creates & dispatches request
    expect(eventTypes).toContain("request.created");
    expect(eventTypes).toContain("request.dispatched");

    // 2. Gateway matches route and forwards
    expect(eventTypes).toContain("route.match.selected");
    expect(eventTypes).toContain("request.forwarded");

    // 3. Service checks cache -> cache miss
    expect(eventTypes).toContain("cache.lookup.started");
    expect(eventTypes).toContain("cache.miss");

    // 4. Service queries database -> DB read completed
    expect(eventTypes).toContain("database.read.started");
    expect(eventTypes).toContain("database.read.completed");

    // 5. Service updates cache -> cache write
    expect(eventTypes).toContain("cache.write");

    // 6. Response created & propagated back to Client
    expect(eventTypes).toContain("response.created");
    expect(eventTypes).toContain("response.dispatched");
    expect(eventTypes).toContain("response.received");
    expect(eventTypes).toContain("run.completed");

    // Check runtime state at the final frame
    const finalFrame = trace.frames[trace.frames.length - 1];
    expect(finalFrame.runtimeState).toBeDefined();
    expect(finalFrame.runtimeState?.cache["products:42"] || finalFrame.runtimeState?.cache["product:42"]).toBeDefined();
    expect(finalFrame.runtimeState?.activeResponse?.status).toBe(200);
    expect(finalFrame.runtimeState?.activeResponse?.headers["x-cache"]).toBe("MISS");
  });

  it("executes Guided Example 83: Cache Hit (Database Bypassed)", () => {
    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "cache-hit",
      scenario: getScenarioPreset("cache-hit"),
      request: {
        id: "req_product_42_hit",
        method: "GET",
        path: "/api/products/42",
        headers: { "content-type": "application/json" },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 100, maxHops: 50, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 100, edgeDurationMs: 150 },
    };

    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_cache_hit",
      "rev_1",
      "Cache Hit Architecture",
      cacheMissNodes,
      cacheMissEdges,
      config
    );

    const trace = RequestLifecyclePlanner.planLifecycle(snapshot, config);

    expect(trace.outcome).toBe("success");
    const eventTypes = trace.events.map((e) => e.type);

    // Cache lookup resulted in a HIT
    expect(eventTypes).toContain("cache.lookup.started");
    expect(eventTypes).toContain("cache.hit");

    // CRITICAL: Database read MUST BE BYPASSED
    expect(eventTypes).not.toContain("database.read.started");
    expect(eventTypes).not.toContain("database.read.completed");

    // Response marked with x-cache: HIT
    const finalFrame = trace.frames[trace.frames.length - 1];
    expect(finalFrame.runtimeState?.activeResponse?.headers["x-cache"]).toBe("HIT");
  });

  it("executes Guided Example 84: Round-Robin Load Balancer Determinism", () => {
    const lbNodes: BaseNode[] = [
      { id: "client_1", type: "client", position: { x: 0, y: 0 }, data: {} },
      { id: "lb_1", type: "load_balancer", position: { x: 200, y: 0 }, data: {} },
      { id: "srv_a", type: "service", position: { x: 400, y: -50 }, label: "Worker A", data: {} },
      { id: "srv_b", type: "service", position: { x: 400, y: 50 }, label: "Worker B", data: {} },
    ];
    const lbEdges: BaseEdge[] = [
      { id: "e_cl_lb", source: "client_1", target: "lb_1", data: {} },
      { id: "e_lb_a", source: "lb_1", target: "srv_a", data: {} },
      { id: "e_lb_b", source: "lb_1", target: "srv_b", data: {} },
    ];

    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "load-balancer",
      scenario: getScenarioPreset("load-balancer"),
      request: { id: "req_1", method: "GET", path: "/api/tasks", headers: {} },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 50, maxHops: 20, maxDurationMs: 10000 },
      timing: { nodeDurationMs: 100, edgeDurationMs: 100 },
    };

    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_lb",
      "rev_1",
      "LB Arch",
      lbNodes,
      lbEdges,
      config
    );

    // Run 1: Should select Worker A (index 0)
    const trace1 = RequestLifecyclePlanner.planLifecycle(snapshot, config);
    const lbEvent1 = trace1.events.find((e) => e.type === "route.upstream.selected");
    expect(lbEvent1).toBeDefined();
    expect((lbEvent1 as any).selectedTargetId).toBe("srv_a");
  });

  it("executes Guided Example 85: Database Write Mutation (POST Insert)", () => {
    const writeNodes: BaseNode[] = [
      { id: "client_1", type: "client", position: { x: 0, y: 0 }, data: {} },
      { id: "gateway_1", type: "api_gateway", position: { x: 200, y: 0 }, data: {} },
      { id: "order_service", type: "service", position: { x: 400, y: 0 }, data: {} },
      { id: "order_db", type: "database", position: { x: 600, y: 0 }, data: {} },
    ];
    const writeEdges: BaseEdge[] = [
      { id: "e_cl_gw", source: "client_1", target: "gateway_1", data: {} },
      { id: "e_gw_srv", source: "gateway_1", target: "order_service", data: {} },
      { id: "e_srv_db", source: "order_service", target: "order_db", data: {} },
    ];

    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "database-write",
      scenario: getScenarioPreset("database-write"),
      request: {
        id: "req_order_post",
        method: "POST",
        path: "/api/orders",
        headers: { "content-type": "application/json" },
        body: { customerId: "cust_77", total: 149.5 },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 50, maxHops: 20, maxDurationMs: 10000 },
      timing: { nodeDurationMs: 100, edgeDurationMs: 100 },
    };

    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_db_write",
      "rev_1",
      "DB Write Arch",
      writeNodes,
      writeEdges,
      config
    );

    const trace = RequestLifecyclePlanner.planLifecycle(snapshot, config);
    expect(trace.outcome).toBe("success");

    const writeEvent = trace.events.find((e) => e.type === "database.write.completed");
    expect(writeEvent).toBeDefined();

    const finalFrame = trace.frames[trace.frames.length - 1];
    expect(finalFrame.runtimeState?.activeResponse?.status).toBe(201);
    expect(Object.keys(finalFrame.runtimeState?.database["orders"] || {}).length).toBe(1);
  });

  it("verifies state restoration on step backward", () => {
    const config: ExecutionConfiguration = {
      version: 1,
      entryNodeId: "client_1",
      presetId: "cache-miss",
      scenario: getScenarioPreset("cache-miss"),
      request: { id: "req_rev", method: "GET", path: "/api/products/42", headers: {} },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxEvents: 100, maxHops: 50, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 100, edgeDurationMs: 100 },
    };

    const snapshot = ExecutionSnapshotManager.createSnapshot(
      "arch_rev",
      "rev_1",
      "Rev Arch",
      cacheMissNodes,
      cacheMissEdges,
      config
    );

    const trace = RequestLifecyclePlanner.planLifecycle(snapshot, config);

    // Find frame index before cache.write vs after cache.write
    const writeFrameIndex = trace.frames.findIndex((f) => f.activeEvent.type === "cache.write");
    expect(writeFrameIndex).toBeGreaterThan(0);

    const frameBeforeWrite = trace.frames[writeFrameIndex - 1];
    const frameAfterWrite = trace.frames[writeFrameIndex];

    // Before write: products:42 was not yet in cache
    expect(frameBeforeWrite.runtimeState?.cache["products:42"]).toBeUndefined();

    // After write: products:42 is populated
    expect(frameAfterWrite.runtimeState?.cache["products:42"]).toBeDefined();
  });
});
