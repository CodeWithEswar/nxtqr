import { z } from "zod";

// ----------------------------------------------------------------------------
// 1. Traffic Profiles (Workload Shapes)
// ----------------------------------------------------------------------------

export const ConstantTrafficProfileSchema = z.object({
  type: z.literal("constant"),
  requestsPerSecond: z.number().min(1).max(100000).default(100),
});
export type ConstantTrafficProfile = z.infer<typeof ConstantTrafficProfileSchema>;

export const RampTrafficProfileSchema = z.object({
  type: z.literal("ramp"),
  startRps: z.number().min(1).max(50000).default(20),
  endRps: z.number().min(1).max(100000).default(500),
  durationMs: z.number().min(1000).max(120000).default(15000),
});
export type RampTrafficProfile = z.infer<typeof RampTrafficProfileSchema>;

export const BurstTrafficProfileSchema = z.object({
  type: z.literal("burst"),
  baselineRps: z.number().min(1).max(20000).default(50),
  burstRps: z.number().min(1).max(100000).default(800),
  startAtMs: z.number().min(0).default(3000),
  durationMs: z.number().min(500).max(60000).default(4000),
});
export type BurstTrafficProfile = z.infer<typeof BurstTrafficProfileSchema>;

export const StepTrafficProfileSchema = z.object({
  type: z.literal("step"),
  steps: z
    .array(
      z.object({
        atMs: z.number().min(0),
        rps: z.number().min(1).max(100000),
      })
    )
    .min(1),
});
export type StepTrafficProfile = z.infer<typeof StepTrafficProfileSchema>;

export const CustomTrafficProfileSchema = z.object({
  type: z.literal("custom"),
  points: z
    .array(
      z.object({
        atMs: z.number().min(0),
        requestsPerSecond: z.number().min(0).max(100000),
      })
    )
    .min(2),
});
export type CustomTrafficProfile = z.infer<typeof CustomTrafficProfileSchema>;

export const TrafficProfileSchema = z.discriminatedUnion("type", [
  ConstantTrafficProfileSchema,
  RampTrafficProfileSchema,
  BurstTrafficProfileSchema,
  StepTrafficProfileSchema,
  CustomTrafficProfileSchema,
]);
export type TrafficProfile = z.infer<typeof TrafficProfileSchema>;

// ----------------------------------------------------------------------------
// 2. Traffic Generation Mode & Virtual Users
// ----------------------------------------------------------------------------

export const TrafficGenerationModeSchema = z.enum(["open_loop", "closed_loop"]);
export type TrafficGenerationMode = z.infer<typeof TrafficGenerationModeSchema>;

export const VirtualUserConfigSchema = z.object({
  userCount: z.number().int().min(1).max(5000).default(50),
  thinkTimeMs: z.number().min(0).max(30000).default(500),
  maxRequestsPerUser: z.number().int().min(1).max(1000).optional(),
});
export type VirtualUserConfig = z.infer<typeof VirtualUserConfigSchema>;

export interface VirtualUser {
  id: string;
  activeRequestId: string | null;
  thinkTimeMs: number;
  completedRequests: number;
  failedRequests: number;
  nextScheduledArrivalMs: number;
}

// ----------------------------------------------------------------------------
// 3. Service Capacity & Instance Models
// ----------------------------------------------------------------------------

export const ProcessingDistributionSchema = z.enum(["constant", "uniform", "exponential"]);
export type ProcessingDistribution = z.infer<typeof ProcessingDistributionSchema>;

export const QueueAdmissionPolicySchema = z.enum(["reject_when_full", "wait", "drop_tail"]);
export type QueueAdmissionPolicy = z.infer<typeof QueueAdmissionPolicySchema>;

export const LoadBalancingStrategySchema = z.enum([
  "round_robin",
  "least_active",
  "weighted",
]);
export type LoadBalancingStrategy = z.infer<typeof LoadBalancingStrategySchema>;

export const ServiceCapacityConfigSchema = z.object({
  serviceNodeId: z.string().min(1),
  initialInstances: z.number().int().min(1).max(100).default(2),
  workersPerInstance: z.number().int().min(1).max(500).default(4),
  baseProcessingTimeMs: z.number().min(1).max(30000).default(50),
  processingDistribution: ProcessingDistributionSchema.default("constant"),
  queueCapacity: z.number().int().min(0).max(50000).default(100),
  admissionPolicy: QueueAdmissionPolicySchema.default("reject_when_full"),
  loadBalancing: LoadBalancingStrategySchema.default("round_robin"),
  instanceWeights: z.record(z.number().min(1)).optional(),
});
export type ServiceCapacityConfig = z.infer<typeof ServiceCapacityConfigSchema>;

export interface ServiceInstance {
  id: string;
  serviceNodeId: string;
  instanceIndex: number;
  workerCount: number;
  busyWorkers: number;
  activeRequests: number;
  status: "healthy" | "degraded" | "unavailable";
  createdAtMs: number;
  terminatedAtMs?: number;
}

export interface ModeledTrafficQueue {
  nodeId: string;
  capacity: number;
  waitingCount: number;
  rejectedCount: number;
  totalEnqueuedCount: number;
  admissionPolicy: QueueAdmissionPolicy;
}

