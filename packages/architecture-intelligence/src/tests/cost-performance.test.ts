import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { ArchitectureCostEngine } from "../cost/engine/cost-engine";

function generateTestGraph(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];

  // Ingress gateway
  nodes.push({
    id: "gw_0",
    type: "loadBalancer",
    position: { x: 0, y: 0 },
    data: { label: "Ingress Gateway", pricingSku: "ingress.alb" },
  });

  for (let i = 1; i < nodeCount; i++) {
    const isService = i % 3 !== 0;
    const isDb = i % 3 === 0 && i % 6 !== 0;
    const type = isService ? "service" : isDb ? "database" : "cache";
    const pricingSku = isService
      ? "compute.t3.medium"
      : isDb
      ? "db.rds.postgres.t3.medium"
      : "cache.redis.t3.small";

    nodes.push({
      id: `node_${i}`,
      type,
      position: { x: (i % 25) * 120, y: Math.floor(i / 25) * 80 },
      data: {
        label: `Component ${i}`,
        replicas: isService ? 2 : 1,
        pricingSku,
        storageGb: isDb ? 100 : undefined,
      },
    });

    const parentId = i <= 5 ? "gw_0" : `node_${Math.floor((i - 1) / 3)}`;
    edges.push({
      id: `edge_${i}`,
      source: parentId,
      target: `node_${i}`,
      data: {},
    });
  }

  return { nodes, edges };
}

describe("Cost Intelligence - High-Volume Performance Benchmark", () => {
  const engine = new ArchitectureCostEngine();

  it("calculates cost for a 100-node graph in under 100ms", () => {
    const { nodes, edges } = generateTestGraph(100);
    const start = performance.now();
    const estimate = engine.estimateCost(nodes, edges, { providerId: "aws" });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    expect(estimate.status).toBe("complete");
    expect(estimate.lineItems.length).toBeGreaterThan(100);
  });

  it("calculates cost for a 500-node graph in under 200ms", () => {
    const { nodes, edges } = generateTestGraph(500);
    const start = performance.now();
    const estimate = engine.estimateCost(nodes, edges, { providerId: "aws" });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(200);
    expect(estimate.status).toBe("complete");
    expect(estimate.lineItems.length).toBeGreaterThan(500);
  });

  it("calculates cost for a 1,000-node graph in under 350ms", () => {
    const { nodes, edges } = generateTestGraph(1000);
    const start = performance.now();
    const estimate = engine.estimateCost(nodes, edges, { providerId: "aws" });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(350);
    expect(estimate.status).toBe("complete");
    expect(estimate.totalResourcesCount).toBeGreaterThanOrEqual(1000);
  });

  it("serves repeated requests from LRU memoization cache in under 5ms", () => {
    const { nodes, edges } = generateTestGraph(200);
    // Cold run
    engine.estimateCost(nodes, edges, { providerId: "aws", graphRevision: "cached_v1" });

    // Warm run
    const start = performance.now();
    const cachedEstimate = engine.estimateCost(nodes, edges, { providerId: "aws", graphRevision: "cached_v1" });
    const warmDuration = performance.now() - start;

    expect(warmDuration).toBeLessThan(5);
    expect(cachedEstimate.status).toBe("complete");
  });
});
