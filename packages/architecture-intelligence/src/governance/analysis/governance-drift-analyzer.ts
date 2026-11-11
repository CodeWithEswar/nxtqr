/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Governance Drift Analyzer
 */

import type {
  GovernanceBaseline,
  PolicyEvaluation,
  PolicyException,
  GovernanceDrift,
  GovernanceDriftItem,
  GovernancePolicy,
} from "../contracts/governance.types";

export interface DriftAnalysisOptions {
  currentTimestamp?: string;
}

export class GovernanceDriftAnalyzer {
  /**
   * Compares an established Governance Baseline with current evaluations and exceptions
   * to detect policy violations, resolved violations, expired exceptions, stale evidence,
   * policy version changes, and regressions.
   */
  public static analyzeDrift(
    baseline: GovernanceBaseline,
    currentEvaluations: PolicyEvaluation[],
    currentExceptions: PolicyException[],
    currentRevision: string,
    policies?: GovernancePolicy[],
    options?: DriftAnalysisOptions
  ): GovernanceDrift {
    const timestamp = options?.currentTimestamp || new Date().toISOString();
    const driftItems: GovernanceDriftItem[] = [];

    // Map baseline evaluations by key: `${policyId}:${resourceId || "global"}`
    const baselineMap = new Map<string, PolicyEvaluation>();
    for (const bEval of baseline.evaluations) {
      const key = `${bEval.policyId}:${bEval.resourceId || "global"}`;
      baselineMap.set(key, bEval);
    }

    // Map current evaluations
    const currentMap = new Map<string, PolicyEvaluation>();
    for (const cEval of currentEvaluations) {
      const key = `${cEval.policyId}:${cEval.resourceId || "global"}`;
      currentMap.set(key, cEval);
    }

    // Map policies by ID for easy lookup
    const policyMap = new Map<string, GovernancePolicy>();
    if (policies) {
      for (const p of policies) {
        policyMap.set(p.id, p);
      }
    }

    // 1. Detect New Violations, Stale Evidence, Applicability Changes, and Policy Version Changes
    for (const [key, cEval] of currentMap.entries()) {
      const bEval = baselineMap.get(key);

      if (!bEval) {
        // Newly evaluated policy or resource
        if (cEval.status === "fail") {
          driftItems.push({
            id: `drift-new-${cEval.id}-${Date.now()}`,
            policyId: cEval.policyId,
            resourceId: cEval.resourceId,
            driftType: "new_policy_violation",
            description: `New policy violation detected: ${cEval.policyTitle} failed on resource ${cEval.resourceId || "global"}`,
            severity: cEval.severity,
            baselineStatus: undefined,
            currentStatus: cEval.status,
            detectedAt: timestamp,
          });
        } else if (cEval.status === "unknown") {
          driftItems.push({
            id: `drift-stale-${cEval.id}-${Date.now()}`,
            policyId: cEval.policyId,
            resourceId: cEval.resourceId,
            driftType: "stale_evidence",
            description: `Evaluation status is UNKNOWN due to missing or stale evidence for ${cEval.policyTitle}`,
            severity: cEval.severity,
            baselineStatus: undefined,
            currentStatus: cEval.status,
            detectedAt: timestamp,
          });
        }
        continue;
      }

      // Check policy version changed
      if (bEval.policyVersion !== cEval.policyVersion) {
        driftItems.push({
          id: `drift-ver-${cEval.id}-${Date.now()}`,
          policyId: cEval.policyId,
          resourceId: cEval.resourceId,
          driftType: "policy_version_changed",
          description: `Policy version changed from v${bEval.policyVersion} to v${cEval.policyVersion} for ${cEval.policyTitle}`,
          severity: "low",
          baselineStatus: bEval.status,
          currentStatus: cEval.status,
          detectedAt: timestamp,
        });
      }

      // Check applicability changed
      if (bEval.isApplicable !== cEval.isApplicable) {
        driftItems.push({
          id: `drift-app-${cEval.id}-${Date.now()}`,
          policyId: cEval.policyId,
          resourceId: cEval.resourceId,
          driftType: "applicability_changed",
          description: `Policy applicability changed: was ${bEval.isApplicable ? "applicable" : "not applicable"}, now ${cEval.isApplicable ? "applicable" : "not applicable"}`,
          severity: "low",
          baselineStatus: bEval.status,
          currentStatus: cEval.status,
          detectedAt: timestamp,
        });
      }

      // Check new violations: was pass/not_applicable, now fail
      if ((bEval.status === "pass" || bEval.status === "not_applicable") && cEval.status === "fail") {
        driftItems.push({
          id: `drift-viol-${cEval.id}-${Date.now()}`,
          policyId: cEval.policyId,
          resourceId: cEval.resourceId,
          driftType: "new_policy_violation",
          description: `Architecture regression: ${cEval.policyTitle} previously passed in baseline, but is now failing on resource ${cEval.resourceId || "global"}`,
          severity: cEval.severity,
          baselineStatus: bEval.status,
          currentStatus: cEval.status,
          detectedAt: timestamp,
        });
      }

      // Check resolved violations: was fail, now pass
      if (bEval.status === "fail" && cEval.status === "pass") {
        driftItems.push({
          id: `drift-res-${cEval.id}-${Date.now()}`,
          policyId: cEval.policyId,
          resourceId: cEval.resourceId,
          driftType: "resolved_violation",
          description: `Policy violation resolved: ${cEval.policyTitle} passed on resource ${cEval.resourceId || "global"}`,
          severity: "low",
          baselineStatus: bEval.status,
          currentStatus: cEval.status,
          detectedAt: timestamp,
        });
      }

      // Check stale evidence transition: was pass, now unknown
      if (bEval.status === "pass" && cEval.status === "unknown") {
        driftItems.push({
          id: `drift-stale-trans-${cEval.id}-${Date.now()}`,
          policyId: cEval.policyId,
          resourceId: cEval.resourceId,
          driftType: "stale_evidence",
          description: `Evidence degraded to UNKNOWN: missing fresh evidence for ${cEval.policyTitle}`,
          severity: cEval.severity,
          baselineStatus: bEval.status,
          currentStatus: cEval.status,
          detectedAt: timestamp,
        });
      }
    }

    // 2. Detect Expired Exceptions
    for (const exId of baseline.activeExceptionIds) {
      const currentEx = currentExceptions.find((e) => e.id === exId);
      const isExpiredNow = !currentEx || currentEx.isExpired || new Date(currentEx.expirationDate).getTime() <= new Date(timestamp).getTime();

      if (isExpiredNow) {
        const policy = currentEx ? policyMap.get(currentEx.policyId) : undefined;
        driftItems.push({
          id: `drift-exp-ex-${exId}-${Date.now()}`,
          policyId: currentEx ? currentEx.policyId : "unknown-policy",
          driftType: "expired_exception",
          description: `Governance exception ${exId} has expired or been revoked${policy ? ` for policy ${policy.title}` : ""}. Unmitigated violations now require re-review or remediation.`,
          severity: policy?.severity || "high",
          detectedAt: timestamp,
        });
      }
    }

    // Also check current exceptions that have expired independently
    for (const ex of currentExceptions) {
      if (!baseline.activeExceptionIds.includes(ex.id)) {
        const isExpiredNow = ex.isExpired || new Date(ex.expirationDate).getTime() <= new Date(timestamp).getTime();
        if (isExpiredNow && ex.status === "approved") {
          const policy = policyMap.get(ex.policyId);
          // Only add if not already added
          if (!driftItems.some((item) => item.id.includes(ex.id))) {
            driftItems.push({
              id: `drift-exp-ex-${ex.id}-${Date.now()}`,
              policyId: ex.policyId,
              driftType: "expired_exception",
              description: `Governance exception ${ex.id} expired on ${ex.expirationDate}${policy ? ` for policy ${policy.title}` : ""}.`,
              severity: policy?.severity || "medium",
              detectedAt: timestamp,
            });
          }
        }
      }
    }

    // Summary calculation
    const totalNewViolations = driftItems.filter((i) => i.driftType === "new_policy_violation").length;
    const totalResolvedViolations = driftItems.filter((i) => i.driftType === "resolved_violation").length;
    const totalExpiredExceptions = driftItems.filter((i) => i.driftType === "expired_exception").length;
    const hasRegressions = totalNewViolations > 0 || totalExpiredExceptions > 0;

    return {
      baselineId: baseline.id,
      currentRevision,
      driftItems,
      totalNewViolations,
      totalResolvedViolations,
      totalExpiredExceptions,
      hasRegressions,
      analyzedAt: timestamp,
    };
  }
}

