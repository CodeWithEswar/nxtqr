import type {
  LogicalShardRuntime,
  PlacementPolicyType,
  StorageNodeRuntime,
} from "../storage-schemas";

export interface PlacementResult {
  primaryNodeId: string | null;
  replicaNodeIds: string[];
  violations: string[];
}

export function computeReplicaPlacement(
  shardIndex: number,
  replicationFactor: number,
  nodesList: StorageNodeRuntime[],
  policy: PlacementPolicyType,
  allowSameNodeForSynthetic: boolean
): PlacementResult {
  const joinedNodes = nodesList
    .filter((n) => n.joined)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (joinedNodes.length === 0) {
    return {
      primaryNodeId: null,
      replicaNodeIds: [],
      violations: ["No joined storage nodes available for replica placement."],
    };
  }

  const violations: string[] = [];
  const chosen: StorageNodeRuntime[] = [];

  // Order candidates deterministically based on policy
  const ordered = [...joinedNodes];
  if (policy === "capacity_aware") {
    ordered.sort(
      (a, b) =>
        b.capacityRecords - b.usedRecords - (a.capacityRecords - a.usedRecords) ||
        a.id.localeCompare(b.id)
    );
  } else {
    // Rotate starting offset by shardIndex for balanced round-robin distribution
    const rot = shardIndex % ordered.length;
    const head = ordered.splice(0, rot);
    ordered.push(...head);
  }

  const usedZones = new Set<string>();
  const usedRegions = new Set<string>();
  const usedNodes = new Set<string>();

  for (let r = 0; r < replicationFactor; r++) {
    let pick: StorageNodeRuntime | undefined;

    if (policy === "zone_aware" || policy === "anti_affinity") {
      pick = ordered.find((n) => !usedNodes.has(n.id) && !usedZones.has(n.zone));
    } else if (policy === "region_aware") {
      pick = ordered.find((n) => !usedNodes.has(n.id) && !usedRegions.has(n.region));
    }

    if (!pick) {
      pick = ordered.find((n) => !usedNodes.has(n.id));
      if (pick && policy === "zone_aware" && usedZones.has(pick.zone)) {
        violations.push(
          `Shard ${shardIndex + 1}: insufficient distinct availability zones for RF=${replicationFactor}; colocated replica on zone '${pick.zone}'.`
        );
      }
      if (pick && policy === "region_aware" && usedRegions.has(pick.region)) {
        violations.push(
          `Shard ${shardIndex + 1}: insufficient distinct regions for RF=${replicationFactor}; colocated replica in region '${pick.region}'.`
        );
      }
    }

    if (!pick && allowSameNodeForSynthetic) {
      pick = ordered[0];
      violations.push(
        `Shard ${shardIndex + 1}: placed duplicate replica on same node '${pick?.id}' (synthetic fallback).`
      );
    }

    if (!pick) {
      violations.push(
        `Shard ${shardIndex + 1}: unable to place ${replicationFactor} replicas across ${joinedNodes.length} eligible physical nodes.`
      );
      break;
    }

    chosen.push(pick);
    usedNodes.add(pick.id);
    usedZones.add(pick.zone);
    usedRegions.add(pick.region);
  }

  return {
    primaryNodeId: chosen[0]?.id ?? null,
    replicaNodeIds: chosen.map((n) => n.id),
    violations,
  };
}

export interface RebalanceMoveProposal {
  shardId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export function planBalancedRebalance(
  shards: Record<string, LogicalShardRuntime>,
  nodes: Record<string, StorageNodeRuntime>
): RebalanceMoveProposal[] {
  const activeNodes = Object.values(nodes)
    .filter((n) => n.joined && n.online)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (activeNodes.length < 2) return [];

  const activeShards = Object.values(shards)
    .filter((s) => !s.retired && s.primaryNodeId !== null)
    .sort((a, b) => a.shardId.localeCompare(b.shardId));

  const primaryCounts = new Map<string, number>();
  for (const n of activeNodes) primaryCounts.set(n.id, 0);
  for (const s of activeShards) {
    if (s.primaryNodeId && primaryCounts.has(s.primaryNodeId)) {
      primaryCounts.set(s.primaryNodeId, (primaryCounts.get(s.primaryNodeId) ?? 0) + 1);
    }
  }

  const targetAvg = Math.floor(activeShards.length / activeNodes.length);
  const proposals: RebalanceMoveProposal[] = [];

  for (const targetNode of activeNodes) {
    while ((primaryCounts.get(targetNode.id) ?? 0) < Math.max(1, targetAvg)) {
      // Find most loaded node whose shard doesn't already conflict
      const donorEntry = [...primaryCounts.entries()]
        .filter(([id, cnt]) => id !== targetNode.id && cnt > Math.max(1, targetAvg))
        .sort((a, b) => b[1] - a[1])[0];
      if (!donorEntry) break;
      const donorId = donorEntry[0];
      const candidateShard = activeShards.find(
        (s) =>
          s.primaryNodeId === donorId &&
          !proposals.some((p) => p.shardId === s.shardId)
      );
      if (!candidateShard) break;

      proposals.push({
        shardId: candidateShard.shardId,
        sourceNodeId: donorId,
        targetNodeId: targetNode.id,
      });
      primaryCounts.set(donorId, (primaryCounts.get(donorId) ?? 1) - 1);
      primaryCounts.set(targetNode.id, (primaryCounts.get(targetNode.id) ?? 0) + 1);
    }
  }

  return proposals;
}

