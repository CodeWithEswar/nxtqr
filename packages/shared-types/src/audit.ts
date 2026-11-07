export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  eventType: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}
