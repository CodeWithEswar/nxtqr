/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Deterministic Test Runner & Four-State Evaluator
 */

import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  ArchitectureTest,
  VerificationEvidence,
  VerificationResult,
  VerificationRunSummary,
  TestSeverity,
} from "../contracts/verification.types";
import { VerificationApplicabilityEvaluator } from "./applicability";
import { AssertionInterpreter } from "./assertion-interpreter";
import { VerificationEvidenceResolver } from "./evidence-resolver";

export interface TestRunnerOptions {
  tests: ArchitectureTest[];
  nodes: BaseNode[];
  edges: BaseEdge[];
  evidenceCatalog: VerificationEvidence[];
  engineFindings?: Array<{ engine: string; severity: TestSeverity; description: string }>;
  architectureRevisionId?: string;
  evaluatorVersion?: string;
  environment?: string;
}

export class TestRunner {
  public static readonly EVALUATOR_VERSION = "1.0.0";
  private static resultCache = new Map<string, VerificationResult>();

  /**
   * Deterministically runs a suite or array of tests against an immutable architecture snapshot.
   */
  public static runTests(options: TestRunnerOptions): {
    results: VerificationResult[];
    summary: VerificationRunSummary;
  } {
    const revisionId = options.architectureRevisionId || "rev-current";
    const evaluatorVersion = options.evaluatorVersion || this.EVALUATOR_VERSION;
    const environment = options.environment || "production";
    const overallStartTime = performance.now();

    const results: VerificationResult[] = [];

    for (const test of options.tests) {
      const testStart = performance.now();

      // Check cache key
      const cacheKey = `${revisionId}:${test.id}:${test.version}:${evaluatorVersion}:${options.evidenceCatalog.length}`;
      if (this.resultCache.has(cacheKey)) {
        results.push(this.resultCache.get(cacheKey)!);
        continue;
      }

      // 1. Evaluate Applicability
      const applicability = VerificationApplicabilityEvaluator.evaluateApplicability(
        test,
        options.nodes,
        environment
      );

      if (applicability.isApplicable === false) {
        const notApplicableResult: VerificationResult = {
          id: `res-${test.id}-${Date.now()}`,
          testId: test.id,
          testVersion: test.version,
          architectureRevisionId: revisionId,
          status: "not_applicable",
          applicabilityReason: applicability.reason,
          explanation: `Test skipped: ${applicability.reason}`,
          evidenceIds: [],
          affectedComponentIds: [],
          evaluatorVersion,
          evaluatedAt: new Date().toISOString(),
          durationMs: Math.max(1, Math.round(performance.now() - testStart)),
        };
        this.resultCache.set(cacheKey, notApplicableResult);
        results.push(notApplicableResult);
        continue;
      }

      if (applicability.isApplicable === "unknown") {
        const unknownResult: VerificationResult = {
          id: `res-${test.id}-${Date.now()}`,
          testId: test.id,
          testVersion: test.version,
          architectureRevisionId: revisionId,
          status: "unknown",
          applicabilityReason: applicability.reason,
          explanation: `Applicability undetermined: ${applicability.reason}`,
          evidenceIds: [],
          affectedComponentIds: [],
          evaluatorVersion,
          evaluatedAt: new Date().toISOString(),
          durationMs: Math.max(1, Math.round(performance.now() - testStart)),
        };
        this.resultCache.set(cacheKey, unknownResult);
        results.push(unknownResult);
        continue;
      }

      // 2. Validate Required Evidence Freshness
      if (test.requiredEvidenceTypes.length > 0) {
        const evidenceEvals = VerificationEvidenceResolver.evaluateEvidence(
          test.requiredEvidenceTypes,
          options.evidenceCatalog
        );

        const missingRequired = evidenceEvals.filter((e) => !e.isSupplied);
        if (missingRequired.length > 0) {
          const evidenceResult: VerificationResult = {
            id: `res-${test.id}-${Date.now()}`,
            testId: test.id,
            testVersion: test.version,
            architectureRevisionId: revisionId,
            status: "unknown",
            explanation: `Missing required evidence: ${missingRequired.map((m) => m.evidenceType).join(", ")}. Cannot verify without evidence.`,
            evidenceIds: [],
            affectedComponentIds: applicability.targetNodes.map((n) => n.id),
            evaluatorVersion,
            evaluatedAt: new Date().toISOString(),
            durationMs: Math.max(1, Math.round(performance.now() - testStart)),
          };
          this.resultCache.set(cacheKey, evidenceResult);
          results.push(evidenceResult);
          continue;
        }

        const staleRequired = evidenceEvals.filter((e) => !e.isFresh);
        if (staleRequired.length > 0) {
          const staleResult: VerificationResult = {
            id: `res-${test.id}-${Date.now()}`,
            testId: test.id,
            testVersion: test.version,
            architectureRevisionId: revisionId,
            status: "fail",
            explanation: `Required evidence is stale: ${staleRequired.map((s) => s.notes.join("; ")).join(" | ")}`,
            evidenceIds: staleRequired.flatMap((s) => s.evidenceItems.map((e) => e.id)),
            affectedComponentIds: applicability.targetNodes.map((n) => n.id),
            evaluatorVersion,
            evaluatedAt: new Date().toISOString(),
            durationMs: Math.max(1, Math.round(performance.now() - testStart)),
          };
          this.resultCache.set(cacheKey, staleResult);
          results.push(staleResult);
          continue;
        }
      }

      // 3. Evaluate Assertion AST across applicable components
      const targetNodes =
        applicability.targetNodes.length > 0 ? applicability.targetNodes : [undefined as any];

      let allPassed = true;
      let hasUnknown = false;
      const reasons: string[] = [];
      const collectedEvidenceIds: string[] = [];
      const affectedComponents: string[] = [];

      for (const targetNode of targetNodes) {
        const astResult = AssertionInterpreter.evaluate(test.assertion, {
          targetNode,
          nodes: options.nodes,
          edges: options.edges,
          evidenceCatalog: options.evidenceCatalog,
          engineFindings: options.engineFindings,
        });

        if (astResult.evidenceIds.length > 0) {
          collectedEvidenceIds.push(...astResult.evidenceIds);
        }
        if (astResult.affectedComponentIds.length > 0) {
          affectedComponents.push(...astResult.affectedComponentIds);
        }

        if (astResult.isUnknown) {
          hasUnknown = true;
          reasons.push(
            targetNode
              ? `[${targetNode.id}] Unknown: ${astResult.reason}`
              : `Unknown: ${astResult.reason}`
          );
        } else if (!astResult.passed) {
          allPassed = false;
          reasons.push(
            targetNode
              ? `[${targetNode.id}] Failed: ${astResult.reason}`
              : `Failed: ${astResult.reason}`
          );
        } else {
          reasons.push(
            targetNode
              ? `[${targetNode.id}] Passed: ${astResult.reason}`
              : `Passed: ${astResult.reason}`
          );
        }
      }

      let finalStatus: VerificationResult["status"] = "pass";
      if (hasUnknown) {
        finalStatus = "unknown";
      } else if (!allPassed) {
        finalStatus = "fail";
      }

      const evalResult: VerificationResult = {
        id: `res-${test.id}-${Date.now()}`,
        testId: test.id,
        testVersion: test.version,
        architectureRevisionId: revisionId,
        status: finalStatus,
        explanation: reasons.slice(0, 3).join("; "),
        evidenceIds: Array.from(new Set(collectedEvidenceIds)),
        affectedComponentIds: Array.from(new Set(affectedComponents)),
        evaluatorVersion,
        evaluatedAt: new Date().toISOString(),
        durationMs: Math.max(1, Math.round(performance.now() - testStart)),
      };

      this.resultCache.set(cacheKey, evalResult);
      results.push(evalResult);
    }

    const totalDuration = Math.round(performance.now() - overallStartTime);

    // Compute Summary
    const passedCount = results.filter((r) => r.status === "pass").length;
    const failedCount = results.filter((r) => r.status === "fail").length;
    const unknownCount = results.filter((r) => r.status === "unknown").length;
    const naCount = results.filter((r) => r.status === "not_applicable").length;
    const totalApplicable = passedCount + failedCount + unknownCount;
    const passRate =
      totalApplicable > 0 ? Math.round((passedCount / totalApplicable) * 100) : 100;

    const summary: VerificationRunSummary = {
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      unknown: unknownCount,
      notApplicable: naCount,
      passRatePercent: passRate,
      executionDurationMs: totalDuration,
    };

    return { results, summary };
  }

  public static clearCache(): void {
    this.resultCache.clear();
  }
}
