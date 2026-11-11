import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  IncidentImpactAnalyzer,
  incidentScenarioRegistry,
  type CriticalJourney,
  type OperationalAsset,
} from "../operations";

describe("Phase 05.3.27: Incident Impact & Blast Radius Analyzer", () => {
  const nodes: BaseNode[] = [
    { id: "api-gateway", type: "custom", position: { x: 0, y: 0 }, data: { label: "API Gateway", nodeType: "gateway" } },
    { id: "auth-svc", type: "custom", position: { x: 100, y: 0 }, data: { label: "Auth Service", nodeType: "service" } },
    { id: "order-svc", type: "custom", position: { x: 200, y: 0 }, data: { label: "Order Service", nodeType: "service" } },
    { id: "payment-svc", type: "custom", position: { x: 300, y: 0 }, data: { label: "Payment Service", nodeType: "service" } },
    { id: "primary-db", type: "custom", position: { x: 400, y: 0 }, data: { label: "Primary DB", nodeType: "database" } },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "api-gateway", target: "auth-svc", type: "smoothstep", data: {} },
    { id: "e2", source: "api-gateway", target: "order-svc", type: "smoothstep", data: {} },
    { id: "e3", source: "order-svc", target: "payment-svc", type: "smoothstep", data: {} },
    { id: "e4", source: "order-svc", target: "primary-db", type: "smoothstep", data: {} },
    { id: "e5", source: "payment-svc", target: "primary-db", type: "smoothstep", data: {} },
  ];

  const journeys: CriticalJourney[] = [
    {
      id: "journey-checkout",
      title: "Checkout Flow",
      description: "Customer checkout journey",
      entryPointComponentId: "api-gateway",
      traversedComponentIds: ["api-gateway", "order-svc", "payment-svc", "primary-db"],
      recoveryPriority: 1,
      maxAllowedDowntimeSeconds: 120,
    },
    {
      id: "journey-login",
      title: "User Login",
      description: "User authentication journey",
      entryPointComponentId: "api-gateway",
      traversedComponentIds: ["api-gateway", "auth-svc"],
      recoveryPriority: 2,
      maxAllowedDowntimeSeconds: 300,
    },
  ];

  const assets: OperationalAsset[] = [
    { id: "a1", componentId: "api-gateway", name: "Gateway", tier: "tier_1_mission_critical", environment: "prod", region: "us-east-1", ownerId: "team-infra" },
    { id: "a2", componentId: "primary-db", name: "DB", tier: "tier_1_mission_critical", environment: "prod", region: "us-east-1", ownerId: "team-data" },
  ];

  it("propagates failure to upstream callers when primary database crashes", () => {
    const scenario = incidentScenarioRegistry.getScenario("SCN-DB-FAILOVER-001")!;
    expect(scenario).toBeDefined();

    const impact = IncidentImpactAnalyzer.analyzeScenarioImpact(
      scenario,
      nodes,
      edges,
      journeys,
      assets
    );

    expect(impact.directFailedComponentIds).toContain("primary-db");
    // Callers depending on primary-db should be propagated
    expect(impact.propagatedComponentIds).toContain("order-svc");
    expect(impact.propagatedComponentIds).toContain("payment-svc");
    expect(impact.isCriticalJourneyDisrupted).toBe(true);
    expect(impact.impactedJourneyIds).toContain("journey-checkout");
    expect(impact.blastRadiusScore).toBeGreaterThanOrEqual(50);
  });

  it("propagates failure downstream when API gateway crashes", () => {
    const scenario = incidentScenarioRegistry.getScenario("SCN-GW-INGRESS-002")!;
    expect(scenario).toBeDefined();

    const impact = IncidentImpactAnalyzer.analyzeScenarioImpact(
      scenario,
      nodes,
      edges,
      journeys,
      assets
    );

    expect(impact.directFailedComponentIds).toContain("api-gateway");
    expect(impact.impactedJourneyIds).toContain("journey-checkout");
    expect(impact.impactedJourneyIds).toContain("journey-login");
    expect(impact.blastRadiusScore).toBeGreaterThanOrEqual(60);
  });

  it("computes accurate propagation path with causal explanations", () => {
    const scenario = incidentScenarioRegistry.getScenario("SCN-DB-FAILOVER-001")!;
    const impact = IncidentImpactAnalyzer.analyzeScenarioImpact(
      scenario,
      nodes,
      edges,
      journeys,
      assets
    );

    expect(impact.propagationPath.length).toBeGreaterThan(0);
    const dbCallerPath = impact.propagationPath.find((p) => p.fromComponentId === "primary-db");
    expect(dbCallerPath).toBeDefined();
    expect(dbCallerPath?.reason).toContain("depends on failed dependency");
  });
});
