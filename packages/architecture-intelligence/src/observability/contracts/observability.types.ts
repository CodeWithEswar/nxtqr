export type TelemetrySourceType =
  | "prometheus"
  | "opentelemetry"
  | "grafana"
  | "datadog"
  | "cloudwatch"
  | "mock";

export type TelemetryCapability =
  | "metrics"
  | "traces"
  | "logs"
  | "service_discovery";

export type ConnectionStatus =
  | "active"
  | "testing"
  | "unreachable"
  | "auth_failed"
  | "disabled";

export interface TelemetryConnection {
  id: string;
  projectId: string;
  name: string;
  sourceType: TelemetrySourceType;
  endpointUrl: string;
  capabilities: TelemetryCapability[];
  status: ConnectionStatus;
  authType: "none" | "bearer_token" | "basic_auth" | "api_key" | "custom_header";
  headerName?: string;
  // Note: secrets remain server-side only; client receives hasSecret flag
  hasSecret?: boolean;
  rateLimitRps?: number;
  timeoutMs?: number;
  lastTestedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceIdentity {
  serviceName: string;
  namespace?: string;
  environment?: string;
  cluster?: string;
  region?: string;
}

export interface DiscoveredService {
  connectionId: string;
  serviceIdentity: ServiceIdentity;
  displayName: string;
  detectedProtocols: string[];
  metricsCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export type MappingConfidence =
  | "confirmed"
  | "suggested"
  | "ambiguous"
  | "unmapped"
  | "stale";

export interface TelemetryServiceMapping {
  id: string;
  projectId: string;
  architectureId: string;
  componentId: string;
  connectionId: string;
  serviceIdentity: ServiceIdentity;
  confidence: MappingConfidence;
  evidenceScore: number; // 0.0 to 1.0
  evidenceReasons: string[];
  lastVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type MetricType = "counter" | "gauge" | "histogram" | "summary";

export interface MetricDataPoint {
  timestampMs: number;
  value: number;
}

export interface MetricSeries {
  metricName: string;
  metricType: MetricType;
  unit: string; // "rps", "ms", "percent", "bytes", "count", "gauge"
  labels: Record<string, string>;
  datapoints: MetricDataPoint[];
}

export interface TimeRange {
  startMs: number;
  endMs: number;
  stepSeconds: number;
  preset?: "15m" | "1h" | "6h" | "24h" | "7d" | "custom";
}

export interface MetricQueryRequest {
  connectionId: string;
  queryExpression: string;
  timeRange: TimeRange;
  componentId?: string;
  metricCategory?: "throughput" | "latency" | "error_rate" | "saturation" | "custom";
}

export interface TelemetryProvenance {
  connectionId: string;
  sourceType: TelemetrySourceType;
  endpointUrl: string;
  queryIdentifier: string;
  requestedRange: { startMs: number; endMs: number };
  returnedRange: { startMs: number; endMs: number };
  collectedAt: string;
  samplingRatio?: number;
  unit: string;
}

export interface DataQualityReport {
  missingSamplesCount: number;
  isSparse: boolean;
  clockSkewMs: number;
  samplingRatio: number;
  qualityScore: number; // 0 - 100
  notes: string[];
}

export interface MetricQueryResult {
  request: MetricQueryRequest;
  series: MetricSeries[];
  provenance: TelemetryProvenance;
  dataQuality: DataQualityReport;
  executionDurationMs: number;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceName: string;
  operationName: string;
  startTimeMs: number;
  durationMs: number;
  statusCode: "ok" | "error" | "unset";
  statusMessage?: string;
  attributes: Record<string, string | number | boolean>;
  componentId?: string;
  isCriticalPath?: boolean;
}

export interface TraceQueryRequest {
  connectionId: string;
  serviceName?: string;
  operationName?: string;
  minDurationMs?: number;
  hasErrors?: boolean;
  timeRange: TimeRange;
  limit?: number;
}

export interface TraceQueryResult {
  traceId: string;
  rootSpan?: TraceSpan;
  spans: TraceSpan[];
  totalDurationMs: number;
  servicesInvolved: string[];
  componentsInvolved: string[];
  hasErrors: boolean;
  criticalPathDurationMs: number;
}

export interface StructuredLogEntry {
  id: string;
  timestampMs: number;
  serviceName: string;
  severity: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  traceId?: string;
  spanId?: string;
  attributes: Record<string, string | number | boolean>;
  componentId?: string;
}

export interface LogQueryRequest {
  connectionId: string;
  serviceName?: string;
  traceId?: string;
  searchFilter?: string;
  severityLevels?: Array<"debug" | "info" | "warn" | "error" | "fatal">;
  timeRange: TimeRange;
  limit?: number;
}

export interface LogQueryResult {
  entries: StructuredLogEntry[];
  totalMatched: number;
  severityCounts: Record<string, number>;
}

export type ServiceHealthState = "healthy" | "degraded" | "critical" | "unknown";

export interface ServiceHealthIndicator {
  componentId: string;
  serviceName: string;
  state: ServiceHealthState;
  freshnessStatus: "fresh" | "stale" | "missing";
  latestSampleTimestampMs?: number;
  metrics: {
    rps?: number;
    errorRatePct?: number;
    p50LatencyMs?: number;
    p95LatencyMs?: number;
    p99LatencyMs?: number;
    cpuSaturationPct?: number;
    memorySaturationPct?: number;
    queueBacklog?: number;
  };
  reasons: string[];
}

export type SloIndicatorType = "availability" | "latency" | "error_rate";

export interface SloDefinition {
  id: string;
  projectId: string;
  architectureId: string;
  componentId: string;
  name: string;
  indicator: SloIndicatorType;
  targetThreshold: number; // e.g. 99.9% availability, or 200ms latency, or 1% error rate
  targetPercentage: number; // e.g. 99.9%
  windowDays: number; // e.g. 30 days
  createdAt: string;
  updatedAt: string;
}

export interface SloEvaluation {
  slo: SloDefinition;
  currentObservedValue: number;
  currentCompliancePct: number;
  consumedErrorBudgetPct: number;
  remainingErrorBudgetPct: number;
  isCompliant: boolean;
  status: "healthy" | "warning" | "breached";
}

export type TopologyDriftType =
  | "unmapped_dependency"
  | "unexpected_traffic"
  | "missing_modeled_traffic"
  | "missing_telemetry";

export interface TopologyDriftFinding {
  id: string;
  type: TopologyDriftType;
  severity: "critical" | "high" | "medium" | "low";
  sourceComponentId?: string;
  targetComponentId?: string;
  observedServiceName?: string;
  title: string;
  explanation: string;
  evidence: string;
  suggestedAction: string;
}

export interface ObservedVsModeledComparison {
  componentId: string;
  componentLabel: string;
  modeledRps?: number;
  observedRps?: number;
  rpsDeltaPct?: number;
  modeledLatencyP95Ms?: number;
  observedLatencyP95Ms?: number;
  latencyDeltaPct?: number;
  modeledBottleneck: boolean;
  observedSaturation: boolean;
  calibrationSuggestions: string[];
}

export interface ObservabilityFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "latency" | "error_rate" | "saturation" | "drift" | "slo" | "freshness";
  componentId: string;
  componentLabel: string;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
}
