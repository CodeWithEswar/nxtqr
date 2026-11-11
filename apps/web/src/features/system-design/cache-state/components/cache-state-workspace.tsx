"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Master Studio Workspace Shell
 */

import React, { useState } from "react";
import {
  useArchitectureCacheState,
  type UseArchitectureCacheStateProps,
} from "../hooks/use-architecture-cache-state";
import { CacheLayerExplorer } from "./cache-layer-explorer";
import { CachePolicyInspector } from "./cache-policy-inspector";
import { InvalidationFlowView } from "./invalidation-flow-view";
import { StampedeAvalancheInspector } from "./stampede-avalanche-inspector";
import { ConsistencyInspector } from "./consistency-inspector";
import { StateOwnershipView } from "./state-ownership-view";
import { CachePathView } from "./cache-path-view";
import { CacheStateFindings } from "./cache-state-findings";
import {
  LayersIcon,
  ActivityIcon,
  DatabaseIcon,
  ShieldIcon,
  LockIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@nxtqr/icons";

export interface CacheStateWorkspaceProps extends UseArchitectureCacheStateProps {
  className?: string;
}

export function CacheStateWorkspace(props: CacheStateWorkspaceProps) {
  const { className = "" } = props;
  const state = useArchitectureCacheState(props);
  const [searchQuery, setSearchQuery] = useState("");

  const summary = state.analysis.summary;

  return (
    <div
      className={`flex flex-col h-full w-full bg-[#000000] text-[#FFFFFF] select-none overflow-hidden ${className}`}
    >
      {/* Studio Header Bar */}
      <header className="h-12 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            <span className="text-xs font-semibold tracking-wider text-[#FFFFFF] uppercase">
              Caching & State Consistency Engine
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
            Phase 05.3.22
          </span>
        </div>

        {/* Global Summary Badges */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
            <span className="text-[#858585]">Net Offload:</span>
            <span className="text-[#FFFFFF] font-semibold">{summary.netOffloadPercentage.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
            <span className="text-[#858585]">Stampede Risks:</span>
            <span
              className={`font-semibold ${
                summary.stampedeRiskCount > 0 ? "text-[#FFFFFF]" : "text-[#858585]"
              }`}
            >
              {summary.stampedeRiskCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
            <span className="text-[#858585]">Findings:</span>
            <span
              className={`font-semibold ${
                summary.findingsCount.total > 0 ? "text-[#FFFFFF]" : "text-[#858585]"
              }`}
            >
              {summary.findingsCount.total}
            </span>
          </div>
        </div>
      </header>

      {/* Workspace Body: 2/3 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer Pane */}
        <CacheLayerExplorer
          cacheLayers={state.topology.cacheLayers}
          sourcesOfTruth={state.topology.sourcesOfTruth}
          replicaGroups={state.topology.replicaGroups}
          selectedLayerId={state.selectedLayerId}
          selectedSourceId={state.selectedSourceId}
          onSelectLayer={(id) => {
            state.setSelectedLayerId(id);
            if (state.activeTab === "overview") {
              state.setActiveTab("layers");
            }
          }}
          onSelectSource={(id) => {
            state.setSelectedSourceId(id);
            state.setSelectedLayerId(null);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Center / Detail Pane */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#000000]">
          {/* Tabs Bar */}
          <nav className="h-10 border-b border-[#262626] bg-[#080808] px-3 flex items-center gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => state.setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                state.activeTab === "overview"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <LayersIcon className="w-3.5 h-3.5" />
              Overview
            </button>

            <button
              onClick={() => state.setActiveTab("layers")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                state.activeTab === "layers"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <ActivityIcon className="w-3.5 h-3.5" />
              Layer Policies
            </button>

            <button
              onClick={() => state.setActiveTab("stampede")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                state.activeTab === "stampede"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <ShieldIcon className="w-3.5 h-3.5" />
              Stampede & Capacity
              {summary.stampedeRiskCount > 0 && (
                <span className="text-[10px] px-1 rounded-md bg-[#141414] text-[#FFFFFF] border border-[#333333]">
                  {summary.stampedeRiskCount}
                </span>
              )}
            </button>

            <button
              onClick={() => state.setActiveTab("consistency")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                state.activeTab === "consistency"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <DatabaseIcon className="w-3.5 h-3.5" />
              Replication & Quorum
            </button>

            <button
              onClick={() => state.setActiveTab("ownership")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                state.activeTab === "ownership"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <LockIcon className="w-3.5 h-3.5" />
              State Ownership & Locks
              {summary.unfencedLockCount > 0 && (
                <span className="text-[10px] px-1 rounded-md bg-[#141414] text-[#FFFFFF] border border-[#333333]">
                  {summary.unfencedLockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => state.setActiveTab("paths")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                state.activeTab === "paths"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              Read Path Offload
            </button>

            <button
              onClick={() => state.setActiveTab("findings")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 ${
                state.activeTab === "findings"
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040]"
                  : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <AlertTriangleIcon className="w-3.5 h-3.5" />
              Findings
              {summary.findingsCount.total > 0 && (
                <span className="text-[10px] px-1 rounded-md bg-[#141414] text-[#FFFFFF] border border-[#333333]">
                  {summary.findingsCount.total}
                </span>
              )}
            </button>
          </nav>

          {/* Active Tab View */}
          <div className="flex-1 flex overflow-hidden">
            {state.activeTab === "overview" && (
              <InvalidationFlowView
                topology={state.topology}
                uncoveredLayersByRule={state.analysis.uncoveredLayersByRule}
              />
            )}

            {state.activeTab === "layers" && (
              <CachePolicyInspector
                layer={state.selectedLayer}
                onUpdateLayer={state.updateCacheLayer}
              />
            )}

            {state.activeTab === "stampede" && (
              <StampedeAvalancheInspector
                topology={state.topology}
                stampedeEvaluations={state.analysis.stampedeEvaluations}
                capacityEvaluations={state.analysis.capacityEvaluations}
                simulatedIncomingRps={state.simulatedIncomingRps}
                onIncomingRpsChange={state.setSimulatedIncomingRps}
              />
            )}

            {state.activeTab === "consistency" && (
              <ConsistencyInspector
                topology={state.topology}
                staleReadEvaluations={state.analysis.staleReadEvaluations}
              />
            )}

            {state.activeTab === "ownership" && (
              <StateOwnershipView topology={state.topology} />
            )}

            {state.activeTab === "paths" && (
              <CachePathView
                topology={state.topology}
                clientRps={state.simulatedIncomingRps}
              />
            )}

            {state.activeTab === "findings" && (
              <CacheStateFindings findings={state.analysis.findings} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
