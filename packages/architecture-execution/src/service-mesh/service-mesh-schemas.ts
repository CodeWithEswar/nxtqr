import { z } from "zod";

export const MeshProtocolSchema = z.enum(["http", "grpc"]);
export type MeshProtocol = z.infer<typeof MeshProtocolSchema>;

export const MeshProxyModeSchema = z.enum(["sidecar", "ambient", "disabled"]);
export type MeshProxyMode = z.infer<typeof MeshProxyModeSchema>;

export const MeshLoadBalancingStrategySchema = z.enum([
  "round_robin",
  "weighted_round_robin",
  "least_active",
  "deterministic_random",
  "consistent_hash",
]);
export type MeshLoadBalancingStrategy = z.infer<
  typeof MeshLoadBalancingStrategySchema
>;

export const MeshFallbackModeSchema = z.enum([
  "none",
  "cached",
  "partial",
  "skip_optional",
  "static",
  "fail",
]);
export type MeshFallbackMode = z.infer<typeof MeshFallbackModeSchema>;

export const MeshDependencyEdgeSchema = z.object({
  targetServiceId: z.string().min(1),
  operation: z.string().min(1).default("call"),
  protocol: MeshProtocolSchema.default("http"),
  required: z.boolean().default(true),
  parallelGroup: z.string().optional(),
  fallbackMode: MeshFallbackModeSchema.default("none"),
});
export type MeshDependencyEdge = z.infer<typeof MeshDependencyEdgeSchema>;

export const MeshServiceDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  namespace: z.string().min(1).default("production"),
  protocol: MeshProtocolSchema.default("http"),
  proxyMode: MeshProxyModeSchema.default("sidecar"),
  identity: z.string().min(1),
  defaultTimeoutMs: z.number().int().positive().default(1000),
  baseProcessingMs: z.number().min(0).default(25),
  dependencies: z.array(MeshDependencyEdgeSchema).default([]),
  operations: z.array(z.string()).default(["GET /", "POST /execute"]),
  fallbackMode: MeshFallbackModeSchema.default("none"),
});
export type MeshServiceDefinition = z.infer<typeof MeshServiceDefinitionSchema>;

export const MeshServiceInstanceConfigSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  revision: z.string().min(1).default("v1"),
  region: z.string().min(1).default("us-east"),
  weight: z.number().min(0).default(100),
  healthy: z.boolean().default(true),
  ready: z.boolean().default(true),
  capacityRps: z.number().int().positive().default(100),
  maxConcurrent: z.number().int().positive().default(16),
  baseLatencyMs: z.number().min(0).default(20),
  certificateValid: z.boolean().default(true),
  trustDomain: z.string().default("example.local"),
});
export type MeshServiceInstanceConfig = z.infer<
  typeof MeshServiceInstanceConfigSchema
>;

export const MeshProxyConfigSchema = z.object({
  id: z.string().min(1),
  mode: MeshProxyModeSchema.default("sidecar"),
  attachedServiceId: z.string().min(1),
  attachedInstanceId: z.string().optional(),
  healthy: z.boolean().default(true),
  proxyOverheadMs: z.number().min(0).default(3),
  maxConnections: z.number().int().positive().default(16),
  connectionTimeoutMs: z.number().int().positive().default(250),
});
export type MeshProxyConfig = z.infer<typeof MeshProxyConfigSchema>;

export const MeshDiscoveryConfigSchema = z.object({
  cacheEnabled: z.boolean().default(true),
  cacheTtlMs: z.number().int().min(0).default(5000),
  propagationDelayMs: z.number().int().min(0).default(0),
  lookupLatencyMs: z.number().min(0).default(2),
});
export type MeshDiscoveryConfig = z.infer<typeof MeshDiscoveryConfigSchema>;

export const MeshTrafficWeightSchema = z.object({
  revision: z.string().min(1),
  weight: z.number().min(0),
});
export type MeshTrafficWeight = z.infer<typeof MeshTrafficWeightSchema>;

