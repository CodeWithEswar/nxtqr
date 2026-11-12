import { z } from "zod";

// ----------------------------------------------------------------------------
// 1. Fault Types & Targets
// ----------------------------------------------------------------------------

export const FaultTypeSchema = z.enum([
  "component.outage",
  "component.degraded",
  "network.disconnected",
  "network.latency",
  "network.packet_loss",
  "request.timeout",
  "service.connection_refused",
  "service.transient_failure",
  "consumer.unavailable",
  "consumer.processing_failure",
]);
export type FaultType = z.infer<typeof FaultTypeSchema>;

export const FaultTargetTypeSchema = z.enum([
  "node",
  "edge",
  "port",
  "service_instance",
  "consumer",
  "queue",
  "request_class",
]);
export type FaultTargetType = z.infer<typeof FaultTargetTypeSchema>;

export const FaultTargetSchema = z.object({
  type: FaultTargetTypeSchema,
  targetId: z.string().min(1),
  targetLabel: z.string().optional(),
  port: z.number().int().optional(),
});
export type FaultTarget = z.infer<typeof FaultTargetSchema>;

export const FaultLifecycleSchema = z.enum([
  "scheduled",
  "active",
  "recovering",
  "resolved",
  "cancelled",
]);
export type FaultLifecycle = z.infer<typeof FaultLifecycleSchema>;

// ----------------------------------------------------------------------------
// 2. Type-Specific Fault Parameters
// ----------------------------------------------------------------------------

export const ComponentOutageParamsSchema = z.object({
  reason: z.string().default("Unscheduled hardware or process termination"),
  mode: z.enum(["complete", "drain"]).default("complete"),
});
export type ComponentOutageParams = z.infer<typeof ComponentOutageParamsSchema>;

export const ComponentDegradedParamsSchema = z.object({
  latencyMultiplier: z.number().min(1).max(50).default(3),
  extraDelayMs: z.number().min(0).max(10000).default(350),
  errorRate: z.number().min(0).max(1).default(0.4),
  capacityPercent: z.number().min(1).max(100).default(25),
});
export type ComponentDegradedParams = z.infer<typeof ComponentDegradedParamsSchema>;

export const NetworkDisconnectedParamsSchema = z.object({
  bidirectional: z.boolean().default(true),
  reason: z.string().default("Partitioned network transit link"),
});
export type NetworkDisconnectedParams = z.infer<typeof NetworkDisconnectedParamsSchema>;

export const NetworkLatencyParamsSchema = z.object({
  additionalLatencyMs: z.number().min(10).max(15000).default(800),
  jitterMs: z.number().min(0).max(2000).default(50),
});
export type NetworkLatencyParams = z.infer<typeof NetworkLatencyParamsSchema>;

export const NetworkPacketLossParamsSchema = z.object({
  lossRate: z.number().min(0.01).max(1).default(0.5),
  mode: z.enum(["request", "response", "both"]).default("both"),
});
export type NetworkPacketLossParams = z.infer<typeof NetworkPacketLossParamsSchema>;

export const RequestTimeoutParamsSchema = z.object({
  deadlineMs: z.number().min(50).max(60000).default(1200),
  cancelDownstream: z.boolean().default(true),
});
export type RequestTimeoutParams = z.infer<typeof RequestTimeoutParamsSchema>;

export const ServiceConnectionRefusedParamsSchema = z.object({
  port: z.number().int().default(8080),
  reason: z.string().default("Connection refused on target socket (RST)"),
});
export type ServiceConnectionRefusedParams = z.infer<typeof ServiceConnectionRefusedParamsSchema>;

export const ServiceTransientFailureParamsSchema = z.object({
  failureCount: z.number().int().min(1).max(10).default(2),
  errorStatus: z.number().int().default(503),
  reason: z.string().default("Temporary service throttling or upstream 503"),
});
export type ServiceTransientFailureParams = z.infer<typeof ServiceTransientFailureParamsSchema>;

