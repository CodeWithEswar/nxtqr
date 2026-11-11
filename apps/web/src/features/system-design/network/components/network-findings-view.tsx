"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Network Findings & Architectural Risk Review
 */

import React, { useState } from "react";
import type { NetworkFinding } from "@nxtqr/architecture-intelligence";
import {
  AlertTriangleIcon,
  SearchIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";

export interface NetworkFindingsViewProps {
  findings: NetworkFinding[];
}

export function NetworkFindingsView({ findings }: NetworkFindingsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = findings.filter((f) => {
    if (severityFilter !== "all" && f.severity !== severityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.remediation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter((f) => f.severity === "low").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-[#858585]" />
            Network Engineering Findings & Risk Analysis
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Static verification of routing loops, single ingress SPOFs, plaintext boundaries, and timeout inversions.
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#080808] border border-[#262626] rounded-md text-xs font-mono">
          <button
            onClick={() => setSeverityFilter("all")}
            className={`px-2.5 py-1 rounded transition-colors ${
              severityFilter === "all"
                ? "bg-[#1A1A1A] text-[#FFFFFF]"
                : "text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            All ({findings.length})
          </button>
          <button
            onClick={() => setSeverityFilter("critical")}
            className={`px-2.5 py-1 rounded transition-colors ${
              severityFilter === "critical"
                ? "bg-[#1A0A0A] text-[#FF4D4D] border border-[#551A1A]"
                : "text-[#858585] hover:text-[#FF4D4D]"
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setSeverityFilter("high")}
            className={`px-2.5 py-1 rounded transition-colors ${
              severityFilter === "high"
                ? "bg-[#1A1408] text-[#FFAA00] border border-[#553300]"
                : "text-[#858585] hover:text-[#FFAA00]"
            }`}
          >
            High ({highCount})
          </button>
          <button
            onClick={() => setSeverityFilter("medium")}
            className={`px-2.5 py-1 rounded transition-colors ${
              severityFilter === "medium"
                ? "bg-[#141414] text-[#B5B5B5] border border-[#333333]"
                : "text-[#858585] hover:text-[#B5B5B5]"
            }`}
          >
            Medium ({mediumCount})
          </button>
          <button
            onClick={() => setSeverityFilter("low")}
            className={`px-2.5 py-1 rounded transition-colors ${
              severityFilter === "low"
                ? "bg-[#141414] text-[#858585] border border-[#262626]"
                : "text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            Low ({lowCount})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-[#666666]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter findings by keyword, title, category, or resource..."
          className="w-full bg-[#080808] border border-[#262626] rounded-md pl-9 pr-4 py-2 text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#404040]"
        />
      </div>

      {/* Findings List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((finding) => (
            <div
              key={finding.id}
              className={`p-4 bg-[#080808] border rounded-md space-y-3 ${
                finding.severity === "critical"
                  ? "border-[#551A1A]"
                  : finding.severity === "high"
                  ? "border-[#553300]"
                  : "border-[#262626]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                        finding.severity === "critical"
                          ? "bg-[#1A0A0A] text-[#FF4D4D] border-[#551A1A]"
                          : finding.severity === "high"
                          ? "bg-[#1A1408] text-[#FFAA00] border-[#553300]"
                          : "bg-[#141414] text-[#858585] border-[#262626]"
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-xs font-mono text-[#858585]">
                      {finding.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#FFFFFF]">
                    {finding.title}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-[#B5B5B5] space-y-2">
                <p>{finding.summary}</p>
                <div className="p-2.5 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-1">
                  <span className="text-[10px] text-[#858585] font-mono uppercase font-semibold">
                    Risk & Architecture Rationale
                  </span>
                  <p className="text-xs text-[#858585]">{finding.rationale}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 border-t border-[#1A1A1A] text-xs font-mono">
                <div className="text-[11px] text-[#858585] flex items-center gap-1.5">
                  <span>Affected Resources:</span>
                  <span className="text-[#B5B5B5]">
                    {finding.affectedResourceIds.join(", ") || "Global"}
                  </span>
                </div>
                <div className="text-[11px] text-[#4ADE80] flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Remediation: {finding.remediation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-[#262626] rounded-md bg-[#080808] text-xs text-[#858585] space-y-1">
          <CheckCircleIcon className="w-6 h-6 text-[#4ADE80] mx-auto mb-2" />
          <div className="font-semibold text-[#FFFFFF]">No Matching Findings</div>
          <p>Topology satisfies all validated routing, safety, and performance constraints.</p>
        </div>
      )}
    </div>
  );
}
