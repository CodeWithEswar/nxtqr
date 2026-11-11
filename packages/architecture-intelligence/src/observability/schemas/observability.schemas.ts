import { z } from "zod";

export const TelemetrySourceTypeSchema = z.enum([
  "prometheus",
  "opentelemetry",
  "grafana",
  "datadog",
  "cloudwatch",
  "mock",
]);

export const TelemetryCapabilitySchema = z.enum([
  "metrics",
  "traces",
  "logs",
  "service_discovery",
]);

export const ConnectionStatusSchema = z.enum([
  "active",
  "testing",
  "unreachable",
  "auth_failed",
  "disabled",
]);

export const ServiceIdentitySchema = z.object({
  serviceName: z.string().min(1),
  namespace: z.string().optional(),
  environment: z.string().optional(),
  cluster: z.string().optional(),
  region: z.string().optional(),
});

export const TelemetryConnectionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  sourceType: TelemetrySourceTypeSchema,
  endpointUrl: z.string().url(),
  capabilities: z.array(TelemetryCapabilitySchema),
  status: ConnectionStatusSchema,
  authType: z.enum(["none", "bearer_token", "basic_auth", "api_key", "custom_header"]),
  headerName: z.string().optional(),
  rateLimitRps: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().max(30000).optional(),
  lastTestedAt: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MappingConfidenceSchema = z.enum([
  "confirmed",
  "suggested",
  "ambiguous",
  "unmapped",
  "stale",
]);

export const TelemetryServiceMappingSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  componentId: z.string().min(1),
  connectionId: z.string().min(1),
  serviceIdentity: ServiceIdentitySchema,
  confidence: MappingConfidenceSchema,
  evidenceScore: z.number().min(0).max(1),
  evidenceReasons: z.array(z.string()).default([]),
  lastVerifiedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TimeRangeSchema = z.object({
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  stepSeconds: z.number().int().positive().default(60),
  preset: z.enum(["15m", "1h", "6h", "24h", "7d", "custom"]).optional(),
});

export const MetricQueryRequestSchema = z.object({
  connectionId: z.string().min(1),
  queryExpression: z.string().min(1),
  timeRange: TimeRangeSchema,
  componentId: z.string().optional(),
  metricCategory: z.enum(["throughput", "latency", "error_rate", "saturation", "custom"]).optional(),
});

export const TraceQueryRequestSchema = z.object({
  connectionId: z.string().min(1),
  serviceName: z.string().optional(),
  operationName: z.string().optional(),
  minDurationMs: z.number().nonnegative().optional(),
  hasErrors: z.boolean().optional(),
  timeRange: TimeRangeSchema,
  limit: z.number().int().positive().max(100).default(20),
});

export const LogQueryRequestSchema = z.object({
  connectionId: z.string().min(1),
  serviceName: z.string().optional(),
  traceId: z.string().optional(),
  searchFilter: z.string().optional(),
  severityLevels: z.array(z.enum(["debug", "info", "warn", "error", "fatal"])).optional(),
  timeRange: TimeRangeSchema,
  limit: z.number().int().positive().max(200).default(50),
});

export const SloDefinitionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  componentId: z.string().min(1),
  name: z.string().min(1),
  indicator: z.enum(["availability", "latency", "error_rate"]),
  targetThreshold: z.number().nonnegative(),
  targetPercentage: z.number().min(0).max(100),
  windowDays: z.number().int().positive().default(30),
  createdAt: z.string(),
  updatedAt: z.string(),
});
