import type { ExecutionOutcome, ExecutionConfiguration } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "./execution-event";

export interface VisualizationFrame {
  frameIndex: number;
  virtualTimeMs: number;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  activeEvent: ExecutionEvent;
  travelingRequest?: {
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    progress: number; // 0.0 to 1.0 along the edge
  };
  stepTitle: string;
  stepExplanation: string;
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
   * Generates discrete visualization frames synchronized with virtual time and events
   */
  public static generateFrames(events: ExecutionEvent[]): VisualizationFrame[] {
    const frames: VisualizationFrame[] = [];

    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      let activeNodeIds: string[] = [];
      let activeEdgeIds: string[] = [];
      let travelingRequest: VisualizationFrame["travelingRequest"] = undefined;
      let stepTitle = "";

      switch (evt.type) {
        case "run.started":
          activeNodeIds = [evt.entryNodeId];
          stepTitle = "Execution Initiated";
          break;

        case "node.entered":
          activeNodeIds = [evt.nodeId];
          stepTitle = `Request Arrived at ${evt.nodeLabel}`;
          break;

        case "route.selected":
          activeNodeIds = [evt.nodeId];
          activeEdgeIds = [evt.selectedEdgeId];
          stepTitle = `Route Selected from ${evt.nodeId}`;
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
          };
          break;

        case "run.completed":
          activeNodeIds = [evt.terminalNodeId];
          stepTitle = `Execution ${evt.outcome.toUpperCase()}`;
          break;
      }

      frames.push({
        frameIndex: i,
        virtualTimeMs: evt.atMs,
        activeNodeIds,
        activeEdgeIds,
        activeEvent: evt,
        travelingRequest,
        stepTitle,
        stepExplanation: evt.explanation,
      });
    }

    return frames;
  }
}
