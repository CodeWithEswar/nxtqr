import { z } from "zod";

// ========================
// Enums & Primitives
// ========================

export const TelemetrySamplingModeSchema = z.enum([
  "none",
  "head",
  "rule_based",
  "tail",
]);
export type TelemetrySamplingMode = z.infer<typeof TelemetrySamplingModeSchema>;

export const MissingDataPolicySchema = z.enum([
  "no_data",
  "treat_healthy",
  "treat_breaching",
  "retain_previous",
]);
export type MissingDataPolicy = z.infer<typeof MissingDataPolicySchema>;

export const InvestigationViewModeSchema = z.enum([
  "investigation",
  "explanation",
]);
export type InvestigationViewMode = z.infer<typeof InvestigationViewModeSchema>;

export type AlertLifecycleState =
  | "INACTIVE"
  | "PENDING"
  | "FIRING"
  | "RECOVERING"
  | "RESOLVED";

export type IncidentLifecycleStatus =
  | "detected"
  | "investigating"
  | "mitigating"
  | "monitoring"
  | "resolved";

export type HypothesisStatus =
  | "candidate"
  | "supported"
  | "contradicted"
  | "verified";

// ========================
// Scenario Config Schemas
// ========================

export const ObservabilityServiceDepSchema = z.object({
  targetId: z.string().min(1),
  type: z.enum(["sync", "async", "storage"]).default("sync"),
  baseLatencyMs: z.number().min(1).max(2000).default(25),
  errorRateBase: z.number().min(0).max(1).default(0),
});

export const ObservabilityServiceConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  kind: z
    .enum(["gateway", "service", "queue", "database", "cache", "broker"])
    .default("service"),
  region: z.string().default("us-east-1"),
  zone: z.string().default("az-1"),
  version: z.string().default("v1.4.0"),
  capacityRps: z.number().min(1).max(10000).default(120),
  dependencies: z.array(ObservabilityServiceDepSchema).default([]),
});
export type ObservabilityServiceConfig = z.infer<
  typeof ObservabilityServiceConfigSchema
>;

export const ObservabilitySLOConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  sliType: z
    .enum(["availability", "latency", "job_success", "freshness"])
    .default("availability"),
  targetServiceId: z.string().min(1),
  target: z.number().min(0.5).max(0.99999).default(0.99),
  latencyThresholdMs: z.number().min(5).max(10000).optional(),
  windowMs: z.number().min(100).max(60000).default(1000),
  windowType: z.enum(["rolling", "calendar"]).default("rolling"),
});
export type ObservabilitySLOConfig = z.infer<typeof ObservabilitySLOConfigSchema>;

export const ObservabilityAlertRuleConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  serviceId: z.string().min(1),
  metric: z
    .enum([
      "error_rate",
      "p95_latency_ms",
      "saturation_pct",
      "burn_rate",
      "queue_depth",
    ])
    .default("error_rate"),
  operator: z.enum([">", ">="]).default(">"),
  threshold: z.number().default(0.05),
  evaluationIntervalMs: z.number().min(20).max(5000).default(80),
  pendingDurationMs: z.number().min(0).max(5000).default(80),
  recoveryDurationMs: z.number().min(0).max(5000).default(80),
  missingDataPolicy: MissingDataPolicySchema.default("no_data"),
});
export type ObservabilityAlertRuleConfig = z.infer<
  typeof ObservabilityAlertRuleConfigSchema
>;

export const ObservabilityFaultConfigSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "latency_spike",
    "error_surge",
    "cpu_saturation",
    "memory_pressure",
    "queue_backlog",
    "network_partition",
    "dns_failure",
    "cdn_origin_fail",
    "consumer_lag",
    "pod_crash",
    "retry_storm",
    "circuit_trip",
    "tx_blocking",
    "replica_lag",
    "rate_limit_spike",
    "load_shed",
    "deploy_regression",
  ]),
  targetServiceId: z.string().min(1),
  atMs: z.number().min(0),
  durationMs: z.number().min(10).optional(),
  latencyMultiplier: z.number().min(1).max(30).default(5),
  errorRate: z.number().min(0).max(1).default(0.35),
  saturationPct: z.number().min(0).max(100).default(92),
  description: z.string().default("Simulated fault injected"),
});
export type ObservabilityFaultConfig = z.infer<
  typeof ObservabilityFaultConfigSchema
>;

export const ObservabilityMitigationConfigSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().min(0),
  action: z.enum([
    "restart_component",
    "restore_network",
    "enable_load_shedding",
    "rollback_deploy",
    "scale_capacity",
    "open_circuit_breaker",
    "drain_queue",
  ]),
  targetServiceId: z.string().min(1),
  description: z.string().default("Simulated mitigation applied"),
});
export type ObservabilityMitigationConfig = z.infer<
  typeof ObservabilityMitigationConfigSchema
>;

