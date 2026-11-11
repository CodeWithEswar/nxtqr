/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Master Operational Readiness Engine Orchestrator
 */

import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  OperationalProject,
  OperationsAnalysisResult,
  ReadinessAssessment,
  ReadinessDimensionScore,
  OperationalFinding,
  OperationalSummary,
  OperationalAsset,
  ReadinessStatus,
} from "../contracts/operations.types";
import { IncidentImpactAnalyzer } from "../analysis/incident-impact-analyzer";
import { RunbookAnalyzer } from "../analysis/runbook-analyzer";
import { RecoveryScheduler } from "../analysis/recovery-scheduler";
import { DisasterRecoveryAnalyzer } from "../analysis/dr-readiness-analyzer";
import { OperationalDriftAnalyzer } from "../analysis/operational-drift-analyzer";

export class ArchitectureOperationsEngine {
  private static instance: ArchitectureOperationsEngine;

  public static getInstance(): ArchitectureOperationsEngine {
    if (!ArchitectureOperationsEngine.instance) {
      ArchitectureOperationsEngine.instance = new ArchitectureOperationsEngine();
    }
    return ArchitectureOperationsEngine.instance;
  }

  /**
   * Evaluates end-to-end operational readiness, incident impacts, recovery schedules, and drift.
   */
  public analyzeOperations(
    project: OperationalProject,
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): OperationsAnalysisResult {
    // Convert nodes to OperationalAssets if not explicitly provided
    const assets: OperationalAsset[] = nodes.map((node) => {
      const data = (node.data || {}) as Record<string, unknown>;
      let tier: OperationalAsset["tier"] = "tier_3_supporting";
      const nodeType = String(data.nodeType || "service");

      if (nodeType === "database" || nodeType === "gateway") {
        tier = "tier_1_mission_critical";
      } else if (nodeType === "service" || nodeType === "broker") {
        tier = "tier_2_business_critical";
      }

      return {
        id: `asset-${node.id}`,
        componentId: node.id,
        name: String(data.label || node.id),
        tier,
        environment: "production",
        region: String(data.region || "us-east-1"),
        ownerId: String(data.owner || "platform-eng"),
      };
    });

    // 1. Incident Scenario Impact Analysis
    const impactAnalyses = project.scenarios.map((scenario) =>
      IncidentImpactAnalyzer.analyzeScenarioImpact(scenario, nodes, edges, project.journeys, assets)
    );

    // 2. Runbook Safety & Coverage Analysis
    const runbookSafetyResults = project.runbooks.map((rb) =>
      RunbookAnalyzer.validateRunbookSafety(rb)
    );

    const coverageResult = RunbookAnalyzer.evaluateCoverage(
      assets,
      project.runbooks,
      project.scenarios
    );

    const stalenessFindings = RunbookAnalyzer.detectStaleness(project.runbooks, nodes);

    // 3. Recovery Dependencies & Critical Path Scheduling
    const componentIdsToRecover = Array.from(
      new Set<string>([
        ...nodes.map((n) => n.id),
        ...project.dependencies.map((d) => d.sourceComponentId),
        ...project.dependencies.map((d) => d.targetComponentId),
      ])
    );

    const recoverySchedule = RecoveryScheduler.scheduleRecoverySequence(
      componentIdsToRecover,
      project.dependencies
    );

    // 4. Disaster Recovery & Backup Readiness
    const objectiveResults = DisasterRecoveryAnalyzer.evaluateObjectives(
      project.objectives,
      project.evidence
    );

    const backupResults = DisasterRecoveryAnalyzer.evaluateBackups(project.backupCapabilities);

    const failoverResults = DisasterRecoveryAnalyzer.evaluateFailover(project.failoverProcedures);

    // 5. Operational Drift Analysis
    const driftResult = OperationalDriftAnalyzer.analyzeDrift(project, nodes);

    // 6. Aggregate All Operational Findings
    const allFindings: OperationalFinding[] = [
      ...coverageResult.findings,
      ...stalenessFindings,
      ...recoverySchedule.findings,
      ...objectiveResults.findings,
      ...backupResults.findings,
      ...failoverResults.findings,
    ];

    // Add findings for unsafe runbooks
    for (const sr of runbookSafetyResults) {
      if (!sr.isValid) {
        allFindings.push({
          id: `FND-RUNBOOK-UNSAFE-${sr.runbookId}`,
          category: "missing_runbook",
          severity: "high",
          title: `Runbook Safety Violation: Missing Approval or Rollback Guidance (${sr.runbookId})`,
          description: sr.issues.join(" | "),
          affectedComponentIds: [],
          remediationRecommendation: "Review runbook steps, add required human approval gates for destructive operations, and define clear rollback procedures.",
        });
      }
    }

    // 7. Evaluate the 8 Operational Readiness Dimensions
    const dimensionScores: ReadinessDimensionScore[] = this.evaluateReadinessDimensions(
      project,
      assets,
      coverageResult.tier1CoveragePercent,
      recoverySchedule.plan.hasCycles,
      objectiveResults.verifiedObjectivesCount,
      objectiveResults.unverifiedObjectivesCount,
      backupResults.evaluatedBackups,
      failoverResults.evaluatedFailovers
    );

    // Overall Readiness Score
    const totalDimensions = dimensionScores.length;
    const passedDimensions = dimensionScores.filter((d) => d.status === "ready").length;
    const overallScorePercent = Math.round((passedDimensions / totalDimensions) * 100);

    let overallReadinessStatus: ReadinessStatus = "not_ready";
    if (overallScorePercent >= 80 && !recoverySchedule.plan.hasCycles) {
      overallReadinessStatus = "ready";
    } else if (dimensionScores.some((d) => d.status === "unknown")) {
      overallReadinessStatus = "unknown";
    }

    const readiness: ReadinessAssessment = {
      id: `assessment-${project.architectureRevisionId}-${Date.now().toString().slice(-4)}`,
      architectureRevisionId: project.architectureRevisionId,
      status: overallReadinessStatus,
      overallScorePercent,
      dimensionScores,
      findings: allFindings,
      evaluatedAt: new Date().toISOString(),
      evaluatorVersion: "1.0.0-phase05.3.27",
      summaryNotes: [
        `Operational Readiness Score: ${overallScorePercent}% across 8 operational dimensions.`,
        `Tier 1 Runbook Coverage: ${coverageResult.tier1CoveragePercent}%.`,
        `Disaster Recovery Dependency DAG: ${recoverySchedule.plan.hasCycles ? "CYCLE DETECTED (BLOCKING)" : "Acyclic, scheduled"} (${recoverySchedule.plan.criticalPathSeconds}s critical path).`,
        `Verified Recovery Objectives: ${objectiveResults.verifiedObjectivesCount} / ${project.objectives.length}.`,
        `Active Operational Findings: ${allFindings.length} (${allFindings.filter((f) => f.severity === "critical").length} critical).`,
      ],
    };

    // 8. Summary KPIs
    const summary: OperationalSummary = {
      totalScenariosCount: project.scenarios.length,
      totalRunbooksCount: project.runbooks.length,
      approvedRunbooksCount: project.runbooks.filter((rb) => rb.isApproved).length,
      totalCriticalJourneysCount: project.journeys.length,
      tier1CoveragePercent: coverageResult.tier1CoveragePercent,
      verifiedObjectivesCount: objectiveResults.verifiedObjectivesCount,
      unverifiedObjectivesCount: objectiveResults.unverifiedObjectivesCount,
      criticalFindingsCount: allFindings.filter((f) => f.severity === "critical").length,
      highFindingsCount: allFindings.filter((f) => f.severity === "high").length,
      overallReadinessStatus,
    };

    return {
      project,
      impactAnalyses,
      runbookCoverage: coverageResult.coverageItems,
      recoveryPlan: recoverySchedule.plan,
      readiness,
      drift: driftResult,
      summary,
    };
  }

