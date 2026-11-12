import { DeterministicRandom } from "../../resilience/deterministic-random";
import type {
  ActiveActiveConflictRecord,
  DataLossClassification,
  DurableWriteRecord,
  RecoveryArchitecture,
  RecoveryObjectiveConfig,
  RecoveryObjectiveEvaluation,
  RecoveryPolicyConfig,
  RegionRuntimeStatus,
  DrReplicationConfig,
  ReplicationPosition,
} from "../disaster-recovery-schemas";

export function stepWritesAndReplication(params: {
  nowMs: number;
  stepDurationMs: number;
  architecture: RecoveryArchitecture;
  policy: RecoveryPolicyConfig;
  regions: Record<string, RegionRuntimeStatus>;
  replicationConfigs: DrReplicationConfig[];
  replicationStreams: Record<string, ReplicationPosition>;
  writeHistory: DurableWriteRecord[];
  activeConflicts: ActiveActiveConflictRecord[];
  extraReplicationLagMs: number;
  hasConflictFault: boolean;
  fencingHolderRegionId: string;
  rng: DeterministicRandom;
}): {
  newWrites: DurableWriteRecord[];
  staleWritesRejected: number;
  newConflict?: ActiveActiveConflictRecord;
} {
  const {
    nowMs,
    architecture,
    policy,
    regions,
    replicationConfigs,
    replicationStreams,
    writeHistory,
    activeConflicts,
    extraReplicationLagMs,
    hasConflictFault,
    fencingHolderRegionId,
    rng,
  } = params;

  const newWrites: DurableWriteRecord[] = [];
  let staleWritesRejected = 0;

  // Generate 1 deterministic synthetic durable write per active serving writer tick
  for (const rc of replicationConfigs) {
    const stream = replicationStreams[rc.id];
    const src = regions[rc.sourceRegionId];
    const tgt = regions[rc.targetRegionId];
    if (!stream || !src || !tgt) continue;

    const effectiveLagMs = rc.baseLagMs + extraReplicationLagMs;
    const srcWritable =
      src.state === "HEALTHY" ||
      src.state === "DEGRADED" ||
      src.state === "PARTITIONED";
    const tgtWritable =
      architecture === "active_active" &&
      (tgt.state === "HEALTHY" || tgt.state === "DEGRADED");

    const canPrimaryWrite =
      srcWritable &&
      (src.id === fencingHolderRegionId || architecture === "active_active");

    if (srcWritable && src.id !== fencingHolderRegionId && architecture !== "active_active") {
      // Stale primary attempted write rejected by fencing epoch
      staleWritesRejected += 1;
    }

    const networkPartitionedBetween =
      src.state === "PARTITIONED" || tgt.state === "PARTITIONED";
    const tgtHealthyOrRecovering =
      tgt.state === "HEALTHY" ||
      tgt.state === "DEGRADED" ||
      tgt.state === "RECOVERING" ||
      tgt.state === "RESTORED";

    const syncSatisfied =
      rc.mode !== "synchronous" ||
      (!networkPartitionedBetween &&
        tgtHealthyOrRecovering &&
        effectiveLagMs <= 100);

    stream.blockedBySyncQuorum =
      rc.mode === "synchronous" && canPrimaryWrite && !syncSatisfied;

    if (canPrimaryWrite) {
      if (rc.mode === "synchronous" && !syncSatisfied) {
        // Synchronous write cannot acknowledge without standby quorum; remains unacknowledged
        const lsn = writeHistory.length + newWrites.length + 1;
        const rec: DurableWriteRecord = {
          lsn,
          id: `wr_${lsn}`,
          atMs: nowMs,
          regionId: src.id,
          acknowledgedToClient: false,
          durableOnPrimary: true,
          receivedOnSecondary: false,
          appliedOnSecondary: false,
          durableOnSecondary: false,
          checksum: `sha_${Math.floor(rng.next() * 1e6).toString(16)}`,
          bytes: 512,
        };
        newWrites.push(rec);
        stream.primaryCommittedLsn = Math.max(stream.primaryCommittedLsn, lsn);
      } else {
        const lsn = writeHistory.length + newWrites.length + 1;
        const immediateSync = rc.mode === "synchronous";
        const rec: DurableWriteRecord = {
          lsn,
          id: `wr_${lsn}`,
          atMs: nowMs,
          regionId: src.id,
          acknowledgedToClient: true,
          durableOnPrimary: true,
          receivedOnSecondary: immediateSync,
          appliedOnSecondary: immediateSync,
          durableOnSecondary: immediateSync,
          checksum: `sha_${Math.floor(rng.next() * 1e6).toString(16)}`,
          bytes: 512,
        };
        newWrites.push(rec);
        stream.primaryCommittedLsn = Math.max(stream.primaryCommittedLsn, lsn);
      }
    }

    // Active-Active secondary region write (when partitioned or multi-writer fault active)
    if (tgtWritable && (hasConflictFault || networkPartitionedBetween)) {
      const lsn = writeHistory.length + newWrites.length + 1;
      newWrites.push({
        lsn,
        id: `wr_${lsn}_aa`,
        atMs: nowMs,
        regionId: tgt.id,
        acknowledgedToClient: true,
        durableOnPrimary: true,
        receivedOnSecondary: true,
        appliedOnSecondary: true,
        durableOnSecondary: true,
        checksum: `sha_${Math.floor(rng.next() * 1e6).toString(16)}`,
        bytes: 512,
      });
    }

    // Advance asynchronous / semi-sync / log replication for existing primary writes
    const allWrites = [...writeHistory, ...newWrites];
    if (!networkPartitionedBetween && tgtHealthyOrRecovering && src.state !== "UNAVAILABLE") {
      for (const w of allWrites) {
        if (w.regionId !== src.id) continue;
        const ageMs = nowMs - w.atMs;
        if (!w.receivedOnSecondary && ageMs >= effectiveLagMs) {
          w.receivedOnSecondary = true;
        }
        if (
          w.receivedOnSecondary &&
          !w.appliedOnSecondary &&
          ageMs >= effectiveLagMs + rc.applyDelayMs
        ) {
          w.appliedOnSecondary = true;
        }
        if (
          w.receivedOnSecondary &&
          !w.durableOnSecondary &&
          ageMs >= effectiveLagMs + rc.durabilityFlushDelayMs
        ) {
          w.durableOnSecondary = true;
        }
      }
    }

    // Update monotonic replication positions (durable NEVER exceeds received)
    let maxRec = stream.secondaryReceivedLsn;
    let maxApp = stream.secondaryAppliedLsn;
    let maxDur = stream.secondaryDurableLsn;
    for (const w of allWrites) {
      if (w.regionId !== src.id) continue;
      if (w.receivedOnSecondary && w.lsn > maxRec) maxRec = w.lsn;
      if (w.appliedOnSecondary && w.lsn > maxApp) maxApp = w.lsn;
      if (w.durableOnSecondary && w.lsn > maxDur) maxDur = w.lsn;
    }
    maxDur = Math.min(maxDur, maxRec);
    maxApp = Math.min(maxApp, maxRec);

    stream.secondaryReceivedLsn = maxRec;
    stream.secondaryAppliedLsn = maxApp;
    stream.secondaryDurableLsn = maxDur;
    stream.recordLag = Math.max(0, stream.primaryCommittedLsn - stream.secondaryDurableLsn);
    stream.byteLag = stream.recordLag * 512;

    const latestDurableWrite = allWrites
      .filter((w) => w.durableOnSecondary && w.regionId === src.id)
      .slice(-1)[0];
    const latestPrimaryWrite = allWrites
      .filter((w) => w.regionId === src.id)
      .slice(-1)[0];

    stream.timeLagMs =
      latestPrimaryWrite && latestDurableWrite
        ? Math.max(0, latestPrimaryWrite.atMs - latestDurableWrite.atMs)
        : effectiveLagMs;
    stream.applyLagMs = Math.max(
      0,
      (stream.secondaryReceivedLsn - stream.secondaryAppliedLsn) * 10
    );
    stream.durableLagMs = Math.max(
      0,
      (stream.secondaryReceivedLsn - stream.secondaryDurableLsn) * 10
    );
  }

  let newConflict: ActiveActiveConflictRecord | undefined;
  if (
    architecture === "active_active" &&
    hasConflictFault &&
    activeConflicts.length < 4
  ) {
    const resMap: Record<
      RecoveryPolicyConfig["activeActiveConflictPolicy"],
      ActiveActiveConflictRecord["resolution"]
    > = {
      last_writer_wins: "superseded_lww",
      reject_conflict: "rejected",
      manual_resolution: "manual_hold",
    };
    const rList = Object.keys(regions);
    const rA = rList[0] ?? "us-east-1";
    const rB = rList[1] ?? "us-west-2";
    newConflict = {
      id: `aa_conf_${nowMs}`,
      atMs: nowMs,
      key: `order:acct_${100 + activeConflicts.length}`,
      regionA: rA,
      regionB: rB,
      policy: policy.activeActiveConflictPolicy,
      resolution: resMap[policy.activeActiveConflictPolicy],
      discardedRegion:
        policy.activeActiveConflictPolicy === "last_writer_wins" ? rA : "none",
      explanation:
        policy.activeActiveConflictPolicy === "last_writer_wins"
          ? `Concurrent write on '${rA}' and '${rB}'; LWW kept '${rB}' timestamp and discarded earlier write on '${rA}'.`
          : `Concurrent multi-writer conflict detected between '${rA}' and '${rB}' under policy '${policy.activeActiveConflictPolicy}'.`,
    };
  }

  return { newWrites, staleWritesRejected, newConflict };
}

