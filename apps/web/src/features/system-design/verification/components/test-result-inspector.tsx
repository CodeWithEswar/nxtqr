"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Four-State Test Result Inspector Component
 */

import React, { useState } from "react";
import type { VerificationResult, ArchitectureTest } from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface TestResultInspectorProps {
  results: VerificationResult[];
  tests: ArchitectureTest[];
  selectedTestId: string;
  onSelectTest: (testId: string) => void;
}

export function TestResultInspector({
  results,
  tests,
  selectedTestId,
  onSelectTest,
}: TestResultInspectorProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredResults = results.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between p-3.5 rounded-md bg-[#080808] border border-[#262626]">
        <div className="flex items-center gap-2">
          {["all", "pass", "fail", "unknown", "not_applicable"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                filterStatus === status
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "bg-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              {status.replace("_", " ").toUpperCase()} (
              {status === "all" ? results.length : results.filter((r) => r.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-2.5">
        {filteredResults.map((res) => {
          const testDef = tests.find((t) => t.id === res.testId);
          const isSelected = res.testId === selectedTestId;
          const isPass = res.status === "pass";
          const isFail = res.status === "fail";
          const isUnknown = res.status === "unknown";

          return (
            <button
              key={res.id}
              onClick={() => onSelectTest(res.testId)}
              className={`w-full p-4 rounded-md text-left transition-all border space-y-2 ${
                isSelected
                  ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                  : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#FFFFFF]">{res.testId}</span>
                  <span className="text-xs text-[#858585]">{testDef?.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isPass
                        ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                        : isFail
                          ? "bg-[#1f1010] text-[#ef4444] border border-[#4a1c1c]"
                          : isUnknown
                            ? "bg-[#1a1408] text-[#FFAA00] border border-[#423010]"
                            : "bg-[#141414] text-[#858585] border border-[#262626]"
                    }`}
                  >
                    {isPass && <CheckCircleIcon size={12} />}
                    {isFail && <AlertCircleIcon size={12} />}
                    {isUnknown && <ShieldIcon size={12} />}
                    {res.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#B5B5B5] leading-relaxed pl-1">{res.explanation}</p>

              <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#666666]">
                <span>
                  Components:{" "}
                  {res.affectedComponentIds.length > 0
                    ? res.affectedComponentIds.join(", ")
                    : "graph-level"}
                </span>
                <span>
                  {res.evidenceIds.length > 0
                    ? `${res.evidenceIds.length} evidence verified`
                    : "no evidence required"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

