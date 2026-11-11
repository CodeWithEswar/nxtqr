"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import {
  DecimalMoney,
  type CostComparisonResult,
  type CostEstimate,
} from "@nxtqr/architecture-intelligence";
import { ChevronDownIcon, ChevronUpIcon } from "@nxtqr/icons";

export interface CostComparisonViewProps {
  baselineEstimate: CostEstimate;
  candidateEstimate: CostEstimate;
  comparisonResult: CostComparisonResult;
  className?: string;
}

export function CostComparisonView({
  baselineEstimate,
  candidateEstimate,
  comparisonResult,
  className,
}: CostComparisonViewProps) {
  const isCandidateCheaper = DecimalMoney.compare(comparisonResult.netMonthlySavings, "0.00") === 1;
  const isCostIdentical = DecimalMoney.isZero(comparisonResult.netMonthlySavings);

  const baseFormatted = DecimalMoney.format(baselineEstimate.totalMonthlyCost, baselineEstimate.currency);
  const candFormatted = DecimalMoney.format(candidateEstimate.totalMonthlyCost, candidateEstimate.currency);
  const netSavingsFormatted = DecimalMoney.format(
    DecimalMoney.compare(comparisonResult.netMonthlySavings, "0.00") === -1
      ? DecimalMoney.subtract("0.00", comparisonResult.netMonthlySavings)
      : comparisonResult.netMonthlySavings,
    baselineEstimate.currency
  );

  return (
    <div className={cn("flex flex-col gap-4 rounded-md border border-[#262626] bg-[#0A0A0A] p-4 text-white", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            Baseline vs Candidate Architecture Comparison
          </h3>
          <span className="text-[11px] text-[#666666]">
            Differential monetary impact & line-item variance
          </span>
        </div>

        {/* Net delta badge */}
        <div
          className={cn(
            "flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs font-bold",
            isCostIdentical
              ? "border-[#262626] bg-[#141414] text-[#858585]"
              : isCandidateCheaper
              ? "border-[#333333] bg-[#111111] text-white"
              : "border-[#404040] bg-[#141414] text-[#B5B5B5]"
          )}
        >
          {isCandidateCheaper ? (
            <>
              <ChevronDownIcon className="h-3.5 w-3.5 text-[#B5B5B5]" />
              <span>Net Savings: {netSavingsFormatted}/mo ({Math.abs(comparisonResult.percentageDifference)}%)</span>
            </>
          ) : isCostIdentical ? (
            <span>No Cost Delta ($0.00/mo)</span>
          ) : (
            <>
              <ChevronUpIcon className="h-3.5 w-3.5 text-[#B5B5B5]" />
              <span>Additional Cost: +{netSavingsFormatted}/mo (+{comparisonResult.percentageDifference}%)</span>
            </>
          )}
        </div>
      </div>

      {/* Side-by-Side Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Baseline Card */}
        <div className="flex flex-col gap-2 rounded-md border border-[#202020] bg-[#0C0C0C] p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#858585]">
            Baseline Architecture
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[#B5B5B5]">{baseFormatted}</span>
            <span className="text-[11px] text-[#666666]">/mo</span>
          </div>
          <span className="text-[11px] text-[#858585]">
            {baselineEstimate.lineItems.length} billable resources
          </span>
        </div>

        {/* Candidate Card */}
        <div className="flex flex-col gap-2 rounded-md border border-[#262626] bg-[#111111] p-3 shadow-level-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B5B5B5]">
            Candidate What-If Architecture
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-white">{candFormatted}</span>
            <span className="text-[11px] text-[#666666]">/mo</span>
          </div>
          <span className="text-[11px] text-[#858585]">
            {candidateEstimate.lineItems.length} billable resources
          </span>
        </div>
      </div>

      {/* Modified Line Items */}
      {comparisonResult.modifiedLineItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#858585]">
            Modified Resources ({comparisonResult.modifiedLineItems.length})
          </span>
          <div className="flex flex-col gap-1.5 rounded-md border border-[#202020] bg-[#080808] p-2">
            {comparisonResult.modifiedLineItems.map((mod, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs border-b border-[#141414] py-1.5 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-white">{mod.nodeLabel}</span>
                  <span className="text-[10px] text-[#666666] uppercase">{mod.category}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#858585]">
                    {DecimalMoney.format(mod.baselineCost, baselineEstimate.currency)}
                  </span>
                  <span className="text-[#666666]">→</span>
                  <span className="font-semibold text-white">
                    {DecimalMoney.format(mod.candidateCost, baselineEstimate.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Added / Removed Line Items */}
      {(comparisonResult.addedLineItems.length > 0 || comparisonResult.removedLineItems.length > 0) && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          {comparisonResult.addedLineItems.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-md border border-[#202020] bg-[#080808] p-2.5">
              <span className="font-semibold text-white">
                + Added ({comparisonResult.addedLineItems.length})
              </span>
              {comparisonResult.addedLineItems.map((item) => (
                <div key={item.id} className="flex justify-between text-[11px] text-[#B5B5B5]">
                  <span>{item.nodeLabel}</span>
                  <span className="font-mono">+{DecimalMoney.format(item.extendedMonthlyCost, baselineEstimate.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {comparisonResult.removedLineItems.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-md border border-[#202020] bg-[#080808] p-2.5">
              <span className="font-semibold text-white">
                - Removed ({comparisonResult.removedLineItems.length})
              </span>
              {comparisonResult.removedLineItems.map((item) => (
                <div key={item.id} className="flex justify-between text-[11px] text-[#B5B5B5]">
                  <span>{item.nodeLabel}</span>
                  <span className="font-mono">-{DecimalMoney.format(item.extendedMonthlyCost, baselineEstimate.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

