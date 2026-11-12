import { describe, it, expect, beforeEach } from "vitest";
import { useExecutionStore } from "../store/execution-store";
import { createZeroTrustPresetScenario } from "@nxtqr/architecture-execution";

describe("Execution Store - Zero Trust Security Workspace (Phase 05.4.18)", () => {
  beforeEach(() => {
    const store = useExecutionStore.getState();
    store.stop();
    store.toggleZeroTrustWorkspace(false);
    store.setZeroTrustScenario(null);
  });

  it("toggles Zero Trust workspace drawer", () => {
    const store = useExecutionStore.getState();
    expect(store.isZeroTrustWorkspaceOpen).toBe(false);

    store.toggleZeroTrustWorkspace(true);
    expect(useExecutionStore.getState().isZeroTrustWorkspaceOpen).toBe(true);

    store.toggleZeroTrustWorkspace(false);
    expect(useExecutionStore.getState().isZeroTrustWorkspaceOpen).toBe(false);
  });

  it("loads zt_baseline and credential_revocation presets via setScenarioPreset", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("zt_baseline");

    let state = useExecutionStore.getState();
    expect(state.activePresetId).toBe("zt_baseline");
    expect(state.activeZeroTrustScenario?.presetId).toBe("zt_baseline");
    expect(state.isZeroTrustWorkspaceOpen).toBe(true);
    expect(state.isExecutionModeActive).toBe(true);
    expect(state.playbackState.status).toBe("playing");

    const lastAllow = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastAllow?.runtimeState?.zeroTrustState?.metrics.allowedRequests
    ).toBeGreaterThanOrEqual(1);

    store.setScenarioPreset("credential_revocation");
    state = useExecutionStore.getState();
    const lastRev = state.trace!.frames[state.trace!.frames.length - 1];
    expect(
      lastRev?.runtimeState?.zeroTrustState?.metrics.deniedRequests
    ).toBeGreaterThanOrEqual(1);
    expect(
      lastRev?.runtimeState?.zeroTrustState?.blastRadius.directAccessResourceIds
    ).toHaveLength(0);
  });

  it("reconstructs exact intermediate zero trust state across seek and previousStep", () => {
    const store = useExecutionStore.getState();
    const scenario = createZeroTrustPresetScenario("credential_revocation");
    store.runZeroTrustSimulation(scenario);

    const state = useExecutionStore.getState();
    expect(state.trace!.frames.length).toBeGreaterThan(2);

    const midIndex = Math.floor(state.trace!.frames.length / 2);
    store.seekToStep(midIndex);
    const frameAtMid = useExecutionStore.getState().playbackState.currentFrame;
    expect(
      frameAtMid?.runtimeState?.zeroTrustState?.metrics.allowedRequests
    ).toBe(
      state.trace!.frames[midIndex]?.runtimeState?.zeroTrustState?.metrics
        .allowedRequests
    );

    store.previousStep();
    const frameAtPrev = useExecutionStore.getState().playbackState.currentFrame;
    expect(frameAtPrev?.runtimeState?.zeroTrustState?.virtualTimeMs).toBe(
      state.trace!.frames[midIndex - 1]?.runtimeState?.zeroTrustState
        ?.virtualTimeMs
    );
  });

  it("closes Zero Trust workspace on toggleExecutionMode(false)", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("expired_access_token");
    expect(useExecutionStore.getState().isZeroTrustWorkspaceOpen).toBe(true);

    store.toggleExecutionMode(false);
    const after = useExecutionStore.getState();
    expect(after.isExecutionModeActive).toBe(false);
    expect(after.isZeroTrustWorkspaceOpen).toBe(false);
  });
});

