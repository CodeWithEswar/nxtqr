import { z } from "zod";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import type { ModeledRuntimeState } from "../domain/runtime-state";

export const SimulationCapabilityIdSchema = z.enum([
  "core-flow",
  "request-lifecycle",
  "routing-lb",
  "resilience",
  "traffic",
  "database",
  "cache",
  "security",
  "streaming",
  "kubernetes",
  "global-network",
  "service-mesh",
  "raft",
  "distributed-transactions",
  "distributed-storage",
  "traffic-control",
  "observability",
  "zero-trust",
  "deployment",
  "disaster-recovery",
  "capacity",
  "architecture-analysis",
  "practice-labs",
  "templates",
]);

export type SimulationCapabilityId = z.infer<typeof SimulationCapabilityIdSchema>;

export const CapabilitySupportStatusSchema = z.enum([
  "supported",
  "partial",
  "unsupported",
  "misconfigured",
]);

export type CapabilitySupportStatus = z.infer<typeof CapabilitySupportStatusSchema>;

export interface SimulationCapabilityMetadata {
  id: SimulationCapabilityId;
  phase: string;
  name: string;
  category:
    | "execution"
    | "data-state"
    | "resilience-scale"
    | "security-delivery"
    | "platform-learning";
  description: string;
  requiredAnyNodeTypes: string[];
  optionalNodeTypes: string[];
  dependencies: SimulationCapabilityId[];
  defaultScenarioIds: string[];
  determinismSupported: boolean;
  workspaceKey: string;
  scopeNotes: string;
}

export interface DetectedCapabilityState {
  capabilityId: SimulationCapabilityId;
  metadata: SimulationCapabilityMetadata;
  status: CapabilitySupportStatus;
  matchedNodeIds: string[];
  missingNodeTypes: string[];
  missingConfigs: string[];
  incompatibleDetails: string[];
  unmetDependencies: SimulationCapabilityId[];
  recommendedScenarioIds: string[];
}

export interface TopologyCapabilityInspection {
  snapshotDigest: string;
  nodeCount: number;
  edgeCount: number;
  supportedCapabilities: DetectedCapabilityState[];
  partialCapabilities: DetectedCapabilityState[];
  unsupportedCapabilities: DetectedCapabilityState[];
  misconfiguredCapabilities: DetectedCapabilityState[];
  recommendedScenarios: Array<{
    capabilityId: SimulationCapabilityId;
    scenarioId: string;
    reason: string;
  }>;
  topologyWarnings: string[];
}

export const SimulationRunStateSchema = z.enum([
  "created",
  "validating",
  "ready",
  "running",
  "paused",
  "completed",
  "cancelled",
  "failed",
]);

export type SimulationRunState = z.infer<typeof SimulationRunStateSchema>;

export const SimulationRunConfigSchema = z.object({
  runId: z.string().min(1).max(120).optional(),
  architectureId: z.string().min(1).max(120).default("arch_unified"),
  revisionId: z.string().min(1).max(120).default("rev_001"),
  capabilityId: SimulationCapabilityIdSchema.default("core-flow"),
  scenarioId: z.string().min(1).max(120).optional(),
  seed: z.union([z.number().int(), z.string().min(1)]).default(42),
  checkpointInterval: z.number().int().min(1).max(500).default(10),
  maxSteps: z.number().int().min(1).max(10000).default(2500),
  maxEvents: z.number().int().min(1).max(20000).default(5000),
  maxDurationMs: z.number().int().min(100).max(600000).default(120000),
  maxConcurrentRequests: z.number().int().min(1).max(5000).default(500),
  incomingRps: z.number().min(0).max(1000000).optional(),
  denyAuth: z.boolean().optional(),
  faultTargetNodeId: z.string().optional(),
  faultKind: z
    .enum(["none", "database_outage", "service_degraded", "rate_limit_exhausted"])
    .default("none"),
});

export type SimulationRunConfig = z.infer<typeof SimulationRunConfigSchema>;

