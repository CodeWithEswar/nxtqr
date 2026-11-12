import { z } from "zod";

// ========================
// Enums & Primitives
// ========================

export const TrafficControlAlgorithmSchema = z.enum([
  "fixed_window",
  "sliding_window_log",
  "sliding_window_counter",
  "token_bucket",
  "leaky_bucket",
]);
export type TrafficControlAlgorithm = z.infer<typeof TrafficControlAlgorithmSchema>;

export const TrafficControlScopeSchema = z.enum([
  "global",
  "service",
  "route",
  "tenant",
  "user",
  "api_key",
  "ip",
  "composite",
]);
export type TrafficControlScope = z.infer<typeof TrafficControlScopeSchema>;

export const PolicyEvaluationModeSchema = z.enum([
  "all_required",
  "first_match",
  "most_specific",
  "hierarchical",
]);
export type PolicyEvaluationMode = z.infer<typeof PolicyEvaluationModeSchema>;

export const DistributedLimiterModeSchema = z.enum([
  "single_node",
  "centralized",
  "local_independent",
  "local_quota_allocation",
  "periodic_sync",
]);
export type DistributedLimiterMode = z.infer<typeof DistributedLimiterModeSchema>;

export const FailBehaviorSchema = z.enum(["fail_open", "fail_closed"]);
export type FailBehavior = z.infer<typeof FailBehaviorSchema>;

export const QueueSchedulingPolicySchema = z.enum([
  "fifo",
  "priority",
  "wfq",
  "edf",
]);
export type QueueSchedulingPolicy = z.infer<typeof QueueSchedulingPolicySchema>;

export const TrafficPatternSchema = z.enum([
  "constant",
  "bursty",
  "step",
  "ramp_up",
  "periodic_spike",
  "tenant_skewed",
  "retry_storm",
  "flash_crowd",
]);
export type TrafficPattern = z.infer<typeof TrafficPatternSchema>;

export const ServiceTimeDistributionSchema = z.enum([
  "constant",
  "uniform",
  "exponential",
  "log_normal",
  "discrete",
]);
export type ServiceTimeDistribution = z.infer<typeof ServiceTimeDistributionSchema>;

export const PriorityClassSchema = z.enum(["critical", "standard", "background"]);
export type PriorityClass = z.infer<typeof PriorityClassSchema>;

export type AdmissionDecisionType =
  | "ALLOW"
  | "REJECT_RATE_LIMIT"
  | "REJECT_CONCURRENCY"
  | "REJECT_QUEUE_FULL"
  | "REJECT_OVERLOAD"
  | "EXPIRED_DEADLINE"
  | "CIRCUIT_OPEN";

export type TrafficRequestLifecycleState =
  | "CREATED"
  | "RATE_LIMIT_CHECK"
  | "ADMITTED"
  | "QUEUED"
  | "ACTIVE"
  | "COMPLETED"
  | "REJECTED"
  | "TIMED_OUT"
  | "CANCELLED";

// ========================
// Scenario Config Schemas
// ========================

export const TrafficSourceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().default("Client"),
  tenantId: z.string().default("tenant-a"),
  userId: z.string().optional(),
  apiKeyId: z.string().optional(),
  clientIp: z.string().optional(),
  route: z.string().default("/api/orders"),
  method: z.string().default("POST"),
  pattern: TrafficPatternSchema.default("constant"),
  requestsPerSecond: z.number().min(0.5).max(500).default(20),
  burstSize: z.number().int().min(1).max(200).default(5),
  priority: PriorityClassSchema.default("standard"),
  cost: z.number().min(1).max(20).default(1),
  startAtMs: z.number().min(0).default(0),
  endAtMs: z.number().min(10).default(1000),
  deadlineMs: z.number().min(10).optional(),
  tenantWeight: z.number().min(1).max(10).default(1),
});
export type TrafficSourceConfig = z.infer<typeof TrafficSourceConfigSchema>;

