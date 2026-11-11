import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { comparisonEngine } from "../index";

function generateTestTopology(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];

  const types = ["compute-instance", "api-gateway", "relational-database", "message-queue", "in-memory-cache"];

  for (let i = 0; i < nodeCount; i++) {
    const compType = types[i % types.length];
    nodes.push({
      id: `node_${i}`,
      type: "infrastructure",
      position: { x: (i % 20) * 150, y: Math.floor(i / 20) * 120 },
      label: `Node ${i} (${compType})`,
      data: {
        componentType: compType,
        instanceCount: (i % 4) + 1,
        timeoutMs: 5000,
        rateLimitRps: 1000,
        replicas: (i % 3),
      },
    });

    if (i > 0) {
      const targetIdx = Math.floor(i / 2);
      edges.push({
        id: `edge_${i}_${targetIdx}`,
        source: `node_${i}`,
        target: `node_${targetIdx}`,
        data: {
          protocol: "https",
          isSynchronous: true,
        },
      });
    }
  }

  return { nodes, edges };
}

describe("Architecture Comparison Engine - Performance Benchmarks (Phase 05.3.9)", () => {
  it("benchmarks 100-node graph comparison execution", () => {
    const baseline = generateTestTopology(100);
    const candidate = generateTestTopology(100);

    // Mutate 15% of candidate nodes
    for (let i = 0; i < 15; i++) {
      candidate.nodes[i].data = {
        ...candidate.nodes[i].data,
        instanceCount: 10,
        timeoutMs: 15000,
      };
    }
    // Add 5 new nodes
    candidate.nodes.push({
      id: "node_new_101",
      type: "infrastructure",
      position: { x: 500, y: 500 },
      data: { componentType: "in-memory-cache" },
    });

    const start = performance.now();
    const result = comparisonEngine.compareGraphs(
      baseline.nodes,
      baseline.edges,
      candidate.nodes,
      candidate.edges
    );
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(300); // Budget: < 300ms
    expect(result.changes.length).toBeGreaterThanOrEqual(16);
    expect(result.summary.addedNodesCount).toBe(1);
    expect(result.summary.modifiedNodesCount).toBe(15);
  });

  it("benchmarks 500-node graph comparison execution", () => {
    const baseline = generateTestTopology(500);
    const candidate = generateTestTopology(500);

    for (let i = 0; i < 50; i++) {
      candidate.nodes[i].data = {
        ...candidate.nodes[i].data,
        rateLimitRps: 5000,
      };
    }

    const start = performance.now();
    const result = comparisonEngine.compareGraphs(
      baseline.nodes,
      baseline.edges,
      candidate.nodes,
      candidate.edges
    );
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(600); // Budget: < 600ms
    expect(result.changes.length).toBeGreaterThanOrEqual(50);
  });

  it("benchmarks 1,000-node graph comparison execution under budget", () => {
    const baseline = generateTestTopology(1000);
    const candidate = generateTestTopology(1000);

    for (let i = 0; i < 100; i++) {
      candidate.nodes[i].data = {
        ...candidate.nodes[i].data,
        replicas: 5,
      };
    }

    const start = performance.now();
    const result = comparisonEngine.compareGraphs(
      baseline.nodes,
      baseline.edges,
      candidate.nodes,
      candidate.edges
    );
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1000); // Budget: < 1000ms
    expect(result.changes.length).toBeGreaterThanOrEqual(100);
  });
});
