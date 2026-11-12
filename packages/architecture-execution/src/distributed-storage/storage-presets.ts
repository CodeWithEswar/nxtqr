import type { StorageNodeConfig, StorageScenario } from "./storage-schemas";

export const DISTRIBUTED_STORAGE_PRESET_METADATA = [
  { id: "basic_hash_partitioning", label: "Basic Hash Partitioning", description: "Modulo hash distributes keys evenly across 6 logical shards." },
  { id: "range_partitioning", label: "Range Partitioning", description: "Ordered numeric key ranges [0000–2499]..[7500–9999] enable fast range scans." },
  { id: "consistent_hashing", label: "Consistent Hashing Ring", description: "Clockwise hash-ring ownership minimizes key movement when membership changes." },
  { id: "virtual_nodes", label: "Virtual Nodes (Vnodes)", description: "Multiple hash ring tokens per node smooth ownership arcs across 4 nodes." },
  { id: "three_replica_placement", label: "Zone-Aware RF=3 Placement", description: "Places 3 replicas of each shard across distinct availability zones (az-1..az-3)." },
  { id: "leader_based_replication", label: "Leader-Based Replication", description: "Primary leader processes authoritative writes and streams to followers." },
  { id: "leaderless_replication", label: "Leaderless Quorum (Dynamo)", description: "Coordinator fans writes & reads out across N=3 peers with W=2, R=2." },
  { id: "quorum_write", label: "Quorum Write Enforcement", description: "W=2 succeeds with 1 failed node, while W=3 rejects under unavailable replica." },
  { id: "quorum_read", label: "Quorum Read Overlap (R+W>N)", description: "R=2 reads compare replica versions to surface latest committed sequence." },
  { id: "stale_follower_read", label: "Stale Follower Read", description: "Follower with 250ms lag returns older seq while leader has newer committed write." },
  { id: "replica_lag", label: "Replica Lag Accumulation", description: "Lag injection causes follower applied sequence to fall behind leader." },
  { id: "concurrent_conflicting_writes", label: "Concurrent Conflicting Writes", description: "Two clients write the same key concurrently; detected via version vectors." },
  { id: "read_repair", label: "Quorum Read Repair", description: "Read discovers stale peer and schedules inline read repair to converge seq." },
  { id: "hinted_handoff", label: "Hinted Handoff & Recovery", description: "Coordinator buffers write hint for crashed peer and delivers on recovery." },
  { id: "anti_entropy_repair", label: "Background Anti-Entropy Sync", description: "Periodic reconciliation repairs divergent replica keys after packet drops." },
  { id: "node_failure", label: "Primary Node Failure & Failover", description: "Leader crash triggers replica promotion and epoch increment." },
  { id: "zone_failure", label: "Availability Zone Outage", description: "Zone az-2 outage takes down zonal nodes; zone-aware RF=3 retains quorum." },
  { id: "storage_network_partition", label: "Storage Network Partition", description: "Isolated partition restricts quorum writes while healthy majority serves." },
  { id: "node_recovery", label: "Node Recovery & Catch-Up", description: "Restarted node rejoins healthy replicas and reconciles stale entries." },
  { id: "new_node_joins", label: "New Node Joins Cluster", description: "Node D joins 3-node cluster; consistent hash ring updates placement." },
  { id: "node_removal", label: "Graceful Node Removal & Drain", description: "Node C drains shards safely to peer nodes before removal." },
  { id: "rebalance_planning", label: "Rebalance Plan Preview", description: "Joining Node D triggers deterministic balanced movement proposals." },
  { id: "live_shard_migration", label: "Online Live Shard Migration", description: "Snapshot copy + concurrent write catch-up + epoch cutover to Node D." },
  { id: "migration_failure", label: "Migration Destination Crash", description: "Target node fails mid-copy; checkpoint preserves progress without premature cutover." },
  { id: "migration_recovery", label: "Migration Checkpoint Recovery", description: "Recovered destination resumes copy from checkpoint and finishes cutover cleanly." },
  { id: "stale_routing_map", label: "Stale Client Routing Redirect", description: "Client hitting prior owner after cutover receives redirect to new epoch owner." },
  { id: "ownership_handoff", label: "Monotonic Ownership Epoch Cutover", description: "Bumps ownership epoch to fence prior owner against split-brain writes." },
  { id: "shard_splitting", label: "Range Shard Splitting", description: "Splits hot shard [0000..4999] into two balanced child range shards." },
  { id: "shard_merging", label: "Adjacent Range Shard Merge", description: "Merges adjacent range shards under updated ownership epoch." },
  { id: "hot_partition", label: "Hot Partition Detection", description: "Skewed traffic concentrates reads/writes on a single logical shard." },
  { id: "hot_key", label: "Single Hot Key Overload", description: "Single key generates heavy skew showing why splitting alone cannot isolate one key." },
  { id: "capacity_exhaustion", label: "Node Read Capacity Throttling", description: "Excessive requests exceed readCapacityOps and trigger backpressure throttling." },
  { id: "write_timeout_uncertainty", label: "Write Timeout Outcome Uncertainty", description: "Replicas apply write but client times out waiting for ACK (uncertain status)." },
  { id: "tombstone_reconciliation", label: "Tombstone Delete & Reconciliation", description: "Delete writes tombstone retained safely so anti-entropy does not resurrect deleted data." },
] as const;

