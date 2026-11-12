import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import {
  StorageScenarioSchema,
  type HashRingToken,
  type LogicalShardRuntime,
  type MigrationTaskRuntime,
  type ModeledDistributedStorageRuntimeState,
  type OperationTraceEntry,
  type PhysicalReplicaRuntime,
  type RepairTaskRecord,
  type StorageConflictRecord,
  type StorageMetrics,
  type StorageNodeRuntime,
  type StorageRecord,
  type StorageScenario,
} from "./storage-schemas";
import {
  buildConsistentHashRing,
  resolveShardForKey,
} from "./partitioning/partitioning-engine";
import {
  computeReplicaPlacement,
  planBalancedRebalance,
} from "./placement/placement-engine";
import { StorageInvariantMonitor } from "./invariants/storage-invariants";

function createSeededPrng(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type StorageQueueItem =
  | { kind: "workload_op"; atMs: number; seq: number; opId: string }
  | { kind: "migration_trigger"; atMs: number; seq: number; triggerId: string }
  | { kind: "migration_tick"; atMs: number; seq: number; migrationId: string; bandwidth: number }
  | { kind: "shard_split"; atMs: number; seq: number; shardId: string; splitKey: number }
  | { kind: "shard_merge"; atMs: number; seq: number; leftShardId: string; rightShardId: string }
  | { kind: "fault_apply"; atMs: number; seq: number; faultId: string }
  | { kind: "fault_revert"; atMs: number; seq: number; faultId: string }
  | { kind: "anti_entropy_tick"; atMs: number; seq: number };

export class DistributedStorageExecutionEngine {
  public static runScenario(rawScenario: StorageScenario): ExecutionTrace {
    const parsed = StorageScenarioSchema.parse(rawScenario);
    const rng = createSeededPrng(parsed.seed);
    const baseRuntime = RuntimeStateHelper.createInitialState();
    const runId = `storage_run_${parsed.id}_${parsed.seed}`;
    const invariantTracker = StorageInvariantMonitor.createTracker();

    let virtualTimeMs = 0;
    let seqCounter = 0;
    let eventCounter = 0;
    let versionSeq = 0;
    let activePartitions: string[][] = [];
    let dropReplicationToNode: string | null = null;
    const replicaLagOverride: Record<string, number> = {};
    const everyKeyMappedOk = true;
    let staleOwnerFencedOk = true;
    const quorumViolationMsg: string | undefined = undefined;
    const tombstoneResurrected = false;

    const nodes: Record<string, StorageNodeRuntime> = {};
    for (const nc of parsed.nodes) {
      nodes[nc.id] = {
        id: nc.id,
        label: nc.label,
        region: nc.region,
        zone: nc.zone,
        capacityRecords: nc.capacityRecords,
        usedRecords: 0,
        readCapacityOps: nc.readCapacityOps,
        writeCapacityOps: nc.writeCapacityOps,
        activeOps: 0,
        throttledOps: 0,
        online: nc.online,
        joined: nc.joined,
        ownedShardIds: [],
        hostedReplicaShardIds: [],
      };
    }

    const activeNodeIdsForRing = () =>
      Object.values(nodes)
        .filter((n) => n.joined)
        .map((n) => n.id);

    let hashRing: HashRingToken[] = buildConsistentHashRing(
      activeNodeIdsForRing(),
      parsed.partitioning.virtualNodesPerNode
    );

    const shards: Record<string, LogicalShardRuntime> = {};
    const replicas: Record<string, PhysicalReplicaRuntime> = {};
    const placementViolations: string[] = [];

    const rf = parsed.replication.replicationFactor;
    const shardCount =
      parsed.partitioning.strategy === "range" && parsed.partitioning.ranges.length > 0
        ? parsed.partitioning.ranges.length
        : parsed.partitioning.shardCount;

    for (let i = 0; i < shardCount; i++) {
      const rangeCfg =
        parsed.partitioning.strategy === "range"
          ? parsed.partitioning.ranges[i]
          : undefined;
      const shardId = rangeCfg?.shardId ?? `S${i + 1}`;
      const placement = computeReplicaPlacement(
        i,
        rf,
        Object.values(nodes),
        parsed.placement.policy,
        parsed.placement.allowSameNodeForSynthetic
      );
      placementViolations.push(...placement.violations);

      shards[shardId] = {
        shardId,
        minKey: rangeCfg?.minKey,
        maxKey: rangeCfg?.maxKey,
        primaryNodeId: placement.primaryNodeId,
        replicaNodeIds: placement.replicaNodeIds,
        ownershipEpoch: 1,
        recordCount: 0,
        requestCount: 0,
        migrationState: "NONE",
      };

      placement.replicaNodeIds.forEach((nid, rIdx) => {
        const repId = `${shardId}@${nid}`;
        replicas[repId] = {
          replicaId: repId,
          shardId,
          nodeId: nid,
          role:
            parsed.replication.mode === "leader_based"
              ? rIdx === 0
                ? "leader"
                : "follower"
              : "peer",
          healthy: nodes[nid]?.online ?? true,
          lagMs:
            parsed.replication.mode === "leader_based" && rIdx > 0
              ? parsed.replication.baseReplicaLagMs
              : 0,
          latestAppliedSeq: 0,
          records: {},
        };
        if (nodes[nid]) {
          nodes[nid]!.hostedReplicaShardIds.push(shardId);
          if (rIdx === 0) nodes[nid]!.ownedShardIds.push(shardId);
        }
      });
    }

    // Populate synthetic dataset deterministically
    const hotKeyCounts: Record<string, { shardId: string; count: number }> = {};
    for (let k = 0; k < parsed.dataset.recordCount; k++) {
      const isHot =
        parsed.dataset.keyPattern === "skewed_hot_key" &&
        rng() < parsed.dataset.hotKeyFraction;
      const key = isHot
        ? parsed.dataset.hotKey
        : parsed.dataset.keyPattern === "numeric_range"
          ? `k-${String(Math.floor((k * 9999) / Math.max(1, parsed.dataset.recordCount))).padStart(4, "0")}`
          : `key-${k + 1}`;

      const res = resolveShardForKey(
        key,
        parsed.partitioning.strategy,
        shards,
        hashRing
      );
      const shard = shards[res.shardId];
      if (!shard) continue;

      if (!hotKeyCounts[key]) hotKeyCounts[key] = { shardId: shard.shardId, count: 0 };
      hotKeyCounts[key]!.count += 1;

      const seq = ++versionSeq;
      const rec: StorageRecord = {
        key,
        value: `init-${k + 1}`,
        version: {
          epoch: shard.ownershipEpoch,
          seq,
          timestampMs: 0,
          writerId: "seed",
          vectorClock: { seed: seq },
        },
        deleted: false,
        sizeBytes: 128,
      };

      const isNewKey =
        replicas[`${shard.shardId}@${shard.primaryNodeId}`]?.records[key] === undefined;
      for (const nid of shard.replicaNodeIds) {
        const rep = replicas[`${shard.shardId}@${nid}`];
        if (rep) {
          rep.records[key] = { ...rec, version: { ...rec.version, vectorClock: { ...rec.version.vectorClock } } };
          rep.latestAppliedSeq = Math.max(rep.latestAppliedSeq, seq);
          if (isNewKey && nodes[nid]) nodes[nid]!.usedRecords += 1;
        }
      }
      if (isNewKey) shard.recordCount += 1;
    }

    const recentOperations: OperationTraceEntry[] = [];
    const conflicts: StorageConflictRecord[] = [];
    const repairs: RepairTaskRecord[] = [];
    const migrations: MigrationTaskRuntime[] = [];
    const readLatencies: number[] = [];
    const writeLatencies: number[] = [];

    let readsCompleted = 0;
    let writesCompleted = 0;
    let uncertainWrites = 0;
    let staleReads = 0;
    let repairsCompleted = 0;
    let throttledRequests = 0;
    let migrationsStarted = 0;
    let migrationsCompleted = 0;
    let dataMovedBytes = 0;

    const consistencyCaveats: string[] = [
      "Quorum overlap (R + W > N) alone does not guarantee strict linearizability without leader fencing or consensus reads.",
      "Hinted handoff improves write availability during temporary outages but is not equivalent to durable quorum replication.",
      "Tombstones are retained for garbage-collection grace windows so stale replicas cannot resurrect deleted keys during anti-entropy.",
    ];

    const events: ExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    const queue: StorageQueueItem[] = [];

    type NewItem = StorageQueueItem extends infer U
      ? U extends StorageQueueItem
        ? Omit<U, "seq"> & { seq?: number }
        : never
      : never;

    const schedule = (item: NewItem) => {
      if (item.atMs > parsed.limits.maxVirtualDurationMs) return;
      queue.push({ ...item, seq: ++seqCounter } as StorageQueueItem);
    };

    const popNext = (): StorageQueueItem | undefined => {
      if (queue.length === 0) return undefined;
      let best = 0;
      for (let i = 1; i < queue.length; i++) {
        const a = queue[i]!;
        const b = queue[best]!;
        if (a.atMs < b.atMs || (a.atMs === b.atMs && a.seq < b.seq)) best = i;
      }
      const picked = queue[best]!;
      queue.splice(best, 1);
      return picked;
    };

    const isPartitioned = (a: string, b: string): boolean => {
      if (activePartitions.length === 0 || a === b) return false;
      for (const grp of activePartitions) {
        if (grp.includes(a) && grp.includes(b)) return false;
      }
      return true;
    };

    const nextEvtBase = (causationId?: string) => {
      const seq = ++eventCounter;
      return {
        id: `st_evt_${seq}`,
        sequence: seq,
        atMs: virtualTimeMs,
        durationMs: 0,
        explanation: "",
        traceId: parsed.id,
        spanId: causationId ?? `span_${seq}`,
      };
    };

    const emitFrame = (
      ev: ExecutionEvent,
      stepTitle: string,
      stepExplanation: string,
      activeNodeIds: string[]
    ) => {
      if (events.length >= parsed.limits.maxEvents) return;
      events.push({ ...ev, explanation: stepExplanation });

      // Compute hot shard / hot key + metrics
      let hotShardId: string | null = null;
      let maxReq = 0;
      for (const s of Object.values(shards)) {
        if (!s.retired && s.requestCount > maxReq) {
          maxReq = s.requestCount;
          hotShardId = s.shardId;
        }
      }
      const hotList = Object.entries(hotKeyCounts)
        .map(([key, info]) => ({ key, requests: info.count, shardId: info.shardId }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 8);

      let maxLag = 0;
      for (const r of Object.values(replicas)) {
        if (r.lagMs > maxLag) maxLag = r.lagMs;
      }

      const avg = (arr: number[]) =>
        arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

      const totalRecords = Object.values(shards)
        .filter((s) => !s.retired)
        .reduce((acc, s) => acc + s.recordCount, 0);

      const metrics: StorageMetrics = {
        totalNodes: Object.keys(nodes).length,
        onlineNodes: Object.values(nodes).filter((n) => n.joined && n.online).length,
        logicalShards: Object.values(shards).filter((s) => !s.retired).length,
        totalReplicas: Object.keys(replicas).length,
        totalRecords,
        readsCompleted,
        writesCompleted,
        uncertainWrites,
        staleReads,
        conflictsDetected: conflicts.length,
        repairsCompleted,
        hintsPending: repairs.filter((r) => r.kind === "hinted_handoff" && r.status === "pending").length,
        throttledRequests,
        migrationsStarted,
        migrationsCompleted,
        dataMovedBytes,
        maxReplicaLagMs: maxLag,
        hotShardId,
        hotKey: hotList[0]?.key ?? null,
        avgReadLatencyMs: avg(readLatencies),
        avgWriteLatencyMs: avg(writeLatencies),
      };

      const invariants = StorageInvariantMonitor.verify(
        invariantTracker,
        shards,
        migrations,
        {
          everyKeyMappedOk,
          staleOwnerFencedOk,
          quorumViolationMsg,
          tombstoneResurrected,
        }
      );

      const clonedNodes: Record<string, StorageNodeRuntime> = {};
      for (const [k, n] of Object.entries(nodes)) {
        clonedNodes[k] = {
          ...n,
          ownedShardIds: [...n.ownedShardIds],
          hostedReplicaShardIds: [...n.hostedReplicaShardIds],
        };
      }
      const clonedShards: Record<string, LogicalShardRuntime> = {};
      for (const [k, s] of Object.entries(shards)) {
        clonedShards[k] = { ...s, replicaNodeIds: [...s.replicaNodeIds] };
      }
      const clonedReplicas: Record<string, PhysicalReplicaRuntime> = {};
      for (const [k, r] of Object.entries(replicas)) {
        const clonedRecs: Record<string, StorageRecord> = {};
        for (const [rk, rv] of Object.entries(r.records)) {
          clonedRecs[rk] = {
            ...rv,
            version: { ...rv.version, vectorClock: { ...rv.version.vectorClock } },
          };
        }
        clonedReplicas[k] = { ...r, records: clonedRecs };
      }

      const quorumConfig =
        parsed.replication.mode === "leaderless"
          ? {
              n: parsed.replication.replicationFactor,
              r: parsed.replication.readQuorum,
              w: parsed.replication.writeQuorum,
              overlapStrong:
                parsed.replication.readQuorum + parsed.replication.writeQuorum >
                parsed.replication.replicationFactor,
            }
          : undefined;

      const snapshot: ModeledDistributedStorageRuntimeState = {
        virtualTimeMs,
        strategy: parsed.partitioning.strategy,
        replicationMode: parsed.replication.mode,
        quorumConfig,
        placementViolations: [...placementViolations],
        activePartitions: activePartitions.map((g) => [...g]),
        nodes: clonedNodes,
        shards: clonedShards,
        replicas: clonedReplicas,
        hashRing: hashRing.map((t) => ({ ...t })),
        recentOperations: recentOperations.slice(-40).map((o) => ({
          ...o,
          targetReplicas: [...o.targetReplicas],
          respondedReplicas: [...o.respondedReplicas],
        })),
        conflicts: conflicts.map((c) => ({
          ...c,
          competingValues: c.competingValues.map((cv) => ({ ...cv })),
        })),
        repairs: repairs.map((rp) => ({ ...rp })),
        migrations: migrations.map((m) => ({ ...m })),
        hotKeys: hotList,
        consistencyCaveats,
        invariants,
        metrics,
      };

      const clonedRuntime = RuntimeStateHelper.cloneState(baseRuntime);
      clonedRuntime.distributedStorageState = snapshot;

      frames.push({
        frameIndex: frames.length,
        virtualTimeMs,
        activeNodeIds,
        activeEdgeIds: [],
        activeEvent: { ...ev, explanation: stepExplanation },
        direction: "request",
        stepTitle,
        stepExplanation,
        runtimeState: clonedRuntime,
      });
    };

    // Initial baseline frame so step 0 shows initial shard/node/hash-ring placement!
    emitFrame(
      {
        ...nextEvtBase(),
        type: "storage.placement.updated",
        shardId: Object.keys(shards)[0] ?? "S1",
        ownershipEpoch: 1,
        primaryNodeId: Object.values(shards)[0]?.primaryNodeId ?? null,
      },
      `Initial Cluster Placement (${shardCount} shards · RF=${rf})`,
      `Initialized ${Object.keys(nodes).length} storage nodes, ${shardCount} logical shards (${parsed.partitioning.strategy}), ${parsed.dataset.recordCount} synthetic records.`,
      activeNodeIdsForRing()
    );

    // Schedule faults, workload ops, migrations, splits, merges & anti-entropy
    for (const f of parsed.failures) {
      schedule({ kind: "fault_apply", atMs: f.atMs, faultId: f.id });
      if (f.durationMs && f.durationMs > 0) {
        schedule({ kind: "fault_revert", atMs: f.atMs + f.durationMs, faultId: f.id });
      }
    }
    for (const op of parsed.workload) {
      schedule({ kind: "workload_op", atMs: op.atMs, opId: op.id });
    }
    for (const m of parsed.migrations) {
      schedule({ kind: "migration_trigger", atMs: m.atMs, triggerId: m.id });
    }
    for (const sp of parsed.partitioning.splitOps) {
      schedule({ kind: "shard_split", atMs: sp.atMs, shardId: sp.shardId, splitKey: sp.splitKey });
    }
    for (const mg of parsed.partitioning.mergeOps) {
      schedule({
        kind: "shard_merge",
        atMs: mg.atMs,
        leftShardId: mg.leftShardId,
        rightShardId: mg.rightShardId,
      });
    }
    if (parsed.replication.antiEntropyEnabled) {
      schedule({ kind: "anti_entropy_tick", atMs: 280 });
    }

    // Event execution loop
    while (queue.length > 0 && events.length < parsed.limits.maxEvents) {
      const item = popNext()!;
      virtualTimeMs = item.atMs;

      switch (item.kind) {
        case "fault_apply": {
          const fault = parsed.failures.find((f) => f.id === item.faultId);
          if (!fault) break;

          if (fault.type === "node_crash" || fault.type === "zone_failure") {
            const impactedIds =
              fault.type === "zone_failure"
                ? Object.values(nodes)
                    .filter((n) => n.zone === fault.targetId)
                    .map((n) => n.id)
                : [fault.targetId];

            for (const nid of impactedIds) {
              const n = nodes[nid];
              if (!n) continue;
              n.online = false;
              for (const rep of Object.values(replicas)) {
                if (rep.nodeId === nid) rep.healthy = false;
              }
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "storage.node.failed",
                  nodeId: nid,
                  reason: `${fault.type} on ${fault.targetId}`,
                },
                `Node Failed: ${n.label}`,
                `${n.label} (${n.zone}) went offline. Durable local data preserved; replicas marked unavailable.`,
                [nid]
              );

              // Failover primary shard ownership in leader_based mode & bump fencing epoch!
              if (parsed.replication.mode === "leader_based") {
                for (const s of Object.values(shards)) {
                  if (!s.retired && s.primaryNodeId === nid) {
                    const successor = s.replicaNodeIds.find(
                      (cand) => cand !== nid && nodes[cand]?.online
                    );
                    if (successor) {
                      s.primaryNodeId = successor;
                      s.ownershipEpoch += 1;
                      for (const rid of s.replicaNodeIds) {
                        const r = replicas[`${s.shardId}@${rid}`];
                        if (r) r.role = rid === successor ? "leader" : "follower";
                      }
                      emitFrame(
                        {
                          ...nextEvtBase(),
                          type: "storage.placement.updated",
                          shardId: s.shardId,
                          ownershipEpoch: s.ownershipEpoch,
                          primaryNodeId: successor,
                        },
                        `Leader Failover: ${s.shardId} → ${successor} (Epoch ${s.ownershipEpoch})`,
                        `Promoted online replica ${successor} to primary owner for ${s.shardId}; incremented epoch to fence stale owner ${nid}.`,
                        [successor]
                      );
                    }
                  }
                }
              }
            }
          } else if (fault.type === "node_recover") {
            const n = nodes[fault.targetId];
            if (n) {
              n.online = true;
              for (const rep of Object.values(replicas)) {
                if (rep.nodeId === n.id) rep.healthy = true;
              }
              // Deliver any pending hinted handoffs for this node!
              for (const hp of repairs) {
                if (
                  hp.kind === "hinted_handoff" &&
                  hp.targetNodeId === n.id &&
                  hp.status === "pending"
                ) {
                  // Apply hint from healthy peer
                  const shard = shards[hp.shardId];
                  const donorId = shard?.replicaNodeIds.find(
                    (id) => id !== n.id && nodes[id]?.online
                  );
                  const donorRec = donorId
                    ? replicas[`${hp.shardId}@${donorId}`]?.records[hp.key]
                    : undefined;
                  const targetRep = replicas[`${hp.shardId}@${n.id}`];
                  if (donorRec && targetRep) {
                    targetRep.records[hp.key] = {
                      ...donorRec,
                      version: {
                        ...donorRec.version,
                        vectorClock: { ...donorRec.version.vectorClock },
                      },
                    };
                    targetRep.latestAppliedSeq = Math.max(
                      targetRep.latestAppliedSeq,
                      donorRec.version.seq
                    );
                  }
                  hp.status = "completed";
                  hp.completedAtMs = virtualTimeMs;
                  repairsCompleted += 1;
                  emitFrame(
                    {
                      ...nextEvtBase(),
                      type: "storage.repair.completed",
                      repairId: hp.id,
                      kind: "hinted_handoff",
                      shardId: hp.shardId,
                      targetNodeId: n.id,
                    },
                    `Hinted Handoff Delivered → ${n.label}`,
                    `Delivered stored hint for key '${hp.key}' (${hp.shardId}) to recovered node ${n.label}.`,
                    [n.id]
                  );
                }
              }
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "storage.node.recovered",
                  nodeId: n.id,
                },
                `Node Recovered: ${n.label}`,
                `${n.label} restored durable storage and rejoined healthy cluster membership.`,
                [n.id]
              );
            }
          } else if (fault.type === "network_partition" && fault.partitionGroups) {
            activePartitions = fault.partitionGroups.map((g) => [...g]);
          } else if (fault.type === "partition_heal") {
            activePartitions = [];
          } else if (fault.type === "replica_lag") {
            replicaLagOverride[fault.targetId] = fault.lagMs ?? 250;
            for (const r of Object.values(replicas)) {
              if (r.nodeId === fault.targetId && r.role === "follower") {
                r.lagMs = fault.lagMs ?? 250;
                emitFrame(
                  {
                    ...nextEvtBase(),
                    type: "storage.replica.lagged",
                    shardId: r.shardId,
                    nodeId: r.nodeId,
                    lagMs: r.lagMs,
                  },
                  `Replica Lag Injected on ${r.nodeId}`,
                  `Follower replica ${r.replicaId} lags behind leader by ${r.lagMs}ms.`,
                  [r.nodeId]
                );
              }
            }
          } else if (fault.type === "drop_replication") {
            dropReplicationToNode = fault.targetId;
          } else if (fault.type === "migration_dest_fail") {
            const mig = migrations.find(
              (m) =>
                m.targetNodeId === fault.targetId &&
                m.state !== "COMPLETED" &&
                m.state !== "FAILED"
            );
            if (nodes[fault.targetId]) nodes[fault.targetId]!.online = false;
            if (mig) {
              mig.state = "FAILED";
              mig.failureReason = `Destination ${fault.targetId} crashed mid-migration (checkpoint preserved at ${mig.copiedRecords}/${mig.totalRecords} records).`;
              if (shards[mig.shardId]) shards[mig.shardId]!.migrationState = "FAILED";
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "storage.migration.failed",
                  migrationId: mig.id,
                  shardId: mig.shardId,
                  reason: mig.failureReason,
                },
                `Migration Failed (${mig.shardId})`,
                mig.failureReason,
                [mig.sourceNodeId, mig.targetNodeId]
              );
            }
          } else if (fault.type === "migration_dest_recover") {
            if (nodes[fault.targetId]) nodes[fault.targetId]!.online = true;
            const mig = migrations.find(
              (m) => m.targetNodeId === fault.targetId && m.state === "FAILED"
            );
            if (mig) {
              mig.state = "RECOVERING";
              if (shards[mig.shardId]) shards[mig.shardId]!.migrationState = "RECOVERING";
              schedule({
                kind: "migration_tick",
                atMs: virtualTimeMs + 20,
                migrationId: mig.id,
                bandwidth: 4,
              });
            }
          }
          break;
        }

        case "fault_revert": {
          const fault = parsed.failures.find((f) => f.id === item.faultId);
          if (fault?.type === "network_partition") activePartitions = [];
          break;
        }

        case "workload_op": {
          const op = parsed.workload.find((w) => w.id === item.opId);
          if (!op) break;

          const route = resolveShardForKey(
            op.key,
            parsed.partitioning.strategy,
            shards,
            hashRing
          );
          const shard = shards[route.shardId];
          if (!shard) break;

          shard.requestCount += 1;
          if (!hotKeyCounts[op.key]) {
            hotKeyCounts[op.key] = { shardId: shard.shardId, count: 0 };
          }
          hotKeyCounts[op.key]!.count += 1;

          // Hot partition alert threshold
          if (shard.requestCount === 6) {
            emitFrame(
              {
                ...nextEvtBase(),
                type: "storage.hot_partition.detected",
                shardId: shard.shardId,
                hotKey: op.key,
                requests: shard.requestCount,
              },
              `Hot Partition Detected (${shard.shardId})`,
              `Skewed traffic concentrated on ${shard.shardId} (top key '${op.key}', ${shard.requestCount} requests).`,
              shard.primaryNodeId ? [shard.primaryNodeId] : []
            );
          }

          const primaryNode = shard.primaryNodeId ? nodes[shard.primaryNodeId] : undefined;
          // Capacity / backpressure check
          if (
            primaryNode &&
            op.kind === "read" &&
            shard.requestCount > primaryNode.readCapacityOps
          ) {
            primaryNode.throttledOps += 1;
            throttledRequests += 1;
            recentOperations.push({
              opId: op.id,
              atMs: virtualTimeMs,
              kind: op.kind,
              key: op.key,
              shardId: shard.shardId,
              coordinatorNodeId: primaryNode.id,
              targetReplicas: shard.replicaNodeIds,
              respondedReplicas: [],
              requiredAcks: 1,
              receivedAcks: 0,
              outcome: "throttled",
              staleReadDetected: false,
              reason: `Node ${primaryNode.label} exceeded read capacity (${primaryNode.readCapacityOps} ops)`,
            });
            break;
          }

          if (op.useStaleRoutingMap) {
            recentOperations.push({
              opId: op.id,
              atMs: virtualTimeMs,
              kind: op.kind,
              key: op.key,
              shardId: shard.shardId,
              coordinatorNodeId: shard.primaryNodeId,
              targetReplicas: shard.replicaNodeIds,
              respondedReplicas: shard.primaryNodeId ? [shard.primaryNodeId] : [],
              requiredAcks: 1,
              receivedAcks: 1,
              outcome: "stale_map_redirected",
              staleReadDetected: false,
              reason: `Client used stale placement map; redirected to epoch=${shard.ownershipEpoch} owner ${shard.primaryNodeId}`,
            });
          }

          if (op.kind === "write" || op.kind === "delete" || op.kind === "concurrent_write") {
            const coordId =
              parsed.replication.mode === "leader_based"
                ? shard.primaryNodeId
                : shard.replicaNodeIds.find((nid) => nodes[nid]?.online) ?? null;

            const requiredAcks =
              parsed.replication.mode === "leader_based"
                ? parsed.replication.writePolicy === "leader_ack"
                  ? 1
                  : parsed.replication.writePolicy === "all"
                    ? shard.replicaNodeIds.length
                    : parsed.replication.requiredReplicaAcks
                : parsed.replication.writePolicy === "one_ack"
                  ? 1
                  : parsed.replication.writePolicy === "all"
                    ? shard.replicaNodeIds.length
                    : parsed.replication.writeQuorum;

            const seq = ++versionSeq;
            const vc: Record<string, number> = { [coordId ?? "coord"]: seq };
            const isDelete = op.kind === "delete";
            const newRec: StorageRecord = {
              key: op.key,
              value: isDelete ? "__TOMBSTONE__" : op.value,
              version: {
                epoch: shard.ownershipEpoch,
                seq,
                timestampMs: virtualTimeMs,
                writerId: op.clientId,
                vectorClock: vc,
              },
              deleted: isDelete,
              deletedAtMs: isDelete ? virtualTimeMs : undefined,
              sizeBytes: 128,
            };

            const ackNodes: string[] = [];
            const missedNodes: string[] = [];

            for (const nid of shard.replicaNodeIds) {
              const n = nodes[nid];
              const rep = replicas[`${shard.shardId}@${nid}`];
              const reachable =
                Boolean(n?.online) &&
                (!coordId || !isPartitioned(coordId, nid)) &&
                dropReplicationToNode !== nid;

              if (reachable && rep && (!replicaLagOverride[nid] || parsed.replication.mode === "leaderless")) {
                const existed = rep.records[op.key] !== undefined;
                rep.records[op.key] = {
                  ...newRec,
                  version: { ...newRec.version, vectorClock: { ...newRec.version.vectorClock } },
                };
                rep.latestAppliedSeq = seq;
                if (!existed && n) n.usedRecords += 1;
                ackNodes.push(nid);
              } else {
                missedNodes.push(nid);
                // Hinted handoff in leaderless mode
                if (
                  parsed.replication.mode === "leaderless" &&
                  parsed.replication.hintedHandoffEnabled &&
                  coordId &&
                  nodes[coordId]?.online
                ) {
                  repairs.push({
                    id: `hint_${op.id}_${nid}`,
                    kind: "hinted_handoff",
                    shardId: shard.shardId,
                    targetNodeId: nid,
                    key: op.key,
                    status: "pending",
                    createdAtMs: virtualTimeMs,
                    completedAtMs: null,
                    detail: `Coordinator ${coordId} stored write hint (seq=${seq}) for offline ${nid}`,
                  });
                }
              }
            }

            // Concurrent write conflict modeling
            if (op.kind === "concurrent_write" && op.concurrentValue && shard.replicaNodeIds.length >= 2) {
              const secondNid = shard.replicaNodeIds[1]!;
              const rep2 = replicas[`${shard.shardId}@${secondNid}`];
              const policy =
                parsed.replication.mode === "leaderless"
                  ? parsed.replication.conflictResolution
                  : "lww";
              const seq2 = ++versionSeq;
              if (rep2) {
                rep2.records[op.key] = {
                  key: op.key,
                  value: op.concurrentValue,
                  version: {
                    epoch: shard.ownershipEpoch,
                    seq: seq2,
                    timestampMs: virtualTimeMs,
                    writerId: "client-2",
                    vectorClock: { [secondNid]: seq2 },
                  },
                  deleted: false,
                  sizeBytes: 128,
                };
                rep2.latestAppliedSeq = seq2;
              }
              const resolvedValue =
                policy === "app_merge"
                  ? `${op.value}+${op.concurrentValue}`
                  : policy === "version_vector"
                    ? `[CONFLICT: ${op.value} | ${op.concurrentValue}]`
                    : op.concurrentValue;

              conflicts.push({
                id: `conf_${op.id}`,
                key: op.key,
                shardId: shard.shardId,
                atMs: virtualTimeMs,
                competingValues: [
                  { value: op.value, version: `seq:${seq}`, nodeId: shard.replicaNodeIds[0]! },
                  { value: op.concurrentValue, version: `seq:${seq2}`, nodeId: secondNid },
                ],
                resolutionPolicy: policy,
                resolvedValue,
                explanation:
                  policy === "lww"
                    ? "Last-Write-Wins selected second concurrent update (may discard sibling write under clock tie)."
                    : `Conflict detected via version vectors (${policy}); siblings preserved/merged.`,
              });
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "storage.conflict.detected",
                  key: op.key,
                  shardId: shard.shardId,
                  policy,
                },
                `Concurrent Write Conflict Detected on '${op.key}'`,
                `Two clients updated '${op.key}' concurrently; policy='${policy}' resolved -> '${resolvedValue}'.`,
                shard.replicaNodeIds
              );
            }

            // Track catch-up pending writes if this shard has an active copying migration
            for (const mig of migrations) {
              if (
                mig.shardId === shard.shardId &&
                (mig.state === "COPYING" || mig.state === "CATCHING_UP")
              ) {
                mig.catchupPendingWrites += 1;
              }
            }

            // Update logical shard record count if newly created
            if (ackNodes.length > 0 && op.kind !== "delete") {
              shard.recordCount += 1;
            }

            const satisfied = ackNodes.length >= requiredAcks;
            const isUncertain = op.injectTimeoutAfterApply && ackNodes.length > 0;
            writeLatencies.push(15 + missedNodes.length * 10);

            if (isUncertain) {
              uncertainWrites += 1;
              recentOperations.push({
                opId: op.id,
                atMs: virtualTimeMs,
                kind: op.kind,
                key: op.key,
                shardId: shard.shardId,
                coordinatorNodeId: coordId,
                targetReplicas: shard.replicaNodeIds,
                respondedReplicas: ackNodes,
                requiredAcks,
                receivedAcks: ackNodes.length,
                outcome: "uncertain",
                staleReadDetected: false,
                reason: "Write applied on replicas but client acknowledgment timed out (uncertain outcome).",
              });
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "storage.write.uncertain",
                  opId: op.id,
                  key: op.key,
                  shardId: shard.shardId,
                  reason: "Client timed out awaiting write ACK after replica mutation",
                },
                `Write Outcome Uncertain (${op.key})`,
                `Replicas [${ackNodes.join(", ")}] applied '${op.key}=${op.value}' (seq=${seq}), but client timed out before ACK.`,
                ackNodes
              );
            } else {
              if (satisfied) writesCompleted += 1;
              recentOperations.push({
                opId: op.id,
                atMs: virtualTimeMs,
                kind: op.kind,
                key: op.key,
                shardId: shard.shardId,
                coordinatorNodeId: coordId,
                targetReplicas: shard.replicaNodeIds,
                respondedReplicas: ackNodes,
                requiredAcks,
                receivedAcks: ackNodes.length,
                outcome: satisfied ? "acknowledged" : "failed",
                staleReadDetected: false,
                reason: satisfied
                  ? `Write '${op.key}' satisfied policy (${ackNodes.length}/${requiredAcks} ACKs)`
                  : `Quorum not met: received ${ackNodes.length}/${requiredAcks} ACKs`,
              });
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "storage.write.acknowledged",
                  opId: op.id,
                  key: op.key,
                  shardId: shard.shardId,
                  acks: ackNodes.length,
                  requiredAcks,
                },
                satisfied
                  ? `Write Committed: ${op.key} (${ackNodes.length}/${requiredAcks} ACKs)`
                  : `Write Failed Quorum: ${op.key} (${ackNodes.length}/${requiredAcks} ACKs)`,
                satisfied
                  ? `Committed '${op.key}' on ${shard.shardId}; ACKs from [${ackNodes.join(", ")}].`
                  : `Rejected write for '${op.key}': only ${ackNodes.length} reachable replicas (< required ${requiredAcks}).`,
                ackNodes
              );
            }
          } else {
            // READ operation
            readsCompleted += 1;
            let targets: string[] = [];
            let requiredResp = 1;

            if (parsed.replication.mode === "leader_based") {
              if (parsed.replication.readPolicy === "leader") {
                targets = shard.primaryNodeId ? [shard.primaryNodeId] : [];
              } else if (parsed.replication.readPolicy === "follower") {
                const followers = shard.replicaNodeIds.filter(
                  (id) => id !== shard.primaryNodeId && nodes[id]?.online
                );
                targets = followers.length > 0 ? [followers[0]!] : shard.primaryNodeId ? [shard.primaryNodeId] : [];
              } else {
                targets = shard.replicaNodeIds;
                requiredResp = Math.floor(shard.replicaNodeIds.length / 2) + 1;
              }
            } else {
              if (parsed.replication.readPolicy === "one_replica") {
                const onlineOne = shard.replicaNodeIds.find((id) => nodes[id]?.online);
                targets = onlineOne ? [onlineOne] : [];
                requiredResp = 1;
              } else if (parsed.replication.readPolicy === "all") {
                targets = shard.replicaNodeIds;
                requiredResp = shard.replicaNodeIds.length;
              } else {
                targets = shard.replicaNodeIds;
                requiredResp = parsed.replication.readQuorum;
              }
            }

            // Determine global latest version across all replicas for staleness comparison
            let maxSeq = 0;
            let latestRec: StorageRecord | undefined;
            for (const nid of shard.replicaNodeIds) {
              const r = replicas[`${shard.shardId}@${nid}`]?.records[op.key];
              if (r && r.version.seq > maxSeq) {
                maxSeq = r.version.seq;
                latestRec = r;
              }
            }

            const responded: Array<{ nodeId: string; rec?: StorageRecord }> = [];
            for (const nid of targets) {
              if (nodes[nid]?.online) {
                responded.push({
                  nodeId: nid,
                  rec: replicas[`${shard.shardId}@${nid}`]?.records[op.key],
                });
              }
            }

            const quorumOk = responded.length >= requiredResp;
            let bestResp = responded[0]?.rec;
            for (const rr of responded) {
              if (rr.rec && (!bestResp || rr.rec.version.seq > bestResp.version.seq)) {
                bestResp = rr.rec;
              }
            }

            const stale =
              quorumOk &&
              maxSeq > 0 &&
              (!bestResp || bestResp.version.seq < maxSeq);
            if (stale) staleReads += 1;

            readLatencies.push(12 + targets.length * 4);

            // Schedule Read Repair in leaderless mode if stale replica observed
            if (
              parsed.replication.mode === "leaderless" &&
              parsed.replication.readRepairEnabled &&
              bestResp
            ) {
              for (const rr of responded) {
                if (!rr.rec || rr.rec.version.seq < bestResp.version.seq) {
                  const targetRep = replicas[`${shard.shardId}@${rr.nodeId}`];
                  if (targetRep) {
                    targetRep.records[op.key] = {
                      ...bestResp,
                      version: {
                        ...bestResp.version,
                        vectorClock: { ...bestResp.version.vectorClock },
                      },
                    };
                    targetRep.latestAppliedSeq = Math.max(
                      targetRep.latestAppliedSeq,
                      bestResp.version.seq
                    );
                    targetRep.lagMs = 0;
                    repairsCompleted += 1;
                    repairs.push({
                      id: `rr_${op.id}_${rr.nodeId}`,
                      kind: "read_repair",
                      shardId: shard.shardId,
                      targetNodeId: rr.nodeId,
                      key: op.key,
                      status: "completed",
                      createdAtMs: virtualTimeMs,
                      completedAtMs: virtualTimeMs,
                      detail: `Read repair updated stale ${rr.nodeId} to seq=${bestResp.version.seq}`,
                    });
                    emitFrame(
                      {
                        ...nextEvtBase(),
                        type: "storage.repair.completed",
                        repairId: `rr_${op.id}_${rr.nodeId}`,
                        kind: "read_repair",
                        shardId: shard.shardId,
                        targetNodeId: rr.nodeId,
                      },
                      `Read Repair Updated ${rr.nodeId} (${op.key})`,
                      `Quorum read detected stale replica ${rr.nodeId} and repaired '${op.key}' to seq=${bestResp.version.seq}.`,
                      [rr.nodeId]
                    );
                  }
                }
              }
            }

            recentOperations.push({
              opId: op.id,
              atMs: virtualTimeMs,
              kind: "read",
              key: op.key,
              shardId: shard.shardId,
              coordinatorNodeId: shard.primaryNodeId,
              targetReplicas: targets,
              respondedReplicas: responded.map((r) => r.nodeId),
              requiredAcks: requiredResp,
              receivedAcks: responded.length,
              outcome: quorumOk ? "acknowledged" : "failed",
              staleReadDetected: stale,
              returnedValue: bestResp?.deleted ? "<DELETED>" : bestResp?.value,
              returnedVersion: bestResp ? `seq:${bestResp.version.seq}` : "none",
              latestVersion: latestRec ? `seq:${latestRec.version.seq}` : "none",
              reason: stale
                ? `Stale read: follower ${responded[0]?.nodeId} returned seq:${bestResp?.version.seq ?? 0} behind latest seq:${maxSeq}`
                : quorumOk
                  ? `Read satisfied (${responded.length}/${requiredResp} responses)`
                  : `Read quorum failed (${responded.length}/${requiredResp})`,
            });

            emitFrame(
              {
                ...nextEvtBase(),
                type: "storage.read.completed",
                opId: op.id,
                key: op.key,
                shardId: shard.shardId,
                stale,
                outcome: quorumOk ? "ok" : "failed",
              },
              stale
                ? `Stale Read Detected: ${op.key}`
                : quorumOk
                  ? `Read Completed: ${op.key}`
                  : `Read Failed Quorum: ${op.key}`,
              stale
                ? `Follower read on '${op.key}' returned stale seq:${bestResp?.version.seq ?? 0} while latest is seq:${maxSeq}.`
                : quorumOk
                  ? `Read '${op.key}' from [${responded.map((r) => r.nodeId).join(", ")}] -> '${bestResp?.deleted ? "<TOMBSTONE>" : bestResp?.value ?? "null"}'.`
                  : `Read '${op.key}' failed: ${responded.length} < R=${requiredResp}.`,
              responded.map((r) => r.nodeId)
            );
          }
          break;
        }

        case "migration_trigger": {
          const trig = parsed.migrations.find((m) => m.id === item.triggerId);
          if (!trig) break;

          if (trig.action === "node_join" && trig.targetNodeId && nodes[trig.targetNodeId]) {
            nodes[trig.targetNodeId]!.joined = true;
            nodes[trig.targetNodeId]!.online = true;
            hashRing = buildConsistentHashRing(
              activeNodeIdsForRing(),
              parsed.partitioning.virtualNodesPerNode
            );
            emitFrame(
              {
                ...nextEvtBase(),
                type: "storage.placement.updated",
                shardId: Object.keys(shards)[0] ?? "S1",
                ownershipEpoch: 1,
                primaryNodeId: trig.targetNodeId,
              },
              `Node Joined: ${nodes[trig.targetNodeId]!.label}`,
              `${nodes[trig.targetNodeId]!.label} joined the cluster. Consistent hash ring updated with ${parsed.partitioning.virtualNodesPerNode} virtual nodes.`,
              [trig.targetNodeId]
            );
          } else if (
            trig.action === "node_remove" &&
            trig.targetNodeId &&
            nodes[trig.targetNodeId]
          ) {
            const remId = trig.targetNodeId;
            const donorShards = Object.values(shards).filter(
              (s) => !s.retired && s.primaryNodeId === remId
            );
            const fallbackNode = Object.values(nodes).find(
              (n) => n.id !== remId && n.joined && n.online
            );
            if (fallbackNode) {
              for (const ds of donorShards) {
                const migId = `mig_drain_${ds.shardId}`;
                const mig: MigrationTaskRuntime = {
                  id: migId,
                  shardId: ds.shardId,
                  sourceNodeId: remId,
                  targetNodeId: fallbackNode.id,
                  state: "PLANNED",
                  totalRecords: Math.max(1, ds.recordCount),
                  copiedRecords: 0,
                  totalBytes: Math.max(1, ds.recordCount) * 128,
                  copiedBytes: 0,
                  snapshotSeq: versionSeq,
                  catchupPendingWrites: 0,
                  ownershipEpochBefore: ds.ownershipEpoch,
                  ownershipEpochAfter: null,
                };
                migrations.push(mig);
                migrationsStarted += 1;
                ds.migrationState = "PLANNED";
                schedule({
                  kind: "migration_tick",
                  atMs: virtualTimeMs + 15,
                  migrationId: migId,
                  bandwidth: trig.bandwidthRecordsPerStep,
                });
              }
            }
          } else if (trig.action === "rebalance") {
            const proposals = planBalancedRebalance(shards, nodes);
            for (const prop of proposals) {
              const s = shards[prop.shardId];
              if (!s) continue;
              const migId = `mig_${s.shardId}_${prop.targetNodeId}`;
              const mig: MigrationTaskRuntime = {
                id: migId,
                shardId: s.shardId,
                sourceNodeId: prop.sourceNodeId,
                targetNodeId: prop.targetNodeId,
                state: "PLANNED",
                totalRecords: Math.max(1, s.recordCount),
                copiedRecords: 0,
                totalBytes: Math.max(1, s.recordCount) * 128,
                copiedBytes: 0,
                snapshotSeq: versionSeq,
                catchupPendingWrites: 0,
                ownershipEpochBefore: s.ownershipEpoch,
                ownershipEpochAfter: null,
              };
              migrations.push(mig);
              migrationsStarted += 1;
              s.migrationState = "PLANNED";
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "storage.migration.copy.progress",
                  migrationId: migId,
                  shardId: s.shardId,
                  copiedRecords: 0,
                  totalRecords: mig.totalRecords,
                },
                `Rebalance Planned: ${s.shardId} (${prop.sourceNodeId} → ${prop.targetNodeId})`,
                `Planned snapshot copy (${mig.totalRecords} records) + catch-up + epoch cutover.`,
                [prop.sourceNodeId, prop.targetNodeId]
              );
              schedule({
                kind: "migration_tick",
                atMs: virtualTimeMs + 20,
                migrationId: migId,
                bandwidth: trig.bandwidthRecordsPerStep,
              });
            }
          } else if (trig.action === "pause_migration") {
            for (const mig of migrations) {
              if (mig.state === "COPYING" || mig.state === "CATCHING_UP") {
                mig.state = "PAUSED";
                if (shards[mig.shardId]) shards[mig.shardId]!.migrationState = "PAUSED";
              }
            }
          } else if (trig.action === "resume_migration") {
            for (const mig of migrations) {
              if (mig.state === "PAUSED" || mig.state === "FAILED") {
                mig.state = "COPYING";
                if (shards[mig.shardId]) shards[mig.shardId]!.migrationState = "COPYING";
                schedule({
                  kind: "migration_tick",
                  atMs: virtualTimeMs + 15,
                  migrationId: mig.id,
                  bandwidth: trig.bandwidthRecordsPerStep,
                });
              }
            }
          }
          break;
        }

        case "migration_tick": {
          const mig = migrations.find((m) => m.id === item.migrationId);
          if (!mig || mig.state === "PAUSED" || mig.state === "FAILED" || mig.state === "COMPLETED") {
            break;
          }
          const shard = shards[mig.shardId];
          const destNode = nodes[mig.targetNodeId];
          if (!shard || !destNode?.online) break;

          if (mig.state === "PLANNED" || mig.state === "RECOVERING") {
            mig.state = "COPYING";
            shard.migrationState = "COPYING";
          }

          if (mig.state === "COPYING") {
            const delta = Math.min(
              item.bandwidth,
              mig.totalRecords - mig.copiedRecords
            );
            mig.copiedRecords += delta;
            mig.copiedBytes = mig.copiedRecords * 128;
            dataMovedBytes += delta * 128;

            emitFrame(
              {
                ...nextEvtBase(),
                type: "storage.migration.copy.progress",
                migrationId: mig.id,
                shardId: mig.shardId,
                copiedRecords: mig.copiedRecords,
                totalRecords: mig.totalRecords,
              },
              `Copying Shard ${mig.shardId} (${mig.copiedRecords}/${mig.totalRecords})`,
              `Streaming snapshot records from ${mig.sourceNodeId} to ${mig.targetNodeId}.`,
              [mig.sourceNodeId, mig.targetNodeId]
            );

            if (mig.copiedRecords >= mig.totalRecords) {
              mig.state = "CATCHING_UP";
              shard.migrationState = "CATCHING_UP";
            }
            schedule({
              kind: "migration_tick",
              atMs: virtualTimeMs + 25,
              migrationId: mig.id,
              bandwidth: item.bandwidth,
            });
          } else if (mig.state === "CATCHING_UP") {
            mig.catchupPendingWrites = 0;
            mig.state = "VERIFYING";
            shard.migrationState = "VERIFYING";
            schedule({
              kind: "migration_tick",
              atMs: virtualTimeMs + 20,
              migrationId: mig.id,
              bandwidth: item.bandwidth,
            });
          } else if (mig.state === "VERIFYING") {
            mig.state = "CUTTING_OVER";
            shard.migrationState = "CUTTING_OVER";

            // Create physical replica on targetNodeId if absent & copy records
            const srcRep = replicas[`${shard.shardId}@${mig.sourceNodeId}`];
            const dstRepId = `${shard.shardId}@${mig.targetNodeId}`;
            if (!replicas[dstRepId]) {
              replicas[dstRepId] = {
                replicaId: dstRepId,
                shardId: shard.shardId,
                nodeId: mig.targetNodeId,
                role: parsed.replication.mode === "leader_based" ? "leader" : "peer",
                healthy: true,
                lagMs: 0,
                latestAppliedSeq: srcRep?.latestAppliedSeq ?? 0,
                records: srcRep ? { ...srcRep.records } : {},
              };
            }

            shard.primaryNodeId = mig.targetNodeId;
            if (!shard.replicaNodeIds.includes(mig.targetNodeId)) {
              shard.replicaNodeIds.push(mig.targetNodeId);
            }
            shard.ownershipEpoch += 1;
            mig.ownershipEpochAfter = shard.ownershipEpoch;
            mig.state = "COMPLETED";
            shard.migrationState = "COMPLETED";
            migrationsCompleted += 1;

            if (nodes[mig.sourceNodeId]) {
              nodes[mig.sourceNodeId]!.ownedShardIds = nodes[mig.sourceNodeId]!.ownedShardIds.filter(
                (id) => id !== shard.shardId
              );
            }
            if (!destNode.ownedShardIds.includes(shard.shardId)) {
              destNode.ownedShardIds.push(shard.shardId);
            }
            if (!destNode.hostedReplicaShardIds.includes(shard.shardId)) {
              destNode.hostedReplicaShardIds.push(shard.shardId);
            }

            emitFrame(
              {
                ...nextEvtBase(),
                type: "storage.migration.cutover",
                migrationId: mig.id,
                shardId: shard.shardId,
                newOwnerId: mig.targetNodeId,
                epoch: shard.ownershipEpoch,
              },
              `Ownership Cutover: ${shard.shardId} → ${destNode.label} (Epoch ${shard.ownershipEpoch})`,
              `Verified snapshot & catch-up; fenced stale owner ${mig.sourceNodeId} and cut over authoritative ownership to ${destNode.label}.`,
              [mig.sourceNodeId, mig.targetNodeId]
            );
          }
          break;
        }

        case "shard_split": {
          const src = shards[item.shardId];
          if (!src || src.retired || src.minKey === undefined || src.maxKey === undefined) break;
          if (item.splitKey <= src.minKey || item.splitKey >= src.maxKey) break;

          src.retired = true;
          const leftId = `${src.shardId}a`;
          const rightId = `${src.shardId}b`;
          shards[leftId] = {
            ...src,
            shardId: leftId,
            maxKey: item.splitKey,
            retired: false,
            ownershipEpoch: src.ownershipEpoch + 1,
            recordCount: Math.floor(src.recordCount / 2),
          };
          shards[rightId] = {
            ...src,
            shardId: rightId,
            minKey: item.splitKey + 1,
            retired: false,
            ownershipEpoch: src.ownershipEpoch + 1,
            recordCount: Math.ceil(src.recordCount / 2),
          };
          emitFrame(
            {
              ...nextEvtBase(),
              type: "storage.shard.split",
              sourceShardId: src.shardId,
              leftShardId: leftId,
              rightShardId: rightId,
            },
            `Shard Split: ${src.shardId} → ${leftId} + ${rightId}`,
            `Split [${src.minKey}..${src.maxKey}] at key=${item.splitKey} into [${src.minKey}..${item.splitKey}] and [${item.splitKey + 1}..${src.maxKey}].`,
            src.primaryNodeId ? [src.primaryNodeId] : []
          );
          break;
        }

        case "shard_merge": {
          const left = shards[item.leftShardId];
          const right = shards[item.rightShardId];
          if (!left || !right || left.retired || right.retired) break;
          if (left.minKey === undefined || right.maxKey === undefined) break;

          left.retired = true;
          right.retired = true;
          const mergedId = `${left.shardId}_${right.shardId}`;
          shards[mergedId] = {
            shardId: mergedId,
            minKey: left.minKey,
            maxKey: right.maxKey,
            primaryNodeId: left.primaryNodeId,
            replicaNodeIds: [...left.replicaNodeIds],
            ownershipEpoch: Math.max(left.ownershipEpoch, right.ownershipEpoch) + 1,
            recordCount: left.recordCount + right.recordCount,
            requestCount: left.requestCount + right.requestCount,
            migrationState: "NONE",
            retired: false,
          };
          emitFrame(
            {
              ...nextEvtBase(),
              type: "storage.shard.merged",
              leftShardId: left.shardId,
              rightShardId: right.shardId,
              mergedShardId: mergedId,
            },
            `Shards Merged: ${left.shardId} + ${right.shardId} → ${mergedId}`,
            `Merged adjacent ranges into [${left.minKey}..${right.maxKey}] under epoch ${shards[mergedId]!.ownershipEpoch}.`,
            left.primaryNodeId ? [left.primaryNodeId] : []
          );
          break;
        }

        case "anti_entropy_tick": {
          let lastRepaired: RepairTaskRecord | null = null;
          let count = 0;
          for (const s of Object.values(shards)) {
            if (s.retired) continue;
            // Reconcile missing keys/tombstones across online replicas of s
            const latestByKey: Record<string, StorageRecord> = {};
            for (const nid of s.replicaNodeIds) {
              const rep = replicas[`${s.shardId}@${nid}`];
              if (!rep || !nodes[nid]?.online) continue;
              for (const [rk, rv] of Object.entries(rep.records)) {
                if (!latestByKey[rk] || rv.version.seq > latestByKey[rk]!.version.seq) {
                  latestByKey[rk] = rv;
                }
              }
            }
            for (const nid of s.replicaNodeIds) {
              const rep = replicas[`${s.shardId}@${nid}`];
              if (!rep || !nodes[nid]?.online) continue;
              for (const [rk, winner] of Object.entries(latestByKey)) {
                const cur = rep.records[rk];
                if (!cur || cur.version.seq < winner.version.seq) {
                  rep.records[rk] = {
                    ...winner,
                    version: {
                      ...winner.version,
                      vectorClock: { ...winner.version.vectorClock },
                    },
                  };
                  rep.latestAppliedSeq = Math.max(rep.latestAppliedSeq, winner.version.seq);
                  repairsCompleted += 1;
                  count += 1;
                  const task: RepairTaskRecord = {
                    id: `ae_${s.shardId}_${nid}_${rk}`,
                    kind: "anti_entropy",
                    shardId: s.shardId,
                    targetNodeId: nid,
                    key: rk,
                    status: "completed",
                    createdAtMs: virtualTimeMs,
                    completedAtMs: virtualTimeMs,
                    detail: `Anti-entropy synchronized ${rk} (${winner.deleted ? "TOMBSTONE" : winner.value}) to ${nid}`,
                  };
                  repairs.push(task);
                  lastRepaired = task;
                }
              }
            }
          }
          if (lastRepaired && count > 0) {
            emitFrame(
              {
                ...nextEvtBase(),
                type: "storage.repair.completed",
                repairId: lastRepaired.id,
                kind: "anti_entropy",
                shardId: lastRepaired.shardId,
                targetNodeId: lastRepaired.targetNodeId,
              },
              `Anti-Entropy Converged (${count} repair${count > 1 ? "s" : ""})`,
              lastRepaired.detail,
              [lastRepaired.targetNodeId]
            );
          }
          break;
        }
      }
    }

    const lastState = frames[frames.length - 1]?.runtimeState?.distributedStorageState;
    const failedInv = lastState?.invariants.allPassed === false;

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: parsed.nodes[0]?.id ?? "node-a",
      request: {
        id: parsed.id,
        method: "POST",
        path: `/storage/${parsed.partitioning.strategy}/${parsed.replication.mode}`,
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: parsed.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: 15,
        edgeDurationMs: 10,
      },
    };

    return {
      runId,
      architectureId: "arch_distributed_storage_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `storage_${parsed.id}_${parsed.seed}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: parsed.nodes.map((n) => n.id),
      traversedEdgeIds: [],
      configuration,
      events,
      totalDurationMs: virtualTimeMs,
      totalEvents: events.length,
      totalHops: recentOperations.length + migrations.length,
      outcome: failedInv ? "failure" : "success",
      terminalReason: `Distributed storage simulation finished at ${virtualTimeMs}ms (${readsCompleted} reads, ${writesCompleted} writes, ${migrationsCompleted} migrations).`,
      frames,
    };
  }
}
