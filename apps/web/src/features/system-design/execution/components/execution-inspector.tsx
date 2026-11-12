"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import {
  CloseIcon,
  SlidersIcon,
  CheckCircleIcon,
  DatabaseIcon,
  LayersIcon,
  ActivityIcon,
  CpuIcon,
} from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { QueueInspector } from "./queue-inspector";
import { MessageInspector } from "./message-inspector";

export interface ExecutionInspectorProps {
  className?: string;
  onClose?: () => void;
}

type InspectorTab = "overview" | "payloads" | "state" | "spans" | "queues";

export function ExecutionInspector({ className, onClose }: ExecutionInspectorProps) {
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const configuration = useExecutionStore((s) => s.configuration);
  const toggleExecutionInspector = useExecutionStore((s) => s.toggleExecutionInspector);
  const nodes = useGraphEditorStore((s) => s.nodes);

  const [activeTab, setActiveTab] = React.useState<InspectorTab>("overview");

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
  const targetNodeId =
    "nodeId" in activeEvent
      ? (activeEvent as any).nodeId
      : "entryNodeId" in activeEvent
        ? (activeEvent as any).entryNodeId
        : undefined;
  const targetNode = targetNodeId ? nodes.find((n) => n.id === targetNodeId) : null;
  const rawNodeData = (targetNode?.data || {}) as Record<string, unknown>;

  const req = currentFrame?.activeRequest || {
    method: configuration.request.method,
    path: configuration.request.path,
    headers: configuration.request.headers || {},
    body: configuration.request.body,
  };

  const res = currentFrame?.activeResponse;
  const runtimeState = currentFrame?.runtimeState;
  const activeSpans = currentFrame?.activeSpans || [];
  const criticalPathIds = new Set(currentFrame?.criticalPathSpanIds || []);

  // Determine HTTP status badge styling
  const statusColor = res?.status
    ? res.status >= 500
      ? "text-rose-400 border-border-default bg-rose-950/20"
      : res.status >= 400
        ? "text-amber-400 border-border-default bg-amber-950/20"
        : "text-emerald-400 border-border-default bg-emerald-950/20"
    : "text-text-muted border-border-default bg-surface-03";

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
            Step #{activeEvent.sequence}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-border-default bg-surface-03 text-text-secondary uppercase"
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

      {/* Tabs */}
      <div className="flex items-center border-b border-border-subtle bg-surface-01/50 px-2 shrink-0 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono font-medium transition-colors border-b-2 -mb-px shrink-0",
            activeTab === "overview"
              ? "border-text-secondary text-foreground bg-surface-02 font-semibold"
              : "border-transparent text-text-muted hover:text-text-secondary"
          )}
        >
          <ActivityIcon className="w-3 h-3" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payloads")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono font-medium transition-colors border-b-2 -mb-px shrink-0",
            activeTab === "payloads"
              ? "border-text-secondary text-foreground bg-surface-02 font-semibold"
              : "border-transparent text-text-muted hover:text-text-secondary"
          )}
        >
          <LayersIcon className="w-3 h-3" />
          <span>Payloads</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("state")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono font-medium transition-colors border-b-2 -mb-px shrink-0",
            activeTab === "state"
              ? "border-text-secondary text-foreground bg-surface-02 font-semibold"
              : "border-transparent text-text-muted hover:text-text-secondary"
          )}
        >
          <DatabaseIcon className="w-3 h-3" />
          <span>State & Cache</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("spans")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono font-medium transition-colors border-b-2 -mb-px shrink-0",
            activeTab === "spans"
              ? "border-text-secondary text-foreground bg-surface-02 font-semibold"
              : "border-transparent text-text-muted hover:text-text-secondary"
          )}
        >
          <CpuIcon className="w-3 h-3" />
          <span>Spans ({activeSpans.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("queues")}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono font-medium transition-colors border-b-2 -mb-px shrink-0",
            activeTab === "queues"
              ? "border-text-secondary text-foreground bg-surface-02 font-semibold"
              : "border-transparent text-text-muted hover:text-text-secondary"
          )}
        >
          <LayersIcon className="w-3 h-3" />
          <span>Queues & Msgs</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-3">
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
                <div className="p-2.5 rounded bg-surface-03 border border-border-subtle space-y-1 text-xs">
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

            {/* 4. Branch Information if distributed */}
            {"branchId" in activeEvent && (activeEvent as any).branchId && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold block">
                  Logical Branch Context
                </span>
                <div className="p-2 rounded bg-surface-01 border border-border-subtle flex items-center justify-between font-mono text-[10px]">
                  <span className="text-text-secondary">Active Branch:</span>
                  <span className="text-foreground font-semibold">{(activeEvent as any).branchId}</span>
                </div>
              </div>
            )}

            {/* 5. Terminal Outcomes */}
            {activeEvent.type === "run.completed" && (
              <div className="p-2.5 rounded bg-surface-03 border border-border-strong space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-xs font-semibold text-foreground uppercase">
                    {(activeEvent as any).outcome}
                  </span>
                </div>
                <p className="text-[11px] font-sans text-text-secondary">
                  {(activeEvent as any).terminalReason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYLOADS (REQUEST & RESPONSE) */}
        {activeTab === "payloads" && (
          <div className="space-y-3">
            {/* Modeled Request */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                  Modeled HTTP Request
                </span>
                <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-secondary">
                  Direction: {currentFrame?.direction || "request"}
                </Badge>
              </div>

              <div className="p-2.5 rounded bg-surface-01 border border-border-subtle font-mono text-[10px] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-surface-04 border border-border-strong text-foreground font-semibold">
                    {req.method}
                  </span>
                  <span className="text-text-secondary truncate">{req.path}</span>
                </div>

                {/* Headers */}
                <div className="space-y-1 border-t border-border-subtle/60 pt-1.5">
                  <span className="text-text-disabled block text-[9px] uppercase tracking-wider">Headers</span>
                  {Object.entries(req.headers || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-text-muted truncate">
                      <span>{key}:</span>
                      <span className="text-text-secondary truncate max-w-[140px]">{String(val)}</span>
                    </div>
                  ))}
                </div>

                {/* Body */}
                {Boolean(req.body) && (
                  <div className="space-y-1 border-t border-border-subtle/60 pt-1.5">
                    <span className="text-text-disabled block text-[9px] uppercase tracking-wider">Request Payload</span>
                    <pre className="p-1.5 rounded bg-surface-02 border border-border-subtle text-[9px] text-text-secondary overflow-x-auto max-h-24">
                      {typeof req.body === "object" ? JSON.stringify(req.body, null, 2) : String(req.body)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Modeled Response */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold">
                  Modeled HTTP Response
                </span>
                {res ? (
                  <Badge variant="outline" className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", statusColor)}>
                    HTTP {res.status}
                  </Badge>
                ) : (
                  <span className="text-[9px] font-mono text-text-disabled">Pending / In-Flight</span>
                )}
              </div>

              {res ? (
                <div className="p-2.5 rounded bg-surface-01 border border-border-subtle font-mono text-[10px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Latency</span>
                    <span className="text-foreground font-semibold">{res.latencyMs} ms</span>
                  </div>

                  {/* Headers */}
                  <div className="space-y-1 border-t border-border-subtle/60 pt-1.5">
                    <span className="text-text-disabled block text-[9px] uppercase tracking-wider">Response Headers</span>
                    {Object.entries(res.headers || {}).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-text-muted truncate">
                        <span>{key}:</span>
                        <span className="text-text-secondary truncate max-w-[140px] font-semibold">{String(val)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Response Body */}
                  {res.body !== undefined && (
                    <div className="space-y-1 border-t border-border-subtle/60 pt-1.5">
                      <span className="text-text-disabled block text-[9px] uppercase tracking-wider">Response Payload</span>
                      <pre className="p-1.5 rounded bg-surface-02 border border-border-subtle text-[9px] text-emerald-400 overflow-x-auto max-h-32">
                        {typeof res.body === "object" ? JSON.stringify(res.body, null, 2) : String(res.body)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded bg-surface-01 border border-border-subtle text-center text-[10px] font-mono text-text-muted">
                  No response emitted at this step.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RUNTIME STATE & FIXTURES */}
        {activeTab === "state" && (
          <div className="space-y-3 font-mono text-[10px]">
            {/* Cache Fixtures (Redis) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider text-text-muted font-semibold">
                  Modeled Cache State (Redis)
                </span>
                <span className="text-[9px] text-text-disabled">
                  {runtimeState?.cache ? Object.keys(runtimeState.cache).length : 0} keys
                </span>
              </div>

              {!runtimeState || Object.keys(runtimeState.cache).length === 0 ? (
                <div className="p-2.5 rounded bg-surface-01 border border-border-subtle text-text-muted text-center">
                  Cache is currently empty (Cold Cache).
                </div>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(runtimeState.cache).map(([key, fixture]) => (
                    <div key={key} className="p-2 rounded bg-surface-01 border border-border-subtle space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-semibold">{key}</span>
                        <span className="text-text-secondary text-[9px]">
                          TTL: {Math.max(0, Math.round((fixture.expiresAtMs - (currentFrame?.virtualTimeMs || 0)) / 1000))}s
                        </span>
                      </div>
                      <pre className="text-[9px] text-text-secondary truncate bg-surface-02 p-1 rounded border border-border-subtle">
                        {JSON.stringify(fixture.value)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Database Fixtures (PostgreSQL) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider text-text-muted font-semibold">
                  Modeled Database Fixtures (PostgreSQL)
                </span>
                <span className="text-[9px] text-text-disabled">
                  {runtimeState?.database ? Object.keys(runtimeState.database).length : 0} tables
                </span>
              </div>

              {!runtimeState || Object.keys(runtimeState.database).length === 0 ? (
                <div className="p-2.5 rounded bg-surface-01 border border-border-subtle text-text-muted text-center">
                  No database tables registered in modeled state.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(runtimeState.database).map(([table, rows]) => (
                    <div key={table} className="p-2 rounded bg-surface-01 border border-border-subtle space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-semibold">{table}</span>
                        <span className="text-text-disabled text-[9px]">{Object.keys(rows).length} rows</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(rows).slice(0, 3).map(([pk, row]) => (
                          <div key={pk} className="flex items-center justify-between text-[9px] bg-surface-02 p-1 rounded border border-border-subtle text-text-secondary">
                            <span className="font-semibold text-text-muted">PK {pk}:</span>
                            <span className="truncate max-w-[160px]">{JSON.stringify(row)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Call Stack */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider text-text-muted font-semibold">
                  Modeled Call Stack Frames
                </span>
                <span className="text-[9px] text-text-disabled">
                  {runtimeState?.callStack.length || 0} frames
                </span>
              </div>

              {!runtimeState || runtimeState.callStack.length === 0 ? (
                <div className="p-2.5 rounded bg-surface-01 border border-border-subtle text-text-muted text-center">
                  Call stack is empty (Idle / Completed).
                </div>
              ) : (
                <div className="space-y-1">
                  {runtimeState.callStack.map((frame, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-surface-01 border border-border-subtle flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-disabled text-[9px]">#{idx + 1}</span>
                        <span className="text-foreground font-semibold">{frame.calleeNodeId || frame.callerNodeId}</span>
                        <span className="text-text-muted">({frame.operation})</span>
                      </div>
                      <span className="text-text-secondary text-[9px]">+{frame.atMs}ms</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TRACE SPANS */}
        {activeTab === "spans" && (
          <div className="space-y-2 font-mono text-[10px]">
            {activeSpans.length === 0 ? (
              <div className="p-3 rounded bg-surface-01 border border-border-subtle text-center text-text-muted">
                No active distributed spans for current step.
              </div>
            ) : (
              activeSpans.map((span) => {
                const isCritical = criticalPathIds.has(span.spanId);
                const isError = span.status === "error";

                return (
                  <div
                    key={span.spanId}
                    className={cn(
                      "p-2 rounded border space-y-1 transition-colors",
                      isCritical ? "bg-surface-03 border-border-strong shadow-level-2" : "bg-surface-01 border-border-subtle"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-foreground truncate">{span.name}</span>
                        {isCritical && (
                          <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 border-border-strong bg-surface-04 text-foreground uppercase">
                            Critical Path
                          </Badge>
                        )}
                      </div>
                      <span className={cn("text-[8px] uppercase font-bold", isError ? "text-rose-400" : "text-emerald-400")}>
                        {span.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-text-muted">
                      <span>Component: {span.componentLabel || span.componentId}</span>
                      <span>+{span.startMs}ms → +{span.endMs ?? "?"}ms</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 5: QUEUES & MESSAGES */}
        {activeTab === "queues" && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold block mb-1.5">
                Modeled Message Queues
              </span>
              <QueueInspector />
            </div>

            <div className="border-t border-border-subtle pt-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted font-semibold block mb-1.5">
                Active In-Flight & Acknowledged Messages
              </span>
              <MessageInspector />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
