"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import {
  DecimalMoney,
  type CostEstimate,
  type BillableResourceCategory,
} from "@nxtqr/architecture-intelligence";

export interface CostCategoryChartProps {
  estimate: CostEstimate;
  className?: string;
  onSelectCategory?: (category: BillableResourceCategory) => void;
}

const CATEGORY_NAMES: Record<BillableResourceCategory, string> = {
  compute: "Compute Fleet",
  database: "Managed Databases",
  cache: "In-Memory Cache",
  storage: "Object & Block Storage",
  network: "Network & Egress",
  serverless: "Serverless Execution",
  messaging: "Queues & Streaming",
  observability: "Monitoring & Logs",
  external_api: "Third-Party APIs",
  other: "Other Infrastructure",
};

export function CostCategoryChart({
  estimate,
  className,
  onSelectCategory,
}: CostCategoryChartProps) {
  // Extract active categories with > $0 cost or unpriced items
  const activeCategories = React.useMemo(() => {
    return Object.values(estimate.categorySummaries).filter(
      (cat) => DecimalMoney.compare(cat.monthlyCost, "0.00") === 1 || cat.unpricedCount > 0
    );
  }, [estimate.categorySummaries]);

  // Sort descending by cost
  const sortedCategories = React.useMemo(() => {
    return [...activeCategories].sort((a, b) =>
      DecimalMoney.compare(b.monthlyCost, a.monthlyCost)
    );
  }, [activeCategories]);

  return (
    <div className={cn("flex flex-col gap-3 rounded-md border border-[#262626] bg-[#0A0A0A] p-4 text-white", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
          Cost by Resource Category
        </h3>
        <span className="font-mono text-xs text-[#858585]">
          {sortedCategories.length} Active Categories
        </span>
      </div>

      {/* Stacked Proportional Bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-md border border-[#202020] bg-[#141414]">
        {sortedCategories.map((cat, idx) => {
          const widthPct = Math.max(2, cat.percentageOfTotal);
          // Monochrome gradients of gray
          const opacities = ["bg-white", "bg-[#D4D4D4]", "bg-[#A3A3A3]", "bg-[#737373]", "bg-[#525252]", "bg-[#404040]"];
          const barColor = opacities[idx % opacities.length];

          return (
            <div
              key={cat.category}
              style={{ width: `${widthPct}%` }}
              title={`${CATEGORY_NAMES[cat.category]}: ${cat.percentageOfTotal}% ($${cat.monthlyCost})`}
              className={cn("h-full transition-all duration-300", barColor)}
            />
          );
        })}
      </div>

      {/* List breakdown */}
      <div className="flex flex-col gap-2 pt-1">
        {sortedCategories.map((cat) => {
          const formatted = DecimalMoney.format(cat.monthlyCost, estimate.currency);

          return (
            <button
              key={cat.category}
              onClick={() => onSelectCategory?.(cat.category)}
              className="flex items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-[#262626] hover:bg-[#111111]"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white">
                    {CATEGORY_NAMES[cat.category] || cat.category}
                  </span>
                  <span className="text-[10px] text-[#666666]">
                    ({cat.lineItemCount} {cat.lineItemCount === 1 ? "resource" : "resources"})
                  </span>
                  {cat.unpricedCount > 0 && (
                    <span className="rounded-md border border-[#333333] bg-[#141414] px-1 text-[9px] text-[#E5A84B]">
                      {cat.unpricedCount} unpriced
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-[#B5B5B5]">
                  {formatted}
                </span>
                <span className="font-mono text-[10px] text-[#666666]">
                  {cat.percentageOfTotal.toFixed(1)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

