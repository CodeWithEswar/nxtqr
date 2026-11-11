"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Transaction Boundaries, Isolation & Deadlock Dependency Cycle Visualizer
 */

import React from "react";
import type {
  TransactionModel,
  LockContentionScenario,
  DatabaseArchitectureFinding,
} from "@nxtqr/architecture-intelligence";
import { LockIcon, AlertTriangleIcon, CheckIcon } from "@nxtqr/icons";

export interface TransactionLockViewProps {
  transactions: TransactionModel[];
  selectedTransaction: TransactionModel | null;
  deadlockScenarios: LockContentionScenario[];
  findings: DatabaseArchitectureFinding[];
}

export function TransactionLockView({
  transactions,
  selectedTransaction,
  deadlockScenarios,
  findings,
}: TransactionLockViewProps) {
  const transactionFindings = findings.filter(
    (f) =>
      f.category === "deadlock_dependency_cycle" ||
      f.category === "transaction_isolation_anomaly"
  );

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Header Summary */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <LockIcon className="w-4 h-4 text-[#FFFFFF]" />
            Transaction Boundaries, Isolation & Deadlock Graph
          </h2>
          <p className="text-xs text-[#858585] mt-1">
            Analyzing ACID transaction boundaries, lock acquisition sequences, and wait-for graph dependency cycles.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Modeled Transactions
            </span>
            <span className="text-sm font-bold font-mono text-[#FFFFFF]">
              {transactions.length}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-[#666666] block">
              Deadlock Dependency Cycles
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                deadlockScenarios.length > 0 ? "text-[#FFFFFF]" : "text-[#858585]"
              }`}
            >
              {deadlockScenarios.length}
            </span>
          </div>
        </div>
      </div>

      {/* Deadlock Risk Visualizer Banner */}
      {deadlockScenarios.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
            Wait-For Graph Dependency Deadlocks ({deadlockScenarios.length})
          </h3>
          <div className="space-y-3">
            {deadlockScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="p-4 bg-[#0D0D0D] border border-[#404040] rounded-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FFFFFF]">
                    Deadlock Cycle: {scenario.contendingTransactionIds.join(" &harr; ")}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-md font-mono uppercase bg-[#141414] text-[#FFFFFF] border border-[#404040]">
                    {scenario.deadlockRiskLevel} Risk
                  </span>
                </div>

                <p className="text-xs text-[#858585]">{scenario.explanation}</p>

                {/* Deadlock Path Flow */}
                <div className="p-3 bg-[#000000] border border-[#262626] rounded-md">
                  <span className="text-[10px] uppercase font-mono text-[#666666] block mb-1">
                    Cycle Path Sequence
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-[#B5B5B5]">
                    {scenario.cyclePath.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-1 rounded-md bg-[#141414] border border-[#262626] text-[#FFFFFF]">
                          {step}
                        </span>
                        {idx < scenario.cyclePath.length - 1 && <span>&rarr;</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-[#B5B5B5] bg-[#141414] p-2.5 rounded-md border border-[#262626]">
                  <strong className="text-[#FFFFFF]">Architectural Remediation:</strong> Standardize lock acquisition order across all application services (e.g. always lock child tables after parent tables or sort IDs deterministically before acquiring locks).
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585] flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-[#FFFFFF]" />
          Zero deadlock dependency cycles detected across current transaction boundaries.
        </div>
      )}

      {/* Selected Transaction Lock Acquisition Timeline */}
      {selectedTransaction && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
              Selected Transaction Operations: {selectedTransaction.name}
            </h3>
            <span className="text-xs font-mono text-[#858585]">
              Isolation: <strong className="text-[#FFFFFF]">{selectedTransaction.isolationLevel}</strong>
            </span>
          </div>

          <div className="border border-[#262626] rounded-md overflow-hidden bg-[#080808]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#0D0D0D] text-[#858585]">
                  <th className="py-2 px-3 font-medium">Step</th>
                  <th className="py-2 px-3 font-medium">Target Table</th>
                  <th className="py-2 px-3 font-medium">Lock Type</th>
                  <th className="py-2 px-3 font-medium">Operation</th>
                  <th className="py-2 px-3 font-medium text-right">Hold Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {selectedTransaction.operations.map((op, idx) => (
                  <tr key={idx} className="hover:bg-[#0D0D0D] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#666666]">
                      #{idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#FFFFFF]">
                      {op.tableName}
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase text-[#B5B5B5]">
                      {op.lockType}
                    </td>
                    <td className="py-2.5 px-3">
                      {op.isWrite ? (
                        <span className="text-[10px] text-[#FFFFFF] font-bold">WRITE</span>
                      ) : (
                        <span className="text-[10px] text-[#858585]">READ</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right text-[#FFFFFF]">
                      {op.estimatedDurationMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction & Concurrency Findings */}
      {transactionFindings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
            Concurrency & Isolation Findings ({transactionFindings.length})
          </h3>
          <div className="space-y-2">
            {transactionFindings.map((f) => (
              <div
                key={f.id}
                className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FFFFFF]">{f.title}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md uppercase font-mono bg-[#141414] text-[#B5B5B5] border border-[#333333]">
                    {f.severity}
                  </span>
                </div>
                <p className="text-xs text-[#858585]">{f.explanation}</p>
                <p className="text-[11px] font-mono text-[#FFFFFF] bg-[#000000] p-2 rounded-md border border-[#202020]">
                  {f.remediation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
