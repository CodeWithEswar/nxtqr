import { describe, expect, it } from "vitest";
import {
  OBS_PRESET_METADATA,
  ObservabilityExecutionEngine,
  ObservabilityScenarioSchema,
  compareObservabilityScenarios,
  createObservabilityPresetScenario,
  type ObservabilityPresetId,
} from "../index";

function runObsPreset(id: ObservabilityPresetId) {
  const scenario = createObservabilityPresetScenario(id);
  const trace = ObservabilityExecutionEngine.runScenario(scenario);
  const finalState =
    trace.frames[trace.frames.length - 1]?.runtimeState?.observabilityState;
  return { scenario, trace, finalState };
}

describe("ObservabilityExecutionEngine — Phase 05.4.17 (Traces, Logs, Metrics, SLOs & Incidents)", () => {
  it("executes all 30 presets deterministically with zero protocol invariant violations", () => {
    expect(OBS_PRESET_METADATA.length).toBe(30);

    for (const meta of OBS_PRESET_METADATA) {
      const sA = createObservabilityPresetScenario(meta.id);
      const sB = createObservabilityPresetScenario(meta.id);
      expect(() => ObservabilityScenarioSchema.parse(sA)).not.toThrow();

      const tA = ObservabilityExecutionEngine.runScenario(sA);
      const tB = ObservabilityExecutionEngine.runScenario(sB);

      expect(tA.frames.length).toBeGreaterThan(0);
      expect(tA.events.length).toBe(tB.events.length);

      const finalA =
        tA.frames[tA.frames.length - 1]?.runtimeState?.observabilityState;
      const finalB =
        tB.frames[tB.frames.length - 1]?.runtimeState?.observabilityState;

      expect(finalA).toBeDefined();
      expect(finalA?.metrics).toEqual(finalB?.metrics);
      expect(finalA?.slos).toEqual(finalB?.slos);
      expect(
        finalA?.invariants.allPassed,
        `${meta.id} violated invariants: ${finalA?.invariants.violations.join("; ")}`
      ).toBe(true);
    }
  });

  it("validates async span links, critical path, sampling gaps, and missing-telemetry no_data policy", () => {
    const { finalState: baseState } = runObsPreset("healthy_baseline");
    expect(baseState?.metrics.telemetryCoveragePct).toBe(100);
    expect(
      baseState?.traces.some((t) =>
        t.spans.some((sp) => sp.links.length > 0)
      )
    ).toBe(true);

    const { finalState: sampState } = runObsPreset("trace_sampling_gap");
    expect(sampState?.metrics.sampledOutTraces).toBeGreaterThanOrEqual(1);
    expect(sampState?.metrics.telemetryCoveragePct).toBeLessThan(100);

    const { finalState: missState } = runObsPreset("missing_telemetry");
    expect(missState?.metrics.droppedLogs).toBeGreaterThanOrEqual(1);
    expect(
      missState?.alerts.some((a) =>
        a.recentEvaluations.some((ev) => ev.computedValue === null)
      )
    ).toBe(true);
  });

  it("models SLO breach, error budget burn rate, flapping alerts, and incident deduplication", () => {
    const { finalState: sloState } = runObsPreset("slo_breach");
    expect(sloState?.slos.some((s) => s.breached)).toBe(true);

    const { finalState: burnState } = runObsPreset("error_budget_burn");
    expect(burnState?.slos.some((s) => s.burnRate > 1)).toBe(true);

    const { finalState: flapState } = runObsPreset("alert_flapping");
    expect(flapState?.metrics.alertFireTransitions).toBeGreaterThanOrEqual(2);
    expect(flapState?.incidents.length).toBeLessThanOrEqual(2);
  });

  it("separates Investigation vs Explanation mode, verifies mitigation recovery vs incomplete recovery, and generates fact-only postmortems", () => {
    const { finalState: invState } = runObsPreset("root_cause_investigation");
    expect(invState?.investigationMode).toBe("investigation");
    expect(invState?.incidents.length).toBeGreaterThanOrEqual(1);
    expect(
      invState?.incidents[0]?.hypotheses.every((h) => h.status !== "verified")
    ).toBe(true);

    const { scenario: mitScen, finalState: mitState } = runObsPreset("successful_mitigation");
    expect(mitState?.metrics.incidentsResolved).toBeGreaterThanOrEqual(1);
    expect(
      mitState?.incidents[0]?.hypotheses.some((h) => h.status === "verified")
    ).toBe(true);
    expect(
      mitState?.rootCauseGraph.edges.some((e) => e.relation === "verified_causal")
    ).toBe(true);

    const { scenario: incScen, finalState: incState } = runObsPreset("incomplete_recovery");
    expect(incState?.metrics.incidentsResolved).toBe(0);

    const cmp = compareObservabilityScenarios(incScen, mitScen);
    expect(cmp.deltas.incidentsResolvedDelta).toBeGreaterThanOrEqual(1);

    const { finalState: pmState } = runObsPreset("incident_postmortem");
    expect(pmState?.incidents[0]?.postmortem?.timelineEntries.length).toBeGreaterThan(0);
  });

  it("maintains trace, SLI, causal, and evidence invariants across randomized seeds", () => {
    for (let seed = 1; seed <= 8; seed++) {
      const s = createObservabilityPresetScenario("multi_service_cascading_failure");
      s.seed = seed;
      const t = ObservabilityExecutionEngine.runScenario(s);
      const last = t.frames[t.frames.length - 1]?.runtimeState?.observabilityState;
      expect(last?.invariants.allPassed).toBe(true);
      expect(last?.invariants.parentChildAcyclicOk).toBe(true);
      expect(last?.invariants.nonNegativeDurationsOk).toBe(true);
      expect(last?.invariants.evidenceProvenanceOk).toBe(true);
    }
  });
});

