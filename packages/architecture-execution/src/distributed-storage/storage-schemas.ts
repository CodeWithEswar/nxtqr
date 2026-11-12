import { z } from "zod";

export const PartitionStrategySchema = z.enum([
  "hash_modulo",
  "range",
  "consistent_hash",
]);
export type PartitionStrategy = z.infer<typeof PartitionStrategySchema>;

export const PlacementPolicyTypeSchema = z.enum([
  "balanced",
  "capacity_aware",
  "zone_aware",
  "region_aware",
  "anti_affinity",
]);
export type PlacementPolicyType = z.infer<typeof PlacementPolicyTypeSchema>;

export const StorageNodeConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  region: z.string().default("us-east"),
  zone: z.string().default("az-1"),
  capacityRecords: z.number().int().min(1).max(20000).default(100),
  readCapacityOps: z.number().int().min(1).max(10000).default(50),
  writeCapacityOps: z.number().int().min(1).max(10000).default(50),
  online: z.boolean().default(true),
  joined: z.boolean().default(true),
});
export type StorageNodeConfig = z.infer<typeof StorageNodeConfigSchema>;

export const RangeBoundaryConfigSchema = z.object({
  shardId: z.string().min(1),
  minKey: z.number().int(),
  maxKey: z.number().int(),
});
export type RangeBoundaryConfig = z.infer<typeof RangeBoundaryConfigSchema>;

export const PartitioningConfigSchema = z.object({
  strategy: PartitionStrategySchema.default("consistent_hash"),
  shardCount: z.number().int().min(1).max(64).default(6),
  virtualNodesPerNode: z.number().int().min(1).max(64).default(4),
  ranges: z.array(RangeBoundaryConfigSchema).default([]),
  splitOps: z
    .array(
      z.object({
        atMs: z.number().int().nonnegative(),
        shardId: z.string().min(1),
        splitKey: z.number().int(),
      })
    )
    .default([]),
  mergeOps: z
    .array(
      z.object({
        atMs: z.number().int().nonnegative(),
        leftShardId: z.string().min(1),
        rightShardId: z.string().min(1),
      })
    )
    .default([]),
});
export type PartitioningConfig = z.infer<typeof PartitioningConfigSchema>;

export const PlacementConfigSchema = z.object({
  policy: PlacementPolicyTypeSchema.default("zone_aware"),
  allowSameNodeForSynthetic: z.boolean().default(false),
});
export type PlacementConfig = z.infer<typeof PlacementConfigSchema>;

export const ReplicationConfigSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("leader_based"),
    replicationFactor: z.number().int().min(1).max(7).default(3),
    readPolicy: z.enum(["leader", "follower", "quorum"]).default("leader"),
    writePolicy: z.enum(["leader_ack", "replica_threshold", "all"]).default("replica_threshold"),
    requiredReplicaAcks: z.number().int().min(1).max(7).default(2),
    baseReplicaLagMs: z.number().int().min(0).max(5000).default(15),
    antiEntropyEnabled: z.boolean().default(false),
  }),
  z.object({
    mode: z.literal("leaderless"),
    replicationFactor: z.number().int().min(1).max(7).default(3), // N
    readQuorum: z.number().int().min(1).max(7).default(2), // R
    writeQuorum: z.number().int().min(1).max(7).default(2), // W
    readPolicy: z.enum(["one_replica", "quorum", "all"]).default("quorum"),
    writePolicy: z.enum(["one_ack", "quorum", "all"]).default("quorum"),
    conflictResolution: z.enum(["lww", "version_vector", "app_merge", "manual"]).default("version_vector"),
    readRepairEnabled: z.boolean().default(true),
    hintedHandoffEnabled: z.boolean().default(true),
    antiEntropyEnabled: z.boolean().default(true),
    tombstoneRetentionMs: z.number().int().min(50).max(60000).default(500),
  }),
]);
export type ReplicationConfig = z.infer<typeof ReplicationConfigSchema>;

