import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  BenchmarkComparisonResult,
  BenchmarkDefinition,
  BenchmarkEnvironment,
  BenchmarkMetricSummary,
  BenchmarkOperation,
  BenchmarkRun,
  BottleneckValidation,
  ModelCalibrationProposal,
  PerformanceFinding,
  PerformanceTarget,
  PerformanceTargetEvaluation,
  WorkloadProfile,
} from "../contracts/performance.types";
import { WorkloadValidator, type ValidationResult } from "../planning/workload-validator";
import { PerformanceSafetyPolicy, type SafetyCheckResult, type SafetyPolicyOptions } from "../planning/safety-policy";
import { K6Adapter } from "../adapters/k6-adapter";
import { LatencyAnalyzer, type PercentileResult } from "../results/latency-analyzer";
import { ResultNormalizer } from "../results/result-normalizer";
import { PerformanceRegressionDetector } from "../comparison/regression-detector";
import { ModelCalibrator, type PredictedBottleneckInfo } from "../comparison/model-calibrator";

export class ArchitecturePerformanceEngine {
  private readonly defaultSafetyPolicy: PerformanceSafetyPolicy;

  constructor(safetyOptions?: SafetyPolicyOptions) {
    this.defaultSafetyPolicy = new PerformanceSafetyPolicy(safetyOptions);
  }

  public validateWorkload(
    profile: WorkloadProfile,
    operations: BenchmarkOperation[]
  ): ValidationResult {
    return WorkloadValidator.validate(profile, operations);
  }

  public checkSafetyPolicy(params: {
    targetHost: string;
    totalVUs?: number;
    targetRps?: number;
    durationSeconds: number;
    customPolicy?: PerformanceSafetyPolicy;
  }): SafetyCheckResult {
    const policy = params.customPolicy || this.defaultSafetyPolicy;
    return policy.validatePlan(params);
  }

  public exportK6Script(definition: BenchmarkDefinition): string {
    return K6Adapter.exportScript(definition);
  }

  public importK6Result(
    rawJson: string | Record<string, any>,
    metadata: {
      definitionId: string;
      architectureId: string;
      projectId: string;
      environment: BenchmarkEnvironment;
      workloadProfile: WorkloadProfile;
      runNumber?: number;
      targets?: PerformanceTarget[];
    }
  ): BenchmarkRun {
    const run = K6Adapter.importSummaryJson(rawJson, metadata);
    if (metadata.targets && metadata.targets.length > 0) {
      run.targetEvaluations = ResultNormalizer.evaluateTargets(metadata.targets, run.overallSummary);
    }
    return run;
  }

  public analyzeLatency(samples: number[]): PercentileResult {
    return LatencyAnalyzer.calculatePercentilesFromSamples(samples);
  }

  public evaluateTargets(
    targets: PerformanceTarget[],
    summary: BenchmarkMetricSummary
  ): PerformanceTargetEvaluation[] {
    return ResultNormalizer.evaluateTargets(targets, summary);
  }

  public compareRuns(
    baseline: BenchmarkRun,
    candidate: BenchmarkRun
  ): BenchmarkComparisonResult {
    return PerformanceRegressionDetector.compareRuns(baseline, candidate);
  }

  public validateBottlenecks(
    nodes: BaseNode[],
    predictions: PredictedBottleneckInfo[],
    run: BenchmarkRun
  ): BottleneckValidation[] {
    return ModelCalibrator.validateBottlenecks(nodes, predictions, run);
  }

  public proposeCalibrations(
    nodes: BaseNode[],
    run: BenchmarkRun
  ): ModelCalibrationProposal[] {
    return ModelCalibrator.proposeCalibrations(nodes, run);
  }

  /**
   * Generates actionable performance findings from run results and evaluations
   */
  public generateFindings(
    run: BenchmarkRun,
    comparison?: BenchmarkComparisonResult
  ): PerformanceFinding[] {
    const findings: PerformanceFinding[] = [];

    // Target breach findings
    for (const evalResult of run.targetEvaluations) {
      if (evalResult.status === "failed") {
        findings.push({
          id: `finding-target-fail-${evalResult.targetId}`,
          severity: "high",
          title: `Performance Target Breached: ${evalResult.targetName}`,
          category: evalResult.category,
          description: evalResult.reason,
          remediation: `Investigate component saturation, query efficiency, or scale concurrency limits.`,
        });
      }
    }

    // High error rate finding
    if (run.overallSummary.errorRatePct > 1) {
      findings.push({
        id: `finding-error-rate-${run.id}`,
        severity: run.overallSummary.errorRatePct > 5 ? "critical" : "high",
        title: `Elevated Error Rate (${run.overallSummary.errorRatePct.toFixed(2)}%)`,
        category: "measured",
        description: `Test incurred ${run.overallSummary.failedRequests} failed requests under load.`,
        remediation: "Review server error logs, timeout ceilings, and circuit breaker thresholds.",
      });
    }

    // Dropped iterations in open loop
    if (run.overallSummary.droppedIterations > 0) {
      findings.push({
        id: `finding-dropped-iterations-${run.id}`,
        severity: run.overallSummary.droppedIterationsPct > 10 ? "critical" : "medium",
        title: `Open-Loop Dropped Iterations (${run.overallSummary.droppedIterations} dropped)`,
        category: "measured",
        description: `Target system latency caused iteration backlog exceeding maximum execution capacity (${run.overallSummary.droppedIterationsPct.toFixed(1)}% dropped).`,
        remediation: "Increase worker pool capacity or optimize endpoint response times to keep pace with arrival rate.",
      });
    }

    // Regression findings from comparison
    if (comparison) {
      for (const reg of comparison.regressions) {
        if (reg.severity === "critical" || reg.severity === "high") {
          findings.push({
            id: `finding-regression-${reg.metric}`,
            severity: reg.severity,
            title: `Performance Regression Detected: ${reg.metric}`,
            category: "measured",
            description: reg.explanation,
            remediation: "Review commit diffs between baseline and candidate architecture revisions.",
          });
        }
      }
    }

    // Data quality findings
    if (run.dataQuality.status === "poor" || run.dataQuality.status === "unusable") {
      findings.push({
        id: `finding-data-quality-${run.id}`,
        severity: "medium",
        title: `Benchmark Data Quality Warning (${run.dataQuality.status})`,
        category: "measured",
        description: run.dataQuality.notes.join("; "),
        remediation: "Re-run benchmark with longer duration and sufficient sample volume for reliable percentile calculations.",
      });
    }

    return findings;
  }
}

export const architecturePerformanceEngine = new ArchitecturePerformanceEngine();
