import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  scalabilityRecommendationsEngine,
  ScalabilityRecommendationsEngine,
  WhatIfEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
} from "../index";

describe("Scalability Recommendations Engine (Phase 05.3.6)", () => {
  it("recommends horizontal scaling for compute instances exceeding capacity", () => {
    const nodes: BaseNode[] = [
      {
        id: "client",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { componentType: "web-browser", label: "Client" },
      },
      {
        id: "api_service",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "container-service",
          label: "Order API",
          replicas: 1,
          declaredCapacityRps: 500, // lower than 1000 baseline
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "api_service", data: { protocol: "https" } },
    ];

    const report = scalabilityRecommendationsEngine.evaluateGraph(
      nodes,
      edges,
      DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
    );

    const horizRec = report.recommendations.find(
      (r) => r.strategy === "horizontal-scaling" && r.affectedNodeIds.includes("api_service")
    );

    expect(horizRec).toBeDefined();
    expect(horizRec?.feasibility).toBe("applicable");
    expect(horizRec?.proposedOperations).toHaveLength(1);
    expect(horizRec?.proposedOperations[0].type).toBe("adjust_instances");
    if (horizRec?.proposedOperations[0].type === "adjust_instances") {
      expect(horizRec.proposedOperations[0].newReplicas).toBeGreaterThan(1);
    }
  });

  it("marks horizontal scaling as conditional when service has stateful dependencies", () => {
    const nodes: BaseNode[] = [
      {
        id: "stateful_worker",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Legacy Worker",
          isStateful: true,
          localDiskSession: true,
          declaredCapacityRps: 200,
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "stateful_worker", target: "stateful_worker", data: {} },
    ];

    const scenario = {
      ...DEFAULT_WORKLOAD_SCENARIOS.normal_traffic,
      parameters: {
        ...DEFAULT_WORKLOAD_SCENARIOS.normal_traffic.parameters,
        ingressRps: 1500,
      },
    };

    const report = new ScalabilityRecommendationsEngine().evaluateGraph(nodes, edges, scenario);
    const rec = report.recommendations.find((r) => r.strategy === "horizontal-scaling");
    if (rec) {
      expect(rec.feasibility).toBe("conditional");
      expect(rec.feasibilityReasoning).toContain("session or disk state");
    }
  });

  it("recommends distributed caching for read-heavy databases under contention", () => {
    const nodes: BaseNode[] = [
      {
        id: "client",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { componentType: "web-browser" },
      },
      {
        id: "db_primary",
        type: "infrastructure",
        position: { x: 300, y: 0 },
        data: {
          componentType: "relational-database",
          label: "Product Catalog DB",
          declaredCapacityRps: 400,
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "db_primary", data: { protocol: "postgres" } },
    ];

    const readHeavyScenario = {
      ...DEFAULT_WORKLOAD_SCENARIOS.normal_traffic,
      parameters: {
        ...DEFAULT_WORKLOAD_SCENARIOS.normal_traffic.parameters,
        ingressRps: 1200,
        readRatio: 0.90, // 90% reads
      },
    };

    const report = new ScalabilityRecommendationsEngine().evaluateGraph(nodes, edges, readHeavyScenario);
    const cacheRec = report.recommendations.find(
      (r) => r.strategy === "caching" && r.affectedNodeIds.includes("db_primary")
    );

    expect(cacheRec).toBeDefined();
    expect(cacheRec?.benefits.length).toBeGreaterThan(0);
    expect(cacheRec?.tradeoffs.consistencyImplications).toContain("eventual consistency");

    // Verify proposed operations add cache node and edge
    expect(cacheRec?.proposedOperations.some((op) => op.type === "add_node")).toBe(true);
    expect(cacheRec?.proposedOperations.some((op) => op.type === "add_edge")).toBe(true);
  });

  it("recommends read replicas for single primary database with high read ratio", () => {
    const nodes: BaseNode[] = [
      {
        id: "app",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { componentType: "compute-instance" },
      },
      {
        id: "db",
        type: "infrastructure",
        position: { x: 300, y: 0 },
        data: {
          componentType: "relational-database",
          label: "Core Postgres",
          readReplicas: 0,
          declaredCapacityRps: 300,
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "app", target: "db", data: { protocol: "postgres" } },
    ];

    const scenario = {
      ...DEFAULT_WORKLOAD_SCENARIOS.normal_traffic,
      parameters: {
        ...DEFAULT_WORKLOAD_SCENARIOS.normal_traffic.parameters,
        readRatio: 0.85,
        ingressRps: 800,
      },
    };

    const report = new ScalabilityRecommendationsEngine().evaluateGraph(nodes, edges, scenario);
    const readRepRec = report.recommendations.find(
      (r) => r.strategy === "read-replication" && r.affectedNodeIds.includes("db")
    );

    expect(readRepRec).toBeDefined();
    expect(readRepRec?.proposedOperations).toHaveLength(1);
    expect(readRepRec?.proposedOperations[0].type).toBe("update_node_config");
  });

  it("creates non-destructive What-If plans and computes scenario comparisons", () => {
    const nodes: BaseNode[] = [
      {
        id: "client",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { componentType: "web-browser" },
      },
      {
        id: "api_svc",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "container-service",
          label: "API Service",
          replicas: 1,
          declaredCapacityRps: 500,
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "client", target: "api_svc", data: { protocol: "https" } },
    ];

    const report = new ScalabilityRecommendationsEngine().evaluateGraph(
      nodes,
      edges,
      DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
    );

    const rec = report.recommendations[0];
    expect(rec).toBeDefined();

    // Generate What-If Plan
    const { plan, proposedNodes, proposedEdges } = WhatIfEngine.createPlan(
      nodes,
      edges,
      rec,
      DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
    );

    expect(plan).toBeDefined();
    expect(plan.recommendationId).toBe(rec.id);
    expect(plan.isValidated).toBe(true);
    expect(proposedEdges.length).toBeGreaterThanOrEqual(edges.length);

    // Verify original nodes were NOT mutated
    expect(nodes[1].data.replicas).toBe(1);

    // Verify proposed nodes reflect the change
    if (rec.proposedOperations[0].type === "adjust_instances") {
      const proposedService = proposedNodes.find((n) => n.id === "api_svc");
      expect(proposedService?.data.replicas).toBeGreaterThan(1);
    }

    expect(plan.comparison.capacityGainRatio).toBeGreaterThanOrEqual(1.0);
  });
});
