"use client";

import * as React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  comparisonEngine,
  type ArchitectureComparisonResult,
  type ArchitectureSnapshot,
  type ArchitectureChange,
  type ArchitecturalRegression,
  SnapshotResolver,
} from "@nxtqr/architecture-intelligence";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface UseArchitectureComparisonOptions {
  initialBaseline?: ArchitectureSnapshot;
  initialCandidate?: ArchitectureSnapshot;
}

export function useArchitectureComparison(options: UseArchitectureComparisonOptions = {}) {
  const currentNodes = useGraphEditorStore((s) => s.nodes);
  const currentEdges = useGraphEditorStore((s) => s.edges);
  const setNodesRaw = useGraphEditorStore((s) => s.setNodesRaw);
  const setEdgesRaw = useGraphEditorStore((s) => s.setEdgesRaw);

  const [baselineSnapshot, setBaselineSnapshot] = React.useState<ArchitectureSnapshot>(() => {
    if (options.initialBaseline) return options.initialBaseline;
    return SnapshotResolver.createSnapshot({
      title: "Current Draft (Baseline)",
      nodes: currentNodes,
      edges: currentEdges,
      provenance: "current-draft",
    });
  });

  const [candidateSnapshot, setCandidateSnapshot] = React.useState<ArchitectureSnapshot>(() => {
    if (options.initialCandidate) return options.initialCandidate;
    return SnapshotResolver.createSnapshot({
      title: "Proposed Candidate",
      nodes: currentNodes,
      edges: currentEdges,
      provenance: "what-if-proposal",
    });
  });

  // Navigation synchronization
  const [isSyncNavigation, setIsSyncNavigation] = React.useState<boolean>(true);
  const [sharedViewport, setSharedViewport] = React.useState<{ x: number; y: number; zoom: number }>({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const [focusedNodeId, setFocusedNodeId] = React.useState<string | null>(null);

  // Inspector and filtering
  const [selectedChangeId, setSelectedChangeId] = React.useState<string | null>(null);
  const [filterKind, setFilterKind] = React.useState<
    "all" | "added" | "removed" | "modified" | "regressions"
  >("all");

  // Recalculate comparison when baseline or candidate updates
  const comparisonResult: ArchitectureComparisonResult = React.useMemo(() => {
    return comparisonEngine.compareSnapshots(baselineSnapshot, candidateSnapshot, {
      detectVisualChanges: false,
    });
  }, [baselineSnapshot, candidateSnapshot]);

  // Filtered changes
  const filteredChanges = React.useMemo(() => {
    if (filterKind === "all") return comparisonResult.changes;
    if (filterKind === "regressions") return [];
    return comparisonResult.changes.filter((c) => c.kind === filterKind);
  }, [comparisonResult.changes, filterKind]);

  // Selected change object
  const selectedChange: ArchitectureChange | undefined = React.useMemo(() => {
    if (!selectedChangeId) return undefined;
    return comparisonResult.changes.find((c) => c.id === selectedChangeId);
  }, [comparisonResult.changes, selectedChangeId]);

  // Selected regression object
  const selectedRegression: ArchitecturalRegression | undefined = React.useMemo(() => {
    if (!selectedChangeId) return undefined;
    return comparisonResult.regressions.find((r) => r.id === selectedChangeId);
  }, [comparisonResult.regressions, selectedChangeId]);

  // Focus a component across both canvases
  const focusElement = React.useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
    const relatedChange = comparisonResult.changes.find(
      (c) => c.baselineId === nodeId || c.candidateId === nodeId
    );
    if (relatedChange) {
      setSelectedChangeId(relatedChange.id);
    }
  }, [comparisonResult.changes]);

  // Set candidate directly from modified nodes and edges (e.g. from What-If)
  const setCandidateGraph = React.useCallback(
    (nodes: BaseNode[], edges: BaseEdge[], title: string = "What-If Candidate") => {
      const snap = SnapshotResolver.createSnapshot({
        title,
        nodes,
        edges,
        provenance: "what-if-proposal",
      });
      setCandidateSnapshot(snap);
    },
    []
  );

  // Apply candidate architecture atomically to the active editor workspace
  const applyCandidateToWorkspace = React.useCallback(() => {
    setNodesRaw(candidateSnapshot.nodes);
    setEdgesRaw(candidateSnapshot.edges);
  }, [candidateSnapshot.nodes, candidateSnapshot.edges, setNodesRaw, setEdgesRaw]);

  // Swap baseline and candidate
  const swapSnapshots = React.useCallback(() => {
    setBaselineSnapshot(candidateSnapshot);
    setCandidateSnapshot(baselineSnapshot);
  }, [baselineSnapshot, candidateSnapshot]);

  return {
    baselineSnapshot,
    setBaselineSnapshot,
    candidateSnapshot,
    setCandidateSnapshot,
    setCandidateGraph,
    comparisonResult,
    filteredChanges,
    selectedChange,
    selectedRegression,
    selectedChangeId,
    setSelectedChangeId,
    filterKind,
    setFilterKind,
    isSyncNavigation,
    setIsSyncNavigation,
    sharedViewport,
    setSharedViewport,
    focusedNodeId,
    focusElement,
    applyCandidateToWorkspace,
    swapSnapshots,
  };
}

