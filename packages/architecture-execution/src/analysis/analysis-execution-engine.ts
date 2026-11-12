import { VirtualClock } from "../engine/virtual-clock";
import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import { RuntimeStateHelper, type ModeledRuntimeState } from "../domain/runtime-state";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import { DeterministicRandom } from "../resilience/deterministic-random";
import { evaluateMMcQueue } from "../capacity/queueing/queueing-theory-engine";
import { MetricAggregator } from "../traffic/metric-aggregator";
import type { AnalysisExecutionEvent } from "./analysis-events";
import {
  AnalysisExperimentSchema,
  type AnalysisBottleneckFinding,
  type AnalysisEvidence,
  type AnalysisExperiment,
  type AnalysisNormalizedMetrics,
  type AnalysisRevision,
  type AnalysisStatisticalSummary,
  type ModeledAnalysisRuntimeState,
} from "./analysis-schemas";
import { listSimulationCapabilities } from "./adapters/capability-registry";
import {
  computeRevisionContentHash,
  computeSemanticDiff,
  withComputedRevisionHash,
} from "./revisions/revision-diff-engine";
import { analyzeReliabilityAndFailureDomains } from "./reliability/reliability-spof-engine";
import {
  buildAdrRecord,
  buildExecutiveReportMarkdown,
  buildTransparentScorecard,
  evaluateTradeOffs,
  generateEvidenceBackedRecommendations,
  validateHardConstraints,
} from "./comparisons/tradeoff-decision-engine";
import { AnalysisInvariantMonitor } from "./invariants/analysis-invariants";

