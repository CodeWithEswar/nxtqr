import type { PartitioningStrategy } from "../streaming-schemas";

export class StreamPartitioner {
  private static roundRobinCounters: Record<string, number> = {};

  /**
   * 32-bit FNV-1a deterministic string hashing function.
   */
  public static hashKey(key: string): number {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Deterministically determines target partition index.
   */
  public static selectPartition(
    strategy: PartitioningStrategy,
    topicId: string,
    partitionCount: number,
    key?: string,
    partitionOverride?: number
  ): { partitionIndex: number; strategyUsed: string; hashValue?: number } {
    if (partitionCount <= 0) {
      return { partitionIndex: 0, strategyUsed: "fallback" };
    }

    if (partitionOverride !== undefined && partitionOverride >= 0) {
      return {
        partitionIndex: partitionOverride % partitionCount,
        strategyUsed: "override",
      };
    }

    if (strategy === "key_hash" && key !== undefined && key.trim().length > 0) {
      const hashValue = this.hashKey(key);
      const partitionIndex = hashValue % partitionCount;
      return {
        partitionIndex,
        strategyUsed: "key_hash",
        hashValue,
      };
    }

    // Default or keyless fallback: round-robin
    const current = this.roundRobinCounters[topicId] || 0;
    const partitionIndex = current % partitionCount;
    this.roundRobinCounters[topicId] = current + 1;

    return {
      partitionIndex,
      strategyUsed: "round_robin",
    };
  }

  public static resetCounters(): void {
    this.roundRobinCounters = {};
  }
}

