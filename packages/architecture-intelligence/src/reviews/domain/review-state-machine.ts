import type { ArchitectureReview, ReviewStatus, ReviewAuditEvent } from "../contracts/review.types";

export class ReviewStateMachine {
  private static readonly VALID_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
    draft: ["open", "closed"],
    open: ["changes_requested", "approved", "closed", "stale", "superseded"],
    changes_requested: ["open", "closed", "stale", "superseded"],
    approved: ["ready_to_apply", "open", "changes_requested", "closed", "superseded"],
    ready_to_apply: ["applied", "open", "changes_requested", "closed", "superseded"],
    applied: [], // Terminal state: applied changes cannot transition
    closed: ["open"], // Can reopen closed review if authorized
    superseded: [],
    stale: ["open", "closed", "superseded"],
  };

  public static canTransition(current: ReviewStatus, target: ReviewStatus): boolean {
    if (current === target) return true;
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  public static validateTransition(
    review: ArchitectureReview,
    target: ReviewStatus,
    context?: { actorId: string; isAuthorized: boolean }
  ): { valid: boolean; reason?: string } {
    if (review.status === "applied") {
      return { valid: false, reason: "Cannot transition a review that has already been applied." };
    }

    if (context && !context.isAuthorized) {
      return { valid: false, reason: "Actor is not authorized to transition this review." };
    }

    if (!this.canTransition(review.status, target)) {
      return {
        valid: false,
        reason: `Illegal state transition from '${review.status}' to '${target}'.`,
      };
    }

    return { valid: true };
  }

  public static transition(
    review: ArchitectureReview,
    target: ReviewStatus,
    context: { actorId: string; actorName: string; reason?: string }
  ): ArchitectureReview {
    const validation = this.validateTransition(review, target, {
      actorId: context.actorId,
      isAuthorized: true,
    });

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const now = new Date().toISOString();

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      action: `status_changed:${review.status}->${target}`,
      actorId: context.actorId,
      actorName: context.actorName,
      payload: {
        from: review.status,
        to: target,
        reason: context.reason,
      },
      timestamp: now,
    };

    return {
      ...review,
      status: target,
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };
  }
}