export const StorageWorkloadOpSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().int().nonnegative(),
  kind: z.enum(["read", "write", "delete", "concurrent_write"]),
  key: z.string().min(1),
  value: z.string().default("val"),
  concurrentValue: z.string().optional(),
  clientId: z.string().default("client-1"),
  useStaleRoutingMap: z.boolean().default(false),
  injectTimeoutAfterApply: z.boolean().default(false),
});
export type StorageWorkloadOp = z.infer<typeof StorageWorkloadOpSchema>;

export const MigrationTriggerSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().int().nonnegative(),
  action: z.enum(["node_join", "node_remove", "rebalance", "pause_migration", "resume_migration"]),
  targetNodeId: z.string().optional(),
  bandwidthRecordsPerStep: z.number().int().min(1).max(1000).default(4),
});
export type MigrationTrigger = z.infer<typeof MigrationTriggerSchema>;

export const StorageFaultConfigSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "node_crash",
    "node_recover",
    "zone_failure",
    "network_partition",
    "partition_heal",
    "replica_lag",
    "drop_replication",
    "migration_dest_fail",
    "migration_dest_recover",
  ]),
  targetId: z.string().default("cluster"),
  atMs: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative().optional(),
  lagMs: z.number().int().nonnegative().optional(),
  partitionGroups: z.array(z.array(z.string())).optional(),
  description: z.string().default(""),
});
export type StorageFaultConfig = z.infer<typeof StorageFaultConfigSchema>;

export const StorageScenarioSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  presetId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(""),
  architectureRevisionId: z.string().default("rev_storage_001"),
  seed: z.number().int().default(42),
  nodes: z.array(StorageNodeConfigSchema).min(1).max(100),
  partitioning: PartitioningConfigSchema.default({}),
  placement: PlacementConfigSchema.default({}),
  replication: ReplicationConfigSchema,
  dataset: z
    .object({
      recordCount: z.number().int().min(0).max(10000).default(18),
      keyPattern: z.enum(["uniform", "numeric_range", "skewed_hot_key"]).default("uniform"),
      hotKey: z.string().default("hotkey:item-1"),
      hotKeyFraction: z.number().min(0).max(1).default(0),
    })
    .default({}),
  workload: z.array(StorageWorkloadOpSchema).default([]),
  migrations: z.array(MigrationTriggerSchema).default([]),
  failures: z.array(StorageFaultConfigSchema).default([]),
  limits: z
    .object({
      maxNodes: z.number().int().min(1).max(100).default(100),
      maxShards: z.number().int().min(1).max(1000).default(1000),
      maxRecords: z.number().int().min(10).max(10000).default(10000),
      maxEvents: z.number().int().min(20).max(3000).default(1000),
      maxVirtualDurationMs: z.number().int().min(100).max(30000).default(6000),
    })
    .default({}),
});
export type StorageScenario = z.infer<typeof StorageScenarioSchema>;

// ========================
// Runtime Contracts
// ========================

export interface RecordVersion {
  epoch: number;
  seq: number;
  timestampMs: number;
  writerId: string;
  vectorClock: Record<string, number>;
}

export interface StorageRecord {
  key: string;
  value: string;
  version: RecordVersion;
  deleted: boolean;
  deletedAtMs?: number;
  sizeBytes: number;
}

export interface PhysicalReplicaRuntime {
  replicaId: string;
  shardId: string;
  nodeId: string;
  role: "leader" | "follower" | "peer";
  healthy: boolean;
  lagMs: number;
  latestAppliedSeq: number;
  records: Record<string, StorageRecord>;
}

export interface LogicalShardRuntime {
  shardId: string;
  minKey?: number;
  maxKey?: number;
  primaryNodeId: string | null;
  replicaNodeIds: string[];
  ownershipEpoch: number;
  recordCount: number;
  requestCount: number;
  migrationState:
    | "NONE"
    | "PLANNED"
    | "COPYING"
    | "CATCHING_UP"
    | "VERIFYING"
    | "READY_FOR_CUTOVER"
    | "CUTTING_OVER"
    | "COMPLETED"
    | "PAUSED"
    | "FAILED"
    | "RECOVERING";
  retired?: boolean;
}

