import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  scalabilityRecommendationsEngine,
} from "@nxtqr/architecture-intelligence";
import { PRESET_WORKLOAD_SCENARIOS } from "../hooks/use-scalability-recommendations";
import type { BaseNode, BaseEdge } from "@/features/graph-engine/schemas/graph.schema";

describe("Scalability Recommendations & What-If Planner - Store & Engine Integration", () => {
  beforeEach(() => {
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      isScalabilityOpen: false,
      scalabilityPanelWidth: 380,
      activeScenarioId: "normal_traffic",
      activeWhatIfPlan: null,
    });
  });

  it("toggles and updates scalability panel state and dimensions in graph editor store", () => {
    expect(useGraphEditorStore.getState().isScalabilityOpen).toBe(false);

    useGraphEditorStore.getState().toggleScalability();
    expect(useGraphEditorStore.getState().isScalabilityOpen).toBe(true);

    useGraphEditorStore.getState().setScalabilityOpen(false);
    expect(useGraphEditorStore.getState().isScalabilityOpen).toBe(false);

    useGraphEditorStore.getState().setScalabilityPanelWidth(420);
    expect(useGraphEditorStore.getState().scalabilityPanelWidth).toBe(420);
  });

  it("updates active scenario and evaluates recommendations against store nodes", () => {
    const client: BaseNode = {
      id: "client",
      type: "infrastructure",
      position: { x: 0, y: 0 },
      data: { componentType: "web-browser", label: "Web Client" },
    };

    const backendSvc: BaseNode = {
      id: "backend_svc",
      type: "infrastructure",
      position: { x: 200, y: 0 },
      data: {
        componentType: "container-service",
        label: "Order Service",
        replicas: 1,
        isStateful: false,
        declaredCapacityRps: 500,
      },
    };

    const edge: BaseEdge = {
      id: "e1",
      source: "client",
      target: "backend_svc",
      data: { protocol: "https" },
    };

    useGraphEditorStore.setState({
      nodes: [client, backendSvc],
      edges: [edge],
    });

    useGraphEditorStore.getState().setActiveScenarioId("peak_traffic");
    expect(useGraphEditorStore.getState().activeScenarioId).toBe("peak_traffic");

    const scenario = PRESET_WORKLOAD_SCENARIOS.find((s) => s.id === "peak_traffic")!;
    const report = scalabilityRecommendationsEngine.evaluateGraph(
      useGraphEditorStore.getState().nodes,
      useGraphEditorStore.getState().edges,
      scenario
    );

    expect(report.recommendations.length).toBeGreaterThan(0);
    const scalingRec = report.recommendations.find(
      (r) => r.strategy === "horizontal-scaling" && r.affectedNodeIds.includes("backend_svc")
    );
    expect(scalingRec).toBeDefined();
    expect(scalingRec?.feasibility).toBe("applicable");
  });

  it("generates a What-If plan, applies operations atomically to the store, and supports undo/redo", () => {
    const client: BaseNode = {
      id: "client_1",
      type: "infrastructure",
      position: { x: 0, y: 0 },
      data: { componentType: "web-browser", label: "Client" },
    };

    const computeNode: BaseNode = {
      id: "app_server",
      type: "infrastructure",
      position: { x: 100, y: 100 },
      data: {
        componentType: "container-service",
        label: "App Server",
        replicas: 1,
        isStateful: false,
        declaredCapacityRps: 400,
      },
    };

    const edge: BaseEdge = {
      id: "e_c_app",
      source: "client_1",
      target: "app_server",
      data: { protocol: "https" },
    };

    useGraphEditorStore.setState({
      nodes: [client, computeNode],
      edges: [edge],
    });

    const scenario = PRESET_WORKLOAD_SCENARIOS.find((s) => s.id === "normal_traffic")!;
    const report = scalabilityRecommendationsEngine.evaluateGraph([client, computeNode], [edge], scenario);

    const rec = report.recommendations.find((r) => r.affectedNodeIds.includes("app_server"))!;
    expect(rec).toBeDefined();

    const plan = scalabilityRecommendationsEngine.createWhatIfPlan([client, computeNode], [edge], rec, scenario);
    expect(plan.operations.length).toBeGreaterThan(0);
    expect(plan.isValidated).toBe(true);

    useGraphEditorStore.getState().setActiveWhatIfPlan(plan);
    expect(useGraphEditorStore.getState().activeWhatIfPlan).toEqual(plan);

    // Apply What-If Plan to graph store
    useGraphEditorStore.getState().applyWhatIfPlan(plan);

    // Active What-If plan should be cleared
    expect(useGraphEditorStore.getState().activeWhatIfPlan).toBeNull();

    // Store nodes should have updated replicas
    const updatedNode = useGraphEditorStore.getState().nodes.find((n) => n.id === "app_server");
    expect(updatedNode?.data?.replicas).toBeGreaterThan(1);

    // Undo should revert the graph back to 1 replica
    useGraphEditorStore.getState().undo();
    const revertedNode = useGraphEditorStore.getState().nodes.find((n) => n.id === "app_server");
    expect(revertedNode?.data?.replicas).toBe(1);

    // Redo should re-apply the What-If plan
    useGraphEditorStore.getState().redo();
    const redoneNode = useGraphEditorStore.getState().nodes.find((n) => n.id === "app_server");
    expect(redoneNode?.data?.replicas).toBeGreaterThan(1);
  });
});
