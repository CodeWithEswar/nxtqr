import { validateRubricWeights } from "../challenges/challenge-registry";
import type {
  EvaluationResult,
  EvaluationRubric,
  HintDefinition,
  HintReveal,
  InterviewSession,
  LabAttemptState,
  PublicSystemDesignChallenge,
} from "../practice-schemas";

export class PracticeInvariantMonitor {
  public static verify(params: {
    session: InterviewSession;
    publicChallenge: PublicSystemDesignChallenge;
    rubric: EvaluationRubric;
    evaluation: EvaluationResult;
    revealedHints: HintReveal[];
    allChallengeHints: HintDefinition[];
    labAttempt?: LabAttemptState;
  }) {
    const violations: Array<{
      code: string;
      message: string;
      severity: "warning" | "critical";
    }> = [];

    const {
      session,
      publicChallenge,
      rubric,
      evaluation,
      revealedHints,
      allChallengeHints,
      labAttempt,
    } = params;

    if (session.monotonicElapsedMs < 0) {
      violations.push({
        code: "NEGATIVE_ELAPSED_TIME",
        message: `Session elapsed ms is negative (${session.monotonicElapsedMs}).`,
        severity: "critical",
      });
    }

    const rw = validateRubricWeights(rubric);
    if (!rw.valid) {
      violations.push({
        code: "INVALID_RUBRIC_WEIGHT_SUM",
        message: rw.error || `Rubric weights sum to ${rw.totalWeight}%, expected 100%.`,
        severity: "critical",
      });
    }

    if ("evaluatorOnly" in (publicChallenge as unknown as Record<string, unknown>)) {
      violations.push({
        code: "HIDDEN_EVALUATOR_LEAK",
        message: "evaluatorOnly field leaked onto PublicSystemDesignChallenge payload.",
        severity: "critical",
      });
    }

    const discoveredSet = new Set(session.discoveredRequirementIds);
    for (const vr of publicChallenge.visibleRequirements) {
      if (!vr.discoveredByDefault && !discoveredSet.has(vr.id)) {
        violations.push({
          code: "UNREVEALED_REQUIREMENT_LEAK",
          message: `Undiscovered requirement "${vr.id}" leaked into public payload.`,
          severity: "critical",
        });
      }
    }

    const hasPending = evaluation.criterionResults.some((c) => c.status === "pending");
    if (hasPending && evaluation.status === "completed") {
      violations.push({
        code: "INCOMPLETE_EVALUATION_MARKED_COMPLETE",
        message: "Evaluation marked 'completed' despite pending qualitative criteria.",
        severity: "critical",
      });
    }
    if (hasPending && evaluation.finalNormalizedScore !== undefined) {
      violations.push({
        code: "FINAL_SCORE_ON_INCOMPLETE_EVALUATION",
        message: "finalNormalizedScore emitted before all criteria were evaluated.",
        severity: "critical",
      });
    }

    const evidenceIdSet = new Set(evaluation.evidences.map((e) => e.id));
    for (const f of evaluation.findings) {
      if (!evidenceIdSet.has(f.supportingEvidenceId)) {
        violations.push({
          code: "ORPHAN_EVALUATION_FINDING",
          message: `Finding "${f.id}" references missing evidence "${f.supportingEvidenceId}".`,
          severity: "critical",
        });
      }
    }

    const hintDefMap = new Map(allChallengeHints.map((h) => [h.id, h]));
    const seenHints = new Set<string>();
    for (const r of revealedHints) {
      const def = hintDefMap.get(r.hintId);
      if (def) {
        for (const pre of def.prerequisiteHintIds) {
          if (!seenHints.has(pre)) {
            violations.push({
              code: "INVALID_HINT_PROGRESSION",
              message: `Hint "${r.hintId}" revealed before prerequisite "${pre}".`,
              severity: "critical",
            });
          }
        }
      }
      seenHints.add(r.hintId);
    }

    if (labAttempt && labAttempt.completed) {
      const anyFailed = labAttempt.validationResults.some((r) => !r.passed);
      if (anyFailed || labAttempt.completedStepIds.length === 0) {
        violations.push({
          code: "FALSE_LAB_COMPLETION",
          message: "Lab marked completed despite failed validation rule or empty steps.",
          severity: "critical",
        });
      }
    }

    return {
      passed: !violations.some((v) => v.severity === "critical"),
      violations,
    };
  }
}

