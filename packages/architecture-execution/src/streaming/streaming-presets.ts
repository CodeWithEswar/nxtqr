import type {
  StreamingScenario,
  StreamingClusterConfig,
  TopicConfig,
  ProducerConfig,
  ConsumerGroupConfig,
  BrokerConfig,
} from "./streaming-schemas";

export type StreamingScenarioPresetId =
  | "single_partition_basic"
  | "multi_partition_round_robin"
  | "key_based_ordering"
  | "multiple_consumer_groups"
  | "consumer_scaling_idle"
  | "consumer_crash_rebalance"
  | "at_most_once_skip"
  | "at_least_once_duplicate"
  | "idempotent_consumer_dedup"
  | "slow_consumer_lag"
  | "leader_failover_clean"
  | "unclean_leader_failover"
  | "log_retention_cleanup"
  | "record_replay_rewind"
  | "dead_letter_queue_routing"
  | "producer_idempotence";

export interface StreamingPresetMetadata {
  id: StreamingScenarioPresetId;
  title: string;
  category:
    | "Partitioning & Log"
    | "Consumer Coordination"
    | "Semantics & Faults"
    | "Cluster & Replication";
  description: string;
}

export const STREAMING_PRESET_METADATA: Record<
  StreamingScenarioPresetId,
  StreamingPresetMetadata
> = {
  single_partition_basic: {
    id: "single_partition_basic",
    title: "Single Partition Append & Consume",
    category: "Partitioning & Log",
    description:
      "A single partition append-only log with 1 producer and 1 consumer demonstrating sequential monotonic offsets.",
  },
  multi_partition_round_robin: {
    id: "multi_partition_round_robin",
    title: "Round-Robin Multi-Partition Stream",
    category: "Partitioning & Log",
    description:
      "Keyless records distributed cyclically across 3 partitions (P0, P1, P2) maximizing write throughput.",
  },
  key_based_ordering: {
    id: "key_based_ordering",
    title: "Key-Based Consistent Hash Ordering",
    category: "Partitioning & Log",
    description:
      "FNV-1a hash routes records with the same partition key (customer-42) to the exact same partition for strict order.",
  },
  multiple_consumer_groups: {
    id: "multiple_consumer_groups",
    title: "Multiple Independent Consumer Groups",
    category: "Consumer Coordination",
    description:
      "Two separate consumer groups (order-processors and analytics-ingest) consume the same topic at their own offset pace.",
  },
  consumer_scaling_idle: {
    id: "consumer_scaling_idle",
    title: "Consumer Scaling Beyond Partitions (Idle Worker)",
    category: "Consumer Coordination",
    description:
      "A topic has 3 partitions but 4 consumers in one group; the 4th consumer remains idle under exclusive ownership rules.",
  },
  consumer_crash_rebalance: {
    id: "consumer_crash_rebalance",
    title: "Consumer Crash & Group Rebalance",
    category: "Consumer Coordination",
    description:
      "Consumer instance crashes midway; group rebalance revokes its partition and reassigns it to the surviving consumer.",
  },
  at_most_once_skip: {
    id: "at_most_once_skip",
    title: "At-Most-Once Delivery (Risky Pre-Commit)",
    category: "Semantics & Faults",
    description:
      "Consumer commits offset before processing. A crash during processing causes the record to be skipped on restart.",
  },
  at_least_once_duplicate: {
    id: "at_least_once_duplicate",
    title: "At-Least-Once Delivery (Reprocessing Duplicate)",
    category: "Semantics & Faults",
    description:
      "Consumer processes record but crashes right before committing; replacement consumer reprocesses the same offset.",
  },
  idempotent_consumer_dedup: {
    id: "idempotent_consumer_dedup",
    title: "Idempotent Consumer Deduplication",
    category: "Semantics & Faults",
    description:
      "Duplicate record delivery is detected via a modeled unique event deduplication table and gracefully suppressed.",
  },
  slow_consumer_lag: {
    id: "slow_consumer_lag",
    title: "Slow Consumer & Growing Lag",
    category: "Consumer Coordination",
    description:
      "High producer ingress with high consumer processing latency causes unconsumed lag to accumulate rapidly.",
  },
  leader_failover_clean: {
    id: "leader_failover_clean",
    title: "Clean Leader Failover (Zero Data Loss)",
    category: "Cluster & Replication",
    description:
      "Partition leader broker crashes; In-Sync Replica (ISR) with matching high watermark is elected new leader safely.",
  },
  unclean_leader_failover: {
    id: "unclean_leader_failover",
    title: "Unclean Leader Failover (Data Truncation)",
    category: "Cluster & Replication",
    description:
      "Leader broker fails when replicas lag; electing a lagging replica truncates un-replicated records with data loss.",
  },
  log_retention_cleanup: {
    id: "log_retention_cleanup",
    title: "Bounded Log Retention Pruning",
    category: "Partitioning & Log",
    description:
      "Partition log exceeds maximum record capacity; oldest records are trimmed, monotonically advancing logStartOffset.",
  },
  record_replay_rewind: {
    id: "record_replay_rewind",
    title: "Historical Record Replay & Offset Rewind",
    category: "Semantics & Faults",
    description:
      "Consumer rewind from offset 5 back to offset 0, replaying historical event stream without mutating log history.",
  },
  dead_letter_queue_routing: {
    id: "dead_letter_queue_routing",
    title: "Dead-Letter Queue (DLQ) Fallback Routing",
    category: "Semantics & Faults",
    description:
      "A poisoned record repeatedly fails consumer processing and is safely diverted to orders.created.dlq topic.",
  },
  producer_idempotence: {
    id: "producer_idempotence",
    title: "Idempotent Producer Duplicate Suppression",
    category: "Partitioning & Log",
    description:
      "Producer retries network glitch with duplicate sequence ID; broker identifies sequence number and suppresses duplicate.",
  },
};

