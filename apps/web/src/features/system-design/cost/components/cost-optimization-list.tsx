"use client";

import * as React from "react";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  DecimalMoney,
  type CostOptimizationOpportunity,
} from "@nxtqr/architecture-intelligence";
import { ChevronDownIcon, ActivityIcon, CheckIcon } from "@nxtqr/icons";

export interface CostOptimizationListProps {
  opportunities: CostOptimizationOpportunity[];
  currency?: string;
  className?: string;
  onSimulateWhatIf?: (opportunity: CostOptimizationOpportunity) => void;
  onApplyToCanvas?: (opportunity: CostOptimizationOpportunity) => void;
}

export function CostOptimizationList({
  opportunities,
  currency = "USD",
  className,
  onSimulateWhatIf,
  onApplyToCanvas,
}: CostOptimizationListProps) {
  if (opportunities.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-md border border-[#262626] bg-[#0A0A0A] p-8 text-center text-white", className)}>
        <ActivityIcon className="mb-2 h-6 w-6 text-[#666666]" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B5B5B5]">
          Architecture Is Cost Optimized
        </h3>
        <p className="mt-1 text-xs text-[#666666]">
          No high-confidence infrastructure reduction opportunities detected without compromising availability or security boundaries.
        </p>
      </div>
    );
  }

  // Calculate total potential monthly savings
  const totalPotentialSavings = opportunities.reduce(
    (acc, opp) => DecimalMoney.add(acc, opp.estimatedMonthlySavings),
    "0.00"
  );
  const formattedPotential = DecimalMoney.format(totalPotentialSavings, currency);

  return (
    <div className={cn("flex flex-col gap-3 rounded-md border border-[#262626] bg-[#0A0A0A] p-4 text-white", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            Architecture Cost Optimizations
          </h3>
          <span className="text-[11px] text-[#666666]">
            {opportunities.length} validated opportunities ({formattedPotential}/mo potential savings)
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {opportunities.map((opp) => {
          const savingsFormatted = DecimalMoney.format(opp.estimatedMonthlySavings, currency);

          return (
            <div
              key={opp.id}
              className="flex flex-col gap-2 rounded-md border border-[#202020] bg-[#0E0E0E] p-3 transition-colors hover:border-[#333333]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">{opp.title}</span>
                  <span className="mt-0.5 text-[11px] leading-relaxed text-[#858585]">
                    {opp.summary}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-md border border-[#262626] bg-[#141414] px-2 py-1 font-mono text-xs font-bold text-white">
                  <ChevronDownIcon className="h-3.5 w-3.5 text-[#B5B5B5]" />
                  <span>-{savingsFormatted}</span>
                  <span className="text-[10px] text-[#666666]">/mo</span>
                </div>
              </div>

              {/* Trade-off Evaluation Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Badge
                  variant="outline"
                  className="rounded-md border-[#262626] bg-[#080808] px-1.5 py-0 text-[10px] text-[#B5B5B5]"
                >
                  Reliability: {opp.tradeoffDetails.reliability}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-[#262626] bg-[#080808] px-1.5 py-0 text-[10px] text-[#B5B5B5]"
                >
                  Complexity: {opp.tradeoffDetails.operationalComplexity}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-[#262626] bg-[#080808] px-1.5 py-0 text-[10px] text-[#B5B5B5]"
                >
                  Confidence: {opp.confidence}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1A1A]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSimulateWhatIf?.(opp)}
                  className="h-6 rounded-md border-[#262626] bg-[#141414] px-2 text-[11px] text-[#B5B5B5] hover:border-[#404040] hover:text-white"
                >
                  Simulate in What-If
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApplyToCanvas?.(opp)}
                  className="h-6 rounded-md border border-[#333333] bg-white px-2 text-[11px] font-medium text-black hover:bg-[#E5E5E5]"
                >
                  <CheckIcon className="mr-1 h-3 w-3" />
                  Apply to Diagram
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

