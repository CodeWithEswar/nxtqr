import { describe, it, expect } from "vitest";
import {
  StreamPartitioner,
  PartitionAssignor,
  StreamLagCalculator,
  StreamRetentionEngine,
  StreamReplicationEngine,
  StreamingExecutionEngine,
  createStreamingPresetScenario,
  STREAMING_PRESET_METADATA,
  type StreamingScenarioPresetId,
  type PartitionState,
  type ConsumerInstanceConfig,
} from "../index";

describe("Phase 05.4.9: Interactive Event Streaming, Kafka Partitions & Consumer Groups", () => {
  describe("StreamPartitioner", () => {
    it("deterministically routes matching keys to the exact same partition", () => {
      const p1 = StreamPartitioner.selectPartition("key_hash", "orders.created", 3, "customer-42");
      const p2 = StreamPartitioner.selectPartition("key_hash", "orders.created", 3, "customer-42");
      const p3 = StreamPartitioner.selectPartition("key_hash", "orders.created", 3, "customer-42");

      expect(p1.partitionIndex).toBe(p2.partitionIndex);
      expect(p2.partitionIndex).toBe(p3.partitionIndex);
      expect(p1.strategyUsed).toBe("key_hash");
    });

    it("distributes keyless messages in round-robin order", () => {
      StreamPartitioner.resetCounters();
      const p0 = StreamPartitioner.selectPartition("round_robin", "orders.test", 3);
      const p1 = StreamPartitioner.selectPartition("round_robin", "orders.test", 3);
      const p2 = StreamPartitioner.selectPartition("round_robin", "orders.test", 3);
      const p3 = StreamPartitioner.selectPartition("round_robin", "orders.test", 3);

      expect(p0.partitionIndex).toBe(0);
      expect(p1.partitionIndex).toBe(1);
      expect(p2.partitionIndex).toBe(2);
      expect(p3.partitionIndex).toBe(0);
    });

    it("respects explicit partition overrides", () => {
      const res = StreamPartitioner.selectPartition("round_robin", "orders.test", 4, undefined, 2);
      expect(res.partitionIndex).toBe(2);
      expect(res.strategyUsed).toBe("override");
    });
  });

  describe("PartitionAssignor", () => {
    const consumers: ConsumerInstanceConfig[] = [
      { id: "c1", name: "Consumer 1", groupId: "g1", processingTimeMs: 10, batchSize: 5, pollIntervalMs: 20, isAlive: true },
      { id: "c2", name: "Consumer 2", groupId: "g1", processingTimeMs: 10, batchSize: 5, pollIntervalMs: 20, isAlive: true },
    ];
    const partitionIds = ["p0", "p1", "p2"];

    it("assigns partitions using Range strategy ensuring exclusive partition ownership", () => {
      const assignments = PartitionAssignor.assignPartitions("range", partitionIds, consumers);

      expect(assignments["c1"]).toEqual(["p0", "p1"]);
      expect(assignments["c2"]).toEqual(["p2"]);

      // Verify no partition is assigned to more than 1 consumer in the same group
      const allAssigned = [...assignments["c1"], ...assignments["c2"]];
      expect(new Set(allAssigned).size).toBe(partitionIds.length);
    });

    it("assigns partitions using Round-Robin strategy", () => {
      const assignments = PartitionAssignor.assignPartitions("round_robin", partitionIds, consumers);

      expect(assignments["c1"]).toEqual(["p0", "p2"]);
      expect(assignments["c2"]).toEqual(["p1"]);
    });

    it("leaves excess consumers idle when consumers > partitions", () => {
      const fourConsumers: ConsumerInstanceConfig[] = [
        ...consumers,
        { id: "c3", name: "Consumer 3", groupId: "g1", processingTimeMs: 10, batchSize: 5, pollIntervalMs: 20, isAlive: true },
        { id: "c4", name: "Consumer 4", groupId: "g1", processingTimeMs: 10, batchSize: 5, pollIntervalMs: 20, isAlive: true },
      ];

      const assignments = PartitionAssignor.assignPartitions("range", partitionIds, fourConsumers);
      expect(assignments["c1"].length).toBe(1);
      expect(assignments["c2"].length).toBe(1);
      expect(assignments["c3"].length).toBe(1);
      expect(assignments["c4"]).toEqual([]); // Idle consumer
    });
  });

  describe("StreamLagCalculator", () => {
    it("accurately calculates committed and fetch lag for partitions", () => {
      const partition: PartitionState = {
        id: "orders-p0",
        topicId: "orders",
        partitionIndex: 0,
        leaderBrokerId: "b1",
        replicaBrokerIds: ["b1", "b2"],
        isrBrokerIds: ["b1", "b2"],
        logStartOffset: 0,
        nextOffset: 15,
        highWatermark: 15,
        records: [],
      };

      const lagSummary = StreamLagCalculator.calculatePartitionLag(partition, {
        consumerId: "c1",
        partitionId: "orders-p0",
        currentFetchOffset: 12,
        committedNextOffset: 10,
        lastProcessedOffset: 9,
        lag: 0,
      });

      expect(lagSummary.logEndOffset).toBe(15);
      expect(lagSummary.committedLag).toBe(5); // 15 - 10
      expect(lagSummary.fetchLag).toBe(3); // 15 - 12
    });
  });

  describe("StreamRetentionEngine", () => {
    it("prunes oldest records without renumbering subsequent offsets", () => {
      const partition: PartitionState = {
        id: "orders-p0",
        topicId: "orders",
        partitionIndex: 0,
        leaderBrokerId: "b1",
        replicaBrokerIds: ["b1"],
        isrBrokerIds: ["b1"],
        logStartOffset: 0,
        nextOffset: 5,
        highWatermark: 5,
        records: [
          { id: "r0", topicId: "orders", partitionId: "p0", offset: 0, value: {}, timestampMs: 100, producerId: "p" },
          { id: "r1", topicId: "orders", partitionId: "p0", offset: 1, value: {}, timestampMs: 200, producerId: "p" },
          { id: "r2", topicId: "orders", partitionId: "p0", offset: 2, value: {}, timestampMs: 300, producerId: "p" },
          { id: "r3", topicId: "orders", partitionId: "p0", offset: 3, value: {}, timestampMs: 400, producerId: "p" },
          { id: "r4", topicId: "orders", partitionId: "p0", offset: 4, value: {}, timestampMs: 500, producerId: "p" },
        ],
      };

      const result = StreamRetentionEngine.evaluatePartitionRetention(
        partition,
        { type: "count", maxRecords: 3 },
        600
      );

      expect(result.expiredCount).toBe(2);
      expect(result.oldLogStartOffset).toBe(0);
      expect(result.newLogStartOffset).toBe(2);
      expect(partition.records.length).toBe(3);
      expect(partition.records[0].offset).toBe(2); // Offsets are NOT renumbered
      expect(partition.records[2].offset).toBe(4);
    });
  });

  describe("StreamReplicationEngine", () => {
    it("syncs replica and updates high watermark", () => {
      const partition: PartitionState = {
        id: "orders-p0",
        topicId: "orders",
        partitionIndex: 0,
        leaderBrokerId: "b1",
        replicaBrokerIds: ["b1", "b2"],
        isrBrokerIds: ["b1"],
        logStartOffset: 0,
        nextOffset: 10,
        highWatermark: 0,
        records: [],
      };

      const res = StreamReplicationEngine.syncReplica(partition, "b2", 10);
      expect(res.inSync).toBe(true);
      expect(res.highWatermark).toBe(10);
    });

    it("elects new clean leader from In-Sync Replicas when leader crashes", () => {
      const partition: PartitionState = {
        id: "orders-p0",
        topicId: "orders",
        partitionIndex: 0,
        leaderBrokerId: "b1",
        replicaBrokerIds: ["b1", "b2", "b3"],
        isrBrokerIds: ["b1", "b2"],
        logStartOffset: 0,
        nextOffset: 10,
        highWatermark: 10,
        records: [],
      };

      const brokers = [
        { id: "b1", name: "Broker 1", host: "1.1", port: 9092, isAlive: false },
        { id: "b2", name: "Broker 2", host: "1.2", port: 9092, isAlive: true },
        { id: "b3", name: "Broker 3", host: "1.3", port: 9092, isAlive: true },
      ];

      const election = StreamReplicationEngine.electLeader(partition, brokers, false);
      expect(election).not.toBeNull();
      expect(election?.newLeaderBrokerId).toBe("b2");
      expect(election?.isCleanElection).toBe(true);
      expect(election?.lostRecordsCount).toBe(0);
    });
  });

  describe("StreamingExecutionEngine - 16 Educational Presets", () => {
    const allPresets = Object.keys(STREAMING_PRESET_METADATA) as StreamingScenarioPresetId[];

    it.each(allPresets)("executes preset '%s' producing valid trace and frames", (presetId) => {
      const scenario = createStreamingPresetScenario(presetId);
      const trace = StreamingExecutionEngine.executeScenario(scenario);

      expect(trace).toBeDefined();
      expect(trace.outcome).toBe("success");
      expect(trace.events.length).toBeGreaterThan(0);
      expect(trace.frames.length).toBe(trace.events.length);

      const lastFrame = trace.frames[trace.frames.length - 1];
      const streamingState = lastFrame?.runtimeState?.streamingState;
      expect(streamingState).toBeDefined();
      expect(streamingState?.metrics.producedRecords).toBeGreaterThan(0);
    });

    it("verifies consumer crash triggers rebalance and reassignment", () => {
      const scenario = createStreamingPresetScenario("consumer_crash_rebalance");
      const trace = StreamingExecutionEngine.executeScenario(scenario);

      expect(trace.events.some((e: any) => e.type === "stream.rebalance.started")).toBe(true);
      expect(trace.events.some((e: any) => e.type === "stream.partition.revoked")).toBe(true);
      expect(trace.events.some((e: any) => e.type === "stream.partition.assigned")).toBe(true);
      expect(trace.events.some((e: any) => e.type === "stream.rebalance.completed")).toBe(true);
    });

    it("verifies dead letter queue routing for poison records", () => {
      const scenario = createStreamingPresetScenario("dead_letter_queue_routing");
      const trace = StreamingExecutionEngine.executeScenario(scenario);

      expect(trace.events.some((e: any) => e.type === "stream.dlq.record.appended")).toBe(true);
      const lastState = trace.frames[trace.frames.length - 1]?.runtimeState?.streamingState;
      expect(lastState?.metrics.dlqRoutedRecords).toBeGreaterThan(0);
    });

    it("verifies record replay rewinds consumer fetch offset", () => {
      const scenario = createStreamingPresetScenario("record_replay_rewind");
      const trace = StreamingExecutionEngine.executeScenario(scenario);

      expect(trace.events.some((e: any) => e.type === "stream.offset.commit.requested" && (e as any).commitMode === "replay_rewind")).toBe(true);
    });

    it("verifies producer duplicate suppression in idempotent mode", () => {
      const scenario = createStreamingPresetScenario("producer_idempotence");
      const trace = StreamingExecutionEngine.executeScenario(scenario);

      // The duplicate message with sequenceNumber: 2 should be suppressed
      const appends = trace.events.filter((e: any) => e.type === "stream.record.appended");
      expect(appends.length).toBe(scenario.messagesToProduce.length - 1);
    });
  });
});
