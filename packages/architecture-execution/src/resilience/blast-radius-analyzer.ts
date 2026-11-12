import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { FaultDefinition, BlastRadiusReport } from "./fault-schemas";

export class BlastRadiusAnalyzer {
  /**
   * Traverses the architecture graph downstream from a fault target to compute the
   * direct and downstream blast radius, affected components, and propagation chains.
   */
  public static calculateBlastRadius(
    nodes: BaseNode[],
    edges: BaseEdge[],
    fault: FaultDefinition
  ): BlastRadiusReport {
    const nodeMap = new Map<string, BaseNode>(nodes.map((n) => [n.id, n]));
    const targetId = fault.target.targetId;

    const directlyAffectedNodeIds = new Set<string>();
    const directlyAffectedEdgeIds = new Set<string>();
    const downstreamAffectedNodeIds = new Set<string>();
    const downstreamAffectedEdgeIds = new Set<string>();

    // 1. Identify direct targets
    if (fault.target.type === "node" || fault.target.type === "service_instance" || fault.target.type === "consumer") {
      directlyAffectedNodeIds.add(targetId);
    } else if (fault.target.type === "edge") {
      directlyAffectedEdgeIds.add(targetId);
      const edge = edges.find((e) => e.id === targetId);
      if (edge) {
        directlyAffectedNodeIds.add(edge.target);
      }
    } else if (fault.target.type === "queue") {
      directlyAffectedNodeIds.add(targetId);
    }

    // 2. Build adjacency for forward traversal (data/request dependencies)
    const forwardAdj = new Map<string, { edge: BaseEdge; targetId: string }[]>();
    // Also build backward adjacency (callers who depend on this service)
    const reverseAdj = new Map<string, { edge: BaseEdge; sourceId: string }[]>();

    for (const edge of edges) {
      if (!forwardAdj.has(edge.source)) forwardAdj.set(edge.source, []);
      forwardAdj.get(edge.source)!.push({ edge, targetId: edge.target });

      if (!reverseAdj.has(edge.target)) reverseAdj.set(edge.target, []);
      reverseAdj.get(edge.target)!.push({ edge, sourceId: edge.source });
    }

    // 3. BFS traversal to discover downstream & caller cascading impact
    const propagationChain: BlastRadiusReport["propagationChain"] = [];
    const visited = new Set<string>(directlyAffectedNodeIds);
    const queue: { nodeId: string; depth: number }[] = [];

    for (const directNodeId of directlyAffectedNodeIds) {
      queue.push({ nodeId: directNodeId, depth: 0 });
    }

    let maxDepth = 0;
    let sequence = 1;

    // Traverse callers who wait on this node
    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      maxDepth = Math.max(maxDepth, depth);

      // Downstream data flows
      const forwardNeighbors = forwardAdj.get(nodeId) || [];
      for (const { edge, targetId: nextNodeId } of forwardNeighbors) {
        if (!directlyAffectedEdgeIds.has(edge.id)) {
          downstreamAffectedEdgeIds.add(edge.id);
        }
        if (!visited.has(nextNodeId)) {
          visited.add(nextNodeId);
          downstreamAffectedNodeIds.add(nextNodeId);
          queue.push({ nodeId: nextNodeId, depth: depth + 1 });

          propagationChain.push({
            sequence: sequence++,
            atMs: fault.startAtMs + depth * 50,
            fromId: nodeId,
            toId: nextNodeId,
            impactType: fault.type === "component.outage" ? "cascade_error" : "timeout",
            explanation: `Downstream dependency "${nodeMap.get(nextNodeId)?.label || nextNodeId}" impacted by upstream fault on "${nodeMap.get(nodeId)?.label || nodeId}".`,
          });
        }
      }

      // Reverse callers who block waiting on responses from this node
      const reverseNeighbors = reverseAdj.get(nodeId) || [];
      for (const { edge, sourceId: callerNodeId } of reverseNeighbors) {
        if (!directlyAffectedEdgeIds.has(edge.id)) {
          downstreamAffectedEdgeIds.add(edge.id);
        }
        if (!visited.has(callerNodeId)) {
          visited.add(callerNodeId);
          downstreamAffectedNodeIds.add(callerNodeId);
          queue.push({ nodeId: callerNodeId, depth: depth + 1 });

          propagationChain.push({
            sequence: sequence++,
            atMs: fault.startAtMs + depth * 40,
            fromId: nodeId,
            toId: callerNodeId,
            impactType: "timeout",
            explanation: `Caller "${nodeMap.get(callerNodeId)?.label || callerNodeId}" blocked or timing out waiting on response from "${nodeMap.get(nodeId)?.label || nodeId}".`,
          });
        }
      }
    }

    return {
      originFaultId: fault.id,
      originFaultType: fault.type,
      originTargetId: targetId,
      directlyAffectedNodeIds: Array.from(directlyAffectedNodeIds),
      directlyAffectedEdgeIds: Array.from(directlyAffectedEdgeIds),
      downstreamAffectedNodeIds: Array.from(downstreamAffectedNodeIds),
      downstreamAffectedEdgeIds: Array.from(downstreamAffectedEdgeIds),
      impactedRequestIds: [],
      impactedMessageIds: [],
      propagationChain,
      causalDepth: maxDepth,
    };
  }
}
