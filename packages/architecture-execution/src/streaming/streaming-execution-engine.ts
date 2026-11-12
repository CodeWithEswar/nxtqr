import type {
  StreamingScenario,
  ModeledStreamingRuntimeState,
  PartitionRecord,
  ConsumerPosition,
  RebalanceRecord,
  StreamingMetrics,
} from "./streaming-schemas";
import type {
  StreamingExecutionEvent,
  StreamProducerSendStartedEvent,
  StreamPartitionSelectedEvent,
  StreamRecordAppendedEvent,
  StreamProducerAcknowledgedEvent,
  StreamReplicationStartedEvent,
  StreamReplicationAppliedEvent,
  StreamConsumerPollStartedEvent,
  StreamConsumerRecordsFetchedEvent,
  StreamConsumerProcessingStartedEvent,
  StreamConsumerProcessingCompletedEvent,
  StreamConsumerProcessingFailedEvent,
  StreamOffsetCommitRequestedEvent,
  StreamOffsetCommittedEvent,
  StreamRebalanceStartedEvent,
  StreamPartitionRevokedEvent,
  StreamPartitionAssignedEvent,
  StreamRebalanceCompletedEvent,
  StreamRetentionEvaluatedEvent,
  StreamRecordsExpiredEvent,
  StreamLeaderFailedEvent,
  StreamLeaderElectedEvent,
  StreamDlqRecordAppendedEvent,
} from "./streaming-events";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import type {
  ExecutionTrace,
  VisualizationFrame,
} from "../domain/execution-trace";
import { StreamPartitioner } from "./producer/partitioner";
import { PartitionAssignor } from "./consumer/assignment-strategy";
import { StreamLagCalculator } from "./consumer/lag-calculator";
import { StreamRetentionEngine } from "./retention/retention-engine";
import { StreamReplicationEngine } from "./replication/replication-engine";
import {
  RuntimeStateHelper,
  type ModeledRuntimeState,
} from "../domain/runtime-state";

