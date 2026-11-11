import { describe, it, expect, beforeEach } from "vitest";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import {
  architectureReviewEngine,
  architectureToolRegistry,
  ReviewCheckRunner,
  ADRManager,
} from "../index";

const baseNodes: BaseNode[] = [
  {
    id: "edge-alb",
    type: "loadBalancer",
    position: { x: 0, y: 0 },
    data: { label: "Ingress ALB", category: "gateway", replicas: 2 },
  },
  {
    id: "order-svc",
    type: "service",
    position: { x: 250, y: 0 },
    data: { label: "Order Service", category: "compute", replicas: 4, technology: "Go" },
  },
  {
    id: "postgres-db",
    type: "database",
    position: { x: 500, y: 0 },
    data: { label: "PostgreSQL Database", category: "database", replicas: 1 },
  },
];

const baseEdges: BaseEdge[] = [
  {
    id: "e-alb-order",
    source: "edge-alb",
    target: "order-svc",
    data: { protocol: "HTTPS", isSynchronous: true, isEncrypted: true },
  },
  {
    id: "e-order-db",
    source: "order-svc",
    target: "postgres-db",
    data: { protocol: "PostgreSQL", isSynchronous: true, isEncrypted: true },
  },
];

const baselineSnapshot: ArchitectureSnapshot = {
  id: "snap-base-prod",
  projectId: "proj-ecommerce",
  architectureId: "arch-ecommerce",
  title: "Production Architecture v2.0",
  revision: "v2.0.0",
  schemaVersion: 1,
  nodes: baseNodes,
  edges: baseEdges,
  createdAt: new Date().toISOString(),
  provenance: "saved-version",
};

const candidateSnapshot: ArchitectureSnapshot = {
  id: "snap-cand-proposal",
  projectId: "proj-ecommerce",
  architectureId: "arch-ecommerce",
  title: "Proposed Redis Caching & DB Read Replica",
  revision: "v2.1.0-proposal",
  schemaVersion: 1,
  nodes: [
    ...baseNodes,
    {
      id: "redis-cluster",
      type: "cache",
      position: { x: 380, y: -100 },
      data: { label: "Redis Cache Cluster", category: "cache", replicas: 3 },
    },
  ],
  edges: [
    ...baseEdges,
    {
      id: "e-order-redis",
      source: "order-svc",
      target: "redis-cluster",
      data: { protocol: "Redis-TLS", isSynchronous: true, isEncrypted: true },
    },
  ],
  createdAt: new Date().toISOString(),
  provenance: "what-if-proposal",
};

describe("Architecture Reviews Integration Suite", () => {
  beforeEach(() => {
    architectureReviewEngine.clearStore();
  });

  it("runs automated review checks across validation, health, SPOF, security, and reliability", async () => {
    const checks = await ReviewCheckRunner.runAllChecks(baselineSnapshot, candidateSnapshot);
    expect(checks.length).toBeGreaterThanOrEqual(4);

    const checkCategories = checks.map((c) => c.category);
    expect(checkCategories).toContain("validation");
    expect(checkCategories).toContain("health");
    expect(checkCategories).toContain("spof");
    expect(checkCategories).toContain("security");

    // Checks return valid status semantics
    for (const chk of checks) {
      expect(["passed", "warning", "failed", "info", "unavailable", "stale"]).toContain(chk.status);
    }
  });

  it("links Architecture Decision Records (ADRs) to accepted reviews", () => {
    const adrManager = new ADRManager();
    const adr = adrManager.createADR({
      title: "Adopt Redis for Sub-10ms Session Retrieval",
      status: "accepted",
      context: "Heavy database load during holiday peak traffic.",
      decision: "Deploy a 3-node Redis cluster in AWS us-east-1.",
      consequences: {
        positive: ["Decreases DB read load by 60%"],
        negative: ["Additional cache invalidation complexity"],
      },
      alternativesConsidered: [],
      relatedComponentIds: ["redis-cluster"],
      relatedFindingIds: [],
      author: "Alice Architect",
    });

    const review = architectureReviewEngine.createReview({
      projectId: "proj-ecommerce",
      architectureId: "arch-ecommerce",
      authorId: "user-alice",
      authorName: "Alice Architect",
      title: "Introduce Redis Cache",
      description: "Performance and capacity scaling proposal.",
      baselineSnapshot,
      candidateSnapshot,
      relatedAdrIds: [adr.id],
    });

    expect(review.relatedAdrIds).toContain(adr.id);

    // Link another ADR later
    const updatedReview = architectureReviewEngine.linkADR(review.id, "adr-0002");
    expect(updatedReview.relatedAdrIds).toContain("adr-0002");
  });

  it("detects conflict-free rebase when live branch adds non-conflicting components", () => {
    const review = architectureReviewEngine.createReview({
      projectId: "proj-ecommerce",
      architectureId: "arch-ecommerce",
      authorId: "user-alice",
      authorName: "Alice Architect",
      title: "Rebase Test Proposal",
      description: "Rebase test.",
      baselineSnapshot,
      candidateSnapshot,
    });

    // Live branch adds analytics queue without modifying order-svc or postgres-db
    const divergedLiveSnapshot: ArchitectureSnapshot = {
      ...baselineSnapshot,
      revision: "v2.0.1-live",
      nodes: [
        ...baseNodes,
        {
          id: "sqs-analytics",
          type: "queue",
          position: { x: 500, y: 150 },
          data: { label: "Analytics Queue", replicas: 1 },
        },
      ],
    };

    const rebasedReview = architectureReviewEngine.rebaseReview(
      review.id,
      divergedLiveSnapshot,
      { id: "user-alice", name: "Alice" }
    );

    expect(rebasedReview.status).toBe("open");
    expect(rebasedReview.baselineSnapshot.revision).toBe("v2.0.1-live");
    expect(rebasedReview.currentRevisionNumber).toBe(2);

    // Active candidate should contain both Redis and the new analytics queue!
    const activeCandidate = rebasedReview.revisions[1].candidateSnapshot;
    const nodeIds = activeCandidate.nodes.map((n) => n.id);
    expect(nodeIds).toContain("redis-cluster");
    expect(nodeIds).toContain("sqs-analytics");
  });

  it("executes AI Architecture Assistant Tool #17 'review_architecture_proposal'", async () => {
    const result = await architectureToolRegistry.executeTool(
      "review_architecture_proposal",
      {
        reviewTitle: "Copilot Review: Redis Cache Integration",
        description: "Checking whether proposed Redis addition satisfies reliability and security gates.",
      },
      {
        projectId: "proj-ecommerce",
        architectureId: "arch-ecommerce",
        graphRevision: "v2.0.0",
        nodes: candidateSnapshot.nodes,
        edges: candidateSnapshot.edges,
      }
    );

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    const data = result.result as Record<string, any>;
    expect(data.totalChecksEvaluated).toBeGreaterThanOrEqual(4);
    expect(["ready_for_review", "blocked"]).toContain(data.readiness);
    expect(data.checks.length).toBeGreaterThanOrEqual(4);
  });
});
