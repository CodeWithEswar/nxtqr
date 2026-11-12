import type { ExecutionOutcome, ExecutionRequest } from "../schemas/execution.schemas";

export interface BaseExecutionEvent {
  id: string;
  sequence: number;
  atMs: number;
  durationMs: number;
  explanation: string;
}

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

export type ExecutionEvent =
  | RunStartedEvent
  | NodeEnteredEvent
  | RouteSelectedEvent
  | NodeExitedEvent
  | EdgeTraversedEvent
  | RunCompletedEvent;

