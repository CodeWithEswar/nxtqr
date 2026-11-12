import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ModeledHttpRequest, ModeledHttpResponse, BehaviorScenario } from "../schemas/behavior.schemas";
import type { ExecutionEvent } from "../domain/execution-event";
import type { ModeledRuntimeState } from "../domain/runtime-state";

export interface ComponentBehaviorContext {
  node: BaseNode;
  request: ModeledHttpRequest;
  runtimeState: ModeledRuntimeState;
  simulatedTimeMs: number;
  outEdges: BaseEdge[];
  nodeMap: Map<string, BaseNode>;
  scenario: BehaviorScenario;
  runId: string;
  getSequence: () => number;
}

export interface ComponentBehaviorResult {
  events: ExecutionEvent[];
  durationMs: number;
  outgoingRequests: {
    request: ModeledHttpRequest;
    edgeId: string;
    targetNodeId: string;
  }[];
  response?: ModeledHttpResponse;
  outcome: "continue" | "respond" | "blocked";
  reason: string;
}

export interface ComponentBehaviorAdapter {
  id: string;
  version: string;
  supportedTypes: string[];
  execute(ctx: ComponentBehaviorContext): ComponentBehaviorResult;
}
