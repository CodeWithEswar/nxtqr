import type {
  HashRingToken,
  LogicalShardRuntime,
  PartitionStrategy,
  RangeBoundaryConfig,
} from "../storage-schemas";

/**
 * Deterministic 32-bit FNV-1a hash for canonical string/numeric keys.
 */
export function hashKeyCanonical(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function extractNumericKey(key: string): number {
  const digits = key.replace(/\D+/g, "");
  if (digits.length > 0) {
    return parseInt(digits, 10) % 10000;
  }
  return hashKeyCanonical(key) % 10000;
}

export function buildConsistentHashRing(
  nodeIds: string[],
  virtualNodesPerNode: number
): HashRingToken[] {
  const ring: HashRingToken[] = [];
  for (const nodeId of nodeIds) {
    for (let v = 0; v < virtualNodesPerNode; v++) {
      const token = hashKeyCanonical(`${nodeId}#vnode-${v}`);
      ring.push({ token, nodeId, vnodeIndex: v });
    }
  }
  ring.sort((a, b) => a.token - b.token || a.nodeId.localeCompare(b.nodeId));
  return ring;
}

export function resolveRingNodeForHash(
  ring: HashRingToken[],
  keyHash: number
): string | null {
  if (ring.length === 0) return null;
  for (const tok of ring) {
    if (tok.token >= keyHash) return tok.nodeId;
  }
  return ring[0]!.nodeId;
}

export function validateRangePartitions(
  ranges: RangeBoundaryConfig[]
): { valid: boolean; reason?: string } {
  if (ranges.length === 0) return { valid: true };
  const sorted = [...ranges].sort((a, b) => a.minKey - b.minKey);
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    if (cur.maxKey < cur.minKey) {
      return { valid: false, reason: `Range ${cur.shardId} has maxKey < minKey` };
    }
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (cur.minKey <= prev.maxKey) {
        return {
          valid: false,
          reason: `Overlapping ranges between ${prev.shardId} and ${cur.shardId}`,
        };
      }
    }
  }
  return { valid: true };
}

export function resolveShardForKey(
  key: string,
  strategy: PartitionStrategy,
  shards: Record<string, LogicalShardRuntime>,
  hashRing: HashRingToken[]
): { shardId: string; hashValue: number; explanation: string } {
  const activeShards = Object.values(shards)
    .filter((s) => !s.retired)
    .sort((a, b) => a.shardId.localeCompare(b.shardId));
  const keyHash = hashKeyCanonical(key);

  if (activeShards.length === 0) {
    return {
      shardId: "S1",
      hashValue: keyHash,
      explanation: "Fallback shard S1",
    };
  }

  if (strategy === "range") {
    const numKey = extractNumericKey(key);
    for (const s of activeShards) {
      if (
        s.minKey !== undefined &&
        s.maxKey !== undefined &&
        numKey >= s.minKey &&
        numKey <= s.maxKey
      ) {
        return {
          shardId: s.shardId,
          hashValue: numKey,
          explanation: `Range lookup: numericKey=${numKey} in [${s.minKey}..${s.maxKey}] -> ${s.shardId}`,
        };
      }
    }
    const last = activeShards[activeShards.length - 1]!;
    return {
      shardId: last.shardId,
      hashValue: numKey,
      explanation: `Range fallback -> ${last.shardId}`,
    };
  }

  if (strategy === "hash_modulo") {
    const idx = keyHash % activeShards.length;
    const picked = activeShards[idx]!;
    return {
      shardId: picked.shardId,
      hashValue: keyHash,
      explanation: `Hash modulo: fnv1a(${key})=${keyHash} mod ${activeShards.length} = ${idx} -> ${picked.shardId}`,
    };
  }

  // consistent_hash: assign shard by clockwise ring owner of key, mapping cleanly to logical shards
  const ringOwner = resolveRingNodeForHash(hashRing, keyHash);
  const ownedShard =
    activeShards.find((s) => s.primaryNodeId === ringOwner) ??
    activeShards[keyHash % activeShards.length]!;
  return {
    shardId: ownedShard.shardId,
    hashValue: keyHash,
    explanation: `Consistent hash ring: hash=${keyHash} -> clockwise node=${ringOwner ?? "none"} -> ${ownedShard.shardId}`,
  };
}

