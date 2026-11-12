import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import { DeterministicRandom } from "../resilience/deterministic-random";
import { MetricAggregator } from "../traffic/metric-aggregator";
import {
  ObservabilityScenarioSchema,
  type AlertInstanceRuntime,
  type IncidentEvidenceItem,
  type IncidentRuntime,
  type ModeledObservabilityRuntimeState,
  type ObservabilityMetrics,
  type ObservabilityScenario,
  type SLOEvaluationRuntime,
  type ServiceDependencyEdge,
  type ServiceHealthRuntime,
  type SimulatedLogRecord,
  type SimulatedSpanRuntime,
  type SimulatedTraceRuntime,
  type TelemetryResource,
} from "./observability-schemas";
import {
  computeTraceCriticalPath,
  evaluateTraceSampling,
} from "./traces/trace-processor";
import {
  evaluateAlertRuleTick,
  evaluateSLOForService,
  type ServiceObservationSample,
} from "./reliability/slo-alert-engine";
import {
  computeObservabilityBlastRadius,
  correlateIncidentHypothesesAndGraph,
  generateFactOnlyPostmortem,
} from "./incidents/incident-investigation-engine";
import { ObservabilityInvariantMonitor } from "./invariants/observability-invariants";

type ObsQueueItem =
  | { kind: "request_execute"; atMs: number; seq: number; reqNum: number }
  | { kind: "fault_apply"; atMs: number; seq: number; faultId: string }
  | { kind: "fault_clear"; atMs: number; seq: number; faultId: string }
  | { kind: "mitigation_apply"; atMs: number; seq: number; mitigationId: string }
  | { kind: "eval_tick"; atMs: number; seq: number };

type NewObsItem = ObsQueueItem extends infer U
  ? U extends ObsQueueItem
    ? Omit<U, "seq"> & { seq?: number }
    : never
  : never;

export class ObservabilityExecutionEngine {
  public static runScenario(rawScenario: ObservabilityScenario): ExecutionTrace {
    const parsed = ObservabilityScenarioSchema.parse(rawScenario);
    const rng = new DeterministicRandom(parsed.seed);
    const baseRuntime = RuntimeStateHelper.createInitialState();
    const runId = `obs_run_${parsed.id}_${parsed.seed}`;

    let virtualTimeMs = 0;
    let seqCounter = 0;
    let eventCounter = 0;
    let spanCounter = 0;
    let logCounter = 0;
    let sampledOutTraces = 0;
    let droppedLogs = 0;
    let alertFireTransitions = 0;
    const missingDataCoercedZeroDetected = false;

    const svcMap = new Map(parsed.services.map((s) => [s.id, s]));
    const resources: Record<string, TelemetryResource> = {};
    const serviceLatencySamples: Record<string, number[]> = {};
    const serviceRequestCounts: Record<string, number> = {};
    const serviceErrorCounts: Record<string, number> = {};
    const serviceSaturation: Record<string, number> = {};
    const serviceLatencySeries: Record<string, Array<{ timestampMs: number; value: number }>> = {};
    const serviceErrorSeries: Record<string, Array<{ timestampMs: number; value: number }>> = {};
    const serviceExemplars: Record<
      string,
      Array<{ timestampMs: number; value: number; traceId: string; spanId: string; serviceId: string }>
    > = {};

    for (const svc of parsed.services) {
      resources[svc.id] = {
        resourceId: `res_${svc.id}`,
        serviceName: svc.label,
        serviceId: svc.id,
        instanceId: `${svc.id}-pod-01`,
        version: svc.version,
        region: svc.region,
        zone: svc.zone,
        componentKind: svc.kind,
      };
      serviceLatencySamples[svc.id] = [];
      serviceRequestCounts[svc.id] = 0;
      serviceErrorCounts[svc.id] = 0;
      serviceSaturation[svc.id] = 18;
      serviceLatencySeries[svc.id] = [];
      serviceErrorSeries[svc.id] = [];
      serviceExemplars[svc.id] = [];
    }

    const depEdgeStats: Record<
      string,
      { callerId: string; calleeId: string; type: "sync" | "async" | "storage"; calls: number; errors: number; totalMs: number }
    > = {};

    const activeFaultsByService: Record<string, string[]> = {};
    const activeFaultObjs = new Map<string, (typeof parsed.faults)[number]>();
    const allGeneratedTraceIds = new Set<string>();
    const traces: SimulatedTraceRuntime[] = [];
    const logs: SimulatedLogRecord[] = [];
    const observations: ServiceObservationSample[] = [];
    let currentSLOs: SLOEvaluationRuntime[] = parsed.slos.map((s) =>
      evaluateSLOForService(s, [], 0)
    );
    const alertInstances: AlertInstanceRuntime[] = parsed.alerts.map((r) => ({
      id: `inst_${r.id}`,
      ruleId: r.id,
      name: r.name,
      serviceId: r.serviceId,
      metric: r.metric,
      state: "INACTIVE",
      currentValue: null,
      threshold: r.threshold,
      missingDataPolicy: r.missingDataPolicy,
      pendingSinceMs: null,
      firedAtMs: null,
      resolvedAtMs: null,
      fireCount: 0,
      recentEvaluations: [],
    }));
    const incidents: IncidentRuntime[] = [];

    const isCollectorOnlineAt = (tMs: number): boolean => {
      const win = parsed.telemetry.collectorOutageWindow;
      if (!win) return true;
      return !(tMs >= win.startAtMs && tMs <= win.endAtMs);
    };

    const addLog = (entry: Omit<SimulatedLogRecord, "id">) => {
      if (!isCollectorOnlineAt(entry.eventTimeMs)) {
        droppedLogs += 1;
        return null;
      }
      if (parsed.telemetry.droppedLogRate > 0 && rng.next() < parsed.telemetry.droppedLogRate) {
        droppedLogs += 1;
        return null;
      }
      const logRec: SimulatedLogRecord = {
        ...entry,
        id: `log_${++logCounter}`,
      };
      logs.push(logRec);
      while (logs.length > parsed.telemetry.logRetentionLimit) {
        logs.shift();
      }
      return logRec;
    };

    const nextEvtBase = () => {
      const seq = ++eventCounter;
      return {
        id: `obs_evt_${seq}`,
        sequence: seq,
        atMs: virtualTimeMs,
        durationMs: 0,
        explanation: "",
        traceId: parsed.id,
        spanId: `span_${seq}`,
      };
    };

    const events: ExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];

