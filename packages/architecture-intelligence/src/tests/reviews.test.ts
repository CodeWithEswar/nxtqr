import { describe, it, expect, beforeEach } from "vitest";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import {
  architectureReviewEngine,
  ReviewStateMachine,
  ApprovalEvaluator,
} from "../index";

const mockBaselineNodes: BaseNode[] = [
  {
    id: "gw-1",
    type: "api_gateway",
    position: { x: 0, y: 0 },
    data: { label: "Ingress Gateway", replicas: 2 },
  },
  {
    id: "svc-1",
    type: "service",
    position: { x: 200, y: 0 },
    data: { label: "Core Service", replicas: 3 },
  },
];

const mockBaselineEdges: BaseEdge[] = [
  {
    id: "e-gw-svc",
    source: "gw-1",
    target: "svc-1",
    data: { protocol: "HTTP/2" },
  },
];

const mockBaselineSnapshot: ArchitectureSnapshot = {
  id: "snap-base-1",
  projectId: "proj-rev",
  architectureId: "arch-rev-test",
  title: "Baseline Architecture",
  revision: "rev-1.0.0",
  schemaVersion: 1,
  nodes: mockBaselineNodes,
  edges: mockBaselineEdges,
  createdAt: new Date().toISOString(),
  provenance: "saved-version",
};

const mockCandidateSnapshot: ArchitectureSnapshot = {
  id: "snap-cand-1",
  projectId: "proj-rev",
  architectureId: "arch-rev-test",
  title: "Proposed Architecture (Redis Added)",
  revision: "rev-1.1.0-prop",
  schemaVersion: 1,
  nodes: [
    ...mockBaselineNodes,
    {
      id: "cache-1",
      type: "cache",
      position: { x: 400, y: 0 },
      data: { label: "Redis Cluster", replicas: 3 },
    },
  ],
  edges: [
    ...mockBaselineEdges,
    {
      id: "e-svc-cache",
      source: "svc-1",
      target: "cache-1",
      data: { protocol: "Redis" },
    },
  ],
  createdAt: new Date().toISOString(),
  provenance: "what-if-proposal",
};

