import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { FailureDomain, FailureDomainKind } from "../contracts/failure.types";

export class FailureDomainResolver {
  public static resolveFailureDomains(
    nodes: BaseNode[],
    index: GraphIndex
  ): Record<string, FailureDomain> {
    const domains: Record<string, FailureDomain> = {};

    // 1. Resolve from Boundary & Failure Zone components
    for (const b of index.boundaries) {
      if (b.kind === "failure-zone" || b.kind === "network" || b.kind === "system") {
        const domainId = b.boundaryNode.id;
        let kind: FailureDomainKind = "custom-domain";
        const type = b.boundaryNode.type.toLowerCase();

        if (type.includes("region") || b.boundaryNode.data?.region) {
          kind = "cloud-region";
        } else if (type.includes("availability-zone") || type.includes("zone")) {
          kind = "availability-zone";
        } else if (b.kind === "network") {
          kind = "network-segment";
        }

        domains[domainId] = {
          id: domainId,
          name: b.boundaryNode.label || b.boundaryNode.id,
          kind,
          memberNodeIds: Array.from(b.containedNodeIds),
          boundaryNodeId: b.boundaryNode.id,
        };
      }
    }

    // 2. Resolve from node metadata (availabilityZone, region, etc.)
    for (const node of nodes) {
      const data = node.data || {};
      const az = data.availabilityZone || data.zone;
      const region = data.region || data.cloudRegion;
      const rack = data.rack;
      const customDomain = data.failureDomain;

      if (az) {
        const azId = `az_${String(az).toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        if (!domains[azId]) {
          domains[azId] = {
            id: azId,
            name: `Availability Zone (${az})`,
            kind: "availability-zone",
            memberNodeIds: [],
          };
        }
        if (!domains[azId].memberNodeIds.includes(node.id)) {
          domains[azId].memberNodeIds.push(node.id);
        }
      }

      if (region) {
        const regionId = `reg_${String(region).toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        if (!domains[regionId]) {
          domains[regionId] = {
            id: regionId,
            name: `Cloud Region (${region})`,
            kind: "cloud-region",
            memberNodeIds: [],
          };
        }
        if (!domains[regionId].memberNodeIds.includes(node.id)) {
          domains[regionId].memberNodeIds.push(node.id);
        }
      }

      if (rack) {
        const rackId = `rack_${String(rack).toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        if (!domains[rackId]) {
          domains[rackId] = {
            id: rackId,
            name: `Rack (${rack})`,
            kind: "rack",
            memberNodeIds: [],
          };
        }
        if (!domains[rackId].memberNodeIds.includes(node.id)) {
          domains[rackId].memberNodeIds.push(node.id);
        }
      }

      if (customDomain) {
        const fId = `fdom_${String(customDomain).toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
        if (!domains[fId]) {
          domains[fId] = {
            id: fId,
            name: `Failure Domain (${customDomain})`,
            kind: "custom-domain",
            memberNodeIds: [],
          };
        }
        if (!domains[fId].memberNodeIds.includes(node.id)) {
          domains[fId].memberNodeIds.push(node.id);
        }
      }
    }

    return domains;
  }
}

