"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  ArchitectureReview,
  ReviewCommentAnchor,
  ReviewDecisionKind,
  ReviewerRole,
  ApprovalEvaluationResult,
  ApplyProposalResult,
} from "@nxtqr/architecture-intelligence";
import {
  architectureReviewEngine,
  comparisonEngine,
  ApprovalEvaluator,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureReviewsOptions {
  initialReview: ArchitectureReview;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: ReviewerRole;
}

export function useArchitectureReviews({
  initialReview,
  currentUserId = "user-reviewer",
  currentUserName = "Sarah Lead Architect",
  currentUserRole = "lead_architect",
}: UseArchitectureReviewsOptions) {
  const [review, setReview] = useState<ArchitectureReview>(() => {
    // Register in engine if not already present
    const existing = architectureReviewEngine.getReview(initialReview.id);
    if (!existing) {
      architectureReviewEngine.createReview({
        id: initialReview.id,
        projectId: initialReview.projectId,
        architectureId: initialReview.architectureId,
        authorId: initialReview.authorId,
        authorName: initialReview.authorName,
        title: initialReview.title,
        description: initialReview.description,
        baselineSnapshot: initialReview.baselineSnapshot,
        candidateSnapshot: initialReview.revisions[0].candidateSnapshot,
        policy: initialReview.policy,
        assignedReviewers: initialReview.assignedReviewers,
        relatedAdrIds: initialReview.relatedAdrIds,
      });
      return architectureReviewEngine.getReview(initialReview.id)!;
    }
    return existing;
  });

  const [activeTab, setActiveTab] = useState<"discussions" | "checks" | "approvals">("discussions");
  const [activeAnchor, setActiveAnchor] = useState<ReviewCommentAnchor | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "candidate" | "baseline">("split");
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [lastApplyResult, setLastApplyResult] = useState<ApplyProposalResult | null>(null);

  // Active revision candidate
  const activeRevision = useMemo(() => {
    return (
      review.revisions.find((r) => r.revisionNumber === review.currentRevisionNumber) ||
      review.revisions[0]
    );
  }, [review]);

  // Semantic diff between baseline and active candidate
  const semanticDiff = useMemo(() => {
    try {
      return comparisonEngine.compareSnapshots(
        review.baselineSnapshot,
        activeRevision.candidateSnapshot
      );
    } catch {
      return null;
    }
  }, [review.baselineSnapshot, activeRevision.candidateSnapshot]);

  // Approval evaluation
  const approvalEval = useMemo<ApprovalEvaluationResult>(() => {
    return ApprovalEvaluator.evaluateApprovals(review);
  }, [review]);

  // Record review decision
  const recordDecision = useCallback(
    (decision: ReviewDecisionKind, explanation?: string) => {
      const updated = architectureReviewEngine.recordDecision(review.id, {
        reviewerId: currentUserId,
        reviewerName: currentUserName,
        reviewerRole: currentUserRole,
        decision,
        explanation,
      });
      setReview({ ...updated });
    },
    [review.id, currentUserId, currentUserName, currentUserRole]
  );

  // Add thread
  const addThread = useCallback(
    (anchor: ReviewCommentAnchor, content: string, isBlocking: boolean = false) => {
      const { review: updated } = architectureReviewEngine.addCommentThread(review.id, {
        anchor,
        authorId: currentUserId,
        authorName: currentUserName,
        content,
        isBlocking,
      });
      setReview({ ...updated });
      setActiveAnchor(null);
    },
    [review.id, currentUserId, currentUserName]
  );

  // Add reply
  const addReply = useCallback(
    (threadId: string, content: string) => {
      const { review: updated } = architectureReviewEngine.addReply(review.id, threadId, {
        authorId: currentUserId,
        authorName: currentUserName,
        content,
      });
      setReview({ ...updated });
    },
    [review.id, currentUserId, currentUserName]
  );

  // Resolve thread
  const resolveThread = useCallback(
    (threadId: string) => {
      const updated = architectureReviewEngine.resolveThread(
        review.id,
        threadId,
        currentUserId
      );
      setReview({ ...updated });
    },
    [review.id, currentUserId]
  );

  // Reopen thread
  const reopenThread = useCallback(
    (threadId: string) => {
      const updated = architectureReviewEngine.reopenThread(
        review.id,
        threadId,
        currentUserId
      );
      setReview({ ...updated });
    },
    [review.id, currentUserId]
  );

  // Run automated checks
  const runChecks = useCallback(async () => {
    setIsRunningChecks(true);
    try {
      const updated = await architectureReviewEngine.runAutomatedChecks(review.id);
      setReview({ ...updated });
    } finally {
      setIsRunningChecks(false);
    }
  }, [review.id]);

  // Apply proposal
  const applyProposal = useCallback(() => {
    const { review: updated, result } = architectureReviewEngine.applyProposal(
      review.id,
      review.baselineSnapshot,
      { id: currentUserId, name: currentUserName }
    );
    setReview({ ...updated });
    setLastApplyResult(result);
    return result;
  }, [review.id, review.baselineSnapshot, currentUserId, currentUserName]);

  // Rebase proposal
  const rebaseProposal = useCallback(() => {
    const updated = architectureReviewEngine.rebaseReview(
      review.id,
      review.baselineSnapshot,
      { id: currentUserId, name: currentUserName }
    );
    setReview({ ...updated });
  }, [review.id, review.baselineSnapshot, currentUserId, currentUserName]);

  return {
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
    currentUserId,
    currentUserName,
    currentUserRole,
  };
}
