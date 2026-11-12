import { evaluatePrincipalAuthentication } from "../authentication/identity-auth-engine";
import { evaluateZeroTrustAccessRequest } from "../authorization/zero-trust-policy-engine";
import type {
  AbstractAttackStep,
  AttackPathRuntime,
  CertificateMetadata,
  ControlEvaluationResult,
  RiskMatrixEntry,
  SecurityControlConfig,
  SecurityEvidenceItem,
  SecurityFinding,
  SecurityIdentityConfig,
  SecurityIncidentRuntime,
  SimulatedToken,
  ThreatModelReport,
  ZeroTrustScenario,
  ZtAccessDecision,
  ZtBlastRadiusReport,
} from "../zero-trust-schemas";

export function evaluateSimulatedCondition(
  condition: string,
  params: {
    principal?: SecurityIdentityConfig;
    scenario: ZeroTrustScenario;
    tokens: Record<string, SimulatedToken>;
    secrets: ZeroTrustScenario["secrets"];
    controls: SecurityControlConfig[];
    nowMs: number;
  }
): boolean {
  const { principal, scenario, tokens, secrets, controls, nowMs } = params;
  const controlEnabled = (kind: SecurityControlConfig["kind"]) =>
    controls.some((c) => c.kind === kind && c.state === "enabled");

  switch (condition) {
    case "identity_compromised":
      return Boolean(principal?.compromised);
    case "credential_valid": {
      if (!principal?.tokenId) return Boolean(principal && !principal.compromised);
      const tok = tokens[principal.tokenId];
      return Boolean(tok && !tok.revoked && nowMs < tok.expiresAtMs);
    }
    case "overprivileged_role":
      return Boolean(
        principal &&
          (principal.permissions.includes("*") ||
            principal.roles.includes("cluster-admin") ||
            principal.roles.includes("overprivileged-service")) &&
          !controlEnabled("least_privilege")
      );
    case "missing_network_segmentation":
      return !scenario.defaultNetworkDeny && !controlEnabled("network_segmentation");
    case "missing_egress_restriction":
      return !controlEnabled("egress_restriction");
    case "public_endpoint_exposed":
      return scenario.resources.some(
        (r) =>
          (r.zoneId === "public" || r.zoneId === "edge" || r.publiclyReachable) &&
          r.kind === "admin_interface"
      ) || scenario.resources.some((r) => r.publiclyReachable);
    case "unprotected_transport":
      return scenario.resources.some((r) => r.transportSecurity === "plaintext");
    case "stale_secret_consumer":
      return secrets.some(
        (s) => s.rotationState === "stale_consumer" || s.exposedInSimulation
      );
    case "missing_rate_limit":
      return !controlEnabled("rate_limiting");
    case "control_misconfigured":
      return controls.some(
        (c) =>
          c.state === "disabled" ||
          c.state === "misconfigured" ||
          c.state === "unavailable"
      );
    case "cross_tenant_gap":
      return !scenario.authorization.enforceTenantIsolation;
    case "default_allow_policy":
      return scenario.authorization.defaultEffect === "allow";
    case "resource_reachable":
      return true;
    default:
      return false;
  }
}

