/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Five-State Readiness Gate Evaluator & Exception Handler
 */

import type {
  ReadinessGate,
  GateException,
  VerificationResult,
  GateEvaluationResult,
  GateStatus,
} from "../contracts/verification.types";

export interface GateEvaluationOptions {
  gates: ReadinessGate[];
  results: VerificationResult[];
  exceptions: GateException[];
  allGates?: ReadinessGate[];
}

export class GateEvaluator {
  /**
   * Evaluates readiness gates deterministically across 5 explicit states:
   * passed, failed, blocked, unknown, approved_with_exception.
   */
  public static evaluateGates(options: GateEvaluationOptions): GateEvaluationResult[] {
    const resultMap = new Map<string, VerificationResult>();
    for (const r of options.results) {
      resultMap.set(r.testId, r);
    }

    const now = Date.now();
    const activeExceptions = options.exceptions.filter((ex) => {
      if (ex.status !== "active") return false;
      const expiry = Date.parse(ex.expiresAt);
      return isNaN(expiry) || expiry > now;
    });

    return options.gates.map((gate) => {
      const requiredTests = gate.requiredTestIds;
      const blockingReasons: string[] = [];
      const notes: string[] = [];

      let passedCount = 0;
      let failedCount = 0;
      let unknownCount = 0;
      let notApplicableCount = 0;
      let exceptedCount = 0;

      for (const testId of requiredTests) {
        const testRes = resultMap.get(testId);

        if (!testRes) {
          unknownCount++;
          blockingReasons.push(`Mandatory test '${testId}' was not executed in active run.`);
          continue;
        }

        if (testRes.status === "pass") {
          passedCount++;
        } else if (testRes.status === "not_applicable") {
          notApplicableCount++;
        } else if (testRes.status === "unknown") {
          unknownCount++;
          if (!gate.blockingRules.allowUnknown) {
            blockingReasons.push(
              `Test '${testId}' yielded unknown outcome: ${testRes.explanation}`
            );
          }
        } else if (testRes.status === "fail") {
          // Check for valid active exception
          const hasException = activeExceptions.some(
            (ex) => ex.gateId === gate.id && ex.testId === testId
          );

          if (hasException) {
            exceptedCount++;
            notes.push(`Test '${testId}' failure is covered by an active approved exception.`);
          } else {
            failedCount++;
            if (gate.blockingRules.blockOnAnyFailure) {
              blockingReasons.push(`Blocking failure on test '${testId}': ${testRes.explanation}`);
            }
          }
        }
      }

      // Check pass rate threshold
      const totalApplicable = passedCount + failedCount + unknownCount;
      const currentPassRate =
        totalApplicable > 0 ? (passedCount / totalApplicable) * 100 : 100;

      if (currentPassRate < gate.blockingRules.minPassRatePercent) {
        blockingReasons.push(
          `Pass rate ${currentPassRate.toFixed(1)}% is below required threshold ${gate.blockingRules.minPassRatePercent}%.`
        );
      }

      // Determine 5-state Gate Status
      let status: GateStatus = "passed";

      if (failedCount > 0) {
        status = "failed";
      } else if (unknownCount > 0 && !gate.blockingRules.allowUnknown) {
        status = "unknown";
      } else if (blockingReasons.length > 0) {
        status = "blocked";
      } else if (exceptedCount > 0) {
        status = "approved_with_exception";
      } else {
        status = "passed";
      }

      return {
        gateId: gate.id,
        gateVersion: gate.version,
        status,
        evaluatedAt: new Date().toISOString(),
        passedTestsCount: passedCount,
        failedTestsCount: failedCount,
        unknownTestsCount: unknownCount,
        notApplicableCount,
        activeExceptionsCount: exceptedCount,
        blockingReasons,
        notes,
      };
    });
  }
}

