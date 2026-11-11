import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { architectureCostEngine } from "../cost/engine/cost-engine";
import { CostScenarioComparator } from "../cost/engine/scenario-comparator";
import { CostForecaster } from "../cost/engine/cost-forecaster";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import { DEFAULT_CAPACITY_SCENARIOS } from "../capacity-planning/scenarios/capacity-scenarios";
import { DecimalMoney } from "../cost/pricing/decimal-money";

describe("Cost Intelligence - Integration & Scenarios", () => {
  const baselineNodes: BaseNode[] = [
    {
      id: "alb-ingress",
      type: "loadBalancer",
      position: { x: 0, y: 0 },
      data: { label: "Application Load Balancer", pricingSku: "ingress.alb" },
    },
    {
      id: "api-service",
      type: "service",
      position: { x: 100, y: 0 },
      data: { label: "API Service", replicas: 4, pricingSku: "compute.t3.medium" },
    },
    {
      id: "primary-db",
      type: "database",
      position: { x: 200, y: 0 },
      data: { label: "PostgreSQL Database", pricingSku: "db.rds.postgres.r6g.xlarge", storageGb: 200 },
    },
  ];

  const candidateNodes: BaseNode[] = [
    {
      id: "alb-ingress",
      type: "loadBalancer",
      position: { x: 0, y: 0 },
      data: { label: "Application Load Balancer", pricingSku: "ingress.alb" },
    },
    {
      id: "api-service",
      type: "service",
      position: { x: 100, y: 0 },
      data: { label: "API Service", replicas: 2, pricingSku: "compute.c6g.large" }, // Rightsized + ARM Graviton
    },
    {
      id: "redis-cache",
      type: "cache",
      position: { x: 150, y: -50 },
      data: { label: "Redis Cluster", pricingSku: "cache.redis.t3.medium" }, // Added Cache
    },
    {
      id: "primary-db",
      type: "database",
      position: { x: 200, y: 0 },
      data: { label: "PostgreSQL Database", pricingSku: "db.rds.postgres.t3.medium", storageGb: 200 }, // Scaled down DB due to cache
    },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "alb-ingress", target: "api-service", data: {} },
    { id: "e2", source: "api-service", target: "primary-db", data: {} },
  ];

  it("evaluates side-by-side cost delta comparison between baseline and candidate architectures", () => {
    const baselineEst = architectureCostEngine.estimateCost(baselineNodes, edges, { providerId: "aws" });
    const candidateEst = architectureCostEngine.estimateCost(candidateNodes, edges, { providerId: "aws" });

    const diff = CostScenarioComparator.compare(baselineEst, candidateEst);

    // Baseline has r6g.xlarge DB (~$360) + 4x t3.medium ($121) + ALB ($22)
    // Candidate has t3.medium DB (~$50) + Redis ($50) + 2x c6g.large ($99) + ALB ($22)
    // Candidate should yield substantial net savings!
    expect(DecimalMoney.compare(diff.netMonthlySavings, "0.00")).toBe(1);
    expect(diff.percentageDifference).toBeLessThan(0); // Candidate is cheaper

    // Added Redis cache
    expect(diff.addedLineItems.some((item) => item.category === "cache")).toBe(true);

    // Modified DB compute
    expect(diff.modifiedLineItems.some((mod) => mod.nodeId === "primary-db")).toBe(true);
  });

  it("projects future cost trajectories across capacity planning growth models", () => {
    const baselineEst = architectureCostEngine.estimateCost(baselineNodes, edges, { providerId: "aws" });
    const growthScenario = DEFAULT_CAPACITY_SCENARIOS.linear_enterprise_scaling;

    const forecast = CostForecaster.forecast(baselineNodes, baselineEst, growthScenario);

    expect(forecast.length).toBe((growthScenario.horizonIntervals || 12) + 1);
    expect(forecast[0].intervalLabel).toBe("Now");

    // As traffic grows, cost should increase monotonically in moderate growth
    const firstMonthCost = Number(forecast[0].totalMonthlyCost);
    const lastMonthCost = Number(forecast[forecast.length - 1].totalMonthlyCost);
    expect(lastMonthCost).toBeGreaterThan(firstMonthCost);
  });

  it("supports multi-cloud pricing comparison (AWS vs GCP vs Cloudflare)", () => {
    const microserviceNode: BaseNode[] = [
      {
        id: "worker-node",
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: "Worker Fleet", replicas: 4, pricingSku: "compute.t3.medium" },
      },
    ];

    const awsEst = architectureCostEngine.estimateCost(microserviceNode, [], { providerId: "aws" });
    const gcpEst = architectureCostEngine.estimateCost(microserviceNode, [], { providerId: "gcp" });

    expect(awsEst.currency).toBe("USD");
    expect(gcpEst.currency).toBe("USD");
    expect(DecimalMoney.compare(awsEst.totalMonthlyCost, "0.00")).toBe(1);
  });

  it("executes get_cost_estimate tool through AI Assistant ArchitectureToolRegistry", async () => {
    const tool = architectureToolRegistry.getTool("get_cost_estimate");
    expect(tool).toBeDefined();

    const execResult = await architectureToolRegistry.executeTool(
      "get_cost_estimate",
      { providerId: "aws" },
      {
        projectId: "test_project",
        architectureId: "test-ai-arch",
        graphRevision: "rev_1",
        nodes: baselineNodes,
        edges,
      }
    );

    expect(execResult.success).toBe(true);
    const result = execResult.result as {
      totalMonthlyCost: string;
      status: string;
      categorySummaries: Record<string, unknown>;
      topOptimizations: Array<{ title: string; savings: string }>;
    };

    expect(result.status).toBe("complete");
    expect(DecimalMoney.compare(result.totalMonthlyCost, "0.00")).toBe(1);
    expect(result.topOptimizations.length).toBeGreaterThan(0);
  });
});
