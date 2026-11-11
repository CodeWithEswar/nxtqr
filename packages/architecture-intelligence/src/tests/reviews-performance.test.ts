import { describe, it, expect, beforeEach } from "vitest";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import {
  architectureReviewEngine,
  ApprovalEvaluator,
  RevisionManager,
} from "../index";

function generateSyntheticTopology(nodeCount: number): { nodes: BaseNode[]; edges: BaseEdge[] } {
  const nodes: BaseNode[] = [];
  const edges: BaseEdge[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const category = i % 4 === 0 ? "gateway" : i % 4 === 1 ? "compute" : i % 4 === 2 ? "database" : "cache";
    nodes.push({
      id: `node-${i}`,
      type: category === "database" ? "database" : "service",
      position: { x: (i % 20) * 150, y: Math.floor(i / 20) * 100 },
      data: {
        label: `Service-Node-${i}`,
        category,
        tier: category,
        replicas: (i % 3) + 1,
        criticality: i % 10 === 0 ? "critical" : "medium",
      },
    });

    if (i > 0) {
      edges.push({
        id: `edge-${i - 1}-${i}`,
        source: `node-${i - 1}`,
        target: `node-${i}`,
        data: {
          protocol: i % 2 === 0 ? "gRPC" : "HTTPS",
          isSynchronous: true,
          isEncrypted: true,
        },
      });
    }
  }

  return { nodes, edges };
}

