import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  ScalabilityRecommendationsEngine,
  WhatIfEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
} from "../index";

describe("Scalability Recommendations - Performance Benchmarks", () => {
  function generateSyntheticTopology(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
    const nodes: BaseNode[] = [];
    const edges: BaseEdge[] = [];

    const types = [
      "compute-instance",
      "api-gateway",
      "relational-database",
      "in-memory-cache",
      "web-browser",
      "message-queue",
    ];

    for (let i = 0; i < nodeCount; i++) {
      const type = types[i % types.length];
      nodes.push({
        id: `scale_node_${i}`,
        type: "infrastructure",
        position: { x: (i % 20) * 80, y: Math.floor(i / 20) * 80 },
        data: {
          componentType: type,
          label: `Component ${i}`,
          declaredCapacityRps: 400 + (i % 5) * 200,
          replicas: 1,
        },
      });

      if (i > 0) {
        edges.push({
          id: `scale_edge_${i}`,
          source: `scale_node_${Math.floor((i - 1) / 2)}`,
          target: `scale_node_${i}`,
          data: { protocol: "https", encryptionInTransit: true },
        });
      }
    }

    return { nodes, edges };
  }

  it("benchmarks 100-node graph recommendation generation & what-if planning", () => {
    const { nodes, edges } = generateSyntheticTopology(100);
    const engine = new ScalabilityRecommendationsEngine();

    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const report = engine.evaluateGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);
    const duration = performance.now() - startTime;
    const memDeltaMb = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);

    console.log(`[Scalability Benchmark 100 nodes] Generation: ${duration.toFixed(2)}ms | Heap Delta: ${memDeltaMb.toFixed(2)}MB | Recs: ${report.recommendations.length}`);
    expect(duration).toBeLessThan(300);
    expect(report.nodeCount).toBe(100);

    if (report.recommendations.length > 0) {
      const planStartTime = performance.now();
      const { plan } = WhatIfEngine.createPlan(nodes, edges, report.recommendations[0], DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);
      const planDuration = performance.now() - planStartTime;
      console.log(`[What-If Benchmark 100 nodes] Planning time: ${planDuration.toFixed(2)}ms | Validated: ${plan.isValidated}`);
      expect(planDuration).toBeLessThan(100);
      expect(plan).toBeDefined();
      expect(plan.operations.length).toBeGreaterThan(0);
    }
  });

  it("benchmarks 500-node graph recommendation generation", () => {
    const { nodes, edges } = generateSyntheticTopology(500);
    const engine = new ScalabilityRecommendationsEngine();

    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const report = engine.evaluateGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);
    const duration = performance.now() - startTime;
    const memDeltaMb = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);

    console.log(`[Scalability Benchmark 500 nodes] Generation: ${duration.toFixed(2)}ms | Heap Delta: ${memDeltaMb.toFixed(2)}MB | Recs: ${report.recommendations.length}`);
    expect(duration).toBeLessThan(400);
    expect(report.nodeCount).toBe(500);
  });

  it("benchmarks 1,000-node graph recommendation generation", () => {
    const { nodes, edges } = generateSyntheticTopology(1000);
    const engine = new ScalabilityRecommendationsEngine();

    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const report = engine.evaluateGraph(nodes, edges, DEFAULT_WORKLOAD_SCENARIOS.normal_traffic);
    const duration = performance.now() - startTime;
    const memDeltaMb = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);

    console.log(`[Scalability Benchmark 1000 nodes] Generation: ${duration.toFixed(2)}ms | Heap Delta: ${memDeltaMb.toFixed(2)}MB | Recs: ${report.recommendations.length}`);
    expect(duration).toBeLessThan(1000);
    expect(report.nodeCount).toBe(1000);
  });
});
