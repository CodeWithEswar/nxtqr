/**
 * Cycle Detection & Tarjan's Strongly Connected Components (SCC)
 */

export interface SccResult {
  sccs: string[][]; // Array of strongly connected components
  cycles: string[][]; // Cycles with 2 or more vertices
}

export function computeStronglyConnectedComponents(
  nodeIds: string[],
  adjList: Map<string, string[]>
): SccResult {
  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const neighbors = adjList.get(v) || [];
    for (const w of neighbors) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
      } else if (onStack.has(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (const nodeId of nodeIds) {
    if (!indices.has(nodeId)) {
      strongConnect(nodeId);
    }
  }

  // Cycles are SCCs with > 1 vertex, or single vertex with a self-loop
  const cycles: string[][] = [];
  for (const scc of sccs) {
    if (scc.length > 1) {
      cycles.push(scc);
    } else if (scc.length === 1) {
      const single = scc[0];
      const neighbors = adjList.get(single) || [];
      if (neighbors.includes(single)) {
        cycles.push(scc);
      }
    }
  }

  return { sccs, cycles };
}
