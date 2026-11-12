import type {
  PartitionState,
  BrokerConfig,
} from "../streaming-schemas";

export interface LeaderElectionResult {
  partitionId: string;
  previousLeaderBrokerId: string;
  newLeaderBrokerId: string;
  isCleanElection: boolean;
  highWatermark: number;
  lostRecordsCount: number;
}

export class StreamReplicationEngine {
  /**
   * Replicates records from partition leader to replica brokers and updates ISR & High Watermark.
   */
  public static syncReplica(
    partition: PartitionState,
    replicaBrokerId: string,
    replicatedOffset: number
  ): {
    highWatermark: number;
    inSync: boolean;
  } {
    const isrSet = new Set(partition.isrBrokerIds);

    // If replica is catching up to within 1 offset of leader, it joins ISR
    if (partition.nextOffset - replicatedOffset <= 1) {
      isrSet.add(replicaBrokerId);
    } else {
      isrSet.delete(replicaBrokerId);
    }

    partition.isrBrokerIds = Array.from(isrSet);

    // High watermark is minimum offset among all ISR members, or leader nextOffset if alone
    partition.highWatermark = Math.min(
      partition.nextOffset,
      replicatedOffset
    );

    return {
      highWatermark: partition.highWatermark,
      inSync: isrSet.has(replicaBrokerId),
    };
  }

  /**
   * Conducts deterministic leader election when leader broker fails.
   */
  public static electLeader(
    partition: PartitionState,
    brokers: BrokerConfig[],
    allowUnclean = false
  ): LeaderElectionResult | null {
    const liveBrokerIds = new Set(
      brokers.filter((b) => b.isAlive).map((b) => b.id)
    );

    const prevLeader = partition.leaderBrokerId;

    // 1. Try clean election from live In-Sync Replicas (ISR)
    const cleanCandidates = partition.isrBrokerIds.filter(
      (id) => id !== prevLeader && liveBrokerIds.has(id)
    );

    if (cleanCandidates.length > 0) {
      const newLeader = cleanCandidates[0];
      partition.leaderBrokerId = newLeader;
      return {
        partitionId: partition.id,
        previousLeaderBrokerId: prevLeader,
        newLeaderBrokerId: newLeader,
        isCleanElection: true,
        highWatermark: partition.highWatermark,
        lostRecordsCount: 0,
      };
    }

    // 2. If no clean candidate, try unclean election if allowed
    if (allowUnclean) {
      const anyCandidate = partition.replicaBrokerIds.filter(
        (id) => id !== prevLeader && liveBrokerIds.has(id)
      );

      if (anyCandidate.length > 0) {
        const newLeader = anyCandidate[0];
        const lostRecords = Math.max(0, partition.nextOffset - partition.highWatermark);
        partition.leaderBrokerId = newLeader;
        partition.isrBrokerIds = [newLeader];
        partition.nextOffset = partition.highWatermark;
        partition.records = partition.records.slice(0, partition.highWatermark);

        return {
          partitionId: partition.id,
          previousLeaderBrokerId: prevLeader,
          newLeaderBrokerId: newLeader,
          isCleanElection: false,
          highWatermark: partition.highWatermark,
          lostRecordsCount: lostRecords,
        };
      }
    }

    // Leader election failed (no eligible broker alive)
    return null;
  }
}

