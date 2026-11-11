"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Event Flow & Multi-Hop Path Explorer
 */

import React from "react";
import type { EventFlowTrace } from "@nxtqr/architecture-intelligence";
import { ChevronRightIcon, AlertTriangleIcon, LayersIcon } from "@nxtqr/icons";

export interface EventFlowExplorerProps {
  traces: EventFlowTrace[];
  selectedTraceId?: string;
  onSelectTrace: (id: string) => void;
}

export function EventFlowExplorer({
  traces,
  selectedTraceId,
  onSelectTrace,
}: EventFlowExplorerProps) {
  const activeTrace = traces.find((t) => t.id === selectedTraceId) || traces[0];

  return (
    <div className="p-4 space-y-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#FFFFFF]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
          <LayersIcon className="w-3.5 h-3.5 text-[#858585]" />
          Multi-Hop Event Flow Traces ({traces.length})
        </div>
        {activeTrace?.hasCyclicDependency && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1A1A1A] border border-[#404040] text-[#FFFFFF]">
            <AlertTriangleIcon className="w-3 h-3 text-[#B5B5B5]" />
            Cyclic Loop Detected
          </span>
        )}
      </div>

      {/* Trace Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {traces.map((trace) => {
          const isSelected = trace.id === activeTrace?.id;
          return (
            <button
              key={trace.id}
              onClick={() => onSelectTrace(trace.id)}
              className={`px-3 py-1.5 rounded-md border text-left shrink-0 transition-colors font-mono ${
                isSelected
                  ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                  : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:border-[#333333] hover:text-[#FFFFFF]"
              }`}
            >
              <div className="font-semibold">{trace.rootEventType}</div>
              <div className="text-[10px] text-[#666666] mt-0.5">
                {trace.producerName} → {trace.destinationName}
              </div>
            </button>
          );
        })}
      </div>

      {/* Visual Path Flow */}
      {activeTrace ? (
        <div className="space-y-4">
          <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-3">
            <div className="text-[10px] uppercase font-mono text-[#858585] tracking-wider">
              Primary Event Delivery Path (Depth: {activeTrace.flowDepth})
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-2">
              {activeTrace.path.map((node, index) => {
                const isHazard = node.status === "hazard";
                return (
                  <React.Fragment key={`${node.id}-${index}`}>
                    <div
                      className={`p-2.5 rounded-md border text-xs font-mono flex flex-col gap-0.5 ${
                        isHazard
                          ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                          : "bg-[#141414] border-[#262626] text-[#FFFFFF]"
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-wider text-[#858585]">
                        {node.type}
                      </span>
                      <span className="font-semibold">{node.name}</span>
                      {isHazard && (
                        <span className="text-[9px] text-[#B5B5B5]">
                          Side-effect without idempotency
                        </span>
                      )}
                    </div>

                    {index < activeTrace.path.length - 1 && (
                      <ChevronRightIcon className="w-3.5 h-3.5 text-[#666666] shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Dead-Letter Paths */}
          {activeTrace.deadLetterPaths.length > 0 && (
            <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-3">
              <div className="text-[10px] uppercase font-mono text-[#858585] tracking-wider">
                Dead-Letter Routing Branches
              </div>
              {activeTrace.deadLetterPaths.map((dlqPath, idx) => (
                <div key={idx} className="flex items-center gap-2 flex-wrap">
                  {dlqPath.map((node, i) => (
                    <React.Fragment key={i}>
                      <div
                        className={`p-2 rounded-md border text-[11px] font-mono ${
                          node.type === "dead_letter"
                            ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                            : "bg-[#141414] border-[#262626] text-[#858585]"
                        }`}
                      >
                        {node.name}
                      </div>
                      {i < dlqPath.length - 1 && (
                        <ChevronRightIcon className="w-3 h-3 text-[#666666] shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Downstream Event Emissions */}
          {activeTrace.downstreamEventsEmitted.length > 0 && (
            <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs space-y-1 font-mono">
              <span className="text-[#858585]">Cascading Downstream Events Emitted: </span>
              <span className="text-[#FFFFFF]">
                {activeTrace.downstreamEventsEmitted.join(", ")}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-[#666666] border border-[#202020] rounded-md">
          No event flow traces generated. Add producers and consumers to map end-to-end paths.
        </div>
      )}
    </div>
  );
}
