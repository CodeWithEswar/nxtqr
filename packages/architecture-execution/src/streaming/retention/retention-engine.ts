import type {
  PartitionState,
  RetentionPolicy,
} from "../streaming-schemas";

export interface RetentionEvaluationResult {
  expiredCount: number;
  oldLogStartOffset: number;
  newLogStartOffset: number;
  recordsRemaining: number;
}

export class StreamRetentionEngine {
  /**
   * Evaluates retention policy and trims expired records from partition log.
   * Crucially, advancing log start offset does NOT renumber remaining offsets.
   */
  public static evaluatePartitionRetention(
    partition: PartitionState,
    policy: RetentionPolicy,
    virtualClockMs: number
  ): RetentionEvaluationResult {
    const oldLogStartOffset = partition.logStartOffset;
    let expiredCount = 0;

    if (policy.type === "count" && policy.maxRecords !== undefined) {
      if (partition.records.length > policy.maxRecords) {
        expiredCount = partition.records.length - policy.maxRecords;
        partition.records = partition.records.slice(expiredCount);
      }
    } else if (policy.type === "time" && policy.maxRetentionMs !== undefined) {
      const cutoffTime = virtualClockMs - policy.maxRetentionMs;
      const initialLength = partition.records.length;
      partition.records = partition.records.filter(
        (rec) => rec.timestampMs >= cutoffTime
      );
      expiredCount = initialLength - partition.records.length;
    }

    if (expiredCount > 0 && partition.records.length > 0) {
      partition.logStartOffset = partition.records[0].offset;
    } else if (partition.records.length === 0) {
      partition.logStartOffset = partition.nextOffset;
    }

    return {
      expiredCount,
      oldLogStartOffset,
      newLogStartOffset: partition.logStartOffset,
      recordsRemaining: partition.records.length,
    };
  }
}