describe("Phase 05.3.13: Architecture Design Review & Collaboration Engine", () => {
  beforeEach(() => {
    architectureReviewEngine.clearStore();
  });

  describe("Review Creation & State Machine", () => {
    it("creates review with initial immutable revision and draft state", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Introduce Redis Caching Layer",
        description: "Decouple database reads by introducing a 3-node Redis cluster.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
      });

      expect(review.id).toBeDefined();
      expect(review.status).toBe("draft");
      expect(review.currentRevisionNumber).toBe(1);
      expect(review.revisions.length).toBe(1);
      expect(review.revisions[0].contentHash).toBeDefined();
      expect(review.auditTrail.length).toBe(1);
      expect(review.auditTrail[0].action).toBe("review_created");
    });

    it("transitions from draft to open upon submission", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Test Submission",
        description: "Review submission test.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
      });

      const submitted = architectureReviewEngine.submitReview(review.id, {
        id: "user-author",
        name: "Alice Architect",
      });

      expect(submitted.status).toBe("open");
      expect(submitted.auditTrail[0].action).toBe("status_changed:draft->open");
    });

    it("prevents illegal state transitions", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Test Illegal Transition",
        description: "Illegal transition test.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
      });

      // Draft cannot transition directly to applied
      expect(ReviewStateMachine.canTransition("draft", "applied")).toBe(false);
      expect(() =>
        ReviewStateMachine.transition(review, "applied", {
          actorId: "user-author",
          actorName: "Alice",
        })
      ).toThrow();
    });
  });

  describe("Contextual Comments & Threads", () => {
    it("adds node-anchored thread and replies", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Comment Test",
        description: "Comment anchoring test.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
      });

      const { review: updatedReview, thread } = architectureReviewEngine.addCommentThread(
        review.id,
        {
          anchor: { type: "node", nodeId: "cache-1", nodeLabel: "Redis Cluster" },
          authorId: "user-bob",
          authorName: "Bob Reviewer",
          content: "What eviction policy are we configuring for this cluster?",
          isBlocking: true,
        }
      );

      expect(thread.id).toBeDefined();
      expect(thread.isBlocking).toBe(true);
      expect(thread.anchor.type).toBe("node");
      expect(updatedReview.threads.length).toBe(1);

      // Reply
      const { reply } = architectureReviewEngine.addReply(review.id, thread.id, {
        authorId: "user-author",
        authorName: "Alice Architect",
        content: "We plan to use volatile-lru with 4GB memory cap.",
      });

      expect(reply.content).toContain("volatile-lru");
      const refetched = architectureReviewEngine.getReview(review.id)!;
      expect(refetched.threads[0].replies.length).toBe(1);
    });

    it("resolves and reopens threads cleanly", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Resolve Test",
        description: "Resolve test.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
      });

      const { thread } = architectureReviewEngine.addCommentThread(review.id, {
        anchor: { type: "general" },
        authorId: "user-bob",
        authorName: "Bob",
        content: "Blocking question",
        isBlocking: true,
      });

      const resolved = architectureReviewEngine.resolveThread(
        review.id,
        thread.id,
        "user-bob"
      );
      expect(resolved.threads[0].status).toBe("resolved");
      expect(resolved.threads[0].resolvedBy).toBe("user-bob");

      const reopened = architectureReviewEngine.reopenThread(
        review.id,
        thread.id,
        "user-bob"
      );
      expect(reopened.threads[0].status).toBe("reopened");
    });
  });

  describe("Approval Policy & Decisions", () => {
    it("enforces self-approval prohibition", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Self Approval Test",
        description: "Test self approval.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
        policy: { allowSelfApproval: false, minApprovals: 1 },
      });

      architectureReviewEngine.submitReview(review.id, {
        id: "user-author",
        name: "Alice Architect",
      });

      // Author attempts to approve
      const afterSelfApprove = architectureReviewEngine.recordDecision(review.id, {
        reviewerId: "user-author",
        reviewerName: "Alice Architect",
        reviewerRole: "author",
        decision: "approve",
        explanation: "Looks good to me!",
      });

      const evalResult = ApprovalEvaluator.evaluateApprovals(afterSelfApprove);
      expect(evalResult.isApproved).toBe(false);
      expect(evalResult.violations.some((v) => v.includes("Self-approval"))).toBe(true);
    });

    it("approves when required approvals from peer reviewers are satisfied", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Peer Approval Test",
        description: "Test peer approval.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
        policy: {
          minApprovals: 1,
          allowSelfApproval: false,
          requireAllChecksPassed: false,
          requireResolvedThreads: false,
        },
      });

      architectureReviewEngine.submitReview(review.id, {
        id: "user-author",
        name: "Alice Architect",
      });

      const approvedReview = architectureReviewEngine.recordDecision(review.id, {
        reviewerId: "user-bob",
        reviewerName: "Bob Lead",
        reviewerRole: "lead_architect",
        decision: "approve",
        explanation: "Approved after cache capacity review.",
      });

      expect(approvedReview.status).toBe("approved");
      const evalResult = ApprovalEvaluator.evaluateApprovals(approvedReview);
      expect(evalResult.isApproved).toBe(true);
      expect(evalResult.totalApprovals).toBe(1);
    });

    it("transitions to changes_requested when requested by reviewer", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Changes Requested Test",
        description: "Test changes requested.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
      });

      architectureReviewEngine.submitReview(review.id, {
        id: "user-author",
        name: "Alice Architect",
      });

      const updated = architectureReviewEngine.recordDecision(review.id, {
        reviewerId: "user-carol",
        reviewerName: "Carol Sec",
        reviewerRole: "security_reviewer",
        decision: "request_changes",
        explanation: "Redis must have in-transit TLS enabled.",
      });

      expect(updated.status).toBe("changes_requested");
      const evalResult = ApprovalEvaluator.evaluateApprovals(updated);
      expect(evalResult.hasRequestedChanges).toBe(true);
      expect(evalResult.isApproved).toBe(false);
    });
  });

  describe("Revisions & Approval Invalidation", () => {
    it("invalidates previous approvals when a new candidate revision is published", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Revision Test",
        description: "Test revision invalidation.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
        policy: {
          minApprovals: 1,
          allowSelfApproval: false,
          requireAllChecksPassed: false,
          requireResolvedThreads: false,
          invalidateApprovalsOnRevision: true,
        },
      });

      architectureReviewEngine.submitReview(review.id, {
        id: "user-author",
        name: "Alice",
      });

      // Bob approves revision 1
      architectureReviewEngine.recordDecision(review.id, {
        reviewerId: "user-bob",
        reviewerName: "Bob",
        reviewerRole: "reviewer",
        decision: "approve",
      });

      expect(architectureReviewEngine.getReview(review.id)!.status).toBe("approved");

      // Author pushes revision 2
      const updatedRev2Candidate: ArchitectureSnapshot = {
        ...mockCandidateSnapshot,
        revision: "rev-1.2.0-tls",
        edges: [
          ...mockCandidateSnapshot.edges.filter((e) => e.id !== "e-svc-cache"),
          {
            id: "e-svc-cache",
            source: "svc-1",
            target: "cache-1",
            data: { protocol: "Redis-TLS", isEncrypted: true },
          },
        ],
      };

      const revisedReview = architectureReviewEngine.createRevision(
        review.id,
        updatedRev2Candidate,
        "user-author",
        "Enabled TLS on Redis connection."
      );

      expect(revisedReview.currentRevisionNumber).toBe(2);
      expect(revisedReview.status).toBe("open"); // Reverted from approved to open!

      // Previous approval on rev 1 does not count for rev 2!
      const evalResult = ApprovalEvaluator.evaluateApprovals(revisedReview);
      expect(evalResult.isApproved).toBe(false);
      expect(evalResult.totalApprovals).toBe(0);
    });
  });

  describe("Atomic Application & Post-Apply Verification", () => {
    it("applies approved proposal atomically and performs post-apply verification", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Application Test",
        description: "Test atomic proposal application.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
        policy: {
          minApprovals: 1,
          allowSelfApproval: false,
          requireAllChecksPassed: false,
          requireResolvedThreads: false,
        },
      });

      architectureReviewEngine.submitReview(review.id, {
        id: "user-author",
        name: "Alice",
      });

      architectureReviewEngine.recordDecision(review.id, {
        reviewerId: "user-lead",
        reviewerName: "Dave Lead",
        reviewerRole: "lead_architect",
        decision: "approve",
      });

      // Apply
      const { review: appliedReview, result } = architectureReviewEngine.applyProposal(
        review.id,
        mockBaselineSnapshot,
        { id: "user-lead", name: "Dave Lead" }
      );

      expect(result.success).toBe(true);
      expect(appliedReview.status).toBe("applied");
      expect(appliedReview.appliedBy).toBe("Dave Lead");
      expect(result.nodesAppliedCount).toBe(3);
      expect(result.deviationsFromCandidate.length).toBe(0);
    });

    it("blocks application if live baseline has diverged (stale detection)", () => {
      const review = architectureReviewEngine.createReview({
        projectId: "proj-rev",
        architectureId: "arch-rev-test",
        authorId: "user-author",
        authorName: "Alice Architect",
        title: "Stale Baseline Test",
        description: "Test stale baseline protection.",
        baselineSnapshot: mockBaselineSnapshot,
        candidateSnapshot: mockCandidateSnapshot,
        policy: {
          minApprovals: 1,
          allowSelfApproval: false,
          requireAllChecksPassed: false,
          requireResolvedThreads: false,
        },
      });

      architectureReviewEngine.submitReview(review.id, {
        id: "user-author",
        name: "Alice",
      });

      architectureReviewEngine.recordDecision(review.id, {
        reviewerId: "user-lead",
        reviewerName: "Dave Lead",
        reviewerRole: "lead_architect",
        decision: "approve",
      });

      // Live graph has diverged to rev-1.0.1
      const divergedLiveSnapshot: ArchitectureSnapshot = {
        ...mockBaselineSnapshot,
        revision: "rev-1.0.1-diverged",
      };

      const { review: staleReview, result } = architectureReviewEngine.applyProposal(
        review.id,
        divergedLiveSnapshot,
        { id: "user-lead", name: "Dave Lead" }
      );

      expect(result.success).toBe(false);
      expect(staleReview.status).toBe("stale");
      expect(result.error).toContain("Stale baseline detected");
    });
  });
});
