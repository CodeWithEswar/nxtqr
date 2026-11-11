"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import { CloseIcon, SlidersIcon, CheckCircleIcon } from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface ExecutionInspectorProps {
  className?: string;
  onClose?: () => void;
}

export function ExecutionInspector({ className, onClose }: ExecutionInspectorProps) {
  const playbackState = useExecutionStore((s) => s.playbackState);
  const configuration = useExecutionStore((s) => s.configuration);
  const toggleExecutionInspector = useExecutionStore((s) => s.toggleExecutionInspector);
  const nodes = useGraphEditorStore((s) => s.nodes);

  const currentFrame = playbackState.currentFrame;
  const activeEvent = currentFrame?.activeEvent;

  if (!activeEvent) {
    return (
      <div
        className={cn(
          "w-full h-full bg-surface-02 border border-border-default rounded-md p-4 flex flex-col items-center justify-center text-center shadow-level-2 select-none",
          className
        )}
      >
        <SlidersIcon className="w-6 h-6 text-text-disabled mb-2" />
        <h4 className="text-xs font-semibold text-foreground">No Event Selected</h4>
        <p className="text-[11px] text-text-muted mt-1 max-w-xs">
          Select any step in the timeline or run execution to inspect simulated request details.
        </p>
      </div>
    );
  }

  // Find target node if applicable
  const targetNodeId = "nodeId" in activeEvent ? activeEvent.nodeId : "entryNodeId" in activeEvent ? activeEvent.entryNodeId : undefined;
  const targetNode = targetNodeId ? nodes.find((n) => n.id === targetNodeId) : null;
  const rawNodeData = (targetNode?.data || {}) as Record<string, unknown>;

  return (
    <div
      className={cn(
        "flex flex-col bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden select-none h-full",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-01 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <SlidersIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground">
            Execution Step #{activeEvent.sequence}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1 py-0 h-4 border-border-default bg-surface-03 text-text-secondary uppercase"
          >
            {activeEvent.type}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose || (() => toggleExecutionInspector(false))}
          className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
          title="Close Inspector"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3.5">
        {/* 1. Step Overview */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground leading-snug">
            {currentFrame?.stepTitle || activeEvent.type}
          </h4>
          <p className="font-sans text-[11px] text-text-secondary leading-relaxed">
            {activeEvent.explanation}
          </p>
        </div>

        {/* 2. Modeled Timing Metadata */}
        <div className="p-2.5 rounded bg-surface-01 border border-border-subtle grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div>
            <span className="text-text-muted block">Simulated Timestamp</span>
            <span className="text-foreground font-semibold">+{activeEvent.atMs} ms</span>
          </div>
          <div>
            <span className="text-text-muted block">Step Duration</span>
            <span className="text-foreground font-semibold">{activeEvent.durationMs} ms</span>
          </div>
        </div>

        {/* 3. Component Details if node event */}
        {targetNode && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold block">
              Component Context
            </span>
            <div className="p-2 rounded bg-surface-03 border border-border-subtle space-y-1 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="font-semibold text-foreground">{targetNode.label || targetNode.id}</span>
                <span className="text-text-disabled">#{targetNode.id.slice(-6)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
                <span>Type: {String(rawNodeData.componentType || targetNode.type || "service")}</span>
                {rawNodeData.concurrency !== undefined && (
                  <span>· Concurrency: {String(rawNodeData.concurrency)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Request Metadata */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold block">
            Modeled Request
          </span>
          <div className="p-2.5 rounded bg-surface-01 border border-border-subtle font-mono text-[10px] space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-surface-04 border border-border-strong text-foreground font-semibold">
                {configuration.request.method}
              </span>
              <span className="text-text-secondary truncate">{configuration.request.path}</span>
            </div>

            {/* Redacted Headers */}
            <div className="space-y-1 border-t border-border-subtle/60 pt-1.5">
              <span className="text-text-disabled block text-[9px] uppercase tracking-wider">Headers</span>
              {Object.entries(configuration.request.headers || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-text-muted truncate">
                  <span>{key}:</span>
                  <span className="text-text-secondary truncate max-w-[140px]">{String(val)}</span>
                </div>
              ))}
            </div>

            {/* Body */}
            {Boolean(configuration.request.body) && (
              <div className="space-y-1 border-t border-border-subtle/60 pt-1.5">
                <span className="text-text-disabled block text-[9px] uppercase tracking-wider">Payload Body</span>
                <pre className="p-1.5 rounded bg-surface-02 border border-border-subtle text-[9px] text-text-secondary overflow-x-auto">
                  {JSON.stringify(configuration.request.body, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* 5. Route Selection Rationale if branching event */}
        {activeEvent.type === "route.selected" && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold block">
              Routing Decision
            </span>
            <div className="p-2 rounded bg-surface-03 border border-border-strong space-y-1 text-[11px] font-mono">
              <div className="text-foreground font-semibold">
                Dispatched to wire: {activeEvent.selectedEdgeId}
              </div>
              <div className="text-text-secondary text-[10px]">
                Reason: {activeEvent.decisionReason}
              </div>
              <div className="text-text-disabled text-[9px]">
                Considered branches: {activeEvent.availableEdgeIds.join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* 6. Execution Limit & Terminal Outcomes */}
        {activeEvent.type === "run.completed" && (
          <div className="p-2.5 rounded bg-surface-03 border border-border-strong space-y-1">
            <div className="flex items-center gap-1.5">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-xs font-semibold text-foreground uppercase">
                {activeEvent.outcome}
              </span>
            </div>
            <p className="text-[11px] font-sans text-text-secondary">
              {activeEvent.terminalReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
