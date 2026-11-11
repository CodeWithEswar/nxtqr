import { describe, it, expect } from "vitest";
import { RegressionAnalyzer } from "../verification/analysis/regression-analyzer";
import type { VerificationRun } from "../verification/contracts/verification.types";

describe("Phase 05.3.28: Regression Detection & Impact Classifier", () => {
  const baselineRun: VerificationRun = {
    id: "run-baseline-001",
    projectId: "p1",
    architectureRevisionId: "rev-1",
    status: "completed",
    startedAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T00:00:05Z",
    evaluatorVersion: "1.0.0",
    results: [
      {
        id: "r1",
        testId: "TEST-SEC-01",
        testVersion: "1.0.0",
        architectureRevisionId: "rev-1",
        status: "pass",
        explanation: "Auth enabled",
        evidenceIds: [],
        affectedComponentIds: ["api-gw"],
        evaluatorVersion: "1.0.0",
        evaluatedAt: "2026-01-01T00:00:01Z",
        durationMs: 2,
      },
      {
        id: "r2",
        testId: "TEST-REL-02",
        testVersion: "1.0.0",
        architectureRevisionId: "rev-1",
        status: "fail",
        explanation: "Missing backup",
        evidenceIds: [],
        affectedComponentIds: ["primary-db"],
        evaluatorVersion: "1.0.0",
        evaluatedAt: "2026-01-01T00:00:02Z",
        durationMs: 2,
      },
    ],
    summary: {
      total: 2,
      passed: 1,
      failed: 1,
      unknown: 0,
      notApplicable: 0,
      passRatePercent: 50,
      executionDurationMs: 4,
    },
  };

  it("detects new failures (pass -> fail) and resolved failures (fail -> pass)", () => {
    const candidateRun: VerificationRun = {
      id: "run-candidate-002",
      projectId: "p1",
      architectureRevisionId: "rev-2",
      status: "completed",
      startedAt: "2026-01-02T00:00:00Z",
      completedAt: "2026-01-02T00:00:05Z",
      evaluatorVersion: "1.0.0",
      results: [
        {
          id: "r1-cand",
          testId: "TEST-SEC-01",
          testVersion: "1.0.0",
          architectureRevisionId: "rev-2",
          status: "fail", // Was pass in baseline -> New Failure regression!
          explanation: "Auth disabled in candidate",
          evidenceIds: [],
          affectedComponentIds: ["api-gw"],
          evaluatorVersion: "1.0.0",
          evaluatedAt: "2026-01-02T00:00:01Z",
          durationMs: 2,
        },
        {
          id: "r2-cand",
          testId: "TEST-REL-02",
          testVersion: "1.0.0",
          architectureRevisionId: "rev-2",
          status: "pass", // Was fail in baseline -> Resolved failure!
          explanation: "Backup enabled in candidate",
          evidenceIds: [],
          affectedComponentIds: ["primary-db"],
          evaluatorVersion: "1.0.0",
          evaluatedAt: "2026-01-02T00:00:02Z",
          durationMs: 2,
        },
      ],
      summary: {
        total: 2,
        passed: 1,
        failed: 1,
        unknown: 0,
        notApplicable: 0,
        passRatePercent: 50,
        executionDurationMs: 4,
      },
    };

    const diff = RegressionAnalyzer.compareRuns(baselineRun, candidateRun, "base-1");
    expect(diff.hasRegressions).toBe(true);
    expect(diff.summary.newFailuresCount).toBe(1);
    expect(diff.summary.resolvedFailuresCount).toBe(1);
    expect(diff.summary.affectedComponents).toContain("api-gw");

    const newFailure = diff.regressions.find((r) => r.type === "new_failure");
    expect(newFailure?.testId).toBe("TEST-SEC-01");
    expect(newFailure?.classification).toBe("architecture_change");
  });

  it("detects new unknowns when conclusive test becomes undetermined", () => {
    const candidateRun: VerificationRun = {
      ...baselineRun,
      id: "run-candidate-003",
      results: [
        {
          ...baselineRun.results[0],
          status: "unknown",
          explanation: "Audit logs missing",
        },
        baselineRun.results[1],
      ],
    };

    const diff = RegressionAnalyzer.compareRuns(baselineRun, candidateRun, "base-1");
    expect(diff.summary.newUnknownsCount).toBe(1);
    const unknownReg = diff.regressions.find((r) => r.type === "new_unknown");
    expect(unknownReg?.classification).toBe("evidence_change");
  });
});

