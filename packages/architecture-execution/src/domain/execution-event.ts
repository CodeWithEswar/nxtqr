import type { ExecutionOutcome, ExecutionRequest } from "../schemas/execution.schemas";
import type { ModeledHttpRequest, ModeledHttpResponse } from "../schemas/behavior.schemas";
import type { ModeledRuntimeState } from "./runtime-state";
import type { CausalExecutionEvent } from "./causal-event";
import type { ResilienceEvent } from "../resilience/fault-events";
import type { TrafficExecutionEvent } from "../traffic/traffic-events";
import type { DatabaseExecutionEvent } from "../database/database-events";
import type { CacheExecutionEvent } from "../cache/cache-events";
import type { SecurityExecutionEvent } from "../security/security-events";
import type { StreamingExecutionEvent } from "../streaming/streaming-events";
import type { KubernetesExecutionEvent } from "../kubernetes/kubernetes-events";

export interface BaseExecutionEvent {
  id: string;
  sequence: number;
  atMs: number;
  durationMs: number;
  explanation: string;
  branchId?: string;
  traceId?: string;
  spanId?: string;
  stateSnapshot?: ModeledRuntimeState;
}

// 1. Core Run Lifecycle Events
export interface RunStartedEvent extends BaseExecutionEvent {
  type: "run.started";
  entryNodeId: string;
  request: ExecutionRequest;
}

export interface NodeEnteredEvent extends BaseExecutionEvent {
  type: "node.entered";
  nodeId: string;
  nodeLabel: string;
  componentType: string;
  hopIndex: number;
  request: ExecutionRequest;
}

export interface RouteSelectedEvent extends BaseExecutionEvent {
  type: "route.selected";
  nodeId: string;
  selectedEdgeId: string;
  targetNodeId: string;
  decisionReason: string;
  availableEdgeIds: string[];
}

export interface NodeExitedEvent extends BaseExecutionEvent {
  type: "node.exited";
  nodeId: string;
  nodeLabel: string;
  componentType: string;
  stepOutcome: "pass" | "degraded" | "blocked";
}

export interface EdgeTraversedEvent extends BaseExecutionEvent {
  type: "edge.traversed";
  edgeId: string;
  edgeLabel: string;
  sourceNodeId: string;
  targetNodeId: string;
  protocol: string;
}

export interface RunCompletedEvent extends BaseExecutionEvent {
  type: "run.completed";
  outcome: ExecutionOutcome;
  terminalNodeId: string;
  terminalReason: string;
  totalHops: number;
}

// 2. Advanced Request & Response Lifecycle Events
export interface RequestCreatedEvent extends BaseExecutionEvent {
  type: "request.created";
  request: ModeledHttpRequest;
  nodeId?: string;
}

export interface RequestDispatchedEvent extends BaseExecutionEvent {
  type: "request.dispatched";
  request: ModeledHttpRequest;
  fromNodeId: string;
  toNodeId: string;
  edgeId: string;
}

export interface RequestReceivedEvent extends BaseExecutionEvent {
  type: "request.received";
  request: ModeledHttpRequest;
  nodeId: string;
  nodeLabel: string;
}

export interface RequestForwardedEvent extends BaseExecutionEvent {
  type: "request.forwarded";
  request: ModeledHttpRequest;
  fromNodeId: string;
  toNodeId: string;
  edgeId: string;
}

export interface ResponseCreatedEvent extends BaseExecutionEvent {
  type: "response.created";
  response: ModeledHttpResponse;
  nodeId: string;
  nodeLabel: string;
}

export interface ResponseDispatchedEvent extends BaseExecutionEvent {
  type: "response.dispatched";
  response: ModeledHttpResponse;
  fromNodeId: string;
  toNodeId: string;
  edgeId: string;
}

export interface ResponseReceivedEvent extends BaseExecutionEvent {
  type: "response.received";
  response: ModeledHttpResponse;
  nodeId: string;
  nodeLabel: string;
}

