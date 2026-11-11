"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Migration Plan View Component
 */

import React from "react";
import type { MigrationPlan } from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, CalendarIcon, AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface MigrationPlanViewProps {
  migrationPlan: MigrationPlan | null;
}

export function MigrationPlanView({ migrationPlan }: MigrationPlanViewProps) {
  if (!migrationPlan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#000000] text-center text-[#858585] select-none">
        <ShieldIcon className="w-8 h-8 mb-2 text-[#404040]" />
        <h4 className="text-sm font-medium text-[#FFFFFF] mb-1">No Active Migration Plan</h4>
        <p className="text-xs max-w-sm">
          A migration plan will be automatically synthesized when breaking changes are detected between contract revisions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#262626] bg-[#080808] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">
              Migration Plan: {migrationPlan.contractName}
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
              {migrationPlan.fromRevisionId} → {migrationPlan.toRevisionId}
            </span>
          </div>
          <p className="text-xs text-[#858585] mt-1">
            {migrationPlan.breakingChangesCount} breaking changes affecting {migrationPlan.affectedConsumersCount} downstream consumers.
          </p>
        </div>

        {migrationPlan.compatibilityWindowDays && (
          <div className="flex items-center gap-2 text-xs text-[#858585]">
            <CalendarIcon className="w-4 h-4 text-[#FFFFFF]" />
            <span>Dual-Run Window: {migrationPlan.compatibilityWindowDays} Days</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Phased Steps */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            Sequential Execution Plan ({migrationPlan.steps.length} Steps)
          </h4>

          <div className="space-y-3">
            {migrationPlan.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-3.5 rounded-md bg-[#080808] border border-[#262626] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-[#141414] text-[11px] font-mono font-bold text-[#FFFFFF] border border-[#333333]">
                      {step.stepNumber}
                    </span>
                    <span className="text-xs font-semibold text-[#FFFFFF]">{step.action}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#858585]">
                    Target: {step.targetServiceId}
                  </span>
                </div>

                <p className="text-xs text-[#B5B5B5] leading-relaxed">{step.description}</p>

                {step.verificationCriteria && (
                  <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#666666] font-semibold block">
                      Verification Criteria
                    </span>
                    <div className="flex items-start gap-2 text-xs text-[#B5B5B5]">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-[#858585] shrink-0 mt-0.5" />
                      <span>{step.verificationCriteria}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rollback Considerations */}
        {migrationPlan.rollbackConsiderations && migrationPlan.rollbackConsiderations.length > 0 && (
          <div className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#262626] space-y-2">
            <div className="flex items-center gap-2 text-[#FFFFFF]">
              <AlertCircleIcon className="w-4 h-4 text-[#FFFFFF]" />
              <h5 className="text-xs font-semibold uppercase tracking-wider">
                Rollback Strategy & Safeguards
              </h5>
            </div>
            <div className="pt-1 text-[11px] text-[#858585] space-y-1">
              {migrationPlan.rollbackConsiderations.map((consideration, idx) => (
                <div key={idx} className="font-mono text-[#B5B5B5]">
                  • {consideration}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
