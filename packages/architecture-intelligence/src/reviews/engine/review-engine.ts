import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";
import type {
  ArchitectureReview,
  ArchitectureReviewRevision,
  CreateReviewInput,
  ReviewDecisionRecord,
  ReviewDecisionKind,
  ReviewerRole,
  ReviewPolicy,
  ReviewAuditEvent,
  ApprovalEvaluationResult,
  ApplyProposalResult,
  ReviewCommentAnchor,
  ReviewCommentThread,
  ReviewComment,
} from "../contracts/review.types";
import { ReviewStateMachine } from "../domain/review-state-machine";
import { ApprovalEvaluator } from "../domain/approval-evaluator";
import { RevisionManager } from "../domain/revision-manager";
import { ThreadManager } from "../comments/thread-manager";
import { ReviewCheckRunner } from "../checks/check-runner";
import { ApplicationVerifier } from "../domain/application-verifier";

export class ArchitectureReviewEngine {
  private reviews = new Map<string, ArchitectureReview>();

  public createReview(input: CreateReviewInput): ArchitectureReview {
    const reviewId =
      input.id || `rev-${input.architectureId}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const defaultPolicy: ReviewPolicy = {
      minApprovals: input.policy?.minApprovals ?? 1,
      requiredReviewerRoles: input.policy?.requiredReviewerRoles ?? [],
      requireAllChecksPassed: input.policy?.requireAllChecksPassed ?? true,
      requireResolvedThreads: input.policy?.requireResolvedThreads ?? true,
      allowSelfApproval: input.policy?.allowSelfApproval ?? false,
      invalidateApprovalsOnRevision: input.policy?.invalidateApprovalsOnRevision ?? true,
    };

    const initialRevision: ArchitectureReviewRevision = {
      id: `rev-${reviewId}-1`,
      reviewId,
      revisionNumber: 1,
      candidateSnapshot: input.candidateSnapshot,
      contentHash: RevisionManager.computeSnapshotHash(input.candidateSnapshot),
      changeSummary: "Initial architecture change proposal.",
      createdAt: now,
      authorId: input.authorId,
    };

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId,
      revisionNumber: 1,
      action: "review_created",
      actorId: input.authorId,
      actorName: input.authorName,
      payload: { title: input.title },
      timestamp: now,
    };

    const assignedReviewers = (input.assignedReviewers || []).map((r) => ({
      reviewerId: r.reviewerId,
      name: r.name,
      role: r.role,
      assignedAt: now,
    }));

    const review: ArchitectureReview = {
      id: reviewId,
      projectId: input.projectId,
      architectureId: input.architectureId,
      authorId: input.authorId,
      authorName: input.authorName,
      title: input.title,
      description: input.description,
      baselineSnapshot: input.baselineSnapshot,
      currentRevisionNumber: 1,
      revisions: [initialRevision],
      status: "draft",
      assignedReviewers,
      decisions: [],
      threads: [],
      checks: [],
      policy: defaultPolicy,
      auditTrail: [auditEvent],
      relatedAdrIds: input.relatedAdrIds || [],
      createdAt: now,
      updatedAt: now,
    };

    this.reviews.set(reviewId, review);
    return review;
  }

  public getReview(reviewId: string): ArchitectureReview | undefined {
    return this.reviews.get(reviewId);
  }

  public getAllReviews(projectId?: string): ArchitectureReview[] {
    const list = Array.from(this.reviews.values());
    if (projectId) {
      return list.filter((r) => r.projectId === projectId);
    }
    return list;
  }

  public submitReview(
    reviewId: string,
    actor: { id: string; name: string }
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const updated = ReviewStateMachine.transition(review, "open", {
      actorId: actor.id,
      actorName: actor.name,
      reason: "Submitted for engineering review.",
    });

    this.reviews.set(reviewId, updated);
    return updated;
  }

  public recordDecision(
    reviewId: string,
    input: {
      reviewerId: string;
      reviewerName: string;
      reviewerRole: ReviewerRole;
      decision: ReviewDecisionKind;
      explanation?: string;
    }
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const now = new Date().toISOString();

    const decisionRecord: ReviewDecisionRecord = {
      id: `dec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId,
      revisionNumber: review.currentRevisionNumber,
      reviewerId: input.reviewerId,
      reviewerName: input.reviewerName,
      reviewerRole: input.reviewerRole,
      decision: input.decision,
      explanation: input.explanation,
      createdAt: now,
    };

