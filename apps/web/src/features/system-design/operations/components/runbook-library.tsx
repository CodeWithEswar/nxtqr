"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Runbook Library & Coverage Matrix Component
 */

import React from "react";
import type { OperationalRunbook, RunbookCoverageItem } from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface RunbookLibraryProps {
  runbooks: OperationalRunbook[];
  selectedRunbookId: string;
  onSelectRunbook: (runbookId: string) => void;
  coverageItems: RunbookCoverageItem[];
  tier1CoveragePercent: number;
}

export function RunbookLibrary({
  runbooks,
  selectedRunbookId,
  onSelectRunbook,
  coverageItems,
  tier1CoveragePercent,
}: RunbookLibraryProps) {
  const selectedRunbook = runbooks.find((r) => r.id === selectedRunbookId) || runbooks[0];

  return (
    <div className="space-y-6">
      {/* Coverage Banner */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">Operational Readiness Standard</div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">Tier 1 Mission-Critical Runbook Coverage</h3>
          <p className="text-xs text-[#858585] mt-1">
            Every mission-critical workload must maintain a human-reviewed, approved runbook with actionable rollback procedures.
          </p>
        </div>

        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] text-center shrink-0">
          <div className="text-[10px] font-mono uppercase text-[#858585]">Tier 1 Coverage</div>
          <div
            className={`text-2xl font-mono font-bold mt-0.5 ${
              tier1CoveragePercent >= 80 ? "text-[#22c55e]" : "text-[#FFAA00]"
            }`}
          >
            {tier1CoveragePercent}%
          </div>
        </div>
      </div>

      {/* Main 2-Pane: Runbook Catalog & Selected Runbook Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Runbook List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
            Operational Runbooks ({runbooks.length})
          </div>

          <div className="space-y-2">
            {runbooks.map((rb) => {
              const isSelected = rb.id === selectedRunbookId;
              return (
                <button
                  key={rb.id}
                  onClick={() => onSelectRunbook(rb.id)}
                  className={`w-full p-3.5 text-left rounded-md transition-all border space-y-1.5 ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                      : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#858585]">{rb.id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        rb.isApproved
                          ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                          : "bg-[#1a1408] text-[#FFAA00] border border-[#3b2a14]"
                      }`}
                    >
                      {rb.isApproved ? "APPROVED" : "DRAFT"}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-[#FFFFFF] leading-snug">{rb.title}</h4>
                  <p className="text-xs text-[#858585] line-clamp-1">{rb.purpose}</p>

                  <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] text-[#858585] font-mono">
                    <span>{rb.steps.length} steps</span>
                    <span>v{rb.revision}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Component Coverage Matrix Table */}
          <div className="p-3.5 rounded-md bg-[#080808] border border-[#262626] space-y-2 mt-4">
            <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
              Asset Coverage Matrix
            </div>
            <div className="divide-y divide-[#1A1A1A] text-xs">
              {coverageItems.map((item) => (
                <div key={item.componentId} className="py-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-[#FFFFFF]">{item.componentName}</div>
                    <div className="text-[10px] font-mono text-[#858585]">{item.componentId}</div>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      item.hasRunbook
                        ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                        : "bg-[#1f1010] text-[#ef4444] border border-[#401818]"
                    }`}
                  >
                    {item.coverageStatus.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Runbook Details */}
        {selectedRunbook && (
          <div className="lg:col-span-2 rounded-md bg-[#080808] border border-[#262626] p-5 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#262626]">
              <div>
                <div className="text-xs uppercase font-mono text-[#858585]">
                  {selectedRunbook.id} · v{selectedRunbook.revision}
                </div>
                <h3 className="text-lg font-bold text-[#FFFFFF] mt-0.5">{selectedRunbook.title}</h3>
                <p className="text-xs text-[#B5B5B5] mt-1">{selectedRunbook.purpose}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#B5B5B5]">
                  Owner: {selectedRunbook.owner}
                </span>
              </div>
            </div>

            {/* Safety Warnings & Rollback Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-md bg-[#140c0c] border border-[#381616] space-y-1.5">
                <div className="font-semibold text-[#ef4444] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircleIcon size={14} />
                  Safety Warnings & Constraints
                </div>
                <ul className="space-y-1 text-[#fca5a5] list-disc list-inside text-[11px] leading-relaxed">
                  {selectedRunbook.safetyWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1.5">
                <div className="font-semibold text-[#22c55e] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldIcon size={14} />
                  Rollback & Reversal Guidance
                </div>
                <p className="text-[#B5B5B5] leading-relaxed text-[11px]">
                  {selectedRunbook.rollbackGuidance}
                </p>
              </div>
            </div>

            {/* Step-by-Step Response Sequence */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
                Execution Steps Sequence ({selectedRunbook.steps.length})
              </div>

              <div className="space-y-2.5">
                {selectedRunbook.steps.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center font-mono text-[10px] text-[#FFFFFF]">
                          {st.stepNumber}
                        </span>
                        <span className="text-sm font-semibold text-[#FFFFFF]">{st.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#858585]">
                          {st.type}
                        </span>
                        {st.isDestructive && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#1f1010] border border-[#401818] text-[#ef4444]">
                            DESTRUCTIVE
                          </span>
                        )}
                        {st.requiresApproval && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#333333] text-[#FFAA00]">
                            APPROVAL REQ
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#B5B5B5] leading-relaxed pl-7">{st.details}</p>

                    {st.verificationGate && (
                      <div className="ml-7 p-2 rounded-md bg-[#141414] border border-[#262626] text-[11px] font-mono text-[#22c55e] flex items-center gap-1.5">
                        <CheckCircleIcon size={12} />
                        Gate: {st.verificationGate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
