"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Requirement-to-Test Traceability Matrix Component
 */

import React from "react";
import type { TraceabilityItem } from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface TraceabilityMatrixViewProps {
  traceability: TraceabilityItem[];
}

export function TraceabilityMatrixView({ traceability }: TraceabilityMatrixViewProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">Traceability Assurance</div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">Bidirectional Requirement Traceability</h3>
          <p className="text-xs text-[#858585] mt-1">
            Validates that declared architecture requirements map directly to automated tests, evidence, and passing verification results.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-md bg-[#080808] border border-[#262626]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#202020] text-[#858585] font-mono">
                <th className="pb-2 font-medium">Requirement ID</th>
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Criticality</th>
                <th className="pb-2 font-medium">Linked Tests</th>
                <th className="pb-2 font-medium">Covered Nodes</th>
                <th className="pb-2 font-medium">Evidence Count</th>
                <th className="pb-2 font-medium text-right">Latest Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A] text-[#B5B5B5]">
              {traceability.map((item) => {
                const isPass = item.latestStatus === "pass";
                const isFail = item.latestStatus === "fail";
                const isUnknown = item.latestStatus === "unknown";

                return (
                  <tr key={item.requirementId} className="hover:bg-[#0D0D0D]">
                    <td className="py-2.5 font-mono text-[#FFFFFF] font-bold">{item.requirementId}</td>
                    <td className="py-2.5 font-semibold text-[#FFFFFF]">{item.requirementTitle}</td>
                    <td className="py-2.5 font-mono">
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                        {item.criticality.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[#858585]">
                      {item.linkedTestIds.length > 0 ? item.linkedTestIds.join(", ") : "None"}
                    </td>
                    <td className="py-2.5 font-mono">{item.coveredComponentsCount}</td>
                    <td className="py-2.5 font-mono">{item.evidenceAttachedCount}</td>
                    <td className="py-2.5 text-right font-mono">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
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
                        {item.latestStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

