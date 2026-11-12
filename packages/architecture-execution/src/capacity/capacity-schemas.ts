import { z } from "zod";

// ========================
// Enumerations
// ========================

export const CapArrivalModelSchema = z.enum([
  "constant",
  "poisson",
  "ramp",
  "step",
  "periodic",
  "bursty",
]);
export type CapArrivalModel = z.infer<typeof CapArrivalModelSchema>;

export const CapScalingModeSchema = z.enum([
  "fixed",
  "hpa_reactive",
  "predictive",
  "vpa_recommend",
  "cluster_autoscale",
]);
export type CapScalingMode = z.infer<typeof CapScalingModeSchema>;

export const CapQueueDisciplineSchema = z.enum([
  "fifo",
  "priority",
  "wfq",
  "deadline",
  "head_of_line_demo",
]);
export type CapQueueDiscipline = z.infer<typeof CapQueueDisciplineSchema>;

export const CapOverloadActionSchema = z.enum([
  "queue",
  "backpressure",
  "load_shed",
]);
export type CapOverloadAction = z.infer<typeof CapOverloadActionSchema>;

export const CapForecastModelSchema = z.enum([
  "moving_average",
  "exponential_smoothing",
  "trend_extrapolation",
  "seasonal_baseline",
]);
export type CapForecastModel = z.infer<typeof CapForecastModelSchema>;

export const CapOptimizationObjectiveSchema = z.enum([
  "minimize_cost",
  "minimize_latency",
  "maximize_throughput",
  "balanced_pareto",
]);
export type CapOptimizationObjective = z.infer<
  typeof CapOptimizationObjectiveSchema
>;

// ========================
// Config Schemas
// ========================

export const CapServiceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  kind: z.enum(["gateway", "application", "database", "cache", "queue", "external"]),
  region: z.string().default("us-east-1"),
  initialReplicas: z.number().int().min(1).default(3),
  minReplicas: z.number().int().min(1).default(1),
  maxReplicas: z.number().int().min(1).default(20),
  cpuRequestMillicores: z.number().min(50).default(500),
  cpuLimitMillicores: z.number().min(50).default(1000),
  memoryRequestMiB: z.number().min(64).default(512),
  memoryLimitMiB: z.number().min(64).default(1024),
  workerConcurrencyPerReplica: z.number().int().min(1).default(20),
  maxDbConnectionsPerReplica: z.number().int().min(1).default(30),
  baseServiceTimeMs: z.number().min(1).default(12),
  cpuCostPerRequestMillicores: z.number().min(0.1).default(8),
  memoryPerRequestMiB: z.number().min(0.1).default(4),
  startupDelayMs: z.number().min(0).default(60),
  readinessDelayMs: z.number().min(0).default(20),
  coldStartPenaltyMs: z.number().min(0).default(0),
  dependencyIds: z.array(z.string()).default([]),
  reservedFailoverReplicas: z.number().int().min(0).default(0),
});
export type CapServiceConfig = z.infer<typeof CapServiceConfigSchema>;

export const WorkloadProfileConfigSchema = z.object({
  id: z.string().min(1),
  targetServiceId: z.string().min(1),
  arrivalModel: CapArrivalModelSchema.default("constant"),
  baseRequestsPerSecond: z.number().min(1).default(120),
  peakRequestsPerSecond: z.number().min(1).optional(),
  startMs: z.number().min(0).default(0),
  durationMs: z.number().min(20).default(800),
  heavyRequestRatio: z.number().min(0).max(1).default(0.1),
  retryAmplificationFactor: z.number().min(1).max(4).default(1),
  tenantId: z.string().default("tenant-default"),
  tenantWeight: z.number().min(1).default(1),
  region: z.string().default("us-east-1"),
});
export type WorkloadProfileConfig = z.infer<typeof WorkloadProfileConfigSchema>;

export const CapScalingPolicyConfigSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  mode: CapScalingModeSchema.default("hpa_reactive"),
  targetCpuUtilizationPct: z.number().min(10).max(99).default(70),
  targetMemoryUtilizationPct: z.number().min(10).max(99).default(80),
  customMetricTargetRpsPerReplica: z.number().min(1).optional(),
  evaluationIntervalMs: z.number().min(10).default(40),
  scaleUpStabilizationMs: z.number().min(0).default(20),
  scaleDownStabilizationMs: z.number().min(0).default(120),
  cooldownMs: z.number().min(0).default(40),
  tolerancePct: z.number().min(0).max(30).default(10),
  maxScaleUpStepReplicas: z.number().int().min(1).default(4),
  maxScaleDownStepReplicas: z.number().int().min(1).default(2),
  forecastModel: CapForecastModelSchema.default("exponential_smoothing"),
  clusterAutoScaleEnabled: z.boolean().default(false),
});
export type CapScalingPolicyConfig = z.infer<
  typeof CapScalingPolicyConfigSchema
