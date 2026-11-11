import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { ReliabilityEngine } from "../reliability";

describe("Reliability & Resilience Analysis - Performance Benchmarks", () => {
  function generateReliabilityTopology(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
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
        id: `rel_node_${i}`,
        type: "infrastructure",
        position: { x: (i % 25) * 90, y: Math.floor(i / 25) * 90 },
        data: {
          componentType: type,
          label: `Component ${i}`,
          retries: (i % 3 === 0) ? 3 : 0,
          timeoutMs: 1000 + (i % 4) * 500,
          circuitBreakerEnabled: i % 2 === 0,
        },
      });

      if (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        edges.push({
          id: `rel_edge_${i}`,
          source: `rel_node_${parent}`,
          target: `rel_node_${i}`,
          data: {
            isSynchronous: i % 4 !== 0,
            timeoutMs: 1500,
          },
        });
      }
    }

    return { nodes, edges };
  }

  it("benchmarks 100-node graph reliability & resilience analysis", () => {
    const { nodes, edges } = generateReliabilityTopology(100);
    const engine = new ReliabilityEngine();

    const startTime = performance.now();
    const report = engine.analyzeGraph(nodes, edges);
    const duration = performance.now() - startTime;

    expect(report).toBeDefined();
    expect(report.summary.totalFindings).toBeGreaterThanOrEqual(0);
    expect(duration).toBeLessThan(150); // < 150ms budget
  });

  it("benchmarks 500-node graph reliability & resilience analysis", () => {
    const { nodes, edges } = generateReliabilityTopology(500);
    const engine = new ReliabilityEngine();

    const startTime = performance.now();
    const report = engine.analyzeGraph(nodes, edges);
    const duration = performance.now() - startTime;

    expect(report).toBeDefined();
    expect(report.summary.totalFindings).toBeGreaterThanOrEqual(0);
    expect(duration).toBeLessThan(350); // < 350ms budget
  });

  it("benchmarks 1,000-node graph reliability & resilience analysis", () => {
    const { nodes, edges } = generateReliabilityTopology(1000);
    const engine = new ReliabilityEngine();

    const startTime = performance.now();
    const report = engine.analyzeGraph(nodes, edges);
    const duration = performance.now() - startTime;

    expect(report).toBeDefined();
    expect(report.summary.totalFindings).toBeGreaterThanOrEqual(0);
    expect(duration).toBeLessThan(800); // < 800ms budget
  });
});