export const ConsumerUnavailableParamsSchema = z.object({
  queueId: z.string().optional(),
  reason: z.string().default("Worker node offline / zero active consumer capacity"),
});
export type ConsumerUnavailableParams = z.infer<typeof ConsumerUnavailableParamsSchema>;

export const ConsumerProcessingFailureParamsSchema = z.object({
  queueId: z.string().optional(),
  nack: z.boolean().default(true),
  requeue: z.boolean().default(true),
  reason: z.string().default("Unhandled consumer execution exception"),
});
export type ConsumerProcessingFailureParams = z.infer<typeof ConsumerProcessingFailureParamsSchema>;

// ----------------------------------------------------------------------------
// 3. Unified Fault Definition
// ----------------------------------------------------------------------------

export const FaultDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: FaultTypeSchema,
  target: FaultTargetSchema,
  startAtMs: z.number().min(0).default(0),
  durationMs: z.number().min(50).optional(), // undefined = persists until simulation ends
  parameters: z.record(z.unknown()).default({}),
});
export type FaultDefinition = z.infer<typeof FaultDefinitionSchema>;

// ----------------------------------------------------------------------------
// 4. Resilience Policies (Retry, Circuit Breaker, Failover, Health Checks)
// ----------------------------------------------------------------------------

export const RetryPolicySchema = z.object({
  maxAttempts: z.number().int().min(1).max(10).default(3), // total attempts including first
  strategy: z.enum(["fixed", "exponential"]).default("exponential"),
  initialDelayMs: z.number().int().min(10).max(5000).default(150),
  maxDelayMs: z.number().int().min(100).max(30000).default(2500),
  multiplier: z.number().min(1).max(5).default(2),
  jitter: z.boolean().default(true),
  retryableFailures: z.array(z.string()).default([
    "timeout",
    "connection_refused",
    "network_disconnected",
    "packet_loss",
    "503",
    "504",
    "service_transient",
  ]),
  idempotent: z.boolean().default(true),
});
export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

export const CircuitBreakerStateSchema = z.enum(["closed", "open", "half-open"]);
export type CircuitBreakerState = z.infer<typeof CircuitBreakerStateSchema>;

export const CircuitBreakerPolicySchema = z.object({
  targetNodeId: z.string().min(1),
  failureThreshold: z.number().int().min(1).max(20).default(3),
  observationWindowMs: z.number().int().min(500).max(60000).default(10000),
  openDurationMs: z.number().int().min(500).max(60000).default(4000),
  halfOpenProbeLimit: z.number().int().min(1).max(5).default(1),
  successThreshold: z.number().int().min(1).max(5).default(2),
  fallbackAction: z.enum(["fail_fast", "cached_response", "static_default"]).default("fail_fast"),
  fallbackMessage: z.string().default("Service unavailable (circuit breaker open)"),
});
export type CircuitBreakerPolicy = z.infer<typeof CircuitBreakerPolicySchema>;

export const FailoverPolicySchema = z.object({
  primaryTargetId: z.string().min(1),
  secondaryTargetIds: z.array(z.string()).min(1),
  eligibilityConditions: z.array(z.string()).default(["target.healthy", "deadline.sufficient"]),
  healthCheckRequired: z.boolean().default(true),
  maxFailoverAttempts: z.number().int().min(1).max(5).default(2),
  recoveryPreference: z.enum(["revert_to_primary", "stick_to_secondary"]).default("revert_to_primary"),
});
export type FailoverPolicy = z.infer<typeof FailoverPolicySchema>;

export const HealthCheckConfigSchema = z.object({
  targetId: z.string().min(1),
  intervalMs: z.number().int().min(100).max(30000).default(1000),
  timeoutMs: z.number().int().min(50).max(10000).default(300),
  failureThreshold: z.number().int().min(1).max(10).default(3),
  recoveryThreshold: z.number().int().min(1).max(10).default(2),
  endpoint: z.string().default("/healthz"),
});
export type HealthCheckConfig = z.infer<typeof HealthCheckConfigSchema>;

