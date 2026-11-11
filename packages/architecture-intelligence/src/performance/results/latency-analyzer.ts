export interface PercentileResult {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  mean: number;
}

export class LatencyAnalyzer {
  /**
   * Computes accurate latency percentiles from raw response time samples (in milliseconds).
   * Strictly avoids percentile averaging.
   */
  public static calculatePercentilesFromSamples(samples: number[]): PercentileResult {
    if (!samples || samples.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, mean: 0 };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const n = sorted.length;

    const getQuantile = (q: number): number => {
      if (q <= 0) return sorted[0];
      if (q >= 1) return sorted[n - 1];
      const index = q * (n - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) return sorted[lower];
      const weight = index - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    return {
      p50: Number(getQuantile(0.5).toFixed(2)),
      p90: Number(getQuantile(0.9).toFixed(2)),
      p95: Number(getQuantile(0.95).toFixed(2)),
      p99: Number(getQuantile(0.99).toFixed(2)),
      min: Number(sorted[0].toFixed(2)),
      max: Number(sorted[n - 1].toFixed(2)),
      mean: Number(mean.toFixed(2)),
    };
  }

  /**
   * Computes quantile from cumulative histogram buckets (e.g. Prometheus / OTel / JMeter histogram).
   */
  public static calculatePercentileFromHistogram(
    buckets: Array<{ le: number; count: number }>,
    quantile: number
  ): number {
    if (!buckets || buckets.length === 0) return 0;
    const sorted = [...buckets].sort((a, b) => a.le - b.le);
    const totalCount = sorted[sorted.length - 1].count;
    if (totalCount === 0) return 0;

    const rank = quantile * totalCount;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].count >= rank) {
        const prevCount = i > 0 ? sorted[i - 1].count : 0;
        const prevBound = i > 0 ? sorted[i - 1].le : 0;
        const bucketWidth = sorted[i].le - prevBound;
        const countInBucket = sorted[i].count - prevCount;

        if (countInBucket === 0) return prevBound;
        const fraction = (rank - prevCount) / countInBucket;
        return Number((prevBound + fraction * bucketWidth).toFixed(2));
      }
    }

    return sorted[sorted.length - 1].le;
  }
}
