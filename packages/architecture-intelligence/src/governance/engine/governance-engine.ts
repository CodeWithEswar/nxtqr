/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Master Architecture Governance Engine Orchestrator
 */

import type {
  GovernanceArchitectureTopology,
  GovernanceAnalysisResult,
  GovernanceAnalysisSummary,
  PolicyEvaluation,
  GovernanceFinding,
  PolicySimulationCandidate,
  PolicySimulationResult,
} from "../contracts/governance.types";
import { PolicyEvaluator } from "../evaluator/policy-evaluator";
import { GovernanceDriftAnalyzer } from "../analysis/governance-drift-analyzer";
import { PolicySimulator } from "../analysis/policy-simulator";
import { PolicyRegistry } from "../registry/policy-registry";

export interface GovernanceEngineOptions {
  currentTimestamp?: string;
  baselineId?: string;
  includeStandardBundles?: boolean;
}

export class ArchitectureGovernanceEngine {
  /**
   * Deterministically evaluates the complete architectural governance posture for a topology.
   * Produces evaluations (pass, fail, unknown, not_applicable), findings, baseline drift, and KPI summaries.
   */
  public analyzeTopology(
    topology: GovernanceArchitectureTopology,
    options?: GovernanceEngineOptions
  ): GovernanceAnalysisResult {
    const timestamp = options?.currentTimestamp || new Date().toISOString();
    const evaluations: PolicyEvaluation[] = [];
    const findings: GovernanceFinding[] = [];

    // 1. Gather all active policies: topology policies + standard bundle policies if requested
    const policyMap = new Map<string, any>();

    // Add standard policies if requested or if no custom policies are present
    if (options?.includeStandardBundles !== false || topology.policies.length === 0) {
      const defaultPolicies = PolicyRegistry.getAllPolicies();
      for (const p of defaultPolicies) {
        policyMap.set(p.id, p);
      }
    }

    // Add/override with topology policies
    for (const p of topology.policies) {
      policyMap.set(p.id, p);
    }

    const allPolicies = Array.from(policyMap.values()).filter(
      (p) => p.status === "active" || p.status === "enforced" || p.status === "audit_only"
    );

    // 2. Identify resource targets
    const resources = topology.resources && topology.resources.length > 0
      ? topology.resources
      : [];

    // 3. Evaluate policies across resources
    if (resources.length === 0) {
      // Evaluate each policy at the system/global level
      for (const policy of allPolicies) {
        const evalItem = PolicyEvaluator.evaluatePolicy(
          policy,
          topology.evidence,
          topology.exceptions,
          {},
          undefined,
          "system",
          { currentTimestamp: timestamp }
        );
        evaluations.push(evalItem);

        const finding = PolicyEvaluator.toFinding(evalItem, policy);
        if (finding) {
          findings.push(finding);
        }
      }
    } else {
      // Evaluate each policy against each resource
      for (const res of resources) {
        const resContext = {
          id: res.id,
          name: res.name || res.id,
          environment: res.environment,
          componentType: res.componentType,
          dataClassification: res.dataClassification,
          geographicRegion: res.geographicRegion,
          tags: res.tags,
          ...(res.properties || {}),
        };

        for (const policy of allPolicies) {
          const evalItem = PolicyEvaluator.evaluatePolicy(
            policy,
            topology.evidence,
            topology.exceptions,
            resContext,
            res.id,
            res.name || res.id,
            { currentTimestamp: timestamp }
          );
          evaluations.push(evalItem);

          const finding = PolicyEvaluator.toFinding(evalItem, policy);
          if (finding) {
            findings.push(finding);
          }
        }
      }
    }

    // 4. Analyze Drift if baseline is available
    const baseline = topology.baselines.find((b) =>
      options?.baselineId ? b.id === options.baselineId : true
    );

    const drift = baseline
      ? GovernanceDriftAnalyzer.analyzeDrift(
          baseline,
          evaluations,
          topology.exceptions,
          topology.graphRevision,
          allPolicies,
          { currentTimestamp: timestamp }
        )
      : undefined;

    // 5. Aggregate KPI Summary
    const passedCount = evaluations.filter((e) => e.status === "pass").length;
    const failedCount = evaluations.filter((e) => e.status === "fail").length;
    const unknownCount = evaluations.filter((e) => e.status === "unknown").length;
    const notApplicableCount = evaluations.filter((e) => e.status === "not_applicable").length;

    const criticalViolationsCount = evaluations.filter(
      (e) => e.status === "fail" && e.severity === "critical"
    ).length;
    const highViolationsCount = evaluations.filter(
      (e) => e.status === "fail" && e.severity === "high"
    ).length;
    const mediumViolationsCount = evaluations.filter(
      (e) => e.status === "fail" && e.severity === "medium"
    ).length;
    const lowViolationsCount = evaluations.filter(
      (e) => e.status === "fail" && e.severity === "low"
    ).length;

    // Check exceptions
    const nowMs = new Date(timestamp).getTime();
    const activeExceptionsCount = topology.exceptions.filter(
      (ex) => ex.status === "approved" && !ex.isExpired && new Date(ex.expirationDate).getTime() > nowMs
    ).length;
    const expiredExceptionsCount = topology.exceptions.filter(
      (ex) => ex.isExpired || new Date(ex.expirationDate).getTime() <= nowMs
    ).length;

    // Check stale evidence
    const staleEvidenceCount = topology.evidence.filter((ev) => {
      const observedMs = new Date(ev.observedAt).getTime();
      return (nowMs - observedMs) / 1000 > ev.freshnessWindowSeconds;
    }).length;

    // Blocking violations: unexcused critical or high failures
    const unexcusedCriticalOrHigh = evaluations.filter(
      (e) =>
        e.status === "fail" &&
        (e.severity === "critical" || e.severity === "high") &&
        !e.hasActiveException
    ).length;

    const summary: GovernanceAnalysisSummary = {
      totalPoliciesCount: policyMap.size,
      activePoliciesCount: allPolicies.length,
      evaluatedRulesCount: evaluations.length,
      passedCount,
      failedCount,
      unknownCount,
      notApplicableCount,
      criticalViolationsCount,
      highViolationsCount,
      mediumViolationsCount,
      lowViolationsCount,
      activeExceptionsCount,
      expiredExceptionsCount,
      staleEvidenceCount,
      hasBlockingViolations: unexcusedCriticalOrHigh > 0,
    };

    return {
      topologyId: topology.id,
      summary,
      evaluations,
      findings,
      drift,
      analyzedAt: timestamp,
    };
  }

