import { z } from "zod";

export const WorkloadUnitSchema = z.enum([
  "req/s",
  "ops/s",
  "msg/s",
  "bytes/s",
  "kb/s",
  "mb/s",
  "concurrency",
  "connections",
  "ms",
  "s",
  "percent",
  "ratio",
]);

export const WorkloadAssumptionSchema = z.object({
  id: z.string(),
  targetComponentId: z.string().optional(),
  name: z.string(),
  metric: z.string(),
  value: z.number().nonnegative(),
  unit: z.string(),
  source: z.enum(["user", "imported", "scenario", "derived"]),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  explanation: z.string().optional(),
});

export const ComponentWorkloadConfigSchema = z.object({
  declaredCapacityRps: z.number().nonnegative().optional(),
  declaredCapacityOps: z.number().nonnegative().optional(),
  declaredCapacityMsgPerSec: z.number().nonnegative().optional(),
  declaredBandwidthMbps: z.number().nonnegative().optional(),
  processingTimeMs: z.number().nonnegative().optional(),
  concurrencyLimit: z.number().nonnegative().optional(),
  connectionPoolSize: z.number().nonnegative().optional(),
  rateLimitRps: z.number().nonnegative().optional(),
  cacheHitRate: z.number().min(0).max(1).optional(),
  cacheTtlSeconds: z.number().nonnegative().optional(),
});

export const WorkloadScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  isDefault: z.boolean().optional(),
  parameters: z.object({
    activeUsers: z.number().nonnegative().optional(),
    concurrentUsers: z.number().nonnegative().optional(),
    ingressRps: z.number().nonnegative(),
    peakMultiplier: z.number().min(0.1),
    readRatio: z.number().min(0).max(1),
    avgRequestSizeBytes: z.number().nonnegative(),
    avgResponseSizeBytes: z.number().nonnegative(),
    cacheHitRate: z.number().min(0).max(1),
    fanOutFactor: z.number().nonnegative().optional(),
    retryAmplificationFactor: z.number().min(1).optional(),
    componentAssumptions: z.record(ComponentWorkloadConfigSchema).optional(),
  }),
});

export const CalculationReferenceSchema = z.object({
  formula: z.string(),
  variables: z.record(z.union([z.number(), z.string()])),
  result: z.union([z.number(), z.string()]),
  unit: z.string(),
  explanation: z.string(),
});

export const BottleneckTypeSchema = z.enum([
  "service_saturation",
  "queue_backlog",
  "database_contention",
  "cache_miss_amplification",
  "network_bandwidth",
  "external_quota",
  "latency_critical_path",
  "fan_out_amplification",
]);

export const BottleneckFindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  bottleneckType: BottleneckTypeSchema,
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  title: z.string(),
  explanation: z.string(),
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  evidence: z.array(z.any()),
  assumptions: z.array(z.string()),
  calculations: z.array(CalculationReferenceSchema),
  recommendations: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  tradeOffs: z.array(z.string()),
});
