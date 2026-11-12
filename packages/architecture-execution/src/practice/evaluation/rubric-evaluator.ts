import { ArchitectureAnalysisExecutionEngine } from "../../analysis/analysis-execution-engine";
import type {
  AnalysisExperiment,
  AnalysisSpofFinding,
  ModeledAnalysisRuntimeState,
} from "../../analysis/analysis-schemas";
import { withComputedRevisionHash } from "../../analysis/revisions/revision-diff-engine";
import { validateRubricWeights } from "../challenges/challenge-registry";
import { SYSTEM_DESIGN_CHALLENGES } from "../challenges/challenge-library";
import type {
  ChallengeAttempt,
  CriterionResult,
  DesignSubmission,
  EvaluationEvidence,
  EvaluationFinding,
  EvaluationResult,
  EvaluationRubric,
  FeedbackSummary,
  InterviewSession,
  LearningProgress,
  SessionReport,
  SystemDesignChallenge,
} from "../practice-schemas";
import {
  evaluateApiDesignCoverage,
  evaluateDataModelCoverage,
} from "../requirements/requirements-estimation-engine";
import { getPressureModePolicy } from "../sessions/session-state-machine";

function normalizeCriterionScore(score: 0 | 1 | 2 | 3): number {
  return Number(((score / 3) * 100).toFixed(2));
}

function mapCapabilityAliasToKind(cap: string): string {
  if (cap === "api_gateway" || cap === "load_balancer" || cap === "dns" || cap === "cdn") {
    return "gateway";
  }
  if (cap === "app_server" || cap === "worker") return "service";
  if (cap === "object_storage") return "storage";
  return cap;
}

