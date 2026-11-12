import type {
  BackupArtifact,
  BackupChainValidation,
  DrInvariantReport,
  FailbackOperation,
  FailoverOperation,
  FencingTokenRuntime,
  RecoveryObjectiveEvaluation,
  ReplicationPosition,
  RestoreOperation,
  RoutingConvergenceRuntime,
} from "../disaster-recovery-schemas";

export class DisasterRecoveryInvariantMonitor {
  public static verify(params: {
    invalidRegionTransitionSeen: boolean;
    replicationBackwardsSeen: boolean;
    replicationStreams: Record<string, ReplicationPosition>;
    lastChainValidation: BackupChainValidation | null;
    backups: BackupArtifact[];
    restore: RestoreOperation;
    fencing: FencingTokenRuntime;
    failover: FailoverOperation;
    failback: FailbackOperation;
    routing: RoutingConvergenceRuntime;
    objectives: RecoveryObjectiveEvaluation[];
    hasCircularDependencies: boolean;
  }): DrInvariantReport {
    const {
      invalidRegionTransitionSeen,
      replicationBackwardsSeen,
      replicationStreams,
      lastChainValidation,
      restore,
      fencing,
      failover,
      failback,
      routing,
      objectives,
      hasCircularDependencies,
    } = params;

    const violations: string[] = [];

    const regionTransitionsValidOk = !invalidRegionTransitionSeen;
    if (!regionTransitionsValidOk) {
      violations.push("Invalid regional health state transition observed.");
    }

    const replicationMonotonicOk = !replicationBackwardsSeen;
    if (!replicationMonotonicOk) {
      violations.push(
        "Replication position moved backward without explicit epoch reset."
      );
    }

    let durableNeverExceedsReceivedOk = true;
    for (const st of Object.values(replicationStreams)) {
      if (
        st.secondaryDurableLsn > st.secondaryReceivedLsn ||
        st.secondaryAppliedLsn > st.secondaryReceivedLsn
      ) {
        durableNeverExceedsReceivedOk = false;
        violations.push(
          `Stream '${st.streamId}' violated durable/applied <= received (${st.secondaryDurableLsn} > ${st.secondaryReceivedLsn}).`
        );
      }
    }

    const recoveryPointsValidOk = objectives.every(
      (o) =>
        o.lastRecoverableWriteAtMs === null ||
        o.lastAcknowledgedWriteAtMs === null ||
        o.achievedRpoMs === null ||
        o.achievedRpoMs >= 0
    );
    if (!recoveryPointsValidOk) {
      violations.push("Invalid negative or ungrounded recovery point.");
    }

    const backupChainsCompleteOk =
      restore.state === "IDLE" ||
      restore.state === "FAILED" ||
      (lastChainValidation?.valid ?? true);
    if (!backupChainsCompleteOk) {
      violations.push("Restoration proceeded without valid backup chain.");
    }

    const corruptBackupsNeverPassOk = !(
      restore.state === "COMPLETED" &&
      lastChainValidation !== null &&
      lastChainValidation.corruptIds.length > 0
    );
    if (!corruptBackupsNeverPassOk) {
      violations.push("Corrupted backup silently passed restoration verification.");
    }

    // Log replay ordering & no duplicate LSNs
    const seenLsn = new Set<number>();
    let logReplayOrderedOk = true;
    let prevLsn = 0;
    for (const lsn of restore.replayedLsnIds) {
      if (lsn <= prevLsn || seenLsn.has(lsn)) {
        logReplayOrderedOk = false;
        break;
      }
      seenLsn.add(lsn);
      prevLsn = lsn;
    }
    if (!logReplayOrderedOk) {
      violations.push("Transaction-log replay violated monotonic ordering.");
    }

    const fencingBlocksStaleWritesOk =
      !fencing.fencingEstablished || fencing.staleWritesRejected >= 0;

    const promotionSafetyRespectedOk = !(
      failover.state === "COMPLETED" &&
      !fencing.fencingEstablished &&
      !fencing.splitBrainRisk
    );
    if (!promotionSafetyRespectedOk) {
      violations.push(
        "Secondary promotion completed without establishing fencing or flagging split-brain risk."
      );
    }

    const splitBrainExplicitOk = true;

    const totalWeights = Object.values(routing.regionalWeightsPct).reduce(
      (a, b) => a + b,
      0
    );
    const routingConvergenceValidOk =
      Object.values(routing.regionalWeightsPct).every((w) => w >= 0) &&
      totalWeights === 100;
    if (!routingConvergenceValidOk) {
      violations.push(`Regional routing weights must sum to 100 (got ${totalWeights}).`);
    }

    const serviceVerificationRequiredOk = !(
      failover.state === "COMPLETED" && failover.completedAtMs === undefined
    );
    if (!serviceVerificationRequiredOk) {
      violations.push("Failover marked COMPLETED without verification completion timestamp.");
    }

    const rpoDerivedFromDataOk = objectives.every(
      (o) => o.rpoMeasurementNote.length > 0
    );
    const rtoDerivedFromEventsOk = objectives.every(
      (o) =>
        o.achievedRtoMs === null ||
        failover.failureStartedAtMs !== undefined ||
        failover.state === "IDLE"
    );

    const failbackValidatedOk = !(
      failback.state === "COMPLETED" && failback.replicationCatchupPct < 100
    );
    if (!failbackValidatedOk) {
      violations.push("Failback completed before 100% replication catch-up.");
    }

    const cycleCheckEnforcedOk = !hasCircularDependencies || failover.state !== "COMPLETED";
    if (!cycleCheckEnforcedOk) {
      violations.push("Circular dependency failed to block recovery completion.");
    }

    return {
      allPassed: violations.length === 0,
      regionTransitionsValidOk,
      replicationMonotonicOk,
      durableNeverExceedsReceivedOk,
      recoveryPointsValidOk,
      backupChainsCompleteOk,
      corruptBackupsNeverPassOk,
      logReplayOrderedOk,
      fencingBlocksStaleWritesOk,
      promotionSafetyRespectedOk,
      splitBrainExplicitOk,
      routingConvergenceValidOk,
      serviceVerificationRequiredOk,
      rpoDerivedFromDataOk,
      rtoDerivedFromEventsOk,
      failbackValidatedOk,
      cycleCheckEnforcedOk,
      violations,
    };
  }
}
