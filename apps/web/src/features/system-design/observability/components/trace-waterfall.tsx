"use client";

import React, { useState } from "react";
import type { TraceQueryResult, TraceSpan } from "@nxtqr/architecture-intelligence";
import { LayersIcon, AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

export interface TraceWaterfallProps {
  trace: TraceQueryResult | null;
  onSelectSpan?: (span: TraceSpan) => void;
  className?: string;
}

export function TraceWaterfall({
  trace,
  onSelectSpan,
  className = "",
}: TraceWaterfallProps) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [highlightCriticalPath, setHighlightCriticalPath] = useState<boolean>(true);

  if (!trace || trace.spans.length === 0) {
    return (
      <div className={`p-6 text-center text-[#858585] text-xs font-mono bg-[#080808] border border-[#262626] rounded-md ${className}`}>
        No active distributed trace spans available. Select an active service to inspect runtime dependencies.
      </div>
    );
  }

  const rootSpan = trace.rootSpan || trace.spans[0];
  const totalDurationMs = Math.max(trace.totalDurationMs, 1);
  const baseStartMs = rootSpan.startTimeMs;

  const handleSpanClick = (span: TraceSpan) => {
    setSelectedSpanId(span.spanId);
    if (onSelectSpan) onSelectSpan(span);
  };

  const selectedSpan = trace.spans.find((s) => s.spanId === selectedSpanId);

  return (
    <div className={`flex flex-col h-full bg-[#080808] border border-[#262626] rounded-md text-white text-xs select-none overflow-hidden ${className}`}>
      {/* 1. Trace Header Bar */}
      <div className="flex items-center justify-between p-3 border-b border-[#262626] bg-[#0D0D0D]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-white" />
            <span className="font-semibold text-sm">Distributed Trace Explorer</span>
          </div>
          <span className="text-[#666666]">/</span>
          <span className="font-mono text-[11px] text-[#858585] truncate max-w-[200px]">
            traceId: <span className="text-white">{trace.traceId}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-[#141414] border border-[#262626] text-white">
            {totalDurationMs} ms
          </span>
          {trace.hasErrors && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] bg-red-950/40 border border-red-900/40 text-red-400">
              <AlertCircleIcon className="w-3 h-3" />
              Errors Detected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHighlightCriticalPath((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
              highlightCriticalPath
                ? "bg-[#1A1A1A] border-[#333333] text-amber-400"
                : "bg-[#0D0D0D] border-[#262626] text-[#858585] hover:text-white"
            }`}
          >
            <ShieldIcon className="w-3.5 h-3.5" />
            <span>Critical Path ({trace.criticalPathDurationMs}ms)</span>
          </button>
        </div>
      </div>

      {/* 2. Timeline Scale Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1A1A1A] bg-[#090909] font-mono text-[10px] text-[#666666]">
        <span>0 ms</span>
        <span>{Math.round(totalDurationMs * 0.25)} ms</span>
        <span>{Math.round(totalDurationMs * 0.5)} ms</span>
        <span>{Math.round(totalDurationMs * 0.75)} ms</span>
        <span>{totalDurationMs} ms</span>
      </div>

      {/* 3. Spans Waterfall List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A] p-2">
        {trace.spans.map((span) => {
          const isSelected = span.spanId === selectedSpanId;
          const isCritical = highlightCriticalPath && span.isCriticalPath;
          const startOffsetPercent = Math.max(
            0,
            Math.min(100, ((span.startTimeMs - baseStartMs) / totalDurationMs) * 100)
          );
          const durationPercent = Math.max(
            3,
            Math.min(100 - startOffsetPercent, (span.durationMs / totalDurationMs) * 100)
          );

          const indentLevel = span.parentSpanId ? 1 : 0;

          return (
            <div
              key={span.spanId}
              onClick={() => handleSpanClick(span)}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                isSelected
                  ? "bg-[#1A1A1A] border border-[#333333]"
                  : "hover:bg-[#0D0D0D] border border-transparent"
              }`}
            >
              {/* Left Column: Hierarchy, Service, Operation */}
              <div
                className="flex items-center gap-2 min-w-[260px] max-w-[320px] truncate"
                style={{ paddingLeft: `${indentLevel * 18}px` }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#333333] flex-shrink-0" />
                <span className="font-mono text-[11px] font-semibold text-white px-1.5 py-0.5 bg-[#141414] border border-[#262626] rounded-md truncate">
                  {span.serviceName}
                </span>
                <span className="font-mono text-[11px] text-[#858585] truncate">
                  {span.operationName}
                </span>
              </div>

              {/* Center Column: Duration Waterfall Bar */}
              <div className="flex-1 mx-4 relative h-4 bg-[#111111] rounded-md overflow-hidden">
                <div
                  className={`absolute top-0 bottom-0 rounded-md transition-all ${
                    span.statusCode === "error"
                      ? "bg-red-500"
                      : isCritical
                      ? "bg-amber-400"
                      : "bg-[#404040]"
                  }`}
                  style={{
                    left: `${startOffsetPercent}%`,
                    width: `${durationPercent}%`,
                  }}
                />
              </div>

              {/* Right Column: Duration & Status Badge */}
              <div className="flex items-center gap-2 font-mono text-[11px] flex-shrink-0">
                <span
                  className={
                    span.statusCode === "error"
                      ? "text-red-400 font-bold"
                      : isCritical
                      ? "text-amber-400 font-semibold"
                      : "text-white"
                  }
                >
                  {span.durationMs} ms
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] uppercase border ${
                    span.statusCode === "error"
                      ? "bg-red-950/40 border-red-900/40 text-red-400"
                      : "bg-[#141414] border-[#262626] text-[#858585]"
                  }`}
                >
                  {span.statusCode}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Attributes Drawer (when a span is selected) */}
      {selectedSpan && (
        <div className="border-t border-[#262626] p-3 bg-[#0D0D0D] font-mono text-[11px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-white">
              Span Attributes: {selectedSpan.serviceName} — {selectedSpan.operationName}
            </span>
            <span className="text-[#858585]">spanId: {selectedSpan.spanId}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[#858585]">
            {Object.entries(selectedSpan.attributes).map(([k, v]) => (
              <div key={k} className="p-1.5 bg-[#141414] border border-[#262626] rounded-md truncate">
                <span className="text-[#666666]">{k}:</span>{" "}
                <span className="text-white">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