export type DistributedStoragePresetId =
  (typeof DISTRIBUTED_STORAGE_PRESET_METADATA)[number]["id"];

function makeNodes(includeDJoined = false): StorageNodeConfig[] {
  return [
    { id: "node-a", label: "Node A", region: "us-east", zone: "az-1", capacityRecords: 100, readCapacityOps: 50, writeCapacityOps: 50, online: true, joined: true },
    { id: "node-b", label: "Node B", region: "us-east", zone: "az-2", capacityRecords: 100, readCapacityOps: 50, writeCapacityOps: 50, online: true, joined: true },
    { id: "node-c", label: "Node C", region: "us-east", zone: "az-3", capacityRecords: 100, readCapacityOps: 50, writeCapacityOps: 50, online: true, joined: true },
    { id: "node-d", label: "Node D", region: "us-east", zone: "az-1", capacityRecords: 100, readCapacityOps: 50, writeCapacityOps: 50, online: true, joined: includeDJoined },
  ];
}

export function createDistributedStoragePresetScenario(
  presetId: DistributedStoragePresetId
): StorageScenario {
  const meta = DISTRIBUTED_STORAGE_PRESET_METADATA.find((p) => p.id === presetId)!;

  const base: StorageScenario = {
    version: 1,
    id: `storage_${presetId}`,
    presetId,
    name: meta.label,
    description: meta.description,
    architectureRevisionId: "rev_storage_001",
    seed: 15,
    nodes: makeNodes(false),
    partitioning: {
      strategy: "consistent_hash",
      shardCount: 6,
      virtualNodesPerNode: 4,
      ranges: [],
      splitOps: [],
      mergeOps: [],
    },
    placement: { policy: "zone_aware", allowSameNodeForSynthetic: false },
    replication: {
      mode: "leader_based",
      replicationFactor: 3,
      readPolicy: "leader",
      writePolicy: "replica_threshold",
      requiredReplicaAcks: 2,
      baseReplicaLagMs: 10,
      antiEntropyEnabled: false,
    },
    dataset: {
      recordCount: 18,
      keyPattern: "uniform",
      hotKey: "hotkey:item-1",
      hotKeyFraction: 0,
    },
    workload: [
      { id: "op-1", atMs: 40, kind: "write", key: "order:101", value: "paid", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: false },
      { id: "op-2", atMs: 90, kind: "read", key: "order:101", value: "", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: false },
    ],
    migrations: [],
    failures: [],
    limits: {
      maxNodes: 100,
      maxShards: 1000,
      maxRecords: 10000,
      maxEvents: 1000,
      maxVirtualDurationMs: 6000,
    },
  };

  switch (presetId) {
    case "basic_hash_partitioning":
      base.partitioning.strategy = "hash_modulo";
      return base;

    case "range_partitioning":
      base.partitioning.strategy = "range";
      base.partitioning.shardCount = 4;
      base.partitioning.ranges = [
        { shardId: "R1", minKey: 0, maxKey: 2499 },
        { shardId: "R2", minKey: 2500, maxKey: 4999 },
        { shardId: "R3", minKey: 5000, maxKey: 7499 },
        { shardId: "R4", minKey: 7500, maxKey: 9999 },
      ];
      base.dataset.keyPattern = "numeric_range";
      return base;

    case "consistent_hashing":
      base.partitioning.virtualNodesPerNode = 1;
      return base;

    case "virtual_nodes":
      base.nodes = makeNodes(true);
      base.partitioning.virtualNodesPerNode = 12;
      return base;

    case "three_replica_placement":
      return base;

    case "leader_based_replication":
      return base;

    case "leaderless_replication":
    case "quorum_write":
    case "quorum_read":
      base.replication = {
        mode: "leaderless",
        replicationFactor: 3,
        readQuorum: 2,
        writeQuorum: 2,
        readPolicy: "quorum",
        writePolicy: "quorum",
        conflictResolution: "version_vector",
        readRepairEnabled: true,
        hintedHandoffEnabled: true,
        antiEntropyEnabled: true,
        tombstoneRetentionMs: 500,
      };
      if (presetId === "quorum_write") {
        base.failures = [
          { id: "f-down-c", type: "node_crash", targetId: "node-c", atMs: 10, description: "Node C crashes before W=2 quorum write" },
        ];
      }
      return base;

    case "stale_follower_read":
    case "replica_lag":
      base.replication = {
        mode: "leader_based",
        replicationFactor: 3,
        readPolicy: "follower",
        writePolicy: "leader_ack",
        requiredReplicaAcks: 1,
        baseReplicaLagMs: 120,
        antiEntropyEnabled: false,
      };
      base.failures = [
        { id: "f-lag-b", type: "replica_lag", targetId: "node-b", atMs: 15, lagMs: 300, description: "Lag follower Node B before write + follower read" },
        { id: "f-lag-c", type: "replica_lag", targetId: "node-c", atMs: 15, lagMs: 300, description: "Lag follower Node C" },
      ];
      return base;

    case "concurrent_conflicting_writes":
      base.replication = {
        mode: "leaderless",
        replicationFactor: 3,
        readQuorum: 2,
        writeQuorum: 2,
        readPolicy: "quorum",
        writePolicy: "quorum",
        conflictResolution: "version_vector",
        readRepairEnabled: true,
        hintedHandoffEnabled: true,
        antiEntropyEnabled: true,
        tombstoneRetentionMs: 500,
      };
      base.workload = [
        { id: "cw-1", atMs: 50, kind: "concurrent_write", key: "cart:42", value: "v1-apple", concurrentValue: "v2-orange", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: false },
      ];
      return base;

    case "read_repair":
      base.replication = {
        mode: "leaderless",
        replicationFactor: 3,
        readQuorum: 3,
        writeQuorum: 2,
        readPolicy: "all",
        writePolicy: "quorum",
        conflictResolution: "version_vector",
        readRepairEnabled: true,
        hintedHandoffEnabled: false,
        antiEntropyEnabled: false,
        tombstoneRetentionMs: 500,
      };
      base.failures = [
        { id: "f-drop-c", type: "drop_replication", targetId: "node-c", atMs: 10, description: "Drop write replication to Node C; read all triggers repair" },
      ];
      return base;

    case "hinted_handoff":
      base.replication = {
        mode: "leaderless",
        replicationFactor: 3,
        readQuorum: 2,
        writeQuorum: 2,
        readPolicy: "quorum",
        writePolicy: "quorum",
        conflictResolution: "version_vector",
        readRepairEnabled: false,
        hintedHandoffEnabled: true,
        antiEntropyEnabled: false,
        tombstoneRetentionMs: 500,
      };
      base.failures = [
        { id: "f-c-down", type: "node_crash", targetId: "node-c", atMs: 10, description: "Node C offline during write" },
        { id: "f-c-up", type: "node_recover", targetId: "node-c", atMs: 120, description: "Node C recovers and receives hinted handoff" },
      ];
      return base;

    case "anti_entropy_repair":
      base.replication = {
        mode: "leaderless",
        replicationFactor: 3,
        readQuorum: 2,
        writeQuorum: 2,
        readPolicy: "quorum",
        writePolicy: "quorum",
        conflictResolution: "lww",
        readRepairEnabled: false,
        hintedHandoffEnabled: false,
        antiEntropyEnabled: true,
        tombstoneRetentionMs: 500,
      };
      base.failures = [
        { id: "f-drop-b", type: "drop_replication", targetId: "node-b", atMs: 10, description: "Drop write replication to Node B; background anti-entropy fixes it" },
      ];
      return base;

    case "node_failure":
      base.failures = [
        { id: "f-crash-a", type: "node_crash", targetId: "node-a", atMs: 20, description: "Primary Node A crashes; followers promoted" },
      ];
      return base;

    case "zone_failure":
      base.failures = [
        { id: "f-zone-2", type: "zone_failure", targetId: "az-2", atMs: 20, description: "Availability zone az-2 outage" },
      ];
      return base;

    case "storage_network_partition":
      base.failures = [
        { id: "f-part", type: "network_partition", targetId: "cluster", atMs: 20, durationMs: 200, partitionGroups: [["node-a"], ["node-b", "node-c"]], description: "Isolate Node A from [B,C]" },
      ];
      return base;

    case "node_recovery":
      base.failures = [
        { id: "f-down", type: "node_crash", targetId: "node-b", atMs: 20, description: "Node B crashes" },
        { id: "f-up", type: "node_recover", targetId: "node-b", atMs: 140, description: "Node B recovers" },
      ];
      return base;

    case "new_node_joins":
    case "rebalance_planning":
      base.migrations = [
        { id: "m-join", atMs: 30, action: "node_join", targetNodeId: "node-d", bandwidthRecordsPerStep: 4 },
        ...(presetId === "rebalance_planning"
          ? [{ id: "m-reb", atMs: 80, action: "rebalance" as const, bandwidthRecordsPerStep: 4 }]
          : []),
      ];
      return base;

    case "node_removal":
      base.migrations = [
        { id: "m-rem", atMs: 50, action: "node_remove", targetNodeId: "node-c", bandwidthRecordsPerStep: 4 },
      ];
      return base;

    case "live_shard_migration":
    case "ownership_handoff":
    case "stale_routing_map":
      base.migrations = [
        { id: "m-join", atMs: 20, action: "node_join", targetNodeId: "node-d", bandwidthRecordsPerStep: 3 },
        { id: "m-reb", atMs: 40, action: "rebalance", bandwidthRecordsPerStep: 3 },
      ];
      base.workload = [
        { id: "w-mig", atMs: 65, kind: "write", key: "order:99", value: "during-copy", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: false },
        ...(presetId === "stale_routing_map"
          ? [{ id: "r-stale", atMs: 240, kind: "read" as const, key: "order:99", value: "", clientId: "c2", useStaleRoutingMap: true, injectTimeoutAfterApply: false }]
          : []),
      ];
      return base;

    case "migration_failure":
    case "migration_recovery":
      base.migrations = [
        { id: "m-join", atMs: 20, action: "node_join", targetNodeId: "node-d", bandwidthRecordsPerStep: 2 },
        { id: "m-reb", atMs: 35, action: "rebalance", bandwidthRecordsPerStep: 2 },
      ];
      base.failures = [
        { id: "f-dst-fail", type: "migration_dest_fail", targetId: "node-d", atMs: 80, description: "Destination Node D crashes mid-migration" },
        ...(presetId === "migration_recovery"
          ? [{ id: "f-dst-rec", type: "migration_dest_recover" as const, targetId: "node-d", atMs: 180, description: "Node D recovers and resumes from checkpoint" }]
          : []),
      ];
      return base;

    case "shard_splitting":
      base.partitioning.strategy = "range";
      base.partitioning.shardCount = 2;
      base.partitioning.ranges = [
        { shardId: "R1", minKey: 0, maxKey: 4999 },
        { shardId: "R2", minKey: 5000, maxKey: 9999 },
      ];
      base.partitioning.splitOps = [{ atMs: 60, shardId: "R1", splitKey: 2499 }];
      return base;

    case "shard_merging":
      base.partitioning.strategy = "range";
      base.partitioning.shardCount = 4;
      base.partitioning.ranges = [
        { shardId: "R1", minKey: 0, maxKey: 2499 },
        { shardId: "R2", minKey: 2500, maxKey: 4999 },
        { shardId: "R3", minKey: 5000, maxKey: 7499 },
        { shardId: "R4", minKey: 7500, maxKey: 9999 },
      ];
      base.partitioning.mergeOps = [{ atMs: 60, leftShardId: "R1", rightShardId: "R2" }];
      return base;

    case "hot_partition":
    case "hot_key":
    case "capacity_exhaustion":
      base.dataset.keyPattern = "skewed_hot_key";
      base.dataset.hotKey = "hotkey:flash-sale";
      base.dataset.hotKeyFraction = 0.7;
      if (presetId === "capacity_exhaustion") {
        base.nodes[0]!.readCapacityOps = 4;
        base.nodes[1]!.readCapacityOps = 4;
        base.nodes[2]!.readCapacityOps = 4;
      }
      base.workload = Array.from({ length: 8 }, (_, idx) => ({
        id: `hot-op-${idx + 1}`,
        atMs: 20 + idx * 15,
        kind: "read" as const,
        key: "hotkey:flash-sale",
        value: "",
        clientId: "c1",
        useStaleRoutingMap: false,
        injectTimeoutAfterApply: false,
      }));
      return base;

    case "write_timeout_uncertainty":
      base.workload = [
        { id: "w-unc", atMs: 40, kind: "write", key: "tx:88", value: "pending-ack", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: true },
      ];
      return base;

    case "tombstone_reconciliation":
      base.replication = {
        mode: "leaderless",
        replicationFactor: 3,
        readQuorum: 2,
        writeQuorum: 2,
        readPolicy: "quorum",
        writePolicy: "quorum",
        conflictResolution: "lww",
        readRepairEnabled: true,
        hintedHandoffEnabled: true,
        antiEntropyEnabled: true,
        tombstoneRetentionMs: 500,
      };
      base.workload = [
        { id: "op-w", atMs: 30, kind: "write", key: "user:7", value: "alice", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: false },
        { id: "op-del", atMs: 80, kind: "delete", key: "user:7", value: "", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: false },
        { id: "op-read-after-del", atMs: 140, kind: "read", key: "user:7", value: "", clientId: "c1", useStaleRoutingMap: false, injectTimeoutAfterApply: false },
      ];
      return base;
  }
}

