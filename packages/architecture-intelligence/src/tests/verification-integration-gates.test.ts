import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { GateEvaluator } from "../verification/evaluator/gate-evaluator";
import { architectureVerificationEngine } from "../verification/engine/verification-engine";
import { STANDARD_ARCHITECTURE_TESTS } from "../verification/registry/test-registry";
import { STANDARD_READINESS_GATES } from "../verification/registry/gate-registry";
import { STANDARD_ARCHITECTURE_SUITES } from "../verification/registry/suite-registry";
import { SectionComposer } from "../reports/engine/section-composer";
import { SourceResolver } from "../reports/engine/source-resolver";
import { MarkdownExporter } from "../reports/exporters/markdown-exporter";
import { HtmlExporter } from "../reports/exporters/html-exporter";
import type {
  VerificationProject,
  ReadinessGate,
  GateException,
  VerificationResult,
} from "../verification/contracts/verification.types";

describe("Phase 05.3.28: Gate Evaluator & Full Verification Integration", () => {
  const gate: ReadinessGate = {
    id: "GATE-TEST",
    projectId: "p1",
    version: "1.0.0",
    title: "Test Gate",
    description: "Evaluates production readiness",
    category: "production_readiness",
    requiredTestIds: ["TEST-01", "TEST-02"],
    requiredSuiteIds: [],
    requiredEvidenceTypes: [],
    blockingRules: {
      allowUnknown: false,
      blockOnAnyFailure: true,
      requireFreshEvidence: true,
      minPassRatePercent: 100,
    },
    status: "active",
  };

  it("evaluates to 'passed' when all required tests pass", () => {
    const results: VerificationResult[] = [
      {
        id: "r1",
        testId: "TEST-01",
        testVersion: "1.0.0",
        architectureRevisionId: "rev-1",
        status: "pass",
        explanation: "OK",
        evidenceIds: [],
        affectedComponentIds: [],
        evaluatorVersion: "1.0.0",
        evaluatedAt: new Date().toISOString(),
        durationMs: 1,
      },
      {
        id: "r2",
        testId: "TEST-02",
        testVersion: "1.0.0",
        architectureRevisionId: "rev-1",
        status: "pass",
        explanation: "OK",
        evidenceIds: [],
        affectedComponentIds: [],
        evaluatorVersion: "1.0.0",
        evaluatedAt: new Date().toISOString(),
        durationMs: 1,
      },
    ];

    const gateEvals = GateEvaluator.evaluateGates({
      gates: [gate],
      results,
      exceptions: [],
    });

    expect(gateEvals).toHaveLength(1);
    expect(gateEvals[0].status).toBe("passed");
    expect(gateEvals[0].passedTestsCount).toBe(2);
    expect(gateEvals[0].failedTestsCount).toBe(0);
  });

  it("evaluates to 'approved_with_exception' when failing test has active approved exception", () => {
    const results: VerificationResult[] = [
      {
        id: "r1",
        testId: "TEST-01",
        testVersion: "1.0.0",
        architectureRevisionId: "rev-1",
        status: "pass",
        explanation: "OK",
        evidenceIds: [],
        affectedComponentIds: [],
        evaluatorVersion: "1.0.0",
        evaluatedAt: new Date().toISOString(),
        durationMs: 1,
      },
      {
        id: "r2",
        testId: "TEST-02",
        testVersion: "1.0.0",
        architectureRevisionId: "rev-1",
        status: "fail", // Failed!
        explanation: "Rate limiting not configured",
        evidenceIds: [],
        affectedComponentIds: ["api-gw"],
        evaluatorVersion: "1.0.0",
        evaluatedAt: new Date().toISOString(),
        durationMs: 1,
      },
    ];

    const activeException: GateException = {
      id: "ex-01",
      gateId: "GATE-TEST",
      testId: "TEST-02",
      justification: "Temporary launch exception approved by VP",
      compensatingControls: "WAF rate limit active at cloudflare edge",
      approvedBy: "vp-eng@nxtqr.internal",
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days future
      status: "active",
    };

    const gateEvals = GateEvaluator.evaluateGates({
      gates: [gate],
      results,
      exceptions: [activeException],
    });

    expect(gateEvals).toHaveLength(1);
    expect(gateEvals[0].status).toBe("approved_with_exception");
    expect(gateEvals[0].activeExceptionsCount).toBe(1);
    expect(gateEvals[0].notes[0]).toContain("covered by an active approved exception");
  });

  it("runs end-to-end verification and exports Markdown and HTML reports", () => {
    const nodes: BaseNode[] = [
      {
        id: "api-gw",
        type: "custom",
        position: { x: 0, y: 0 },
        data: {
          label: "API Gateway",
          nodeType: "gateway",
          rateLimit: 10000,
          tlsEnforced: true,
          security: { authRequired: true },
        },
      },
      {
        id: "primary-db",
        type: "custom",
        position: { x: 200, y: 0 },
        data: {
          label: "PostgreSQL Primary",
          nodeType: "database",
          region: "us-east-1",
          backupPolicy: { type: "snapshot" },
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "api-gw", target: "primary-db", type: "smoothstep", data: {} },
    ];

    const project: VerificationProject = {
      id: "p-e2e",
      name: "E2E Verification Project",
      requirements: [
        {
          id: "REQ-ARCH-001",
          projectId: "p-e2e",
          version: "1.0.0",
          title: "Ingress Gateway Existence",
          description: "All client requests enter through a gateway",
          category: "graph_topology",
          criticality: "critical",
          owner: "arch-board",
          scope: { level: "architecture" },
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tests: STANDARD_ARCHITECTURE_TESTS.slice(0, 3),
      suites: STANDARD_ARCHITECTURE_SUITES,
      evidenceCatalog: [
        {
          id: "ev-1",
          evidenceType: "backup_verification",
          source: "vault",
          owner: "data",
          architectureRevisionId: "rev-e2e",
          observedAt: new Date().toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:abc",
          freshnessWindowHours: 24,
          isVerified: true,
        },
        {
          id: "ev-2",
          evidenceType: "security_audit_log",
          source: "siem",
          owner: "sec",
          architectureRevisionId: "rev-e2e",
          observedAt: new Date().toISOString(),
          importedAt: new Date().toISOString(),
          contentHash: "sha256:def",
          freshnessWindowHours: 24,
          isVerified: true,
        },
      ],
      baselines: [],
      gates: STANDARD_READINESS_GATES,
      exceptions: [],
      runs: [],
    };

    const analysis = architectureVerificationEngine.verifyArchitecture(project, nodes, edges);
    expect(analysis.run.results.length).toBeGreaterThan(0);
    expect(analysis.gateEvaluations.length).toBeGreaterThan(0);
    expect(analysis.coverage.requirementCoveragePercent).toBeGreaterThanOrEqual(0);

    // Test Report generation with architecture_verification_and_readiness section
    const resolvedTopology = SourceResolver.resolveTopology(nodes, edges);
    const sections = SectionComposer.composeSections({
      nodes,
      edges,
      topology: resolvedTopology,
      evidence: [],
      analysisContext: { verificationProject: project },
      audience: "engineering",
      enabledKinds: ["overview", "architecture_verification_and_readiness"],
    });

    const verSection = sections.find(
      (s) => s.kind === "architecture_verification_and_readiness"
    );
    expect(verSection).toBeDefined();

    const report = {
      id: "rep-ver-test",
      projectId: "p-e2e",
      architectureId: "arch-1",
      sourceSnapshotId: "snap-1",
      graphRevision: "rev-1",
      templateId: "detailed_technical_architecture",
      templateVersion: 1,
      audience: "engineering" as const,
      title: "Verification Intelligence Report",
      status: "verified" as const,
      sections,
      evidence: [],
      assumptions: [],
      decisions: [],
      generatedAt: new Date().toISOString(),
      author: "NXTQR Engine",
      versionNumber: 1,
    };

    const mdOutput = MarkdownExporter.export(report).content;
    expect(mdOutput).toContain("Architecture Testing, Verification & Readiness Gates");
    expect(mdOutput).toContain("Release Readiness Gates");

    const htmlOutput = HtmlExporter.export(report).content;
    expect(htmlOutput).toContain("Architecture Testing, Verification &amp; Readiness Gates");
    expect(htmlOutput).toContain("Readiness Gates");
  });
});
