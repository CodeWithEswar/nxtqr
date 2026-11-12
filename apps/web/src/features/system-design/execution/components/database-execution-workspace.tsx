"use client";

import * as React from "react";
import {
  CloseIcon,
  PlayIcon,
  LayersIcon,
  CheckIcon,
} from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  DATABASE_PRESET_METADATA,
  type DatabaseScenarioPresetId,
  type PlanOperator,
  type DatabaseRow,
  createDatabasePresetScenario,
} from "@nxtqr/architecture-execution";

export interface DatabaseExecutionWorkspaceProps {
  onClose?: () => void;
}

type TabType = "plan" | "data" | "transactions" | "replication";

export function DatabaseExecutionWorkspace({ onClose }: DatabaseExecutionWorkspaceProps) {
  const isDatabaseWorkspaceOpen = useExecutionStore((s) => s.isDatabaseWorkspaceOpen);
  const toggleDatabaseWorkspace = useExecutionStore((s) => s.toggleDatabaseWorkspace);
  const activeDatabaseScenario = useExecutionStore((s) => s.activeDatabaseScenario);
  const playbackState = useExecutionStore((s) => s.playbackState);
  const runDatabaseSimulation = useExecutionStore((s) => s.runDatabaseSimulation);
  const executeCustomDatabaseQuery = useExecutionStore((s) => s.executeCustomDatabaseQuery);

  const [activeTab, setActiveTab] = React.useState<TabType>("plan");
  const [sqlInput, setSqlInput] = React.useState(
    activeDatabaseScenario?.primaryQuery || "SELECT * FROM products WHERE id = 42;"
  );
  const [selectedOperatorId, setSelectedOperatorId] = React.useState<string | null>(null);

  // Sync sql input when scenario changes
  React.useEffect(() => {
    if (activeDatabaseScenario?.primaryQuery) {
      setSqlInput(activeDatabaseScenario.primaryQuery);
    }
  }, [activeDatabaseScenario]);

  if (!isDatabaseWorkspaceOpen) {
    return null;
  }

  const currentFrame = playbackState.currentFrame;
  const dbState = currentFrame?.runtimeState?.databaseState;
  const lastPlan = dbState?.lastQueryPlan;
  const metrics = dbState?.queryMetrics;

  const handleRunQuery = () => {
    executeCustomDatabaseQuery(sqlInput);
  };

  const handleSelectPreset = (presetId: DatabaseScenarioPresetId) => {
    const sc = createDatabasePresetScenario(presetId);
    setSqlInput(sc.primaryQuery);
    runDatabaseSimulation(sc);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else toggleDatabaseWorkspace(false);
  };

  const operatorsList: PlanOperator[] = lastPlan ? Object.values(lastPlan.operators) : [];
  const selectedOperator = selectedOperatorId
    ? lastPlan?.operators[selectedOperatorId]
    : operatorsList[0];

  const intermediateRows: DatabaseRow[] = selectedOperator
    ? dbState?.intermediateResults[selectedOperator.id] || selectedOperator.intermediateRows || []
    : [];

  const columns = intermediateRows.length > 0 ? Object.keys(intermediateRows[0]) : [];

  return (
    <div
      role="region"
      aria-label="Database Execution Workspace"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-01 border-t border-border-default shadow-level-3 flex flex-col max-h-[500px] h-[500px] select-none transition-transform"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-02 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-surface-03 border border-border-default text-text-secondary">
            <LayersIcon className="w-3.5 h-3.5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                Database Execution Engine · Query Optimization, MVCC & Replication
              </span>
              <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
                {activeDatabaseScenario?.title || "B-Tree Primary Key Lookup"}
              </Badge>
              {metrics?.isStaleRead && (
                <Badge variant="outline" className="text-[9px] font-mono border-destructive text-destructive">
                  Stale Read Detected
                </Badge>
              )}
              {dbState?.deadlocks && dbState.deadlocks.length > 0 && (
                <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-foreground">
                  Deadlock Resolved ({dbState.deadlocks.length})
                </Badge>
              )}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              Deterministic Modeled Execution · Virtual Clock: {currentFrame ? `${currentFrame.virtualTimeMs}ms` : "0ms"} · Step {playbackState.currentStepIndex + 1}/{playbackState.totalSteps}
            </div>
          </div>
        </div>

        {/* Tab Switcher & Close */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-01 border border-border-default rounded-md p-0.5">
            <button
              onClick={() => setActiveTab("plan")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors",
                activeTab === "plan"
                  ? "bg-surface-04 text-foreground font-semibold shadow-level-3"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              Query & Plan
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors",
                activeTab === "data"
                  ? "bg-surface-04 text-foreground font-semibold shadow-level-3"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              Data Inspector ({intermediateRows.length})
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors",
                activeTab === "transactions"
                  ? "bg-surface-04 text-foreground font-semibold shadow-level-3"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              Transactions & Locks
            </button>
            <button
              onClick={() => setActiveTab("replication")}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors",
                activeTab === "replication"
                  ? "bg-surface-04 text-foreground font-semibold shadow-level-3"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              Replication & Pool
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground border border-border-default hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Preset Pills Quick Selector Bar */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 bg-surface-01 border-b border-border-subtle overflow-x-auto text-[10px] font-mono shrink-0">
        <span className="text-text-muted text-[10px] shrink-0 font-sans mr-1">Scenarios:</span>
        {(Object.keys(DATABASE_PRESET_METADATA) as DatabaseScenarioPresetId[]).map((pid) => {
          const meta = DATABASE_PRESET_METADATA[pid];
          const isSelected = activeDatabaseScenario?.title === meta.title;
          return (
            <button
              key={pid}
              onClick={() => handleSelectPreset(pid)}
              className={cn(
                "px-2 py-0.5 rounded-md border shrink-0 transition-all",
                isSelected
                  ? "bg-surface-03 border-border-strong text-foreground font-semibold"
                  : "bg-surface-02 border-border-default text-text-muted hover:border-border-hover hover:text-text-secondary"
              )}
            >
              {meta.title}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden p-3 bg-surface-01">
        {activeTab === "plan" && (
          <div className="h-full grid grid-cols-12 gap-3">
            {/* Left: SQL Editor & Stats */}
            <div className="col-span-4 flex flex-col gap-2">
              <div className="flex-1 flex flex-col bg-surface-02 border border-border-default rounded-md p-2.5 overflow-hidden">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border-subtle">
                  <span className="text-[11px] font-mono text-text-secondary font-semibold">Modeled SQL Editor</span>
                  <Button
                    size="sm"
                    onClick={handleRunQuery}
                    className="h-6 px-2.5 text-[10px] font-mono bg-surface-03 hover:bg-surface-04 border border-border-strong text-foreground gap-1"
                  >
                    <PlayIcon className="w-2.5 h-2.5" /> Run Query
                  </Button>
                </div>
                <textarea
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  className="w-full flex-1 bg-surface-01 border border-border-inset rounded-md p-2 text-xs font-mono text-foreground focus:outline-none focus:border-border-hover resize-none shadow-level-3"
                  spellCheck={false}
                />
                <p className="text-[10px] font-sans text-text-muted mt-1.5">
                  Restricted SQL subset supported: SELECT, WHERE, JOIN, ORDER BY, LIMIT, INSERT, UPDATE.
                </p>
              </div>

              {/* Execution Summary Metrics */}
              {metrics && (
                <div className="bg-surface-02 border border-border-default rounded-md p-2.5 grid grid-cols-3 gap-2 text-center shrink-0">
                  <div className="p-1.5 bg-surface-01 border border-border-subtle rounded-md">
                    <div className="text-[9px] font-mono text-text-muted">EXAMINED</div>
                    <div className="text-sm font-mono font-bold text-foreground">{metrics.rowsExamined}</div>
                  </div>
                  <div className="p-1.5 bg-surface-01 border border-border-subtle rounded-md">
                    <div className="text-[9px] font-mono text-text-muted">RETURNED</div>
                    <div className="text-sm font-mono font-bold text-foreground">{metrics.rowsReturned}</div>
                  </div>
                  <div className="p-1.5 bg-surface-01 border border-border-subtle rounded-md">
                    <div className="text-[9px] font-mono text-text-muted">DURATION</div>
                    <div className="text-sm font-mono font-bold text-foreground">{metrics.durationMs}ms</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Physical Plan Tree View */}
            <div className="col-span-8 flex flex-col bg-surface-02 border border-border-default rounded-md p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle shrink-0">
                <span className="text-xs font-mono font-semibold text-foreground">
                  Physical Execution Plan Tree & Cost Breakdown
                </span>
                <span className="text-[10px] font-mono text-text-muted">
                  Total Est. Cost: {lastPlan?.totalEstimatedCost.toFixed(2) ?? "0.00"} units
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {operatorsList.map((op, idx) => {
                  const isSelected = selectedOperatorId === op.id || (!selectedOperatorId && idx === 0);
                  return (
                    <div
                      key={op.id}
                      onClick={() => setSelectedOperatorId(op.id)}
                      className={cn(
                        "p-2.5 rounded-md border cursor-pointer transition-all flex flex-col gap-1.5",
                        isSelected
                          ? "bg-surface-03 border-border-strong shadow-level-1"
                          : "bg-surface-01 border-border-default hover:border-border-hover"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono uppercase px-1.5 py-0.5",
                              op.physicalOperator === "IndexScan"
                                ? "border-border-strong text-foreground bg-surface-02 font-bold"
                                : "border-border-default text-text-secondary"
                            )}
                          >
                            {op.physicalOperator}
                          </Badge>
                          <span className="text-xs font-mono text-foreground">{op.description}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
                          <span>Startup: {op.cost.startup.toFixed(2)}</span>
                          <span>Total: {op.cost.total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-2 text-[10px] font-mono bg-surface-02 border border-border-subtle rounded-md p-1.5 text-text-secondary">
                        <div>Visits: <span className="text-foreground font-semibold">{op.cost.rowVisits}</span></div>
                        <div>Probes: <span className="text-foreground font-semibold">{op.cost.indexProbes}</span></div>
                        <div>Compares: <span className="text-foreground font-semibold">{op.cost.comparisons}</span></div>
                        <div>Est. Rows: <span className="text-foreground font-semibold">{op.estimatedRows}</span></div>
                        <div>Actual: <span className="text-foreground font-semibold">{op.actualRows}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div className="h-full flex flex-col bg-surface-02 border border-border-default rounded-md p-3 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-foreground">Operator Intermediate Rows</span>
                <select
                  value={selectedOperator?.id || ""}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                  className="bg-surface-01 border border-border-default rounded-md px-2 py-0.5 text-xs font-mono text-foreground focus:outline-none"
                >
                  {operatorsList.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.physicalOperator} ({op.id}) - {op.actualRows} rows
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {intermediateRows.length} rows produced at this stage
              </span>
            </div>

            <div className="flex-1 overflow-auto border border-border-default rounded-md bg-surface-01">
              {intermediateRows.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border-default bg-surface-02 text-text-secondary sticky top-0">
                      {columns.map((col) => (
                        <th key={col} className="p-2 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intermediateRows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-border-subtle hover:bg-surface-02 transition-colors">
                        {columns.map((col) => (
                          <td key={col} className="p-2 text-foreground">
                            {String(row[col] ?? "NULL")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center text-xs font-mono text-text-muted">
                  No records returned or evaluated for selected operator.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="h-full grid grid-cols-12 gap-3">
            {/* Active Transactions List */}
            <div className="col-span-7 flex flex-col bg-surface-02 border border-border-default rounded-md p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle shrink-0">
                <span className="text-xs font-mono font-semibold text-foreground">Active & Concurrent Transactions</span>
                <span className="text-[10px] font-mono text-text-muted">
                  {Object.keys(dbState?.transactions || {}).length} Transactions Modeled
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {Object.values(dbState?.transactions || {}).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-md border border-border-default bg-surface-01 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-foreground">{tx.name || tx.id}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono uppercase",
                            tx.status === "committed"
                              ? "border-border-strong text-foreground"
                              : tx.status === "aborted"
                                ? "border-destructive text-destructive"
                                : "border-border-default text-text-secondary"
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">
                        Isolation: {tx.isolationLevel}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-text-secondary flex flex-wrap gap-2">
                      <div>Held Locks: <span className="text-foreground">{tx.heldLocks.length > 0 ? tx.heldLocks.join(", ") : "None"}</span></div>
                      {tx.waitingForLock && (
                        <div className="text-destructive font-semibold">
                          Blocked on: {tx.waitingForLock.resourceId} (holder: {tx.waitingForLock.waitingForTransactionId})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deadlocks & Wait-For Graph Cycles */}
            <div className="col-span-5 flex flex-col bg-surface-02 border border-border-default rounded-md p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle shrink-0">
                <span className="text-xs font-mono font-semibold text-foreground">Deadlock Detector & Resolution</span>
                <span className="text-[10px] font-mono text-text-muted">Wait-For Graph Cycle DFS</span>
              </div>

              {dbState?.deadlocks && dbState.deadlocks.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-3">
                  {dbState.deadlocks.map((dl, dIdx) => (
                    <div key={dIdx} className="p-3 rounded-md border border-border-strong bg-surface-01 space-y-2">
                      <div className="text-[11px] font-mono font-bold text-foreground">
                        Circular Dependency Cycle Detected:
                      </div>
                      <div className="p-2 rounded-md bg-surface-02 border border-border-default font-mono text-xs text-foreground text-center">
                        {dl.cycle.join("  →  ")}  →  {dl.cycle[0]}
                      </div>
                      <div className="text-[10px] font-sans text-text-secondary">
                        <span className="font-semibold text-foreground">Resolution Policy: </span>
                        {dl.reason}
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono border-destructive text-destructive">
                        Victim Aborted: {dl.selectedVictimTransactionId}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <div className="p-2 rounded-md bg-surface-03 border border-border-default text-text-muted mb-2">
                    <CheckIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono text-text-secondary">No Deadlock Cycles Detected</span>
                  <p className="text-[10px] font-sans text-text-muted mt-1 max-w-xs">
                    Lock graph contains no directed circular wait paths. Run the &quot;Deadlock Detection&quot; preset to observe cycle abort.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "replication" && (
          <div className="h-full grid grid-cols-12 gap-3">
            {/* Primary & Replicas Lag Status */}
            <div className="col-span-6 flex flex-col bg-surface-02 border border-border-default rounded-md p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle shrink-0">
                <span className="text-xs font-mono font-semibold text-foreground">Primary-Replica Topology</span>
                <span className="text-[10px] font-mono text-text-muted">Asynchronous WAL Shipping</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                <div className="p-2.5 rounded-md border border-border-strong bg-surface-01">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-foreground">Primary Node (Leader)</span>
                    <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-foreground">
                      Authoritative
                    </Badge>
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-1">
                    Accepts Read & Write transactions. Appends commits to replication log.
                  </div>
                </div>

                {Object.values(dbState?.replicas || {}).map((rep) => (
                  <div key={rep.replicaNodeId} className="p-2.5 rounded-md border border-border-default bg-surface-01 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-foreground">{rep.replicaNodeId}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono",
                          rep.status === "lagging"
                            ? "border-destructive text-destructive"
                            : "border-border-default text-text-secondary"
                        )}
                      >
                        {rep.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-text-secondary bg-surface-02 border border-border-subtle p-1.5 rounded-md">
                      <div>Lag: <span className="text-foreground font-semibold">{rep.currentLagMs}ms</span></div>
                      <div>Last LSN: <span className="text-foreground font-semibold">{rep.lastAppliedLsn}</span></div>
                      <div>Pending: <span className="text-foreground font-semibold">{rep.pendingChangesCount}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Pool Sizing & Capacity */}
            <div className="col-span-6 flex flex-col bg-surface-02 border border-border-default rounded-md p-3 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle shrink-0">
                <span className="text-xs font-mono font-semibold text-foreground">Connection Pool & Capacity Sizing</span>
                <span className="text-[10px] font-mono text-text-muted">
                  Max: {dbState?.connectionPool.maxConnections ?? 10} Connections
                </span>
              </div>

              <div className="p-3 rounded-md bg-surface-01 border border-border-default grid grid-cols-3 gap-2 text-center mb-3">
                <div className="p-2 bg-surface-02 border border-border-subtle rounded-md">
                  <div className="text-[9px] font-mono text-text-muted">ACTIVE CONNS</div>
                  <div className="text-base font-mono font-bold text-foreground">
                    {dbState?.connectionPool.activeConnections ?? 0}
                  </div>
                </div>
                <div className="p-2 bg-surface-02 border border-border-subtle rounded-md">
                  <div className="text-[9px] font-mono text-text-muted">IDLE CONNS</div>
                  <div className="text-base font-mono font-bold text-foreground">
                    {dbState?.connectionPool.idleConnections ?? 10}
                  </div>
                </div>
                <div className="p-2 bg-surface-02 border border-border-subtle rounded-md">
                  <div className="text-[9px] font-mono text-text-muted">WAITING QUEUE</div>
                  <div className="text-base font-mono font-bold text-foreground">
                    {dbState?.connectionPool.waitingRequestsCount ?? 0}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <span className="text-[11px] font-mono font-semibold text-text-secondary block mb-1.5">
                  WAL Replication Log Entries:
                </span>
                <div className="space-y-1">
                  {(dbState?.replicationLog || []).map((entry) => (
                    <div
                      key={entry.lsn}
                      className="text-[10px] font-mono p-1.5 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between text-text-secondary"
                    >
                      <div>
                        <span className="text-foreground font-semibold">LSN #{entry.lsn}</span> · {entry.operation} on {entry.tableName} (#{entry.rowId})
                      </div>
                      <span className="text-text-muted">@{entry.committedAtMs}ms</span>
                    </div>
                  ))}
                  {(!dbState?.replicationLog || dbState.replicationLog.length === 0) && (
                    <div className="text-xs font-mono text-text-muted text-center py-4">
                      No replication WAL events logged for this scenario.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
