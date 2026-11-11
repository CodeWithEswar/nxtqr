"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Unified Multi-Discipline Findings View
 */

import React, { useState, useMemo } from "react";
import type { NormalizedFinding } from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, SearchIcon, FilterIcon, ShieldIcon } from "@nxtqr/icons";

interface UnifiedFindingsViewProps {
  findings: NormalizedFinding[];
  onSelectComponent?: (componentId: string) => void;
}

export function UnifiedFindingsView({ findings, onSelectComponent }: UnifiedFindingsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSeverity =
        severityFilter === "all" || f.severity.toLowerCase() === severityFilter.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.sourceAnalyzerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.affectedComponentIds.some((id) => id.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSeverity && matchesSearch;
    });
  }, [findings, severityFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search & Filters Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="h-4 w-4 text-[#FFFFFF]" />
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Unified Architecture Findings</h3>
          <span className="rounded-md bg-[#141414] px-2 py-0.5 text-xs text-[#B5B5B5] border border-[#262626]">
            {filteredFindings.length} of {findings.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#858585]" />
            <input
              type="text"
              placeholder="Search findings or components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56 rounded-md border border-[#262626] bg-[#0D0D0D] pl-8 pr-3 text-xs text-[#FFFFFF] placeholder-[#666666] focus:border-[#404040] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-md border border-[#262626] bg-[#0D0D0D] p-0.5 text-xs">
            <FilterIcon className="h-3 w-3 text-[#858585] ml-1.5" />
            {(["all", "critical", "high", "medium", "low"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`rounded px-2 py-1 text-[11px] capitalize transition-colors ${
                  severityFilter === sev
                    ? "bg-[#1A1A1A] text-[#FFFFFF] font-medium"
                    : "text-[#858585] hover:text-[#FFFFFF]"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-[#262626] bg-[#080808] p-10 text-center">
          <ShieldIcon className="h-8 w-8 text-[#666666] mb-2" />
          <h4 className="text-sm font-medium text-[#FFFFFF]">No Findings Match Filter</h4>
          <p className="text-xs text-[#858585] mt-1">
            Try adjusting your search query or severity filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="rounded-md border border-[#262626] bg-[#0D0D0D] p-4 hover:border-[#333333] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase font-semibold ${
                        finding.severity === "critical"
                          ? "bg-[#2d0f0f] text-[#ef4444] border border-[#4d1f1f]"
                          : finding.severity === "high"
                          ? "bg-[#261d0f] text-[#f59e0b] border border-[#473215]"
                          : finding.severity === "medium"
                          ? "bg-[#141414] text-[#B5B5B5] border border-[#262626]"
                          : "bg-[#0A0A0A] text-[#858585] border border-[#1A1A1A]"
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="font-mono text-xs text-[#858585]">{finding.sourceAnalyzerId}</span>
                  </div>
                  <h4 className="text-sm font-medium text-[#FFFFFF]">{finding.title}</h4>
                </div>

                <span className="shrink-0 rounded bg-[#141414] px-2 py-0.5 font-mono text-[10px] text-[#858585] border border-[#202020]">
                  {finding.confidence}
                </span>
              </div>

              <p className="text-xs text-[#B5B5B5] mb-3">{finding.description}</p>

              {finding.remediationRecommendation && (
                <div className="mb-3 rounded-md bg-[#080808] p-2.5 border border-[#1A1A1A] text-xs text-[#B5B5B5]">
                  <strong className="text-[#FFFFFF]">Remediation:</strong> {finding.remediationRecommendation}
                </div>
              )}

              {finding.affectedComponentIds.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#1A1A1A]">
                  <span className="text-[11px] text-[#858585]">Affected:</span>
                  <div className="flex flex-wrap gap-1">
                    {finding.affectedComponentIds.map((cid) => (
                      <button
                        key={cid}
                        onClick={() => onSelectComponent?.(cid)}
                        className="rounded bg-[#141414] px-1.5 py-0.5 font-mono text-[10px] text-[#B5B5B5] border border-[#262626] hover:border-[#404040] hover:text-[#FFFFFF] transition-colors"
                      >
                        {cid}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
