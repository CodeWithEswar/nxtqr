import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createSecurityPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Security Request Flow & Workspace Integration (Phase 05.4.8)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleSecurityWorkspace(false);
    store.setSecurityScenario(null);
  });

  it("toggles security execution workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isSecurityWorkspaceOpen).toBe(false);

    store.toggleSecurityWorkspace(true);
    expect(useExecutionStore.getState().isSecurityWorkspaceOpen).toBe(true);

    store.toggleSecurityWorkspace(false);
    expect(useExecutionStore.getState().isSecurityWorkspaceOpen).toBe(false);
  });

  it("loads valid JWT security scenario preset and runs execution automatically", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("protected_valid_jwt");

    const state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("protected_valid_jwt");
    expect(state.activeSecurityScenario).toBeDefined();
    expect(state.isSecurityWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.trace).toBeDefined();
    expect(state.trace?.outcome).toBe("success");
    expect(state.playbackState.status).toBe("playing");
  });

  it("runs security simulation for RBAC permission denial", () => {
    const store = useExecutionStore.getState();
    const scenario = createSecurityPresetScenario("rbac_denial");

    const success = store.runSecuritySimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.activeSecurityScenario?.id).toBe("rbac_denial");
    expect(state.trace?.outcome).toBe("failure");
    expect(state.trace?.events.some((e) => e.type === "authorization.denied")).toBe(true);
  });

  it("runs security simulation for WAF SQL injection detection", () => {
    const store = useExecutionStore.getState();
    const scenario = createSecurityPresetScenario("waf_sql_injection_block");

    const success = store.runSecuritySimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace?.events.some((e) => e.type === "waf.blocked")).toBe(true);
    expect(state.trace?.events.some((e) => e.type === "security.response.generated" && (e as any).reachedBackend === true)).toBe(false);
  });

  it("runs security simulation for token bucket rate limit rejection", () => {
    const store = useExecutionStore.getState();
    const scenario = createSecurityPresetScenario("rate_limit_rejection");

    const success = store.runSecuritySimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace?.events.some((e) => e.type === "security.ratelimit.rejected")).toBe(true);
    expect(state.trace?.events.some((e) => e.type === "security.response.generated")).toBe(true);
  });

  it("runs security simulation for mutual TLS handshake", () => {
    const store = useExecutionStore.getState();
    const scenario = createSecurityPresetScenario("mtls_handshake_success");

    const success = store.runSecuritySimulation(scenario);
    expect(success).toBe(true);

    const state = useExecutionStore.getState();
    expect(state.trace?.events.some((e) => e.type === "mtls.handshake.completed")).toBe(true);
  });
});