>;

export const CapQueueingPolicyConfigSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  discipline: CapQueueDisciplineSchema.default("fifo"),
  maxQueueDepth: z.number().int().min(0).default(120),
  requestTimeoutMs: z.number().min(10).default(250),
  overloadAction: CapOverloadActionSchema.default("load_shed"),
});
export type CapQueueingPolicyConfig = z.infer<
  typeof CapQueueingPolicyConfigSchema
>;

export const CapCostModelConfigSchema = z.object({
  id: z.string().min(1),
  currency: z.string().default("USD"),
  provenanceLabel: z
    .string()
    .default("Synthetic educational pricing defaults (not live provider invoices)"),
  computePerReplicaHour: z.number().min(0).default(0.0625), // ~$45/mo (720h)
  memoryPerGiBHour: z.number().min(0).default(0.008),
  storagePerGiBMonth: z.number().min(0).default(0.1),
  networkPerGiB: z.number().min(0).default(0.02),
  requestPerMillion: z.number().min(0).default(0.4),
  fixedMonthlyCost: z.number().min(0).default(0),
});
export type CapCostModelConfig = z.infer<typeof CapCostModelConfigSchema>;

export const CapClusterConfigSchema = z.object({
  nodeCount: z.number().int().min(1).default(4),
  cpuPerNodeMillicores: z.number().min(250).default(4000),
  memoryPerNodeMiB: z.number().min(512).default(8192),
  maxNodes: z.number().int().min(1).default(12),
  nodeProvisionDelayMs: z.number().min(0).default(120),
  fragmentedLayout: z.boolean().default(false),
});
export type CapClusterConfig = z.infer<typeof CapClusterConfigSchema>;

export const CapObjectiveConfigSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  maxP95LatencyMs: z.number().min(5).default(120),
  maxErrorRate: z.number().min(0).max(1).default(0.02),
  maxMonthlyBudgetUsd: z.number().min(1).default(1200),
  minHeadroomPct: z.number().min(0).max(90).default(15),
  optimizationGoal: CapOptimizationObjectiveSchema.default("balanced_pareto"),
});
export type CapObjectiveConfig = z.infer<typeof CapObjectiveConfigSchema>;

export const CapFaultConfigSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  durationMs: z.number().min(10).optional(),
  type: z.enum([
    "downstream_db_saturation",
    "noisy_neighbor_tenant",
    "thundering_herd",
    "cluster_node_loss",
    "cold_start_surge",
    "memory_leak_pressure",
    "region_failover_surge",
  ]),
  targetServiceId: z.string().default("api-service"),
  description: z.string().default("Synthetic capacity stress event"),
});
export type CapFaultConfig = z.infer<typeof CapFaultConfigSchema>;

export const CapacityScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  presetId: z.string().optional(),
  label: z.string().default("Capacity Planning Scenario"),
  architectureRevisionId: z.string().default("rev_001"),
  seed: z.number().int().default(42),
  services: z.array(CapServiceConfigSchema).min(1),
  workloads: z.array(WorkloadProfileConfigSchema).min(1),
  scalingPolicies: z.array(CapScalingPolicyConfigSchema).min(1),
  queueingPolicies: z.array(CapQueueingPolicyConfigSchema).min(1),
  costModels: z.array(CapCostModelConfigSchema).min(1),
  cluster: CapClusterConfigSchema.default({}),
  objectives: z.array(CapObjectiveConfigSchema).min(1),
  faults: z.array(CapFaultConfigSchema).default([]),
  limits: z.object({
    maxServices: z.number().int().min(1).max(120).default(100),
    maxReplicas: z.number().int().min(1).max(500).default(200),
    maxRequests: z.number().int().min(10).max(20000).default(5000),
    maxQueueEntries: z.number().int().min(0).max(5000).default(1000),
    maxScalingEvents: z.number().int().min(1).max(500).default(100),
    maxEvents: z.number().int().min(10).max(10000).default(2500),
    maxVirtualDurationMs: z.number().min(100).max(30000).default(800),
  }),
});
export type CapacityScenario = z.infer<typeof CapacityScenarioSchema>;

// ========================
// Runtime Domain Models
// ========================

export interface CapQueueingTheoryResult {
  model: "MM1" | "MMc";
  lambdaRps: number;
  muPerServerRps: number;
  servers: number;
  rhoUtilization: number;
  stable: boolean;
  applicable: boolean;
  probWaitErlangC: number;
  expectedQueueLengthLq: number | null;
  expectedSystemLengthL: number | null;
  expectedWaitQueueMsWq: number | null;
  expectedTotalTimeMsW: number | null;
  littlesLawL: number | null;
  caveat: string;
}

