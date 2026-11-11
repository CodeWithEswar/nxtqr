"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Coverage Explorer View Component
 */

import React from "react";
import type { VerificationCoverageResult } from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface CoverageExplorerViewProps {
  coverage: VerificationCoverageResult;
}

export function CoverageExplorerView({ coverage }: CoverageExplorerViewProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626]">
        <div className="text-xs uppercase font-mono text-[#858585]">Verification Completeness</div>
        <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">Architecture Coverage Metrics</h3>
        <p className="text-xs text-[#858585] mt-1">
          Quantitative tracking of requirements backed by tests, architecture components exercised, and evidence catalog coverage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Requirement Coverage */}
        <div className="p-5 rounded-md bg-[#080808] border border-[#262626] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#858585] uppercase">Requirements Coverage</span>
            <CheckCircleIcon size={14} className="text-[#22c55e]" />
          </div>

          <div className="text-3xl font-bold font-mono text-[#FFFFFF]">
            {coverage.requirementCoveragePercent}%
          </div>

          <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#22c55e] h-full rounded-full transition-all"
              style={{ width: `${coverage.requirementCoveragePercent}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-[#858585] pt-1">
            {coverage.coveredRequirementsCount} of {coverage.totalRequirementsCount} requirements linked
          </div>
        </div>

        {/* Component Coverage */}
        <div className="p-5 rounded-md bg-[#080808] border border-[#262626] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#858585] uppercase">Component Coverage</span>
            <ShieldIcon size={14} className="text-[#38bdf8]" />
          </div>

          <div className="text-3xl font-bold font-mono text-[#FFFFFF]">
            {coverage.componentCoveragePercent}%
          </div>

          <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#38bdf8] h-full rounded-full transition-all"
              style={{ width: `${coverage.componentCoveragePercent}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-[#858585] pt-1">
            {coverage.testedComponentsCount} of {coverage.totalComponentsCount} nodes evaluated
          </div>
        </div>

        {/* Evidence Coverage */}
        <div className="p-5 rounded-md bg-[#080808] border border-[#262626] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#858585] uppercase">Evidence Coverage</span>
            <ShieldIcon size={14} className="text-[#FFAA00]" />
          </div>

          <div className="text-3xl font-bold font-mono text-[#FFFFFF]">
            {coverage.evidenceCoveragePercent}%
          </div>

          <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#FFAA00] h-full rounded-full transition-all"
              style={{ width: `${coverage.evidenceCoveragePercent}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-[#858585] pt-1">
            {coverage.evidenceTypesSuppliedCount} of {coverage.evidenceTypesRequiredCount} types verified
          </div>
        </div>
      </div>
    </div>
  );
}

