import { ArchitectureAnalysisExecutionEngine } from "../analysis/analysis-execution-engine";
import type { AnalysisFaultInjection } from "../analysis/analysis-schemas";
import { withComputedRevisionHash } from "../analysis/revisions/revision-diff-engine";
import type {
  ArchitectureTemplate,
  ScenarioExpectedObservation,
  ScenarioObservationComparison,
  TemplateScenario,
  TemplateScenarioExecutionResult,
} from "./template-schemas";

function mapTemplateFaultToAnalysisFault(
  fault: TemplateScenario["faultSchedule"][number] | undefined,
  defaultTargetId: string
): AnalysisFaultInjection {
  if (!fault || fault.type === "none") {
    return {
      id: "f_none",
      type: "none",
      targetComponentId: defaultTargetId,
      atMs: 0,
      durationMs: 100,
    };
  }
  const typeMap: Record<
    Exclude<TemplateScenario["faultSchedule"][number]["type"], "none">,
    AnalysisFaultInjection["type"]
  > = {
    node_down: "service_crash",
    az_outage: "az_outage",
    region_outage: "region_outage",
    db_slowdown: "db_outage",
    cache_flush: "cache_stampede",
    queue_backlog: "queue_overload",
    network_partition: "network_partition",
    retry_storm: "retry_storm",
  };
  return {
    id: `f_${fault.type}_${fault.atMs}`,
    type: typeMap[fault.type],
    targetComponentId: fault.targetId ?? defaultTargetId,
    atMs: Math.max(0, fault.atMs),
    durationMs: 220,
  };
}

function evaluateObservation(
  obs: ScenarioExpectedObservation,
  values: Record<ScenarioExpectedObservation["metric"], number | null>
): ScenarioObservationComparison {
  const observed = values[obs.metric];
  const expectedSummary =
    obs.operator === "between"
      ? `${obs.targetValue}..${obs.upperValue ?? obs.targetValue}${obs.unit ? ` ${obs.unit}` : ""}`
      : `${obs.operator} ${obs.targetValue}${obs.unit ? ` ${obs.unit}` : ""}`;

  if (observed === null || !Number.isFinite(observed)) {
    return {
      observationId: obs.id,
      metric: obs.metric,
      description: obs.description,
      expectedSummary,
      observedValue: null,
      status: "unsupported",
      detail: `Metric "${obs.metric}" is not directly modeled by this simulation engine run.`,
    };
  }

  let matched = false;
  switch (obs.operator) {
    case "lt":
      matched = observed < obs.targetValue;
      break;
    case "lte":
      matched = observed <= obs.targetValue;
      break;
    case "gt":
      matched = observed > obs.targetValue;
      break;
    case "gte":
      matched = observed >= obs.targetValue;
      break;
    case "between":
      matched =
        observed >= obs.targetValue &&
        observed <= (obs.upperValue ?? obs.targetValue);
      break;
  }

  return {
    observationId: obs.id,
    metric: obs.metric,
    description: obs.description,
    expectedSummary,
    observedValue: Number(observed.toFixed(4)),
    status: matched ? "matched" : "deviated",
    detail: matched
      ? `Observed ${Number(observed.toFixed(4))} matches ${expectedSummary}.`
      : `Observed ${Number(observed.toFixed(4))} deviated from expected ${expectedSummary}.`,
  };
}

/**
 * Executes a TemplateScenario in complete isolation using the shared
 * ArchitectureAnalysisExecutionEngine without mutating the source template.
 */
