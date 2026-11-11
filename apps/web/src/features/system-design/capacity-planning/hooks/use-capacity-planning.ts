"use client";

import * as React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  capacityPlanningEngine,
  DEFAULT_CAPACITY_SCENARIOS,
  type CapacityForecastScenario,
  type CapacityPlanningReport,
  type ScenarioComparisonPoint,
  type GrowthModelKind,
  type ForecastIntervalUnit,
} from "@nxtqr/architecture-intelligence";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface WhatIfCapacityOverride {
  replicas?: number;
  capacityRps?: number;
}

export interface UseCapacityPlanningOptions {
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialScenarioId?: string;
}

export function useCapacityPlanning(options?: UseCapacityPlanningOptions) {
  const storeNodes = useGraphEditorStore((state) => state.nodes);
  const storeEdges = useGraphEditorStore((state) => state.edges);
  const updateNodeConfig = useGraphEditorStore((state) => state.updateNodeConfig);

  const nodes = options?.nodes ?? storeNodes;
  const edges = options?.edges ?? storeEdges;

  // Scenario selection
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>(
    options?.initialScenarioId || "rapid_startup_growth"
  );

  // Horizon and Growth Model Overrides
  const [horizonIntervals, setHorizonIntervals] = React.useState<number>(12);
  const [intervalUnit, setIntervalUnit] = React.useState<ForecastIntervalUnit>("month");
  const [growthModel, setGrowthModel] = React.useState<GrowthModelKind>("compound");
  const [growthRatePercent, setGrowthRatePercent] = React.useState<number>(15);
  const [peakMultiplier, setPeakMultiplier] = React.useState<number>(1.2);

  // Non-destructive What-If overrides: node ID -> { replicas, capacityRps }
  const [whatIfOverrides, setWhatIfOverrides] = React.useState<Record<string, WhatIfCapacityOverride>>({});

  // Active scenario object
  const activeScenario: CapacityForecastScenario = React.useMemo(() => {
    const base = DEFAULT_CAPACITY_SCENARIOS[selectedScenarioId] || DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth;

    if (selectedScenarioId === "custom") {
      return {
        id: "custom",
        name: "Custom Forecast Scenario",
        description: `Custom ${growthModel} trajectory projected across ${horizonIntervals} ${intervalUnit}s.`,
        baseWorkloadScenarioId: "normal_traffic",
        growthModel,
        growthParams:
          growthModel === "compound"
            ? { kind: "compound", params: { growthRatePercentPerInterval: growthRatePercent } }
            : growthModel === "linear"
              ? { kind: "linear", params: { growthPerIntervalRps: growthRatePercent * 10 } }
              : growthModel === "seasonal"
                ? { kind: "seasonal", params: { baseGrowthRatePercent: 10, amplitudePercent: 30, periodIntervals: horizonIntervals } }
                : { kind: "constant" },
        horizonIntervals,
        intervalUnit,
        warningUtilizationThreshold: 0.7,
        criticalUtilizationThreshold: 0.85,
        graphRevision: `rev_${nodes.length}_${edges.length}`,
        sourceOfAssumptions: "Interactive Studio Custom Parameters",
      };
    }

    // Apply any customized horizon or thresholds to standard scenario
    return {
      ...base,
      horizonIntervals,
      intervalUnit,
    };
  }, [selectedScenarioId, growthModel, growthRatePercent, horizonIntervals, intervalUnit, nodes.length, edges.length]);

  // Construct effective nodes including What-If scaling overrides
  const effectiveNodes = React.useMemo(() => {
    if (Object.keys(whatIfOverrides).length === 0) {
      return nodes;
    }

    return nodes.map((node) => {
      const override = whatIfOverrides[node.id];
      if (!override) return node;

      const currentData = (node.data || {}) as Record<string, unknown>;
      return {
        ...node,
        data: {
          ...currentData,
          replicas: override.replicas ?? currentData.replicas,
          capacityRps: override.capacityRps ?? currentData.capacityRps,
        },
      };
    });
  }, [nodes, whatIfOverrides]);

  // Execute Capacity Planning Engine
  const report: CapacityPlanningReport = React.useMemo(() => {
    return capacityPlanningEngine.planCapacity(effectiveNodes, edges, activeScenario);
  }, [effectiveNodes, edges, activeScenario]);

  // Compute multi-scenario comparison
  const comparisonMatrix: ScenarioComparisonPoint[] = React.useMemo(() => {
    const standardScenarios = [
      DEFAULT_CAPACITY_SCENARIOS.steady_state,
      DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth,
      DEFAULT_CAPACITY_SCENARIOS.linear_enterprise_scaling,
      DEFAULT_CAPACITY_SCENARIOS.black_friday_surge,
    ].filter(Boolean);

    return capacityPlanningEngine.compareScenarios(effectiveNodes, edges, standardScenarios);
  }, [effectiveNodes, edges]);

  // What-If Operations
  const setNodeWhatIf = React.useCallback((nodeId: string, override: WhatIfCapacityOverride) => {
    setWhatIfOverrides((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...override,
      },
    }));
  }, []);

  const clearWhatIf = React.useCallback(() => {
    setWhatIfOverrides({});
  }, []);

  const commitWhatIfToGraph = React.useCallback(() => {
    Object.entries(whatIfOverrides).forEach(([nodeId, override]) => {
      const node = nodes.find((n) => n.id === nodeId);
      const currentData = (node?.data || {}) as Record<string, unknown>;
      updateNodeConfig(nodeId, {
        data: {
          ...currentData,
          ...(override.replicas !== undefined ? { replicas: override.replicas } : {}),
          ...(override.capacityRps !== undefined ? { capacityRps: override.capacityRps } : {}),
        },
      });
    });
    setWhatIfOverrides({});
  }, [whatIfOverrides, nodes, updateNodeConfig]);

  return {
    report,
    comparisonMatrix,
    activeScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    horizonIntervals,
    setHorizonIntervals,
    intervalUnit,
    setIntervalUnit,
    growthModel,
    setGrowthModel,
    growthRatePercent,
    setGrowthRatePercent,
    peakMultiplier,
    setPeakMultiplier,
    whatIfOverrides,
    setNodeWhatIf,
    clearWhatIf,
    commitWhatIfToGraph,
    hasWhatIfChanges: Object.keys(whatIfOverrides).length > 0,
    presetScenarios: Object.values(DEFAULT_CAPACITY_SCENARIOS),
  };
}
