import type { ModeledRuntimeState } from "./runtime-state";
import type {
  TraceContext,
  FanInPolicy,
  ModeledMessage,
} from "../schemas/distributed.schemas";

export type DistributedEventType =
  // Parallel & Fan-out / Fan-in
  | "parallel.fanout.started"
  | "parallel.branch.created"
  | "parallel.branch.started"
  | "parallel.branch.completed"
  | "parallel.branch.failed"
  | "parallel.branch.cancelled"
  | "parallel.join.waiting"
  | "parallel.join.satisfied"
  | "parallel.join.failed"
  // Messaging & Queues
  | "message.created"
  | "message.published"
  | "message.enqueued"
  | "message.delivered"
  | "message.processing.started"
  | "message.processing.completed"
  | "message.acknowledged"
  | "message.nacked"
  | "message.retry.scheduled"
  | "message.deadlettered"
  | "message.deduplicated"
  // Distributed Tracing
  | "span.started"
  | "span.completed";

export interface BaseCausalEvent {
  id: string;
  sequence: number;
  atMs: number;
  durationMs: number;
  type: DistributedEventType;
  explanation: string;
  branchId: string;
  traceContext?: TraceContext;
  traceId?: string;
  spanId?: string;
  parentEventId?: string;
  causedByEventId?: string;
  nodeId?: string;
  nodeLabel?: string;
  edgeId?: string;
  stateSnapshot?: ModeledRuntimeState;
}

// ----------------------------------------------------------------------------
// Parallel Execution Events
// ----------------------------------------------------------------------------

export interface ParallelFanOutStartedEvent extends BaseCausalEvent {
  type: "parallel.fanout.started";
  parentNodeId: string;
  parentNodeLabel: string;
  barrierId: string;
  branches: { branchId: string; targetNodeId: string; targetLabel?: string; operation: string }[];
}

export interface ParallelBranchCreatedEvent extends BaseCausalEvent {
  type: "parallel.branch.created";
  branchId: string;
  parentBranchId: string;
  originNodeId: string;
  targetNodeId: string;
  operation: string;
}

export interface ParallelBranchStartedEvent extends BaseCausalEvent {
  type: "parallel.branch.started";
  branchId: string;
  targetNodeId: string;
  targetNodeLabel: string;
  operation: string;
}

export interface ParallelBranchCompletedEvent extends BaseCausalEvent {
  type: "parallel.branch.completed";
  branchId: string;
  targetNodeId: string;
  targetNodeLabel: string;
  durationMs: number;
  result?: unknown;
}

export interface ParallelBranchFailedEvent extends BaseCausalEvent {
  type: "parallel.branch.failed";
  branchId: string;
  targetNodeId: string;
  targetNodeLabel: string;
  error: string;
}

export interface ParallelBranchCancelledEvent extends BaseCausalEvent {
  type: "parallel.branch.cancelled";
  branchId: string;
  reason: string;
}

export interface ParallelJoinWaitingEvent extends BaseCausalEvent {
  type: "parallel.join.waiting";
  barrierId: string;
  waitingNodeId: string;
  waitingNodeLabel: string;
  policy: FanInPolicy;
  expectedBranchIds: string[];
  pendingBranchIds: string[];
}

export interface ParallelJoinSatisfiedEvent extends BaseCausalEvent {
  type: "parallel.join.satisfied";
  barrierId: string;
  policy: FanInPolicy;
  completedBranchIds: string[];
  waitingNodeId: string;
  waitingNodeLabel: string;
}

export interface ParallelJoinFailedEvent extends BaseCausalEvent {
  type: "parallel.join.failed";
  barrierId: string;
  policy: FanInPolicy;
  failedBranchIds: string[];
  waitingNodeId: string;
  reason: string;
}

// ----------------------------------------------------------------------------
// Messaging & Queue Events
// ----------------------------------------------------------------------------

export interface MessageCreatedEvent extends BaseCausalEvent {
  type: "message.created";
  message: ModeledMessage;
  producerNodeId: string;
  destinationQueueId: string;
}

export interface MessagePublishedEvent extends BaseCausalEvent {
  type: "message.published";
  message: ModeledMessage;
  producerNodeId: string;
  destinationQueueId: string;
  edgeId?: string;
}

export interface MessageEnqueuedEvent extends BaseCausalEvent {
  type: "message.enqueued";
  messageId: string;
  queueId: string;
  queueName: string;
  queueDepth: number;
}

export interface MessageDeliveredEvent extends BaseCausalEvent {
  type: "message.delivered";
  messageId: string;
  queueId: string;
  consumerNodeId: string;
  consumerLabel: string;
  attempt: number;
}

export interface MessageProcessingStartedEvent extends BaseCausalEvent {
  type: "message.processing.started";
  messageId: string;
  consumerNodeId: string;
  consumerLabel: string;
  attempt: number;
  operation: string;
}

export interface MessageProcessingCompletedEvent extends BaseCausalEvent {
  type: "message.processing.completed";
  messageId: string;
  consumerNodeId: string;
  consumerLabel?: string;
  attempt: number;
}

export interface MessageAcknowledgedEvent extends BaseCausalEvent {
  type: "message.acknowledged";
  messageId: string;
  consumerNodeId: string;
  consumerLabel: string;
  attempt: number;
}

export interface MessageNackedEvent extends BaseCausalEvent {
  type: "message.nacked";
  messageId: string;
  consumerNodeId: string;
  consumerLabel: string;
  attempt: number;
  reason: string;
  willRetry: boolean;
}

export interface MessageRetryScheduledEvent extends BaseCausalEvent {
  type: "message.retry.scheduled";
  messageId: string;
  attempt: number;
  retryAtMs: number;
  delayMs: number;
}

export interface MessageDeadLetteredEvent extends BaseCausalEvent {
  type: "message.deadlettered";
  messageId: string;
  dlqId: string;
  attempts: number;
  reason: string;
}

export interface MessageDeduplicatedEvent extends BaseCausalEvent {
  type: "message.deduplicated";
  messageId: string;
  idempotencyKey: string;
  consumerNodeId: string;
}

// ----------------------------------------------------------------------------
// Distributed Tracing Events
// ----------------------------------------------------------------------------

export interface SpanStartedEvent extends BaseCausalEvent {
  type: "span.started";
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  componentId: string;
  componentLabel?: string;
  name: string;
}

export interface SpanCompletedEvent extends BaseCausalEvent {
  type: "span.completed";
  spanId: string;
  traceId: string;
  durationMs: number;
  status: "success" | "error";
}

export type CausalExecutionEvent =
  | ParallelFanOutStartedEvent
  | ParallelBranchCreatedEvent
  | ParallelBranchStartedEvent
  | ParallelBranchCompletedEvent
  | ParallelBranchFailedEvent
  | ParallelBranchCancelledEvent
  | ParallelJoinWaitingEvent
  | ParallelJoinSatisfiedEvent
  | ParallelJoinFailedEvent
  | MessageCreatedEvent
  | MessagePublishedEvent
  | MessageEnqueuedEvent
  | MessageDeliveredEvent
  | MessageProcessingStartedEvent
  | MessageProcessingCompletedEvent
  | MessageAcknowledgedEvent
  | MessageNackedEvent
  | MessageRetryScheduledEvent
  | MessageDeadLetteredEvent
  | MessageDeduplicatedEvent
  | SpanStartedEvent
  | SpanCompletedEvent;
