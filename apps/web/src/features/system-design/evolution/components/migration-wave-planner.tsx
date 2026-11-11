"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Migration Wave Planner & Task Inspector Component
 */

import React from "react";
import type {
  MigrationWave,
  MigrationTask,
  VerificationGate,
} from "@nxtqr/architecture-intelligence";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  CalendarIcon,
} from "@nxtqr/icons";

interface MigrationWavePlannerProps {
  waves: MigrationWave[];
  tasks: MigrationTask[];
  gates: VerificationGate[];
  activeWaveNumber: number;
  selectedTaskId: string | null;
  onSelectWave: (waveNumber: number) => void;
  onSelectTask: (taskId: string) => void;
}

export function MigrationWavePlanner({
  waves,
  tasks,
  gates,
  activeWaveNumber,
  selectedTaskId,
  onSelectWave,
  onSelectTask,
}: MigrationWavePlannerProps) {
  const activeWave = waves.find((w) => w.waveNumber === activeWaveNumber) || waves[0];
  const activeWaveTasks = tasks.filter((t) => t.waveId === activeWave.id);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || activeWaveTasks[0];
  const activeWaveGates = gates.filter((g) => activeWave.verificationGateIds.includes(g.id));

  return (
    <div className="space-y-6">
      {/* Wave Selector Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {waves.map((w) => {
          const isSelected = w.waveNumber === activeWaveNumber;
          const isIrreversible = w.waveNumber === 5;
          return (
            <button
              key={w.id}
              onClick={() => onSelectWave(w.waveNumber)}
              className={`p-3 text-left rounded-md transition-all border ${
                isSelected
                  ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                  : "bg-[#0D0D0D] border-[#262626] hover:border-[#333333] hover:bg-[#141414]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-[#858585]">WAVE {w.waveNumber}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    w.status === "completed"
                      ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                      : w.status === "active"
                      ? "bg-[#141414] text-[#FFFFFF] border border-[#333333]"
                      : "bg-[#080808] text-[#858585] border border-[#202020]"
                  }`}
                >
                  {w.status.toUpperCase()}
                </span>
              </div>
              <div className="text-sm font-semibold text-[#FFFFFF] truncate">{w.title.replace(/^Wave \d+:\s*/, "")}</div>
              <div className="text-xs text-[#858585] mt-1 flex items-center justify-between">
                <span>{w.taskIds.length} tasks</span>
                {isIrreversible && (
                  <span className="text-[10px] text-[#ef4444] font-mono">IRREVERSIBLE</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Wave Overview Card */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#262626]">
          <div>
            <div className="text-xs font-mono uppercase text-[#858585]">Active Wave Details</div>
            <h2 className="text-lg font-bold text-[#FFFFFF]">{activeWave.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#FFFFFF]">
              Objective: {activeWave.objective.slice(0, 48)}...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="font-semibold text-[#858585] uppercase tracking-wider mb-1">Prerequisites</div>
            <ul className="space-y-1 text-[#B5B5B5]">
              {activeWave.prerequisites.map((p, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircleIcon size={12} className="text-[#22c55e]" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="font-semibold text-[#858585] uppercase tracking-wider mb-1">Completion Criteria</div>
            <ul className="space-y-1 text-[#B5B5B5]">
              {activeWave.completionCriteria.map((c, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircleIcon size={12} className="text-[#22c55e]" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="font-semibold text-[#858585] uppercase tracking-wider mb-1">Rollback Strategy</div>
            <p className="text-[#B5B5B5] leading-relaxed">{activeWave.rollbackStrategy}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Pane: Tasks List & Selected Task Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#858585]">
              Wave Tasks ({activeWaveTasks.length})
            </h3>
            <span className="text-xs text-[#858585] font-mono">
              Total: {activeWaveTasks.reduce((s, t) => s + t.estimatedHours, 0)} hours
            </span>
          </div>

          <div className="space-y-2">
            {activeWaveTasks.map((t) => {
              const isSelected = t.id === selectedTask?.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className={`w-full p-3.5 text-left rounded-md transition-all border flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                      : "bg-[#0D0D0D] border-[#202020] hover:border-[#333333] hover:bg-[#141414]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#FFFFFF]">{t.title}</span>
                      {t.isPointOfNoReturn && (
                        <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]">
                          POINT OF NO RETURN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#858585] line-clamp-1">{t.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-[#858585]">
                      <span className="font-mono bg-[#141414] px-1.5 py-0.5 rounded-md border border-[#262626]">
                        {t.taskType}
                      </span>
                      {t.dependsOnTaskIds.length > 0 && (
                        <span>Prereqs: {t.dependsOnTaskIds.length}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-xs font-mono text-[#FFFFFF] font-medium flex items-center gap-1">
                      <CalendarIcon size={12} className="text-[#858585]" />
                      {t.estimatedHours}h
                    </span>
                    <span
                      className={`mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono ${
                        t.status === "completed"
                          ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                          : t.status === "ready"
                          ? "bg-[#141414] text-[#FFFFFF] border border-[#333333]"
                          : "bg-[#080808] text-[#858585] border border-[#202020]"
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Task Inspector */}
        <div className="rounded-md bg-[#080808] border border-[#262626] p-4 space-y-4">
          <div className="pb-3 border-b border-[#262626]">
            <div className="text-xs uppercase font-mono text-[#858585]">Task Inspector</div>
            <h4 className="text-base font-semibold text-[#FFFFFF] mt-0.5">{selectedTask?.title}</h4>
            <div className="text-xs font-mono text-[#858585] mt-1">{selectedTask?.id}</div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="font-semibold text-[#858585] uppercase tracking-wider mb-1">Description</div>
              <p className="text-[#B5B5B5] leading-relaxed">{selectedTask?.description}</p>
            </div>

            <div>
              <div className="font-semibold text-[#858585] uppercase tracking-wider mb-1">Rollback Procedure</div>
              <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-[#B5B5B5] font-mono text-[11px] leading-relaxed">
                {selectedTask?.rollbackProcedure}
              </div>
            </div>

            {selectedTask?.isPointOfNoReturn && (
              <div className="p-3 rounded-md bg-[#170a0a] border border-[#401818] text-[#ef4444] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircleIcon size={14} />
                  Point of No Return Warning
                </div>
                <p className="text-[11px] text-[#fca5a5] leading-relaxed">
                  Executing this task makes automatic rollback to the legacy monolith impossible. Requires roll-forward or cold storage recovery.
                </p>
              </div>
            )}

            <div>
              <div className="font-semibold text-[#858585] uppercase tracking-wider mb-1.5">
                Verification Gates ({activeWaveGates.length})
              </div>
              <div className="space-y-1.5">
                {activeWaveGates.map((g) => (
                  <div
                    key={g.id}
                    className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[#FFFFFF]">{g.title}</div>
                      <div className="text-[11px] text-[#858585]">{g.evaluationNotes}</div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono ${
                        g.status === "passed"
                          ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                          : g.status === "failed"
                          ? "bg-[#141414] text-[#ef4444] border border-[#401818]"
                          : "bg-[#141414] text-[#858585] border border-[#262626]"
                      }`}
                    >
                      {g.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

