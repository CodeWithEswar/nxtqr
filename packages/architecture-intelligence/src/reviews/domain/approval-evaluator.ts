import type {
  ArchitectureReview,
  ApprovalEvaluationResult,
  ReviewDecisionRecord,
  ReviewerRole,
  ReviewCheck,
} from "../contracts/review.types";

export class ApprovalEvaluator {
  public static evaluateApprovals(review: ArchitectureReview): ApprovalEvaluationResult {
    const policy = review.policy;
    const currentRev = review.currentRevisionNumber;
    const violations: string[] = [];

    // 1. Current revision decisions only
    const currentDecisions = review.decisions.filter(
      (d) => d.revisionNumber === currentRev
    );

    // Latest decision per reviewer
    const reviewerDecisionMap = new Map<string, ReviewDecisionRecord>();
    for (const dec of currentDecisions) {
      reviewerDecisionMap.set(dec.reviewerId, dec);
    }
    const latestDecisions = Array.from(reviewerDecisionMap.values());

    // 2. Changes requested check
    const changeRequests = latestDecisions.filter(
      (d) => d.decision === "request_changes"
    );
    const hasRequestedChanges = changeRequests.length > 0;
    if (hasRequestedChanges) {
      for (const cr of changeRequests) {
        violations.push(
          `Reviewer '${cr.reviewerName}' requested changes: ${cr.explanation || "No explanation provided"}`
        );
      }
    }

    // 3. Count valid approvals
    const rawApprovals = latestDecisions.filter((d) => d.decision === "approve");
    const validApprovals: ReviewDecisionRecord[] = [];

    for (const app of rawApprovals) {
      if (!policy.allowSelfApproval && app.reviewerId === review.authorId) {
        violations.push("Self-approval by review author is prohibited by review policy.");
        continue;
      }
      validApprovals.push(app);
    }

    const totalApprovals = validApprovals.length;
    const requiredApprovals = policy.minApprovals;
    const missingApprovalsCount = Math.max(0, requiredApprovals - totalApprovals);

    if (missingApprovalsCount > 0) {
      violations.push(
        `Requires at least ${requiredApprovals} approval(s); currently has ${totalApprovals}.`
      );
    }

    // 4. Role requirements
    const satisfiedRoles: ReviewerRole[] = [];
    const missingRoles: ReviewerRole[] = [];

    const approvedRoles = new Set<ReviewerRole>(
      validApprovals.map((a) => a.reviewerRole)
    );

    for (const reqRole of policy.requiredReviewerRoles) {
      if (approvedRoles.has(reqRole)) {
        satisfiedRoles.push(reqRole);
      } else {
        missingRoles.push(reqRole);
        violations.push(`Mandatory approval from role '${reqRole}' is missing.`);
      }
    }

    // 5. Automated Checks
    const blockingChecks: ReviewCheck[] = [];
    if (policy.requireAllChecksPassed) {
      for (const chk of review.checks) {
        if (chk.status === "failed" || chk.status === "unavailable" || chk.status === "stale") {
          blockingChecks.push(chk);
          violations.push(
            `Automated check '${chk.name}' is ${chk.status.toUpperCase()}: ${chk.message}`
          );
        }
      }
    }

    // 6. Unresolved blocking threads
    let unresolvedThreadsCount = 0;
    if (policy.requireResolvedThreads) {
      const openThreads = review.threads.filter(
        (t) => t.revisionNumber === currentRev && t.status !== "resolved" && (t.isBlocking || policy.requireResolvedThreads)
      );
      unresolvedThreadsCount = openThreads.length;
      if (unresolvedThreadsCount > 0) {
        violations.push(
          `There are ${unresolvedThreadsCount} unresolved discussion thread(s) blocking approval.`
        );
      }
    }

    const isApproved = violations.length === 0 && !hasRequestedChanges && totalApprovals >= requiredApprovals;
    const isReadyToApply =
      isApproved &&
      (review.status === "approved" || review.status === "ready_to_apply");

    return {
      isApproved,
      isReadyToApply,
      totalApprovals,
      requiredApprovals,
      missingApprovalsCount,
      satisfiedRoles,
      missingRoles,
      blockingChecks,
      unresolvedThreadsCount,
      hasRequestedChanges,
      violations,
    };
  }
}
