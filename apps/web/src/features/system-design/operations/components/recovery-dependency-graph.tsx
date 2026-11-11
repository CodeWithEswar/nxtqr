"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Recovery Dependency Graph & Critical Path Scheduler Component
 */

import React from "react";
import type { RecoveryPlanResult, RecoveryDependency } from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon, CalendarIcon, CheckCircleIcon, ChevronRightIcon } from "@nxtqr/icons";

interface RecoveryDependencyGraphProps {
  recoveryPlan: RecoveryPlanResult;
  dependencies: RecoveryDependency[];
}

export function RecoveryDependencyGraph({
  recoveryPlan,
  dependencies,
}: RecoveryDependencyGraphProps) {
  const hasCycles = recoveryPlan.hasCycles;

  return (
    <div className="space-y-6">
      {/* Header Metric Card */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">Disaster Recovery Scheduling</div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">Recovery Dependency Precedence Graph</h3>
          <p className="text-xs text-[#858585] mt-1">
            Validates prerequisite order (DNS $\to$ Gateway $\to$ Identity $\to$ Data Stores $\to$ Workloads). Tarjan SCC verifies cycle-free execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-center font-mono">
            <div className="text-[10px] text-[#858585] uppercase">Critical Path</div>
            <div className="text-base font-bold text-[#FFFFFF] mt-0.5">
              {recoveryPlan.criticalPathSeconds}s
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-center font-mono">
            <div className="text-[10px] text-[#858585] uppercase">Cycle Check</div>
            <div
              className={`text-base font-bold mt-0.5 flex items-center gap-1 ${
                hasCycles ? "text-[#ef4444]" : "text-[#22c55e]"
              }`}
            >
              {hasCycles ? (
                <>
                  <AlertCircleIcon size={14} /> CYCLES
                </>
              ) : (
                <>
                  <CheckCircleIcon size={14} /> ACYCLIC
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Warning Banner if Deadlock */}
      {hasCycles && (
        <div className="p-4 rounded-md bg-[#1f1010] border border-[#4a1c1c] text-xs text-[#fca5a5] flex items-start gap-2.5">
          <AlertCircleIcon size={18} className="text-[#ef4444] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-[#FFFFFF]">Circular Recovery Dependency Detected</h4>
            <p>
              Recovery dependencies contain a directed cycle: [
              {recoveryPlan.cycleComponentIds?.join(" $\to$ ")}]. Automated disaster recovery cannot execute deterministically.
            </p>
          </div>
        </div>
      )}

      {/* Topological Sequence Ribbon */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3">
        <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
          Topological Recovery Sequence ({recoveryPlan.topologicalSequence.length} Steps)
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {recoveryPlan.topologicalSequence.map((step, idx) => (
            <React.Fragment key={step}>
              <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] shrink-0 space-y-1 min-w-[140px]">
                <div className="text-[10px] font-mono text-[#858585]">STEP {idx + 1}</div>
                <div className="text-xs font-semibold text-[#FFFFFF] truncate">{step}</div>
                <div className="text-[10px] font-mono text-[#22c55e] flex items-center gap-1">
                  <CalendarIcon size={10} /> In-Order
                </div>
              </div>
              {idx < recoveryPlan.topologicalSequence.length - 1 && (
                <ChevronRightIcon size={16} className="text-[#666666] shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Precedence Table */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3">
        <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
          Recovery Dependency Links ({dependencies.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#202020] text-[#858585] font-mono">
                <th className="pb-2 font-medium">Prerequisite (Must Start First)</th>
                <th className="pb-2 font-medium">Dependency Type</th>
                <th className="pb-2 font-medium">Dependent Workload</th>
                <th className="pb-2 font-medium text-right">Enforcement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A] text-[#B5B5B5]">
              {dependencies.map((dep) => (
                <tr key={dep.id} className="hover:bg-[#0D0D0D]">
                  <td className="py-2.5 font-mono text-[#FFFFFF]">{dep.sourceComponentId}</td>
                  <td className="py-2.5 font-mono text-[#858585]">{dep.dependencyType}</td>
                  <td className="py-2.5 font-mono text-[#FFFFFF]">{dep.targetComponentId}</td>
                  <td className="py-2.5 text-right font-mono text-[#22c55e]">
                    {dep.isBlocking ? "BLOCKING" : "OPTIONAL"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