export interface StorageNodeRuntime {
  id: string;
  label: string;
  region: string;
  zone: string;
  capacityRecords: number;
  usedRecords: number;
  readCapacityOps: number;
  writeCapacityOps: number;
  activeOps: number;
  throttledOps: number;
  online: boolean;
  joined: boolean;
  ownedShardIds: string[];
  hostedReplicaShardIds: string[];
}

export interface HashRingToken {
  token: number;
  nodeId: string;
  vnodeIndex: number;
}

export interface OperationTraceEntry {
  opId: string;
  atMs: number;
  kind: "read" | "write" | "delete" | "concurrent_write";
  key: string;
  shardId: string;
  coordinatorNodeId: string | null;
  targetReplicas: string[];
  respondedReplicas: string[];
  requiredAcks: number;
  receivedAcks: number;
  outcome: "acknowledged" | "failed" | "uncertain" | "throttled" | "stale_map_redirected";
  staleReadDetected: boolean;
  returnedValue?: string;
  returnedVersion?: string;
  latestVersion?: string;
  reason: string;
}

export interface StorageConflictRecord {
  id: string;
  key: string;
  shardId: string;
  atMs: number;
  competingValues: Array<{ value: string; version: string; nodeId: string }>;
  resolutionPolicy: string;
  resolvedValue: string;
  explanation: string;
}

export interface RepairTaskRecord {
  id: string;
  kind: "read_repair" | "hinted_handoff" | "anti_entropy";
  shardId: string;
  targetNodeId: string;
  key: string;
  status: "pending" | "completed" | "expired";
  createdAtMs: number;
  completedAtMs: number | null;
  detail: string;
}

export interface MigrationTaskRuntime {
  id: string;
  shardId: string;
  sourceNodeId: string;
  targetNodeId: string;
  state: LogicalShardRuntime["migrationState"];
  totalRecords: number;
  copiedRecords: number;
  totalBytes: number;
  copiedBytes: number;
  snapshotSeq: number;
  catchupPendingWrites: number;
  ownershipEpochBefore: number;
  ownershipEpochAfter: number | null;
  failureReason?: string;
}

export interface StorageInvariantReport {
  allPassed: boolean;
  everyKeyMappedOk: boolean;
  placementDeterministicOk: boolean;
  epochMonotonicOk: boolean;
  staleOwnerFencedOk: boolean;
  cutoverSafetyOk: boolean;
  quorumEnforcedOk: boolean;
  tombstoneSafeOk: boolean;
  violations: string[];
}

export interface StorageMetrics {
  totalNodes: number;
  onlineNodes: number;
  logicalShards: number;
  totalReplicas: number;
  totalRecords: number;
  readsCompleted: number;
  writesCompleted: number;
  uncertainWrites: number;
  staleReads: number;
  conflictsDetected: number;
  repairsCompleted: number;
  hintsPending: number;
  throttledRequests: number;
  migrationsStarted: number;
  migrationsCompleted: number;
  dataMovedBytes: number;
  maxReplicaLagMs: number;
  hotShardId: string | null;
  hotKey: string | null;
  avgReadLatencyMs: number;
  avgWriteLatencyMs: number;
}

export interface ModeledDistributedStorageRuntimeState {
  virtualTimeMs: number;
  strategy: PartitionStrategy;
  replicationMode: ReplicationConfig["mode"];
  quorumConfig?: { n: number; r: number; w: number; overlapStrong: boolean };
  placementViolations: string[];
  activePartitions: string[][];
  nodes: Record<string, StorageNodeRuntime>;
  shards: Record<string, LogicalShardRuntime>;
  replicas: Record<string, PhysicalReplicaRuntime>;
  hashRing: HashRingToken[];
  recentOperations: OperationTraceEntry[];
  conflicts: StorageConflictRecord[];
  repairs: RepairTaskRecord[];
  migrations: MigrationTaskRuntime[];
  hotKeys: Array<{ key: string; requests: number; shardId: string }>;
  consistencyCaveats: string[];
  invariants: StorageInvariantReport;
  metrics: StorageMetrics;
}

