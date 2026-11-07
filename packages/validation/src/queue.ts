import { z } from "zod";

export const QueueMessageEnvelopeSchema = z.object({
  version: z.string().default("1.0.0"),
  eventId: z.string().min(1),
  jobId: z.string().min(1),
  workspaceId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  timestamp: z.string().datetime(),
  payload: z.unknown(),
  correlationId: z.string().min(1),
});

export type QueueMessageEnvelopeValidated = z.infer<typeof QueueMessageEnvelopeSchema>;
