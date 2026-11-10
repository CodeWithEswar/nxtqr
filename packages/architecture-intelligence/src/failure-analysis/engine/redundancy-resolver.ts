import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  RedundancyGroup,
  RedundancyMode,
  FailoverMode,
} from "../contracts/failure.types";

export class RedundancyResolver {
  public static resolveRedundancy(
    nodes: BaseNode[],
    _index: GraphIndex
  ): Record<string, RedundancyGroup> {
    const groups: Record<string, RedundancyGroup> = {};
    const nodeToGroupMap = new Map<string, string>();

    // 1. Group by explicit data.redundancyGroupId if provided
    for (const node of nodes) {
      const explicitGroupId = node.data?.redundancyGroupId as string | undefined;
      if (explicitGroupId) {
        if (!groups[explicitGroupId]) {
          groups[explicitGroupId] = {
            groupId: explicitGroupId,
            name: (node.data?.redundancyGroupName as string) || `Redundancy Group (${explicitGroupId})`,
            mode: (node.data?.redundancyMode as RedundancyMode) || "active-active",
            memberNodeIds: [],
            deploymentDomains: [],
            failoverMode: (node.data?.failoverMode as FailoverMode) || "unspecified",
            stateSync: (node.data?.stateSync as any) || "none",
            healthCheckConfigured: Boolean(node.data?.healthCheckConfigured || node.data?.healthChecksEnabled),
            effectiveReplicas: 0,
            hasSingleFailureDomain: false,
          };
        }
        groups[explicitGroupId].memberNodeIds.push(node.id);
        groups[explicitGroupId].effectiveReplicas += Math.max(1, Number(node.data?.replicas || 1));
        nodeToGroupMap.set(node.id, explicitGroupId);

        const domain = (node.data?.availabilityZone || node.data?.region || "default-zone") as string;
        if (!groups[explicitGroupId].deploymentDomains.includes(domain)) {
          groups[explicitGroupId].deploymentDomains.push(domain);
        }
      }
    }

    // 2. Evaluate individual components with internal replica configurations (e.g. replicas >= 2, Multi-AZ)
    for (const node of nodes) {
      if (nodeToGroupMap.has(node.id)) continue;

      const data = node.data || {};
      const replicas = Math.max(1, Number(data.replicas || 1));
      const isMultiAz = Boolean(data.multiAz || data.highAvailability);
      const readReplicas = Number(data.readReplicas || 0);

      const hasRedundancy = replicas > 1 || isMultiAz || readReplicas > 0;
      if (hasRedundancy) {
        let mode: RedundancyMode = "multi-instance";
        if (isMultiAz) mode = "multi-zone";
        else if (readReplicas > 0) mode = "primary-replica";
        else if (data.activePassive) mode = "active-passive";
        else if (replicas > 1) mode = "active-active";

        const failoverMode: FailoverMode =
          (data.failoverMode as FailoverMode) ||
          (isMultiAz ? "automatic" : readReplicas > 0 ? "manual" : "unspecified");

        const deploymentDomains: string[] = [];
        if (data.availabilityZones && Array.isArray(data.availabilityZones)) {
          deploymentDomains.push(...data.availabilityZones);
        } else if (data.availabilityZone) {
          deploymentDomains.push(String(data.availabilityZone));
        } else if (isMultiAz) {
          deploymentDomains.push("zone-a", "zone-b");
        } else {
          deploymentDomains.push("unspecified-zone");
        }

        const healthCheckConfigured = Boolean(
          data.healthCheckConfigured ||
          data.healthChecksEnabled ||
          data.healthCheckPath ||
          data.livenessProbe
        );

        const groupId = `rg_${node.id}`;
        groups[groupId] = {
          groupId,
          name: `${node.label || node.id} Pool`,
          mode,
          memberNodeIds: [node.id],
          deploymentDomains,
          failoverMode,
          stateSync: isMultiAz ? "synchronous" : "asynchronous",
          healthCheckConfigured,
          effectiveReplicas: replicas + readReplicas,
          hasSingleFailureDomain: deploymentDomains.length <= 1,
        };
      }
    }

    // 3. Mark hasSingleFailureDomain for groups with multiple members in a single domain
    for (const group of Object.values(groups)) {
      if (group.memberNodeIds.length > 1 && group.deploymentDomains.length <= 1) {
        group.hasSingleFailureDomain = true;
      }
    }

    return groups;
  }
}