export const RateLimitPolicyConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().default("Primary Limiter"),
  algorithm: TrafficControlAlgorithmSchema.default("token_bucket"),
  scope: TrafficControlScopeSchema.default("global"),
  scopeMatch: z.string().optional(),
  parentPolicyId: z.string().optional(),
  limit: z.number().int().min(1).max(10000).default(10),
  windowMs: z.number().min(50).max(60000).default(500),
  capacity: z.number().min(1).max(1000).default(6),
  refillTokensPerSecond: z.number().min(0.1).max(1000).default(4),
  drainRatePerSecond: z.number().min(0.1).max(1000).default(4),
});
export type RateLimitPolicyConfig = z.infer<typeof RateLimitPolicyConfigSchema>;

export const DistributedGatewayConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  clockOffsetMs: z.number().min(-500).max(500).default(0),
  allocatedQuota: z.number().int().min(1).max(5000).optional(),
});
export type DistributedGatewayConfig = z.infer<typeof DistributedGatewayConfigSchema>;

export const TrafficFaultConfigSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "central_store_down",
    "central_store_recover",
    "downstream_slow",
    "downstream_error",
    "downstream_recover",
    "cancel_queued",
  ]),
  atMs: z.number().min(0),
  endAtMs: z.number().min(0).optional(),
  targetId: z.string().optional(),
  multiplier: z.number().min(1).max(20).optional(),
  description: z.string().default("Injected traffic fault"),
});
export type TrafficFaultConfig = z.infer<typeof TrafficFaultConfigSchema>;

export const TrafficControlScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  presetId: z.string().optional(),
  label: z.string().default("Traffic Control Scenario"),
  architectureRevisionId: z.string().default("rev_001"),
  seed: z.number().int().default(42),
  evaluationMode: PolicyEvaluationModeSchema.default("all_required"),
  sources: z.array(TrafficSourceConfigSchema).min(1),
  policies: z.array(RateLimitPolicyConfigSchema).default([]),
  distributed: z.object({
    mode: DistributedLimiterModeSchema.default("single_node"),
    gateways: z.array(DistributedGatewayConfigSchema).default([
      { id: "gw-1", label: "Gateway 1", clockOffsetMs: 0 },
    ]),
    centralLatencyMs: z.number().min(0).max(500).default(5),
    syncIntervalMs: z.number().min(20).max(5000).default(120),
    failBehavior: FailBehaviorSchema.default("fail_closed"),
  }),
  concurrency: z.object({
    enabled: z.boolean().default(true),
    maxConcurrent: z.number().int().min(1).max(500).default(4),
    adaptive: z.object({
      enabled: z.boolean().default(false),
      minLimit: z.number().int().min(1).max(100).default(2),
      maxLimit: z.number().int().min(1).max(500).default(12),
      targetLatencyMs: z.number().min(5).max(5000).default(45),
      adjustIntervalMs: z.number().min(20).max(5000).default(100),
    }),
  }),
  queue: z.object({
    enabled: z.boolean().default(true),
    capacity: z.number().int().min(0).max(500).default(8),
    policy: QueueSchedulingPolicySchema.default("fifo"),
    maxWaitMs: z.number().min(10).max(10000).default(400),
    agingBoostMs: z.number().min(10).max(5000).default(120),
  }),
  serviceCapacity: z.object({
    baseServiceTimeMs: z.number().min(1).max(2000).default(35),
    distribution: ServiceTimeDistributionSchema.default("constant"),
    failureRateBase: z.number().min(0).max(1).default(0),
    overloadFailureRate: z.number().min(0).max(1).default(0),
  }),
  overload: z.object({
    backpressureEnabled: z.boolean().default(false),
    enterQueueThreshold: z.number().min(0).max(1).default(0.75),
    exitQueueThreshold: z.number().min(0).max(1).default(0.35),
    loadSheddingEnabled: z.boolean().default(false),
    shedPolicy: z
      .enum(["queue_depth", "priority", "deadline", "probabilistic", "latency"])
      .default("priority"),
    shedQueueRatio: z.number().min(0.1).max(1).default(0.7),
    shedProbability: z.number().min(0).max(1).default(0.5),
  }),
  retries: z.object({
    enabled: z.boolean().default(false),
    maxAttempts: z.number().int().min(1).max(10).default(3),
    baseBackoffMs: z.number().min(5).max(2000).default(25),
    exponentialBackoff: z.boolean().default(true),
    jitterRatio: z.number().min(0).max(1).default(0.2),
    budgetRatio: z.number().min(0).max(5).default(0.3),
    budgetMinTokens: z.number().int().min(0).max(100).default(4),
    honorRetryAfter: z.boolean().default(true),
  }),
  circuitBreaker: z.object({
    enabled: z.boolean().default(false),
    failureThreshold: z.number().int().min(1).max(100).default(4),
    openDurationMs: z.number().min(20).max(5000).default(180),
    halfOpenMaxProbes: z.number().int().min(1).max(10).default(2),
  }),
  faults: z.array(TrafficFaultConfigSchema).default([]),
  limits: z.object({
    maxSources: z.number().int().min(1).max(200).default(100),
    maxRequests: z.number().int().min(1).max(10000).default(2500),
    maxEvents: z.number().int().min(10).max(20000).default(4000),
    maxVirtualDurationMs: z.number().min(50).max(30000).default(6000),
    maxQueueDepth: z.number().int().min(0).max(1000).default(500),
  }),
});
export type TrafficControlScenario = z.infer<typeof TrafficControlScenarioSchema>;