export function evaluateDesignSubmission(params: {
  challenge: SystemDesignChallenge;
  rubric: EvaluationRubric;
  session: InterviewSession;
  submission: DesignSubmission;
  seed: number;
  evaluatedAtIso: string;
}): {
  evaluation: EvaluationResult;
  scenarioStates: Array<{
    scenarioId: string;
    runId: string;
    analysisState: ModeledAnalysisRuntimeState;
  }>;
} {
  const { challenge, rubric, session, submission, seed, evaluatedAtIso } = params;
  const rw = validateRubricWeights(rubric);
  if (!rw.valid) {
    throw new Error(rw.error || "Invalid rubric weight total.");
  }

  const rev = withComputedRevisionHash({
    revisionId: submission.architecture.revisionId,
    contentHash: "",
    label: submission.architecture.revisionLabel,
    routingPolicy: "least_connections",
    scalingMode: "hpa_reactive",
    maxReplicas: 20,
    components: submission.architecture.components,
    edges: submission.architecture.edges,
  });

  const evidences: EvaluationEvidence[] = [];
  const findings: EvaluationFinding[] = [];
  const scenarioStates: Array<{
    scenarioId: string;
    runId: string;
    analysisState: ModeledAnalysisRuntimeState;
  }> = [];

  for (let i = 0; i < challenge.scenarios.length; i++) {
    const sc = challenge.scenarios[i];
    const experiment: AnalysisExperiment = {
      version: 1,
      id: `${submission.id}_sc_${sc.id}`,
      projectId: "proj_practice",
      label: sc.label,
      architectureRevisionId: rev.revisionId,
      baselineRevision: rev,
      candidateRevision: rev,
      workloadRps: Math.min(10000, sc.workloadRps),
      durationMs: 600,
      seed: seed + i * 17,
      fault: {
        id: `f_${sc.id}`,
        type: sc.faultType,
        targetComponentId:
          sc.faultTargetId ||
          rev.components.find((c) => c.kind === "database")?.id ||
          rev.components[0]?.id ||
          "db",
        atMs: 160,
        durationMs: 220,
      },
      constraints: challenge.constraints.map((c) => ({
        id: c.id,
        label: c.label,
        maxP95LatencyMs: c.metric === "max_p95_ms" ? c.threshold : undefined,
        minAvailability:
          c.metric === "min_availability_pct" ? c.threshold / 100 : undefined,
        maxMonthlyCostUsd:
          c.metric === "max_monthly_cost_usd" ? c.threshold : undefined,
        zeroDataLossRequired: false,
      })),
      objectives: [
        { id: "o_lat", dimension: "performance", targetDirection: "minimize", weight: 0.5 },
        { id: "o_avail", dimension: "reliability", targetDirection: "maximize", weight: 0.5 },
      ],
      scoringEnabled: false,
      seedSet: [seed + i * 17],
    };

    const { trace, finalState } = ArchitectureAnalysisExecutionEngine.runExperiment(experiment);
    scenarioStates.push({
      scenarioId: sc.id,
      runId: trace.runId,
      analysisState: finalState,
    });

    const m = finalState.baselineMetrics;
    const availPct = Number((m.simulatedAvailability * 100).toFixed(3));
    const spofs = finalState.spofs.filter((s: AnalysisSpofFinding) => s.severity === "critical").length;
    const p95Limit =
      challenge.constraints.find((c) => c.metric === "max_p95_ms")?.threshold ?? 100;
    const availMin =
      challenge.constraints.find((c) => c.metric === "min_availability_pct")?.threshold ?? 99.9;

    const scenarioPassed =
      m.p95LatencyMs <= p95Limit + sc.latencyInflationMs &&
      availPct >= availMin - (sc.faultType === "az_outage" ? 1.5 : 0.8) &&
      spofs === 0;

    evidences.push({
      id: `ev_sim_${sc.id}`,
      source: "simulation_run",
      scenarioId: sc.id,
      simulationRunId: trace.runId,
      architectureRevisionId: rev.revisionId,
      seed: seed + i * 17,
      metricSummary: `Scenario "${sc.label}": completed=${m.completedRps} req/s, p95=${m.p95LatencyMs} ms, avail=${availPct}%, SPOFs=${spofs}, cost=$${m.estimatedMonthlyCostUsd}/mo.`,
      metrics: m,
      passed: scenarioPassed,
      limitation:
        finalState.capabilities.length > 0
          ? "Simulated via deterministic analytical queueing + fault-domain runtime; excludes hardware NIC kernel jitter."
          : undefined,
    });
  }

  const peakSim = scenarioStates[1] || scenarioStates[0];
  const faultSim = scenarioStates[scenarioStates.length - 1] || scenarioStates[0];
  const peakMetrics = peakSim.analysisState.baselineMetrics;
  const faultMetrics = faultSim.analysisState.baselineMetrics;
  const faultAvailPct = Number((faultMetrics.simulatedAvailability * 100).toFixed(3));
  const peakDropRatePct =
    peakMetrics.offeredRps > 0
      ? Number(((peakMetrics.rejectedRps / peakMetrics.offeredRps) * 100).toFixed(2))
      : 0;
  const spofCount = peakSim.analysisState.spofs.filter(
    (s) => s.severity === "critical"
  ).length;

  const reqCoverageRatio =
    session.discoveredRequirementIds.length / Math.max(1, challenge.requirements.length);
  evidences.push({
    id: "ev_det_req",
    source: "deterministic_check",
    metricSummary: `Discovered ${session.discoveredRequirementIds.length}/${challenge.requirements.length} challenge requirements.`,
    passed: reqCoverageRatio >= 0.75,
  });

  const estOk =
    submission.estimation.valid &&
    submission.estimation.peakRps >= challenge.evaluatorOnly.expectedPeakRpsMin &&
    submission.estimation.peakRps <= challenge.evaluatorOnly.expectedPeakRpsMax;
  evidences.push({
    id: "ev_det_est",
    source: "deterministic_check",
    metricSummary: `Estimated peak=${submission.estimation.peakRps} req/s, dailyStorage=${(
      submission.estimation.dailyStorageBytes / 1_000_000_000
    ).toFixed(3)} GB, valid=${submission.estimation.valid}.`,
    passed: estOk,
  });

  const apiCheck = evaluateApiDesignCoverage(submission.apiDesign, challenge);
  evidences.push({
    id: "ev_det_api",
    source: "deterministic_check",
    metricSummary: apiCheck.details,
    passed: apiCheck.score >= 2,
  });

  const dataCheck = evaluateDataModelCoverage(submission.dataModel, challenge);
  evidences.push({
    id: "ev_det_data",
    source: "deterministic_check",
    metricSummary: dataCheck.details,
    passed: dataCheck.score >= 2,
  });

  const presentKinds = new Set(rev.components.map((c) => c.kind as string));
  const missingCaps = Array.from(
    new Set(
      challenge.evaluatorOnly.requiredComponentCapabilities
        .map(mapCapabilityAliasToKind)
        .filter((kind) => !presentKinds.has(kind))
    )
  );

  const criterionResults: CriterionResult[] = [];
  const whatWorked: string[] = [];
  const whatIsMissing: string[] = [];
  const criticalIssues: string[] = [];
  const performanceFindings: string[] = [];
  const reliabilityFindings: string[] = [];
  const securityFindings: string[] = [];
  const recommendedImprovements: string[] = [];

  for (const crit of rubric.criteria) {
    if (crit.evaluationType === "human-review") {
      criterionResults.push({
        criterionId: crit.id,
        title: crit.title,
        dimension: crit.dimension,
        evaluationType: crit.evaluationType,
        weight: crit.weight,
        status: "pending",
        evidenceIds: ["ev_det_req"],
        rationale:
          submission.tradeOffExplanation.trim().length > 20
            ? "Candidate trade-off explanation captured; awaiting structured human qualitative review (never auto-scored)."
            : "No substantive trade-off narrative supplied; pending human qualitative review.",
      });
      continue;
    }

    let score: 0 | 1 | 2 | 3 = 1;
    let rationale = "";
    const evIds: string[] = [];

    switch (crit.dimension) {
      case "requirements_discovery": {
        evIds.push("ev_det_req");
        if (reqCoverageRatio >= 1) {
          score = 3;
          whatWorked.push(
            `Discovered all ${challenge.requirements.length} functional and nonfunctional requirements prior to freezing design.`
          );
        } else if (reqCoverageRatio >= 0.75) {
          score = 2;
        } else if (reqCoverageRatio >= 0.5) {
          score = 1;
          whatIsMissing.push(
            `Only ${session.discoveredRequirementIds.length}/${challenge.requirements.length} requirements discovered.`
          );
        } else {
          score = 0;
          whatIsMissing.push("Failed to discover core scale, latency, and reliability NFRs.");
        }
        rationale = `Discovered ${session.discoveredRequirementIds.length} of ${challenge.requirements.length} requirements.`;
        break;
      }

      case "capacity_estimation": {
        evIds.push("ev_det_est");
        if (!submission.estimation.valid || submission.estimation.peakRps <= 0) {
          score = 0;
          whatIsMissing.push("Valid non-zero capacity estimation missing.");
        } else if (estOk && submission.estimation.warnings.length === 0) {
          score = 3;
          whatWorked.push(
            `Accurate capacity calculations (${submission.estimation.peakRps} peak req/s, ${submission.estimation.formattedReplicatedTb} TB replicated).`
          );
        } else if (estOk) {
          score = 2;
        } else {
          score = 1;
          recommendedImprovements.push(
            `Re-check estimation orders of magnitude (computed ${submission.estimation.peakRps} req/s vs reference workload bounds).`
          );
        }
        rationale = `Peak=${submission.estimation.peakRps} req/s, warnings=${submission.estimation.warnings.length}.`;
        break;
      }

      case "api_design": {
        evIds.push("ev_det_api");
        score = apiCheck.score;
        rationale = apiCheck.details;
        if (score >= 2) whatWorked.push(apiCheck.details);
        if (apiCheck.missingCapabilities.length > 0) {
          whatIsMissing.push(`API contract missing: ${apiCheck.missingCapabilities.join(", ")}.`);
        }
        break;
      }

      case "data_modeling": {
        evIds.push("ev_det_data");
        score = dataCheck.score;
        rationale = dataCheck.details;
        if (score >= 2) whatWorked.push(dataCheck.details);
        if (dataCheck.missingAreas.length > 0) {
          whatIsMissing.push(`Data model missing: ${dataCheck.missingAreas.join(", ")}.`);
        }
        break;
      }

      case "architecture_correctness": {
        evIds.push(`ev_sim_${challenge.scenarios[0].id}`);
        if (rev.components.length < 2) {
          score = 0;
          criticalIssues.push("Architecture has fewer than 2 components (incomplete data plane).");
        } else if (missingCaps.length === 0) {
          const isBloated = rev.components.length > 10 && challenge.difficulty === "beginner";
          score = isBloated ? 2 : 3;
          whatWorked.push("Topology provides complete ingress, compute, and persistence boundaries.");
        } else if (missingCaps.length === 1) {
          score = 2;
          recommendedImprovements.push(`Consider adding capability: ${missingCaps[0]}.`);
        } else {
          score = 1;
          whatIsMissing.push(`Architecture lacks capabilities: ${missingCaps.join(", ")}.`);
        }
        rationale =
          missingCaps.length === 0
            ? `${rev.components.length} components satisfy core challenge capabilities without unnecessary complexity.`
            : `Missing domain capabilities: ${missingCaps.join(", ")}.`;
        break;
      }

      case "scalability": {
        evIds.push(`ev_sim_${peakSim.scenarioId}`);
        const p95Limit =
          challenge.constraints.find((c) => c.metric === "max_p95_ms")?.threshold ?? 100;
        const primaryBn = peakSim.analysisState.bottlenecks[0];

        if (peakDropRatePct > 15) {
          score = 0;
          const msg = `Peak simulation dropped ${peakDropRatePct}% of requests (p95=${peakMetrics.p95LatencyMs} ms${
            primaryBn ? `; root cause: ${primaryBn.componentId}` : ""
          }).`;
          criticalIssues.push(msg);
          performanceFindings.push(msg);
          findings.push({
            id: `f_scale_${submission.id}`,
            criterionId: crit.id,
            severity: "critical",
            observedIssue: `Severe throughput saturation under ${peakSim.scenarioId}`,
            supportingEvidenceId: `ev_sim_${peakSim.scenarioId}`,
            explanation: msg,
            suggestedImprovement:
              "Scale bottleneck tier replicas or add cache/queue offloading supported by peak simulation.",
            confidence: "high",
            limitations: "Bounded to configured arrival profile.",
          });
        } else if (peakMetrics.p95LatencyMs <= p95Limit && peakDropRatePct <= 0.5) {
          score = peakMetrics.p95LatencyMs <= p95Limit * 0.85 ? 3 : 2;
          const msg = `Peak simulation achieved p95=${peakMetrics.p95LatencyMs} ms (<= ${p95Limit} ms) with ${peakMetrics.completedRps} req/s throughput.`;
          performanceFindings.push(msg);
          whatWorked.push(msg);
        } else {
          score = 1;
          const msg = `Peak simulation hit p95=${peakMetrics.p95LatencyMs} ms vs ${p95Limit} ms target${
            primaryBn ? ` (saturation at ${primaryBn.componentId})` : ""
          }.`;
          performanceFindings.push(msg);
          recommendedImprovements.push(msg);
          findings.push({
            id: `f_scale_${submission.id}`,
            criterionId: crit.id,
            severity: "warning",
            observedIssue: `p95 latency exceeded ${p95Limit} ms target`,
            supportingEvidenceId: `ev_sim_${peakSim.scenarioId}`,
            explanation: msg,
            suggestedImprovement:
              "Reduce hop queueing or add read caching before the saturated storage node.",
            confidence: "high",
            limitations: "Deterministic service-time model.",
          });
        }
        rationale = `Peak p95=${peakMetrics.p95LatencyMs} ms, dropRate=${peakDropRatePct}%.`;
        break;
      }

      case "reliability": {
        evIds.push(`ev_sim_${faultSim.scenarioId}`);
        const availTarget =
          challenge.constraints.find((c) => c.metric === "min_availability_pct")?.threshold ?? 99.9;
        const maxRetry = rev.edges.reduce((m, e) => Math.max(m, e.retryFactor), 1);

        if (spofCount >= 2 || faultAvailPct < 96.0) {
          score = 0;
          const msg = `Detected ${spofCount} critical SPOF(s) and availability dropped to ${faultAvailPct}% during fault injection.`;
          criticalIssues.push(msg);
          reliabilityFindings.push(msg);
          findings.push({
            id: `f_rel_${submission.id}`,
            criterionId: crit.id,
            severity: "critical",
            observedIssue: "Critical SPOF / low fault availability",
            supportingEvidenceId: `ev_sim_${faultSim.scenarioId}`,
            explanation: msg,
            suggestedImprovement:
              "Replicate stateful and ingress nodes across >= 2 availability zones and bound edge retries <= 1.5x.",
            confidence: "high",
            limitations: "Shared external cloud-provider control-plane risks excluded.",
          });
        } else if (spofCount === 0 && maxRetry <= 1.5 && faultAvailPct >= availTarget - 1.5) {
          score = 3;
          const msg = `Zero critical SPOFs; sustained ${faultAvailPct}% availability under ${faultSim.scenarioId}.`;
          reliabilityFindings.push(msg);
          whatWorked.push(msg);
        } else if (spofCount === 0) {
          score = 2;
          reliabilityFindings.push(
            `Zero critical SPOFs (${faultAvailPct}% availability; check retry factor ${maxRetry.toFixed(2)}x).`
          );
        } else {
          score = 1;
          const msg = `Topology contains ${spofCount} SPOF(s); harden single-AZ or single-replica nodes.`;
          reliabilityFindings.push(msg);
          recommendedImprovements.push(msg);
          findings.push({
            id: `f_rel_${submission.id}`,
            criterionId: crit.id,
            severity: "warning",
            observedIssue: "Single point of failure present",
            supportingEvidenceId: `ev_sim_${faultSim.scenarioId}`,
            explanation: msg,
            suggestedImprovement: "Add multi-AZ standby replicas.",
            confidence: "high",
            limitations: "Analytical fault-domain model.",
          });
        }
        rationale = `Critical SPOFs=${spofCount}, fault availability=${faultAvailPct}%.`;
        break;
      }

      case "security": {
        evIds.push(`ev_sim_${peakSim.scenarioId}`, "ev_det_api");
        const costCap =
          challenge.constraints.find((c) => c.metric === "max_monthly_cost_usd")?.threshold ?? 15000;
        const verifiedEdge = rev.components.some((c) => c.kind === "gateway");
        const withinBudget = peakMetrics.estimatedMonthlyCostUsd <= costCap;

        if (verifiedEdge && withinBudget && apiCheck.score >= 2) {
          score = 3;
          securityFindings.push(
            `Verified trust boundaries enforced within budget ($${peakMetrics.estimatedMonthlyCostUsd}/mo <= $${costCap}/mo).`
          );
        } else if (verifiedEdge || withinBudget) {
          score = 2;
          securityFindings.push(
            `Monthly cost $${peakMetrics.estimatedMonthlyCostUsd}/mo; verify auth/rate limits across all write endpoints.`
          );
        } else {
          score = 1;
          securityFindings.push(
            `Monthly spend ($${peakMetrics.estimatedMonthlyCostUsd}/mo) exceeds $${costCap}/mo or lacks verified gateway edge.`
          );
          recommendedImprovements.push("Add authenticated API Gateway and right-size replica costs.");
        }
        rationale = `GatewayBoundary=${verifiedEdge}, monthlyCost=$${peakMetrics.estimatedMonthlyCostUsd}.`;
        break;
      }

      default:
        break;
    }

    criterionResults.push({
      criterionId: crit.id,
      title: crit.title,
      dimension: crit.dimension,
      evaluationType: crit.evaluationType,
      weight: crit.weight,
      status: "evaluated",
      score,
      normalizedScorePct: normalizeCriterionScore(score),
      evidenceIds: evIds,
      rationale,
    });
  }

  let evaluatedWeightPct = 0;
  let pendingWeightPct = 0;
  let weightedSum = 0;
  let pendingCount = 0;

  for (const cr of criterionResults) {
    if (cr.status === "evaluated" && cr.normalizedScorePct !== undefined) {
      evaluatedWeightPct += cr.weight;
      weightedSum += cr.normalizedScorePct * cr.weight;
    } else {
      pendingWeightPct += cr.weight;
      pendingCount += 1;
    }
  }

  const rawEvaluatedScore =
    evaluatedWeightPct > 0 ? weightedSum / evaluatedWeightPct : 0;

  const policy = getPressureModePolicy(session.mode, session.pressureMode);
  const disclosedPenalty = submission.hintsUsed.length * policy.hintPenaltyDisclosedPerHintPct;
  const evaluatedWeightedScore = Number(
    Math.max(0, rawEvaluatedScore - disclosedPenalty).toFixed(2)
  );

  const finalNormalizedScore =
    pendingCount === 0 ? evaluatedWeightedScore : undefined;

  const status: EvaluationResult["status"] =
    pendingCount === 0 ? "completed" : "partial";

  const feedback: FeedbackSummary = {
    whatWorked,
    whatIsMissing,
    criticalIssues,
    performanceFindings,
    reliabilityFindings,
    securityFindings,
    tradeOffObservations: [
      submission.tradeOffExplanation.trim().length > 10
        ? `Candidate rationale recorded: "${submission.tradeOffExplanation.trim().slice(0, 180)}"`
        : "No explicit trade-off narrative recorded; explain what guarantee or cost you intentionally sacrificed.",
    ],
    recommendedImprovements,
    nextLearningSteps: [
      criticalIssues.length > 0
        ? "Resolve critical SPOF / tail-latency findings and re-run peak simulation."
        : "Experiment with a counterfactual lower-cost revision to test efficiency frontiers.",
    ],
  };

  return {
    scenarioStates,
    evaluation: {
      id: `eval_${submission.id}`,
      sessionId: session.id,
      submissionId: submission.id,
      rubricId: rubric.id,
      rubricVersion: rubric.version,
      status,
      criterionResults,
      evaluatedWeightedScore,
      finalNormalizedScore,
      evaluatedWeightPct,
      pendingWeightPct,
      evidences,
      findings,
      feedback,
      confidenceSummary: {
        evaluatedCriteriaCount: criterionResults.length - pendingCount,
        pendingCriteriaCount: pendingCount,
        missingEvidenceCount: findings.filter((f) => f.severity === "critical").length,
        unsupportedCapabilities: [
          "Hardware NIC / kernel-level TCP buffer variance",
          "Subjective communication fluency without human reviewer sign-off",
        ],
        qualitativeDisclaimer:
          "Automated checks evaluate architecture behavior and simulation evidence; human communication review criteria remain explicitly pending until reviewed, and scores do not predict real-world hiring decisions.",
      },
      evaluatedAtIso,
    },
  };
}

