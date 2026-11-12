import { describe, expect, it } from "vitest";
import {
  DISTRIBUTED_TRANSACTION_PRESET_METADATA,
  DistributedTransactionExecutionEngine,
  DistributedTransactionScenarioSchema,
  createDistributedTransactionPresetScenario,
} from "../index";

function getFinalTxState(
  presetId: (typeof DISTRIBUTED_TRANSACTION_PRESET_METADATA)[number]["id"]
) {
  const scenario = createDistributedTransactionPresetScenario(presetId);
  const trace = DistributedTransactionExecutionEngine.runScenario(scenario);
  const lastFrame = trace.frames[trace.frames.length - 1];
  const txState = lastFrame?.runtimeState?.distributedTransactionState;
  return { scenario, trace, txState };
}

describe("DistributedTransactionExecutionEngine — Phase 05.4.14 (2PC, Sagas & Failure Recovery)", () => {
  it("runs all 26 presets deterministically with zero protocol invariant violations", () => {
    expect(DISTRIBUTED_TRANSACTION_PRESET_METADATA.length).toBe(26);

    for (const meta of DISTRIBUTED_TRANSACTION_PRESET_METADATA) {
      const sA = createDistributedTransactionPresetScenario(meta.id);
      const sB = createDistributedTransactionPresetScenario(meta.id);

      const tA = DistributedTransactionExecutionEngine.runScenario(sA);
      const tB = DistributedTransactionExecutionEngine.runScenario(sB);

      expect(tA.frames.length, `preset ${meta.id} frame count`).toBeGreaterThan(0);
      expect(tA.frames.length).toBe(tB.frames.length);
      expect(tA.events.length).toBe(tB.events.length);

      const stA = tA.frames[tA.frames.length - 1]?.runtimeState?.distributedTransactionState;
      const stB = tB.frames[tB.frames.length - 1]?.runtimeState?.distributedTransactionState;

      expect(stA, `preset ${meta.id} missing distributedTransactionState`).toBeDefined();
      expect(stA?.metrics).toEqual(stB?.metrics);
      expect(stA?.participants).toEqual(stB?.participants);
      expect(
        stA?.invariants.allPassed,
        `preset ${meta.id} violations: ${stA?.invariants.violations.join("; ")}`
      ).toBe(true);
    }
  });

  it("enforces discriminated union and DAG cycle validation in DistributedTransactionScenarioSchema", () => {
    const mismatch = createDistributedTransactionPresetScenario("successful_2pc");
    (mismatch as unknown as { protocol: string }).protocol = "saga_orchestration";
    expect(() => DistributedTransactionScenarioSchema.parse(mismatch)).toThrow();

    const cyclic = createDistributedTransactionPresetScenario("successful_saga_orchestration");
    if (cyclic.workflow.protocol === "saga_orchestration") {
      cyclic.workflow.steps[0]!.dependsOn = ["step-shipping"];
    }
    expect(() => DistributedTransactionScenarioSchema.parse(cyclic)).toThrow(/Cyclic/);
  });

  it("executes 2PC Phase 1 Prepare and Phase 2 Commit/Abort rules accurately", () => {
    const ok = getFinalTxState("successful_2pc");
    expect(ok.txState?.twoPCTransactions["TX-104"]?.decision).toBe("COMMIT");
    expect(ok.txState?.twoPCTransactions["TX-104"]?.state).toBe("COMPLETED");
    expect(ok.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(8);
    expect(ok.txState?.participants["payment"]?.store.balances["acct-42"]).toBe(380);
    expect(ok.txState?.locks.every((l) => l.releasedAtMs !== null)).toBe(true);

    const voteNo = getFinalTxState("participant_votes_no");
    expect(voteNo.txState?.twoPCTransactions["TX-105"]?.decision).toBe("ABORT");
    expect(voteNo.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(10);
    expect(voteNo.txState?.participants["payment"]?.store.balances["acct-42"]).toBe(500);

    const timeout = getFinalTxState("prepare_timeout");
    expect(timeout.txState?.twoPCTransactions["TX-106"]?.decision).toBe("ABORT");
  });

  it("models coordinator & participant crashes, durable logs, blocking, in-doubt states, and lock contention", () => {
    const crashBefore = getFinalTxState("coordinator_crash_before_decision");
    expect(crashBefore.txState?.twoPCTransactions["TX-107"]?.decision).toBe("ABORT");

    const crashAfter = getFinalTxState("coordinator_crash_after_commit");
    expect(crashAfter.txState?.twoPCTransactions["TX-108"]?.decision).toBe("COMMIT");
    expect(crashAfter.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(8);

    const partRestart = getFinalTxState("participant_crash_after_prepare");
    expect(partRestart.txState?.participants["payment"]?.localTxStates["TX-110"]).toBe("COMMITTED");
    expect(partRestart.txState?.participants["payment"]?.inDoubtTxIds).toEqual([]);

    const blocking = getFinalTxState("twopc_blocking");
    expect(blocking.txState?.metrics.inDoubtCount).toBeGreaterThan(0);
    expect(blocking.txState?.locks.some((l) => l.releasedAtMs === null)).toBe(true);

    const contention = getFinalTxState("lock_contention");
    expect(contention.txState?.metrics.blockedCount).toBeGreaterThan(0);
    expect(contention.trace.events.some((e) => e.type === "transaction.lock.contended")).toBe(true);

    const dup = getFinalTxState("duplicate_commit_delivery");
    expect(dup.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(8);
  });

  it("executes Saga orchestration, reverse topological compensation, and manual intervention escalation", () => {
    const ok = getFinalTxState("successful_saga_orchestration");
    expect(ok.txState?.saga?.state).toBe("COMPLETED");
    expect(ok.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(7);
    expect(ok.txState?.participants["payment"]?.store.balances["acct-42"]).toBe(350);

    const comp = getFinalTxState("reverse_compensation");
    expect(comp.txState?.saga?.state).toBe("COMPENSATED");
    expect(comp.txState?.saga?.compensationOrder).toEqual([
      "step-payment",
      "step-inventory",
      "step-order",
    ]);
    // Forward debits compensated cleanly back to initial stock/balance
    expect(comp.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(10);
    expect(comp.txState?.participants["payment"]?.store.balances["acct-42"]).toBe(500);

    const manual = getFinalTxState("manual_intervention");
    expect(manual.txState?.saga?.state).toBe("MANUAL_INTERVENTION_REQUIRED");
    expect(manual.txState?.metrics.manualInterventionCount).toBeGreaterThanOrEqual(1);
    expect(manual.txState?.metrics.compensationFailures).toBeGreaterThanOrEqual(1);
  });

  it("models Saga choreography, transactional outbox recovery, inbox deduplication & idempotency", () => {
    const choreo = getFinalTxState("successful_saga_choreography");
    expect(choreo.txState?.saga?.state).toBe("COMPLETED");
    expect(choreo.txState?.metrics.outboxPublishedCount).toBeGreaterThanOrEqual(4);

    const obFail = getFinalTxState("outbox_dispatcher_failure");
    expect(obFail.txState?.metrics.outboxFailedCount).toBeGreaterThanOrEqual(1);
    expect(obFail.txState?.saga?.state).toBe("COMPLETED");

    const inbox = getFinalTxState("inbox_deduplication");
    expect(inbox.txState?.metrics.deduplicatedCount).toBeGreaterThanOrEqual(1);
    expect(inbox.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(8);

    const dupSaga = getFinalTxState("duplicate_saga_event");
    expect(dupSaga.txState?.metrics.deduplicatedCount).toBeGreaterThanOrEqual(1);
    expect(dupSaga.txState?.participants["inventory"]?.store.inventory["SKU-101"]).toBe(7);
  });
});
