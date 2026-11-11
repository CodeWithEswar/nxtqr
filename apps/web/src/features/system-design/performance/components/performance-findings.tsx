"use client";

import * as React from "react";
import type { PerformanceFinding } from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, CheckIcon, HelpCircleIcon } from "@nxtqr/icons";

export interface PerformanceFindingsProps {
  findings: PerformanceFinding[];
}

export function PerformanceFindings({ findings }: PerformanceFindingsProps) {
  if (findings.length === 0) {
    return (
      <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] text-center space-y-2 select-none">
        <CheckIcon className="w-5 h-5 text-emerald-400 mx-auto" />
        <span className="font-medium text-xs text-white block">
          No Performance Findings or Bottleneck Anomalies Detected
        </span>
        <p className="text-[11px] text-[#858585] max-w-sm mx-auto">
          All latency percentiles, throughput ceilings, and error rate budgets are compliant with configured SLA targets.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 select-none text-xs">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2 mb-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#858585]">
          Performance &amp; Scalability Findings ({findings.length})
        </span>
      </div>

      <div className="space-y-2">
        {findings.map((f) => {
          const isCritical = f.severity === "critical";
          const isHigh = f.severity === "high";

          return (
            <div
              key={f.id}
              className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#262626] transition-colors space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isCritical || isHigh ? (
                    <AlertTriangleIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <HelpCircleIcon className="w-4 h-4 text-[#858585] shrink-0" />
                  )}
                  <span className="font-medium text-white text-xs">{f.title}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded-md font-mono text-[9px] uppercase bg-[#141414] border border-[#262626] text-[#858585]">
                    {f.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-mono text-[9px] uppercase border ${
                      isCritical
                        ? "bg-red-950/40 text-red-400 border-red-900/50"
                        : isHigh
                        ? "bg-amber-950/40 text-amber-400 border-amber-900/50"
                        : "bg-[#141414] text-[#858585] border-[#262626]"
                    }`}
                  >
                    {f.severity}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#B5B5B5] leading-relaxed">{f.description}</p>

              <div className="pt-1 border-t border-[#1A1A1A] text-[10px] text-[#858585]">
                <strong className="text-[#B5B5B5]">Remediation:</strong> {f.remediation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