function simulateRevisionMetricsAndBottlenecks(params: {
  revision: AnalysisRevision;
  experiment: AnalysisExperiment;
  runId: string;
  seed: number;
}): {
  metrics: AnalysisNormalizedMetrics;
  bottlenecks: AnalysisBottleneckFinding[];
  evidences: AnalysisEvidence[];
  spofRes: ReturnType<typeof analyzeReliabilityAndFailureDomains>;
} {
  const { revision, experiment, runId, seed } = params;
  const rng = new DeterministicRandom(seed);
  const compMap = new Map(revision.components.map((c) => [c.id, c]));

  const spofRes = analyzeReliabilityAndFailureDomains({
    revision,
    fault: experiment.fault,
    workloadRps: experiment.workloadRps,
    runId,
  });

  const evidences: AnalysisEvidence[] = [...spofRes.evidences];
  const bottlenecks: AnalysisBottleneckFinding[] = [];

  // Calculate effective capacity along each component taking cache hit offload & replication into account
  const cacheComp = revision.components.find((c) => c.kind === "cache");
  const cacheHitOffload =
    cacheComp && experiment.fault.type !== "cache_stampede"
      ? cacheComp.cacheHitRatio
      : 0;

  let sysEffCapRps = Number.MAX_SAFE_INTEGER;
  let totalMonthlyCost = 0;
  let totalComputeMs = 0;
  let totalQueueMs = 0;
  let totalDbMs = 0;
  let totalCacheMs = 0;
  let totalNetMs = 0;
  let totalRetryMs = 0;
  let faultDroppedRequests = 0;
  const criticalPathIds: string[] = [];

  const maxRetryFactor = revision.edges.reduce(
    (max, e) => Math.max(max, e.retryFactor),
    experiment.fault.type === "retry_storm" ? 2.4 : 1
  );
  const effectiveOfferedRps = experiment.workloadRps * maxRetryFactor;

  for (const comp of revision.components) {
    totalMonthlyCost += comp.replicas * comp.monthlyCostPerReplicaUsd;
    if (comp.multiAz && comp.replicas > 1) {
      totalMonthlyCost += comp.monthlyCostPerReplicaUsd * 0.12;
    }

    const loadOnComp =
      comp.kind === "database"
        ? effectiveOfferedRps * (1 - cacheHitOffload)
        : effectiveOfferedRps;

    const dbReadMultiplier =
      comp.kind === "database" && comp.replicas > 1 ? 0.72 : 1;
    const compCapRps = comp.replicas * comp.capacityPerReplicaRps;

    // Check if fault specifically hits this component
    const hitByFault =
      experiment.fault.type !== "none" &&
      (comp.id === experiment.fault.targetComponentId ||
        (experiment.fault.type === "az_outage" && !comp.multiAz) ||
        (experiment.fault.type === "region_outage" && revision.components.every((x) => x.region === comp.region)));

    const faultProtectedByAsync = revision.edges.some(
      (e) => e.target === comp.id && e.communicationMode === "async_queue"
    );

    const survivingCapRps = hitByFault
      ? comp.replicas > 1 && comp.multiAz
        ? compCapRps * 0.65
        : comp.replicationMode !== "none" && comp.replicas > 1
          ? compCapRps * 0.75
          : 0
      : compCapRps;

    if (hitByFault && survivingCapRps === 0 && !faultProtectedByAsync) {
      faultDroppedRequests += Math.round(loadOnComp * (experiment.fault.durationMs / 1000));
    }

    sysEffCapRps = Math.min(sysEffCapRps, survivingCapRps || compCapRps);

    const rho = survivingCapRps > 0 ? loadOnComp / survivingCapRps : 1.5;
    const satPct = Math.min(100, Math.round(rho * 100));

    const mmc = evaluateMMcQueue(
      Math.max(1, loadOnComp),
      Math.max(1, comp.capacityPerReplicaRps),
      Math.max(1, comp.replicas)
    );
    const qWait = mmc.applicable && mmc.expectedWaitQueueMsWq !== null
      ? mmc.expectedWaitQueueMsWq
      : Math.min(350, Math.round((rho - 0.85) * 280));

    const compBaseLat = comp.baseLatencyMs * dbReadMultiplier;
    totalQueueMs += Math.max(0, qWait);

    if (comp.kind === "database") {
      const writePenalty =
        comp.replicationMode === "sync" || comp.replicationMode === "quorum" ? 14 : 0;
      totalDbMs += compBaseLat + writePenalty;
    } else if (comp.kind === "cache") {
      totalCacheMs += experiment.fault.type === "cache_stampede" ? compBaseLat * 3 : compBaseLat;
    } else if (comp.kind === "gateway") {
      totalNetMs += compBaseLat;
    } else {
      totalComputeMs += compBaseLat;
    }

    if (maxRetryFactor > 1) {
      totalRetryMs += Math.round((maxRetryFactor - 1) * 14);
    }

    criticalPathIds.push(comp.id);

    // Record bottlenecks where utilization >= 82% or fault hit
    if (satPct >= 82 || (hitByFault && survivingCapRps < loadOnComp)) {
      const evId = `ev_bn_${runId}_${comp.id}`;
      evidences.push({
        id: evId,
        runId,
        sourceEventIds: [],
        metricIds: ["saturation_pct", "queue_wait_ms"],
        componentIds: [comp.id],
        timeRangeMs: [0, experiment.durationMs],
        kind: "performance",
        summary: `Component '${comp.id}' reached ${satPct}% load/capacity ratio (load=${Math.round(loadOnComp)} vs cap=${Math.round(survivingCapRps)} req/s, qWait=${Math.round(qWait)}ms).`,
      });

      const hasSaturatedDownstream = comp.dependencyIds.some((depId) => {
        const dc = compMap.get(depId);
        return dc && dc.replicas * dc.capacityPerReplicaRps < loadOnComp;
      });

      const limitingRes =
        comp.kind === "database"
          ? "database"
          : comp.kind === "cache"
            ? "cache_miss"
            : comp.kind === "queue"
              ? "queue"
              : hasSaturatedDownstream
                ? "downstream_dependency"
                : "cpu_compute";

      bottlenecks.push({
        id: `bn_${comp.id}`,
        componentId: comp.id,
        limitingResource: limitingRes,
        role: hasSaturatedDownstream ? "secondary_symptom" : "primary_root_cause",
        severity: satPct >= 95 ? "critical" : "high",
        saturationPct: satPct,
        affectedRps: Math.round(loadOnComp),
        latencyImpactMs: Math.round(compBaseLat + qWait),
        rankingScore: Number(
          (satPct * (hasSaturatedDownstream ? 0.7 : 1.15) + qWait * 0.25).toFixed(1)
        ),
        evidenceIds: [evId],
        explanation: hasSaturatedDownstream
          ? `Upstream queue/wait on '${comp.id}' is a downstream symptom of saturated dependency.`
          : `Component '${comp.id}' (${limitingRes}) saturated at ${satPct}% (${Math.round(loadOnComp)} / ${Math.round(survivingCapRps)} req/s).`,
      });
    }
  }

  // Sort bottlenecks descending by rankingScore so primary bottlenecks surface first
  bottlenecks.sort((a, b) => b.rankingScore - a.rankingScore);

  if (sysEffCapRps === Number.MAX_SAFE_INTEGER) sysEffCapRps = 0;

  const acceptedRps = Math.min(Math.round(effectiveOfferedRps), Math.round(sysEffCapRps + 40));
  const completedRps =
    faultDroppedRequests > 0
      ? Math.max(0, Math.round(Math.min(experiment.workloadRps, sysEffCapRps) * 0.55))
      : Math.min(Math.round(experiment.workloadRps), Math.round(sysEffCapRps));
  const rejectedRps = Math.max(0, Math.round(experiment.workloadRps - completedRps));
  const errorRate =
    experiment.workloadRps > 0
      ? Number(
          Math.min(
            1,
            (rejectedRps + faultDroppedRequests * 0.4) /
              Math.max(1, experiment.workloadRps)
          ).toFixed(4)
        )
      : 0;

  // Generate sample distribution for exact percentile calculation via MetricAggregator
  const baseTotalLat =
    totalNetMs + totalQueueMs + totalComputeMs + totalDbMs + totalCacheMs + totalRetryMs;
  const latSamples: number[] = [];
  for (let i = 0; i < 40; i++) {
    const jitter = rng.nextInt(-3, 8);
    const tail = i >= 37 ? Math.round(totalQueueMs * 0.45 + 12) : 0;
    latSamples.push(Math.max(4, Math.round(baseTotalLat + jitter + tail)));
  }

  const p50 = Math.round(MetricAggregator.calculatePercentile(latSamples, 50));
  const p95 = Math.round(MetricAggregator.calculatePercentile(latSamples, 95));
  const p99 = Math.round(MetricAggregator.calculatePercentile(latSamples, 99));

  const perfEvId = `ev_perf_${runId}`;
  evidences.push({
    id: perfEvId,
    runId,
    sourceEventIds: [],
    metricIds: ["p95_latency_ms", "completed_rps", "error_rate"],
    componentIds: criticalPathIds,
    timeRangeMs: [0, experiment.durationMs],
    kind: "performance",
    summary: `p95=${p95}ms, throughput=${completedRps} req/s, capacity=${Math.round(sysEffCapRps)} req/s, errors=${(errorRate * 100).toFixed(2)}%.`,
  });

  const costEvId = `ev_cost_${runId}`;
  evidences.push({
    id: costEvId,
    runId,
    sourceEventIds: [],
    metricIds: ["monthly_cost_usd"],
    componentIds: revision.components.map((c) => c.id),
    timeRangeMs: [0, experiment.durationMs],
    kind: "cost",
    summary: `Synthetic monthly run-rate $${totalMonthlyCost.toFixed(2)} across ${revision.components.reduce((a, b) => a + b.replicas, 0)} replicas.`,
  });

  const simAvail = Number(Math.max(0, 1 - errorRate).toFixed(4));
  const allowedErrBudget = 0.01;
  const budgetRemaining = Number(
    Math.max(-100, Math.min(100, (1 - errorRate / allowedErrBudget) * 100)).toFixed(1)
  );

  const windowRequests = completedRps * (experiment.durationMs / 1000);
  const costPerOk =
    windowRequests > 0
      ? Number(
          (
            (totalMonthlyCost * (experiment.durationMs / (30 * 24 * 3600 * 1000))) /
            windowRequests
          ).toFixed(7)
        )
      : null;

  const dbComp = revision.components.find((c) => c.kind === "database");
  const consistencyGuarantee = !dbComp
    ? "Stateless (no durable DB)"
    : dbComp.replicationMode === "sync" || dbComp.replicationMode === "quorum"
      ? "Strong / Quorum Read-Your-Writes (Zero Acknowledged Data Loss)"
      : dbComp.replicationMode === "async"
        ? "Eventual Consistency Across Async Replicas (Bounded RPO Risk)"
        : "Single-Instance Linearizable (No Redundancy)";

  const regionsCount = new Set(revision.components.map((c) => c.region)).size;
  const statefulCount = revision.components.filter(
    (c) => c.kind === "database" || c.kind === "storage"
  ).length;
  const complexityScore =
    revision.components.length * 2 +
    revision.edges.length +
    regionsCount * 3 +
    statefulCount * 2;

  return {
    metrics: {
      runId,
      revisionId: revision.revisionId,
      contentHash: computeRevisionContentHash(revision),
      offeredRps: Math.round(experiment.workloadRps),
      acceptedRps,
      completedRps,
      rejectedRps,
      timedOutRequests: Math.round(faultDroppedRequests),
      backloggedQueueDepth: Math.max(
        0,
        Math.round((experiment.workloadRps - sysEffCapRps) * 0.25)
      ),
      errorRate,
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      latencyAttributionMs: {
        network: Math.round(totalNetMs),
        queue: Math.round(totalQueueMs),
        compute: Math.round(totalComputeMs),
        database: Math.round(totalDbMs),
        cache: Math.round(totalCacheMs),
        retries: Math.round(totalRetryMs),
      },
      criticalPathComponentIds: criticalPathIds,
      effectiveCapacityRps: Math.round(sysEffCapRps),
      utilizationPct:
        sysEffCapRps > 0
          ? Math.min(100, Math.round((experiment.workloadRps / sysEffCapRps) * 100))
          : 100,
      simulatedAvailability: simAvail,
      analyticalAvailability: spofRes.analyticalAvailability,
      availabilityAssumptionsHeld: spofRes.assumptionsHeld,
      availabilityCaveat: spofRes.caveat,
      errorBudgetRemainingPct: budgetRemaining,
      estimatedMonthlyCostUsd: Number(totalMonthlyCost.toFixed(2)),
      costPerSuccessfulRequestUsd: costPerOk,
      costProvenanceLabel:
        "Synthetic educational rates (not live cloud provider billing invoices).",
      achievedRpoSec: spofRes.achievedRpoSec,
      achievedRtoSec: spofRes.achievedRtoSec,
      consistencyGuarantee,
      complexityScore,
      complexityDimensions: {
        componentsCount: revision.components.length,
        edgesCount: revision.edges.length,
        regionsCount,
        statefulCount,
      },
    },
    bottlenecks,
    evidences,
    spofRes,
  };
}

