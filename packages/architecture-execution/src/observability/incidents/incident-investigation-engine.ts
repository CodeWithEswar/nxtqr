import type {
  IncidentEvidenceItem,
  IncidentPostmortemReport,
  IncidentRuntime,
  InvestigationViewMode,
  ObservabilityFaultConfig,
  ObservabilityServiceConfig,
  RootCauseGraphEdge,
  RootCauseGraphNode,
  RootCauseHypothesis,
  SLOEvaluationRuntime,
  ServiceHealthRuntime,
} from "../observability-schemas";

export function computeObservabilityBlastRadius(
  directServiceIds: string[],
  services: ObservabilityServiceConfig[]
): {
  direct: string[];
  downstream: string[];
  upstream: string[];
  allAffected: string[];
} {
  const direct = Array.from(new Set(directServiceIds));
  const downstreamSet = new Set<string>();
  const upstreamSet = new Set<string>();

  const svcMap = new Map(services.map((s) => [s.id, s]));

  // Downstream traversal
  const qDown = [...direct];
  while (qDown.length > 0) {
    const cur = qDown.shift()!;
    const svc = svcMap.get(cur);
    if (!svc) continue;
    for (const dep of svc.dependencies) {
      if (!direct.includes(dep.targetId) && !downstreamSet.has(dep.targetId)) {
        downstreamSet.add(dep.targetId);
        qDown.push(dep.targetId);
      }
    }
  }

  // Upstream caller traversal
  const qUp = [...direct];
  while (qUp.length > 0) {
    const cur = qUp.shift()!;
    for (const svc of services) {
      if (svc.dependencies.some((d) => d.targetId === cur)) {
        if (!direct.includes(svc.id) && !upstreamSet.has(svc.id)) {
          upstreamSet.add(svc.id);
          qUp.push(svc.id);
        }
      }
    }
  }

  const allAffected = Array.from(
    new Set([...direct, ...downstreamSet, ...upstreamSet])
  );
  return {
    direct,
    downstream: Array.from(downstreamSet),
    upstream: Array.from(upstreamSet),
    allAffected,
  };
}

