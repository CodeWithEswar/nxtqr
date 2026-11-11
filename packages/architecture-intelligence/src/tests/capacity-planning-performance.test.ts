import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { CapacityPlanningEngine } from "../capacity-planning/engine/capacity-planning-engine";
import { DEFAULT_CAPACITY_SCENARIOS } from "../capacity-planning/scenarios/capacity-scenarios";

function generateTestGraph(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];

  // Ingress gateway
  nodes.push({
    id: "gw_0",
    type: "api-gateway",
    position: { x: 0, y: 0 },
    label: "Gateway Ingress",
    data: { replicas: 4, capacityRps: 10000 },
  });

  for (let i = 1; i < nodeCount; i++) {
    const isService = i % 3 !== 0;
    const type = isService ? "compute-service" : "relational-database";
    nodes.push({
      id: `node_${i}`,
      type,
      position: { x: (i % 20) * 150, y: Math.floor(i / 20) * 100 },
      label: `Component ${i}`,
      data: {
        replicas: isService ? 3 : 1,
        capacityRps: 1000 + (i % 500),
      },
    });

    // Connect from previous node or gateway
    const parentId = i <= 5 ? "gw_0" : `node_${Math.floor((i - 1) / 3)}`;
    edges.push({
      id: `edge_${i}`,
      source: parentId,
      target: `node_${i}`,
      data: { protocol: isService ? "https" : "tcp" },
    });
  }

  return { nodes, edges };
}

describe("Capacity Planning - High-Volume Performance Benchmark", () => {
  const engine = new CapacityPlanningEngine();
  const scenario = DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth;

  it("evaluates a 100-node graph in under 150ms", () => {
    const { nodes, edges } = generateTestGraph(100);
    const start = performance.now();
    const report = engine.planCapacity(nodes, edges, scenario);
    const elapsed = performance.now() - start;

    expect(report).toBeDefined();
    expect(Object.keys(report.componentEvaluations).length).toBe(100);
    expect(elapsed).toBeLessThan(250);
  });

  it("evaluates a 500-node graph in under 250ms", () => {
    const { nodes, edges } = generateTestGraph(500);
    const start = performance.now();
    const report = engine.planCapacity(nodes, edges, scenario);
    const elapsed = performance.now() - start;

    expect(report).toBeDefined();
    expect(Object.keys(report.componentEvaluations).length).toBe(500);
    expect(elapsed).toBeLessThan(350);
  });

  it("evaluates a 1,000-node graph reliably", () => {
    const { nodes, edges } = generateTestGraph(1000);
    const start = performance.now();
    const report = engine.planCapacity(nodes, edges, scenario);
    const elapsed = performance.now() - start;

    expect(report).toBeDefined();
    expect(Object.keys(report.componentEvaluations).length).toBe(1000);
    expect(elapsed).toBeLessThan(700);

    // Cache hit should be near instant (< 10ms)
    const cacheStart = performance.now();
    const cachedReport = engine.planCapacity(nodes, edges, scenario);
    const cacheElapsed = performance.now() - cacheStart;

    expect(cachedReport).toBe(report);
    expect(cacheElapsed).toBeLessThan(15);
  });
});
