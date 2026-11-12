import type {
  AnalysisAdrRecord,
  AnalysisBottleneckFinding,
  AnalysisConstraint,
  AnalysisConstraintCheck,
  AnalysisEvidence,
  AnalysisExperiment,
  AnalysisNormalizedMetrics,
  AnalysisRecommendation,
  AnalysisRevisionDiff,
  AnalysisScorecard,
  AnalysisSpofFinding,
  AnalysisTradeOffEntry,
} from "../analysis-schemas";

export function validateHardConstraints(
  constraints: AnalysisConstraint[],
  metrics: AnalysisNormalizedMetrics
): AnalysisConstraintCheck[] {
  return constraints.flatMap((c) => {
    const checks: AnalysisConstraintCheck[] = [];
    if (c.maxP95LatencyMs !== undefined) {
      checks.push({
        constraintId: `${c.id}:p95`,
        label: `${c.label} (p95 <= ${c.maxP95LatencyMs}ms)`,
        passed: metrics.p95LatencyMs <= c.maxP95LatencyMs,
        actualValue: `${metrics.p95LatencyMs}ms`,
        requiredValue: `<= ${c.maxP95LatencyMs}ms`,
      });
    }
    if (c.minAvailability !== undefined) {
      checks.push({
        constraintId: `${c.id}:avail`,
        label: `${c.label} (Sim Avail >= ${(c.minAvailability * 100).toFixed(2)}%)`,
        passed: metrics.simulatedAvailability >= c.minAvailability,
        actualValue: `${(metrics.simulatedAvailability * 100).toFixed(3)}%`,
        requiredValue: `>= ${(c.minAvailability * 100).toFixed(3)}%`,
      });
    }
    if (c.maxMonthlyCostUsd !== undefined) {
      checks.push({
        constraintId: `${c.id}:cost`,
        label: `${c.label} (Budget <= $${c.maxMonthlyCostUsd})`,
        passed: metrics.estimatedMonthlyCostUsd <= c.maxMonthlyCostUsd,
        actualValue: `$${metrics.estimatedMonthlyCostUsd}`,
        requiredValue: `<= $${c.maxMonthlyCostUsd}`,
      });
    }
    if (c.maxRtoSec !== undefined) {
      const passed =
        metrics.achievedRtoSec !== null && metrics.achievedRtoSec <= c.maxRtoSec;
      checks.push({
        constraintId: `${c.id}:rto`,
        label: `${c.label} (RTO <= ${c.maxRtoSec}s)`,
        passed,
        actualValue:
          metrics.achievedRtoSec !== null ? `${metrics.achievedRtoSec}s` : "N/A (No Recovery)",
        requiredValue: `<= ${c.maxRtoSec}s`,
      });
    }
    if (c.zeroDataLossRequired) {
      checks.push({
        constraintId: `${c.id}:rpo`,
        label: `${c.label} (RPO = 0s)`,
        passed: metrics.achievedRpoSec === 0,
        actualValue:
          metrics.achievedRpoSec !== null ? `${metrics.achievedRpoSec}s` : "Unbounded",
        requiredValue: "0s (Sync/Quorum)",
      });
    }
    return checks;
  });
}

