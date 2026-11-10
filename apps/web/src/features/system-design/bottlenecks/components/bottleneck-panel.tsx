"use client";

import * as React from "react";
import {
  CpuIcon,
  RefreshIcon,
  CloseIcon,
  SearchIcon,
  CheckCircleIcon,
  CopyIcon,
  SlidersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";
import {
  Badge,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Slider,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useBottleneckAnalysis } from "../hooks/use-bottleneck-analysis";
import { BottleneckFindingCard } from "./bottleneck-finding-card";
import { CapacityUtilizationChart } from "./capacity-utilization-chart";
import {
  DEFAULT_WORKLOAD_SCENARIOS,
  type BottleneckFinding,
  type BottleneckType,
} from "@nxtqr/architecture-intelligence";

export interface BottleneckPanelProps {
  className?: string;
  onClose?: () => void;
  onFocusNode?: (nodeId: string) => void;
  onFocusEdge?: (edgeId: string) => void;
}

const BOTTLENECK_TYPES: { id: BottleneckType | "all"; label: string }[] = [
  { id: "all", label: "All Bottleneck Types" },
  { id: "service_saturation", label: "Service Saturation" },
  { id: "queue_backlog", label: "Queue Backlog" },
  { id: "database_contention", label: "Database Contention" },
  { id: "cache_miss_amplification", label: "Cache Miss Amplification" },
  { id: "network_bandwidth", label: "Network Bandwidth" },
  { id: "external_quota", label: "External Quota" },
  { id: "latency_critical_path", label: "Latency Path" },
];

export function BottleneckPanel({
  className,
  onClose,
  onFocusNode,
  onFocusEdge,
}: BottleneckPanelProps) {
  const {
    report,
    findings,
    selectedScenarioKey,
    activeScenario,
    selectScenario,
    updateScenarioParameter,
    typeFilter,
    setTypeFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    focusFinding,
    reanalyze,
    isAnalyzing,
  } = useBottleneckAnalysis();

  const [activeTab, setActiveTab] = React.useState<"findings" | "capacity" | "paths">("findings");
  const [showParameters, setShowParameters] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleSelectFinding = (finding: BottleneckFinding) => {
    focusFinding(finding);
    if (finding.affectedEdgeIds.length > 0 && onFocusEdge) {
      onFocusEdge(finding.affectedEdgeIds[0]);
    } else if (finding.affectedNodeIds.length > 0 && onFocusNode) {
      onFocusNode(finding.affectedNodeIds[0]);
    }
  };

  const copyReportSnapshot = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const criticalAndHighCount = report.metrics.criticalCount + report.metrics.highCount;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface-01 text-foreground select-none overflow-hidden",
        className
      )}
    >
      {/* 1. Header Bar */}
      <div className="h-9 px-3 border-b border-border-default bg-surface-02 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="flex items-center gap-2">
          <CpuIcon className={cn("w-3.5 h-3.5 text-text-muted", isAnalyzing && "animate-pulse")} />
          <span className="font-semibold text-foreground">Bottlenecks</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono h-4 px-1 rounded border-border-default",
              criticalAndHighCount > 0
                ? "text-rose-400 bg-rose-950/20 border-rose-900/60"
                : report.findings.length > 0
                  ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
                  : "text-emerald-400 bg-emerald-950/20"
            )}
          >
            {criticalAndHighCount > 0
              ? `${criticalAndHighCount} Critical/High`
              : report.findings.length > 0
                ? `${report.findings.length} Warnings`
                : "Optimal Throughput"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyReportSnapshot}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title={copied ? "Copied JSON Report!" : "Copy Bottleneck Report JSON"}
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={reanalyze}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title="Re-run bottleneck analysis"
          >
            <RefreshIcon className={cn("w-3.5 h-3.5", isAnalyzing && "animate-spin")} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
              title="Close Bottleneck Panel"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scenario Selector & Parameter Tweaker */}
      <div className="p-2 border-b border-border-subtle bg-surface-02 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <Select
              value={selectedScenarioKey}
              onValueChange={selectScenario}
            >
              <SelectTrigger className="h-7 w-full px-2 font-mono text-[11px] bg-surface-01 border-border-default hover:border-border-hover text-foreground">
                <SelectValue placeholder="Select Scenario" />
              </SelectTrigger>
              <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
                {Object.entries(DEFAULT_WORKLOAD_SCENARIOS).map(([key, scenario]) => (
                  <SelectItem key={key} value={key}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => setShowParameters((prev) => !prev)}
            className={cn(
              "h-7 px-2 rounded-md border flex items-center gap-1 font-mono text-[10px] transition-colors",
              showParameters
                ? "border-border-strong bg-surface-04 text-foreground shadow-level-1"
                : "border-border-default bg-surface-01 text-text-muted hover:text-foreground"
            )}
            title="Customize workload parameters"
          >
            <SlidersIcon className="w-3 h-3" />
            <span>Parameters</span>
            {showParameters ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Parameter Tweakers */}
        {showParameters && (
          <div className="p-2.5 rounded-md bg-surface-01 border border-border-subtle space-y-2 font-mono text-[10px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-text-muted block mb-1">Ingress RPS</span>
                <Input
                  type="number"
                  value={activeScenario.parameters.ingressRps}
                  onChange={(e) => updateScenarioParameter("ingressRps", Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-6 text-[10px] font-mono bg-surface-02 border-border-default"
                />
              </div>
              <div>
                <span className="text-text-muted block mb-1">Peak Multiplier</span>
                <Input
                  type="number"
                  step="0.5"
                  value={activeScenario.parameters.peakMultiplier}
                  onChange={(e) => updateScenarioParameter("peakMultiplier", Math.max(1, parseFloat(e.target.value) || 1))}
                  className="h-6 text-[10px] font-mono bg-surface-02 border-border-default"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-text-muted">
                <span>Read vs Write Ratio</span>
                <span className="text-foreground">
                  {Math.round(activeScenario.parameters.readRatio * 100)}% Read / {Math.round((1 - activeScenario.parameters.readRatio) * 100)}% Write
                </span>
              </div>
              <Slider
                value={[Math.round(activeScenario.parameters.readRatio * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(vals) => updateScenarioParameter("readRatio", vals[0] / 100)}
                className="py-1"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-text-muted">
                <span>Cache Hit Rate</span>
                <span className="text-foreground">
                  {Math.round(activeScenario.parameters.cacheHitRate * 100)}%
                </span>
              </div>
              <Slider
                value={[Math.round(activeScenario.parameters.cacheHitRate * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(vals) => updateScenarioParameter("cacheHitRate", vals[0] / 100)}
                className="py-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Sub-Tabs Header */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-2 pt-1.5 border-b border-border-subtle bg-surface-02 shrink-0">
          <TabsList className="grid grid-cols-3 h-7 bg-surface-01 p-0.5 border border-border-subtle rounded-md">
            <TabsTrigger
              value="findings"
              className="text-[10px] font-mono h-5.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
            >
              Findings ({report.findings.length})
            </TabsTrigger>
            <TabsTrigger
              value="capacity"
              className="text-[10px] font-mono h-5.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
            >
              Capacity ({Object.keys(report.nodeUtilization).length})
            </TabsTrigger>
            <TabsTrigger
              value="paths"
              className="text-[10px] font-mono h-5.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
            >
              Paths ({report.criticalPaths.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: FINDINGS */}
        <TabsContent value="findings" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden">
          {/* Search & Filters */}
          <div className="p-2 border-b border-border-subtle bg-surface-02 space-y-1.5 shrink-0">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bottleneck findings, rules, nodes..."
                className="h-7 text-xs font-sans pl-7 bg-surface-01 border-border-default"
              />
              <SearchIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-text-muted pointer-events-none" />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {(["all", "critical", "high", "medium", "low"] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "h-6 px-2 rounded-md font-mono text-[10px] uppercase transition-colors shrink-0",
                    severityFilter === sev
                      ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-1"
                      : "bg-surface-01 border border-border-default text-text-muted hover:text-foreground"
                  )}
                >
                  {sev === "all" ? "All" : sev}
                </button>
              ))}
            </div>

            <div>
              <Select
                value={typeFilter}
                onValueChange={(val) => setTypeFilter(val as any)}
              >
                <SelectTrigger className="h-7 w-full px-2 font-mono text-[11px] bg-surface-01 border-border-default hover:border-border-hover text-foreground">
                  <SelectValue placeholder="All Bottleneck Types" />
                </SelectTrigger>
                <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
                  {BOTTLENECK_TYPES.map((bt) => (
                    <SelectItem key={bt.id} value={bt.id}>
                      {bt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Findings List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
            {findings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-text-muted">
                <div className="w-8 h-8 rounded-md bg-surface-02 border border-border-default flex items-center justify-center text-emerald-400 mb-2 shadow-level-1">
                  <CheckCircleIcon className="w-4 h-4" />
                </div>
                <h5 className="font-sans text-xs font-semibold text-foreground mb-1">
                  No Bottlenecks Detected
                </h5>
                <p className="font-sans text-[11px] text-text-muted max-w-[240px] leading-relaxed">
                  Under the &quot;{activeScenario.name}&quot; assumptions, all infrastructure nodes operate safely below declared capacity limits.
                </p>
              </div>
            ) : (
              findings.map((f) => (
                <BottleneckFindingCard
                  key={f.id}
                  finding={f}
                  isSelected={activeFindingId === f.id}
                  onSelect={handleSelectFinding}
                  onOpenInspector={onFocusNode}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: CAPACITY UTILIZATION */}
        <TabsContent value="capacity" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden">
          <div className="flex-1 overflow-y-auto p-2 min-h-0">
            <CapacityUtilizationChart
              utilizations={report.nodeUtilization}
              onSelectNode={onFocusNode}
            />
          </div>
        </TabsContent>

        {/* TAB 3: CRITICAL LATENCY PATHS */}
        <TabsContent value="paths" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden">
          <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 font-mono">
            {report.criticalPaths.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-text-muted font-sans">
                <div className="w-8 h-8 rounded-md bg-surface-02 border border-border-default flex items-center justify-center text-text-disabled mb-2 shadow-level-1">
                  <CpuIcon className="w-4 h-4" />
                </div>
                <h5 className="font-sans text-xs font-semibold text-foreground mb-1">
                  No Synchronous Critical Paths
                </h5>
                <p className="font-sans text-[11px] text-text-muted max-w-[240px] leading-relaxed">
                  No synchronous request-response call chains discovered in the current graph topology.
                </p>
              </div>
            ) : (
              report.criticalPaths.map((path, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md border border-border-default bg-surface-02 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-foreground">Path #{idx + 1}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-mono h-4 px-1 rounded uppercase",
                        path.exceedsBudget
                          ? "border-rose-900/60 text-rose-400 bg-rose-950/20"
                          : "border-border-default text-emerald-400 bg-emerald-950/20"
                      )}
                    >
                      {path.estimatedLatencyMs} ms / Budget {path.latencyBudgetMs ?? 300} ms
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {path.pathNodeIds.map((nodeId, hopIdx) => (
                      <React.Fragment key={nodeId}>
                        <button
                          type="button"
                          onClick={() => onFocusNode?.(nodeId)}
                          className={cn(
                            "px-1.5 py-0.5 rounded border text-[10px] transition-colors truncate max-w-[120px]",
                            nodeId === path.bottleneckNodeId
                              ? "border-amber-900/60 bg-amber-950/30 text-amber-300 font-bold"
                              : "border-border-subtle bg-surface-01 text-text-secondary hover:text-foreground"
                          )}
                          title={`Hop ${hopIdx + 1}: ${nodeId}${nodeId === path.bottleneckNodeId ? " (Bottleneck)" : ""}`}
                        >
                          {nodeId}
                        </button>
                        {hopIdx < path.pathNodeIds.length - 1 && (
                          <span className="text-text-disabled text-[10px]">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {path.bottleneckNodeId && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1">
                      <AlertTriangleIcon className="w-3 h-3 shrink-0" />
                      <span>Bottleneck Node: {path.bottleneckNodeId}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 4. Metrics Footer */}
      <div className="px-3 py-1.5 border-t border-border-subtle bg-surface-02 font-mono text-[10px] text-text-muted flex items-center justify-between shrink-0">
        <span>
          {report.metrics.analyzedNodesCount} Nodes · {report.metrics.bottlenecksDetectedCount} Bottlenecks
        </span>
        <span className="text-text-disabled">
          {report.metrics.executionTimeMs}ms
        </span>
      </div>
    </div>
  );
}

