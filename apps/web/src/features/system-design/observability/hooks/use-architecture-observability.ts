"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  TelemetryConnection,
  DiscoveredService,
  TelemetryServiceMapping,
  TimeRange,
  ServiceHealthIndicator,
  TopologyDriftFinding,
  ObservedVsModeledComparison,
  ObservabilityFinding,
  TraceQueryResult,
  StructuredLogEntry,
} from "@nxtqr/architecture-intelligence";
import {
  architectureObservabilityEngine,
  MockTelemetryAdapter,
} from "@nxtqr/architecture-intelligence";

export type ObservabilityOverlayMode = "health" | "rps" | "latency" | "cpu" | "none";
export type ObservabilityDrawerTab = "traces" | "logs" | "drift" | "mappings";
export type TimeRangePreset = "15m" | "1h" | "6h" | "24h" | "7d";

export interface UseArchitectureObservabilityOptions {
  nodes: BaseNode[];
  edges: BaseEdge[];
  architectureId?: string;
  projectId?: string;
  initialConnection?: TelemetryConnection;
}

const DEFAULT_PRESET_WINDOWS: Record<TimeRangePreset, number> = {
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

const DEFAULT_STEP_SECONDS: Record<TimeRangePreset, number> = {
  "15m": 15,
  "1h": 60,
  "6h": 300,
  "24h": 1200,
  "7d": 7200,
};

export function useArchitectureObservability({
  nodes,
  edges,
  architectureId = "arch-default",
  projectId = "proj-default",
  initialConnection,
}: UseArchitectureObservabilityOptions) {
  // 1. Connection State
  const defaultMockConnection: TelemetryConnection = useMemo(
    () => ({
      id: "conn-prod-mock",
      projectId,
      name: "Production Telemetry Simulator",
      sourceType: "mock",
      endpointUrl: "https://telemetry.mock.internal",
      authType: "none",
      status: "active",
      capabilities: ["metrics", "traces", "logs", "service_discovery"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [projectId]
  );

  const [activeConnection, setActiveConnection] = useState<TelemetryConnection>(
    initialConnection || defaultMockConnection
  );

  // 2. Time Range State
  const [selectedPreset, setSelectedPreset] = useState<TimeRangePreset>("1h");
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const now = Date.now();
    return {
      startMs: now - DEFAULT_PRESET_WINDOWS["1h"],
      endMs: now,
      stepSeconds: DEFAULT_STEP_SECONDS["1h"],
      preset: "1h",
    };
  });

  const handleSelectPreset = useCallback((preset: TimeRangePreset) => {
    setSelectedPreset(preset);
    const now = Date.now();
    setTimeRange({
      startMs: now - DEFAULT_PRESET_WINDOWS[preset],
      endMs: now,
      stepSeconds: DEFAULT_STEP_SECONDS[preset],
      preset,
    });
  }, []);

  // 3. Service Mappings State
  const [mappings, setMappings] = useState<TelemetryServiceMapping[]>(() => {
    // Generate initial mappings from node labels
    return nodes.map((node, idx) => ({
      id: `map-init-${node.id}`,
      projectId,
      architectureId,
      componentId: node.id,
      connectionId: activeConnection.id,
      serviceIdentity: {
        serviceName: ((node.data?.label as string) || node.id).toLowerCase().replace(/\s+/g, "-"),
      },
      confidence: idx < 2 ? "confirmed" : "suggested",
      evidenceScore: idx < 2 ? 1.0 : 0.85,
      evidenceReasons: ["Auto-correlated from topology component label"],
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  });

  // 4. Discovered Services
  const [discoveredServices, setDiscoveredServices] = useState<DiscoveredService[]>([]);

  useEffect(() => {
    let mounted = true;
    const adapter = new MockTelemetryAdapter();
    adapter
      .discoverServices({
        connection: activeConnection,
        projectId,
        userId: "system",
      })
      .then((services) => {
        if (mounted) setDiscoveredServices(services);
      })
      .catch((err) => {
        console.error("Failed to discover services", err);
      });
    return () => {
      mounted = false;
    };
  }, [activeConnection, projectId]);

  // 5. Evaluated Telemetry State
  const [healthIndicators, setHealthIndicators] = useState<Record<string, ServiceHealthIndicator>>({});
  const [driftFindings, setDriftFindings] = useState<TopologyDriftFinding[]>([]);
  const [comparisons, setComparisons] = useState<ObservedVsModeledComparison[]>([]);
  const [unifiedFindings, setUnifiedFindings] = useState<ObservabilityFinding[]>([]);
  const [activeTrace, setActiveTrace] = useState<TraceQueryResult | null>(null);
  const [activeLogs, setActiveLogs] = useState<StructuredLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toISOString());

  // 6. Navigation and selection state
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    nodes[0]?.id || null
  );
  const [activeOverlay, setActiveOverlay] = useState<ObservabilityOverlayMode>("health");
  const [activeDrawerTab, setActiveDrawerTab] = useState<ObservabilityDrawerTab>("traces");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // 7. Refresh Telemetry Query
  const refreshTelemetry = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await architectureObservabilityEngine.evaluateArchitectureObservability({
        nodes,
        edges,
        connection: activeConnection,
        mappings,
        timeRange,
        modeledExpectations: {
          [nodes[0]?.id || "node-1"]: { expectedRps: 1000, expectedLatencyP95Ms: 25 },
          [nodes[1]?.id || "node-2"]: { expectedRps: 600, expectedLatencyP95Ms: 45 },
        },
      });

      setHealthIndicators(result.healthIndicators);
      setDriftFindings(result.driftFindings);
      setComparisons(result.comparisons);
      setUnifiedFindings(result.unifiedFindings);

      // Query detailed trace and logs for bottom drawer
      const adapter = new MockTelemetryAdapter();
      const traceResult = await adapter.queryTraces(
        {
          connectionId: activeConnection.id,
          timeRange,
          limit: 10,
        },
        { connection: activeConnection, projectId, userId: "system" }
      );
      setActiveTrace(traceResult);

      const logsResult = await adapter.queryLogs(
        {
          connectionId: activeConnection.id,
          timeRange,
        },
        { connection: activeConnection, projectId, userId: "system" }
      );
      setActiveLogs(logsResult.entries);

      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      console.error("Observability evaluation failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, activeConnection, mappings, timeRange, projectId]);

  // Initial fetch and on dependency change
  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  // Auto-refresh interval (e.g. 15s)
  const [autoRefreshIntervalSeconds, setAutoRefreshIntervalSeconds] = useState<number>(0);

  useEffect(() => {
    if (autoRefreshIntervalSeconds <= 0) return;
    const interval = setInterval(() => {
      refreshTelemetry();
    }, autoRefreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshIntervalSeconds, refreshTelemetry]);

  // 8. Mapping actions
  const confirmMapping = useCallback(
    (mappingId: string) => {
      setMappings((prev) =>
        prev.map((m) =>
          m.id === mappingId
            ? { ...m, confidence: "confirmed", lastVerifiedAt: new Date().toISOString() }
            : m
        )
      );
    },
    []
  );

  const unlinkMapping = useCallback((componentId: string) => {
    setMappings((prev) => prev.filter((m) => m.componentId !== componentId));
  }, []);

  const applyAutoSuggestions = useCallback(() => {
    const suggestions = architectureObservabilityEngine.generateMappingSuggestions(
      discoveredServices,
      nodes,
      activeConnection.id,
      architectureId,
      projectId
    );
    setMappings(suggestions);
  }, [discoveredServices, nodes, activeConnection.id, architectureId, projectId]);

  const selectedHealth = selectedComponentId
    ? healthIndicators[selectedComponentId]
    : undefined;

  const selectedComparison = selectedComponentId
    ? comparisons.find((c) => c.componentId === selectedComponentId)
    : undefined;

  return {
    activeConnection,
    setActiveConnection,
    selectedPreset,
    timeRange,
    handleSelectPreset,
    mappings,
    setMappings,
    discoveredServices,
    confirmMapping,
    unlinkMapping,
    applyAutoSuggestions,
    healthIndicators,
    driftFindings,
    comparisons,
    unifiedFindings,
    activeTrace,
    activeLogs,
    isLoading,
    lastRefreshedAt,
    refreshTelemetry,
    autoRefreshIntervalSeconds,
    setAutoRefreshIntervalSeconds,
    selectedComponentId,
    setSelectedComponentId,
    selectedHealth,
    selectedComparison,
    activeOverlay,
    setActiveOverlay,
    activeDrawerTab,
    setActiveDrawerTab,
    isDrawerOpen,
    setIsDrawerOpen,
  };
}