export function evaluateTradeOffs(params: {
  experiment: AnalysisExperiment;
  baselineMetrics: AnalysisNormalizedMetrics;
  candidateMetrics: AnalysisNormalizedMetrics;
  evidences: AnalysisEvidence[];
}): AnalysisTradeOffEntry[] {
  const { experiment, baselineMetrics, candidateMetrics, evidences } = params;
  const perfEv = evidences.filter((e) => e.kind === "performance").map((e) => e.id);
  const costEv = evidences.filter((e) => e.kind === "cost").map((e) => e.id);
  const relEv = evidences.filter((e) => e.kind === "reliability").map((e) => e.id);
  const fallbackEv = evidences[0]?.id ? [evidences[0].id] : [];

  return [
    {
      id: "to_latency_cost",
      dimensionA: "p95 Latency (ms)",
      dimensionB: "Monthly Cost (USD)",
      baselineSummary: `${baselineMetrics.p95LatencyMs}ms @ $${baselineMetrics.estimatedMonthlyCostUsd}/mo`,
      candidateSummary: `${candidateMetrics.p95LatencyMs}ms @ $${candidateMetrics.estimatedMonthlyCostUsd}/mo`,
      evidenceIds: [...new Set([...perfEv, ...costEv, ...fallbackEv])],
      summary: `Candidate changed p95 by ${candidateMetrics.p95LatencyMs - baselineMetrics.p95LatencyMs}ms and synthetic monthly cost by $${(candidateMetrics.estimatedMonthlyCostUsd - baselineMetrics.estimatedMonthlyCostUsd).toFixed(2)}.`,
      assumptions: [
        experiment.baselineRevision.components[0]
          ? "Constant base service times plus M/M/c queue contention."
          : "Baseline model assumptions apply.",
      ],
      limitations: [candidateMetrics.costProvenanceLabel],
    },
    {
      id: "to_avail_cost",
      dimensionA: "Simulated Availability",
      dimensionB: "Monthly Cost (USD)",
      baselineSummary: `${(baselineMetrics.simulatedAvailability * 100).toFixed(2)}% @ $${baselineMetrics.estimatedMonthlyCostUsd}`,
      candidateSummary: `${(candidateMetrics.simulatedAvailability * 100).toFixed(2)}% @ $${candidateMetrics.estimatedMonthlyCostUsd}`,
      evidenceIds: [...new Set([...relEv, ...costEv, ...fallbackEv])],
      summary: `Availability shifted by ${((candidateMetrics.simulatedAvailability - baselineMetrics.simulatedAvailability) * 100).toFixed(2)}% under modeled workload & fault '${experiment.fault.type}'.`,
      assumptions: [candidateMetrics.availabilityCaveat],
      limitations: ["Simulated availability reflects scenario failure injection, not long-horizon production SLA."],
    },
    {
      id: "to_consistency_latency",
      dimensionA: "Consistency & Durability",
      dimensionB: "Write / End-to-End Latency",
      baselineSummary: `${baselineMetrics.consistencyGuarantee} (RPO=${baselineMetrics.achievedRpoSec ?? "Unbounded"}s)`,
      candidateSummary: `${candidateMetrics.consistencyGuarantee} (RPO=${candidateMetrics.achievedRpoSec ?? "Unbounded"}s)`,
      evidenceIds: [...new Set([...perfEv, ...fallbackEv])],
      summary: `Synchronous/quorum writes eliminate acknowledged data loss window (RPO=0s) at higher coordination write latency compared to async/single-node.`,
      assumptions: ["Replication delay follows modeled sync/async acknowledgment paths."],
      limitations: ["Does not execute real storage WAL fsyncs."],
    },
    {
      id: "to_complexity_scalability",
      dimensionA: "Operational Complexity",
      dimensionB: "Effective Capacity (req/s)",
      baselineSummary: `Complexity ${baselineMetrics.complexityScore} · Cap ${baselineMetrics.effectiveCapacityRps} req/s`,
      candidateSummary: `Complexity ${candidateMetrics.complexityScore} · Cap ${candidateMetrics.effectiveCapacityRps} req/s`,
      evidenceIds: [...new Set([...perfEv, ...fallbackEv])],
      summary: `Candidate capacity delta: ${candidateMetrics.effectiveCapacityRps - baselineMetrics.effectiveCapacityRps} req/s across ${candidateMetrics.complexityDimensions.componentsCount} component(s) and ${candidateMetrics.complexityDimensions.regionsCount} region(s).`,
      assumptions: ["Complexity metric counts modeled nodes, edges, regions, and stateful services."],
      limitations: ["Structural complexity proxy is illustrative, not an absolute universal measure."],
    },
  ];
}

