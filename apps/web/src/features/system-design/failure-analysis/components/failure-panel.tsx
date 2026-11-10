"use client";

import * as React from "react";
import {
  ShieldIcon,
  RefreshIcon,
  CloseIcon,
  SearchIcon,
  CheckCircleIcon,
  CopyIcon,
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
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useFailureAnalysis } from "../hooks/use-failure-analysis";
import { FailureFindingCard } from "./failure-finding-card";
import { BlastRadiusExplorer } from "./blast-radius-explorer";
import type { FailureFinding, FailureClassification } from "@nxtqr/architecture-intelligence";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface FailurePanelProps {
  className?: string;
  onClose?: () => void;
  onFocusNode?: (nodeId: string) => void;
  onFocusEdge?: (edgeId: string) => void;
}

const CLASSIFICATIONS: { id: FailureClassification | "all"; label: string }[] = [
  { id: "all", label: "All Failure Types" },
  { id: "modeled-spof", label: "Modeled SPOF" },
  { id: "shared-dependency", label: "Shared Dependency" },
  { id: "failover-gap", label: "Failover Gap" },
  { id: "failure-domain-risk", label: "Failure Domain Risk" },
  { id: "potential-spof", label: "Potential SPOF" },
];

export function FailurePanel({
  className,
  onClose,
  onFocusNode,
  onFocusEdge,
}: FailurePanelProps) {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const {
    report,
    findings,
    classificationFilter,
    setClassificationFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    setSelectedBlastNodeId,
    activeBlastProfile,
    focusFinding,
    reanalyze,
    isAnalyzing,
  } = useFailureAnalysis();

  const [activeTab, setActiveTab] = React.useState<"findings" | "blast" | "redundancy">("findings");
  const [copied, setCopied] = React.useState(false);

  const handleSelectFinding = (finding: FailureFinding) => {
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

  const spofCount = report.metrics.spofCount;
  const sharedCount = report.metrics.sharedDependencyRisksCount;

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
          <ShieldIcon className={cn("w-3.5 h-3.5 text-text-muted", isAnalyzing && "animate-pulse")} />
          <span className="font-semibold text-foreground">SPOF & Resiliency</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono h-4 px-1 rounded border-border-default",
              spofCount > 0
                ? "text-rose-400 bg-rose-950/20 border-rose-900/60"
                : sharedCount > 0
                  ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
                  : "text-emerald-400 bg-emerald-950/20"
            )}
          >
            {spofCount > 0
              ? `${spofCount} SPOF(s)`
              : sharedCount > 0
                ? `${sharedCount} Shared Risks`
                : "No SPOFs Detected"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyReportSnapshot}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title={copied ? "Copied JSON Report!" : "Copy Failure Analysis JSON"}
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={reanalyze}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title="Re-run SPOF analysis"
          >
            <RefreshIcon className={cn("w-3.5 h-3.5", isAnalyzing && "animate-spin")} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
              title="Close Panel"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Tabs Header */}
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
              value="blast"
              className="text-[10px] font-mono h-5.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
            >
              Blast Radius
            </TabsTrigger>
            <TabsTrigger
              value="redundancy"
              className="text-[10px] font-mono h-5.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
            >
              Redundancy ({Object.keys(report.redundancyGroups).length})
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
                placeholder="Search SPOF findings, nodes, rules..."
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
                value={classificationFilter}
                onValueChange={(val) => setClassificationFilter(val as any)}
              >
                <SelectTrigger className="h-7 w-full px-2 font-mono text-[11px] bg-surface-01 border-border-default hover:border-border-hover text-foreground">
                  <SelectValue placeholder="All Failure Classifications" />
                </SelectTrigger>
                <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
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
                  No Single Points of Failure
                </h5>
                <p className="font-sans text-[11px] text-text-muted max-w-[240px] leading-relaxed">
                  The architecture exhibits decoupled services, multi-zone availability, and independent persistence dependencies.
                </p>
              </div>
            ) : (
              findings.map((f) => (
                <FailureFindingCard
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

        {/* TAB 2: BLAST RADIUS EXPLORER */}
        <TabsContent value="blast" className="flex-1 flex flex-col min-h-0 m-0 p-2 overflow-y-auto data-[state=inactive]:hidden">
          <BlastRadiusExplorer
            nodes={nodes}
            activeProfile={activeBlastProfile}
            capabilities={report.capabilities}
            onSelectNode={(nodeId) => {
              setSelectedBlastNodeId(nodeId);
              onFocusNode?.(nodeId);
            }}
          />
        </TabsContent>

        {/* TAB 3: REDUNDANCY GROUPS & DOMAINS */}
        <TabsContent value="redundancy" className="flex-1 flex flex-col min-h-0 m-0 p-2 overflow-y-auto space-y-2.5 data-[state=inactive]:hidden font-mono text-xs">
          {Object.keys(report.redundancyGroups).length === 0 ? (
            <div className="p-4 text-center text-text-muted bg-surface-02 border border-border-default rounded-md">
              No multi-instance redundancy groups or clusters modeled.
            </div>
          ) : (
            Object.values(report.redundancyGroups).map((group) => (
              <div
                key={group.groupId}
                className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{group.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono h-4 px-1 rounded uppercase",
                      group.hasSingleFailureDomain
                        ? "border-amber-900/60 text-amber-400 bg-amber-950/20"
                        : "border-border-default text-emerald-400 bg-emerald-950/20"
                    )}
                  >
                    {group.mode.replace(/-/g, " ")} ({group.effectiveReplicas}x)
                  </Badge>
                </div>

                <div className="text-[10px] text-text-secondary space-y-0.5">
                  <div>Failover: <strong className="text-foreground">{group.failoverMode}</strong></div>
                  <div>Sync: <strong className="text-foreground">{group.stateSync}</strong></div>
                  <div>Domains: <span className="text-text-muted">{group.deploymentDomains.join(", ") || "Single Zone"}</span></div>
                  <div>Health Checks: <strong className={group.healthCheckConfigured ? "text-emerald-400" : "text-amber-400"}>{group.healthCheckConfigured ? "Configured" : "None"}</strong></div>
                </div>

                {group.hasSingleFailureDomain && (
                  <div className="pt-1 border-t border-border-subtle text-[9px] text-amber-400 flex items-center gap-1">
                    <AlertTriangleIcon className="w-3 h-3 shrink-0" />
                    <span>All replicas share a single failure domain.</span>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* 3. Metrics Footer */}
      <div className="px-3 py-1.5 border-t border-border-subtle bg-surface-02 font-mono text-[10px] text-text-muted flex items-center justify-between shrink-0">
        <span>
          {report.metrics.spofCount} SPOF · {report.metrics.sharedDependencyRisksCount} Shared · {report.metrics.failoverGapsCount} Gaps
        </span>
        <span className="text-text-disabled">
          {report.metrics.executionTimeMs}ms
        </span>
      </div>
    </div>
  );
}
