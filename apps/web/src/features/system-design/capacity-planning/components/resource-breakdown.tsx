"use client";

import * as React from "react";
import type {
  ResourceCategory,
  ResourceCategorySummary,
  ComponentCapacityEvaluation,
} from "@nxtqr/architecture-intelligence";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { LayersIcon } from "@nxtqr/icons";

export interface ResourceBreakdownProps {
  categorySummaries: Record<ResourceCategory, ResourceCategorySummary>;
  componentEvaluations: Record<string, ComponentCapacityEvaluation>;
  onSelectCategory?: (category: ResourceCategory) => void;
  selectedCategory?: ResourceCategory | null;
  className?: string;
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  compute: "Compute Services",
  database: "Databases & Storage",
  cache: "Caching Layers",
  messaging: "Queues & Event Streams",
  network: "Network & Gateways",
  storage: "Object & Block Storage",
  external_api: "Third-party APIs",
};

export function ResourceBreakdown({
  categorySummaries,
  onSelectCategory,
  selectedCategory,
  className,
}: ResourceBreakdownProps) {
  const categories = Object.values(categorySummaries).filter((c) => c.totalComponents > 0);

  if (categories.length === 0) {
    return (
      <div className="p-4 text-center font-mono text-xs text-text-muted bg-surface-02 border border-border-default rounded-md">
        No categorized infrastructure components found in topology.
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2.5 select-none", className)}>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.category;
        const hasSaturation = cat.saturatedCount > 0;
        const hasWarning = cat.warningCount > 0;
        const avgUtil = cat.averageUtilizationRatio !== undefined ? Math.round(cat.averageUtilizationRatio * 100) : null;

        return (
          <div
            key={cat.category}
            role="button"
            tabIndex={0}
            onClick={() => onSelectCategory?.(cat.category)}
            className={cn(
              "p-3 rounded-md border text-left transition-all cursor-pointer",
              isSelected
                ? "bg-surface-04 border-border-strong shadow-level-3"
                : "bg-surface-02 hover:bg-surface-03 border-border-default hover:border-border-hover"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <LayersIcon size={14} className="text-text-secondary" />
                <span className="font-mono text-xs font-bold text-foreground">
                  {CATEGORY_LABELS[cat.category] || cat.category}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-surface-01 text-text-muted border-border-subtle">
                {cat.totalComponents} {cat.totalComponents === 1 ? "node" : "nodes"}
              </Badge>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle font-mono text-[11px]">
              <div>
                <span className="text-text-muted block text-[10px]">Earliest Saturation</span>
                <span className={cn(
                  "font-semibold",
                  hasSaturation ? "text-rose-400" : hasWarning ? "text-amber-400" : "text-emerald-400"
                )}>
                  {cat.earliestSaturationLabel || "Headroom OK"}
                </span>
              </div>

              <div>
                <span className="text-text-muted block text-[10px]">Average Utilization</span>
                <span className="font-semibold text-text-secondary">
                  {avgUtil !== null ? `${avgUtil}%` : "—"}
                </span>
              </div>
            </div>

            {/* Status distribution bar */}
            <div className="w-full h-1.5 bg-surface-04 rounded-md overflow-hidden flex mt-2.5">
              {cat.saturatedCount > 0 && (
                <div
                  style={{ width: `${(cat.saturatedCount / cat.totalComponents) * 100}%` }}
                  className="bg-rose-500 h-full"
                  title={`${cat.saturatedCount} saturated`}
                />
              )}
              {cat.warningCount > 0 && (
                <div
                  style={{ width: `${(cat.warningCount / cat.totalComponents) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title={`${cat.warningCount} warning`}
                />
              )}
              {cat.optimalCount > 0 && (
                <div
                  style={{ width: `${(cat.optimalCount / cat.totalComponents) * 100}%` }}
                  className="bg-emerald-500/80 h-full"
                  title={`${cat.optimalCount} optimal`}
                />
              )}
              {cat.unknownCount > 0 && (
                <div
                  style={{ width: `${(cat.unknownCount / cat.totalComponents) * 100}%` }}
                  className="bg-surface-04 h-full"
                  title={`${cat.unknownCount} undeclared`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
