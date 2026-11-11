import type {
  UnifiedRecommendation,
  ImprovementPlan,
  ImprovementPlanStep,
  RecommendationConflict,
} from "../contracts/recommendations.types";
import { RecommendationDependencyGraph } from "./dependency-graph";

export class ImprovementPlanner {
  public static createPlan(
    selectedRecommendations: UnifiedRecommendation[],
    conflicts: RecommendationConflict[]
  ): ImprovementPlan {
    const recMap = new Map<string, UnifiedRecommendation>(
      selectedRecommendations.map((r) => [r.id, r])
    );

    // 1. Resolve dependency order
    const depResult = RecommendationDependencyGraph.resolveOrder(selectedRecommendations);

    // Filter relevant conflicts for selected recommendations
    const selectedIds = new Set(selectedRecommendations.map((r) => r.id));
    const activeConflicts = conflicts.filter(
      (c) => selectedIds.has(c.recommendationAId) && selectedIds.has(c.recommendationBId)
    );

    // Build ordered steps
    const completedIds = new Set<string>();
    const orderedSteps: ImprovementPlanStep[] = [];
    let totalOperations = 0;

    // Use topological order first, then any cycle nodes
    const processOrder = [
      ...depResult.orderedRecommendationIds,
      ...selectedRecommendations
        .map((r) => r.id)
        .filter((id) => !depResult.orderedRecommendationIds.includes(id)),
    ];

    let stepIndex = 1;
    for (const recId of processOrder) {
      const rec = recMap.get(recId);
      if (!rec) continue;

      const prerequisitesMet = rec.dependsOn.every((depId) => completedIds.has(depId));
      completedIds.add(rec.id);
      totalOperations += rec.proposedOperations.length;

      orderedSteps.push({
        stepNumber: stepIndex++,
        recommendationId: rec.id,
        title: rec.title,
        strategyId: rec.strategyId,
        operations: rec.proposedOperations,
        prerequisitesMet,
        affectedNodeIds: rec.affectedNodeIds,
      });
    }

    // Determine plan complexity
    let estimatedComplexity: "low" | "medium" | "high" = "low";
    if (totalOperations > 6 || selectedRecommendations.length > 3) {
      estimatedComplexity = "high";
    } else if (totalOperations > 2 || selectedRecommendations.length > 1) {
      estimatedComplexity = "medium";
    }

    const isExecutable =
      !depResult.hasCycles &&
      activeConflicts.length === 0 &&
      orderedSteps.every((s) => s.prerequisitesMet);

    return {
      id: `plan_${Date.now()}`,
      targetRecommendationIds: selectedRecommendations.map((r) => r.id),
      orderedSteps,
      totalOperations,
      hasConflicts: activeConflicts.length > 0,
      conflicts: activeConflicts,
      hasCycles: depResult.hasCycles,
      cycles: depResult.cycles,
      estimatedComplexity,
      isExecutable,
    };
  }
}
