import type { BaseNode } from "@nxtqr/graph-schema";
import { CapacityResolver } from "../../bottlenecks/engine/capacity-resolver";
import type { WorkloadScenario, UtilizationStatus } from "../../bottlenecks/contracts/bottleneck.types";
import type {
  CapacityForecastScenario,
  ComponentCapacityEvaluation,
  ResourceCategory,
  ResourceCategorySummary,
  CapacityPlanningFinding,
  ForecastTimePointSeries,
} from "../contracts/capacity.types";
import type { IntervalTrafficSnapshot } from "./demand-forecaster";
import { ResourceEvaluator } from "../models/resource-evaluators";

export interface HeadroomAnalysisResult {
  componentEvaluations: Record<string, ComponentCapacityEvaluation>;
  categorySummaries: Record<ResourceCategory, ResourceCategorySummary>;
  timeSeries: ForecastTimePointSeries[];
  findings: CapacityPlanningFinding[];
  summary: {
    totalComponentsEvaluated: number;
    earliestSaturationNodeId?: string;
    earliestSaturationLabel?: string;
    componentsExceedingCapacityCount: number;
    componentsNearSaturationCount: number;
    sufficientHeadroomCount: number;
    unknownCapacityCount: number;
    recommendedInstanceAdditions: number;
  };
}

