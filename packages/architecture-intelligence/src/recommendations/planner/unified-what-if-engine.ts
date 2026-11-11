import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { UnifiedRecommendation } from "../contracts/recommendations.types";
import { GraphProposalApplier } from "../../scalability/planner/graph-proposals";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";

export interface UnifiedWhatIfPreview {
  recommendationId: string;
  originalNodes: BaseNode[];
  originalEdges: BaseEdge[];
  proposedNodes: BaseNode[];
  proposedEdges: BaseEdge[];
  addedNodes: BaseNode[];
  removedNodeIds: string[];
  addedEdges: BaseEdge[];
  removedEdgeIds: string[];
  modifiedNodes: BaseNode[];
  isValidated: boolean;
  validationErrors: string[];
}

export class UnifiedWhatIfEngine {
  public static previewRecommendation(
    originalNodes: BaseNode[],
    originalEdges: BaseEdge[],
    recommendation: UnifiedRecommendation
  ): UnifiedWhatIfPreview {
    // 1. Apply operations non-destructively
    const result = GraphProposalApplier.applyOperations(
      originalNodes,
      originalEdges,
      recommendation.proposedOperations
    );

    const originalNodeIds = new Set(originalNodes.map((n) => n.id));
    const originalEdgeIds = new Set(originalEdges.map((e) => e.id));

    const proposedNodeIds = new Set(result.nodes.map((n) => n.id));
    const proposedEdgeIds = new Set(result.edges.map((e) => e.id));

    // Identify diffs
    const addedNodes = result.nodes.filter((n) => !originalNodeIds.has(n.id));
    const removedNodeIds = originalNodes
      .filter((n) => !proposedNodeIds.has(n.id))
      .map((n) => n.id);

    const addedEdges = result.edges.filter((e) => !originalEdgeIds.has(e.id));
    const removedEdgeIds = originalEdges
      .filter((e) => !proposedEdgeIds.has(e.id))
      .map((e) => e.id);

    const modifiedNodes = result.nodes.filter((n) => {
      if (!originalNodeIds.has(n.id)) return false;
      const original = originalNodes.find((orig) => orig.id === n.id);
      return JSON.stringify(original?.data) !== JSON.stringify(n.data);
    });

    // Run architecture validation on the proposed graph
    const valResult = architectureValidationEngine.validateGraph(result.nodes, result.edges);
    const errors = (valResult.findings || [])
      .filter((d) => d.severity === "error")
      .map((d) => `[${d.ruleId}] ${d.message}`);

    return {
      recommendationId: recommendation.id,
      originalNodes,
      originalEdges,
      proposedNodes: result.nodes,
      proposedEdges: result.edges,
      addedNodes,
      removedNodeIds,
      addedEdges,
      removedEdgeIds,
      modifiedNodes,
      isValidated: errors.length === 0,
      validationErrors: errors,
    };
  }
}
