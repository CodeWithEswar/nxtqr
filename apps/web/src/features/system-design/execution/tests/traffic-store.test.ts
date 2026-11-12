import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { TrafficPresetFactory } from "@nxtqr/architecture-execution";

const mockNodes: BaseNode[] = [
  {
    id: "client_1",
    type: "client",
    label: "Web Browser",
    position: { x: 50, y: 100 },
    data: { componentType: "client" },
  },
  {
    id: "gateway_1",
    type: "api_gateway",
    label: "Edge Gateway",
    position: { x: 250, y: 100 },
    data: { componentType: "api_gateway" },
  },
  {
    id: "product_service",
    type: "service",
    label: "Product Service",
    position: { x: 450, y: 100 },
    data: { componentType: "service" },
  },
  {
    id: "postgres_db",
    type: "database",
    label: "PostgreSQL Database",
    position: { x: 650, y: 180 },
    data: { componentType: "database" },
  },
];

const mockEdges: BaseEdge[] = [
  {
    id: "edge_client_gw",
    source: "client_1",
    target: "gateway_1",
    data: {},
  },
  {
    id: "edge_gw_srv",
    source: "gateway_1",
    target: "product_service",
    data: {},
  },
  {
    id: "edge_srv_db",
    source: "product_service",
    target: "postgres_db",
    data: {},
  },
];

describe("Execution Store - Traffic Simulation & Performance Workspace Integration", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleTrafficWorkspace(false);
    store.toggleTrafficScenarioDialog(false);
    store.toggleTrafficComparison(false);
    store.setTrafficScenario(null);
  });

  it("toggles traffic workspace and dialog states correctly", () => {
    const store = useExecutionStore.getState();

    expect(store.isTrafficWorkspaceOpen).toBe(false);
    store.toggleTrafficWorkspace(true);
    expect(useExecutionStore.getState().isTrafficWorkspaceOpen).toBe(true);
    store.toggleTrafficWorkspace(false);
    expect(useExecutionStore.getState().isTrafficWorkspaceOpen).toBe(false);

    expect(store.isTrafficScenarioDialogOpen).toBe(false);
    store.toggleTrafficScenarioDialog(true);
    expect(useExecutionStore.getState().isTrafficScenarioDialogOpen).toBe(true);

    expect(store.isTrafficComparisonOpen).toBe(false);
    store.toggleTrafficComparison(true);
    expect(useExecutionStore.getState().isTrafficComparisonOpen).toBe(true);
  });

  it("loads a standardized traffic preset into the store", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("sudden_traffic_spike", mockNodes, mockEdges);

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("sudden_traffic_spike");
    expect(state.activeTrafficScenario).toBeDefined();
    expect(state.activeTrafficScenario?.name).toContain("Spike");
    expect(state.activeTrafficScenario?.workload.type).toBe("burst");
  });

  it("runs traffic simulation and populates trace, performance samples, and baseline comparison", () => {
    const store = useExecutionStore.getState();
    const scenario = TrafficPresetFactory.createPreset("low_steady_traffic", mockNodes, mockEdges);

    const success = store.runTrafficSimulation(mockNodes, mockEdges, scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.isTrafficWorkspaceOpen).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.trace?.events.length).toBeGreaterThan(0);

    // Verify metrics and samples
    expect(state.trace?.performanceSamples).toBeDefined();
    expect(state.trace?.performanceSamples!.length).toBeGreaterThan(0);
    expect(state.trace?.performanceSummary).toBeDefined();
    expect(state.trace?.performanceSummary!.totalRequests).toBeGreaterThan(0);

    // Verify baseline comparison report
    expect(state.trafficComparison).toBeDefined();
    expect(typeof state.trafficComparison?.throughputDeltaRps).toBe("number");
    expect(typeof state.trafficComparison?.p95LatencyDeltaMs).toBe("number");
    expect(state.trafficComparison?.summary).toBeDefined();
  });
});
