import type { BaseExecutionEvent } from "../domain/execution-event";
import type {
  PartitionRecord,
  RebalanceRecord,
} from "./streaming-schemas";

// ============================================================================
// 1. Producer Events
// ============================================================================

export interface StreamProducerSendStartedEvent extends BaseExecutionEvent {
  type: "stream.producer.send.started";
  producerId: string;
  topicId: string;
  recordKey?: string;
  payloadSummary: string;
}

export interface StreamPartitionSelectedEvent extends BaseExecutionEvent {
  type: "stream.partition.selected";
  producerId: string;
  topicId: string;
  partitionIndex: number;
  strategy: string;
  keyUsed?: string;
  hashValue?: number;
}

export interface StreamRecordAppendedEvent extends BaseExecutionEvent {
  type: "stream.record.appended";
  brokerId: string;
  topicId: string;
  partitionId: string;
  partitionIndex: number;
  offset: number;
  record: PartitionRecord;
  highWatermark: number;
}

export interface StreamProducerAcknowledgedEvent extends BaseExecutionEvent {
  type: "stream.producer.acknowledged";
  producerId: string;
  topicId: string;
  partitionIndex: number;
  offset: number;
  acksSetting: string;
  latencyMs: number;
}

export interface StreamProducerFailedEvent extends BaseExecutionEvent {
  type: "stream.producer.failed";
  producerId: string;
  topicId: string;
  reason: string;
  retryAttempt: number;
  willRetry: boolean;
}

// ============================================================================
// 2. Replication Events
// ============================================================================

export interface StreamReplicationStartedEvent extends BaseExecutionEvent {
  type: "stream.replication.started";
  leaderBrokerId: string;
  replicaBrokerId: string;
  partitionId: string;
  offset: number;
}

export interface StreamReplicationAppliedEvent extends BaseExecutionEvent {
  type: "stream.replication.applied";
  replicaBrokerId: string;
  partitionId: string;
  offset: number;
  highWatermark: number;
}

export interface StreamReplicationFailedEvent extends BaseExecutionEvent {
  type: "stream.replication.failed";
  replicaBrokerId: string;
  partitionId: string;
  reason: string;
}

export interface StreamLeaderElectedEvent extends BaseExecutionEvent {
  type: "stream.leader.elected";
  partitionId: string;
  previousLeaderBrokerId: string;
  newLeaderBrokerId: string;
  isCleanElection: boolean;
  highWatermark: number;
}

export interface StreamLeaderFailedEvent extends BaseExecutionEvent {
  type: "stream.leader.failed";
  brokerId: string;
  affectedPartitions: string[];
}

// ============================================================================
// 3. Consumer Events
// ============================================================================

export interface StreamConsumerPollStartedEvent extends BaseExecutionEvent {
  type: "stream.consumer.poll.started";
  consumerId: string;
  groupId: string;
  assignedPartitions: string[];
}

export interface StreamConsumerRecordsFetchedEvent extends BaseExecutionEvent {
  type: "stream.consumer.records.fetched";
  consumerId: string;
  groupId: string;
  partitionId: string;
  recordCount: number;
  firstOffset: number;
  lastOffset: number;
}

export interface StreamConsumerProcessingStartedEvent extends BaseExecutionEvent {
  type: "stream.consumer.processing.started";
  consumerId: string;
  groupId: string;
  partitionId: string;
  offset: number;
  recordId: string;
}

export interface StreamConsumerProcessingCompletedEvent extends BaseExecutionEvent {
  type: "stream.consumer.processing.completed";
  consumerId: string;
  groupId: string;
  partitionId: string;
  offset: number;
  durationMs: number;
  isDuplicate: boolean;
}

export interface StreamConsumerProcessingFailedEvent extends BaseExecutionEvent {
  type: "stream.consumer.processing.failed";
  consumerId: string;
  groupId: string;
  partitionId: string;
  offset: number;
  reason: string;
  routedToDlq: boolean;
}

