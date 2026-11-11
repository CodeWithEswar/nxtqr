import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphOperation } from "../../scalability/schemas/scalability.schemas";
import type { ArchitectureDataLineageModel } from "../../lineage/contracts/lineage.types";
import type { APIContract, ConsumerDependency } from "../../api-contracts/contracts/contract.types";
import type { MessagingTopology } from "../../messaging/contracts/messaging.types";
import type { DistributedStateTopology } from "../../cache-state/contracts/cache-state.types";
import type { DatabaseArchitectureTopology } from "../../database/contracts/database.types";
import type { NetworkArchitectureTopology } from "../../network/contracts/network.types";

export type AIMessageRole = "user" | "assistant" | "system" | "tool";

export type AIAssistantMode =
  | "explain"
  | "analyze"
  | "recommend"
  | "compare"
  | "propose";

export type AICitationType =
  | "node"
  | "edge"
  | "finding"
  | "recommendation"
  | "doc"
  | "comparison";

export interface AICitation {
  type: AICitationType;
  targetId: string;
  label: string;
  path?: string;
  snippet?: string;
  category?: string;
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AIToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  error?: string;
}

export interface AIArchitectureProposal {
  id: string;
  architectureId: string;
  baseGraphRevision: string;
  title: string;
  explanation: string;
  operations: GraphOperation[];
  assumptions: string[];
  prerequisites: string[];
  tradeoffs: string[];
  sourceFindingIds: string[];
  validationStatus: "valid" | "invalid" | "pending";
  validationErrors: string[];
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
  toolCalls?: AIToolCall[];
  toolCallId?: string;
  name?: string;
  citations?: AICitation[];
  proposal?: AIArchitectureProposal;
  metadata?: Record<string, unknown>;
}

export interface ArchitectureAIRequest {
  projectId: string;
  architectureId: string;
  conversationId?: string;
  message: string;
  graphRevision: string;
  selectedNodeIds?: string[];
  selectedEdgeIds?: string[];
  activeScenarioId?: string;
  mode?: AIAssistantMode;
}

export interface AIConversation {
  id: string;
  projectId: string;
  architectureId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  graphRevision: string;
  metadata?: Record<string, unknown>;
}

export type AIStreamChunkType =
  | "token"
  | "tool_call_start"
  | "tool_call_result"
  | "citation"
  | "proposal"
  | "done"
  | "error";

export interface AIStreamChunk {
  type: AIStreamChunkType;
  content?: string;
  toolCall?: AIToolCall;
  toolResult?: AIToolResult;
  citation?: AICitation;
  proposal?: AIArchitectureProposal;
  error?: string;
}

export interface AIProviderConfig {
  provider: "deterministic-mock" | "openai" | "gemini" | "anthropic";
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  execute: (args: Record<string, unknown>, context: AIExecutionContext) => Promise<unknown>;
}

export interface AIExecutionContext {
  projectId: string;
  architectureId: string;
  graphRevision: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  selectedNodeIds?: string[];
  selectedEdgeIds?: string[];
  activeScenarioId?: string;
  history?: AIMessage[];
  lineageModel?: ArchitectureDataLineageModel;
  apiContracts?: APIContract[];
  consumerDependencies?: ConsumerDependency[];
  messagingTopology?: MessagingTopology;
  cacheTopology?: DistributedStateTopology;
  databaseTopology?: DatabaseArchitectureTopology;
  networkTopology?: NetworkArchitectureTopology;
}

