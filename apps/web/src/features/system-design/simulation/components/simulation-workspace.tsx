"use client";

import React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { FailureScenario } from "@nxtqr/architecture-intelligence";
import { useArchitectureSimulation } from "../hooks/use-architecture-simulation";
import { PlaybackControls } from "./playback-controls";
import { SimulationTimeline } from "./simulation-timeline";
import { ScenarioBuilder } from "./scenario-builder";
import { SimulationInspector } from "./simulation-inspector";
import { SimulationCanvasOverlay } from "./simulation-canvas-overlay";
import { SimulationComparison } from "./simulation-comparison";
import { ActivityIcon, ShieldIcon } from "@nxtqr/icons";

export interface SimulationWorkspaceProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  initialScenario?: FailureScenario;
  architectureId?: string;
  className?: string;
}

export function SimulationWorkspace({
  nodes,
  edges,
  initialScenario,
  architectureId,
  className = "",
}: SimulationWorkspaceProps) {
  const {
    scenario,
    setScenario,
    selectedPresetId,
    selectPreset,
    simulationResult,
    currentStep,
    currentTimestampMs,
    durationMs,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    togglePlay,
    stepForward,
    stepBackward,
    seek,
    reset,
    selectedComponentId,
    setSelectedComponentId,
    activeTab,
    setActiveTab,
    comparisonResult,
    runComparison,
  } = useArchitectureSimulation({
    nodes,
    edges,
    initialScenario,
    architectureId,
  });

  const handleTriggerWhatIf = () => {
    // Generate candidate topology with added read-replica database and circuit breaker
    const candidateNodes: BaseNode[] = [
      ...nodes,
      {
        id: "replica-db-candidate",
        type: "database",
        position: { x: 320, y: 120 },
        data: { label: "Read Replica Database", replicas: 1 },
      },
    ];
    const candidateEdges: BaseEdge[] = [
      ...edges,
      {
        id: "edge-replica-sync",
        source: nodes.find((n) => (n.type || "").toLowerCase().includes("service"))?.id || nodes[0].id,
        target: "replica-db-candidate",
        data: { protocol: "Postgres" },
      },
    ];

    runComparison(candidateNodes, candidateEdges);
  };

  return (
    <div className={`flex flex-col h-full w-full bg-black text-white select-none overflow-hidden ${className}`}>
      {/* 1. Master Workspace Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-surface-01 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-white" />
            <span className="text-xs font-bold tracking-tight">Failure Simulation Engine</span>
          </div>
          <span className="text-text-muted text-xs">/</span>
          <span className="text-xs font-mono text-text-secondary truncate max-w-[200px]">
            {scenario.name}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-surface-03 text-text-muted border border-border-subtle rounded-md">
            Model-Based Testing
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerWhatIf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-02 hover:bg-surface-03 border border-border-default hover:border-border-hover text-white text-xs font-medium rounded-md transition-all shadow-level-1"
          >
            <ShieldIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Test Resilience What-If</span>
          </button>
        </div>
      </header>

      {/* 2. Main 3-Pane Body Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Pane: Scenario Builder */}
        <aside className="w-80 flex-shrink-0 border-r border-border-default p-2 bg-surface-01">
          <ScenarioBuilder
            nodes={nodes}
            scenario={scenario}
            onScenarioChange={setScenario}
            selectedPresetId={selectedPresetId}
            onSelectPreset={selectPreset}
          />
        </aside>

        {/* Center Pane: Visual Canvas Overlay or Comparison */}
        <main className="flex-1 min-w-0 relative bg-black flex flex-col">
          {activeTab === "comparison" ? (
            <div className="p-4 h-full">
              <SimulationComparison
                comparison={comparisonResult}
                onClose={() => setActiveTab("inspector")}
              />
            </div>
          ) : (
            <SimulationCanvasOverlay
              nodes={nodes}
              edges={edges}
              currentStep={currentStep}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
            />
          )}
        </main>

        {/* Right Pane: Simulation Inspector */}
        <aside className="w-84 flex-shrink-0 border-l border-border-default p-2 bg-surface-01">
          <SimulationInspector
            nodes={nodes}
            simulationResult={simulationResult}
            currentStep={currentStep}
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
          />
        </aside>
      </div>

      {/* 3. Bottom Docked Playback Bar */}
      <footer className="flex flex-col border-t border-border-default bg-surface-01 p-2 gap-2">
        <SimulationTimeline
          currentMs={currentTimestampMs}
          totalMs={durationMs}
          injections={scenario.injections}
          events={simulationResult.events}
          onSeek={seek}
        />
        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onStepForward={stepForward}
          onStepBackward={stepBackward}
          onReset={reset}
          speed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          currentMs={currentTimestampMs}
          totalMs={durationMs}
        />
      </footer>
    </div>
  );
}