describe("Architecture Reviews Performance Benchmark", () => {
  beforeEach(() => {
    architectureReviewEngine.clearStore();
  });

  it("benchmarks 100-node review creation, decision evaluation, and application in under 50ms", () => {
    const { nodes: baseNodes, edges: baseEdges } = generateSyntheticTopology(100);
    const { nodes: candNodes, edges: candEdges } = generateSyntheticTopology(105);

    const baseSnapshot: ArchitectureSnapshot = {
      id: "snap-bench-base-100",
      revision: "rev-base-100",
      schemaVersion: 1,
      title: "100 Node Baseline",
      nodes: baseNodes,
      edges: baseEdges,
      createdAt: new Date().toISOString(),
      provenance: "saved-version",
    };

    const candSnapshot: ArchitectureSnapshot = {
      id: "snap-bench-cand-100",
      revision: "rev-cand-100",
      schemaVersion: 1,
      title: "105 Node Candidate",
      nodes: candNodes,
      edges: candEdges,
      createdAt: new Date().toISOString(),
      provenance: "what-if-proposal",
    };

    const start = performance.now();

    const review = architectureReviewEngine.createReview({
      projectId: "bench-proj",
      architectureId: "bench-arch-100",
      authorId: "user-bench",
      authorName: "Benchmarker",
      title: "100-Node Scale Review",
      description: "Scale test.",
      baselineSnapshot: baseSnapshot,
      candidateSnapshot: candSnapshot,
      policy: {
        minApprovals: 2,
        allowSelfApproval: false,
        requireAllChecksPassed: false,
        requireResolvedThreads: false,
      },
    });

    architectureReviewEngine.submitReview(review.id, { id: "user-bench", name: "Benchmarker" });

    // 2 approvals
    architectureReviewEngine.recordDecision(review.id, {
      reviewerId: "user-rev-1",
      reviewerName: "Reviewer 1",
      reviewerRole: "reviewer",
      decision: "approve",
    });
    architectureReviewEngine.recordDecision(review.id, {
      reviewerId: "user-rev-2",
      reviewerName: "Reviewer 2",
      reviewerRole: "lead_architect",
      decision: "approve",
    });

    const evalResult = ApprovalEvaluator.evaluateApprovals(architectureReviewEngine.getReview(review.id)!);
    expect(evalResult.isApproved).toBe(true);

    const { result } = architectureReviewEngine.applyProposal(review.id, baseSnapshot, {
      id: "user-rev-2",
      name: "Reviewer 2",
    });

    const duration = performance.now() - start;

    expect(result.success).toBe(true);
    expect(result.nodesAppliedCount).toBe(105);
    expect(duration).toBeLessThan(50);
  });

  it("benchmarks 500-node snapshot hash calculation and rebase analysis in under 100ms", () => {
    const { nodes: baseNodes, edges: baseEdges } = generateSyntheticTopology(500);
    const { nodes: candNodes, edges: candEdges } = generateSyntheticTopology(520);

    const baseSnapshot: ArchitectureSnapshot = {
      id: "snap-bench-500",
      revision: "rev-500",
      schemaVersion: 1,
      title: "500 Node Base",
      nodes: baseNodes,
      edges: baseEdges,
      createdAt: new Date().toISOString(),
      provenance: "saved-version",
    };

    const candSnapshot: ArchitectureSnapshot = {
      id: "snap-bench-cand-500",
      revision: "rev-cand-500",
      schemaVersion: 1,
      title: "520 Node Candidate",
      nodes: candNodes,
      edges: candEdges,
      createdAt: new Date().toISOString(),
      provenance: "what-if-proposal",
    };

    const start = performance.now();
    const hash = RevisionManager.computeSnapshotHash(candSnapshot);
    expect(hash).toBeDefined();

    const review = architectureReviewEngine.createReview({
      projectId: "bench-proj",
      architectureId: "bench-arch-500",
      authorId: "user-bench",
      authorName: "Benchmarker",
      title: "500-Node Scale Review",
      description: "Scale test.",
      baselineSnapshot: baseSnapshot,
      candidateSnapshot: candSnapshot,
    });

    const rebaseAnalysis = RevisionManager.analyzeRebase(review, baseSnapshot);
    const duration = performance.now() - start;

    expect(rebaseAnalysis.isConflictFree).toBe(true);
    expect(duration).toBeLessThan(100);
  });

  it("benchmarks 1,000-node graph review lifecycle under 250ms", () => {
    const { nodes: baseNodes, edges: baseEdges } = generateSyntheticTopology(1000);
    const { nodes: candNodes, edges: candEdges } = generateSyntheticTopology(1010);

    const baseSnapshot: ArchitectureSnapshot = {
      id: "snap-bench-1000",
      revision: "rev-1000",
      schemaVersion: 1,
      title: "1,000 Node Base",
      nodes: baseNodes,
      edges: baseEdges,
      createdAt: new Date().toISOString(),
      provenance: "saved-version",
    };

    const candSnapshot: ArchitectureSnapshot = {
      id: "snap-bench-cand-1000",
      revision: "rev-cand-1000",
      schemaVersion: 1,
      title: "1,010 Node Candidate",
      nodes: candNodes,
      edges: candEdges,
      createdAt: new Date().toISOString(),
      provenance: "what-if-proposal",
    };

    const start = performance.now();

    const review = architectureReviewEngine.createReview({
      projectId: "bench-proj",
      architectureId: "bench-arch-1000",
      authorId: "user-bench",
      authorName: "Benchmarker",
      title: "1,000-Node Scale Review",
      description: "Scale test.",
      baselineSnapshot: baseSnapshot,
      candidateSnapshot: candSnapshot,
      policy: {
        minApprovals: 1,
        allowSelfApproval: false,
        requireAllChecksPassed: false,
        requireResolvedThreads: false,
      },
    });

    architectureReviewEngine.submitReview(review.id, { id: "user-bench", name: "Benchmarker" });

    architectureReviewEngine.recordDecision(review.id, {
      reviewerId: "user-lead",
      reviewerName: "Lead",
      reviewerRole: "lead_architect",
      decision: "approve",
    });

    const { result } = architectureReviewEngine.applyProposal(review.id, baseSnapshot, {
      id: "user-lead",
      name: "Lead",
    });

    const duration = performance.now() - start;

    expect(result.success).toBe(true);
    expect(result.nodesAppliedCount).toBe(1010);
    expect(duration).toBeLessThan(250);
  });
});
