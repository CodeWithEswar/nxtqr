"use client";

import React, { useState } from "react";
import type {
  ArchitectureReview,
  ApprovalEvaluationResult,
  ReviewCommentAnchor,
  ReviewerRole,
} from "@nxtqr/architecture-intelligence";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
} from "@nxtqr/icons";

interface ReviewDiscussionsProps {
  review: ArchitectureReview;
  approvalEval: ApprovalEvaluationResult;
  activeTab: "discussions" | "checks" | "approvals";
  onTabChange: (tab: "discussions" | "checks" | "approvals") => void;
  activeAnchor: ReviewCommentAnchor | null;
  onClearAnchor: () => void;
  onAddThread: (anchor: ReviewCommentAnchor, content: string, isBlocking: boolean) => void;
  onAddReply: (threadId: string, content: string) => void;
  onResolveThread: (threadId: string) => void;
  onReopenThread: (threadId: string) => void;
  onRunChecks: () => void;
  onOpenDecisionModal: () => void;
  isRunningChecks: boolean;
  currentUserRole?: ReviewerRole;
}

export function ReviewDiscussions({
  review,
  approvalEval,
  activeTab,
  onTabChange,
  activeAnchor,
  onClearAnchor,
  onAddThread,
  onAddReply,
  onResolveThread,
  onReopenThread,
  onRunChecks,
  onOpenDecisionModal,
  isRunningChecks,
}: ReviewDiscussionsProps) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const filteredThreads = review.threads.filter((t) => {
    if (filter === "open") return t.status === "open";
    if (filter === "resolved") return t.status === "resolved";
    return true;
  });

  const unresolvedCount = review.threads.filter((t) => t.status === "open").length;
  const failingChecksCount = review.checks.filter((c) => c.status === "failed").length;

  const handlePostThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadContent.trim()) return;

    const anchor: ReviewCommentAnchor = activeAnchor || { type: "general" };
    onAddThread(anchor, newThreadContent.trim(), isBlocking);
    setNewThreadContent("");
    setIsBlocking(false);
  };

  const handlePostReply = (threadId: string) => {
    const text = replyInputs[threadId]?.trim();
    if (!text) return;

    onAddReply(threadId, text);
    setReplyInputs((prev) => ({ ...prev, [threadId]: "" }));
  };

  const getAnchorDescription = (anchor: ReviewCommentAnchor): string => {
    switch (anchor.type) {
      case "node":
        return anchor.nodeLabel || anchor.nodeId;
      case "edge":
        return `Edge ${anchor.edgeId}`;
      case "field":
        return `Field ${anchor.nodeId}.${anchor.fieldPath}`;
      case "finding":
        return `Finding ${anchor.findingId}`;
      case "diff":
        return `Change ${anchor.changeId}`;
      case "general":
      default:
        return "General Review Discussion";
    }
  };

  return (
    <aside className="w-96 border-l border-[#262626] bg-[#080808] flex flex-col h-full overflow-hidden select-none">
      {/* 1. Header Tabs */}
      <div className="h-11 border-b border-[#262626] bg-[#080808] flex items-center px-2 shrink-0">
        <div className="flex w-full bg-[#0D0D0D] border border-[#262626] rounded-md p-0.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => onTabChange("discussions")}
            className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "discussions"
                ? "bg-[#1A1A1A] text-white font-medium"
                : "text-[#858585] hover:text-[#B5B5B5]"
            }`}
          >
            <span>Discussions</span>
            {unresolvedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-[#261A0D] border border-[#4D3319] text-[#FB923C] text-[10px]">
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("checks")}
            className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "checks"
                ? "bg-[#1A1A1A] text-white font-medium"
                : "text-[#858585] hover:text-[#B5B5B5]"
            }`}
          >
            <span>Checks</span>
            {failingChecksCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-md bg-[#260D0D] border border-[#4D1919] text-[#F87171] text-[10px]">
                {failingChecksCount}
              </span>
            ) : (
              <span className="text-[#4ADE80] text-[10px]">✓</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("approvals")}
            className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "approvals"
                ? "bg-[#1A1A1A] text-white font-medium"
                : "text-[#858585] hover:text-[#B5B5B5]"
            }`}
          >
            <span>Policy</span>
            {approvalEval.isApproved ? (
              <span className="text-[#4ADE80] text-[10px]">✓</span>
            ) : (
              <span className="text-[#FB923C] text-[10px]">!</span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Tab Contents */}
      <div className="flex-1 overflow-y-auto">
        {/* TAB 1: DISCUSSIONS */}
        {activeTab === "discussions" && (
          <div className="p-3 space-y-3">
            {/* Filter pills */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#858585] uppercase tracking-wider text-[10px]">
                Threads ({review.threads.length})
              </span>
              <div className="flex items-center gap-1 bg-[#0D0D0D] border border-[#262626] rounded-md p-0.5">
                {(["all", "open", "resolved"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilter(mode)}
                    className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
                      filter === mode
                        ? "bg-[#1A1A1A] text-white"
                        : "text-[#858585] hover:text-[#B5B5B5]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Anchor Banner (if selected) */}
            {activeAnchor && (
              <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#333333] flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <div className="text-[10px] uppercase font-mono text-[#4ADE80]">
                    Commenting on {activeAnchor.type}
                  </div>
                  <div className="text-xs text-white truncate font-medium">
                    {getAnchorDescription(activeAnchor)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClearAnchor}
                  className="text-[10px] font-mono text-[#858585] hover:text-white px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626]"
                >
                  Clear
                </button>
              </div>
            )}

            {/* New Thread Form */}
            <form
              onSubmit={handlePostThread}
              className="p-3 rounded-md bg-[#0D0D0D] border border-[#262626] space-y-2"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#858585]">
                {activeAnchor ? "New Contextual Comment" : "New Architecture Discussion"}
              </div>
              <textarea
                value={newThreadContent}
                onChange={(e) => setNewThreadContent(e.target.value)}
                placeholder="Ask questions, suggest alternatives, or highlight architectural trade-offs..."
                rows={3}
                className="w-full bg-black border border-[#262626] rounded-md p-2 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#404040] font-sans resize-none"
              />
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-[11px] text-[#B5B5B5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBlocking}
                    onChange={(e) => setIsBlocking(e.target.checked)}
                    className="rounded-md border-[#333333] bg-black text-white focus:ring-0"
                  />
                  <span>Blocking issue</span>
                </label>
                <button
                  type="submit"
                  disabled={!newThreadContent.trim()}
                  className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </form>

            {/* Threads List */}
            <div className="space-y-3">
              {filteredThreads.length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-[#858585] rounded-md border border-[#1A1A1A] bg-[#0D0D0D]">
                  No {filter !== "all" ? filter : ""} discussion threads yet.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isThreadResolved = thread.status === "resolved";
                  const replyText = replyInputs[thread.id] || "";
                  const allComments = [thread.rootComment, ...thread.replies];

                  return (
                    <div
                      key={thread.id}
                      className={`p-3 rounded-md border space-y-2.5 transition-colors ${
                        isThreadResolved
                          ? "bg-[#0A0A0A] border-[#1A1A1A] opacity-75"
                          : thread.isBlocking
                          ? "bg-[#140D0D] border-[#4D1919]"
                          : "bg-[#0D0D0D] border-[#262626]"
                      }`}
                    >
                      {/* Thread Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[9px] font-mono uppercase text-[#B5B5B5]">
                            {getAnchorDescription(thread.anchor)}
                          </span>
                          {thread.isBlocking && (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#260D0D] border border-[#4D1919] text-[9px] font-mono text-[#F87171] font-semibold">
                              Blocking
                            </span>
                          )}
                        </div>

                        {/* Resolve / Reopen toggle */}
                        {isThreadResolved ? (
                          <button
                            type="button"
                            onClick={() => onReopenThread(thread.id)}
                            className="text-[10px] font-mono text-[#858585] hover:text-white px-2 py-0.5 rounded-md border border-[#262626] hover:border-[#333333] bg-[#141414]"
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onResolveThread(thread.id)}
                            className="text-[10px] font-mono text-[#4ADE80] hover:text-[#86EFAC] px-2 py-0.5 rounded-md border border-[#1F4028] bg-[#0E2014]"
                          >
                            Resolve
                          </button>
                        )}
                      </div>

                      {/* Comments inside Thread */}
                      <div className="space-y-2 pt-1">
                        {allComments.map((c) => (
                          <div key={c.id} className="text-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#858585]">
                              <span className="font-semibold text-white">{c.authorName}</span>
                              <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-[#B5B5B5] leading-relaxed break-words font-sans">
                              {c.content}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Reply Box (only if open) */}
                      {!isThreadResolved && (
                        <div className="pt-2 border-t border-[#1A1A1A] flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) =>
                              setReplyInputs((prev) => ({ ...prev, [thread.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handlePostReply(thread.id);
                              }
                            }}
                            placeholder="Reply to thread..."
                            className="flex-1 bg-black border border-[#262626] rounded-md px-2 py-1 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#404040]"
                          />
                          <button
                            type="button"
                            onClick={() => handlePostReply(thread.id)}
                            disabled={!replyText.trim()}
                            className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Reply
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AUTOMATED CHECKS */}
        {activeTab === "checks" && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#858585]">
                Candidate Verification ({review.checks.length})
              </span>
              <button
                type="button"
                onClick={onRunChecks}
                disabled={isRunningChecks}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] text-white disabled:opacity-50 transition-colors"
              >
                <RefreshIcon className={`w-3 h-3 ${isRunningChecks ? "animate-spin" : ""}`} />
                <span>{isRunningChecks ? "Running..." : "Re-run Checks"}</span>
              </button>
            </div>

            <div className="space-y-2">
              {review.checks.map((chk) => {
                const isPassed = chk.status === "passed";
                const isWarning = chk.status === "warning";
                const isFailed = chk.status === "failed";

                return (
                  <div
                    key={chk.id}
                    className={`p-3 rounded-md border space-y-1.5 ${
                      isPassed
                        ? "bg-[#0E2014] border-[#1F4028]"
                        : isWarning
                        ? "bg-[#261A0D] border-[#4D3319]"
                        : isFailed
                        ? "bg-[#260D0D] border-[#4D1919]"
                        : "bg-[#0D0D0D] border-[#262626]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPassed && <CheckCircleIcon className="w-3.5 h-3.5 text-[#4ADE80]" />}
                        {isWarning && <AlertCircleIcon className="w-3.5 h-3.5 text-[#FB923C]" />}
                        {isFailed && <AlertCircleIcon className="w-3.5 h-3.5 text-[#F87171]" />}
                        <span className="text-xs font-semibold text-white">{chk.name}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md font-bold ${
                          isPassed
                            ? "text-[#4ADE80] bg-[#0A160E] border border-[#1F4028]"
                            : isWarning
                            ? "text-[#FB923C] bg-[#1C130A] border border-[#4D3319]"
                            : "text-[#F87171] bg-[#1C0A0A] border border-[#4D1919]"
                        }`}
                      >
                        {chk.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#B5B5B5]">{chk.message}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: APPROVALS & POLICY */}
        {activeTab === "approvals" && (
          <div className="p-3 space-y-4">
            {/* Approval Evaluation Summary */}
            <div
              className={`p-3 rounded-md border space-y-2 ${
                approvalEval.isApproved
                  ? "bg-[#0E2014] border-[#1F4028]"
                  : "bg-[#141414] border-[#262626]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider font-semibold text-white">
                  Approval Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                    approvalEval.isApproved
                      ? "text-[#4ADE80] bg-[#0A160E] border border-[#1F4028]"
                      : "text-[#FB923C] bg-[#1C130A] border border-[#4D3319]"
                  }`}
                >
                  {approvalEval.isApproved ? "Approved" : "Pending Requirements"}
                </span>
              </div>

              <div className="text-xs font-mono space-y-1 pt-1 text-[#B5B5B5]">
                <div className="flex justify-between">
                  <span>Approvals Count:</span>
                  <strong className="text-white">
                    {approvalEval.totalApprovals} / {review.policy.minApprovals}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Self-Approval:</span>
                  <span className="text-[#858585]">
                    {review.policy.allowSelfApproval ? "Allowed" : "Prohibited"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Blocking Checks:</span>
                  <span className={approvalEval.blockingChecks.length === 0 ? "text-[#4ADE80]" : "text-[#F87171]"}>
                    {approvalEval.blockingChecks.length === 0 ? "None (Passed)" : `${approvalEval.blockingChecks.length} Failing`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Unresolved Threads:</span>
                  <span className={approvalEval.unresolvedThreadsCount === 0 ? "text-[#4ADE80]" : "text-[#F87171]"}>
                    {approvalEval.unresolvedThreadsCount === 0 ? "None (All Resolved)" : `${approvalEval.unresolvedThreadsCount} Pending`}
                  </span>
                </div>
              </div>

              {approvalEval.violations.length > 0 && (
                <div className="pt-2 border-t border-[#1A1A1A] space-y-1">
                  <div className="text-[10px] uppercase font-mono text-[#FB923C]">
                    Violations / Pending Requirements:
                  </div>
                  {approvalEval.violations.map((violation, i) => (
                    <div key={i} className="text-[11px] font-mono text-[#F87171] flex items-start gap-1">
                      <span>✕</span>
                      <span>{violation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decision History */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#858585]">
                  Decisions ({review.decisions.length})
                </span>
                <button
                  type="button"
                  onClick={onOpenDecisionModal}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-white hover:bg-[#E5E5E5] text-black font-semibold transition-colors"
                >
                  Record Decision
                </button>
              </div>

              {review.decisions.length === 0 ? (
                <div className="p-3 text-center text-xs font-mono text-[#858585] rounded-md border border-[#1A1A1A] bg-[#0D0D0D]">
                  No formal decisions recorded yet.
                </div>
              ) : (
                review.decisions.map((dec) => {
                  const isApprove = dec.decision === "approve";
                  const isRequestChanges = dec.decision === "request_changes";

                  return (
                    <div
                      key={dec.id}
                      className={`p-2.5 rounded-md border text-xs space-y-1 ${
                        isApprove
                          ? "bg-[#0E2014] border-[#1F4028]"
                          : isRequestChanges
                          ? "bg-[#260D0D] border-[#4D1919]"
                          : "bg-[#0D0D0D] border-[#262626]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{dec.reviewerName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono uppercase font-bold ${
                            isApprove
                              ? "text-[#4ADE80]"
                              : isRequestChanges
                              ? "text-[#F87171]"
                              : "text-[#B5B5B5]"
                          }`}
                        >
                          {dec.decision.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[#858585]">
                        Role: {dec.reviewerRole} • Rev v{dec.revisionNumber} • {new Date(dec.createdAt).toLocaleDateString()}
                      </div>
                      {dec.explanation && (
                        <p className="text-[#B5B5B5] pt-1 border-t border-[#1A1A1A] text-xs">
                          "{dec.explanation}"
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Reviewers Assigned */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#858585]">
                Assigned Reviewers ({review.assignedReviewers.length})
              </span>
              <div className="space-y-1">
                {review.assignedReviewers.map((rev) => (
                  <div
                    key={rev.reviewerId}
                    className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-white font-medium">{rev.name}</div>
                      <div className="text-[10px] font-mono text-[#858585]">{rev.role}</div>
                    </div>
                    <span className="text-[#858585] text-[10px] font-mono">
                      {new Date(rev.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
