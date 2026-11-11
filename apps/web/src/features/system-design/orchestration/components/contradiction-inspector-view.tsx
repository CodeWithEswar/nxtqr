"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Contradiction & Architectural Conflict Inspector
 */

import React from "react";
import type { ContradictionRecord } from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface ContradictionInspectorViewProps {
  contradictions: ContradictionRecord[];
  onSelectComponent?: (componentId: string) => void;
}

export function ContradictionInspectorView({
  contradictions,
  onSelectComponent,
}: ContradictionInspectorViewProps) {
  if (contradictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-[#262626] bg-[#080808] p-12 text-center">
        <ShieldIcon className="h-8 w-8 text-[#22c55e] mb-3" />
        <h3 className="text-sm font-medium text-[#FFFFFF]">Zero Contradictions Detected</h3>
        <p className="text-xs text-[#858585] mt-1 max-w-sm">
          All analyzer outputs, graph topology assumptions, and evidence models are mutually consistent without conflicting claims.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <AlertCircleIcon className="h-4 w-4 text-[#ef4444]" />
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Architectural Contradictions & Conflict Detections</h3>
          <span className="rounded-md bg-[#2d0f0f] px-2 py-0.5 text-xs text-[#ef4444] border border-[#4d1f1f]">
            {contradictions.length} Conflict{contradictions.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {contradictions.map((c) => (
          <div
            key={c.id}
            className="rounded-md border border-[#331818] bg-[#0D0808] p-5 hover:border-[#4d1f1f] transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-[#201010] px-2 py-0.5 font-mono text-[10px] uppercase font-semibold text-[#ef4444] border border-[#3d1a1a]">
                    {c.type}
                  </span>
                  <span className="font-mono text-xs text-[#858585]">
                    Analyzers: [{c.involvedAnalyzerIds.join(", ")}]
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-[#FFFFFF]">{c.description}</h4>
              </div>

              {c.affectedComponentIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {c.affectedComponentIds.map((cid) => (
                    <button
                      key={cid}
                      onClick={() => onSelectComponent?.(cid)}
                      className="rounded bg-[#141414] px-2 py-0.5 font-mono text-xs text-[#B5B5B5] border border-[#262626] hover:border-[#404040] hover:text-[#FFFFFF] transition-colors"
                    >
                      {cid}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-3 rounded-md bg-[#000000] p-3 border border-[#261414] text-xs">
              <strong className="text-[#ef4444]">Conflicting Architecture Claims:</strong>
              <p className="text-[#B5B5B5] mt-1">{c.explanation}</p>
            </div>

            <div className="rounded-md bg-[#000000] p-3 border border-[#1A1A1A] text-xs">
              <strong className="text-[#FFFFFF]">Resolution Guidance:</strong>
              <p className="text-[#B5B5B5] mt-1">{c.resolutionGuidance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
