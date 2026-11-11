/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Master Verification & Readiness Orchestrator
 */

import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  VerificationProject,
  VerificationRun,
  VerificationAnalysisResult,
  RegressionAnalysisResult,
} from "../contracts/verification.types";
import { TestRunner } from "../evaluator/test-runner";
import { GateEvaluator } from "../evaluator/gate-evaluator";
import { RegressionAnalyzer } from "../analysis/regression-analyzer";
import { TraceabilityAnalyzer } from "../analysis/traceability-analyzer";
import { CoverageAnalyzer } from "../analysis/coverage-analyzer";

export class ArchitectureVerificationEngine {
  /**
   * Deterministically verifies an architecture snapshot against project requirements, tests, evidence, and readiness gates.
   */
  public verifyArchitecture(
    project: VerificationProject,
    nodes: BaseNode[],
    edges: BaseEdge[],
    candidateNodes?: BaseNode[],
    candidateEdges?: BaseEdge[]
  ): VerificationAnalysisResult {
    // 1. Run Tests against Active Architecture
    const activeTests = project.tests.filter((t) => t.status === "active");
    const { results, summary } = TestRunner.runTests({
      tests: activeTests,
      nodes,
      edges,
      evidenceCatalog: project.evidenceCatalog,
      architectureRevisionId: "rev-active",
    });

    const activeRun: VerificationRun = {
      id: `run-${Date.now()}`,
      projectId: project.id,
      architectureRevisionId: "rev-active",
      status: "completed",
      startedAt: new Date(Date.now() - summary.executionDurationMs).toISOString(),
      completedAt: new Date().toISOString(),
      evaluatorVersion: TestRunner.EVALUATOR_VERSION,
      results,
      summary,
    };

    // 2. Evaluate Readiness Gates
    const activeGates = project.gates.filter((g) => g.status === "active");
    const gateEvaluations = GateEvaluator.evaluateGates({
      gates: activeGates,
      results,
      exceptions: project.exceptions,
    });

    // 3. Optional Regression Analysis against Baseline or Candidate
    let regressions: RegressionAnalysisResult | undefined;

    if (candidateNodes && candidateEdges) {
      // Evaluate Candidate Architecture
      const candidateRunEval = TestRunner.runTests({
        tests: activeTests,
        nodes: candidateNodes,
        edges: candidateEdges,
        evidenceCatalog: project.evidenceCatalog,
        architectureRevisionId: "rev-candidate",
      });

      const candidateRun: VerificationRun = {
        id: `run-candidate-${Date.now()}`,
        projectId: project.id,
        architectureRevisionId: "rev-candidate",
        status: "completed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        evaluatorVersion: TestRunner.EVALUATOR_VERSION,
        results: candidateRunEval.results,
        summary: candidateRunEval.summary,
      };

      regressions = RegressionAnalyzer.compareRuns(activeRun, candidateRun, "active-vs-candidate");
    } else if (project.baselines.length > 0 && project.runs.length > 0) {
      const latestBaseline = project.baselines[project.baselines.length - 1];
      const baselineRun = project.runs.find((r) => r.id === latestBaseline.runId);
      if (baselineRun) {
        regressions = RegressionAnalyzer.compareRuns(baselineRun, activeRun, latestBaseline.id);
      }
    }

    // 4. Traceability Matrix
    const traceability = TraceabilityAnalyzer.buildTraceability(
      project.requirements,
      project.tests,
      results
    );

    // 5. Verification Coverage
    const coverage = CoverageAnalyzer.calculateCoverage(
      project.requirements,
      project.tests,
      nodes,
      project.evidenceCatalog
    );

    return {
      run: activeRun,
      gateEvaluations,
      regressions,
      traceability,
      coverage,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const architectureVerificationEngine = new ArchitectureVerificationEngine();

