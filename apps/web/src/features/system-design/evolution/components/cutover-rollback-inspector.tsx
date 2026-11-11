"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Cutover Readiness & Rollback Feasibility Inspector Component
 */

import React from "react";
import type {
  CutoverPlan,
  RollbackPlan,
  MigrationWave,
} from "@nxtqr/architecture-intelligence";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
} from "@nxtqr/icons";

interface CutoverRollbackInspectorProps {
  cutoverPlans: CutoverPlan[];
  rollbackPlans: RollbackPlan[];
  waves: MigrationWave[];
}

export function CutoverRollbackInspector({
  cutoverPlans,
  rollbackPlans,
  waves,
}: CutoverRollbackInspectorProps) {
  const primaryCutover = cutoverPlans[0];
  const irreversiblePlan = rollbackPlans.find((p) => p.feasibilityStatus === "irreversible");

  return (
    <div className="space-y-6">
      {/* Point of No Return Alert Banner */}
      {irreversiblePlan && (
        <div className="p-4 rounded-md bg-[#140808] border border-[#3b1212] flex items-start gap-3">
          <AlertCircleIcon size={20} className="text-[#ef4444] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#FFFFFF]">
              Irreversible Point of No Return Boundary Identified
            </h4>
            <p className="text-xs text-[#fca5a5] leading-relaxed">
              {irreversiblePlan.pointOfNoReturnWarning}
            </p>
            <div className="text-[11px] font-mono text-[#858585] pt-1">
              Governance requirement: 14-day production soak under 100% traffic before executing irreversible decommissioning.
            </div>
          </div>
        </div>
      )}

      {/* Progressive Traffic Shifting Plan */}
      {primaryCutover && (
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase font-mono text-[#858585]">Cutover Orchestration</div>
              <h3 className="text-base font-bold text-[#FFFFFF]">Progressive Weighted Traffic Shifting</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#B5B5B5]">
                Type: {primaryCutover.cutoverType}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#B5B5B5]">
                Owner: {primaryCutover.owner}
              </span>
            </div>
          </div>

          {/* 4 Shifting Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {primaryCutover.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[#858585]">STEP {step.stepNumber}</span>
                  <span className="font-mono text-[#FFFFFF] font-bold text-sm">{step.weightPercent}% Traffic</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="h-1.5 w-full bg-[#1A1A1A] rounded-md overflow-hidden">
                  <div
                    className="h-full bg-[#22c55e] rounded-md"
                    style={{ width: `${step.weightPercent}%` }}
                  />
                </div>

                <div className="text-[11px] text-[#858585] flex items-center gap-1 font-mono">
                  <CalendarIcon size={12} />
                  Soak: {step.soakDurationMinutes >= 60 ? `${step.soakDurationMinutes / 60}h` : `${step.soakDurationMinutes}m`}
                </div>

                <div className="text-[11px] text-[#B5B5B5] leading-relaxed pt-1 border-t border-[#1A1A1A]">
                  {step.healthCriteria}
                </div>
              </div>
            ))}
          </div>

          {/* Automated Rollback Triggers */}
          <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
            <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
              Automated Rollback Triggers (Circuit Breakers)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {primaryCutover.rollbackTriggers.map((trig, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5] flex items-center gap-2"
                >
                  <AlertCircleIcon size={14} className="text-[#FFAA00] shrink-0" />
                  <span>{trig}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wave-by-Wave Rollback Feasibility Table */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
          Rollback Feasibility Register Across Migration Waves
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#202020] text-[#858585] font-mono">
                <th className="pb-2 font-medium">Wave</th>
                <th className="pb-2 font-medium">Feasibility Status</th>
                <th className="pb-2 font-medium">Reversibility</th>
                <th className="pb-2 font-medium">Traffic Restoration Procedure</th>
                <th className="pb-2 font-medium text-right">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A] text-[#B5B5B5]">
              {rollbackPlans.map((plan) => {
                const wave = waves.find((w) => w.id === plan.waveId);
                const isIrreversible = plan.feasibilityStatus === "irreversible";

                return (
                  <tr key={plan.id} className="hover:bg-[#0D0D0D]">
                    <td className="py-2.5 font-semibold text-[#FFFFFF]">
                      {wave?.title || plan.waveId}
                    </td>
                    <td className="py-2.5 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] ${
                          isIrreversible
                            ? "bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]"
                            : "bg-[#141414] border border-[#262626] text-[#22c55e]"
                        }`}
                      >
                        {plan.feasibilityStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {plan.isFeasible ? (
                        <span className="flex items-center gap-1 text-[#22c55e]">
                          <CheckCircleIcon size={12} /> Reversible
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#ef4444]">
                          <AlertCircleIcon size={12} /> Point of No Return
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-[#858585] max-w-xs truncate">
                      {plan.trafficRestorationSteps[0] || "Standard rollback"}
                    </td>
                    <td className="py-2.5 text-right font-mono text-[#858585]">
                      {plan.responsibleOwner}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

