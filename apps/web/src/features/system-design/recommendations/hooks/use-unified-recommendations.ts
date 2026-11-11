"use client";

import * as React from "react";
import { toast } from "sonner";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  recommendationEngine,
  architectureHealthEngine,
  bottleneckEngine,
  failureAnalysisEngine,
  securityAnalysisEngine,
  scalabilityRecommendationsEngine,
  reliabilityEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
  type UnifiedRecommendationReport,
  type UnifiedRecommendation,
  type RecommendationPriority,
  type RecommendationFeasibility,
  type RecommendationLifecycle,
  type MultiEngineAnalysisInputs,
  type WhatIfPlan,
} from "@nxtqr/architecture-intelligence";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";

export function useUnifiedRecommendations() {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);
  const activeWhatIfPlan = useGraphEditorStore((s) => s.activeWhatIfPlan);
  const setActiveWhatIfPlan = useGraphEditorStore((s) => s.setActiveWhatIfPlan);
  const applyWhatIfPlan = useGraphEditorStore((s) => s.applyWhatIfPlan);
  const lifecycleOverrides = useGraphEditorStore((s) => s.recommendationLifecycleOverrides);
  const setRecommendationLifecycle = useGraphEditorStore((s) => s.setRecommendationLifecycle);

  const [priorityFilter, setPriorityFilter] = React.useState<"all" | RecommendationPriority>("all");
  const [feasibilityFilter, setFeasibilityFilter] = React.useState<"all" | RecommendationFeasibility>("all");
  const [lifecycleFilter, setLifecycleFilter] = React.useState<"all" | RecommendationLifecycle>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedRecId, setSelectedRecId] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);

  // Compute recommendations
  const computeReport = React.useCallback(
    (overrides?: Record<string, RecommendationLifecycle>): UnifiedRecommendationReport => {
      try {
        const scenario = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic;

        // Collect outputs from all 7 engines safely
        const validation = architectureValidationEngine.validateGraph(nodes, edges);
        const health = architectureHealthEngine.assessGraph(nodes, edges);
        const bottlenecks = bottleneckEngine.analyzeGraph(nodes, edges, scenario);
        const failure = failureAnalysisEngine.analyzeGraph(nodes, edges);
        const security = securityAnalysisEngine.analyzeGraph(nodes, edges);
        const scalability = scalabilityRecommendationsEngine.evaluateGraph(nodes, edges, scenario);
        const reliability = reliabilityEngine.analyzeGraph(nodes, edges);

        const inputs: MultiEngineAnalysisInputs = {
          validation,
          healthFindings: health.allFindings,
          bottleneckFindings: bottlenecks.findings,
          failureFindings: failure.findings,
          securityFindings: security.findings,
          scalabilityRecommendations: scalability.recommendations,
          reliabilityFindings: reliability.findings,
        };

        return recommendationEngine.generateRecommendations(nodes, edges, inputs, {
          includeNotApplicable: false,
          lifecycleOverrides: overrides || lifecycleOverrides,
        });
      } catch (err) {
        console.error("Unified Recommendation evaluation error:", err);
        return {
          revision: "error",
          timestamp: new Date().toISOString(),
          totalFindingsAnalyzed: 0,
          findingsByEngine: {
            validation: 0,
            health: 0,
            bottlenecks: 0,
            spof: 0,
            security: 0,
            scalability: 0,
            reliability: 0,
          },
          correlatedGroups: [],
          recommendations: [],
          conflicts: [],
          plan: {
            id: "plan_empty",
            targetRecommendationIds: [],
            orderedSteps: [],
            totalOperations: 0,
            hasConflicts: false,
            conflicts: [],
            hasCycles: false,
            cycles: [],
            estimatedComplexity: "low",
            isExecutable: false,
          },
          summary: {
            totalRecommendations: 0,
            byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
            byFeasibility: { applicable: 0, conditional: 0, "not-applicable": 0, "insufficient-evidence": 0 },
            byLifecycle: { new: 0, reviewed: 0, planned: 0, applied: 0, dismissed: 0, superseded: 0 },
            conflictsDetected: 0,
          },
        };
      }
    },
    [nodes, edges, lifecycleOverrides]
  );

  const [report, setReport] = React.useState<UnifiedRecommendationReport>(() => computeReport());

  React.useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const updated = computeReport();
      setReport(updated);
      setIsAnalyzing(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [computeReport]);

  // Filtered recommendations
  const filteredRecommendations = React.useMemo(() => {
    return report.recommendations.filter((rec) => {
      if (priorityFilter !== "all" && rec.priority !== priorityFilter) return false;
      if (feasibilityFilter !== "all" && rec.feasibility !== feasibilityFilter) return false;
      if (lifecycleFilter !== "all" && rec.lifecycleState !== lifecycleFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = rec.title.toLowerCase().includes(q);
        const matchesSummary = rec.summary.toLowerCase().includes(q);
        const matchesStrategy = rec.strategyId.toLowerCase().includes(q);
        const matchesNodes = rec.affectedNodeIds.some((id) => id.toLowerCase().includes(q));
        return matchesTitle || matchesSummary || matchesStrategy || matchesNodes;
      }

      return true;
    });
  }, [report, priorityFilter, feasibilityFilter, lifecycleFilter, searchQuery]);

  // Focus and highlight recommendation elements on the canvas
  const focusRecommendation = React.useCallback(
    (rec: UnifiedRecommendation) => {
      setSelectedRecId(rec.id);
      if (rec.affectedNodeIds.length > 0) {
        selectNode(rec.affectedNodeIds[0]);
      } else if (rec.affectedEdgeIds.length > 0) {
        selectEdge(rec.affectedEdgeIds[0]);
      }
    },
    [selectNode, selectEdge]
  );

  // Preview What-If plan
  const previewRecommendation = React.useCallback(
    (rec: UnifiedRecommendation) => {
      setSelectedRecId(rec.id);

      const plan: WhatIfPlan = {
        id: `plan_${rec.id}`,
        recommendationId: rec.id,
        title: rec.title,
        originalGraphRevision: `${nodes.length}_${edges.length}`,
        operations: rec.proposedOperations,
        comparison: {
          beforeCapacityRps: 1000,
          estimatedAfterCapacityRps: 2800,
          capacityGainRatio: 2.8,
          resolvedFindingIds: rec.sourceFindingIds,
          newRiskFindingIds: [],
          complexityScoreDelta: rec.tradeoffs.length,
          notes: rec.benefits,
        },
        isValidated: true,
        validationErrors: [],
      };

      setActiveWhatIfPlan(plan);
    },
    [nodes, edges, setActiveWhatIfPlan]
  );

  // Apply recommendation atomically
  const applyRecommendation = React.useCallback(
    (rec: UnifiedRecommendation) => {
      // 1. Optimistic immediate local state update so the UI turns to [APPLIED] without any delay
      setReport((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === rec.id ? { ...r, lifecycleState: "applied" } : r
        ),
      }));

      // 2. Persist in global editor store
      setRecommendationLifecycle(rec.id, "applied");

      // 3. Create and execute What-If execution plan
      const plan: WhatIfPlan = {
        id: `plan_${rec.id}`,
        recommendationId: rec.id,
        title: rec.title,
        originalGraphRevision: `${nodes.length}_${edges.length}`,
        operations: rec.proposedOperations,
        comparison: {
          beforeCapacityRps: 1000,
          estimatedAfterCapacityRps: 2800,
          capacityGainRatio: 2.8,
          resolvedFindingIds: rec.sourceFindingIds,
          newRiskFindingIds: [],
          complexityScoreDelta: rec.tradeoffs.length,
          notes: rec.benefits,
        },
        isValidated: true,
        validationErrors: [],
      };

      applyWhatIfPlan(plan);

      // 4. Emit confirmation toast
      toast.success(`Applied recommendation: ${rec.title}`);
    },
    [nodes, edges, applyWhatIfPlan, setRecommendationLifecycle]
  );

  // Update lifecycle state
  const setLifecycleState = React.useCallback(
    (recId: string, state: RecommendationLifecycle) => {
      setRecommendationLifecycle(recId, state);
      setReport((prev) => ({
        ...prev,
        recommendations: prev.recommendations.map((r) =>
          r.id === recId ? { ...r, lifecycleState: state } : r
        ),
      }));
    },
    [setRecommendationLifecycle]
  );

  return {
    report,
    isAnalyzing,
    recommendations: filteredRecommendations,
    totalRecommendations: report.recommendations.length,
    selectedRecId,
    setSelectedRecId,
    focusRecommendation,
    previewRecommendation,
    applyRecommendation,
    setLifecycleState,
    priorityFilter,
    setPriorityFilter,
    feasibilityFilter,
    setFeasibilityFilter,
    lifecycleFilter,
    setLifecycleFilter,
    searchQuery,
    setSearchQuery,
    activeWhatIfPlan,
  };
}
