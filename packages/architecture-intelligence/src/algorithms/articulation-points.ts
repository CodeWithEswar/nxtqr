/**
 * Hopcroft-Tarjan Articulation Points & Cut Vertices
 * Used to identify architectural Single Points of Failure (SPOFs)
 */

export interface ArticulationResult {
  articulationPoints: Set<string>;
  bridges: Array<{ u: string; v: string }>;
}

export function findArticulationPoints(
  nodeIds: string[],
  undirectedAdj: Map<string, string[]>
): ArticulationResult {
  let time = 0;
  const visited = new Set<string>();
  const discovery = new Map<string, number>();
  const low = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const articulationPoints = new Set<string>();
  const bridges: Array<{ u: string; v: string }> = [];

  function dfs(u: string) {
    visited.add(u);
    time++;
    discovery.set(u, time);
    low.set(u, time);
    let children = 0;

    const neighbors = undirectedAdj.get(u) || [];
    for (const v of neighbors) {
      if (v === parent.get(u)) continue;

      if (visited.has(v)) {
        low.set(u, Math.min(low.get(u)!, discovery.get(v)!));
      } else {
        children++;
        parent.set(v, u);
        dfs(v);

        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        // u is an articulation point if:
        // 1. u is root of DFS tree and has two or more children
        if (parent.get(u) === null && children > 1) {
          articulationPoints.add(u);
        }

        // 2. u is not root of DFS tree and low[v] >= discovery[u]
        if (parent.get(u) !== null && low.get(v)! >= discovery.get(u)!) {
          articulationPoints.add(u);
        }

        // Bridge check
        if (low.get(v)! > discovery.get(u)!) {
          bridges.push({ u, v });
        }
      }
    }
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      parent.set(nodeId, null);
      dfs(nodeId);
    }
  }

  return { articulationPoints, bridges };
}
