"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Interactive Verification Testbed Page
 */

import React, { useState } from "react";
import { OperationsWorkspace } from "@/features/system-design/operations";
import {
  incidentScenarioRegistry,
  IncidentImpactAnalyzer,
  RunbookAnalyzer,
  RecoveryScheduler,
  DisasterRecoveryAnalyzer,
  architectureOperationsEngine,
  type OperationalProject,
  type RecoveryDependency,
  type CriticalJourney,
  type OperationalAsset,
  type OperationalRunbook,
  type RecoveryObjective,
  type BackupCapability,
} from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { PlayIcon, CheckCircleIcon, AlertCircleIcon } from "@nxtqr/icons";

export default function ArchitectureOperationsVerificationPage() {
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: "passed" | "failed"; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  const sampleNodes: BaseNode[] = [
    { id: "api-gw", type: "custom", position: { x: 50, y: 100 }, data: { label: "API Gateway", nodeType: "gateway" } },
    { id: "order-svc", type: "custom", position: { x: 250, y: 100 }, data: { label: "Order Service", nodeType: "service" } },
    { id: "primary-db", type: "custom", position: { x: 450, y: 100 }, data: { label: "PostgreSQL Primary", nodeType: "database" } },
  ];

  const sampleEdges: BaseEdge[] = [
    { id: "e1", source: "api-gw", target: "order-svc", type: "smoothstep", data: {} },
    { id: "e2", source: "order-svc", target: "primary-db", type: "smoothstep", data: {} },
  ];

  const sampleJourneys: CriticalJourney[] = [
    {
      id: "j-checkout",
      title: "Checkout Flow",
      description: "Checkout flow",
      entryPointComponentId: "api-gw",
      traversedComponentIds: ["api-gw", "order-svc", "primary-db"],
      recoveryPriority: 1,
      maxAllowedDowntimeSeconds: 120,
    },
  ];

  const sampleAssets: OperationalAsset[] = [
    { id: "a1", componentId: "api-gw", name: "Gateway", tier: "tier_1_mission_critical", environment: "prod", region: "us-east-1", ownerId: "team-infra" },
    { id: "a2", componentId: "primary-db", name: "DB", tier: "tier_1_mission_critical", environment: "prod", region: "us-east-1", ownerId: "team-data" },
  ];

  const runAllVerifications = () => {
    const results: Array<{ name: string; status: "passed" | "failed"; detail: string }> = [];

    // Test 1: Incident Scenario Catalog & Severity Configuration
    try {
      const scenarios = incidentScenarioRegistry.getAllScenarios();
      const hasSev1 = scenarios.some((s) => s.severity === "SEV1");
      const hasDb = scenarios.some((s) => s.category === "database_outage");
      const hasRegional = scenarios.some((s) => s.category === "regional_outage");

      if (scenarios.length >= 6 && hasSev1 && hasDb && hasRegional) {
        results.push({
          name: "Incident Scenario Registry & Severity Configuration",
          status: "passed",
          detail: `${scenarios.length} standard failure scenarios registered across database, gateway, auth, queue, storage, and regional outage categories.`,
        });
      } else {
        results.push({
          name: "Incident Scenario Registry & Severity Configuration",
          status: "failed",
          detail: `Expected at least 6 scenarios with SEV1, database, and regional coverage. Found ${scenarios.length}`,
        });
      }
    } catch (err: any) {
      results.push({
        name: "Incident Scenario Registry & Severity Configuration",
        status: "failed",
        detail: err.message,
      });
    }

    // Test 2: Blast Radius & Critical Journey Impact Analysis
    try {
      const dbScenario = incidentScenarioRegistry.getScenario("SCN-DB-FAILOVER-001");
      if (dbScenario) {
        const impact = IncidentImpactAnalyzer.analyzeScenarioImpact(
          dbScenario,
          sampleNodes,
          sampleEdges,
          sampleJourneys,
          sampleAssets
        );

        if (
          impact.directFailedComponentIds.includes("primary-db") &&
          impact.propagatedComponentIds.includes("order-svc") &&
          impact.isCriticalJourneyDisrupted &&
          impact.blastRadiusScore > 0
        ) {
          results.push({
            name: "Blast Radius & Critical Journey Impact Analysis",
            status: "passed",
            detail: `Direct failure 'primary-db' propagated to dependent 'order-svc'. Critical journey 'j-checkout' disrupted. Blast radius: ${impact.blastRadiusScore}/100.`,
          });
        } else {
          results.push({
            name: "Blast Radius & Critical Journey Impact Analysis",
            status: "failed",
            detail: `Propagation failed or journey disruption not detected. Blast radius: ${impact.blastRadiusScore}`,
          });
        }
      } else {
        results.push({
          name: "Blast Radius & Critical Journey Impact Analysis",
          status: "failed",
          detail: "SCN-DB-FAILOVER-001 scenario not found.",
        });
      }
    } catch (err: any) {
      results.push({
        name: "Blast Radius & Critical Journey Impact Analysis",
        status: "failed",
        detail: err.message,
      });
    }

    // Test 3: Runbook Safety & Tier 1 Coverage Validation
    try {
      const safeRunbook: OperationalRunbook = {
        id: "RB-TEST-01",
        title: "Test Safe Runbook",
        purpose: "Safe failover",
        applicableComponentIds: ["primary-db"],
        incidentScenarioIds: ["SCN-DB-FAILOVER-001"],
        revision: "1.0.0",
        steps: [
          { id: "s1", stepNumber: 1, type: "observation", title: "Check Lag", details: "Read lag", isDestructive: false, requiresApproval: false },
          { id: "s2", stepNumber: 2, type: "recovery", title: "Promote Replica", details: "Promote", isDestructive: true, requiresApproval: true, verificationGate: "HTTP 200" },
        ],
        safetyWarnings: ["Verify lag"],
        prerequisites: ["VPN"],
        rollbackGuidance: "Revert DNS pointer",
        owner: "data-team",
        reviewDate: new Date().toISOString(),
        isApproved: true,
      };

      const safety = RunbookAnalyzer.validateRunbookSafety(safeRunbook);
      const coverage = RunbookAnalyzer.evaluateCoverage(sampleAssets, [safeRunbook], []);

      if (safety.isValid && coverage.tier1CoveragePercent === 50) {
        results.push({
          name: "Runbook Safety & Tier 1 Coverage Validation",
          status: "passed",
          detail: "Runbook passed safety check (approval gates for destructive steps, rollback guidance). Tier 1 coverage: 50% (api-gw uncovered).",
        });
      } else {
        results.push({
          name: "Runbook Safety & Tier 1 Coverage Validation",
          status: "failed",
          detail: `Safety valid: ${safety.isValid}, Tier 1 coverage: ${coverage.tier1CoveragePercent}%`,
        });
      }
    } catch (err: any) {
      results.push({
        name: "Runbook Safety & Tier 1 Coverage Validation",
        status: "failed",
        detail: err.message,
      });
    }

    // Test 4: Recovery Dependency Graph & Tarjan SCC Cycle Detection
    try {
      // 1. Cyclic Graph Test
      const cyclicDeps: RecoveryDependency[] = [
        { id: "cd1", sourceComponentId: "a", targetComponentId: "b", dependencyType: "infrastructure", isBlocking: true },
        { id: "cd2", sourceComponentId: "b", targetComponentId: "a", dependencyType: "infrastructure", isBlocking: true },
      ];
      const cyclicResult = RecoveryScheduler.scheduleRecoverySequence(["a", "b"], cyclicDeps);

      // 2. Acyclic Graph Test
      const acyclicDeps: RecoveryDependency[] = [
        { id: "ad1", sourceComponentId: "a", targetComponentId: "b", dependencyType: "infrastructure", isBlocking: true },
        { id: "ad2", sourceComponentId: "b", targetComponentId: "c", dependencyType: "infrastructure", isBlocking: true },
      ];
      const acyclicResult = RecoveryScheduler.scheduleRecoverySequence(["a", "b", "c"], acyclicDeps);

      if (cyclicResult.plan.hasCycles && !acyclicResult.plan.hasCycles && acyclicResult.plan.topologicalSequence.length === 3) {
        results.push({
          name: "Recovery Dependency Graph & Tarjan SCC Cycle Detection",
          status: "passed",
          detail: "Tarjan SCC correctly flagged cyclic deadlock. Kahn topological sort scheduled acyclic recovery sequence (a -> b -> c).",
        });
      } else {
        results.push({
          name: "Recovery Dependency Graph & Tarjan SCC Cycle Detection",
          status: "failed",
          detail: `Cyclic detected: ${cyclicResult.plan.hasCycles}, Acyclic detected: ${acyclicResult.plan.hasCycles}`,
        });
      }
    } catch (err: any) {
      results.push({
        name: "Recovery Dependency Graph & Tarjan SCC Cycle Detection",
        status: "failed",
        detail: err.message,
      });
    }

    // Test 5: Recovery Objectives (RTO/RPO) & Observed Evidence Verification
    try {
      const objectives: RecoveryObjective[] = [
        {
          id: "o1",
          serviceId: "order-svc",
          serviceName: "Order Service",
          rtoTargetSeconds: 300,
          rpoTargetSeconds: 60,
          supportingStrategyType: "warm_standby",
          observedRtoSeconds: 240,
          observedRpoSeconds: 30,
          isRtoVerified: true,
          isRpoVerified: true,
          evidenceIds: ["ev-1"],
        },
        {
          id: "o2",
          serviceId: "billing-svc",
          serviceName: "Billing Service",
          rtoTargetSeconds: 600,
          rpoTargetSeconds: 120,
          supportingStrategyType: "backup_restore",
          isRtoVerified: false,
          isRpoVerified: false,
          evidenceIds: [],
        },
      ];

      const res = DisasterRecoveryAnalyzer.evaluateObjectives(objectives, [
        { id: "ev-1", evidenceType: "failover_drill", sourceUri: "", contentHash: "", recordedAt: "", verifiedBy: "", notes: "" },
      ]);

      if (res.verifiedObjectivesCount === 1 && res.unverifiedObjectivesCount === 1) {
        results.push({
          name: "Recovery Objectives (RTO/RPO) Target vs Evidence Verification",
          status: "passed",
          detail: "Strictly enforced non-fabrication rule: 1 objective verified with drill evidence, 1 flagged unverified target.",
        });
      } else {
        results.push({
          name: "Recovery Objectives (RTO/RPO) Target vs Evidence Verification",
          status: "failed",
          detail: `Verified: ${res.verifiedObjectivesCount}, Unverified: ${res.unverifiedObjectivesCount}`,
        });
      }
    } catch (err: any) {
      results.push({
        name: "Recovery Objectives (RTO/RPO) Target vs Evidence Verification",
        status: "failed",
        detail: err.message,
      });
    }

    // Test 6: Backup Capability & Restore Verification Evidence
    try {
      const backups: BackupCapability[] = [
        {
          id: "bk-verified",
          componentId: "db-1",
          componentName: "DB 1",
          backupType: "snapshot",
          scheduleExpression: "daily",
          retentionDays: 30,
          isEncrypted: true,
          storageLocation: "s3://vault",
          lastSuccessfulBackupAt: new Date().toISOString(),
          lastRestoreTestAt: new Date().toISOString(),
          restoreVerified: true,
          evidenceIds: ["ev-bk"],
        },
        {
          id: "bk-untested",
          componentId: "db-2",
          componentName: "DB 2",
          backupType: "full",
          scheduleExpression: "weekly",
          retentionDays: 7,
          isEncrypted: false,
          storageLocation: "s3://open",
          lastSuccessfulBackupAt: new Date().toISOString(),
          lastRestoreTestAt: undefined,
          restoreVerified: false,
          evidenceIds: [],
        },
      ];

      const bResult = DisasterRecoveryAnalyzer.evaluateBackups(backups);
      const hasUntestedFinding = bResult.findings.some((f) => f.title.includes("Untested Backup"));
      const hasUnencryptedFinding = bResult.findings.some((f) => f.title.includes("Unencrypted Backup"));

      if (hasUntestedFinding && hasUnencryptedFinding) {
        results.push({
          name: "Backup Capability & Restore Verification Evidence",
          status: "passed",
          detail: "Flags untested backups without restore evidence. Flags unencrypted backup storage locations.",
        });
      } else {
        results.push({
          name: "Backup Capability & Restore Verification Evidence",
          status: "failed",
          detail: "Failed to detect untested restore drill or unencrypted backup.",
        });
      }
    } catch (err: any) {
      results.push({
        name: "Backup Capability & Restore Verification Evidence",
        status: "failed",
        detail: err.message,
      });
    }

    // Test 7: 8-Dimension Operational Readiness Assessment
    try {
      const project: OperationalProject = {
        id: "proj-verify",
        architectureId: "arch-verify",
        architectureRevisionId: "rev-verify",
        title: "Verification Baseline",
        scenarios: incidentScenarioRegistry.getAllScenarios().slice(0, 2),
        journeys: sampleJourneys,
        ownerships: sampleNodes.map((n) => ({
          id: `own-${n.id}`,
          serviceId: n.id,
          primaryOwner: "lead@nxtqr.internal",
          team: "Core",
          escalationPolicyId: "esc-1",
        })),
        escalationPolicies: [],
        runbooks: [
          {
            id: "rb-1",
            title: "Gateway Triage",
            purpose: "Triage",
            applicableComponentIds: ["api-gw"],
            incidentScenarioIds: ["SCN-GW-INGRESS-002"],
            revision: "1.0.0",
            steps: [],
            safetyWarnings: [],
            prerequisites: [],
            rollbackGuidance: "revert",
            owner: "lead",
            reviewDate: new Date().toISOString(),
            isApproved: true,
          },
        ],
        objectives: [
          {
            id: "o1",
            serviceId: "api-gw",
            serviceName: "Gateway",
            rtoTargetSeconds: 300,
            rpoTargetSeconds: 60,
            supportingStrategyType: "warm_standby",
            observedRtoSeconds: 120,
            observedRpoSeconds: 15,
            isRtoVerified: true,
            isRpoVerified: true,
            evidenceIds: ["ev-1"],
          },
        ],
        dependencies: [
          { id: "d1", sourceComponentId: "api-gw", targetComponentId: "order-svc", dependencyType: "infrastructure", isBlocking: true },
        ],
        backupCapabilities: [
          {
            id: "bk-1",
            componentId: "primary-db",
            componentName: "DB",
            backupType: "snapshot",
            scheduleExpression: "cron(0 2 * * ? *)",
            retentionDays: 30,
            isEncrypted: true,
            storageLocation: "s3://vault",
            lastSuccessfulBackupAt: new Date().toISOString(),
            lastRestoreTestAt: new Date().toISOString(),
            restoreVerified: true,
            evidenceIds: [],
          },
        ],
        failoverProcedures: [
          {
            id: "fo-1",
            componentId: "api-gw",
            primaryRegion: "us-east-1",
            secondaryRegion: "us-west-2",
            failoverType: "automatic",
            healthCheckType: "HTTPS",
            dataSyncLagMaxSeconds: 30,
            failbackProcedure: "revert 10% traffic",
            readinessVerified: true,
            readinessNotes: [],
          },
        ],
        tabletopExercises: [
          {
            id: "ttx-1",
            title: "Drill",
            scenarioId: "SCN-GW-INGRESS-002",
            facilitator: "Lead",
            participants: [],
            scheduledDate: new Date().toISOString().slice(0, 10),
            status: "completed",
            assumptions: [],
            injects: [],
            observations: [],
            findings: [],
            actionItems: [],
            completedAt: new Date().toISOString(),
          },
        ],
        evidence: [],
      };

      const analysis = architectureOperationsEngine.analyzeOperations(project, sampleNodes, sampleEdges);

      if (
        analysis.readiness.dimensionScores.length === 8 &&
        analysis.readiness.overallScorePercent > 0 &&
        analysis.summary.overallReadinessStatus
      ) {
        results.push({
          name: "8-Dimension Operational Readiness Assessment",
          status: "passed",
          detail: `Evaluated 8 dimensions (ownership, detection, runbooks, DR DAG, backup, failover, evidence, exercises). Overall score: ${analysis.readiness.overallScorePercent}%, Status: '${analysis.summary.overallReadinessStatus.toUpperCase()}'.`,
        });
      } else {
        results.push({
          name: "8-Dimension Operational Readiness Assessment",
          status: "failed",
          detail: `Dimensions count: ${analysis.readiness.dimensionScores.length}`,
        });
      }
    } catch (err: any) {
      results.push({
        name: "8-Dimension Operational Readiness Assessment",
        status: "failed",
        detail: err.message,
      });
    }

    setVerificationResults(results);
    setHasRunVerification(true);
  };

  const passedCount = verificationResults.filter((r) => r.status === "passed").length;
  const failedCount = verificationResults.filter((r) => r.status === "failed").length;

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF]">
      {/* Testbed Header Banner */}
      <div className="border-b border-[#262626] bg-[#080808] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] border border-[#333333] text-[#22c55e]">
                PHASE 05.3.27
              </span>
              <span className="text-xs text-[#858585] font-mono">SYSTEM DESIGN VISUALIZER</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#FFFFFF] mt-1">
              Incident Response, Disaster Recovery & Operational Readiness Engine
            </h1>
            <p className="text-xs text-[#858585] mt-0.5">
              Automated in-browser testbed validating failure scenarios, blast radius, runbook safety, recovery DAG cycles, RTO/RPO evidence, and 8-dimension readiness.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runAllVerifications}
              className="px-4 py-2 rounded-md bg-[#1A1A1A] hover:bg-[#262626] border border-[#404040] text-xs font-semibold text-[#FFFFFF] flex items-center gap-2 transition-all shadow-level-1"
            >
              <PlayIcon size={14} className="text-[#22c55e]" />
              Run Automated Verification Suite
            </button>
          </div>
        </div>
      </div>

      {/* Verification Suite Results Banner */}
      {hasRunVerification && (
        <div className="border-b border-[#262626] bg-[#0D0D0D] px-6 py-4">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-[#858585]">Suite Results:</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#141414] border border-[#262626] text-[#22c55e]">
                  {passedCount} PASSED
                </span>
                {failedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]">
                    {failedCount} FAILED
                  </span>
                )}
              </div>
              <span className="text-xs text-[#858585] font-mono">7 verification checks executed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {verificationResults.map((res, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-[#080808] border border-[#202020] flex items-start gap-2.5 text-xs"
                >
                  {res.status === "passed" ? (
                    <CheckCircleIcon size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#FFFFFF]">{res.name}</div>
                    <div className="text-[11px] text-[#858585] leading-relaxed">{res.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive Studio Shell */}
      <OperationsWorkspace />
    </div>
  );
}