export interface CapReplicaRuntime {
  id: string;
  serviceId: string;
  nodeId: string;
  state: "PENDING_CAPACITY" | "PROVISIONING" | "READY" | "TERMINATING";
  requestedAtMs: number;
  readyAtMs?: number;
  cpuUtilizationPct: number;
  memoryUtilizationPct: number;
  activeWorkers: number;
  activeConnections: number;
  throttled: boolean;
}

export interface CapServiceRuntimeState {
  id: string;
  label: string;
  kind: CapServiceConfig["kind"];
  region: string;
  desiredReplicas: number;
  readyReplicas: number;
  pendingReplicas: number;
  terminatingReplicas: number;
  incomingRps: number;
  completedRps: number;
  rejectedRps: number;
  effectiveCapacityRps: number;
  headroomRps: number;
  headroomPct: number;
  cpuUtilizationPct: number;
  memoryUtilizationPct: number;
  workerUtilizationPct: number;
  connectionUtilizationPct: number;
  queueDepth: number;
  maxQueueDepth: number;
  queueWaitMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throttled: boolean;
  oomRisk: boolean;
  saturated: boolean;
  sloViolated: boolean;
}

export interface CapScalingDecisionRuntime {
  id: string;
  atMs: number;
  serviceId: string;
  mode: CapScalingMode;
  fromReplicas: number;
  toReplicas: number;
  applied: boolean;
  reason: string;
}

export interface CapBottleneckRuntime {
  serviceId: string;
  limitingResource:
    | "cpu"
    | "memory"
    | "worker_pool"
    | "db_connections"
    | "queue_capacity"
    | "downstream_dependency"
    | "cluster_fragmentation";
  saturationPct: number;
  affectedRps: number;
  explanation: string;
}

export interface CapForecastPoint {
  atMs: number;
  observedRps: number;
  forecastNextRps: number;
  forecastErrorPct: number;
  model: CapForecastModel;
}

export interface CapRecommendationRuntime {
  id: string;
  targetServiceId: string;
  observedProblem: string;
  supportingMetric: string;
  suggestedChange: string;
  expectedEffect: string;
  tradeOff: string;
  confidence: "high" | "medium" | "low";
  assumptions: string;
}

export interface CapParetoCandidate {
  replicas: number;
  monthlyComputeCostUsd: number;
  estimatedP95Ms: number;
  headroomPct: number;
  effectiveCapacityRps: number;
  paretoEfficient: boolean;
  meetsConstraints: boolean;
}

export interface CapCostAttribution {
  currency: string;
  provenanceLabel: string;
  computeCostUsd: number;
  memoryCostUsd: number;
  networkCostUsd: number;
  requestCostUsd: number;
  storageAndReservedCostUsd: number;
  totalSimulatedWindowCostUsd: number;
  projectedMonthlyCostUsd: number;
  costPerSuccessfulRequestUsd: number | null;
}

export interface CapInvariantReport {
  allPassed: boolean;
  replicaBoundsOk: boolean;
  unreadyZeroCapacityOk: boolean;
  utilizationGroundedOk: boolean;
  queueNonNegativeOk: boolean;
  completedWithinCapacityOk: boolean;
  scalingPolicyRespectedOk: boolean;
  costGroundedOk: boolean;
  analyticalAssumptionsEnforcedOk: boolean;
  noFutureForecastLeakageOk: boolean;
  recommendationsValidOk: boolean;
  violations: string[];
}

export interface CapacityPostureMetrics {
  virtualTimeMs: number;
  incomingRps: number;
  completedRps: number;
  rejectedRps: number;
  totalRequests: number;
  successfulRequests: number;
  rejectedRequests: number;
  activeQueueDepth: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgCpuUtilizationPct: number;
  avgMemoryUtilizationPct: number;
  readyReplicas: number;
  pendingReplicas: number;
  effectiveCapacityRps: number;
  headroomPct: number;
  scalingEventsCount: number;
  sloViolationsCount: number;
  projectedMonthlyCostUsd: number;
  costPerSuccessfulRequestUsd: number | null;
}

export interface ModeledCapacityRuntimeState {
  virtualTimeMs: number;
  services: Record<string, CapServiceRuntimeState>;
  replicas: Record<string, CapReplicaRuntime>;
  cluster: {
    nodeCount: number;
    allocatableCpuMillicores: number;
    allocatedCpuMillicores: number;
    allocatableMemoryMiB: number;
    allocatedMemoryMiB: number;
    fragmentedPendingPods: number;
  };
  queueingAnalysis: {
    mm1: CapQueueingTheoryResult;
    mmc: CapQueueingTheoryResult;
  };
  scalingDecisions: CapScalingDecisionRuntime[];
  bottlenecks: CapBottleneckRuntime[];
  forecastPoints: CapForecastPoint[];
  recommendations: CapRecommendationRuntime[];
  paretoFrontier: CapParetoCandidate[];
  cost: CapCostAttribution;
  caveats: string[];
  invariants: CapInvariantReport;
  metrics: CapacityPostureMetrics;
}

