import type { ExecutionOutcome, ExecutionConfiguration } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "./execution-event";
import type { ModeledRuntimeState } from "./runtime-state";
import type { ModeledHttpRequest, ModeledHttpResponse } from "../schemas/behavior.schemas";
import type { TraceSpan, ExecutionBranch } from "../schemas/distributed.schemas";

export interface TravelingMarkerData {
  id?: string;
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  progress: number; // 0.0 to 1.0 along the edge
  direction: "request" | "response" | "message" | "acknowledgment";
  kind?: "request" | "response" | "message" | "acknowledgment";
  branchId?: string;
  label?: string;
}

export interface VisualizationFrame {
  frameIndex: number;
  virtualTimeMs: number;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  activeEvent: ExecutionEvent;
  direction: "request" | "response" | "message" | "acknowledgment";
  travelingRequest?: TravelingMarkerData;
  travelingPackets?: TravelingMarkerData[];
  stepTitle: string;
  stepExplanation: string;
  runtimeState?: ModeledRuntimeState;
  activeRequest?: ModeledHttpRequest;
  activeResponse?: ModeledHttpResponse;
  activeSpans?: TraceSpan[];
  activeBranches?: ExecutionBranch[];
  criticalPathSpanIds?: string[];
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
  spans?: TraceSpan[];
  criticalPathSpanIds?: string[];
  createdAt: string;
}

export class ExecutionTraceHelper {
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
      const travelingPackets: TravelingMarkerData[] = [];
      let stepTitle = "";
      let direction: "request" | "response" | "message" | "acknowledgment" = "request";

