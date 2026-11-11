"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Regression Comparison & Impact Analysis Component
 */

import React from "react";
import type { RegressionAnalysisResult } from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon, CheckCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface RegressionComparisonViewProps {
  regressions?: RegressionAnalysisResult;
}

export function RegressionComparisonView({ regressions }: RegressionComparisonViewProps) {
  if (!regressions) {
    return (
      <div className="p-8 rounded-md bg-[#080808] border border-[#262626] text-center space-y-2">
        <CheckCircleIcon size={24} className="mx-auto text-[#22c55e]" />
        <h4 className="text-sm font-bold text-[#FFFFFF]">No Baseline Comparison Run</h4>
        <p className="text-xs text-[#858585] max-w-md mx-auto">
          Run candidate verification or pin an authoritative baseline to inspect regression diffs.
        </p>
      </div>
    );
  }

  const newFailures = regressions.regressions.filter((r) => r.type === "new_failure");
  const resolved = regressions.regressions.filter((r) => r.type === "resolved_failure");
  const newUnknowns = regressions.regressions.filter((r) => r.type === "new_unknown");

  return (
    <div className="space-y-6">
      {/* Regression Summary Banner */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">
            Baseline vs Candidate Regression Analysis
          </div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">
            {regressions.hasRegressions
              ? `${regressions.summary.newFailuresCount} Architectural Regression(s) Detected`
              : "Zero Regressions Detected"}
          </h3>
          <p className="text-xs text-[#858585] mt-1">
            Detects tests that passed in baseline but now fail, distinguishing architecture regressions from definition changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-center font-mono">
            <div className="text-[10px] text-[#858585] uppercase">New Failures</div>
            <div
              className={`text-lg font-bold ${
                newFailures.length > 0 ? "text-[#ef4444]" : "text-[#22c55e]"
              }`}
            >
              {newFailures.length}
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-center font-mono">
            <div className="text-[10px] text-[#858585] uppercase">Resolved</div>
            <div className="text-lg font-bold text-[#22c55e]">{resolved.length}</div>
          </div>

          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-center font-mono">
            <div className="text-[10px] text-[#858585] uppercase">New Unknowns</div>
            <div
              className={`text-lg font-bold ${
                newUnknowns.length > 0 ? "text-[#FFAA00]" : "text-[#858585]"
              }`}
            >
              {newUnknowns.length}
            </div>
          </div>
        </div>
      </div>

      {/* Regressions List */}
      <div className="space-y-3">
        {regressions.regressions.length === 0 ? (
          <div className="p-6 rounded-md bg-[#080808] border border-[#262626] text-center text-xs text-[#22c55e]">
            Candidate architecture matches baseline verification state. Zero regressions detected.
          </div>
        ) : (
          regressions.regressions.map((reg) => {
            const isCrit = reg.type === "new_failure";
            const isResolved = reg.type === "resolved_failure";

            return (
              <div
                key={reg.id}
                className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#FFFFFF]">{reg.testId}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#858585]">
                      {reg.classification}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isCrit
                        ? "bg-[#1f1010] text-[#ef4444] border border-[#4a1c1c]"
                        : isResolved
                          ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                          : "bg-[#1a1408] text-[#FFAA00] border border-[#423010]"
                    }`}
                  >
                    {isCrit && <AlertCircleIcon size={12} />}
                    {isResolved && <CheckCircleIcon size={12} />}
                    {!isCrit && !isResolved && <ShieldIcon size={12} />}
                    {reg.type.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#B5B5B5] leading-relaxed">{reg.description}</p>

                <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#666666]">
                  <span>
                    Baseline: {reg.baselineStatus?.toUpperCase() || "N/A"} → Candidate:{" "}
                    {reg.candidateStatus?.toUpperCase() || "N/A"}
                  </span>
                  <span>
                    Affected:{" "}
                    {reg.affectedComponentIds.length > 0
                      ? reg.affectedComponentIds.join(", ")
                      : "general"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