export function correlateIncidentHypothesesAndGraph(params: {
  incident: IncidentRuntime;
  servicesConfig: ObservabilityServiceConfig[];
  servicesHealth: Record<string, ServiceHealthRuntime>;
  slos: SLOEvaluationRuntime[];
  investigationMode: InvestigationViewMode;
  activeFaults: ObservabilityFaultConfig[];
}): {
  hypotheses: RootCauseHypothesis[];
  graph: { nodes: RootCauseGraphNode[]; edges: RootCauseGraphEdge[] };
} {
  const {
    incident,
    servicesConfig,
    servicesHealth,
    slos,
    investigationMode,
    activeFaults,
  } = params;

  const evidenceBySvc: Record<string, IncidentEvidenceItem[]> = {};
  for (const ev of incident.evidence) {
    if (
      ev.source === "fault_ground_truth" &&
      investigationMode === "investigation"
    ) {
      continue;
    }
    const list = evidenceBySvc[ev.serviceId] ?? [];
    list.push(ev);
    evidenceBySvc[ev.serviceId] = list;
  }

  const hypotheses: RootCauseHypothesis[] = [];
  const svcMap = new Map(servicesConfig.map((s) => [s.id, s]));

  // Score each affected service deterministically from observable telemetry
  for (const sid of incident.affectedServiceIds) {
    const h = servicesHealth[sid];
    const cfg = svcMap.get(sid);
    const evList = evidenceBySvc[sid] ?? [];
    if (evList.length === 0) continue;

    // Prefer deeper dependencies over shallow gateways if both are unhealthy
    const hasHealthyDepsOnly =
      !cfg ||
      cfg.dependencies.every(
        (d) => (servicesHealth[d.targetId]?.errorRate ?? 0) < 0.05
      );
    const matchingGroundTruth =
      investigationMode === "explanation"
        ? activeFaults.find((f) => f.targetServiceId === sid)
        : undefined;

    const status: RootCauseHypothesis["status"] = matchingGroundTruth
      ? "verified"
      : hasHealthyDepsOnly &&
          ((h?.errorRate ?? 0) >= 0.1 ||
            (h?.saturationPct ?? 0) >= 80 ||
            (h?.p95LatencyMs ?? 0) >= 120)
        ? "supported"
        : "candidate";

    const score =
      (matchingGroundTruth ? 100 : 0) +
      (hasHealthyDepsOnly ? 20 : 0) +
      evList.length * 3 +
      Math.round((h?.errorRate ?? 0) * 10);

    hypotheses.push({
      id: `hyp_${incident.id}_${sid}`,
      incidentId: incident.id,
      serviceId: sid,
      description: matchingGroundTruth
        ? `Simulated fault origin in ${cfg?.label ?? sid}: ${matchingGroundTruth.description}`
        : `Observed degradation in ${cfg?.label ?? sid} (${evList.length} correlated observations)`,
      supportingEvidenceIds: evList.map((e) => e.id),
      contradictingEvidenceIds: [],
      status,
      rank: score,
      rationale: matchingGroundTruth
        ? `Explanation mode confirmed simulated ${matchingGroundTruth.type} fault on ${sid}.`
        : hasHealthyDepsOnly
          ? `Upstream callers degraded while ${sid} itself shows primary errors/saturation with no degraded downstream dependencies.`
          : `Affected alongside downstream dependencies; possible propagation symptom.`,
    });
  }

  hypotheses.sort((a, b) => b.rank - a.rank);

  // Build Root-Cause Graph distinguishing observed correlation vs verified causal
  const nodes: RootCauseGraphNode[] = [];
  const edges: RootCauseGraphEdge[] = [];
  const seenNodes = new Set<string>();

  const addNode = (n: RootCauseGraphNode) => {
    if (!seenNodes.has(n.id)) {
      seenNodes.add(n.id);
      nodes.push(n);
    }
  };

  for (const sid of incident.affectedServiceIds) {
    const label = svcMap.get(sid)?.label ?? sid;
    addNode({ id: `svc:${sid}`, label, kind: "service", serviceId: sid });
  }

  for (const svc of servicesConfig) {
    if (!incident.affectedServiceIds.includes(svc.id)) continue;
    for (const dep of svc.dependencies) {
      if (!incident.affectedServiceIds.includes(dep.targetId)) continue;
      const calleeFault =
        investigationMode === "explanation" &&
        activeFaults.some((f) => f.targetServiceId === dep.targetId);
      edges.push({
        id: `rc_edge_${dep.targetId}_${svc.id}`,
        from: `svc:${dep.targetId}`,
        to: `svc:${svc.id}`,
        relation: calleeFault ? "verified_causal" : "observed_correlation",
        label: calleeFault ? "verified causal propagation" : "correlated impact",
      });
    }
  }

  if (investigationMode === "explanation") {
    for (const f of activeFaults) {
      const fNodeId = `fault:${f.id}`;
      addNode({
        id: fNodeId,
        label: `Fault: ${f.type}`,
        kind: "fault",
        serviceId: f.targetServiceId,
      });
      if (seenNodes.has(`svc:${f.targetServiceId}`)) {
        edges.push({
          id: `rc_edge_${fNodeId}_${f.targetServiceId}`,
          from: fNodeId,
          to: `svc:${f.targetServiceId}`,
          relation: "verified_causal",
          label: "injected fault origin",
        });
      }
    }
  }

  for (const slo of slos) {
    if (slo.breached && seenNodes.has(`svc:${slo.targetServiceId}`)) {
      const sloNodeId = `slo:${slo.id}`;
      addNode({
        id: sloNodeId,
        label: `SLO Breach: ${slo.name}`,
        kind: "slo",
        serviceId: slo.targetServiceId,
      });
      edges.push({
        id: `rc_edge_${slo.targetServiceId}_${sloNodeId}`,
        from: `svc:${slo.targetServiceId}`,
        to: sloNodeId,
        relation:
          investigationMode === "explanation"
            ? "verified_causal"
            : "observed_correlation",
        label: "compliance violation",
      });
    }
  }

  return { hypotheses, graph: { nodes, edges } };
}

export function generateFactOnlyPostmortem(
  incident: IncidentRuntime,
  slos: SLOEvaluationRuntime[]
): IncidentPostmortemReport {
  const breachedSlos = slos.filter((s) => s.breached).map((s) => s.name);
  const topHyp = incident.hypotheses[0];

  return {
    incidentId: incident.id,
    title: `Postmortem: ${incident.title}`,
    summary: `Simulated incident detected at t=${incident.detectedAtMs}ms affecting ${incident.affectedServiceIds.join(", ")}.`,
    detectionSummary: `Triggered by ${incident.alertIds.length} firing alert(s); ${incident.evidence.length} evidence items correlated.`,
    timelineEntries: [...incident.timeline],
    rootCauseOrHypotheses: topHyp
      ? `${topHyp.status.toUpperCase()}: ${topHyp.description} (${topHyp.rationale})`
      : "No finalized root cause verified within recorded simulation window.",
    mitigationSummary:
      incident.mitigationsApplied.length > 0
        ? incident.mitigationsApplied
            .map((m) => `@${m.atMs}ms ${m.action} on ${m.targetServiceId}: ${m.description}`)
            .join("; ")
        : "No automated or manual simulated mitigation executed.",
    recoverySummary:
      incident.status === "resolved" && incident.resolvedAtMs !== undefined
        ? `Incident resolved at t=${incident.resolvedAtMs}ms after alert recovery checks passed.${breachedSlos.length > 0 ? ` SLOs breached during run: ${breachedSlos.join(", ")}.` : ""}`
        : `Incident status remains '${incident.status}' at end of simulation window (incomplete recovery or ongoing fault).`,
    preventiveNotes: [
      "Derived solely from recorded simulation facts without external business-loss speculation.",
      "Review dependency timeouts, circuit breakers, and alert pending/recovery hysteresis settings.",
    ],
    simulationAssumptions: [
      "Synthetic arrival rates, latency distributions, and modeled resource capacities.",
      "Postmortem contains only timestamps and events recorded in the deterministic run.",
    ],
  };
}

