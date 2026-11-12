import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import type { ExecutionTrace } from "./execution-trace";

export interface ExecutionRun {
  id: string;
  architectureId: string;
  architectureRevisionId: string;
  snapshotHash: string;
  configuration: ExecutionConfiguration;
  trace: ExecutionTrace;
  createdAt: string;
}

