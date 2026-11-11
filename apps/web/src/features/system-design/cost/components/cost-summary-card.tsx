"use client";

import * as React from "react";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  DecimalMoney,
  type CostEstimate,
} from "@nxtqr/architecture-intelligence";
import { CheckIcon, AlertCircleIcon, HelpCircleIcon } from "@nxtqr/icons";

export interface CostSummaryCardProps {
  estimate: CostEstimate;
  className?: string;
  isWhatIfActive?: boolean;
}

export function CostSummaryCard({
  estimate,
  className,
  isWhatIfActive = false,
}: CostSummaryCardProps) {
  const formattedMonthly = DecimalMoney.format(estimate.totalMonthlyCost, estimate.currency);
  const formattedAnnual = DecimalMoney.format(estimate.totalAnnualCost, estimate.currency);
  const formattedFixed = DecimalMoney.format(estimate.fixedMonthlyCost, estimate.currency);
  const formattedVariable = DecimalMoney.format(estimate.variableMonthlyCost, estimate.currency);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border border-[#262626] bg-[#0A0A0A] p-4 text-white shadow-level-1",
        isWhatIfActive && "border-[#333333] bg-[#0D0D0D]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#858585]">
            {isWhatIfActive ? "Candidate Modeled Cost" : "Baseline Modeled Cost"}
          </span>
          {isWhatIfActive && (
            <Badge
              variant="outline"
              className="rounded-md border-[#333333] bg-[#141414] px-1.5 py-0 text-[10px] text-[#B5B5B5]"
            >
              What-If Simulation
            </Badge>
          )}
        </div>

        {/* Honest Completeness Indicator */}
        {estimate.status === "complete" ? (
          <div className="flex items-center gap-1.5 rounded-md border border-[#202020] bg-[#111111] px-2 py-0.5 text-xs text-[#B5B5B5]">
            <CheckIcon className="h-3.5 w-3.5 text-[#555555]" />
            <span>Complete</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-md border border-[#2E2E2E] bg-[#141414] px-2 py-0.5 text-xs text-[#E5A84B]">
            <AlertCircleIcon className="h-3.5 w-3.5 text-[#E5A84B]" />
            <span>
              Partial ({estimate.unpricedResourcesCount} unpriced)
            </span>
          </div>
        )}
      </div>

      {/* Main Monthly Cost */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tracking-tight text-white">
          {formattedMonthly}
        </span>
        <span className="text-xs text-[#858585]">/ month</span>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-3 gap-2 border-t border-[#1F1F1F] pt-3 text-xs">
        <div>
          <span className="block text-[#858585]">Annual Run-Rate</span>
          <span className="font-mono font-medium text-[#B5B5B5]">{formattedAnnual}</span>
        </div>
        <div>
          <span className="block text-[#858585]">Fixed Compute & DB</span>
          <span className="font-mono font-medium text-[#B5B5B5]">{formattedFixed}</span>
        </div>
        <div>
          <span className="block text-[#858585]">Variable (Transfer/Req)</span>
          <span className="font-mono font-medium text-[#B5B5B5]">{formattedVariable}</span>
        </div>
      </div>

      {/* Disclaimer on modeled nature */}
      <div className="flex items-center gap-1 text-[11px] text-[#666666]">
        <HelpCircleIcon className="h-3 w-3 shrink-0" />
        <span>Modeled estimate based on declared architecture & 730 hr/mo schedule; not an actual cloud bill.</span>
      </div>
    </div>
  );
}

