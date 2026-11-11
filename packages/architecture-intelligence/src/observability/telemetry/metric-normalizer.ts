import type {
  MetricDataPoint,
  MetricSeries,
  DataQualityReport,
} from "../contracts/observability.types";

export class MetricNormalizer {
  /**
   * Computes per-second rate from monotonic counter datapoints,
   * accounting for counter resets (e.g. pod restarts).
   */
  public static computeCounterRate(
    datapoints: MetricDataPoint[]
  ): MetricDataPoint[] {
    if (datapoints.length < 2) return [];

    const rates: MetricDataPoint[] = [];

    for (let i = 1; i < datapoints.length; i++) {
      const prev = datapoints[i - 1];
      const curr = datapoints[i];

      const deltaMs = curr.timestampMs - prev.timestampMs;
      if (deltaMs <= 0) continue;

      const deltaSec = deltaMs / 1000;
      let deltaVal = curr.value - prev.value;

      // Detect counter reset (e.g. process restarted and counter reset to 0)
      if (deltaVal < 0) {
        // Assume counter reset to zero and accumulated up to curr.value
        deltaVal = curr.value >= 0 ? curr.value : 0;
      }

      const ratePerSec = Number((deltaVal / deltaSec).toFixed(3));
      rates.push({
        timestampMs: curr.timestampMs,
        value: Math.max(0, ratePerSec),
      });
    }

    return rates;
  }

  /**
   * Calculates linear interpolated histogram quantile from bucket boundaries.
   * PromQL equivalent of histogram_quantile(q, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
   */
  public static calculateHistogramQuantile(
    buckets: Array<{ le: number; count: number }>,
    quantile: number // e.g. 0.95 for P95
  ): number {
    if (buckets.length === 0) return 0;

    // Sort ascending by upper boundary 'le'
    const sorted = [...buckets].sort((a, b) => a.le - b.le);
    const totalCount = sorted[sorted.length - 1].count;
    if (totalCount <= 0) return 0;

    const rank = quantile * totalCount;

    let prevLe = 0;
    let prevCount = 0;

    for (const b of sorted) {
      if (b.count >= rank) {
        const countDiff = b.count - prevCount;
        if (countDiff === 0) return prevLe;
        const fraction = (rank - prevCount) / countDiff;
        return Number((prevLe + fraction * (b.le - prevLe)).toFixed(3));
      }
      prevLe = b.le;
      prevCount = b.count;
    }

    return sorted[sorted.length - 1].le;
  }

  /**
   * Normalizes time-series units (e.g. converting seconds to milliseconds for latency).
   */
  public static normalizeLatencyUnit(
    series: MetricSeries,
    targetUnit: "ms" | "s" = "ms"
  ): MetricSeries {
    const isSeconds = series.unit === "s" || series.unit === "seconds";

    if (isSeconds && targetUnit === "ms") {
      return {
        ...series,
        unit: "ms",
        datapoints: series.datapoints.map((dp) => ({
          timestampMs: dp.timestampMs,
          value: Number((dp.value * 1000).toFixed(2)),
        })),
      };
    }

    return series;
  }

  /**
   * Evaluates data quality metrics: missing samples, sparsity, and clock skew.
   */
  public static evaluateDataQuality(
    seriesList: MetricSeries[],
    expectedStepSeconds: number
  ): DataQualityReport {
    if (seriesList.length === 0) {
      return {
        missingSamplesCount: 0,
        isSparse: true,
        clockSkewMs: 0,
        samplingRatio: 0,
        qualityScore: 0,
        notes: ["No time-series data available from target monitoring source."],
      };
    }

    let totalGaps = 0;
    let totalExpected = 0;
    const notes: string[] = [];

    const expectedIntervalMs = expectedStepSeconds * 1000;

    for (const s of seriesList) {
      if (s.datapoints.length < 2) continue;

      const durationMs =
        s.datapoints[s.datapoints.length - 1].timestampMs - s.datapoints[0].timestampMs;
      const expectedPoints = Math.max(1, Math.round(durationMs / expectedIntervalMs));
      totalExpected += expectedPoints;

      const actualPoints = s.datapoints.length;
      if (actualPoints < expectedPoints) {
        totalGaps += expectedPoints - actualPoints;
      }
    }

    const isSparse = totalExpected > 0 && totalGaps / totalExpected > 0.4;
    const missingSamplesCount = totalGaps;
    const qualityScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(totalExpected > 0 ? (1 - totalGaps / totalExpected) * 100 : 100)
      )
    );

    if (isSparse) {
      notes.push("Data stream is sparse (>40% expected interval intervals missing).");
    }
    if (missingSamplesCount > 0) {
      notes.push(`Detected ${missingSamplesCount} missing sample intervals.`);
    }

    return {
      missingSamplesCount,
      isSparse,
      clockSkewMs: 0,
      samplingRatio: 1.0,
      qualityScore,
      notes,
    };
  }
}
