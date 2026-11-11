"use client";

import React, { useState } from "react";
import type {
  ArchitectureReview,
  ReviewDecisionKind,
  ReviewerRole,
} from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, AlertCircleIcon, CloseIcon } from "@nxtqr/icons";

interface ReviewDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ArchitectureReview;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: ReviewerRole;
  onRecordDecision: (decision: ReviewDecisionKind, explanation?: string) => void;
}

export function ReviewDecisionModal({
  isOpen,
  onClose,
  review,
  currentUserId,
  currentUserName,
  currentUserRole,
  onRecordDecision,
}: ReviewDecisionModalProps) {
  const [decision, setDecision] = useState<ReviewDecisionKind>("approve");
  const [explanation, setExplanation] = useState("");

  if (!isOpen) return null;

  const isAuthor = review.authorId === currentUserId;
  const isSelfApprovalProhibited = isAuthor && !review.policy.allowSelfApproval;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === "approve" && isSelfApprovalProhibited) return;
    onRecordDecision(decision, explanation.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none">
      <div className="w-full max-w-lg bg-[#0D0D0D] border border-[#262626] rounded-md shadow-level-2 overflow-hidden">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-[#262626] flex items-center justify-between bg-[#080808]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#858585]">
              Submit Review
            </span>
            <span className="text-xs text-[#404040]">/</span>
            <span className="text-xs font-semibold text-white truncate max-w-[240px]">
              {review.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#858585] hover:text-white hover:bg-[#1A1A1A] transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Reviewer identity badge */}
          <div className="p-2.5 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[#858585]">Reviewing as: </span>
              <strong className="text-white font-medium">{currentUserName}</strong>
            </div>
            <span className="text-[#B5B5B5] px-1.5 py-0.5 rounded-md bg-[#0D0D0D] border border-[#262626]">
              {currentUserRole}
            </span>
          </div>

          {/* Self-approval Warning if applicable */}
          {isSelfApprovalProhibited && (
            <div className="p-2.5 rounded-md bg-[#260D0D] border border-[#4D1919] flex items-start gap-2 text-xs font-mono text-[#F87171]">
              <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                You are the author of this proposal. The repository policy prohibits self-approval.
                You may submit feedback comments or request changes.
              </span>
            </div>
          )}

          {/* Decision options */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-mono tracking-wider text-[#858585]">
              Review Decision
            </label>
            <div className="grid grid-cols-1 gap-2">
              {/* Approve */}
              <label
                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  decision === "approve"
                    ? "bg-[#0E2014] border-[#1F4028]"
                    : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#262626]"
                } ${isSelfApprovalProhibited ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="review-decision"
                  value="approve"
                  checked={decision === "approve"}
                  disabled={isSelfApprovalProhibited}
                  onChange={() => setDecision("approve")}
                  className="mt-0.5 rounded-full border-[#333333] text-white focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
                    <span>Approve Proposal</span>
                  </div>
                  <div className="text-[#858585] mt-0.5">
                    Submit approval and advance candidate towards ready-to-apply state.
                  </div>
                </div>
              </label>

              {/* Request Changes */}
              <label
                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  decision === "request_changes"
                    ? "bg-[#260D0D] border-[#4D1919]"
                    : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#262626]"
                }`}
              >
                <input
                  type="radio"
                  name="review-decision"
                  value="request_changes"
                  checked={decision === "request_changes"}
                  onChange={() => setDecision("request_changes")}
                  className="mt-0.5 rounded-full border-[#333333] text-white focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <AlertCircleIcon className="w-3.5 h-3.5 text-[#F87171]" />
                    <span>Request Changes</span>
                  </div>
                  <div className="text-[#858585] mt-0.5">
                    Block proposal application until requested architecture revisions are made.
                  </div>
                </div>
              </label>

              {/* Comment */}
              <label
                className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  decision === "comment"
                    ? "bg-[#141414] border-[#404040]"
                    : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#262626]"
                }`}
              >
                <input
                  type="radio"
                  name="review-decision"
                  value="comment"
                  checked={decision === "comment"}
                  onChange={() => setDecision("comment")}
                  className="mt-0.5 rounded-full border-[#333333] text-white focus:ring-0"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">General Review Feedback</div>
                  <div className="text-[#858585] mt-0.5">
                    Submit general architectural suggestions without explicit approval or blocking.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Rationale / Explanation */}
          <div className="space-y-1.5">
            <label className="text-xs uppercase font-mono tracking-wider text-[#858585]">
              Review Rationale (Optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide evidence, benchmark context, or verification notes..."
              rows={3}
              className="w-full bg-black border border-[#262626] rounded-md p-2.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#404040] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1A1A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-[#858585] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={decision === "approve" && isSelfApprovalProhibited}
              className="px-4 py-1.5 rounded-md text-xs font-mono font-semibold bg-white hover:bg-[#E5E5E5] text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Submit Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
