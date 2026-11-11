import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureCostEngine,
  CostScenarioComparator,
  DecimalMoney,
} from "@nxtqr/architecture-intelligence";

describe("Web Feature - Cost Estimation Integration", () => {
  const nodes: BaseNode[] = [
    {
      id: "alb_ingress",
      type: "loadBalancer",
      position: { x: 50, y: 150 },
      data: { label: "Ingress ALB", pricingSku: "ingress.alb", replicas: 1 },
    },
    {
      id: "web_service",
      type: "service",
      position: { x: 280, y: 150 },
      data: { label: "Web Service", pricingSku: "compute.t3.medium", replicas: 4 },
    },
    {
      id: "postgres_db",
      type: "database",
      position: { x: 520, y: 150 },
      data: { label: "RDS PostgreSQL", pricingSku: "database.db.r6g.large", storageGb: 200, replicas: 1 },
    },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "alb_ingress", target: "web_service", data: {} },
    { id: "e2", source: "web_service", target: "postgres_db", data: {} },
  ];

  it("calculates web feature baseline estimate cleanly", () => {
    const estimate = architectureCostEngine.estimateCost(nodes, edges, { providerId: "aws" });

    expect(estimate.status).toBe("complete");
    expect(DecimalMoney.compare(estimate.totalMonthlyCost, "0.00")).toBe(1);
    expect(estimate.categorySummaries.compute.monthlyCost).toBeDefined();
    expect(estimate.categorySummaries.database.monthlyCost).toBeDefined();
    expect(estimate.categorySummaries.network.monthlyCost).toBeDefined();
  });

  it("evaluates simulated What-If node overrides and reports accurate delta", () => {
    const baseline = architectureCostEngine.estimateCost(nodes, edges, { providerId: "aws" });

    // What-If: Scale web_service from 4 replicas to 2 replicas
    const candidateNodes = nodes.map((n) =>
      n.id === "web_service"
        ? { ...n, data: { ...(n.data || {}), replicas: 2 } }
        : n
    );

    const candidate = architectureCostEngine.estimateCost(candidateNodes, edges, { providerId: "aws" });
    const comparison = CostScenarioComparator.compare(baseline, candidate);

    expect(DecimalMoney.compare(comparison.netMonthlySavings, "0.00")).toBe(1);
    expect(comparison.modifiedLineItems.length).toBeGreaterThan(0);
    expect(comparison.modifiedLineItems[0].nodeId).toBe("web_service");
  });
});

