"use client";

import * as React from "react";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  scalabilityRecommendationsEngine,
  type ScalabilityAnalysisReport,
  type ScalabilityRecommendation,
  type ScalabilityStrategy,
  type RecommendationFeasibility,
  type ImplementationComplexity,
} from "@nxtqr/architecture-intelligence";

export interface ScalabilityScenario {
  id: string;
  name: string;
  description: string;
  trafficMultiplier: number;
  concurrentUsersMultiplier: number;
  dataVolumeMultiplier: number;
  durationHours: number;
  trafficPattern: "steady" | "spike" | "diurnal" | "unpredictable";
}

export const PRESET_WORKLOAD_SCENARIOS: ScalabilityScenario[] = [
  {
    id: "normal_traffic",
    name: "Baseline Production",
    description: "Standard daily operating workload (1.0x baseline)",
    trafficMultiplier: 1.0,
    concurrentUsersMultiplier: 1.0,
    dataVolumeMultiplier: 1.0,
    durationHours: 24,
    trafficPattern: "steady",
  },
  {
    id: "peak_traffic",
    name: "Daily Peak (3x Traffic)",
    description: "Anticipated daily peak concurrency and throughput demand",
    trafficMultiplier: 3.0,
    concurrentUsersMultiplier: 2.5,
    dataVolumeMultiplier: 1.2,
    durationHours: 4,
    trafficPattern: "diurnal",
  },
  {
    id: "black_friday",
    name: "Extreme Spike (10x Workload)",
    description: "Black Friday / Flash Sale maximum stress test",
    trafficMultiplier: 10.0,
    concurrentUsersMultiplier: 8.0,
    dataVolumeMultiplier: 2.0,
    durationHours: 8,
    trafficPattern: "spike",
  },
  {
    id: "read_heavy",
    name: "Read Surge (5x Reads)",
    description: "Catalog browsing, feed refresh, or media discovery surge",
    trafficMultiplier: 5.0,
    concurrentUsersMultiplier: 4.0,
    dataVolumeMultiplier: 1.5,
    durationHours: 6,
    trafficPattern: "steady",
  },
  {
    id: "data_explosion",
    name: "Data Scale (10x Storage)",
    description: "Historical data ingestion and storage capacity scaling",
    trafficMultiplier: 2.0,
    concurrentUsersMultiplier: 1.5,
    dataVolumeMultiplier: 10.0,
    durationHours: 72,
    trafficPattern: "steady",
  },
];

export function useScalabilityRecommendations() {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);
  const activeScenarioId = useGraphEditorStore((s) => s.activeScenarioId);
  const setActiveScenarioId = useGraphEditorStore((s) => s.setActiveScenarioId);
  const activeWhatIfPlan = useGraphEditorStore((s) => s.activeWhatIfPlan);
  const setActiveWhatIfPlan = useGraphEditorStore((s) => s.setActiveWhatIfPlan);
  const applyWhatIfPlan = useGraphEditorStore((s) => s.applyWhatIfPlan);

  const [strategyFilter, setStrategyFilter] = React.useState<"all" | ScalabilityStrategy>("all");
  const [feasibilityFilter, setFeasibilityFilter] = React.useState<"all" | RecommendationFeasibility>("all");
  const [complexityFilter, setComplexityFilter] = React.useState<"all" | ImplementationComplexity>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeRecommendationId, setActiveRecommendationId] = React.useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);

  // Active scenario definition
  const currentScenario = React.useMemo(() => {
    return (
      PRESET_WORKLOAD_SCENARIOS.find((s) => s.id === activeScenarioId) ||
      PRESET_WORKLOAD_SCENARIOS[0]
    );
  }, [activeScenarioId]);

  // Debounced evaluation
  const [report, setReport] = React.useState<ScalabilityAnalysisReport>(() =>
    scalabilityRecommendationsEngine.evaluateGraph(nodes, edges, currentScenario)
  );

  React.useEffect(() => {
    setIsEvaluating(true);
    const timer = setTimeout(() => {
      const updated = scalabilityRecommendationsEngine.evaluateGraph(nodes, edges, currentScenario);
      setReport(updated);
      setIsEvaluating(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [nodes, edges, currentScenario]);

  // Filtered recommendations
  const filteredRecommendations = React.useMemo(() => {
    return report.recommendations.filter((r) => {
      if (strategyFilter !== "all" && r.strategy !== strategyFilter) return false;
      if (feasibilityFilter !== "all" && r.feasibility !== feasibilityFilter) return false;
      if (complexityFilter !== "all" && r.tradeoffs.implementationComplexity !== complexityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesSummary = r.summary.toLowerCase().includes(q);
        const matchesNodes = r.affectedNodeIds.some((id) => id.toLowerCase().includes(q));
        return matchesTitle || matchesSummary || matchesNodes;
      }
      return true;
    });
  }, [report, strategyFilter, feasibilityFilter, complexityFilter, searchQuery]);

  // Focus element on canvas
  const highlightRecommendation = React.useCallback(
    (rec: ScalabilityRecommendation | null) => {
      if (!rec) {
        setActiveRecommendationId(null);
        return;
      }
      setActiveRecommendationId(rec.id);
      if (rec.affectedNodeIds.length > 0) {
        selectNode(rec.affectedNodeIds[0]);
      } else if (rec.affectedEdgeIds.length > 0) {
        selectEdge(rec.affectedEdgeIds[0]);
      }
    },
    [selectNode, selectEdge]
  );

  // Create What-If Plan
  const previewWhatIfPlan = React.useCallback(
    (recommendation: ScalabilityRecommendation) => {
      const plan = scalabilityRecommendationsEngine.createWhatIfPlan(
        nodes,
        edges,
        recommendation,
        currentScenario
      );
      setActiveWhatIfPlan(plan);
    },
    [nodes, edges, currentScenario, setActiveWhatIfPlan]
  );

  // Discard What-If Plan
  const discardWhatIfPlan = React.useCallback(() => {
    setActiveWhatIfPlan(null);
  }, [setActiveWhatIfPlan]);

  // Apply What-If Plan atomically to graph
  const commitWhatIfPlan = React.useCallback(() => {
    if (!activeWhatIfPlan) return;
    applyWhatIfPlan(activeWhatIfPlan);
  }, [activeWhatIfPlan, applyWhatIfPlan]);

  return {
    report,
    isEvaluating,
    recommendations: filteredRecommendations,
    rawRecommendationsCount: report.recommendations.length,
    currentScenario,
    activeScenarioId,
    setActiveScenarioId,
    activeRecommendationId,
    highlightRecommendation,
    strategyFilter,
    setStrategyFilter,
    feasibilityFilter,
    setFeasibilityFilter,
    complexityFilter,
    setComplexityFilter,
    searchQuery,
    setSearchQuery,
    activeWhatIfPlan,
    previewWhatIfPlan,
    discardWhatIfPlan,
    commitWhatIfPlan,
  };
}