// ----------------------------------------------------------------------------
// 4. Rate Limiting & Backpressure
// ----------------------------------------------------------------------------

export const RateLimiterConfigSchema = z.object({
  nodeId: z.string().min(1),
  algorithm: z.enum(["token_bucket", "fixed_window"]).default("token_bucket"),
  capacity: z.number().int().min(1).max(100000).default(200),
  refillRatePerSec: z.number().min(0.1).max(100000).default(100),
  windowMs: z.number().int().min(100).max(60000).default(1000),
  rejectStatusCode: z.number().int().default(429),
});
export type RateLimiterConfig = z.infer<typeof RateLimiterConfigSchema>;

export interface ModeledRateLimiterState {
  nodeId: string;
  currentTokens: number;
  capacity: number;
  refillRatePerSec: number;
  lastRefillAtMs: number;
  totalAllowed: number;
  totalRejected: number;
}

// ----------------------------------------------------------------------------
// 5. Autoscaling Policies
// ----------------------------------------------------------------------------

export const AutoscalingPolicySchema = z.object({
  serviceNodeId: z.string().min(1),
  enabled: z.boolean().default(true),
  minInstances: z.number().int().min(1).max(50).default(2),
  maxInstances: z.number().int().min(2).max(100).default(8),
  scaleOutThresholdPercent: z.number().min(10).max(95).default(75), // target worker utilization %
  scaleInThresholdPercent: z.number().min(5).max(70).default(25),
  provisioningDelayMs: z.number().min(0).max(30000).default(1500),
  cooldownMs: z.number().min(500).max(60000).default(4000),
});
export type AutoscalingPolicy = z.infer<typeof AutoscalingPolicySchema>;

export interface AutoscalingState {
  serviceNodeId: string;
  currentInstances: number;
  targetInstances: number;
  pendingProvisionings: {
    instanceId: string;
    readyAtMs: number;
  }[];
  lastScaleActionAtMs: number;
}

// ----------------------------------------------------------------------------
// 6. Metrics & Performance Samples
// ----------------------------------------------------------------------------

export interface PerformanceSample {
  atMs: number;
  incomingRps: number;
  completedRps: number;
  successfulRps: number;
  failedRps: number;
  activeInFlight: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  meanLatencyMs: number;
  totalQueueDepth: number;
  componentUtilizations: Record<string, number>;
  componentQueueDepths: Record<string, number>;
  componentInstanceCounts: Record<string, number>;
}

export interface BottleneckEvidence {
  nodeId: string;
  nodeLabel: string;
  severity: "critical" | "warning" | "healthy";
  reason: string;
  utilizationPercent: number;
  queueDepth: number;
  rejectionCount: number;
  waitingTimeMs: number;
}

export interface PerformanceSummary {
  totalRequests: number;
  completedRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timedOutRequests: number;
  rejectedRequests: number;
  overallP50LatencyMs: number;
  overallP90LatencyMs: number;
  overallP95LatencyMs: number;
  overallP99LatencyMs: number;
  maxLatencyMs: number;
  meanLatencyMs: number;
  averageThroughputRps: number;
  peakThroughputRps: number;
  peakQueueDepth: number;
  averageUtilizationPercent: number;
  bottlenecks: BottleneckEvidence[];
  scalingEventsCount: number;
}

export interface SimulationComparison {
  baselineScenarioId: string;
  testScenarioId: string;
  baselineSummary: PerformanceSummary;
  testSummary: PerformanceSummary;
  throughputDeltaRps: number;
  p95LatencyDeltaMs: number;
  failedRequestsDelta: number;
  queueDepthDelta: number;
  utilizationDeltaPercent: number;
  summary: string;
}

// ----------------------------------------------------------------------------
// 7. Full Traffic Scenario Specification
// ----------------------------------------------------------------------------

export const TrafficScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  architectureRevisionId: z.string().optional(),
  entryNodeId: z.string().min(1),
  durationMs: z.number().int().min(1000).max(300000).default(15000),
  mode: TrafficGenerationModeSchema.default("open_loop"),
  workload: TrafficProfileSchema,
  virtualUsers: VirtualUserConfigSchema.optional(),
  capacities: z.record(ServiceCapacityConfigSchema).default({}),
  rateLimiters: z.record(RateLimiterConfigSchema).default({}),
  autoscaling: z.record(AutoscalingPolicySchema).default({}),
  seed: z.number().int().default(42),
  limits: z
    .object({
      maxRequests: z.number().int().min(10).max(100000).default(5000),
      maxEvents: z.number().int().min(100).max(200000).default(15000),
      maxVirtualDurationMs: z.number().int().min(1000).max(300000).default(60000),
      metricSamplingIntervalMs: z.number().int().min(100).max(5000).default(500),
    })
    .default({
      maxRequests: 5000,
      maxEvents: 15000,
      maxVirtualDurationMs: 60000,
      metricSamplingIntervalMs: 500,
    }),
});
export type TrafficScenario = z.infer<typeof TrafficScenarioSchema>;
