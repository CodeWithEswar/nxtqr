import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { SecurityAnalysisEngine } from "../index";

describe("Security Architecture Analysis - Scalability & Performance Benchmarks", () => {
  function generateSyntheticGraph(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
    const nodes: BaseNode[] = [];
    const edges: BaseEdge[] = [];

    // Create 3 trust boundaries
    nodes.push({
      id: "boundary_public",
      type: "infrastructure",
      position: { x: 0, y: 0 },
      data: { componentType: "trust-boundary", boundaryName: "Public DMZ", threatModelZone: "perimeter" },
    });
    nodes.push({
      id: "boundary_private",
      type: "infrastructure",
      position: { x: 500, y: 0 },
      data: { componentType: "network-boundary", boundaryName: "Private Application Subnet", threatModelZone: "core-data" },
    });
    nodes.push({
      id: "boundary_db",
      type: "infrastructure",
      position: { x: 1000, y: 0 },
      data: { componentType: "network-boundary", boundaryName: "Secure Data Tier", threatModelZone: "core-data" },
    });

    const componentTypes = [
      "compute-instance",
      "api-gateway",
      "relational-database",
      "in-memory-cache",
      "web-browser",
      "authentication-service",
      "policy-engine",
      "secrets-manager",
    ];

    for (let i = 0; i < nodeCount; i++) {
      const type = componentTypes[i % componentTypes.length];
      const boundary = i % 3 === 0 ? "boundary_public" : i % 3 === 1 ? "boundary_private" : "boundary_db";
      const isPublic = i % 3 === 0;

      nodes.push({
        id: `node_${i}`,
        type: "infrastructure",
        position: { x: (i % 25) * 60, y: Math.floor(i / 25) * 60 },
        data: {
          componentType: type,
          label: `Node ${i} (${type})`,
          exposure: isPublic ? "public" : "internal",
          boundaryId: boundary,
          isAnonymousAllowed: i % 5 === 0,
          enforcesTls: i % 2 === 0,
        },
      });

      if (i > 0) {
        edges.push({
          id: `edge_${i}`,
          source: `node_${Math.floor((i - 1) / 2)}`,
          target: `node_${i}`,
          data: {
            protocol: i % 2 === 0 ? "https" : "http",
            encryptionInTransit: i % 2 === 0,
          },
        });
      }
    }

    return { nodes, edges };
  }

  it("benchmarks 100-node graph execution", () => {
    const { nodes, edges } = generateSyntheticGraph(100);
    const engine = new SecurityAnalysisEngine();

    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const report = engine.analyzeGraph(nodes, edges);
    const duration = performance.now() - startTime;
    const memDeltaMb = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);

    console.log(`[Benchmark 100 nodes] Execution: ${duration.toFixed(2)}ms | Heap Delta: ${memDeltaMb.toFixed(2)}MB | Findings: ${report.findings.length}`);
    expect(duration).toBeLessThan(250); // Generous buffer for parallel vitest runs (< 250ms)
    expect(report.nodeCount).toBe(103);
  });

  it("benchmarks 500-node graph execution", () => {
    const { nodes, edges } = generateSyntheticGraph(500);
    const engine = new SecurityAnalysisEngine();

    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const report = engine.analyzeGraph(nodes, edges);
    const duration = performance.now() - startTime;
    const memDeltaMb = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);

    console.log(`[Benchmark 500 nodes] Execution: ${duration.toFixed(2)}ms | Heap Delta: ${memDeltaMb.toFixed(2)}MB | Findings: ${report.findings.length}`);
    expect(duration).toBeLessThan(350); // Strict budget < 350ms
    expect(report.nodeCount).toBe(503);
  });

  it("benchmarks 1,000-node graph execution", () => {
    const { nodes, edges } = generateSyntheticGraph(1000);
    const engine = new SecurityAnalysisEngine();

    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const report = engine.analyzeGraph(nodes, edges);
    const duration = performance.now() - startTime;
    const memDeltaMb = (process.memoryUsage().heapUsed - startMem) / (1024 * 1024);

    console.log(`[Benchmark 1000 nodes] Execution: ${duration.toFixed(2)}ms | Heap Delta: ${memDeltaMb.toFixed(2)}MB | Findings: ${report.findings.length}`);
    expect(duration).toBeLessThan(800); // Strict budget < 800ms
    expect(report.nodeCount).toBe(1003);
  });
});

