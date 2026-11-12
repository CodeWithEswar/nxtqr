import type { BaseExecutionEvent } from "../domain/execution-event";
import type { AlertLifecycleState } from "./observability-schemas";

export interface ObservabilityTraceStartedEvent extends BaseExecutionEvent {
  type: "observability.trace.started";
  traceId: string;
  rootServiceId: string;
}

export interface ObservabilitySpanStartedEvent extends BaseExecutionEvent {
  type: "observability.span.started";
  traceId: string;
  spanId: string;
  serviceId: string;
}

export interface ObservabilitySpanCompletedEvent extends BaseExecutionEvent {
  type: "observability.span.completed";
  traceId: string;
  spanId: string;
  serviceId: string;
  durationMs: number;
  status: "unset" | "ok" | "error";
}

export interface ObservabilityLogEmittedEvent extends BaseExecutionEvent {
  type: "observability.log.emitted";
  logId: string;
  severity: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
  serviceId: string;
  traceId?: string;
}

export interface ObservabilityMetricRecordedEvent extends BaseExecutionEvent {
  type: "observability.metric.recorded";
  serviceId: string;
  metricName: string;
  value: number;
}

export interface ObservabilitySliEvaluatedEvent extends BaseExecutionEvent {
  type: "observability.sli.evaluated";
  sloId: string;
  compliance: number;
}

export interface ObservabilitySloBreachedEvent extends BaseExecutionEvent {
  type: "observability.slo.breached";
  sloId: string;
  compliance: number;
  target: number;
}

export interface ObservabilityErrorBudgetUpdatedEvent extends BaseExecutionEvent {
  type: "observability.error_budget.updated";
  sloId: string;
  remainingPct: number;
  burnRate: number;
}

export interface ObservabilityAlertPendingEvent extends BaseExecutionEvent {
  type: "observability.alert.pending";
  alertId: string;
  serviceId: string;
}

export interface ObservabilityAlertFiringEvent extends BaseExecutionEvent {
  type: "observability.alert.firing";
  alertId: string;
  serviceId: string;
  value: number;
  state: AlertLifecycleState;
}

export interface ObservabilityAlertResolvedEvent extends BaseExecutionEvent {
  type: "observability.alert.resolved";
  alertId: string;
  serviceId: string;
}

export interface ObservabilityIncidentDetectedEvent extends BaseExecutionEvent {
  type: "observability.incident.detected";
  incidentId: string;
  title: string;
}

export interface ObservabilityIncidentInvestigationStartedEvent
  extends BaseExecutionEvent {
  type: "observability.incident.investigation.started";
  incidentId: string;
}

export interface ObservabilityIncidentEvidenceAddedEvent
  extends BaseExecutionEvent {
  type: "observability.incident.evidence.added";
  incidentId: string;
  evidenceId: string;
}

export interface ObservabilityIncidentHypothesisCreatedEvent
  extends BaseExecutionEvent {
  type: "observability.incident.hypothesis.created";
  incidentId: string;
  hypothesisId: string;
}

export interface ObservabilityIncidentMitigationAppliedEvent
  extends BaseExecutionEvent {
  type: "observability.incident.mitigation.applied";
  incidentId: string;
  action: string;
  targetServiceId: string;
}

export interface ObservabilityIncidentRecoveryObservedEvent
  extends BaseExecutionEvent {
  type: "observability.incident.recovery.observed";
  incidentId: string;
}

export interface ObservabilityIncidentResolvedEvent extends BaseExecutionEvent {
  type: "observability.incident.resolved";
  incidentId: string;
}

export type ObservabilityExecutionEvent =
  | ObservabilityTraceStartedEvent
  | ObservabilitySpanStartedEvent
  | ObservabilitySpanCompletedEvent
  | ObservabilityLogEmittedEvent
  | ObservabilityMetricRecordedEvent
  | ObservabilitySliEvaluatedEvent
  | ObservabilitySloBreachedEvent
  | ObservabilityErrorBudgetUpdatedEvent
  | ObservabilityAlertPendingEvent
  | ObservabilityAlertFiringEvent
  | ObservabilityAlertResolvedEvent
  | ObservabilityIncidentDetectedEvent
  | ObservabilityIncidentInvestigationStartedEvent
  | ObservabilityIncidentEvidenceAddedEvent
  | ObservabilityIncidentHypothesisCreatedEvent
  | ObservabilityIncidentMitigationAppliedEvent
  | ObservabilityIncidentRecoveryObservedEvent
  | ObservabilityIncidentResolvedEvent;

