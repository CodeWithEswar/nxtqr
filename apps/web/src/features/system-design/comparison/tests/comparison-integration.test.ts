import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { comparisonEngine } from "@nxtqr/architecture-intelligence";

describe("Architecture Comparison Web Integration Test (Phase 05.3.9)", () => {
  const baselineNodes: BaseNode[] = [
    {
      id: "gw_1",
      type: "infrastructure",
      position: { x: 0, y: 0 },
      data: { componentType: "api-gateway", authPolicy: "oauth2-jwt", rateLimitRps: 1000 },
    },
    {
      id: "srv_1",
      type: "infrastructure",
      position: { x: 200, y: 0 },
      data: { componentType: "compute-instance", instanceCount: 2, timeoutMs: 5000 },
    },
    {
      id: "db_1",
      type: "infrastructure",
      position: { x: 400, y: 0 },
      data: { componentType: "relational-database", multiAz: true, readReplicas: 1 },
    },
  ];

  const baselineEdges: BaseEdge[] = [
    { id: "e1", source: "gw_1", target: "srv_1", data: { isSynchronous: true, protocol: "http" } },
    { id: "e2", source: "srv_1", target: "db_1", data: { isSynchronous: true, protocol: "tcp" } },
  ];

  it("compares baseline against candidate and summarizes topological differences", () => {
    const candidateNodes: BaseNode[] = [
      {
        id: "gw_1",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { componentType: "api-gateway", authPolicy: "oauth2-jwt", rateLimitRps: 2000 },
      },
      {
        id: "srv_1",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: { componentType: "compute-instance", instanceCount: 4, timeoutMs: 3000 },
      },
      {
        id: "cache_1",
        type: "infrastructure",
        position: { x: 300, y: 50 },
        data: { componentType: "in-memory-cache", memoryMb: 4096 },
      },
      {
        id: "db_1",
        type: "infrastructure",
        position: { x: 400, y: 0 },
        data: { componentType: "relational-database", multiAz: true, readReplicas: 2 },
      },
    ];

    const candidateEdges: BaseEdge[] = [
      ...baselineEdges,
      { id: "e_cache", source: "srv_1", target: "cache_1", data: { isSynchronous: true, protocol: "tcp" } },
    ];

    const result = comparisonEngine.compareGraphs(
      baselineNodes,
      baselineEdges,
      candidateNodes,
      candidateEdges,
      {
        baselineTitle: "Baseline Production",
        candidateTitle: "Scaled Cache Candidate",
      }
    );

    expect(result.summary.addedNodesCount).toBe(1);
    expect(result.summary.addedEdgesCount).toBe(1);
    expect(result.summary.modifiedNodesCount).toBe(3);
    expect(result.summary.regressionsCount).toBe(0);
    expect(result.summary.overallAssessment).toBe("improved");
  });

  it("flags architectural regressions when high availability is disabled in candidate", () => {
    const candidateNodes: BaseNode[] = [
      {
        id: "gw_1",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { ...baselineNodes[0].data },
      },
      {
        id: "srv_1",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: { ...baselineNodes[1].data },
      },
      {
        id: "db_1",
        type: "infrastructure",
        position: { x: 400, y: 0 },
        data: {
          componentType: "relational-database",
          multiAz: false, // Regression!
          readReplicas: 0, // Regression!
        },
      },
    ];

    const result = comparisonEngine.compareGraphs(
      baselineNodes,
      baselineEdges,
      candidateNodes,
      baselineEdges
    );

    expect(result.regressions.length).toBeGreaterThanOrEqual(2);
    expect(result.summary.supportedRegressionsCount).toBeGreaterThanOrEqual(2);
    expect(result.summary.overallAssessment).toBe("regressed");
  });
});
