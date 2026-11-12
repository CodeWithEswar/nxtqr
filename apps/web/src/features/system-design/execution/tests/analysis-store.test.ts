import { beforeEach, describe, expect, it } from "vitest";
import { createAnalysisPresetExperiment } from "@nxtqr/architecture-execution";
import { useExecutionStore } from "../store/execution-store";

describe("Phase 05.4.22 ExecutionStore Architecture Analysis Integration", () => {
  beforeEach(() => {
    useExecutionStore.getState().toggleExecutionMode(false);
  });

  it("toggles analysis workspace and executes an experiment directly", () => {
    const store = useExecutionStore.getState();
    store.toggleAnalysisWorkspace(true);
    expect(useExecutionStore.getState().isAnalysisWorkspaceOpen).toBe(true);

    const exp = createAnalysisPresetExperiment("ana_monolith_vs_replicated");
    const ok = store.runAnalysisExperiment(exp);
    expect(ok).toBe(true);

    const next = useExecutionStore.getState();
    expect(next.activeRun?.architectureId).toBe("arch_analysis_sim");
    expect(next.trace?.frames.length).toBeGreaterThan(0);
    expect(next.activeAnalysisExperiment?.presetId).toBe(
      "ana_monolith_vs_replicated"
    );
  });

  it("loads any analysis preset via setScenarioPreset and populates analysisState", () => {
    useExecutionStore.getState().setScenarioPreset("ana_architecture_decision_record");

    const state = useExecutionStore.getState();
    expect(state.isAnalysisWorkspaceOpen).toBe(true);
    expect(state.activeAnalysisExperiment?.presetId).toBe(
      "ana_architecture_decision_record"
    );

    const lastFrame =
      state.trace?.frames[state.trace.frames.length - 1]?.runtimeState
        ?.analysisState;
    expect(lastFrame).toBeDefined();
    expect(lastFrame?.invariants.allPassed).toBe(true);
    expect(lastFrame?.adr.markdownText).toContain("## Decision");
  });
});

