import type { ExecutionOutcome, ExecutionConfiguration } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "./execution-event";
import type { ModeledRuntimeState } from "./runtime-state";
import type { ModeledHttpRequest, ModeledHttpResponse } from "../schemas/behavior.schemas";

export interface TravelingMarkerData {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  progress: number; // 0.0 to 1.0 along the edge
  direction: "request" | "response";
}

export interface VisualizationFrame {
  frameIndex: number;
  virtualTimeMs: number;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  activeEvent: ExecutionEvent;
  direction: "request" | "response";
  travelingRequest?: TravelingMarkerData;
  stepTitle: string;
  stepExplanation: string;
  runtimeState?: ModeledRuntimeState;
  activeRequest?: ModeledHttpRequest;
  activeResponse?: ModeledHttpResponse;
}

export interface ExecutionTrace {
  runId: string;
  architectureId: string;
  architectureRevisionId: string;
  snapshotHash: string;
  configuration: ExecutionConfiguration;
  events: ExecutionEvent[];
  totalDurationMs: number;
  totalEvents: number;
  totalHops: number;
  outcome: ExecutionOutcome;
  terminalReason: string;
  visitedNodeIds: string[];
  traversedEdgeIds: string[];
  frames: VisualizationFrame[];
  createdAt: string;
}

