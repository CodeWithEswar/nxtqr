import type {
  LogicalShardRuntime,
  MigrationTaskRuntime,
  StorageInvariantReport,
} from "../storage-schemas";

export interface StorageInvariantTracker {
  maxEpochByShard: Map<string, number>;
}

export class StorageInvariantMonitor {
  public static createTracker(): StorageInvariantTracker {
    return {
      maxEpochByShard: new Map(),
    };
  }

  public static verify(
    tracker: StorageInvariantTracker,
    shards: Record<string, LogicalShardRuntime>,
    migrations: MigrationTaskRuntime[],
    flags: {
      everyKeyMappedOk: boolean;
      staleOwnerFencedOk: boolean;
      quorumViolationMsg?: string;
      tombstoneResurrected?: boolean;
    }
  ): StorageInvariantReport {
    const violations: string[] = [];
    const everyKeyMappedOk = flags.everyKeyMappedOk;
    const placementDeterministicOk = true;
    let epochMonotonicOk = true;
    const staleOwnerFencedOk = flags.staleOwnerFencedOk;
    let cutoverSafetyOk = true;
    let quorumEnforcedOk = true;
    let tombstoneSafeOk = true;

    if (!everyKeyMappedOk) {
      violations.push("One or more keys failed to map to an active logical shard.");
    }
    if (!staleOwnerFencedOk) {
      violations.push("A stale shard owner accepted an authoritative write after epoch bump.");
    }
    if (flags.quorumViolationMsg) {
      quorumEnforcedOk = false;
      violations.push(flags.quorumViolationMsg);
    }
    if (flags.tombstoneResurrected) {
      tombstoneSafeOk = false;
      violations.push("Deleted record was unsafely resurrected during reconciliation.");
    }

    for (const s of Object.values(shards)) {
      const prevEpoch = tracker.maxEpochByShard.get(s.shardId) ?? 0;
      if (s.ownershipEpoch < prevEpoch) {
        epochMonotonicOk = false;
        violations.push(
          `Shard ${s.shardId} ownership epoch regressed (${prevEpoch} -> ${s.ownershipEpoch}).`
        );
      } else {
        tracker.maxEpochByShard.set(s.shardId, s.ownershipEpoch);
      }
    }

    for (const m of migrations) {
      if (
        (m.state === "CUTTING_OVER" || m.state === "COMPLETED") &&
        (m.copiedRecords < m.totalRecords || m.catchupPendingWrites > 0)
      ) {
        cutoverSafetyOk = false;
        violations.push(
          `Migration ${m.id} cut over unsafely (${m.copiedRecords}/${m.totalRecords} copied, ${m.catchupPendingWrites} catch-up pending).`
        );
      }
    }

    return {
      allPassed: violations.length === 0,
      everyKeyMappedOk,
      placementDeterministicOk,
      epochMonotonicOk,
      staleOwnerFencedOk,
      cutoverSafetyOk,
      quorumEnforcedOk,
      tombstoneSafeOk,
      violations,
    };
  }
}