export const MetricProvenanceSourceSchema = z.enum([
  "observed-simulated",
  "analytical-queueing",
  "synthetic-cost",
  "modeled-estimate",
  "topology-derived",
]);

export type MetricProvenanceSource = z.infer<typeof MetricProvenanceSourceSchema>;

export interface ProvenancedMetric<T = number> {
  key: string;
  label: string;
  value: T;
  unit: string;
  provenance: MetricProvenanceSource;
  disclaimer?: string;
}

export interface SimulationCheckpoint {
  stepIndex: number;
  virtualTimeMs: number;
  prngState: number;
  stateHash: string;
  runtimeState: ModeledRuntimeState;
  activeNodeIds: string[];
  activeEdgeIds: string[];
}

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface UnifiedFinding {
  id: string;
  dedupeKey: string;
  severity: FindingSeverity;
  capabilityId: SimulationCapabilityId;
  category:
    | "reliability"
    | "bottleneck"
    | "security"
    | "consistency"
    | "dr"
    | "cost"
    | "validation";
  title: string;
  summary: string;
  remediation: string;
  provenance: MetricProvenanceSource;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  evidenceEventSequences: number[];
  evidenceSpanIds: string[];
}

export interface CausalIntegrityIssue {
  code:
    | "NON_MONOTONIC_SEQUENCE"
    | "NON_MONOTONIC_TIMESTAMP"
    | "UNKNOWN_NODE_REFERENCE"
    | "UNKNOWN_EDGE_REFERENCE"
    | "ORPHAN_SPAN_PARENT"
    | "INVALID_STATE_TRANSITION"
    | "EMPTY_TRACE"
    | "FRAME_COUNT_MISMATCH";
  severity: "error" | "warning";
  message: string;
  eventSequence?: number;
  eventId?: string;
}

export interface EventIntegrityReport {
  valid: boolean;
  checkedEvents: number;
  checkedSpans: number;
  checkedFrames: number;
  issues: CausalIntegrityIssue[];
}

export interface CrossModuleHopRecord {
  layer:
    | "dns"
    | "cdn"
    | "gateway"
    | "auth"
    | "rate-limiter"
    | "load-balancer"
    | "service-mesh"
    | "service"
    | "cache"
    | "database"
    | "queue"
    | "observability";
  nodeId: string;
  nodeLabel: string;
  enteredAtMs: number;
  durationMs: number;
  outcome: "allowed" | "hit" | "miss" | "forwarded" | "denied" | "throttled" | "failed" | "skipped";
  statusCode: number;
  spanId: string;
  parentSpanId?: string;
  explanation: string;
}

export interface CrossModulePipelineResult {
  runId: string;
  correlationId: string;
  outcome: "success" | "blocked-security" | "throttled" | "degraded" | "failed";
  shortCircuitedAtLayer?: CrossModuleHopRecord["layer"];
  terminalStatusCode: number;
  totalDurationMs: number;
  bottleneckNodeId?: string;
  bottleneckEffectiveRps?: number;
  requestedRps: number;
  deliveredRps: number;
  errorRatePercent: number;
  hops: CrossModuleHopRecord[];
  trace: ExecutionTrace;
  findings: UnifiedFinding[];
  metrics: ProvenancedMetric[];
  integrity: EventIntegrityReport;
}

export interface SimulationRunRecord {
  runId: string;
  state: SimulationRunState;
  config: SimulationRunConfig;
  nodes: BaseNode[];
  edges: BaseEdge[];
  currentStepIndex: number;
  virtualTimeMs: number;
  trace: ExecutionTrace | null;
  frames: VisualizationFrame[];
  checkpoints: SimulationCheckpoint[];
  findings: UnifiedFinding[];
  metrics: ProvenancedMetric[];
  integrity: EventIntegrityReport | null;
  capabilityInspection: TopologyCapabilityInspection;
  stateTransitions: Array<{
    from: SimulationRunState | null;
    to: SimulationRunState;
    atVirtualMs: number;
    reason: string;
  }>;
  failureReason?: string;
  cancelledAtStep?: number;
}

