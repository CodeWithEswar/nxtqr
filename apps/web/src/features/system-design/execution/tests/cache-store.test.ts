import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createCachePresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Cache Execution & Workspace Integration (Phase 05.4.7)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleCacheWorkspace(false);
    store.setCacheScenario(null);
  });

  it("toggles cache execution workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isCacheWorkspaceOpen).toBe(false);

    store.toggleCacheWorkspace(true);
    expect(useExecutionStore.getState().isCacheWorkspaceOpen).toBe(true);

    store.toggleCacheWorkspace(false);
    expect(useExecutionStore.getState().isCacheWorkspaceOpen).toBe(false);
  });

  it("loads cache scenario preset and runs execution automatically", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("basic_cache_hit");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("basic_cache_hit");
    expect(state.activeCacheScenario).toBeDefined();
    expect(state.isCacheWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.trace?.outcome).toBe("success");
    expect(state.playbackState.status).toBe("playing");
  });

  it("runs cache simulation for LRU eviction scenario", () => {
    const store = useExecutionStore.getState();
    const scenario = createCachePresetScenario("lru_eviction");

    const success = store.runCacheSimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.activeCacheScenario?.id).toBe("lru_eviction");
    expect(state.trace?.events.some((e) => e.type === "cache.entry.evicted")).toBe(true);
  });

  it("runs cache simulation for single-flight request coalescing", () => {
    const store = useExecutionStore.getState();
    const scenario = createCachePresetScenario("request_coalescing");

    const success = store.runCacheSimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace).toBeDefined();
    expect(state.trace?.events.some((e) => e.type === "cache.load.coalesced")).toBe(true);
  });
});
