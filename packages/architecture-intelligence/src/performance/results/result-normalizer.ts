import type {
  BenchmarkDataQuality,
  BenchmarkEnvironment,
  BenchmarkMetricSummary,
  BenchmarkRun,
  OperationMetricSummary,
  PerformanceTarget,
  PerformanceTargetEvaluation,
  WorkloadProfile,
} from "../contracts/performance.types";

export class ResultNormalizer {
  /**
   * Evaluates targets against run summary
   */
  public static evaluateTargets(
    targets: PerformanceTarget[],
    summary: BenchmarkMetricSummary
  ): PerformanceTargetEvaluation[] {
    return targets.map((target) => {
      let measuredValue: number | undefined;

      switch (target.metric) {
        case "p50_latency":
          measuredValue = summary.p50LatencyMs;
          break;
        case "p90_latency":
          measuredValue = summary.p90LatencyMs;
          break;
        case "p95_latency":
          measuredValue = summary.p95LatencyMs;
          break;
        case "p99_latency":
          measuredValue = summary.p99LatencyMs;
          break;
        case "max_latency":
          measuredValue = summary.maxLatencyMs;
          break;
        case "mean_latency":
          measuredValue = summary.meanLatencyMs;
          break;
        case "throughput_rps":
          measuredValue = summary.achievedRps;
          break;
        case "error_rate_pct":
          measuredValue = summary.errorRatePct;
          break;
        case "dropped_iterations_pct":
          measuredValue = summary.droppedIterationsPct;
          break;
        default:
          measuredValue = undefined;
      }

      if (measuredValue === undefined) {
        return {
          targetId: target.id,
          targetName: target.name,
          metric: target.metric,
          category: "unknown",
          operator: target.operator,
          thresholdValue: target.thresholdValue,
          status: "unknown",
          reason: `Metric ${target.metric} could not be determined from run results.`,
        };
      }

      let isPassed = false;
      let isWarn = false;

      switch (target.operator) {
        case "lt":
          isPassed = measuredValue < target.thresholdValue;
          if (!isPassed && target.warningThresholdValue !== undefined) {
            isWarn = measuredValue < target.warningThresholdValue;
          }
          break;
        case "lte":
          isPassed = measuredValue <= target.thresholdValue;
          if (!isPassed && target.warningThresholdValue !== undefined) {
            isWarn = measuredValue <= target.warningThresholdValue;
          }
          break;
        case "gt":
          isPassed = measuredValue > target.thresholdValue;
          if (!isPassed && target.warningThresholdValue !== undefined) {
            isWarn = measuredValue > target.warningThresholdValue;
          }
          break;
        case "gte":
          isPassed = measuredValue >= target.thresholdValue;
          if (!isPassed && target.warningThresholdValue !== undefined) {
            isWarn = measuredValue >= target.warningThresholdValue;
          }
          break;
        case "eq":
          isPassed = Math.abs(measuredValue - target.thresholdValue) < 0.001;
          break;
      }

      let status: "passed" | "warn" | "failed" = isPassed
        ? "passed"
        : isWarn
        ? "warn"
        : "failed";

      const reason = isPassed
        ? `Measured ${measuredValue} ${target.unit} meets target (${target.operator} ${target.thresholdValue} ${target.unit}).`
        : isWarn
        ? `Measured ${measuredValue} ${target.unit} breaches primary threshold (${target.thresholdValue} ${target.unit}) but is within warning tolerance.`
        : `Measured ${measuredValue} ${target.unit} failed threshold (${target.operator} ${target.thresholdValue} ${target.unit}).`;

      return {
        targetId: target.id,
        targetName: target.name,
        metric: target.metric,
        category: "measured",
        operator: target.operator,
        thresholdValue: target.thresholdValue,
        measuredValue,
        status,
        reason,
      };
    });
  }

  /**
   * Evaluates data quality and identifies test anomalies
   */
  public static evaluateDataQuality(summary: BenchmarkMetricSummary): BenchmarkDataQuality {
    let score = 100;
    const notes: string[] = [];

    let hasWarmupBias = false;
    let missingSampleRatio = 0;
    let sparsityWarning = false;

    // Check sample volume
    if (summary.totalRequests < 50) {
      score -= 35;
      sparsityWarning = true;
      notes.push("Low sample volume (< 50 requests): Percentile estimates have high variance.");
    } else if (summary.totalRequests < 200) {
      score -= 15;
      notes.push("Moderate sample volume (< 200 requests): P99 latency precision is constrained.");
    }

    // Check duration
    if (summary.durationSeconds < 10) {
      score -= 20;
      notes.push("Short test duration (< 10s): System may not have reached steady-state.");
    }

    // Check error rate
    if (summary.errorRatePct > 50) {
      score -= 25;
      notes.push(`Excessive error rate (${summary.errorRatePct.toFixed(1)}%): Latency distribution may be skewed by early connection dropouts.`);
    }

    // Check P99 vs P50 skew
    if (summary.p50LatencyMs > 0 && summary.p99LatencyMs / summary.p50LatencyMs > 15) {
      hasWarmupBias = true;
      score -= 10;
      notes.push("Extreme tail latency skew (P99 > 15x P50): Potential cold-start, garbage collection pause, or unprimed cache bias.");
    }

    // Check dropped iterations
    if (summary.droppedIterationsPct > 5) {
      score -= 15;
      notes.push(`Dropped iterations detected (${summary.droppedIterationsPct.toFixed(1)}%): Test generator or target system saturated.`);
    }

    score = Math.max(0, Math.min(100, score));
    const status: "high" | "acceptable" | "poor" | "unusable" =
      score >= 85 ? "high" : score >= 65 ? "acceptable" : score >= 40 ? "poor" : "unusable";

    return {
      qualityScore: score,
      status,
      hasWarmupBias,
      missingSampleRatio,
      clockSkewDetected: false,
      sparsityWarning,
      notes,
    };
  }

  /**
   * Helper to build a validated BenchmarkRun
   */
  public static buildRun(params: {
    benchmarkDefinitionId: string;
    architectureId: string;
    projectId: string;
    runNumber: number;
    environment: BenchmarkEnvironment;
    workloadProfile: WorkloadProfile;
    sourceTool: "k6" | "jmeter" | "locust" | "opentelemetry" | "custom";
    sourceVersion?: string;
    durationSeconds: number;
    metrics: BenchmarkMetricSummary;
    operationSummaries?: Record<string, OperationMetricSummary>;
    targets?: PerformanceTarget[];
    rawSummaryExport?: Record<string, unknown>;
  }): BenchmarkRun {
    const dataQuality = this.evaluateDataQuality(params.metrics);
    const targetEvaluations = params.targets
      ? this.evaluateTargets(params.targets, params.metrics)
      : [];

    return {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      benchmarkDefinitionId: params.benchmarkDefinitionId,
      architectureId: params.architectureId,
      projectId: params.projectId,
      runNumber: params.runNumber,
      environment: params.environment,
      workloadProfile: params.workloadProfile,
      sourceTool: params.sourceTool,
      sourceVersion: params.sourceVersion,
      executedAt: new Date().toISOString(),
      durationSeconds: params.durationSeconds,
      overallSummary: params.metrics,
      operationSummaries: params.operationSummaries || {},
      targetEvaluations,
      dataQuality,
      rawSummaryExport: params.rawSummaryExport,
    };
  }
}
