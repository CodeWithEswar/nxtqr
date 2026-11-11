import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";
import type {
  ArchitectureReview,
  ApplyProposalResult,
  ReviewAuditEvent,
} from "../contracts/review.types";
import { ApprovalEvaluator } from "./approval-evaluator";

export class ApplicationVerifier {
  public static verifyAndApply(
    review: ArchitectureReview,
    currentLiveSnapshot: ArchitectureSnapshot,
    actor: { id: string; name: string }
  ): { review: ArchitectureReview; result: ApplyProposalResult } {
    // 1. Approval and readiness check
    const evalResult = ApprovalEvaluator.evaluateApprovals(review);
    if (!evalResult.isApproved) {
      return {
        review,
        result: {
          success: false,
          committedRevision: currentLiveSnapshot.revision,
          nodesAppliedCount: 0,
          edgesAppliedCount: 0,
          deviationsFromCandidate: evalResult.violations,
          appliedSnapshot: currentLiveSnapshot,
          appliedAt: new Date().toISOString(),
          error: `Cannot apply unapproved review: ${evalResult.violations.join("; ")}`,
        },
      };
    }

    if (review.status === "applied") {
      return {
        review,
        result: {
          success: false,
          committedRevision: currentLiveSnapshot.revision,
          nodesAppliedCount: 0,
          edgesAppliedCount: 0,
          deviationsFromCandidate: ["Proposal was already applied."],
          appliedSnapshot: currentLiveSnapshot,
          appliedAt: new Date().toISOString(),
          error: "Review proposal has already been applied.",
        },
      };
    }

    // 2. Baseline revision check (stale baseline prevention)
    if (review.baselineSnapshot.revision !== currentLiveSnapshot.revision) {
      return {
        review: {
          ...review,
          status: "stale",
          updatedAt: new Date().toISOString(),
        },
        result: {
          success: false,
          committedRevision: currentLiveSnapshot.revision,
          nodesAppliedCount: 0,
          edgesAppliedCount: 0,
          deviationsFromCandidate: [
            `Live architecture revision (${currentLiveSnapshot.revision}) has diverged from review baseline (${review.baselineSnapshot.revision}). Rebase required.`,
          ],
          appliedSnapshot: currentLiveSnapshot,
          appliedAt: new Date().toISOString(),
          error: "Stale baseline detected. Please perform a review rebase before applying.",
        },
      };
    }

    // 3. Resolve active candidate snapshot
    const activeRevision = review.revisions.find(
      (r) => r.revisionNumber === review.currentRevisionNumber
    );
    if (!activeRevision) {
      throw new Error(`Revision ${review.currentRevisionNumber} not found.`);
    }

    const candidateSnapshot = activeRevision.candidateSnapshot;

    // 4. Generate new committed live snapshot
    const now = new Date().toISOString();
    const newCommittedRevision = `${currentLiveSnapshot.revision}-app-${review.id}`;

    const appliedSnapshot: ArchitectureSnapshot = {
      id: `snap-${newCommittedRevision}`,
      projectId: review.projectId,
      architectureId: review.architectureId,
      title: `${currentLiveSnapshot.title} (Applied: ${review.title})`,
      revision: newCommittedRevision,
      schemaVersion: currentLiveSnapshot.schemaVersion || 1,
      nodes: [...candidateSnapshot.nodes],
      edges: [...candidateSnapshot.edges],
      createdAt: now,
      provenance: "current-draft",
    };

    // 5. Post-apply verification: compare applied vs candidate
    const deviations: string[] = [];
    if (appliedSnapshot.nodes.length !== candidateSnapshot.nodes.length) {
      deviations.push(
        `Node count mismatch: applied ${appliedSnapshot.nodes.length} vs candidate ${candidateSnapshot.nodes.length}`
      );
    }
    if (appliedSnapshot.edges.length !== candidateSnapshot.edges.length) {
      deviations.push(
        `Edge count mismatch: applied ${appliedSnapshot.edges.length} vs candidate ${candidateSnapshot.edges.length}`
      );
    }

    // 6. Record audit event and update review status
    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId: review.id,
      revisionNumber: review.currentRevisionNumber,
      action: "proposal_applied",
      actorId: actor.id,
      actorName: actor.name,
      payload: {
        committedRevision: newCommittedRevision,
        nodesCount: appliedSnapshot.nodes.length,
        edgesCount: appliedSnapshot.edges.length,
      },
      timestamp: now,
    };

    const updatedReview: ArchitectureReview = {
      ...review,
      status: "applied",
      appliedAt: now,
      appliedBy: actor.name,
      appliedGraphRevision: newCommittedRevision,
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };

    return {
      review: updatedReview,
      result: {
        success: deviations.length === 0,
        committedRevision: newCommittedRevision,
        nodesAppliedCount: appliedSnapshot.nodes.length,
        edgesAppliedCount: appliedSnapshot.edges.length,
        deviationsFromCandidate: deviations,
        appliedSnapshot,
        appliedAt: now,
      },
    };
  }
}
