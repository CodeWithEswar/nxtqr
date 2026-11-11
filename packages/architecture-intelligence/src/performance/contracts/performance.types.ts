/**
 * NXTQR — Phase 05.3.17: Architecture Performance Benchmarking & Load Testing Planner
 * Core Domain Contracts and Types
 */

/**
 * Fundamental category segregation:
 * - planned: Workload or test configuration that has not been executed.
 * - modeled: Deterministic performance estimates derived from architecture assumptions.
 * - measured: Actual benchmark metrics returned by an authorized tool (k6, JMeter, OTel).
 * - unknown: Missing or inconclusive information. (Missing data != healthy/passed!)
 */
export type PerformanceCategory = "planned" | "modeled" | "measured" | "unknown";

export type WorkloadModelType = "closed_loop" | "open_loop";

export type BenchmarkTestType =
  | "baseline"
  | "load"
  | "stress"
  | "spike"
  | "soak"
  | "capacity";

export type WorkloadStageType =
  | "warmup"
  | "baseline"
  | "ramp_up"
  | "steady"
  | "spike"
  | "recovery"
  | "cooldown";

export interface WorkloadStage {
  id: string;
  name: string;
  stageType: WorkloadStageType;
  durationSeconds: number;
  targetVUs?: number; // Used in closed-loop
  targetRps?: number; // Used in open-loop
}

export interface BenchmarkOperation {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  weight: number; // e.g. 50 = 50%
  expectedStatus: number;
  targetComponentId?: string; // Mapped graph node ID
  journeyId?: string; // Mapped critical user journey
  timeoutMs?: number;
  headers?: Record<string, string>;
  payloadBody?: string;
}

export interface ClosedLoopProfile {
  modelType: "closed_loop";
  initialVUs: number;
  maxVUs: number;
  stages: WorkloadStage[];
  thinkTimeMs: {
    min: number;
    max: number;
  };
  iterationsLimit?: number;
}

export interface OpenLoopProfile {
  modelType: "open_loop";
  stages: WorkloadStage[];
  targetRps: number;
  maxExecutionCapacityVUs: number;
  droppedIterationBehavior: "drop" | "queue" | "error";
  allocatedVUs: number;
}

export type WorkloadProfile = ClosedLoopProfile | OpenLoopProfile;

export type PerformanceTargetMetric =
  | "p50_latency"
  | "p90_latency"
  | "p95_latency"
  | "p99_latency"
  | "max_latency"
  | "mean_latency"
  | "throughput_rps"
  | "error_rate_pct"
  | "dropped_iterations_pct"
  | "cpu_saturation_pct";

export interface PerformanceTarget {
  id: string;
  name: string;
  metric: PerformanceTargetMetric;
  operator: "lt" | "lte" | "gt" | "gte" | "eq";
  thresholdValue: number;
  warningThresholdValue?: number;
  unit: string; // e.g. "ms", "rps", "%"
  scope: "global" | "component" | "operation";
  targetId?: string; // Optional component or operation ID
}

export interface PerformanceTargetEvaluation {
  targetId: string;
  targetName: string;
  metric: PerformanceTargetMetric;
  category: PerformanceCategory;
  operator: string;
  thresholdValue: number;
  measuredValue?: number;
  status: "passed" | "warn" | "failed" | "unknown";
  reason: string;
}

export interface BenchmarkEnvironment {
  id: string;
  name: string;
  category: "staging" | "load_test" | "production_canary" | "local" | "synthetic";
  region?: string;
  computeSpec?: string;
  networkContext?: string;
  generatorSpec?: string;
  architectureRevision?: string;
}

export interface BenchmarkMetricSummary {
  category: PerformanceCategory;
  totalRequests: number;
  failedRequests: number;
  errorRatePct: number;
  durationSeconds: number;
  offeredRps: number;
  achievedRps: number;
  droppedIterations: number;
  droppedIterationsPct: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  meanLatencyMs: number;
}

export interface OperationMetricSummary {
  operationId: string;
  operationName: string;
  targetComponentId?: string;
  requestCount: number;
  failedCount: number;
  errorRatePct: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  achievedRps: number;
}

export interface BenchmarkDataQuality {
  qualityScore: number; // 0 - 100
  status: "high" | "acceptable" | "poor" | "unusable";
  hasWarmupBias: boolean;
  missingSampleRatio: number;
  clockSkewDetected: boolean;
  sparsityWarning: boolean;
  notes: string[];
}

export interface BenchmarkRun {
  id: string;
  benchmarkDefinitionId: string;
  architectureId: string;
  projectId: string;
  runNumber: number;
  environment: BenchmarkEnvironment;
  workloadProfile: WorkloadProfile;
  sourceTool: "k6" | "jmeter" | "locust" | "opentelemetry" | "custom";
  sourceVersion?: string;
  executedAt: string;
  durationSeconds: number;
  overallSummary: BenchmarkMetricSummary;
  operationSummaries: Record<string, OperationMetricSummary>;
  targetEvaluations: PerformanceTargetEvaluation[];
  dataQuality: BenchmarkDataQuality;
  rawSummaryExport?: Record<string, unknown>;
}

export interface BenchmarkDefinition {
  id: string;
  projectId: string;
  architectureId: string;
  name: string;
  description: string;
  testType: BenchmarkTestType;
  workloadProfile: WorkloadProfile;
  operations: BenchmarkOperation[];
  targets: PerformanceTarget[];
  targetHost: string;
  environment: BenchmarkEnvironment;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BottleneckValidation {
  componentId: string;
  componentLabel: string;
  predictedBottleneck: boolean;
  predictedSaturationRps?: number;
  measuredMaxRps?: number;
  measuredP95LatencyMs?: number;
  verdict: "supported" | "contradicted" | "inconclusive";
  explanation: string;
}

export interface PerformanceRegression {
  metric: string;
  baselineRunId: string;
  candidateRunId: string;
  baselineValue: number;
  candidateValue: number;
  delta: number;
  percentChange: number;
  severity: "critical" | "high" | "medium" | "low" | "none";
  explanation: string;
}

export interface ModelCalibrationProposal {
  componentId: string;
  componentLabel: string;
  parameterName: string;
  modeledValue: number;
  measuredValue: number;
  recommendedCalibration: number;
  confidence: "high" | "moderate" | "low";
  justification: string;
}

export interface BenchmarkComparisonResult {
  baselineRun: BenchmarkRun;
  candidateRun: BenchmarkRun;
  regressions: PerformanceRegression[];
  bottleneckValidations: BottleneckValidation[];
  calibrationProposals: ModelCalibrationProposal[];
  summary: string;
  recommendations: string[];
}

export interface PerformanceFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  category: PerformanceCategory;
  affectedComponentId?: string;
  description: string;
  remediation: string;
}
