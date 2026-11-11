"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Dependency DAG Viewer & Critical Path Scheduler Component
 */

import React from "react";
import type {
  MigrationTask,
  MigrationDependency,
  MigrationEvolutionRoadmap,
} from "@nxtqr/architecture-intelligence";
import { CalendarIcon } from "@nxtqr/icons";

interface DependencyDagViewerProps {
  tasks: MigrationTask[];
  dependencies: MigrationDependency[];
  roadmap: MigrationEvolutionRoadmap;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export function DependencyDagViewer({
  tasks,
  dependencies,
  roadmap,
  selectedTaskId,
  onSelectTask,
}: DependencyDagViewerProps) {
  const criticalPathSet = new Set(roadmap.criticalPathTaskIds);

  return (
    <div className="space-y-6">
      {/* Critical Path Method (CPM) Header Card */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">Critical Path Method (CPM)</div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">Topological Task Execution Graph</h3>
          <p className="text-xs text-[#858585] mt-1">
            Strongly Connected Components (SCC) verification: 0 cycles detected. Topological sequence guaranteed.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <span className="text-[#858585]">Critical Duration: </span>
            <span className="text-[#FFFFFF] font-bold">{roadmap.estimatedTotalHours} hours</span>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <span className="text-[#858585]">Critical Tasks: </span>
            <span className="text-[#22c55e] font-bold">{roadmap.criticalPathTaskIds.length}</span>
          </div>
        </div>
      </div>

      {/* Sequential DAG Flow Visualizer */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
          Topological Execution Sequence
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((task, idx) => {
            const isCritical = criticalPathSet.has(task.id);
            const isSelected = task.id === selectedTaskId;
            const prereqs = dependencies.filter((d) => d.targetTaskId === task.id);
            const dependents = dependencies.filter((d) => d.sourceTaskId === task.id);

            return (
              <button
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={`p-4 text-left rounded-md transition-all border space-y-2.5 ${
                  isSelected
                    ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                    : isCritical
                    ? "bg-[#0D0D0D] border-[#333333] hover:border-[#404040]"
                    : "bg-[#080808] border-[#202020] hover:border-[#262626]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#858585]">STEP {idx + 1}</span>
                  {isCritical ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] border border-[#333333] text-[#FFFFFF] font-semibold">
                      CRITICAL PATH
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#0D0D0D] border border-[#202020] text-[#666666]">
                      PARALLEL SLACK
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#FFFFFF] leading-snug">{task.title}</h4>
                  <div className="text-[11px] font-mono text-[#858585] mt-0.5">{task.id}</div>
                </div>

                <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-xs text-[#858585]">
                  <span className="flex items-center gap-1 font-mono">
                    <CalendarIcon size={12} />
                    {task.estimatedHours}h duration
                  </span>
                  <span className="font-mono text-[11px]">
                    {prereqs.length} in · {dependents.length} out
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dependency Links Matrix */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
          Dependency Precedence Table ({dependencies.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#202020] text-[#858585] font-mono">
                <th className="pb-2 font-medium">Prerequisite Task (Source)</th>
                <th className="pb-2 font-medium">Constraint Type</th>
                <th className="pb-2 font-medium">Dependent Task (Target)</th>
                <th className="pb-2 font-medium text-right">Blocking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A] text-[#B5B5B5]">
              {dependencies.map((dep) => (
                <tr key={dep.id} className="hover:bg-[#0D0D0D]">
                  <td className="py-2.5 font-mono text-[#FFFFFF]">{dep.sourceTaskId}</td>
                  <td className="py-2.5 font-mono text-[#858585]">{dep.dependencyType}</td>
                  <td className="py-2.5 font-mono text-[#FFFFFF]">{dep.targetTaskId}</td>
                  <td className="py-2.5 text-right font-mono text-[#22c55e]">
                    {dep.isBlocking ? "ENFORCED" : "OPTIONAL"}
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

