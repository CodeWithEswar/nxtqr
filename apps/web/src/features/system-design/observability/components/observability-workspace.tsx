"use client";

import React, { useState } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { TelemetryConnection } from "@nxtqr/architecture-intelligence";
import { useArchitectureObservability } from "../hooks/use-architecture-observability";
import { TelemetrySourceSelector } from "./telemetry-source-selector";
import { ServiceMappingEditor } from "./service-mapping-editor";
import { ObservabilityFindings } from "./observability-findings";
import { ObservabilityCanvasOverlay } from "./observability-canvas-overlay";
import { TraceWaterfall } from "./trace-waterfall";
import { LogExplorer } from "./log-explorer";
import { ServiceHealthInspector } from "./service-health-inspector";
import {
  LayersIcon,
  TerminalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CpuIcon,
  AlertTriangleIcon,
} from "@nxtqr/icons";

export interface ObservabilityWorkspaceProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  architectureId?: string;
  projectId?: string;
  initialConnection?: TelemetryConnection;
  className?: string;
}

export function ObservabilityWorkspace({
  nodes,
  edges,
  architectureId = "arch-default",
  projectId = "proj-default",
  initialConnection,
  className = "",
}: ObservabilityWorkspaceProps) {
  const {
    activeConnection,
    setActiveConnection,
    selectedPreset,
    handleSelectPreset,
    mappings,
    discoveredServices,
    confirmMapping,
    unlinkMapping,
    applyAutoSuggestions,
    healthIndicators,
    driftFindings,
    unifiedFindings,
    activeTrace,
    activeLogs,
    isLoading,
    lastRefreshedAt,
    refreshTelemetry,
    autoRefreshIntervalSeconds,
    setAutoRefreshIntervalSeconds,
    selectedComponentId,
    setSelectedComponentId,
    selectedHealth,
    selectedComparison,
    activeOverlay,
    setActiveOverlay,
    activeDrawerTab,
    setActiveDrawerTab,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useArchitectureObservability({
    nodes,
    edges,
    architectureId,
    projectId,
    initialConnection,
  });

  const [leftTab, setLeftTab] = useState<"mappings" | "drift">("mappings");

  const selectedNode = nodes.find((n) => n.id === selectedComponentId) || nodes[0];

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#000000] text-white select-none overflow-hidden ${className}`}
    >
      {/* 1. Header Toolbar */}
      <TelemetrySourceSelector
        activeConnection={activeConnection}
        onConnectionChange={setActiveConnection}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        activeOverlay={activeOverlay}
        onSelectOverlay={setActiveOverlay}
        isLoading={isLoading}
        onRefresh={refreshTelemetry}
        lastRefreshedAt={lastRefreshedAt}
        autoRefreshIntervalSeconds={autoRefreshIntervalSeconds}
        onAutoRefreshChange={setAutoRefreshIntervalSeconds}
      />

      {/* 2. Main 3-Pane Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: Mappings & Drift */}
        <aside className="w-80 flex-shrink-0 border-r border-[#262626] bg-[#080808] flex flex-col">
          <div className="flex items-center border-b border-[#262626] bg-[#0D0D0D] p-1 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setLeftTab("mappings")}
              className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                leftTab === "mappings"
                  ? "bg-[#262626] text-white font-semibold"
                  : "text-[#858585] hover:text-white"
              }`}
            >
              <CpuIcon className="w-3.5 h-3.5" />
              <span>Mappings ({mappings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("drift")}
              className={`flex-1 py-1 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                leftTab === "drift"
                  ? "bg-[#262626] text-white font-semibold"
                  : "text-[#858585] hover:text-white"
              }`}
            >
              <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Drift ({driftFindings.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {leftTab === "mappings" ? (
              <ServiceMappingEditor
                nodes={nodes}
                mappings={mappings}
                discoveredServices={discoveredServices}
                onConfirmMapping={confirmMapping}
                onUnlinkMapping={unlinkMapping}
                onApplyAutoSuggestions={applyAutoSuggestions}
              />
            ) : (
              <ObservabilityFindings
                driftFindings={driftFindings}
                unifiedFindings={unifiedFindings}
                onSelectComponent={setSelectedComponentId}
              />
            )}
          </div>
        </aside>

        {/* Center Pane: Canvas Overlay + Bottom Traces/Logs Drawer */}
        <main className="flex-1 min-w-0 flex flex-col relative bg-[#000000]">
          {/* Canvas Overlay */}
          <div className="flex-1 min-h-0 relative">
            <ObservabilityCanvasOverlay
              nodes={nodes}
              edges={edges}
              healthIndicators={healthIndicators}
              activeOverlay={activeOverlay}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
            />
          </div>

          {/* Bottom Docked Drawer: Traces & Logs */}
          <div
            className={`border-t border-[#262626] bg-[#080808] flex flex-col transition-all ${
              isDrawerOpen ? "h-64" : "h-9"
            }`}
          >
            {/* Drawer Tab Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D0D0D] border-b border-[#262626] text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab("traces");
                    setIsDrawerOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors ${
                    activeDrawerTab === "traces" && isDrawerOpen
                      ? "bg-[#262626] text-white font-semibold"
                      : "text-[#858585] hover:text-white"
                  }`}
                >
                  <LayersIcon className="w-3.5 h-3.5" />
                  <span>Traces ({activeTrace?.spans.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerTab("logs");
                    setIsDrawerOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors ${
                    activeDrawerTab === "logs" && isDrawerOpen
                      ? "bg-[#262626] text-white font-semibold"
                      : "text-[#858585] hover:text-white"
                  }`}
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>Correlated Logs ({activeLogs.length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen((prev) => !prev)}
                className="text-[#858585] hover:text-white p-1 rounded-md transition-colors"
                title={isDrawerOpen ? "Collapse drawer" : "Expand drawer"}
              >
                {isDrawerOpen ? (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Drawer Body */}
            {isDrawerOpen && (
              <div className="flex-1 min-h-0 overflow-hidden p-1">
                {activeDrawerTab === "traces" ? (
                  <TraceWaterfall trace={activeTrace} />
                ) : (
                  <LogExplorer entries={activeLogs} />
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Health Inspector & Charts */}
        <aside className="w-88 flex-shrink-0 border-l border-[#262626] bg-[#080808]">
          <ServiceHealthInspector
            selectedNode={selectedNode}
            health={selectedHealth}
            comparison={selectedComparison}
          />
        </aside>
      </div>
    </div>
  );
}
