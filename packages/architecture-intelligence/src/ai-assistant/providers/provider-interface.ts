import type {
  AIMessage,
  AICitation,
  AIArchitectureProposal,
  AIStreamChunk,
  AIToolDefinition,
  AIExecutionContext,
} from "../contracts/ai-assistant.types";

export interface ProviderCompletionRequest {
  systemPrompt: string;
  contextPrompt: string;
  messages: AIMessage[];
  tools: AIToolDefinition[];
  executionContext: AIExecutionContext;
}

export interface ProviderCompletionResponse {
  message: AIMessage;
  citations: AICitation[];
  proposal?: AIArchitectureProposal;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAIProvider {
  readonly providerId: string;
  readonly modelId: string;

  complete(request: ProviderCompletionRequest): Promise<ProviderCompletionResponse>;

  stream(
    request: ProviderCompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<ProviderCompletionResponse>;
}