    const buildSnapshot = (): ModeledObservabilityRuntimeState => {
      const elapsedSec = Math.max(0.05, virtualTimeMs / 1000);
      const servicesHealth: Record<string, ServiceHealthRuntime> = {};
      const collectorOnline = isCollectorOnlineAt(virtualTimeMs);

      for (const svc of parsed.services) {
        const lats = [...(serviceLatencySamples[svc.id] ?? [])].sort((a, b) => a - b);
        const reqs = serviceRequestCounts[svc.id] ?? 0;
        const errs = serviceErrorCounts[svc.id] ?? 0;
        const errRate = reqs > 0 ? errs / reqs : 0;
        const p50 = MetricAggregator.calculatePercentile(lats, 50);
        const p95 = MetricAggregator.calculatePercentile(lats, 95);
        const p99 = MetricAggregator.calculatePercentile(lats, 99);
        const sat = serviceSaturation[svc.id] ?? 18;
        const activeIncIds = incidents
          .filter(
            (i) => i.status !== "resolved" && i.affectedServiceIds.includes(svc.id)
          )
          .map((i) => i.id);
        const sloOk = !currentSLOs.some(
          (s) => s.targetServiceId === svc.id && s.breached
        );

        const status: ServiceHealthRuntime["status"] = !collectorOnline
          ? "no_data"
          : errRate >= 0.15 || sat >= 90 || activeIncIds.length > 0
            ? "critical"
            : errRate >= 0.03 || p95 >= 110 || !sloOk
              ? "degraded"
              : "healthy";

        servicesHealth[svc.id] = {
          serviceId: svc.id,
          label: svc.label,
          kind: svc.kind,
          status,
          requestCount: reqs,
          errorCount: errs,
          requestRatePerSec: Number((reqs / elapsedSec).toFixed(1)),
          errorRate: Number(errRate.toFixed(4)),
          p50LatencyMs: p50,
          p95LatencyMs: p95,
          p99LatencyMs: p99,
          utilizationPct: Math.min(100, Math.round((reqs / elapsedSec / svc.capacityRps) * 100 + sat * 0.4)),
          saturationPct: sat,
          sloCompliant: sloOk,
          activeIncidentIds: activeIncIds,
          latencySeries: [...(serviceLatencySeries[svc.id] ?? [])],
          errorRateSeries: [...(serviceErrorSeries[svc.id] ?? [])],
          exemplars: [...(serviceExemplars[svc.id] ?? [])],
        };
      }

      const dependencies: ServiceDependencyEdge[] = Object.entries(depEdgeStats).map(
        ([id, d]) => ({
          id,
          callerId: d.callerId,
          calleeId: d.calleeId,
          dependencyType: d.type,
          callCount: d.calls,
          errorCount: d.errors,
          avgLatencyMs: d.calls > 0 ? Math.round(d.totalMs / d.calls) : 0,
          impacted:
            (servicesHealth[d.calleeId]?.status === "critical" ||
              servicesHealth[d.calleeId]?.status === "degraded"),
        })
      );

      // Build combined rootCauseGraph from active or latest incident
      const activeOrLatestInc = incidents[incidents.length - 1];
      let rootCauseGraph: ModeledObservabilityRuntimeState["rootCauseGraph"] = {
        nodes: [],
        edges: [],
      };
      if (activeOrLatestInc) {
        const corr = correlateIncidentHypothesesAndGraph({
          incident: activeOrLatestInc,
          servicesConfig: parsed.services,
          servicesHealth,
          slos: currentSLOs,
          investigationMode: parsed.investigationMode,
          activeFaults: Array.from(activeFaultObjs.values()),
        });
        activeOrLatestInc.hypotheses = corr.hypotheses;
        activeOrLatestInc.postmortem = generateFactOnlyPostmortem(
          activeOrLatestInc,
          currentSLOs
        );
        rootCauseGraph = corr.graph;
      }

      const entryHealth = servicesHealth[parsed.entryServiceId];
      const totalTraces = traces.length + sampledOutTraces;
      const totalSpans = traces.reduce((s, t) => s + t.spans.length, 0);
      const coverage =
        totalTraces > 0 ? Number(((traces.length / totalTraces) * 100).toFixed(1)) : 100;

      const avgCompliance =
        currentSLOs.length > 0
          ? Number(
              (
                (currentSLOs.reduce((acc, s) => acc + s.compliance, 0) /
                  currentSLOs.length) *
                100
              ).toFixed(2)
            )
          : 100;

      const firstInc = incidents[0];
      const firstFaultAt = parsed.faults[0]?.atMs ?? null;
      const detectionDelayMs =
        firstInc && firstFaultAt !== null
          ? Math.max(0, firstInc.detectedAtMs - firstFaultAt)
          : null;
      const recoveryDurationMs =
        firstInc && firstInc.resolvedAtMs !== undefined && firstInc.mitigatedAtMs !== undefined
          ? Math.max(0, firstInc.resolvedAtMs - firstInc.mitigatedAtMs)
          : null;

      const invariants = ObservabilityInvariantMonitor.verify({
        traces,
        allGeneratedTraceIds,
        logs,
        slos: currentSLOs,
        incidents,
        investigationMode: parsed.investigationMode,
        missingDataCoercedZeroDetected,
      });

      const metrics: ObservabilityMetrics = {
        totalTraces,
        sampledTraces: traces.length,
        sampledOutTraces,
        totalSpans,
        totalLogs: logs.length,
        droppedLogs,
        telemetryCoveragePct: coverage,
        overallErrorRate: entryHealth?.errorRate ?? 0,
        overallP95LatencyMs: entryHealth?.p95LatencyMs ?? 0,
        sloCompliancePct: avgCompliance,
        activeAlerts: alertInstances.filter((a) => a.state === "FIRING").length,
        alertFireTransitions,
        incidentsDetected: incidents.length,
        incidentsResolved: incidents.filter((i) => i.status === "resolved").length,
        detectionDelayMs,
        recoveryDurationMs,
      };

      const caveats = [
        "All traces, logs, metrics, SLOs, and mitigations operate purely on synthetic simulation state.",
      ];
      if (parsed.telemetry.samplingMode !== "none") {
        caveats.push(
          `Sampling mode '${parsed.telemetry.samplingMode}' (${Math.round(parsed.telemetry.samplingRate * 100)}%) can hide low-frequency errors.`
        );
      }
      if (parsed.telemetry.collectorOutageWindow) {
        caveats.push(
          `Collector outage simulated between ${parsed.telemetry.collectorOutageWindow.startAtMs}ms and ${parsed.telemetry.collectorOutageWindow.endAtMs}ms.`
        );
      }

      return {
        virtualTimeMs,
        investigationMode: parsed.investigationMode,
        collectorOnline,
        samplingMode: parsed.telemetry.samplingMode,
        samplingRate: parsed.telemetry.samplingRate,
        resources,
        services: servicesHealth,
        dependencies,
        traces: traces.slice(-50),
        logs: logs.slice(-80),
        slos: currentSLOs.map((s) => ({ ...s })),
        alerts: alertInstances.map((a) => ({ ...a, recentEvaluations: [...a.recentEvaluations] })),
        incidents: JSON.parse(JSON.stringify(incidents)),
        rootCauseGraph,
        caveats,
        invariants,
        metrics,
      };
    };