export function evaluateThreatScenariosAndPaths(params: {
  scenario: ZeroTrustScenario;
  identities: Record<string, SecurityIdentityConfig>;
  tokens: Record<string, SimulatedToken>;
  controls: SecurityControlConfig[];
  nowMs: number;
}): {
  attackPaths: AttackPathRuntime[];
  controlResults: ControlEvaluationResult[];
  blockedStepIds: Set<string>;
} {
  const { scenario, identities, tokens, controls, nowMs } = params;
  const controlBlocksCount: Record<string, number> = {};
  const controlThreatLinks: Record<string, Set<string>> = {};
  const blockedStepIds = new Set<string>();
  const attackPaths: AttackPathRuntime[] = [];

  for (const c of controls) {
    controlBlocksCount[c.id] = 0;
    controlThreatLinks[c.id] = new Set<string>();
  }

  for (const threat of scenario.threats) {
    if (threat.atMs > nowMs) continue;
    const principal = identities[threat.principalId];
    const threatPrereqsMet = threat.requiredConditions.every((cond) =>
      evaluateSimulatedCondition(cond, {
        principal,
        scenario,
        tokens,
        secrets: scenario.secrets,
        controls,
        nowMs,
      })
    );

    const steps: AbstractAttackStep[] = [];
    let pathBlocked = !threatPrereqsMet;
    let blockingControlId: string | undefined;
    const reachedTargetIds: string[] = [];

    for (const stepCfg of threat.steps) {
      if (pathBlocked) {
        steps.push({
          id: stepCfg.id,
          threatId: threat.id,
          sourceNodeId: stepCfg.sourceNodeId,
          targetNodeId: stepCfg.targetNodeId,
          requiredConditions: stepCfg.requiredConditions,
          evaluatedControlIds: stepCfg.evaluatedControlIds,
          outcome: "blocked",
          explanation: blockingControlId
            ? `Unreachable: prior step contained by control '${blockingControlId}'.`
            : `Preconditions [${threat.requiredConditions.join(", ")}] not satisfied in current security state.`,
        });
        blockedStepIds.add(stepCfg.id);
        continue;
      }

      const stepPrereqsMet = stepCfg.requiredConditions.every((cond) =>
        evaluateSimulatedCondition(cond, {
          principal,
          scenario,
          tokens,
          secrets: scenario.secrets,
          controls,
          nowMs,
        })
      );

      // Find any enabled defensive control blocking this step
      const blockingCtrl = stepCfg.evaluatedControlIds
        .map((cid) => controls.find((c) => c.id === cid))
        .find((c) => {
          if (!c || c.state !== "enabled") return false;
          // If step explicitly requires missing condition matching this control, check if control prevents it
          if (c.kind === "network_segmentation" && !stepPrereqsMet) return true;
          if (c.blocksConditions.some((bc) => stepCfg.requiredConditions.includes(bc))) {
            return true;
          }
          // Generic enabled control explicitly wired on step against this target
          return (
            c.protectedAssetIds.length === 0 ||
            c.protectedAssetIds.includes(stepCfg.targetNodeId) ||
            c.mitigatesCategories.includes(threat.category)
          );
        });

      for (const cid of stepCfg.evaluatedControlIds) {
        controlThreatLinks[cid]?.add(threat.id);
      }

      if (!stepPrereqsMet || blockingCtrl) {
        pathBlocked = true;
        blockingControlId = blockingCtrl?.id;
        if (blockingCtrl) {
          controlBlocksCount[blockingCtrl.id] =
            (controlBlocksCount[blockingCtrl.id] ?? 0) + 1;
        }
        blockedStepIds.add(stepCfg.id);
        steps.push({
          id: stepCfg.id,
          threatId: threat.id,
          sourceNodeId: stepCfg.sourceNodeId,
          targetNodeId: stepCfg.targetNodeId,
          requiredConditions: stepCfg.requiredConditions,
          evaluatedControlIds: stepCfg.evaluatedControlIds,
          outcome: "blocked",
          explanation: blockingCtrl
            ? `Blocked by control '${blockingCtrl.name}' (${blockingCtrl.kind}).`
            : `Step precondition not satisfied (${stepCfg.requiredConditions.join(", ")}).`,
        });
      } else {
        reachedTargetIds.push(stepCfg.targetNodeId);
        steps.push({
          id: stepCfg.id,
          threatId: threat.id,
          sourceNodeId: stepCfg.sourceNodeId,
          targetNodeId: stepCfg.targetNodeId,
          requiredConditions: stepCfg.requiredConditions,
          evaluatedControlIds: stepCfg.evaluatedControlIds,
          outcome: "completed_in_simulation",
          explanation: stepCfg.explanation,
        });
      }
    }

    attackPaths.push({
      threatId: threat.id,
      title: threat.title,
      category: threat.category,
      steps,
      blockedByControlId: blockingControlId,
      reachedTargetIds,
      status:
        reachedTargetIds.length === 0
          ? "contained"
          : pathBlocked
            ? "partial_exposure"
            : "completed_in_simulation",
    });
  }

  const controlResults: ControlEvaluationResult[] = controls.map((c) => {
    const blocks = controlBlocksCount[c.id] ?? 0;
    const result: ControlEvaluationResult["result"] =
      c.state !== "enabled"
        ? "failed_or_missing"
        : blocks > 0
          ? "blocked_threat"
          : (controlThreatLinks[c.id]?.size ?? 0) > 0
            ? "passed_check"
            : "not_triggered";
    return {
      controlId: c.id,
      name: c.name,
      kind: c.kind,
      state: c.state,
      protectedAssets: c.protectedAssetIds,
      applicableThreatIds: Array.from(controlThreatLinks[c.id] ?? []),
      result,
      blocksCount: blocks,
      reason:
        c.state !== "enabled"
          ? `Control '${c.name}' is ${c.state} and did not enforce protection.`
          : blocks > 0
            ? `Control '${c.name}' blocked ${blocks} modeled attack transition(s).`
            : `Control '${c.name}' is active.`,
    };
  });

  return { attackPaths, controlResults, blockedStepIds };
}

