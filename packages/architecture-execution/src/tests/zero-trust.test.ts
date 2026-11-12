import { describe, expect, it } from "vitest";
import {
  ZERO_TRUST_PRESET_METADATA,
  ZeroTrustExecutionEngine,
  compareZeroTrustScenarios,
  createZeroTrustPresetScenario,
  evaluatePolicyExpression,
} from "../index";

describe("ZeroTrustExecutionEngine — Phase 05.4.18 (Distributed Security, Zero Trust & Threat Modeling)", () => {
  it("executes all 35 presets deterministically with zero invariant violations", () => {
    expect(ZERO_TRUST_PRESET_METADATA).toHaveLength(35);

    for (const meta of ZERO_TRUST_PRESET_METADATA) {
      const s1 = createZeroTrustPresetScenario(meta.id);
      const s2 = createZeroTrustPresetScenario(meta.id);
      const t1 = ZeroTrustExecutionEngine.runScenario(s1);
      const t2 = ZeroTrustExecutionEngine.runScenario(s2);

      expect(t1.frames.length).toBeGreaterThanOrEqual(1);
      expect(t1.events.length).toBe(t2.events.length);

      const final1 =
        t1.frames[t1.frames.length - 1]!.runtimeState!.zeroTrustState!;
      const final2 =
        t2.frames[t2.frames.length - 1]!.runtimeState!.zeroTrustState!;

      expect(final1.invariants.allPassed, meta.id).toBe(true);
      expect(final1.metrics).toEqual(final2.metrics);
    }
  });

  it("enforces Zero Trust separation: internal network does not grant trust, valid identity still denied unauthorized action, and expired/revoked/wrong-aud credentials fail", () => {
    const tInternal = ZeroTrustExecutionEngine.runScenario(
      createZeroTrustPresetScenario("internal_network_not_trusted")
    );
    const sInternal =
      tInternal.frames[tInternal.frames.length - 1]!.runtimeState!
        .zeroTrustState!;
    expect(sInternal.accessDecisions[0]!.effect).toBe("deny");

    const tDeniedWrite = ZeroTrustExecutionEngine.runScenario(
      createZeroTrustPresetScenario("valid_identity_denied_permission")
    );
    const sDeniedWrite =
      tDeniedWrite.frames[tDeniedWrite.frames.length - 1]!.runtimeState!
        .zeroTrustState!;
    expect(sDeniedWrite.accessDecisions[0]!.authState).toBe("AUTHENTICATED");
    expect(sDeniedWrite.accessDecisions[0]!.effect).toBe("deny");

    const tExp = ZeroTrustExecutionEngine.runScenario(
      createZeroTrustPresetScenario("expired_access_token")
    );
    expect(
      tExp.frames[tExp.frames.length - 1]!.runtimeState!.zeroTrustState!
        .accessDecisions[0]!.authState
    ).toBe("EXPIRED");

    const tRev = ZeroTrustExecutionEngine.runScenario(
      createZeroTrustPresetScenario("revoked_access_token")
    );
    expect(
      tRev.frames[tRev.frames.length - 1]!.runtimeState!.zeroTrustState!
        .accessDecisions[0]!.authState
    ).toBe("REVOKED");

    const tTenant = ZeroTrustExecutionEngine.runScenario(
      createZeroTrustPresetScenario("cross_tenant_access_attempt")
    );
    expect(
      tTenant.frames[tTenant.frames.length - 1]!.runtimeState!.zeroTrustState!
        .accessDecisions[0]!.effect
    ).toBe("deny");
  });

  it("evaluates PolicyExpression AST cleanly including indeterminate on missing inputs", () => {
    const scenario = createZeroTrustPresetScenario("data_classification_boundary");
    const evalRes = evaluatePolicyExpression(
      {
        kind: "equals",
        left: { namespace: "environment", key: "deviceTrust" },
        right: "managed",
      },
      {
        identity: scenario.identities[0]!,
        resource: scenario.resources[1]!,
        action: "read",
        environment: {},
      }
    );
    expect(evalRes).toBe("indeterminate");

    scenario.authorization.rules.push({
      id: "pol_missing_env",
      name: "Requires deviceTrust environment input",
      effect: "allow",
      priority: 1,
      principals: ["checkout-svc"],
      roles: [],
      resources: ["orders-db"],
      actions: ["read"],
      requiredScopes: ["orders:read"],
      requireInputKeys: ["deviceTrust"],
    });
    const tr = ZeroTrustExecutionEngine.runScenario(scenario);
    const last = tr.frames[tr.frames.length - 1]!.runtimeState!.zeroTrustState!;
    expect(last.accessDecisions[0]!.effect).toBe("indeterminate");
  });

  it("verifies attack-path containment, credential revocation mitigation, and Investigation vs Explanation ground-truth separation", () => {
    const tContained = ZeroTrustExecutionEngine.runScenario(
      createZeroTrustPresetScenario("attack_path_containment")
    );
    const sContained =
      tContained.frames[tContained.frames.length - 1]!.runtimeState!
        .zeroTrustState!;
    expect(sContained.attackPaths[0]!.steps[0]!.outcome).toBe(
      "completed_in_simulation"
    );
    expect(sContained.attackPaths[0]!.steps[1]!.outcome).toBe("blocked");
    expect(sContained.attackPaths[0]!.status).toBe("partial_exposure");

    const tMitigated = ZeroTrustExecutionEngine.runScenario(
      createZeroTrustPresetScenario("credential_revocation")
    );
    const sMitigated =
      tMitigated.frames[tMitigated.frames.length - 1]!.runtimeState!
        .zeroTrustState!;
    expect(
      sMitigated.accessDecisions[sMitigated.accessDecisions.length - 1]!.effect
    ).toBe("deny");
    expect(sMitigated.blastRadius.directAccessResourceIds).toHaveLength(0);

    // Investigation vs Explanation mode
    const invSc = createZeroTrustPresetScenario("before_after_posture");
    invSc.viewMode = "investigation";
    invSc.mitigations = [];
    const invState =
      ZeroTrustExecutionEngine.runScenario(invSc).frames.slice(-1)[0]!
        .runtimeState!.zeroTrustState!;
    expect(invState.incidents.length).toBeGreaterThanOrEqual(1);
    expect(
      invState.incidents[0]!.hypotheses.some((h) => h.status === "verified")
    ).toBe(false);

    const expSc = createZeroTrustPresetScenario("before_after_posture");
    expSc.viewMode = "explanation";
    expSc.mitigations = [];
    const expState =
      ZeroTrustExecutionEngine.runScenario(expSc).frames.slice(-1)[0]!
        .runtimeState!.zeroTrustState!;
    expect(
      expState.incidents[0]!.hypotheses.some((h) => h.status === "verified")
    ).toBe(true);
  });

  it("compares security postures and holds invariants across randomized seeds", () => {
    const comp = compareZeroTrustScenarios(
      createZeroTrustPresetScenario("overprivileged_service_role"),
      createZeroTrustPresetScenario("zt_baseline")
    );
    expect(comp.deltas.residualRiskScoreDelta).toBeLessThan(0);

    for (let seed = 1; seed <= 8; seed++) {
      const sc = createZeroTrustPresetScenario("before_after_posture");
      sc.seed = seed * 19;
      const tr = ZeroTrustExecutionEngine.runScenario(sc);
      const finalState =
        tr.frames[tr.frames.length - 1]!.runtimeState!.zeroTrustState!;
      expect(finalState.invariants.allPassed).toBe(true);
    }
  });
});