export function evaluateRecoveryObjectives(params: {
  objectives: RecoveryObjectiveConfig[];
  writeHistory: DurableWriteRecord[];
  restoredLogsMaxLsn: number;
  failureStartedAtMs: number | null;
  failureDetectedAtMs: number | null;
  verifiedAtMs: number | null;
  isFailedOutcome: boolean;
  architecture: RecoveryArchitecture;
  hasInconsistentConflict: boolean;
}): RecoveryObjectiveEvaluation[] {
  const {
    objectives,
    writeHistory,
    restoredLogsMaxLsn,
    failureStartedAtMs,
    failureDetectedAtMs,
    verifiedAtMs,
    isFailedOutcome,
    hasInconsistentConflict,
  } = params;

  const primaryAckWrites = writeHistory.filter((w) => w.acknowledgedToClient);
  const lastAck = primaryAckWrites[primaryAckWrites.length - 1] ?? null;

  const recoverableWrites = writeHistory.filter(
    (w) => w.durableOnSecondary || w.lsn <= restoredLogsMaxLsn
  );
  const lastRec = recoverableWrites[recoverableWrites.length - 1] ?? null;

  const missingAck = writeHistory.filter(
    (w) =>
      w.acknowledgedToClient &&
      !w.durableOnSecondary &&
      w.lsn > restoredLogsMaxLsn
  );
  const missingUnack = writeHistory.filter(
    (w) =>
      !w.acknowledgedToClient &&
      !w.durableOnSecondary &&
      w.lsn > restoredLogsMaxLsn
  );

  let classification: DataLossClassification = "NO_ACKNOWLEDGED_LOSS";
  if (isFailedOutcome && !lastRec) {
    classification = "UNKNOWN";
  } else if (hasInconsistentConflict) {
    classification = "INCONSISTENT_RECOVERED_STATE";
  } else if (missingAck.length > 0) {
    classification = "LOSS_OF_ACKNOWLEDGED_WRITES";
  } else if (missingUnack.length > 0) {
    classification = "LOSS_OF_UNACKNOWLEDGED_WRITES";
  }

  const achievedRpoMs =
    lastAck && lastRec
      ? Math.max(0, lastAck.atMs - lastRec.atMs)
      : lastAck && !lastRec
        ? Math.max(0, lastAck.atMs)
        : 0;

  return objectives.map((obj) => {
    const startRef =
      obj.rtoStartEvent === "failure_detected"
        ? failureDetectedAtMs ?? failureStartedAtMs
        : failureStartedAtMs;

    const achievedRtoMs =
      verifiedAtMs !== null && startRef !== null
        ? Math.max(0, verifiedAtMs - startRef)
        : null;

    const rpoMet =
      classification !== "UNKNOWN" && achievedRpoMs <= obj.targetRpoMs;
    const rtoMet =
      startRef === null
        ? !isFailedOutcome
        : achievedRtoMs !== null && achievedRtoMs <= obj.targetRtoMs;

    return {
      objectiveId: obj.id,
      serviceId: obj.serviceId,
      targetRpoMs: obj.targetRpoMs,
      targetRtoMs: obj.targetRtoMs,
      achievedRpoMs: classification === "UNKNOWN" ? null : achievedRpoMs,
      achievedRtoMs,
      rpoMet,
      rtoMet,
      missingAcknowledgedWrites: missingAck.length,
      missingUnacknowledgedWrites: missingUnack.length,
      dataLossClassification: classification,
      lastAcknowledgedWriteAtMs: lastAck?.atMs ?? null,
      lastRecoverableWriteAtMs: lastRec?.atMs ?? null,
      rtoMeasurementNote:
        startRef === null
          ? "No disaster triggered; RTO baseline standby healthy."
          : achievedRtoMs !== null
            ? `Measured from ${obj.rtoStartEvent} (${startRef}ms) to verified service recovery (${verifiedAtMs}ms).`
            : "Recovery unverified or failed — RTO not met.",
      rpoMeasurementNote:
        "Measured between latest durable acknowledged primary write and latest recoverable secondary/restored LSN.",
    };
  });
}
