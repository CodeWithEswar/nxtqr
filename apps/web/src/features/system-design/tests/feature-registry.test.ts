import { describe, it, expect } from "vitest";
import {
  ARCHITECTURE_FEATURES,
  ARCHITECTURE_FEATURE_CATEGORIES,
  getFeatureById,
  getFeaturesByCategory,
} from "../feature-registry";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

describe("Architecture Intelligence Suite — Feature Registry & Engine Logic", () => {
  it("should contain all expected architecture engines", () => {
    expect(ARCHITECTURE_FEATURES.length).toBeGreaterThanOrEqual(29);

    const ids = ARCHITECTURE_FEATURES.map((f) => f.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Verify key engines from Phases 05.1 through 05.3.30
    expect(ids).toContain("validation");
    expect(ids).toContain("health");
    expect(ids).toContain("bottlenecks");
    expect(ids).toContain("failure-analysis");
    expect(ids).toContain("security-analysis");
    expect(ids).toContain("scalability");
    expect(ids).toContain("capacity-planning");
    expect(ids).toContain("cost");
    expect(ids).toContain("reports");
    expect(ids).toContain("reviews");
    expect(ids).toContain("comparison");
    expect(ids).toContain("simulation");
    expect(ids).toContain("observability");
    expect(ids).toContain("performance");
    expect(ids).toContain("deployment");
    expect(ids).toContain("data-lineage");
    expect(ids).toContain("api-contracts");
    expect(ids).toContain("messaging");
    expect(ids).toContain("cache-state");
    expect(ids).toContain("database");
    expect(ids).toContain("network");
    expect(ids).toContain("governance");
    expect(ids).toContain("evolution");
    expect(ids).toContain("operations");
    expect(ids).toContain("verification");
    expect(ids).toContain("orchestration");
    expect(ids).toContain("readiness");
    expect(ids).toContain("ai-assistant");
    expect(ids).toContain("recommendations");
  });

  it("should categorize engines accurately", () => {
    expect(ARCHITECTURE_FEATURE_CATEGORIES.length).toBe(6);

    const diagnostics = getFeaturesByCategory("diagnostics");
    expect(diagnostics.length).toBe(7);

    const infrastructure = getFeaturesByCategory("infrastructure");
    expect(infrastructure.length).toBe(7);

    const governance = getFeaturesByCategory("governance");
    expect(governance.length).toBe(6);

    const operations = getFeaturesByCategory("operations");
    expect(operations.length).toBe(6);

    const intelligence = getFeaturesByCategory("intelligence");
    expect(intelligence.length).toBe(3);
  });

  it("should look up individual features by ID", () => {
    const readiness = getFeatureById("readiness");
    expect(readiness).toBeDefined();
    expect(readiness?.name).toContain("Production Readiness");
    expect(readiness?.phase).toBe("Phase 05.3.30");

    const orchestration = getFeatureById("orchestration");
    expect(orchestration).toBeDefined();
    expect(orchestration?.phase).toBe("Phase 05.3.29");

    const network = getFeatureById("network");
    expect(network).toBeDefined();
    expect(network?.phase).toBe("Phase 05.3.24");

    const database = getFeatureById("database");
    expect(database).toBeDefined();
    expect(database?.phase).toBe("Phase 05.3.23");
  });

  it("should update store state when activating and toggling engines", () => {
    const store = useGraphEditorStore.getState();

    // Initially null
    store.setActiveEngineId(null);
    expect(useGraphEditorStore.getState().activeEngineId).toBeNull();

    // Activate secondary engine (e.g. database)
    store.setActiveEngineId("database");
    expect(useGraphEditorStore.getState().activeEngineId).toBe("database");

    // Toggle same engine should deactivate it
    store.toggleEngineId("database");
    expect(useGraphEditorStore.getState().activeEngineId).toBeNull();

    // Activating primary engine (e.g. bottlenecks) synchronizes boolean
    store.setActiveEngineId("bottlenecks");
    expect(useGraphEditorStore.getState().isBottlenecksOpen).toBe(true);
    expect(useGraphEditorStore.getState().activeEngineId).toBe("bottlenecks");

    // Toggle bottlenecks deactivates it
    store.toggleEngineId("bottlenecks");
    expect(useGraphEditorStore.getState().isBottlenecksOpen).toBe(false);
    expect(useGraphEditorStore.getState().activeEngineId).toBeNull();
  });

  it("should resize engine panel within bounds", () => {
    const store = useGraphEditorStore.getState();

    store.setEnginePanelWidth(500);
    expect(useGraphEditorStore.getState().enginePanelWidth).toBe(500);

    // Below min clamped to 320
    store.setEnginePanelWidth(100);
    expect(useGraphEditorStore.getState().enginePanelWidth).toBe(320);

    // Above max clamped to 840
    store.setEnginePanelWidth(1000);
    expect(useGraphEditorStore.getState().enginePanelWidth).toBe(840);
  });
});