// ========================
// Runtime State Types
// ========================

export interface SyntheticRequestRuntime {
  id: string;
  rootRequestId: string;
  sourceId: string;
  gatewayId: string;
  tenantId: string;
  userId?: string;
  apiKeyId?: string;
  clientIp?: string;
  route: string;
  method: string;
  priority: PriorityClass;
  priorityWeight: number;
  cost: number;
  attempt: number;
  createdAtMs: number;
  deadlineMs?: number;
  enqueuedAtMs?: number;
  startedAtMs?: number;
  completedAtMs?: number;
  retryAfterMs?: number;
  state: TrafficRequestLifecycleState;
  decision?: AdmissionDecisionType;
  reason: string;
}

export interface TokenBucketSnapshot {
  key: string;
  policyId: string;
  capacity: number;
  tokens: number;
  refillTokensPerSecond: number;
  lastRefillAtMs: number;
  consumedTotal: number;
  rejectedTotal: number;
  nextEligibleAtMs: number;
}

export interface FixedWindowSnapshot {
  key: string;
  policyId: string;
  windowStartMs: number;
  windowMs: number;
  used: number;
  limit: number;
  rejectedTotal: number;
}

export interface SlidingWindowSnapshot {
  key: string;
  policyId: string;
  kind: "log" | "counter_approx";
  windowMs: number;
  limit: number;
  currentCount: number;
  previousCount: number;
  effectiveCount: number;
  activeTimestampCount: number;
  rejectedTotal: number;
}

export interface LeakyBucketSnapshot {
  key: string;
  policyId: string;
  capacity: number;
  queuedCount: number;
  drainRatePerSecond: number;
  lastDrainAtMs: number;
  drainedTotal: number;
  overflowRejectedTotal: number;
}

export interface LimiterInstanceState {
  instanceKey: string;
  policyId: string;
  label: string;
  algorithm: TrafficControlAlgorithm;
  scope: TrafficControlScope;
  tokenBucket?: TokenBucketSnapshot;
  fixedWindow?: FixedWindowSnapshot;
  slidingWindow?: SlidingWindowSnapshot;
  leakyBucket?: LeakyBucketSnapshot;
}

export interface DistributedGatewayRuntime {
  id: string;
  label: string;
  clockOffsetMs: number;
  allocatedQuota: number;
  localUsed: number;
  syncedGlobalEstimate: number;
  requestsHandled: number;
  rejected: number;
}