export function buildTransparentScorecard(params: {
  experiment: AnalysisExperiment;
  baselineMetrics: AnalysisNormalizedMetrics;
  candidateMetrics: AnalysisNormalizedMetrics;
  baselineChecks: AnalysisConstraintCheck[];
  candidateChecks: AnalysisConstraintCheck[];
}): AnalysisScorecard {
  const {
    experiment,
    baselineMetrics,
    candidateMetrics,
    baselineChecks,
    candidateChecks,
  } = params;

  const weights: Record<string, number> = {
    performance: 0.3,
    reliability: 0.3,
    capacity: 0.2,
    cost: 0.2,
  };
  for (const obj of experiment.objectives) {
    if (weights[obj.dimension] !== undefined) {
      weights[obj.dimension] = obj.weight;
    }
  }

  const scoreMetrics = (m: AnalysisNormalizedMetrics): Record<string, number | null> => {
    const perfScore = Math.max(0, Math.min(100, Math.round(100 - m.p95LatencyMs / 4)));
    const relScore = Math.max(0, Math.min(100, Math.round(m.simulatedAvailability * 100)));
    const capScore =
      m.offeredRps > 0
        ? Math.max(0, Math.min(100, Math.round((m.effectiveCapacityRps / (m.offeredRps * 1.4)) * 100)))
        : 100;
    const costScore = Math.max(
      0,
      Math.min(100, Math.round(100 - m.estimatedMonthlyCostUsd / 25))
    );
    const analyticalScore =
      m.analyticalAvailability !== null
        ? Math.round(m.analyticalAvailability * 100)
        : null;
    const recoveryScore =
      m.achievedRtoSec !== null
        ? Math.max(0, Math.min(100, Math.round(100 - m.achievedRtoSec / 8)))
        : null;

    return {
      performance: perfScore,
      reliability: relScore,
      capacity: capScore,
      cost: costScore,
      analytical_availability: analyticalScore,
      recovery: recoveryScore,
    };
  };

  const bScores = scoreMetrics(baselineMetrics);
  const cScores = scoreMetrics(candidateMetrics);

  const computeWeighted = (s: Record<string, number | null>): number | null => {
    if (!experiment.scoringEnabled) return null;
    let totalW = 0;
    let sum = 0;
    for (const [k, w] of Object.entries(weights)) {
      const val = s[k];
      if (val !== null && val !== undefined && w > 0) {
        sum += val * w;
        totalW += w;
      }
    }
    return totalW > 0 ? Number((sum / totalW).toFixed(1)) : null;
  };

  return {
    scoringEnabled: experiment.scoringEnabled,
    formulaDescription:
      "Composite = Σ(weight_i * dimScore_i) / Σ(weight_i) across normalized simulated dimensions; unavailable analytical/recovery dimensions stay null.",
    weights,
    baselineDimensionScores: bScores,
    candidateDimensionScores: cScores,
    baselineComposite: computeWeighted(bScores),
    candidateComposite: computeWeighted(cScores),
    baselineConstraintsPassed: baselineChecks.every((c) => c.passed),
    candidateConstraintsPassed: candidateChecks.every((c) => c.passed),
  };
}

