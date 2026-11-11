"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Five-State Readiness Gate Manager & Exception Workflow Component
 */

import React, { useState } from "react";
import type {
  ReadinessGate,
  GateEvaluationResult,
  GateException,
} from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface ReadinessGateManagerProps {
  gates: ReadinessGate[];
  gateEvaluations: GateEvaluationResult[];
  exceptions: GateException[];
  onAddException: (gateId: string, testId: string, reason: string) => void;
}

export function ReadinessGateManager({
  gates,
  gateEvaluations,
  exceptions,
  onAddException,
}: ReadinessGateManagerProps) {
  const [selectedGateId, setSelectedGateId] = useState<string>(gates[0]?.id || "");
  const [exceptionTestId, setExceptionTestId] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");

  const selectedGate = gates.find((g) => g.id === selectedGateId) || gates[0];
  const selectedEval = gateEvaluations.find((ge) => ge.gateId === selectedGateId);

  const handleGrantException = () => {
    if (!exceptionTestId || !exceptionReason.trim()) return;
    onAddException(selectedGateId, exceptionTestId, exceptionReason.trim());
    setExceptionReason("");
    setExceptionTestId("");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626]">
        <div className="text-xs uppercase font-mono text-[#858585]">
          Release & Review Decision Engine
        </div>
        <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">
          Five-State Architecture Readiness Gates
        </h3>
        <p className="text-xs text-[#858585] mt-1 leading-relaxed">
          Evaluates required test suites, blocking rules, evidence freshness, and authorized exceptions before technical design reviews or production releases.
        </p>
      </div>

      {/* Main 2-Pane: Gates Selector & Selected Gate Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gate Selector */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
            Readiness Gates ({gates.length})
          </div>

          <div className="space-y-2">
            {gates.map((gate) => {
              const evalRes = gateEvaluations.find((ge) => ge.gateId === gate.id);
              const isSelected = gate.id === selectedGateId;
              const isPassed = evalRes?.status === "passed";
              const isException = evalRes?.status === "approved_with_exception";
              const isFailed = evalRes?.status === "failed";

              return (
                <button
                  key={gate.id}
                  onClick={() => setSelectedGateId(gate.id)}
                  className={`w-full p-4 rounded-md text-left transition-all border space-y-2 ${
                    isSelected
                      ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                      : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#FFFFFF] font-bold">{gate.id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 ${
                        isPassed
                          ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                          : isException
                            ? "bg-[#141414] text-[#38bdf8] border border-[#333333]"
                            : isFailed
                              ? "bg-[#1f1010] text-[#ef4444] border border-[#4a1c1c]"
                              : "bg-[#1a1408] text-[#FFAA00] border border-[#423010]"
                      }`}
                    >
                      {evalRes?.status.toUpperCase() || "UNKNOWN"}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-[#FFFFFF] leading-snug">{gate.title}</h4>
                  <p className="text-xs text-[#858585] line-clamp-1">{gate.description}</p>

                  <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-[11px] font-mono text-[#666666]">
                    <span>{gate.requiredTestIds.length} required tests</span>
                    <span>Min pass: {gate.blockingRules.minPassRatePercent}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Gate Inspection */}
        {selectedGate && selectedEval && (
          <div className="lg:col-span-2 rounded-md bg-[#080808] border border-[#262626] p-5 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#262626]">
              <div>
                <div className="text-xs uppercase font-mono text-[#858585]">
                  {selectedGate.id} · {selectedGate.category}
                </div>
                <h3 className="text-lg font-bold text-[#FFFFFF] mt-0.5">{selectedGate.title}</h3>
                <p className="text-xs text-[#B5B5B5] mt-1">{selectedGate.description}</p>
              </div>

              <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] text-center shrink-0 min-w-[140px]">
                <div className="text-[10px] font-mono uppercase text-[#858585]">Gate Status</div>
                <div
                  className={`text-lg font-mono font-bold mt-0.5 ${
                    selectedEval.status === "passed"
                      ? "text-[#22c55e]"
                      : selectedEval.status === "approved_with_exception"
                        ? "text-[#38bdf8]"
                        : "text-[#ef4444]"
                  }`}
                >
                  {selectedEval.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Blocking Issues or Notes */}
            {selectedEval.blockingReasons.length > 0 && (
              <div className="p-4 rounded-md bg-[#190c0c] border border-[#421818] space-y-2 text-xs">
                <div className="font-bold text-[#ef4444] flex items-center gap-1.5 text-sm">
                  <AlertCircleIcon size={16} />
                  Gate Blocking Issues ({selectedEval.blockingReasons.length})
                </div>
                <ul className="space-y-1 text-[#fca5a5] list-disc list-inside leading-relaxed text-[11px]">
                  {selectedEval.blockingReasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedEval.notes.length > 0 && (
              <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1.5 text-xs">
                <div className="font-semibold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldIcon size={14} />
                  Authorized Exception Notes
                </div>
                {selectedEval.notes.map((n, idx) => (
                  <p key={idx} className="text-[#B5B5B5] text-[11px] leading-relaxed">
                    {n}
                  </p>
                ))}
              </div>
            )}

            {/* Authorized Exception Workflow */}
            <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-3">
              <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
                Grant Authorized Architecture Exception
              </div>
              <p className="text-xs text-[#858585] leading-relaxed">
                Exceptions require documented technical justification and authorized approver. Exceptions do not turn failures into passes; they mark the gate as approved with exception.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-[#858585] block mb-1">Target Test ID</label>
                  <select
                    value={exceptionTestId}
                    onChange={(e) => setExceptionTestId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF]"
                  >
                    <option value="">Select test...</option>
                    {selectedGate.requiredTestIds.map((tid) => (
                      <option key={tid} value={tid}>
                        {tid}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] text-[#858585] block mb-1">
                    Justification & Compensating Controls
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Document compensating control or approved rationale..."
                      value={exceptionReason}
                      onChange={(e) => setExceptionReason(e.target.value)}
                      className="w-full bg-[#141414] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-[#FFFFFF] placeholder-[#666666]"
                    />
                    <button
                      onClick={handleGrantException}
                      disabled={!exceptionTestId || !exceptionReason.trim()}
                      className="px-3 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-[#262626] disabled:opacity-50 border border-[#404040] text-xs font-semibold text-[#FFFFFF] shrink-0"
                    >
                      Authorize
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Gate Exceptions List */}
              {exceptions.filter((ex) => ex.gateId === selectedGate.id).length > 0 && (
                <div className="pt-3 border-t border-[#1A1A1A] space-y-2">
                  <div className="text-[11px] font-mono uppercase text-[#858585]">
                    Active Exceptions ({exceptions.filter((ex) => ex.gateId === selectedGate.id).length})
                  </div>
                  <div className="space-y-1.5">
                    {exceptions
                      .filter((ex) => ex.gateId === selectedGate.id)
                      .map((ex) => (
                        <div
                          key={ex.id}
                          className="p-2.5 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-mono text-[#FFFFFF] text-[11px] font-semibold">
                              {ex.testId} · Approved by {ex.approvedBy}
                            </div>
                            <div className="text-[#858585] text-[11px]">{ex.justification}</div>
                          </div>
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#1a1408] text-[#FFAA00] border border-[#3a2810]">
                            {ex.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

