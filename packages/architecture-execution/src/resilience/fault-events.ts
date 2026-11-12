import type { BaseExecutionEvent } from "../domain/execution-event";
import type { FaultType } from "./fault-schemas";

export interface FaultScheduledEvent extends BaseExecutionEvent {
  type: "fault.scheduled";
  faultId: string;
  faultType: FaultType;
  targetId: string;
  scheduledAtMs: number;
}

export interface FaultActivatedEvent extends BaseExecutionEvent {
  type: "fault.activated";
  faultId: string;
  faultType: FaultType;
  targetId: string;
  parameters: Record<string, unknown>;
}

export interface FaultEffectAppliedEvent extends BaseExecutionEvent {
  type: "fault.effect.applied";
  faultId: string;
  faultType: FaultType;
  targetId: string;
  effectType: "outage" | "degradation" | "latency" | "packet_loss" | "timeout" | "refusal" | "backlog";
  details: string;
}

export interface FaultRecoveryStartedEvent extends BaseExecutionEvent {
  type: "fault.recovery.started";
  faultId: string;
  faultType: FaultType;
  targetId: string;
  recoveryMechanism: "auto_duration" | "health_check" | "manual";
}

export interface FaultResolvedEvent extends BaseExecutionEvent {
  type: "fault.resolved";
  faultId: string;
  faultType: FaultType;
  targetId: string;
  durationMs: number;
}

export interface FaultCancelledEvent extends BaseExecutionEvent {
  type: "fault.cancelled";
  faultId: string;
  reason: string;
}

export interface RequestDeadlineCreatedEvent extends BaseExecutionEvent {
  type: "request.deadline.created";
  requestId: string;
  deadlineMs: number;
  originNodeId: string;
}

export interface RequestTimeoutTriggeredEvent extends BaseExecutionEvent {
  type: "request.timeout.triggered";
  requestId: string;
  deadlineMs: number;
  elapsedMs: number;
  nodeId: string;
}

export interface RetryScheduledEvent extends BaseExecutionEvent {
  type: "retry.scheduled";
  requestId: string;
  attemptNumber: number;
  maxAttempts: number;
  backoffDelayMs: number;
  scheduledAtMs: number;
  sourceNodeId: string;
  targetNodeId: string;
  reason: string;
}

export interface RetryStartedEvent extends BaseExecutionEvent {
  type: "retry.started";
  requestId: string;
  attemptNumber: number;
  maxAttempts: number;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface RetrySucceededEvent extends BaseExecutionEvent {
  type: "retry.succeeded";
  requestId: string;
  attemptNumber: number;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface RetryExhaustedEvent extends BaseExecutionEvent {
  type: "retry.exhausted";
  requestId: string;
  totalAttempts: number;
  sourceNodeId: string;
  targetNodeId: string;
  finalError: string;
}

export interface CircuitOpenedEvent extends BaseExecutionEvent {
  type: "circuit.opened";
  targetNodeId: string;
  consecutiveFailures: number;
  failureThreshold: number;
  openDurationMs: number;
  reason: string;
}

export interface CircuitHalfOpenedEvent extends BaseExecutionEvent {
  type: "circuit.half_opened";
  targetNodeId: string;
  allowedProbeCount: number;
  probeTimeoutMs: number;
}

export interface CircuitClosedEvent extends BaseExecutionEvent {
  type: "circuit.closed";
  targetNodeId: string;
  consecutiveSuccesses: number;
  recoveredAtMs: number;
}

export interface FailoverTargetSelectedEvent extends BaseExecutionEvent {
  type: "failover.target.selected";
  primaryTargetId: string;
  selectedTargetId: string;
  reason: string;
  evaluatedTargets: { targetId: string; healthy: boolean; status: string }[];
}

export interface HealthCheckPassedEvent extends BaseExecutionEvent {
  type: "healthcheck.passed";
  targetNodeId: string;
  consecutiveSuccesses: number;
  recoveryThreshold: number;
  latencyMs: number;
}

export interface HealthCheckFailedEvent extends BaseExecutionEvent {
  type: "healthcheck.failed";
  targetNodeId: string;
  consecutiveFailures: number;
  failureThreshold: number;
  reason: string;
}

export type ResilienceEvent =
  | FaultScheduledEvent
  | FaultActivatedEvent
  | FaultEffectAppliedEvent
  | FaultRecoveryStartedEvent
  | FaultResolvedEvent
  | FaultCancelledEvent
  | RequestDeadlineCreatedEvent
  | RequestTimeoutTriggeredEvent
  | RetryScheduledEvent
  | RetryStartedEvent
  | RetrySucceededEvent
  | RetryExhaustedEvent
  | CircuitOpenedEvent
  | CircuitHalfOpenedEvent
  | CircuitClosedEvent
  | FailoverTargetSelectedEvent
  | HealthCheckPassedEvent
  | HealthCheckFailedEvent;
