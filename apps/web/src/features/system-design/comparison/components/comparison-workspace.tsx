"use client";

import * as React from "react";
import type { ArchitectureSnapshot } from "@nxtqr/architecture-intelligence";
import { useArchitectureComparison } from "../hooks/use-architecture-comparison";
import { ComparisonToolbar } from "./comparison-toolbar";
import { ComparisonCanvasView } from "./comparison-canvas-view";
import { ChangeInspector } from "./change-inspector";
import { ComparisonSummaryPanel } from "./comparison-summary-panel";
import { SlidersIcon, ActivityIcon } from "@nxtqr/icons";

export interface ComparisonWorkspaceProps {
  initialBaseline?: ArchitectureSnapshot;
  initialCandidate?: ArchitectureSnapshot;
  onApplyCandidate?: () => void;
  className?: string;
}

export function ComparisonWorkspace({
  initialBaseline,
  initialCandidate,
  onApplyCandidate,
  className,
}: ComparisonWorkspaceProps) {
  const {
    baselineSnapshot,
    candidateSnapshot,
    comparisonResult,
    selectedChange,
    selectedRegression,
    setSelectedChangeId,
    filterKind,
    setFilterKind,
    isSyncNavigation,
    setIsSyncNavigation,
    focusedNodeId,
    focusElement,
    applyCandidateToWorkspace,
    swapSnapshots,
  } = useArchitectureComparison({
    initialBaseline,
    initialCandidate,
  });

  const [activeTab, setActiveTab] = React.useState<"inspector" | "summary">("summary");
  const [mobileView, setMobileView] = React.useState<"baseline" | "candidate" | "details">("candidate");

  const handleApply = () => {
    applyCandidateToWorkspace();
    onApplyCandidate?.();
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-black text-foreground overflow-hidden select-none ${
        className || ""
      }`}
    >
      {/* 1. Comparison Top Toolbar */}
      <ComparisonToolbar
        baselineTitle={baselineSnapshot.title}
        candidateTitle={candidateSnapshot.title}
        summary={comparisonResult.summary}
        filterKind={filterKind}
        onFilterChange={setFilterKind}
        isSyncNavigation={isSyncNavigation}
        onToggleSyncNavigation={() => setIsSyncNavigation(!isSyncNavigation)}
        onSwapSnapshots={swapSnapshots}
        onApplyCandidate={handleApply}
      />

      {/* 2. Mobile View Switcher (Hidden on md+) */}
      <div className="md:hidden h-9 px-3 bg-surface-01 border-b border-border-default flex items-center justify-center gap-1 font-mono text-[10px] shrink-0">
        <button
          type="button"
          onClick={() => setMobileView("baseline")}
          className={`flex-1 py-1 rounded text-center transition-colors ${
            mobileView === "baseline"
              ? "bg-surface-03 border border-border-strong text-foreground font-semibold"
              : "text-text-muted hover:text-foreground"
          }`}
        >
          Baseline
        </button>
        <button
          type="button"
          onClick={() => setMobileView("candidate")}
          className={`flex-1 py-1 rounded text-center transition-colors ${
            mobileView === "candidate"
              ? "bg-surface-03 border border-border-strong text-foreground font-semibold"
              : "text-text-muted hover:text-foreground"
          }`}
        >
          Candidate
        </button>
        <button
          type="button"
          onClick={() => setMobileView("details")}
          className={`flex-1 py-1 rounded text-center transition-colors ${
            mobileView === "details"
              ? "bg-surface-03 border border-border-strong text-foreground font-semibold"
              : "text-text-muted hover:text-foreground"
          }`}
        >
          Diff Details ({comparisonResult.changes.length})
        </button>
      </div>

      {/* 3. Main Split View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Side-by-Side Dual Canvas Region */}
        <div className="flex-1 flex min-w-0 p-2 gap-2 overflow-hidden">
          {/* Baseline Canvas */}
          <div
            className={`flex-1 min-w-0 h-full ${
              mobileView !== "baseline" ? "hidden md:flex flex-col" : "flex flex-col"
            }`}
          >
            <ComparisonCanvasView
              role="baseline"
              title={baselineSnapshot.title}
              nodes={baselineSnapshot.nodes}
              edges={baselineSnapshot.edges}
              changes={comparisonResult.changes}
              selectedNodeId={focusedNodeId}
              onSelectNode={(id) => {
                focusElement(id);
                setActiveTab("inspector");
              }}
            />
          </div>

          {/* Candidate Canvas */}
          <div
            className={`flex-1 min-w-0 h-full ${
              mobileView !== "candidate" ? "hidden md:flex flex-col" : "flex flex-col"
            }`}
          >
            <ComparisonCanvasView
              role="candidate"
              title={candidateSnapshot.title}
              nodes={candidateSnapshot.nodes}
              edges={candidateSnapshot.edges}
              changes={comparisonResult.changes}
              selectedNodeId={focusedNodeId}
              onSelectNode={(id) => {
                focusElement(id);
                setActiveTab("inspector");
              }}
            />
          </div>
        </div>

        {/* Right Inspector & Summary Side Pane */}
        <div
          className={`w-full md:w-80 lg:w-96 bg-surface-01 border-l border-border-default flex flex-col shrink-0 overflow-hidden ${
            mobileView !== "details" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Side Pane Tab Switcher */}
          <div className="h-9 px-3 bg-surface-01 border-b border-border-default flex items-center justify-between font-mono text-[10px] shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  activeTab === "summary"
                    ? "bg-surface-02 border border-border-strong text-foreground font-semibold"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                <ActivityIcon className="w-3 h-3 text-text-secondary" />
                <span>Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("inspector")}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  activeTab === "inspector"
                    ? "bg-surface-02 border border-border-strong text-foreground font-semibold"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                <SlidersIcon className="w-3 h-3 text-text-secondary" />
                <span>Inspector</span>
              </button>
            </div>

            <div className="text-text-muted text-[9px] uppercase">
              {comparisonResult.changes.length} Changes
            </div>
          </div>

          {/* Side Pane Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === "summary" ? (
              <ComparisonSummaryPanel
                summary={comparisonResult.summary}
                regressions={comparisonResult.regressions}
                analysisComparison={comparisonResult.analysisComparison}
                onSelectRegression={(regId) => {
                  setSelectedChangeId(regId);
                  setActiveTab("inspector");
                }}
              />
            ) : (
              <ChangeInspector
                change={selectedChange}
                regression={selectedRegression}
                onFocusNode={focusElement}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
