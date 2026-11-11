"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Interactive Verification Testbed Page
 */

import React, { useState } from "react";
import { VerificationWorkspace } from "@/features/system-design/verification";
import {
  AssertionInterpreter,
  TestRunner,
  VerificationEvidenceResolver,
  SuiteRegistry,
  RegressionAnalyzer,
  GateEvaluator,
  architectureVerificationEngine,
  STANDARD_ARCHITECTURE_TESTS,
  STANDARD_READINESS_GATES,
  type VerificationProject,
  type VerificationEvidence,
  type ArchitectureTest,
  type ReadinessGate,
  type GateException,
  type VerificationRun,
} from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { PlayIcon, CheckCircleIcon, AlertCircleIcon } from "@nxtqr/icons";

export default function ArchitectureVerificationTestbedPage() {
  const [verificationResults, setVerificationResults] = useState<
    Array<{ name: string; status: "passed" | "failed"; detail: string }>
  >([]);
  const [hasRunVerification, setHasRunVerification] = useState(false);

  const sampleNodes: BaseNode[] = [
    {
      id: "api-gw",
      type: "custom",
      position: { x: 50, y: 100 },
      data: {
        label: "API Gateway",
        nodeType: "gateway",
        rateLimit: 10000,
        tlsEnforced: true,
        security: { authRequired: true },
      },
    },
    {
      id: "order-svc",
      type: "custom",
      position: { x: 250, y: 100 },
      data: { label: "Order Service", nodeType: "service", deadLetterQueue: "dlq-orders" },
    },
    {
      id: "primary-db",
      type: "custom",
      position: { x: 450, y: 100 },
      data: {
        label: "PostgreSQL Primary",
        nodeType: "database",
        region: "us-east-1",
        backupPolicy: { type: "snapshot" },
      },
    },
  ];

  const sampleEdges: BaseEdge[] = [
    { id: "e1", source: "api-gw", target: "order-svc", type: "smoothstep", data: {} },
    { id: "e2", source: "order-svc", target: "primary-db", type: "smoothstep", data: {} },
  ];

  const sampleEvidence: VerificationEvidence[] = [
    {
      id: "ev-topo",
      evidenceType: "architecture_topology",
      source: "snapshot",
      owner: "arch",
      architectureRevisionId: "rev-1",
      observedAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
      contentHash: "sha256:111",
      freshnessWindowHours: 48,
      isVerified: true,
    },
    {
      id: "ev-sec",
      evidenceType: "security_audit_log",
      source: "siem",
      owner: "sec",
      architectureRevisionId: "rev-1",
      observedAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
      contentHash: "sha256:222",
      freshnessWindowHours: 24,
      isVerified: true,
    },
    {
      id: "ev-db",
      evidenceType: "backup_verification",
      source: "vault",
      owner: "data",
      architectureRevisionId: "rev-1",
      observedAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
      contentHash: "sha256:333",
      freshnessWindowHours: 24,
      isVerified: true,
    },
  ];

  const runAllChecks = () => {
    const checks: Array<{ name: string; status: "passed" | "failed"; detail: string }> = [];

    try {
      // Check 1: Assertion AST Evaluation
      const astResult = AssertionInterpreter.evaluate(
        {
          operator: "all",
          children: [
            { operator: "exists", path: "data.rateLimit" },
            { operator: "equals", path: "data.tlsEnforced", targetValue: true },
          ],
        },
        {
          targetNode: sampleNodes[0],
          nodes: sampleNodes,
          edges: sampleEdges,
          evidenceCatalog: sampleEvidence,
        }
      );

      checks.push({
        name: "Check 1: Declarative Assertion AST Evaluator",
        status: astResult.passed ? "passed" : "failed",
        detail: astResult.passed
          ? `Passed composite AST evaluation with zero code execution (${astResult.reason})`
          : `Failed AST check: ${astResult.reason}`,
      });
    } catch (e: any) {
      checks.push({
        name: "Check 1: Declarative Assertion AST Evaluator",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    try {
      // Check 2: Four-State Runner
      const testDefs: ArchitectureTest[] = [
        {
          id: "T-PASS",
          projectId: "p1",
          version: "1.0.0",
          title: "DB Backup Test",
          description: "Database must have backup policy",
          category: "database",
          scope: { level: "component", targetIds: ["primary-db"] },
          assertion: { operator: "exists", path: "data.backupPolicy" },
          severity: "critical",
          status: "active",
          requirementIds: [],
          requiredEvidenceTypes: ["backup_verification"],
          createdBy: "test",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "T-UNKNOWN",
          projectId: "p1",
          version: "1.0.0",
          title: "Missing Evidence Test",
          description: "Requires missing compliance report",
          category: "security",
          scope: { level: "component", targetIds: ["api-gw"] },
          assertion: { operator: "exists", path: "data.rateLimit" },
          severity: "high",
          status: "active",
          requirementIds: [],
          requiredEvidenceTypes: ["missing_pen_test_report"],
          createdBy: "test",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const runRes = TestRunner.runTests({
        tests: testDefs,
        nodes: sampleNodes,
        edges: sampleEdges,
        evidenceCatalog: sampleEvidence,
      });

      const passStatus = runRes.results.find((r) => r.testId === "T-PASS")?.status;
      const unknownStatus = runRes.results.find((r) => r.testId === "T-UNKNOWN")?.status;

      checks.push({
        name: "Check 2: Four-State Deterministic Test Runner",
        status: passStatus === "pass" && unknownStatus === "unknown" ? "passed" : "failed",
        detail: `Verified four states (T-PASS: ${passStatus}, T-UNKNOWN: ${unknownStatus}, pass rate: ${runRes.summary.passRatePercent}%)`,
      });
    } catch (e: any) {
      checks.push({
        name: "Check 2: Four-State Deterministic Test Runner",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    try {
      // Check 3: Evidence Freshness & Stale Detection
      const staleCatalog: VerificationEvidence[] = [
        {
          id: "ev-stale",
          evidenceType: "disaster_recovery_drill",
          source: "vault",
          owner: "sre",
          architectureRevisionId: "rev-1",
          observedAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:stale",
          freshnessWindowHours: 24,
          isVerified: true,
        },
      ];

      const evEval = VerificationEvidenceResolver.evaluateEvidence(["disaster_recovery_drill"], staleCatalog);
      const isStale = evEval[0].isSupplied && !evEval[0].isFresh;

      checks.push({
        name: "Check 3: Evidence Freshness & Stale Audit",
        status: isStale ? "passed" : "failed",
        detail: isStale
          ? `Detected stale evidence: age exceeds window (${evEval[0].notes[0]})`
          : "Failed to detect stale evidence",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 3: Evidence Freshness & Stale Audit",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    try {
      // Check 4: Suite Acyclicity
      const acyclic = SuiteRegistry.validateSuiteAcyclicity([
        {
          id: "SUITE-1",
          projectId: "p1",
          version: "1.0.0",
          title: "Base Suite",
          description: "Base",
          category: "core",
          testIds: [],
          dependencySuiteIds: [],
          status: "active",
          createdBy: "arch",
          createdAt: new Date().toISOString(),
        },
        {
          id: "SUITE-2",
          projectId: "p1",
          version: "1.0.0",
          title: "Derived Suite",
          description: "Derived",
          category: "extended",
          testIds: [],
          dependencySuiteIds: ["SUITE-1"],
          status: "active",
          createdBy: "arch",
          createdAt: new Date().toISOString(),
        },
      ]);

      checks.push({
        name: "Check 4: Test Suite Dependency DAG & Acyclicity",
        status: !acyclic.hasCycles ? "passed" : "failed",
        detail: !acyclic.hasCycles
          ? "Verified acyclic DAG dependencies across test suites"
          : "Unexpected cycle in suite graph",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 4: Test Suite Dependency DAG & Acyclicity",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    try {
      // Check 5: Regression Detection
      const baseRun: VerificationRun = {
        id: "base-run",
        projectId: "p1",
        architectureRevisionId: "rev-base",
        status: "completed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        evaluatorVersion: "1.0.0",
        results: [
          {
            id: "r1",
            testId: "T-REG",
            testVersion: "1.0.0",
            architectureRevisionId: "rev-base",
            status: "pass",
            explanation: "Passed",
            evidenceIds: [],
            affectedComponentIds: ["api-gw"],
            evaluatorVersion: "1.0.0",
            evaluatedAt: new Date().toISOString(),
            durationMs: 1,
          },
        ],
        summary: { total: 1, passed: 1, failed: 0, unknown: 0, notApplicable: 0, passRatePercent: 100, executionDurationMs: 1 },
      };

      const candRun: VerificationRun = {
        ...baseRun,
        id: "cand-run",
        results: [
          {
            ...baseRun.results[0],
            status: "fail", // Pass -> Fail regression!
            explanation: "Auth broke in candidate",
          },
        ],
      };

      const diff = RegressionAnalyzer.compareRuns(baseRun, candRun, "baseline-test");
      const hasNewFailure = diff.hasRegressions && diff.summary.newFailuresCount === 1;

      checks.push({
        name: "Check 5: Baseline vs Candidate Regression Detection",
        status: hasNewFailure ? "passed" : "failed",
        detail: hasNewFailure
          ? `Detected 1 architectural regression (test T-REG: ${diff.regressions[0].description})`
          : "Failed to detect regression",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 5: Baseline vs Candidate Regression Detection",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    try {
      // Check 6: Five-State Readiness Gate & Exceptions
      const testGate: ReadinessGate = {
        id: "GATE-01",
        projectId: "p1",
        version: "1.0.0",
        title: "Deploy Gate",
        description: "Deploy gate",
        category: "production_readiness",
        requiredTestIds: ["TEST-X"],
        requiredSuiteIds: [],
        requiredEvidenceTypes: [],
        blockingRules: { allowUnknown: false, blockOnAnyFailure: true, requireFreshEvidence: true, minPassRatePercent: 100 },
        status: "active",
      };

      const exception: GateException = {
        id: "EX-01",
        gateId: "GATE-01",
        testId: "TEST-X",
        justification: "Approved exception",
        compensatingControls: "Edge proxy guard",
        approvedBy: "vp-eng",
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        status: "active",
      };

      const gateEval = GateEvaluator.evaluateGates({
        gates: [testGate],
        results: [
          {
            id: "rx",
            testId: "TEST-X",
            testVersion: "1.0.0",
            architectureRevisionId: "rev-1",
            status: "fail",
            explanation: "Failed condition",
            evidenceIds: [],
            affectedComponentIds: [],
            evaluatorVersion: "1.0.0",
            evaluatedAt: new Date().toISOString(),
            durationMs: 1,
          },
        ],
        exceptions: [exception],
      });

      const isApprovedWithException = gateEval[0].status === "approved_with_exception";

      checks.push({
        name: "Check 6: Five-State Readiness Gate & Authorized Exceptions",
        status: isApprovedWithException ? "passed" : "failed",
        detail: isApprovedWithException
          ? `Correctly evaluated to 'approved_with_exception' without mutating underlying test failure`
          : `Unexpected gate status: ${gateEval[0].status}`,
      });
    } catch (e: any) {
      checks.push({
        name: "Check 6: Five-State Readiness Gate & Authorized Exceptions",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    try {
      // Check 7: Full Engine Master Pipeline
      const project: VerificationProject = {
        id: "p-master",
        name: "Master Verification Project",
        requirements: [
          {
            id: "REQ-01",
            projectId: "p-master",
            version: "1.0.0",
            title: "Gateway Presence",
            description: "Gateway requirement",
            category: "graph_topology",
            criticality: "critical",
            owner: "arch",
            scope: { level: "architecture" },
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        tests: STANDARD_ARCHITECTURE_TESTS.slice(0, 3),
        suites: [],
        evidenceCatalog: sampleEvidence,
        baselines: [],
        gates: STANDARD_READINESS_GATES.slice(0, 1),
        exceptions: [],
        runs: [],
      };

      const analysis = architectureVerificationEngine.verifyArchitecture(
        project,
        sampleNodes,
        sampleEdges
      );

      const hasRun = analysis.run.results.length === 3;
      const hasCoverage = analysis.coverage.totalRequirementsCount === 1;

      checks.push({
        name: "Check 7: Master Verification Engine Pipeline",
        status: hasRun && hasCoverage ? "passed" : "failed",
        detail: hasRun && hasCoverage
          ? `Successfully orchestrated 3 tests, gate evaluations, traceability, and ${analysis.coverage.requirementCoveragePercent}% coverage`
          : "Pipeline output missing required verification properties",
      });
    } catch (e: any) {
      checks.push({
        name: "Check 7: Master Verification Engine Pipeline",
        status: "failed",
        detail: `Error: ${e.message}`,
      });
    }

    setVerificationResults(checks);
    setHasRunVerification(true);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col">
      {/* Verification Suite Test Runner Header */}
      <div className="p-6 border-b border-[#262626] bg-[#080808] max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-mono text-[#858585]">
              NXTQR Architecture Verification Engine · Phase 05.3.28
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#FFFFFF] mt-1">
              Architecture Testing, Verification & Readiness Gates Testbed
            </h1>
            <p className="text-xs text-[#858585] mt-1.5 max-w-3xl leading-relaxed">
              Deterministic verification layer: declarative assertion AST, four-state evaluation (pass, fail, unknown, not_applicable), five-state release readiness gates, evidence freshness, regression detection, and requirement traceability.
            </p>
          </div>

          <button
            onClick={runAllChecks}
            className="px-4 py-2 rounded-md bg-[#1A1A1A] hover:bg-[#262626] border border-[#404040] text-xs font-semibold text-[#FFFFFF] flex items-center gap-2 transition-all shadow-level-1 shrink-0"
          >
            <PlayIcon size={14} className="text-[#22c55e]" />
            Execute Verification Self-Test
          </button>
        </div>

        {/* Verification Results Checklist */}
        {hasRunVerification && (
          <div className="mt-6 pt-5 border-t border-[#1A1A1A] space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
              Automated Verification Check Results ({verificationResults.filter((r) => r.status === "passed").length}/
              {verificationResults.length} Passed)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {verificationResults.map((check, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-start gap-2.5 text-xs"
                >
                  {check.status === "passed" ? (
                    <CheckCircleIcon size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircleIcon size={16} className="text-[#ef4444] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#FFFFFF]">{check.name}</div>
                    <div className="text-[11px] text-[#858585] leading-relaxed font-mono">
                      {check.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Embedded Studio Workbench */}
      <div className="flex-1">
        <VerificationWorkspace />
      </div>
    </div>
  );
}

