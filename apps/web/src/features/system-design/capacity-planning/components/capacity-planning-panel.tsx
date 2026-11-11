"use client";

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Button,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  ActivityIcon,
  CloseIcon,
  RefreshIcon,
  CheckIcon,
} from "@nxtqr/icons";
import { useCapacityPlanning } from "../hooks/use-capacity-planning";
import { DemandForecastChart } from "./demand-forecast-chart";
import { SaturationTimeline } from "./saturation-timeline";
import { ResourceBreakdown } from "./resource-breakdown";
import { GrowthConfigurator } from "./growth-configurator";
import { ScenarioComparisonView } from "./scenario-comparison-view";
import type { ResourceCategory } from "@nxtqr/architecture-intelligence";

export interface CapacityPlanningPanelProps {
  className?: string;
  onClose?: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export function CapacityPlanningPanel({
  className,
  onClose,
  onSelectNode,
}: CapacityPlanningPanelProps) {
  const {
    report,
    comparisonMatrix,
    selectedScenarioId,
    setSelectedScenarioId,
    horizonIntervals,
    setHorizonIntervals,
    intervalUnit,
    setIntervalUnit,
    growthModel,
    setGrowthModel,
    growthRatePercent,
    setGrowthRatePercent,
    peakMultiplier,
    setPeakMultiplier,
    whatIfOverrides,
    setNodeWhatIf,
    clearWhatIf,
    commitWhatIfToGraph,
    hasWhatIfChanges,
    presetScenarios,
  } = useCapacityPlanning();

  const [activeTab, setActiveTab] = React.useState<string>("forecast");
  const [selectedIntervalIndex, setSelectedIntervalIndex] = React.useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<ResourceCategory | null>(null);

  const totalCap = report.timeSeries[0]?.totalCapacityRps || 1000;
  const isSaturated = report.findings.length > 0;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface-01 border border-border-default rounded-md overflow-hidden select-none",
        className
      )}
    >
      {/* Header */}
      <div className="p-3.5 bg-surface-02 border-b border-border-default flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-surface-03 border border-border-default flex items-center justify-center text-text-secondary">
            <ActivityIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-foreground">
                Capacity Planning & Forecasting
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-mono",
                  isSaturated
                    ? "bg-rose-950/20 text-rose-400 border-rose-900/50"
                    : "bg-emerald-950/20 text-emerald-400 border-emerald-900/50"
                )}
              >
                {isSaturated
                  ? `${report.findings.length} saturated`
                  : "Headroom OK"}
              </Badge>
              {hasWhatIfChanges && (
                <Badge variant="outline" className="text-[10px] bg-amber-950/20 text-amber-400 border-amber-900/50 font-mono">
                  What-If Active ({Object.keys(whatIfOverrides).length} overrides)
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-text-muted font-mono block">
              Scenario: {report.scenarioName} ({report.horizonIntervals} {report.intervalUnit}s)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasWhatIfChanges && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={commitWhatIfToGraph}
                className="h-7 text-xs font-mono bg-surface-03 hover:bg-surface-04 border-border-default hover:border-border-strong text-foreground rounded-md"
              >
                <CheckIcon size={12} className="mr-1" /> Commit to Diagram
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWhatIf}
                className="h-7 text-xs font-mono text-text-muted hover:text-foreground rounded-md"
              >
                <RefreshIcon size={12} className="mr-1" /> Revert
              </Button>
            </>
          )}

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground rounded-md"
            >
              <CloseIcon size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3.5 pt-2 border-b border-border-subtle bg-surface-01">
          <TabsList className="bg-surface-02 border border-border-default rounded-md h-8 p-0.5">
            <TabsTrigger
              value="forecast"
              className="text-xs font-mono px-3 h-7 rounded-md data-[state=active]:bg-surface-04 data-[state=active]:text-foreground text-text-muted"
            >
              Forecast & Headroom
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="text-xs font-mono px-3 h-7 rounded-md data-[state=active]:bg-surface-04 data-[state=active]:text-foreground text-text-muted"
            >
              Resource Tiers
            </TabsTrigger>
            <TabsTrigger
              value="scenarios"
              className="text-xs font-mono px-3 h-7 rounded-md data-[state=active]:bg-surface-04 data-[state=active]:text-foreground text-text-muted"
            >
              Growth Config & Scenarios
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Forecast & Headroom */}
        <TabsContent value="forecast" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <DemandForecastChart
            timeSeries={report.timeSeries}
            totalCapacityRps={totalCap}
            earliestSaturationLabel={report.summary.earliestSaturationLabel}
            onSelectInterval={setSelectedIntervalIndex}
            selectedIntervalIndex={selectedIntervalIndex}
          />

          <SaturationTimeline
            findings={report.findings}
            componentEvaluations={report.componentEvaluations}
            onSelectNode={onSelectNode}
            onWhatIfScale={(nodeId, recInstances) => {
              setNodeWhatIf(nodeId, { replicas: recInstances });
            }}
          />
        </TabsContent>

        {/* Tab 2: Resource Tiers */}
        <TabsContent value="resources" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <ResourceBreakdown
            categorySummaries={report.categorySummaries}
            componentEvaluations={report.componentEvaluations}
            onSelectCategory={setSelectedCategory}
            selectedCategory={selectedCategory}
          />

          {/* Detailed Component Evaluations Table */}
          <div className="space-y-2">
            <span className="font-mono text-xs text-text-muted block">
              Component Capacity Details ({Object.keys(report.componentEvaluations).length} components)
            </span>
            <div className="border border-border-default rounded-md overflow-hidden bg-surface-02">
              <div className="grid grid-cols-5 p-2 font-mono text-[10px] text-text-muted border-b border-border-subtle bg-surface-03">
                <span className="col-span-2">Component ID</span>
                <span>Category</span>
                <span>Capacity</span>
                <span className="text-right">Horizon Headroom</span>
              </div>
              <div className="divide-y divide-border-subtle">
                {Object.values(report.componentEvaluations)
                  .filter((item) => !selectedCategory || item.category === selectedCategory)
                  .map((evalItem) => {
                    const hasNegativeHeadroom = (evalItem.headroomAtHorizonRps || 0) < 0;

                    return (
                      <div
                        key={evalItem.nodeId}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectNode?.(evalItem.nodeId)}
                        className="grid grid-cols-5 p-2 font-mono text-xs hover:bg-surface-03 cursor-pointer items-center transition-colors"
                      >
                        <div className="col-span-2">
                          <span className="font-bold text-foreground block truncate">
                            {evalItem.nodeId}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {evalItem.instancesCount} instances ({Math.round(evalItem.currentDemandRps)} RPS now)
                          </span>
                        </div>
                        <span className="text-[11px] text-text-secondary capitalize">
                          {evalItem.category}
                        </span>
                        <span className="text-[11px] text-text-secondary">
                          {evalItem.declaredCapacityRps ? `${evalItem.declaredCapacityRps} RPS` : "Undeclared"}
                        </span>
                        <div className="text-right">
                          <span className={cn(
                            "font-bold text-xs",
                            hasNegativeHeadroom ? "text-rose-400" : "text-emerald-400"
                          )}>
                            {evalItem.headroomAtHorizonRps !== undefined ? `${evalItem.headroomAtHorizonRps} RPS` : "—"}
                          </span>
                          <span className="block text-[10px] text-text-muted">
                            {evalItem.saturatesAtLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Growth Config & Scenarios */}
        <TabsContent value="scenarios" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
          <GrowthConfigurator
            presetScenarios={presetScenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={setSelectedScenarioId}
            horizonIntervals={horizonIntervals}
            onChangeHorizon={setHorizonIntervals}
            intervalUnit={intervalUnit}
            onChangeUnit={setIntervalUnit}
            growthModel={growthModel}
            onChangeGrowthModel={setGrowthModel}
            growthRatePercent={growthRatePercent}
            onChangeGrowthRate={setGrowthRatePercent}
            peakMultiplier={peakMultiplier}
            onChangePeakMultiplier={setPeakMultiplier}
          />

          <ScenarioComparisonView
            comparisonMatrix={comparisonMatrix}
            activeScenarioId={selectedScenarioId}
            onSelectScenario={setSelectedScenarioId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