export const MeshCanaryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  serviceId: z.string().min(1),
  stableRevision: z.string().default("v1"),
  canaryRevision: z.string().default("v2"),
  stagesPct: z.array(z.number().min(0).max(100)).default([5, 20, 50, 100]),
  evaluationIntervalMs: z.number().int().positive().default(400),
  minSamples: z.number().int().positive().default(5),
  maxErrorRatePct: z.number().min(0).max(100).default(20),
});
export type MeshCanaryConfig = z.infer<typeof MeshCanaryConfigSchema>;

export const MeshRoutingRuleSchema = z.object({
  id: z.string().min(1),
  destinationServiceId: z.string().min(1),
  matchHeaders: z.record(z.string()).default({}),
  matchPathPrefix: z.string().optional(),
  targetRevision: z.string().optional(),
  splits: z.array(MeshTrafficWeightSchema).default([]),
  loadBalancing: MeshLoadBalancingStrategySchema.default("round_robin"),
});
export type MeshRoutingRule = z.infer<typeof MeshRoutingRuleSchema>;

export const MeshRetryPolicySchema = z.object({
  enabled: z.boolean().default(false),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  initialBackoffMs: z.number().int().min(0).default(50),
  maxBackoffMs: z.number().int().min(0).default(400),
  exponentialFactor: z.number().min(1).default(2),
  jitterRatio: z.number().min(0).max(1).default(0.2),
  retryBudgetPct: z.number().min(1).max(2000).default(100),
  retryableHttpStatuses: z.array(z.number().int()).default([500, 502, 503, 504]),
  retryableGrpcStatuses: z
    .array(z.string())
    .default(["UNAVAILABLE", "DEADLINE_EXCEEDED", "RESOURCE_EXHAUSTED"]),
});
export type MeshRetryPolicy = z.infer<typeof MeshRetryPolicySchema>;

export const MeshCircuitBreakerPolicySchema = z.object({
  enabled: z.boolean().default(false),
  scope: z
    .enum(["destination_service", "destination_endpoint", "source_destination"])
    .default("destination_service"),
  rollingWindowMs: z.number().int().positive().default(10000),
  minimumRequests: z.number().int().positive().default(4),
  failureRateThresholdPct: z.number().min(1).max(100).default(50),
  openDurationMs: z.number().int().positive().default(1200),
  halfOpenProbeLimit: z.number().int().positive().default(2),
  successThreshold: z.number().int().positive().default(2),
});
export type MeshCircuitBreakerPolicy = z.infer<
  typeof MeshCircuitBreakerPolicySchema
>;

export const MeshBulkheadPolicySchema = z.object({
  enabled: z.boolean().default(false),
  maxActive: z.number().int().positive().default(3),
  queueCapacity: z.number().int().min(0).default(2),
  queueTimeoutMs: z.number().int().min(0).default(120),
});
export type MeshBulkheadPolicy = z.infer<typeof MeshBulkheadPolicySchema>;

export const MeshResiliencePolicyConfigSchema = z.object({
  serviceId: z.string().min(1),
  attemptTimeoutMs: z.number().int().positive().default(600),
  overallDeadlineMs: z.number().int().positive().default(1800),
  rateLimitRps: z.number().int().positive().optional(),
  retry: MeshRetryPolicySchema.default({}),
  circuitBreaker: MeshCircuitBreakerPolicySchema.default({}),
  bulkhead: MeshBulkheadPolicySchema.default({}),
});
export type MeshResiliencePolicyConfig = z.infer<
  typeof MeshResiliencePolicyConfigSchema
>;

