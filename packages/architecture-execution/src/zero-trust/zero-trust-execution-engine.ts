import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import { RuntimeStateHelper } from "../domain/runtime-state";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import { DeterministicRandom } from "../resilience/deterministic-random";
import { evaluateZeroTrustAccessRequest } from "./authorization/zero-trust-policy-engine";
import {
  buildRiskMatrixFindingsAndIncident,
  computeSecurityBlastRadius,
  evaluateThreatScenariosAndPaths,
} from "./threats/threat-attack-engine";
import { ZeroTrustInvariantMonitor } from "./invariants/zero-trust-invariants";
import {
  type CertificateMetadata,
  type ModeledZeroTrustRuntimeState,
  type SecurityControlConfig,
  type SecurityIdentityConfig,
  type SecurityResourceConfig,
  type SimulatedToken,
  type TrustBoundaryRuntime,
  type ZeroTrustScenario,
  ZeroTrustScenarioSchema,
  type ZtAccessDecision,
} from "./zero-trust-schemas";
import { computeCertificateLifecycle } from "./authentication/identity-auth-engine";

export class ZeroTrustExecutionEngine {
  public static runScenario(rawScenario: ZeroTrustScenario): ExecutionTrace {
    const scenario = ZeroTrustScenarioSchema.parse(rawScenario);
    new DeterministicRandom(scenario.seed);

    const identities: Record<string, SecurityIdentityConfig> = {};
    for (const id of scenario.identities.slice(0, scenario.limits.maxIdentities)) {
      identities[id.id] = {
        ...id,
        roles: [...id.roles],
        permissions: [...id.permissions],
        attributes: { ...id.attributes },
      };
    }

    const tokens: Record<string, SimulatedToken> = {};
    for (const t of scenario.tokens) {
      tokens[t.id] = {
        ...t,
        audience: [...t.audience],
        scopes: [...t.scopes],
      };
    }

    const certificates: Record<string, CertificateMetadata> = {};
    for (const c of scenario.certificates) {
      certificates[c.id] = { ...c };
    }

    const secrets: Record<string, (typeof scenario.secrets)[number]> = {};
    for (const s of scenario.secrets) {
      secrets[s.id] = {
        ...s,
        allowedConsumerIds: [...s.allowedConsumerIds],
      };
    }

    const resources: Record<string, SecurityResourceConfig> = {};
    for (const r of scenario.resources.slice(0, scenario.limits.maxResources)) {
      resources[r.id] = {
        ...r,
        acceptedActions: [...r.acceptedActions],
        requiredScopes: [...r.requiredScopes],
        trustedIssuers: [...r.trustedIssuers],
        expectedAudiences: [...r.expectedAudiences],
      };
    }

    const authorization = {
      ...scenario.authorization,
      roles: scenario.authorization.roles.map((r) => ({
        ...r,
        permissions: [...r.permissions],
      })),
      rules: scenario.authorization.rules.map((r) => ({ ...r })),
    };

    let defaultNetworkDeny = scenario.defaultNetworkDeny;
    const networkPolicies = scenario.networkPolicies.map((p) => ({ ...p }));
    const controls: SecurityControlConfig[] = scenario.controls.map((c) => ({
      ...c,
      protectedAssetIds: [...c.protectedAssetIds],
      mitigatesCategories: [...c.mitigatesCategories],
      blocksConditions: [...c.blocksConditions],
    }));

    const boundaryRuntime: Record<string, TrustBoundaryRuntime> = {};
    for (const b of scenario.trustBoundaries) {
      boundaryRuntime[b.id] = {
        id: b.id,
        name: b.name,
        type: b.type,
        fromZoneId: b.fromZoneId,
        toZoneId: b.toZoneId,
        protectedResourceIds: [...b.protectedResourceIds],
        requiredControlIds: [...b.requiredControlIds],
        crossingCount: 0,
        blockedCrossings: 0,
        violatedCount: 0,
        policyState: "enforced",
      };
    }

    const decisions: ZtAccessDecision[] = [];
    const mitigationsApplied: Array<{
      id: string;
      atMs: number;
      action: string;
      targetId: string;
      description: string;
    }> = [];

    const allEvents: ExecutionTrace["events"] = [];
    const frames: VisualizationFrame[] = [];
    const baseRuntime = RuntimeStateHelper.createInitialState();
    let seq = 0;

    // Collect distinct checkpoint timestamps
    const timestampSet = new Set<number>([0]);
    for (const req of scenario.requests) timestampSet.add(req.atMs);
    for (const th of scenario.threats) timestampSet.add(th.atMs);
    for (const mit of scenario.mitigations) timestampSet.add(mit.atMs);
    for (const id of Object.values(identities)) {
      if (id.compromisedAtMs !== undefined) timestampSet.add(id.compromisedAtMs);
    }
    const timestamps = Array.from(timestampSet)
      .filter((t) => t <= scenario.limits.maxVirtualDurationMs)
      .sort((a, b) => a - b);

    const buildRuntimeState = (nowMs: number): ModeledZeroTrustRuntimeState => {
      const { attackPaths, controlResults, blockedStepIds } =
        evaluateThreatScenariosAndPaths({
          scenario: {
            ...scenario,
            defaultNetworkDeny,
            authorization,
            networkPolicies,
            secrets: Object.values(secrets),
            resources: Object.values(resources),
          },
          identities,
          tokens,
          controls,
          nowMs,
        });

      const blastRadius = computeSecurityBlastRadius({
        scenario: {
          ...scenario,
          defaultNetworkDeny,
          authorization,
          networkPolicies,
          resources: Object.values(resources),
        },
        identities,
        tokens,
        certificates,
        controls,
        attackPaths,
        nowMs,
      });

      const { riskMatrix, findings, incidents, report } =
        buildRiskMatrixFindingsAndIncident({
          scenario,
          decisions,
          attackPaths,
          controls: controlResults,
          blastRadius,
          viewMode: scenario.viewMode,
          mitigationsApplied,
          nowMs,
        });

      const invariants = ZeroTrustInvariantMonitor.verify({
        scenario: {
          ...scenario,
          defaultNetworkDeny,
          authorization,
          networkPolicies,
          resources: Object.values(resources),
        },
        identities,
        tokens,
        certificates,
        decisions,
        attackPaths,
        blockedStepIds,
        blastRadius,
        incidents,
      });

      const allowedRequests = decisions.filter((d) => d.effect === "allow").length;
      const deniedRequests = decisions.filter((d) => d.effect === "deny").length;
      const indeterminateRequests = decisions.filter(
        (d) => d.effect === "indeterminate"
      ).length;
      const authenticationFailures = decisions.filter(
        (d) => d.authState !== "AUTHENTICATED"
      ).length;
      const authorizationFailures = decisions.filter((d) =>
        d.steps.some((s) => s.stage === "resource_authorization" && !s.passed)
      ).length;
      const networkDenials = decisions.filter((d) =>
        d.steps.some((s) => s.stage === "network_policy" && !s.passed)
      ).length;
      const transportFailures = decisions.filter((d) =>
        d.steps.some((s) => s.stage === "transport_security" && !s.passed)
      ).length;
      const trustBoundaryCrossings = Object.values(boundaryRuntime).reduce(
        (acc, b) => acc + b.crossingCount,
        0
      );
      const policyViolations = Object.values(boundaryRuntime).reduce(
        (acc, b) => acc + b.violatedCount,
        0
      );
      const blockedAttackSteps = attackPaths.reduce(
        (acc, ap) => acc + ap.steps.filter((s) => s.outcome === "blocked").length,
        0
      );
      const completedAttackSteps = attackPaths.reduce(
        (acc, ap) =>
          acc +
          ap.steps.filter((s) => s.outcome === "completed_in_simulation").length,
        0
      );
      const totalSteps = blockedAttackSteps + completedAttackSteps;
      const controlEffectivenessPct =
        totalSteps > 0
          ? Number(((blockedAttackSteps / totalSteps) * 100).toFixed(1))
          : controls.every((c) => c.state === "enabled")
            ? 100
            : 50;

      const openFindings = findings.filter((f) => !f.mitigated).length;
      const residualRiskScore = Math.min(
        100,
        openFindings * 18 +
          blastRadius.directAccessResourceIds.length * 14 +
          blastRadius.sensitiveAssetsExposed.length * 20
      );

      const certRuntime: ModeledZeroTrustRuntimeState["certificates"] = {};
      for (const [cid, c] of Object.entries(certificates)) {
        certRuntime[cid] = {
          ...c,
          lifecycleState: computeCertificateLifecycle(c, nowMs),
        };
      }

      const idRuntime: ModeledZeroTrustRuntimeState["identities"] = {};
      for (const [iid, id] of Object.entries(identities)) {
        const accessible: string[] = [];
        for (const r of Object.values(resources)) {
          const dec = evaluateZeroTrustAccessRequest({
            request: {
              id: `probe_${iid}_${r.id}`,
              atMs: nowMs,
              principalId: iid,
              sourceNodeId: iid,
              resourceId: r.id,
              action: r.acceptedActions[0] ?? "read",
              protocol: r.transportSecurity === "plaintext" ? "HTTP" : "HTTPS",
              port: r.transportSecurity === "plaintext" ? 80 : 443,
              expectedAllowed: true,
              environmentAttributes: {},
              description: "Reachability summary",
            },
            identity: id,
            resource: r,
            tokens,
            certificates,
            authorization,
            networkPolicies,
            defaultNetworkDeny,
            trustBoundaries: scenario.trustBoundaries,
          });
          if (dec.effect === "allow") accessible.push(r.id);
        }
        const lastDec = [...decisions]
          .reverse()
          .find((d) => d.principalId === iid);
        idRuntime[iid] = {
          ...id,
          authState: lastDec?.authState ?? (id.tokenId || id.certificateId ? "CREDENTIAL_PRESENTED" : "UNAUTHENTICATED"),
          certLifecycle: id.certificateId
            ? certRuntime[id.certificateId]?.lifecycleState
            : undefined,
          accessibleResourceIds: accessible,
        };
      }

      const caveats: string[] = [
        "Modeled simulation: network location never substitutes for authentication or authorization.",
        "Signature, certificate, and token properties are synthetic simulation metadata, not real cryptography.",
      ];
      if (authorization.internalNetworkImpliesTrust) {
        caveats.push(
          "Insecure configuration active: internalNetworkImpliesTrust bypasses Zero Trust authorization checks."
        );
      }
      if (Object.values(resources).some((r) => r.processedInPlaintext)) {
        caveats.push(
          "Encryption protects data in transit/at rest; active application processing occurs in plaintext memory."
        );
      }

      return {
        virtualTimeMs: nowMs,
        viewMode: scenario.viewMode,
        identities: idRuntime,
        tokens: { ...tokens },
        certificates: certRuntime,
        secrets: { ...secrets },
        resources: { ...resources },
        trustBoundaries: Object.values(boundaryRuntime),
        accessDecisions: [...decisions],
        attackPaths,
        controls: controlResults,
        blastRadius,
        riskMatrix,
        findings,
        incidents,
        report,
        caveats,
        invariants,
        metrics: {
          allowedRequests,
          deniedRequests,
          indeterminateRequests,
          authenticationFailures,
          authorizationFailures,
          networkDenials,
          transportFailures,
          trustBoundaryCrossings,
          policyViolations,
          reachableResourcesCount:
            blastRadius.directAccessResourceIds.length +
            blastRadius.conditionalAccessResourceIds.length,
          blockedAttackSteps,
          completedAttackSteps,
          simulatedCompromisedResources: blastRadius.directAccessResourceIds.length,
          controlEffectivenessPct,
          residualRiskScore,
        },
      };
    };

    const emitAndFrame = (
      nowMs: number,
      summary: string,
      activeNodeIds: string[],
      eventPayload: Record<string, unknown>
    ) => {
      if (allEvents.length >= scenario.limits.maxEvents) return;
      const evt = {
        id: `zt_evt_${++seq}`,
        sequence: seq,
        atMs: nowMs,
        durationMs: 5,
        ...eventPayload,
      } as unknown as ExecutionTrace["events"][number];
      allEvents.push(evt);

      const cloned = RuntimeStateHelper.cloneState(baseRuntime);
      cloned.zeroTrustState = buildRuntimeState(nowMs);
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: nowMs,
        activeNodeIds: Array.from(new Set(activeNodeIds)),
        activeEdgeIds: [],
        activeEvent: { ...evt, explanation: summary },
        direction: "request",
        stepTitle: String(eventPayload.type ?? "Zero Trust Check"),
        stepExplanation: summary,
        runtimeState: cloned,
      });
    };

    for (const nowMs of timestamps) {
      // A. Scheduled credential compromises at nowMs
      for (const id of Object.values(identities)) {
        if (id.compromisedAtMs === nowMs) {
          id.compromised = true;
          emitAndFrame(
            nowMs,
            `Simulated credential compromise activated for '${id.id}'.`,
            [id.id],
            {
              type: "security.credential.compromised",
              principalId: id.id,
              tokenId: id.tokenId,
              explanation: `Identity '${id.id}' flagged compromised in simulation.`,
            }
          );
        }
      }

      // B. Apply mitigations scheduled at nowMs
      for (const mit of scenario.mitigations) {
        if (mit.atMs !== nowMs) continue;
        mitigationsApplied.push({
          id: mit.id,
          atMs: nowMs,
          action: mit.action,
          targetId: mit.targetId,
          description: mit.description,
        });

        switch (mit.action) {
          case "revoke_credential": {
            if (tokens[mit.targetId]) {
              tokens[mit.targetId]!.revoked = true;
              tokens[mit.targetId]!.revokedAtMs = nowMs;
            }
            const idTarget = identities[mit.targetId];
            if (idTarget) {
              if (idTarget.tokenId && tokens[idTarget.tokenId]) {
                tokens[idTarget.tokenId]!.revoked = true;
                tokens[idTarget.tokenId]!.revokedAtMs = nowMs;
              }
              if (idTarget.certificateId && certificates[idTarget.certificateId]) {
                certificates[idTarget.certificateId]!.revoked = true;
                certificates[idTarget.certificateId]!.revokedAtMs = nowMs;
              }
              idTarget.compromised = false;
            }
            controls.forEach((c) => {
              if (c.kind === "token_revocation") c.state = "enabled";
            });
            break;
          }
          case "reduce_role_permissions": {
            const idTarget = identities[mit.targetId];
            if (idTarget) {
              idTarget.permissions = ["orders-api:read"];
              idTarget.roles = ["least-privilege-reader"];
            }
            const existing = controls.find((c) => c.kind === "least_privilege");
            if (existing) existing.state = "enabled";
            else {
              controls.push({
                id: `ctrl_lp_${mit.id}`,
                name: "Enforced Least Privilege",
                kind: "least_privilege",
                state: "enabled",
                protectedAssetIds: Object.keys(resources),
                mitigatesCategories: ["elevation_of_privilege"],
                blocksConditions: ["overprivileged_role"],
              });
            }
            break;
          }
          case "enable_network_restriction": {
            defaultNetworkDeny = true;
            networkPolicies.push({
              id: `np_restrict_${mit.id}`,
              name: `Deny unpermitted traffic to ${mit.targetId}`,
              destNodeId: mit.targetId,
              protocol: "ANY",
              port: 443,
              direction: "ingress",
              effect: "deny",
              requireMtls: false,
            });
            const existing = controls.find((c) => c.kind === "network_segmentation");
            if (existing) existing.state = "enabled";
            else {
              controls.push({
                id: `ctrl_seg_${mit.id}`,
                name: "Network Segmentation Default-Deny",
                kind: "network_segmentation",
                state: "enabled",
                protectedAssetIds: [mit.targetId],
                mitigatesCategories: ["information_disclosure", "elevation_of_privilege"],
                blocksConditions: ["missing_network_segmentation"],
              });
            }
            break;
          }
          case "require_mtls": {
            if (resources[mit.targetId]) {
              resources[mit.targetId]!.transportSecurity = "mtls";
            }
            const existing = controls.find((c) => c.kind === "mtls");
            if (existing) existing.state = "enabled";
            else {
              controls.push({
                id: `ctrl_mtls_${mit.id}`,
                name: "Strict mTLS Enforcement",
                kind: "mtls",
                state: "enabled",
                protectedAssetIds: [mit.targetId],
                mitigatesCategories: ["spoofing", "tampering"],
                blocksConditions: ["unprotected_transport"],
              });
            }
            break;
          }
          case "enable_egress_restriction": {
            const existing = controls.find((c) => c.kind === "egress_restriction");
            if (existing) existing.state = "enabled";
            else {
              controls.push({
                id: `ctrl_egress_${mit.id}`,
                name: "Strict Outbound Egress Allowlist",
                kind: "egress_restriction",
                state: "enabled",
                protectedAssetIds: [mit.targetId],
                mitigatesCategories: ["information_disclosure"],
                blocksConditions: ["missing_egress_restriction"],
              });
            }
            break;
          }
          case "restrict_resource_access": {
            if (resources[mit.targetId]) {
              resources[mit.targetId]!.publiclyReachable = false;
            }
            authorization.rules.push({
              id: `deny_${mit.id}`,
              name: `Mitigation deny rule on ${mit.targetId}`,
              effect: "deny",
              priority: 1,
              principals: ["*"],
              roles: [],
              resources: [mit.targetId],
              actions: ["*"],
              requiredScopes: [],
              requireInputKeys: [],
            });
            break;
          }
          case "rotate_secret": {
            const sec = secrets[mit.targetId];
            if (sec) {
              sec.version += 1;
              sec.rotationState = "rotated";
              sec.exposedInSimulation = false;
              sec.revoked = false;
            }
            const existing = controls.find((c) => c.kind === "secret_rotation");
            if (existing) existing.state = "enabled";
            break;
          }
          case "enable_rate_limiting": {
            const existing = controls.find((c) => c.kind === "rate_limiting");
            if (existing) existing.state = "enabled";
            else {
              controls.push({
                id: `ctrl_rl_${mit.id}`,
                name: "Adaptive Rate Limiting & Load Shedding",
                kind: "rate_limiting",
                state: "enabled",
                protectedAssetIds: [mit.targetId],
                mitigatesCategories: ["denial_of_service"],
                blocksConditions: ["missing_rate_limit"],
              });
            }
            break;
          }
          case "isolate_workload": {
            if (identities[mit.targetId]) {
              identities[mit.targetId]!.compromised = false;
            }
            networkPolicies.unshift({
              id: `np_iso_${mit.id}`,
              name: `Isolate ${mit.targetId}`,
              sourceNodeId: mit.targetId,
              protocol: "ANY",
              port: 443,
              direction: "egress",
              effect: "deny",
              requireMtls: false,
            });
            break;
          }
          case "enforce_default_deny": {
            authorization.defaultEffect = "deny";
            authorization.internalNetworkImpliesTrust = false;
            defaultNetworkDeny = true;
            break;
          }
        }

        emitAndFrame(
          nowMs,
          `Applied defensive mitigation (${mit.action}) on '${mit.targetId}'.`,
          [mit.targetId],
          {
            type: "security.mitigation.applied",
            mitigationId: mit.id,
            action: mit.action,
            targetId: mit.targetId,
            explanation: mit.description,
          }
        );
      }

      // C. Evaluate access requests scheduled at nowMs
      for (const req of scenario.requests) {
        if (req.atMs !== nowMs) continue;
        const identity = identities[req.principalId];
        const resource = resources[req.resourceId];
        if (!identity || !resource) continue;

        const decision = evaluateZeroTrustAccessRequest({
          request: req,
          identity,
          sourceResource: resources[req.sourceNodeId],
          resource,
          tokens,
          certificates,
          authorization,
          networkPolicies,
          defaultNetworkDeny,
          trustBoundaries: scenario.trustBoundaries,
        });
        decisions.push(decision);

        for (const bid of decision.boundaryCrossings) {
          const b = boundaryRuntime[bid];
          if (b) {
            b.crossingCount += 1;
            if (decision.effect === "deny") {
              b.blockedCrossings += 1;
            }
            if (decision.authState !== "AUTHENTICATED" && decision.effect === "allow") {
              b.violatedCount += 1;
              b.policyState = "violated";
            }
          }
        }

        emitAndFrame(
          nowMs,
          `${decision.effect.toUpperCase()}: '${req.principalId}' -> '${req.resourceId}:${req.action}' (${decision.reasons[0]})`,
          [req.principalId, req.resourceId],
          {
            type:
              decision.effect === "allow"
                ? "security.authorization.allowed"
                : "security.authorization.denied",
            requestId: req.id,
            principalId: req.principalId,
            resourceId: req.resourceId,
            action: req.action,
            reason: decision.reasons[0] ?? "",
            explanation: decision.reasons.join(" "),
          }
        );
      }

      // D. Evaluate threats activated at nowMs
      for (const th of scenario.threats) {
        if (th.atMs !== nowMs) continue;
        emitAndFrame(
          nowMs,
          `Threat scenario evaluated: ${th.title} (${th.category})`,
          [th.principalId, ...th.assetIds],
          {
            type: "security.threat.activated",
            threatId: th.id,
            category: th.category,
            principalId: th.principalId,
            explanation: `Evaluating modeled STRIDE threat '${th.title}'.`,
          }
        );
      }
    }

    // Guarantee at least one initial baseline frame if no events matched timestamps
    if (frames.length === 0) {
      emitAndFrame(0, `Initialized Zero Trust scenario: ${scenario.label}`, [], {
        type: "security.control.evaluated",
        controlId: controls[0]?.id ?? "baseline",
        result: "passed_check",
        explanation: scenario.label,
      });
    }

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: scenario.resources[0]?.id ?? "gateway",
      request: {
        id: `zt_req_${scenario.id}`,
        method: "GET",
        path: "/zero-trust",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: scenario.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: scenario.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: 15,
        edgeDurationMs: 10,
      },
      presetId: scenario.presetId ?? "custom",
    };

    const totalDur = Math.max(100, timestamps[timestamps.length - 1] ?? 100);
    const lastState = frames[frames.length - 1]?.runtimeState?.zeroTrustState;
    const failedInv = lastState?.invariants.allPassed === false;

    return {
      runId: `zt_run_${scenario.id}_${scenario.seed}`,
      architectureId: "arch_zero_trust_sim",
      architectureRevisionId: scenario.architectureRevisionId,
      snapshotHash: `zt_${scenario.id}_${frames.length}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: scenario.resources.map((r) => r.id),
      traversedEdgeIds: [],
      configuration,
      events: allEvents,
      totalDurationMs: totalDur,
      totalEvents: allEvents.length,
      totalHops: decisions.length + scenario.threats.length,
      outcome: failedInv ? "failure" : "success",
      terminalReason: failedInv
        ? lastState?.invariants.violations.join("; ")
        : `Zero Trust simulation finished at ${totalDur}ms (${decisions.length} decisions, ${scenario.threats.length} threats).`,
      frames,
    };
  }
}
