"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Orchestration State & Execution Hook
 */

import { useState, useCallback, useRef } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureOrchestrationEngine,
  type UnifiedArchitectureAssessment,
  type ExecutionPlan,
  analyzerRegistry,
  type AnalyzerDefinition,
} from "@nxtqr/architecture-intelligence";

export type OrchestrationTab =
  | "overview"
  | "waves"
  | "findings"
  | "correlations"
  | "contradictions"
  | "recommendations"
  | "analyzers";

export interface UseArchitectureOrchestrationProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  projectId?: string;
  architectureId?: string;
}

export function useArchitectureOrchestration({
  nodes,
  edges,
  projectId = "default-project",
  architectureId = "default-arch",
}: UseArchitectureOrchestrationProps) {
  const [assessment, setAssessment] = useState<UnifiedArchitectureAssessment | null>(null);
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrchestrationTab>("overview");
  const [selectedAnalyzerId, setSelectedAnalyzerId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const abortControllerRef = useRef<AbortController | null>(null);

  const registeredAnalyzers: AnalyzerDefinition[] = analyzerRegistry.getAllDefinitions();

  const runOrchestration = useCallback(
    async (requestedAnalyzerIds?: string[]) => {
      setIsOrchestrating(true);
      setError(null);

      // Cancel any ongoing run
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const revisionId = `rev-${Date.now()}`;
        const newPlan = architectureOrchestrationEngine.planAnalysis(
          revisionId,
          requestedAnalyzerIds
        );
        setPlan(newPlan);

        const result = await architectureOrchestrationEngine.orchestrateAnalysis(
          {
            projectId,
            architectureId,
            revisionId,
            nodes,
            edges,
            configuration: {
              maxConcurrency: 4,
              enableCache: true,
            },
          },
          requestedAnalyzerIds,
          abortControllerRef.current.signal
        );

        setAssessment(result);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message || String(err));
        }
      } finally {
        setIsOrchestrating(false);
      }
    },
    [nodes, edges, projectId, architectureId]
  );

  const cancelOrchestration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsOrchestrating(false);
  }, []);

  return {
    assessment,
    plan,
    isOrchestrating,
    error,
    activeTab,
    selectedAnalyzerId,
    selectedComponentId,
    filterSeverity,
    filterCategory,
    registeredAnalyzers,
    runOrchestration,
    cancelOrchestration,
    setActiveTab,
    setSelectedAnalyzerId,
    setSelectedComponentId,
    setFilterSeverity,
    setFilterCategory,
  };
}