export const RecoveryPolicySchema = z.object({
  faultId: z.string().min(1),
  type: z.enum(["auto_duration", "health_check", "manual"]).default("auto_duration"),
  durationMs: z.number().min(100).optional(),
  healthCheckConfig: HealthCheckConfigSchema.optional(),
});
export type RecoveryPolicy = z.infer<typeof RecoveryPolicySchema>;

// ----------------------------------------------------------------------------
// 5. Component & Network Runtime Conditions
// ----------------------------------------------------------------------------

export const ComponentHealthStatusSchema = z.enum([
  "healthy",
  "degraded",
  "unavailable",
  "recovering",
]);
export type ComponentHealthStatus = z.infer<typeof ComponentHealthStatusSchema>;

export interface ModeledComponentHealth {
  nodeId: string;
  status: ComponentHealthStatus;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureAtMs?: number;
  lastRecoveryAtMs?: number;
  activeFaultIds: string[];
}

export interface ModeledNetworkCondition {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  state: "connected" | "disconnected" | "degraded";
  baseLatencyMs: number;
  additionalLatencyMs: number;
  packetLossRate: number;
  activeFaultIds: string[];
}

// ----------------------------------------------------------------------------
// 6. Blast Radius & Resilience Metrics
// ----------------------------------------------------------------------------

export interface BlastRadiusReport {
  originFaultId: string;
  originFaultType: FaultType;
  originTargetId: string;
  directlyAffectedNodeIds: string[];
  directlyAffectedEdgeIds: string[];
  downstreamAffectedNodeIds: string[];
  downstreamAffectedEdgeIds: string[];
  impactedRequestIds: string[];
  impactedMessageIds: string[];
  propagationChain: {
    sequence: number;
    atMs: number;
    fromId: string;
    toId: string;
    impactType: "outage" | "timeout" | "retry" | "failover" | "circuit_trip" | "cascade_error";
    explanation: string;
  }[];
  causalDepth: number;
}

export interface ResilienceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timedOutRequests: number;
  retryAttempts: number;
  failoverAttempts: number;
  recoveredRequests: number;
  circuitTrips: number;
  meanRecoveryDurationMs: number;
  queueBacklog: number;
  deadLetterCount: number;
  criticalPathDelayMs: number;
  availabilityPercent: number;
}

export interface ScenarioComparison {
  baselineScenarioId: string;
  failureScenarioId: string;
  baselineMetrics: ResilienceMetrics;
  failureMetrics: ResilienceMetrics;
  availabilityDiffPercent: number;
  latencyDiffMs: number;
  additionalFailuresCount: number;
  additionalRetriesCount: number;
  unrecoveredRequestIds: string[];
  divergentSpans: {
    spanId: string;
    name: string;
    componentId: string;
    baselineDurationMs: number;
    failureDurationMs: number;
    baselineStatus: string;
    failureStatus: string;
    divergenceReason: string;
  }[];
  summary: string;
}

// ----------------------------------------------------------------------------
// 7. Full Failure Scenario Specification
// ----------------------------------------------------------------------------

export const FailureScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  architectureRevisionId: z.string().optional(),
  seed: z.number().int().default(42),
  faults: z.array(FaultDefinitionSchema).default([]),
  recoveryPolicies: z.array(RecoveryPolicySchema).default([]),
  retryPolicies: z.record(RetryPolicySchema).default({}),
  circuitBreakers: z.record(CircuitBreakerPolicySchema).default({}),
  failoverPolicies: z.record(FailoverPolicySchema).default({}),
  healthChecks: z.record(HealthCheckConfigSchema).default({}),
  limits: z.object({
    maxEvents: z.number().int().min(10).max(2000).default(300),
    maxVirtualDurationMs: z.number().int().min(1000).max(120000).default(45000),
    maxRetryAttempts: z.number().int().min(1).max(10).default(3),
  }).default({
    maxEvents: 300,
    maxVirtualDurationMs: 45000,
    maxRetryAttempts: 3,
  }),
});
export type FailureScenario = z.infer<typeof FailureScenarioSchema>;
