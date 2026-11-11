/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Cycle Detector for Analyzer Dependency Graphs
 */

export interface CycleDetectionResult {
  hasCycles: boolean;
  cyclePath?: string[];
}

export class DependencyCycleDetector {
  /**
   * Detects cycles in a directed graph represented by an adjacency map (id -> array of dependency IDs).
   * Uses Tarjan/DFS coloring: 0 = unvisited, 1 = visiting (in recursion stack), 2 = visited.
   */
  public static detectCycles(adjacency: Map<string, string[]>): CycleDetectionResult {
    const state = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
    const parent = new Map<string, string | null>();

    for (const node of adjacency.keys()) {
      state.set(node, 0);
    }

    for (const node of adjacency.keys()) {
      if (state.get(node) === 0) {
        const cycle = this.dfs(node, adjacency, state, parent);
        if (cycle) {
          return {
            hasCycles: true,
            cyclePath: cycle,
          };
        }
      }
    }

    return { hasCycles: false };
  }

  private static dfs(
    current: string,
    adjacency: Map<string, string[]>,
    state: Map<string, number>,
    parent: Map<string, string | null>
  ): string[] | null {
    state.set(current, 1); // visiting

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      const neighborState = state.get(neighbor) ?? 0;

      if (neighborState === 1) {
        // Cycle detected! Reconstruct path
        const cycle: string[] = [neighbor, current];
        let curr: string | null = current;
        while (curr && parent.get(curr) && parent.get(curr) !== neighbor) {
          curr = parent.get(curr)!;
          cycle.push(curr);
        }
        cycle.push(neighbor);
        return cycle.reverse();
      }

      if (neighborState === 0) {
        parent.set(neighbor, current);
        const result = this.dfs(neighbor, adjacency, state, parent);
        if (result) return result;
      }
    }

    state.set(current, 2); // visited
    return null;
  }
}
