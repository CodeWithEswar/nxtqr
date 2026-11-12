import type { BaseNode } from "@nxtqr/graph-schema";
import type { ExecutionRequest } from "../schemas/execution.schemas";

export interface ComponentExecutionContext {
  node: BaseNode;
  request: ExecutionRequest;
  hopIndex: number;
  simulatedTimeMs: number;
}

export interface ComponentExecutionResult {
  durationMs: number;
  stepOutcome: "pass" | "degraded" | "blocked";
  explanation: string;
  responseMetadata?: {
    statusCode?: number;
    statusText?: string;
    cached?: boolean;
    queueDepth?: number;
    notes?: string;
  };
}

export interface ComponentExecutionAdapter {
  readonly componentType: string;
  plan(context: ComponentExecutionContext): ComponentExecutionResult;
}

