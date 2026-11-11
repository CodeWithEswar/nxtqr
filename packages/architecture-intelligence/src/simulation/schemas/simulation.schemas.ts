import { z } from "zod";

export const ComponentSimulationStateSchema = z.enum([
  "healthy",
  "degraded",
  "unavailable",
  "recovering",
  "unknown",
]);

export const FailureInjectionTypeSchema = z.enum([
  "component_outage",
  "component_degradation",
  "latency_spike",
  "network_partition",
  "network_packet_loss",
  "database_outage",
  "database_replica_outage",
  "cache_outage",
  "queue_congestion",
  "external_dependency_timeout",
  "availability_zone_outage",
  "regional_outage",
]);

export const SimulationEventTypeSchema = z.enum([
  "failure_injected",
  "component_state_changed",
  "failure_propagated",
  "retry_attempted",
  "retry_exhausted",
  "circuit_breaker_opened",
  "circuit_breaker_half_opened",
  "circuit_breaker_closed",
  "failover_triggered",
  "failover_completed",
  "failover_failed",
  "journey_degraded",
  "journey_interrupted",
  "journey_recovered",
  "cascading_overload",
  "recovery_initiated",
  "recovery_completed",
]);

export const FailureInjectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: FailureInjectionTypeSchema,
  targetId: z.string().min(1),
  targetType: z.enum(["node", "edge", "failure_domain"]),
  startMs: z.number().nonnegative(),
  durationMs: z.number().positive(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  parameters: z
    .object({
      latencyMs: z.number().optional(),
      packetLossPct: z.number().optional(),
      errorRatePct: z.number().optional(),
      failoverDelayMs: z.number().optional(),
      recoveryTimeMs: z.number().optional(),
      availabilityZone: z.string().optional(),
    })
    .optional(),
  recoveryBehavior: z.enum(["automatic", "manual", "none"]).optional(),
});

export const CriticalUserJourneySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  entryNodeId: z.string().min(1),
  requiredNodeIds: z.array(z.string().min(1)),
  optionalNodeIds: z.array(z.string().min(1)).optional(),
  criticality: z.enum(["critical", "high", "medium"]),
});

export const FailureScenarioSchema = z.object({
  id: z.string().min(1),
  architectureId: z.string().min(1),
  graphRevision: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  durationMs: z.number().positive().max(300_000), // Max 5 minutes virtual simulation
  injections: z.array(FailureInjectionSchema).min(1),
  criticalJourneys: z.array(CriticalUserJourneySchema).default([]),
  targetRtoMs: z.number().positive().optional(),
  targetRpoMs: z.number().nonnegative().optional(),
  randomSeed: z.number().optional(),
  assumptions: z.array(z.string()).default([]),
});

export const SimulationEventSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  timestampMs: z.number().nonnegative(),
  sequence: z.number().nonnegative(),
  type: SimulationEventTypeSchema,
  targetId: z.string().min(1),
  payload: z.record(z.unknown()),
  description: z.string(),
});
