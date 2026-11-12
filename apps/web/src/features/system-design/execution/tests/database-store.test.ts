import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createDatabasePresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Database Execution & Workspace Integration", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleDatabaseWorkspace(false);
    store.setDatabaseScenario(null);
  });

  it("toggles database execution workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isDatabaseWorkspaceOpen).toBe(false);

    store.toggleDatabaseWorkspace(true);
    expect(useExecutionStore.getState().isDatabaseWorkspaceOpen).toBe(true);

    store.toggleDatabaseWorkspace(false);
    expect(useExecutionStore.getState().isDatabaseWorkspaceOpen).toBe(false);
  });

  it("loads database scenario preset and auto-runs execution", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("primary_key_lookup");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("primary_key_lookup");
    expect(state.activeDatabaseScenario).toBeDefined();
    expect(state.isDatabaseWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.trace?.outcome).toBe("success");
    expect(state.playbackState.status).toBe("playing");
  });

  it("runs database simulation for deadlock scenario", () => {
    const store = useExecutionStore.getState();
    const scenario = createDatabasePresetScenario("deadlock");

    const success = store.runDatabaseSimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.activeDatabaseScenario?.id).toBe("db_scenario_deadlock");
    expect(state.trace?.events.some((e) => e.type === "deadlock.detected")).toBe(true);
  });

  it("executes custom SQL query through executeCustomDatabaseQuery", () => {
    const store = useExecutionStore.getState();
    const success = store.executeCustomDatabaseQuery("SELECT * FROM products WHERE id = 42;");
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace).toBeDefined();
    expect(state.trace?.outcome).toBe("success");
    expect(state.activeDatabaseScenario?.primaryQuery).toBe("SELECT * FROM products WHERE id = 42;");
  });
});