export class HeadroomAnalyzer {
  /**
   * Computes headroom, utilization trajectories, and saturation milestones
   * across all components and intervals.
   */
  public static analyzeHeadroomAndSaturation(
    nodes: BaseNode[],
    scenario: CapacityForecastScenario,
    baseScenario: WorkloadScenario,
    intervalSnapshots: IntervalTrafficSnapshot[]
  ): HeadroomAnalysisResult {
    const componentEvaluations: Record<string, ComponentCapacityEvaluation> = {};
    const findings: CapacityPlanningFinding[] = [];

    const warningThreshold = scenario.warningUtilizationThreshold || 0.7;
    const criticalThreshold = scenario.criticalUtilizationThreshold || 0.85;

    let earliestSaturationInterval: number | undefined;
    let earliestSaturationNodeId: string | undefined;
    let totalRecommendedInstancesAdditions = 0;

    // 1. Evaluate each component's capacity and demand trajectory
    for (const node of nodes) {
      const category = ResourceEvaluator.categorizeComponent(node);
      const resolvedCap = CapacityResolver.resolveNodeCapacity(node, baseScenario);
      const declaredCapacity = resolvedCap.capacityRps || resolvedCap.capacityOps || resolvedCap.capacityMsgPerSec;
      const isUnknownCapacity = declaredCapacity === undefined || declaredCapacity <= 0;

      const instancesCount = Math.max(1, Number(node.data?.replicas || 1));
      let recommendedInstancesCount: number | undefined;

      // Extract demand at Now (t = 0) and at Horizon (t = H)
      const nowSnapshot = intervalSnapshots[0];
      const horizonSnapshot = intervalSnapshots[intervalSnapshots.length - 1];

      const currentDemand = nowSnapshot ? nowSnapshot.nodeDemands.get(node.id)?.totalRps || 0 : 0;
      const horizonDemand = horizonSnapshot ? horizonSnapshot.nodeDemands.get(node.id)?.totalRps || 0 : 0;
      const horizonReadDemand = horizonSnapshot ? horizonSnapshot.nodeDemands.get(node.id)?.readRps || 0 : 0;
      const horizonWriteDemand = horizonSnapshot ? horizonSnapshot.nodeDemands.get(node.id)?.writeRps || 0 : 0;

      // Current utilization
      let currentUtilizationRatio: number | undefined;
      let status: UtilizationStatus = "unknown";

      if (!isUnknownCapacity && declaredCapacity > 0) {
        currentUtilizationRatio = Math.round((currentDemand / declaredCapacity) * 100) / 100;
        status = CapacityResolver.getUtilizationStatus(currentUtilizationRatio);
      }

      // Track saturation point across intervals
      let saturatesAtInterval: number | undefined;
      let saturatesAtLabel: string | undefined;

      if (!isUnknownCapacity && declaredCapacity > 0) {
        for (const snap of intervalSnapshots) {
          const demand = snap.nodeDemands.get(node.id)?.totalRps || 0;
          const ratio = demand / declaredCapacity;

          if (ratio >= criticalThreshold) {
            saturatesAtInterval = snap.intervalIndex;
            saturatesAtLabel = snap.intervalLabel;

            if (earliestSaturationInterval === undefined || snap.intervalIndex < earliestSaturationInterval) {
              earliestSaturationInterval = snap.intervalIndex;
              earliestSaturationNodeId = node.id;
            }
            break;
          }
        }
      }

      // Horizon metrics
      let headroomAtHorizonRps: number | undefined;
      let utilizationAtHorizonRatio: number | undefined;

      if (!isUnknownCapacity && declaredCapacity > 0) {
        headroomAtHorizonRps = Math.round(declaredCapacity - horizonDemand);
        utilizationAtHorizonRatio = Math.round((horizonDemand / declaredCapacity) * 100) / 100;
      }

      // Evaluate sizing recommendations
      let sizingNotes = "";
      if (category === "compute") {
        const sizing = ResourceEvaluator.evaluateComputeSizing(node, horizonDemand, resolvedCap.capacityRps);
        recommendedInstancesCount = sizing.recommendedInstancesCount;
        sizingNotes = sizing.notes;
        if (recommendedInstancesCount && recommendedInstancesCount > instancesCount) {
          totalRecommendedInstancesAdditions += (recommendedInstancesCount - instancesCount);
        }
      } else if (category === "database") {
        const sizing = ResourceEvaluator.evaluateDatabaseSizing(node, horizonReadDemand, horizonWriteDemand);
        recommendedInstancesCount = sizing.recommendedInstancesCount;
        sizingNotes = sizing.notes;
      } else if (category === "messaging") {
        const sizing = ResourceEvaluator.evaluateQueueWorkerSizing(node, horizonDemand, resolvedCap.processingTimeMs);
        recommendedInstancesCount = sizing.recommendedInstancesCount;
        sizingNotes = sizing.notes;
      }

      componentEvaluations[node.id] = {
        nodeId: node.id,
        category,
        declaredCapacityRps: declaredCapacity,
        declaredCapacityUnit: "req/s",
        currentDemandRps: Math.round(currentDemand),
        currentUtilizationRatio,
        status,
        processingTimeMs: resolvedCap.processingTimeMs,
        scalingEfficiency: category === "compute" ? 0.85 : 0.9,
        instancesCount,
        recommendedInstancesCount,
        saturatesAtInterval,
        saturatesAtLabel: saturatesAtLabel || (isUnknownCapacity ? "Unknown" : "Sufficient Headroom"),
        headroomAtHorizonRps,
        utilizationAtHorizonRatio,
        isUnknownCapacity,
        notes: sizingNotes,
      };

      // Generate finding if component saturates during forecast
      if (saturatesAtInterval !== undefined && saturatesAtLabel) {
        findings.push({
          id: `CAP-${node.id}-${saturatesAtInterval}`,
          ruleId: category === "database" ? "CAP-DB-SAT" : category === "messaging" ? "CAP-QUEUE-SAT" : "CAP-COMP-SAT",
          resourceCategory: category,
          severity: saturatesAtInterval <= 1 ? "critical" : "high",
          title: `Projected Saturation: ${node.label || node.id}`,
          explanation: `Projected demand reaches ${Math.round(horizonDemand)} RPS by ${saturatesAtLabel}, exhausting declared capacity (${declaredCapacity} RPS).`,
          affectedNodeId: node.id,
          forecastIntervalIndex: saturatesAtInterval,
          forecastIntervalLabel: saturatesAtLabel,
          projectedDemandRps: Math.round(horizonDemand),
          declaredCapacityRps: declaredCapacity,
          headroomRps: headroomAtHorizonRps,
          utilizationRatio: utilizationAtHorizonRatio,
          recommendationIds: [`REC-${node.id}-SCALE`],
        });
      }
    }

    // 2. Aggregate Resource Category Summaries
    const allCategories: ResourceCategory[] = [
      "compute",
      "database",
      "cache",
      "messaging",
      "storage",
      "network",
      "external_api",
    ];

    const categorySummaries: Record<ResourceCategory, ResourceCategorySummary> = {} as any;

    for (const cat of allCategories) {
      const catEvals = Object.values(componentEvaluations).filter((c) => c.category === cat);
      const total = catEvals.length;
      const saturated = catEvals.filter((c) => c.saturatesAtInterval !== undefined).length;
      const warning = catEvals.filter((c) => c.currentUtilizationRatio && c.currentUtilizationRatio >= warningThreshold).length;
      const unknown = catEvals.filter((c) => c.isUnknownCapacity).length;
      const optimal = total - saturated - unknown;

      const ratios = catEvals.map((c) => c.currentUtilizationRatio).filter((r): r is number => r !== undefined);
      const avgUtil = ratios.length > 0 ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100) / 100 : undefined;

      const sortedEarliest = catEvals
        .filter((c) => c.saturatesAtInterval !== undefined)
        .sort((a, b) => (a.saturatesAtInterval || 999) - (b.saturatesAtInterval || 999));

      categorySummaries[cat] = {
        category: cat,
        totalComponents: total,
        saturatedCount: saturated,
        warningCount: warning,
        optimalCount: Math.max(0, optimal),
        unknownCount: unknown,
        averageUtilizationRatio: avgUtil,
        earliestSaturationLabel: sortedEarliest[0]?.saturatesAtLabel,
      };
    }

