import { describe, it, expect } from "vitest";
import { architectureHealthEngine } from "../core/assessment-engine";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Representative Architecture Topologies & Benchmarks", () => {
  it("assesses a clean, resilient microservices topology with high score", () => {
    const nodes: BaseNode[] = [
      {
        id: "client",
        type: "web-browser",
        position: { x: 0, y: 0 },
        data: {},
      },
      {
        id: "gateway",
        type: "api-gateway",
        position: { x: 100, y: 0 },
        data: { replicas: 3, highAvailability: true, rateLimitingEnabled: true },
      },
      {
        id: "auth_svc",
        type: "container-service",
        position: { x: 250, y: -50 },
        data: { replicas: 2, highAvailability: true },
      },
      {
        id: "order_svc",
        type: "container-service",
        position: { x: 250, y: 50 },
        data: { replicas: 2, highAvailability: true },
      },
      {
        id: "db_primary",
        type: "relational-database",
        position: { x: 450, y: 50 },
        data: { multiAz: true, readReplicas: 2, encryptionAtRest: true, backupEnabled: true },
      },
      {
        id: "cache",
        type: "distributed-cache",
        position: { x: 450, y: -50 },
        data: { highAvailability: true },
      },
      {
        id: "logger",
        type: "log-aggregator",
        position: { x: 250, y: 150 },
        data: {},
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "gateway", data: { protocol: "HTTPS" } },
      { id: "e2", source: "gateway", target: "auth_svc", data: { protocol: "HTTPS" } },
      { id: "e3", source: "gateway", target: "order_svc", data: { protocol: "HTTPS" } },
      { id: "e4", source: "order_svc", target: "db_primary", data: { protocol: "SQL" } },
      { id: "e5", source: "auth_svc", target: "cache", data: { protocol: "REDIS" } },
    ];

    const report = architectureHealthEngine.assessGraph(nodes, edges);

    expect(report.status).toBe("assessed");
    expect(report.overallScore).toBeGreaterThanOrEqual(85);
    expect(report.overallGrade).toMatch(/A|B/);
    expect(report.dimensions.security.findings.length).toBe(0);
  });

  it("efficiently evaluates a 100-node graph under 100ms", () => {
    const nodes: BaseNode[] = [];
    const edges: BaseEdge[] = [];

    // Construct 100-node graph with layered service tiers
    for (let i = 0; i < 100; i++) {
      nodes.push({
        id: `node_${i}`,
        type: i % 10 === 0 ? "api-gateway" : i % 5 === 0 ? "relational-database" : "container-service",
        position: { x: (i % 10) * 100, y: Math.floor(i / 10) * 80 },
        data: { replicas: 2, encryptionAtRest: true, multiAz: true },
      });
    }

    for (let i = 0; i < 90; i++) {
      edges.push({
        id: `edge_${i}`,
        source: `node_${i}`,
        target: `node_${i + 1}`,
        data: { protocol: "HTTPS", relationshipKind: "request-response" },
      });
    }

    const t0 = Date.now();
    const report = architectureHealthEngine.assessGraph(nodes, edges);
    const duration = Date.now() - t0;

    expect(report.metrics.totalComponents).toBe(100);
    expect(report.metrics.totalConnections).toBe(90);
    expect(duration).toBeLessThan(150); // fast execution budget

    // Test memoization on identical graph
    const tMemo0 = Date.now();
    const memoReport = architectureHealthEngine.assessGraph(nodes, edges);
    const memoDuration = Date.now() - tMemo0;

    expect(memoReport.graphRevision).toBe(report.graphRevision);
    expect(memoDuration).toBeLessThan(5); // Cache hit takes < 5ms
  });
});