export function aggregateLearningProgress(params: {
  userId: string;
  challengeId: string;
  attempts: ChallengeAttempt[];
}): LearningProgress {
  const relevant = params.attempts.filter(
    (a) => a.userId === params.userId && a.challengeId === params.challengeId
  );

  if (relevant.length === 0) {
    return {
      userId: params.userId,
      challengeId: params.challengeId,
      attempts: 0,
      completed: false,
      masteredCriteria: [],
      improvementAreas: [],
      masteryExplanation: "No submitted attempts yet.",
    };
  }

  let bestScore = 0;
  let lastIso = relevant[0].submittedAtIso;
  const dimensionStrongCounts: Record<string, number> = {};
  const dimensionWeakCounts: Record<string, number> = {};
  let lowHintHighScoreAttempts = 0;

  for (const att of relevant) {
    if (att.evaluation.evaluatedWeightedScore > bestScore) {
      bestScore = att.evaluation.evaluatedWeightedScore;
    }
    if (att.submittedAtIso > lastIso) lastIso = att.submittedAtIso;

    if (att.evaluation.evaluatedWeightedScore >= 75 && att.hintsUsedCount <= 2) {
      lowHintHighScoreAttempts += 1;
    }

    for (const cr of att.evaluation.criterionResults) {
      if (cr.status !== "evaluated" || cr.score === undefined) continue;
      if (cr.score >= 2) {
        dimensionStrongCounts[cr.dimension] =
          (dimensionStrongCounts[cr.dimension] || 0) + 1;
      } else {
        dimensionWeakCounts[cr.dimension] =
          (dimensionWeakCounts[cr.dimension] || 0) + 1;
      }
    }
  }

  const masteredCriteria = Object.entries(dimensionStrongCounts)
    .filter(
      ([dim, strongCount]) =>
        strongCount >= 2 ||
        (strongCount >= 1 && lowHintHighScoreAttempts >= 1 && (dimensionWeakCounts[dim] || 0) === 0)
    )
    .map(([dim]) => dim);

  const improvementAreas = Object.entries(dimensionWeakCounts)
    .filter(([, weakCount]) => weakCount >= 1)
    .map(([dim]) => dim);

  const completed = relevant.some((a) => a.evaluation.evaluatedWeightedScore >= 60);

  return {
    userId: params.userId,
    challengeId: params.challengeId,
    attempts: relevant.length,
    completed,
    bestEvaluatedScore: Number(bestScore.toFixed(2)),
    lastAttemptAtIso: lastIso,
    masteredCriteria,
    improvementAreas,
    masteryExplanation:
      masteredCriteria.length > 0
        ? `Derived from ${relevant.length} attempt(s) with repeated >=2/3 criterion performance and <=2 hints on strong runs.`
        : `Requires repeated >=2/3 criterion evidence across attempts before declaring mastery (single attempts alone do not grant mastery).`,
  };
}

