"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Multi-Wave Dependency DAG & Execution Visualizer
 */

import React from "react";
import type {
  ExecutionPlan,
  AnalyzerRunRecord,
} from "@nxtqr/architecture-intelligence";
import { LayersIcon, ChevronRightIcon, CheckCircleIcon, AlertCircleIcon, ActivityIcon } from "@nxtqr/icons";

interface ExecutionDagViewProps {
  plan: ExecutionPlan | null;
  runs?: AnalyzerRunRecord[];
  onSelectAnalyzer?: (id: string) => void;
}

export function ExecutionDagView({ plan, runs = [], onSelectAnalyzer }: ExecutionDagViewProps) {
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-[#262626] bg-[#080808] p-12 text-center">
        <LayersIcon className="h-8 w-8 text-[#666666] mb-3" />
        <h3 className="text-sm font-medium text-[#FFFFFF]">No Active Execution Plan</h3>
        <p className="text-xs text-[#858585] mt-1 max-w-sm">
          Run architecture orchestration to generate a dependency DAG and multi-wave execution schedule.
        </p>
      </div>
    );
  }

  const runMap = new Map<string, AnalyzerRunRecord>();
  for (const r of runs) {
    runMap.set(r.analyzerId, r);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <LayersIcon className="h-4 w-4 text-[#FFFFFF]" />
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Multi-Wave Dependency Schedule</h3>
          <span className="rounded-md bg-[#141414] px-2 py-0.5 text-xs text-[#B5B5B5] border border-[#262626]">
            {plan.waves.length} Waves
          </span>
          <span className="rounded-md bg-[#141414] px-2 py-0.5 text-xs text-[#B5B5B5] border border-[#262626]">
            {plan.totalEstimatedAnalyzers} Analyzers Scheduled
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {plan.waves.map((wave, idx) => (
          <div key={wave.waveIndex} className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A1A1A] font-mono text-[10px] text-[#FFFFFF] border border-[#333333]">
                {wave.waveIndex}
              </span>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#B5B5B5]">
                Wave {wave.waveIndex} — {wave.analyzerIds.length} Parallel Analyzer{wave.analyzerIds.length > 1 ? "s" : ""}
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {wave.analyzerIds.map((analyzerId) => {
                const run = runMap.get(analyzerId);

                return (
                  <div
                    key={analyzerId}
                    onClick={() => onSelectAnalyzer?.(analyzerId)}
                    className="cursor-pointer rounded-md border border-[#262626] bg-[#0D0D0D] p-3 hover:border-[#333333] hover:bg-[#141414] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="font-mono text-xs font-medium text-[#FFFFFF] truncate">
                        {analyzerId}
                      </span>
                      {run?.status === "completed" && (
                        <CheckCircleIcon className="h-3.5 w-3.5 text-[#22c55e] shrink-0" />
                      )}
                      {run?.status === "cached" && (
                        <ActivityIcon className="h-3.5 w-3.5 text-[#B5B5B5] shrink-0" />
                      )}
                      {run?.status === "failed" && (
                        <AlertCircleIcon className="h-3.5 w-3.5 text-[#ef4444] shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#858585]">
                      <span>
                        {run?.findingsCount !== undefined ? `${run.findingsCount} findings` : "Pending"}
                      </span>
                      <span className="font-mono">
                        {run?.isCached ? "cached" : run?.durationMs !== undefined ? `${run.durationMs}ms` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {idx < plan.waves.length - 1 && (
              <div className="flex items-center justify-center my-4 text-[#404040]">
                <ChevronRightIcon className="h-4 w-4 rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
