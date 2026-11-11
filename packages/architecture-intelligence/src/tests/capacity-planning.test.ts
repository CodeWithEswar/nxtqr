import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GrowthModelEvaluator } from "../capacity-planning/models/growth-models";
import { ResourceEvaluator } from "../capacity-planning/models/resource-evaluators";
import { CapacityPlanningEngine } from "../capacity-planning/engine/capacity-planning-engine";
import { DEFAULT_CAPACITY_SCENARIOS } from "../capacity-planning/scenarios/capacity-scenarios";
import { CapacityForecastScenarioSchema } from "../capacity-planning/schemas/capacity.schemas";

describe("Capacity Planning - Growth Models & Resource Evaluators", () => {
  describe("GrowthModelEvaluator", () => {
    it("evaluates constant demand correctly", () => {
      const series = GrowthModelEvaluator.projectDemand(100, 1.0, 5, "month", { kind: "constant" });
      expect(series.length).toBe(6);
      expect(series[0].projectedIngressRps).toBe(100);
      expect(series[5].projectedIngressRps).toBe(100);
    });

    it("evaluates linear growth correctly", () => {
      const series = GrowthModelEvaluator.projectDemand(100, 1.0, 3, "month", {
        kind: "linear",
        params: { growthPerIntervalRps: 10 },
      });
      expect(series[0].projectedIngressRps).toBe(100);
      expect(series[3].projectedIngressRps).toBe(130); // 100 + 10 * 3 = 130
    });

    it("evaluates compound exponential growth correctly", () => {
      const series = GrowthModelEvaluator.projectDemand(100, 1.0, 2, "month", {
        kind: "compound",
        params: { growthRatePercentPerInterval: 10 },
      });
      expect(series[0].projectedIngressRps).toBe(100);
      expect(series[2].projectedIngressRps).toBe(121); // 100 * (1.1)^2 = 121
    });

    it("evaluates step growth correctly", () => {
      const series = GrowthModelEvaluator.projectDemand(100, 1.0, 5, "month", {
        kind: "step",
        params: {
          milestones: [
            { intervalIndex: 0, demandRps: 100 },
            { intervalIndex: 3, demandRps: 250 },
          ],
        },
      });
      expect(series[2].projectedIngressRps).toBe(100);
      expect(series[3].projectedIngressRps).toBe(250);
      expect(series[5].projectedIngressRps).toBe(250);
    });

    it("evaluates seasonal growth cycle correctly", () => {
      const series = GrowthModelEvaluator.projectDemand(1000, 1.0, 12, "month", {
        kind: "seasonal",
        params: { baseGrowthRatePercent: 0, amplitudePercent: 30, periodIntervals: 12 },
      });
      expect(series[0].projectedIngressRps).toBeCloseTo(1000, 0);
      // sin(2*pi * 3/12) = sin(pi/2) = 1.0 => 1000 * 1.30 = 1300
      expect(series[3].projectedIngressRps).toBeCloseTo(1300, 0);
    });

    it("interpolates custom trajectory points correctly", () => {
      const series = GrowthModelEvaluator.projectDemand(500, 1.0, 12, "month", {
        kind: "custom",
        params: {
          points: [
            { intervalIndex: 0, demandRps: 500 },
            { intervalIndex: 6, demandRps: 1500 },
            { intervalIndex: 12, demandRps: 2500 },
          ],
        },
      });
      expect(series[0].projectedIngressRps).toBe(500);
      expect(series[3].projectedIngressRps).toBe(1000); // interpolated halfway between 500 and 1500
      expect(series[6].projectedIngressRps).toBe(1500);
      expect(series[12].projectedIngressRps).toBe(2500);
    });
  });

  describe("ResourceEvaluator - Non-linear Scaling & Amdahl's Law", () => {
    it("calculates realistic compute scaling with efficiency penalty", () => {
      const node: BaseNode = {
        id: "web_api",
        type: "compute-service",
        position: { x: 0, y: 0 },
        label: "Web API",
        data: { replicas: 2, capacityRps: 500 },
      };

      const sizing = ResourceEvaluator.evaluateComputeSizing(node, 1200, 250);
      expect(sizing.recommendedInstancesCount).toBeGreaterThanOrEqual(5);
      expect(sizing.scalingEfficiency).toBeLessThan(1.0);
      expect(sizing.notes).toContain("scaling efficiency");
    });

    it("differentiates database write saturation from read scalability", () => {
      const dbNode: BaseNode = {
        id: "primary_pg",
        type: "relational-database",
        position: { x: 0, y: 0 },
        label: "Primary PostgreSQL",
        data: { replicas: 1, maxWriteRps: 200, maxReadRps: 1000 },
      };

      // Reads high (2500 RPS), writes within limit (150 RPS)
      const readHeavy = ResourceEvaluator.evaluateDatabaseSizing(dbNode, 2500, 150);
      expect(readHeavy.recommendedInstancesCount).toBeGreaterThanOrEqual(3);
      expect(readHeavy.notes).toContain("Database read capacity");

      // Writes exceed primary limit (350 RPS) -> flags critical write ceiling
      const writeHeavy = ResourceEvaluator.evaluateDatabaseSizing(dbNode, 500, 350);
      expect(writeHeavy.notes).toContain("[CRITICAL] Primary write demand");
    });

    it("sizes queue and worker consumers to prevent backlog build-up", () => {
      const queueNode: BaseNode = {
        id: "task_queue",
        type: "message-queue",
        position: { x: 0, y: 0 },
        label: "Task Queue",
        data: { replicas: 2, processingTimeMs: 50 }, // 1 worker = 20 msg/sec
      };

      // Influx of 150 msg/s with 50ms processing time requires ~8 workers (each handles 20 msg/s)
      const sizing = ResourceEvaluator.evaluateQueueWorkerSizing(queueNode, 150, 50);
      expect(sizing.recommendedInstancesCount).toBeGreaterThanOrEqual(8);
      expect(sizing.notes).toContain("workers");
    });

    it("calculates network bandwidth consumption accurately", () => {
      // 1000 RPS * (2048 + 8192 bytes) = 10.24 MB/s = 81.9 Mbps
      const bw = ResourceEvaluator.calculateBandwidthDemand(1000, 2048, 8192);
      expect(bw).toBeCloseTo(81.9, 1);
    });
  });

  describe("CapacityPlanningEngine - End-to-End Analysis", () => {
    const engine = new CapacityPlanningEngine();

    const nodes: BaseNode[] = [
      {
        id: "gateway",
        type: "api-gateway",
        position: { x: 0, y: 0 },
        label: "API Gateway",
        data: { replicas: 2, capacityRps: 400 },
      },
      {
        id: "order_svc",
        type: "compute-service",
        position: { x: 200, y: 0 },
        label: "Order Service",
        data: { replicas: 2, capacityRps: 300 },
      },
      {
        id: "order_db",
        type: "relational-database",
        position: { x: 400, y: 0 },
        label: "Order DB",
        data: { replicas: 1, capacityRps: 250, readRatio: 0.8 },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "gateway", target: "order_svc", data: { protocol: "https" } },
      { id: "e2", source: "order_svc", target: "order_db", data: { protocol: "tcp" } },
    ];

    it("produces deterministic capacity forecast report", () => {
      const scenario = DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth;
      const report = engine.planCapacity(nodes, edges, scenario);

      expect(report).toBeDefined();
      expect(report.scenarioId).toBe(scenario.id);
      expect(report.timeSeries.length).toBe(scenario.horizonIntervals + 1);
      expect(report.timeSeries[0].intervalIndex).toBe(0);
      expect(report.timeSeries[scenario.horizonIntervals].intervalIndex).toBe(scenario.horizonIntervals);

      // Verify component evaluations exist
      expect(report.componentEvaluations["gateway"]).toBeDefined();
      expect(report.componentEvaluations["order_svc"]).toBeDefined();
      expect(report.componentEvaluations["order_db"]).toBeDefined();

      // Verify category summaries
      expect(report.categorySummaries["network"]).toBeDefined();
      expect(report.categorySummaries["compute"]).toBeDefined();
      expect(report.categorySummaries["database"]).toBeDefined();

      // Check recommendations were synthesized
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations[0].sourceEngines).toContain("scalability");
    });

    it("detects saturation milestones when demand exceeds capacity", () => {
      // High growth scenario: 25% compound growth over 6 months
      const highGrowthScenario = CapacityForecastScenarioSchema.parse({
        id: "extreme_growth",
        name: "Extreme Growth",
        description: "25% month-over-month growth",
        baseWorkloadScenarioId: "normal_traffic",
        growthModel: "compound",
        growthParams: {
          kind: "compound",
          params: {
            growthRatePercentPerInterval: 25,
          },
        },
        horizonIntervals: 6,
        intervalUnit: "month",
        warningUtilizationThreshold: 0.7,
        criticalUtilizationThreshold: 0.85,
        graphRevision: "rev_001",
      });

      const report = engine.planCapacity(nodes, edges, highGrowthScenario);
      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.findings[0].forecastIntervalIndex).toBeLessThanOrEqual(6);
    });

    it("validates zero-growth / steady state scenario retains headroom", () => {
      const steadyScenario = DEFAULT_CAPACITY_SCENARIOS.steady_state;
      const report = engine.planCapacity(nodes, edges, steadyScenario);

      // Under steady state, projected demand should remain constant across intervals
      const firstDemand = report.timeSeries[0].projectedIngressRps;
      const lastDemand = report.timeSeries[report.timeSeries.length - 1].projectedIngressRps;
      expect(firstDemand).toBe(lastDemand);
    });
  });
});
