/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Regression Detection & Impact Classifier
 */

import type {
  VerificationRun,
  RegressionDifference,
  RegressionAnalysisResult,
  RegressionType,
  VerificationRegressionClassification,
} from "../contracts/verification.types";

export class RegressionAnalyzer {
  /**
   * Compares an authoritative baseline verification run against a candidate run to detect regressions.
   */
  public static compareRuns(
    baselineRun: VerificationRun,
    candidateRun: VerificationRun,
    baselineId = "baseline-001"
  ): RegressionAnalysisResult {
    const baselineMap = new Map(baselineRun.results.map((r) => [r.testId, r]));
    const candidateMap = new Map(candidateRun.results.map((r) => [r.testId, r]));

    const regressions: RegressionDifference[] = [];
    const allAffectedComponents = new Set<string>();

    for (const [testId, candRes] of candidateMap.entries()) {
      const baseRes = baselineMap.get(testId);

      if (!baseRes) {
        // Test only in candidate: if failing, note as new failure
        if (candRes.status === "fail") {
          regressions.push({
            id: `reg-${testId}-${Date.now()}`,
            type: "new_failure",
            testId,
            testTitle: `Test ${testId}`,
            candidateStatus: candRes.status,
            classification: "test_definition_change",
            description: `New test added in candidate run failed: ${candRes.explanation}`,
            affectedComponentIds: candRes.affectedComponentIds,
          });
          candRes.affectedComponentIds.forEach((c) => allAffectedComponents.add(c));
        }
        continue;
      }

      // Check if status changed
      if (baseRes.status !== candRes.status) {
        let type: RegressionType = "new_failure";
        let classification: VerificationRegressionClassification = "architecture_change";
        let desc = "";

        if (baseRes.status === "pass" && candRes.status === "fail") {
          type = "new_failure";
          classification =
            baseRes.testVersion !== candRes.testVersion
              ? "test_definition_change"
              : "architecture_change";
          desc = `Architectural regression: test passed in baseline but failed in candidate (${candRes.explanation}).`;
        } else if (baseRes.status === "fail" && candRes.status === "pass") {
          type = "resolved_failure";
          classification = "architecture_change";
          desc = `Resolved failure: test failed in baseline but passed in candidate (${candRes.explanation}).`;
        } else if (candRes.status === "unknown" && baseRes.status !== "unknown") {
          type = "new_unknown";
          classification = "evidence_change";
          desc = `New unknown outcome: previously conclusive (${baseRes.status}), now undetermined (${candRes.explanation}).`;
        } else if (baseRes.status === "not_applicable" || candRes.status === "not_applicable") {
          type = "changed_applicability";
          classification = "architecture_change";
          desc = `Applicability changed from ${baseRes.status} to ${candRes.status}.`;
        }

        candRes.affectedComponentIds.forEach((c) => allAffectedComponents.add(c));

        regressions.push({
          id: `reg-${testId}-${Date.now()}`,
          type,
          testId,
          testTitle: `Test ${testId}`,
          baselineStatus: baseRes.status,
          candidateStatus: candRes.status,
          classification,
          description: desc,
          affectedComponentIds: candRes.affectedComponentIds,
        });
      }
    }

    const newFailuresCount = regressions.filter((r) => r.type === "new_failure").length;
    const resolvedFailuresCount = regressions.filter((r) => r.type === "resolved_failure").length;
    const newUnknownsCount = regressions.filter((r) => r.type === "new_unknown").length;

    return {
      baselineId,
      baselineRunId: baselineRun.id,
      candidateRunId: candidateRun.id,
      regressions,
      hasRegressions: newFailuresCount > 0,
      summary: {
        newFailuresCount,
        resolvedFailuresCount,
        newUnknownsCount,
        affectedComponents: Array.from(allAffectedComponents),
      },
    };
  }
}
