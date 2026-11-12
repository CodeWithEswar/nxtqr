"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import { CloseIcon, ActivityIcon, CpuIcon } from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface DistributedTimelineProps {
  className?: string;
  onClose?: () => void;
}

export function DistributedTimeline({ className, onClose }: DistributedTimelineProps) {
  const trace = useExecutionStore((s) => s.trace);
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const currentStepIndex = useExecutionStore((s) => s.playbackState.currentStepIndex);
  const seekToStep = useExecutionStore((s) => s.seekToStep);
  const toggleDistributedTimeline = useExecutionStore((s) => s.toggleDistributedTimeline);
  const nodes = useGraphEditorStore((s) => s.nodes);

  const [criticalOnly, setCriticalOnly] = React.useState(false);

  if (!trace || trace.events.length === 0) {
    return (
      <div
        className={cn(
          "w-full h-56 bg-surface-02 border border-border-default rounded-md p-4 flex flex-col items-center justify-center text-center shadow-level-2 select-none",
          className
        )}
      >
        <ActivityIcon className="w-6 h-6 text-text-disabled mb-2" />
        <h4 className="text-xs font-semibold text-foreground">No Distributed Execution Trace</h4>
        <p className="text-[11px] text-text-muted mt-1 max-w-xs">
          Select a distributed scenario and run execution to visualize multi-lane concurrent execution.
        </p>
      </div>
    );
  }

  const totalDurationMs = Math.max(trace.totalDurationMs || 100, 100);
  const currentVirtualMs = currentFrame?.virtualTimeMs ?? 0;
  const currentProgressPercent = Math.min(100, Math.max(0, (currentVirtualMs / totalDurationMs) * 100));

  // Extract all distinct components involved in trace
  const involvedNodeIds = Array.from(
    new Set([
      ...trace.visitedNodeIds,
      ...trace.events.map((e) => ("nodeId" in e ? (e as any).nodeId : undefined)).filter(Boolean),
    ])
  );

  const spans = trace.spans || [];
  const criticalPathIds = new Set(trace.criticalPathSpanIds || []);

  const displayedSpans = criticalOnly
    ? spans.filter((s) => criticalPathIds.has(s.spanId))
    : spans;

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
          <ActivityIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground">
            Distributed Execution Timeline
          </span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-border-default bg-surface-03 text-text-muted"
          >
            {totalDurationMs}ms Virtual Duration · {involvedNodeIds.length} Services
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={cn(
              "px-2 py-0.5 rounded font-mono text-[9px] border transition-colors uppercase",
              criticalOnly
                ? "bg-amber-950/20 border-amber-900/40 text-amber-400 font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            Critical Path Only
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleDistributedTimeline(false))}
            className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
            title="Close Distributed Timeline"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Multi-Lane Visualization Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2 relative">
        {/* Virtual Time Scale / Axis Header */}
        <div className="flex items-center justify-between text-[9px] font-mono text-text-muted pl-40 pr-2 pb-1 border-b border-border-subtle">
          <span>+0ms</span>
          <span>+{Math.round(totalDurationMs * 0.25)}ms</span>
          <span>+{Math.round(totalDurationMs * 0.5)}ms</span>
          <span>+{Math.round(totalDurationMs * 0.75)}ms</span>
          <span>+{totalDurationMs}ms</span>
        </div>

        {/* Lanes Grouped by Involved Component */}
        <div className="space-y-1.5 relative">
          {involvedNodeIds.map((nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            const nodeLabel = node?.label || nodeId;
            const nodeType = String((node?.data as any)?.componentType || node?.type || "service");

            // Spans executing on this component
            const componentSpans = displayedSpans.filter((s) => s.componentId === nodeId);

            return (
              <div
                key={nodeId}
                className="flex items-center gap-2 group hover:bg-surface-03/40 rounded p-1 transition-colors relative"
              >
                {/* Lane Header (Component Identifier) */}
                <div className="w-36 shrink-0 flex items-center justify-between font-mono text-[10px] pr-2 border-r border-border-subtle">
                  <div className="flex items-center gap-1.5 truncate">
                    <CpuIcon className="w-3 h-3 text-text-muted shrink-0" />
                    <span className="font-semibold text-foreground truncate" title={nodeLabel}>
                      {nodeLabel}
                    </span>
                  </div>
                  <span className="text-[8px] text-text-disabled uppercase shrink-0">
                    {nodeType}
                  </span>
                </div>

                {/* Lane Track & Spans */}
                <div className="flex-1 h-6 bg-surface-01 rounded border border-border-subtle/70 relative overflow-hidden">
                  {componentSpans.map((span) => {
                    const startMs = span.startMs;
                    const endMs = span.endMs !== undefined ? span.endMs : totalDurationMs;
                    const duration = Math.max(15, endMs - startMs);

                    const leftPct = (startMs / totalDurationMs) * 100;
                    const widthPct = Math.min(100 - leftPct, (duration / totalDurationMs) * 100);

                    const isCritical = criticalPathIds.has(span.spanId);
                    const isError = span.status === "error";

                    return (
                      <div
                        key={span.spanId}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(2, widthPct)}%`,
                        }}
                        title={`${span.name} (+${duration}ms)${isCritical ? " [CRITICAL PATH]" : ""}`}
                        className={cn(
                          "absolute top-0.5 bottom-0.5 rounded flex items-center px-1 text-[8px] font-mono truncate transition-all border cursor-pointer",
                          isError
                            ? "bg-rose-950/40 border-rose-900/60 text-rose-300"
                            : isCritical
                              ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                              : "bg-surface-03 border-border-default text-text-secondary hover:text-foreground"
                        )}
                      >
                        <span className="truncate">{span.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Vertical Playback Cursor across all lanes */}
          <div
            style={{ left: `calc(10rem + (100% - 10.5rem) * ${currentProgressPercent / 100})` }}
            className="absolute top-0 bottom-0 w-0.5 bg-foreground pointer-events-none transition-all duration-75 z-20 shadow-level-3"
          >
            <div className="absolute -top-3.5 -translate-x-1/2 px-1 py-0.2 rounded bg-foreground text-background font-mono text-[8px] font-bold">
              +{currentVirtualMs}ms
            </div>
          </div>
        </div>

        {/* Global Timeline Stepper Navigation */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-text-muted">
          <span>Step {currentStepIndex + 1} of {trace.frames.length}</span>
          <div className="flex items-center gap-1">
            {trace.frames.map((frame, idx) => {
              const isActive = idx === currentStepIndex;
              return (
                <button
                  key={frame.frameIndex}
                  type="button"
                  onClick={() => seekToStep(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    isActive
                      ? "bg-foreground scale-125"
                      : "bg-border-default hover:bg-border-strong"
                  )}
                  title={`Step #${frame.frameIndex + 1}: ${frame.stepTitle}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
