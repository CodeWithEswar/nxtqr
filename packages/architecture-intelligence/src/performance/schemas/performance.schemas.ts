import { z } from "zod";

export const PerformanceCategorySchema = z.enum([
  "planned",
  "modeled",
  "measured",
  "unknown",
]);

export const WorkloadModelTypeSchema = z.enum(["closed_loop", "open_loop"]);

export const BenchmarkTestTypeSchema = z.enum([
  "baseline",
  "load",
  "stress",
  "spike",
  "soak",
  "capacity",
]);

export const WorkloadStageTypeSchema = z.enum([
  "warmup",
  "baseline",
  "ramp_up",
  "steady",
  "spike",
  "recovery",
  "cooldown",
]);

export const WorkloadStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stageType: WorkloadStageTypeSchema,
  durationSeconds: z.number().positive(),
  targetVUs: z.number().nonnegative().optional(),
  targetRps: z.number().nonnegative().optional(),
});

export const BenchmarkOperationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  path: z.string().min(1),
  weight: z.number().positive(),
  expectedStatus: z.number().int().min(100).max(599),
  targetComponentId: z.string().optional(),
  journeyId: z.string().optional(),
  timeoutMs: z.number().positive().optional(),
  headers: z.record(z.string()).optional(),
  payloadBody: z.string().optional(),
});

export const ClosedLoopProfileSchema = z.object({
  modelType: z.literal("closed_loop"),
  initialVUs: z.number().int().nonnegative(),
  maxVUs: z.number().int().positive(),
  stages: z.array(WorkloadStageSchema).min(1),
  thinkTimeMs: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
  iterationsLimit: z.number().int().positive().optional(),
});

export const OpenLoopProfileSchema = z.object({
  modelType: z.literal("open_loop"),
  stages: z.array(WorkloadStageSchema).min(1),
  targetRps: z.number().positive(),
  maxExecutionCapacityVUs: z.number().int().positive(),
  droppedIterationBehavior: z.enum(["drop", "queue", "error"]),
  allocatedVUs: z.number().int().positive(),
});

export const WorkloadProfileSchema = z.discriminatedUnion("modelType", [
  ClosedLoopProfileSchema,
  OpenLoopProfileSchema,
]);

export const PerformanceTargetMetricSchema = z.enum([
  "p50_latency",
  "p90_latency",
  "p95_latency",
  "p99_latency",
  "max_latency",
  "mean_latency",
  "throughput_rps",
  "error_rate_pct",
  "dropped_iterations_pct",
  "cpu_saturation_pct",
]);

export const PerformanceTargetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  metric: PerformanceTargetMetricSchema,
  operator: z.enum(["lt", "lte", "gt", "gte", "eq"]),
  thresholdValue: z.number(),
  warningThresholdValue: z.number().optional(),
  unit: z.string().min(1),
  scope: z.enum(["global", "component", "operation"]),
  targetId: z.string().optional(),
});

export const PerformanceTargetEvaluationSchema = z.object({
  targetId: z.string(),
  targetName: z.string(),
  metric: PerformanceTargetMetricSchema,
  category: PerformanceCategorySchema,
  operator: z.string(),
  thresholdValue: z.number(),
  measuredValue: z.number().optional(),
  status: z.enum(["passed" , "warn" , "failed" , "unknown"]),
  reason: z.string(),
});

export const BenchmarkEnvironmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum([
    "staging",
    "load_test",
    "production_canary",
    "local",
    "synthetic",
  ]),
  region: z.string().optional(),
  computeSpec: z.string().optional(),
  networkContext: z.string().optional(),
  generatorSpec: z.string().optional(),
  architectureRevision: z.string().optional(),
});

export const BenchmarkMetricSummarySchema = z.object({
  category: PerformanceCategorySchema,
  totalRequests: z.number().nonnegative(),
  failedRequests: z.number().nonnegative(),
  errorRatePct: z.number().nonnegative().max(100),
  durationSeconds: z.number().positive(),
  offeredRps: z.number().nonnegative(),
  achievedRps: z.number().nonnegative(),
  droppedIterations: z.number().nonnegative(),
  droppedIterationsPct: z.number().nonnegative().max(100),
  p50LatencyMs: z.number().nonnegative(),
  p90LatencyMs: z.number().nonnegative(),
  p95LatencyMs: z.number().nonnegative(),
  p99LatencyMs: z.number().nonnegative(),
  minLatencyMs: z.number().nonnegative(),
  maxLatencyMs: z.number().nonnegative(),
  meanLatencyMs: z.number().nonnegative(),
});

export const OperationMetricSummarySchema = z.object({
  operationId: z.string(),
  operationName: z.string(),
  targetComponentId: z.string().optional(),
  requestCount: z.number().nonnegative(),
  failedCount: z.number().nonnegative(),
  errorRatePct: z.number().nonnegative(),
  p50LatencyMs: z.number().nonnegative(),
  p95LatencyMs: z.number().nonnegative(),
  p99LatencyMs: z.number().nonnegative(),
  achievedRps: z.number().nonnegative(),
});

export const BenchmarkDataQualitySchema = z.object({
  qualityScore: z.number().min(0).max(100),
  status: z.enum(["high", "acceptable", "poor", "unusable"]),
  hasWarmupBias: z.boolean(),
  missingSampleRatio: z.number().min(0).max(1),
  clockSkewDetected: z.boolean(),
  sparsityWarning: z.boolean(),
  notes: z.array(z.string()),
});

export const BenchmarkRunSchema = z.object({
  id: z.string().min(1),
  benchmarkDefinitionId: z.string().min(1),
  architectureId: z.string().min(1),
  projectId: z.string().min(1),
  runNumber: z.number().int().positive(),
  environment: BenchmarkEnvironmentSchema,
  workloadProfile: WorkloadProfileSchema,
  sourceTool: z.enum(["k6", "jmeter", "locust", "opentelemetry", "custom"]),
  sourceVersion: z.string().optional(),
  executedAt: z.string(),
  durationSeconds: z.number().positive(),
  overallSummary: BenchmarkMetricSummarySchema,
  operationSummaries: z.record(OperationMetricSummarySchema),
  targetEvaluations: z.array(PerformanceTargetEvaluationSchema),
  dataQuality: BenchmarkDataQualitySchema,
  rawSummaryExport: z.record(z.unknown()).optional(),
});

export const BenchmarkDefinitionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  testType: BenchmarkTestTypeSchema,
  workloadProfile: WorkloadProfileSchema,
  operations: z.array(BenchmarkOperationSchema).min(1),
  targets: z.array(PerformanceTargetSchema),
  targetHost: z.string().min(1),
  environment: BenchmarkEnvironmentSchema,
  version: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
