import type {
  LockRecord,
  SagaRuntime,
  TransactionInvariantReport,
  TransactionParticipantRuntime,
  TwoPCTransactionRuntime,
} from "../transaction-schemas";

export interface TransactionInvariantTracker {
  committedDecisionsByTx: Map<string, "COMMIT" | "ABORT">;
  participantOutcomesByTx: Map<string, Map<string, "COMMITTED" | "ABORTED">>;
  preparedDurableTxsByParticipant: Map<string, Set<string>>;
  completedSagaSteps: Set<string>;
}

export class TransactionInvariantMonitor {
  public static createTracker(): TransactionInvariantTracker {
    return {
      committedDecisionsByTx: new Map(),
      participantOutcomesByTx: new Map(),
      preparedDurableTxsByParticipant: new Map(),
      completedSagaSteps: new Set(),
    };
  }

  public static verify(
    tracker: TransactionInvariantTracker,
    twoPCTransactions: Record<string, TwoPCTransactionRuntime>,
    participants: Record<string, TransactionParticipantRuntime>,
    saga: SagaRuntime | null,
    locks: LockRecord[],
    idempotencyDoubleApplyViolation: boolean
  ): TransactionInvariantReport {
    const violations: string[] = [];
    let noCommitWithoutAllYesOk = true;
    let durableDecisionImmutableOk = true;
    let noSplitCommitAbortOk = true;
    let preparedSurvivesCrashOk = true;
    let noUnknownDecisionInventedOk = true;
    let locksReleasedAfterTerminalOk = true;
    const idempotencyPreservedOk = !idempotencyDoubleApplyViolation;
    let compensationMatchesCompletedOk = true;
    let compensationFailureVisibleOk = true;

    if (!idempotencyPreservedOk) {
      violations.push("Idempotency violation: duplicate execution applied side effect twice.");
    }

    for (const tx of Object.values(twoPCTransactions)) {
      if (tx.decision === "COMMIT") {
        const allYes = tx.enlistedParticipants.every((pid) => tx.votes[pid] === "YES");
        if (!allYes) {
          noCommitWithoutAllYesOk = false;
          violations.push(
            `TX ${tx.transactionId} decided COMMIT without unanimous YES votes.`
          );
        }
      }

      if (tx.decision !== null) {
        const prev = tracker.committedDecisionsByTx.get(tx.transactionId);
        if (prev && prev !== tx.decision) {
          durableDecisionImmutableOk = false;
          violations.push(
            `TX ${tx.transactionId} global decision mutated from ${prev} to ${tx.decision}.`
          );
        } else {
          tracker.committedDecisionsByTx.set(tx.transactionId, tx.decision);
        }
      }

      let outcomeMap = tracker.participantOutcomesByTx.get(tx.transactionId);
      if (!outcomeMap) {
        outcomeMap = new Map();
        tracker.participantOutcomesByTx.set(tx.transactionId, outcomeMap);
      }

      for (const p of Object.values(participants)) {
        const st = p.localTxStates[tx.transactionId];
        if (st === "PREPARED") {
          let pSet = tracker.preparedDurableTxsByParticipant.get(p.id);
          if (!pSet) {
            pSet = new Set();
            tracker.preparedDurableTxsByParticipant.set(p.id, pSet);
          }
          pSet.add(tx.transactionId);
        } else {
          const hadPrepared = tracker.preparedDurableTxsByParticipant
            .get(p.id)
            ?.has(tx.transactionId);
          if (hadPrepared && st === "IDLE") {
            preparedSurvivesCrashOk = false;
            violations.push(
              `Participant ${p.id} lost prepared durable state for TX ${tx.transactionId}.`
            );
          }
        }

        if (st === "COMMITTED" || st === "ABORTED") {
          const prevOutcome = outcomeMap.get(p.id);
          if (prevOutcome && prevOutcome !== st) {
            noSplitCommitAbortOk = false;
            violations.push(
              `Participant ${p.id} switched terminal outcome for TX ${tx.transactionId} (${prevOutcome} -> ${st}).`
            );
          } else {
            outcomeMap.set(p.id, st);
          }

          // Check no unknown COMMIT invented
          if (st === "COMMITTED" && tx.decision === null) {
            noUnknownDecisionInventedOk = false;
            violations.push(
              `Participant ${p.id} committed TX ${tx.transactionId} while global decision was unknown.`
            );
          }

          // Check locks released after terminal resolution
          const leakedLock = locks.find(
            (l) =>
              l.participantId === p.id &&
              l.ownerTxId === tx.transactionId &&
              l.releasedAtMs === null
          );
          if (leakedLock) {
            locksReleasedAfterTerminalOk = false;
            violations.push(
              `Lock on '${leakedLock.resourceKey}' leaked on ${p.id} after ${st} for TX ${tx.transactionId}.`
            );
          }
        }
      }
    }

    if (saga) {
      for (const step of saga.steps) {
        if (step.status === "SUCCEEDED") {
          tracker.completedSagaSteps.add(step.stepId);
        }
        if (
          (step.compensationStatus === "compensating" ||
            step.compensationStatus === "compensated") &&
          !tracker.completedSagaSteps.has(step.stepId)
        ) {
          compensationMatchesCompletedOk = false;
          violations.push(
            `Compensation ran for step '${step.stepId}' which never completed forward execution.`
          );
        }
        if (
          step.compensationStatus === "failed" &&
          saga.state === "COMPENSATED"
        ) {
          compensationFailureVisibleOk = false;
          violations.push(
            `Saga ${saga.sagaId} marked COMPENSATED despite failed compensation on step '${step.stepId}'.`
          );
        }
      }
    }

    return {
      allPassed: violations.length === 0,
      noCommitWithoutAllYesOk,
      durableDecisionImmutableOk,
      noSplitCommitAbortOk,
      preparedSurvivesCrashOk,
      noUnknownDecisionInventedOk,
      locksReleasedAfterTerminalOk,
      idempotencyPreservedOk,
      compensationMatchesCompletedOk,
      compensationFailureVisibleOk,
      violations,
    };
  }
}
