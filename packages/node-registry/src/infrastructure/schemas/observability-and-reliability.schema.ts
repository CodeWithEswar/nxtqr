import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Monitoring Service
export const MonitoringServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("monitoring-service"),
  monitoringScope: z
    .enum(["infrastructure-hosts", "cloud-managed-services", "hybrid-cluster", "synthetic-endpoints"])
    .default("hybrid-cluster"),
  targetTypes: z
    .array(z.enum(["servers", "containers", "databases", "queues", "load-balancers", "apis"]))
    .default(["servers", "containers", "databases"]),
  collectionStrategy: z
    .enum(["agent-daemon", "cloud-api-polling", "push-telemetry", "synthetic-probing"])
    .default("agent-daemon"),
  evaluationIntervalSeconds: z.number().int().min(1).max(3600).default(60),
  retentionDays: z.number().int().min(1).max(730).default(90),
  alertingIntegration: z.boolean().default(true),
  monitoredTargetCount: z.number().int().min(1).max(50000).default(120),
});
export type MonitoringServiceConfig = z.infer<typeof MonitoringServiceConfigSchema>;

// 02 — Metrics Collector
export const MetricsCollectorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("metrics-collector"),
  collectionMode: z
    .enum(["pull-scrape", "push-otlp", "statsd-daemon", "hybrid-mesh"])
    .default("pull-scrape"),
  scrapeIntervalSeconds: z.number().int().min(1).max(300).default(15),
  metricsProtocol: z
    .enum(["prometheus-text", "otlp-grpc", "otlp-http", "statsd", "influx-line"])
    .default("otlp-grpc"),
  metricTypes: z
    .array(z.enum(["counter", "gauge", "histogram", "summary"]))
    .default(["counter", "gauge", "histogram"]),
  cardinalityLimit: z.number().int().min(1000).max(10000000).default(100000),
  batchTimeoutMs: z.number().int().min(10).max(60000).default(5000),
  samplesPerSecondAssumption: z.string().default("25000 samples/sec"),
});
export type MetricsCollectorConfig = z.infer<typeof MetricsCollectorConfigSchema>;

// 03 — Log Collector
export const LogCollectorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("log-collector"),
  logSources: z
    .array(z.enum(["container-stdout", "system-journal", "application-file", "syslog-socket", "k8s-daemonset"]))
    .default(["container-stdout", "application-file"]),
  collectionMethod: z
    .enum(["file-tailing", "socket-listener", "api-pull"])
    .default("file-tailing"),
  logFormat: z
    .enum(["json-structured", "logfmt", "raw-text", "w3c-common", "regex-parsed"])
    .default("json-structured"),
  bufferSizeBytes: z.number().int().min(1048576).max(1073741824).default(33554432),
  batchSize: z.number().int().min(10).max(10000).default(500),
  backpressurePolicy: z
    .enum(["drop-oldest", "block-producer", "disk-spillover"])
    .default("disk-spillover"),
  assumedVolumeGbDay: z.number().min(0.1).max(10000).default(50),
});
export type LogCollectorConfig = z.infer<typeof LogCollectorConfigSchema>;

// 04 — Log Aggregator
export const LogAggregatorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("log-aggregator"),
  ingestionProtocol: z
    .enum(["loki-push", "elasticsearch-bulk", "opensearch-http", "kafka-stream"])
    .default("loki-push"),
  indexingStrategy: z
    .enum(["label-index-only", "full-text-inverted", "columnar-chunked"])
    .default("label-index-only"),
  retentionDays: z.number().int().min(1).max(1825).default(30),
  storageBackend: z
    .enum(["object-storage-s3", "block-volume-ssd", "distributed-fs", "cold-tier-archive"])
    .default("object-storage-s3"),
  compressionAlgorithm: z.enum(["zstd", "snappy", "gzip", "lz4"]).default("zstd"),
  dataRedactionPolicy: z.enum(["pii-and-secrets", "strict-regex", "none"]).default("pii-and-secrets"),
  ingestionRateAssumption: z.string().default("50 MB/sec"),
});
export type LogAggregatorConfig = z.infer<typeof LogAggregatorConfigSchema>;

// 05 — Distributed Tracing
export const DistributedTracingConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("distributed-tracing"),
  tracePropagationFormat: z
    .enum(["w3c-tracecontext", "b3-multi", "b3-single", "jaeger-native"])
    .default("w3c-tracecontext"),
  samplingStrategy: z
    .enum(["head-probabilistic", "tail-based-latency", "adaptive-throughput", "always-on"])
    .default("tail-based-latency"),
  samplingRatePercent: z.number().min(0.01).max(100).default(5),
  traceRetentionDays: z.number().int().min(1).max(90).default(7),
  storageBackend: z
    .enum(["tempo-object-storage", "jaeger-opensearch", "clickhouse", "memory-ring"])
    .default("tempo-object-storage"),
  serviceMapGeneration: z.boolean().default(true),
  spansPerSecondAssumption: z.string().default("10000 spans/sec"),
});
export type DistributedTracingConfig = z.infer<typeof DistributedTracingConfigSchema>;