export function runTemplateScenarioIsolated(params: {
  template: ArchitectureTemplate;
  scenario: TemplateScenario;
  seedOverride?: number;
  variantComponentOverrides?: Array<{
    componentId: string;
    replicas?: number;
    capacityPerReplicaRps?: number;
    cacheHitRatio?: number;
  }>;
}): TemplateScenarioExecutionResult {
  const { template, scenario } = params;
  const seed = params.seedOverride ?? scenario.seed;

  // Deep clone revision so scenario overrides never mutate template state
  const baseRev = JSON.parse(
    JSON.stringify(template.topology.analysisRevision)
  ) as ArchitectureTemplate["topology"]["analysisRevision"];

  const candRev = withComputedRevisionHash({
    ...baseRev,
    revisionId: `${baseRev.revisionId}_${scenario.id}`,
    routingPolicy: scenario.workloadConfig.routingPolicy,
    scalingMode: scenario.workloadConfig.scalingMode,
    maxReplicas: scenario.workloadConfig.maxReplicas,
    components: baseRev.components.map((c) => {
      const sOver = scenario.configurationOverrides[c.id];
      const vOver = params.variantComponentOverrides?.find(
        (v) => v.componentId === c.id
      );
      return {
        ...c,
        replicas: vOver?.replicas ?? sOver?.replicas ?? c.replicas,
        capacityPerReplicaRps:
          vOver?.capacityPerReplicaRps ??
          sOver?.capacityPerReplicaRps ??
          c.capacityPerReplicaRps,
        cacheHitRatio:
          vOver?.cacheHitRatio ?? sOver?.cacheHitRatio ?? c.cacheHitRatio,
        multiAz: sOver?.multiAz ?? c.multiAz,
      };
    }),
  });

  const fault = mapTemplateFaultToAnalysisFault(
    scenario.faultSchedule[0],
    candRev.components[0]?.id ?? "entry"
  );

  const boundedRps = Math.min(
    10000,
    Math.max(10, Math.round(scenario.workloadConfig.workloadRps))
  );
  const boundedDuration = Math.min(30000, Math.max(200, scenario.durationMs));

  const expResult = ArchitectureAnalysisExecutionEngine.runExperiment({
    version: 1,
    id: `tpl_sim_${template.manifest.id}_${scenario.id}_${seed}`,
    projectId: `tpl_${template.manifest.id}`,
    label: `${template.manifest.title} — ${scenario.title}`,
    architectureRevisionId: candRev.revisionId,
    workloadRps: boundedRps,
    durationMs: boundedDuration,
    seed,
    scoringEnabled: true,
    baselineRevision: withComputedRevisionHash(baseRev),
    candidateRevision: candRev,
    fault,
    constraints: [],
    objectives: [
      { id: "obj_p", dimension: "performance", weight: 0.4, targetDirection: "minimize" },
      { id: "obj_r", dimension: "reliability", weight: 0.35, targetDirection: "maximize" },
      { id: "obj_c", dimension: "cost", weight: 0.25, targetDirection: "minimize" },
    ],
  });

  const m = expResult.finalState.candidateMetrics;
  const criticalSpofCount = expResult.finalState.spofs.filter(
    (s) => s.severity === "critical"
  ).length;
  const dropRate =
    m.offeredRps > 0 ? m.rejectedRps / m.offeredRps : 0;

  const avgCacheHit = (() => {
    const cacheComps = candRev.components.filter((c) => c.kind === "cache");
    if (cacheComps.length === 0) return 0;
    return (
      cacheComps.reduce((sum, c) => sum + c.cacheHitRatio, 0) / cacheComps.length
    );
  })();

  const avgRecoverySec = (() => {
    if (fault.type === "none") return 0;
    const targetComp =
      candRev.components.find((c) => c.id === fault.targetComponentId) ??
      candRev.components[0];
    return targetComp ? Math.round(targetComp.mttrMinutes * 60 * 0.15) : 45;
  })();

  const metricValues: Record<ScenarioExpectedObservation["metric"], number | null> = {
    throughputRps: m.completedRps,
    p95LatencyMs: m.p95LatencyMs,
    errorRate: m.errorRate,
    availability: m.simulatedAvailability,
    dropRate,
    queueDepth: m.backloggedQueueDepth,
    cacheHitRatio: avgCacheHit,
    monthlyCostUsd: m.estimatedMonthlyCostUsd,
    criticalSpofCount,
    recoveryTimeSec: avgRecoverySec,
  };

  const observations = scenario.expectedObservations.map((obs) =>
    evaluateObservation(obs, metricValues)
  );

  return {
    scenarioId: scenario.id,
    templateId: template.manifest.id,
    templateVersion: template.manifest.version,
    seed,
    deterministicHash: m.contentHash,
    durationMs: boundedDuration,
    supportedCapabilities: [...template.simulationCapabilities],
    unsupportedCapabilities: [...template.unsupportedCapabilities],
    summary: m,
    queueDepthPeak: m.backloggedQueueDepth,
    effectiveCacheHitRatio: Number(avgCacheHit.toFixed(4)),
    recoveryTimeSec: avgRecoverySec,
    observations,
    allExpectedMatched: observations.every((o) => o.status === "matched"),
  };
}