export class ExecutionTraceHelper {
  /**
   * Generates discrete visualization frames synchronized with virtual time, events, and runtime state
   */
  public static generateFrames(
    events: ExecutionEvent[],
    stateSnapshots?: (ModeledRuntimeState | undefined)[]
  ): VisualizationFrame[] {
    const frames: VisualizationFrame[] = [];

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      let activeNodeIds: string[] = [];
      let activeEdgeIds: string[] = [];
      let travelingRequest: TravelingMarkerData | undefined = undefined;
      let stepTitle = "";
      let direction: "request" | "response" = "request";

      switch (evt.type) {
        case "run.started":
          activeNodeIds = [evt.entryNodeId];
          stepTitle = "Execution Initiated";
          direction = "request";
          break;

        case "request.created":
          activeNodeIds = [evt.request.sourceNodeId];
          stepTitle = `Request Created (${evt.request.method} ${evt.request.path})`;
          direction = "request";
          break;

        case "request.dispatched":
          activeNodeIds = [evt.fromNodeId];
          activeEdgeIds = [evt.edgeId];
          stepTitle = `Dispatching ${evt.request.method} to ${evt.toNodeId}`;
          direction = "request";
          travelingRequest = {
            edgeId: evt.edgeId,
            sourceNodeId: evt.fromNodeId,
            targetNodeId: evt.toNodeId,
            progress: 1.0,
            direction: "request",
          };
          break;

        case "request.received":
        case "node.entered":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Request Arrived at ${evt.nodeLabel}`;
          direction = "request";
          break;

        case "request.forwarded":
          activeNodeIds = [evt.fromNodeId];
          activeEdgeIds = [evt.edgeId];
          stepTitle = `Forwarding Request to ${evt.toNodeId}`;
          direction = "request";
          travelingRequest = {
            edgeId: evt.edgeId,
            sourceNodeId: evt.fromNodeId,
            targetNodeId: evt.toNodeId,
            progress: 1.0,
            direction: "request",
          };
          break;

        case "route.match.selected":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Gateway Match: ${evt.pattern} → ${evt.targetNodeLabel}`;
          direction = "request";
          break;

        case "route.match.failed":
          activeNodeIds = [evt.nodeId];
          stepTitle = `No Gateway Route for ${evt.path}`;
          direction = "request";
          break;

        case "route.upstream.selected":
          activeNodeIds = [evt.nodeId];
          stepTitle = `LB Upstream Selected (${evt.strategy}): ${evt.selectedTargetLabel}`;
          direction = "request";
          break;

        case "cache.lookup.started":
          activeNodeIds = [evt.cacheNodeId];
          stepTitle = `Cache Lookup for "${evt.key}"`;
          direction = "request";
          break;

        case "cache.hit":
          activeNodeIds = [evt.cacheNodeId];
          stepTitle = `Cache Hit for "${evt.key}"`;
          direction = "response";
          break;

        case "cache.miss":
          activeNodeIds = [evt.cacheNodeId];
          stepTitle = `Cache Miss for "${evt.key}"`;
          direction = "request";
          break;

        case "cache.write":
          activeNodeIds = [evt.cacheNodeId];
          stepTitle = `Stored "${evt.key}" in Cache (TTL ${evt.ttlMs}ms)`;
          direction = "response";
          break;

        case "database.read.started":
          activeNodeIds = [evt.dbNodeId];
          stepTitle = `Database Read: "${evt.table}" PK="${evt.key}"`;
          direction = "request";
          break;

        case "database.read.completed":
          activeNodeIds = [evt.dbNodeId];
          stepTitle = `Database Read: ${evt.found ? "Record Found" : "Not Found"}`;
          direction = "response";
          break;

        case "database.write.completed":
          activeNodeIds = [evt.dbNodeId];
          stepTitle = `Database ${evt.operation.toUpperCase()}: "${evt.table}" [${evt.key}]`;
          direction = "response";
          break;

        case "database.operation.failed":
          activeNodeIds = [evt.dbNodeId];
          stepTitle = `Database Error: ${evt.error}`;
          direction = "response";
          break;

        case "response.created":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Constructed Response HTTP ${evt.response.status}`;
          direction = "response";
          break;

        case "response.dispatched":
          activeNodeIds = [evt.fromNodeId];
          activeEdgeIds = [evt.edgeId];
          stepTitle = `Returning Response HTTP ${evt.response.status} to ${evt.toNodeId}`;
          direction = "response";
          travelingRequest = {
            edgeId: evt.edgeId,
            sourceNodeId: evt.fromNodeId,
            targetNodeId: evt.toNodeId,
            progress: 1.0,
            direction: "response",
          };
          break;

        case "response.received":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Response Received at ${evt.nodeLabel} (HTTP ${evt.response.status})`;
          direction = "response";
          break;

        case "route.selected":
          activeNodeIds = [evt.nodeId];
          activeEdgeIds = [evt.selectedEdgeId];
          stepTitle = `Route Selected from ${evt.nodeId}`;
          direction = "request";
          break;

        case "node.exited":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Processed by ${evt.nodeLabel}`;
          break;

        case "edge.traversed":
          activeEdgeIds = [evt.edgeId];
          activeNodeIds = [evt.sourceNodeId, evt.targetNodeId];
          stepTitle = `Traversing ${evt.edgeLabel || evt.edgeId}`;
          travelingRequest = {
            edgeId: evt.edgeId,
            sourceNodeId: evt.sourceNodeId,
            targetNodeId: evt.targetNodeId,
            progress: 1.0,
            direction: "request",
          };
          break;

        case "component.processing.started":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Executing: ${evt.operation}`;
          break;

        case "component.processing.completed":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Completed: ${evt.operation}`;
          break;

        case "run.completed":
          activeNodeIds = [evt.terminalNodeId];
          stepTitle = `Execution ${evt.outcome.toUpperCase()}`;
          direction = "response";
          break;
      }

      const frameRuntimeState = stateSnapshots ? stateSnapshots[i] : undefined;
      const activeRequest = (evt as any).request || frameRuntimeState?.activeRequest;
      const activeResponse = (evt as any).response || frameRuntimeState?.activeResponse;

      frames.push({
        frameIndex: i,
        virtualTimeMs: evt.atMs,
        activeNodeIds,
        activeEdgeIds,
        activeEvent: evt,
        direction,
        travelingRequest,
        stepTitle,
        stepExplanation: evt.explanation,
        runtimeState: frameRuntimeState,
        activeRequest,
        activeResponse,
      });
    }

    return frames;
  }
}