export const MeshAuthorizationRuleSchema = z.object({
  id: z.string().min(1),
  sourceIdentityPattern: z.string().default("*"),
  destinationServiceId: z.string().min(1),
  operationPattern: z.string().default("*"),
  namespace: z.string().optional(),
  effect: z.enum(["allow", "deny"]).default("allow"),
});
export type MeshAuthorizationRule = z.infer<typeof MeshAuthorizationRuleSchema>;

export const MeshSecurityConfigSchema = z.object({
  mtlsMode: z.enum(["strict", "permissive", "disabled"]).default("strict"),
  trustDomain: z.string().default("example.local"),
  handshakeLatencyMs: z.number().min(0).default(4),
  defaultAllow: z.boolean().default(true),
  authorizationRules: z.array(MeshAuthorizationRuleSchema).default([]),
});
export type MeshSecurityConfig = z.infer<typeof MeshSecurityConfigSchema>;

export const MeshFailureInjectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "service_unavailable",
    "instance_crash",
    "proxy_failure",
    "latency_spike",
    "packet_loss",
    "connection_reset",
    "regional_outage",
    "cert_expired",
  ]),
  targetId: z.string().min(1),
  atMs: z.number().int().min(0),
  recoveryAtMs: z.number().int().min(0).optional(),
  addedLatencyMs: z.number().min(0).optional(),
  errorStatusCode: z.number().int().optional(),
  grpcErrorCode: z.string().optional(),
  description: z.string().default(""),
});
export type MeshFailureInjection = z.infer<typeof MeshFailureInjectionSchema>;

export const MeshWorkloadStepSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().int().min(0),
  entryServiceId: z.string().min(1),
  operation: z.string().default("GET /api/orders"),
  protocol: MeshProtocolSchema.default("http"),
  headers: z.record(z.string()).default({}),
  path: z.string().default("/api/orders"),
  concurrentCount: z.number().int().min(1).max(200).default(1),
});
export type MeshWorkloadStep = z.infer<typeof MeshWorkloadStepSchema>;

export const ServiceMeshScenarioSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  architectureRevisionId: z.string().default("rev-1"),
  presetId: z.string().optional(),
  seed: z.number().int().default(42),
  services: z.array(MeshServiceDefinitionSchema).min(1),
  instances: z.array(MeshServiceInstanceConfigSchema).min(1),
  proxies: z.array(MeshProxyConfigSchema).default([]),
  discovery: MeshDiscoveryConfigSchema.default({}),
  routing: z.array(MeshRoutingRuleSchema).default([]),
  resilience: z.array(MeshResiliencePolicyConfigSchema).default([]),
  security: MeshSecurityConfigSchema.default({}),
  canary: MeshCanaryConfigSchema.optional(),
  workload: z.array(MeshWorkloadStepSchema),
  failures: z.array(MeshFailureInjectionSchema).default([]),
  limits: z.object({
    maxRequests: z.number().int().positive().default(1000),
    maxAttemptsPerRequest: z.number().int().positive().default(10),
    maxEvents: z.number().int().positive().default(4000),
    maxVirtualDurationMs: z.number().int().positive().default(30000),
  }),
});
export type ServiceMeshScenario = z.infer<typeof ServiceMeshScenarioSchema>;

// Runtime Types

export interface MeshServiceInstanceRuntimeState {
  id: string;
  serviceId: string;
  revision: string;
  region: string;
  weight: number;
  healthy: boolean;
  ready: boolean;
  activeRequests: number;
  maxConcurrent: number;
  totalHandled: number;
  totalErrors: number;
  addedLatencyMs: number;
  certificateValid: boolean;
  lastUpdatedAtMs: number;
}

export interface MeshConnectionPoolState {
  targetServiceId: string;
  maxConnections: number;
  activeConnections: number;
  idleConnections: number;
  reusedCount: number;
  createdCount: number;
  rejectedCount: number;
}

export interface MeshProxyRuntimeState {
  id: string;
  mode: MeshProxyMode;
  attachedServiceId: string;
  healthy: boolean;
  inboundCount: number;
  outboundCount: number;
  activeRequests: number;
  pools: Record<string, MeshConnectionPoolState>;
}

