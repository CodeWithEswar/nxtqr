import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { architectureSimulationEngine } from "../simulation/engine/simulation-engine";
import { SIMULATION_PRESETS } from "../simulation/presets/failure-presets";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { SectionComposer } from "../reports/engine/section-composer";
import { SourceResolver } from "../reports/engine/source-resolver";
import type { FailureScenario } from "../simulation/contracts/simulation.types";

describe("Architecture Simulation Engine - Integration", () => {
  const nodes: BaseNode[] = [
    { id: "api-gw", type: "api_gateway", position: { x: 0, y: 0 }, data: { label: "API Gateway" } },
    { id: "order-svc", type: "microservice", position: { x: 150, y: 0 }, data: { label: "Order Service" } },
    { id: "inventory-svc", type: "microservice", position: { x: 150, y: 150 }, data: { label: "Inventory Service" } },
    { id: "db-primary", type: "database", position: { x: 300, y: 0 }, data: { label: "Primary Database" } },
    { id: "cache-redis", type: "cache", position: { x: 300, y: 150 }, data: { label: "Redis Cluster" } },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "api-gw", target: "order-svc", data: { protocol: "HTTP" } },
    { id: "e2", source: "order-svc", target: "db-primary", data: { protocol: "Postgres" } },
    { id: "e3", source: "api-gw", target: "inventory-svc", data: { protocol: "HTTP" } },
    { id: "e4", source: "inventory-svc", target: "cache-redis", data: { protocol: "Redis" } },
  ];

  it("simulates primary database outage preset scenario", () => {
    const preset = SIMULATION_PRESETS.primary_database_outage;
    expect(preset).toBeDefined();

    const scenario = preset.buildScenario({
      architectureId: "arch-test",
      graphRevision: "rev-1",
      targetNodeId: "db-primary",
      targetNodeLabel: "Primary Database",
      criticalJourneys: [
        {
          id: "j-checkout",
          name: "Checkout Journey",
          description: "Customer purchasing journey",
          entryNodeId: "api-gw",
          requiredNodeIds: ["api-gw", "order-svc", "db-primary"],
          criticality: "critical",
        },
      ],
    });

    const result = architectureSimulationEngine.simulate(nodes, edges, scenario);

    expect(result.id).toBeDefined();
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.blastRadius.directlyImpactedNodeIds).toContain("db-primary");
    expect(result.blastRadius.indirectlyImpactedNodeIds).toContain("order-svc");
    expect(result.blastRadius.unaffectedNodeIds).toContain("inventory-svc");
    expect(result.blastRadius.unaffectedNodeIds).toContain("cache-redis");
    expect(result.findings.length).toBeGreaterThan(0);
  });

  it("simulates cache outage and stampede preset scenario", () => {
    const preset = SIMULATION_PRESETS.cache_outage;
    expect(preset).toBeDefined();

    const scenario = preset.buildScenario({
      architectureId: "arch-test",
      graphRevision: "rev-1",
      targetNodeId: "cache-redis",
      targetNodeLabel: "Redis Cluster",
      secondaryNodeId: "db-primary",
      criticalJourneys: [
        {
          id: "j-browse",
          name: "Catalog Browse",
          description: "Catalog browsing journey",
          entryNodeId: "api-gw",
          requiredNodeIds: ["api-gw", "inventory-svc"],
          optionalNodeIds: ["cache-redis"],
          criticality: "high",
        },
      ],
    });

    const result = architectureSimulationEngine.simulate(nodes, edges, scenario);

    expect(result.events.some((e) => e.targetId === "cache-redis")).toBe(true);
    expect(result.journeyResults.length).toBeGreaterThan(0);
  });

  it("compares baseline vs candidate architecture with improved resilience", () => {
    const baselinePreset = SIMULATION_PRESETS.primary_database_outage;
    const scenario: FailureScenario = baselinePreset.buildScenario({
      architectureId: "arch-test",
      graphRevision: "rev-1",
      targetNodeId: "db-primary",
      targetNodeLabel: "Primary Database",
      criticalJourneys: [
        {
          id: "j-checkout",
          name: "Checkout Journey",
          description: "Customer purchasing journey",
          entryNodeId: "api-gw",
          requiredNodeIds: ["api-gw", "order-svc", "db-primary"],
          criticality: "critical",
        },
      ],
    });

    const baselineResult = architectureSimulationEngine.simulate(nodes, edges, scenario);

    // Candidate architecture with replica DB and circuit breaker on order-svc
    const candidateNodes: BaseNode[] = [
      ...nodes,
      { id: "db-replica", type: "database", position: { x: 300, y: 75 }, data: { label: "Replica Database" } },
    ];
    const candidateEdges: BaseEdge[] = [
      ...edges,
      { id: "e-rep", source: "order-svc", target: "db-replica", data: { protocol: "Postgres" } },
    ];

    const candidateScenario: FailureScenario = {
      ...scenario,
      graphRevision: "rev-2",
      injections: scenario.injections.map((inj) => ({
        ...inj,
        recoveryBehavior: "automatic",
        parameters: { failoverDelayMs: 5000, recoveryTimeMs: 5000 },
      })),
    };

    const candidateResult = architectureSimulationEngine.simulate(candidateNodes, candidateEdges, candidateScenario);

    const comparison = architectureSimulationEngine.compareScenarios(
      baselineResult,
      candidateResult
    );

    expect(comparison.baselineScenarioId).toBe(baselineResult.scenario.id);
    expect(comparison.candidateRevision).toBe("rev-2");
    expect(comparison.summary).toBeDefined();
  });

  it("executes AI Architecture Assistant Tool #18 (simulate_failure_scenario)", async () => {
    const execCtx = {
      projectId: "proj-test",
      architectureId: "arch-test-123",
      graphRevision: "rev-1",
      nodes,
      edges,
    };

    const response = await architectureToolRegistry.executeTool(
      "simulate_failure_scenario",
      {
        failureType: "component_outage",
        targetNodeId: "db-primary",
        durationSeconds: 60,
      },
      execCtx
    );

    expect(response.success).toBe(true);
    expect(response.result).toBeDefined();
    const result = response.result as any;
    expect(result.blastRadiusScore).toBeGreaterThan(0);
    expect(result.findings).toBeDefined();
  });

  it("integrates simulation evidence into report section composer", () => {
    const preset = SIMULATION_PRESETS.primary_database_outage;
    const scenario = preset.buildScenario({
      architectureId: "arch-test",
      graphRevision: "rev-1",
      targetNodeId: "db-primary",
      criticalJourneys: [],
    });
    const simResult = architectureSimulationEngine.simulate(nodes, edges, scenario);

    const topology = SourceResolver.resolveTopology(nodes, edges);

    const sections = SectionComposer.composeSections({
      nodes,
      edges,
      topology,
      evidence: [],
      analysisContext: { simulation: simResult },
      audience: "engineering",
      enabledKinds: ["simulation"],
    });

    expect(sections.length).toBe(1);
    expect(sections[0].kind).toBe("simulation");
    const simSection = sections[0] as any;
    expect(simSection.content.scenarioName).toBe(scenario.name);
    expect(simSection.content.injections.length).toBeGreaterThan(0);
  });
});
