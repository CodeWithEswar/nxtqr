"use client";

import * as React from "react";
import { useGraphEditorStore } from "@nxtqr/state";
import { DeterministicSimulationEngine } from "@nxtqr/simulation-core";
import type { GraphDocument } from "@nxtqr/graph-schema";
import { RefreshIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export function SimulationControls({ className }: { className?: string }) {
  const nodes = useGraphEditorStore((state) => state.nodes);
  const edges = useGraphEditorStore((state) => state.edges);
  const updateNodeStatus = useGraphEditorStore((state) => state.updateNodeStatus);
  const setEdges = useGraphEditorStore((state) => state.setEdges);
  const simulationStatus = useGraphEditorStore((state) => state.simulationStatus);
  const setSimulationStatus = useGraphEditorStore((state) => state.setSimulationStatus);
  const currentStep = useGraphEditorStore((state) => state.currentStep);
  const playbackSpeed = useGraphEditorStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = useGraphEditorStore((state) => state.setPlaybackSpeed);
  const addTraceEvent = useGraphEditorStore((state) => state.addTraceEvent);
  const resetSimulationState = useGraphEditorStore((state) => state.resetSimulationState);

  const engineRef = React.useRef<DeterministicSimulationEngine | null>(null);
  const nodesRef = React.useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = React.useRef(edges);
  edgesRef.current = edges;

  const ensureEngine = React.useCallback(() => {
    if (!engineRef.current) {
      const engine = new DeterministicSimulationEngine({
        speed: playbackSpeed,
        onEvent: (evt) => {
          addTraceEvent(evt);

          // Highlight active node
          if (evt.targetNodeId) {
            updateNodeStatus(evt.targetNodeId, "completed");
          }

          // Highlight edge
          if (evt.edgeId) {
            const currentEdges = edgesRef.current;
            setEdges(
              currentEdges.map((e) =>
                e.id === evt.edgeId
                  ? { ...e, status: "active" }
                  : { ...e, status: "idle" }
              )
            );
          }
        },
        onStatusChange: (status) => {
          setSimulationStatus(status);
          if (status === "completed" || status === "idle") {
            const currentEdges = edgesRef.current;
            setEdges(currentEdges.map((e) => ({ ...e, status: "idle" })));
          }
        },
      });

      const doc: GraphDocument = {
        id: "sim_doc",
        schemaVersion: 1,
        visualizerType: "system-design",
        title: "Simulation Graph",
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: { x: 0, y: 0, zoom: 1.0 },
        metadata: {},
      };

      engine.initialize(doc);
      engineRef.current = engine;
    }
    return engineRef.current;
  }, [addTraceEvent, playbackSpeed, setEdges, setSimulationStatus, updateNodeStatus]);

  // Mount/unmount lifecycle only
  React.useEffect(() => {
    ensureEngine();
    return () => {
      if (engineRef.current) {
        engineRef.current.reset();
        engineRef.current = null;
      }
    };
  }, [ensureEngine]);

  // Update speed dynamically without re-initializing
  React.useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSpeed(playbackSpeed);
    }
  }, [playbackSpeed]);

  const handleStart = async () => {
    const engine = ensureEngine();
    if (simulationStatus === "paused") {
      engine.resume();
    } else {
      const doc: GraphDocument = {
        id: "sim_doc",
        schemaVersion: 1,
        visualizerType: "system-design",
        title: "Simulation Graph",
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: { x: 0, y: 0, zoom: 1.0 },
        metadata: {},
      };
      await engine.initialize(doc);
      nodesRef.current.forEach((n) => updateNodeStatus(n.id, "idle"));
      engine.run();
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
  };

  const handleStep = async () => {
    const engine = ensureEngine();
    if (simulationStatus === "idle") {
      setSimulationStatus("running");
    }
    await engine.step();
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      const doc: GraphDocument = {
        id: "sim_doc",
        schemaVersion: 1,
        visualizerType: "system-design",
        title: "Simulation Graph",
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: { x: 0, y: 0, zoom: 1.0 },
        metadata: {},
      };
      engineRef.current.initialize(doc);
    }
    resetSimulationState();
  };

  const speeds = [0.5, 1.0, 2.0, 4.0];

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-3 shadow-level-1 flex flex-wrap items-center justify-between gap-3 select-none",
        className
      )}
    >
      {/* Left: Transport Playback Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {simulationStatus === "running" ? (
          <button
            onClick={handlePause}
            className="px-2.5 sm:px-3 py-1.5 rounded-md border border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="w-2 h-2 bg-amber-400 rounded-none inline-block" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={simulationStatus === "completed"}
            className="px-2.5 sm:px-3 py-1.5 rounded-md border border-border-strong bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-level-1 active:shadow-level-3 transition-colors"
          >
            <span className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-current inline-block" />
            <span>{simulationStatus === "paused" ? "Resume" : "Start"}</span>
          </button>
        )}

        {/* Step Forward */}
        <button
          onClick={handleStep}
          disabled={simulationStatus === "running" || simulationStatus === "completed"}
          className="px-2 sm:px-2.5 py-1.5 rounded-md border border-subtle-border bg-elevated-surface text-foreground hover:bg-secondary-surface disabled:opacity-40 text-xs font-mono font-medium flex items-center gap-1 transition-colors"
          title="Advance single execution step"
        >
          <span>Step</span>
          <span className="text-[10px]">→</span>
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="px-2 sm:px-2.5 py-1.5 rounded-md border border-subtle-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface text-xs font-mono flex items-center gap-1 transition-colors"
          title="Reset simulation state"
        >
          <RefreshIcon className="h-3 w-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Middle: Live Status Badge & Step Counter */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md border border-subtle-border bg-black font-mono text-xs">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              simulationStatus === "running" && "bg-foreground animate-pulse",
              simulationStatus === "completed" && "bg-emerald-400",
              simulationStatus === "paused" && "bg-amber-400",
              simulationStatus === "idle" && "bg-zinc-600"
            )}
          />
          <span className="text-muted-foreground hidden sm:inline">STATUS:</span>
          <span className="text-foreground font-semibold uppercase text-[11px] sm:text-xs">{simulationStatus}</span>
        </div>

        <div className="px-2 sm:px-2.5 py-1 rounded-md border border-subtle-border bg-black font-mono text-xs text-muted-foreground">
          <span className="hidden sm:inline">STEP: </span>
          <span className="sm:hidden">S: </span>
          <span className="text-foreground font-bold tabular-nums">{currentStep}</span>
        </div>
      </div>

      {/* Right: Speed Multiplier */}
      <div className="flex items-center gap-0.5 sm:gap-1 p-1 bg-secondary-surface border border-subtle-border rounded-md shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground px-1 hidden sm:inline">Speed:</span>
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => setPlaybackSpeed(s)}
            className={cn(
              "px-1.5 sm:px-2 py-0.5 rounded text-[11px] sm:text-xs font-mono transition-colors",
              playbackSpeed === s
                ? "border border-border-strong bg-surface-04 text-foreground font-bold shadow-level-3"
                : "border border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