// ============================================================================
// 4. Offset Commit Events
// ============================================================================

export interface StreamOffsetCommitRequestedEvent extends BaseExecutionEvent {
  type: "stream.offset.commit.requested";
  consumerId: string;
  groupId: string;
  partitionId: string;
  offsetToCommit: number;
  commitMode: string;
}

export interface StreamOffsetCommittedEvent extends BaseExecutionEvent {
  type: "stream.offset.committed";
  groupId: string;
  partitionId: string;
  committedNextOffset: number;
  consumerLag: number;
}

export interface StreamOffsetCommitFailedEvent extends BaseExecutionEvent {
  type: "stream.offset.commit.failed";
  consumerId: string;
  groupId: string;
  partitionId: string;
  reason: string;
}

// ============================================================================
// 5. Rebalance Events
// ============================================================================

export interface StreamRebalanceStartedEvent extends BaseExecutionEvent {
  type: "stream.rebalance.started";
  groupId: string;
  generation: number;
  trigger: string;
  activeConsumers: string[];
}

export interface StreamPartitionRevokedEvent extends BaseExecutionEvent {
  type: "stream.partition.revoked";
  consumerId: string;
  groupId: string;
  revokedPartitions: string[];
}

export interface StreamPartitionAssignedEvent extends BaseExecutionEvent {
  type: "stream.partition.assigned";
  consumerId: string;
  groupId: string;
  assignedPartitions: string[];
}

export interface StreamRebalanceCompletedEvent extends BaseExecutionEvent {
  type: "stream.rebalance.completed";
  groupId: string;
  generation: number;
  rebalanceRecord: RebalanceRecord;
  durationMs: number;
}

// ============================================================================
// 6. Retention & DLQ Events
// ============================================================================

export interface StreamRetentionEvaluatedEvent extends BaseExecutionEvent {
  type: "stream.retention.evaluated";
  partitionId: string;
  policyType: string;
  totalRecordsBefore: number;
}

export interface StreamRecordsExpiredEvent extends BaseExecutionEvent {
  type: "stream.records.expired";
  partitionId: string;
  expiredCount: number;
  oldLogStartOffset: number;
  newLogStartOffset: number;
}

export interface StreamLogStartAdvancedEvent extends BaseExecutionEvent {
  type: "stream.log.start.advanced";
  partitionId: string;
  newLogStartOffset: number;
}

export interface StreamDlqRecordAppendedEvent extends BaseExecutionEvent {
  type: "stream.dlq.record.appended";
  dlqTopicId: string;
  originalTopicId: string;
  originalPartitionId: string;
  originalOffset: number;
  failureReason: string;
}

// ============================================================================
// Union of all StreamingExecutionEvent
// ============================================================================

export type StreamingExecutionEvent =
  | StreamProducerSendStartedEvent
  | StreamPartitionSelectedEvent
  | StreamRecordAppendedEvent
  | StreamProducerAcknowledgedEvent
  | StreamProducerFailedEvent
  | StreamReplicationStartedEvent
  | StreamReplicationAppliedEvent
  | StreamReplicationFailedEvent
  | StreamLeaderElectedEvent
  | StreamLeaderFailedEvent
  | StreamConsumerPollStartedEvent
  | StreamConsumerRecordsFetchedEvent
  | StreamConsumerProcessingStartedEvent
  | StreamConsumerProcessingCompletedEvent
  | StreamConsumerProcessingFailedEvent
  | StreamOffsetCommitRequestedEvent
  | StreamOffsetCommittedEvent
  | StreamOffsetCommitFailedEvent
  | StreamRebalanceStartedEvent
  | StreamPartitionRevokedEvent
  | StreamPartitionAssignedEvent
  | StreamRebalanceCompletedEvent
  | StreamRetentionEvaluatedEvent
  | StreamRecordsExpiredEvent
  | StreamLogStartAdvancedEvent
  | StreamDlqRecordAppendedEvent;
