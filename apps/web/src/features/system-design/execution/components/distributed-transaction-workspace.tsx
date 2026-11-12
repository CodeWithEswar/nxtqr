"use client";

import * as React from "react";
import {
  DatabaseIcon,
  CloseIcon,
  PlayIcon,
  ShieldIcon,
  ActivityIcon,
  LayersIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  DISTRIBUTED_TRANSACTION_PRESET_METADATA,
  type DistributedTransactionPresetId,
  createDistributedTransactionPresetScenario,
  type TransactionParticipantRuntime,
  type TwoPCTransactionRuntime,
} from "@nxtqr/architecture-execution";

type TxWorkspaceTab =
  | "twopc"
  | "saga"
  | "participants"
  | "logs_locks"
  | "messaging"
  | "invariants";

export function DistributedTransactionWorkspace() {
  const toggleDistributedTxWorkspace = useExecutionStore(
    (s) => s.toggleDistributedTxWorkspace
  );
  const activeDistributedTxScenario = useExecutionStore(
    (s) => s.activeDistributedTxScenario
  );
  const setDistributedTxScenario = useExecutionStore(
    (s) => s.setDistributedTxScenario
  );
  const runDistributedTxSimulation = useExecutionStore(
    (s) => s.runDistributedTxSimulation
  );
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore(
    (s) => s.playbackState.currentStepIndex
  );

  const [activeTab, setActiveTab] = React.useState<TxWorkspaceTab>("twopc");
  const [selectedPreset, setSelectedPreset] =
    React.useState<DistributedTransactionPresetId>(
      (activeDistributedTxScenario?.presetId as DistributedTransactionPresetId) ||
        "successful_2pc"
    );

  React.useEffect(() => {
    if (!activeDistributedTxScenario) {
      const initial = createDistributedTransactionPresetScenario(selectedPreset);
      setDistributedTxScenario(initial);
    } else if (
      activeDistributedTxScenario.presetId &&
      DISTRIBUTED_TRANSACTION_PRESET_METADATA.some(
        (p) => p.id === activeDistributedTxScenario.presetId
      )
    ) {
      setSelectedPreset(
        activeDistributedTxScenario.presetId as DistributedTransactionPresetId
      );
      setActiveTab(
        activeDistributedTxScenario.protocol === "two_phase_commit"
          ? "twopc"
          : "saga"
      );
    }
  }, [activeDistributedTxScenario, selectedPreset, setDistributedTxScenario]);

  const activeScenario =
    activeDistributedTxScenario ||
    createDistributedTransactionPresetScenario(selectedPreset);

  const currentFrame = trace?.frames?.[currentStepIndex];
  const txState = currentFrame?.runtimeState?.distributedTransactionState;
  const metrics = txState?.metrics;
  const participantsList: TransactionParticipantRuntime[] = txState
    ? Object.values(txState.participants)
    : [];
  const twoPCList: TwoPCTransactionRuntime[] = txState
    ? Object.values(txState.twoPCTransactions)
    : [];
  const saga = txState?.saga ?? null;
  const locks = txState?.locks ?? [];
  const durableLogs = txState?.durableLogs ?? [];
  const messages = txState?.messages ?? [];
  const outboxRecords = txState?.outboxRecords ?? [];
  const inboxRecords = txState?.inboxRecords ?? [];
  const idempotencyRecords = txState?.idempotencyRecords ?? [];
  const failureChain = txState?.failurePropagationChain ?? [];
  const invariants = txState?.invariants;

  const handlePresetChange = (value: string) => {
    const presetId = value as DistributedTransactionPresetId;
    setSelectedPreset(presetId);
    const next = createDistributedTransactionPresetScenario(presetId);
    setDistributedTxScenario(next);
    setActiveTab(next.protocol === "two_phase_commit" ? "twopc" : "saga");
    runDistributedTxSimulation(next);
  };

  const handleSwitchProtocolQuick = (
    protocolPreset: DistributedTransactionPresetId
  ) => {
    handlePresetChange(protocolPreset);
  };

  const handleToggleOutbox = () => {
    const next = {
      ...activeScenario,
      participants: activeScenario.participants.map((p) => ({
        ...p,
        outboxEnabled: !p.outboxEnabled,
      })),
    };
    setDistributedTxScenario(next);
    runDistributedTxSimulation(next);
  };

  const handleToggleIdempotency = () => {
    const next = {
      ...activeScenario,
      participants: activeScenario.participants.map((p) => ({
        ...p,
        idempotencyEnabled: !p.idempotencyEnabled,
        inboxEnabled: !p.inboxEnabled,
      })),
    };
    setDistributedTxScenario(next);
    runDistributedTxSimulation(next);
  };

  const handleRunSimulation = () => {
    runDistributedTxSimulation(activeScenario);
  };

  const allOutboxOn = activeScenario.participants.every((p) => p.outboxEnabled);
  const allIdemOn = activeScenario.participants.every(
    (p) => p.idempotencyEnabled
  );

  return (
    <div
      role="region"
      aria-label="Distributed Transactions, Two-Phase Commit & Saga Workspace"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 h-[460px] max-w-[1260px] mx-auto",
        "bg-surface-01 border border-border-default rounded-md shadow-level-2 flex flex-col overflow-hidden"
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-02">
        <div className="flex items-center gap-2 min-w-0">
          <DatabaseIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <span className="text-xs font-semibold text-foreground tracking-tight truncate">
            Distributed Transactions, Two-Phase Commit &amp; Saga Simulator
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border-default text-text-muted rounded-md shrink-0"
          >
            {activeScenario.protocol.toUpperCase()}
          </Badge>
          {invariants && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono rounded-md shrink-0",
                invariants.allPassed
                  ? "border-border-default text-text-secondary"
                  : "border-destructive text-destructive"
              )}
            >
              {invariants.allPassed
                ? "Invariants: PASS"
                : `Violations: ${invariants.violations.length}`}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-7 w-[250px] text-[11px] font-mono bg-surface-03 border-border-default text-foreground rounded-md">
              <SelectValue placeholder="Select transaction preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground rounded-md max-h-[340px]">
              {DISTRIBUTED_TRANSACTION_PRESET_METADATA.map((meta) => (
                <SelectItem
                  key={meta.id}
                  value={meta.id}
                  className="text-[11px] font-mono focus:bg-surface-04"
                >
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-2.5 text-[11px] font-mono bg-foreground text-background hover:bg-text-secondary rounded-md gap-1.5"
          >
            <PlayIcon className="w-3 h-3" />
            <span>Run Tx Sim</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleDistributedTxWorkspace(false)}
            aria-label="Close Distributed Transactions Workspace"
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs + Protocol/Policy Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: "twopc", label: "2PC Graph & Voting" },
              { id: "saga", label: "Saga & Compensations" },
              { id: "participants", label: "Participants & Stores" },
              { id: "logs_locks", label: "Durable Logs & Locks" },
              { id: "messaging", label: "Outbox, Inbox & Idemp." },
              { id: "invariants", label: "Invariants & Metrics" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-surface-04 text-foreground font-semibold border border-border-strong shadow-level-3"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-02 border border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => handleSwitchProtocolQuick("successful_2pc")}
            className={cn(
              "px-2 py-1 rounded-md border",
              activeScenario.protocol === "two_phase_commit"
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            2PC
          </button>
          <button
            type="button"
            onClick={() =>
              handleSwitchProtocolQuick("successful_saga_orchestration")
            }
            className={cn(
              "px-2 py-1 rounded-md border",
              activeScenario.protocol === "saga_orchestration"
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            Saga Orch
          </button>
          <button
            type="button"
            onClick={() =>
              handleSwitchProtocolQuick("successful_saga_choreography")
            }
            className={cn(
              "px-2 py-1 rounded-md border",
              activeScenario.protocol === "saga_choreography"
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            Choreo
          </button>
          <button
            type="button"
            onClick={handleToggleOutbox}
            className={cn(
              "px-2 py-1 rounded-md border",
              allOutboxOn
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            Outbox: {allOutboxOn ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={handleToggleIdempotency}
            className={cn(
              "px-2 py-1 rounded-md border",
              allIdemOn
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
            )}
          >
            Idemp: {allIdemOn ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Live Step Banner */}
      <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-02 flex items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <ActivityIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
          <span className="text-foreground font-semibold truncate">
            {currentFrame?.stepTitle ?? activeScenario.name}
          </span>
          <span className="text-text-muted truncate hidden sm:inline">
            — {currentFrame?.stepExplanation ?? activeScenario.description}
          </span>
        </div>
        <span className="text-text-secondary shrink-0">
          {currentFrame
            ? `t=${currentFrame.virtualTimeMs}ms · Frame ${currentStepIndex + 1}/${trace?.frames.length ?? 0}`
            : "Press Run Tx Sim"}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 bg-surface-01">
        {!txState ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <LayersIcon className="w-6 h-6 text-text-muted" />
            <p className="text-xs font-mono text-text-secondary">
              No distributed transaction trace loaded. Select a preset or click &quot;Run Tx Sim&quot;.
            </p>
          </div>
        ) : (
          <>
            {/* TAB 1: 2PC Graph & Voting */}
            {activeTab === "twopc" && (
              <div className="space-y-3">
                {twoPCList.length === 0 ? (
                  <div className="p-3 rounded-md bg-surface-02 border border-border-default text-xs font-mono text-text-muted">
                    Current preset uses <span className="text-foreground">{activeScenario.protocol}</span>. Open the &quot;Saga &amp; Compensations&quot; tab or click &quot;2PC&quot; above.
                  </div>
                ) : (
                  twoPCList.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="rounded-md border border-border-default bg-surface-02 p-3 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-foreground">
                            Coordinator ({tx.coordinatorId}) · {tx.transactionId}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono rounded-md border-border-strong text-foreground"
                          >
                            {tx.state}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono rounded-md",
                              tx.coordinatorOnline
                                ? "border-border-default text-text-secondary"
                                : "border-destructive text-destructive"
                            )}
                          >
                            {tx.coordinatorOnline ? "COORDINATOR ONLINE" : "COORDINATOR CRASHED"}
                          </Badge>
                        </div>
                        <div className="text-[11px] font-mono text-text-secondary">
                          Decision:{" "}
                          <span className="text-foreground font-semibold">
                            {tx.decision ?? "UNDECIDED"}
                          </span>{" "}
                          ({tx.decisionReason})
                        </div>
                      </div>

                      {tx.inDoubtParticipants.length > 0 && (
                        <div className="px-2.5 py-1.5 rounded-md bg-surface-03 border border-warning text-[10px] font-mono text-warning">
                          BLOCKING / IN_DOUBT: [{tx.inDoubtParticipants.join(", ")}] durably prepared and holding exclusive locks while awaiting global decision.
                        </div>
                      )}

                      {/* Participant Voting Matrix */}
                      <div className="rounded-md border border-border-subtle overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px] font-mono">
                          <thead>
                            <tr className="border-b border-border-subtle bg-surface-03 text-text-secondary">
                              <th className="p-2">Participant</th>
                              <th className="p-2">Status</th>
                              <th className="p-2">Local TX State</th>
                              <th className="p-2">Vote</th>
                              <th className="p-2">In-Doubt</th>
                              <th className="p-2">Decision ACK</th>
                              <th className="p-2">Held Locks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle bg-surface-01">
                            {tx.enlistedParticipants.map((pid) => {
                              const p = txState.participants[pid];
                              const vote = tx.votes[pid] ?? "PENDING";
                              const localState = p?.localTxStates[tx.transactionId] ?? "IDLE";
                              const isInDoubt = p?.inDoubtTxIds.includes(tx.transactionId) ?? false;
                              return (
                                <tr key={pid}>
                                  <td className="p-2 font-semibold text-foreground">
                                    {p?.label ?? pid}
                                  </td>
                                  <td className="p-2 text-text-secondary">
                                    {p?.online ? "ONLINE" : "CRASHED"}
                                  </td>
                                  <td className="p-2 text-foreground">{localState}</td>
                                  <td className="p-2">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[9px] rounded-md",
                                        vote === "YES"
                                          ? "border-border-strong text-foreground"
                                          : vote === "NO"
                                            ? "border-destructive text-destructive"
                                            : "border-border-default text-text-muted"
                                      )}
                                    >
                                      {vote}
                                    </Badge>
                                  </td>
                                  <td className="p-2 text-text-secondary">
                                    {isInDoubt ? "YES (BLOCKED)" : "No"}
                                  </td>
                                  <td className="p-2 text-text-secondary">
                                    {tx.acks[pid] ? "ACKED" : "Pending"}
                                  </td>
                                  <td className="p-2 text-text-muted">
                                    {p && p.heldLocks.length > 0 ? p.heldLocks.join(", ") : "None"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: Saga & Compensations */}
            {activeTab === "saga" && (
              <div className="space-y-3">
                {!saga ? (
                  <div className="p-3 rounded-md bg-surface-02 border border-border-default text-xs font-mono text-text-muted">
                    Current preset runs <span className="text-foreground">Two-Phase Commit</span>. Click &quot;Saga Orch&quot; or &quot;Choreo&quot; to inspect Saga workflows.
                  </div>
                ) : (
                  <>
                    <div className="p-2.5 rounded-md bg-surface-02 border border-border-default flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-semibold">
                          {saga.sagaId} (v{saga.workflowVersion} · {saga.mode.toUpperCase()})
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] rounded-md",
                            saga.state === "MANUAL_INTERVENTION_REQUIRED"
                              ? "border-destructive text-destructive"
                              : saga.state === "COMPLETED"
                                ? "border-border-strong text-foreground"
                                : "border-border-default text-text-secondary"
                          )}
                        >
                          {saga.state}
                        </Badge>
                      </div>
                      <span className="text-text-muted">{saga.partialCompletionSummary}</span>
                    </div>

                    {saga.state === "MANUAL_INTERVENTION_REQUIRED" && (
                      <div className="px-3 py-2 rounded-md bg-surface-03 border border-destructive text-[11px] font-mono text-destructive">
                        MANUAL INTERVENTION REQUIRED: Compensation retries exhausted or irreversible action encountered. Saga cannot roll back automatically like ACID abort.
                      </div>
                    )}

                    {/* Workflow Steps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {saga.steps.map((st, idx) => (
                        <div
                          key={st.stepId}
                          className={cn(
                            "p-2.5 rounded-md border space-y-1 text-[10px] font-mono",
                            st.status === "SUCCEEDED"
                              ? "bg-surface-04 border-border-strong"
                              : st.status === "FAILED" || st.status === "COMPENSATION_FAILED"
                                ? "bg-surface-03 border-destructive"
                                : "bg-surface-02 border-border-default"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold">
                              {idx + 1}. {st.label}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] rounded-md border-border-default text-text-secondary"
                            >
                              {st.status}
                            </Badge>
                          </div>
                          <div className="text-text-muted">
                            Service: {st.participantId} · Attempts: {st.attempts}
                          </div>
                          {st.compensationStatus && st.compensationStatus !== "none" && (
                            <div className="text-text-secondary">
                              Compensation: {st.compensationStatus.toUpperCase()}
                            </div>
                          )}
                          {(st.lastError || st.compensationError) && (
                            <div className="text-destructive truncate" title={st.compensationError || st.lastError}>
                              {st.compensationError || st.lastError}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {saga.compensationOrder.length > 0 && (
                      <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle text-[10px] font-mono text-text-secondary">
                        Reverse Compensation Sequence: [{saga.compensationOrder.join(" → ")}]
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 3: Participants & Local Stores */}
            {activeTab === "participants" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {participantsList.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5 text-[10px] font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {p.label} ({p.serviceId})
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] rounded-md",
                          p.online
                            ? "border-border-strong text-foreground"
                            : "border-destructive text-destructive"
                        )}
                      >
                        {p.online ? "ONLINE" : "CRASHED"}
                      </Badge>
                    </div>
                    <div className="text-text-secondary space-y-0.5">
                      <div>Inventory: {JSON.stringify(p.store.inventory)}</div>
                      <div>Balances: {JSON.stringify(p.store.balances)}</div>
                      <div>Orders: {JSON.stringify(p.store.orders)}</div>
                      <div>Shipments: {JSON.stringify(p.store.shipments)}</div>
                      <div>Held Locks: {p.heldLocks.length > 0 ? p.heldLocks.join(", ") : "None"}</div>
                      <div>In-Doubt TXs: {p.inDoubtTxIds.length > 0 ? p.inDoubtTxIds.join(", ") : "None"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: Durable Logs & Locks */}
            {activeTab === "logs_locks" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Durable Recovery Logs ({durableLogs.length})
                  </div>
                  <div className="space-y-1 max-h-[240px] overflow-y-auto">
                    {durableLogs.length === 0 ? (
                      <div className="text-[10px] font-mono text-text-muted">No durable WAL records written yet.</div>
                    ) : (
                      durableLogs.map((rec) => (
                        <div
                          key={rec.seq}
                          className="p-1.5 rounded-md bg-surface-01 border border-border-subtle text-[10px] font-mono"
                        >
                          <div className="flex items-center justify-between text-foreground">
                            <span>#{rec.seq} [{rec.role}:{rec.ownerId}] {rec.recordType}</span>
                            <span className="text-text-muted">t={rec.atMs}ms</span>
                          </div>
                          <div className="text-text-secondary">{rec.detail}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-2">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Exclusive Resource Locks ({locks.length})
                  </div>
                  <div className="space-y-1 max-h-[240px] overflow-y-auto">
                    {locks.length === 0 ? (
                      <div className="text-[10px] font-mono text-text-muted">No exclusive resource locks acquired.</div>
                    ) : (
                      locks.map((lk) => (
                        <div
                          key={lk.id}
                          className="p-1.5 rounded-md bg-surface-01 border border-border-subtle text-[10px] font-mono space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-foreground font-semibold">
                              {lk.participantId}:{lk.resourceKey} (Owner: {lk.ownerTxId})
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] rounded-md border-border-default text-text-secondary"
                            >
                              {lk.releasedAtMs === null ? "HELD" : `RELEASED @ ${lk.releasedAtMs}ms`}
                            </Badge>
                          </div>
                          <div className="text-text-muted">
                            Waiters: {lk.waiters.length > 0 ? lk.waiters.join(", ") : "None"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Outbox, Inbox & Idempotency */}
            {activeTab === "messaging" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-1.5">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Transactional Outbox ({outboxRecords.length})
                  </div>
                  <div className="space-y-1 max-h-[230px] overflow-y-auto text-[10px] font-mono">
                    {outboxRecords.length === 0 ? (
                      <div className="text-text-muted">No outbox records created.</div>
                    ) : (
                      outboxRecords.map((ob) => (
                        <div key={ob.id} className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-foreground">{ob.participantId}: {ob.eventType}</div>
                          <div className="text-text-secondary">{ob.status} (att={ob.attempts})</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-1.5">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Inbox &amp; Idempotency ({inboxRecords.length} / {idempotencyRecords.length})
                  </div>
                  <div className="space-y-1 max-h-[230px] overflow-y-auto text-[10px] font-mono">
                    {inboxRecords.map((ib) => (
                      <div key={`${ib.consumerId}-${ib.messageId}`} className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                        <div className="text-foreground">INBOX {ib.consumerId}: {ib.messageId}</div>
                        <div className="text-text-secondary">Duplicates absorbed: {ib.duplicateCount}</div>
                      </div>
                    ))}
                    {idempotencyRecords.map((ir) => (
                      <div key={`${ir.participantId}-${ir.operationId}`} className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                        <div className="text-foreground">IDEMP {ir.operationId}</div>
                        <div className="text-text-secondary">{ir.status}: {ir.resultSummary}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-1.5">
                  <div className="text-[11px] font-mono font-semibold text-foreground">
                    Recent Transport Messages ({messages.length})
                  </div>
                  <div className="space-y-1 max-h-[230px] overflow-y-auto text-[10px] font-mono">
                    {[...messages].reverse().slice(0, 25).map((m) => (
                      <div key={m.id} className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                        <div className="text-foreground">
                          {m.from} → {m.to}: {m.messageType} {m.isDuplicate ? "(DUP)" : ""}
                        </div>
                        <div className="text-text-muted">
                          {m.status.toUpperCase()} {m.dropReason ? `(${m.dropReason})` : ""} · t={m.deliverAtMs}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Invariants & Comparison */}
            {activeTab === "invariants" && invariants && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {[
                    { label: "Committed", val: `${metrics?.transactionsCommitted ?? 0}` },
                    { label: "Aborted", val: `${metrics?.transactionsAborted ?? 0}` },
                    { label: "In-Doubt / Blocked", val: `${metrics?.inDoubtCount ?? 0} / ${metrics?.blockedCount ?? 0}` },
                    { label: "Compensations", val: `${metrics?.compensationCount ?? 0} (${metrics?.compensationFailures ?? 0} fail)` },
                    { label: "Deduplicated / Retries", val: `${metrics?.deduplicatedCount ?? 0} / ${metrics?.retryCount ?? 0}` },
                    { label: "Outbox Pub / Fail", val: `${metrics?.outboxPublishedCount ?? 0} / ${metrics?.outboxFailedCount ?? 0}` },
                  ].map((m) => (
                    <div key={m.label} className="p-2 rounded-md bg-surface-02 border border-border-subtle font-mono">
                      <div className="text-[10px] text-text-muted">{m.label}</div>
                      <div className="text-xs font-semibold text-foreground mt-0.5">{m.val}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-1.5 text-[10px] font-mono">
                    <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
                      <span>Correctness Invariants</span>
                    </div>
                    {[
                      ["No 2PC COMMIT without all YES votes", invariants.noCommitWithoutAllYesOk],
                      ["Durable global decision immutable", invariants.durableDecisionImmutableOk],
                      ["No participant split commit/abort", invariants.noSplitCommitAbortOk],
                      ["Prepared state survives modeled crash", invariants.preparedSurvivesCrashOk],
                      ["Locks released after terminal resolution", invariants.locksReleasedAfterTerminalOk],
                      ["Idempotency prevents double apply", invariants.idempotencyPreservedOk],
                      ["Saga compensation failures remain visible", invariants.compensationFailureVisibleOk],
                    ].map(([label, ok]) => (
                      <div key={String(label)} className="flex items-center justify-between">
                        <span className="text-text-secondary">{String(label)}</span>
                        <span className={ok ? "text-foreground" : "text-destructive"}>
                          {ok ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border border-border-default bg-surface-02 p-2.5 space-y-1.5 text-[10px] font-mono">
                    <div className="text-[11px] font-semibold text-foreground">
                      Failure Propagation Chain ({failureChain.length})
                    </div>
                    {failureChain.length === 0 ? (
                      <div className="text-text-muted">Clean run — no failures or lock blocking recorded.</div>
                    ) : (
                      <ul className="space-y-1 text-text-secondary">
                        {failureChain.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

