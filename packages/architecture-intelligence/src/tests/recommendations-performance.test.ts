import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { recommendationEngine, type MultiEngineAnalysisInputs } from "../index";

describe("Unified Architecture Recommendations - Performance Benchmarks", () => {
  function generateSyntheticTopology(nodeCount: number): {
    nodes: BaseNode[];
    edges: BaseEdge[];
    inputs: MultiEngineAnalysisInputs;
  } {
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
        id: `rec_node_${i}`,
        type: "infrastructure",
        position: { x: (i % 25) * 80, y: Math.floor(i / 25) * 80 },
        data: {
          componentType: type,
          label: `Component ${i}`,
          declaredCapacityRps: 500,
        },
      });

      if (i > 0) {
        edges.push({
          id: `rec_edge_${i}`,
          source: `rec_node_${Math.floor((i - 1) / 2)}`,
          target: `rec_node_${i}`,
          data: { protocol: "tcp", isSynchronous: true },
        });
      }
    }

    const bottleneckFindings = [];
    for (let i = 0; i < Math.min(25, nodeCount); i += 2) {
      bottleneckFindings.push({
        id: `btk_${i}`,
        ruleId: "BTK-DB-001",
        category: "database-contention",
        severity: "critical" as const,
        title: `Contention on Component ${i}`,
        explanation: `Bottleneck detected on Component ${i}`,
        affectedNodeIds: [`rec_node_${i}`],
        affectedEdgeIds: [],
        evidence: [],
        assumptions: [],
        confidence: "high" as const,
      });
    }

    const reliabilityFindings = [];
    for (let i = 1; i < Math.min(25, nodeCount); i += 2) {
      reliabilityFindings.push({
        id: `rel_${i}`,
        ruleId: "REL-BACK-001",
        category: "backpressure",
        severity: "high" as const,
        title: `Missing Ingress Rate Limiting on Component ${i}`,
        explanation: `Unthrottled ingress detected`,
        affectedNodeIds: [`rec_node_${i}`],
        affectedEdgeIds: [],
        evidence: [],
        assumptions: [],
        confidence: "high" as const,
      });
    }

    return {
      nodes,
      edges,
      inputs: {
        bottleneckFindings,
        reliabilityFindings,
      } as any,
    };
  }

  it("benchmarks 100-node graph unified recommendation generation & planning", () => {
    const { nodes, edges, inputs } = generateSyntheticTopology(100);

    const startTime = performance.now();
    const report = recommendationEngine.generateRecommendations(nodes, edges, inputs);
    const duration = performance.now() - startTime;

    expect(report).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.plan).toBeDefined();
    expect(duration).toBeLessThan(150); // < 150ms budget
  });

  it("benchmarks 500-node graph unified recommendation generation & planning", () => {
    const { nodes, edges, inputs } = generateSyntheticTopology(500);

    const startTime = performance.now();
    const report = recommendationEngine.generateRecommendations(nodes, edges, inputs);
    const duration = performance.now() - startTime;

    expect(report).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(350); // < 350ms budget
  });

  it("benchmarks 1,000-node graph unified recommendation generation & planning", () => {
    const { nodes, edges, inputs } = generateSyntheticTopology(1000);

    const startTime = performance.now();
    const report = recommendationEngine.generateRecommendations(nodes, edges, inputs);
    const duration = performance.now() - startTime;

    expect(report).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(800); // < 800ms budget
  });
});