    // 3. Assemble Forecast Time Series for charts
    const timeSeries: ForecastTimePointSeries[] = [];

    for (const snap of intervalSnapshots) {
      let maxUtil = 0;
      let worstNodeId: string | undefined;
      let saturationCount = 0;
      let totalCapacity = 0;

      for (const node of nodes) {
        const evalItem = componentEvaluations[node.id];
        if (evalItem && evalItem.declaredCapacityRps) {
          totalCapacity += evalItem.declaredCapacityRps;
          const demand = snap.nodeDemands.get(node.id)?.totalRps || 0;
          const ratio = demand / evalItem.declaredCapacityRps;

          if (ratio > maxUtil) {
            maxUtil = ratio;
            worstNodeId = node.id;
          }

          if (ratio >= criticalThreshold) {
            saturationCount++;
          }
        }
      }

      timeSeries.push({
        intervalIndex: snap.intervalIndex,
        intervalLabel: snap.intervalLabel,
        projectedIngressRps: snap.projectedIngressRps,
        effectivePeakRps: snap.effectivePeakRps,
        totalCapacityRps: Math.round(totalCapacity),
        bottleneckNodeId: worstNodeId,
        maxUtilizationRatio: Math.round(maxUtil * 100) / 100,
        activeSaturationCount: saturationCount,
      });
    }

    const exceedingCount = Object.values(componentEvaluations).filter((c) => c.status === "exceeding_capacity").length;
    const nearSatCount = Object.values(componentEvaluations).filter((c) => c.status === "near_saturation").length;
    const unknownCount = Object.values(componentEvaluations).filter((c) => c.isUnknownCapacity).length;
    const sufficientCount = Object.values(componentEvaluations).filter((c) => c.saturatesAtInterval === undefined && !c.isUnknownCapacity).length;

    const earliestLabel = earliestSaturationInterval !== undefined
      ? (scenario.intervalUnit === "month" ? `Month ${earliestSaturationInterval}` : `Interval ${earliestSaturationInterval}`)
      : undefined;

    return {
      componentEvaluations,
      categorySummaries,
      timeSeries,
      findings,
      summary: {
        totalComponentsEvaluated: nodes.length,
        earliestSaturationNodeId,
        earliestSaturationLabel: earliestLabel,
        componentsExceedingCapacityCount: exceedingCount,
        componentsNearSaturationCount: nearSatCount,
        sufficientHeadroomCount: sufficientCount,
        unknownCapacityCount: unknownCount,
        recommendedInstanceAdditions: totalRecommendedInstancesAdditions,
      },
    };
  }
}
