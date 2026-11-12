import type {
  AnalysisComponentConfig,
  AnalysisEvidence,
  AnalysisFailurePropagationStep,
  AnalysisFaultInjection,
  AnalysisRevision,
  AnalysisSpofFinding,
} from "../analysis-schemas";

export function analyzeReliabilityAndFailureDomains(params: {
  revision: AnalysisRevision;
  fault: AnalysisFaultInjection;
  workloadRps: number;
  runId: string;
}): {
  analyticalAvailability: number | null;
  assumptionsHeld: boolean;
  caveat: string;
  spofs: AnalysisSpofFinding[];
  failurePropagation: AnalysisFailurePropagationStep[];
  blastRadiusComponentIds: string[];
  achievedRpoSec: number | null;
  achievedRtoSec: number | null;
  evidences: AnalysisEvidence[];
} {
  const { revision, fault, workloadRps, runId } = params;
  const spofs: AnalysisSpofFinding[] = [];
  const evidences: AnalysisEvidence[] = [];

  // Map reverse dependencies (who calls compId)
  const callersMap = new Map<string, string[]>();
  for (const edge of revision.edges) {
    if (!callersMap.has(edge.target)) callersMap.set(edge.target, []);
    callersMap.get(edge.target)!.push(edge.source);
  }
  for (const c of revision.components) {
    for (const dep of c.dependencyIds) {
      if (!callersMap.has(dep)) callersMap.set(dep, []);
      if (!callersMap.get(dep)!.includes(c.id)) {
        callersMap.get(dep)!.push(c.id);
      }
    }
  }

  // Detect shared failure domains (common-cause failure invalidating parallel independence)
  const zonesByKind = new Map<string, number>();
  let sharedDatabaseCount = 0;
  for (const c of revision.components) {
    const key = `${c.region}:${c.zone}`;
    zonesByKind.set(key, (zonesByKind.get(key) ?? 0) + 1);
    if (c.kind === "database" && c.replicas === 1 && c.replicationMode === "none") {
      sharedDatabaseCount++;
    }
  }

  const allSingleZone = zonesByKind.size === 1 && revision.components.every((c) => !c.multiAz);
  const assumptionsHeld = !allSingleZone && sharedDatabaseCount === 0;

  // Component MTBF/(MTBF+MTTR) series calculation only strictly reported if independence holds
  let seriesAvailability = 1;
  for (const c of revision.components) {
    const singleAvail = c.mtbfHours / (c.mtbfHours + c.mttrMinutes / 60);
    // Only apply parallel independence if multiAz or independent failure domains
    const effectiveAvail =
      c.replicas > 1 && (c.multiAz || c.failureDomain !== "global_shared")
        ? 1 - Math.pow(1 - singleAvail, Math.min(c.replicas, 3))
        : singleAvail;
    seriesAvailability *= effectiveAvail;
  }

  // Identify Single Points of Failure (SPOFs)
  for (const c of revision.components) {
    const dependents = callersMap.get(c.id) ?? [];
    const hasRedundancy =
      c.replicas > 1 ||
      c.multiAz ||
      c.replicationMode === "sync" ||
      c.replicationMode === "quorum" ||
      c.replicationMode === "async";

    if (!hasRedundancy || (c.failureDomain === "global_shared" && c.replicas === 1)) {
      const evId = `ev_spof_${runId}_${c.id}`;
      evidences.push({
        id: evId,
        runId,
        sourceEventIds: [],
        metricIds: ["replicas", "failure_domain"],
        componentIds: [c.id, ...dependents],
        timeRangeMs: [0, 600],
        kind: "reliability",
        summary: `Component '${c.id}' runs with replicas=${c.replicas}, multiAz=${c.multiAz}, replication=${c.replicationMode} inside domain '${c.failureDomain}'.`,
      });
      spofs.push({
        id: `spof_${c.id}`,
        componentId: c.id,
        failureDomain: c.failureDomain,
        dependentComponentIds: dependents,
        mitigationPath:
          c.kind === "database"
            ? "Add synchronous/quorum multi-AZ replica or automated standby failover."
            : "Increase replicas >= 2 across multiple Availability Zones.",
        evidenceIds: [evId],
        severity: dependents.length > 0 || c.kind === "database" ? "critical" : "high",
        explanation: `'${c.id}' lacks independent failover/redundancy (${dependents.length} caller(s) depend on it).`,
      });
    } else if (c.replicas > 1 && !c.multiAz && c.failureDomain === "az") {
      // Warning: replicas all colocated in a single AZ share common-cause failure!
      const evId = `ev_ccf_${runId}_${c.id}`;
      evidences.push({
        id: evId,
        runId,
        sourceEventIds: [],
        metricIds: ["zone_diversity"],
        componentIds: [c.id],
        timeRangeMs: [0, 600],
        kind: "reliability",
        summary: `All ${c.replicas} replicas of '${c.id}' share single zone '${c.zone}'.`,
      });
      spofs.push({
        id: `spof_az_${c.id}`,
        componentId: c.id,
        failureDomain: "az",
        dependentComponentIds: dependents,
        mitigationPath: "Spread replicas across multiple AZs (multiAz=true) to break common-cause failure.",
        evidenceIds: [evId],
        severity: "high",
        explanation: `Colocated replicas of '${c.id}' share single AZ '${c.zone}' (common-cause SPOF under AZ outage).`,
      });
    }
  }

  // BFS Fault Propagation & Blast Radius calculation
  const failurePropagation: AnalysisFailurePropagationStep[] = [];
  const blastRadiusSet = new Set<string>();

  if (fault.type !== "none") {
    const startComp =
      revision.components.find((c) => c.id === fault.targetComponentId) ??
      revision.components[revision.components.length - 1]!;
    const queue: Array<{ compId: string; depth: number }> = [
      { compId: startComp.id, depth: 0 },
    ];
    blastRadiusSet.add(startComp.id);

    let seq = 0;
    while (queue.length > 0) {
      const { compId, depth } = queue.shift()!;
      const comp = revision.components.find((c) => c.id === compId);
      const mitigatedByAsync =
        depth > 0 &&
        revision.edges.some(
          (e) =>
            e.target === compId &&
            e.communicationMode === "async_queue"
        );

      seq++;
      failurePropagation.push({
        sequence: seq,
        atMs: fault.atMs + depth * 35,
        componentId: compId,
        impact:
          depth === 0
            ? `Direct fault '${fault.type}' impacted '${compId}'.`
            : mitigatedByAsync
              ? `Async queue buffered upstream caller '${compId}' against direct blocking.`
              : `Downstream dependency failure propagated synchronously to '${compId}' (${comp?.label ?? compId}).`,
        cumulativeAffectedRps: mitigatedByAsync
          ? Math.round(workloadRps * 0.15)
          : Math.round(workloadRps),
      });

      const callers = callersMap.get(compId) ?? [];
      for (const caller of callers) {
        if (!blastRadiusSet.has(caller)) {
          blastRadiusSet.add(caller);
          queue.push({ compId: caller, depth: depth + 1 });
        }
      }
    }
  }

  // Model RPO/RTO from stateful DB/Storage components
  const dbComp: AnalysisComponentConfig | undefined = revision.components.find(
    (c) => c.kind === "database" || c.kind === "storage"
  );
  const achievedRpoSec = !dbComp
    ? 0
    : dbComp.replicationMode === "sync" || dbComp.replicationMode === "quorum"
      ? 0
      : dbComp.replicationMode === "async"
        ? Math.max(5, dbComp.replicationLagSec || 15)
        : dbComp.hasBackup
          ? 3600
          : null;

  const achievedRtoSec = !dbComp
    ? 10
    : dbComp.multiAz && (dbComp.replicationMode === "sync" || dbComp.replicationMode === "quorum")
      ? 25
      : dbComp.replicationMode === "async"
        ? 90
        : dbComp.hasBackup
          ? 600
          : null;

  const caveat = assumptionsHeld
    ? "Analytical availability derived from component MTBF/(MTBF+MTTR) assuming repaired failures and multi-AZ independence; distinct from simulated success ratio."
    : "Analytical parallel independence formula cannot assume 1-∏(1-Ri) reliability because single-zone colocation or un-replicated database introduces common-cause SPOF.";

  return {
    analyticalAvailability: assumptionsHeld
      ? Number(seriesAvailability.toFixed(5))
      : null,
    assumptionsHeld,
    caveat,
    spofs,
    failurePropagation,
    blastRadiusComponentIds: Array.from(blastRadiusSet),
    achievedRpoSec,
    achievedRtoSec,
    evidences,
  };
}

