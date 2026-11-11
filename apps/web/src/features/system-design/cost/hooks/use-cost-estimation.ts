"use client";

import * as React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureCostEngine,
  DEFAULT_PRICING_CATALOGS,
  CostScenarioComparator,
  CostForecaster,
  DEFAULT_CAPACITY_SCENARIOS,
  type CloudProviderId,
  type BillingPeriod,
  type CostEstimate,
  type CostOptimizationOpportunity,
  type CostForecastIntervalPoint,
  type CostComparisonResult,
  type PricingCatalog,
} from "@nxtqr/architecture-intelligence";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

export interface WhatIfCostOverride {
  replicas?: number;
  pricingSku?: string;
  storageGb?: number;
}

export interface UseCostEstimationOptions {
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialProviderId?: CloudProviderId;
  initialBillingPeriod?: BillingPeriod;
}

export function useCostEstimation(options?: UseCostEstimationOptions) {
  const storeNodes = useGraphEditorStore((state) => state.nodes);
  const storeEdges = useGraphEditorStore((state) => state.edges);
  const updateNodeConfig = useGraphEditorStore((state) => state.updateNodeConfig);

  const rawNodes = options?.nodes ?? storeNodes;
  const rawEdges = options?.edges ?? storeEdges;

  // Selected Cloud Provider & Billing Period
  const [selectedProviderId, setSelectedProviderId] = React.useState<CloudProviderId>(
    options?.initialProviderId || "aws"
  );
  const [billingPeriod, setBillingPeriod] = React.useState<BillingPeriod>(
    options?.initialBillingPeriod || "monthly"
  );

  // Custom Catalog Overrides (allows user-adjusted unit rates)
  const [customCatalog, setCustomCatalog] = React.useState<PricingCatalog | undefined>(undefined);

  // Non-destructive What-If overrides: nodeId -> { replicas, pricingSku, storageGb }
  const [whatIfOverrides, setWhatIfOverrides] = React.useState<Record<string, WhatIfCostOverride>>({});

  // Active Catalog
  const activeCatalog = React.useMemo(() => {
    if (customCatalog && customCatalog.providerId === selectedProviderId) {
      return customCatalog;
    }
    return DEFAULT_PRICING_CATALOGS[selectedProviderId] || DEFAULT_PRICING_CATALOGS.aws;
  }, [customCatalog, selectedProviderId]);

  // Baseline Nodes (without What-If modifications)
  const baselineNodes = rawNodes;

  // Candidate Nodes (with What-If modifications applied)
  const candidateNodes = React.useMemo(() => {
    return rawNodes.map((node) => {
      const override = whatIfOverrides[node.id];
      if (!override) return node;

      return {
        ...node,
        data: {
          ...(node.data || {}),
          replicas: override.replicas !== undefined ? override.replicas : (node.data as any)?.replicas,
          pricingSku: override.pricingSku !== undefined ? override.pricingSku : (node.data as any)?.pricingSku,
          storageGb: override.storageGb !== undefined ? override.storageGb : (node.data as any)?.storageGb,
        },
      };
    });
  }, [rawNodes, whatIfOverrides]);

  // 1. Generate Baseline Cost Estimate
  const baselineEstimate: CostEstimate = React.useMemo(() => {
    return architectureCostEngine.estimateCost(baselineNodes, rawEdges, {
      providerId: selectedProviderId,
      customCatalog: activeCatalog,
      billingPeriod,
    });
  }, [baselineNodes, rawEdges, selectedProviderId, activeCatalog, billingPeriod]);

  // 2. Generate Candidate What-If Cost Estimate
  const candidateEstimate: CostEstimate = React.useMemo(() => {
    return architectureCostEngine.estimateCost(candidateNodes, rawEdges, {
      providerId: selectedProviderId,
      customCatalog: activeCatalog,
      billingPeriod,
    });
  }, [candidateNodes, rawEdges, selectedProviderId, activeCatalog, billingPeriod]);

  // Has active What-If changes
  const hasWhatIfChanges = Object.keys(whatIfOverrides).length > 0;

  // 3. Side-by-side Cost Comparison
  const comparisonResult: CostComparisonResult = React.useMemo(() => {
    return CostScenarioComparator.compare(baselineEstimate, candidateEstimate);
  }, [baselineEstimate, candidateEstimate]);

  // 4. Optimization Opportunities (derived from baseline architecture)
  const optimizationOpportunities: CostOptimizationOpportunity[] = React.useMemo(() => {
    return architectureCostEngine.getOptimizationOpportunities(baselineNodes, baselineEstimate);
  }, [baselineNodes, baselineEstimate]);

  // 5. Multi-Month Cost Forecast Trajectory
  const costForecast: CostForecastIntervalPoint[] = React.useMemo(() => {
    const growthScenario = DEFAULT_CAPACITY_SCENARIOS.linear_enterprise_scaling;
    return CostForecaster.forecast(baselineNodes, baselineEstimate, growthScenario);
  }, [baselineNodes, baselineEstimate]);

  // Actions
  const setNodeWhatIf = React.useCallback((nodeId: string, override: WhatIfCostOverride) => {
    setWhatIfOverrides((prev) => ({
      ...prev,
      [nodeId]: {
        ...(prev[nodeId] || {}),
        ...override,
      },
    }));
  }, []);

  const clearWhatIf = React.useCallback(() => {
    setWhatIfOverrides({});
  }, []);

  const applyOptimizationToWhatIf = React.useCallback(
    (opportunity: CostOptimizationOpportunity) => {
      if (!opportunity.proposedOperations) return;
      opportunity.proposedOperations.forEach((op) => {
        if (op.type === "adjust_instances" && op.changes.replicas !== undefined) {
          setNodeWhatIf(op.nodeId, { replicas: Number(op.changes.replicas) });
        } else if (op.type === "modify_node_data" && op.changes.pricingSku) {
          setNodeWhatIf(op.nodeId, { pricingSku: String(op.changes.pricingSku) });
        }
      });
    },
    [setNodeWhatIf]
  );

  const commitWhatIfToGraph = React.useCallback(() => {
    Object.entries(whatIfOverrides).forEach(([nodeId, override]) => {
      const updates: Record<string, unknown> = {};
      if (override.replicas !== undefined) updates.replicas = override.replicas;
      if (override.pricingSku !== undefined) updates.pricingSku = override.pricingSku;
      if (override.storageGb !== undefined) updates.storageGb = override.storageGb;
      updateNodeConfig(nodeId, { data: updates });
    });
    setWhatIfOverrides({});
  }, [whatIfOverrides, updateNodeConfig]);

  return {
    selectedProviderId,
    setSelectedProviderId,
    billingPeriod,
    setBillingPeriod,
    activeCatalog,
    setCustomCatalog,
    baselineEstimate,
    candidateEstimate,
    comparisonResult,
    optimizationOpportunities,
    costForecast,
    whatIfOverrides,
    setNodeWhatIf,
    clearWhatIf,
    applyOptimizationToWhatIf,
    commitWhatIfToGraph,
    hasWhatIfChanges,
  };
}