export const ObservabilityScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  presetId: z.string().optional(),
  label: z.string().default("Observability Scenario"),
  architectureRevisionId: z.string().default("rev_001"),
  simulationRunId: z.string().default("sim_obs_001"),
  seed: z.number().int().default(42),
  investigationMode: InvestigationViewModeSchema.default("investigation"),
  telemetry: z.object({
    samplingMode: TelemetrySamplingModeSchema.default("none"),
    samplingRate: z.number().min(0.05).max(1).default(1),
    tailSlowThresholdMs: z.number().min(10).max(5000).default(120),
    logRetentionLimit: z.number().int().min(20).max(5000).default(250),
    droppedLogRate: z.number().min(0).max(0.95).default(0),
    delayedMetricMs: z.number().min(0).max(1000).default(0),
    collectorOutageWindow: z
      .object({
        startAtMs: z.number().min(0),
        endAtMs: z.number().min(1),
      })
      .optional(),
  }),
  services: z.array(ObservabilityServiceConfigSchema).min(1),
  entryServiceId: z.string().min(1),
  traffic: z.object({
    requestsPerSecond: z.number().min(1).max(500).default(20),
    startAtMs: z.number().min(0).default(0),
    endAtMs: z.number().min(50).default(700),
  }),
  faults: z.array(ObservabilityFaultConfigSchema).default([]),
  mitigations: z.array(ObservabilityMitigationConfigSchema).default([]),
  slos: z.array(ObservabilitySLOConfigSchema).default([]),
  alerts: z.array(ObservabilityAlertRuleConfigSchema).default([]),
  limits: z.object({
    maxTraces: z.number().int().min(1).max(2000).default(400),
    maxSpans: z.number().int().min(1).max(10000).default(2500),
    maxLogs: z.number().int().min(1).max(5000).default(800),
    maxMetricPoints: z.number().int().min(1).max(5000).default(600),
    maxIncidents: z.number().int().min(1).max(50).default(10),
    maxEvents: z.number().int().min(10).max(10000).default(2500),
    maxVirtualDurationMs: z.number().min(50).max(30000).default(5000),
  }),
});
export type ObservabilityScenario = z.infer<typeof ObservabilityScenarioSchema>;

// ========================
// Runtime Domain Models
// ========================

export interface TelemetryResource {
  resourceId: string;
  serviceName: string;
  serviceId: string;
  instanceId: string;
  version: string;
  region: string;
  zone: string;
  componentKind: ObservabilityServiceConfig["kind"];
}

export interface SimulatedSpanLink {
  linkedTraceId: string;
  linkedSpanId: string;
  relationship: "async_message" | "queue_consume" | "batch_fanin";
}

export interface SimulatedSpanRuntime {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceId: string;
  resourceId: string;
  name: string;
  kind: "client" | "server" | "internal" | "producer" | "consumer";
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  status: "unset" | "ok" | "error";
  attributes: Record<string, string | number | boolean>;
  events: Array<{ timestampMs: number; name: string; detail: string }>;
  links: SimulatedSpanLink[];
}

export interface SimulatedTraceRuntime {
  traceId: string;
  rootSpanId: string;
  rootServiceId: string;
  rootOperation: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  status: "ok" | "error";
  sampledIn: boolean;
  spans: SimulatedSpanRuntime[];
  criticalPathSpanIds: string[];
  criticalPathDurationMs: number;
}

export interface SimulatedLogRecord {
  id: string;
  eventTimeMs: number;
  ingestionTimeMs: number;
  severity: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
  resourceId: string;
  serviceId: string;
  message: string;
  traceId?: string;
  spanId?: string;
  incidentId?: string;
  attributes: Record<string, string | number | boolean>;
}

export interface MetricExemplar {
  timestampMs: number;
  value: number;
  traceId: string;
  spanId: string;
  serviceId: string;
}

export interface MetricPointSample {
  timestampMs: number;
  value: number;
}

export interface ServiceHealthRuntime {
  serviceId: string;
  label: string;
  kind: ObservabilityServiceConfig["kind"];
  status: "healthy" | "degraded" | "critical" | "no_data";
  requestCount: number;
  errorCount: number;
  requestRatePerSec: number;
  errorRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  utilizationPct: number;
  saturationPct: number;
  sloCompliant: boolean;
  activeIncidentIds: string[];
  latencySeries: MetricPointSample[];
  errorRateSeries: MetricPointSample[];
  exemplars: MetricExemplar[];
}

export interface ServiceDependencyEdge {
  id: string;
  callerId: string;
  calleeId: string;
  dependencyType: "sync" | "async" | "storage";
  callCount: number;
  errorCount: number;
  avgLatencyMs: number;
  impacted: boolean;
}

export interface SLOEvaluationRuntime {
  id: string;
  name: string;
  sliType: ObservabilitySLOConfig["sliType"];
  targetServiceId: string;
  target: number;
  windowMs: number;
  windowType: "rolling" | "calendar";
  eligibleRequests: number;
  goodRequests: number;
  badRequests: number;
  compliance: number;
  allowedBadRequests: number;
  errorBudgetRemainingPct: number;
  burnRate: number;
  breached: boolean;
}

