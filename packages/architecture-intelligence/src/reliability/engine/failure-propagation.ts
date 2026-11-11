import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { NodeReliabilityProfile, PropagationPath } from "../schemas/reliability.schemas";

export class FailurePropagationEngine {
  private static readonly MAX_DEPTH = 8;
  private static readonly MAX_PATHS_PER_ROOT = 15;

  public static tracePropagationPaths(
    nodes: BaseNode[],
    edges: BaseEdge[],
    profiles: Record<string, NodeReliabilityProfile>
  ): PropagationPath[] {
    const paths: PropagationPath[] = [];

    const outgoingMap = new Map<string, BaseEdge[]>();
    for (const edge of edges) {
      if (!outgoingMap.has(edge.source)) outgoingMap.set(edge.source, []);
      outgoingMap.get(edge.source)!.push(edge);
    }

    // Find root nodes (in-degree == 0 or ingress/clients/gateways)
    const incomingCount = new Map<string, number>();
    for (const node of nodes) incomingCount.set(node.id, 0);
    for (const edge of edges) {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    }

    const rootNodes = nodes.filter((n) => {
      const inDeg = incomingCount.get(n.id) || 0;
      const data = (n.data || {}) as Record<string, unknown>;
      const cType = String(data.componentType || n.type || "");
      return (
        inDeg === 0 ||
        cType.includes("client") ||
        cType.includes("browser") ||
        cType.includes("gateway")
      );
    });

    for (const root of rootNodes) {
      let pathsForRoot = 0;
      const queue: { currentId: string; chain: string[]; depth: number }[] = [
        { currentId: root.id, chain: [root.id], depth: 0 },
      ];

      while (queue.length > 0 && pathsForRoot < this.MAX_PATHS_PER_ROOT) {
        const item = queue.shift()!;
        if (item.depth >= this.MAX_DEPTH) continue;

        const outEdges = outgoingMap.get(item.currentId) || [];
        if (outEdges.length === 0 && item.chain.length > 1) {
          // Reached leaf - analyze path
          const path = this.evaluatePath(item.chain, profiles, outEdges);
          if (path) {
            paths.push(path);
            pathsForRoot++;
          }
          continue;
        }

        for (const outEdge of outEdges) {
          if (item.chain.includes(outEdge.target)) {
            // Cycle detected - analyze up to cycle point to prevent infinite loops
            const path = this.evaluatePath(item.chain, profiles, outEdges);
            if (path) {
              paths.push(path);
              pathsForRoot++;
            }
            continue;
          }

          queue.push({
            currentId: outEdge.target,
            chain: [...item.chain, outEdge.target],
            depth: item.depth + 1,
          });
        }
      }
    }

    return paths;
  }

  private static evaluatePath(
    chain: string[],
    profiles: Record<string, NodeReliabilityProfile>,
    _lastEdges: BaseEdge[]
  ): PropagationPath | null {
    if (chain.length < 2) return null;

    const origin = chain[0];
    const target = chain[chain.length - 1];

    let amplificationFactor = 1.0;
    let totalMaxTimeoutMs = 0;
    let hasBreaker = false;
    let hasFallback = false;
    let hasQueue = false;

    for (let i = 0; i < chain.length; i++) {
      const p = profiles[chain[i]];
      if (!p) continue;

      if (p.maxRetryAttempts && p.maxRetryAttempts > 0) {
        amplificationFactor *= p.maxRetryAttempts + 1;
      }

      if (p.declaredTimeoutMs && p.declaredTimeoutMs > 0) {
        totalMaxTimeoutMs += p.declaredTimeoutMs;
      }

      if (p.hasCircuitBreaker) hasBreaker = true;
      if (p.hasFallback) hasFallback = true;
    }

    let isContained = false;
    let containmentMechanism: "circuit-breaker" | "fallback" | "queue" | "none" = "none";

    if (hasBreaker) {
      isContained = true;
      containmentMechanism = "circuit-breaker";
    } else if (hasFallback) {
      isContained = true;
      containmentMechanism = "fallback";
    } else if (hasQueue) {
      isContained = true;
      containmentMechanism = "queue";
    }

    let riskType: "timeout-accumulation" | "retry-amplification" | "cascading-collapse" | "resource-starvation" = "cascading-collapse";
    if (amplificationFactor >= 6) {
      riskType = "retry-amplification";
    } else if (totalMaxTimeoutMs >= 4000) {
      riskType = "timeout-accumulation";
    } else if (chain.length >= 3 && !isContained) {
      riskType = "cascading-collapse";
    } else {
      riskType = "resource-starvation";
    }

    return {
      originNodeId: origin,
      targetNodeId: target,
      chain,
      riskType,
      amplificationFactor,
      totalMaxTimeoutMs,
      isContained,
      containmentMechanism,
    };
  }
}

