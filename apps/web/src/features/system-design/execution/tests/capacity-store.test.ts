import { beforeEach, describe, expect, it } from "vitest";
import { buildCapacityPresetScenario } from "@nxtqr/architecture-execution";
import { useExecutionStore } from "../store/execution-store";

describe("Phase 05.4.21 ExecutionStore Capacity Planning integration", () => {
  beforeEach(() => {
    useExecutionStore.getState().toggleExecutionMode(false);
  });

  it("toggles capacity workspace and runs direct capacity simulations", () => {
    const store = useExecutionStore.getState();
    store.toggleCapacityWorkspace(true);
    expect(useExecutionStore.getState().isCapacityWorkspaceOpen).toBe(true);

    const scenario = buildCapacityPresetScenario("cap_hpa_scale_out");
    const ok = store.runCapacitySimulation(scenario);
    expect(ok).toBe(true);

    const next = useExecutionStore.getState();
    expect(next.activeRun?.architectureId).toBe("arch_capacity_sim");
    expect(next.trace?.frames.length).toBeGreaterThan(0);
    expect(next.activeCapacityScenario?.presetId).toBe("cap_hpa_scale_out");
  });

  it("loads any capacity preset via setScenarioPreset and populates capacityState frames", () => {
    useExecutionStore.getState().setScenarioPreset("pareto_frontier");

    const state = useExecutionStore.getState();
    expect(state.isCapacityWorkspaceOpen).toBe(true);
    expect(state.activeCapacityScenario?.presetId).toBe("pareto_frontier");

    const lastFrame =
      state.trace?.frames[state.trace.frames.length - 1]?.runtimeState
        ?.capacityState;
    expect(lastFrame).toBeDefined();
    expect(lastFrame?.invariants.allPassed).toBe(true);
    expect(lastFrame?.paretoFrontier.length).toBeGreaterThan(0);
  });
});

