import type {
  BenchmarkComparisonResult,
  BenchmarkRun,
  PerformanceRegression,
} from "../contracts/performance.types";

export class PerformanceRegressionDetector {
  public static compareRuns(
    baseline: BenchmarkRun,
    candidate: BenchmarkRun
  ): BenchmarkComparisonResult {
    const regressions: PerformanceRegression[] = [];

    const baseSum = baseline.overallSummary;
    const candSum = candidate.overallSummary;

    // 1. Latency P95 check
    if (baseSum.p95LatencyMs > 0 && candSum.p95LatencyMs > 0) {
      const delta = candSum.p95LatencyMs - baseSum.p95LatencyMs;
      const pctChange = (delta / baseSum.p95LatencyMs) * 100;

      if (pctChange > 10 || delta > 40) {
        const severity = pctChange > 50 ? "critical" : pctChange > 25 ? "high" : "medium";
        regressions.push({
          metric: "p95_latency",
          baselineRunId: baseline.id,
          candidateRunId: candidate.id,
          baselineValue: baseSum.p95LatencyMs,
          candidateValue: candSum.p95LatencyMs,
          delta: Number(delta.toFixed(2)),
          percentChange: Number(pctChange.toFixed(1)),
          severity,
          explanation: `P95 latency regressed by +${delta.toFixed(1)}ms (+${pctChange.toFixed(1)}%) from ${baseSum.p95LatencyMs}ms to ${candSum.p95LatencyMs}ms.`,
        });
      }
    }

    // 2. Latency P99 check
    if (baseSum.p99LatencyMs > 0 && candSum.p99LatencyMs > 0) {
      const delta = candSum.p99LatencyMs - baseSum.p99LatencyMs;
      const pctChange = (delta / baseSum.p99LatencyMs) * 100;

      if (pctChange > 15 || delta > 80) {
        const severity = pctChange > 60 ? "critical" : "high";
        regressions.push({
          metric: "p99_latency",
          baselineRunId: baseline.id,
          candidateRunId: candidate.id,
          baselineValue: baseSum.p99LatencyMs,
          candidateValue: candSum.p99LatencyMs,
          delta: Number(delta.toFixed(2)),
          percentChange: Number(pctChange.toFixed(1)),
          severity,
          explanation: `Tail P99 latency degraded by +${delta.toFixed(1)}ms (+${pctChange.toFixed(1)}%) from ${baseSum.p99LatencyMs}ms to ${candSum.p99LatencyMs}ms.`,
        });
      }
    }

    // 3. Throughput Achieved RPS check
    if (baseSum.achievedRps > 0 && candSum.achievedRps > 0) {
      const delta = candSum.achievedRps - baseSum.achievedRps;
      const pctChange = (delta / baseSum.achievedRps) * 100;

      if (pctChange < -5) {
        const severity = pctChange < -25 ? "critical" : pctChange < -12 ? "high" : "medium";
        regressions.push({
          metric: "throughput_rps",
          baselineRunId: baseline.id,
          candidateRunId: candidate.id,
          baselineValue: baseSum.achievedRps,
          candidateValue: candSum.achievedRps,
          delta: Number(delta.toFixed(2)),
          percentChange: Number(pctChange.toFixed(1)),
          severity,
          explanation: `Achieved throughput dropped by ${Math.abs(delta).toFixed(1)} RPS (${pctChange.toFixed(1)}%) from ${baseSum.achievedRps} RPS to ${candSum.achievedRps} RPS.`,
        });
      }
    }

    // 4. Error Rate check
    const errorDelta = candSum.errorRatePct - baseSum.errorRatePct;
    if (errorDelta > 0.5) {
      const severity = candSum.errorRatePct > 5 ? "critical" : errorDelta > 2 ? "high" : "medium";
      regressions.push({
        metric: "error_rate_pct",
        baselineRunId: baseline.id,
        candidateRunId: candidate.id,
        baselineValue: baseSum.errorRatePct,
        candidateValue: candSum.errorRatePct,
        delta: Number(errorDelta.toFixed(2)),
        percentChange: baseSum.errorRatePct > 0 ? Number(((errorDelta / baseSum.errorRatePct) * 100).toFixed(1)) : 100,
        severity,
        explanation: `Error rate increased from ${baseSum.errorRatePct.toFixed(2)}% to ${candSum.errorRatePct.toFixed(2)}% (+${errorDelta.toFixed(2)}%).`,
      });
    }

    // Build human-readable summary
    let summary: string;
    const recommendations: string[] = [];

    if (regressions.length === 0) {
      summary = `Candidate run (#${candidate.runNumber}) performance is comparable or superior to baseline (#${baseline.runNumber}) with 0 detected regressions.`;
      recommendations.push("Performance qualification passed. Candidate architecture revision is ready for promotion.");
    } else {
      const critCount = regressions.filter((r) => r.severity === "critical").length;
      summary = `Candidate run (#${candidate.runNumber}) introduced ${regressions.length} performance regression(s) relative to baseline (#${baseline.runNumber}) including ${critCount} critical regression(s).`;

      if (regressions.some((r) => r.metric === "p95_latency" || r.metric === "p99_latency")) {
        recommendations.push("Investigate downstream database queries or lock contention for candidate revision.");
      }
      if (regressions.some((r) => r.metric === "throughput_rps")) {
        recommendations.push("Verify worker thread pool and connection pool sizing between deployment revisions.");
      }
      if (regressions.some((r) => r.metric === "error_rate_pct")) {
        recommendations.push("Inspect application logs for HTTP 5xx errors or socket exhaustion under load.");
      }
    }

    return {
      baselineRun: baseline,
      candidateRun: candidate,
      regressions,
      bottleneckValidations: [],
      calibrationProposals: [],
      summary,
      recommendations,
    };
  }
}
