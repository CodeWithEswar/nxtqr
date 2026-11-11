import { z } from "zod";
import { graphOperationSchema } from "../../scalability/schemas/scalability.schemas";

export const AIAssistantModeSchema = z.enum([
  "explain",
  "analyze",
  "recommend",
  "compare",
  "propose",
]);

export const AICitationTypeSchema = z.enum([
  "node",
  "edge",
  "finding",
  "recommendation",
  "doc",
  "comparison",
]);

export const AICitationSchema = z.object({
  type: AICitationTypeSchema,
  targetId: z.string().min(1),
  label: z.string().min(1),
  path: z.string().optional(),
  snippet: z.string().optional(),
  category: z.string().optional(),
});

export const AIToolCallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  arguments: z.record(z.unknown()),
});

export const AIToolResultSchema = z.object({
  toolCallId: z.string().min(1),
  name: z.string().min(1),
  result: z.unknown(),
  error: z.string().optional(),
});

export const AIArchitectureProposalSchema = z.object({
  id: z.string().min(1),
  architectureId: z.string().min(1),
  baseGraphRevision: z.string().min(1),
  title: z.string().min(1),
  explanation: z.string().min(1),
  operations: z.array(graphOperationSchema),
  assumptions: z.array(z.string()),
  prerequisites: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  sourceFindingIds: z.array(z.string()),
  validationStatus: z.enum(["valid", "invalid", "pending"]),
  validationErrors: z.array(z.string()),
});

export const AIMessageRoleSchema = z.enum(["user", "assistant", "system", "tool"]);

export const AIMessageSchema = z.object({
  id: z.string().min(1),
  conversationId: z.string().min(1),
  role: AIMessageRoleSchema,
  content: z.string(),
  timestamp: z.string().min(1),
  toolCalls: z.array(AIToolCallSchema).optional(),
  toolCallId: z.string().optional(),
  name: z.string().optional(),
  citations: z.array(AICitationSchema).optional(),
  proposal: AIArchitectureProposalSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ArchitectureAIRequestSchema = z.object({
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  conversationId: z.string().optional(),
  message: z.string().min(1, "Message cannot be empty").max(4000, "Message exceeds 4000 character limit"),
  graphRevision: z.string().min(1),
  selectedNodeIds: z.array(z.string()).optional(),
  selectedEdgeIds: z.array(z.string()).optional(),
  activeScenarioId: z.string().optional(),
  mode: AIAssistantModeSchema.optional().default("explain"),
});

export const AIConversationSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  graphRevision: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});
