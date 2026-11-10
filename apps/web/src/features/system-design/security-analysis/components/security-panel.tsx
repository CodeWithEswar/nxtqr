"use client";

import * as React from "react";
import {
  ShieldIcon,
  RefreshIcon,
  CloseIcon,
  SearchIcon,
  CopyIcon,
} from "@nxtqr/icons";
import {
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useSecurityAnalysis } from "../hooks/use-security-analysis";
import { SecurityFindingCard } from "./security-finding-card";
import { TrustBoundaryExplorer } from "./trust-boundary-explorer";
import type { SecurityFinding, SecurityCategory } from "@nxtqr/architecture-intelligence";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface SecurityPanelProps {
  className?: string;
  onClose?: () => void;
  onFocusNode?: (nodeId: string) => void;
  onFocusEdge?: (edgeId: string) => void;
}

const CATEGORIES: { id: SecurityCategory | "all"; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "trust-boundary", label: "Trust Boundaries" },
  { id: "authentication", label: "Authentication" },
  { id: "authorization", label: "Authorization" },
  { id: "public-exposure", label: "Public Exposure" },
  { id: "transport-security", label: "Transport (TLS)" },
  { id: "sensitive-data", label: "Sensitive Data" },
  { id: "secrets-management", label: "Secrets & KMS" },
  { id: "network-segmentation", label: "Segmentation" },
  { id: "api-security", label: "API Security" },
  { id: "third-party-integration", label: "External Integrations" },
];

export function SecurityPanel({
  className,
  onClose,
  onFocusNode,
  onFocusEdge,
}: SecurityPanelProps) {
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);

  const {
    report,
    findings,
    categoryFilter,
    setCategoryFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    selectedBoundaryId,
    setSelectedBoundaryId,
    highlightFinding,
    isAnalyzing,
  } = useSecurityAnalysis();

  const [activeTab, setActiveTab] = React.useState<"findings" | "boundaries">("findings");
  const [copied, setCopied] = React.useState(false);

  const handleSelectFinding = (finding: SecurityFinding) => {
    highlightFinding(finding);
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

  const criticalCount = report.summary.criticalCount;
  const highCount = report.summary.highCount;
  const totalFindings = report.summary.totalFindings;

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
          <span className="font-semibold text-foreground">Security Architecture</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono h-4 px-1 rounded border-border-default",
              criticalCount > 0
                ? "text-rose-400 bg-rose-950/20 border-rose-900/60"
                : highCount > 0
                  ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
                  : "text-emerald-400 bg-emerald-950/20"
            )}
          >
            {criticalCount > 0
              ? `${criticalCount} Critical`
              : highCount > 0
                ? `${highCount} High Risks`
                : totalFindings > 0
                  ? `${totalFindings} Items`
                  : "Posture Clean"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyReportSnapshot}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title={copied ? "Copied JSON Report!" : "Copy Security Analysis JSON"}
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title="Re-run Security Analysis"
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
        onValueChange={(val) => setActiveTab(val as "findings" | "boundaries")}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-2 pt-1.5 border-b border-border-subtle bg-surface-02 shrink-0">
          <TabsList className="grid grid-cols-2 h-7 bg-surface-01 p-0.5 border border-border-subtle rounded-md">
            <TabsTrigger
              value="findings"
              className="text-[10px] font-mono h-5.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
            >
              Security Findings ({report.findings.length})
            </TabsTrigger>
            <TabsTrigger
              value="boundaries"
              className="text-[10px] font-mono h-5.5 rounded data-[state=active]:bg-surface-03 data-[state=active]:text-foreground data-[state=active]:shadow-level-1"
            >
              Trust Boundaries ({report.trustBoundaries.length})
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
                placeholder="Search findings, rules, components..."
                className="h-7 text-xs font-sans pl-7 bg-surface-01 border-border-default"
              />
              <SearchIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-text-muted pointer-events-none" />
            </div>

            {/* Severity Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {(["all", "critical", "high", "medium", "low"] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityFilter(sev)}
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border transition-colors shrink-0 capitalize",
                    severityFilter === sev
                      ? "bg-surface-04 border-border-strong text-foreground shadow-level-1"
                      : "bg-surface-01 border-border-subtle text-text-muted hover:text-foreground"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border transition-colors shrink-0",
                    categoryFilter === cat.id
                      ? "bg-surface-04 border-border-strong text-foreground shadow-level-1"
                      : "bg-surface-01 border-border-subtle text-text-muted hover:text-foreground"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Findings List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {findings.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <ShieldIcon className="w-8 h-8 mx-auto text-emerald-400/80" />
                <h4 className="text-xs font-medium text-text-secondary">
                  No Security Findings
                </h4>
                <p className="text-[11px] text-text-muted max-w-[260px] mx-auto leading-relaxed">
                  No security policy conflicts, unmodeled public access, or insecure cross-boundary flows detected under current filters.
                </p>
              </div>
            ) : (
              findings.map((finding) => (
                <SecurityFindingCard
                  key={finding.id}
                  finding={finding}
                  isSelected={activeFindingId === finding.id}
                  onSelect={handleSelectFinding}
                  onOpenInspector={(nodeId) => {
                    selectNode(nodeId);
                    if (onFocusNode) onFocusNode(nodeId);
                  }}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: TRUST BOUNDARIES */}
        <TabsContent value="boundaries" className="flex-1 overflow-y-auto p-3 m-0 data-[state=inactive]:hidden">
          <TrustBoundaryExplorer
            report={report}
            selectedBoundaryId={selectedBoundaryId}
            onSelectBoundary={setSelectedBoundaryId}
            onSelectNode={(nodeId) => {
              selectNode(nodeId);
              if (onFocusNode) onFocusNode(nodeId);
            }}
            onSelectEdge={(edgeId) => {
              selectEdge(edgeId);
              if (onFocusEdge) onFocusEdge(edgeId);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
