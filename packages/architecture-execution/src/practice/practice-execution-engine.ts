import { VirtualClock } from "../engine/virtual-clock";
import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import { RuntimeStateHelper } from "../domain/runtime-state";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import { withComputedRevisionHash } from "../analysis/revisions/revision-diff-engine";
import {
  getChallengeById,
  getRubricById,
  toPublicChallenge,
} from "./challenges/challenge-registry";
import { STANDARD_PRACTICE_RUBRIC, SYSTEM_DESIGN_CHALLENGES } from "./challenges/challenge-library";
import {
  aggregateLearningProgress,
  buildSessionReport,
  evaluateDesignSubmission,
  recommendNextChallenges,
} from "./evaluation/rubric-evaluator";
import { PracticeInvariantMonitor } from "./invariants/practice-invariants";
import {
  generateContextualFollowUpQuestions,
  revealProgressiveHint,
} from "./interview/interview-orchestrator";
import {
  ENGINEERING_LABS,
  evaluateLabAttempt,
  getEngineeringLabById,
} from "./labs/engineering-labs";
import type { PracticeExecutionEvent } from "./practice-events";
import type {
  ArchitectureArtifact,
  ChallengeAttempt,
  DesignSubmission,
  HintReveal,
  InterviewAnswer,
  InterviewMessage,
  InterviewSession,
  LabAttemptState,
  ModeledPracticeRuntimeState,
  PracticeScenario,
} from "./practice-schemas";
import {
  computeCapacityEstimation,
  discoverRequirementsFromQuestion,
} from "./requirements/requirements-estimation-engine";
import {
  PracticeSessionStateMachine,
  reconcileInterviewTimer,
} from "./sessions/session-state-machine";

