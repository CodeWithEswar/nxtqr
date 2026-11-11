"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Multi-Discipline Finding Correlation Inspector
 */

import React from "react";
import type { CorrelationGroup } from "@nxtqr/architecture-intelligence";
import { ActivityIcon, LayersIcon, ShieldIcon } from "@nxtqr/icons";

interface CorrelationInspectorViewProps {
  groups: CorrelationGroup[];
  onSelectComponent?: (componentId: string) => void;
}

export function CorrelationInspectorView({
  groups,
  onSelectComponent,
}: CorrelationInspectorViewProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-md border border-[#262626] bg-[#080808] p-12 text-center">
        <ShieldIcon className="h-8 w-8 text-[#666666] mb-3" />
        <h3 className="text-sm font-medium text-[#FFFFFF]">No Compound Vulnerabilities Detected</h3>
        <p className="text-xs text-[#858585] mt-1 max-w-sm">
          No components exhibit compound multi-discipline vulnerabilities (e.g. concurrent SPOF, saturation bottleneck, and failover gaps).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-[#FFFFFF]" />
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Compound Architectural Vulnerabilities</h3>
          <span className="rounded-md bg-[#141414] px-2 py-0.5 text-xs text-[#B5B5B5] border border-[#262626]">
            {groups.length} Correlation Group{groups.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-md border border-[#262626] bg-[#0D0D0D] p-5 hover:border-[#333333] transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="text-base font-semibold text-[#FFFFFF]">{group.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded bg-[#141414] px-1.5 py-0.5 font-mono text-[10px] text-[#B5B5B5] border border-[#202020]">
                    {group.primaryCategory}
                  </span>
                  <span className="text-xs text-[#858585]">
                    {group.findings.length} correlated findings
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {group.sharedComponentIds.map((cid) => (
                  <button
                    key={cid}
                    onClick={() => onSelectComponent?.(cid)}
                    className="rounded bg-[#141414] px-2 py-1 font-mono text-xs text-[#FFFFFF] border border-[#262626] hover:border-[#404040] transition-colors"
                  >
                    {cid}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Root Cause Hypothesis */}
            <div className="mb-3 rounded-md bg-[#080808] p-3 border border-[#1A1A1A]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#858585] mb-1">
                Synthesized Candidate Root Cause
              </div>
              <p className="text-xs text-[#B5B5B5]">{group.candidateRootCause}</p>
            </div>

            {/* Recommended Unified Action */}
            <div className="mb-4 rounded-md bg-[#080808] p-3 border border-[#1A1A1A]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#858585] mb-1">
                Recommended Holistic Action
              </div>
              <p className="text-xs text-[#FFFFFF]">{group.recommendedUnifiedAction}</p>
            </div>

            {/* Correlated Findings List */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#858585] mb-2">
                <LayersIcon className="h-3.5 w-3.5" />
                <span>Contributing Findings</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.findings.map((f) => (
                  <div
                    key={f.id}
                    className="rounded border border-[#1A1A1A] bg-[#080808] p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] text-[#858585]">
                        {f.sourceAnalyzerId}
                      </span>
                      <span
                        className={`rounded px-1 py-0.2 font-mono text-[9px] uppercase font-semibold ${
                          f.severity === "critical"
                            ? "text-[#ef4444]"
                            : f.severity === "high"
                            ? "text-[#f59e0b]"
                            : "text-[#B5B5B5]"
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#FFFFFF] line-clamp-1">{f.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
