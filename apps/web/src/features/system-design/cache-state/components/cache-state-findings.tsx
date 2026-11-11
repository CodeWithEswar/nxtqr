"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Reliability, Stampede & Consistency Findings View
 */

import React, { useState, useMemo } from "react";
import type { CacheStateFinding } from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, SearchIcon } from "@nxtqr/icons";

export interface CacheStateFindingsProps {
  findings: CacheStateFinding[];
}

export function CacheStateFindings({ findings }: CacheStateFindingsProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSeverity =
        severityFilter === "all" || f.severity === severityFilter;
      const matchesQuery =
        !searchQuery ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesQuery;
    });
  }, [findings, severityFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#FFFFFF] overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-[#858585]" />
            Caching, Reliability & Consistency Findings ({findings.length})
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Static analysis of invalidation gaps, stampedes, avalanches, stale reads, and distributed lock split-brain hazards.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="w-3.5 h-3.5 text-[#858585] absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings..."
              className="bg-[#080808] border border-[#262626] rounded-md text-xs text-[#FFFFFF] pl-7 pr-2 py-1 font-mono focus:outline-none focus:border-[#404040]"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#080808] border border-[#262626] rounded-md text-xs text-[#FFFFFF] px-2 py-1 font-mono focus:outline-none focus:border-[#404040]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#858585] border border-dashed border-[#262626] rounded-md bg-[#080808]">
            No findings matching the selected filters.
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className={`p-4 rounded-md border bg-[#080808] space-y-2.5 ${
                finding.severity === "critical"
                  ? "border-[#404040]"
                  : "border-[#262626]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md border ${
                        finding.severity === "critical"
                          ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#404040]"
                          : finding.severity === "high"
                          ? "bg-[#141414] text-[#FFFFFF] border-[#333333]"
                          : "bg-[#0D0D0D] text-[#858585] border-[#262626]"
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs font-semibold text-[#FFFFFF] font-mono">
                      {finding.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#B5B5B5] leading-relaxed">
                    {finding.explanation}
                  </p>
                </div>

                <span className="text-[10px] font-mono text-[#858585] shrink-0 bg-[#0D0D0D] px-2 py-1 rounded-md border border-[#262626]">
                  {finding.category.replace(/_/g, " ")}
                </span>
              </div>

              {/* Risk & Remediation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[#1A1A1A]">
                <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <span className="text-[10px] text-[#858585] block font-semibold">
                    Risk Analysis
                  </span>
                  <span className="text-[#B5B5B5] text-[11px] mt-0.5 block">
                    {finding.riskAnalysis}
                  </span>
                </div>

                <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A]">
                  <span className="text-[10px] text-[#858585] block font-semibold">
                    Actionable Remediation
                  </span>
                  <span className="text-[#FFFFFF] text-[11px] mt-0.5 block">
                    {finding.remediation}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