export function compareChallengeAttempts(
  earlier: ChallengeAttempt,
  later: ChallengeAttempt
): {
  scoreDelta: number;
  hintsDelta: number;
  findingsDelta: number;
  elapsedSecondsDelta: number;
  summary: string;
} {
  const scoreDelta = Number(
    (later.evaluation.evaluatedWeightedScore - earlier.evaluation.evaluatedWeightedScore).toFixed(2)
  );
  const hintsDelta = later.hintsUsedCount - earlier.hintsUsedCount;
  const findingsDelta = later.evaluation.findings.length - earlier.evaluation.findings.length;
  const elapsedSecondsDelta = later.elapsedSeconds - earlier.elapsedSeconds;

  return {
    scoreDelta,
    hintsDelta,
    findingsDelta,
    elapsedSecondsDelta,
    summary: `Score ${scoreDelta >= 0 ? "+" : ""}${scoreDelta}%, critical/warning findings ${findingsDelta >= 0 ? "+" : ""}${findingsDelta}, hints ${hintsDelta >= 0 ? "+" : ""}${hintsDelta}.`,
  };
}

export function recommendNextChallenges(params: {
  currentChallengeId: string;
  improvementAreas: string[];
  completedChallengeIds: string[];
}): string[] {
  const completed = new Set(params.completedChallengeIds);
  const candidates = SYSTEM_DESIGN_CHALLENGES.filter(
    (c) => c.id !== params.currentChallengeId && !completed.has(c.id)
  );
  const prioritized = candidates.sort((a, b) => {
    const scoreA = params.improvementAreas.some((w) => a.concepts.join(" ").toLowerCase().includes(w))
      ? 1
      : 0;
    const scoreB = params.improvementAreas.some((w) => b.concepts.join(" ").toLowerCase().includes(w))
      ? 1
      : 0;
    return scoreB - scoreA;
  });
  return prioritized.slice(0, 3).map((c) => c.id);
}

