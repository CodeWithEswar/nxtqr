import { z } from "zod";

// ============================================================================
// 1. Cluster & Broker Models
// ============================================================================

export interface BrokerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  rackId?: string;
  isAlive: boolean;
}

export interface StreamingClusterConfig {
  clusterId: string;
  name: string;
  brokers: BrokerConfig[];
  defaultReplicationFactor: number;
  defaultPartitions: number;
}

// ============================================================================
// 2. Retention Policy
// ============================================================================

export type RetentionType = "time" | "size" | "count";

export interface RetentionPolicy {
  type: RetentionType;
  maxRetentionMs?: number;
  maxRecords?: number;
  maxBytes?: number;
}

// ============================================================================
// 3. Topic & Partition Models
// ============================================================================

export interface TopicConfig {
  id: string;
  name: string;
  partitionCount: number;
  replicationFactor: number;
  retentionPolicy: RetentionPolicy;
  dlqTopicId?: string;
}

export interface PartitionRecord {
  id: string;
  topicId: string;
  partitionId: string;
  offset: number;
  key?: string;
  value: unknown;
  timestampMs: number;
  producerId: string;
  headers?: Record<string, string>;
  replayed?: boolean;
}

export interface PartitionState {
  id: string;
  topicId: string;
  partitionIndex: number;
  leaderBrokerId: string;
  replicaBrokerIds: string[];
  isrBrokerIds: string[];
  logStartOffset: number;
  nextOffset: number;
  highWatermark: number;
  records: PartitionRecord[];
}

// ============================================================================
// 4. Producer Models
// ============================================================================

export type PartitioningStrategy = "key_hash" | "round_robin" | "custom";
export type ProducerAcks = "none" | "leader" | "all";

export interface ProducerConfig {
  id: string;
  name: string;
  targetTopic: string;
  partitioningStrategy: PartitioningStrategy;
  acks: ProducerAcks;
  retries: number;
  idempotent: boolean;
}

export interface ProducerMessage {
  key?: string;
  value: unknown;
  headers?: Record<string, string>;
  partitionOverride?: number;
  sequenceNumber?: number;
}

// ============================================================================
// 5. Consumer Group Models
// ============================================================================

export type AssignmentStrategy = "range" | "round_robin" | "sticky";
export type OffsetCommitMode =
  | "auto"
  | "manual_after_processing"
  | "manual_before_processing";

export interface ConsumerInstanceConfig {
  id: string;
  name: string;
  groupId: string;
  processingTimeMs: number;
  batchSize: number;
  pollIntervalMs: number;
  isAlive: boolean;
  failureInjected?: boolean;
}

export interface ConsumerGroupConfig {
  id: string;
  name: string;
  topicId: string;
  assignmentStrategy: AssignmentStrategy;
  commitMode: OffsetCommitMode;
  consumers: ConsumerInstanceConfig[];
}

export interface ConsumerPosition {
  consumerId: string;
  partitionId: string;
  currentFetchOffset: number;
  committedNextOffset: number;
  lastProcessedOffset: number;
  lag: number;
}

export type RebalanceState =
  | "stable"
  | "rebalance_requested"
  | "revoking_assignments"
  | "assigning_partitions";

export interface RebalanceRecord {
  id: string;
  groupId: string;
  generation: number;
  trigger:
    | "consumer_joined"
    | "consumer_left"
    | "consumer_crashed"
    | "partitions_changed";
  timestampMs: number;
  previousAssignments: Record<string, string[]>;
  newAssignments: Record<string, string[]>;
  revokedPartitions: string[];
}

// ============================================================================
// 6. Metrics & Runtime State
// ============================================================================

export interface StreamingMetrics {
  producedRecords: number;
  acknowledgedRecords: number;
  consumedRecords: number;
  processedRecords: number;
  failedRecords: number;
  reprocessedRecords: number;
  committedRecords: number;
  totalConsumerLag: number;
  rebalanceCount: number;
  replicationLag: number;
  dlqRoutedRecords: number;
  activeConsumersCount: number;
  activePartitionsCount: number;
}

export interface ModeledStreamingRuntimeState {
  cluster: StreamingClusterConfig;
  topics: Record<string, TopicConfig>;
  partitions: Record<string, PartitionState>;
  consumerGroups: Record<
    string,
    {
      config: ConsumerGroupConfig;
      assignments: Record<string, string[]>; // consumerId -> partitionIds
      positions: Record<string, ConsumerPosition>; // partitionId -> position
      rebalanceState: RebalanceState;
      generation: number;
      history: RebalanceRecord[];
    }
  >;
  metrics: StreamingMetrics;
  deduplicationStore: Record<string, boolean>; // event key/id -> boolean
  dlqRecords: PartitionRecord[];
}

