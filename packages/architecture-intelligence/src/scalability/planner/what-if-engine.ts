import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { WorkloadScenario } from "../../bottlenecks/contracts/bottleneck.types";
import type { ScalabilityRecommendation, WhatIfPlan } from "../schemas/scalability.schemas";
import { GraphProposalApplier } from "./graph-proposals";
import { ScenarioComparator } from "./scenario-comparison";

export class WhatIfEngine {
  public static createPlan(
    originalNodes: BaseNode[],
    originalEdges: BaseEdge[],
    recommendation: ScalabilityRecommendation,
    scenario: WorkloadScenario
  ): {
    plan: WhatIfPlan;
    proposedNodes: BaseNode[];
    proposedEdges: BaseEdge[];
  } {
    // 1. Apply operations non-destructively
    const { nodes: proposedNodes, edges: proposedEdges, isValidated, validationErrors } =
      GraphProposalApplier.applyOperations(
        originalNodes,
        originalEdges,
        recommendation.proposedOperations
      );

    // 2. Compare before and after under scenario
    const comparison = ScenarioComparator.compare(
      originalNodes,
      originalEdges,
      proposedNodes,
      proposedEdges,
      scenario
    );

    const plan: WhatIfPlan = {
      id: `plan_${recommendation.id}`,
      recommendationId: recommendation.id,
      title: `What-If Plan: ${recommendation.title}`,
      originalGraphRevision: `${originalNodes.length}_${originalEdges.length}`,
      operations: recommendation.proposedOperations,
      comparison,
      isValidated,
      validationErrors,
    };

    return {
      plan,
      proposedNodes,
      proposedEdges,
    };
  }
}