// 06 — Alert Manager
export const AlertManagerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("alert-manager"),
  alertSources: z
    .array(z.enum(["prometheus-rules", "cloud-alarms", "log-thresholds", "apm-anomalies", "synthetic-probes"]))
    .default(["prometheus-rules", "apm-anomalies"]),
  severityModel: z
    .enum(["critical-warning-info", "p1-p4-incident", "binary-page-ticket"])
    .default("critical-warning-info"),
  groupWaitSeconds: z.number().int().min(1).max(300).default(30),
  groupIntervalMinutes: z.number().int().min(1).max(60).default(5),
  repeatIntervalHours: z.number().int().min(1).max(168).default(4),
  deduplication: z.boolean().default(true),
  escalationPolicy: z
    .enum(["on-call-rotation", "broadcast-all", "tiered-escalation"])
    .default("tiered-escalation"),
});
export type AlertManagerConfig = z.infer<typeof AlertManagerConfigSchema>;

// 07 — Health Check Service
export const HealthCheckServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("health-check-service"),
  checkType: z
    .enum(["http-get", "tcp-socket", "tls-handshake", "grpc-health-v1", "synthetic-workflow"])
    .default("http-get"),
  checkIntervalSeconds: z.number().int().min(1).max(300).default(10),
  timeoutSeconds: z.number().int().min(1).max(30).default(3),
  expectedHttpStatus: z.number().int().min(100).max(599).default(200),
  unhealthyThreshold: z.number().int().min(1).max(10).default(3),
  healthyThreshold: z.number().int().min(1).max(10).default(2),
  multiRegionProbes: z.boolean().default(true),
  availabilityTargetPercent: z.number().min(90).max(99.999).default(99.95),
});
export type HealthCheckServiceConfig = z.infer<typeof HealthCheckServiceConfigSchema>;

// 08 — Error Tracker
export const ErrorTrackerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("error-tracker"),
  errorSources: z
    .array(z.enum(["frontend-browser", "mobile-app", "backend-service", "serverless-function", "worker-job"]))
    .default(["frontend-browser", "backend-service"]),
  captureStrategy: z
    .enum(["unhandled-exceptions", "breadcrumbs-and-errors", "all-logged-errors"])
    .default("breadcrumbs-and-errors"),
  groupingHeuristic: z
    .enum(["fingerprint-stacktrace", "exception-type-and-message", "custom-tag-rules"])
    .default("fingerprint-stacktrace"),
  releaseTracking: z.boolean().default(true),
  piiScrubbing: z.boolean().default(true),
  retentionDays: z.number().int().min(7).max(365).default(90),
  sampleRatePercent: z.number().min(1).max(100).default(100),
});
export type ErrorTrackerConfig = z.infer<typeof ErrorTrackerConfigSchema>;

// 09 — APM Service
export const ApmServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("apm-service"),
  instrumentationMethod: z
    .enum(["bytecode-auto-agent", "opentelemetry-sdk", "ebpf-kernel-probe", "sidecar-proxy"])
    .default("opentelemetry-sdk"),
  targetRuntime: z
    .enum(["nodejs", "jvm", "golang", "python", "dotnet", "polyglot"])
    .default("polyglot"),
  targetP99LatencyMs: z.number().int().min(1).max(10000).default(250),
  targetApdexScore: z.number().min(0.5).max(1.0).default(0.95),
  databaseQueryProfiling: z.boolean().default(true),
  serviceDependencyMapping: z.boolean().default(true),
  profilingIntervalSeconds: z.number().int().min(10).max(600).default(60),
});
export type ApmServiceConfig = z.infer<typeof ApmServiceConfigSchema>;

// 10 — Status Page
export const StatusPageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("status-page"),
  visibility: z.enum(["public-global", "internal-private", "customer-authenticated"]).default("public-global"),
  updateSource: z
    .enum(["automated-alertmanager", "manual-incident-command", "hybrid-automated"])
    .default("hybrid-automated"),
  historyRetentionMonths: z.number().int().min(1).max(60).default(12),
  customDomainEnabled: z.boolean().default(true),
  subscriberNotificationChannels: z
    .array(z.enum(["email", "sms", "webhook", "rss", "slack"]))
    .default(["email", "webhook"]),
  maintenanceWindowSupport: z.boolean().default(true),
});
export type StatusPageConfig = z.infer<typeof StatusPageConfigSchema>;

