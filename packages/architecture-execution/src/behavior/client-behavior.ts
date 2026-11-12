import type { ComponentBehaviorAdapter, ComponentBehaviorContext, ComponentBehaviorResult } from "./behavior-adapter";
import type { ExecutionEvent } from "../domain/execution-event";

export class ClientBehaviorAdapter implements ComponentBehaviorAdapter {
  public readonly id = "client.http";
  public readonly version = "1.0.0";
  public readonly supportedTypes = ["client", "browser", "mobile", "frontend", "iot"];

  public execute(ctx: ComponentBehaviorContext): ComponentBehaviorResult {
    const { node, request, outEdges, runId, getSequence, simulatedTimeMs } = ctx;
    const events: ExecutionEvent[] = [];

    // 1. Request Created Event
    events.push({
      id: `evt_${runId}_${getSequence()}_req_created_${node.id}`,
      sequence: ctx.getSequence(),
      type: "request.created",
      atMs: simulatedTimeMs,
      durationMs: 50,
      explanation: `Client "${node.label || node.id}" initiated ${request.method} ${request.path} [correlation: ${request.correlationId}].`,
      request,
    });

    if (outEdges.length === 0) {
      return {
        events,
        durationMs: 50,
        outgoingRequests: [],
        outcome: "blocked",
        reason: `Client "${node.label || node.id}" has no outgoing connection to dispatch request.`,
      };
    }

    const firstEdge = outEdges[0];
    const outgoingRequest = {
      ...request,
      sourceNodeId: node.id,
      targetNodeId: firstEdge.target,
    };

    events.push({
      id: `evt_${runId}_${getSequence()}_req_dispatched_${node.id}`,
      sequence: ctx.getSequence(),
      type: "request.dispatched",
      atMs: simulatedTimeMs + 50,
      durationMs: 100,
      explanation: `Client "${node.label || node.id}" dispatched request along wire "${firstEdge.label || firstEdge.id}" to component "${firstEdge.target}".`,
      request: outgoingRequest,
      fromNodeId: node.id,
      toNodeId: firstEdge.target,
      edgeId: firstEdge.id,
    });

    return {
      events,
      durationMs: 150,
      outgoingRequests: [
        {
          request: outgoingRequest,
          edgeId: firstEdge.id,
          targetNodeId: firstEdge.target,
        },
      ],
      outcome: "continue",
      reason: `Request successfully dispatched toward "${firstEdge.target}".`,
    };
  }
}
