import type {
  ServiceHealthIndicator,
  ServiceHealthState,
  MetricSeries,
} from "../contracts/observability.types";

export class ServiceHealthEvaluator {
  /**
   * Transparently evaluates service health based on actual observed metrics and data freshness.
   * STRICT RULE: Absence of data produces "unknown", NEVER "healthy"!
   */
  public static evaluateHealth(params: {
    componentId: string;
    serviceName: string;
    seriesList: MetricSeries[];
    freshnessWindowMs?: number;
  }): ServiceHealthIndicator {
    const { componentId, serviceName, seriesList, freshnessWindowMs = 900_000 } = params; // 15 mins default freshness

    if (seriesList.length === 0) {
      return {
        componentId,
        serviceName,
        state: "unknown",
        freshnessStatus: "missing",
        metrics: {},
        reasons: ["No telemetry metrics available from monitoring source. Service health is unknown."],
      };
    }

    // Extract latest metrics
    let latestTs = 0;
    let rps: number | undefined;
    let errorRatePct: number | undefined;
    let p50LatencyMs: number | undefined;
    let p95LatencyMs: number | undefined;
    let p99LatencyMs: number | undefined;
    let cpuSaturationPct: number | undefined;
    let memorySaturationPct: number | undefined;

    for (const s of seriesList) {
      const dps = s.datapoints;
      if (dps.length === 0) continue;
      const last = dps[dps.length - 1];
      if (last.timestampMs > latestTs) latestTs = last.timestampMs;

      const name = s.metricName.toLowerCase();
      if (name.includes("requests_per_second") || name.includes("rps") || s.unit === "rps") {
        rps = last.value;
      } else if (name.includes("error_rate") || name.includes("errors")) {
        errorRatePct = last.value;
      } else if (name.includes("p50") || s.labels.quantile === "0.5" || s.labels.quantile === "0.50") {
        p50LatencyMs = last.value;
      } else if (name.includes("p95") || s.labels.quantile === "0.95") {
        p95LatencyMs = last.value;
      } else if (name.includes("p99") || s.labels.quantile === "0.99") {
        p99LatencyMs = last.value;
      } else if (name.includes("cpu")) {
        cpuSaturationPct = last.value;
      } else if (name.includes("memory") || name.includes("mem")) {
        memorySaturationPct = last.value;
      }
    }

    const reasons: string[] = [];
    const now = Date.now();
    const isStale = latestTs > 0 && now - latestTs > freshnessWindowMs;
    const freshnessStatus: "fresh" | "stale" | "missing" = isStale
      ? "stale"
      : latestTs > 0
      ? "fresh"
      : "missing";

    if (isStale) {
      reasons.push(
        `Telemetry stream is stale (last sample received ${Math.round((now - latestTs) / 60000)} minutes ago).`
      );
      return {
        componentId,
        serviceName,
        state: "unknown",
        freshnessStatus,
        latestSampleTimestampMs: latestTs,
        metrics: { rps, errorRatePct, p50LatencyMs, p95LatencyMs, p99LatencyMs, cpuSaturationPct, memorySaturationPct },
        reasons,
      };
    }

    let state: ServiceHealthState = "healthy";

    // 1. Critical evaluations
    if (errorRatePct !== undefined && errorRatePct >= 5.0) {
      state = "critical";
      reasons.push(`High error rate: ${errorRatePct.toFixed(2)}% (threshold: >= 5.0%)`);
    }
    if (p95LatencyMs !== undefined && p95LatencyMs >= 2000) {
      state = "critical";
      reasons.push(`P95 Latency breached critical SLA: ${p95LatencyMs}ms (threshold: >= 2,000ms)`);
    }
    if (cpuSaturationPct !== undefined && cpuSaturationPct >= 95) {
      state = "critical";
      reasons.push(`CPU core saturation near exhaustion: ${cpuSaturationPct}% (threshold: >= 95%)`);
    }

    // 2. Degraded evaluations (if not already critical)
    if (state !== "critical") {
      if (errorRatePct !== undefined && errorRatePct >= 1.0) {
        state = "degraded";
        reasons.push(`Elevated error rate: ${errorRatePct.toFixed(2)}% (threshold: >= 1.0%)`);
      }
      if (p95LatencyMs !== undefined && p95LatencyMs >= 500) {
        state = "degraded";
        reasons.push(`P95 Latency degraded: ${p95LatencyMs}ms (threshold: >= 500ms)`);
      }
      if (cpuSaturationPct !== undefined && cpuSaturationPct >= 80) {
        state = "degraded";
        reasons.push(`Elevated CPU saturation: ${cpuSaturationPct}% (threshold: >= 80%)`);
      }
    }

    if (reasons.length === 0) {
      reasons.push("All observed metrics operating within healthy SLO baselines.");
    }

    return {
      componentId,
      serviceName,
      state,
      freshnessStatus,
      latestSampleTimestampMs: latestTs,
      metrics: {
        rps,
        errorRatePct,
        p50LatencyMs,
        p95LatencyMs,
        p99LatencyMs,
        cpuSaturationPct,
        memorySaturationPct,
      },
      reasons,
    };
  }
}
