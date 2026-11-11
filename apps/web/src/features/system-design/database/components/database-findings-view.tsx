"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Database Architecture Findings & Risk Advisor View
 */

import React, { useState } from "react";
import type { DatabaseArchitectureFinding } from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, CheckIcon, SearchIcon } from "@nxtqr/icons";

export interface DatabaseFindingsViewProps {
  findings: DatabaseArchitectureFinding[];
}

export function DatabaseFindingsView({ findings }: DatabaseFindingsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = findings.filter((f) => {
    const matchesSeverity = severityFilter === "all" || f.severity === severityFilter;
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.explanation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-[#FFFFFF]" />
              Database Architecture Findings & Risks
            </h2>
            <p className="text-xs text-[#858585] mt-0.5">
              Identified indexing gaps, query plan regressions, deadlock hazards, and storage saturation alerts.
            </p>
          </div>
          <span className="text-xs font-mono text-[#858585]">
            Showing <strong className="text-[#FFFFFF]">{filtered.length}</strong> of {findings.length} findings
          </span>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#1A1A1A]">
          <div className="flex items-center gap-1.5">
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-md transition-colors border ${
                  severityFilter === sev
                    ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3"
                    : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#FFFFFF]"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <SearchIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search findings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D0D0D] text-xs text-[#FFFFFF] placeholder-[#666666] pl-8 pr-3 py-1.5 rounded-md border border-[#262626] hover:border-[#333333] focus:border-[#404040] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Findings Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 bg-[#080808] border border-[#262626] rounded-md text-center text-xs text-[#858585] flex flex-col items-center justify-center">
            <CheckIcon className="w-6 h-6 mb-2 text-[#FFFFFF]" />
            <span>Zero findings matching the selected filters. Database design adheres to best practices.</span>
          </div>
        ) : (
          filtered.map((finding) => (
            <div
              key={finding.id}
              className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3 hover:border-[#333333] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md font-mono uppercase font-bold border ${
                      finding.severity === "critical"
                        ? "bg-[#141414] text-[#FFFFFF] border-[#404040]"
                        : finding.severity === "high"
                        ? "bg-[#141414] text-[#B5B5B5] border-[#333333]"
                        : "bg-[#0D0D0D] text-[#858585] border-[#262626]"
                    }`}
                  >
                    {finding.severity}
                  </span>
                  <span className="text-xs font-semibold text-[#FFFFFF]">
                    {finding.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#666666]">
                  {finding.category}
                </span>
              </div>

              <p className="text-xs text-[#858585] leading-relaxed">
                {finding.explanation}
              </p>

              {/* Evidence Pills */}
              {finding.evidence && finding.evidence.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-[#666666]">
                  {finding.evidence.map((ev, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-[#858585]"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              )}

              {/* Risk Analysis */}
              {finding.riskAnalysis && (
                <div className="text-[11px] text-[#B5B5B5] bg-[#0D0D0D] p-2.5 rounded-md border border-[#202020]">
                  <strong className="text-[#FFFFFF]">Risk Impact: </strong>
                  {finding.riskAnalysis}
                </div>
              )}

              {/* Actionable Remediation */}
              <div className="p-3 bg-[#000000] border border-[#262626] rounded-md text-[11px] font-mono text-[#FFFFFF]">
                <span className="text-[#666666] block mb-1 uppercase text-[9px] tracking-wider">
                  Recommended Architecture Remediation
                </span>
                <p className="whitespace-pre-wrap">{finding.remediation}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
