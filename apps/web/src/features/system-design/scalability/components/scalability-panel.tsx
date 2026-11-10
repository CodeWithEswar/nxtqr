"use client";

import * as React from "react";
import {
  LayersIcon,
  CloseIcon,
  SearchIcon,
  CopyIcon,
  CheckIcon,
} from "@nxtqr/icons";
import {
  Badge,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  useScalabilityRecommendations,
  PRESET_WORKLOAD_SCENARIOS,
} from "../hooks/use-scalability-recommendations";
import { ScalabilityRecommendationCard } from "./scalability-recommendation-card";
import { WhatIfPlannerView } from "./what-if-planner-view";
import type {
  ScalabilityRecommendation,
  ScalabilityStrategy,
} from "@nxtqr/architecture-intelligence";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface ScalabilityPanelProps {
  className?: string;
  onClose?: () => void;
  onFocusNode?: (nodeId: string) => void;
}

const STRATEGIES: { id: ScalabilityStrategy | "all"; label: string }[] = [
  { id: "all", label: "All Strategies" },
  { id: "horizontal-scaling", label: "Horizontal Scale" },
  { id: "caching", label: "Caching" },
  { id: "read-replication", label: "Read Replicas" },
  { id: "sharding", label: "Sharding" },
  { id: "asynchronous-processing", label: "Async Queue" },
  { id: "rate-limiting", label: "Rate Limiting" },
];

