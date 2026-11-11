"use client";

import React from "react";
import type {
  ArchitectureReview,
  ApprovalEvaluationResult,
} from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, AlertCircleIcon, RefreshIcon } from "@nxtqr/icons";

interface ReviewHeaderProps {
  review: ArchitectureReview;
  approvalEval: ApprovalEvaluationResult;
  viewMode: "split" | "candidate" | "baseline";
  onViewModeChange: (mode: "split" | "candidate" | "baseline") => void;
  onOpenDecisionModal: () => void;
  onRunChecks: () => void;
  onApplyProposal: () => void;
  onRebaseProposal: () => void;
  isRunningChecks: boolean;
}

export function ReviewHeader({
  review,
  approvalEval,
  viewMode,
  onViewModeChange,
  onOpenDecisionModal,
  onRunChecks,
  onApplyProposal,
  onRebaseProposal,
  isRunningChecks,
}: ReviewHeaderProps) {
  const isApplied = review.status === "applied";
  const isStale = review.status === "stale";
  const isReadyToApply = approvalEval.isReadyToApply;

  const getStatusBadge = () => {
    switch (review.status) {
      case "approved":
      case "ready_to_apply":
        return { label: "APPROVED", border: "border-[#1F4028]", bg: "bg-[#0E2014]", text: "text-[#4ADE80]" };
      case "changes_requested":
        return { label: "CHANGES REQUESTED", border: "border-[#4D3319]", bg: "bg-[#261A0D]", text: "text-[#FB923C]" };
      case "applied":
        return { label: "APPLIED", border: "border-[#333333]", bg: "bg-[#141414]", text: "text-white" };
      case "stale":
        return { label: "STALE BASELINE", border: "border-[#4D1919]", bg: "bg-[#260D0D]", text: "text-[#F87171]" };
      case "closed":
        return { label: "CLOSED", border: "border-[#262626]", bg: "bg-[#0D0D0D]", text: "text-[#858585]" };
      case "open":
      default:
        return { label: "OPEN FOR REVIEW", border: "border-[#262626]", bg: "bg-[#141414]", text: "text-[#B5B5B5]" };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="h-14 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0 select-none">
      {/* Title & Metadata */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-mono tracking-wider text-[#858585]">Architecture Review</span>
          <span className="text-xs text-[#404040]">/</span>
          <span className="text-xs font-semibold text-white truncate max-w-[220px]">
            {review.title}
          </span>
        </div>

        <div className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${badge.border} ${badge.bg} ${badge.text}`}>
          {badge.label}
        </div>

        <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-[#858585] border-l border-[#262626] pl-3">
          <span>
            Rev: <strong className="text-white font-normal">v{review.currentRevisionNumber}</strong>
          </span>
          <span>
            Author: <strong className="text-[#B5B5B5] font-normal">{review.authorName}</strong>
          </span>
          <span>
            Baseline: <strong className="text-[#B5B5B5] font-normal">{review.baselineSnapshot.revision}</strong>
          </span>
        </div>
      </div>

      {/* View Mode Controls & Primary Actions */}
      <div className="flex items-center gap-3">
        {/* View Switcher */}
        <div className="flex items-center bg-[#0D0D0D] border border-[#262626] rounded-md p-0.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => onViewModeChange("split")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              viewMode === "split"
                ? "bg-[#1A1A1A] text-white font-medium"
                : "text-[#858585] hover:text-[#B5B5B5]"
            }`}
          >
            Split Diff
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("candidate")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              viewMode === "candidate"
                ? "bg-[#1A1A1A] text-white font-medium"
                : "text-[#858585] hover:text-[#B5B5B5]"
            }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("baseline")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              viewMode === "baseline"
                ? "bg-[#1A1A1A] text-white font-medium"
                : "text-[#858585] hover:text-[#B5B5B5]"
            }`}
          >
            Baseline
          </button>
        </div>

        {/* Run Checks */}
        <button
          type="button"
          onClick={onRunChecks}
          disabled={isRunningChecks || isApplied}
          className="flex items-center gap-1.5 py-1 px-3 rounded-md bg-[#141414] border border-[#262626] hover:border-[#404040] text-xs text-[#B5B5B5] hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshIcon size={14} className={isRunningChecks ? "animate-spin" : ""} />
          <span>{isRunningChecks ? "Running..." : "Run Checks"}</span>
        </button>

        {/* Rebase if stale */}
        {isStale && (
          <button
            type="button"
            onClick={onRebaseProposal}
            className="flex items-center gap-1.5 py-1 px-3 rounded-md bg-[#1C1212] border border-[#552222] hover:bg-[#2A1818] text-xs font-medium text-[#FF8888] transition-colors"
          >
            <AlertCircleIcon size={14} />
            <span>Rebase onto Live</span>
          </button>
        )}

        {/* Review & Decide Modal Trigger */}
        {!isApplied && (
          <button
            type="button"
            onClick={onOpenDecisionModal}
            className="flex items-center gap-1.5 py-1 px-3 rounded-md bg-[#141414] border border-[#262626] hover:border-[#404040] text-xs text-[#B5B5B5] hover:text-white transition-colors"
          >
            <span>Review & Decide</span>
          </button>
        )}

        {/* Apply Button */}
        {isApplied ? (
          <div className="flex items-center gap-1.5 py-1 px-3 rounded-md bg-[#0D0D0D] border border-[#262626] text-xs font-mono text-[#858585]">
            <CheckCircleIcon size={14} className="text-[#4ADE80]" />
            <span>Changes Applied</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onApplyProposal}
            disabled={!isReadyToApply}
            title={
              !isReadyToApply
                ? `Requires satisfied approvals and checks: ${approvalEval.violations.join("; ")}`
                : "Apply approved changes atomically to target architecture"
            }
            className={`flex items-center gap-1.5 py-1 px-4 rounded-md text-xs font-medium transition-colors ${
              isReadyToApply
                ? "bg-[#1A1A1A] border border-[#404040] hover:bg-[#262626] text-white cursor-pointer"
                : "bg-[#0D0D0D] border border-[#1A1A1A] text-[#555555] cursor-not-allowed"
            }`}
          >
            <span>Apply Changes</span>
          </button>
        )}
      </div>
    </header>
  );
}
