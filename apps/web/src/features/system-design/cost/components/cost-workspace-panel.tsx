"use client";

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  RefreshIcon,
  CloseIcon,
  CheckIcon,
} from "@nxtqr/icons";
import { useCostEstimation } from "../hooks/use-cost-estimation";
import { CostSummaryCard } from "./cost-summary-card";
import { CostCategoryChart } from "./cost-category-chart";
import { CostLineItemsTable } from "./cost-line-items-table";
import { CostOptimizationList } from "./cost-optimization-list";
import { CostForecastChart } from "./cost-forecast-chart";
import { CostComparisonView } from "./cost-comparison-view";
import type { CloudProviderId, BillableResourceCategory } from "@nxtqr/architecture-intelligence";

export interface CostWorkspacePanelProps {
  className?: string;
  onClose?: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export function CostWorkspacePanel({
  className,
  onClose,
  onSelectNode,
}: CostWorkspacePanelProps) {
  const {
    selectedProviderId,
    setSelectedProviderId,
    baselineEstimate,
    candidateEstimate,
    comparisonResult,
    optimizationOpportunities,
    costForecast,
    hasWhatIfChanges,
    clearWhatIf,
    applyOptimizationToWhatIf,
    commitWhatIfToGraph,
  } = useCostEstimation();

  const [activeTab, setActiveTab] = React.useState<string>("overview");
  const [selectedCategory, setSelectedCategory] = React.useState<BillableResourceCategory | null>(null);

  const activeEstimate = hasWhatIfChanges ? candidateEstimate : baselineEstimate;

  const handleCategorySelect = React.useCallback((category: BillableResourceCategory) => {
    setSelectedCategory(category);
    setActiveTab("line-items");
  }, []);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col border-l border-[#262626] bg-black text-white",
        className
      )}
    >
      {/* Studio Header */}
      <div className="flex items-center justify-between border-b border-[#202020] bg-[#080808] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md border border-[#333333] bg-[#141414] font-mono text-xs font-bold text-white">
            $
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              Cost Intelligence
            </h2>
            <p className="text-[10px] text-[#858585]">
              Provider-Aware Infrastructure Cost Modeling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Provider Select Buttons */}
          <div className="flex rounded-md border border-[#262626] bg-[#0E0E0E] p-0.5">
            {(["aws", "gcp", "azure", "cloudflare"] as CloudProviderId[]).map((prov) => (
              <button
                key={prov}
                onClick={() => setSelectedProviderId(prov)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase transition-colors",
                  selectedProviderId === prov
                    ? "bg-[#262626] text-white"
                    : "text-[#858585] hover:text-[#B5B5B5]"
                )}
              >
                {prov}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-[#858585] hover:border-[#333333] hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* What-If Sticky Banner */}
      {hasWhatIfChanges && (
        <div className="flex items-center justify-between border-b border-[#333333] bg-[#141414] px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="font-medium text-white">
              What-If Cost Simulation Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={clearWhatIf}
              className="h-6 rounded-md border-[#262626] bg-[#0A0A0A] px-2 text-[11px] text-[#B5B5B5] hover:border-[#404040] hover:text-white"
            >
              <RefreshIcon className="mr-1 h-3 w-3" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={commitWhatIfToGraph}
              className="h-6 rounded-md border border-[#333333] bg-white px-2 text-[11px] font-medium text-black hover:bg-[#E5E5E5]"
            >
              <CheckIcon className="mr-1 h-3 w-3" />
              Commit to Canvas
            </Button>
          </div>
        </div>
      )}

      {/* Tabs Control */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-[#202020] bg-[#0A0A0A] px-4">
          <TabsList className="h-8 gap-1 border-0 bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="h-7 rounded-md px-2.5 text-xs text-[#858585] data-[state=active]:border-[#262626] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="line-items"
              className="h-7 rounded-md px-2.5 text-xs text-[#858585] data-[state=active]:border-[#262626] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"
            >
              Line Items ({activeEstimate.lineItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="optimizations"
              className="h-7 rounded-md px-2.5 text-xs text-[#858585] data-[state=active]:border-[#262626] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"
            >
              Optimizations ({optimizationOpportunities.length})
            </TabsTrigger>
            <TabsTrigger
              value="forecast"
              className="h-7 rounded-md px-2.5 text-xs text-[#858585] data-[state=active]:border-[#262626] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"
            >
              12M Forecast
            </TabsTrigger>
            <TabsTrigger
              value="compare"
              className="h-7 rounded-md px-2.5 text-xs text-[#858585] data-[state=active]:border-[#262626] data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"
            >
              Compare
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="overview" className="mt-0 flex flex-col gap-4">
            <CostSummaryCard
              estimate={activeEstimate}
              isWhatIfActive={hasWhatIfChanges}
            />
            <CostCategoryChart
              estimate={activeEstimate}
              onSelectCategory={handleCategorySelect}
            />
            <CostOptimizationList
              opportunities={optimizationOpportunities.slice(0, 3)}
              currency={activeEstimate.currency}
              onSimulateWhatIf={applyOptimizationToWhatIf}
              onApplyToCanvas={applyOptimizationToWhatIf}
            />
          </TabsContent>

          <TabsContent value="line-items" className="mt-0">
            <CostLineItemsTable
              estimate={activeEstimate}
              onSelectNode={onSelectNode}
              selectedCategory={selectedCategory}
              onClearCategoryFilter={() => setSelectedCategory(null)}
            />
          </TabsContent>

          <TabsContent value="optimizations" className="mt-0">
            <CostOptimizationList
              opportunities={optimizationOpportunities}
              currency={activeEstimate.currency}
              onSimulateWhatIf={applyOptimizationToWhatIf}
              onApplyToCanvas={applyOptimizationToWhatIf}
            />
          </TabsContent>

          <TabsContent value="forecast" className="mt-0">
            <CostForecastChart
              forecast={costForecast}
              currency={activeEstimate.currency}
            />
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            <CostComparisonView
              baselineEstimate={baselineEstimate}
              candidateEstimate={candidateEstimate}
              comparisonResult={comparisonResult}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

