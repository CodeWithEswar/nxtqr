"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Compatibility Diff View Component
 */

import React from "react";
import type {
  SemanticContractDiff,
  ContractRevision,
  APIContract,
  CompatibilityFinding,
} from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, RefreshIcon } from "@nxtqr/icons";

interface CompatibilityDiffViewProps {
  contract: APIContract;
  activeRevision: ContractRevision | null;
  candidateRevision: ContractRevision | null;
  diffCandidateRevisionId: string | null;
  diff: SemanticContractDiff | null;
  onSelectCandidateRevision: (revId: string) => void;
  onOpenAddRevisionModal?: () => void;
}

export function CompatibilityDiffView({
  contract,
  activeRevision,
  candidateRevision,
  diffCandidateRevisionId,
  diff,
  onSelectCandidateRevision,
  onOpenAddRevisionModal: _onOpenAddRevisionModal,
}: CompatibilityDiffViewProps) {
  const revisions = contract.revisions || [];
  const otherRevisions = revisions.filter((r) => r.id !== activeRevision?.id);

  const breakingCount = diff?.findings.filter((f) => f.classification === "breaking").length || 0;
  const potentiallyCount = diff?.findings.filter((f) => f.classification === "potentially_breaking").length || 0;
  const additiveCount = diff?.findings.filter((f) => f.classification === "non_breaking" || f.classification === "informational").length || 0;

  const getClassificationBadge = (classification: CompatibilityFinding["classification"]) => {
    switch (classification) {
      case "breaking":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#1F1414] text-[#FFFFFF] border border-[#404040]">
            BREAKING
          </span>
        );
      case "potentially_breaking":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#1A1A14] text-[#B5B5B5] border border-[#333333]">
            POTENTIALLY BREAKING
          </span>
        );
      case "non_breaking":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-[#141A14] text-[#B5B5B5] border border-[#262626]">
            NON BREAKING
          </span>
        );
      case "informational":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
            INFO
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
            {classification}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] overflow-hidden select-none">
      {/* Diff Header & Selectors */}
      <div className="p-4 border-b border-[#262626] bg-[#080808] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#858585] uppercase tracking-wider font-semibold">Baseline:</span>
            <div className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-[#141414] text-[#FFFFFF] border border-[#333333]">
              v{activeRevision?.versionLabel || "1.0.0"}
            </div>
          </div>

          <span className="text-[#666666] font-mono">→</span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#858585] uppercase tracking-wider font-semibold">Candidate:</span>
            <select
              value={diffCandidateRevisionId || ""}
              onChange={(e) => onSelectCandidateRevision(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono bg-[#141414] text-[#FFFFFF] border border-[#333333] rounded-md focus:outline-none focus:border-[#404040]"
            >
              {otherRevisions.length === 0 ? (
                <option value="">No other revisions available</option>
              ) : (
                otherRevisions.map((r) => (
                  <option key={r.id} value={r.id}>
                    v{r.versionLabel}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Diff Metrics Bar */}
        {diff && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
              <span className="text-[#858585]">Breaking:</span>
              <span className="font-mono font-bold text-[#FFFFFF]">{breakingCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
              <span className="text-[#858585]">Potentially:</span>
              <span className="font-mono text-[#B5B5B5]">{potentiallyCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
              <span className="text-[#858585]">Additive:</span>
              <span className="font-mono text-[#858585]">{additiveCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Diff Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!diff ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-[#858585] p-6">
            <RefreshIcon className="w-8 h-8 mb-2 text-[#404040]" />
            <p className="text-sm font-medium text-[#FFFFFF] mb-1">No candidate revision selected</p>
            <p className="text-xs max-w-sm">
              Select another revision above or import a proposed candidate spec to run semantic compatibility analysis.
            </p>
          </div>
        ) : diff.findings.length === 0 ? (
          <div className="p-6 rounded-md bg-[#0D0D0D] border border-[#262626] text-center space-y-2">
            <CheckCircleIcon className="w-8 h-8 text-[#FFFFFF] mx-auto mb-1" />
            <h4 className="text-sm font-semibold text-[#FFFFFF]">Fully Backward Compatible</h4>
            <p className="text-xs text-[#858585] max-w-md mx-auto">
              No breaking or potentially breaking changes detected between revision v{activeRevision?.versionLabel} and candidate v{candidateRevision?.versionLabel}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
                Compatibility Findings ({diff.findings.length})
              </h4>
              <span className="text-[11px] text-[#666666]">
                Comparing {activeRevision?.operations?.length || 0} vs {candidateRevision?.operations?.length || 0} operations
              </span>
            </div>

            <div className="space-y-2.5">
              {diff.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-3.5 rounded-md bg-[#080808] border border-[#262626] hover:border-[#333333] transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getClassificationBadge(finding.classification)}
                      <span className="text-xs font-mono font-medium text-[#FFFFFF]">
                        {finding.ruleId}
                      </span>
                    </div>
                    {finding.affectedOperationIds.length > 0 && (
                      <span className="text-[10px] font-mono text-[#858585]">
                        Ops: {finding.affectedOperationIds.join(", ")}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#B5B5B5] leading-relaxed">
                    {finding.explanation}
                  </p>

                  {/* Evidence snippets */}
                  {finding.evidence && finding.evidence.length > 0 && (
                    <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-[#666666] block font-semibold">
                        Evidence
                      </span>
                      {finding.evidence.map((ev, idx) => (
                        <div key={idx} className="text-[10px] font-mono text-[#858585]">
                          • {ev}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remediation */}
                  {finding.remediation && (
                    <div className="flex items-start gap-1.5 pt-1 text-[11px] text-[#FFFFFF]">
                      <span className="text-[#858585] shrink-0 font-medium">Remediation:</span>
                      <span className="leading-tight text-[#B5B5B5]">{finding.remediation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