export function generateEvidenceBackedRecommendations(params: {
  experiment: AnalysisExperiment;
  baselineMetrics: AnalysisNormalizedMetrics;
  candidateMetrics: AnalysisNormalizedMetrics;
  bottlenecks: AnalysisBottleneckFinding[];
  spofs: AnalysisSpofFinding[];
  evidences: AnalysisEvidence[];
}): AnalysisRecommendation[] {
  const {
    experiment,
    baselineMetrics,
    candidateMetrics,
    bottlenecks,
    spofs,
    evidences,
  } = params;
  const recs: AnalysisRecommendation[] = [];
  const defaultEv = evidences[0]?.id ? [evidences[0].id] : [];

  for (const bn of bottlenecks.filter((b) => b.role === "primary_root_cause").slice(0, 2)) {
    const improvedInCandidate =
      candidateMetrics.p95LatencyMs < baselineMetrics.p95LatencyMs - 8 ||
      candidateMetrics.rejectedRps < baselineMetrics.rejectedRps;

    const category: AnalysisRecommendation["category"] =
      bn.limitingResource === "database" || bn.limitingResource === "connection_pool"
        ? "performance"
        : bn.limitingResource === "cache_miss"
          ? "performance"
          : "capacity";

    recs.push({
      id: `rec_${bn.componentId}_${bn.limitingResource}`,
      title:
        bn.limitingResource === "database"
          ? `Relieve database saturation on ${bn.componentId}`
          : bn.limitingResource === "cache_miss"
            ? `Improve cache hit ratio or add read-through cache in front of ${bn.componentId}`
            : `Expand serving capacity / replicas on ${bn.componentId}`,
      category,
      affectedComponentIds: [bn.componentId],
      evidenceIds: bn.evidenceIds.length > 0 ? bn.evidenceIds : defaultEv,
      observedProblem: bn.explanation,
      proposedChangeDescription:
        bn.limitingResource === "database"
          ? "Add read replicas, enable connection pooling/caching, or partition hot keys."
          : "Increase replica count or introduce an asynchronous queue buffer ahead of downstream writes.",
      expectedEffect: `Reduces p95 latency contribution (~${bn.latencyImpactMs}ms) and raises headroom above saturation.`,
      tradeOff: "Increases synthetic monthly infrastructure cost and potentially replication lag on read replicas.",
      uncertainty: "Assumes uniform key distribution and bounded downstream lock contention.",
      validationStatus: improvedInCandidate
        ? "validated_improved"
        : "pending",
    });
  }

  for (const spof of spofs.slice(0, 2)) {
    const availImproved =
      candidateMetrics.simulatedAvailability >
      baselineMetrics.simulatedAvailability + 0.005;
    recs.push({
      id: `rec_spof_${spof.componentId}`,
      title: `Eliminate SPOF / common-cause risk on ${spof.componentId}`,
      category: "reliability",
      affectedComponentIds: [spof.componentId, ...spof.dependentComponentIds],
      evidenceIds: spof.evidenceIds.length > 0 ? spof.evidenceIds : defaultEv,
      observedProblem: spof.explanation,
      proposedChangeDescription: spof.mitigationPath,
      expectedEffect: "Prevents total service loss during single-node or single-AZ failure.",
      tradeOff: "Adds cross-AZ standby cost and cross-zone replication latency.",
      uncertainty: "Does not eliminate global control-plane or application-logic bugs shared across replicas.",
      validationStatus: availImproved ? "validated_improved" : "pending",
    });
  }

  if (
    candidateMetrics.utilizationPct < 25 &&
    candidateMetrics.estimatedMonthlyCostUsd > baselineMetrics.estimatedMonthlyCostUsd
  ) {
    recs.push({
      id: "rec_cost_overprovisioned",
      title: "Right-size overprovisioned replicas",
      category: "cost",
      affectedComponentIds: experiment.candidateRevision.components.map((c) => c.id),
      evidenceIds: evidences.filter((e) => e.kind === "cost").map((e) => e.id).slice(0, 2).concat(defaultEv).slice(0, 2),
      observedProblem: `Candidate fleet utilization is only ${candidateMetrics.utilizationPct}% while monthly synthetic cost rose to $${candidateMetrics.estimatedMonthlyCostUsd}.`,
      proposedChangeDescription: "Trim excess standby replicas or switch to reactive/predictive HPA.",
      expectedEffect: "Cuts synthetic monthly cost while keeping p95 within configured SLO.",
      tradeOff: "Lowers instant burst absorption headroom prior to scale-out readiness.",
      uncertainty: "Depends on actual traffic burst ramp speed.",
      validationStatus: "pending",
    });
  }

  return recs;
}

