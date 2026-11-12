import type { ExecutionEvent } from "../domain/execution-event";
import type { ExecutionOutcome, ExecutionRequest } from "../schemas/execution.schemas";

export class EventBuilder {
  public static createEventId(
    runId: string,
    sequence: number,
    eventType: string,
    targetKey: string
  ): string {
    const cleanType = eventType.replace(/\./g, "_");
    const cleanTarget = targetKey.replace(/[^a-zA-Z0-9_-]/g, "");
    return `evt_${runId.slice(-6)}_${sequence}_${cleanType}_${cleanTarget}`;
  }

  public static buildRunStartedEvent(
    runId: string,
    sequence: number,
    atMs: number,
    entryNodeId: string,
    entryNodeLabel: string,
    request: ExecutionRequest
  ): ExecutionEvent {
    return {
      type: "run.started",
      id: this.createEventId(runId, sequence, "run.started", entryNodeId),
      sequence,
      atMs,
      durationMs: 0,
      entryNodeId,
      request,
      explanation: `Execution started at "${entryNodeLabel || entryNodeId}" handling ${request.method} ${request.path}.`,
    };
  }

  public static buildNodeEnteredEvent(
    runId: string,
    sequence: number,
    atMs: number,
    durationMs: number,
    nodeId: string,
    nodeLabel: string,
    componentType: string,
    hopIndex: number,
    request: ExecutionRequest
  ): ExecutionEvent {
    return {
      type: "node.entered",
      id: this.createEventId(runId, sequence, "node.entered", nodeId),
      sequence,
      atMs,
      durationMs,
      nodeId,
      nodeLabel: nodeLabel || nodeId,
      componentType,
      hopIndex,
      request,
      explanation: `Request reached component "${nodeLabel || nodeId}" (${componentType}) at hop #${hopIndex}. Processing simulated payload.`,
    };
  }

  public static buildRouteSelectedEvent(
    runId: string,
    sequence: number,
    atMs: number,
    durationMs: number,
    nodeId: string,
    selectedEdgeId: string,
    targetNodeId: string,
    targetNodeLabel: string,
    decisionReason: string,
    availableEdgeIds: string[]
  ): ExecutionEvent {
    return {
      type: "route.selected",
      id: this.createEventId(runId, sequence, "route.selected", selectedEdgeId),
      sequence,
      atMs,
      durationMs,
      nodeId,
      selectedEdgeId,
      targetNodeId,
      decisionReason,
      availableEdgeIds,
      explanation: `Routing decision: Dispatched along "${selectedEdgeId}" towards "${targetNodeLabel || targetNodeId}". Reason: ${decisionReason}.`,
    };
  }

  public static buildNodeExitedEvent(
    runId: string,
    sequence: number,
    atMs: number,
    durationMs: number,
    nodeId: string,
    nodeLabel: string,
    componentType: string,
    stepOutcome: "pass" | "degraded" | "blocked"
  ): ExecutionEvent {
    return {
      type: "node.exited",
      id: this.createEventId(runId, sequence, "node.exited", nodeId),
      sequence,
      atMs,
      durationMs,
      nodeId,
      nodeLabel: nodeLabel || nodeId,
      componentType,
      stepOutcome,
      explanation: `Component "${nodeLabel || nodeId}" completed local processing (${stepOutcome.toUpperCase()}) in ${durationMs}ms.`,
    };
  }

  public static buildEdgeTraversedEvent(
    runId: string,
    sequence: number,
    atMs: number,
    durationMs: number,
    edgeId: string,
    edgeLabel: string,
    sourceNodeId: string,
    sourceNodeLabel: string,
    targetNodeId: string,
    targetNodeLabel: string,
    protocol: string
  ): ExecutionEvent {
    return {
      type: "edge.traversed",
      id: this.createEventId(runId, sequence, "edge.traversed", edgeId),
      sequence,
      atMs,
      durationMs,
      edgeId,
      edgeLabel: edgeLabel || `${sourceNodeLabel || sourceNodeId} → ${targetNodeLabel || targetNodeId}`,
      sourceNodeId,
      targetNodeId,
      protocol,
      explanation: `Payload transit over wire "${edgeLabel || edgeId}" from "${sourceNodeLabel || sourceNodeId}" to "${targetNodeLabel || targetNodeId}" via ${protocol.toUpperCase()} (${durationMs}ms simulated).`,
    };
  }

  public static buildRunCompletedEvent(
    runId: string,
    sequence: number,
    atMs: number,
    terminalNodeId: string,
    terminalNodeLabel: string,
    outcome: ExecutionOutcome,
    terminalReason: string,
    totalHops: number
  ): ExecutionEvent {
    return {
      type: "run.completed",
      id: this.createEventId(runId, sequence, "run.completed", terminalNodeId),
      sequence,
      atMs,
      durationMs: 0,
      outcome,
      terminalNodeId,
      terminalReason,
      totalHops,
      explanation: `Execution finalized with status ${outcome.toUpperCase()} at "${terminalNodeLabel || terminalNodeId}" after ${totalHops} hops. Details: ${terminalReason}`,
    };
  }
}

