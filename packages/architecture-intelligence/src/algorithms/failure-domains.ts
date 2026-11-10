import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

export interface BoundaryInfo {
  boundaryNode: BaseNode;
  kind: "system" | "network" | "trust" | "failure-zone" | "service-group" | "other";
  containedNodeIds: Set<string>;
}

export interface TrustCrossing {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceBoundaryId?: string;
  targetBoundaryId: string;
}

export function extractBoundaries(nodes: BaseNode[]): BoundaryInfo[] {
  const boundaries: BoundaryInfo[] = [];

  for (const node of nodes) {
    const type = node.type.toLowerCase();
    let kind: BoundaryInfo["kind"] | null = null;

    if (type.includes("trust-boundary") || type.includes("trust_boundary")) {
      kind = "trust";
    } else if (type.includes("network-boundary") || type.includes("network_boundary")) {
      kind = "network";
    } else if (type.includes("failure-zone") || type.includes("failure_zone")) {
      kind = "failure-zone";
    } else if (type.includes("service-group") || type.includes("service_group")) {
      kind = "service-group";
    } else if (type.includes("system-boundary") || type.includes("system_boundary")) {
      kind = "system";
    } else if (node.data?.isBoundary || node.data?.isGroup) {
      kind = "other";
    }

    if (kind) {
      // Check for explicitly listed children in data.containedNodeIds or parentId
      const containedNodeIds = new Set<string>();
      if (Array.isArray(node.data?.containedNodeIds)) {
        node.data.containedNodeIds.forEach((id: string) => containedNodeIds.add(id));
      }

      boundaries.push({
        boundaryNode: node,
        kind,
        containedNodeIds,
      });
    }
  }

  // Also resolve nodes where node.data.parentId equals boundaryNode.id
  for (const b of boundaries) {
    for (const n of nodes) {
      if (n.data?.parentId === b.boundaryNode.id || n.data?.groupId === b.boundaryNode.id) {
        b.containedNodeIds.add(n.id);
      }
    }
  }

  return boundaries;
}

export function findTrustBoundaryCrossings(
  edges: BaseEdge[],
  boundaries: BoundaryInfo[]
): TrustCrossing[] {
  const trustBoundaries = boundaries.filter((b) => b.kind === "trust" || b.kind === "network");
  const crossings: TrustCrossing[] = [];

  for (const tb of trustBoundaries) {
    for (const edge of edges) {
      const isTargetInside = tb.containedNodeIds.has(edge.target);
      const isSourceInside = tb.containedNodeIds.has(edge.source);

      // Edge crossing INTO the boundary from outside
      if (isTargetInside && !isSourceInside) {
        // Find if source is in another boundary
        const sourceBoundary = trustBoundaries.find((other) =>
          other.containedNodeIds.has(edge.source)
        );

        crossings.push({
          edgeId: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          sourceBoundaryId: sourceBoundary?.boundaryNode.id,
          targetBoundaryId: tb.boundaryNode.id,
        });
      }
    }
  }

  return crossings;
}

