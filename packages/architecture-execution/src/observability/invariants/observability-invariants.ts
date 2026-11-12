import type {
  IncidentRuntime,
  InvestigationViewMode,
  ObservabilityInvariantReport,
  SLOEvaluationRuntime,
  SimulatedLogRecord,
  SimulatedTraceRuntime,
} from "../observability-schemas";

export class ObservabilityInvariantMonitor {
  public static verify(params: {
    traces: SimulatedTraceRuntime[];
    allGeneratedTraceIds?: Set<string>;
    logs: SimulatedLogRecord[];
    slos: SLOEvaluationRuntime[];
    incidents: IncidentRuntime[];
    investigationMode: InvestigationViewMode;
    missingDataCoercedZeroDetected: boolean;
  }): ObservabilityInvariantReport {
    const violations: string[] = [];
    let spansValidTraceOk = true;
    let parentChildAcyclicOk = true;
    let nonNegativeDurationsOk = true;

    const spanIdsAll = new Set<string>();
    const traceIdsAll = new Set<string>();

    for (const tr of params.traces) {
      traceIdsAll.add(tr.traceId);
      const spanMap = new Map(tr.spans.map((s) => [s.spanId, s]));
      for (const sp of tr.spans) {
        spanIdsAll.add(sp.spanId);
        if (sp.traceId !== tr.traceId) {
          spansValidTraceOk = false;
          violations.push(`Span ${sp.spanId} traceId mismatch (${sp.traceId} != ${tr.traceId})`);
        }
        if (sp.durationMs < 0 || sp.endTimeMs < sp.startTimeMs) {
          nonNegativeDurationsOk = false;
          violations.push(`Negative duration on span ${sp.spanId}: ${sp.durationMs}ms`);
        }
        // Detect parent cycle
        const seen = new Set<string>([sp.spanId]);
        let cur = sp.parentSpanId;
        while (cur) {
          if (seen.has(cur)) {
            parentChildAcyclicOk = false;
            violations.push(`Parent cycle detected at span ${cur} in trace ${tr.traceId}`);
            break;
          }
          seen.add(cur);
          cur = spanMap.get(cur)?.parentSpanId;
        }
      }
    }

    let logCorrelationsValidOk = true;
    const validTraceLookup = params.allGeneratedTraceIds ?? traceIdsAll;
    for (const lg of params.logs) {
      if (lg.traceId && params.traces.length < 400 && !validTraceLookup.has(lg.traceId)) {
        logCorrelationsValidOk = false;
        violations.push(`Log ${lg.id} references unknown traceId ${lg.traceId}`);
      }
    }

    let sliBoundsOk = true;
    for (const slo of params.slos) {
      if (slo.goodRequests > slo.eligibleRequests) {
        sliBoundsOk = false;
        violations.push(`SLO ${slo.id} goodRequests (${slo.goodRequests}) > eligible (${slo.eligibleRequests})`);
      }
    }

    let incidentCausalOrderOk = true;
    let evidenceProvenanceOk = true;
    let groundTruthSeparatedOk = true;

    for (const inc of params.incidents) {
      if (inc.resolvedAtMs !== undefined && inc.resolvedAtMs < inc.detectedAtMs) {
        incidentCausalOrderOk = false;
        violations.push(`Incident ${inc.id} resolvedAtMs < detectedAtMs`);
      }
      for (const h of inc.hypotheses) {
        if (h.supportingEvidenceIds.length === 0) {
          evidenceProvenanceOk = false;
          violations.push(`Hypothesis ${h.id} has zero supporting evidence links`);
        }
        if (params.investigationMode === "investigation" && h.status === "verified") {
          groundTruthSeparatedOk = false;
          violations.push(`Investigation mode prematurely marked hypothesis ${h.id} as verified`);
        }
      }
    }

    const missingDataSafeOk = !params.missingDataCoercedZeroDetected;
    if (!missingDataSafeOk) {
      violations.push("Missing telemetry was silently coerced to zero");
    }

    return {
      allPassed: violations.length === 0,
      spansValidTraceOk,
      parentChildAcyclicOk,
      nonNegativeDurationsOk,
      logCorrelationsValidOk,
      sliBoundsOk,
      missingDataSafeOk,
      incidentCausalOrderOk,
      evidenceProvenanceOk,
      groundTruthSeparatedOk,
      violations,
    };
  }
}
