"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import { CloseIcon, TerminalIcon } from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface SequenceViewProps {
  className?: string;
  onClose?: () => void;
}

export function SequenceView({ className, onClose }: SequenceViewProps) {
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore((s) => s.playbackState.currentStepIndex);
  const seekToStep = useExecutionStore((s) => s.seekToStep);
  const toggleSequenceView = useExecutionStore((s) => s.toggleSequenceView);
  const nodes = useGraphEditorStore((s) => s.nodes);

  const listRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to active sequence step
  React.useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-seq-index="${currentStepIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentStepIndex]);

  if (!trace || trace.events.length === 0) {
    return (
      <div
        className={cn(
          "w-full h-56 bg-surface-02 border border-border-default rounded-md p-4 flex flex-col items-center justify-center text-center shadow-level-2 select-none",
          className
        )}
      >
        <TerminalIcon className="w-6 h-6 text-text-disabled mb-2" />
        <h4 className="text-xs font-semibold text-foreground">No Sequence Execution Trace</h4>
        <p className="text-[11px] text-text-muted mt-1 max-w-xs">
          Run an execution flow to visualize component-to-component interaction lifelines.
        </p>
      </div>
    );
  }

  // Determine all involved lifelines (components)
  const lifelineNodeIds = Array.from(
    new Set([
      ...trace.visitedNodeIds,
      ...trace.events.map((e) => ("nodeId" in e ? (e as any).nodeId : undefined)).filter(Boolean),
      ...trace.events.map((e) => ("fromNodeId" in e ? (e as any).fromNodeId : undefined)).filter(Boolean),
      ...trace.events.map((e) => ("toNodeId" in e ? (e as any).toNodeId : undefined)).filter(Boolean),
      ...trace.events.map((e) => ("producerNodeId" in e ? (e as any).producerNodeId : undefined)).filter(Boolean),
      ...trace.events.map((e) => ("destinationQueueId" in e ? (e as any).destinationQueueId : undefined)).filter(Boolean),
      ...trace.events.map((e) => ("consumerNodeId" in e ? (e as any).consumerNodeId : undefined)).filter(Boolean),
    ])
  );

  return (
    <div
      className={cn(
        "flex flex-col bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden select-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-01 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground">
            Distributed Sequence Diagram
          </span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-border-default bg-surface-03 text-text-muted"
          >
            {lifelineNodeIds.length} Lifelines · {trace.events.length} Causal Steps
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose || (() => toggleSequenceView(false))}
          className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
          title="Close Sequence Diagram"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Lifeline Headers (Fixed Horizontal Bar) */}
      <div className="flex items-center px-4 py-2 bg-surface-01/80 border-b border-border-subtle shrink-0 gap-2 overflow-x-auto font-mono text-[10px]">
        <div className="w-20 shrink-0 text-text-muted font-bold text-[9px] uppercase">
          Time / Step
        </div>
        <div className="flex-1 flex items-center justify-between min-w-[500px]">
          {lifelineNodeIds.map((nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            return (
              <div
                key={nodeId}
                className="px-2 py-0.5 rounded bg-surface-03 border border-border-default text-foreground font-semibold text-center truncate max-w-[120px]"
                title={node?.label || nodeId}
              >
                {node?.label || nodeId}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sequence Interaction Rows */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto min-h-0 divide-y divide-border-subtle/50 p-2 space-y-1 font-mono text-[10px]"
      >
        {trace.events.map((evt, idx) => {
          const isActive = idx === currentStepIndex;

          let arrowType = "→";
          let messageLabel: string = evt.type;
          let fromId = "";
          let toId = "";

          const anyEvt = evt as any;
          if ("fromNodeId" in evt && "toNodeId" in evt) {
            fromId = anyEvt.fromNodeId;
            toId = anyEvt.toNodeId;
            arrowType = evt.type.startsWith("response.") ? "⤎ (RES)" : "➔ (REQ)";
            messageLabel =
              "request" in evt && anyEvt.request
                ? `${anyEvt.request.method} ${anyEvt.request.path}`
                : "response" in evt && anyEvt.response
                  ? `HTTP ${anyEvt.response.status}`
                  : evt.type;
          } else if (evt.type === "message.published") {
            fromId = anyEvt.producerNodeId;
            toId = anyEvt.destinationQueueId;
            arrowType = "═➔ (PUB)";
            messageLabel = `Publish Message to ${toId}`;
          } else if (evt.type === "message.delivered") {
            fromId = anyEvt.queueId;
            toId = anyEvt.consumerNodeId;
            arrowType = "┄➔ (DLV)";
            messageLabel = `Deliver Message (Att ${anyEvt.attempt})`;
          } else if (evt.type === "message.acknowledged") {
            fromId = anyEvt.consumerNodeId;
            toId = anyEvt.nodeId || "";
            arrowType = "✓ (ACK)";
            messageLabel = "Message ACK";
          } else if (evt.type === "message.nacked") {
            fromId = anyEvt.consumerNodeId;
            toId = anyEvt.nodeId || "";
            arrowType = "✖ (NACK)";
            messageLabel = `NACK: ${anyEvt.reason}`;
          } else if (evt.type === "parallel.fanout.started") {
            fromId = anyEvt.parentNodeId;
            arrowType = "⑂ (FAN-OUT)";
            messageLabel = `Fan-out across ${anyEvt.branches?.length || 0} branches`;
          } else if (evt.type === "parallel.join.satisfied") {
            toId = anyEvt.waitingNodeId;
            arrowType = "⑃ (FAN-IN)";
            messageLabel = `Barrier Satisfied (${anyEvt.policy})`;
          }

          const fromLabel = nodes.find((n) => n.id === fromId)?.label || fromId;
          const toLabel = nodes.find((n) => n.id === toId)?.label || toId;

          return (
            <div
              key={evt.id}
              data-seq-index={idx}
              onClick={() => seekToStep(idx)}
              className={cn(
                "flex items-center gap-2 p-1.5 rounded transition-colors cursor-pointer border",
                isActive
                  ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
                  : "bg-surface-01/40 hover:bg-surface-03/60 border-transparent text-text-secondary"
              )}
            >
              {/* Step & Virtual Time */}
              <div className="w-20 shrink-0 text-[9px] text-text-muted flex items-center gap-1">
                <span>#{evt.sequence}</span>
                <span className="text-text-disabled">+{evt.atMs}ms</span>
              </div>

              {/* Interaction Details */}
              <div className="flex-1 flex items-center gap-2 truncate">
                {fromId && (
                  <span className="px-1 py-0.2 rounded bg-surface-02 border border-border-subtle text-foreground text-[9px] truncate max-w-[100px]">
                    {fromLabel}
                  </span>
                )}

                <span className="text-[9px] font-bold text-text-muted">{arrowType}</span>

                {toId && (
                  <span className="px-1 py-0.2 rounded bg-surface-02 border border-border-subtle text-foreground text-[9px] truncate max-w-[100px]">
                    {toLabel}
                  </span>
                )}

                <span className="text-[10px] text-foreground truncate pl-1">
                  {messageLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
