"use client";

import React from "react";
import type { ArchitectureReview } from "@nxtqr/architecture-intelligence";
import { useArchitectureReviews } from "../hooks/use-architecture-reviews";
import { ReviewHeader } from "./review-header";
import { ReviewChangeList } from "./review-change-list";
import { ReviewCanvas } from "./review-canvas";
import { ReviewDiscussions } from "./review-discussions";
import { ReviewDecisionModal } from "./review-decision-modal";
import { CheckCircleIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface ReviewWorkspaceProps {
  initialReview: ArchitectureReview;
  currentUserId?: string;
  currentUserName?: string;
  className?: string;
}

export function ReviewWorkspace({
  initialReview,
  currentUserId,
  currentUserName,
  className,
}: ReviewWorkspaceProps) {
  const {
    review,
    activeRevision,
    semanticDiff,
    approvalEval,
    activeTab,
    setActiveTab,
    activeAnchor,
    setActiveAnchor,
    isDecisionModalOpen,
    setIsDecisionModalOpen,
    selectedNodeId,
    setSelectedNodeId,
    viewMode,
    setViewMode,
    isRunningChecks,
    lastApplyResult,
    recordDecision,
    addThread,
    addReply,
    resolveThread,
    reopenThread,
    runChecks,
    applyProposal,
    rebaseProposal,
    currentUserRole,
  } = useArchitectureReviews({
    initialReview,
    currentUserId,
    currentUserName,
  });

  return (
    <div
      className={`flex flex-col h-full w-full bg-black text-white select-none overflow-hidden ${
        className || ""
      }`}
    >
      {/* 1. Header Toolbar */}
      <ReviewHeader
        review={review}
        approvalEval={approvalEval}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenDecisionModal={() => setIsDecisionModalOpen(true)}
        onRunChecks={runChecks}
        onApplyProposal={applyProposal}
        onRebaseProposal={rebaseProposal}
        isRunningChecks={isRunningChecks}
      />

      {/* 2. Notification / Result Banner (if proposal was just applied or encountered issues) */}
      {lastApplyResult && (
        <div
          className={`h-10 px-4 flex items-center justify-between text-xs font-mono shrink-0 border-b ${
            lastApplyResult.success
              ? "bg-[#0E2014] border-[#1F4028] text-[#4ADE80]"
              : "bg-[#260D0D] border-[#4D1919] text-[#F87171]"
          }`}
        >
          <div className="flex items-center gap-2">
            {lastApplyResult.success ? (
              <CheckCircleIcon className="w-4 h-4 text-[#4ADE80]" />
            ) : (
              <AlertTriangleIcon className="w-4 h-4 text-[#F87171]" />
            )}
            <span>
              {lastApplyResult.success
                ? `Proposal applied successfully! Committed revision ${lastApplyResult.committedRevision} (${lastApplyResult.nodesAppliedCount} nodes, ${lastApplyResult.edgesAppliedCount} edges).`
                : `Failed to apply proposal: ${lastApplyResult.error}`}
            </span>
          </div>
          <span className="text-[10px] text-[#858585]">
            Deviations: {lastApplyResult.deviationsFromCandidate.length === 0 ? "0 (Clean)" : lastApplyResult.deviationsFromCandidate.join(", ")}
          </span>
        </div>
      )}

      {/* 3. Three-Pane Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Semantic Change Delta */}
        <ReviewChangeList
          semanticDiff={semanticDiff}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onSelectAnchor={(change) => {
            const nodeId = change.candidateId || change.baselineId || change.id;
            setActiveAnchor({
              type: "node",
              nodeId,
              nodeLabel: change.label,
            });
            setActiveTab("discussions");
          }}
        />

        {/* Center: Graph Comparison & Contextual Badges */}
        <ReviewCanvas
          review={review}
          activeRevision={activeRevision}
          semanticDiff={semanticDiff}
          viewMode={viewMode}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onSelectAnchor={(anchor) => {
            setActiveAnchor(anchor);
            setActiveTab("discussions");
          }}
        />

        {/* Right: Discussions, Checks & Approvals */}
        <ReviewDiscussions
          review={review}
          approvalEval={approvalEval}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeAnchor={activeAnchor}
          onClearAnchor={() => setActiveAnchor(null)}
          onAddThread={addThread}
          onAddReply={addReply}
          onResolveThread={resolveThread}
          onReopenThread={reopenThread}
          onRunChecks={runChecks}
          onOpenDecisionModal={() => setIsDecisionModalOpen(true)}
          isRunningChecks={isRunningChecks}
          currentUserRole={currentUserRole}
        />
      </div>

      {/* 4. Decision Recording Modal */}
      <ReviewDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        review={review}
        currentUserId={currentUserId || "user-reviewer"}
        currentUserName={currentUserName || "Sarah Lead Architect"}
        currentUserRole={currentUserRole}
        onRecordDecision={recordDecision}
      />
    </div>
  );
}
