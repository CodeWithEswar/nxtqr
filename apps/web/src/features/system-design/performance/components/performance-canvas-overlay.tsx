"use client";

import * as React from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import type { BenchmarkRun, BottleneckValidation } from "@nxtqr/architecture-intelligence";
import { CpuIcon, CheckIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface PerformanceCanvasOverlayProps {
  nodes: BaseNode[];
  activeRun: BenchmarkRun;
  bottleneckValidations: BottleneckValidation[];
  selectedComponentId?: string;
  onSelectComponent?: (componentId: string) => void;
}

export function PerformanceCanvasOverlay({
  nodes,
  activeRun,
  bottleneckValidations,
  selectedComponentId,
  onSelectComponent,
}: PerformanceCanvasOverlayProps) {
  const bMap = React.useMemo(() => {
    const map = new Map<string, BottleneckValidation>();
    for (const b of bottleneckValidations) {
      map.set(b.componentId, b);
    }
    return map;
  }, [bottleneckValidations]);

  return (
    <div className="flex flex-col bg-[#080808] border border-[#262626] rounded-md p-3 select-none text-xs space-y-2">
      <div className="flex items-center justify-between border-b border-[#202020] pb-2">
        <div className="flex items-center gap-2">
          <CpuIcon className="w-4 h-4 text-white" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-white font-bold">
            Architecture Node Benchmark Telemetry Attribution
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#858585]">
          Run #{activeRun.runNumber} ({activeRun.sourceTool.toUpperCase()})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {nodes.map((node) => {
          const label = (node.data?.label as string) || node.id;
          const bValidation = bMap.get(node.id);
          const isSelected = selectedComponentId === node.id;

          // Check if node has specific operation summary or fallback
          const opSummary = Object.values(activeRun.operationSummaries).find(
            (o) => o.targetComponentId === node.id
          );
          const p95 = opSummary?.p95LatencyMs ?? activeRun.overallSummary.p95LatencyMs;
          const rps = opSummary?.achievedRps ?? activeRun.overallSummary.achievedRps;

          return (
            <div
              key={node.id}
              onClick={() => onSelectComponent?.(node.id)}
              className={`p-2.5 rounded-md border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#141414] border-[#404040] shadow-level-1"
                  : "bg-[#0D0D0D] border-[#202020] hover:border-[#333333]"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-medium text-white truncate">{label}</span>
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#858585]">
                  {node.type}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                <span className="text-[#858585]">P95 Latency:</span>
                <span className="text-white font-medium">{p95.toFixed(1)} ms</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#858585]">Throughput:</span>
                <span className="text-white font-medium">{rps.toFixed(1)} RPS</span>
              </div>

              {bValidation && (
                <div className="mt-2 pt-1.5 border-t border-[#1A1A1A] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#666666]">Bottleneck:</span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      bValidation.verdict === "supported"
                        ? "text-red-400"
                        : bValidation.verdict === "contradicted"
                        ? "text-emerald-400"
                        : "text-[#858585]"
                    }`}
                  >
                    {bValidation.verdict === "supported" && <AlertTriangleIcon className="w-2.5 h-2.5" />}
                    {bValidation.verdict === "contradicted" && <CheckIcon className="w-2.5 h-2.5" />}
                    {bValidation.verdict.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