// 3. Routing & Load Balancing Events
export interface RouteMatchSelectedEvent extends BaseExecutionEvent {
  type: "route.match.selected";
  nodeId: string;
  ruleId: string;
  pattern: string;
  targetNodeId: string;
  targetNodeLabel: string;
  decisionReason: string;
}

export interface RouteMatchFailedEvent extends BaseExecutionEvent {
  type: "route.match.failed";
  nodeId: string;
  path: string;
  method: string;
  decisionReason: string;
}

export interface RouteUpstreamSelectedEvent extends BaseExecutionEvent {
  type: "route.upstream.selected";
  nodeId: string;
  strategy: "round-robin" | "weighted" | "explicit";
  selectedTargetId: string;
  selectedTargetLabel: string;
  index: number;
  poolSize: number;
}

// 4. Cache Events
export interface CacheLookupStartedEvent extends BaseExecutionEvent {
  type: "cache.lookup.started";
  cacheNodeId: string;
  key: string;
}

export interface CacheHitEvent extends BaseExecutionEvent {
  type: "cache.hit";
  cacheNodeId: string;
  key: string;
  valuePreview: unknown;
  ttlRemainingMs: number;
}

export interface CacheMissEvent extends BaseExecutionEvent {
  type: "cache.miss";
  cacheNodeId: string;
  key: string;
  decisionReason: string;
}

export interface CacheWriteEvent extends BaseExecutionEvent {
  type: "cache.write";
  cacheNodeId: string;
  key: string;
  valuePreview: unknown;
  ttlMs: number;
}

// 5. Database Fixture Events
export interface DatabaseReadStartedEvent extends BaseExecutionEvent {
  type: "database.read.started";
  dbNodeId: string;
  table: string;
  key: string;
}

export interface DatabaseReadCompletedEvent extends BaseExecutionEvent {
  type: "database.read.completed";
  dbNodeId: string;
  table: string;
  key: string;
  found: boolean;
  rowPreview?: unknown;
}

export interface DatabaseWriteCompletedEvent extends BaseExecutionEvent {
  type: "database.write.completed";
  dbNodeId: string;
  table: string;
  key: string;
  operation: "insert" | "update" | "delete";
  rowPreview?: unknown;
}

export interface DatabaseOperationFailedEvent extends BaseExecutionEvent {
  type: "database.operation.failed";
  dbNodeId: string;
  table: string;
  key: string;
  error: string;
}

// 6. Component Processing Events
export interface ComponentProcessingStartedEvent extends BaseExecutionEvent {
  type: "component.processing.started";
  nodeId: string;
  operation: string;
}

export interface ComponentProcessingCompletedEvent extends BaseExecutionEvent {
  type: "component.processing.completed";
  nodeId: string;
  operation: string;
  status: "success" | "error";
}

export type ExecutionEvent =
  | RunStartedEvent
  | NodeEnteredEvent
  | RouteSelectedEvent
  | NodeExitedEvent
  | EdgeTraversedEvent
  | RunCompletedEvent
  | RequestCreatedEvent
  | RequestDispatchedEvent
  | RequestReceivedEvent
  | RequestForwardedEvent
  | ResponseCreatedEvent
  | ResponseDispatchedEvent
  | ResponseReceivedEvent
  | RouteMatchSelectedEvent
  | RouteMatchFailedEvent
  | RouteUpstreamSelectedEvent
  | CacheLookupStartedEvent
  | CacheHitEvent
  | CacheMissEvent
  | CacheWriteEvent
  | DatabaseReadStartedEvent
  | DatabaseReadCompletedEvent
  | DatabaseWriteCompletedEvent
  | DatabaseOperationFailedEvent
  | ComponentProcessingStartedEvent
  | ComponentProcessingCompletedEvent
  | CausalExecutionEvent
  | ResilienceEvent
  | TrafficExecutionEvent
  | DatabaseExecutionEvent
  | CacheExecutionEvent
  | SecurityExecutionEvent
  | StreamingExecutionEvent
  | KubernetesExecutionEvent;
