import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  NodeSecurityProfile,
  TrustBoundaryCrossing,
} from "../schemas/security.schemas";

export interface TrustBoundarySummary {
  id: string;
  name: string;
  zone: string;
  containedNodeIds: string[];
  crossingEdgeIds: string[];
  findingsCount: number;
}

const BOUNDARY_COMPONENT_TYPES = new Set([
  "trust-boundary",
  "network-boundary",
  "system-boundary",
]);

const SECURE_PROTOCOLS = new Set([
  "https",
  "https/rest",
  "tls",
  "mtls",
  "wss",
  "grpc/tls",
  "grpc/http2",
  "ssh",
  "ipsec",
]);

export class TrustBoundaryResolver {
  public static resolveBoundariesAndCrossings(
    nodes: BaseNode[],
    edges: BaseEdge[],
    profiles: Map<string, NodeSecurityProfile>
  ): {
    boundaries: TrustBoundarySummary[];
    crossings: TrustBoundaryCrossing[];
  } {
    const boundaryNodes = nodes.filter((n) => {
      const cType = (n.data?.componentType as string) || n.type || "";
      return BOUNDARY_COMPONENT_TYPES.has(cType);
    });

    const boundaries: TrustBoundarySummary[] = [];
    const nodeToBoundaryMap = new Map<string, Set<string>>();

    for (const bNode of boundaryNodes) {
      const bData = (bNode.data || {}) as Record<string, unknown>;
      const bName = (bData.label as string) || (bData.boundaryName as string) || bNode.id;
      const bZone = (bData.threatModelZone as string) || (bData.zoneName as string) || "perimeter";

      // Contained nodes: children or explicit assignment
      const containedNodeIds: string[] = [];
      for (const n of nodes) {
        if (n.id === bNode.id) continue;
        const nData = (n.data || {}) as Record<string, unknown>;
        const parentId = (n as { parentId?: string }).parentId || (nData.parentId as string);
        const isChild = parentId === bNode.id;
        const hasExplicitId =
          nData.boundaryId === bNode.id ||
          (Array.isArray(nData.boundaryIds) && (nData.boundaryIds as string[]).includes(bNode.id));

        if (isChild || hasExplicitId) {
          containedNodeIds.push(n.id);
          if (!nodeToBoundaryMap.has(n.id)) {
            nodeToBoundaryMap.set(n.id, new Set());
          }
          nodeToBoundaryMap.get(n.id)!.add(bNode.id);
        }
      }

      boundaries.push({
        id: bNode.id,
        name: bName,
        zone: bZone,
        containedNodeIds,
        crossingEdgeIds: [],
        findingsCount: 0,
      });
    }

    // Now resolve crossings
    const crossings: TrustBoundaryCrossing[] = [];
    const crossingsSet = new Set<string>();

    for (const edge of edges) {
      const sourceProfile = profiles.get(edge.source);
      const targetProfile = profiles.get(edge.target);
      if (!sourceProfile || !targetProfile) continue;

      const sourceBoundaries = nodeToBoundaryMap.get(edge.source) || new Set<string>();
      const targetBoundaries = nodeToBoundaryMap.get(edge.target) || new Set<string>();

      // Check boundary crossings:
      // Case 1: Edge crosses explicit boundary container
      let crossedBoundaryId: string | null = null;
      let crossedBoundaryName: string = "Logical Trust Boundary";

      for (const b of boundaries) {
        const sourceIn = sourceBoundaries.has(b.id);
        const targetIn = targetBoundaries.has(b.id);
        if (sourceIn !== targetIn) {
          crossedBoundaryId = b.id;
          crossedBoundaryName = b.name;
          b.crossingEdgeIds.push(edge.id);
          break;
        }
      }

      // Case 2: Crosses implicit trust levels (e.g. untrusted client -> internal service)
      const isTrustLevelCrossing =
        sourceProfile.trustLevel !== targetProfile.trustLevel &&
        (sourceProfile.trustLevel === "untrusted-public" ||
          targetProfile.trustLevel === "high-security-vault" ||
          targetProfile.trustLevel === "root-isolated");

      if (crossedBoundaryId || isTrustLevelCrossing) {
        const crossingKey = `${edge.id}-${crossedBoundaryId || "implicit"}`;
        if (crossingsSet.has(crossingKey)) continue;
        crossingsSet.add(crossingKey);

        const edgeData = (edge.data || {}) as Record<string, unknown>;
        const protocol = ((edgeData.protocol as string) || (edgeData.trafficDescription as string) || "tcp").toLowerCase();
        const isEncrypted = Boolean(
          (edgeData.encryptionInTransit ??
          edgeData.tls ??
          edgeData.ssl ??
          SECURE_PROTOCOLS.has(protocol)) ||
          targetProfile.enforcesTls
        );

        const requiresAuth = targetProfile.requiresAuth;
        const requiresAuthz = targetProfile.requiresAuthz;
        const missingControls: string[] = [];

        if (!isEncrypted) {
          missingControls.push("transport-encryption-tls");
        }
        if (requiresAuth && !sourceProfile.controlsPresent.includes("auth-service") && !targetProfile.controlsPresent.includes("auth-service")) {
          missingControls.push("authentication-verification");
        }
        if (requiresAuthz && !targetProfile.controlsPresent.includes("authz-policy")) {
          missingControls.push("authorization-policy");
        }

        crossings.push({
          edgeId: edge.id,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          boundaryId: crossedBoundaryId || "boundary-implicit-trust",
          boundaryName: crossedBoundaryName,
          sourceTrustLevel: sourceProfile.trustLevel,
          targetTrustLevel: targetProfile.trustLevel,
          protocol,
          isEncryptedInTransit: isEncrypted,
          requiresAuthentication: requiresAuth,
          requiresAuthorization: requiresAuthz,
          dataSensitivity: targetProfile.dataSensitivity,
          hasCrossingControls: missingControls.length === 0,
          missingControls,
        });
      }
    }

    return { boundaries, crossings };
  }
}
