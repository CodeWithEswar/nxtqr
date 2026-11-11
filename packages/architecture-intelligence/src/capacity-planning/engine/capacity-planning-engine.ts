import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GraphIndex } from "../../core/graph-index";
import type { WorkloadScenario } from "../../bottlenecks/contracts/bottleneck.types";
import { DEFAULT_WORKLOAD_SCENARIOS } from "../../bottlenecks/scenarios/scenario-registry";
import type {
  CapacityForecastScenario,
  CapacityPlanningReport,
  ScenarioComparisonPoint,
} from "../contracts/capacity.types";
import { DemandForecaster } from "./demand-forecaster";
import { HeadroomAnalyzer } from "./headroom-analyzer";
import type { UnifiedRecommendation } from "../../recommendations/contracts/recommendations.types";

export class CapacityPlanningEngine {
  private cache = new Map<string, CapacityPlanningReport>();

  /**
   * Generates a comprehensive capacity plan and workload forecast report
   * for the given architecture graph and forecast growth scenario.
   */
  public planCapacity(
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenario: CapacityForecastScenario,
    baseScenario: WorkloadScenario = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
  ): CapacityPlanningReport {
    const revisionHash = this.computeRevisionHash(nodes, edges, scenario, baseScenario);
    if (this.cache.has(revisionHash)) {
      return this.cache.get(revisionHash)!;
    }

    const index = new GraphIndex(nodes, edges);

    // 1. Forecast demand across all intervals
    const { intervalSnapshots } = DemandForecaster.forecastDemandTrajectory(
      nodes,
      edges,
      index,
      scenario,
      baseScenario
    );

    // 2. Analyze headroom and saturation milestones
    const headroomResult = HeadroomAnalyzer.analyzeHeadroomAndSaturation(
      nodes,
      scenario,
      baseScenario,
      intervalSnapshots
    );

    // 3. Synthesize capacity recommendations
    const recommendations: UnifiedRecommendation[] = [];
    for (const [nodeId, evalItem] of Object.entries(headroomResult.componentEvaluations)) {
      if (evalItem.saturatesAtInterval !== undefined && evalItem.recommendedInstancesCount) {
        const node = nodes.find((n) => n.id === nodeId);
        const label = node?.label || nodeId;

        if (evalItem.category === "compute") {
          recommendations.push({
            id: `REC-CAP-SCALE-${nodeId}`,
            strategyId: "horizontal-scaling",
            title: `Scale ${label} Instances (${evalItem.instancesCount} → ${evalItem.recommendedInstancesCount})`,
            summary: `Projected demand reaches saturation by ${evalItem.saturatesAtLabel}. Increase instance count to ${evalItem.recommendedInstancesCount} to maintain 15% headroom under peak traffic.`,
            sourceFindingIds: [`CAP-${nodeId}-${evalItem.saturatesAtInterval}`],
            sourceEngines: ["scalability"],
            affectedNodeIds: [nodeId],
            affectedEdgeIds: [],
            evidence: [],
            assumptions: [`Scaling efficiency estimated at ${Math.round((evalItem.scalingEfficiency || 0.85) * 100)}%`],
            prerequisites: ["Stateless request handling or shared session cache"],
            dependsOn: [],
            benefits: ["Eliminates compute bottleneck through forecast horizon"],
            tradeoffs: ["Linear increase in instance infrastructure costs"],
            tradeoffDetails: {
              reliability: "neutral",
              performance: "positive",
              scalability: "positive",
              security: "neutral",
              dataConsistency: "neutral",
              operationalComplexity: "low",
              costDirection: "increase",
              reversibility: "high",
              tradeoffNotes: ["Linear increase in instance infrastructure costs"],
            },
            conflictsWith: [],
            feasibility: "applicable",
            confidence: "high",
            priority: evalItem.saturatesAtInterval <= 2 ? "critical" : "high",
            score: evalItem.saturatesAtInterval <= 2 ? 95 : 80,
            proposedOperations: [
              {
                type: "adjust_instances",
                nodeId,
                newReplicas: evalItem.recommendedInstancesCount,
              },
            ],
            lifecycleState: "new",
          });
        } else if (evalItem.category === "database") {
          recommendations.push({
            id: `REC-CAP-DB-${nodeId}`,
            strategyId: "caching",
            title: `Introduce Cache Layer in front of ${label}`,
            summary: `Primary storage approaches saturation by ${evalItem.saturatesAtLabel}. Deploy a distributed Redis cache tier to offload repetitive read volume.`,
            sourceFindingIds: [`CAP-${nodeId}-${evalItem.saturatesAtInterval}`],
            sourceEngines: ["scalability"],
            affectedNodeIds: [nodeId],
            affectedEdgeIds: [],
            evidence: [],
            assumptions: ["Read workload exhibits high temporal locality"],
            prerequisites: ["Cache invalidation policy defined"],
            dependsOn: [],
            benefits: ["Offloads up to 80% read queries from primary storage"],
            tradeoffs: ["Eventual consistency window during cache refresh"],
            tradeoffDetails: {
              reliability: "neutral",
              performance: "positive",
              scalability: "positive",
              security: "neutral",
              dataConsistency: "negative",
              operationalComplexity: "medium",
              costDirection: "increase",
              reversibility: "high",
              tradeoffNotes: ["Eventual consistency window during cache refresh"],
            },
            conflictsWith: [],
            feasibility: "applicable",
            confidence: "high",
            priority: "high",
            score: 88,
            proposedOperations: [
              {
                type: "add_node",
                node: {
                  id: `cache_${nodeId}`,
                  type: "redis-cache",
                  position: { x: (node?.position.x || 100) - 50, y: (node?.position.y || 100) - 50 },
                  label: `Cache for ${label}`,
                  data: {
                    tier: "cache",
                    cacheStrategy: "cache-aside",
                    replicas: 2,
                  },
                },
              },
            ],
            lifecycleState: "new",
          });
        }
      }
    }

    const report: CapacityPlanningReport = {
      id: `cap_report_${Date.now()}`,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      analyzedAt: new Date().toISOString(),
      graphRevision: scenario.graphRevision,
      horizonIntervals: scenario.horizonIntervals,
      intervalUnit: scenario.intervalUnit,
      growthModel: scenario.growthModel,
      baselineWorkload: baseScenario,
      timeSeries: headroomResult.timeSeries,
      componentEvaluations: headroomResult.componentEvaluations,
      categorySummaries: headroomResult.categorySummaries,
      findings: headroomResult.findings,
      recommendations,
      summary: headroomResult.summary,
    };

    // Cache management (bounded LRU to 20 reports)
    if (this.cache.size > 20) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(revisionHash, report);

    return report;
  }

