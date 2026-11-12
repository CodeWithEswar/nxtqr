import { beforeEach, describe, expect, it } from "vitest";
import { createPracticePresetScenario } from "@nxtqr/architecture-execution";
import { useExecutionStore } from "../store/execution-store";

describe("Phase 05.4.23 ExecutionStore Practice & Interview Integration", () => {
  beforeEach(() => {
    useExecutionStore.getState().toggleExecutionMode(false);
    useExecutionStore.setState({
      practiceAttempts: [],
      activePracticeScenario: null,
    });
  });

  it("toggles practice workspace, executes a practice scenario, and accumulates attempts", () => {
    const store = useExecutionStore.getState();
    store.togglePracticeWorkspace(true);
    expect(useExecutionStore.getState().isPracticeWorkspaceOpen).toBe(true);

    const scenario1 = createPracticePresetScenario("prac_beginner_url_shortener");
    const ok1 = store.runPracticeScenario(scenario1);
    expect(ok1).toBe(true);

    const afterFirst = useExecutionStore.getState();
    expect(afterFirst.activeRun?.architectureId).toBe("arch_practice_sim");
    expect(afterFirst.trace?.frames.length).toBeGreaterThan(0);
    expect(afterFirst.practiceAttempts).toHaveLength(1);

    const scenario2 = {
      ...scenario1,
      seed: scenario1.seed + 1,
      id: `${scenario1.id}_retry`,
    };
    const ok2 = useExecutionStore.getState().runPracticeScenario(scenario2);
    expect(ok2).toBe(true);

    const afterSecond = useExecutionStore.getState();
    expect(afterSecond.practiceAttempts).toHaveLength(2);
    const lastPracticeState =
      afterSecond.trace?.frames[afterSecond.trace.frames.length - 1]?.runtimeState
        ?.practiceState;
    expect(lastPracticeState?.learningProgress.attempts).toBe(2);
  });

  it("loads any practice preset via setScenarioPreset and populates practiceState", () => {
    useExecutionStore.getState().setScenarioPreset("prac_mock_45_url_shortener");

    const state = useExecutionStore.getState();
    expect(state.isPracticeWorkspaceOpen).toBe(true);
    expect(state.activePracticeScenario?.mode).toBe("mock-interview");

    const lastPracticeState =
      state.trace?.frames[state.trace.frames.length - 1]?.runtimeState
        ?.practiceState;
    expect(lastPracticeState).toBeDefined();
    expect(lastPracticeState?.invariants.passed).toBe(true);
    expect(lastPracticeState?.evaluation.evaluatedWeightedScore).toBeGreaterThanOrEqual(0);
    expect(lastPracticeState?.report.markdown).toContain("# System Design Session Report");
  });
});