export function computeSecurityBlastRadius(params: {
  scenario: ZeroTrustScenario;
  identities: Record<string, SecurityIdentityConfig>;
  tokens: Record<string, SimulatedToken>;
  certificates: Record<string, CertificateMetadata>;
  controls: SecurityControlConfig[];
  attackPaths: AttackPathRuntime[];
  nowMs: number;
}): ZtBlastRadiusReport {
  const {
    scenario,
    identities,
    tokens,
    certificates,
    controls,
    attackPaths,
    nowMs,
  } = params;

  const compromised = Object.values(identities).filter((i) => i.compromised);
  const direct = new Set<string>();
  const conditional = new Set<string>();
  const blocked = new Set<string>();
  const unknown = new Set<string>();

  if (compromised.length === 0) {
    for (const r of scenario.resources) {
      blocked.add(r.id);
    }
    return {
      compromisedPrincipalIds: [],
      directAccessResourceIds: [],
      conditionalAccessResourceIds: [],
      blockedResourceIds: Array.from(blocked),
      unknownAccessResourceIds: [],
      sensitiveAssetsExposed: [],
    };
  }

  const reachedByPaths = new Set(attackPaths.flatMap((p) => p.reachedTargetIds));
  const netSegmented =
    scenario.defaultNetworkDeny ||
    controls.some((c) => c.kind === "network_segmentation" && c.state === "enabled");

  for (const res of scenario.resources) {
    let anyDirect = false;
    let anyConditional = false;
    let anyIndeterminate = false;

    for (const idCfg of compromised) {
      // Simulate probe with temporary compromised=false for credential/policy reachability check
      const auth = evaluatePrincipalAuthentication(
        idCfg,
        res,
        tokens,
        certificates,
        nowMs
      );
      if (!auth.authenticated) {
        continue;
      }
      const probeDecision = evaluateZeroTrustAccessRequest({
        request: {
          id: `br_probe_${idCfg.id}_${res.id}`,
          atMs: nowMs,
          principalId: idCfg.id,
          sourceNodeId: idCfg.id,
          resourceId: res.id,
          action: res.acceptedActions[0] ?? "read",
          protocol: res.transportSecurity === "plaintext" ? "HTTP" : "HTTPS",
          port: res.transportSecurity === "plaintext" ? 80 : 443,
          expectedAllowed: true,
          environmentAttributes: {},
          description: "Blast radius reachability check",
        },
        identity: { ...idCfg, compromised: false },
        resource: res,
        tokens,
        certificates,
        authorization: scenario.authorization,
        networkPolicies: scenario.networkPolicies,
        defaultNetworkDeny: netSegmented,
        trustBoundaries: scenario.trustBoundaries,
      });

      if (probeDecision.effect === "allow") {
        anyDirect = true;
      } else if (probeDecision.effect === "indeterminate") {
        anyIndeterminate = true;
      } else if (reachedByPaths.has(res.id)) {
        anyConditional = true;
      }
    }

    if (anyDirect) direct.add(res.id);
    else if (anyConditional) conditional.add(res.id);
    else if (anyIndeterminate) unknown.add(res.id);
    else blocked.add(res.id);
  }

  const sensitiveAssetsExposed = [...direct, ...conditional].filter((rid) => {
    const res = scenario.resources.find((r) => r.id === rid);
    return (
      res &&
      (res.classification === "confidential" ||
        res.classification === "restricted")
    );
  });

  return {
    compromisedPrincipalIds: compromised.map((c) => c.id),
    directAccessResourceIds: Array.from(direct),
    conditionalAccessResourceIds: Array.from(conditional),
    blockedResourceIds: Array.from(blocked),
    unknownAccessResourceIds: Array.from(unknown),
    sensitiveAssetsExposed,
  };
}

