/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Runbook Safety, Coverage & Staleness Analyzer
 */

import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  OperationalRunbook,
  RunbookCoverageItem,
  OperationalAsset,
  OperationalFinding,
  IncidentScenario,
} from "../contracts/operations.types";

export interface RunbookSafetyValidation {
  runbookId: string;
  isValid: boolean;
  issues: string[];
  destructiveStepCount: number;
  approvedDestructiveStepCount: number;
  hasRollbackGuidance: boolean;
}

export class RunbookAnalyzer {
  /**
   * Validates internal step dependencies and safety invariants of a runbook.
   */
  public static validateRunbookSafety(runbook: OperationalRunbook): RunbookSafetyValidation {
    const issues: string[] = [];
    let destructiveStepCount = 0;
    let approvedDestructiveStepCount = 0;

    const stepIdSet = new Set<string>(runbook.steps.map((s) => s.id));

    // Check rollback guidance
    const hasRollbackGuidance = Boolean(
      runbook.rollbackGuidance && runbook.rollbackGuidance.trim().length > 10
    );
    if (!hasRollbackGuidance) {
      issues.push(`Runbook '${runbook.title}' (${runbook.id}) lacks actionable rollback guidance.`);
    }

    // Check safety warnings on destructive steps
    for (const step of runbook.steps) {
      if (step.isDestructive) {
        destructiveStepCount++;
        if (step.requiresApproval) {
          approvedDestructiveStepCount++;
        } else {
          issues.push(
            `Destructive step ${step.stepNumber} ('${step.title}') lacks mandatory human approval gate.`
          );
        }

        if (!step.verificationGate && !step.expectedObservation) {
          issues.push(
            `Destructive step ${step.stepNumber} ('${step.title}') lacks post-execution verification criteria.`
          );
        }
      }

      // Check failure branch target validity
      if (step.failureBranchStepId && !stepIdSet.has(step.failureBranchStepId)) {
        issues.push(
          `Step ${step.stepNumber} references non-existent failure branch step '${step.failureBranchStepId}'.`
        );
      }
    }

    // Step ordering check: steps must be sequentially numbered
    for (let i = 0; i < runbook.steps.length; i++) {
      if (runbook.steps[i].stepNumber !== i + 1) {
        issues.push(`Runbook steps have non-sequential numbering at index ${i}.`);
        break;
      }
    }

    return {
      runbookId: runbook.id,
      isValid: issues.length === 0,
      issues,
      destructiveStepCount,
      approvedDestructiveStepCount,
      hasRollbackGuidance,
    };
  }

