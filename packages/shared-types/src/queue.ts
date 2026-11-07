export interface QueueMessageEnvelope<T = unknown> {
  version: string;
  eventId: string;
  jobId: string;
  workspaceId?: string;
  userId?: string;
  timestamp: string;
  payload: T;
  correlationId: string;
}

export type QueueType = "simulation" | "analytics" | "notifications";
