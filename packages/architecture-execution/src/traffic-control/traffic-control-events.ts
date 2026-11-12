import type { BaseExecutionEvent } from "../domain/execution-event";
import type { AdmissionDecisionType } from "./traffic-control-schemas";

export interface TrafficRequestCreatedEvent extends BaseExecutionEvent {
  type: "traffic.request.created";
  requestId: string;
  tenantId: string;
  route: string;
  attempt: number;
}

export interface TrafficRateLimitCheckedEvent extends BaseExecutionEvent {
  type: "traffic.rate_limit.checked";
  requestId: string;
  policyIds: string[];
  decision: AdmissionDecisionType;
}

export interface TrafficRateLimitAllowedEvent extends BaseExecutionEvent {
  type: "traffic.rate_limit.allowed";
  requestId: string;
  policyId: string;
}

export interface TrafficRateLimitRejectedEvent extends BaseExecutionEvent {
  type: "traffic.rate_limit.rejected";
  requestId: string;
  policyId: string;
  reason: string;
}

export interface TrafficTokenConsumedEvent extends BaseExecutionEvent {
  type: "traffic.token.consumed";
  requestId: string;
  policyId: string;
  cost: number;
  remainingTokens: number;
}

export interface TrafficTokenRefilledEvent extends BaseExecutionEvent {
  type: "traffic.token.refilled";
  policyId: string;
  tokens: number;
}

export interface TrafficWindowUpdatedEvent extends BaseExecutionEvent {
  type: "traffic.window.updated";
  policyId: string;
  used: number;
  limit: number;
}

export interface TrafficConcurrencyAcquiredEvent extends BaseExecutionEvent {
  type: "traffic.concurrency.acquired";
  requestId: string;
  active: number;
  limit: number;
}

export interface TrafficConcurrencyReleasedEvent extends BaseExecutionEvent {
  type: "traffic.concurrency.released";
  requestId: string;
  active: number;
}

export interface TrafficQueueEnqueuedEvent extends BaseExecutionEvent {
  type: "traffic.queue.enqueued";
  requestId: string;
  depth: number;
  capacity: number;
}

export interface TrafficQueueDequeuedEvent extends BaseExecutionEvent {
  type: "traffic.queue.dequeued";
  requestId: string;
  waitMs: number;
  depth: number;
}

export interface TrafficQueueOverflowEvent extends BaseExecutionEvent {
  type: "traffic.queue.overflow";
  requestId: string;
  depth: number;
  capacity: number;
}

export interface TrafficBackpressureActivatedEvent extends BaseExecutionEvent {
  type: "traffic.backpressure.activated";
  sourceComponent: string;
  targetComponent: string;
  pressure: number;
}

export interface TrafficBackpressureReleasedEvent extends BaseExecutionEvent {
  type: "traffic.backpressure.released";
  sourceComponent: string;
}

export interface TrafficLoadShedEvent extends BaseExecutionEvent {
  type: "traffic.load_shed";
  requestId: string;
  policy: string;
  reason: string;
}

export interface TrafficRetryScheduledEvent extends BaseExecutionEvent {
  type: "traffic.retry.scheduled";
  requestId: string;
  attempt: number;
  delayMs: number;
}

export interface TrafficRetrySuppressedEvent extends BaseExecutionEvent {
  type: "traffic.retry.suppressed";
  requestId: string;
  reason: string;
}

export interface TrafficCircuitOpenedEvent extends BaseExecutionEvent {
  type: "traffic.circuit.opened";
  failureCount: number;
  openDurationMs: number;
}

export interface TrafficCircuitClosedEvent extends BaseExecutionEvent {
  type: "traffic.circuit.closed";
  reason: string;
}

export interface TrafficControlRequestCompletedEvent extends BaseExecutionEvent {
  type: "traffic.request.completed";
  requestId: string;
  latencyMs: number;
  success: boolean;
}

export interface TrafficControlRequestTimedOutEvent extends BaseExecutionEvent {
  type: "traffic.request.timed_out";
  requestId: string;
  reason: string;
}

export type TrafficControlEvent =
  | TrafficRequestCreatedEvent
  | TrafficRateLimitCheckedEvent
  | TrafficRateLimitAllowedEvent
  | TrafficRateLimitRejectedEvent
  | TrafficTokenConsumedEvent
  | TrafficTokenRefilledEvent
  | TrafficWindowUpdatedEvent
  | TrafficConcurrencyAcquiredEvent
  | TrafficConcurrencyReleasedEvent
  | TrafficQueueEnqueuedEvent
  | TrafficQueueDequeuedEvent
  | TrafficQueueOverflowEvent
  | TrafficBackpressureActivatedEvent
  | TrafficBackpressureReleasedEvent
  | TrafficLoadShedEvent
  | TrafficRetryScheduledEvent
  | TrafficRetrySuppressedEvent
  | TrafficCircuitOpenedEvent
  | TrafficCircuitClosedEvent
  | TrafficControlRequestCompletedEvent
  | TrafficControlRequestTimedOutEvent;
