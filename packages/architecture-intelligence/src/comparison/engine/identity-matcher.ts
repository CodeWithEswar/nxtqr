import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { MatchResolution, NodeMatchCandidate } from "../contracts/comparison.types";

export interface IdentityMatcherOptions {
  allowHeuristicMatching?: boolean;
  minSimilarityThreshold?: number; // 0 to 1, default 0.75
  explicitNodeMapping?: Map<string, string>; // baselineNodeId -> candidateNodeId
}

export class IdentityMatcher {
  public static match(
    baselineNodes: BaseNode[],
    candidateNodes: BaseNode[],
    baselineEdges: BaseEdge[],
    candidateEdges: BaseEdge[],
    options: IdentityMatcherOptions = {}
  ): MatchResolution {
    const {
      allowHeuristicMatching = true,
      minSimilarityThreshold = 0.75,
      explicitNodeMapping,
    } = options;

    const matchedNodePairs = new Map<string, string>();
    const matchedEdgePairs = new Map<string, string>();
    const candidateNodesById = new Map<string, BaseNode>(candidateNodes.map((n) => [n.id, n]));
    const matchedCandidateNodeIds = new Set<string>();
    const matchedBaselineNodeIds = new Set<string>();

    // 1. Explicit user-provided mapping first
    if (explicitNodeMapping) {
      for (const [baseId, candId] of explicitNodeMapping.entries()) {
        if (candidateNodesById.has(candId)) {
          matchedNodePairs.set(baseId, candId);
          matchedBaselineNodeIds.add(baseId);
          matchedCandidateNodeIds.add(candId);
        }
      }
    }

    // 2. Stable ID Matching (Exact ID match with compatible component type)
    for (const bNode of baselineNodes) {
      if (matchedBaselineNodeIds.has(bNode.id)) continue;

      const cNode = candidateNodesById.get(bNode.id);
      if (cNode && !matchedCandidateNodeIds.has(cNode.id)) {
        const bComp = (bNode.data?.componentType as string) || bNode.type;
        const cComp = (cNode.data?.componentType as string) || cNode.type;

        // If types are identical or compatible, accept exact ID match
        if (bComp === cComp || !bComp || !cComp) {
          matchedNodePairs.set(bNode.id, cNode.id);
          matchedBaselineNodeIds.add(bNode.id);
          matchedCandidateNodeIds.add(cNode.id);
        }
      }
    }

    // 3. Bounded Heuristic Matching for unmatched nodes
    const uncertainNodeMatches: NodeMatchCandidate[] = [];

    if (allowHeuristicMatching) {
      const remainingBaseline = baselineNodes.filter((n) => !matchedBaselineNodeIds.has(n.id));
      const remainingCandidate = candidateNodes.filter((n) => !matchedCandidateNodeIds.has(n.id));

      for (const bNode of remainingBaseline) {
        let bestCandidate: BaseNode | null = null;
        let bestScore = 0;
        let bestCriteria: string[] = [];

        for (const cNode of remainingCandidate) {
          if (matchedCandidateNodeIds.has(cNode.id)) continue;

          const { score, criteria } = this.calculateNodeSimilarity(
            bNode,
            cNode,
            baselineEdges,
            candidateEdges
          );

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = cNode;
            bestCriteria = criteria;
          }
        }

        if (bestCandidate && bestScore >= minSimilarityThreshold) {
          if (bestScore >= 0.9) {
            // High confidence automatic match
            matchedNodePairs.set(bNode.id, bestCandidate.id);
            matchedBaselineNodeIds.add(bNode.id);
            matchedCandidateNodeIds.add(bestCandidate.id);
          } else {
            // Suggest as uncertain match for user review, do NOT silently merge
            uncertainNodeMatches.push({
              baselineNodeId: bNode.id,
              candidateNodeId: bestCandidate.id,
              confidence: bestScore >= 0.8 ? "heuristic" : "uncertain",
              similarityScore: Math.round(bestScore * 100) / 100,
              matchCriteria: bestCriteria,
            });
          }
        }
      }
    }

    // 4. Edge Matching based on resolved Node endpoints
    const candidateEdgesById = new Map<string, BaseEdge>(candidateEdges.map((e) => [e.id, e]));
    const matchedCandidateEdgeIds = new Set<string>();
    const matchedBaselineEdgeIds = new Set<string>();

