"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Messaging Reliability & Consistency Findings Inspector
 */

import React from "react";
import type { MessagingFinding } from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, FilterIcon } from "@nxtqr/icons";

export interface MessagingFindingsProps {
  findings: MessagingFinding[];
  severityFilter: string;
  onSeverityFilterChange: (sev: string) => void;
  selectedFindingId?: string;
  onSelectFinding: (id: string) => void;
}

export function MessagingFindings({
  findings,
  severityFilter,
  onSeverityFilterChange,
  selectedFindingId,
  onSelectFinding,
}: MessagingFindingsProps) {
  return (
    <div className="p-4 space-y-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#FFFFFF]">
      {/* Header & Filter */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="w-4 h-4 text-[#858585]" />
          <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
            Reliability & Consistency Findings ({findings.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <FilterIcon className="w-3.5 h-3.5 text-[#858585]" />
          <select
            value={severityFilter}
            onChange={(e) => onSeverityFilterChange(e.target.value)}
            className="bg-[#141414] text-xs text-[#B5B5B5] px-2 py-1 rounded-md border border-[#262626] focus:border-[#404040] focus:outline-none font-mono"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {findings.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#666666] border border-[#202020] rounded-md bg-[#0D0D0D]">
            No findings matching selected filter criteria. All checked messaging policies conform.
          </div>
        ) : (
          findings.map((f) => {
            const isSelected = f.id === selectedFindingId;
            const isCritical = f.severity === "critical";
            const isHigh = f.severity === "high";

            return (
              <div
                key={f.id}
                onClick={() => onSelectFinding(f.id)}
                className={`p-3.5 rounded-md border transition-colors cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-[#1A1A1A] border-[#404040] shadow-sm"
                    : "bg-[#0D0D0D] border-[#202020] hover:border-[#333333]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-md border ${
                        isCritical
                          ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                          : isHigh
                          ? "bg-[#141414] border-[#333333] text-[#FFFFFF]"
                          : "bg-[#141414] border-[#262626] text-[#B5B5B5]"
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="font-semibold text-xs text-[#FFFFFF]">{f.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#858585] shrink-0">
                    {f.category.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-xs text-[#B5B5B5] leading-relaxed">{f.explanation}</p>

                {/* Evidence */}
                {f.evidence.length > 0 && (
                  <div className="p-2 rounded-md bg-[#141414] border border-[#202020] text-[11px] font-mono space-y-0.5">
                    <div className="text-[9px] uppercase tracking-wider text-[#858585]">
                      Evidence Points:
                    </div>
                    {f.evidence.map((ev, i) => (
                      <div key={i} className="text-[#B5B5B5]">
                        • {ev}
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk & Remediation */}
                <div className="text-xs space-y-1 pt-1 border-t border-[#1F1F1F]">
                  <div className="text-[#858585]">
                    <strong className="text-[#B5B5B5]">Risk Impact:</strong> {f.riskAnalysis}
                  </div>
                  <div className="text-[#B5B5B5]">
                    <strong className="text-[#FFFFFF]">Remediation:</strong> {f.remediation}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