export class ArchitectureAnalysisExecutionEngine {
  public static runExperiment(rawExperiment: AnalysisExperiment): {
    experiment: AnalysisExperiment;
    trace: ExecutionTrace;
    frames: VisualizationFrame[];
    finalState: ModeledAnalysisRuntimeState;
  } {
    const parsed = AnalysisExperimentSchema.parse(rawExperiment);
    const baselineOriginalHash = computeRevisionContentHash(parsed.baselineRevision);
    const baselineRev = withComputedRevisionHash(parsed.baselineRevision);
    const candidateRev = withComputedRevisionHash(parsed.candidateRevision);

    const experiment: AnalysisExperiment = {
      ...parsed,
      baselineRevision: baselineRev,
      candidateRevision: candidateRev,
    };

    const clock = new VirtualClock(0);
    const events: AnalysisExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    let seq = 0;

    // 1. Run Baseline in complete isolation
    const baselineRunId = `run_base_${experiment.id}_${experiment.seed}`;
    const baselineRes = simulateRevisionMetricsAndBottlenecks({
      revision: baselineRev,
      experiment,
      runId: baselineRunId,
      seed: experiment.seed,
    });

    // 2. Run Candidate in complete isolation (same seed / common random numbers)
    const candidateRunId = `run_cand_${experiment.id}_${experiment.seed}`;
    const candidateRes = simulateRevisionMetricsAndBottlenecks({
      revision: candidateRev,
      experiment,
      runId: candidateRunId,
      seed: experiment.seed,
    });

    // Optional multi-seed repetition statistics
    let statisticalSummary: AnalysisStatisticalSummary | undefined;
    if (experiment.seedSet && experiment.seedSet.length > 1) {
      const runs = experiment.seedSet.map((s) =>
        simulateRevisionMetricsAndBottlenecks({
          revision: candidateRev,
          experiment,
          runId: `run_stat_${s}`,
          seed: s,
        }).metrics
      );
      const p95s = runs.map((r) => r.p95LatencyMs).sort((a, b) => a - b);
      const meanP95 = p95s.reduce((a, b) => a + b, 0) / p95s.length;
      const variance =
        p95s.reduce((a, b) => a + Math.pow(b - meanP95, 2), 0) / p95s.length;
      const medianP95 = p95s[Math.floor(p95s.length / 2)]!;
      const meanAvail =
        runs.reduce((a, b) => a + b.simulatedAvailability, 0) / runs.length;

      statisticalSummary = {
        seedCount: experiment.seedSet.length,
        seeds: [...experiment.seedSet],
        candidateP95MeanMs: Number(meanP95.toFixed(1)),
        candidateP95MedianMs: medianP95,
        candidateP95StdDevMs: Number(Math.sqrt(variance).toFixed(2)),
        candidateAvailabilityMean: Number(meanAvail.toFixed(4)),
      };
    }

    const diff = computeSemanticDiff(baselineRev, candidateRev);
    const allEvidences = [...baselineRes.evidences, ...candidateRes.evidences];
    const combinedBottlenecks = [
      ...baselineRes.bottlenecks,
      ...candidateRes.bottlenecks,
    ].sort((a, b) => b.rankingScore - a.rankingScore);
    const combinedSpofs = [...baselineRes.spofRes.spofs, ...candidateRes.spofRes.spofs];

    const baselineChecks = validateHardConstraints(
      experiment.constraints,
      baselineRes.metrics
    );
    const candidateChecks = validateHardConstraints(
      experiment.constraints,
      candidateRes.metrics
    );

    const tradeOffs = evaluateTradeOffs({
      experiment,
      baselineMetrics: baselineRes.metrics,
      candidateMetrics: candidateRes.metrics,
      evidences: allEvidences,
    });

    const scorecard = buildTransparentScorecard({
      experiment,
      baselineMetrics: baselineRes.metrics,
      candidateMetrics: candidateRes.metrics,
      baselineChecks,
      candidateChecks,
    });

    const recommendations = generateEvidenceBackedRecommendations({
      experiment,
      baselineMetrics: baselineRes.metrics,
      candidateMetrics: candidateRes.metrics,
      bottlenecks: combinedBottlenecks,
      spofs: combinedSpofs,
      evidences: allEvidences,
    });

    const adr = buildAdrRecord({
      experiment,
      diff,
      baselineMetrics: baselineRes.metrics,
      candidateMetrics: candidateRes.metrics,
      checks: candidateChecks,
      recommendations,
      bottlenecks: combinedBottlenecks,
      evidences: allEvidences,
    });

    const executiveReportMarkdown = buildExecutiveReportMarkdown({
      experiment,
      diff,
      baseline: baselineRes.metrics,
      candidate: candidateRes.metrics,
      adr,
    });

    const fairnessWarnings: string[] = [];
    if (!experiment.seedSet || experiment.seedSet.length <= 1) {
      fairnessWarnings.push(
        "Single-seed run reported; enable multi-seed repetition for confidence intervals."
      );
    }

    const invariants = AnalysisInvariantMonitor.verify({
      baselineOriginalHash,
      baselineRevision: baselineRev,
      candidateRevision: candidateRev,
      baselineMetrics: baselineRes.metrics,
      candidateMetrics: candidateRes.metrics,
      evidences: allEvidences,
      bottlenecks: combinedBottlenecks,
      recommendations,
      adr,
      constraintsEvaluatedExplicitly: true,
    });

    const buildSnapshotState = (
      variant: "baseline" | "candidate"
    ): ModeledAnalysisRuntimeState => ({
      virtualTimeMs: clock.now(),
      activeViewVariant: variant,
      experimentId: experiment.id,
      baselineMetrics: baselineRes.metrics,
      candidateMetrics: candidateRes.metrics,
      diff,
      evidences: allEvidences,
      bottlenecks: combinedBottlenecks,
      spofs: combinedSpofs,
      failurePropagation:
        variant === "baseline"
          ? baselineRes.spofRes.failurePropagation
          : candidateRes.spofRes.failurePropagation,
      blastRadiusComponentIds:
        variant === "baseline"
          ? baselineRes.spofRes.blastRadiusComponentIds
          : candidateRes.spofRes.blastRadiusComponentIds,
      baselineConstraintChecks: baselineChecks,
      candidateConstraintChecks: candidateChecks,
      tradeOffs,
      scorecard,
      recommendations,
      adr,
      executiveReportMarkdown,
      capabilities: listSimulationCapabilities(),
      statisticalSummary,
      fairnessWarnings,
      invariants,
    });

    const pushStep = <T extends AnalysisExecutionEvent>(
      evt: Omit<T, "id" | "sequence" | "stateSnapshot">,
      variant: "baseline" | "candidate" = "candidate"
    ) => {
      seq++;
      const state = buildSnapshotState(variant);
      const snapshotState: ModeledRuntimeState = RuntimeStateHelper.cloneState({
        ...RuntimeStateHelper.createInitialState(undefined),
        analysisState: JSON.parse(JSON.stringify(state)),
      });
      const fullEvt = {
        ...evt,
        id: `ana_evt_${seq}`,
        sequence: seq,
        stateSnapshot: snapshotState,
      } as T;
      events.push(fullEvt);
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: clock.now(),
        activeNodeIds:
          variant === "baseline"
            ? baselineRes.spofRes.blastRadiusComponentIds
            : candidateRes.spofRes.blastRadiusComponentIds,
        activeEdgeIds: [],
        activeEvent: fullEvt,
        direction: "request",
        stepTitle: fullEvt.type.replace("analysis.", "").replace(/\./g, " "),
        stepExplanation: fullEvt.explanation,
        runtimeState: snapshotState,
      });
    };

    // Emit causal simulation trace frames for interactive timeline & step-backward seeking
    pushStep<Extract<AnalysisExecutionEvent, { type: "analysis.experiment.created" }>>(
      {
        type: "analysis.experiment.created",
        atMs: clock.now(),
        durationMs: 0,
        experimentId: experiment.id,
        explanation: `Created immutable baseline (${baselineRev.contentHash}) & candidate (${candidateRev.contentHash}) experiment at ${experiment.workloadRps} req/s.`,
      },
      "baseline"
    );

    clock.advance(80);
    pushStep<Extract<AnalysisExecutionEvent, { type: "analysis.run.completed" }>>(
      {
        type: "analysis.run.completed",
        atMs: clock.now(),
        durationMs: 80,
        variant: "baseline",
        p95Ms: baselineRes.metrics.p95LatencyMs,
        explanation: `Baseline completed: p95=${baselineRes.metrics.p95LatencyMs}ms, Sim Avail=${(baselineRes.metrics.simulatedAvailability * 100).toFixed(2)}%, Cost=$${baselineRes.metrics.estimatedMonthlyCostUsd}/mo.`,
      },
      "baseline"
    );

    clock.advance(80);
    pushStep<Extract<AnalysisExecutionEvent, { type: "analysis.run.completed" }>>(
      {
        type: "analysis.run.completed",
        atMs: clock.now(),
        durationMs: 80,
        variant: "candidate",
        p95Ms: candidateRes.metrics.p95LatencyMs,
        explanation: `Candidate completed: p95=${candidateRes.metrics.p95LatencyMs}ms, Sim Avail=${(candidateRes.metrics.simulatedAvailability * 100).toFixed(2)}%, Cost=$${candidateRes.metrics.estimatedMonthlyCostUsd}/mo.`,
      },
      "candidate"
    );

    if (combinedBottlenecks[0]) {
      clock.advance(60);
      const topBn = combinedBottlenecks[0];
      pushStep<Extract<AnalysisExecutionEvent, { type: "analysis.bottleneck.detected" }>>(
        {
          type: "analysis.bottleneck.detected",
          atMs: clock.now(),
          durationMs: 0,
          componentId: topBn.componentId,
          limitingResource: topBn.limitingResource,
          explanation: topBn.explanation,
        },
        "candidate"
      );
    }

    for (const step of candidateRes.spofRes.failurePropagation.slice(0, 3)) {
      clock.advance(40);
      pushStep<Extract<AnalysisExecutionEvent, { type: "analysis.failure.propagated" }>>(
        {
          type: "analysis.failure.propagated",
          atMs: clock.now(),
          durationMs: 40,
          componentId: step.componentId,
          impact: step.impact,
          explanation: step.impact,
        },
        "candidate"
      );
    }

    clock.advance(60);
    pushStep<Extract<AnalysisExecutionEvent, { type: "analysis.adr.created" }>>(
      {
        type: "analysis.adr.created",
        atMs: clock.now(),
        durationMs: 0,
        adrId: adr.id,
        explanation: `Generated Proposed ${adr.id} linking ${adr.evidenceIds.length} evidence references.`,
      },
      "candidate"
    );

    const finalState = buildSnapshotState("candidate");
    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: candidateRev.components[0]?.id ?? "gateway",
      request: {
        id: `ana_req_${experiment.id}`,
        method: "POST",
        path: "/analysis/compare",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: 500,
        maxHops: 50,
        maxDurationMs: experiment.durationMs,
      },
      timing: {
        nodeDurationMs: 20,
        edgeDurationMs: 10,
      },
      presetId: "custom",
    };

    const trace: ExecutionTrace = {
      runId: `ana_run_${experiment.id}_${experiment.seed}`,
      architectureId: "arch_analysis_sim",
      architectureRevisionId: experiment.architectureRevisionId,
      snapshotHash: candidateRev.contentHash,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: candidateRev.components.map((c) => c.id),
      traversedEdgeIds: candidateRev.edges.map((e) => e.id),
      configuration,
      events,
      totalDurationMs: clock.now(),
      totalEvents: events.length,
      totalHops: candidateRev.components.length + events.length,
      outcome: finalState.invariants.allPassed ? "success" : "failure",
      terminalReason: finalState.invariants.allPassed
        ? `Analysis comparison complete (${diff.summary}).`
        : finalState.invariants.violations.join("; "),
      frames,
    };

    return {
      experiment,
      trace,
      frames,
      finalState,
    };
  }
}