  /**
   * Runs What-If simulation against proposed policy versions, graph changes, or candidate exceptions.
   */
  public simulateWhatIf(
    topology: GovernanceArchitectureTopology,
    candidate: PolicySimulationCandidate,
    baseEvaluations?: PolicyEvaluation[]
  ): PolicySimulationResult {
    const resourceMap: Record<string, Record<string, any>> = {};
    if (topology.resources) {
      for (const r of topology.resources) {
        resourceMap[r.id] = {
          id: r.id,
          name: r.name,
          environment: r.environment,
          componentType: r.componentType,
          dataClassification: r.dataClassification,
          geographicRegion: r.geographicRegion,
          tags: r.tags,
          ...(r.properties || {}),
        };
      }
    }

    const currentBase = baseEvaluations || this.analyzeTopology(topology).evaluations;

    return PolicySimulator.simulate(candidate, {
      baseEvaluations: currentBase,
      policies: topology.policies.length > 0 ? topology.policies : PolicyRegistry.getAllPolicies(),
      evidence: topology.evidence,
      exceptions: topology.exceptions,
      resourceAttributesMap: resourceMap,
    });
  }

  /**
   * Generates step-by-step remediation plan for failing policy evaluations.
   */
  public generateRemediationPlan(evaluations: PolicyEvaluation[]) {
    return PolicySimulator.generateRemediationPlan(
      evaluations,
      PolicyRegistry.getAllPolicies()
    );
  }
}

export const architectureGovernanceEngine = new ArchitectureGovernanceEngine();
