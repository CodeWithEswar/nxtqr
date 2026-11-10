import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type {
  BlastRadiusReport,
  ResolvedDependency,
  RedundancyGroup,
  BusinessCapability,
} from "../contracts/failure.types";

export class BlastRadiusResolver {
  public static calculateNodeBlastRadius(
    targetNodeId: string,
    nodes: BaseNode[],
    index: GraphIndex,
    dependencyMap: Map<string, ResolvedDependency[]>,
    redundancyGroups: Record<string, RedundancyGroup>,
    capabilities: Record<string, BusinessCapability>
  ): BlastRadiusReport {
    const targetNode = index.nodeMap.get(targetNodeId);
    const targetName = targetNode?.label || targetNodeId;

    // Check if target is part of a multi-instance active redundancy group with surviving members
    let survivingGroupMembers = 0;
    for (const group of Object.values(redundancyGroups)) {
      if (group.memberNodeIds.includes(targetNodeId)) {
        survivingGroupMembers = group.effectiveReplicas - 1;
        break;
      }
    }

    // Direct dependents: nodes whose dependencies target this node directly
    const directImpactedSet = new Set<string>();
    const upstreamNodes = index.getUpstreamNodes(targetNodeId);

    for (const upNode of upstreamNodes) {
      const deps = dependencyMap.get(upNode.id) || [];
      const isHard = deps.some(
        (d) => d.targetId === targetNodeId && d.isHardDependency && d.isCritical
      );

      // If surviving group members exist and can absorb traffic, not directly failed
      if (isHard && survivingGroupMembers <= 0) {
        directImpactedSet.add(upNode.id);
      }
    }

    // Transitive / Indirect Impact via BFS traversal up the dependency tree
    const indirectImpactedSet = new Set<string>();
    const queue = Array.from(directImpactedSet);
    const visited = new Set<string>([targetNodeId, ...directImpactedSet]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const upstream = index.getUpstreamNodes(current);

      for (const up of upstream) {
        if (!visited.has(up.id)) {
          visited.add(up.id);
          const deps = dependencyMap.get(up.id) || [];
          const isHard = deps.some(
            (d) => d.targetId === current && d.isHardDependency && d.isCritical
          );

          if (isHard) {
            indirectImpactedSet.add(up.id);
            queue.push(up.id);
          }
        }
      }
    }

    // Evaluate affected business capabilities
    const affectedCapabilityIds: string[] = [];
    const unaffectedCapabilityIds: string[] = [];
    const degradedCapabilityIds: string[] = [];

    const allFailedNodeIds = new Set<string>([
      targetNodeId,
      ...Array.from(directImpactedSet),
      ...Array.from(indirectImpactedSet),
    ]);

    for (const [capId, cap] of Object.entries(capabilities)) {
      const supportedTotal = cap.supportedNodeIds.length;
      if (supportedTotal === 0) continue;

      const failedCount = cap.supportedNodeIds.filter((id) => allFailedNodeIds.has(id)).length;

      if (failedCount === supportedTotal) {
        affectedCapabilityIds.push(capId);
      } else if (failedCount > 0) {
        degradedCapabilityIds.push(capId);
      } else {
        unaffectedCapabilityIds.push(capId);
      }
    }

    // Blast Radius Score (0% - 100%)
    const totalNodesCount = Math.max(1, nodes.length);
    const failedNodesCount = allFailedNodeIds.size;
    const nodeImpactRatio = failedNodesCount / totalNodesCount;

    const totalCaps = Object.keys(capabilities).length;
    const capImpactRatio = totalCaps > 0 ? affectedCapabilityIds.length / totalCaps : 0;

    const blastRadiusScore = Math.min(
      100,
      Math.round((nodeImpactRatio * 0.5 + capImpactRatio * 0.5) * 100)
    );

    let summary = `Failure of ${targetName} directly disrupts ${directImpactedSet.size} dependent component(s)`;
    if (indirectImpactedSet.size > 0) {
      summary += ` and cascades to ${indirectImpactedSet.size} indirect service(s).`;
    } else {
      summary += ".";
    }

    if (affectedCapabilityIds.length > 0) {
      summary += ` ${affectedCapabilityIds.length} business capability/capabilities completely severed.`;
    }

    return {
      targetId: targetNodeId,
      targetType: "node",
      targetName,
      directImpactedNodeIds: Array.from(directImpactedSet),
      indirectImpactedNodeIds: Array.from(indirectImpactedSet),
      affectedCapabilityIds,
      unaffectedCapabilityIds,
      degradedCapabilityIds,
      blastRadiusScore,
      survivingAlternativePaths: survivingGroupMembers,
      summary,
    };
  }
}
