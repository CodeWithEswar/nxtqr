"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Test Execution Panel & Four-State Metrics Summary
 */

import React from "react";
import type { VerificationRunSummary } from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, AlertCircleIcon, PlayIcon } from "@nxtqr/icons";

interface TestExecutionPanelProps {
  summary: VerificationRunSummary;
  evaluatorVersion: string;
  onRerun: () => void;
}

export function TestExecutionPanel({
  summary,
  evaluatorVersion,
  onRerun,
}: TestExecutionPanelProps) {
  return (
    <div className="p-5 rounded-md bg-[#080808] border border-[#262626] space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">
            Deterministic Test Runner · v{evaluatorVersion}
          </div>
          <h2 className="text-xl font-bold text-[#FFFFFF] mt-0.5">Architecture Verification Run</h2>
          <p className="text-xs text-[#858585] mt-1">
            Evaluates declared architecture graph, contracts, and evidence with execution isolation and result caching.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRerun}
            className="px-3.5 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-[#262626] border border-[#404040] text-xs font-semibold text-[#FFFFFF] flex items-center gap-2 transition-all shadow-level-1"
          >
            <PlayIcon size={14} className="text-[#22c55e]" />
            Re-run Verification
          </button>
        </div>
      </div>

      {/* 4-State Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1 text-center">
          <div className="text-[10px] font-mono uppercase text-[#858585]">Pass Rate</div>
          <div
            className={`text-2xl font-mono font-bold ${
              summary.passRatePercent >= 80 ? "text-[#22c55e]" : "text-[#FFAA00]"
            }`}
          >
            {summary.passRatePercent}%
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1 text-center">
          <div className="text-[10px] font-mono uppercase text-[#858585] flex items-center justify-center gap-1">
            <CheckCircleIcon size={11} className="text-[#22c55e]" />
            Passed
          </div>
          <div className="text-2xl font-mono font-bold text-[#22c55e]">{summary.passed}</div>
        </div>

        <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1 text-center">
          <div className="text-[10px] font-mono uppercase text-[#858585] flex items-center justify-center gap-1">
            <AlertCircleIcon size={11} className="text-[#ef4444]" />
            Failed
          </div>
          <div
            className={`text-2xl font-mono font-bold ${
              summary.failed > 0 ? "text-[#ef4444]" : "text-[#858585]"
            }`}
          >
            {summary.failed}
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1 text-center">
          <div className="text-[10px] font-mono uppercase text-[#858585]">Unknown</div>
          <div
            className={`text-2xl font-mono font-bold ${
              summary.unknown > 0 ? "text-[#FFAA00]" : "text-[#858585]"
            }`}
          >
            {summary.unknown}
          </div>
        </div>

        <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1 text-center">
          <div className="text-[10px] font-mono uppercase text-[#858585]">Skipped / N/A</div>
          <div className="text-2xl font-mono font-bold text-[#858585]">{summary.notApplicable}</div>
        </div>
      </div>
    </div>
  );
}

