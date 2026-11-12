import { describe, expect, it } from "vitest";
import {
  DISTRIBUTED_STORAGE_PRESET_METADATA,
  DistributedStorageExecutionEngine,
  StorageScenarioSchema,
  buildConsistentHashRing,
  createDistributedStoragePresetScenario,
  hashKeyCanonical,
  resolveShardForKey,
} from "../index";

function getFinalStorageState(
  presetId: (typeof DISTRIBUTED_STORAGE_PRESET_METADATA)[number]["id"]
) {
  const scenario = createDistributedStoragePresetScenario(presetId);
  const trace = DistributedStorageExecutionEngine.runScenario(scenario);
  const lastFrame = trace.frames[trace.frames.length - 1];
  const storageState = lastFrame?.runtimeState?.distributedStorageState;
  return { scenario, trace, storageState };
}

describe("DistributedStorageExecutionEngine — Phase 05.4.15 (Sharding, Replication & Rebalancing)", () => {
  it("runs all 34 presets deterministically with zero protocol invariant violations", () => {
    expect(DISTRIBUTED_STORAGE_PRESET_METADATA.length).toBe(34);

    for (const meta of DISTRIBUTED_STORAGE_PRESET_METADATA) {
      const sA = createDistributedStoragePresetScenario(meta.id);
      const sB = createDistributedStoragePresetScenario(meta.id);
      expect(() => StorageScenarioSchema.parse(sA)).not.toThrow();

      const tA = DistributedStorageExecutionEngine.runScenario(sA);
      const tB = DistributedStorageExecutionEngine.runScenario(sB);

      expect(tA.frames.length).toBeGreaterThan(0);
      expect(tA.events.length).toBe(tB.events.length);

      const finalA =
        tA.frames[tA.frames.length - 1]?.runtimeState?.distributedStorageState;
      const finalB =
        tB.frames[tB.frames.length - 1]?.runtimeState?.distributedStorageState;

      expect(finalA).toBeDefined();
      expect(finalB).toBeDefined();
      expect(finalA?.metrics).toEqual(finalB?.metrics);
      expect(finalA?.shards).toEqual(finalB?.shards);
      expect(finalA?.nodes).toEqual(finalB?.nodes);
      expect(
        finalA?.invariants.allPassed,
        `${meta.id} violated invariants: ${finalA?.invariants.violations.join("; ")}`
      ).toBe(true);
    }
  });

  it("validates canonical hashing, consistent hash ring, and range split/merge mechanics", () => {
    const h1 = hashKeyCanonical("customer-42");
    const h2 = hashKeyCanonical("customer-42");
    expect(h1).toBe(h2);

    const ring = buildConsistentHashRing(["node-a", "node-b"], 4);
    expect(ring.length).toBe(8);
    expect(ring.every((t, idx) => idx === 0 || ring[idx - 1]!.token <= t.token)).toBe(true);

    const { storageState: rangeState } = getFinalStorageState("range_partitioning");
    expect(rangeState?.strategy).toBe("range");
    expect(
      resolveShardForKey("3000", "range", rangeState!.shards, rangeState!.hashRing).shardId
    ).toBe("R2");

    const { storageState: splitState } = getFinalStorageState("shard_splitting");
    expect(splitState?.shards["R1"]?.retired).toBe(true);
    expect(splitState?.shards["R1a"]).toBeDefined();
    expect(splitState?.shards["R1b"]).toBeDefined();

    const { storageState: mergeState } = getFinalStorageState("shard_merging");
    expect(mergeState?.shards["R1"]?.retired).toBe(true);
    expect(mergeState?.shards["R2"]?.retired).toBe(true);
    expect(mergeState?.shards["R1_R2"]).toBeDefined();
  });

  it("models leader-based stale follower reads, leaderless quorums, conflicts, repairs, tombstones, and uncertain writes", () => {
    const { storageState: staleState } = getFinalStorageState("stale_follower_read");
    expect(staleState?.metrics.staleReads).toBeGreaterThanOrEqual(1);
    expect(staleState?.recentOperations.some((op) => op.staleReadDetected)).toBe(true);

    const { storageState: quorumWriteState } = getFinalStorageState("quorum_write");
    expect(quorumWriteState?.quorumConfig?.overlapStrong).toBe(true);
    expect(quorumWriteState?.metrics.writesCompleted).toBeGreaterThanOrEqual(1);

    const { storageState: quorumReadState } = getFinalStorageState("quorum_read");
    expect(quorumReadState?.metrics.readsCompleted).toBeGreaterThanOrEqual(1);

    const { storageState: conflictState } = getFinalStorageState("concurrent_conflicting_writes");
    expect(conflictState?.metrics.conflictsDetected).toBeGreaterThanOrEqual(1);
    expect(conflictState?.conflicts.length).toBeGreaterThanOrEqual(1);

    const { storageState: rrState } = getFinalStorageState("read_repair");
    expect(rrState?.metrics.repairsCompleted).toBeGreaterThanOrEqual(1);
    expect(rrState?.repairs.some((r) => r.kind === "read_repair" && r.status === "completed")).toBe(true);

    const { storageState: hhState } = getFinalStorageState("hinted_handoff");
    expect(hhState?.repairs.some((r) => r.kind === "hinted_handoff" && r.status === "completed")).toBe(true);

    const { storageState: aeState } = getFinalStorageState("anti_entropy_repair");
    expect(aeState?.repairs.some((r) => r.kind === "anti_entropy" && r.status === "completed")).toBe(true);

    const { storageState: tombState } = getFinalStorageState("tombstone_reconciliation");
    const lastRead = [...(tombState?.recentOperations ?? [])]
      .reverse()
      .find((op) => op.kind === "read");
    expect(lastRead?.returnedValue).toBe("<DELETED>");
    expect(tombState?.invariants.tombstoneSafeOk).toBe(true);

    const { storageState: uncertainState } = getFinalStorageState("write_timeout_uncertainty");
    expect(uncertainState?.metrics.uncertainWrites).toBeGreaterThanOrEqual(1);
  });

  it("models node failure failover, epochs, live shard migration, crash recovery, stale routing, and hot shard throttling", () => {
    const { storageState: failState } = getFinalStorageState("node_failure");
    expect(failState?.nodes["node-a"]?.online).toBe(false);
    expect(Object.values(failState?.shards ?? {}).some((s) => s.ownershipEpoch > 1)).toBe(true);

    const { storageState: liveMig } = getFinalStorageState("live_shard_migration");
    expect(liveMig?.metrics.migrationsCompleted).toBeGreaterThanOrEqual(1);
    expect(liveMig?.migrations.some((m) => m.state === "COMPLETED" && (m.ownershipEpochAfter ?? 0) > m.ownershipEpochBefore)).toBe(true);

    const { storageState: migFail } = getFinalStorageState("migration_failure");
    expect(migFail?.migrations.some((m) => m.state === "FAILED")).toBe(true);
    expect(migFail?.invariants.cutoverSafetyOk).toBe(true);

    const { storageState: migRec } = getFinalStorageState("migration_recovery");
    expect(migRec?.migrations.some((m) => m.state === "COMPLETED")).toBe(true);

    const { storageState: staleMap } = getFinalStorageState("stale_routing_map");
    expect(staleMap?.recentOperations.some((op) => op.outcome === "stale_map_redirected")).toBe(true);

    const { storageState: hotState } = getFinalStorageState("hot_key");
    expect(hotState?.metrics.hotKey).toBe("hotkey:flash-sale");

    const { storageState: capState } = getFinalStorageState("capacity_exhaustion");
    expect(capState?.metrics.throttledRequests).toBeGreaterThanOrEqual(1);
  });
});
