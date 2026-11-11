"use client";

import { useState, useCallback, useRef } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  AIMessage,
  AIToolCall,
  AICitation,
  AIArchitectureProposal,
  AIAssistantMode,
  AIStreamChunk,
} from "@nxtqr/architecture-intelligence";
import { aiOrchestrator } from "@nxtqr/architecture-intelligence";

export interface SendMessageOptions {
  nodes: BaseNode[];
  edges: BaseEdge[];
  selectedNodeIds?: string[];
  selectedEdgeIds?: string[];
  graphRevision?: string;
  activeScenarioId?: string;
  mode?: AIAssistantMode;
  projectId?: string;
  architectureId?: string;
}

export function useAIAssistant(initialProjectId = "default-project", initialArchitectureId = "default-arch") {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "welcome_msg",
      conversationId: "conv_default",
      role: "assistant",
      content: `👋 **Welcome to the NXTQR Architecture Assistant.**

I understand your active diagram, component configurations, and dependencies across all 7 Architecture Intelligence domains.

Ask me anything about your system design, or request improvements:
- *"Where are the single points of failure?"*
- *"Why is the primary database a bottleneck?"*
- *"Propose a Redis cache layer between API and DB"*
- *"Check Zero Trust security boundaries"*`,
      timestamp: new Date().toISOString(),
      citations: [],
    },
  ]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingText, setCurrentStreamingText] = useState("");
  const [activeToolCall, setActiveToolCall] = useState<AIToolCall | null>(null);
  const [activeProposal, setActiveProposal] = useState<AIArchitectureProposal | null>(null);
  const [isPreviewingProposal, setIsPreviewingProposal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState("conv_default");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, options: SendMessageOptions) => {
      if (!content.trim() || isStreaming) return;

      setError(null);
      setIsStreaming(true);
      setCurrentStreamingText("");
      setActiveToolCall(null);

      const userMsg: AIMessage = {
        id: `msg_u_${Date.now()}`,
        conversationId: activeConversationId,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);

      const streamedCitations: AICitation[] = [];
      let streamedProposal: AIArchitectureProposal | undefined;
      let accumulatedText = "";

      try {
        const response = await aiOrchestrator.processRequest(
          {
            projectId: options.projectId || initialProjectId,
            architectureId: options.architectureId || initialArchitectureId,
            conversationId: activeConversationId,
            message: content.trim(),
            graphRevision: options.graphRevision || "rev_active",
            selectedNodeIds: options.selectedNodeIds,
            selectedEdgeIds: options.selectedEdgeIds,
            activeScenarioId: options.activeScenarioId,
            mode: options.mode || "explain",
          },
          options.nodes,
          options.edges,
          messages,
          (chunk: AIStreamChunk) => {
            switch (chunk.type) {
              case "tool_call_start":
                if (chunk.toolCall) setActiveToolCall(chunk.toolCall);
                break;
              case "tool_call_result":
                setActiveToolCall(null);
                break;
              case "token":
                if (chunk.content) {
                  accumulatedText += chunk.content;
                  setCurrentStreamingText(accumulatedText);
                }
                break;
              case "citation":
                if (chunk.citation) {
                  streamedCitations.push(chunk.citation);
                }
                break;
              case "proposal":
                if (chunk.proposal) {
                  streamedProposal = chunk.proposal;
                  setActiveProposal(chunk.proposal);
                }
                break;
              case "error":
                setError(chunk.error || "Streaming failed");
                break;
            }
          }
        );

        const assistantMsg: AIMessage = {
          id: `msg_a_${Date.now()}`,
          conversationId: activeConversationId,
          role: "assistant",
          content: accumulatedText || response.message.content,
          timestamp: new Date().toISOString(),
          citations: response.citations.length > 0 ? response.citations : streamedCitations,
          proposal: response.proposal || streamedProposal,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (response.proposal) {
          setActiveProposal(response.proposal);
        }
      } catch (err: any) {
        setError(err?.message || "An unexpected error occurred while communicating with the Copilot.");
      } finally {
        setIsStreaming(false);
        setCurrentStreamingText("");
        setActiveToolCall(null);
      }
    },
    [activeConversationId, initialArchitectureId, initialProjectId, isStreaming, messages]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setCurrentStreamingText("");
    setActiveToolCall(null);
  }, []);

  const toggleProposalPreview = useCallback(
    (force?: boolean) => {
      setIsPreviewingProposal((prev) => (force !== undefined ? force : !prev));
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveProposal(null);
    setIsPreviewingProposal(false);
    setError(null);
  }, []);

  const newConversation = useCallback(() => {
    const newId = `conv_${Date.now()}`;
    setActiveConversationId(newId);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        conversationId: newId,
        role: "assistant",
        content: "New architecture conversation started. How can I assist with your system design today?",
        timestamp: new Date().toISOString(),
      },
    ]);
    setActiveProposal(null);
    setIsPreviewingProposal(false);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    currentStreamingText,
    activeToolCall,
    activeProposal,
    isPreviewingProposal,
    error,
    activeConversationId,
    sendMessage,
    stopStreaming,
    toggleProposalPreview,
    clearMessages,
    newConversation,
    setActiveProposal,
  };
}
