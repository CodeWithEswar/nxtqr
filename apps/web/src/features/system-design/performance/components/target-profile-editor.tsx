"use client";

import * as React from "react";
import type {
  PerformanceTarget,
  PerformanceTargetEvaluation,
} from "@nxtqr/architecture-intelligence";
import { PlusIcon, TrashIcon, CheckIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface TargetProfileEditorProps {
  targets: PerformanceTarget[];
  evaluations?: PerformanceTargetEvaluation[];
  onAddTarget: (target: PerformanceTarget) => void;
  onRemoveTarget: (targetId: string) => void;
}

export function TargetProfileEditor({
  targets,
  evaluations,
  onAddTarget,
  onRemoveTarget,
}: TargetProfileEditorProps) {
  const [metric, setMetric] = React.useState<PerformanceTarget["metric"]>("p95_latency");
  const [operator, setOperator] = React.useState<PerformanceTarget["operator"]>("lt");
  const [threshold, setThreshold] = React.useState<number>(100);

  const evalMap = React.useMemo(() => {
    const map = new Map<string, PerformanceTargetEvaluation>();
    if (evaluations) {
      for (const ev of evaluations) {
        map.set(ev.targetId, ev);
      }
    }
    return map;
  }, [evaluations]);

  const handleAdd = () => {
    const unit = metric.includes("latency") ? "ms" : metric.includes("pct") ? "%" : "rps";
    const newTarget: PerformanceTarget = {
      id: `tgt-${Date.now()}`,
      name: `${metric.toUpperCase().replace(/_/g, " ")} Target`,
      metric,
      operator,
      thresholdValue: threshold,
      unit,
      scope: "global",
    };
    onAddTarget(newTarget);
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] select-none text-xs space-y-3 p-3">
      <div className="flex items-center justify-between border-b border-[#262626] pb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#858585]">
          Performance Targets &amp; SLAs ({targets.length})
        </span>
      </div>

      {/* Target creation form */}
      <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
        <span className="font-mono text-[10px] text-[#666666] block">Add Target Constraint</span>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as any)}
              className="w-full bg-[#141414] border border-[#262626] rounded-md px-1.5 py-1 text-[11px] text-[#B5B5B5] focus:outline-none focus:border-[#404040]"
            >
              <option value="p95_latency">P95 Latency</option>
              <option value="p99_latency">P99 Latency</option>
              <option value="p50_latency">P50 Latency</option>
              <option value="throughput_rps">Throughput RPS</option>
              <option value="error_rate_pct">Error Rate %</option>
              <option value="dropped_iterations_pct">Dropped Iter %</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as any)}
              className="bg-[#141414] border border-[#262626] rounded-md px-1 py-1 text-[11px] font-mono text-[#B5B5B5] focus:outline-none focus:border-[#404040]"
            >
              <option value="lt">&lt;</option>
              <option value="lte">&le;</option>
              <option value="gt">&gt;</option>
              <option value="gte">&ge;</option>
            </select>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-[#404040]"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-white text-[11px] font-mono transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      {/* Target list */}
      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {targets.map((tgt) => {
          const evalRes = evalMap.get(tgt.id);
          const isPassed = evalRes?.status === "passed";
          const isWarn = evalRes?.status === "warn";
          const isFailed = evalRes?.status === "failed";

          return (
            <div
              key={tgt.id}
              className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] hover:border-[#262626] transition-colors flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{tgt.name}</span>
                  {evalRes && (
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] uppercase border ${
                        isPassed
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                          : isWarn
                          ? "bg-amber-950/40 text-amber-400 border-amber-900/60"
                          : isFailed
                          ? "bg-red-950/40 text-red-400 border-red-900/60"
                          : "bg-[#141414] text-[#858585] border-[#262626]"
                      }`}
                    >
                      {isPassed && <CheckIcon className="w-2.5 h-2.5" />}
                      {(isWarn || isFailed) && <AlertTriangleIcon className="w-2.5 h-2.5" />}
                      {evalRes.status}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-[#858585] mt-1">
                  <span>
                    Condition: {tgt.metric} {tgt.operator} {tgt.thresholdValue} {tgt.unit}
                  </span>
                  {evalRes?.measuredValue !== undefined && (
                    <span>• Measured: {evalRes.measuredValue} {tgt.unit}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemoveTarget(tgt.id)}
                className="p-1 rounded-md text-[#666666] hover:text-red-400 transition-colors"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

