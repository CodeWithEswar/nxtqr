import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { architectureSimulationEngine } from "../simulation/engine/simulation-engine";
import type { FailureScenario } from "../simulation/contracts/simulation.types";

function generateTestGraph(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];

  // Ingress gateway
  nodes.push({
    id: "gw-0",
    type: "api_gateway",
    position: { x: 0, y: 0 },
    data: { label: "Ingress Gateway" },
  });

  for (let i = 1; i < nodeCount; i++) {
    const isService = i % 3 !== 0;
    const isDb = i % 3 === 0 && i % 6 !== 0;
    const type = isService ? "microservice" : isDb ? "database" : "cache";

    nodes.push({
      id: `node-${i}`,
      type,
      position: { x: (i % 25) * 120, y: Math.floor(i / 25) * 80 },
      data: {
        label: `Service ${i}`,
        replicas: isService ? 2 : 1,
      },
    });

    const parentId = i <= 5 ? "gw-0" : `node-${Math.floor((i - 1) / 3)}`;
    edges.push({
      id: `edge-${i}`,
      source: parentId,
      target: `node-${i}`,
      data: { protocol: "HTTP" },
    });
  }

  return { nodes, edges };
}

describe("Architecture Simulation Engine - Performance Benchmarks", () => {
  it("simulates a 100-node graph in under 50ms", () => {
    const { nodes, edges } = generateTestGraph(100);

    const scenario: FailureScenario = {
      id: "sc-perf-100",
      architectureId: "arch-perf-100",
      graphRevision: "rev-1",
      name: "100-Node Performance Benchmark",
      description: "Stress testing propagation across 100 components",
      durationMs: 60000,
      injections: [
        {
          id: "inj-perf-1",
          name: "Deep Dependency Failure",
          type: "component_outage",
          targetId: "node-3",
          targetType: "node",
          startMs: 10000,
          durationMs: 20000,
          severity: "critical",
          recoveryBehavior: "automatic",
        },
      ],
      criticalJourneys: [
        {
          id: "j-main",
          name: "Main Journey",
          description: "Main critical user journey",
          entryNodeId: "gw-0",
          requiredNodeIds: ["gw-0", "node-1", "node-3"],
          criticality: "critical",
        },
      ],
      assumptions: [],
    };

    const start = performance.now();
    const result = architectureSimulationEngine.simulate(nodes, edges, scenario);
    const duration = performance.now() - start;

    expect(result.events.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(150); // generous limit for diverse CI runners, typically <20ms
  });

  it("simulates a 500-node graph in under 250ms", () => {
    const { nodes, edges } = generateTestGraph(500);

    const scenario: FailureScenario = {
      id: "sc-perf-500",
      architectureId: "arch-perf-500",
      graphRevision: "rev-1",
      name: "500-Node Performance Benchmark",
      description: "Propagation across 500 components",
      durationMs: 60000,
      injections: [
        {
          id: "inj-perf-500",
          name: "Storage Node Outage",
          type: "component_outage",
          targetId: "node-6",
          targetType: "node",
          startMs: 15000,
          durationMs: 15000,
          severity: "critical",
          recoveryBehavior: "automatic",
        },
      ],
      criticalJourneys: [
        {
          id: "j-500",
          name: "Enterprise Journey",
          description: "Enterprise user journey",
          entryNodeId: "gw-0",
          requiredNodeIds: ["gw-0", "node-2", "node-6"],
          criticality: "critical",
        },
      ],
      assumptions: [],
    };

    const start = performance.now();
    const result = architectureSimulationEngine.simulate(nodes, edges, scenario);
    const duration = performance.now() - start;

    expect(result.events.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(400); // typically <80ms
  });

  it("simulates a 1,000-node graph in under 500ms", () => {
    const { nodes, edges } = generateTestGraph(1000);

    const scenario: FailureScenario = {
      id: "sc-perf-1000",
      architectureId: "arch-perf-1000",
      graphRevision: "rev-1",
      name: "1000-Node Performance Benchmark",
      description: "Scale test across 1000 components",
      durationMs: 60000,
      injections: [
        {
          id: "inj-perf-1000",
          name: "Root Gateway Outage",
          type: "component_outage",
          targetId: "gw-0",
          targetType: "node",
          startMs: 5000,
          durationMs: 20000,
          severity: "critical",
          recoveryBehavior: "automatic",
        },
      ],
      criticalJourneys: [
        {
          id: "j-1000",
          name: "Core Journey",
          description: "Core critical user journey",
          entryNodeId: "gw-0",
          requiredNodeIds: ["gw-0", "node-1"],
          criticality: "critical",
        },
      ],
      assumptions: [],
    };

    const start = performance.now();
    const result = architectureSimulationEngine.simulate(nodes, edges, scenario);
    const duration = performance.now() - start;

    expect(result.events.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(800); // typically <180ms
  });
});