    for (const bEdge of baselineEdges) {
      // Direct exact edge ID match
      const cEdgeDirect = candidateEdgesById.get(bEdge.id);
      if (cEdgeDirect && !matchedCandidateEdgeIds.has(cEdgeDirect.id)) {
        matchedEdgePairs.set(bEdge.id, cEdgeDirect.id);
        matchedBaselineEdgeIds.add(bEdge.id);
        matchedCandidateEdgeIds.add(cEdgeDirect.id);
        continue;
      }

      // Endpoint-based correspondence: source & target mapped
      const mappedSource = matchedNodePairs.get(bEdge.source);
      const mappedTarget = matchedNodePairs.get(bEdge.target);

      if (mappedSource && mappedTarget) {
        const cEdgeMatch = candidateEdges.find(
          (ce) =>
            !matchedCandidateEdgeIds.has(ce.id) &&
            ce.source === mappedSource &&
            ce.target === mappedTarget &&
            ce.sourceHandle === bEdge.sourceHandle &&
            ce.targetHandle === bEdge.targetHandle
        );

        if (cEdgeMatch) {
          matchedEdgePairs.set(bEdge.id, cEdgeMatch.id);
          matchedBaselineEdgeIds.add(bEdge.id);
          matchedCandidateEdgeIds.add(cEdgeMatch.id);
        }
      }
    }

    const unmatchedBaselineNodeIds = baselineNodes
      .filter((n) => !matchedBaselineNodeIds.has(n.id))
      .map((n) => n.id);

    const unmatchedCandidateNodeIds = candidateNodes
      .filter((n) => !matchedCandidateNodeIds.has(n.id))
      .map((n) => n.id);

    const unmatchedBaselineEdgeIds = baselineEdges
      .filter((e) => !matchedBaselineEdgeIds.has(e.id))
      .map((e) => e.id);

    const unmatchedCandidateEdgeIds = candidateEdges
      .filter((e) => !matchedCandidateEdgeIds.has(e.id))
      .map((e) => e.id);

    return {
      matchedNodePairs,
      matchedEdgePairs,
      unmatchedBaselineNodeIds,
      unmatchedCandidateNodeIds,
      unmatchedBaselineEdgeIds,
      unmatchedCandidateEdgeIds,
      uncertainNodeMatches,
    };
  }

  private static calculateNodeSimilarity(
    bNode: BaseNode,
    cNode: BaseNode,
    bEdges: BaseEdge[],
    cEdges: BaseEdge[]
  ): { score: number; criteria: string[] } {
    let score = 0;
    const criteria: string[] = [];

    const bComp = (bNode.data?.componentType as string) || bNode.type;
    const cComp = (cNode.data?.componentType as string) || cNode.type;

    // Component Type Match (Weight: 0.40)
    if (bComp === cComp) {
      score += 0.4;
      criteria.push(`Same component type (${bComp})`);
    } else {
      return { score: 0, criteria: [] }; // Incompatible component types never match
    }

    // Label Match (Weight: 0.30)
    const bLabel = (bNode.label || "").trim().toLowerCase();
    const cLabel = (cNode.label || "").trim().toLowerCase();
    if (bLabel && cLabel && bLabel === cLabel) {
      score += 0.3;
      criteria.push(`Exact label match ("${bNode.label}")`);
    } else if (bLabel && cLabel && (bLabel.includes(cLabel) || cLabel.includes(bLabel))) {
      score += 0.15;
      criteria.push("Partial label overlap");
    }

    // Port Match (Weight: 0.15)
    const bPorts = bNode.ports?.map((p) => p.id).sort().join(",") || "";
    const cPorts = cNode.ports?.map((p) => p.id).sort().join(",") || "";
    if (bPorts && cPorts && bPorts === cPorts) {
      score += 0.15;
      criteria.push("Identical port configuration");
    }

    // Neighborhood Degree Match (Weight: 0.15)
    const bDegree = bEdges.filter((e) => e.source === bNode.id || e.target === bNode.id).length;
    const cDegree = cEdges.filter((e) => e.source === cNode.id || e.target === cNode.id).length;
    if (bDegree === cDegree && bDegree > 0) {
      score += 0.15;
      criteria.push(`Matching connectivity degree (${bDegree} connections)`);
    }

    return { score, criteria };
  }
}

