import type {
  AttackPathRuntime,
  CertificateMetadata,
  SecurityIdentityConfig,
  SecurityIncidentRuntime,
  SimulatedToken,
  ZeroTrustScenario,
  ZtAccessDecision,
  ZtBlastRadiusReport,
  ZtInvariantReport,
} from "../zero-trust-schemas";

export class ZeroTrustInvariantMonitor {
  public static verify(params: {
    scenario: ZeroTrustScenario;
    identities: Record<string, SecurityIdentityConfig>;
    tokens: Record<string, SimulatedToken>;
    certificates: Record<string, CertificateMetadata>;
    decisions: ZtAccessDecision[];
    attackPaths: AttackPathRuntime[];
    blockedStepIds: Set<string>;
    blastRadius: ZtBlastRadiusReport;
    incidents: SecurityIncidentRuntime[];
  }): ZtInvariantReport {
    const {
      scenario,
      identities,
      tokens,
      certificates,
      decisions,
      attackPaths,
      blockedStepIds,
      incidents,
    } = params;

    const violations: string[] = [];

    // 1. Default deny rejected unmatched access (unless explicitly misconfigured internalNetworkImpliesTrust/defaultAllow)
    let defaultDenyEnforcedOk = true;
    if (
      scenario.authorization.defaultEffect === "deny" &&
      !scenario.authorization.internalNetworkImpliesTrust
    ) {
      for (const dec of decisions) {
        if (
          dec.effect === "allow" &&
          dec.matchedPolicyIds.length === 0
        ) {
          defaultDenyEnforcedOk = false;
          violations.push(
            `Default-deny violation: '${dec.requestId}' allowed without any matching allow policy.`
          );
        }
      }
    }

    // 2. Expired credentials are rejected
    let expiredCredentialsRejectedOk = true;
    for (const dec of decisions) {
      const idCfg = identities[dec.principalId];
      const tok = idCfg?.tokenId ? tokens[idCfg.tokenId] : undefined;
      const cert = idCfg?.certificateId ? certificates[idCfg.certificateId] : undefined;
      const tokExpired = tok && dec.evaluatedAtMs >= tok.expiresAtMs;
      const certExpired = cert && dec.evaluatedAtMs >= cert.expiresAtMs;
      if (
        (tokExpired || certExpired) &&
        dec.effect === "allow" &&
        !scenario.authorization.internalNetworkImpliesTrust
      ) {
        expiredCredentialsRejectedOk = false;
        violations.push(
          `Expired credential accepted in request '${dec.requestId}'.`
        );
      }
    }

    // 3. Revoked credentials are rejected at/after revocation time
    let revokedCredentialsRejectedOk = true;
    for (const dec of decisions) {
      const idCfg = identities[dec.principalId];
      const tok = idCfg?.tokenId ? tokens[idCfg.tokenId] : undefined;
      const cert = idCfg?.certificateId ? certificates[idCfg.certificateId] : undefined;
      const tokRevokedAtEval = Boolean(
        tok?.revoked &&
          (tok.revokedAtMs === undefined || dec.evaluatedAtMs >= tok.revokedAtMs)
      );
      const certRevokedAtEval = Boolean(
        cert?.revoked &&
          (cert.revokedAtMs === undefined || dec.evaluatedAtMs >= cert.revokedAtMs)
      );
      if (
        (tokRevokedAtEval || certRevokedAtEval) &&
        dec.effect === "allow" &&
        !scenario.authorization.internalNetworkImpliesTrust
      ) {
        revokedCredentialsRejectedOk = false;
        violations.push(
          `Revoked credential accepted in request '${dec.requestId}'.`
        );
      }
    }

    // 4. Invalid audiences rejected
    let invalidAudiencesRejectedOk = true;
    for (const dec of decisions) {
      const idCfg = identities[dec.principalId];
      const tok = idCfg?.tokenId ? tokens[idCfg.tokenId] : undefined;
      const res = scenario.resources.find((r) => r.id === dec.resourceId);
      if (
        tok &&
        res &&
        res.expectedAudiences.length > 0 &&
        !tok.audience.some((a) => res.expectedAudiences.includes(a)) &&
        dec.effect === "allow"
      ) {
        invalidAudiencesRejectedOk = false;
        violations.push(
          `Invalid token audience allowed on '${dec.requestId}' for '${res.id}'.`
        );
      }
    }

    // 5. Cross-tenant isolation respected when enforced
    let crossTenantIsolationOk = true;
    if (scenario.authorization.enforceTenantIsolation) {
      for (const dec of decisions) {
        const idCfg = identities[dec.principalId];
        const res = scenario.resources.find((r) => r.id === dec.resourceId);
        if (
          idCfg &&
          res &&
          idCfg.tenantId !== res.tenantId &&
          dec.effect === "allow" &&
          !scenario.authorization.internalNetworkImpliesTrust
        ) {
          crossTenantIsolationOk = false;
          violations.push(
            `Cross-tenant access '${idCfg.tenantId}' -> '${res.tenantId}' incorrectly allowed in '${dec.requestId}'.`
          );
        }
      }
    }

    // 6. Network policies consistent
    let networkPoliciesConsistentOk = true;
    for (const dec of decisions) {
      const netStep = dec.steps.find((s) => s.stage === "network_policy");
      if (netStep && !netStep.passed && dec.effect === "allow") {
        networkPoliciesConsistentOk = false;
        violations.push(
          `Network policy denied '${dec.requestId}' yet final effect was allow.`
        );
      }
    }

    // 7. Attack steps cannot progress without prerequisites / 8. Blocked steps do not grant access
    let attackPrerequisitesRespectedOk = true;
    let blockedStepsDoNotGrantAccessOk = true;
    for (const ap of attackPaths) {
      let encounteredBlock = false;
      for (const st of ap.steps) {
        if (encounteredBlock && st.outcome === "completed_in_simulation") {
          attackPrerequisitesRespectedOk = false;
          violations.push(
            `Attack path '${ap.threatId}' continued past blocked step at '${st.id}'.`
          );
        }
        if (st.outcome === "blocked") {
          encounteredBlock = true;
          if (ap.reachedTargetIds.includes(st.targetNodeId) && !blockedStepIds.has(st.id)) {
            blockedStepsDoNotGrantAccessOk = false;
            violations.push(
              `Blocked attack step '${st.id}' erroneously marked target reachable.`
            );
          }
        }
      }
    }

    // 9. Blast radius matches scenario resource set
    const blastRadiusConsistentOk = scenario.resources.every(
      (r) =>
        params.blastRadius.directAccessResourceIds.includes(r.id) ||
        params.blastRadius.conditionalAccessResourceIds.includes(r.id) ||
        params.blastRadius.blockedResourceIds.includes(r.id) ||
        params.blastRadius.unknownAccessResourceIds.includes(r.id)
    );
    if (!blastRadiusConsistentOk) {
      violations.push(
        "Blast-radius partition does not cover all configured security resources."
      );
    }

    // 10. Investigation mode must not expose verified simulated ground truth
    let groundTruthSeparatedOk = true;
    if (scenario.viewMode === "investigation") {
      for (const inc of incidents) {
        if (inc.hypotheses.some((h) => h.status === "verified")) {
          groundTruthSeparatedOk = false;
          violations.push(
            `Investigation mode exposed 'verified' ground-truth hypothesis in '${inc.id}'.`
          );
        }
      }
    }

    const allPassed =
      violations.length === 0 &&
      defaultDenyEnforcedOk &&
      expiredCredentialsRejectedOk &&
      revokedCredentialsRejectedOk &&
      invalidAudiencesRejectedOk &&
      crossTenantIsolationOk &&
      networkPoliciesConsistentOk &&
      attackPrerequisitesRespectedOk &&
      blockedStepsDoNotGrantAccessOk &&
      blastRadiusConsistentOk &&
      groundTruthSeparatedOk;

    return {
      allPassed,
      defaultDenyEnforcedOk,
      expiredCredentialsRejectedOk,
      revokedCredentialsRejectedOk,
      invalidAudiencesRejectedOk,
      crossTenantIsolationOk,
      networkPoliciesConsistentOk,
      attackPrerequisitesRespectedOk,
      blockedStepsDoNotGrantAccessOk,
      blastRadiusConsistentOk,
      groundTruthSeparatedOk,
      violations,
    };
  }
}
