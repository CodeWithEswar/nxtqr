import type {
  GrowthModelParams,
  ProjectedIntervalDemand,
  ForecastIntervalUnit,
} from "../contracts/capacity.types";

export class GrowthModelEvaluator {
  /**
   * Evaluates projected demand across all intervals from t = 0 to t = horizon.
   */
  public static projectDemand(
    baseIngressRps: number,
    peakMultiplier: number,
    horizonIntervals: number,
    intervalUnit: ForecastIntervalUnit,
    growthParams: GrowthModelParams
  ): ProjectedIntervalDemand[] {
    const series: ProjectedIntervalDemand[] = [];
    const baseRps = Math.max(0, baseIngressRps);
    const peak = Math.max(1, peakMultiplier);

    for (let t = 0; t <= horizonIntervals; t++) {
      let intervalDemandRps = baseRps;

      switch (growthParams.kind) {
        case "constant":
          intervalDemandRps = baseRps;
          break;

        case "linear":
          intervalDemandRps = baseRps + growthParams.params.growthPerIntervalRps * t;
          break;

        case "compound": {
          const rate = growthParams.params.growthRatePercentPerInterval / 100;
          intervalDemandRps = baseRps * Math.pow(1 + rate, t);
          break;
        }

        case "step": {
          // Find the latest milestone <= t
          const milestones = [...growthParams.params.milestones].sort((a, b) => a.intervalIndex - b.intervalIndex);
          let currentMilestoneDemand = baseRps;
          for (const m of milestones) {
            if (t >= m.intervalIndex) {
              currentMilestoneDemand = m.demandRps;
            } else {
              break;
            }
          }
          intervalDemandRps = currentMilestoneDemand;
          break;
        }

        case "seasonal": {
          const baseRate = growthParams.params.baseGrowthRatePercent / 100;
          const trendDemand = baseRps * (1 + baseRate * (t / Math.max(1, growthParams.params.periodIntervals)));
          const seasonalFactor =
            1 + (growthParams.params.amplitudePercent / 100) * Math.sin((2 * Math.PI * t) / growthParams.params.periodIntervals);
          intervalDemandRps = trendDemand * seasonalFactor;
          break;
        }

        case "custom": {
          const point = growthParams.params.points.find((p) => p.intervalIndex === t);
          if (point) {
            intervalDemandRps = point.demandRps;
          } else {
            // Find closest prior and next points to interpolate
            const sorted = [...growthParams.params.points].sort((a, b) => a.intervalIndex - b.intervalIndex);
            const prev = sorted.filter((p) => p.intervalIndex < t).pop();
            const next = sorted.find((p) => p.intervalIndex > t);

            if (prev && next) {
              const fraction = (t - prev.intervalIndex) / (next.intervalIndex - prev.intervalIndex);
              intervalDemandRps = prev.demandRps + fraction * (next.demandRps - prev.demandRps);
            } else if (prev) {
              intervalDemandRps = prev.demandRps;
            } else if (next) {
              intervalDemandRps = next.demandRps;
            } else {
              intervalDemandRps = baseRps;
            }
          }
          break;
        }
      }

      // Bound results to valid finite non-negative numbers
      const sanitizedDemand = Math.max(0, isFinite(intervalDemandRps) ? Math.round(intervalDemandRps) : baseRps);
      const effectivePeak = Math.round(sanitizedDemand * peak);

      const labelPrefix = intervalUnit === "month" ? "M" : intervalUnit === "week" ? "W" : "D";
      const intervalLabel = t === 0 ? "Now" : `${labelPrefix}${t}`;

      series.push({
        intervalIndex: t,
        intervalLabel,
        projectedIngressRps: sanitizedDemand,
        effectivePeakRps: effectivePeak,
      });
    }

    return series;
  }
}
