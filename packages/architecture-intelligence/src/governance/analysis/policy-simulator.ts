/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Non-destructive What-If Policy Simulator & Remediation Planner
 */

import type {
  GovernancePolicy,
  EvidenceArtifact,
  PolicyException,
  PolicyEvaluation,
  PolicySimulationCandidate,
  PolicySimulationResult,
} from "../contracts/governance.types";
import { PolicyEvaluator } from "../evaluator/policy-evaluator";

export interface SimulationContext {
  baseEvaluations: PolicyEvaluation[];
  policies: GovernancePolicy[];
  evidence: EvidenceArtifact[];
  exceptions: PolicyException[];
  resourceAttributesMap: Record<string, Record<string, any>>;
  currentTimestamp?: string;
}

export class PolicySimulator {
  /**
   * Simulates policy evaluation against proposed architecture graph changes,
   * candidate policy versions, or proposed exceptions without mutating production state.
   */
  public static simulate(
    candidate: PolicySimulationCandidate,
    context: SimulationContext
  ): PolicySimulationResult {
    const timestamp = context.currentTimestamp || new Date().toISOString();
    const simulatedEvaluations: PolicyEvaluation[] = [];
    const details: string[] = [];

    // 1. Prepare simulated policies (apply candidate versions if provided)
    const simulatedPolicies = context.policies.map((p) => {
      if (candidate.candidatePolicyVersions && candidate.candidatePolicyVersions[p.id]) {
        return {
          ...p,
          version: candidate.candidatePolicyVersions[p.id],
        };
      }
      return p;
    });

    // 2. Prepare simulated exceptions
    const simulatedExceptions = [
      ...context.exceptions,
      ...(candidate.candidateExceptions || []),
    ];

    // 3. Prepare simulated resources
    const simulatedResourceMap: Record<string, Record<string, any>> = {
      ...context.resourceAttributesMap,
    };

    if (candidate.candidateGraphDiff) {
      const diff = candidate.candidateGraphDiff;
      // Handle removed nodes
      if (diff.removedNodes) {
        for (const remId of diff.removedNodes) {
          delete simulatedResourceMap[remId];
          details.push(`Simulated removal of resource: ${remId}`);
        }
      }

      // Handle added nodes
      if (diff.addedNodes) {
        for (const addId of diff.addedNodes) {
          if (!simulatedResourceMap[addId]) {
            simulatedResourceMap[addId] = {
              id: addId,
              name: addId,
              environment: "production",
            };
            details.push(`Simulated addition of resource: ${addId}`);
          }
        }
      }

      // Handle modified attributes
      if (diff.modifiedAttributes) {
        for (const [resId, attrs] of Object.entries(diff.modifiedAttributes)) {
          simulatedResourceMap[resId] = {
            ...(simulatedResourceMap[resId] || {}),
            ...attrs,
          };
          details.push(`Simulated attribute modifications for resource: ${resId}`);
        }
      }
    }

    // 4. Run Evaluations across all simulated policies and resources
    for (const policy of simulatedPolicies) {
      const resourceEntries = Object.entries(simulatedResourceMap);
      if (resourceEntries.length === 0) {
        // Global evaluation
        const evalResult = PolicyEvaluator.evaluatePolicy(
          policy,
          context.evidence,
          simulatedExceptions,
          {},
          undefined,
          undefined,
          { currentTimestamp: timestamp }
        );
        simulatedEvaluations.push(evalResult);
      } else {
        for (const [resId, resProps] of resourceEntries) {
          const evalResult = PolicyEvaluator.evaluatePolicy(
            policy,
            context.evidence,
            simulatedExceptions,
            resProps,
            resId,
            resProps.name || resId,
            { currentTimestamp: timestamp }
          );
          simulatedEvaluations.push(evalResult);
        }
      }
    }

    // 5. Compare base evaluations vs simulated evaluations
    const baseViolationsCount = context.baseEvaluations.filter((e) => e.status === "fail").length;
    const simViolationsCount = simulatedEvaluations.filter((e) => e.status === "fail").length;

    let newViolationsCount = 0;
    let resolvedViolationsCount = 0;

    const baseMap = new Map<string, PolicyEvaluation>();
    for (const b of context.baseEvaluations) {
      baseMap.set(`${b.policyId}:${b.resourceId || "global"}`, b);
    }

    for (const sim of simulatedEvaluations) {
      const key = `${sim.policyId}:${sim.resourceId || "global"}`;
      const base = baseMap.get(key);

      if ((!base || base.status === "pass") && sim.status === "fail") {
        newViolationsCount++;
        details.push(`Candidate change introduces new violation: ${sim.policyTitle} on ${sim.resourceId || "global"}`);
      } else if (base && base.status === "fail" && sim.status === "pass") {
        resolvedViolationsCount++;
        details.push(`Candidate change resolves violation: ${sim.policyTitle} on ${sim.resourceId || "global"}`);
      }
    }

    let netComplianceImpact: "improved" | "degraded" | "neutral" = "neutral";
    if (simViolationsCount < baseViolationsCount) {
      netComplianceImpact = "improved";
    } else if (simViolationsCount > baseViolationsCount) {
      netComplianceImpact = "degraded";
    }

    return {
      simulatedEvaluations,
      newViolationsCount,
      resolvedViolationsCount,
      netComplianceImpact,
      details,
    };
  }

  /**
   * Generates step-by-step actionable remediation plan for failing policy evaluations.
   */
  public static generateRemediationPlan(
    evaluations: PolicyEvaluation[],
    policies: GovernancePolicy[]
  ): Array<{
    step: number;
    policyId: string;
    policyTitle: string;
    severity: string;
    resourceId?: string;
    actionRequired: string;
    remediationGuidance: string;
  }> {
    const failingEvals = evaluations.filter((e) => e.status === "fail" || e.status === "unknown");
    const policyMap = new Map(policies.map((p) => [p.id, p]));

    // Sort by severity: critical -> high -> medium -> low
    const severityWeight: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const sorted = [...failingEvals].sort((a, b) => {
      const wa = severityWeight[a.severity] || 0;
      const wb = severityWeight[b.severity] || 0;
      return wb - wa;
    });

    return sorted.map((evalItem, index) => {
      const policy = policyMap.get(evalItem.policyId);
      const isMissingEvidence = evalItem.status === "unknown";

      const actionRequired = isMissingEvidence
        ? `Submit fresh evidence artifact(s) of type: [${evalItem.missingEvidenceTypes.join(", ")}]`
        : `Update architecture attributes for ${evalItem.resourceName || evalItem.resourceId || "target"} to satisfy rule criteria.`;

      return {
        step: index + 1,
        policyId: evalItem.policyId,
        policyTitle: evalItem.policyTitle,
        severity: evalItem.severity,
        resourceId: evalItem.resourceId,
        actionRequired,
        remediationGuidance: evalItem.remediationGuidance || policy?.remediationGuidance || "Review architecture specification and adjust component settings.",
      };
    });
  }
}