export interface AlertEvaluationRecord {
  evaluatedAtMs: number;
  computedValue: number | null;
  threshold: number;
  breaching: boolean;
  state: AlertLifecycleState;
}

export interface AlertInstanceRuntime {
  id: string;
  ruleId: string;
  name: string;
  serviceId: string;
  metric: ObservabilityAlertRuleConfig["metric"];
  state: AlertLifecycleState;
  currentValue: number | null;
  threshold: number;
  missingDataPolicy: MissingDataPolicy;
  pendingSinceMs: number | null;
  firedAtMs: number | null;
  resolvedAtMs: number | null;
  fireCount: number;
  recentEvaluations: AlertEvaluationRecord[];
}

export interface IncidentTimelineEntry {
  atMs: number;
  kind:
    | "anomaly"
    | "alert_pending"
    | "alert_firing"
    | "detected"
    | "evidence"
    | "hypothesis"
    | "mitigation"
    | "recovery"
    | "resolved";
  summary: string;
}

export interface IncidentEvidenceItem {
  id: string;
  incidentId: string;
  timestampMs: number;
  serviceId: string;
  source:
    | "metric_anomaly"
    | "trace_anomaly"
    | "log_anomaly"
    | "saturation"
    | "fault_ground_truth"
    | "dependency_edge";
  observation: string;
  relatedTraceId?: string;
  relatedLogId?: string;
  causalWeight: "correlated" | "causal_ground_truth";
}

export interface RootCauseHypothesis {
  id: string;
  incidentId: string;
  serviceId: string;
  description: string;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  status: HypothesisStatus;
  rank: number;
  rationale: string;
}

export interface IncidentPostmortemReport {
  incidentId: string;
  title: string;
  summary: string;
  detectionSummary: string;
  timelineEntries: IncidentTimelineEntry[];
  rootCauseOrHypotheses: string;
  mitigationSummary: string;
  recoverySummary: string;
  preventiveNotes: string[];
  simulationAssumptions: string[];
}

export interface IncidentRuntime {
  id: string;
  scenarioId: string;
  title: string;
  severity: "sev1" | "sev2" | "sev3";
  status: IncidentLifecycleStatus;
  detectedAtMs: number;
  mitigatedAtMs?: number;
  resolvedAtMs?: number;
  directFailingServiceIds: string[];
  downstreamImpactedIds: string[];
  upstreamImpactedIds: string[];
  affectedServiceIds: string[];
  alertIds: string[];
  evidence: IncidentEvidenceItem[];
  hypotheses: RootCauseHypothesis[];
  mitigationsApplied: Array<{
    id: string;
    atMs: number;
    action: string;
    targetServiceId: string;
    description: string;
  }>;
  timeline: IncidentTimelineEntry[];
  postmortem?: IncidentPostmortemReport;
}

export interface RootCauseGraphNode {
  id: string;
  label: string;
  kind: "fault" | "symptom" | "service" | "alert" | "slo";
  serviceId: string;
}

export interface RootCauseGraphEdge {
  id: string;
  from: string;
  to: string;
  relation: "observed_correlation" | "verified_causal";
  label: string;
}

export interface ObservabilityInvariantReport {
  allPassed: boolean;
  spansValidTraceOk: boolean;
  parentChildAcyclicOk: boolean;
  nonNegativeDurationsOk: boolean;
  logCorrelationsValidOk: boolean;
  sliBoundsOk: boolean;
  missingDataSafeOk: boolean;
  incidentCausalOrderOk: boolean;
  evidenceProvenanceOk: boolean;
  groundTruthSeparatedOk: boolean;
  violations: string[];
}

export interface ObservabilityMetrics {
  totalTraces: number;
  sampledTraces: number;
  sampledOutTraces: number;
  totalSpans: number;
  totalLogs: number;
  droppedLogs: number;
  telemetryCoveragePct: number;
  overallErrorRate: number;
  overallP95LatencyMs: number;
  sloCompliancePct: number;
  activeAlerts: number;
  alertFireTransitions: number;
  incidentsDetected: number;
  incidentsResolved: number;
  detectionDelayMs: number | null;
  recoveryDurationMs: number | null;
}

export interface ModeledObservabilityRuntimeState {
  virtualTimeMs: number;
  investigationMode: InvestigationViewMode;
  collectorOnline: boolean;
  samplingMode: TelemetrySamplingMode;
  samplingRate: number;
  resources: Record<string, TelemetryResource>;
  services: Record<string, ServiceHealthRuntime>;
  dependencies: ServiceDependencyEdge[];
  traces: SimulatedTraceRuntime[];
  logs: SimulatedLogRecord[];
  slos: SLOEvaluationRuntime[];
  alerts: AlertInstanceRuntime[];
  incidents: IncidentRuntime[];
  rootCauseGraph: {
    nodes: RootCauseGraphNode[];
    edges: RootCauseGraphEdge[];
  };
  caveats: string[];
  invariants: ObservabilityInvariantReport;
  metrics: ObservabilityMetrics;
}

