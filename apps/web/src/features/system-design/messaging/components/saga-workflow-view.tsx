"use client";

/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Saga Workflow & Distributed Transaction Inspector
 */

import React from "react";
import type { SagaWorkflow } from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, LayersIcon } from "@nxtqr/icons";

export interface SagaWorkflowViewProps {
  sagas: SagaWorkflow[];
  selectedSagaId?: string;
  onSelectSaga: (id: string) => void;
}

export function SagaWorkflowView({
  sagas,
  selectedSagaId,
  onSelectSaga,
}: SagaWorkflowViewProps) {
  const activeSaga = sagas.find((s) => s.id === selectedSagaId) || sagas[0];

  return (
    <div className="p-4 space-y-4 bg-[#080808] border border-[#262626] rounded-md text-xs text-[#FFFFFF]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase font-mono tracking-wider text-[#FFFFFF]">
          <LayersIcon className="w-3.5 h-3.5 text-[#858585]" />
          Distributed Sagas & Consistency ({sagas.length})
        </div>
        {activeSaga && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
              activeSaga.consistencyAnalysis.isFullyCompensated
                ? "bg-[#141414] border-[#262626] text-[#B5B5B5]"
                : "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
            }`}
          >
            {activeSaga.consistencyAnalysis.isFullyCompensated
              ? "Fully Compensated"
              : "Uncompensated Risks"}
          </span>
        )}
      </div>

      {/* Saga Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sagas.map((saga) => {
          const isSelected = saga.id === activeSaga?.id;
          return (
            <button
              key={saga.id}
              onClick={() => onSelectSaga(saga.id)}
              className={`px-3 py-1.5 rounded-md border text-left shrink-0 transition-colors font-mono ${
                isSelected
                  ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                  : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:border-[#333333] hover:text-[#FFFFFF]"
              }`}
            >
              <div className="font-semibold">{saga.name}</div>
              <div className="text-[10px] text-[#666666] mt-0.5 uppercase">
                {saga.type} • {saga.states.length} states
              </div>
            </button>
          );
        })}
      </div>

      {activeSaga ? (
        <div className="space-y-4">
          {/* Consistency Assessment Banner */}
          <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
            <div className="text-[10px] uppercase font-mono text-[#858585] tracking-wider">
              Saga Consistency & Rollback Audit
            </div>
            <p className="text-xs text-[#B5B5B5] leading-relaxed">
              {activeSaga.consistencyAnalysis.riskSummary}
            </p>

            {activeSaga.consistencyAnalysis.uncompensatedStates.length > 0 && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#FFFFFF]">
                <AlertTriangleIcon className="w-3.5 h-3.5 text-[#B5B5B5] shrink-0" />
                <span>
                  Uncompensated States:{" "}
                  <strong>
                    {activeSaga.consistencyAnalysis.uncompensatedStates.join(", ")}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* State Machine Transitions */}
          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
            <div className="text-[10px] uppercase font-mono text-[#858585] tracking-wider">
              State Transitions & Compensating Actions
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-[#262626] text-[#858585]">
                    <th className="py-1.5 pr-2">From State</th>
                    <th className="py-1.5 px-2">To State</th>
                    <th className="py-1.5 px-2">Trigger Event</th>
                    <th className="py-1.5 px-2">Action Service</th>
                    <th className="py-1.5 px-2">Type</th>
                    <th className="py-1.5 pl-2">Timeout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {activeSaga.transitions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-[#141414]">
                      <td className="py-1.5 pr-2 font-semibold text-[#FFFFFF]">{t.fromState}</td>
                      <td className="py-1.5 px-2 text-[#FFFFFF]">{t.toState}</td>
                      <td className="py-1.5 px-2 text-[#B5B5B5]">{t.triggerEvent}</td>
                      <td className="py-1.5 px-2 text-[#858585]">{t.actionServiceId}</td>
                      <td className="py-1.5 px-2">
                        {t.isCompensating ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#1A1A1A] border border-[#404040] text-[#FFFFFF] text-[10px]">
                            Compensating
                          </span>
                        ) : (
                          <span className="text-[#858585]">Forward</span>
                        )}
                      </td>
                      <td className="py-1.5 pl-2 text-[#858585]">
                        {t.timeoutSeconds ? `${t.timeoutSeconds}s` : "None (Risk)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-[#666666] border border-[#202020] rounded-md">
          No Saga workflows configured.
        </div>
      )}
    </div>
  );
}
