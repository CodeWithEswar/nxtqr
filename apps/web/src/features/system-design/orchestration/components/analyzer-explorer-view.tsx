"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Analyzer Catalog & Capability Explorer
 */

import React from "react";
import type {
  AnalyzerDefinition,
  AnalyzerRunRecord,
} from "@nxtqr/architecture-intelligence";
import { CpuIcon, LayersIcon, CheckCircleIcon, AlertCircleIcon, ActivityIcon } from "@nxtqr/icons";

interface AnalyzerExplorerViewProps {
  analyzers: AnalyzerDefinition[];
  runs?: AnalyzerRunRecord[];
  selectedAnalyzerId: string | null;
  onSelectAnalyzer: (id: string) => void;
}

export function AnalyzerExplorerView({
  analyzers,
  runs = [],
  selectedAnalyzerId,
  onSelectAnalyzer,
}: AnalyzerExplorerViewProps) {
  const runMap = new Map<string, AnalyzerRunRecord>();
  for (const r of runs) {
    runMap.set(r.analyzerId, r);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <CpuIcon className="h-4 w-4 text-[#FFFFFF]" />
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Registered Architecture Analyzers</h3>
          <span className="rounded-md bg-[#141414] px-2 py-0.5 text-xs text-[#B5B5B5] border border-[#262626]">
            {analyzers.length} Catalogued
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {analyzers.map((analyzer) => {
          const isSelected = selectedAnalyzerId === analyzer.id;
          const run = runMap.get(analyzer.id);

          return (
            <div
              key={analyzer.id}
              onClick={() => onSelectAnalyzer(analyzer.id)}
              className={`cursor-pointer rounded-md border p-4 transition-colors ${
                isSelected
                  ? "border-[#404040] bg-[#1A1A1A]"
                  : "border-[#262626] bg-[#0D0D0D] hover:border-[#333333] hover:bg-[#141414]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-medium text-[#FFFFFF]">{analyzer.name}</h4>
                  <div className="font-mono text-xs text-[#858585]">{analyzer.id}</div>
                </div>
                <span className="rounded-md bg-[#141414] px-1.5 py-0.5 text-[10px] uppercase font-mono text-[#B5B5B5] border border-[#202020]">
                  {analyzer.category}
                </span>
              </div>

              <p className="text-xs text-[#B5B5B5] mb-3 line-clamp-2">{analyzer.description}</p>

              <div className="flex items-center justify-between border-t border-[#1A1A1A] pt-2 text-[11px] text-[#858585]">
                <div className="flex items-center gap-1 font-mono">
                  <LayersIcon className="h-3 w-3" />
                  <span>Deps: {analyzer.dependencies.length > 0 ? analyzer.dependencies.length : "None"}</span>
                </div>
                <div className="flex items-center gap-1">
                  {run?.status === "completed" && (
                    <span className="flex items-center gap-1 text-[#22c55e]">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>{run.durationMs}ms</span>
                    </span>
                  )}
                  {run?.status === "cached" && (
                    <span className="flex items-center gap-1 text-[#B5B5B5]">
                      <ActivityIcon className="h-3 w-3" />
                      <span>Cached</span>
                    </span>
                  )}
                  {run?.status === "failed" && (
                    <span className="flex items-center gap-1 text-[#ef4444]">
                      <AlertCircleIcon className="h-3 w-3" />
                      <span>Failed</span>
                    </span>
                  )}
                  {!run && <span className="text-[#666666]">Ready</span>}
                </div>
              </div>

              {analyzer.dependencies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {analyzer.dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="rounded bg-[#080808] px-1 py-0.5 font-mono text-[9px] text-[#858585] border border-[#1A1A1A]"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
