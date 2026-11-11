"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  FailureScenario,
  SimulationResult,
  TimelineStepSnapshot,
  SimulationComparisonResult,
} from "@nxtqr/architecture-intelligence";
import {
  architectureSimulationEngine,
  SIMULATION_PRESETS,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureSimulationOptions {
  nodes: BaseNode[];
  edges: BaseEdge[];
  initialScenario?: FailureScenario;
  architectureId?: string;
}

export function useArchitectureSimulation({
  nodes,
  edges,
  initialScenario,
  architectureId = "arch-default",
}: UseArchitectureSimulationOptions) {
  // 1. Scenario state (defaults to primary database outage preset)
  const defaultPreset = SIMULATION_PRESETS.primary_database_outage;
  const initialDbNode = nodes.find((n) => (n.type || "").toLowerCase().includes("database") || (n.type || "").toLowerCase().includes("sql")) || nodes[0];

  const [selectedPresetId, setSelectedPresetId] = useState<string>("primary_database_outage");
  const [scenario, setScenario] = useState<FailureScenario>(() => {
    if (initialScenario) return initialScenario;
    return defaultPreset.buildScenario({
      architectureId,
      graphRevision: "rev-1",
      targetNodeId: initialDbNode?.id || "db-1",
      targetNodeLabel: (initialDbNode?.data?.label as string) || "Primary Database",
    });
  });

  // 2. Deterministic execution
  const simulationResult = useMemo<SimulationResult>(() => {
    return architectureSimulationEngine.simulate(nodes, edges, scenario);
  }, [nodes, edges, scenario]);

  // 3. Playback State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"inspector" | "builder" | "comparison">("inspector");

  // Comparison State
  const [candidateNodes, setCandidateNodes] = useState<BaseNode[] | null>(null);
  const [candidateEdges, setCandidateEdges] = useState<BaseEdge[] | null>(null);
  const [comparisonResult, setComparisonResult] = useState<SimulationComparisonResult | null>(null);

  const totalSteps = simulationResult.timeline.length;
  const currentStep: TimelineStepSnapshot =
    simulationResult.timeline[Math.min(currentStepIndex, totalSteps - 1)] ||
    simulationResult.timeline[0];

  const currentTimestampMs = currentStep?.timestampMs ?? 0;
  const durationMs = scenario.durationMs;

  // 4. Timer loop for smooth discrete-event playback
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(50, Math.round(1000 / (playbackSpeed * 4)));

    timerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Playback handlers
  const play = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stepForward = useCallback(() => {
    pause();
    setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [pause, totalSteps]);

  const stepBackward = useCallback(() => {
    pause();
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, [pause]);

  const seek = useCallback(
    (timestampMs: number) => {
      pause();
      // Find closest snapshot index
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < simulationResult.timeline.length; i++) {
        const diff = Math.abs(simulationResult.timeline[i].timestampMs - timestampMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      setCurrentStepIndex(closestIdx);
    },
    [pause, simulationResult.timeline]
  );

  const reset = useCallback(() => {
    pause();
    setCurrentStepIndex(0);
  }, [pause]);

  const selectPreset = useCallback(
    (presetId: string) => {
      pause();
      setSelectedPresetId(presetId);
      const preset = SIMULATION_PRESETS[presetId];
      if (!preset) return;

      const targetNode =
        presetId === "cache_outage"
          ? nodes.find((n) => (n.type || "").toLowerCase().includes("cache") || (n.type || "").toLowerCase().includes("redis")) || nodes[0]
          : initialDbNode;

      const newScenario = preset.buildScenario({
        architectureId,
        graphRevision: "rev-1",
        targetNodeId: targetNode?.id || "node-1",
        targetNodeLabel: (targetNode?.data?.label as string) || targetNode?.id || "Target",
      });

      setScenario(newScenario);
      setCurrentStepIndex(0);
    },
    [pause, nodes, initialDbNode, architectureId]
  );

  const runComparison = useCallback(
    (candNodes: BaseNode[], candEdges: BaseEdge[]) => {
      setCandidateNodes(candNodes);
      setCandidateEdges(candEdges);

      const candidateScenario: FailureScenario = {
        ...scenario,
        graphRevision: "candidate-rev",
        injections: scenario.injections.map((inj) => ({
          ...inj,
          recoveryBehavior: "automatic",
          parameters: {
            ...inj.parameters,
            failoverDelayMs: Math.max(2000, Math.round((inj.parameters?.failoverDelayMs || 15000) * 0.4)),
          },
        })),
      };

      const candidateResult = architectureSimulationEngine.simulate(
        candNodes,
        candEdges,
        candidateScenario
      );

      const comparison = architectureSimulationEngine.compareScenarios(
        simulationResult,
        candidateResult
      );

      setComparisonResult(comparison);
      setActiveTab("comparison");
    },
    [scenario, simulationResult, nodes]
  );

  return {
    nodes,
    edges,
    scenario,
    setScenario,
    selectedPresetId,
    selectPreset,
    simulationResult,
    currentStepIndex,
    currentStep,
    currentTimestampMs,
    durationMs,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    seek,
    reset,
    selectedComponentId,
    setSelectedComponentId,
    activeTab,
    setActiveTab,
    candidateNodes,
    candidateEdges,
    comparisonResult,
    runComparison,
  };
}