  /**
   * Compares multiple capacity forecast growth scenarios side-by-side.
   */
  public compareScenarios(
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenarios: CapacityForecastScenario[],
    baseScenario: WorkloadScenario = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
  ): ScenarioComparisonPoint[] {
    return scenarios.map((scen) => {
      const report = this.planCapacity(nodes, edges, scen, baseScenario);
      const lastPoint = report.timeSeries[report.timeSeries.length - 1];

      return {
        scenarioId: scen.id,
        scenarioName: scen.name,
        finalDemandRps: lastPoint?.effectivePeakRps || 0,
        earliestSaturationLabel: report.summary.earliestSaturationLabel || "Sufficient Headroom",
        saturatedComponentsCount: report.findings.length,
        totalRecommendedInstances: report.summary.recommendedInstanceAdditions,
      };
    });
  }

  private computeRevisionHash(
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenario: CapacityForecastScenario,
    baseScenario: WorkloadScenario
  ): string {
    const nodeState = nodes.map((n) => `${n.id}:${n.data?.replicas || 1}:${n.data?.capacityRps || ""}`).join(";");
    const raw = `${nodes.length}_${edges.length}_${scenario.id}_${scenario.growthModel}_${scenario.horizonIntervals}_${baseScenario.parameters.ingressRps}_${scenario.graphRevision}_${nodeState}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `cap_${Math.abs(hash).toString(36)}`;
  }
}

export const capacityPlanningEngine = new CapacityPlanningEngine();
