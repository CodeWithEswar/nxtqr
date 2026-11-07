import type { GraphDocument } from "@nxtqr/graph-schema";

export type SimulationStatus = "idle" | "running" | "paused" | "completed" | "failed";

export interface SimulationEvent<TPayload = unknown> {
  id: string;
  step: number;
  timestamp: number;
  type: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  edgeId?: string;
  payload: TPayload;
}

export interface SimulationResult {
  simulationId: string;
  status: SimulationStatus;
  totalSteps: number;
  durationMs: number;
  events: SimulationEvent[];
  error?: string;
}

export interface SimulationRunner {
  initialize(document: GraphDocument, parameters?: Record<string, unknown>): Promise<void>;
  step(): Promise<SimulationEvent | null>;
  run(): Promise<SimulationResult>;
  pause(): void;
  reset(): void;
  getStatus(): SimulationStatus;
}
