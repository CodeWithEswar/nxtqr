import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GraphIndex } from "../../core/graph-index";
import { TrafficResolver, type NodeTrafficDemand } from "../../bottlenecks/engine/traffic-resolver";
import type { WorkloadScenario } from "../../bottlenecks/contracts/bottleneck.types";
import type {
  CapacityForecastScenario,
  ProjectedIntervalDemand,
} from "../contracts/capacity.types";
import { GrowthModelEvaluator } from "../models/growth-models";

export interface IntervalTrafficSnapshot {
  intervalIndex: number;
  intervalLabel: string;
  projectedIngressRps: number;
  effectivePeakRps: number;
  nodeDemands: Map<string, NodeTrafficDemand>;
}

export class DemandForecaster {
  /**
   * Projects and propagates workload demand across all topology nodes
   * for each forecast interval from t = 0 (Now) to t = horizon.
   */
  public static forecastDemandTrajectory(
    nodes: BaseNode[],
    edges: BaseEdge[],
    index: GraphIndex,
    scenario: CapacityForecastScenario,
    baseScenario: WorkloadScenario
  ): {
    projectedDemandSeries: ProjectedIntervalDemand[];
    intervalSnapshots: IntervalTrafficSnapshot[];
  } {
    // 1. Calculate projected ingress demand series using selected growth model
    const baseIngressRps = baseScenario.parameters.ingressRps;
    const peakMultiplier = baseScenario.parameters.peakMultiplier;

    const projectedDemandSeries = GrowthModelEvaluator.projectDemand(
      baseIngressRps,
      peakMultiplier,
      scenario.horizonIntervals,
      scenario.intervalUnit,
      scenario.growthParams
    );

    // 2. Propagate traffic across graph for each interval
    const intervalSnapshots: IntervalTrafficSnapshot[] = [];

    for (const point of projectedDemandSeries) {
      // Create cloned scenario for this interval with projected ingress
      const intervalScenario: WorkloadScenario = {
        ...baseScenario,
        parameters: {
          ...baseScenario.parameters,
          ingressRps: point.projectedIngressRps,
          peakMultiplier,
        },
      };

      const nodeDemands = TrafficResolver.resolveTraffic(nodes, edges, index, intervalScenario);

      intervalSnapshots.push({
        intervalIndex: point.intervalIndex,
        intervalLabel: point.intervalLabel,
        projectedIngressRps: point.projectedIngressRps,
        effectivePeakRps: point.effectivePeakRps,
        nodeDemands,
      });
    }

    return {
      projectedDemandSeries,
      intervalSnapshots,
    };
  }
}
