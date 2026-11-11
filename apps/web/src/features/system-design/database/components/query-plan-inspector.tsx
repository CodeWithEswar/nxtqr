"use client";

/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * PostgreSQL Query Execution Plan Inspector & Tree Visualizer
 */

import React from "react";
import type {
  QueryWorkload,
  QueryExecutionPlan,
  QueryPlanOperator,
} from "@nxtqr/architecture-intelligence";
import { ActivityIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface QueryPlanInspectorProps {
  workload: QueryWorkload | null;
  executionPlans: QueryExecutionPlan[];
}

function OperatorNodeView({
  operator,
  depth = 0,
}: {
  operator: QueryPlanOperator;
  depth?: number;
}) {
  const isSeqScanOnLargeTable =
    operator.operatorType === "seq_scan" && (operator.actualRows || 0) > 50000;

  const rowMismatchRatio =
    operator.actualRows !== undefined && operator.estimatedRows > 0
      ? operator.actualRows / operator.estimatedRows
      : 1;

  const hasHighMismatch = rowMismatchRatio > 10 || rowMismatchRatio < 0.1;

  return (
    <div className="space-y-2" style={{ marginLeft: `${depth * 16}px` }}>
      <div
        className={`p-3 rounded-md border text-xs transition-colors ${
          isSeqScanOnLargeTable || hasHighMismatch
            ? "bg-[#141414] border-[#404040]"
            : "bg-[#080808] border-[#262626] hover:border-[#333333]"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#FFFFFF] font-mono uppercase text-[11px]">
              &rarr; {operator.operatorType.replace(/_/g, " ")}
            </span>
            {operator.targetTableName && (
              <span className="text-[#B5B5B5] font-mono text-[11px]">
                on <strong>{operator.targetTableName}</strong>
              </span>
            )}
            {operator.indexName && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#141414] text-[#858585] border border-[#262626] font-mono">
                using {operator.indexName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSeqScanOnLargeTable && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040] font-semibold flex items-center gap-1">
                <AlertTriangleIcon className="w-2.5 h-2.5 text-[#FFFFFF]" />
                Full Table Scan
              </span>
            )}
            {hasHighMismatch && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#141414] text-[#B5B5B5] border border-[#333333] font-mono">
                {rowMismatchRatio.toFixed(1)}x Estimate Mismatch
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-[#858585] font-mono pt-2 border-t border-[#1A1A1A]">
          <div>
            <span className="text-[#666666] block">Est / Actual Rows</span>
            <span className="text-[#FFFFFF]">
              {operator.estimatedRows.toLocaleString()} /{" "}
              {operator.actualRows !== undefined
                ? operator.actualRows.toLocaleString()
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[#666666] block">Execution Time</span>
            <span className="text-[#FFFFFF]">
              {operator.actualTotalTimeMs !== undefined
                ? `${operator.actualTotalTimeMs.toFixed(2)} ms`
                : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[#666666] block">Planner Cost</span>
            <span className="text-[#FFFFFF]">
              {operator.estimatedStartupCost}..{operator.estimatedTotalCost}
            </span>
          </div>
          <div>
            <span className="text-[#666666] block">Loops</span>
            <span className="text-[#FFFFFF]">{operator.actualLoops ?? 1}</span>
          </div>
        </div>

        {/* Predicates */}
        {operator.filterPredicate && (
          <div className="mt-2 text-[11px] font-mono text-[#858585] bg-[#000000] p-1.5 rounded-md border border-[#202020]">
            <span className="text-[#666666]">Filter: </span>
            {operator.filterPredicate}
          </div>
        )}
        {operator.indexCondition && (
          <div className="mt-2 text-[11px] font-mono text-[#858585] bg-[#000000] p-1.5 rounded-md border border-[#202020]">
            <span className="text-[#666666]">Index Cond: </span>
            {operator.indexCondition}
          </div>
        )}
      </div>

      {/* Recursive Children Operators */}
      {operator.children.map((child) => (
        <OperatorNodeView key={child.id} operator={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function QueryPlanInspector({
  workload,
  executionPlans,
}: QueryPlanInspectorProps) {
  if (!workload) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#858585]">
        <ActivityIcon className="w-8 h-8 mb-2 text-[#666666]" />
        <p className="text-sm">Select a query from the catalog to inspect its execution plan.</p>
      </div>
    );
  }

  const matchingPlan = executionPlans.find(
    (p) => p.queryWorkloadId === workload.id
  );

  return (
    <div className="flex flex-col h-full bg-[#000000] overflow-y-auto p-6 space-y-6">
      {/* Query Workload Header */}
      <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#FFFFFF]">
              {workload.queryName}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono uppercase bg-[#141414] text-[#858585] border border-[#262626]">
              {workload.queryType}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-[#858585]">
              Throughput: <strong className="text-[#FFFFFF]">{workload.frequencyPerMinute} rpm</strong>
            </span>
            <span className="text-[#858585]">
              Concurrency: <strong className="text-[#FFFFFF]">{workload.concurrentClients} clients</strong>
            </span>
          </div>
        </div>

        {/* SQL Statement Display */}
        <div className="p-3 bg-[#000000] border border-[#202020] rounded-md">
          <span className="text-[10px] text-[#666666] font-mono block mb-1 uppercase">
            Parameterized SQL
          </span>
          <pre className="text-xs text-[#FFFFFF] font-mono whitespace-pre-wrap break-all">
            {workload.parameterizedSql}
          </pre>
        </div>

        {/* Query Fingerprint */}
        <div className="flex items-center justify-between text-[11px] text-[#666666] font-mono">
          <span>Fingerprint: {workload.queryFingerprint}</span>
          <span>Target: {workload.targetTableNames.join(", ")}</span>
        </div>
      </div>

      {/* Execution Plan View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-2">
            <ActivityIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
            PostgreSQL Execution Plan (EXPLAIN ANALYZE)
          </h3>
          {matchingPlan && (
            <div className="flex items-center gap-3 text-xs font-mono text-[#858585]">
              <span>
                Total Time: <strong className="text-[#FFFFFF]">{matchingPlan.totalExecutionTimeMs} ms</strong>
              </span>
              <span>
                Planning Time: <strong className="text-[#FFFFFF]">{matchingPlan.planningTimeMs} ms</strong>
              </span>
            </div>
          )}
        </div>

        {matchingPlan ? (
          <div className="space-y-3">
            <OperatorNodeView operator={matchingPlan.rootOperator} />
          </div>
        ) : (
          <div className="p-6 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#858585] text-center">
            No execution plan recorded for this query. Run an EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) to inspect the operator tree.
          </div>
        )}
      </div>
    </div>
  );
}