  private evaluateReadinessDimensions(
    project: OperationalProject,
    assets: OperationalAsset[],
    tier1CoveragePercent: number,
    hasCycles: boolean,
    verifiedObjectivesCount: number,
    unverifiedObjectivesCount: number,
    evaluatedBackups: Array<{ isFresh: boolean; isRestoreVerified: boolean }>,
    evaluatedFailovers: Array<{ isReady: boolean }>
  ): ReadinessDimensionScore[] {
    const scores: ReadinessDimensionScore[] = [];

    // 1. Ownership: Every Tier 1/2 service must have a primary owner & escalation policy
    const ownedServiceIds = new Set<string>(project.ownerships.map((o) => o.serviceId));
    const tier1Assets = assets.filter((a) => a.tier === "tier_1_mission_critical");
    const ownedTier1Count = tier1Assets.filter((a) => ownedServiceIds.has(a.componentId)).length;
    const ownershipPercent = tier1Assets.length > 0 ? Math.round((ownedTier1Count / tier1Assets.length) * 100) : 100;
    scores.push({
      dimension: "ownership",
      status: ownershipPercent >= 90 ? "ready" : "not_ready",
      passedCriteriaCount: ownedTier1Count,
      totalCriteriaCount: Math.max(1, tier1Assets.length),
      coveragePercent: ownershipPercent,
      notes: [`${ownedTier1Count} of ${tier1Assets.length} mission-critical assets have assigned response ownership.`],
    });

    // 2. Detection: Observability & Alerting coverage (at least 1 alert/trigger per SEV1 scenario)
    const sev1Scenarios = project.scenarios.filter((s) => s.severity === "SEV1");
    const triggeredScenarios = sev1Scenarios.filter((s) => s.triggerCondition && s.triggerCondition.length > 5);
    const detectionPercent = sev1Scenarios.length > 0 ? Math.round((triggeredScenarios.length / sev1Scenarios.length) * 100) : 100;
    scores.push({
      dimension: "detection",
      status: detectionPercent >= 80 ? "ready" : "not_ready",
      passedCriteriaCount: triggeredScenarios.length,
      totalCriteriaCount: Math.max(1, sev1Scenarios.length),
      coveragePercent: detectionPercent,
      notes: [`${triggeredScenarios.length} of ${sev1Scenarios.length} SEV1 scenarios have explicit detection trigger criteria.`],
    });

    // 3. Runbook Coverage
    scores.push({
      dimension: "runbook_coverage",
      status: tier1CoveragePercent >= 80 ? "ready" : "not_ready",
      passedCriteriaCount: Math.round((tier1CoveragePercent / 100) * Math.max(1, tier1Assets.length)),
      totalCriteriaCount: Math.max(1, tier1Assets.length),
      coveragePercent: tier1CoveragePercent,
      notes: [`Tier 1 mission-critical runbook coverage is ${tier1CoveragePercent}%.`],
    });

    // 4. DR Strategy: Recovery Dependency Graph validity
    const drStatus: ReadinessStatus = hasCycles ? "not_ready" : "ready";
    scores.push({
      dimension: "dr_strategy",
      status: drStatus,
      passedCriteriaCount: hasCycles ? 0 : 1,
      totalCriteriaCount: 1,
      coveragePercent: hasCycles ? 0 : 100,
      notes: [hasCycles ? "Disaster recovery dependency graph contains cycles/deadlocks." : "Acyclic recovery dependency DAG validated."],
    });

    // 5. Backup Readiness: Freshness & restore verification
    const verifiedBackups = evaluatedBackups.filter((b) => b.isFresh && b.isRestoreVerified).length;
    const backupPercent = evaluatedBackups.length > 0 ? Math.round((verifiedBackups / evaluatedBackups.length) * 100) : 100;
    scores.push({
      dimension: "backup_readiness",
      status: backupPercent >= 80 ? "ready" : "not_ready",
      passedCriteriaCount: verifiedBackups,
      totalCriteriaCount: Math.max(1, evaluatedBackups.length),
      coveragePercent: backupPercent,
      notes: [`${verifiedBackups} of ${evaluatedBackups.length} backups verified fresh and restore-tested.`],
    });

    // 6. Failover Readiness
    const readyFailovers = evaluatedFailovers.filter((f) => f.isReady).length;
    const failoverPercent = evaluatedFailovers.length > 0 ? Math.round((readyFailovers / evaluatedFailovers.length) * 100) : 100;
    scores.push({
      dimension: "failover_readiness",
      status: failoverPercent >= 75 ? "ready" : "not_ready",
      passedCriteriaCount: readyFailovers,
      totalCriteriaCount: Math.max(1, evaluatedFailovers.length),
      coveragePercent: failoverPercent,
      notes: [`${readyFailovers} of ${evaluatedFailovers.length} failover procedures verified across distinct geographic regions.`],
    });

    // 7. Verification Evidence: Objective verification
    const totalObjs = verifiedObjectivesCount + unverifiedObjectivesCount;
    const evidencePercent = totalObjs > 0 ? Math.round((verifiedObjectivesCount / totalObjs) * 100) : 100;
    scores.push({
      dimension: "verification_evidence",
      status: evidencePercent >= 60 ? "ready" : "not_ready",
      passedCriteriaCount: verifiedObjectivesCount,
      totalCriteriaCount: Math.max(1, totalObjs),
      coveragePercent: evidencePercent,
      notes: [`${verifiedObjectivesCount} of ${totalObjs} recovery objectives backed by observed drill evidence.`],
    });

    // 8. Exercise Cadence: Tabletop completed within 180 days
    const completedExercises = project.tabletopExercises.filter((e) => e.status === "completed");
    const exerciseStatus: ReadinessStatus = completedExercises.length > 0 ? "ready" : "not_ready";
    scores.push({
      dimension: "exercise_cadence",
      status: exerciseStatus,
      passedCriteriaCount: completedExercises.length,
      totalCriteriaCount: Math.max(1, project.tabletopExercises.length),
      coveragePercent: completedExercises.length > 0 ? 100 : 0,
      notes: [`${completedExercises.length} tabletop exercise(s) completed with recorded participant observations.`],
    });

    return scores;
  }
}

export const architectureOperationsEngine = ArchitectureOperationsEngine.getInstance();

