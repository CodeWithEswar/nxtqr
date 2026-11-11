import type { BaseNode } from "@nxtqr/graph-schema";
import type { CostForecastIntervalPoint, CostEstimate } from "../contracts/cost.types";
import type { CapacityForecastScenario } from "../../capacity-planning/contracts/capacity.types";
import { GrowthModelEvaluator } from "../../capacity-planning/models/growth-models";
import { DecimalMoney } from "../pricing/decimal-money";

export class CostForecaster {
  /**
   * Projects future cost trajectories over a multi-interval planning horizon
   * by correlating workload demand growth with variable and scaling infrastructure costs.
   */
  public static forecast(
    _nodes: BaseNode[],
    baselineEstimate: CostEstimate,
    scenario: CapacityForecastScenario
  ): CostForecastIntervalPoint[] {
    const horizon = scenario.horizonIntervals || 12;
    const baseRps = 1000; // Baseline ingress RPS
    const peakMult = scenario.criticalUtilizationThreshold ? 1.2 : 1.0;

    // 1. Evaluate demand trajectory points via GrowthModelEvaluator
    const demandSeries = GrowthModelEvaluator.projectDemand(
      baseRps,
      peakMult,
      horizon,
      scenario.intervalUnit || "month",
      scenario.growthParams
    );

    const baseComputeCost = baselineEstimate.categorySummaries.compute?.monthlyCost || "0.00";
    const baseDbCost = baselineEstimate.categorySummaries.database?.monthlyCost || "0.00";
    const baseCacheCost = baselineEstimate.categorySummaries.cache?.monthlyCost || "0.00";
    const baseNetworkCost = baselineEstimate.categorySummaries.network?.monthlyCost || "0.00";
    const baseOtherCost = DecimalMoney.subtract(
      baselineEstimate.totalMonthlyCost,
      DecimalMoney.add(
        DecimalMoney.add(baseComputeCost, baseDbCost),
        DecimalMoney.add(baseCacheCost, baseNetworkCost)
      )
    );

    const points: CostForecastIntervalPoint[] = [];

    demandSeries.forEach((demandPoint) => {
      const growthRatio = demandPoint.projectedIngressRps / Math.max(1, baseRps);

      // Compute scaling: sub-linear scaling overhead (Amdahl factor ^ 0.85)
      const computeMultiplier = Math.pow(growthRatio, 1 / 0.85);
      const intervalCompute = DecimalMoney.multiply(baseComputeCost, computeMultiplier);

      // Database scaling: reads offload, storage grows slightly
      const dbMultiplier = 1 + (growthRatio - 1) * 0.35;
      const intervalDb = DecimalMoney.multiply(baseDbCost, Math.max(1, dbMultiplier));

      // Cache scaling: memory grows with active working set
      const cacheMultiplier = 1 + (growthRatio - 1) * 0.25;
      const intervalCache = DecimalMoney.multiply(baseCacheCost, Math.max(1, cacheMultiplier));

      // Network egress: linearly proportional to traffic
      const intervalNetwork = DecimalMoney.multiply(baseNetworkCost, growthRatio);

      // Other fixed costs stay relatively steady
      const intervalOther = baseOtherCost;

      // Sum interval total
      const subtotal = DecimalMoney.add(
        DecimalMoney.add(intervalCompute, intervalDb),
        DecimalMoney.add(intervalCache, intervalNetwork)
      );
      const intervalTotal = DecimalMoney.add(subtotal, intervalOther);

      points.push({
        intervalIndex: demandPoint.intervalIndex,
        intervalLabel: demandPoint.intervalLabel,
        projectedIngressRps: demandPoint.projectedIngressRps,
        totalMonthlyCost: intervalTotal,
        computeCost: intervalCompute,
        databaseCost: intervalDb,
        cacheCost: intervalCache,
        networkCost: intervalNetwork,
        otherCost: intervalOther,
      });
    });

    return points;
  }
}