export interface TenantFairnessRuntime {
  tenantId: string;
  offered: number;
  admitted: number;
  rejected: number;
  completed: number;
  totalWaitMs: number;
  avgWaitMs: number;
  capacitySharePct: number;
  starving: boolean;
}

export interface BackpressureRuntime {
  active: boolean;
  level: number;
  sourceComponent: string;
  targetComponent: string;
  signalType: "slow_producer" | "pause_producer" | "reduce_dispatch" | "none";
  triggerThreshold: number;
  recoveryThreshold: number;
  producerRateMultiplier: number;
  activatedCount: number;
}

export interface TrafficControlInvariantReport {
  allPassed: boolean;
  tokenBoundsOk: boolean;
  windowBoundsOk: boolean;
  queueBoundsOk: boolean;
  concurrencyBoundsOk: boolean;
  permitsBalancedOk: boolean;
  atomicMultiPolicyOk: boolean;
  expiredNotExecutedOk: boolean;
  retryBudgetRespectedOk: boolean;
  circuitTransitionsOk: boolean;
  violations: string[];
}

export interface TrafficControlMetrics {
  offeredRequests: number;
  originalRequests: number;
  retryAttempts: number;
  admittedRequests: number;
  completedRequests: number;
  failedExecutions: number;
  rateLimitRejections: number;
  concurrencyRejections: number;
  queueOverflows: number;
  loadShedCount: number;
  circuitRejections: number;
  timeoutCount: number;
  cancelledCount: number;
  suppressedRetries: number;
  offeredRatePerSec: number;
  admittedRatePerSec: number;
  completedThroughputPerSec: number;
  rejectionRatePct: number;
  activeConcurrency: number;
  effectiveMaxConcurrent: number;
  queueDepth: number;
  maxObservedQueueDepth: number;
  avgQueueWaitMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  retryAmplification: number;
  utilizationPct: number;
}

export interface ModeledTrafficControlRuntimeState {
  virtualTimeMs: number;
  evaluationMode: PolicyEvaluationMode;
  distributedMode: DistributedLimiterMode;
  centralStoreOnline: boolean;
  failBehavior: FailBehavior;
  limiters: Record<string, LimiterInstanceState>;
  gateways: Record<string, DistributedGatewayRuntime>;
  concurrency: {
    maxConcurrent: number;
    effectiveMaxConcurrent: number;
    adaptiveEnabled: boolean;
    activeRequestIds: string[];
    waitingRequestIds: string[];
    permitsAcquired: number;
    permitsReleased: number;
  };
  queue: {
    capacity: number;
    policy: QueueSchedulingPolicy;
    depth: number;
    items: Array<{
      id: string;
      tenantId: string;
      priority: PriorityClass;
      enqueuedAtMs: number;
      deadlineMs?: number;
    }>;
    expiredCount: number;
    overflowCount: number;
    avgWaitMs: number;
    p50WaitMs: number;
    p95WaitMs: number;
    maxWaitMs: number;
  };
  backpressure: BackpressureRuntime;
  loadShedding: {
    enabled: boolean;
    active: boolean;
    policy: string;
    triggerReason: string;
    shedCount: number;
  };
  retryBudget: {
    enabled: boolean;
    remaining: number;
    usedRetries: number;
    suppressedRetries: number;
  };
  circuitBreaker: {
    enabled: boolean;
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    failureCount: number;
    tripCount: number;
    nextProbeAtMs: number | null;
  };
  tenantFairness: Record<string, TenantFairnessRuntime>;
  recentRequests: SyntheticRequestRuntime[];
  littlesLaw: {
    avgInSystemL: number;
    throughputPerSecLambda: number;
    avgSystemTimeSecW: number;
    steadyStateCaveat: string;
  };
  consistencyCaveats: string[];
  invariants: TrafficControlInvariantReport;
  metrics: TrafficControlMetrics;
}