export function buildRiskMatrixFindingsAndIncident(params: {
  scenario: ZeroTrustScenario;
  decisions: ZtAccessDecision[];
  attackPaths: AttackPathRuntime[];
  controls: ControlEvaluationResult[];
  blastRadius: ZtBlastRadiusReport;
  viewMode: "investigation" | "explanation";
  mitigationsApplied: Array<{
    id: string;
    atMs: number;
    action: string;
    targetId: string;
    description: string;
  }>;
  nowMs: number;
}): {
  riskMatrix: RiskMatrixEntry[];
  findings: SecurityFinding[];
  incidents: SecurityIncidentRuntime[];
  report: ThreatModelReport;
} {
  const {
    scenario,
    decisions,
    attackPaths,
    controls,
    blastRadius,
    viewMode,
    mitigationsApplied,
    nowMs,
  } = params;

  const riskMatrix: RiskMatrixEntry[] = scenario.threats.map((th) => {
    const path = attackPaths.find((p) => p.threatId === th.id);
    const activeControls = controls
      .filter((c) => th.controlIds.includes(c.controlId) && c.state === "enabled")
      .map((c) => c.name);
    const residualRisk: RiskMatrixEntry["residualRisk"] =
      path?.status === "contained"
        ? "low"
        : path?.status === "partial_exposure"
          ? "medium"
          : th.impact;
    return {
      threatId: th.id,
      title: th.title,
      category: th.category,
      assetIds: th.assetIds,
      likelihood: th.likelihood,
      impact: th.impact,
      existingControls: activeControls,
      residualRisk,
      recommendedMitigation:
        path?.status === "contained"
          ? "Maintain continuous verification and credential rotation."
          : "Enable default-deny segmentation, least-privilege scopes, or credential revocation.",
    };
  });

  const findings: SecurityFinding[] = [];
  for (const ap of attackPaths) {
    if (ap.reachedTargetIds.length > 0) {
      findings.push({
        id: `finding_${ap.threatId}`,
        severity: blastRadius.sensitiveAssetsExposed.length > 0 ? "critical" : "high",
        category: ap.category,
        title: `${ap.title} reached ${ap.reachedTargetIds.join(", ")}`,
        evidenceSummary: `Modeled attack steps completed in simulation (${ap.reachedTargetIds.length} asset(s)).`,
        affectedAssetIds: ap.reachedTargetIds,
        mitigated: false,
      });
    } else {
      findings.push({
        id: `finding_${ap.threatId}`,
        severity: "info",
        category: ap.category,
        title: `${ap.title} contained`,
        evidenceSummary: ap.blockedByControlId
          ? `Contained by defensive control '${ap.blockedByControlId}'.`
          : "Threat preconditions were prevented or mitigated.",
        affectedAssetIds: [],
        mitigated: true,
      });
    }
  }

  for (const res of scenario.resources) {
    if (res.transportSecurity === "plaintext" && res.classification !== "public") {
      findings.push({
        id: `finding_transport_${res.id}`,
        severity: "medium",
        category: "transport_gap",
        title: `Plaintext transport on non-public resource '${res.label}'`,
        evidenceSummary: `Classification '${res.classification}' traversing plaintext boundary without TLS/mTLS.`,
        affectedAssetIds: [res.id],
        mitigated: false,
      });
    }
  }

  const evidence: SecurityEvidenceItem[] = [];
  for (const dec of decisions) {
    if (dec.effect !== "allow") {
      evidence.push({
        id: `ev_dec_${dec.requestId}`,
        atMs: dec.evaluatedAtMs,
        source:
          dec.authState !== "AUTHENTICATED" ? "auth_failure" : "access_denied",
        summary: dec.reasons[0] ?? `${dec.principalId} denied access to ${dec.resourceId}`,
        resourceId: dec.resourceId,
        principalId: dec.principalId,
      });
    }
  }
  for (const ap of attackPaths) {
    for (const st of ap.steps) {
      if (st.outcome === "completed_in_simulation") {
        evidence.push({
          id: `ev_step_${st.id}`,
          atMs: nowMs,
          source: "threat_transition",
          summary: `${ap.title}: ${st.sourceNodeId} -> ${st.targetNodeId} (${st.explanation})`,
          resourceId: st.targetNodeId,
        });
      }
    }
  }

  const hasExposure =
    findings.some((f) => !f.mitigated && (f.severity === "critical" || f.severity === "high")) ||
    decisions.some((d) => d.effect === "deny" && d.authState === "REVOKED");

  const incidents: SecurityIncidentRuntime[] = [];
  if (hasExposure || mitigationsApplied.length > 0) {
    const resolved =
      mitigationsApplied.length > 0 &&
      blastRadius.sensitiveAssetsExposed.length === 0 &&
      attackPaths.every((a) => a.status === "contained");

    const hypotheses: SecurityIncidentRuntime["hypotheses"] = [];
    if (viewMode === "explanation" && scenario.threats.length > 0) {
      scenario.threats.forEach((th, idx) => {
        hypotheses.push({
          id: `hyp_${th.id}`,
          rank: idx + 1,
          description: `Simulated threat origin: ${th.title} (${th.category}) via '${th.principalId}'.`,
          status: "verified",
        });
      });
    } else {
      hypotheses.push({
        id: "hyp_obs_1",
        rank: 1,
        description:
          evidence.length > 0
            ? `Observed policy/auth anomalies (${evidence.length} signals) affecting ${blastRadius.directAccessResourceIds.join(", ") || "protected services"}.`
            : "Investigating policy and identity access telemetry.",
        status: evidence.length > 0 ? "supported" : "candidate",
      });
    }

    incidents.push({
      id: "sec_inc_1",
      title: scenario.label,
      severity:
        blastRadius.sensitiveAssetsExposed.length > 0 ? "sev1" : "sev2",
      status: resolved
        ? "resolved"
        : mitigationsApplied.length > 0
          ? "mitigating"
          : "investigating",
      detectedAtMs: evidence[0]?.atMs ?? scenario.threats[0]?.atMs ?? 50,
      mitigatedAtMs: mitigationsApplied[0]?.atMs,
      resolvedAtMs: resolved ? nowMs : undefined,
      affectedResourceIds: [
        ...blastRadius.directAccessResourceIds,
        ...blastRadius.conditionalAccessResourceIds,
      ],
      evidence,
      hypotheses,
      timeline: [
        ...evidence.slice(0, 6).map((e) => ({
          atMs: e.atMs,
          kind: e.source,
          summary: e.summary,
        })),
        ...mitigationsApplied.map((m) => ({
          atMs: m.atMs,
          kind: "mitigation",
          summary: `${m.action} on ${m.targetId}: ${m.description}`,
        })),
      ],
      mitigationsApplied,
    });
  }

  const report: ThreatModelReport = {
    scenarioId: scenario.id,
    title: `Threat Model Report — ${scenario.label}`,
    assetCount: scenario.resources.length,
    boundaryCount: scenario.trustBoundaries.length,
    threatCount: scenario.threats.length,
    findingsSummary: `${findings.filter((f) => !f.mitigated).length} open finding(s), ${findings.filter((f) => f.mitigated).length} contained.`,
    mitigationSummary:
      mitigationsApplied.length > 0
        ? `${mitigationsApplied.length} defensive mitigation(s) applied and verified.`
        : "No runtime mitigations applied yet.",
    caveats: [
      "Network location does not establish identity or authorization.",
      "Authentication does not automatically grant authorization.",
      "Simulated threat coverage does not prove a real production system is secure.",
    ],
  };

  return { riskMatrix, findings, incidents, report };
}