      switch (evt.type) {
        case "run.started":
          activeNodeIds = [evt.entryNodeId];
          stepTitle = "Execution Started";
          direction = "request";
          break;

        case "request.created":
          activeNodeIds = evt.nodeId ? [evt.nodeId] : [];
          stepTitle = `Client Request Created (${evt.request.method} ${evt.request.path})`;
          direction = "request";
          break;

        case "request.dispatched":
          activeNodeIds = [evt.fromNodeId];
          activeEdgeIds = [evt.edgeId];
          stepTitle = `Dispatching ${evt.request.method} ${evt.request.path}`;
          direction = "request";
          travelingRequest = {
            id: `pkt_req_${evt.id}`,
            edgeId: evt.edgeId,
            sourceNodeId: evt.fromNodeId,
            targetNodeId: evt.toNodeId,
            progress: 1.0,
            direction: "request",
            kind: "request",
            label: evt.request.method,
          };
          travelingPackets.push(travelingRequest);
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
            id: `pkt_fwd_${evt.id}`,
            edgeId: evt.edgeId,
            sourceNodeId: evt.fromNodeId,
            targetNodeId: evt.toNodeId,
            progress: 1.0,
            direction: "request",
            kind: "request",
            label: "REQ",
          };
          travelingPackets.push(travelingRequest);
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
            id: `pkt_resp_${evt.id}`,
            edgeId: evt.edgeId,
            sourceNodeId: evt.fromNodeId,
            targetNodeId: evt.toNodeId,
            progress: 1.0,
            direction: "response",
            kind: "response",
            label: `HTTP ${evt.response.status}`,
          };
          travelingPackets.push(travelingRequest);
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
            id: `pkt_edge_${evt.id}`,
            edgeId: evt.edgeId,
            sourceNodeId: evt.sourceNodeId,
            targetNodeId: evt.targetNodeId,
            progress: 1.0,
            direction: "request",
            kind: "request",
            label: "REQ",
          };
          travelingPackets.push(travelingRequest);
          break;

        case "component.processing.started":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Executing: ${evt.operation}`;
          break;

        case "component.processing.completed":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Completed: ${evt.operation}`;
          break;

        // Phase 05.4.3: Distributed Parallel & Messaging Events
        case "parallel.fanout.started":
          activeNodeIds = [evt.parentNodeId];
          stepTitle = `Fan-Out: Launching ${evt.branches.length} Parallel Calls`;
          direction = "request";
          break;

        case "parallel.branch.created":
          activeNodeIds = [evt.originNodeId, evt.targetNodeId];
          stepTitle = `Created Parallel Branch: ${evt.branchId}`;
          direction = "request";
          break;

        case "parallel.branch.started":
          activeNodeIds = [evt.targetNodeId];
          stepTitle = `Branch Started: ${evt.targetNodeLabel} (${evt.operation})`;
          direction = "request";
          break;

        case "parallel.branch.completed":
          activeNodeIds = [evt.targetNodeId];
          stepTitle = `Branch Completed: ${evt.targetNodeLabel} (+${evt.durationMs}ms)`;
          direction = "response";
          break;

        case "parallel.branch.failed":
          activeNodeIds = [evt.targetNodeId];
          stepTitle = `Branch Failed on ${evt.targetNodeLabel}: ${evt.error}`;
          direction = "response";
          break;

        case "parallel.branch.cancelled":
          activeNodeIds = [];
          stepTitle = `Branch Cancelled: ${evt.branchId}`;
          break;

        case "parallel.join.waiting":
          activeNodeIds = [evt.waitingNodeId];
          stepTitle = `Fan-In Barrier Waiting (${evt.policy.toUpperCase()}): ${evt.pendingBranchIds.length} pending`;
          direction = "request";
          break;

        case "parallel.join.satisfied":
          activeNodeIds = [evt.waitingNodeId];
          stepTitle = `Fan-In Barrier Satisfied (${evt.policy.toUpperCase()}) at ${evt.waitingNodeLabel}`;
          direction = "response";
          break;

        case "parallel.join.failed":
          activeNodeIds = [evt.waitingNodeId];
          stepTitle = `Fan-In Barrier Failed: ${evt.reason}`;
          direction = "response";
          break;

        case "message.created":
          activeNodeIds = [evt.producerNodeId];
          stepTitle = `Message Created: #${evt.message.id.slice(-6)}`;
          direction = "message";
          break;

        case "message.published":
          activeNodeIds = [evt.producerNodeId];
          activeEdgeIds = evt.edgeId ? [evt.edgeId] : [];
          stepTitle = `Message Published to ${evt.destinationQueueId}`;
          direction = "message";
          if (evt.edgeId) {
            travelingRequest = {
              id: `pkt_msg_${evt.message.id}`,
              edgeId: evt.edgeId,
              sourceNodeId: evt.producerNodeId,
              targetNodeId: evt.destinationQueueId,
              progress: 1.0,
              direction: "message",
              kind: "message",
              label: "MSG ✉",
            };
            travelingPackets.push(travelingRequest);
          }
          break;

        case "message.enqueued":
          activeNodeIds = [evt.queueId];
          stepTitle = `Message Enqueued in "${evt.queueName}" (Depth: ${evt.queueDepth})`;
          direction = "message";
          break;

        case "message.delivered":
          activeNodeIds = [evt.queueId, evt.consumerNodeId];
          activeEdgeIds = evt.edgeId ? [evt.edgeId] : [];
          stepTitle = `Message Delivered to ${evt.consumerLabel} (Attempt ${evt.attempt})`;
          direction = "message";
          if (evt.edgeId) {
            travelingRequest = {
              id: `pkt_dlv_${evt.messageId}`,
              edgeId: evt.edgeId,
              sourceNodeId: evt.queueId,
              targetNodeId: evt.consumerNodeId,
              progress: 1.0,
              direction: "message",
              kind: "message",
              label: `ATT #${evt.attempt}`,
            };
            travelingPackets.push(travelingRequest);
          }
          break;

        case "message.processing.started":
          activeNodeIds = [evt.consumerNodeId];
          stepTitle = `Worker ${evt.consumerLabel}: ${evt.operation} (Att ${evt.attempt})`;
          direction = "message";
          break;

        case "message.processing.completed":
          activeNodeIds = [evt.consumerNodeId];
          stepTitle = `Worker ${evt.consumerNodeId} Completed Processing`;
          direction = "message";
          break;

        case "message.acknowledged":
          activeNodeIds = [evt.consumerNodeId];
          activeEdgeIds = evt.edgeId ? [evt.edgeId] : [];
          stepTitle = `Message Acknowledged (ACK) by ${evt.consumerLabel}`;
          direction = "acknowledgment";
          if (evt.edgeId) {
            travelingRequest = {
              id: `pkt_ack_${evt.messageId}`,
              edgeId: evt.edgeId,
              sourceNodeId: evt.consumerNodeId,
              targetNodeId: evt.nodeId || "",
              progress: 1.0,
              direction: "acknowledgment",
              kind: "acknowledgment",
              label: "ACK ✓",
            };
            travelingPackets.push(travelingRequest);
          }
          break;

        case "message.nacked":
          activeNodeIds = [evt.consumerNodeId];
          stepTitle = `Message NACK: ${evt.reason} (${evt.willRetry ? "Retrying" : "Exhausted"})`;
          direction = "acknowledgment";
          break;

        case "message.retry.scheduled":
          activeNodeIds = [evt.nodeId || ""];
          stepTitle = `Retry Scheduled for #${evt.messageId.slice(-6)} in +${evt.delayMs}ms`;
          direction = "message";
          break;

        case "message.deadlettered":
          activeNodeIds = [evt.dlqId];
          stepTitle = `Message Dead-Lettered to "${evt.dlqId}" (${evt.reason})`;
          direction = "message";
          break;

        case "message.deduplicated":
          activeNodeIds = [evt.consumerNodeId];
          stepTitle = `Idempotent Skip: Message with key "${evt.idempotencyKey}" already processed`;
          direction = "message";
          break;

        case "span.started":
          activeNodeIds = [evt.componentId];
          stepTitle = `Span Started: ${evt.name}`;
          break;

        case "span.completed":
          activeNodeIds = [evt.nodeId || ""];
          stepTitle = `Span Completed: ${evt.spanId} (${evt.status.toUpperCase()})`;
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
      const activeSpans = frameRuntimeState?.activeSpans || [];
      const activeBranches = frameRuntimeState?.activeBranches || [];
      const criticalPathSpanIds = frameRuntimeState?.criticalPathSpanIds || [];

      frames.push({
        frameIndex: i,
        virtualTimeMs: evt.atMs,
        activeNodeIds,
        activeEdgeIds,
        activeEvent: evt,
        direction,
        travelingRequest,
        travelingPackets,
        stepTitle,
        stepExplanation: evt.explanation,
        runtimeState: frameRuntimeState,
        activeRequest,
        activeResponse,
        activeSpans,
        activeBranches,
        criticalPathSpanIds,
      });
    }

    return frames;
  }
}
