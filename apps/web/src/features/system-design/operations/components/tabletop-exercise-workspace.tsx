"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Tabletop Exercise Workspace & Inject Timeline Runner
 */

import React, { useState } from "react";
import type { TabletopExercise } from "@nxtqr/architecture-intelligence";
import { TabletopEngine } from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon, CheckCircleIcon } from "@nxtqr/icons";

interface TabletopExerciseWorkspaceProps {
  exercise: TabletopExercise;
  onUpdateExercise: (exercise: TabletopExercise) => void;
}

export function TabletopExerciseWorkspace({
  exercise,
  onUpdateExercise,
}: TabletopExerciseWorkspaceProps) {
  const [newObserver, setNewObserver] = useState("Lead Scribe");
  const [newNote, setNewNote] = useState("");
  const [selectedMinute, setSelectedMinute] = useState<number>(15);
  const [wasExpected, setWasExpected] = useState<boolean>(true);

  const handleAddObservation = () => {
    if (!newNote.trim()) return;

    const { updatedExercise } = TabletopEngine.recordObservation(
      exercise,
      selectedMinute,
      newObserver,
      newNote.trim(),
      wasExpected
    );

    onUpdateExercise(updatedExercise);
    setNewNote("");
  };

  return (
    <div className="space-y-6">
      {/* Exercise Header Card */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">Interactive Simulation & Training</div>
          <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">{exercise.title}</h3>
          <p className="text-xs text-[#858585] mt-1">
            Facilitated discussion-based exercise testing responder coordination, runbook clarity, and recovery decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#B5B5B5]">
            Facilitator: {exercise.facilitator}
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] border border-[#262626] text-[#22c55e]">
            {exercise.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Participant Roster */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3">
        <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
          Exercise Participant Roster & Assigned Roles
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs font-mono">
          {exercise.participants.map((p, idx) => (
            <div key={idx} className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1">
              <div className="font-semibold text-[#FFFFFF] truncate">{p.name}</div>
              <div className="text-[10px] text-[#858585] truncate">{p.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Timed Injects & Observation Recorder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timed Injects */}
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase font-mono text-[#858585]">Synthetic Timeline</div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">Timed Failure Injects ({exercise.injects.length})</h4>
            </div>
            <span className="text-xs font-mono text-[#858585]">0 — 60 mins</span>
          </div>

          <div className="space-y-3">
            {exercise.injects.map((inj) => (
              <div key={inj.id} className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] bg-[#141414] text-[#FFFFFF] border border-[#333333]">
                      T+{inj.minuteOffset}m
                    </span>
                    <span className="font-semibold text-[#FFFFFF]">{inj.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] text-[#858585] border border-[#262626]">
                    {inj.expectedResponseRole}
                  </span>
                </div>

                <p className="text-[#B5B5B5] leading-relaxed text-[11px]">{inj.eventDescription}</p>

                <div className="p-2 rounded-md bg-[#141414] border border-[#262626] text-[11px] text-[#FFAA00] flex items-center gap-1.5 font-mono">
                  <AlertCircleIcon size={12} />
                  Inject: {inj.injectedFailure}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observation Recorder & Decision Log */}
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
          <div className="pb-3 border-b border-[#262626]">
            <div className="text-xs uppercase font-mono text-[#858585]">Observation Log</div>
            <h4 className="text-sm font-bold text-[#FFFFFF]">Record Tabletop Observation / Decision</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#858585] block mb-1">Timeline Minute (T+)</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(Number(e.target.value))}
                  className="w-full bg-[#0D0D0D] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF]"
                >
                  <option value={0}>T+0 (Alert Trigger)</option>
                  <option value={15}>T+15 (Triage)</option>
                  <option value={30}>T+30 (Containment)</option>
                  <option value={45}>T+45 (DR Recovery)</option>
                  <option value={60}>T+60 (Verification)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#858585] block mb-1">Recorded By</label>
                <input
                  type="text"
                  value={newObserver}
                  onChange={(e) => setNewObserver(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#858585] block mb-1">Observation / Decision Note</label>
              <textarea
                rows={3}
                placeholder="Record decision made, unexpected delay, missing metric, or coordination bottleneck..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#262626] rounded-md p-2.5 text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#404040]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#B5B5B5]">
                <input
                  type="checkbox"
                  checked={wasExpected}
                  onChange={(e) => setWasExpected(e.target.checked)}
                  className="rounded-md bg-[#0D0D0D] border-[#262626]"
                />
                Behavior was expected per runbook
              </label>

              <button
                onClick={handleAddObservation}
                className="px-3 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-[#262626] border border-[#404040] text-xs font-semibold text-[#FFFFFF] flex items-center gap-1.5 transition-all shadow-level-1"
              >
                <CheckCircleIcon size={14} className="text-[#22c55e]" />
                Record Note
              </button>
            </div>

            {/* Observations History */}
            <div className="pt-3 border-t border-[#1A1A1A] space-y-2">
              <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
                Recorded Notes ({exercise.observations.length})
              </div>

              {exercise.observations.length === 0 ? (
                <p className="text-xs text-[#666666] italic">No observations recorded yet for this exercise.</p>
              ) : (
                exercise.observations.map((obs) => (
                  <div key={obs.id} className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#858585]">
                      <span>T+{obs.timestampMinute}m · {obs.observer}</span>
                      <span className={obs.wasExpected ? "text-[#22c55e]" : "text-[#FFAA00]"}>
                        {obs.wasExpected ? "EXPECTED" : "UNEXPECTED"}
                      </span>
                    </div>
                    <p className="text-xs text-[#B5B5B5] leading-relaxed">{obs.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
