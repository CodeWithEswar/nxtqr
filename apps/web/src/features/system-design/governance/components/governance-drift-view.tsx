"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Governance Baseline & Drift Comparison View
 */

import React from "react";
import type {
  GovernanceDrift,
  GovernanceBaseline,
} from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
  CpuIcon,
} from "@nxtqr/icons";

export interface GovernanceDriftViewProps {
  drift?: GovernanceDrift;
  baselines: GovernanceBaseline[];
}

export function GovernanceDriftView({
  drift,
  baselines: _baselines,
}: GovernanceDriftViewProps) {
  if (!drift) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#000000] text-[#858585]">
        <LayersIcon size={24} className="mb-2 text-[#666666]" />
        <h3 className="text-sm font-semibold text-white mb-1">
          No Governance Baseline Configured
        </h3>
        <p className="text-xs max-w-md">
          Establish an immutable governance baseline snapshot to monitor architecture regressions, newly introduced violations, and expired exception waivers over time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white p-4 space-y-4 overflow-y-auto">
      {/* Drift Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-[#080808] border border-[#262626] rounded-md">
          <span className="text-[10px] font-mono uppercase text-[#858585] block">
            Baseline Reference
          </span>
          <span className="text-sm font-bold font-mono text-white">
            {drift.baselineId}
          </span>
          <span className="text-[10px] text-[#666666] block mt-0.5">
            vs Current: {drift.currentRevision}
          </span>
        </div>

        <div className="p-3 bg-[#080808] border border-[#262626] rounded-md">
          <span className="text-[10px] font-mono uppercase text-[#858585] block">
            Regressions Detected
          </span>
          <span
            className={`text-sm font-bold font-mono ${
              drift.hasRegressions ? "text-[#ef4444]" : "text-[#22c55e]"
            }`}
          >
            {drift.hasRegressions ? "YES (DEGRADATION)" : "NONE (CLEAN)"}
          </span>
          <span className="text-[10px] text-[#666666] block mt-0.5">
            {drift.totalNewViolations} new violations
          </span>
        </div>

        <div className="p-3 bg-[#080808] border border-[#262626] rounded-md">
          <span className="text-[10px] font-mono uppercase text-[#858585] block">
            Resolved Violations
          </span>
          <span className="text-sm font-bold font-mono text-[#22c55e]">
            {drift.totalResolvedViolations} Fixed
          </span>
          <span className="text-[10px] text-[#666666] block mt-0.5">
            Passing since baseline
          </span>
        </div>

        <div className="p-3 bg-[#080808] border border-[#262626] rounded-md">
          <span className="text-[10px] font-mono uppercase text-[#858585] block">
            Expired Waivers
          </span>
          <span
            className={`text-sm font-bold font-mono ${
              drift.totalExpiredExceptions > 0 ? "text-[#ef4444]" : "text-[#B5B5B5]"
            }`}
          >
            {drift.totalExpiredExceptions} Expired
          </span>
          <span className="text-[10px] text-[#666666] block mt-0.5">
            Require re-review
          </span>
        </div>
      </div>

      {/* Drift Items Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B5B5B5] flex items-center gap-2">
          <LayersIcon size={14} /> Detected Drift Differences ({drift.driftItems.length})
        </h3>

        {drift.driftItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#858585] bg-[#080808] border border-[#262626] rounded-md">
            Architecture aligns 100% with established baseline. Zero drift detected.
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A1A] border border-[#262626] rounded-md bg-[#080808] overflow-hidden">
            {drift.driftItems.map((item) => (
              <div key={item.id} className="p-3 flex items-start gap-3 hover:bg-[#0D0D0D] transition-colors">
                <div className="mt-0.5">
                  {item.driftType === "new_policy_violation" ? (
                    <AlertCircleIcon size={16} className="text-[#ef4444]" />
                  ) : item.driftType === "resolved_violation" ? (
                    <CheckCircleIcon size={16} className="text-[#22c55e]" />
                  ) : item.driftType === "expired_exception" ? (
                    <CalendarIcon size={16} className="text-[#ef4444]" />
                  ) : (
                    <CpuIcon size={16} className="text-[#B5B5B5]" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">
                        {item.policyId}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-[#858585] bg-[#141414] border border-[#202020] px-1.5 py-0.5 rounded-md">
                        {item.driftType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#858585]">
                      {item.detectedAt.split("T")[0]}
                    </span>
                  </div>

                  <p className="text-xs text-[#B5B5B5]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
