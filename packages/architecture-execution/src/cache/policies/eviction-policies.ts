import type {
  CacheEntry,
  EvictionDecision,
  EvictionPolicyType,
} from "../cache-schemas";

export interface EvictionContext {
  cacheNodeId: string;
  virtualClockMs: number;
  policy: EvictionPolicyType;
  capacityLimit: number;
  currentCount: number;
}

export interface IEvictionPolicy {
  readonly id: EvictionPolicyType;
  selectVictim(
    entries: readonly CacheEntry[],
    context: EvictionContext
  ): EvictionDecision;
}

/**
 * LRU (Least Recently Used) Eviction Policy.
 * Selects the entry with the oldest `lastAccessedAtMs`.
 * Deterministic tie-breaker: lowest `insertionSequence`.
 */
export class LruEvictionPolicy implements IEvictionPolicy {
  public readonly id: EvictionPolicyType = "lru";

  public selectVictim(
    entries: readonly CacheEntry[],
    context: EvictionContext
  ): EvictionDecision {
    if (entries.length === 0) {
      return {
        policy: "lru",
        victimKey: null,
        reason: "No entries available to evict.",
        evaluatedCandidateKeys: [],
        atMs: context.virtualClockMs,
      };
    }

    // Sort: lowest lastAccessedAtMs first; on tie, lowest insertionSequence
    const sorted = [...entries].sort((a, b) => {
      if (a.lastAccessedAtMs !== b.lastAccessedAtMs) {
        return a.lastAccessedAtMs - b.lastAccessedAtMs;
      }
      return a.insertionSequence - b.insertionSequence;
    });

    const victim = sorted[0];
    return {
      policy: "lru",
      victimKey: victim.key,
      reason: `LRU: Key '${victim.key}' is the least recently accessed (last access: ${victim.lastAccessedAtMs}ms, seq: #${victim.insertionSequence}).`,
      evaluatedCandidateKeys: sorted.map((e) => e.key),
      atMs: context.virtualClockMs,
    };
  }
}

/**
 * LFU (Least Frequently Used) Eviction Policy.
 * Selects the entry with the lowest `accessCount`.
 * Deterministic tie-breakers:
 * 1. Lowest accessCount
 * 2. Lowest lastAccessedAtMs (oldest access)
 * 3. Lowest insertionSequence
 */
export class LfuEvictionPolicy implements IEvictionPolicy {
  public readonly id: EvictionPolicyType = "lfu";

  public selectVictim(
    entries: readonly CacheEntry[],
    context: EvictionContext
  ): EvictionDecision {
    if (entries.length === 0) {
      return {
        policy: "lfu",
        victimKey: null,
        reason: "No entries available to evict.",
        evaluatedCandidateKeys: [],
        atMs: context.virtualClockMs,
      };
    }

    const sorted = [...entries].sort((a, b) => {
      if (a.accessCount !== b.accessCount) {
        return a.accessCount - b.accessCount;
      }
      if (a.lastAccessedAtMs !== b.lastAccessedAtMs) {
        return a.lastAccessedAtMs - b.lastAccessedAtMs;
      }
      return a.insertionSequence - b.insertionSequence;
    });

    const victim = sorted[0];
    return {
      policy: "lfu",
      victimKey: victim.key,
      reason: `LFU: Key '${victim.key}' is the least frequently used (${victim.accessCount} accesses; tie-broken by last access ${victim.lastAccessedAtMs}ms, seq: #${victim.insertionSequence}).`,
      evaluatedCandidateKeys: sorted.map((e) => e.key),
      atMs: context.virtualClockMs,
    };
  }
}

/**
 * FIFO (First In First Out) Eviction Policy.
 * Selects the oldest inserted entry based strictly on `insertionSequence`.
 * Read hits do NOT affect insertion order.
 */
export class FifoEvictionPolicy implements IEvictionPolicy {
  public readonly id: EvictionPolicyType = "fifo";

  public selectVictim(
    entries: readonly CacheEntry[],
    context: EvictionContext
  ): EvictionDecision {
    if (entries.length === 0) {
      return {
        policy: "fifo",
        victimKey: null,
        reason: "No entries available to evict.",
        evaluatedCandidateKeys: [],
        atMs: context.virtualClockMs,
      };
    }

    const sorted = [...entries].sort((a, b) => a.insertionSequence - b.insertionSequence);
    const victim = sorted[0];
    return {
      policy: "fifo",
      victimKey: victim.key,
      reason: `FIFO: Key '${victim.key}' was inserted earliest (seq: #${victim.insertionSequence}). Reads do not update FIFO rank.`,
      evaluatedCandidateKeys: sorted.map((e) => e.key),
      atMs: context.virtualClockMs,
    };
  }
}

/**
 * No-Eviction Policy (`noeviction`).
 * Rejects writes when memory capacity is reached instead of evicting entries.
 */
export class NoEvictionPolicy implements IEvictionPolicy {
  public readonly id: EvictionPolicyType = "noeviction";

  public selectVictim(
    entries: readonly CacheEntry[],
    context: EvictionContext
  ): EvictionDecision {
    return {
      policy: "noeviction",
      victimKey: null,
      reason: `noeviction: Capacity limit of ${context.capacityLimit} reached. New writes rejected with OOM error.`,
      evaluatedCandidateKeys: entries.map((e) => e.key),
      atMs: context.virtualClockMs,
    };
  }
}

/**
 * Unified Eviction Manager delegating to policy instances.
 */
export class EvictionManager {
  private static policies: Record<EvictionPolicyType, IEvictionPolicy> = {
    lru: new LruEvictionPolicy(),
    lfu: new LfuEvictionPolicy(),
    fifo: new FifoEvictionPolicy(),
    noeviction: new NoEvictionPolicy(),
  };

  public static selectVictim(
    entries: readonly CacheEntry[],
    context: EvictionContext
  ): EvictionDecision {
    const policyImpl = this.policies[context.policy] || this.policies.lru;
    return policyImpl.selectVictim(entries, context);
  }
}
