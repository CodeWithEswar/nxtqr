import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import {
  DistributedTransactionScenarioSchema,
  type DistributedTransactionMetrics,
  type DistributedTransactionScenario,
  type DurableLogRecord,
  type IdempotencyRecord,
  type InboxRecord,
  type LockRecord,
  type ModeledDistributedTransactionRuntimeState,
  type OutboxRecord,
  type SagaChoreographyWorkflow,
  type SagaOrchestrationWorkflow,
  type SagaRuntime,
  type TransactionMessageEnvelope,
  type TransactionParticipantRuntime,
  type TwoPCTransactionRuntime,
} from "./transaction-schemas";
import { TransactionInvariantMonitor } from "./invariants/transaction-invariants";
import {
  cloneStore,
  validateAndApplyLocalOperation,
} from "./local-data-engine";

function createSeededPrng(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type TxQueueItem =
  | { kind: "twopc_start"; atMs: number; seq: number; txId: string }
  | { kind: "twopc_prepare_timeout"; atMs: number; seq: number; txId: string }
  | { kind: "twopc_rpc_deliver"; atMs: number; seq: number; envelope: TransactionMessageEnvelope; rpcKind: "PREPARE" | "VOTE_YES" | "VOTE_NO" | "GLOBAL_COMMIT" | "GLOBAL_ABORT" | "DECISION_ACK" | "DECISION_QUERY" | "DECISION_RESPONSE"; reason?: string; stepOpId?: string; resourceKey?: string }
  | { kind: "twopc_lock_retry"; atMs: number; seq: number; txId: string; participantId: string; resourceKey: string; opId: string }
  | { kind: "saga_dispatch_ready"; atMs: number; seq: number; stepId?: string }
  | { kind: "saga_step_execute"; atMs: number; seq: number; stepId: string; attempt: number; messageId: string; isDuplicate?: boolean }
  | { kind: "saga_comp_execute"; atMs: number; seq: number; stepId: string; attempt: number }
  | { kind: "outbox_dispatch"; atMs: number; seq: number; recordId: string; attempt: number; eventType: string; correlationId: string; causationId: string }
  | { kind: "choreo_deliver"; atMs: number; seq: number; eventType: string; messageId: string; producer: string; correlationId: string; causationId: string; isDuplicate?: boolean }
  | { kind: "fault_apply"; atMs: number; seq: number; faultId: string }
  | { kind: "fault_revert"; atMs: number; seq: number; faultId: string };

export class DistributedTransactionExecutionEngine {
  public static runScenario(
    rawScenario: DistributedTransactionScenario
  ): ExecutionTrace {
    const parsed = DistributedTransactionScenarioSchema.parse(rawScenario);
    const rng = createSeededPrng(parsed.seed);
    const baseRuntime = RuntimeStateHelper.createInitialState();
    const runId = `tx_run_${parsed.id}_${parsed.seed}`;
    const invariantTracker = TransactionInvariantMonitor.createTracker();

    // Runtime containers
    let virtualTimeMs = 0;
    let seqCounter = 0;
    let durableSeq = 0;
    let msgCounter = 0;
    let eventCounter = 0;
    let coordinatorOnline = true;
    let activePartitions: string[][] = [];
    let dropNextRpcForTarget: string | null = null;
    let duplicateNextForTarget: string | null = null;
    let idempotencyDoubleApplyViolation = false;

    const participants: Record<string, TransactionParticipantRuntime> = {};
    for (const p of parsed.participants) {
      participants[p.id] = {
        id: p.id,
        serviceId: p.serviceId,
        label: p.label,
        online: p.online,
        outboxDispatcherHealthy: true,
        storageHealthy: true,
        localTxStates: {},
        inDoubtTxIds: [],
        stagedOperations: {},
        store: cloneStore(p.initialStore),
        heldLocks: [],
        durableLog: [],
      };
    }

    const twoPCTransactions: Record<string, TwoPCTransactionRuntime> = {};
    const locks: LockRecord[] = [];
    const durableLogs: DurableLogRecord[] = [];
    const messages: TransactionMessageEnvelope[] = [];
    const outboxRecords: OutboxRecord[] = [];
    const inboxRecords: InboxRecord[] = [];
    const idempotencyRecords: IdempotencyRecord[] = [];
    const failurePropagationChain: string[] = [];

    let sagaRuntime: SagaRuntime | null = null;
    if (parsed.workflow.protocol === "saga_orchestration") {
      sagaRuntime = {
        sagaId: parsed.workflow.sagaId,
        workflowVersion: parsed.workflow.workflowVersion,
        mode: "orchestration",
        state: "CREATED",
        startedAtMs: 0,
        completedAtMs: null,
        steps: parsed.workflow.steps.map((s) => ({
          stepId: s.id,
          participantId: s.participantId,
          label: s.label,
          status: "PENDING",
          attempts: 0,
          startedAtMs: null,
          finishedAtMs: null,
          compensationStatus: "none",
          dependsOn: [...s.dependsOn],
        })),
        compensationOrder: [],
        failureChain: [],
        partialCompletionSummary: "Initialized",
      };
    } else if (parsed.workflow.protocol === "saga_choreography") {
      sagaRuntime = {
        sagaId: parsed.workflow.sagaId,
        workflowVersion: parsed.workflow.workflowVersion,
        mode: "choreography",
        state: "CREATED",
        startedAtMs: 0,
        completedAtMs: null,
        steps: parsed.workflow.subscriptions.map((sub) => ({
          stepId: sub.id,
          participantId: sub.participantId,
          label: `${sub.consumesEvent} → ${sub.operation.kind}`,
          status: "PENDING",
          attempts: 0,
          startedAtMs: null,
          finishedAtMs: null,
          compensationStatus: "none",
          dependsOn: [],
        })),
        compensationOrder: [],
        failureChain: [],
        partialCompletionSummary: "Awaiting domain event",
      };
    }

    const metrics: DistributedTransactionMetrics = {
      protocol: parsed.protocol,
      transactionsStarted: 0,
      transactionsCommitted: 0,
      transactionsAborted: 0,
      inDoubtCount: 0,
      blockedCount: 0,
      lockHoldingTotalMs: 0,
      blockingTotalMs: 0,
      commitLatencyMs: 0,
      sagaCompletionTimeMs: 0,
      compensationCount: 0,
      compensationFailures: 0,
      manualInterventionCount: 0,
      retryCount: 0,
      duplicateDeliveries: 0,
      deduplicatedCount: 0,
      outboxPublishedCount: 0,
      outboxFailedCount: 0,
    };

    const events: ExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    const queue: TxQueueItem[] = [];

    type NewTxQueueItem = TxQueueItem extends infer U
      ? U extends TxQueueItem
        ? Omit<U, "seq"> & { seq?: number }
        : never
      : never;

    const schedule = (item: NewTxQueueItem) => {
      if (item.atMs > parsed.limits.maxVirtualDurationMs) return;
      queue.push({ ...item, seq: ++seqCounter } as TxQueueItem);
    };

    const popNext = (): TxQueueItem | undefined => {
      if (queue.length === 0) return undefined;
      let bestIdx = 0;
      for (let i = 1; i < queue.length; i++) {
        const a = queue[i]!;
        const b = queue[bestIdx]!;
        if (a.atMs < b.atMs || (a.atMs === b.atMs && a.seq < b.seq)) {
          bestIdx = i;
        }
      }
      const picked = queue[bestIdx]!;
      queue.splice(bestIdx, 1);
      return picked;
    };

    const isPartitioned = (fromId: string, toId: string): boolean => {
      if (activePartitions.length === 0) return false;
      for (const group of activePartitions) {
        if (group.includes(fromId) && group.includes(toId)) return false;
      }
      return true;
    };

    const appendDurable = (
      role: "coordinator" | "participant",
      ownerId: string,
      transactionId: string,
      recordType: DurableLogRecord["recordType"],
      detail: string
    ) => {
      const rec: DurableLogRecord = {
        seq: ++durableSeq,
        atMs: virtualTimeMs,
        role,
        ownerId,
        transactionId,
        recordType,
        detail,
        durable: true,
      };
      durableLogs.push(rec);
      if (role === "participant" && participants[ownerId]) {
        participants[ownerId]!.durableLog.push(rec);
      }
    };

    const calcLatency = (): number => {
      const jitter =
        parsed.network.jitterMs > 0
          ? Math.round((rng() * 2 - 1) * parsed.network.jitterMs)
          : 0;
      return Math.max(5, parsed.network.baseLatencyMs + jitter);
    };

    const cloneParticipants = (): Record<string, TransactionParticipantRuntime> => {
      const out: Record<string, TransactionParticipantRuntime> = {};
      for (const [k, p] of Object.entries(participants)) {
        out[k] = {
          ...p,
          localTxStates: { ...p.localTxStates },
          inDoubtTxIds: [...p.inDoubtTxIds],
          stagedOperations: { ...p.stagedOperations },
          store: cloneStore(p.store),
          heldLocks: [...p.heldLocks],
          durableLog: p.durableLog.map((d) => ({ ...d })),
        };
      }
      return out;
    };

    const cloneTwoPC = (): Record<string, TwoPCTransactionRuntime> => {
      const out: Record<string, TwoPCTransactionRuntime> = {};
      for (const [k, tx] of Object.entries(twoPCTransactions)) {
        out[k] = {
          ...tx,
          enlistedParticipants: [...tx.enlistedParticipants],
          votes: { ...tx.votes },
          acks: { ...tx.acks },
          inDoubtParticipants: [...tx.inDoubtParticipants],
          blockedWaiters: [...tx.blockedWaiters],
        };
      }
      return out;
    };

    const emitFrame = (
      ev: ExecutionEvent,
      stepTitle: string,
      stepExplanation: string,
      activeNodeIds: string[]
    ) => {
      if (events.length >= parsed.limits.maxEvents) return;
      const enrichedEv = { ...ev, explanation: stepExplanation };
      events.push(enrichedEv);

      // Update derived metrics
      let inDoubt = 0;
      for (const p of Object.values(participants)) {
        inDoubt += p.inDoubtTxIds.length;
      }
      metrics.inDoubtCount = inDoubt;

      let holdSum = 0;
      for (const lk of locks) {
        const end = lk.releasedAtMs ?? virtualTimeMs;
        holdSum += Math.max(0, end - lk.acquiredAtMs);
      }
      metrics.lockHoldingTotalMs = holdSum;

      const invariants = TransactionInvariantMonitor.verify(
        invariantTracker,
        twoPCTransactions,
        participants,
        sagaRuntime,
        locks,
        idempotencyDoubleApplyViolation
      );

      const snapshot: ModeledDistributedTransactionRuntimeState = {
        virtualTimeMs,
        protocol: parsed.protocol,
        coordinatorOnline,
        activePartitions: activePartitions.map((g) => [...g]),
        participants: cloneParticipants(),
        twoPCTransactions: cloneTwoPC(),
        saga: sagaRuntime
          ? {
              ...sagaRuntime,
              steps: sagaRuntime.steps.map((s) => ({ ...s, dependsOn: [...s.dependsOn] })),
              compensationOrder: [...sagaRuntime.compensationOrder],
              failureChain: [...sagaRuntime.failureChain],
            }
          : null,
        locks: locks.map((l) => ({ ...l, waiters: [...l.waiters] })),
        durableLogs: durableLogs.map((d) => ({ ...d })),
        messages: messages.slice(-60).map((m) => ({ ...m })),
        outboxRecords: outboxRecords.map((o) => ({ ...o })),
        inboxRecords: inboxRecords.map((i) => ({ ...i })),
        idempotencyRecords: idempotencyRecords.map((r) => ({ ...r })),
        failurePropagationChain: [...failurePropagationChain],
        invariants,
        metrics: { ...metrics },
      };

      const clonedRuntime = RuntimeStateHelper.cloneState(baseRuntime);
      clonedRuntime.distributedTransactionState = snapshot;

      frames.push({
        frameIndex: frames.length,
        virtualTimeMs,
        activeNodeIds,
        activeEdgeIds: [],
        activeEvent: { ...ev, explanation: stepExplanation },
        direction: "request",
        stepTitle,
        stepExplanation,
        runtimeState: clonedRuntime,
      });
    };

    const nextEvtBase = (causationId?: string) => {
      const seq = ++eventCounter;
      return {
        id: `tx_evt_${seq}`,
        sequence: seq,
        atMs: virtualTimeMs,
        durationMs: 0,
        explanation: "",
        traceId: parsed.id,
        spanId: causationId ?? `span_${seq}`,
      };
    };

    // Helper for 2PC decision & propagation
    const finalizeTwoPCDecision = (
      tx: TwoPCTransactionRuntime,
      decision: "COMMIT" | "ABORT",
      reason: string
    ) => {
      if (tx.decision !== null || !tx.coordinatorOnline) return;
      tx.decision = decision;
      tx.decisionReason = reason;
      tx.state = decision === "COMMIT" ? "DECIDED_COMMIT" : "DECIDED_ABORT";

      appendDurable(
        "coordinator",
        tx.coordinatorId,
        tx.transactionId,
        decision === "COMMIT" ? "GLOBAL_COMMIT" : "GLOBAL_ABORT",
        reason
      );

      if (decision === "COMMIT") {
        metrics.transactionsCommitted += 1;
        metrics.commitLatencyMs = Math.max(1, virtualTimeMs - tx.startedAtMs);
        emitFrame(
          {
            ...nextEvtBase(),
            type: "transaction.decision.committed",
            transactionId: tx.transactionId,
          },
          `Coordinator Decided COMMIT (${tx.transactionId})`,
          `All ${tx.enlistedParticipants.length} participants voted YES. Durable GLOBAL_COMMIT written to coordinator log.`,
          [tx.coordinatorId, ...tx.enlistedParticipants]
        );
      } else {
        metrics.transactionsAborted += 1;
        failurePropagationChain.push(`${tx.transactionId} → GLOBAL_ABORT (${reason})`);
        emitFrame(
          {
            ...nextEvtBase(),
            type: "transaction.decision.aborted",
            transactionId: tx.transactionId,
            reason,
          },
          `Coordinator Decided ABORT (${tx.transactionId})`,
          `${reason}. Durable GLOBAL_ABORT written to coordinator log.`,
          [tx.coordinatorId, ...tx.enlistedParticipants]
        );
      }

      tx.state = "NOTIFYING_PARTICIPANTS";
      const msgKind = decision === "COMMIT" ? "GLOBAL_COMMIT" : "GLOBAL_ABORT";
      for (const pid of tx.enlistedParticipants) {
        const lat = calcLatency();
        const env: TransactionMessageEnvelope = {
          id: `tx_msg_${++msgCounter}`,
          transactionId: tx.transactionId,
          from: tx.coordinatorId,
          to: pid,
          messageType: msgKind,
          sentAtMs: virtualTimeMs,
          deliverAtMs: virtualTimeMs + lat,
          status: "in_flight",
          correlationId: tx.transactionId,
          causationId: tx.transactionId,
        };
        messages.push(env);
        schedule({
          kind: "twopc_rpc_deliver",
          atMs: virtualTimeMs + lat,
          envelope: env,
          rpcKind: msgKind,
          reason,
        });

        // Simulate duplicate COMMIT/ABORT if network duplication configured or fault injected
        if (rng() < parsed.network.duplicateProbability || duplicateNextForTarget === pid) {
          duplicateNextForTarget = null;
          metrics.duplicateDeliveries += 1;
          const dupEnv: TransactionMessageEnvelope = {
            ...env,
            id: `tx_msg_${++msgCounter}`,
            deliverAtMs: virtualTimeMs + lat + 25,
            isDuplicate: true,
          };
          messages.push(dupEnv);
          schedule({
            kind: "twopc_rpc_deliver",
            atMs: virtualTimeMs + lat + 25,
            envelope: dupEnv,
            rpcKind: msgKind,
            reason,
          });
        }
      }
    };

    const releaseLocksForTx = (txId: string, pid: string) => {
      const p = participants[pid];
      if (!p) return;
      for (const lk of locks) {
        if (lk.participantId === pid && lk.ownerTxId === txId && lk.releasedAtMs === null) {
          lk.releasedAtMs = virtualTimeMs;
          p.heldLocks = p.heldLocks.filter((r) => r !== lk.resourceKey);
          for (const waiterTx of lk.waiters) {
            schedule({
              kind: "twopc_lock_retry",
              atMs: virtualTimeMs + 10,
              txId: waiterTx,
              participantId: pid,
              resourceKey: lk.resourceKey,
              opId: "retry",
            });
          }
          lk.waiters = [];
        }
      }
    };

    // Schedule initial workflow & faults
    for (const f of parsed.failures) {
      schedule({ kind: "fault_apply", atMs: f.atMs, faultId: f.id });
      if (f.durationMs !== undefined && f.durationMs > 0) {
        schedule({ kind: "fault_revert", atMs: f.atMs + f.durationMs, faultId: f.id });
      }
    }

    if (parsed.workflow.protocol === "two_phase_commit") {
      for (const txCfg of parsed.workflow.transactions) {
        schedule({ kind: "twopc_start", atMs: txCfg.atMs, txId: txCfg.transactionId });
      }
    } else if (parsed.workflow.protocol === "saga_orchestration") {
      schedule({ kind: "saga_dispatch_ready", atMs: 10 });
    } else if (parsed.workflow.protocol === "saga_choreography") {
      const initEv = parsed.workflow.initialEvent;
      schedule({
        kind: "choreo_deliver",
        atMs: 10,
        eventType: initEv.eventType,
        messageId: `ch_msg_${++msgCounter}`,
        producer: initEv.producer,
        correlationId: parsed.workflow.sagaId,
        causationId: parsed.workflow.sagaId,
      });
    }

    // Main discrete event loop
    while (queue.length > 0 && events.length < parsed.limits.maxEvents) {
      const item = popNext()!;
      virtualTimeMs = item.atMs;

      switch (item.kind) {
        case "fault_apply": {
          const fault = parsed.failures.find((f) => f.id === item.faultId);
          if (!fault) break;

          if (fault.type === "coordinator_crash") {
            coordinatorOnline = false;
            for (const tx of Object.values(twoPCTransactions)) {
              tx.coordinatorOnline = false;
              if (tx.state !== "COMPLETED") {
                for (const pid of tx.enlistedParticipants) {
                  const p = participants[pid];
                  if (p && p.localTxStates[tx.transactionId] === "PREPARED") {
                    if (!p.inDoubtTxIds.includes(tx.transactionId)) {
                      p.inDoubtTxIds.push(tx.transactionId);
                    }
                    if (!tx.inDoubtParticipants.includes(pid)) {
                      tx.inDoubtParticipants.push(pid);
                    }
                    emitFrame(
                      {
                        ...nextEvtBase(),
                        type: "transaction.in_doubt",
                        transactionId: tx.transactionId,
                        participantId: pid,
                        reason: "Coordinator crashed while participant holds durable PREPARED state & locks.",
                      },
                      `Coordinator Crash → ${p.label} IN_DOUBT`,
                      `${p.label} durably prepared TX ${tx.transactionId} but coordinator crashed before delivering decision. Locks remain blocked.`,
                      [tx.coordinatorId, pid]
                    );
                  }
                }
              }
            }
            failurePropagationChain.push(`Coordinator crashed at t=${virtualTimeMs}ms`);
          } else if (fault.type === "coordinator_restart") {
            coordinatorOnline = true;
            for (const tx of Object.values(twoPCTransactions)) {
              tx.coordinatorOnline = true;
              if (tx.state !== "COMPLETED") {
                tx.state = "RECOVERING";
                emitFrame(
                  {
                    ...nextEvtBase(),
                    type: "transaction.recovery.started",
                    componentId: tx.coordinatorId,
                    transactionId: tx.transactionId,
                  },
                  `Coordinator Recovery Started (${tx.transactionId})`,
                  "Coordinator restarted and inspects durable recovery log.",
                  [tx.coordinatorId]
                );

                const durableDecision = durableLogs.find(
                  (d) =>
                    d.role === "coordinator" &&
                    d.transactionId === tx.transactionId &&
                    (d.recordType === "GLOBAL_COMMIT" || d.recordType === "GLOBAL_ABORT")
                );

                if (durableDecision) {
                  const msgKind =
                    durableDecision.recordType === "GLOBAL_COMMIT"
                      ? "GLOBAL_COMMIT"
                      : "GLOBAL_ABORT";
                  tx.state = "NOTIFYING_PARTICIPANTS";
                  for (const pid of tx.enlistedParticipants) {
                    const lat = calcLatency();
                    const env: TransactionMessageEnvelope = {
                      id: `tx_msg_${++msgCounter}`,
                      transactionId: tx.transactionId,
                      from: tx.coordinatorId,
                      to: pid,
                      messageType: msgKind,
                      sentAtMs: virtualTimeMs,
                      deliverAtMs: virtualTimeMs + lat,
                      status: "in_flight",
                      correlationId: tx.transactionId,
                      causationId: tx.transactionId,
                    };
                    messages.push(env);
                    schedule({
                      kind: "twopc_rpc_deliver",
                      atMs: virtualTimeMs + lat,
                      envelope: env,
                      rpcKind: msgKind,
                      reason: "Recovered durable coordinator decision",
                    });
                  }
                  emitFrame(
                    {
                      ...nextEvtBase(),
                      type: "transaction.recovery.completed",
                      componentId: tx.coordinatorId,
                      transactionId: tx.transactionId,
                      outcome: msgKind,
                    },
                    `Coordinator Recovered Durable ${msgKind}`,
                    `Recovered ${msgKind} from durable coordinator log and retransmitted to participants.`,
                    [tx.coordinatorId, ...tx.enlistedParticipants]
                  );
                } else {
                  finalizeTwoPCDecision(
                    tx,
                    "ABORT",
                    "Coordinator crashed prior to decision; safe presumed abort during recovery"
                  );
                }
              }
            }
          } else if (fault.type === "participant_crash") {
            const p = participants[fault.targetId];
            if (p) {
              p.online = false;
              // Volatile memory cleared; durable log & PREPARED records persist!
              p.stagedOperations = {};
              failurePropagationChain.push(`${p.label} crashed at t=${virtualTimeMs}ms`);
            }
          } else if (fault.type === "participant_restart") {
            const p = participants[fault.targetId];
            if (p) {
              p.online = true;
              // Check durable log for any unfinished PREPARED tx -> query coordinator
              const preparedEntries = p.durableLog.filter(
                (d) => d.recordType === "PARTICIPANT_PREPARED"
              );
              for (const prep of preparedEntries) {
                const terminal = p.durableLog.find(
                  (d) =>
                    d.transactionId === prep.transactionId &&
                    (d.recordType === "PARTICIPANT_COMMITTED" ||
                      d.recordType === "PARTICIPANT_ABORTED")
                );
                if (!terminal) {
                  p.localTxStates[prep.transactionId] = "PREPARED";
                  if (!p.inDoubtTxIds.includes(prep.transactionId)) {
                    p.inDoubtTxIds.push(prep.transactionId);
                  }
                  emitFrame(
                    {
                      ...nextEvtBase(),
                      type: "transaction.recovery.started",
                      componentId: p.id,
                      transactionId: prep.transactionId,
                    },
                    `${p.label} Restarted → Recovery Query`,
                    `${p.label} recovered durable PREPARED record for ${prep.transactionId} and sends DECISION_QUERY to coordinator.`,
                    [p.id, "tx-coordinator"]
                  );
                  const tx = twoPCTransactions[prep.transactionId];
                  const coordId = tx?.coordinatorId ?? "tx-coordinator";
                  const lat = calcLatency();
                  const qEnv: TransactionMessageEnvelope = {
                    id: `tx_msg_${++msgCounter}`,
                    transactionId: prep.transactionId,
                    from: p.id,
                    to: coordId,
                    messageType: "DECISION_QUERY",
                    sentAtMs: virtualTimeMs,
                    deliverAtMs: virtualTimeMs + lat,
                    status: "in_flight",
                    correlationId: prep.transactionId,
                    causationId: prep.transactionId,
                  };
                  messages.push(qEnv);
                  schedule({
                    kind: "twopc_rpc_deliver",
                    atMs: virtualTimeMs + lat,
                    envelope: qEnv,
                    rpcKind: "DECISION_QUERY",
                  });
                }
              }
            }
          } else if (fault.type === "network_partition" && fault.partitionGroups) {
            activePartitions = fault.partitionGroups.map((g) => [...g]);
            failurePropagationChain.push(
              `Network partition active: ${activePartitions.map((g) => `[${g.join(",")}]`).join(" | ")}`
            );
          } else if (fault.type === "partition_heal") {
            activePartitions = [];
            // Heal also allows stalled outbox or in-doubt participants to query
            for (const p of Object.values(participants)) {
              for (const txId of p.inDoubtTxIds) {
                const tx = twoPCTransactions[txId];
                if (tx && tx.coordinatorOnline && tx.decision !== null) {
                  const lat = calcLatency();
                  const qEnv: TransactionMessageEnvelope = {
                    id: `tx_msg_${++msgCounter}`,
                    transactionId: txId,
                    from: p.id,
                    to: tx.coordinatorId,
                    messageType: "DECISION_QUERY",
                    sentAtMs: virtualTimeMs,
                    deliverAtMs: virtualTimeMs + lat,
                    status: "in_flight",
                    correlationId: txId,
                    causationId: txId,
                  };
                  messages.push(qEnv);
                  schedule({
                    kind: "twopc_rpc_deliver",
                    atMs: virtualTimeMs + lat,
                    envelope: qEnv,
                    rpcKind: "DECISION_QUERY",
                  });
                }
              }
            }
          } else if (fault.type === "drop_next_rpc") {
            dropNextRpcForTarget = fault.targetId;
          } else if (fault.type === "duplicate_next_message") {
            duplicateNextForTarget = fault.targetId;
          } else if (fault.type === "outbox_dispatcher_fail") {
            const p = participants[fault.targetId];
            if (p) {
              p.outboxDispatcherHealthy = false;
              failurePropagationChain.push(`${p.label} outbox dispatcher offline`);
            }
          } else if (fault.type === "outbox_dispatcher_recover") {
            const p = participants[fault.targetId];
            if (p) {
              p.outboxDispatcherHealthy = true;
              // Re-schedule any pending/failed outbox items for this participant
              for (const ob of outboxRecords) {
                if (
                  ob.participantId === p.id &&
                  ob.status !== "OUTBOX_MESSAGE_PUBLISHED"
                ) {
                  schedule({
                    kind: "outbox_dispatch",
                    atMs: virtualTimeMs + 15,
                    recordId: ob.id,
                    attempt: ob.attempts + 1,
                    eventType: ob.eventType,
                    correlationId: ob.transactionId,
                    causationId: ob.id,
                  });
                }
              }
            }
          } else if (fault.type === "storage_failure") {
            const p = participants[fault.targetId];
            if (p) p.storageHealthy = false;
          }
          break;
        }

        case "fault_revert": {
          const fault = parsed.failures.find((f) => f.id === item.faultId);
          if (fault?.type === "network_partition") {
            activePartitions = [];
          } else if (fault?.type === "outbox_dispatcher_fail") {
            const p = participants[fault.targetId];
            if (p) p.outboxDispatcherHealthy = true;
          } else if (fault?.type === "storage_failure") {
            const p = participants[fault.targetId];
            if (p) p.storageHealthy = true;
          }
          break;
        }

        case "twopc_start": {
          if (parsed.workflow.protocol !== "two_phase_commit") break;
          const txCfg = parsed.workflow.transactions.find(
            (t) => t.transactionId === item.txId
          );
          if (!txCfg) break;

          const pIds = txCfg.steps.map((s) => s.participantId);
          const votes: Record<string, "YES" | "NO" | "PENDING"> = {};
          const acks: Record<string, boolean> = {};
          for (const pid of pIds) {
            votes[pid] = "PENDING";
            acks[pid] = false;
          }

          const tx: TwoPCTransactionRuntime = {
            transactionId: txCfg.transactionId,
            coordinatorId: txCfg.coordinatorId,
            coordinatorOnline,
            state: "INITIALIZING",
            startedAtMs: virtualTimeMs,
            completedAtMs: null,
            enlistedParticipants: pIds,
            votes,
            acks,
            decision: null,
            decisionReason: "Pending unanimous YES votes",
            inDoubtParticipants: [],
            blockedWaiters: [],
          };
          twoPCTransactions[tx.transactionId] = tx;
          metrics.transactionsStarted += 1;

          appendDurable(
            "coordinator",
            tx.coordinatorId,
            tx.transactionId,
            "TX_BEGIN",
            `Started 2PC transaction ${tx.transactionId}`
          );
          for (const pid of pIds) {
            appendDurable(
              "coordinator",
              tx.coordinatorId,
              tx.transactionId,
              "PARTICIPANT_ENLISTED",
              `Enlisted ${pid}`
            );
          }

          emitFrame(
            {
              ...nextEvtBase(),
              type: "distributed_tx.started",
              transactionId: tx.transactionId,
              protocol: "two_phase_commit",
            },
            `Begin 2PC (${tx.transactionId})`,
            `Coordinator enlisted participants [${pIds.join(", ")}] and enters PREPARING phase.`,
            [tx.coordinatorId, ...pIds]
          );

          tx.state = "PREPARING";
          for (const step of txCfg.steps) {
            const p = participants[step.participantId];
            if (p) p.localTxStates[tx.transactionId] = "PREPARING";
            appendDurable(
              "coordinator",
              tx.coordinatorId,
              tx.transactionId,
              "PREPARE_SENT",
              `PREPARE sent to ${step.participantId} for ${step.operation.kind}`
            );
            const lat = calcLatency();
            const env: TransactionMessageEnvelope = {
              id: `tx_msg_${++msgCounter}`,
              transactionId: tx.transactionId,
              from: tx.coordinatorId,
              to: step.participantId,
              messageType: "PREPARE",
              sentAtMs: virtualTimeMs,
              deliverAtMs: virtualTimeMs + lat,
              status: "in_flight",
              correlationId: tx.transactionId,
              causationId: tx.transactionId,
            };
            messages.push(env);
            schedule({
              kind: "twopc_rpc_deliver",
              atMs: virtualTimeMs + lat,
              envelope: env,
              rpcKind: "PREPARE",
              stepOpId: step.operation.id,
              resourceKey: step.operation.resourceKey,
            });
          }

          tx.state = "WAITING_FOR_VOTES";
          emitFrame(
            {
              ...nextEvtBase(),
              type: "transaction.prepare.sent",
              transactionId: tx.transactionId,
              participantId: pIds[0]!,
            },
            `Phase 1: PREPARE Dispatched (${tx.transactionId})`,
            `Coordinator sent PREPARE requests to all enlisted participants and awaits YES/NO votes.`,
            [tx.coordinatorId, ...pIds]
          );

          schedule({
            kind: "twopc_prepare_timeout",
            atMs: virtualTimeMs + txCfg.prepareTimeoutMs,
            txId: tx.transactionId,
          });
          break;
        }

        case "twopc_lock_retry": {
          const tx = twoPCTransactions[item.txId];
          if (!tx || tx.decision !== null || parsed.workflow.protocol !== "two_phase_commit") {
            break;
          }
          const existingLock = locks.find(
            (l) =>
              l.participantId === item.participantId &&
              l.resourceKey === item.resourceKey &&
              l.releasedAtMs === null
          );
          if (!existingLock) {
            // Trigger fresh prepare evaluation if TX still active
            const txCfg = parsed.workflow.transactions.find(
              (t) => t.transactionId === item.txId
            );
            const step = txCfg?.steps.find((s) => s.participantId === item.participantId);
            if (step) {
              const lat = calcLatency();
              const env: TransactionMessageEnvelope = {
                id: `tx_msg_${++msgCounter}`,
                transactionId: tx.transactionId,
                from: tx.coordinatorId,
                to: step.participantId,
                messageType: "PREPARE",
                sentAtMs: virtualTimeMs,
                deliverAtMs: virtualTimeMs + lat,
                status: "in_flight",
                correlationId: tx.transactionId,
                causationId: tx.transactionId,
              };
              messages.push(env);
              schedule({
                kind: "twopc_rpc_deliver",
                atMs: virtualTimeMs + lat,
                envelope: env,
                rpcKind: "PREPARE",
                stepOpId: step.operation.id,
                resourceKey: step.operation.resourceKey,
              });
            }
          }
          break;
        }

        case "twopc_prepare_timeout": {
          const tx = twoPCTransactions[item.txId];
          if (!tx || !tx.coordinatorOnline || tx.decision !== null) break;
          const missing = tx.enlistedParticipants.filter((pid) => tx.votes[pid] === "PENDING");
          if (missing.length > 0) {
            finalizeTwoPCDecision(
              tx,
              "ABORT",
              `Prepare timeout reached while awaiting vote(s) from [${missing.join(", ")}]`
            );
          }
          break;
        }

        case "twopc_rpc_deliver": {
          const { envelope, rpcKind } = item;
          const tx = twoPCTransactions[envelope.transactionId];
          if (!tx) break;

          // Check partition / dropped RPC / offline target
          const targetOnline =
            envelope.to === tx.coordinatorId
              ? tx.coordinatorOnline
              : Boolean(participants[envelope.to]?.online);

          if (!targetOnline) {
            envelope.status = "dropped";
            envelope.dropReason = `${envelope.to} crashed/offline`;
            break;
          }
          if (isPartitioned(envelope.from, envelope.to)) {
            envelope.status = "dropped";
            envelope.dropReason = "Network partition";
            break;
          }
          if (dropNextRpcForTarget === envelope.to && (rpcKind === "DECISION_ACK" || rpcKind === "PREPARE" || rpcKind === "GLOBAL_COMMIT")) {
            dropNextRpcForTarget = null;
            envelope.status = "dropped";
            envelope.dropReason = "Injected RPC packet loss";
            // If ack or decision dropped, schedule retransmission from coordinator after timeout
            if (rpcKind === "DECISION_ACK" && tx.coordinatorOnline && tx.decision !== null) {
              const resendKind = tx.decision === "COMMIT" ? "GLOBAL_COMMIT" : "GLOBAL_ABORT";
              const resendEnv: TransactionMessageEnvelope = {
                id: `tx_msg_${++msgCounter}`,
                transactionId: tx.transactionId,
                from: tx.coordinatorId,
                to: envelope.from,
                messageType: resendKind,
                sentAtMs: virtualTimeMs + 50,
                deliverAtMs: virtualTimeMs + 50 + calcLatency(),
                status: "in_flight",
                isDuplicate: true,
                correlationId: tx.transactionId,
                causationId: envelope.id,
              };
              messages.push(resendEnv);
              schedule({
                kind: "twopc_rpc_deliver",
                atMs: resendEnv.deliverAtMs,
                envelope: resendEnv,
                rpcKind: resendKind,
                reason: "Coordinator retransmission after lost DECISION_ACK",
              });
            }
            break;
          }

          envelope.status = "delivered";

          if (rpcKind === "PREPARE" && parsed.workflow.protocol === "two_phase_commit") {
            const p = participants[envelope.to];
            const txCfg = parsed.workflow.transactions.find(
              (t) => t.transactionId === tx.transactionId
            );
            const step = txCfg?.steps.find((s) => s.participantId === envelope.to);
            if (!p || !step) break;

            // Check storage health
            if (!p.storageHealthy) {
              p.localTxStates[tx.transactionId] = "ABORTED";
              const lat = calcLatency();
              const vEnv: TransactionMessageEnvelope = {
                id: `tx_msg_${++msgCounter}`,
                transactionId: tx.transactionId,
                from: p.id,
                to: tx.coordinatorId,
                messageType: "VOTE_NO",
                sentAtMs: virtualTimeMs,
                deliverAtMs: virtualTimeMs + lat,
                status: "in_flight",
                correlationId: tx.transactionId,
                causationId: envelope.id,
              };
              messages.push(vEnv);
              schedule({
                kind: "twopc_rpc_deliver",
                atMs: virtualTimeMs + lat,
                envelope: vEnv,
                rpcKind: "VOTE_NO",
                reason: "Durable storage write failed during PREPARE",
              });
              break;
            }

            // Exclusive lock check on resourceKey
            const activeLock = locks.find(
              (l) =>
                l.participantId === p.id &&
                l.resourceKey === step.operation.resourceKey &&
                l.releasedAtMs === null &&
                l.ownerTxId !== tx.transactionId
            );
            if (activeLock) {
              if (!activeLock.waiters.includes(tx.transactionId)) {
                activeLock.waiters.push(tx.transactionId);
              }
              if (!tx.blockedWaiters.includes(activeLock.ownerTxId)) {
                tx.blockedWaiters.push(activeLock.ownerTxId);
              }
              metrics.blockedCount += 1;
              metrics.blockingTotalMs += 50;
              failurePropagationChain.push(
                `${tx.transactionId} blocked waiting for lock '${step.operation.resourceKey}' held by ${activeLock.ownerTxId}`
              );
              emitFrame(
                {
                  ...nextEvtBase(envelope.id),
                  type: "transaction.lock.contended",
                  transactionId: tx.transactionId,
                  ownerTxId: activeLock.ownerTxId,
                  resourceKey: step.operation.resourceKey,
                },
                `Lock Contention on ${step.operation.resourceKey}`,
                `${tx.transactionId} cannot acquire exclusive lock on '${step.operation.resourceKey}' — held by prepared ${activeLock.ownerTxId}.`,
                [p.id, tx.coordinatorId]
              );
              break;
            }

            // Acquire lock & validate staged operation (do NOT mutate final store until GLOBAL_COMMIT)
            locks.push({
              id: `lock_${p.id}_${step.operation.resourceKey}_${tx.transactionId}`,
              resourceKey: step.operation.resourceKey,
              ownerTxId: tx.transactionId,
              participantId: p.id,
              acquiredAtMs: virtualTimeMs,
              releasedAtMs: null,
              waiters: [],
            });
            if (!p.heldLocks.includes(step.operation.resourceKey)) {
              p.heldLocks.push(step.operation.resourceKey);
            }

            const check = validateAndApplyLocalOperation(p.store, step.operation, false);
            if (!check.ok) {
              // Release lock immediately and vote NO
              releaseLocksForTx(tx.transactionId, p.id);
              p.localTxStates[tx.transactionId] = "ABORTED";
              appendDurable(
                "participant",
                p.id,
                tx.transactionId,
                "PARTICIPANT_ABORTED",
                `Local prepare validation failed: ${check.reason}`
              );
              const lat = calcLatency();
              const vEnv: TransactionMessageEnvelope = {
                id: `tx_msg_${++msgCounter}`,
                transactionId: tx.transactionId,
                from: p.id,
                to: tx.coordinatorId,
                messageType: "VOTE_NO",
                sentAtMs: virtualTimeMs,
                deliverAtMs: virtualTimeMs + lat,
                status: "in_flight",
                correlationId: tx.transactionId,
                causationId: envelope.id,
              };
              messages.push(vEnv);
              schedule({
                kind: "twopc_rpc_deliver",
                atMs: virtualTimeMs + lat,
                envelope: vEnv,
                rpcKind: "VOTE_NO",
                reason: check.reason,
              });
              break;
            }

            // Persist PREPARED state before voting YES
            p.stagedOperations[tx.transactionId] = {
              operationId: step.operation.id,
              summary: check.summary,
            };
            p.localTxStates[tx.transactionId] = "PREPARED";
            appendDurable(
              "participant",
              p.id,
              tx.transactionId,
              "PARTICIPANT_PREPARED",
              `Durably prepared & locked '${step.operation.resourceKey}': ${check.summary}`
            );

            const lat = calcLatency();
            const vEnv: TransactionMessageEnvelope = {
              id: `tx_msg_${++msgCounter}`,
              transactionId: tx.transactionId,
              from: p.id,
              to: tx.coordinatorId,
              messageType: "VOTE_YES",
              sentAtMs: virtualTimeMs,
              deliverAtMs: virtualTimeMs + lat,
              status: "in_flight",
              correlationId: tx.transactionId,
              causationId: envelope.id,
            };
            messages.push(vEnv);
            schedule({
              kind: "twopc_rpc_deliver",
              atMs: virtualTimeMs + lat,
              envelope: vEnv,
              rpcKind: "VOTE_YES",
            });
          } else if (rpcKind === "VOTE_YES") {
            tx.votes[envelope.from] = "YES";
            appendDurable(
              "coordinator",
              tx.coordinatorId,
              tx.transactionId,
              "VOTE_RECEIVED",
              `Received VOTE_YES from ${envelope.from}`
            );
            emitFrame(
              {
                ...nextEvtBase(envelope.id),
                type: "transaction.vote.yes",
                transactionId: tx.transactionId,
                participantId: envelope.from,
              },
              `Vote YES from ${envelope.from}`,
              `${envelope.from} durably prepared local changes and returned VOTE_YES.`,
              [envelope.from, tx.coordinatorId]
            );

            const allYes = tx.enlistedParticipants.every((pid) => tx.votes[pid] === "YES");
            if (allYes) {
              finalizeTwoPCDecision(
                tx,
                "COMMIT",
                "All enlisted participants voted YES"
              );
            }
          } else if (rpcKind === "VOTE_NO") {
            tx.votes[envelope.from] = "NO";
            appendDurable(
              "coordinator",
              tx.coordinatorId,
              tx.transactionId,
              "VOTE_RECEIVED",
              `Received VOTE_NO from ${envelope.from}: ${item.reason ?? ""}`
            );
            emitFrame(
              {
                ...nextEvtBase(envelope.id),
                type: "transaction.vote.no",
                transactionId: tx.transactionId,
                participantId: envelope.from,
                reason: item.reason ?? "Participant voted NO",
              },
              `Vote NO from ${envelope.from}`,
              `${envelope.from} refused prepare (${item.reason ?? "validation failed"}).`,
              [envelope.from, tx.coordinatorId]
            );
            finalizeTwoPCDecision(
              tx,
              "ABORT",
              `Participant ${envelope.from} voted NO (${item.reason ?? "rejected"})`
            );
          } else if (rpcKind === "GLOBAL_COMMIT" && parsed.workflow.protocol === "two_phase_commit") {
            const p = participants[envelope.to];
            if (!p) break;
            const prevLocal = p.localTxStates[tx.transactionId];
            if (prevLocal === "COMMITTED") {
              // Idempotent duplicate GLOBAL_COMMIT: still ACK, do NOT re-apply side effects
              metrics.deduplicatedCount += 1;
              emitFrame(
                {
                  ...nextEvtBase(envelope.id),
                  type: "transaction.idempotency.hit",
                  operationId: `${tx.transactionId}:COMMIT`,
                  participantId: p.id,
                },
                `Idempotent Duplicate GLOBAL_COMMIT (${p.label})`,
                `${p.label} already committed ${tx.transactionId}; duplicate GLOBAL_COMMIT ignored without double-applying side effects.`,
                [p.id]
              );
            } else {
              const txCfg = parsed.workflow.transactions.find(
                (t) => t.transactionId === tx.transactionId
              );
              const step = txCfg?.steps.find((s) => s.participantId === p.id);
              if (step) {
                validateAndApplyLocalOperation(p.store, step.operation, true);
              }
              p.localTxStates[tx.transactionId] = "COMMITTED";
              p.inDoubtTxIds = p.inDoubtTxIds.filter((id) => id !== tx.transactionId);
              tx.inDoubtParticipants = tx.inDoubtParticipants.filter((id) => id !== p.id);
              delete p.stagedOperations[tx.transactionId];
              releaseLocksForTx(tx.transactionId, p.id);
              appendDurable(
                "participant",
                p.id,
                tx.transactionId,
                "PARTICIPANT_COMMITTED",
                `Applied changes & released locks for ${tx.transactionId}`
              );
              emitFrame(
                {
                  ...nextEvtBase(envelope.id),
                  type: "transaction.participant.committed",
                  transactionId: tx.transactionId,
                  participantId: p.id,
                },
                `${p.label} Committed (${tx.transactionId})`,
                `${p.label} applied staged changes, logged PARTICIPANT_COMMITTED, and released locks.`,
                [p.id, tx.coordinatorId]
              );
            }

            // Send DECISION_ACK
            const lat = calcLatency();
            const ackEnv: TransactionMessageEnvelope = {
              id: `tx_msg_${++msgCounter}`,
              transactionId: tx.transactionId,
              from: p.id,
              to: tx.coordinatorId,
              messageType: "DECISION_ACK",
              sentAtMs: virtualTimeMs,
              deliverAtMs: virtualTimeMs + lat,
              status: "in_flight",
              correlationId: tx.transactionId,
              causationId: envelope.id,
            };
            messages.push(ackEnv);
            schedule({
              kind: "twopc_rpc_deliver",
              atMs: virtualTimeMs + lat,
              envelope: ackEnv,
              rpcKind: "DECISION_ACK",
            });
          } else if (rpcKind === "GLOBAL_ABORT") {
            const p = participants[envelope.to];
            if (!p) break;
            if (p.localTxStates[tx.transactionId] === "COMMITTED") {
              // Never roll back already committed transaction
              break;
            }
            if (p.localTxStates[tx.transactionId] !== "ABORTED") {
              p.localTxStates[tx.transactionId] = "ABORTED";
              p.inDoubtTxIds = p.inDoubtTxIds.filter((id) => id !== tx.transactionId);
              tx.inDoubtParticipants = tx.inDoubtParticipants.filter((id) => id !== p.id);
              delete p.stagedOperations[tx.transactionId];
              releaseLocksForTx(tx.transactionId, p.id);
              appendDurable(
                "participant",
                p.id,
                tx.transactionId,
                "PARTICIPANT_ABORTED",
                `Rolled back staged state & released locks for ${tx.transactionId}`
              );
              emitFrame(
                {
                  ...nextEvtBase(envelope.id),
                  type: "transaction.participant.aborted",
                  transactionId: tx.transactionId,
                  participantId: p.id,
                },
                `${p.label} Aborted (${tx.transactionId})`,
                `${p.label} rolled back staged state, persisted PARTICIPANT_ABORTED, and released locks.`,
                [p.id, tx.coordinatorId]
              );
            }

            const lat = calcLatency();
            const ackEnv: TransactionMessageEnvelope = {
              id: `tx_msg_${++msgCounter}`,
              transactionId: tx.transactionId,
              from: p.id,
              to: tx.coordinatorId,
              messageType: "DECISION_ACK",
              sentAtMs: virtualTimeMs,
              deliverAtMs: virtualTimeMs + lat,
              status: "in_flight",
              correlationId: tx.transactionId,
              causationId: envelope.id,
            };
            messages.push(ackEnv);
            schedule({
              kind: "twopc_rpc_deliver",
              atMs: virtualTimeMs + lat,
              envelope: ackEnv,
              rpcKind: "DECISION_ACK",
            });
          } else if (rpcKind === "DECISION_ACK") {
            tx.acks[envelope.from] = true;
            const allAcked = tx.enlistedParticipants.every((pid) => tx.acks[pid]);
            if (allAcked && tx.state !== "COMPLETED") {
              tx.state = "COMPLETED";
              tx.completedAtMs = virtualTimeMs;
              appendDurable(
                "coordinator",
                tx.coordinatorId,
                tx.transactionId,
                "TX_COMPLETED",
                `All participants acknowledged ${tx.decision}`
              );
              emitFrame(
                {
                  ...nextEvtBase(envelope.id),
                  type: "transaction.recovery.completed",
                  componentId: tx.coordinatorId,
                  transactionId: tx.transactionId,
                  outcome: tx.decision ?? "COMPLETED",
                },
                `2PC Transaction Completed (${tx.transactionId})`,
                `All ${tx.enlistedParticipants.length} participants acknowledged ${tx.decision}.`,
                [tx.coordinatorId, ...tx.enlistedParticipants]
              );
            }
          } else if (rpcKind === "DECISION_QUERY") {
            if (!tx.coordinatorOnline) break;
            const respKind = tx.decision === "COMMIT" ? "GLOBAL_COMMIT" : "GLOBAL_ABORT";
            const lat = calcLatency();
            const respEnv: TransactionMessageEnvelope = {
              id: `tx_msg_${++msgCounter}`,
              transactionId: tx.transactionId,
              from: tx.coordinatorId,
              to: envelope.from,
              messageType: respKind,
              sentAtMs: virtualTimeMs,
              deliverAtMs: virtualTimeMs + lat,
              status: "in_flight",
              correlationId: tx.transactionId,
              causationId: envelope.id,
            };
            messages.push(respEnv);
            schedule({
              kind: "twopc_rpc_deliver",
              atMs: virtualTimeMs + lat,
              envelope: respEnv,
              rpcKind: respKind,
              reason: "Response to DECISION_QUERY",
            });
          }
          break;
        }

        // ==============================
        // SAGA ORCHESTRATION
        // ==============================
        case "saga_dispatch_ready": {
          if (parsed.workflow.protocol !== "saga_orchestration" || !sagaRuntime) break;
          const wf = parsed.workflow as SagaOrchestrationWorkflow;

          if (sagaRuntime.state === "CREATED") {
            sagaRuntime.state = "RUNNING";
            sagaRuntime.startedAtMs = virtualTimeMs;
            emitFrame(
              {
                ...nextEvtBase(),
                type: "saga.started",
                sagaId: wf.sagaId,
                mode: "orchestration",
                workflowVersion: wf.workflowVersion,
              },
              `Saga Orchestration Started (${wf.sagaId} v${wf.workflowVersion})`,
              `Central orchestrator starting ${wf.steps.length}-step workflow.`,
              wf.steps.map((s) => s.participantId)
            );
          }

          if (sagaRuntime.state !== "RUNNING") break;

          // Check if any step failed -> begin backward compensation
          const failedStep = sagaRuntime.steps.find((s) => s.status === "FAILED");
          if (failedStep) {
            sagaRuntime.state = "COMPENSATING";
            const succeededSteps = sagaRuntime.steps
              .filter((s) => s.status === "SUCCEEDED")
              .reverse();
            sagaRuntime.compensationOrder = succeededSteps.map((s) => s.stepId);

            if (succeededSteps.length === 0) {
              sagaRuntime.state = "COMPENSATED";
              sagaRuntime.completedAtMs = virtualTimeMs;
              metrics.sagaCompletionTimeMs = virtualTimeMs - sagaRuntime.startedAtMs;
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "saga.completed",
                  sagaId: wf.sagaId,
                  finalState: "COMPENSATED",
                },
                `Saga Ended (${wf.sagaId}): No Compensations Needed`,
                `First step '${failedStep.stepId}' failed before any forward commits.`,
                [failedStep.participantId]
              );
            } else {
              // Schedule first compensation step sequentially in reverse dependency order
              for (const cs of succeededSteps) {
                cs.compensationStatus = "pending";
              }
              const firstComp = succeededSteps[0]!;
              schedule({
                kind: "saga_comp_execute",
                atMs: virtualTimeMs + calcLatency(),
                stepId: firstComp.stepId,
                attempt: 1,
              });
            }
            break;
          }

          // Check if all steps succeeded
          if (sagaRuntime.steps.every((s) => s.status === "SUCCEEDED")) {
            sagaRuntime.state = "COMPLETED";
            sagaRuntime.completedAtMs = virtualTimeMs;
            sagaRuntime.partialCompletionSummary = "All forward steps committed";
            metrics.sagaCompletionTimeMs = virtualTimeMs - sagaRuntime.startedAtMs;
            emitFrame(
              {
                ...nextEvtBase(),
                type: "saga.completed",
                sagaId: wf.sagaId,
                finalState: "COMPLETED",
              },
              `Saga Completed (${wf.sagaId})`,
              `All ${sagaRuntime.steps.length} local transactions committed independently.`,
              sagaRuntime.steps.map((s) => s.participantId)
            );
            break;
          }

          // Otherwise dispatch eligible PENDING steps whose dependsOn are SUCCEEDED
          for (const stepDef of wf.steps) {
            const st = sagaRuntime.steps.find((s) => s.stepId === stepDef.id)!;
            if (st.status !== "PENDING") continue;
            const depsMet = stepDef.dependsOn.every(
              (depId) => sagaRuntime!.steps.find((s) => s.stepId === depId)?.status === "SUCCEEDED"
            );
            if (!depsMet) continue;

            st.status = "RUNNING";
            st.startedAtMs = virtualTimeMs;
            const msgId = `saga_msg_${++msgCounter}`;
            const lat = calcLatency();
            const env: TransactionMessageEnvelope = {
              id: msgId,
              transactionId: wf.sagaId,
              from: "saga-orchestrator",
              to: stepDef.participantId,
              messageType: `CMD:${stepDef.operation.kind}`,
              sentAtMs: virtualTimeMs,
              deliverAtMs: virtualTimeMs + lat,
              status: "in_flight",
              correlationId: wf.sagaId,
              causationId: wf.sagaId,
            };
            messages.push(env);
            schedule({
              kind: "saga_step_execute",
              atMs: virtualTimeMs + lat,
              stepId: stepDef.id,
              attempt: 1,
              messageId: msgId,
            });
            // Duplicate message simulation if configured
            if (rng() < parsed.network.duplicateProbability || duplicateNextForTarget === stepDef.participantId) {
              duplicateNextForTarget = null;
              metrics.duplicateDeliveries += 1;
              schedule({
                kind: "saga_step_execute",
                atMs: virtualTimeMs + lat + 15,
                stepId: stepDef.id,
                attempt: 1,
                messageId: msgId,
                isDuplicate: true,
              });
            }
          }
          break;
        }

        case "saga_step_execute": {
          if (parsed.workflow.protocol !== "saga_orchestration" || !sagaRuntime) break;
          const wf = parsed.workflow as SagaOrchestrationWorkflow;
          const stepDef = wf.steps.find((s) => s.id === item.stepId);
          const stepRt = sagaRuntime.steps.find((s) => s.stepId === item.stepId);
          const p = stepDef ? participants[stepDef.participantId] : undefined;
          if (!stepDef || !stepRt || !p) break;

          // Inbox deduplication check
          const pCfg = parsed.participants.find((pc) => pc.id === p.id);
          if (pCfg?.inboxEnabled && item.isDuplicate) {
            const existingInbox = inboxRecords.find(
              (i) => i.messageId === item.messageId && i.consumerId === p.id
            );
            if (existingInbox) {
              existingInbox.duplicateCount += 1;
              metrics.deduplicatedCount += 1;
              emitFrame(
                {
                  ...nextEvtBase(item.messageId),
                  type: "transaction.inbox.deduplicated",
                  messageId: item.messageId,
                  consumerId: p.id,
                },
                `Inbox Deduplicated Duplicate (${stepDef.id})`,
                `${p.label} inbox detected duplicate messageId=${item.messageId} and skipped re-execution.`,
                [p.id]
              );
              break;
            }
          }

          // Idempotency check
          const opId = `${wf.sagaId}:${stepDef.id}`;
          const existingIdem = idempotencyRecords.find(
            (r) => r.operationId === opId && r.participantId === p.id
          );
          if (pCfg?.idempotencyEnabled && existingIdem?.status === "completed") {
            metrics.deduplicatedCount += 1;
            emitFrame(
              {
                ...nextEvtBase(item.messageId),
                type: "transaction.idempotency.hit",
                operationId: opId,
                participantId: p.id,
              },
              `Idempotency Cache Hit (${stepDef.id})`,
              `${p.label} returned cached result for completed operationId=${opId}.`,
              [p.id]
            );
            break;
          }

          stepRt.attempts = item.attempt;
          emitFrame(
            {
              ...nextEvtBase(item.messageId),
              type: "saga.step.started",
              sagaId: wf.sagaId,
              stepId: stepDef.id,
              participantId: p.id,
              attempt: item.attempt,
            },
            `Saga Step Started: ${stepDef.label} (Attempt ${item.attempt})`,
            `Executing local transaction ${stepDef.operation.kind} on ${p.label}.`,
            ["saga-orchestrator", p.id]
          );

          const res =
            !p.online
              ? { ok: false, reason: `${p.label} crashed/offline`, summary: "NODE_OFFLINE" }
              : validateAndApplyLocalOperation(p.store, stepDef.operation, true);

          if (res.ok) {
            if (pCfg?.inboxEnabled) {
              inboxRecords.push({
                messageId: item.messageId,
                consumerId: p.id,
                eventType: stepDef.operation.kind,
                processedAtMs: virtualTimeMs,
                duplicateCount: 0,
              });
            }
            idempotencyRecords.push({
              operationId: opId,
              participantId: p.id,
              status: "completed",
              resultSummary: res.summary,
              recordedAtMs: virtualTimeMs,
            });
            stepRt.status = "SUCCEEDED";
            stepRt.finishedAtMs = virtualTimeMs;
            sagaRuntime.partialCompletionSummary = `${sagaRuntime.steps.filter((s) => s.status === "SUCCEEDED").length}/${sagaRuntime.steps.length} steps committed`;

            // Outbox record committed atomically with local op
            if (pCfg?.outboxEnabled) {
              const obId = `ob_${wf.sagaId}_${stepDef.id}`;
              outboxRecords.push({
                id: obId,
                participantId: p.id,
                transactionId: wf.sagaId,
                eventType: `${stepDef.id}.Completed`,
                payloadSummary: res.summary,
                createdAtMs: virtualTimeMs,
                status: "OUTBOX_RECORD_CREATED",
                attempts: 0,
              });
              schedule({
                kind: "outbox_dispatch",
                atMs: virtualTimeMs + 10,
                recordId: obId,
                attempt: 1,
                eventType: `${stepDef.id}.Completed`,
                correlationId: wf.sagaId,
                causationId: item.messageId,
              });
            }

            emitFrame(
              {
                ...nextEvtBase(item.messageId),
                type: "saga.step.completed",
                sagaId: wf.sagaId,
                stepId: stepDef.id,
                participantId: p.id,
              },
              `Saga Step Succeeded: ${stepDef.label}`,
              `${p.label} committed ${res.summary} independently.`,
              [p.id, "saga-orchestrator"]
            );

            schedule({ kind: "saga_dispatch_ready", atMs: virtualTimeMs + 10 });
          } else {
            stepRt.lastError = res.reason;
            const retryPol = stepDef.retryPolicy;
            const canRetry =
              retryPol.enabled &&
              item.attempt < Math.min(retryPol.maxAttempts, parsed.limits.maxRetriesPerStep) &&
              virtualTimeMs - sagaRuntime.startedAtMs < retryPol.overallDeadlineMs;

            if (canRetry) {
              metrics.retryCount += 1;
              const backoff =
                retryPol.backoffType === "exponential"
                  ? retryPol.baseDelayMs * Math.pow(2, item.attempt - 1)
                  : retryPol.baseDelayMs;
              const jitter = Math.round(rng() * backoff * retryPol.jitterRatio);
              schedule({
                kind: "saga_step_execute",
                atMs: virtualTimeMs + backoff + jitter,
                stepId: stepDef.id,
                attempt: item.attempt + 1,
                messageId: item.messageId,
              });
            } else {
              stepRt.status = "FAILED";
              stepRt.finishedAtMs = virtualTimeMs;
              sagaRuntime.failureChain.push(
                `${stepDef.label} failed (${res.reason})`
              );
              failurePropagationChain.push(
                `${stepDef.label} failed after ${item.attempt} attempt(s): ${res.reason}`
              );
              emitFrame(
                {
                  ...nextEvtBase(item.messageId),
                  type: "saga.step.failed",
                  sagaId: wf.sagaId,
                  stepId: stepDef.id,
                  participantId: p.id,
                  reason: res.reason,
                },
                `Saga Step Failed: ${stepDef.label}`,
                `${res.reason}. Initiating reverse compensation.`,
                [p.id, "saga-orchestrator"]
              );
              schedule({ kind: "saga_dispatch_ready", atMs: virtualTimeMs + 15 });
            }
          }
          break;
        }

        case "saga_comp_execute": {
          if (parsed.workflow.protocol !== "saga_orchestration" || !sagaRuntime) break;
          const wf = parsed.workflow as SagaOrchestrationWorkflow;
          const stepDef = wf.steps.find((s) => s.id === item.stepId);
          const stepRt = sagaRuntime.steps.find((s) => s.stepId === item.stepId);
          const p = stepDef ? participants[stepDef.participantId] : undefined;
          if (!stepDef || !stepRt || !p) break;

          stepRt.status = "COMPENSATING";
          stepRt.compensationStatus = "compensating";
          metrics.compensationCount += 1;

          emitFrame(
            {
              ...nextEvtBase(),
              type: "saga.compensation.started",
              sagaId: wf.sagaId,
              stepId: stepDef.id,
              participantId: p.id,
            },
            `Compensating: ${stepDef.label} (Attempt ${item.attempt})`,
            stepDef.compensation
              ? `Executing compensating action ${stepDef.compensation.kind} on ${p.label}.`
              : `No compensation defined for ${stepDef.label}; marking step compensated.`,
            ["saga-orchestrator", p.id]
          );

          const compRes = stepDef.compensation
            ? !p.online
              ? { ok: false, reason: `${p.label} offline during compensation`, summary: "OFFLINE" }
              : validateAndApplyLocalOperation(p.store, stepDef.compensation, true)
            : { ok: true, reason: "No compensation required", summary: "NO_OP" };

          if (compRes.ok) {
            stepRt.status = "COMPENSATED";
            stepRt.compensationStatus = "compensated";
            emitFrame(
              {
                ...nextEvtBase(),
                type: "saga.compensation.completed",
                sagaId: wf.sagaId,
                stepId: stepDef.id,
                participantId: p.id,
              },
              `Compensation Succeeded: ${stepDef.label}`,
              `${p.label} completed ${compRes.summary}.`,
              [p.id, "saga-orchestrator"]
            );

            // Schedule next compensation in compensationOrder
            const idx = sagaRuntime.compensationOrder.indexOf(stepDef.id);
            const nextStepId =
              idx >= 0 && idx + 1 < sagaRuntime.compensationOrder.length
                ? sagaRuntime.compensationOrder[idx + 1]
                : undefined;

            if (nextStepId) {
              schedule({
                kind: "saga_comp_execute",
                atMs: virtualTimeMs + calcLatency(),
                stepId: nextStepId,
                attempt: 1,
              });
            } else {
              sagaRuntime.state = "COMPENSATED";
              sagaRuntime.completedAtMs = virtualTimeMs;
              metrics.sagaCompletionTimeMs = virtualTimeMs - sagaRuntime.startedAtMs;
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "saga.completed",
                  sagaId: wf.sagaId,
                  finalState: "COMPENSATED",
                },
                `Saga Fully Compensated (${wf.sagaId})`,
                `All previously committed forward steps rolled back via business compensations.`,
                sagaRuntime.steps.map((s) => s.participantId)
              );
            }
          } else {
            metrics.compensationFailures += 1;
            stepRt.compensationError = compRes.reason;
            const retryPol = stepDef.retryPolicy;
            const isIrreversible = stepDef.compensation?.reversible === "irreversible" ||
              stepDef.compensation?.forceOutcome === "compensation_fail_irreversible";

            if (
              !isIrreversible &&
              retryPol.enabled &&
              item.attempt < Math.min(retryPol.maxAttempts, parsed.limits.maxRetriesPerStep)
            ) {
              metrics.retryCount += 1;
              schedule({
                kind: "saga_comp_execute",
                atMs: virtualTimeMs + retryPol.baseDelayMs,
                stepId: stepDef.id,
                attempt: item.attempt + 1,
              });
            } else {
              stepRt.status = "COMPENSATION_FAILED";
              stepRt.compensationStatus = "failed";
              sagaRuntime.state = "MANUAL_INTERVENTION_REQUIRED";
              sagaRuntime.completedAtMs = virtualTimeMs;
              metrics.manualInterventionCount += 1;
              sagaRuntime.failureChain.push(
                `Compensation failed for ${stepDef.label}: ${compRes.reason}`
              );
              failurePropagationChain.push(
                `MANUAL_INTERVENTION_REQUIRED: Compensation failed on ${stepDef.label} (${compRes.reason})`
              );
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "saga.compensation.failed",
                  sagaId: wf.sagaId,
                  stepId: stepDef.id,
                  participantId: p.id,
                  reason: compRes.reason,
                },
                `Compensation FAILED (${stepDef.label})`,
                compRes.reason,
                [p.id, "saga-orchestrator"]
              );
              emitFrame(
                {
                  ...nextEvtBase(),
                  type: "saga.manual_intervention.required",
                  sagaId: wf.sagaId,
                  stepId: stepDef.id,
                  reason: compRes.reason,
                },
                `Manual Intervention Required (${wf.sagaId})`,
                `Automatic compensation exhausted/irreversible on '${stepDef.label}'. Operator recovery required.`,
                [p.id]
              );
            }
          }
          break;
        }

        // ==============================
        // OUTBOX DISPATCHER
        // ==============================
        case "outbox_dispatch": {
          const ob = outboxRecords.find((o) => o.id === item.recordId);
          if (!ob) break;
          const p = participants[ob.participantId];
          if (!p) break;

          ob.attempts = item.attempt;
          if (!p.online || !p.outboxDispatcherHealthy) {
            ob.status = "OUTBOX_DISPATCH_FAILED";
            metrics.outboxFailedCount += 1;
            failurePropagationChain.push(
              `Outbox dispatch failed on ${p.label} for ${ob.eventType} (attempt ${item.attempt})`
            );
            emitFrame(
              {
                ...nextEvtBase(item.causationId),
                type: "transaction.outbox.event",
                recordId: ob.id,
                participantId: p.id,
                status: "OUTBOX_DISPATCH_FAILED",
              },
              `Outbox Dispatch Failed (${ob.eventType})`,
              `${p.label} outbox dispatcher unavailable; durable outbox record retained for retry.`,
              [p.id]
            );
            if (item.attempt < parsed.limits.maxRetriesPerStep) {
              ob.status = "OUTBOX_RETRY_SCHEDULED";
              schedule({
                kind: "outbox_dispatch",
                atMs: virtualTimeMs + 90,
                recordId: ob.id,
                attempt: item.attempt + 1,
                eventType: item.eventType,
                correlationId: item.correlationId,
                causationId: item.causationId,
              });
            }
          } else {
            ob.status = "OUTBOX_MESSAGE_PUBLISHED";
            metrics.outboxPublishedCount += 1;
            if (parsed.workflow.protocol === "saga_choreography") {
              const chMsgId = `ch_msg_${++msgCounter}`;
              const lat = calcLatency();
              schedule({
                kind: "choreo_deliver",
                atMs: virtualTimeMs + lat,
                eventType: ob.eventType,
                messageId: chMsgId,
                producer: p.id,
                correlationId: item.correlationId,
                causationId: ob.id,
              });
              if (rng() < parsed.network.duplicateProbability || duplicateNextForTarget === ob.eventType) {
                duplicateNextForTarget = null;
                metrics.duplicateDeliveries += 1;
                schedule({
                  kind: "choreo_deliver",
                  atMs: virtualTimeMs + lat + 20,
                  eventType: ob.eventType,
                  messageId: chMsgId,
                  producer: p.id,
                  correlationId: item.correlationId,
                  causationId: ob.id,
                  isDuplicate: true,
                });
              }
            }
          }
          break;
        }

        // ==============================
        // SAGA CHOREOGRAPHY
        // ==============================
        case "choreo_deliver": {
          if (parsed.workflow.protocol !== "saga_choreography" || !sagaRuntime) break;
          const wf = parsed.workflow as SagaChoreographyWorkflow;

          if (sagaRuntime.state === "CREATED") {
            sagaRuntime.state = "RUNNING";
            sagaRuntime.startedAtMs = virtualTimeMs;
            emitFrame(
              {
                ...nextEvtBase(),
                type: "saga.started",
                sagaId: wf.sagaId,
                mode: "choreography",
                workflowVersion: wf.workflowVersion,
              },
              `Saga Choreography Started (${wf.sagaId})`,
              `Initial domain event '${item.eventType}' emitted without a central orchestrator.`,
              [item.producer]
            );
          }

          // Match subscriptions listening to item.eventType
          const matchingSubs = wf.subscriptions.filter(
            (s) => s.consumesEvent === item.eventType
          );

          for (const sub of matchingSubs) {
            const p = participants[sub.participantId];
            const stepRt = sagaRuntime.steps.find((s) => s.stepId === sub.id);
            if (!p || !stepRt) continue;

            const pCfg = parsed.participants.find((pc) => pc.id === p.id);
            if (pCfg?.inboxEnabled) {
              const seen = inboxRecords.find(
                (i) => i.messageId === item.messageId && i.consumerId === p.id
              );
              if (seen) {
                seen.duplicateCount += 1;
                metrics.deduplicatedCount += 1;
                emitFrame(
                  {
                    ...nextEvtBase(item.messageId),
                    type: "transaction.inbox.deduplicated",
                    messageId: item.messageId,
                    consumerId: p.id,
                  },
                  `Choreography Inbox Deduplicated (${sub.consumesEvent})`,
                  `${p.label} ignored duplicate '${sub.consumesEvent}' (messageId=${item.messageId}).`,
                  [p.id]
                );
                continue;
              }
              inboxRecords.push({
                messageId: item.messageId,
                consumerId: p.id,
                eventType: item.eventType,
                processedAtMs: virtualTimeMs,
                duplicateCount: 0,
              });
            }

            if (stepRt.status === "SUCCEEDED") continue;

            stepRt.status = "RUNNING";
            stepRt.startedAtMs = virtualTimeMs;
            stepRt.attempts += 1;

            const res = validateAndApplyLocalOperation(p.store, sub.operation, true);
            if (res.ok) {
              const isCompensationSub =
                sub.operation.kind.startsWith("RELEASE_") ||
                sub.operation.kind.startsWith("VOID_") ||
                sub.operation.kind.startsWith("REFUND_") ||
                sub.operation.kind.startsWith("CANCEL_");

              if (isCompensationSub) {
                stepRt.status = "COMPENSATED";
                stepRt.compensationStatus = "compensated";
                metrics.compensationCount += 1;
              } else {
                stepRt.status = "SUCCEEDED";
              }
              stepRt.finishedAtMs = virtualTimeMs;

              // Commit local outbox record for emitted event
              const obId = `ob_${wf.sagaId}_${sub.id}_${virtualTimeMs}`;
              outboxRecords.push({
                id: obId,
                participantId: p.id,
                transactionId: wf.sagaId,
                eventType: sub.emitsOnSuccess,
                payloadSummary: res.summary,
                createdAtMs: virtualTimeMs,
                status: "OUTBOX_RECORD_CREATED",
                attempts: 0,
              });
              schedule({
                kind: "outbox_dispatch",
                atMs: virtualTimeMs + 10,
                recordId: obId,
                attempt: 1,
                eventType: sub.emitsOnSuccess,
                correlationId: wf.sagaId,
                causationId: item.messageId,
              });

              emitFrame(
                {
                  ...nextEvtBase(item.messageId),
                  type: "saga.step.completed",
                  sagaId: wf.sagaId,
                  stepId: sub.id,
                  participantId: p.id,
                },
                `Choreography Reaction: ${p.label} → ${sub.emitsOnSuccess}`,
                `Consumed '${sub.consumesEvent}', committed ${res.summary}, wrote outbox event '${sub.emitsOnSuccess}'.`,
                [p.id]
              );
            } else {
              stepRt.status = "FAILED";
              stepRt.lastError = res.reason;
              sagaRuntime.state = "COMPENSATING";
              failurePropagationChain.push(
                `${p.label} failed on '${sub.consumesEvent}': ${res.reason}`
              );
              emitFrame(
                {
                  ...nextEvtBase(item.messageId),
                  type: "saga.step.failed",
                  sagaId: wf.sagaId,
                  stepId: sub.id,
                  participantId: p.id,
                  reason: res.reason,
                },
                `Choreography Step Failed: ${p.label}`,
                `${res.reason}. Emitting failure domain event '${sub.emitsOnFailure ?? "SagaCompensationRequested"}'.`,
                [p.id]
              );

              if (sub.emitsOnFailure) {
                const obId = `ob_fail_${wf.sagaId}_${sub.id}`;
                outboxRecords.push({
                  id: obId,
                  participantId: p.id,
                  transactionId: wf.sagaId,
                  eventType: sub.emitsOnFailure,
                  payloadSummary: res.reason,
                  createdAtMs: virtualTimeMs,
                  status: "OUTBOX_RECORD_CREATED",
                  attempts: 0,
                });
                schedule({
                  kind: "outbox_dispatch",
                  atMs: virtualTimeMs + 10,
                  recordId: obId,
                  attempt: 1,
                  eventType: sub.emitsOnFailure,
                  correlationId: wf.sagaId,
                  causationId: item.messageId,
                });
              }
            }
          }

          // Check choreography completion
          if (
            sagaRuntime.steps.length > 0 &&
            sagaRuntime.steps.every(
              (s) => s.status === "SUCCEEDED" || s.status === "COMPENSATED"
            )
          ) {
            const anyComp = sagaRuntime.steps.some((s) => s.status === "COMPENSATED");
            sagaRuntime.state = anyComp ? "COMPENSATED" : "COMPLETED";
            sagaRuntime.completedAtMs = virtualTimeMs;
            metrics.sagaCompletionTimeMs = virtualTimeMs - sagaRuntime.startedAtMs;
            emitFrame(
              {
                ...nextEvtBase(item.messageId),
                type: "saga.completed",
                sagaId: wf.sagaId,
                finalState: sagaRuntime.state,
              },
              `Saga Choreography ${sagaRuntime.state}`,
              `All subscribed domain event reactions settled without a central coordinator.`,
              wf.subscriptions.map((s) => s.participantId)
            );
          }
          break;
        }
      }
    }

    // Recompute final blocking/lock holding totals accurately
    const finalLastFrame = frames[frames.length - 1];
    const hasHardError =
      finalLastFrame?.runtimeState?.distributedTransactionState?.invariants.allPassed ===
      false;

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: parsed.participants[0]?.id ?? "tx-coordinator",
      request: {
        id: parsed.id,
        method: "POST",
        path: `/tx/${parsed.protocol}/${parsed.id}`,
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: parsed.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: 20,
        edgeDurationMs: parsed.network.baseLatencyMs,
      },
    };

    return {
      runId,
      architectureId: "arch_distributed_tx_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `tx_${parsed.id}_${parsed.seed}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: parsed.participants.map((p) => p.id),
      traversedEdgeIds: [],
      configuration,
      events,
      totalDurationMs: virtualTimeMs,
      totalEvents: events.length,
      totalHops: messages.length,
      outcome: hasHardError ? "failure" : "success",
      terminalReason: `Distributed transaction (${parsed.protocol}) finished at ${virtualTimeMs}ms.`,
      frames,
    };
  }
}
