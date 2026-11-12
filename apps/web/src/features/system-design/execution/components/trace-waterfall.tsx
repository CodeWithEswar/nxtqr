"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button, Badge } from "@nxtqr/ui";
import {
  CloseIcon,
  LayersIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";
import { TraceTreeBuilder, type TraceTreeNode } from "@nxtqr/architecture-execution";

export interface TraceWaterfallProps {
  className?: string;
  onClose?: () => void;
}

export function TraceWaterfall({ className, onClose }: TraceWaterfallProps) {
  const trace = useExecutionStore((s) => s.trace);
  const toggleTraceWaterfall = useExecutionStore((s) => s.toggleTraceWaterfall);

  const [expandedSpanIds, setExpandedSpanIds] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (spanId: string) => {
    setExpandedSpanIds((prev) => ({
      ...prev,
      [spanId]: !prev[spanId],
    }));
  };

  if (!trace || !trace.spans || trace.spans.length === 0) {
    return (
      <div
        className={cn(
          "w-full h-56 bg-surface-02 border border-border-default rounded-md p-4 flex flex-col items-center justify-center text-center shadow-level-2 select-none",
          className
        )}
      >
        <LayersIcon className="w-6 h-6 text-text-disabled mb-2" />
        <h4 className="text-xs font-semibold text-foreground">No Distributed Spans Recorded</h4>
        <p className="text-[11px] text-text-muted mt-1 max-w-xs">
          Run a distributed execution scenario to capture OpenTelemetry-style parent/child trace spans.
        </p>
      </div>
    );
  }

  const spans = trace.spans;
  const criticalPathIds = trace.criticalPathSpanIds || [];
  const treeRoots = TraceTreeBuilder.buildTree(spans, criticalPathIds);
  const totalDurationMs = Math.max(trace.totalDurationMs || 100, 100);

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
          <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground">
            Distributed Trace Waterfall
          </span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-border-default bg-surface-03 text-text-muted"
          >
            {spans.length} Spans · {totalDurationMs}ms Virtual Duration
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose || (() => toggleTraceWaterfall(false))}
          className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
          title="Close Trace Waterfall"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Waterfall Table */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-border-subtle/60 p-2 space-y-1">
        {/* Waterfall Axis Scale */}
        <div className="flex items-center justify-between text-[8px] font-mono text-text-muted pl-64 pr-2 pb-1 border-b border-border-subtle">
          <span>0ms</span>
          <span>+{Math.round(totalDurationMs * 0.25)}ms</span>
          <span>+{Math.round(totalDurationMs * 0.5)}ms</span>
          <span>+{Math.round(totalDurationMs * 0.75)}ms</span>
          <span>+{totalDurationMs}ms</span>
        </div>

        {/* Render Hierarchical Spans */}
        {treeRoots.map((root) => (
          <SpanTreeRow
            key={root.span.spanId}
            node={root}
            totalDurationMs={totalDurationMs}
            isExpanded={expandedSpanIds[root.span.spanId] ?? true}
            onToggleExpand={() => toggleExpand(root.span.spanId)}
            expandedMap={expandedSpanIds}
            onToggleExpandChild={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
}

interface SpanTreeRowProps {
  node: TraceTreeNode;
  totalDurationMs: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedMap: Record<string, boolean>;
  onToggleExpandChild: (id: string) => void;
}

function SpanTreeRow({
  node,
  totalDurationMs,
  isExpanded,
  onToggleExpand,
  expandedMap,
  onToggleExpandChild,
}: SpanTreeRowProps) {
  const { span, children, depth, isCriticalPath } = node;

  const startMs = span.startMs;
  const endMs = span.endMs !== undefined ? span.endMs : totalDurationMs;
  const duration = Math.max(15, endMs - startMs);

  const leftPct = (startMs / totalDurationMs) * 100;
  const widthPct = Math.min(100 - leftPct, (duration / totalDurationMs) * 100);

  const isError = span.status === "error";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 group hover:bg-surface-03/50 rounded p-1 transition-colors">
        {/* Span Name & Hierarchy Column */}
        <div
          style={{ paddingLeft: `${depth * 14}px` }}
          className="w-60 shrink-0 flex items-center gap-1.5 font-mono text-[10px] truncate"
        >
          {children.length > 0 ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-0.5 text-text-muted hover:text-foreground rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3" />
              ) : (
                <ChevronRightIcon className="w-3 h-3" />
              )}
            </button>
          ) : (
            <span className="w-3 h-3 inline-block shrink-0" />
          )}

          <div className="flex items-center gap-1 truncate">
            {isError ? (
              <AlertCircleIcon className="w-3 h-3 text-rose-400 shrink-0" />
            ) : (
              <CheckCircleIcon className="w-3 h-3 text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold text-foreground truncate" title={span.name}>
              {span.name}
            </span>
          </div>
        </div>

        {/* Waterfall Bar Column */}
        <div className="flex-1 h-5 bg-surface-01 rounded border border-border-subtle relative overflow-hidden">
          <div
            style={{
              left: `${leftPct}%`,
              width: `${Math.max(2, widthPct)}%`,
            }}
            className={cn(
              "absolute top-0.5 bottom-0.5 rounded flex items-center justify-between px-1.5 text-[8px] font-mono truncate transition-all border",
              isError
                ? "bg-rose-950/40 border-rose-900/60 text-rose-300"
                : isCriticalPath
                  ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                  : "bg-surface-03 border-border-default text-text-secondary"
            )}
          >
            <span className="truncate">{span.componentLabel || span.componentId}</span>
            <span className="shrink-0 pl-1">{duration}ms</span>
          </div>
        </div>

        {/* Badges Column */}
        <div className="w-24 shrink-0 flex items-center justify-end gap-1">
          {isCriticalPath && (
            <Badge
              variant="outline"
              className="text-[8px] font-mono px-1 py-0 h-3.5 border-border-strong bg-surface-04 text-foreground uppercase"
            >
              Critical
            </Badge>
          )}
          <span className="font-mono text-[9px] text-text-muted">{duration}ms</span>
        </div>
      </div>

      {/* Render Nested Children if Expanded */}
      {isExpanded && children.length > 0 && (
        <div className="space-y-1">
          {children.map((child) => (
            <SpanTreeRow
              key={child.span.spanId}
              node={child}
              totalDurationMs={totalDurationMs}
              isExpanded={expandedMap[child.span.spanId] ?? true}
              onToggleExpand={() => onToggleExpandChild(child.span.spanId)}
              expandedMap={expandedMap}
              onToggleExpandChild={onToggleExpandChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
