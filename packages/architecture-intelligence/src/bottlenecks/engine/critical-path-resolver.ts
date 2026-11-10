import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { CriticalPathMetrics } from "../contracts/bottleneck.types";

export class CriticalPathResolver {
  public static resolveCriticalPaths(
    nodes: BaseNode[],
    index: GraphIndex,
    capacityMap: Map<string, { processingTimeMs: number }>
  ): CriticalPathMetrics[] {
    const criticalPaths: CriticalPathMetrics[] = [];

    // Sources: entry points or all nodes
    const sourceIds = index.entryPointIds.length > 0 ? index.entryPointIds : nodes.map((n) => n.id);

    for (const srcId of sourceIds) {
      // Find paths from srcId down to terminals
      const visited = new Set<string>();
      let currentPath: string[] = [srcId];
      let currentLatency = capacityMap.get(srcId)?.processingTimeMs || 2;

      let curr = srcId;
      while (true) {
        visited.add(curr);
        const outEdges = index.forwardEdges.get(curr) || [];
        const syncEdges = outEdges.filter((e) => e.isSynchronous && !visited.has(e.targetId));

        if (syncEdges.length === 0) break;

        // In case of parallel branches, pick the branch with maximum latency
        let maxBranchNodeId = syncEdges[0].targetId;
        let maxBranchLatency = capacityMap.get(maxBranchNodeId)?.processingTimeMs || 5;

        for (let i = 1; i < syncEdges.length; i++) {
          const candId = syncEdges[i].targetId;
          const candLatency = capacityMap.get(candId)?.processingTimeMs || 5;
          if (candLatency > maxBranchLatency) {
            maxBranchNodeId = candId;
            maxBranchLatency = candLatency;
          }
        }

        currentPath.push(maxBranchNodeId);
        currentLatency += maxBranchLatency + 2; // +2ms default network hop
        curr = maxBranchNodeId;

        if (currentPath.length >= 15) break; // bounded depth
      }

      if (currentPath.length >= 2) {
        // Find component with largest processing time
        let maxNodeId = currentPath[0];
        let maxNodeTime = capacityMap.get(maxNodeId)?.processingTimeMs || 0;
        for (const nId of currentPath) {
          const t = capacityMap.get(nId)?.processingTimeMs || 0;
          if (t > maxNodeTime) {
            maxNodeTime = t;
            maxNodeId = nId;
          }
        }

        const srcNode = index.nodeMap.get(srcId);
        const budget = Number(srcNode?.data?.latencyBudgetMs || srcNode?.data?.maxLatencyMs || 250);

        criticalPaths.push({
          pathNodeIds: currentPath,
          depth: currentPath.length,
          estimatedLatencyMs: currentLatency,
          latencyBudgetMs: budget,
          exceedsBudget: currentLatency > budget,
          bottleneckNodeId: maxNodeId,
        });
      }
    }

    // Sort descending by latency
    criticalPaths.sort((a, b) => b.estimatedLatencyMs - a.estimatedLatencyMs);
    return criticalPaths.slice(0, 5); // top 5 critical paths
  }
}
