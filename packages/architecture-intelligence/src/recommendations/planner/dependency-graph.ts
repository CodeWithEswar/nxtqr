import type { UnifiedRecommendation } from "../contracts/recommendations.types";

export interface DependencyGraphResult {
  hasCycles: boolean;
  cycles: string[][];
  orderedRecommendationIds: string[];
  invalidDependencies: { recommendationId: string; missingDependencyId: string }[];
}

export class RecommendationDependencyGraph {
  public static resolveOrder(
    recommendations: UnifiedRecommendation[]
  ): DependencyGraphResult {
    const recMap = new Map<string, UnifiedRecommendation>(
      recommendations.map((r) => [r.id, r])
    );

    const adj = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();
    const invalidDependencies: { recommendationId: string; missingDependencyId: string }[] = [];

    for (const rec of recommendations) {
      adj.set(rec.id, new Set());
      inDegree.set(rec.id, 0);
    }

    // Populate edges: if Rec B depends on Rec A (Rec A must precede Rec B), edge A -> B
    for (const rec of recommendations) {
      for (const depId of rec.dependsOn) {
        if (!recMap.has(depId)) {
          invalidDependencies.push({
            recommendationId: rec.id,
            missingDependencyId: depId,
          });
          continue;
        }

        adj.get(depId)!.add(rec.id);
        inDegree.set(rec.id, (inDegree.get(rec.id) || 0) + 1);
      }
    }

    // Kahn's algorithm for topological sorting
    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    const ordered: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      ordered.push(u);

      for (const v of adj.get(u) || []) {
        inDegree.set(v, inDegree.get(v)! - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    const hasCycles = ordered.length < recommendations.length;
    const cycles: string[][] = [];

    if (hasCycles) {
      // Find remaining nodes with inDegree > 0 to identify cycle members
      const cycleNodes = Array.from(inDegree.entries())
        .filter(([_, deg]) => deg > 0)
        .map(([id]) => id);
      cycles.push(cycleNodes);
    }

    return {
      hasCycles,
      cycles,
      orderedRecommendationIds: ordered,
      invalidDependencies,
    };
  }
}