export function ScalabilityPanel({
  className,
  onClose,
  onFocusNode,
}: ScalabilityPanelProps) {
  const selectNode = useGraphEditorStore((s) => s.selectNode);

  const {
    report,
    recommendations,
    currentScenario,
    activeScenarioId,
    setActiveScenarioId,
    activeRecommendationId,
    highlightRecommendation,
    strategyFilter,
    setStrategyFilter,
    feasibilityFilter,
    setFeasibilityFilter,
    searchQuery,
    setSearchQuery,
    activeWhatIfPlan,
    previewWhatIfPlan,
    discardWhatIfPlan,
    commitWhatIfPlan,
    isEvaluating,
  } = useScalabilityRecommendations();

  const [activeTab, setActiveTab] = React.useState<"recommendations" | "what-if">("recommendations");
  const [copied, setCopied] = React.useState(false);

  // Switch tab automatically when a What-If plan is generated
  React.useEffect(() => {
    if (activeWhatIfPlan) {
      setActiveTab("what-if");
    }
  }, [activeWhatIfPlan]);

  const handleSelectRecommendation = (rec: ScalabilityRecommendation) => {
    highlightRecommendation(rec);
    if (rec.affectedNodeIds.length > 0) {
      const targetId = rec.affectedNodeIds[0];
      selectNode(targetId);
      if (onFocusNode) {
        onFocusNode(targetId);
      }
    }
  };

  const copyReportSnapshot = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applicableCount = report.summary.applicableCount;
  const conditionalCount = report.summary.conditionalCount;
  const totalRecs = report.summary.totalRecommendations;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface-01 text-foreground select-none overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="h-11 px-3 border-b border-border-default flex items-center justify-between shrink-0 bg-surface-02">
        <div className="flex items-center gap-2">
          <LayersIcon className={cn("w-4 h-4 text-sky-400", isEvaluating && "animate-pulse")} />
          <span className="font-mono text-xs font-semibold tracking-tight uppercase">
            Scalability &amp; Planner
          </span>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[9px] px-1 py-0 h-4 border-border-default",
              applicableCount > 0
                ? "text-sky-400 bg-sky-950/20"
                : conditionalCount > 0
                  ? "text-amber-400 bg-amber-950/20"
                  : "text-text-muted"
            )}
          >
            {applicableCount > 0
              ? `${applicableCount} Actionable`
              : conditionalCount > 0
                ? `${conditionalCount} Conditional`
                : "Optimized"}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyReportSnapshot}
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
            title="Copy Scalability Assessment JSON"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-white" /> : <CopyIcon className="w-3.5 h-3.5" />}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
              title="Close Scalability Panel"
            >
              <CloseIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Workload Scenario Selector Bar */}
      <div className="p-3 bg-surface-02 border-b border-border-default space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-text-muted font-medium">
            Active Workload Scenario
          </span>
          <span className="text-[10px] font-mono text-sky-400">
            {currentScenario.trafficMultiplier}x Traffic Multiplier
          </span>
        </div>

        <Select
          value={activeScenarioId}
          onValueChange={(val) => {
            setActiveScenarioId(val);
          }}
        >
          <SelectTrigger className="h-7 w-full px-2.5 font-mono text-xs bg-surface-03 border-border-default hover:border-border-hover text-foreground">
            <SelectValue placeholder="Select Workload Scenario" />
          </SelectTrigger>
          <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
            {PRESET_WORKLOAD_SCENARIOS.map((sc) => (
              <SelectItem key={sc.id} value={sc.id}>
                {sc.name} ({sc.trafficMultiplier}x Traffic, {sc.concurrentUsersMultiplier}x Users)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <p className="text-[10px] font-sans text-text-muted line-clamp-1">
          {currentScenario.description}
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "recommendations" | "what-if")}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-3 pt-2 pb-1 border-b border-border-default bg-surface-02 shrink-0">
          <TabsList className="w-full grid grid-cols-2 bg-surface-03 p-0.5 rounded-md h-7">
            <TabsTrigger
              value="recommendations"
              className="text-[11px] font-mono py-1 rounded h-6 data-[state=active]:bg-surface-04 data-[state=active]:text-foreground text-text-muted"
            >
              Recommendations ({totalRecs})
            </TabsTrigger>
            <TabsTrigger
              value="what-if"
              className="text-[11px] font-mono py-1 rounded h-6 data-[state=active]:bg-surface-04 data-[state=active]:text-foreground text-text-muted flex items-center justify-center gap-1.5"
            >
              <span>What-If Planner</span>
              {activeWhatIfPlan && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Recommendations List */}
        <TabsContent value="recommendations" className="flex-1 flex flex-col min-h-0 m-0">
          {/* Filter Bar */}
          <div className="p-3 border-b border-border-default space-y-2 bg-surface-01 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2 w-3.5 h-3.5 text-text-muted" />
              <Input
                placeholder="Filter by strategy, target node, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-8 pr-2 text-xs font-mono bg-surface-02 border-border-default hover:border-border-hover text-foreground placeholder:text-text-disabled"
              />
            </div>

            {/* Strategy Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto precision-rail pb-0.5">
              {STRATEGIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setStrategyFilter(cat.id)}
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-md whitespace-nowrap transition-colors border",
                    strategyFilter === cat.id
                      ? "bg-surface-04 text-foreground border-border-strong font-medium shadow-level-3"
                      : "bg-surface-02 text-text-muted border-border-default hover:text-foreground hover:bg-surface-03"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Feasibility Filter Chips */}
            <div className="flex items-center gap-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "applicable", label: "Applicable" },
                  { id: "conditional", label: "Conditional" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFeasibilityFilter(f.id)}
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded transition-colors border",
                    feasibilityFilter === f.id
                      ? "bg-surface-04 text-foreground border-border-strong font-medium"
                      : "bg-surface-02 text-text-muted border-border-default hover:text-foreground hover:bg-surface-03"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations Scroll Area */}
          <div className="flex-1 overflow-y-auto precision-rail p-3 space-y-2.5">
            {recommendations.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <LayersIcon className="w-6 h-6 text-text-disabled mx-auto" />
                <p className="font-mono text-xs text-text-muted">
                  No scalability recommendations for this workload and filter.
                </p>
                <p className="text-[10px] text-text-disabled font-sans">
                  Try switching to a higher workload scenario (e.g. Peak Traffic or Extreme Spike) or clear filters.
                </p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <ScalabilityRecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  isActive={activeRecommendationId === rec.id}
                  onSelect={() => handleSelectRecommendation(rec)}
                  onPreviewWhatIf={() => previewWhatIfPlan(rec)}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 2: What-If Planner Active View */}
        <TabsContent value="what-if" className="flex-1 flex flex-col min-h-0 m-0 overflow-y-auto precision-rail p-3">
          {activeWhatIfPlan ? (
            <WhatIfPlannerView
              plan={activeWhatIfPlan}
              onCommit={() => {
                commitWhatIfPlan();
                setActiveTab("recommendations");
              }}
              onDiscard={() => {
                discardWhatIfPlan();
                setActiveTab("recommendations");
              }}
            />
          ) : (
            <div className="p-8 text-center space-y-3">
              <LayersIcon className="w-8 h-8 text-text-disabled mx-auto" />
              <div className="space-y-1">
                <h4 className="font-mono text-xs font-semibold text-foreground uppercase">
                  No Active What-If Simulation
                </h4>
                <p className="font-sans text-xs text-text-muted max-w-xs mx-auto">
                  Select &quot;What-If Preview&quot; on any recommendation card to simulate and compare capacity outcomes before committing to the canvas.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("recommendations")}
                className="font-mono text-xs h-7 px-3 bg-surface-02 border-border-default text-text-secondary hover:text-foreground"
              >
                Browse Recommendations
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
