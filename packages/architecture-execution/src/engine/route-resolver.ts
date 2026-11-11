import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ExecutionConfiguration, ExecutionRequest } from "../schemas/execution.schemas";

export interface RouteResolution {
  selectedEdge: BaseEdge | null;
  targetNode: BaseNode | null;
  decisionReason: string;
  isTerminal: boolean;
  availableEdges: BaseEdge[];
}

export class RouteResolver {
  public static resolveNextHop(
    currentNode: BaseNode,
    outgoingEdges: BaseEdge[],
    nodeMap: Map<string, BaseNode>,
    config: ExecutionConfiguration,
    request: ExecutionRequest
  ): RouteResolution {
    if (!outgoingEdges || outgoingEdges.length === 0) {
      return {
        selectedEdge: null,
        targetNode: null,
        decisionReason: `Component "${currentNode.label || currentNode.id}" is a terminal egress with no outgoing connections.`,
        isTerminal: true,
        availableEdges: [],
      };
    }

    // Sort outgoing edges deterministically by ID to ensure strict repeatability
    const sortedEdges = [...outgoingEdges].sort((a, b) => a.id.localeCompare(b.id));

    // Case 1: Exactly one outgoing edge
    if (sortedEdges.length === 1) {
      const edge = sortedEdges[0];
      const target = nodeMap.get(edge.target) || null;
      return {
        selectedEdge: edge,
        targetNode: target,
        decisionReason: `Direct single downstream dependency to "${target?.label || edge.target}".`,
        isTerminal: target === null,
        availableEdges: sortedEdges,
      };
    }

    // Case 2: User explicitly selected branch in configuration
    const userBranchChoice = config.routing.selectedBranches?.[currentNode.id];
    if (userBranchChoice) {
      const matchedByUser = sortedEdges.find(
        (e) => e.id === userBranchChoice || e.target === userBranchChoice
      );
      if (matchedByUser) {
        const target = nodeMap.get(matchedByUser.target) || null;
        return {
          selectedEdge: matchedByUser,
          targetNode: target,
          decisionReason: `User-selected branch constraint directed flow to "${target?.label || matchedByUser.target}".`,
          isTerminal: target === null,
          availableEdges: sortedEdges,
        };
      }
    }

    // Case 3: Condition / path / protocol matching in edge data
    for (const edge of sortedEdges) {
      const edgeData = (edge.data || {}) as Record<string, unknown>;
      const edgeMethod = String(edgeData.method || "").toUpperCase();
      const edgePathPrefix = String(edgeData.pathPrefix || edgeData.routePath || "");

      if (edgeMethod && edgeMethod === request.method) {
        const target = nodeMap.get(edge.target) || null;
        return {
          selectedEdge: edge,
          targetNode: target,
          decisionReason: `Route rule matched HTTP method "${request.method}".`,
          isTerminal: target === null,
          availableEdges: sortedEdges,
        };
      }

      if (edgePathPrefix && request.path.startsWith(edgePathPrefix)) {
        const target = nodeMap.get(edge.target) || null;
        return {
          selectedEdge: edge,
          targetNode: target,
          decisionReason: `Route rule matched path prefix "${edgePathPrefix}".`,
          isTerminal: target === null,
          availableEdges: sortedEdges,
        };
      }
    }

    // Case 4: Deterministic default policy (first branch alphabetically with clear explanation)
    const defaultEdge = sortedEdges[0];
    const defaultTarget = nodeMap.get(defaultEdge.target) || null;
    return {
      selectedEdge: defaultEdge,
      targetNode: defaultTarget,
      decisionReason: `Multiple branches available (${sortedEdges.length} connections); followed primary route "${defaultEdge.id}" deterministically.`,
      isTerminal: defaultTarget === null,
      availableEdges: sortedEdges,
    };
  }
}
