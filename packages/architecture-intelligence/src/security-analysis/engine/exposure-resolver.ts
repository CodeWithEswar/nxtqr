import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { NodeSecurityProfile } from "../schemas/security.schemas";

export interface ExposureAnalysisResult {
  publicEntrypointNodeIds: string[];
  exposedDatabaseNodeIds: string[];
  unshieldedIngressNodeIds: string[];
  exposedAdminNodeIds: string[];
}

export class ExposureResolver {
  public static analyzeExposure(
    nodes: BaseNode[],
    edges: BaseEdge[],
    profiles: Map<string, NodeSecurityProfile>
  ): ExposureAnalysisResult {
    const publicEntrypointNodeIds: string[] = [];
    const exposedDatabaseNodeIds: string[] = [];
    const unshieldedIngressNodeIds: string[] = [];
    const exposedAdminNodeIds: string[] = [];

    const incomingMap = new Map<string, BaseEdge[]>();
    for (const edge of edges) {
      if (!incomingMap.has(edge.target)) incomingMap.set(edge.target, []);
      incomingMap.get(edge.target)!.push(edge);
    }

    for (const node of nodes) {
      const profile = profiles.get(node.id);
      if (!profile) continue;

      if (profile.exposure === "public") {
        publicEntrypointNodeIds.push(node.id);
      }

      // 1. Direct exposed databases/stores
      const isDataStore =
        profile.componentType.includes("database") ||
        profile.componentType.includes("storage") ||
        profile.componentType.includes("cache");

      if (isDataStore) {
        const inEdges = incomingMap.get(node.id) || [];
        const hasDirectPublicClientSource = inEdges.some((e) => {
          const srcProfile = profiles.get(e.source);
          return (
            srcProfile &&
            (srcProfile.componentType.includes("browser") ||
              srcProfile.componentType.includes("application") ||
              srcProfile.componentType === "static-website" ||
              srcProfile.trustLevel === "untrusted-public")
          );
        });

        if (profile.exposure === "public" || hasDirectPublicClientSource) {
          exposedDatabaseNodeIds.push(node.id);
        }
      }

      // 2. Unshielded public ingress (No WAF / rate limiter / ddos shield upstream or on node)
      const isPublicIngress =
        profile.exposure === "public" &&
        !profile.componentType.includes("browser") &&
        !profile.componentType.includes("client");

      if (isPublicIngress) {
        const inEdges = incomingMap.get(node.id) || [];
        const hasShield =
          profile.controlsPresent.includes("waf") ||
          profile.controlsPresent.includes("ddos-shield") ||
          profile.controlsPresent.includes("rate-limiter") ||
          inEdges.some((e) => {
            const srcProfile = profiles.get(e.source);
            return (
              srcProfile &&
              (srcProfile.controlsPresent.includes("waf") ||
                srcProfile.controlsPresent.includes("ddos-shield") ||
                srcProfile.controlsPresent.includes("rate-limiter"))
            );
          });

        if (!hasShield) {
          unshieldedIngressNodeIds.push(node.id);
        }
      }

      // 3. Exposed administrative interface
      if (profile.isAdministrative) {
        const inEdges = incomingMap.get(node.id) || [];
        const directlyReachableFromPublic =
          profile.exposure === "public" ||
          inEdges.some((e) => {
            const srcProfile = profiles.get(e.source);
            return srcProfile && srcProfile.trustLevel === "untrusted-public";
          });

        if (directlyReachableFromPublic) {
          exposedAdminNodeIds.push(node.id);
        }
      }
    }

    return {
      publicEntrypointNodeIds,
      exposedDatabaseNodeIds,
      unshieldedIngressNodeIds,
      exposedAdminNodeIds,
    };
  }
}