    // Filter out previous decision by the same reviewer on the same revision
    const existingFiltered = review.decisions.filter(
      (d) =>
        !(
          d.reviewerId === input.reviewerId &&
          d.revisionNumber === review.currentRevisionNumber
        )
    );

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId,
      revisionNumber: review.currentRevisionNumber,
      action: `decision_recorded:${input.decision}`,
      actorId: input.reviewerId,
      actorName: input.reviewerName,
      payload: { decision: input.decision, explanation: input.explanation },
      timestamp: now,
    };

    let updatedReview: ArchitectureReview = {
      ...review,
      decisions: [...existingFiltered, decisionRecord],
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };

    // Evaluate state transition
    if (input.decision === "request_changes") {
      if (ReviewStateMachine.canTransition(updatedReview.status, "changes_requested")) {
        updatedReview = ReviewStateMachine.transition(
          updatedReview,
          "changes_requested",
          {
            actorId: input.reviewerId,
            actorName: input.reviewerName,
            reason: input.explanation,
          }
        );
      }
    } else {
      const evalResult = ApprovalEvaluator.evaluateApprovals(updatedReview);
      if (evalResult.isApproved) {
        if (ReviewStateMachine.canTransition(updatedReview.status, "approved")) {
          updatedReview = ReviewStateMachine.transition(updatedReview, "approved", {
            actorId: input.reviewerId,
            actorName: input.reviewerName,
            reason: "All approval policies and checks satisfied.",
          });
        }
      }
    }

    this.reviews.set(reviewId, updatedReview);
    return updatedReview;
  }

  public createRevision(
    reviewId: string,
    newCandidateSnapshot: ArchitectureSnapshot,
    authorId: string,
    changeSummary: string
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const updated = RevisionManager.createRevision(
      review,
      newCandidateSnapshot,
      authorId,
      changeSummary
    );
    this.reviews.set(reviewId, updated);
    return updated;
  }

  public addCommentThread(
    reviewId: string,
    input: {
      anchor: ReviewCommentAnchor;
      authorId: string;
      authorName: string;
      content: string;
      isBlocking?: boolean;
    }
  ): { review: ArchitectureReview; thread: ReviewCommentThread } {
    const review = this.mustGetReview(reviewId);
    const { review: updated, thread } = ThreadManager.createThread(review, input);
    this.reviews.set(reviewId, updated);
    return { review: updated, thread };
  }

  public addReply(
    reviewId: string,
    threadId: string,
    input: {
      authorId: string;
      authorName: string;
      content: string;
    }
  ): { review: ArchitectureReview; reply: ReviewComment } {
    const review = this.mustGetReview(reviewId);
    const { review: updated, reply } = ThreadManager.addReply(review, threadId, input);
    this.reviews.set(reviewId, updated);
    return { review: updated, reply };
  }

  public resolveThread(
    reviewId: string,
    threadId: string,
    resolverId: string
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const updated = ThreadManager.resolveThread(review, threadId, resolverId);
    this.reviews.set(reviewId, updated);
    return updated;
  }

  public reopenThread(
    reviewId: string,
    threadId: string,
    actorId: string
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const updated = ThreadManager.reopenThread(review, threadId, actorId);
    this.reviews.set(reviewId, updated);
    return updated;
  }

  public assignReviewer(
    reviewId: string,
    assignment: { reviewerId: string; name: string; role: ReviewerRole },
    actor: { id: string; name: string }
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const now = new Date().toISOString();

    const exists = review.assignedReviewers.some(
      (r) => r.reviewerId === assignment.reviewerId
    );
    if (exists) {
      return review;
    }

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId,
      revisionNumber: review.currentRevisionNumber,
      action: "reviewer_assigned",
      actorId: actor.id,
      actorName: actor.name,
      payload: { assigned: assignment },
      timestamp: now,
    };

    const updated: ArchitectureReview = {
      ...review,
      assignedReviewers: [
        ...review.assignedReviewers,
        { ...assignment, assignedAt: now },
      ],
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };

    this.reviews.set(reviewId, updated);
    return updated;
  }

  public async runAutomatedChecks(reviewId: string): Promise<ArchitectureReview> {
    const review = this.mustGetReview(reviewId);
    const activeRevision = review.revisions.find(
      (r) => r.revisionNumber === review.currentRevisionNumber
    );
    if (!activeRevision) {
      throw new Error(`Revision ${review.currentRevisionNumber} not found.`);
    }

    const checks = await ReviewCheckRunner.runAllChecks(
      review.baselineSnapshot,
      activeRevision.candidateSnapshot
    );

    const now = new Date().toISOString();
    const updated: ArchitectureReview = {
      ...review,
      checks,
      updatedAt: now,
    };

    this.reviews.set(reviewId, updated);
    return updated;
  }

  public evaluateApprovals(reviewId: string): ApprovalEvaluationResult {
    const review = this.mustGetReview(reviewId);
    return ApprovalEvaluator.evaluateApprovals(review);
  }

  public rebaseReview(
    reviewId: string,
    currentLiveSnapshot: ArchitectureSnapshot,
    actor: { id: string; name: string }
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const rebaseAnalysis = RevisionManager.analyzeRebase(review, currentLiveSnapshot);

    if (!rebaseAnalysis.isConflictFree || !rebaseAnalysis.rebasedCandidate) {
      throw new Error(
        `Cannot rebase review: Conflicting operations detected: ${rebaseAnalysis.conflictingOperations.join("; ")}`
      );
    }

    const now = new Date().toISOString();
    const nextRev = review.currentRevisionNumber + 1;

    const newRevision: ArchitectureReviewRevision = {
      id: `rev-${reviewId}-${nextRev}`,
      reviewId,
      revisionNumber: nextRev,
      candidateSnapshot: rebaseAnalysis.rebasedCandidate,
      contentHash: RevisionManager.computeSnapshotHash(rebaseAnalysis.rebasedCandidate),
      changeSummary: `Rebased onto latest live architecture revision (${currentLiveSnapshot.revision}).`,
      createdAt: now,
      authorId: actor.id,
    };

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId,
      revisionNumber: nextRev,
      action: "review_rebased",
      actorId: actor.id,
      actorName: actor.name,
      payload: {
        newBaselineRevision: currentLiveSnapshot.revision,
      },
      timestamp: now,
    };

    const updated: ArchitectureReview = {
      ...review,
      baselineSnapshot: currentLiveSnapshot,
      currentRevisionNumber: nextRev,
      revisions: [...review.revisions, newRevision],
      status: "open",
      checks: review.checks.map((c) => ({ ...c, status: "stale" })),
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };

    this.reviews.set(reviewId, updated);
    return updated;
  }

  public applyProposal(
    reviewId: string,
    currentLiveSnapshot: ArchitectureSnapshot,
    actor: { id: string; name: string }
  ): { review: ArchitectureReview; result: ApplyProposalResult } {
    const review = this.mustGetReview(reviewId);
    const { review: updated, result } = ApplicationVerifier.verifyAndApply(
      review,
      currentLiveSnapshot,
      actor
    );

    this.reviews.set(reviewId, updated);
    return { review: updated, result };
  }

  public linkADR(reviewId: string, adrId: string): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    if (review.relatedAdrIds?.includes(adrId)) {
      return review;
    }

    const updated: ArchitectureReview = {
      ...review,
      relatedAdrIds: [...(review.relatedAdrIds || []), adrId],
      updatedAt: new Date().toISOString(),
    };

    this.reviews.set(reviewId, updated);
    return updated;
  }

  public closeReview(
    reviewId: string,
    actor: { id: string; name: string },
    reason?: string
  ): ArchitectureReview {
    const review = this.mustGetReview(reviewId);
    const updated = ReviewStateMachine.transition(review, "closed", {
      actorId: actor.id,
      actorName: actor.name,
      reason,
    });
    this.reviews.set(reviewId, updated);
    return updated;
  }

  public clearStore(): void {
    this.reviews.clear();
  }

  private mustGetReview(reviewId: string): ArchitectureReview {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Architecture review '${reviewId}' not found.`);
    }
    return review;
  }
}

export const architectureReviewEngine = new ArchitectureReviewEngine();