// ============================================================================
// 7. Scenario Definitions
// ============================================================================

export interface StreamingFaultInjection {
  type: "consumer_crash" | "broker_failure" | "network_lag";
  targetId: string;
  atMs: number;
  durationMs?: number;
}

export interface StreamingReplayConfig {
  groupId: string;
  partitionId: string;
  targetOffset: number;
  atMs: number;
}

export interface StreamingScenarioLimits {
  maxRecords: number;
  maxEvents: number;
  maxVirtualDurationMs: number;
}

export interface StreamingScenario {
  version: 1;
  id: string;
  title: string;
  description: string;
  cluster: StreamingClusterConfig;
  topics: TopicConfig[];
  producers: ProducerConfig[];
  consumerGroups: ConsumerGroupConfig[];
  messagesToProduce: Array<{
    producerId: string;
    message: ProducerMessage;
    scheduledAtMs: number;
  }>;
  faults?: StreamingFaultInjection[];
  replayOffset?: StreamingReplayConfig;
  limits: StreamingScenarioLimits;
}

// ============================================================================
// 8. Zod Validation Schemas
// ============================================================================

export const BrokerConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  rackId: z.string().optional(),
  isAlive: z.boolean(),
});

export const RetentionPolicySchema = z.object({
  type: z.enum(["time", "size", "count"]),
  maxRetentionMs: z.number().positive().optional(),
  maxRecords: z.number().int().positive().optional(),
  maxBytes: z.number().int().positive().optional(),
});

export const TopicConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  partitionCount: z.number().int().positive().max(100),
  replicationFactor: z.number().int().positive().max(10),
  retentionPolicy: RetentionPolicySchema,
  dlqTopicId: z.string().optional(),
});

export const ProducerConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetTopic: z.string().min(1),
  partitioningStrategy: z.enum(["key_hash", "round_robin", "custom"]),
  acks: z.enum(["none", "leader", "all"]),
  retries: z.number().int().nonnegative(),
  idempotent: z.boolean(),
});

export const ConsumerInstanceConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  groupId: z.string().min(1),
  processingTimeMs: z.number().int().positive(),
  batchSize: z.number().int().positive(),
  pollIntervalMs: z.number().int().positive(),
  isAlive: z.boolean(),
  failureInjected: z.boolean().optional(),
});

export const ConsumerGroupConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  topicId: z.string().min(1),
  assignmentStrategy: z.enum(["range", "round_robin", "sticky"]),
  commitMode: z.enum([
    "auto",
    "manual_after_processing",
    "manual_before_processing",
  ]),
  consumers: z.array(ConsumerInstanceConfigSchema).min(1),
});

export const StreamingScenarioSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  cluster: z.object({
    clusterId: z.string().min(1),
    name: z.string().min(1),
    brokers: z.array(BrokerConfigSchema).min(1),
    defaultReplicationFactor: z.number().int().positive(),
    defaultPartitions: z.number().int().positive(),
  }),
  topics: z.array(TopicConfigSchema).min(1),
  producers: z.array(ProducerConfigSchema).min(1),
  consumerGroups: z.array(ConsumerGroupConfigSchema).min(1),
  messagesToProduce: z.array(
    z.object({
      producerId: z.string(),
      message: z.object({
        key: z.string().optional(),
        value: z.unknown(),
        headers: z.record(z.string()).optional(),
        partitionOverride: z.number().int().nonnegative().optional(),
        sequenceNumber: z.number().int().nonnegative().optional(),
      }),
      scheduledAtMs: z.number().nonnegative(),
    })
  ),
  faults: z
    .array(
      z.object({
        type: z.enum(["consumer_crash", "broker_failure", "network_lag"]),
        targetId: z.string(),
        atMs: z.number().nonnegative(),
        durationMs: z.number().positive().optional(),
      })
    )
    .optional(),
  replayOffset: z
    .object({
      groupId: z.string(),
      partitionId: z.string(),
      targetOffset: z.number().int().nonnegative(),
      atMs: z.number().nonnegative(),
    })
    .optional(),
  limits: z.object({
    maxRecords: z.number().int().positive(),
    maxEvents: z.number().int().positive(),
    maxVirtualDurationMs: z.number().int().positive(),
  }),
});

