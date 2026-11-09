import type { GraphErrorCode } from "../schemas/graph.schema";

export class GraphEditorError extends Error {
  public readonly code: GraphErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: GraphErrorCode, message: string, details?: Record<string, unknown>) {
    super(`[GraphEditor] ${code}: ${message}`);
    this.name = "GraphEditorError";
    this.code = code;
    this.details = details;
  }
}

