import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { CapacityPlanningEngine } from "../capacity-planning/engine/capacity-planning-engine";
import { DEFAULT_CAPACITY_SCENARIOS } from "../capacity-planning/scenarios/capacity-scenarios";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import type { AIExecutionContext } from "../ai-assistant/contracts/ai-assistant.types";

describe("Capacity Planning - Integration & AI Tool Execution", () => {
  const engine = new CapacityPlanningEngine();

  const baseNodes: BaseNode[] = [
    {
      id: "ingress",
      type: "api-gateway",
      position: { x: 0, y: 0 },
      label: "Ingress Gateway",
      data: { replicas: 2, capacityRps: 500 },
    },
    {
      id: "checkout_svc",
      type: "compute-service",
      position: { x: 200, y: 0 },
      label: "Checkout Service",
      data: { replicas: 2, capacityRps: 400 },
    },
    {
      id: "orders_postgres",
      type: "relational-database",
      position: { x: 400, y: 0 },
      label: "Orders PostgreSQL",
      data: { replicas: 1, capacityRps: 300, readRatio: 0.75 },
    },
  ];

  const baseEdges: BaseEdge[] = [
    { id: "e1", source: "ingress", target: "checkout_svc", data: { protocol: "https" } },
    { id: "e2", source: "checkout_svc", target: "orders_postgres", data: { protocol: "tcp" } },
  ];

  it("compares baseline and surged growth scenarios", () => {
    const comparison = engine.compareScenarios(
      baseNodes,
      baseEdges,
      [
        DEFAULT_CAPACITY_SCENARIOS.steady_state,
        DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth,
        DEFAULT_CAPACITY_SCENARIOS.black_friday_surge,
      ]
    );

    expect(comparison.length).toBe(3);

    const steady = comparison.find((c) => c.scenarioId === "steady_state");
    const growth = comparison.find((c) => c.scenarioId === "rapid_startup_growth");

    expect(steady).toBeDefined();
    expect(growth).toBeDefined();

    // Growth demand should be significantly higher than steady state at horizon
    expect(growth!.finalDemandRps).toBeGreaterThan(steady!.finalDemandRps);
  });

  it("evaluates What-If scaling improvement accurately", () => {
    const growthScenario = DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth;

    // Report before scaling
    const reportBefore = engine.planCapacity(baseNodes, baseEdges, growthScenario);

    // What-If: scale checkout_svc from 2 to 6 replicas with higher capacity
    const scaledNodes = baseNodes.map((n) =>
      n.id === "checkout_svc"
        ? { ...n, data: { ...n.data, replicas: 6, capacityRps: 1200 } }
        : n
    );

    const reportAfter = engine.planCapacity(scaledNodes, baseEdges, growthScenario);

    const checkoutBefore = reportBefore.componentEvaluations["checkout_svc"];
    const checkoutAfter = reportAfter.componentEvaluations["checkout_svc"];

    expect(checkoutBefore).toBeDefined();
    expect(checkoutAfter).toBeDefined();

    // After scaling, checkout should have much higher headroom at horizon
    expect(checkoutAfter.headroomAtHorizonRps!).toBeGreaterThan(checkoutBefore.headroomAtHorizonRps!);
  });

  it("executes get_capacity_plan via AI Assistant Tool Registry", async () => {
    const tool = architectureToolRegistry.getTool("get_capacity_plan");
    expect(tool).toBeDefined();

    const mockContext: AIExecutionContext = {
      projectId: "proj_test_01",
      architectureId: "arch_test_01",
      graphRevision: "rev_001",
      nodes: baseNodes,
      edges: baseEdges,
    };

    const toolExecution = await architectureToolRegistry.executeTool(
      "get_capacity_plan",
      {
        scenarioId: "rapid_startup_growth",
        horizonIntervals: 6,
      },
      mockContext
    );

    expect(toolExecution.success).toBe(true);
    expect(toolExecution.result).toBeDefined();

    const res = toolExecution.result as Record<string, unknown>;
    expect(res.scenarioId).toBe("rapid_startup_growth");
    expect(res.horizonIntervals).toBe(6);
  });
});
