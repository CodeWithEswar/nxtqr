export type ComponentSimulationState =
  | "healthy"
  | "degraded"
  | "unavailable"
  | "recovering"
  | "unknown";

export type FailureInjectionType =
  | "component_outage"
  | "component_degradation"
  | "latency_spike"
  | "network_partition"
  | "network_packet_loss"
  | "database_outage"
  | "database_replica_outage"
  | "cache_outage"
  | "queue_congestion"
  | "external_dependency_timeout"
  | "availability_zone_outage"
  | "regional_outage";

export type SimulationEventType =
  | "failure_injected"
  | "component_state_changed"
  | "failure_propagated"
  | "retry_attempted"
  | "retry_exhausted"
  | "circuit_breaker_opened"
  | "circuit_breaker_half_opened"
  | "circuit_breaker_closed"
  | "failover_triggered"
  | "failover_completed"
  | "failover_failed"
  | "journey_degraded"
  | "journey_interrupted"
  | "journey_recovered"
  | "cascading_overload"
  | "recovery_initiated"
  | "recovery_completed";

export interface FailureInjection {
  id: string;
  name: string;
  type: FailureInjectionType;
  targetId: string;
  targetType: "node" | "edge" | "failure_domain";
  startMs: number;
  durationMs: number;
  severity: "critical" | "high" | "medium" | "low";
  parameters?: {
    latencyMs?: number;
    packetLossPct?: number;
    errorRatePct?: number;
    failoverDelayMs?: number;
    recoveryTimeMs?: number;
    availabilityZone?: string;
  };
  recoveryBehavior?: "automatic" | "manual" | "none";
}

export interface SimulationEvent {
  id: string;
  scenarioId: string;
  timestampMs: number;
  sequence: number;
  type: SimulationEventType;
  targetId: string;
  payload: Record<string, unknown>;
  description: string;
}

export interface CriticalUserJourney {
  id: string;
  name: string;
  description: string;
  entryNodeId: string;
  requiredNodeIds: string[];
  optionalNodeIds?: string[];
  criticality: "critical" | "high" | "medium";
}

export interface JourneySimulationResult {
  journeyId: string;
  name: string;
  status: "available" | "degraded" | "unavailable" | "unknown";
  affectedComponentIds: string[];
  failedStepDescription?: string;
  evidenceEventIds: string[];
}

export interface ComponentStateSnapshot {
  nodeId: string;
  state: ComponentSimulationState;
  activeFailures: string[];
  isCircuitOpen: boolean;
  activeReplicas: number;
  latencyMultiplier: number;
  unprocessedBacklog?: number;
  reason?: string;
}

export interface TimelineStepSnapshot {
  timestampMs: number;
  eventIndex: number;
  componentStates: Record<string, ComponentStateSnapshot>;
  activeEvents: SimulationEvent[];
  journeyStatuses: Record<string, "available" | "degraded" | "unavailable" | "unknown">;
  activeBlastRadius: string[];
}

export interface BlastRadiusAnalysis {
  targetId: string;
  targetName: string;
  directlyImpactedNodeIds: string[];
  indirectlyImpactedNodeIds: string[];
  unaffectedNodeIds: string[];
  affectedJourneysCount: number;
  totalJourneysCount: number;
  blastRadiusScore: number; // 0 - 100 percentage
  summary: string;
}

export interface RecoveryAnalysis {
  modeledDetectionTimeMs: number;
  modeledFailoverTimeMs: number;
  modeledRestartTimeMs: number;
  modeledDrainTimeMs: number;
  totalModeledRecoveryMs: number;
  targetRtoMs?: number;
  targetRpoMs?: number;
  rtoMet: boolean;
  rpoMet: boolean;
  recoveryBottlenecks: string[];
}

export interface CascadingFailureRisk {
  type:
    | "retry_storm"
    | "queue_backlog_amplification"
    | "cache_miss_surge"
    | "traffic_concentration"
    | "connection_pool_exhaustion";
  sourceNodeId: string;
  amplifiedNodeIds: string[];
  severity: "critical" | "high" | "medium";
  explanation: string;
}

export interface SimulationFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "resilience" | "failover" | "cascading" | "recovery" | "journey";
  title: string;
  explanation: string;
  affectedNodeIds: string[];
  remediationRecommendation: string;
}

export interface FailureScenario {
  id: string;
  architectureId: string;
  graphRevision: string;
  name: string;
  description: string;
  durationMs: number;
  injections: FailureInjection[];
  criticalJourneys: CriticalUserJourney[];
  targetRtoMs?: number;
  targetRpoMs?: number;
  randomSeed?: number;
  assumptions: string[];
}

export interface SimulationResult {
  id: string;
  scenario: FailureScenario;
  graphRevision: string;
  engineVersion: string;
  events: SimulationEvent[];
  timeline: TimelineStepSnapshot[];
  finalComponentStates: Record<string, ComponentStateSnapshot>;
  journeyResults: JourneySimulationResult[];
  blastRadius: BlastRadiusAnalysis;
  recovery: RecoveryAnalysis;
  cascadingRisks: CascadingFailureRisk[];
  findings: SimulationFinding[];
  completedAt: string;
  executionDurationMs: number;
}

export interface SimulationComparisonResult {
  baselineScenarioId: string;
  baselineRevision: string;
  candidateRevision: string;
  baselineBlastRadiusScore: number;
  candidateBlastRadiusScore: number;
  blastRadiusScoreDelta: number; // Negative is improvement
  baselineUnavailableJourneys: number;
  candidateUnavailableJourneys: number;
  journeyAvailabilityDelta: number;
  improvedComponentIds: string[];
  degradedComponentIds: string[];
  newResilienceControlsActive: string[];
  summary: string;
}