export class StreamingExecutionEngine {
  /**
   * Deterministically executes an event streaming scenario in discrete virtual time.
   */
  public static executeScenario(scenario: StreamingScenario): ExecutionTrace {
    const runId = `run_stream_${Date.now()}`;
    let sequence = 0;
    let virtualClockMs = 0;

    // 1. Initialize Partitions & Cluster State
    const topics: ModeledStreamingRuntimeState["topics"] = {};
    const partitions: ModeledStreamingRuntimeState["partitions"] = {};

    for (const topic of scenario.topics) {
      topics[topic.id] = topic;
      for (let p = 0; p < topic.partitionCount; p++) {
        const partitionId = `${topic.id}-p${p}`;
        const leaderBroker = scenario.cluster.brokers[p % scenario.cluster.brokers.length];
        const replicaBrokers = scenario.cluster.brokers.map((b) => b.id);

        partitions[partitionId] = {
          id: partitionId,
          topicId: topic.id,
          partitionIndex: p,
          leaderBrokerId: leaderBroker.id,
          replicaBrokerIds: replicaBrokers,
          isrBrokerIds: [...replicaBrokers],
          logStartOffset: 0,
          nextOffset: 0,
          highWatermark: 0,
          records: [],
        };
      }
    }

    // 2. Initialize Consumer Groups & Assignments
    const consumerGroups: ModeledStreamingRuntimeState["consumerGroups"] = {};

    for (const group of scenario.consumerGroups) {
      const topicPartitionIds = Object.keys(partitions).filter((pid) =>
        partitions[pid].topicId === group.topicId
      );

      const assignments = PartitionAssignor.assignPartitions(
        group.assignmentStrategy,
        topicPartitionIds,
        group.consumers
      );

      const positions: Record<string, ConsumerPosition> = {};
      for (const pid of topicPartitionIds) {
        positions[pid] = {
          consumerId: Object.keys(assignments).find((cid) =>
            assignments[cid].includes(pid)
          ) || "",
          partitionId: pid,
          currentFetchOffset: 0,
          committedNextOffset: 0,
          lastProcessedOffset: -1,
          lag: 0,
        };
      }

      consumerGroups[group.id] = {
        config: group,
        assignments,
        positions,
        rebalanceState: "stable",
        generation: 1,
        history: [],
      };
    }

    const metrics: StreamingMetrics = {
      producedRecords: 0,
      acknowledgedRecords: 0,
      consumedRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      reprocessedRecords: 0,
      committedRecords: 0,
      totalConsumerLag: 0,
      rebalanceCount: 0,
      replicationLag: 0,
      dlqRoutedRecords: 0,
      activeConsumersCount: scenario.consumerGroups.reduce(
        (sum, g) => sum + g.consumers.filter((c) => c.isAlive).length,
        0
      ),
      activePartitionsCount: Object.keys(partitions).length,
    };

    const deduplicationStore: Record<string, boolean> = {};
    const dlqRecords: PartitionRecord[] = [];

    const runtimeState: ModeledStreamingRuntimeState = {
      cluster: scenario.cluster,
      topics,
      partitions,
      consumerGroups,
      metrics,
      deduplicationStore,
      dlqRecords,
    };

    const events: StreamingExecutionEvent[] = [];
    const baseRuntimeState = RuntimeStateHelper.createInitialState();

    const cloneState = (): ModeledRuntimeState => {
      const cloned = RuntimeStateHelper.cloneState(baseRuntimeState);
      cloned.streamingState = JSON.parse(JSON.stringify(runtimeState));
      return cloned;
    };

    // 3. Process Scheduled Messages (Publish -> Append -> Replicate -> Acks)
    const sortedMessages = [...scenario.messagesToProduce].sort(
      (a, b) => a.scheduledAtMs - b.scheduledAtMs
    );

    const producerIdempotencySeen: Record<string, Set<number>> = {};

    for (const item of sortedMessages) {
      if (events.length >= scenario.limits.maxEvents) break;

      virtualClockMs = item.scheduledAtMs;
      const producer = scenario.producers.find((p) => p.id === item.producerId);
      if (!producer) continue;

      const topic = topics[producer.targetTopic];
      if (!topic) continue;

      // Duplicate check for idempotent producer
      if (producer.idempotent && item.message.sequenceNumber !== undefined) {
        if (!producerIdempotencySeen[producer.id]) {
          producerIdempotencySeen[producer.id] = new Set();
        }
        if (producerIdempotencySeen[producer.id].has(item.message.sequenceNumber)) {
          // Idempotent duplicate suppressed
          continue;
        }
        producerIdempotencySeen[producer.id].add(item.message.sequenceNumber);
      }

      // Step A: Producer send start event
      const sendStartEvt: StreamProducerSendStartedEvent = {
        id: `evt_stream_${sequence++}`,
        sequence: sequence,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Producer '${producer.name}' published record to topic '${topic.name}' (key: '${item.message.key || "none"}').`,
        type: "stream.producer.send.started",
        producerId: producer.id,
        topicId: topic.id,
        recordKey: item.message.key,
        payloadSummary: JSON.stringify(item.message.value),
        stateSnapshot: cloneState(),
      };
      events.push(sendStartEvt);
      virtualClockMs += 1;

      // Step B: Partition Selection
      const partitionSelection = StreamPartitioner.selectPartition(
        producer.partitioningStrategy,
        topic.id,
        topic.partitionCount,
        item.message.key,
        item.message.partitionOverride
      );

      const targetPartitionId = `${topic.id}-p${partitionSelection.partitionIndex}`;
      const partition = partitions[targetPartitionId];
      if (!partition) continue;

      const partSelectedEvt: StreamPartitionSelectedEvent = {
        id: `evt_stream_${sequence++}`,
        sequence: sequence,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Assigned to partition ${partitionSelection.partitionIndex} using '${partitionSelection.strategyUsed}' strategy${partitionSelection.hashValue ? ` (hash: ${partitionSelection.hashValue})` : ""}.`,
        type: "stream.partition.selected",
        producerId: producer.id,
        topicId: topic.id,
        partitionIndex: partitionSelection.partitionIndex,
        strategy: partitionSelection.strategyUsed,
        keyUsed: item.message.key,
        hashValue: partitionSelection.hashValue,
        stateSnapshot: cloneState(),
      };
      events.push(partSelectedEvt);
      virtualClockMs += 1;

      // Step C: Append Record to Partition Log
      const recordOffset = partition.nextOffset;
      const record: PartitionRecord = {
        id: `rec_${topic.id}_p${partition.partitionIndex}_${recordOffset}`,
        topicId: topic.id,
        partitionId: targetPartitionId,
        offset: recordOffset,
        key: item.message.key,
        value: item.message.value,
        timestampMs: virtualClockMs,
        producerId: producer.id,
        headers: item.message.headers,
      };

      partition.records.push(record);
      partition.nextOffset = recordOffset + 1;
      metrics.producedRecords++;

      const recordAppendedEvt: StreamRecordAppendedEvent = {
        id: `evt_stream_${sequence++}`,
        sequence: sequence,
        atMs: virtualClockMs,
        durationMs: 2,
        explanation: `Record appended to ${targetPartitionId} at monotonic offset ${recordOffset} on leader '${partition.leaderBrokerId}'.`,
        type: "stream.record.appended",
        brokerId: partition.leaderBrokerId,
        topicId: topic.id,
        partitionId: targetPartitionId,
        partitionIndex: partition.partitionIndex,
        offset: recordOffset,
        record,
        highWatermark: partition.highWatermark,
        stateSnapshot: cloneState(),
      };
      events.push(recordAppendedEvt);
      virtualClockMs += 2;

      // Step D: In-Sync Replication
      for (const replicaId of partition.replicaBrokerIds) {
        if (replicaId !== partition.leaderBrokerId) {
          const repStartEvt: StreamReplicationStartedEvent = {
            id: `evt_stream_${sequence++}`,
            sequence: sequence,
            atMs: virtualClockMs,
            durationMs: 1,
            explanation: `Replicating offset ${recordOffset} from leader to follower '${replicaId}'.`,
            type: "stream.replication.started",
            leaderBrokerId: partition.leaderBrokerId,
            replicaBrokerId: replicaId,
            partitionId: targetPartitionId,
            offset: recordOffset,
            stateSnapshot: cloneState(),
          };
          events.push(repStartEvt);

          StreamReplicationEngine.syncReplica(partition, replicaId, recordOffset);

          const repAppliedEvt: StreamReplicationAppliedEvent = {
            id: `evt_stream_${sequence++}`,
            sequence: sequence,
            atMs: virtualClockMs + 2,
            durationMs: 1,
            explanation: `Replica '${replicaId}' in-sync at offset ${recordOffset}. High watermark updated to ${partition.highWatermark}.`,
            type: "stream.replication.applied",
            replicaBrokerId: replicaId,
            partitionId: targetPartitionId,
            offset: recordOffset,
            highWatermark: partition.highWatermark,
            stateSnapshot: cloneState(),
          };
          events.push(repAppliedEvt);
        }
      }
      virtualClockMs += 2;

      // Step E: Producer Acknowledgment
      metrics.acknowledgedRecords++;
      const ackEvt: StreamProducerAcknowledgedEvent = {
        id: `evt_stream_${sequence++}`,
        sequence: sequence,
        atMs: virtualClockMs,
        durationMs: 1,
        explanation: `Producer '${producer.id}' received acks=${producer.acks} acknowledgment for offset ${recordOffset}.`,
        type: "stream.producer.acknowledged",
        producerId: producer.id,
        topicId: topic.id,
        partitionIndex: partition.partitionIndex,
        offset: recordOffset,
        acksSetting: producer.acks,
        latencyMs: 4,
        stateSnapshot: cloneState(),
      };
      events.push(ackEvt);
      virtualClockMs += 1;

      // Step F: Retention Policy Check
      const retentionResult = StreamRetentionEngine.evaluatePartitionRetention(
        partition,
        topic.retentionPolicy,
        virtualClockMs
      );

      if (retentionResult.expiredCount > 0) {
        const retEvalEvt: StreamRetentionEvaluatedEvent = {
          id: `evt_stream_${sequence++}`,
          sequence: sequence,
          atMs: virtualClockMs,
          durationMs: 1,
          explanation: `Retention policy (${topic.retentionPolicy.type}) evaluated on ${targetPartitionId}.`,
          type: "stream.retention.evaluated",
          partitionId: targetPartitionId,
          policyType: topic.retentionPolicy.type,
          totalRecordsBefore: retentionResult.recordsRemaining + retentionResult.expiredCount,
          stateSnapshot: cloneState(),
        };
        events.push(retEvalEvt);

        const retExpEvt: StreamRecordsExpiredEvent = {
          id: `evt_stream_${sequence++}`,
          sequence: sequence,
          atMs: virtualClockMs,
          durationMs: 1,
          explanation: `Pruned ${retentionResult.expiredCount} expired records. Log start offset advanced from ${retentionResult.oldLogStartOffset} to ${retentionResult.newLogStartOffset}.`,
          type: "stream.records.expired",
          partitionId: targetPartitionId,
          expiredCount: retentionResult.expiredCount,
          oldLogStartOffset: retentionResult.oldLogStartOffset,
          newLogStartOffset: retentionResult.newLogStartOffset,
          stateSnapshot: cloneState(),
        };
        events.push(retExpEvt);
      }
    }

    // 4. Broker Failover Simulation (if faulted)
    const brokerFault = scenario.faults?.find((f) => f.type === "broker_failure");
    if (brokerFault) {
      virtualClockMs = Math.max(virtualClockMs, brokerFault.atMs);
      const deadBrokerId = brokerFault.targetId;
      const targetBroker = scenario.cluster.brokers.find((b) => b.id === deadBrokerId);
      if (targetBroker) targetBroker.isAlive = false;

      const affectedPartitions = Object.values(partitions).filter(
        (p) => p.leaderBrokerId === deadBrokerId
      );

      const failEvt: StreamLeaderFailedEvent = {
        id: `evt_stream_${sequence++}`,
        sequence: sequence,
        atMs: virtualClockMs,
        durationMs: 3,
        explanation: `Broker '${deadBrokerId}' crashed! Affected ${affectedPartitions.length} partition leaders.`,
        type: "stream.leader.failed",
        brokerId: deadBrokerId,
        affectedPartitions: affectedPartitions.map((p) => p.id),
        stateSnapshot: cloneState(),
      };
      events.push(failEvt);
      virtualClockMs += 3;

      for (const p of affectedPartitions) {
        const election = StreamReplicationEngine.electLeader(
          p,
          scenario.cluster.brokers,
          scenario.id === "unclean_leader_failover"
        );

        if (election) {
          const electEvt: StreamLeaderElectedEvent = {
            id: `evt_stream_${sequence++}`,
            sequence: sequence,
            atMs: virtualClockMs,
            durationMs: 2,
            explanation: `${election.isCleanElection ? "Clean" : "Unclean"} leader election for ${p.id}. Broker '${election.newLeaderBrokerId}' elected new leader${election.lostRecordsCount > 0 ? ` with ${election.lostRecordsCount} lost records` : ""}.`,
            type: "stream.leader.elected",
            partitionId: p.id,
            previousLeaderBrokerId: deadBrokerId,
            newLeaderBrokerId: election.newLeaderBrokerId,
            isCleanElection: election.isCleanElection,
            highWatermark: election.highWatermark,
            stateSnapshot: cloneState(),
          };
          events.push(electEvt);
        }
      }
      virtualClockMs += 2;
    }

    // 5. Consumer Group Crash & Rebalance Simulation
    const consumerCrash = scenario.faults?.find((f) => f.type === "consumer_crash");
    if (consumerCrash) {
      virtualClockMs = Math.max(virtualClockMs, consumerCrash.atMs);
      for (const group of Object.values(consumerGroups)) {
        const victim = group.config.consumers.find((c) => c.failureInjected);
        if (victim) {
          victim.isAlive = false;
          group.generation++;
          group.rebalanceState = "rebalance_requested";
          metrics.rebalanceCount++;

          const activeConsumers = group.config.consumers
            .filter((c) => c.isAlive)
            .map((c) => c.id);

          const rebStartEvt: StreamRebalanceStartedEvent = {
            id: `evt_stream_${sequence++}`,
            sequence: sequence,
            atMs: virtualClockMs,
            durationMs: 5,
            explanation: `Consumer '${victim.id}' crashed! Group '${group.config.name}' triggered generation ${group.generation} rebalance.`,
            type: "stream.rebalance.started",
            groupId: group.config.id,
            generation: group.generation,
            trigger: "consumer_crashed",
            activeConsumers,
            stateSnapshot: cloneState(),
          };
          events.push(rebStartEvt);
          virtualClockMs += 5;

          // Revoke partitions from dead consumer
          const previousAssignments = { ...group.assignments };
          const revoked = group.assignments[victim.id] || [];

          if (revoked.length > 0) {
            const revEvt: StreamPartitionRevokedEvent = {
              id: `evt_stream_${sequence++}`,
              sequence: sequence,
              atMs: virtualClockMs,
              durationMs: 2,
              explanation: `Partitions [${revoked.join(", ")}] revoked from dead consumer '${victim.id}'.`,
              type: "stream.partition.revoked",
              consumerId: victim.id,
              groupId: group.config.id,
              revokedPartitions: revoked,
              stateSnapshot: cloneState(),
            };
            events.push(revEvt);
          }

          // Reassign partitions among remaining active consumers
          const topicPartitionIds = Object.keys(partitions).filter(
            (pid) => partitions[pid].topicId === group.config.topicId
          );

          const newAssignments = PartitionAssignor.assignPartitions(
            group.config.assignmentStrategy,
            topicPartitionIds,
            group.config.consumers,
            previousAssignments
          );

          group.assignments = newAssignments;
          group.rebalanceState = "stable";

          const rebRec: RebalanceRecord = {
            id: `reb_${group.config.id}_gen${group.generation}`,
            groupId: group.config.id,
            generation: group.generation,
            trigger: "consumer_crashed",
            timestampMs: virtualClockMs,
            previousAssignments,
            newAssignments,
            revokedPartitions: revoked,
          };
          group.history.push(rebRec);

          for (const cid of activeConsumers) {
            const assigned = newAssignments[cid] || [];
            if (assigned.length > 0) {
              const assignEvt: StreamPartitionAssignedEvent = {
                id: `evt_stream_${sequence++}`,
                sequence: sequence,
                atMs: virtualClockMs,
                durationMs: 2,
                explanation: `Assigned partitions [${assigned.join(", ")}] to consumer '${cid}'.`,
                type: "stream.partition.assigned",
                consumerId: cid,
                groupId: group.config.id,
                assignedPartitions: assigned,
                stateSnapshot: cloneState(),
              };
              events.push(assignEvt);
            }
          }

          const rebCompEvt: StreamRebalanceCompletedEvent = {
            id: `evt_stream_${sequence++}`,
            sequence: sequence,
            atMs: virtualClockMs,
            durationMs: 3,
            explanation: `Consumer group '${group.config.id}' stabilized at generation ${group.generation}.`,
            type: "stream.rebalance.completed",
            groupId: group.config.id,
            generation: group.generation,
            rebalanceRecord: rebRec,
            stateSnapshot: cloneState(),
          };
          events.push(rebCompEvt);
          virtualClockMs += 3;
        }
      }
    }

    // 6. Consumer Polling, Processing & Commits
    for (const group of Object.values(consumerGroups)) {
      for (const consumer of group.config.consumers) {
        if (!consumer.isAlive) continue;

        const assignedPartitionIds = group.assignments[consumer.id] || [];
        if (assignedPartitionIds.length === 0) continue;

        const pollEvt: StreamConsumerPollStartedEvent = {
          id: `evt_stream_${sequence++}`,
          sequence: sequence,
          atMs: virtualClockMs,
          durationMs: 1,
          explanation: `Consumer '${consumer.name}' polled assigned partitions [${assignedPartitionIds.join(", ")}].`,
          type: "stream.consumer.poll.started",
          consumerId: consumer.id,
          groupId: group.config.id,
          assignedPartitions: assignedPartitionIds,
          stateSnapshot: cloneState(),
        };
        events.push(pollEvt);
        virtualClockMs += 1;

        for (const pid of assignedPartitionIds) {
          const partition = partitions[pid];
          if (!partition) continue;
          const topic = topics[partition.topicId];

          const position = group.positions[pid];
          if (!position) continue;

          // Fetch records starting at currentFetchOffset
          const availableRecords = partition.records.filter(
            (r) => r.offset >= position.currentFetchOffset
          );

          if (availableRecords.length === 0) continue;

          const recordsToProcess = availableRecords.slice(0, consumer.batchSize);
          metrics.consumedRecords += recordsToProcess.length;

          const fetchEvt: StreamConsumerRecordsFetchedEvent = {
            id: `evt_stream_${sequence++}`,
            sequence: sequence,
            atMs: virtualClockMs,
            durationMs: 2,
            explanation: `Consumer '${consumer.name}' fetched ${recordsToProcess.length} records from ${pid} (offsets ${recordsToProcess[0].offset}..${recordsToProcess[recordsToProcess.length - 1].offset}).`,
            type: "stream.consumer.records.fetched",
            consumerId: consumer.id,
            groupId: group.config.id,
            partitionId: pid,
            recordCount: recordsToProcess.length,
            firstOffset: recordsToProcess[0].offset,
            lastOffset: recordsToProcess[recordsToProcess.length - 1].offset,
            stateSnapshot: cloneState(),
          };
          events.push(fetchEvt);
          virtualClockMs += 2;

          for (const rec of recordsToProcess) {
            // At-Most-Once pre-commit check
            if (group.config.commitMode === "manual_before_processing") {
              position.committedNextOffset = rec.offset + 1;
              const preCommitEvt: StreamOffsetCommittedEvent = {
                id: `evt_stream_${sequence++}`,
                sequence: sequence,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `[At-Most-Once] Pre-committed offset ${rec.offset + 1} before processing begins.`,
                type: "stream.offset.committed",
                groupId: group.config.id,
                partitionId: pid,
                committedNextOffset: rec.offset + 1,
                consumerLag: Math.max(0, partition.nextOffset - (rec.offset + 1)),
                stateSnapshot: cloneState(),
              };
              events.push(preCommitEvt);
              virtualClockMs += 1;
            }

            // Processing start
            const procStartEvt: StreamConsumerProcessingStartedEvent = {
              id: `evt_stream_${sequence++}`,
              sequence: sequence,
              atMs: virtualClockMs,
              durationMs: consumer.processingTimeMs,
              explanation: `Processing record '${rec.id}' (offset ${rec.offset}) on consumer '${consumer.name}'.`,
              type: "stream.consumer.processing.started",
              consumerId: consumer.id,
              groupId: group.config.id,
              partitionId: pid,
              offset: rec.offset,
              recordId: rec.id,
              stateSnapshot: cloneState(),
            };
            events.push(procStartEvt);
            virtualClockMs += consumer.processingTimeMs;

            // Poisoned record check for DLQ preset
            if (scenario.id === "dead_letter_queue_routing" && rec.offset === 1) {
              metrics.failedRecords++;
              metrics.dlqRoutedRecords++;
              dlqRecords.push(rec);

              const procFailEvt: StreamConsumerProcessingFailedEvent = {
                id: `evt_stream_${sequence++}`,
                sequence: sequence,
                atMs: virtualClockMs,
                durationMs: 2,
                explanation: `Deserialization error on offset ${rec.offset}! Record diverted to DLQ topic '${topic.dlqTopicId}'.`,
                type: "stream.consumer.processing.failed",
                consumerId: consumer.id,
                groupId: group.config.id,
                partitionId: pid,
                offset: rec.offset,
                reason: "POISON_RECORD_DESERIALIZATION_FAILURE",
                routedToDlq: true,
                stateSnapshot: cloneState(),
              };
              events.push(procFailEvt);

              const dlqEvt: StreamDlqRecordAppendedEvent = {
                id: `evt_stream_${sequence++}`,
                sequence: sequence,
                atMs: virtualClockMs,
                durationMs: 2,
                explanation: `Record appended to dead-letter queue '${topic.dlqTopicId}'.`,
                type: "stream.dlq.record.appended",
                dlqTopicId: topic.dlqTopicId || "dlq",
                originalTopicId: rec.topicId,
                originalPartitionId: rec.partitionId,
                originalOffset: rec.offset,
                failureReason: "POISON_RECORD",
                stateSnapshot: cloneState(),
              };
              events.push(dlqEvt);
            } else {
              // Deduplication check
              const deduplicationKey = rec.key ? `${rec.topicId}:${rec.key}:${rec.offset}` : rec.id;
              const isDuplicate = Boolean(deduplicationStore[deduplicationKey]);

              if (isDuplicate) {
                metrics.reprocessedRecords++;
              } else {
                deduplicationStore[deduplicationKey] = true;
              }

              metrics.processedRecords++;
              position.lastProcessedOffset = rec.offset;

              const procCompEvt: StreamConsumerProcessingCompletedEvent = {
                id: `evt_stream_${sequence++}`,
                sequence: sequence,
                atMs: virtualClockMs,
                durationMs: consumer.processingTimeMs,
                explanation: `Processed offset ${rec.offset} on '${consumer.name}'${isDuplicate ? " (duplicate suppressed by deduplication table)" : ""}.`,
                type: "stream.consumer.processing.completed",
                consumerId: consumer.id,
                groupId: group.config.id,
                partitionId: pid,
                offset: rec.offset,
                isDuplicate,
                stateSnapshot: cloneState(),
              };
              events.push(procCompEvt);
            }

            position.currentFetchOffset = rec.offset + 1;

            // Commit offset after processing (At-Least-Once or Auto)
            if (group.config.commitMode !== "manual_before_processing") {
              position.committedNextOffset = rec.offset + 1;
              metrics.committedRecords++;

              const commitEvt: StreamOffsetCommittedEvent = {
                id: `evt_stream_${sequence++}`,
                sequence: sequence,
                atMs: virtualClockMs,
                durationMs: 1,
                explanation: `Offset ${rec.offset + 1} committed for group '${group.config.id}' on ${pid}. Next resume position: ${rec.offset + 1}.`,
                type: "stream.offset.committed",
                groupId: group.config.id,
                partitionId: pid,
                committedNextOffset: rec.offset + 1,
                consumerLag: Math.max(0, partition.nextOffset - (rec.offset + 1)),
                stateSnapshot: cloneState(),
              };
              events.push(commitEvt);
              virtualClockMs += 1;
            }
          }
        }
      }

      // Update group lag metrics
      const lagResult = StreamLagCalculator.calculateGroupLag(
        partitions,
        group.positions
      );
      metrics.totalConsumerLag = lagResult.totalCommittedLag;
    }

    // 7. Replay Rewind Simulation (if configured)
    if (scenario.replayOffset) {
      virtualClockMs = Math.max(virtualClockMs, scenario.replayOffset.atMs);
      const group = consumerGroups[scenario.replayOffset.groupId];
      if (group) {
        const position = group.positions[scenario.replayOffset.partitionId];
        if (position) {
          const oldFetch = position.currentFetchOffset;
          position.currentFetchOffset = scenario.replayOffset.targetOffset;

          const partition = partitions[scenario.replayOffset.partitionId];
          if (partition) {
            partition.records.forEach((r) => {
              if (r.offset >= scenario.replayOffset!.targetOffset) {
                r.replayed = true;
              }
            });
          }

          const rewindEvt: StreamOffsetCommitRequestedEvent = {
            id: `evt_stream_${sequence++}`,
            sequence: sequence,
            atMs: virtualClockMs,
            durationMs: 2,
            explanation: `[Replay Rewind] Consumer position for '${scenario.replayOffset.groupId}' on ${scenario.replayOffset.partitionId} rewound from offset ${oldFetch} back to offset ${scenario.replayOffset.targetOffset}.`,
            type: "stream.offset.commit.requested",
            consumerId: position.consumerId,
            groupId: scenario.replayOffset.groupId,
            partitionId: scenario.replayOffset.partitionId,
            offsetToCommit: scenario.replayOffset.targetOffset,
            commitMode: "replay_rewind",
            stateSnapshot: cloneState(),
          };
          events.push(rewindEvt);
        }
      }
    }

    // 8. Build Causal Trace Frames
    const frames: VisualizationFrame[] = events.map((event, idx) => ({
      frameIndex: idx,
      virtualTimeMs: event.atMs,
      activeNodeIds: [
        event.type.includes("producer")
          ? "producer"
          : event.type.includes("consumer")
            ? "consumer"
            : "broker",
      ],
      activeEdgeIds: [],
      activeEvent: event,
      direction: "request",
      stepTitle: event.type.replace(/\./g, " ").toUpperCase(),
      stepExplanation: event.explanation,
      runtimeState: event.stateSnapshot || cloneState(),
    }));

    const config: ExecutionConfiguration = {
      version: 1,
      presetId: scenario.id,
      entryNodeId: "producer",
      request: {
        id: `req_${runId}`,
        method: "POST",
        path: `/topics/${scenario.topics[0]?.name || "orders.created"}/messages`,
        headers: { "content-type": "application/json" },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: { maxHops: 50, maxEvents: 500, maxDurationMs: 30000 },
      timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
    };

    return {
      runId,
      architectureId: "arch_stream_sim",
      architectureRevisionId: "rev_001",
      snapshotHash: `hash_stream_${Date.now()}`,
      createdAt: new Date().toISOString(),
      visitedNodeIds: ["producer", "broker", "consumer"],
      traversedEdgeIds: [],
      configuration: config,
      events,
      totalDurationMs: virtualClockMs,
      totalEvents: events.length,
      totalHops: 3,
      outcome: "success",
      terminalReason: "Streaming scenario executed successfully.",
      frames,
    };
  }
}