export function buildSessionReport(params: {
  challenge: SystemDesignChallenge;
  session: InterviewSession;
  submission: DesignSubmission;
  evaluation: EvaluationResult;
  followUpQuestionsAsked: number;
  recommendedNextChallenges: string[];
  generatedAtIso: string;
}): SessionReport {
  const {
    challenge,
    session,
    submission,
    evaluation,
    followUpQuestionsAsked,
    recommendedNextChallenges,
    generatedAtIso,
  } = params;

  const discoveredRequirements = challenge.requirements.filter((r) =>
    session.discoveredRequirementIds.includes(r.id)
  );
  const durationSeconds = Math.round(session.monotonicElapsedMs / 1000);

  const mdLines: string[] = [
    `# System Design Session Report — ${challenge.title}`,
    `- **Challenge ID / Version:** ${challenge.id} (v${challenge.version})`,
    `- **Difficulty:** ${challenge.difficulty} | **Mode:** ${session.mode} (${session.pressureMode})`,
    `- **Duration:** ${durationSeconds}s | **Hints Used:** ${submission.hintsUsed.length}`,
    ``,
    `## Discovered Requirements (${discoveredRequirements.length}/${challenge.requirements.length})`,
    ...discoveredRequirements.map((r) => `- **[${r.code} · ${r.kind}]** ${r.title}: ${r.description}`),
    ``,
    `## Capacity Estimation`,
    `- Average RPS: **${submission.estimation.averageRps}** | Peak RPS: **${submission.estimation.peakRps}**`,
    `- Daily Storage: **${submission.estimation.dailyStorageBytes.toLocaleString()} B** | Replicated Total: **${submission.estimation.formattedReplicatedTb} TB**`,
    `- Bandwidth: **${submission.estimation.bandwidthMbps} Mbps**`,
    `- *Caveat:* ${submission.estimation.caveat}`,
    ``,
    `## Design Summary`,
    `- **API Endpoints:** ${submission.apiDesign.endpoints.length}`,
    `- **Data Entities:** ${submission.dataModel.entities.length}`,
    `- **Architecture Revision:** ${submission.architecture.revisionId} (\`${submission.architecture.contentHash}\`)`,
    ``,
    `## Evidence-Based Evaluation (${evaluation.status.toUpperCase()})`,
    `- **Evaluated Weighted Score (${evaluation.evaluatedWeightPct}% weight):** ${evaluation.evaluatedWeightedScore}%`,
    `- **Pending Qualitative Weight:** ${evaluation.pendingWeightPct}%`,
    ...evaluation.criterionResults.map(
      (c) =>
        `- **${c.title}** [${c.evaluationType}]: ${
          c.status === "pending"
            ? "PENDING REVIEW"
            : `${c.score}/3 (${c.normalizedScorePct}%)`
        } — ${c.rationale}`
    ),
    ``,
    `## Feedback & Next Steps`,
    ...evaluation.feedback.whatWorked.map((w) => `- Strength: ${w}`),
    ...evaluation.feedback.criticalIssues.map((c) => `- Critical Issue: ${c}`),
    ...evaluation.feedback.recommendedImprovements.map((i) => `- Recommended Improvement: ${i}`),
    ``,
    `> *Note:* ${evaluation.confidenceSummary.qualitativeDisclaimer}`,
  ];

  const markdown = mdLines.join("\n");
  const jsonPayload = JSON.stringify(
    {
      generatedAtIso,
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      difficulty: challenge.difficulty,
      mode: session.mode,
      durationSeconds,
      discoveredRequirementIds: session.discoveredRequirementIds,
      estimation: submission.estimation,
      apiDesign: submission.apiDesign,
      dataModel: submission.dataModel,
      architectureRevisionId: submission.architecture.revisionId,
      evaluation,
      followUpQuestionsAsked,
      recommendedNextChallenges,
    },
    null,
    2
  );

  return {
    generatedAtIso,
    challengeId: challenge.id,
    challengeTitle: challenge.title,
    difficulty: challenge.difficulty,
    mode: session.mode,
    durationSeconds,
    discoveredRequirements,
    estimation: submission.estimation,
    apiEndpointsCount: submission.apiDesign.endpoints.length,
    dataEntitiesCount: submission.dataModel.entities.length,
    architectureRevisionId: submission.architecture.revisionId,
    evaluatedWeightedScore: evaluation.evaluatedWeightedScore,
    evaluationStatus: evaluation.status,
    strengths: evaluation.feedback.whatWorked,
    weaknesses: [
      ...evaluation.feedback.criticalIssues,
      ...evaluation.feedback.whatIsMissing,
    ],
    findingsCount: evaluation.findings.length,
    followUpQuestionsAsked,
    recommendedNextChallenges,
    markdown,
    jsonPayload,
  };
}
