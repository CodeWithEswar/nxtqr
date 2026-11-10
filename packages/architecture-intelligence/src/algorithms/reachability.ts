/**
 * Reachability algorithms for dependency and communication graphs
 */

export interface ReachabilityResult {
  reachableNodes: Set<string>;
  distances: Map<string, number>;
  predecessors: Map<string, string | null>;
}

export function computeReachability(
  startNodeIds: string[],
  adjList: Map<string, string[]>
): ReachabilityResult {
  const reachableNodes = new Set<string>();
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();

  const queue: string[] = [];

  for (const startId of startNodeIds) {
    if (!reachableNodes.has(startId)) {
      reachableNodes.add(startId);
      distances.set(startId, 0);
      predecessors.set(startId, null);
      queue.push(startId);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current) ?? 0;
    const neighbors = adjList.get(current) || [];

    for (const neighbor of neighbors) {
      if (!reachableNodes.has(neighbor)) {
        reachableNodes.add(neighbor);
        distances.set(neighbor, currentDist + 1);
        predecessors.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  return { reachableNodes, distances, predecessors };
}

/**
 * Checks if a path exists between source and target
 */
export function hasPath(
  sourceId: string,
  targetId: string,
  adjList: Map<string, string[]>
): boolean {
  if (sourceId === targetId) return true;
  const { reachableNodes } = computeReachability([sourceId], adjList);
  return reachableNodes.has(targetId);
}