export interface MeshCircuitBreakerState {
  policyId: string;
  scopeKey: string;
  serviceId: string;
  state: "closed" | "open" | "half_open";
  openedAtMs?: number;
  nextProbeAtMs?: number;
  recentOutcomes: Array<{ timestampMs: number; success: boolean }>;
  halfOpenActiveProbes: number;
  halfOpenSuccesses: number;
  rejectedCount: number;
  transitions: Array<{
    atMs: number;
    from: "closed" | "open" | "half_open";
    to: "closed" | "open" | "half_open";
    reason: string;
  }>;
}

export interface MeshBulkheadState {
  serviceId: string;
  maxActive: number;
  queueCapacity: number;
  activeCount: number;
  queuedCount: number;
  acquiredCount: number;
  rejectedCount: number;
}

export interface MeshDiscoveryCacheEntry {
  serviceId: string;
  endpointIds: string[];
  updatedAtMs: number;
  expiresAtMs: number;
  stale: boolean;
}

export interface MeshCanaryRuntimeState {
  serviceId: string;
  stableRevision: string;
  canaryRevision: string;
  currentStageIndex: number;
  currentCanaryPct: number;
  status: "active" | "promoted" | "rolled_back" | "paused";
  stableRequests: number;
  stableErrors: number;
  canaryRequests: number;
  canaryErrors: number;
  stableAvgLatencyMs: number;
  canaryAvgLatencyMs: number;
  lastEvaluatedAtMs: number;
  reason: string;
}

export interface MeshTraceSpan {
  spanId: string;
  parentSpanId?: string;
  traceId: string;
  sourceServiceId: string;
  destinationServiceId: string;
  instanceId?: string;
  proxyId?: string;
  operation: string;
  protocol: MeshProtocol;
  attempt: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  status: "ok" | "error" | "timeout" | "degraded" | "rejected";
  statusLabel: string;
  mtlsMs: number;
  queueWaitMs: number;
  processingMs: number;
  backoffMs: number;
  degradedFallbackUsed?: boolean;
  onCriticalPath?: boolean;
}

export interface MeshRequestSummary {
  requestId: string;
  traceId: string;
  entryServiceId: string;
  operation: string;
  protocol: MeshProtocol;
  atMs: number;
  totalDurationMs: number;
  criticalPathMs: number;
  attemptCount: number;
  status: "success" | "degraded" | "failed" | "rejected";
  statusCodeLabel: string;
  degradedReason?: string;
  spans: MeshTraceSpan[];
}

export interface MeshFailurePropagationNode {
  id: string;
  atMs: number;
  serviceId: string;
  stage: string;
  summary: string;
  causeNodeId?: string;
}

export interface MeshMetrics {
  totalRootRequests: number;
  totalServiceCalls: number;
  successCount: number;
  degradedCount: number;
  failedCount: number;
  timeoutCount: number;
  retryCount: number;
  retryAmplificationFactor: number;
  circuitRejectionCount: number;
  bulkheadRejectionCount: number;
  authDeniedCount: number;
  mtlsFailedCount: number;
  poolRejectedCount: number;
  fallbackCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
}

export interface ModeledServiceMeshRuntimeState {
  virtualTimeMs: number;
  topologyView: "logical" | "physical";
  instances: Record<string, MeshServiceInstanceRuntimeState>;
  proxies: Record<string, MeshProxyRuntimeState>;
  discoveryCache: Record<string, MeshDiscoveryCacheEntry>;
  circuits: Record<string, MeshCircuitBreakerState>;
  bulkheads: Record<string, MeshBulkheadState>;
  canary?: MeshCanaryRuntimeState;
  recentRequests: MeshRequestSummary[];
  failurePropagationChain: MeshFailurePropagationNode[];
  metrics: MeshMetrics;
}