    const emitFrame = (
      event: ExecutionEvent,
      title: string,
      explanation: string,
      activeNodeIds: string[] = []
    ) => {
      events.push(event);
      const cloned = RuntimeStateHelper.cloneState(baseRuntime);
      cloned.observabilityState = buildSnapshot();
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs,
        activeNodeIds,
        activeEdgeIds: [],
        activeEvent: { ...event, explanation },
        direction: "request",
        stepTitle: title,
        stepExplanation: explanation,
        runtimeState: cloned,
      });
    };

    const queue: ObsQueueItem[] = [];
    const schedule = (item: NewObsItem) => {
      if (item.atMs > parsed.limits.maxVirtualDurationMs) return;
      queue.push({ ...item, seq: ++seqCounter } as ObsQueueItem);
      queue.sort((a, b) => a.atMs - b.atMs || a.seq - b.seq);
    };

    // Baseline initial frame
    emitFrame(
      {
        ...nextEvtBase(),
        type: "observability.sli.evaluated",
        sloId: parsed.slos[0]?.id ?? "slo-init",
        compliance: 1,
      },
      "Healthy Baseline Instrumented",
      `Observability workspace initialized (${parsed.services.length} services, ${parsed.slos.length} SLOs, ${parsed.alerts.length} alerts).`,
      [parsed.entryServiceId]
    );

    // Schedule requests
    const intervalMs = Math.max(15, Math.round(1000 / parsed.traffic.requestsPerSecond));
    let reqNum = 0;
    for (
      let t = parsed.traffic.startAtMs + 20;
      t <= Math.min(parsed.traffic.endAtMs, parsed.limits.maxVirtualDurationMs) &&
      reqNum < parsed.limits.maxTraces;
      t += intervalMs
    ) {
      schedule({ kind: "request_execute", atMs: t, reqNum: ++reqNum });
    }

    // Schedule faults & mitigations
    for (const f of parsed.faults) {
      schedule({ kind: "fault_apply", atMs: f.atMs, faultId: f.id });
      if (f.durationMs) {
        schedule({ kind: "fault_clear", atMs: f.atMs + f.durationMs, faultId: f.id });
      }
    }
    for (const m of parsed.mitigations) {
      schedule({ kind: "mitigation_apply", atMs: m.atMs, mitigationId: m.id });
    }

    // Schedule periodic SLO & alert evaluations
    for (let et = 80; et <= Math.min(parsed.traffic.endAtMs + 240, parsed.limits.maxVirtualDurationMs); et += 80) {
      schedule({ kind: "eval_tick", atMs: et });
    }

    const executeServiceSpan = (
      traceId: string,
      serviceId: string,
      parentSpanId: string | undefined,
      startMs: number,
      depKind: "sync" | "async" | "storage",
      baseLatMs: number,
      baseErr: number
    ): { span: SimulatedSpanRuntime; descendantSpans: SimulatedSpanRuntime[]; failed: boolean; endMs: number } => {
      const svc = svcMap.get(serviceId);
      const faultIds = activeFaultsByService[serviceId] ?? [];
      let latMult = 1;
      let errProb = baseErr;
      let sat = 22;

      for (const fid of faultIds) {
        const f = activeFaultObjs.get(fid);
        if (f) {
          latMult = Math.max(latMult, f.latencyMultiplier);
          errProb = Math.max(errProb, f.errorRate);
          sat = Math.max(sat, f.saturationPct);
        }
      }

      serviceSaturation[serviceId] = sat;
      const mySpanId = `sp_${++spanCounter}`;
      const myBase = Math.max(4, Math.round(baseLatMs * latMult * (0.85 + rng.next() * 0.3)));
      let myEnd = startMs + myBase;
      let failed = rng.next() < errProb;
      const children: SimulatedSpanRuntime[] = [];

      if (svc && svc.dependencies.length > 0 && !failed) {
        let syncCursor = startMs + 4;
        for (const dep of svc.dependencies) {
          const edgeKey = `${serviceId}->${dep.targetId}`;
          const childStart = dep.type === "async" ? startMs + 6 : syncCursor;
          const childRes = executeServiceSpan(
            traceId,
            dep.targetId,
            dep.type === "async" ? undefined : mySpanId,
            childStart,
            dep.type,
            dep.baseLatencyMs,
            dep.errorRateBase
          );

          if (!depEdgeStats[edgeKey]) {
            depEdgeStats[edgeKey] = {
              callerId: serviceId,
              calleeId: dep.targetId,
              type: dep.type,
              calls: 0,
              errors: 0,
              totalMs: 0,
            };
          }
          depEdgeStats[edgeKey]!.calls += 1;
          depEdgeStats[edgeKey]!.totalMs += Math.max(1, childRes.endMs - childStart);
          if (childRes.failed) depEdgeStats[edgeKey]!.errors += 1;

          if (dep.type === "async") {
            childRes.span.links.push({
              linkedTraceId: traceId,
              linkedSpanId: mySpanId,
              relationship: "queue_consume",
            });
          } else {
            syncCursor = childRes.endMs + 2;
            if (childRes.failed) failed = true;
          }

          children.push(childRes.span, ...childRes.descendantSpans);
          myEnd = Math.max(myEnd, dep.type === "async" ? myEnd : childRes.endMs + 4);
        }
      }

      const durationMs = Math.max(1, myEnd - startMs);
      serviceRequestCounts[serviceId] = (serviceRequestCounts[serviceId] ?? 0) + 1;
      serviceLatencySamples[serviceId]!.push(durationMs);
      if (failed) serviceErrorCounts[serviceId] = (serviceErrorCounts[serviceId] ?? 0) + 1;

      observations.push({
        timestampMs: myEnd,
        serviceId,
        durationMs,
        ok: !failed,
      });

      const span: SimulatedSpanRuntime = {
        traceId,
        spanId: mySpanId,
        parentSpanId,
        serviceId,
        resourceId: `res_${serviceId}`,
        name: `${svc?.label ?? serviceId} ${depKind === "async" ? "consume" : "handle"}`,
        kind: depKind === "async" ? "consumer" : parentSpanId ? "client" : "server",
        startTimeMs: startMs,
        endTimeMs: myEnd,
        durationMs,
        status: failed ? "error" : "ok",
        attributes: {
          "service.name": svc?.label ?? serviceId,
          "deployment.version": svc?.version ?? "v1.0",
          "saturation.pct": sat,
        },
        events: failed
          ? [{ timestampMs: myEnd, name: "exception", detail: `Error on ${serviceId} (lat=${durationMs}ms)` }]
          : [],
        links: [],
      };

      if (failed || durationMs >= 100) {
        addLog({
          eventTimeMs: myEnd,
          ingestionTimeMs: myEnd + parsed.telemetry.delayedMetricMs,
          severity: failed ? "ERROR" : "WARN",
          resourceId: `res_${serviceId}`,
          serviceId,
          message: failed
            ? `Request failed on ${serviceId} after ${durationMs}ms`
            : `High latency observed on ${serviceId}: ${durationMs}ms`,
          traceId,
          spanId: mySpanId,
          attributes: { durationMs, satPct: sat },
        });
      }

      if (serviceExemplars[serviceId]!.length < 15 && (failed || durationMs >= 90)) {
        serviceExemplars[serviceId]!.push({
          timestampMs: myEnd,
          value: durationMs,
          traceId,
          spanId: mySpanId,
          serviceId,
        });
      }

      return { span, descendantSpans: children, failed, endMs: myEnd };
    };

    // Main loop
    while (queue.length > 0 && events.length < parsed.limits.maxEvents) {
      const item = queue.shift()!;
      virtualTimeMs = item.atMs;

      if (item.kind === "fault_apply") {
        const fault = parsed.faults.find((f) => f.id === item.faultId);
        if (!fault) continue;
        activeFaultObjs.set(fault.id, fault);
        const list = activeFaultsByService[fault.targetServiceId] ?? [];
        if (!list.includes(fault.id)) list.push(fault.id);
        activeFaultsByService[fault.targetServiceId] = list;
        serviceSaturation[fault.targetServiceId] = fault.saturationPct;

        addLog({
          eventTimeMs: virtualTimeMs,
          ingestionTimeMs: virtualTimeMs,
          severity: "WARN",
          resourceId: `res_${fault.targetServiceId}`,
          serviceId: fault.targetServiceId,
          message: `Condition shift on ${fault.targetServiceId} (saturation=${fault.saturationPct}%)`,
          attributes: { kind: fault.type },
        });
        continue;
      }

      if (item.kind === "fault_clear") {
        const fault = parsed.faults.find((f) => f.id === item.faultId);
        if (!fault) continue;
        activeFaultsByService[fault.targetServiceId] = (
          activeFaultsByService[fault.targetServiceId] ?? []
        ).filter((id) => id !== fault.id);
        serviceSaturation[fault.targetServiceId] = 22;
        continue;
      }

      if (item.kind === "mitigation_apply") {
        const mit = parsed.mitigations.find((m) => m.id === item.mitigationId);
        if (!mit) continue;
        // Clear active faults on targetServiceId cleanly inside simulation state
        activeFaultsByService[mit.targetServiceId] = [];
        serviceSaturation[mit.targetServiceId] = 24;

        const openInc = incidents.find((i) => i.status !== "resolved");
        if (openInc) {
          openInc.status = "monitoring";
          openInc.mitigatedAtMs = virtualTimeMs;
          openInc.mitigationsApplied.push({
            id: mit.id,
            atMs: virtualTimeMs,
            action: mit.action,
            targetServiceId: mit.targetServiceId,
            description: mit.description,
          });
          openInc.timeline.push({
            atMs: virtualTimeMs,
            kind: "mitigation",
            summary: `Simulated mitigation '${mit.action}' applied to ${mit.targetServiceId}`,
          });

          emitFrame(
            {
              ...nextEvtBase(),
              type: "observability.incident.mitigation.applied",
              incidentId: openInc.id,
              action: mit.action,
              targetServiceId: mit.targetServiceId,
            },
            `Mitigation Applied: ${mit.action}`,
            `${mit.description} — entering verification monitoring before resolution.`,
            [mit.targetServiceId]
          );
        }
        continue;
      }

      if (item.kind === "request_execute") {
        const traceId = `tr_${parsed.id}_${item.reqNum}`;
        allGeneratedTraceIds.add(traceId);
        const res = executeServiceSpan(
          traceId,
          parsed.entryServiceId,
          undefined,
          virtualTimeMs,
          "sync",
          18,
          0
        );
        const allSpans = [res.span, ...res.descendantSpans];
        const cp = computeTraceCriticalPath(allSpans);
        const sampledIn = evaluateTraceSampling({
          mode: parsed.telemetry.samplingMode,
          samplingRate: parsed.telemetry.samplingRate,
          tailSlowThresholdMs: parsed.telemetry.tailSlowThresholdMs,
          durationMs: res.span.durationMs,
          hasError: res.failed,
          collectorOnline: isCollectorOnlineAt(virtualTimeMs),
          rng,
        });

        if (sampledIn) {
          traces.push({
            traceId,
            rootSpanId: res.span.spanId,
            rootServiceId: parsed.entryServiceId,
            rootOperation: `POST /checkout`,
            startTimeMs: res.span.startTimeMs,
            endTimeMs: res.span.endTimeMs,
            durationMs: res.span.durationMs,
            status: res.failed ? "error" : "ok",
            sampledIn: true,
            spans: allSpans,
            criticalPathSpanIds: cp.spanIds,
            criticalPathDurationMs: cp.durationMs,
          });
        } else {
          sampledOutTraces += 1;
        }
        continue;
      }

      if (item.kind === "eval_tick") {
        const collectorUp = isCollectorOnlineAt(virtualTimeMs);

        // Append metric points per service
        for (const svc of parsed.services) {
          const reqs = serviceRequestCounts[svc.id] ?? 0;
          const errs = serviceErrorCounts[svc.id] ?? 0;
          const errRate = collectorUp && reqs > 0 ? errs / reqs : null;
          const lats = [...(serviceLatencySamples[svc.id] ?? [])].sort((a, b) => a - b);
          const p95 = collectorUp ? MetricAggregator.calculatePercentile(lats, 95) : null;
          if (errRate !== null) {
            serviceErrorSeries[svc.id]!.push({ timestampMs: virtualTimeMs, value: Number(errRate.toFixed(3)) });
          }
          if (p95 !== null) {
            serviceLatencySeries[svc.id]!.push({ timestampMs: virtualTimeMs, value: p95 });
          }
        }

        // Evaluate SLOs
        currentSLOs = parsed.slos.map((s) =>
          evaluateSLOForService(s, observations, virtualTimeMs)
        );
        for (const slo of currentSLOs) {
          if (slo.breached && events.filter((e) => e.type === "observability.slo.breached").length < 3) {
            emitFrame(
              {
                ...nextEvtBase(),
                type: "observability.slo.breached",
                sloId: slo.id,
                compliance: slo.compliance,
                target: slo.target,
              },
              `SLO Breached: ${slo.name}`,
              `Compliance ${(slo.compliance * 100).toFixed(2)}% below target ${(slo.target * 100).toFixed(2)}% (burn=${slo.burnRate}x).`,
              [slo.targetServiceId]
            );
          }
        }

        // Evaluate Alerts
        const newlyFiredAlerts: AlertInstanceRuntime[] = [];
        for (const inst of alertInstances) {
          const rule = parsed.alerts.find((r) => r.id === inst.ruleId)!;
          let metricVal: number | null = null;
          if (collectorUp) {
            // Evaluate over recent 160ms window so recovery transitions reflect mitigation
            const recentObs = observations.filter(
              (o) => o.serviceId === rule.serviceId && o.timestampMs >= virtualTimeMs - 160
            );
            if (rule.metric === "error_rate") {
              metricVal =
                recentObs.length > 0
                  ? recentObs.filter((o) => !o.ok).length / recentObs.length
                  : null;
            } else if (rule.metric === "p95_latency_ms") {
              const l = recentObs.map((o) => o.durationMs).sort((a, b) => a - b);
              metricVal =
                l.length > 0 ? MetricAggregator.calculatePercentile(l, 95) : null;
            } else if (rule.metric === "saturation_pct") {
              metricVal = serviceSaturation[rule.serviceId] ?? 20;
            }
          }

          const { transitionedTo } = evaluateAlertRuleTick({
            instance: inst,
            rule,
            computedValue: metricVal,
            nowMs: virtualTimeMs,
          });

          if (transitionedTo === "FIRING") {
            alertFireTransitions += 1;
            newlyFiredAlerts.push(inst);
            emitFrame(
              {
                ...nextEvtBase(),
                type: "observability.alert.firing",
                alertId: inst.id,
                serviceId: inst.serviceId,
                value: inst.currentValue ?? 0,
                state: "FIRING",
              },
              `Alert FIRING: ${inst.name}`,
              `Observed ${rule.metric}=${inst.currentValue ?? "no_data"} crossed threshold ${rule.threshold}.`,
              [inst.serviceId]
            );
          } else if (transitionedTo === "RESOLVED") {
            emitFrame(
              {
                ...nextEvtBase(),
                type: "observability.alert.resolved",
                alertId: inst.id,
                serviceId: inst.serviceId,
              },
              `Alert RESOLVED: ${inst.name}`,
              `Alert recovered cleanly within configured recovery window.`,
              [inst.serviceId]
            );
          }
        }

        // Deduplicated Incident Detection & Recovery Verification
        const openIncident = incidents.find((i) => i.status !== "resolved");
        if (!openIncident && newlyFiredAlerts.length > 0 && incidents.length < parsed.limits.maxIncidents) {
          const directSvcs = Array.from(
            new Set([
              ...newlyFiredAlerts.map((a) => a.serviceId),
              ...Object.keys(activeFaultsByService).filter(
                (sid) => (activeFaultsByService[sid]?.length ?? 0) > 0 &&
                  ((serviceErrorCounts[sid] ?? 0) > 0 || (serviceSaturation[sid] ?? 0) >= 80)
              ),
            ])
          );
          const blast = computeObservabilityBlastRadius(directSvcs, parsed.services);
          const incId = `inc_${incidents.length + 1}`;
          const evItems: IncidentEvidenceItem[] = [];

          for (const sid of blast.allAffected) {
            const errCnt = serviceErrorCounts[sid] ?? 0;
            const sat = serviceSaturation[sid] ?? 0;
            if (errCnt > 0 || sat >= 80) {
              const relTrace = traces.find((t) =>
                t.spans.some((sp) => sp.serviceId === sid && (sp.status === "error" || sp.durationMs >= 100))
              );
              const relLog = logs.find((l) => l.serviceId === sid && l.severity !== "INFO");
              evItems.push({
                id: `ev_${incId}_${sid}`,
                incidentId: incId,
                timestampMs: virtualTimeMs,
                serviceId: sid,
                source: sat >= 80 ? "saturation" : "metric_anomaly",
                observation: `Service ${sid} observed ${errCnt} errors, saturation=${sat}%`,
                relatedTraceId: relTrace?.traceId,
                relatedLogId: relLog?.id,
                causalWeight: "correlated",
              });
            }
          }

          const newInc: IncidentRuntime = {
            id: incId,
            scenarioId: parsed.id,
            title: `${newlyFiredAlerts[0]!.name} Incident`,
            severity: blast.allAffected.length >= 3 ? "sev1" : "sev2",
            status: "investigating",
            detectedAtMs: virtualTimeMs,
            directFailingServiceIds: blast.direct,
            downstreamImpactedIds: blast.downstream,
            upstreamImpactedIds: blast.upstream,
            affectedServiceIds: blast.allAffected,
            alertIds: newlyFiredAlerts.map((a) => a.id),
            evidence: evItems,
            hypotheses: [],
            mitigationsApplied: [],
            timeline: [
              {
                atMs: virtualTimeMs,
                kind: "detected",
                summary: `Incident ${incId} opened from alert '${newlyFiredAlerts[0]!.name}'`,
              },
            ],
          };
          incidents.push(newInc);

          emitFrame(
            {
              ...nextEvtBase(),
              type: "observability.incident.detected",
              incidentId: newInc.id,
              title: newInc.title,
            },
            `Incident Detected: ${newInc.id}`,
            `Grouped ${newlyFiredAlerts.length} firing alert(s); blast radius spans ${blast.allAffected.join(", ")}.`,
            blast.allAffected
          );
        } else if (openIncident && openIncident.status === "monitoring") {
          const allAlertsResolved = alertInstances
            .filter((a) => openIncident.alertIds.includes(a.id))
            .every((a) => a.state === "RESOLVED" || a.state === "INACTIVE");
          if (allAlertsResolved) {
            openIncident.status = "resolved";
            openIncident.resolvedAtMs = virtualTimeMs;
            openIncident.timeline.push({
              atMs: virtualTimeMs,
              kind: "resolved",
              summary: "All correlated alerts verified RESOLVED; incident closed.",
            });
            emitFrame(
              {
                ...nextEvtBase(),
                type: "observability.incident.resolved",
                incidentId: openIncident.id,
              },
              `Incident Resolved: ${openIncident.id}`,
              `Recovery verified after mitigation; error rate and latency stabilized.`,
              openIncident.affectedServiceIds
            );
          }
        }
      }
    }

    // Final summary frame
    emitFrame(
      {
        ...nextEvtBase(),
        type: "observability.sli.evaluated",
        sloId: parsed.slos[0]?.id ?? "slo-final",
        compliance: currentSLOs[0]?.compliance ?? 1,
      },
      "Simulation Snapshot Complete",
      `Processed ${traces.length} traces, ${logs.length} logs, ${incidents.length} incident(s).`,
      [parsed.entryServiceId]
    );

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: parsed.entryServiceId,
      request: {
        id: parsed.id,
        method: "POST",
        path: "/checkout",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: parsed.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: 15,
        edgeDurationMs: 10,
      },
    };

    const lastState = frames[frames.length - 1]?.runtimeState?.observabilityState;
    const failedInv = lastState?.invariants.allPassed === false;

    return {
      runId,
      architectureId: "arch_observability_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `obs_${parsed.id}_${parsed.seed}_${frames.length}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: parsed.services.map((s) => s.id),
      traversedEdgeIds: [],
      configuration,
      events,
      totalDurationMs: virtualTimeMs,
      totalEvents: events.length,
      totalHops: traces.length + incidents.length,
      outcome: failedInv ? "failure" : "success",
      terminalReason: failedInv
        ? lastState?.invariants.violations.join("; ")
        : `Observability simulation finished at ${virtualTimeMs}ms (${traces.length} sampled traces, ${incidents.length} incidents).`,
      frames,
    };
  }
}
