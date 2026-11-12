import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createGlobalNetworkPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Global DNS, CDN & Traffic Distribution Workspace (Phase 05.4.11)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleGlobalNetworkWorkspace(false);
    store.setGlobalNetworkScenario(null);
  });

  it("toggles Global Network workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isGlobalNetworkWorkspaceOpen).toBe(false);

    store.toggleGlobalNetworkWorkspace(true);
    expect(useExecutionStore.getState().isGlobalNetworkWorkspaceOpen).toBe(true);

    store.toggleGlobalNetworkWorkspace(false);
    expect(useExecutionStore.getState().isGlobalNetworkWorkspaceOpen).toBe(false);
  });

  it("loads Global Network preset via setScenarioPreset and auto-runs simulation", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("cdn_cache_hit");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("cdn_cache_hit");
    expect(state.activeGlobalNetworkScenario).toBeDefined();
    expect(state.isGlobalNetworkWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.trace?.outcome).toBe("success");
    expect(state.playbackState.status).toBe("playing");

    const lastFrame = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastFrame?.runtimeState?.globalNetworkState?.metrics.cdnCacheHits
    ).toBe(2);
    expect(
      lastFrame?.runtimeState?.globalNetworkState?.metrics.originRequests
    ).toBe(1);
  });

  it("reconstructs exact intermediate DNS and CDN cache state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createGlobalNetworkPresetScenario("cache_invalidation");
    store.runGlobalNetworkSimulation(scenario);

    const trace = useExecutionStore.getState().trace!;
    expect(trace.frames.length).toBeGreaterThan(4);

    store.seekToStep(trace.frames.length - 1);
    const endRequests =
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.globalNetworkState?.recentRequests.length ?? 0;
    expect(endRequests).toBe(3);

    store.seekToStep(1);
    const earlyRequests =
      useExecutionStore.getState().playbackState.currentFrame?.runtimeState
        ?.globalNetworkState?.recentRequests.length ?? 0;
    expect(earlyRequests).toBeLessThanOrEqual(endRequests);

    store.seekToStep(trace.frames.length - 1);
    store.previousStep();
    expect(useExecutionStore.getState().playbackState.currentStepIndex).toBe(
      trace.frames.length - 2
    );
  });

  it("resets Global Network workspace state when exiting execution mode", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("cold_dns_lookup");
    expect(useExecutionStore.getState().isGlobalNetworkWorkspaceOpen).toBe(
      true
    );

    store.toggleExecutionMode(false);
    expect(useExecutionStore.getState().isGlobalNetworkWorkspaceOpen).toBe(
      false
    );
    expect(useExecutionStore.getState().isExecutionModeActive).toBe(false);
  });
});