  /**
   * Evaluates runbook coverage across operational assets and incident scenarios.
   */
  public static evaluateCoverage(
    assets: OperationalAsset[],
    runbooks: OperationalRunbook[],
    scenarios: IncidentScenario[]
  ): {
    coverageItems: RunbookCoverageItem[];
    tier1CoveragePercent: number;
    scenarioCoveragePercent: number;
    findings: OperationalFinding[];
  } {
    const findings: OperationalFinding[] = [];
    const coverageItems: RunbookCoverageItem[] = [];

    // Map componentId -> runbooks
    const componentToRunbooks = new Map<string, OperationalRunbook[]>();
    for (const rb of runbooks) {
      for (const cid of rb.applicableComponentIds) {
        if (!componentToRunbooks.has(cid)) {
          componentToRunbooks.set(cid, []);
        }
        componentToRunbooks.get(cid)?.push(rb);
      }
    }

    let tier1Count = 0;
    let tier1CoveredCount = 0;

    for (const asset of assets) {
      const isTier1 = asset.tier === "tier_1_mission_critical";
      if (isTier1) tier1Count++;

      const matchingRunbooks = componentToRunbooks.get(asset.componentId) || [];
      const hasRunbook = matchingRunbooks.length > 0;
      const primaryRb = matchingRunbooks[0];

      let coverageStatus: RunbookCoverageItem["coverageStatus"] = "missing";
      if (hasRunbook && primaryRb) {
        if (primaryRb.isApproved) {
          coverageStatus = "reviewed";
        } else {
          coverageStatus = "documented";
        }
      }

      if (hasRunbook && isTier1) {
        tier1CoveredCount++;
      }

      coverageItems.push({
        componentId: asset.componentId,
        componentName: asset.name,
        tier: asset.tier,
        hasRunbook,
        runbookId: primaryRb?.id,
        coverageStatus,
      });

      if (!hasRunbook && isTier1) {
        findings.push({
          id: `FND-RUNBOOK-MISSING-${asset.componentId}`,
          category: "missing_runbook",
          severity: "critical",
          title: `Mission-Critical Component Lacks Runbook: ${asset.name}`,
          description: `Tier 1 component '${asset.name}' (${asset.componentId}) has no documented or approved operational runbook for incident triage.`,
          affectedComponentIds: [asset.componentId],
          remediationRecommendation: `Author an operational runbook detailing diagnostic steps, failover triggers, and rollback instructions for '${asset.name}'.`,
        });
      }
    }

    const tier1CoveragePercent =
      tier1Count > 0 ? Math.round((tier1CoveredCount / tier1Count) * 100) : 100;

    // Check scenario coverage
    const coveredScenarioIds = new Set<string>();
    for (const rb of runbooks) {
      for (const sid of rb.incidentScenarioIds) {
        coveredScenarioIds.add(sid);
      }
    }

    const scenarioCoveragePercent =
      scenarios.length > 0
        ? Math.round((coveredScenarioIds.size / scenarios.length) * 100)
        : 100;

    for (const sc of scenarios) {
      if (!coveredScenarioIds.has(sc.id) && sc.severity === "SEV1") {
        findings.push({
          id: `FND-SCENARIO-NO-RUNBOOK-${sc.id}`,
          category: "missing_runbook",
          severity: "high",
          title: `SEV1 Incident Scenario Lacks Dedicated Runbook: ${sc.title}`,
          description: `Scenario '${sc.title}' has SEV1 severity but no associated operational runbook or playbook linked in the registry.`,
          affectedComponentIds: sc.affectedComponentIds,
          remediationRecommendation: `Link or author a playbook that guides responders through diagnosis, containment, and recovery for scenario '${sc.id}'.`,
        });
      }
    }

    return {
      coverageItems,
      tier1CoveragePercent,
      scenarioCoveragePercent,
      findings,
    };
  }

  /**
   * Detects staleness in existing runbooks (e.g. referencing retired components or overdue review).
   */
  public static detectStaleness(
    runbooks: OperationalRunbook[],
    nodes: BaseNode[]
  ): OperationalFinding[] {
    const findings: OperationalFinding[] = [];
    const validNodeIdSet = new Set<string>(nodes.map((n) => n.id));
    const nowMs = Date.now();
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

    for (const rb of runbooks) {
      // 1. Check for removed components
      const retiredComponents = rb.applicableComponentIds.filter((cid) => !validNodeIdSet.has(cid));
      if (retiredComponents.length > 0) {
        findings.push({
          id: `FND-STALE-RUNBOOK-COMPONENTS-${rb.id}`,
          category: "stale_runbook",
          severity: "high",
          title: `Runbook References Decommissioned or Missing Components: ${rb.title}`,
          description: `Runbook '${rb.title}' (${rb.id}) references components [${retiredComponents.join(", ")}] that do not exist in the active architecture graph.`,
          affectedComponentIds: retiredComponents,
          remediationRecommendation: `Update runbook '${rb.id}' scope to align with the active architecture topology and remove obsolete component references.`,
        });
      }

      // 2. Check for review freshness
      const reviewDateMs = new Date(rb.reviewDate).getTime();
      if (!isNaN(reviewDateMs) && nowMs - reviewDateMs > SIX_MONTHS_MS) {
        findings.push({
          id: `FND-STALE-RUNBOOK-REVIEW-${rb.id}`,
          category: "stale_runbook",
          severity: "medium",
          title: `Operational Runbook Review Overdue (> 180 Days): ${rb.title}`,
          description: `Runbook '${rb.title}' was last reviewed on ${rb.reviewDate}, exceeding the 6-month operational freshness policy.`,
          affectedComponentIds: rb.applicableComponentIds,
          remediationRecommendation: `Conduct a scheduled review of runbook '${rb.id}' with designated service owner '${rb.owner}'.`,
        });
      }
    }

    return findings;
  }
}
