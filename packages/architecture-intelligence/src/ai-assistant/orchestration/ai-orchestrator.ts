import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ArchitectureAIRequest,
  AIMessage,
  AIStreamChunk,
  AIProviderConfig,
} from "../contracts/ai-assistant.types";
import { ArchitectureAIRequestSchema } from "../schemas/ai-assistant.schemas";
import { buildArchitectureContext } from "../context/context-builder";
import { budgetConversationHistory } from "../context/token-budget";
import { architectureToolRegistry } from "../tools/tool-registry";
import { DeterministicMockProvider } from "../providers/mock-provider";
import { LiveAIProvider } from "../providers/live-provider";
import type { IAIProvider, ProviderCompletionResponse } from "../providers/provider-interface";
import { ProposalValidator } from "../proposals/proposal-validator";
import { EvidenceVerifier } from "./evidence-verifier";

export const SYSTEM_COPILOT_PROMPT = `You are NXTQR AI Architecture Assistant, a context-aware system design copilot.
You specialize in distributed systems, high availability, cloud infrastructure, microservices, databases, and security architecture.

Guidelines:
1. Your answers must be grounded in the active architecture graph and verified findings.
2. When referencing components, mention their IDs like \`checkout-db\` or \`api-gateway\`.
3. Never invent non-existent components or make unsupported latency claims.
4. Distinguish verified deterministic findings from general engineering advice.
5. If suggesting changes, propose structured What-If modifications with clear trade-offs.
6. The user remains in full control: you never directly mutate the diagram.
`;

export class AIArchitectureOrchestrator {
  private provider: IAIProvider;

  constructor(config?: Partial<AIProviderConfig>) {
    if (config?.apiKey) {
      this.provider = new LiveAIProvider({
        provider: config.provider || "openai",
        modelId: config.modelId || "gpt-4o",
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });
    } else {
      this.provider = new DeterministicMockProvider();
    }
  }

  public setProvider(provider: IAIProvider): void {
    this.provider = provider;
  }

  /**
   * Main entrypoint for processing an AI Architecture Assistant query.
   */
  public async processRequest(
    request: ArchitectureAIRequest,
    nodes: BaseNode[],
    edges: BaseEdge[],
    history: AIMessage[] = [],
    onChunk?: (chunk: AIStreamChunk) => void
  ): Promise<ProviderCompletionResponse> {
    // 1. Validate request
    const validatedReq = ArchitectureAIRequestSchema.parse(request);

    // 2. Build targeted architecture context
    const builtContext = buildArchitectureContext({
      nodes,
      edges,
      selectedNodeIds: validatedReq.selectedNodeIds,
      selectedEdgeIds: validatedReq.selectedEdgeIds,
      activeScenarioId: validatedReq.activeScenarioId,
      graphRevision: validatedReq.graphRevision,
      mode: validatedReq.mode,
    });

    // 3. Budget conversation history
    const budgetedHistory = budgetConversationHistory(history);

    // Append the incoming user message
    const userMessage: AIMessage = {
      id: `msg_u_${Date.now()}`,
      conversationId: validatedReq.conversationId || "conv_default",
      role: "user",
      content: validatedReq.message,
      timestamp: new Date().toISOString(),
    };
    budgetedHistory.push(userMessage);

    // 4. Execution context for tools
    const executionContext = {
      projectId: validatedReq.projectId,
      architectureId: validatedReq.architectureId,
      graphRevision: validatedReq.graphRevision,
      nodes,
      edges,
      selectedNodeIds: validatedReq.selectedNodeIds,
      selectedEdgeIds: validatedReq.selectedEdgeIds,
      activeScenarioId: validatedReq.activeScenarioId,
      history: budgetedHistory,
    };

    const completionReq = {
      systemPrompt: SYSTEM_COPILOT_PROMPT,
      contextPrompt: builtContext.promptContext,
      messages: budgetedHistory,
      tools: architectureToolRegistry.getAllTools(),
      executionContext,
    };

    // 5. Invoke provider
    let response: ProviderCompletionResponse;
    if (onChunk) {
      response = await this.provider.stream(completionReq, onChunk);
    } else {
      response = await this.provider.complete(completionReq);
    }

    // 6. Evidence verification on citations
    const verifiedCitations = EvidenceVerifier.verifyCitations(
      response.citations,
      executionContext
    );
    response.citations = verifiedCitations.validCitations;
    response.message.citations = verifiedCitations.validCitations;

    // 7. Deterministic Proposal Validation (if proposal was generated)
    if (response.proposal) {
      const valResult = ProposalValidator.validate(
        response.proposal,
        nodes,
        edges,
        validatedReq.graphRevision
      );

      response.proposal.validationStatus = valResult.validationStatus;
      response.proposal.validationErrors = valResult.validationErrors;
      response.message.proposal = response.proposal;
    }

    return response;
  }
}

export const aiOrchestrator = new AIArchitectureOrchestrator();