export function buildAdrRecord(params: {
  experiment: AnalysisExperiment;
  diff: AnalysisRevisionDiff;
  baselineMetrics: AnalysisNormalizedMetrics;
  candidateMetrics: AnalysisNormalizedMetrics;
  checks: AnalysisConstraintCheck[];
  recommendations: AnalysisRecommendation[];
  bottlenecks: AnalysisBottleneckFinding[];
  evidences: AnalysisEvidence[];
}): AnalysisAdrRecord {
  const {
    experiment,
    diff,
    baselineMetrics,
    candidateMetrics,
    checks,
    recommendations,
    bottlenecks,
    evidences,
  } = params;

  const adrId = `ADR-${experiment.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "001"}`;
  const allConstraintsOk = checks.every((c) => c.passed);

  const md = [
    `# ${adrId}: ${experiment.label}`,
    "",
    "## Status",
    "Proposed (Awaiting Engineering Review — never auto-accepted)",
    "",
    "## Context",
    `Experiment \`${experiment.id}\` compared baseline revision \`${diff.baselineHash}\` vs candidate revision \`${diff.candidateHash}\` under ${experiment.workloadRps} req/s simulated workload and fault injection \`${experiment.fault.type}\`.`,
    "",
    "## Problem",
    bottlenecks.length > 0
      ? bottlenecks.map((b) => `- ${b.explanation}`).join("\n")
      : "- Evaluate capacity headroom, latency tail, failure domain resilience, and cost efficiency.",
    "",
    "## Constraints",
    checks.length > 0
      ? checks
          .map(
            (c) =>
              `- **${c.label}**: ${c.passed ? "PASS" : "FAIL"} (observed ${c.actualValue}, required ${c.requiredValue})`
          )
          .join("\n")
      : "- No hard constraints configured; evaluated on balanced Pareto trade-offs.",
    "",
    "## Alternatives Considered",
    `- Baseline (${experiment.baselineRevision.label}, ${diff.baselineHash}): p95=${baselineMetrics.p95LatencyMs}ms, Avail=${(baselineMetrics.simulatedAvailability * 100).toFixed(2)}%, Est. Monthly Cost=$${baselineMetrics.estimatedMonthlyCostUsd}`,
    `- Candidate (${experiment.candidateRevision.label}, ${diff.candidateHash}): p95=${candidateMetrics.p95LatencyMs}ms, Avail=${(candidateMetrics.simulatedAvailability * 100).toFixed(2)}%, Est. Monthly Cost=$${candidateMetrics.estimatedMonthlyCostUsd}`,
    "",
    "## Evaluation Method",
    `Deterministic seeded simulation (seed=${experiment.seed}) across ${experiment.durationMs}ms virtual clock horizon reusing NXTQR queueing, reliability/SPOF, and synthetic cost models.`,
    "",
    "## Evidence",
    evidences.slice(0, 6).map((e) => `- [${e.id}] (${e.kind}) ${e.summary}`).join("\n"),
    "",
    "## Decision",
    allConstraintsOk
      ? `Candidate architecture \`${experiment.candidateRevision.label}\` satisfies all configured constraints (${diff.summary}).`
      : "Candidate requires additional mitigation before adoption because one or more hard constraints failed.",
    "",
    "## Consequences & Trade-Offs",
    recommendations.length > 0
      ? recommendations
          .map((r) => `- ${r.title}: ${r.expectedEffect} Trade-off: ${r.tradeOff}`)
          .join("\n")
      : "- Maintains structural parity within modeled assumptions.",
    "",
    "## Validation Plan",
    "- Re-run deterministic comparison with candidate mutations and confirm SLO + RPO/RTO compliance before production design approval.",
    "",
  ].join("\n");

  return {
    id: adrId,
    title: experiment.label,
    status: "Proposed",
    createdAt: "2026-11-12T00:00:00.000Z",
    experimentId: experiment.id,
    baselineRevisionHash: diff.baselineHash,
    candidateRevisionHash: diff.candidateHash,
    evidenceIds: evidences.map((e) => e.id),
    findingIds: bottlenecks.map((b) => b.id),
    recommendationIds: recommendations.map((r) => r.id),
    markdownText: md,
  };
}

export function buildExecutiveReportMarkdown(params: {
  experiment: AnalysisExperiment;
  diff: AnalysisRevisionDiff;
  baseline: AnalysisNormalizedMetrics;
  candidate: AnalysisNormalizedMetrics;
  adr: AnalysisAdrRecord;
}): string {
  const { experiment, diff, baseline, candidate, adr } = params;
  return [
    `# Architecture Analysis Report — ${experiment.label}`,
    "",
    `1. **Baseline vs Candidate Diff**: ${diff.summary}`,
    `2. **Workload & Fault**: ${experiment.workloadRps} req/s, fault=\`${experiment.fault.type}\`, seed=${experiment.seed}`,
    `3. **Performance**: p95 ${baseline.p95LatencyMs}ms -> ${candidate.p95LatencyMs}ms | Completed ${baseline.completedRps} -> ${candidate.completedRps} req/s`,
    `4. **Simulated Availability**: ${(baseline.simulatedAvailability * 100).toFixed(2)}% -> ${(candidate.simulatedAvailability * 100).toFixed(2)}%`,
    `5. **Synthetic Monthly Cost**: $${baseline.estimatedMonthlyCostUsd} -> $${candidate.estimatedMonthlyCostUsd} (${candidate.costProvenanceLabel})`,
    `6. **Linked ADR**: ${adr.id} (${adr.status})`,
  ].join("\n");
}
