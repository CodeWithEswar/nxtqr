import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  ArchitectureReview,
  ArchitectureReviewRevision,
  RebaseAnalysisResult,
  ReviewAuditEvent,
} from "../contracts/review.types";
import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";

export class RevisionManager {
  public static computeSnapshotHash(snapshot: ArchitectureSnapshot): string {
    const nodeKeys = snapshot.nodes
      .map((n) => `${n.id}:${n.type}:${JSON.stringify(n.data || {})}`)
      .sort()
      .join("|");
    const edgeKeys = snapshot.edges
      .map((e) => `${e.id}:${e.source}->${e.target}:${JSON.stringify(e.data || {})}`)
      .sort()
      .join("|");

    const raw = `${snapshot.revision}#${nodeKeys}#${edgeKeys}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `hash-${Math.abs(hash).toString(16)}`;
  }

  public static createRevision(
    review: ArchitectureReview,
    newCandidateSnapshot: ArchitectureSnapshot,
    authorId: string,
    changeSummary: string
  ): ArchitectureReview {
    const nextRevNumber = review.currentRevisionNumber + 1;
    const contentHash = this.computeSnapshotHash(newCandidateSnapshot);
    const now = new Date().toISOString();

    const newRevision: ArchitectureReviewRevision = {
      id: `rev-${review.id}-${nextRevNumber}`,
      reviewId: review.id,
      revisionNumber: nextRevNumber,
      candidateSnapshot: newCandidateSnapshot,
      contentHash,
      changeSummary,
      createdAt: now,
      authorId,
    };

    // Stale check marking
    const staleChecks = review.checks.map((chk) => ({
      ...chk,
      status: "stale" as const,
    }));

    const auditEvent: ReviewAuditEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      reviewId: review.id,
      revisionNumber: nextRevNumber,
      action: `revision_created:v${nextRevNumber}`,
      actorId: authorId,
      actorName: authorId,
      payload: { changeSummary, contentHash },
      timestamp: now,
    };

    // If policy invalidates approvals, revert to 'open' if it was approved/ready_to_apply/changes_requested
    let nextStatus = review.status;
    if (
      review.policy.invalidateApprovalsOnRevision &&
      ["approved", "ready_to_apply", "changes_requested"].includes(review.status)
    ) {
      nextStatus = "open";
    }

    return {
      ...review,
      currentRevisionNumber: nextRevNumber,
      revisions: [...review.revisions, newRevision],
      status: nextStatus,
      checks: staleChecks,
      updatedAt: now,
      auditTrail: [auditEvent, ...review.auditTrail],
    };
  }

  public static analyzeRebase(
    review: ArchitectureReview,
    currentLiveSnapshot: ArchitectureSnapshot
  ): RebaseAnalysisResult {
    const baseline = review.baselineSnapshot;
    const isBaselineCurrent = baseline.revision === currentLiveSnapshot.revision;

    if (isBaselineCurrent) {
      return {
        isConflictFree: true,
        baselineRevision: baseline.revision,
        currentLiveRevision: currentLiveSnapshot.revision,
        divergedNodeIds: [],
        divergedEdgeIds: [],
        conflictingOperations: [],
      };
    }

    const currentCandidate =
      review.revisions.find((r) => r.revisionNumber === review.currentRevisionNumber)
        ?.candidateSnapshot || review.baselineSnapshot;

    // Detect live divergence from original review baseline
    const baselineNodeMap = new Map(baseline.nodes.map((n) => [n.id, n]));
    const liveNodeMap = new Map(currentLiveSnapshot.nodes.map((n) => [n.id, n]));
    const candidateNodeMap = new Map(currentCandidate.nodes.map((n) => [n.id, n]));

    const divergedNodeIds: string[] = [];
    const conflictingOperations: string[] = [];

    for (const [id, liveNode] of liveNodeMap.entries()) {
      const baseNode = baselineNodeMap.get(id);
      const candNode = candidateNodeMap.get(id);

      // Node was modified in live
      if (baseNode && JSON.stringify(baseNode.data) !== JSON.stringify(liveNode.data)) {
        divergedNodeIds.push(id);
        // If candidate also modified or deleted it, conflict!
        if (candNode && JSON.stringify(candNode.data) !== JSON.stringify(baseNode.data)) {
          conflictingOperations.push(
            `Conflict on node '${liveNode.data?.label || id}': modified in live branch and proposed candidate simultaneously.`
          );
        } else if (!candNode) {
          conflictingOperations.push(
            `Conflict on node '${liveNode.data?.label || id}': modified in live branch but removed in candidate.`
          );
        }
      }
    }

    const isConflictFree = conflictingOperations.length === 0;

    // Construct rebased candidate if conflict-free
    let rebasedCandidate: ArchitectureSnapshot | undefined = undefined;
    if (isConflictFree) {
      // Apply candidate mutations onto currentLiveSnapshot
      const mergedNodes: BaseNode[] = [];
      const visitedIds = new Set<string>();

      for (const candNode of currentCandidate.nodes) {
        mergedNodes.push(candNode);
        visitedIds.add(candNode.id);
      }

      for (const liveNode of currentLiveSnapshot.nodes) {
        if (!visitedIds.has(liveNode.id) && !baselineNodeMap.has(liveNode.id)) {
          // New node added to live that candidate didn't know about -> preserve it
          mergedNodes.push(liveNode);
        }
      }

      rebasedCandidate = {
        ...currentCandidate,
        revision: `${currentLiveSnapshot.revision}-rebased`,
        nodes: mergedNodes,
        edges: currentCandidate.edges,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      isConflictFree,
      baselineRevision: baseline.revision,
      currentLiveRevision: currentLiveSnapshot.revision,
      divergedNodeIds,
      divergedEdgeIds: [],
      conflictingOperations,
      rebasedCandidate,
    };
  }
}
