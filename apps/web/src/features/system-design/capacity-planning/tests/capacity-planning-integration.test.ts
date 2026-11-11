import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  capacityPlanningEngine,
  DEFAULT_CAPACITY_SCENARIOS,
} from "@nxtqr/architecture-intelligence";

describe("Web Feature - Capacity Planning Integration", () => {
  const nodes: BaseNode[] = [
    {
      id: "api_gateway",
      type: "api-gateway",
      position: { x: 50, y: 150 },
      label: "API Gateway",
      data: { replicas: 4, capacityRps: 2000 },
    },
    {
      id: "core_service",
      type: "compute-service",
      position: { x: 280, y: 150 },
      label: "Core Service",
      data: { replicas: 4, capacityRps: 1600 },
    },
    {
      id: "postgres_primary",
      type: "relational-database",
      position: { x: 520, y: 150 },
      label: "PostgreSQL Primary",
      data: { replicas: 2, capacityRps: 1500, maxWriteRps: 500 },
    },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "api_gateway", target: "core_service", data: { protocol: "https" } },
    { id: "e2", source: "core_service", target: "postgres_primary", data: { protocol: "tcp" } },
  ];

  it("computes forecast and verifies category summaries", () => {
    const report = capacityPlanningEngine.planCapacity(
      nodes,
      edges,
      DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth
    );

    expect(report.scenarioId).toBe("rapid_startup_growth");
    expect(report.categorySummaries.compute.totalComponents).toBe(1);
    expect(report.categorySummaries.database.totalComponents).toBe(1);
    expect(report.categorySummaries.network.totalComponents).toBe(1);
  });

  it("handles multi-scenario comparison matrix generation", () => {
    const matrix = capacityPlanningEngine.compareScenarios(
      nodes,
      edges,
      [
        DEFAULT_CAPACITY_SCENARIOS.steady_state,
        DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth,
        DEFAULT_CAPACITY_SCENARIOS.linear_enterprise_scaling,
      ]
    );

    expect(matrix.length).toBe(3);
    const steady = matrix.find((m) => m.scenarioId === "steady_state");
    expect(steady).toBeDefined();
    expect(steady?.earliestSaturationLabel).toBe("Sufficient Headroom");
  });
});
