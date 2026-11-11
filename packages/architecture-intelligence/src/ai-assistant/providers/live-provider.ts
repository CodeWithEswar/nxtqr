import type {
  AIMessage,
  AICitation,
  AIArchitectureProposal,
  AIStreamChunk,
  AIProviderConfig,
  AIToolCall,
} from "../contracts/ai-assistant.types";
import type {
  IAIProvider,
  ProviderCompletionRequest,
  ProviderCompletionResponse,
} from "./provider-interface";
import { DeterministicMockProvider } from "./mock-provider";
import { architectureToolRegistry } from "../tools/tool-registry";
import { EvidenceVerifier } from "../orchestration/evidence-verifier";

export class LiveAIProvider implements IAIProvider {
  public readonly providerId: string;
  public readonly modelId: string;
  private readonly config: AIProviderConfig;
  private readonly mockFallback = new DeterministicMockProvider();

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.providerId = config.provider;
    this.modelId = config.modelId;
  }

  public async complete(request: ProviderCompletionRequest): Promise<ProviderCompletionResponse> {
    const chunks: AIStreamChunk[] = [];
    return this.stream(request, (c) => chunks.push(c));
  }

  public async stream(
    request: ProviderCompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<ProviderCompletionResponse> {
    // If no API key configured, use deterministic mock fallback
    if (!this.config.apiKey) {
      return this.mockFallback.stream(request, onChunk);
    }

    const { systemPrompt, contextPrompt, messages, tools, executionContext } = request;

    // Convert tools to OpenAI tool format
    const formattedTools = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const formattedMessages = [
      { role: "system", content: `${systemPrompt}\n\n${contextPrompt}` },
      ...messages.map((m) => ({
        role: m.role === "tool" ? "tool" : m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        name: m.name,
      })),
    ];

    try {
      const endpoint = this.config.baseUrl || "https://api.openai.com/v1/chat/completions";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: formattedMessages,
          tools: formattedTools.length > 0 ? formattedTools : undefined,
          temperature: this.config.temperature ?? 0.2,
          max_tokens: this.config.maxTokens ?? 2048,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Model provider API error (${response.status}): ${await response.text()}`);
      }

      let accumulatedContent = "";
      const pendingToolCalls: Map<number, { id: string; name: string; args: string }> = new Map();

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              if (delta.content) {
                accumulatedContent += delta.content;
                onChunk({ type: "token", content: delta.content });
              }

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  const existing = pendingToolCalls.get(idx) || { id: tc.id || "", name: tc.function?.name || "", args: "" };
                  if (tc.id) existing.id = tc.id;
                  if (tc.function?.name) existing.name = tc.function.name;
                  if (tc.function?.arguments) existing.args += tc.function.arguments;
                  pendingToolCalls.set(idx, existing);
                }
              }
            } catch {
              // Ignore malformed chunk
            }
          }
        }
      }

      // If tool calls were initiated, execute them and recurse or append
      const citations: AICitation[] = [];
      let proposal: AIArchitectureProposal | undefined;

      for (const [, tc] of pendingToolCalls) {
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(tc.args || "{}");
        } catch {
          // fallback
        }

        const toolCall: AIToolCall = {
          id: tc.id,
          name: tc.name,
          arguments: parsedArgs,
        };
        onChunk({ type: "tool_call_start", toolCall });

        const toolRes = await architectureToolRegistry.executeTool(tc.name, parsedArgs, executionContext);
        onChunk({
          type: "tool_call_result",
          toolResult: { toolCallId: tc.id, name: tc.name, result: toolRes.result, error: toolRes.error },
        });
      }

      // Extract verified citations
      const implicitCites = EvidenceVerifier.extractImplicitCitations(accumulatedContent, executionContext);
      for (const c of implicitCites) {
        citations.push(c);
        onChunk({ type: "citation", citation: c });
      }

      onChunk({ type: "done" });

      const assistantMessage: AIMessage = {
        id: `msg_${Date.now()}`,
        conversationId: messages[messages.length - 1]?.conversationId || "conv_default",
        role: "assistant",
        content: accumulatedContent,
        timestamp: new Date().toISOString(),
        citations,
        proposal,
      };

      return {
        message: assistantMessage,
        citations,
        proposal,
      };
    } catch (err: any) {
      // Graceful fallback to mock on network/auth failure
      console.warn("Live AI provider failed, falling back to deterministic mock:", err?.message);
      return this.mockFallback.stream(request, onChunk);
    }
  }
}