export class PracticeExecutionEngine {
  public static runScenario(scenario: PracticeScenario): {
    trace: ExecutionTrace;
    state: ModeledPracticeRuntimeState;
  } {
    const challenge =
      getChallengeById(scenario.challengeId, scenario.challengeVersion) ||
      SYSTEM_DESIGN_CHALLENGES[0];
    const rubric = getRubricById(challenge.rubricId) || STANDARD_PRACTICE_RUBRIC;

    const clock = new VirtualClock();
    const events: PracticeExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    const baseState = RuntimeStateHelper.createInitialState();

    const fixedIso = new Date(Date.UTC(2026, 10, 12, 12, 0, 0)).toISOString();
    const sessionId = `sess_${scenario.id}_${scenario.seed}`;
    let seq = 0;

    const emitEvent = (
      ev: Omit<
        PracticeExecutionEvent,
        "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
      > & { type: PracticeExecutionEvent["type"] }
    ) => {
      seq += 1;
      const built = {
        ...ev,
        id: `pev_${seq}`,
        sequence: seq,
        atMs: clock.now(),
        durationMs: 25,
        sessionId,
        payloadVersion: 1 as const,
      } as PracticeExecutionEvent;
      events.push(built);
      return built;
    };

    const recordFrame = (activeNodeId: string) => {
      const lastEv = events[events.length - 1];
      if (!lastEv) return;
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: clock.now(),
        activeNodeIds: [activeNodeId],
        activeEdgeIds: scenario.architectureEdges.map((e) => e.id),
        activeEvent: lastEv,
        direction: "request",
        stepTitle: lastEv.type,
        stepExplanation: lastEv.explanation,
        runtimeState: RuntimeStateHelper.cloneState(baseState),
      });
    };

    let session: InterviewSession = {
      id: sessionId,
      userId: scenario.userId,
      challengeId: challenge.id,
      challengeVersion: challenge.version,
      mode: scenario.mode,
      pressureMode: scenario.pressureMode,
      status: "created",
      startedAtIso: fixedIso,
      durationLimitMinutes: scenario.durationLimitMinutes,
      monotonicElapsedMs: 0,
      currentPhase: "problem_understanding",
      discoveredRequirementIds: challenge.requirements
        .filter((r) => r.discoveredByDefault)
        .map((r) => r.id),
      requirementClassifications: Object.fromEntries(
        challenge.requirements.map((r) => [r.id, r.kind])
      ),
      architectureRevisionId: scenario.architectureRevisionId,
    };

    emitEvent({
      type: "practice.session.created",
      actor: "system",
      explanation: `Initialized ${scenario.mode} session for "${challenge.title}" (v${challenge.version}).`,
      challengeId: challenge.id,
      challengeVersion: challenge.version,
      mode: scenario.mode,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.session.created" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    const startRes = PracticeSessionStateMachine.transition(session, "active", fixedIso);
    if (startRes.ok) session = startRes.session;
    clock.advance(40);
    emitEvent({
      type: "practice.session.started",
      actor: "candidate",
      explanation: `Session transitioned to active (${scenario.durationLimitMinutes}m limit, ${scenario.pressureMode} pressure).`,
      durationLimitMinutes: scenario.durationLimitMinutes,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.session.started" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);
    recordFrame(scenario.architectureComponents[0]?.id || "entry");

    const timer = reconcileInterviewTimer({
      priorElapsedMs: 0,
      activeSliceMs: scenario.monotonicElapsedMs,
      durationLimitMinutes: scenario.durationLimitMinutes,
      mode: scenario.mode,
      pressureMode: scenario.pressureMode,
    });
    session = {
      ...PracticeSessionStateMachine.transitionPhase(session, scenario.currentPhase),
      monotonicElapsedMs: timer.elapsedMs,
    };

    const messages: InterviewMessage[] = [
      {
        id: "msg_welcome",
        role: "interviewer",
        phase: "problem_understanding",
        content: challenge.publicPrompt,
        atMs: clock.now(),
      },
    ];

    for (let i = 0; i < scenario.clarificationQuestions.length; i++) {
      const qText = scenario.clarificationQuestions[i];
      clock.advance(30);
      messages.push({
        id: `msg_cand_${i}`,
        role: "candidate",
        phase: "requirements_discovery",
        content: qText,
        atMs: clock.now(),
      });

      const discovery = discoverRequirementsFromQuestion({
        challenge,
        questionText: qText,
        alreadyDiscoveredIds: session.discoveredRequirementIds,
      });

      session.discoveredRequirementIds = discovery.allDiscoveredIds;
      messages.push({
        id: `msg_int_${i}`,
        role: "interviewer",
        phase: "requirements_discovery",
        content: discovery.interviewerResponse,
        atMs: clock.now() + 5,
        revealedRequirementIds: discovery.newlyDiscoveredIds,
      });

      for (const reqId of discovery.newlyDiscoveredIds) {
        const req = challenge.requirements.find((r) => r.id === reqId);
        if (req) {
          emitEvent({
            type: "practice.requirement.discovered",
            actor: "interviewer",
            explanation: `Discovered requirement ${req.code}: ${req.title}.`,
            requirementId: req.id,
            requirementCode: req.code,
            questionText: qText,
          } as Omit<
            Extract<PracticeExecutionEvent, { type: "practice.requirement.discovered" }>,
            "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
          >);
        }
      }
    }

    const estimation = computeCapacityEstimation(scenario.estimationInput);
    clock.advance(30);
    emitEvent({
      type: "practice.estimation.updated",
      actor: "candidate",
      explanation: `Estimation updated: avg=${estimation.averageRps} req/s, peak=${estimation.peakRps} req/s, replicated=${estimation.formattedReplicatedTb} TB.`,
      averageRps: estimation.averageRps,
      peakRps: estimation.peakRps,
      replicatedStorageBytes: estimation.replicatedStorageBytes,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.estimation.updated" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    emitEvent({
      type: "practice.api.updated",
      actor: "candidate",
      explanation: `Updated API contract with ${scenario.apiDesign.endpoints.length} endpoints.`,
      endpointCount: scenario.apiDesign.endpoints.length,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.api.updated" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    emitEvent({
      type: "practice.data_model.updated",
      actor: "candidate",
      explanation: `Updated data model with ${scenario.dataModel.entities.length} entities.`,
      entityCount: scenario.dataModel.entities.length,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.data_model.updated" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    const rev = withComputedRevisionHash({
      revisionId: scenario.architectureRevisionId,
      contentHash: "",
      label: `${challenge.title} Candidate Revision`,
      routingPolicy: "least_connections",
      scalingMode: "hpa_reactive",
      maxReplicas: 20,
      components: scenario.architectureComponents,
      edges: scenario.architectureEdges,
    });
    const architecture: ArchitectureArtifact = {
      revisionId: rev.revisionId,
      revisionLabel: rev.label,
      contentHash: rev.contentHash,
      components: rev.components,
      edges: rev.edges,
      designNotes: scenario.tradeOffExplanation,
    };

    emitEvent({
      type: "practice.architecture.updated",
      actor: "candidate",
      explanation: `Registered immutable revision ${rev.revisionId} (${rev.contentHash}) with ${rev.components.length} components.`,
      revisionId: rev.revisionId,
      contentHash: rev.contentHash,
      componentCount: rev.components.length,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.architecture.updated" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);
    recordFrame(rev.components[0]?.id || "entry");

    const activeQuestions = generateContextualFollowUpQuestions({
      challenge,
      phase: scenario.currentPhase,
      discoveredRequirementIds: session.discoveredRequirementIds,
      components: rev.components,
      edges: rev.edges,
      alreadyAskedIds: [],
    });

    const answers: InterviewAnswer[] = [];
    for (const q of activeQuestions) {
      clock.advance(20);
      emitEvent({
        type: "practice.question.asked",
        actor: "interviewer",
        explanation: q.prompt,
        questionId: q.id,
        prompt: q.prompt,
      } as Omit<
        Extract<PracticeExecutionEvent, { type: "practice.question.asked" }>,
        "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
      >);
      messages.push({
        id: `msg_q_${q.id}`,
        role: "interviewer",
        phase: q.phase,
        content: q.prompt,
        atMs: clock.now(),
        questionId: q.id,
      });

      const ansText = scenario.followUpAnswers[q.id];
      if (ansText && ansText.trim().length > 0) {
        answers.push({ questionId: q.id, content: ansText, atMs: clock.now() + 5 });
        messages.push({
          id: `msg_a_${q.id}`,
          role: "candidate",
          phase: q.phase,
          content: ansText,
          atMs: clock.now() + 5,
          questionId: q.id,
        });
        emitEvent({
          type: "practice.answer.submitted",
          actor: "candidate",
          explanation: `Candidate answered follow-up "${q.id}".`,
          questionId: q.id,
        } as Omit<
          Extract<PracticeExecutionEvent, { type: "practice.answer.submitted" }>,
          "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
        >);
      }
    }

    const revealedHints: HintReveal[] = [];
    if (scenario.revealHintUpToLevel > 0) {
      for (const hint of challenge.hints) {
        if (hint.level <= scenario.revealHintUpToLevel) {
          const res = revealProgressiveHint({
            challenge,
            hintId: hint.id,
            alreadyRevealed: revealedHints,
            mode: scenario.mode,
            pressureMode: scenario.pressureMode,
            atMs: clock.now(),
          });
          if (res.ok) {
            revealedHints.push(res.reveal);
            emitEvent({
              type: "practice.hint.revealed",
              actor: "system",
              explanation: `Revealed L${res.hint.level} hint: ${res.hint.title}.`,
              hintId: res.hint.id,
              level: res.hint.level,
            } as Omit<
              Extract<PracticeExecutionEvent, { type: "practice.hint.revealed" }>,
              "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
            >);
          }
        }
      }
    }

    const submissionId = `sub_${session.id}`;
    const submission: DesignSubmission = {
      id: submissionId,
      idempotencyKey: `idem_${submissionId}`,
      sessionId: session.id,
      challengeId: challenge.id,
      challengeVersion: challenge.version,
      submittedAtIso: fixedIso,
      estimation,
      apiDesign: scenario.apiDesign,
      dataModel: scenario.dataModel,
      architecture,
      tradeOffExplanation: scenario.tradeOffExplanation,
      answers,
      hintsUsed: revealedHints,
    };

    const subTrans = PracticeSessionStateMachine.transition(session, "submitted", fixedIso);
    if (subTrans.ok) session = subTrans.session;
    emitEvent({
      type: "practice.submission.created",
      actor: "candidate",
      explanation: `Submitted design artifacts for revision ${rev.revisionId}.`,
      submissionId: submission.id,
      idempotencyKey: submission.idempotencyKey,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.submission.created" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    const evalTrans = PracticeSessionStateMachine.transition(session, "evaluating", fixedIso);
    if (evalTrans.ok) session = evalTrans.session;
    emitEvent({
      type: "practice.evaluation.started",
      actor: "evaluator",
      explanation: `Evaluating submission against rubric "${rubric.title}" v${rubric.version}.`,
      rubricId: rubric.id,
      rubricVersion: rubric.version,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.evaluation.started" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    const evalOutput = evaluateDesignSubmission({
      challenge,
      rubric,
      session,
      submission,
      seed: scenario.seed,
      evaluatedAtIso: fixedIso,
    });

    for (const scState of evalOutput.scenarioStates) {
      const m = scState.analysisState.baselineMetrics;
      const availPct = Number((m.simulatedAvailability * 100).toFixed(3));
      emitEvent({
        type: "practice.simulation.completed",
        actor: "system",
        explanation: `Simulation "${scState.scenarioId}" complete: p95=${m.p95LatencyMs}ms, availability=${availPct}%.`,
        scenarioId: scState.scenarioId,
        simulationRunId: scState.runId,
        p95Ms: m.p95LatencyMs,
        availabilityPct: availPct,
      } as Omit<
        Extract<PracticeExecutionEvent, { type: "practice.simulation.completed" }>,
        "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
      >);
    }

    const doneTrans = PracticeSessionStateMachine.transition(session, "completed", fixedIso);
    if (doneTrans.ok) session = doneTrans.session;
    session.evaluationId = evalOutput.evaluation.id;

    emitEvent({
      type: "practice.evaluation.completed",
      actor: "evaluator",
      explanation: `Evaluation (${evalOutput.evaluation.status}): ${evalOutput.evaluation.evaluatedWeightedScore}% across evaluated rubric criteria.`,
      evaluationId: evalOutput.evaluation.id,
      evaluatedWeightedScore: evalOutput.evaluation.evaluatedWeightedScore,
      status: evalOutput.evaluation.status,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.evaluation.completed" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    const activeLab = scenario.labId
      ? getEngineeringLabById(scenario.labId) || ENGINEERING_LABS[0]
      : undefined;
    let labAttempt: LabAttemptState | undefined;

    if (activeLab) {
      const labRes = evaluateLabAttempt({
        lab: activeLab,
        attemptId: `labatt_${activeLab.id}_${scenario.seed}`,
        components: rev.components,
        edges: rev.edges,
        completedStepIds: scenario.completedLabStepIds,
        inspectedMetrics: true,
        reasoningAnswers: scenario.followUpAnswers,
        seed: scenario.seed,
      });
      labAttempt = labRes.attempt;

      for (const sid of labAttempt.completedStepIds) {
        emitEvent({
          type: "practice.lab.step.completed",
          actor: "candidate",
          explanation: `Completed step ${sid} of lab "${activeLab.title}".`,
          labId: activeLab.id,
          stepId: sid,
        } as Omit<
          Extract<PracticeExecutionEvent, { type: "practice.lab.step.completed" }>,
          "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
        >);
      }

      if (labAttempt.completed) {
        emitEvent({
          type: "practice.lab.completed",
          actor: "evaluator",
          explanation: `Verified all validation predicates for lab "${activeLab.title}".`,
          labId: activeLab.id,
          attemptId: labAttempt.attemptId,
        } as Omit<
          Extract<PracticeExecutionEvent, { type: "practice.lab.completed" }>,
          "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
        >);
      }
    }

    const attemptRecord: ChallengeAttempt = {
      id: `att_${submission.id}`,
      sessionId: session.id,
      userId: session.userId,
      challengeId: challenge.id,
      challengeVersion: challenge.version,
      mode: session.mode,
      architectureRevisionId: rev.revisionId,
      rubricVersion: rubric.version,
      submittedAtIso: fixedIso,
      elapsedSeconds: Math.round(session.monotonicElapsedMs / 1000),
      hintsUsedCount: revealedHints.length,
      evaluation: evalOutput.evaluation,
    };

    const allAttempts = [...(scenario.previousAttempts || []), attemptRecord];
    const learningProgress = aggregateLearningProgress({
      userId: session.userId,
      challengeId: challenge.id,
      attempts: allAttempts,
    });

    emitEvent({
      type: "practice.progress.updated",
      actor: "system",
      explanation: `Progress aggregated: ${learningProgress.attempts} attempt(s), best=${learningProgress.bestEvaluatedScore ?? 0}%.`,
      challengeId: challenge.id,
      attempts: learningProgress.attempts,
      completed: learningProgress.completed,
    } as Omit<
      Extract<PracticeExecutionEvent, { type: "practice.progress.updated" }>,
      "id" | "sequence" | "atMs" | "durationMs" | "sessionId" | "payloadVersion"
    >);

    const completedChallengeIds = allAttempts
      .filter((a) => a.evaluation.evaluatedWeightedScore >= 60)
      .map((a) => a.challengeId);
    const recommendedChallengeIds = recommendNextChallenges({
      currentChallengeId: challenge.id,
      improvementAreas: learningProgress.improvementAreas,
      completedChallengeIds,
    });

    const report = buildSessionReport({
      challenge,
      session,
      submission,
      evaluation: evalOutput.evaluation,
      followUpQuestionsAsked: activeQuestions.length,
      recommendedNextChallenges: recommendedChallengeIds,
      generatedAtIso: fixedIso,
    });

    const publicChallenge = toPublicChallenge(
      challenge,
      session.discoveredRequirementIds
    );

    const invariants = PracticeInvariantMonitor.verify({
      session,
      publicChallenge,
      rubric,
      evaluation: evalOutput.evaluation,
      revealedHints,
      allChallengeHints: challenge.hints,
      labAttempt,
    });

    const revealedIds = new Set(revealedHints.map((r) => r.hintId));
    const availableHints = challenge.hints.filter(
      (h) =>
        revealedIds.has(h.id) ||
        h.prerequisiteHintIds.every((pre) => revealedIds.has(pre))
    );

    const practiceState: ModeledPracticeRuntimeState = {
      scenarioId: scenario.id,
      mode: scenario.mode,
      session,
      publicChallenge,
      rubric,
      estimation,
      apiDesign: scenario.apiDesign,
      dataModel: scenario.dataModel,
      architecture,
      messages,
      activeQuestions,
      revealedHints,
      availableHints,
      submission,
      evaluation: evalOutput.evaluation,
      activeLab,
      labAttempt,
      attemptRecord,
      learningProgress,
      recommendedChallengeIds,
      report,
      invariants,
    };

    baseState.practiceState = practiceState;
    recordFrame(rev.components[rev.components.length - 1]?.id || "entry");

    const cfg: ExecutionConfiguration = {
      version: 1,
      entryNodeId: rev.components[0]?.id || "entry",
      request: {
        id: `req_practice_${scenario.id}`,
        method: "POST",
        path: `/practice/${challenge.slug}`,
        headers: {},
        body: { challengeId: challenge.id, mode: scenario.mode },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: 500,
        maxHops: 50,
        maxDurationMs: 5000,
      },
      timing: {
        nodeDurationMs: 20,
        edgeDurationMs: 10,
      },
      presetId: "custom",
    };

    const trace: ExecutionTrace = {
      runId: `prac_run_${scenario.id}_${scenario.seed}`,
      architectureId: "arch_practice_sim",
      architectureRevisionId: scenario.architectureRevisionId,
      snapshotHash: rev.contentHash || `hash_${scenario.id}`,
      createdAt: fixedIso,
      visitedNodeIds: rev.components.map((c) => c.id),
      traversedEdgeIds: rev.edges.map((e) => e.id),
      configuration: cfg,
      events,
      totalDurationMs: Math.max(50, clock.now()),
      totalEvents: events.length,
      totalHops: rev.components.length + events.length,
      outcome: invariants.passed ? "success" : "failure",
      terminalReason: `${challenge.title} [${scenario.mode}]: ${evalOutput.evaluation.evaluatedWeightedScore}% evaluated score.`,
      frames,
    };

    return { trace, state: practiceState };
  }
}
