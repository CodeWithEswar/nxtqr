"use client";

import * as React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { AIArchitectureProposal } from "@nxtqr/architecture-intelligence";
import { useAIAssistant } from "../hooks/use-ai-assistant";
import { AssistantMessage } from "./assistant-message";
import { AssistantComposer } from "./assistant-composer";
import { Button, Badge } from "@nxtqr/ui";
import {
  LayersIcon,
  CloseIcon,
  PlusIcon,
  RefreshIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";

export interface AssistantPanelProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  selectedNodeIds?: string[];
  selectedEdgeIds?: string[];
  graphRevision?: string;
  activeScenarioId?: string;
  projectId?: string;
  architectureId?: string;
  onApplyProposal?: (proposal: AIArchitectureProposal) => void;
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function AssistantPanel({
  nodes,
  edges,
  selectedNodeIds = [],
  selectedEdgeIds = [],
  graphRevision = "rev_001",
  activeScenarioId,
  projectId = "default-project",
  architectureId = "default-arch",
  onApplyProposal,
  onSelectNode,
  onSelectEdge,
  onClose,
  className = "",
}: AssistantPanelProps) {
  const {
    messages,
    isStreaming,
    currentStreamingText,
    activeToolCall,
    activeProposal,
    isPreviewingProposal,
    error,
    sendMessage,
    stopStreaming,
    toggleProposalPreview,
    clearMessages,
    newConversation,
  } = useAIAssistant(projectId, architectureId);

  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat vertically on new message or stream chunk without affecting ancestor horizontal scroll
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, currentStreamingText]);

  const handleSend = (text: string) => {
    sendMessage(text, {
      nodes,
      edges,
      selectedNodeIds,
      selectedEdgeIds,
      graphRevision,
      activeScenarioId,
      projectId,
      architectureId,
    });
  };

  const handleApply = (prop: AIArchitectureProposal) => {
    onApplyProposal?.(prop);
    toggleProposalPreview(false);
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#000000] border-l border-[#262626] text-foreground select-none overflow-hidden ${className}`}
      data-testid="ai-assistant-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#080808] border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2 min-w-0">
          <LayersIcon className="w-4 h-4 text-foreground shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-foreground tracking-tight truncate">
              Architecture Copilot
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span>{nodes.length} nodes</span>
              <span>•</span>
              <span className="truncate max-w-[80px]">rev: {graphRevision}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={newConversation}
            className="h-7 w-7 p-0 rounded-md text-secondary hover:text-foreground hover:bg-[#141414]"
            title="New Conversation"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="h-7 w-7 p-0 rounded-md text-secondary hover:text-foreground hover:bg-[#141414]"
            title="Clear Chat"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 rounded-md text-secondary hover:text-foreground hover:bg-[#141414]"
              title="Close Assistant"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* What-If Preview Banner */}
      {isPreviewingProposal && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-950/30 border-b border-amber-900/50 text-[11px] text-amber-300">
          <span className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            WHAT-IF PREVIEW ACTIVE (Original diagram unchanged)
          </span>
          <button
            type="button"
            onClick={() => toggleProposalPreview(false)}
            className="hover:text-white underline text-[10px] font-mono uppercase"
          >
            Exit
          </button>
        </div>
      )}

      {/* Selected Scope Indicator */}
      {selectedNodeIds.length > 0 && (
        <div className="px-3 py-1 bg-[#0D0D0D] border-b border-[#1A1A1A] flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>FOCUS SCOPE: {selectedNodeIds.length} component(s) selected</span>
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#262626] bg-[#141414]">
            1-Hop Neighborhood
          </Badge>
        </div>
      )}

      {/* Message Stream */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3.5 py-2 scrollbar-thin">
        {messages.map((msg) => (
          <AssistantMessage
            key={msg.id}
            message={msg}
            isPreviewingProposal={isPreviewingProposal && activeProposal?.id === msg.proposal?.id}
            onToggleProposalPreview={toggleProposalPreview}
            onApplyProposal={handleApply}
            onSelectNode={onSelectNode}
            onSelectEdge={onSelectEdge}
          />
        ))}

        {/* Live Streaming Message */}
        {isStreaming && (
          <div className="my-2.5 flex flex-col gap-1.5 items-start">
            <div className="flex items-center gap-2 px-1 text-[10px] font-mono text-muted-foreground">
              <span>NXTQR COPILOT</span>
              <span className="animate-pulse">Thinking & Synthesizing...</span>
            </div>

            <div className="rounded-md p-3 max-w-[95%] bg-[#080808] border border-[#262626] text-xs text-foreground/90">
              {currentStreamingText ? (
                <div className="whitespace-pre-wrap">{currentStreamingText}</div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                  <span>Inspecting architecture graph...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Tool Call Indicator */}
        {activeToolCall && (
          <div className="my-2 px-2.5 py-1.5 rounded-md bg-[#141414] border border-[#262626] flex items-center gap-2 text-[11px] font-mono text-secondary">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
            <span className="truncate">
              Executing tool: <strong className="text-foreground">{activeToolCall.name}</strong>
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="my-2 p-2.5 rounded-md bg-red-950/20 border border-red-900/60 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">Assistant Error</p>
              <p className="text-[11px]">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <AssistantComposer
        onSendMessage={handleSend}
        onStopStreaming={stopStreaming}
        isStreaming={isStreaming}
      />
    </div>
  );
}

