import type { BaseExecutionEvent } from "../domain/execution-event";
import type { PerformanceSample } from "./traffic-schemas";

export interface TrafficRequestScheduledEvent extends BaseExecutionEvent {
  type: "traffic.request.scheduled";
  requestId: string;
  virtualUserId?: string;
  targetNodeId: string;
  scheduledArrivalMs: number;
}

export interface TrafficRequestArrivedEvent extends BaseExecutionEvent {
  type: "traffic.request.arrived";
  requestId: string;
  virtualUserId?: string;
  entryNodeId: string;
  activeInFlight: number;
}

export interface TrafficRequestAdmittedEvent extends BaseExecutionEvent {
  type: "traffic.request.admitted";
  requestId: string;
  serviceNodeId: string;
  instanceId: string;
  workerIndex: number;
  queueWaitingTimeMs: number;
}

export interface TrafficRequestRejectedEvent extends BaseExecutionEvent {
  type: "traffic.request.rejected";
  requestId: string;
  nodeId: string;
  reason: "rate_limit_exceeded" | "queue_full" | "no_capacity" | "deadline_exceeded";
  statusCode: number;
}

export interface TrafficRequestCompletedEvent extends BaseExecutionEvent {
  type: "traffic.request.completed";
  requestId: string;
  terminalNodeId: string;
  latencyMs: number;
  serviceDurationMs: number;
  queueWaitDurationMs: number;
}

export interface TrafficRequestFailedEvent extends BaseExecutionEvent {
  type: "traffic.request.failed";
  requestId: string;
  failedAtNodeId: string;
  latencyMs: number;
  errorReason: string;
}

export interface QueueRequestEnqueuedEvent extends BaseExecutionEvent {
  type: "queue.request.enqueued";
  nodeId: string;
  requestId: string;
  currentQueueDepth: number;
  maxQueueCapacity: number;
}

export interface QueueRequestDequeuedEvent extends BaseExecutionEvent {
  type: "queue.request.dequeued";
  nodeId: string;
  requestId: string;
  assignedInstanceId: string;
  waitTimeMs: number;
  remainingQueueDepth: number;
}

export interface QueueRequestRejectedEvent extends BaseExecutionEvent {
  type: "queue.request.rejected";
  nodeId: string;
  requestId: string;
  currentQueueDepth: number;
  maxQueueCapacity: number;
}

export interface QueueCapacityReachedEvent extends BaseExecutionEvent {
  type: "queue.capacity.reached";
  nodeId: string;
  maxQueueCapacity: number;
  timestampMs: number;
}

export interface RateLimitRequestAllowedEvent extends BaseExecutionEvent {
  type: "ratelimit.request.allowed";
  nodeId: string;
  requestId: string;
  remainingTokens: number;
}

export interface RateLimitRequestRejectedEvent extends BaseExecutionEvent {
  type: "ratelimit.request.rejected";
  nodeId: string;
  requestId: string;
  statusCode: number;
  reason: string;
}

export interface RateLimitTokensRefilledEvent extends BaseExecutionEvent {
  type: "ratelimit.tokens.refilled";
  nodeId: string;
  tokensAdded: number;
  currentTokens: number;
}

export interface AutoscaleEvaluationStartedEvent extends BaseExecutionEvent {
  type: "autoscale.evaluation.started";
  serviceNodeId: string;
  currentInstances: number;
  averageUtilizationPercent: number;
}

export interface AutoscaleScaleOutRequestedEvent extends BaseExecutionEvent {
  type: "autoscale.scaleout.requested";
  serviceNodeId: string;
  fromInstances: number;
  toInstances: number;
  provisioningDelayMs: number;
  readyAtMs: number;
  triggerReason: string;
}

export interface AutoscaleInstanceReadyEvent extends BaseExecutionEvent {
  type: "autoscale.instance.ready";
  serviceNodeId: string;
  instanceId: string;
  totalActiveInstances: number;
}

export interface AutoscaleScaleInRequestedEvent extends BaseExecutionEvent {
  type: "autoscale.scalein.requested";
  serviceNodeId: string;
  fromInstances: number;
  toInstances: number;
  triggerReason: string;
}

export interface AutoscaleInstanceRemovedEvent extends BaseExecutionEvent {
  type: "autoscale.instance.removed";
  serviceNodeId: string;
  instanceId: string;
  totalActiveInstances: number;
}

export interface TrafficMetricsSampleEvent extends BaseExecutionEvent {
  type: "traffic.metrics.sample";
  sample: PerformanceSample;
}

export type TrafficExecutionEvent =
  | TrafficRequestScheduledEvent
  | TrafficRequestArrivedEvent
  | TrafficRequestAdmittedEvent
  | TrafficRequestRejectedEvent
  | TrafficRequestCompletedEvent
  | TrafficRequestFailedEvent
  | QueueRequestEnqueuedEvent
  | QueueRequestDequeuedEvent
  | QueueRequestRejectedEvent
  | QueueCapacityReachedEvent
  | RateLimitRequestAllowedEvent
  | RateLimitRequestRejectedEvent
  | RateLimitTokensRefilledEvent
  | AutoscaleEvaluationStartedEvent
  | AutoscaleScaleOutRequestedEvent
  | AutoscaleInstanceReadyEvent
  | AutoscaleScaleInRequestedEvent
  | AutoscaleInstanceRemovedEvent
  | TrafficMetricsSampleEvent;
