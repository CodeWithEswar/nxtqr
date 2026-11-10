/**
 * Critical Paths & Longest Synchronous Path Detection
 */

export interface PathSegment {
  nodeId: string;
  latencyMs?: number;
}

export interface CriticalPath {
  nodeIds: string[];
  depth: number;
  totalEstimatedLatencyMs: number;
  isSynchronous: boolean;
}

export function findLongestPaths(
  sourceNodeIds: string[],
  adjList: Map<string, Array<{ targetId: string; isSynchronous: boolean; latencyMs?: number }>>,
  maxSearchDepth: number = 20
): CriticalPath[] {
  const allPaths: CriticalPath[] = [];

  function dfs(
    currentId: string,
    currentPath: string[],
    visited: Set<string>,
    currentLatency: number,
    isSync: boolean
  ) {
    if (currentPath.length >= maxSearchDepth) {
      allPaths.push({
        nodeIds: [...currentPath],
        depth: currentPath.length,
        totalEstimatedLatencyMs: currentLatency,
        isSynchronous: isSync,
      });
      return;
    }

    const outgoing = adjList.get(currentId) || [];
    const validOut = outgoing.filter((edge) => !visited.has(edge.targetId));

    if (validOut.length === 0) {
      // Leaf node in this path
      allPaths.push({
        nodeIds: [...currentPath],
        depth: currentPath.length,
        totalEstimatedLatencyMs: currentLatency,
        isSynchronous: isSync,
      });
      return;
    }

    for (const edge of validOut) {
      visited.add(edge.targetId);
      currentPath.push(edge.targetId);
      dfs(
        edge.targetId,
        currentPath,
        visited,
        currentLatency + (edge.latencyMs ?? 5), // default 5ms hop latency assumption
        isSync && edge.isSynchronous
      );
      currentPath.pop();
      visited.delete(edge.targetId);
    }
  }

  for (const src of sourceNodeIds) {
    const visited = new Set<string>([src]);
    dfs(src, [src], visited, 0, true);
  }

  // Sort descending by depth
  allPaths.sort((a, b) => b.depth - a.depth);
  return allPaths;
}
