import type { BaseExecutionEvent } from "../domain/execution-event";

export interface StorageKeyRoutedEvent extends BaseExecutionEvent {
  type: "storage.key.routed";
  key: string;
  shardId: string;
  strategy: string;
}

export interface StorageReadCompletedEvent extends BaseExecutionEvent {
  type: "storage.read.completed";
  opId: string;
  key: string;
  shardId: string;
  stale: boolean;
  outcome: string;
}

export interface StorageWriteAcknowledgedEvent extends BaseExecutionEvent {
  type: "storage.write.acknowledged";
  opId: string;
  key: string;
  shardId: string;
  acks: number;
  requiredAcks: number;
}

export interface StorageWriteUncertainEvent extends BaseExecutionEvent {
  type: "storage.write.uncertain";
  opId: string;
  key: string;
  shardId: string;
  reason: string;
}

export interface StorageReplicaLaggedEvent extends BaseExecutionEvent {
  type: "storage.replica.lagged";
  shardId: string;
  nodeId: string;
  lagMs: number;
}

export interface StorageConflictDetectedEvent extends BaseExecutionEvent {
  type: "storage.conflict.detected";
  key: string;
  shardId: string;
  policy: string;
}

export interface StorageRepairCompletedEvent extends BaseExecutionEvent {
  type: "storage.repair.completed";
  repairId: string;
  kind: "read_repair" | "hinted_handoff" | "anti_entropy";
  shardId: string;
  targetNodeId: string;
}

export interface StorageNodeFailedEvent extends BaseExecutionEvent {
  type: "storage.node.failed";
  nodeId: string;
  reason: string;
}

export interface StorageNodeRecoveredEvent extends BaseExecutionEvent {
  type: "storage.node.recovered";
  nodeId: string;
}

export interface StoragePlacementUpdatedEvent extends BaseExecutionEvent {
  type: "storage.placement.updated";
  shardId: string;
  ownershipEpoch: number;
  primaryNodeId: string | null;
}

export interface StorageMigrationProgressEvent extends BaseExecutionEvent {
  type: "storage.migration.copy.progress";
  migrationId: string;
  shardId: string;
  copiedRecords: number;
  totalRecords: number;
}

export interface StorageMigrationCutoverEvent extends BaseExecutionEvent {
  type: "storage.migration.cutover";
  migrationId: string;
  shardId: string;
  newOwnerId: string;
  epoch: number;
}

export interface StorageMigrationFailedEvent extends BaseExecutionEvent {
  type: "storage.migration.failed";
  migrationId: string;
  shardId: string;
  reason: string;
}

export interface StorageShardSplitEvent extends BaseExecutionEvent {
  type: "storage.shard.split";
  sourceShardId: string;
  leftShardId: string;
  rightShardId: string;
}

export interface StorageShardMergedEvent extends BaseExecutionEvent {
  type: "storage.shard.merged";
  leftShardId: string;
  rightShardId: string;
  mergedShardId: string;
}

export interface StorageHotPartitionDetectedEvent extends BaseExecutionEvent {
  type: "storage.hot_partition.detected";
  shardId: string;
  hotKey: string;
  requests: number;
}

export type DistributedStorageEvent =
  | StorageKeyRoutedEvent
  | StorageReadCompletedEvent
  | StorageWriteAcknowledgedEvent
  | StorageWriteUncertainEvent
  | StorageReplicaLaggedEvent
  | StorageConflictDetectedEvent
  | StorageRepairCompletedEvent
  | StorageNodeFailedEvent
  | StorageNodeRecoveredEvent
  | StoragePlacementUpdatedEvent
  | StorageMigrationProgressEvent
  | StorageMigrationCutoverEvent
  | StorageMigrationFailedEvent
  | StorageShardSplitEvent
  | StorageShardMergedEvent
  | StorageHotPartitionDetectedEvent;