export function createStreamingPresetScenario(
  presetId: StreamingScenarioPresetId
): StreamingScenario {
  const brokers: BrokerConfig[] = [
    { id: "broker-1", name: "Broker 1 (Leader)", host: "10.0.1.1", port: 9092, isAlive: true },
    { id: "broker-2", name: "Broker 2 (Follower)", host: "10.0.1.2", port: 9092, isAlive: true },
    { id: "broker-3", name: "Broker 3 (Follower)", host: "10.0.1.3", port: 9092, isAlive: true },
  ];

  const cluster: StreamingClusterConfig = {
    clusterId: "stream-cluster-prod",
    name: "Production Kafka Cluster",
    brokers,
    defaultReplicationFactor: 3,
    defaultPartitions: 3,
  };

  const defaultTopic: TopicConfig = {
    id: "orders.created",
    name: "orders.created",
    partitionCount: presetId === "single_partition_basic" ? 1 : 3,
    replicationFactor: 3,
    retentionPolicy: {
      type: presetId === "log_retention_cleanup" ? "count" : "time",
      maxRecords: presetId === "log_retention_cleanup" ? 4 : 50,
      maxRetentionMs: 60000,
    },
    dlqTopicId: presetId === "dead_letter_queue_routing" ? "orders.created.dlq" : undefined,
  };

  const dlqTopic: TopicConfig = {
    id: "orders.created.dlq",
    name: "orders.created.dlq",
    partitionCount: 1,
    replicationFactor: 1,
    retentionPolicy: { type: "time", maxRetentionMs: 86400000 },
  };

  const topics: TopicConfig[] =
    presetId === "dead_letter_queue_routing"
      ? [defaultTopic, dlqTopic]
      : [defaultTopic];

  const producer: ProducerConfig = {
    id: "order-service-producer",
    name: "Order API Producer",
    targetTopic: "orders.created",
    partitioningStrategy:
      presetId === "key_based_ordering" ? "key_hash" : "round_robin",
    acks:
      presetId === "leader_failover_clean" || presetId === "unclean_leader_failover"
        ? "all"
        : "leader",
    retries: 3,
    idempotent: presetId === "producer_idempotence",
  };

  const consumerGroup: ConsumerGroupConfig = {
    id: "order-processors",
    name: "Order Processing Group",
    topicId: "orders.created",
    assignmentStrategy: "range",
    commitMode:
      presetId === "at_most_once_skip"
        ? "manual_before_processing"
        : "auto",
    consumers: [
      {
        id: "consumer-1",
        name: "Consumer Instance A",
        groupId: "order-processors",
        processingTimeMs: presetId === "slow_consumer_lag" ? 50 : 10,
        batchSize: 5,
        pollIntervalMs: 20,
        isAlive: true,
        failureInjected:
          presetId === "consumer_crash_rebalance" ||
          presetId === "at_most_once_skip" ||
          presetId === "at_least_once_duplicate",
      },
      {
        id: "consumer-2",
        name: "Consumer Instance B",
        groupId: "order-processors",
        processingTimeMs: 10,
        batchSize: 5,
        pollIntervalMs: 20,
        isAlive: true,
      },
    ],
  };

  if (presetId === "consumer_scaling_idle") {
    consumerGroup.consumers.push(
      {
        id: "consumer-3",
        name: "Consumer Instance C",
        groupId: "order-processors",
        processingTimeMs: 10,
        batchSize: 5,
        pollIntervalMs: 20,
        isAlive: true,
      },
      {
        id: "consumer-4",
        name: "Consumer Instance D (Idle)",
        groupId: "order-processors",
        processingTimeMs: 10,
        batchSize: 5,
        pollIntervalMs: 20,
        isAlive: true,
      }
    );
  }

  const consumerGroups = [consumerGroup];

  if (presetId === "multiple_consumer_groups") {
    consumerGroups.push({
      id: "analytics-ingest",
      name: "Analytics Real-Time Pipeline",
      topicId: "orders.created",
      assignmentStrategy: "round_robin",
      commitMode: "auto",
      consumers: [
        {
          id: "analytics-consumer-1",
          name: "Analytics Ingestion Worker",
          groupId: "analytics-ingest",
          processingTimeMs: 5,
          batchSize: 10,
          pollIntervalMs: 15,
          isAlive: true,
        },
      ],
    });
  }

  // Generate deterministic modeled messages
  const messagesToProduce: StreamingScenario["messagesToProduce"] = [];
  const numMessages =
    presetId === "log_retention_cleanup"
      ? 8
      : presetId === "slow_consumer_lag"
        ? 12
        : 6;

  for (let i = 0; i < numMessages; i++) {
    const key =
      presetId === "key_based_ordering"
        ? i % 2 === 0
          ? "customer-42"
          : "customer-88"
        : undefined;

    messagesToProduce.push({
      producerId: "order-service-producer",
      scheduledAtMs: i * 15,
      message: {
        key,
        value: {
          orderId: `ord_${1000 + i}`,
          amount: (i + 1) * 25.5,
          currency: "USD",
          status: "CREATED",
        },
        sequenceNumber: i + 1,
      },
    });
  }

  // Duplicate for producer idempotence preset
  if (presetId === "producer_idempotence") {
    messagesToProduce.push({
      producerId: "order-service-producer",
      scheduledAtMs: 35,
      message: {
        key: "customer-42",
        value: { orderId: "ord_1001", amount: 51.0, currency: "USD" },
        sequenceNumber: 2, // duplicate sequence number
      },
    });
  }

  // Replay configuration
  const replayOffset =
    presetId === "record_replay_rewind"
      ? {
          groupId: "order-processors",
          partitionId: "orders.created-p0",
          targetOffset: 0,
          atMs: 80,
        }
      : undefined;

  // Fault injections
  const faults: StreamingScenario["faults"] = [];
  if (
    presetId === "consumer_crash_rebalance" ||
    presetId === "at_most_once_skip" ||
    presetId === "at_least_once_duplicate"
  ) {
    faults.push({
      type: "consumer_crash",
      targetId: "consumer-1",
      atMs: 45,
    });
  }

  if (presetId === "leader_failover_clean" || presetId === "unclean_leader_failover") {
    faults.push({
      type: "broker_failure",
      targetId: "broker-1",
      atMs: 40,
    });
  }

  return {
    version: 1,
    id: presetId,
    title: STREAMING_PRESET_METADATA[presetId].title,
    description: STREAMING_PRESET_METADATA[presetId].description,
    cluster,
    topics,
    producers: [producer],
    consumerGroups,
    messagesToProduce,
    faults,
    replayOffset,
    limits: {
      maxRecords: 1000,
      maxEvents: 500,
      maxVirtualDurationMs: 5000,
    },
  };
}
