"use client";

import * as React from "react";
import {
  ActivityIcon,
  CloseIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  PlayIcon,
  RefreshIcon,
  ShieldIcon,
  TerminalIcon,
} from "@nxtqr/icons";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  OBS_PRESET_METADATA,
  compareObservabilityScenarios,
  createObservabilityPresetScenario,
  type ObservabilityPresetId,
  type ServiceHealthRuntime,
  type SimulatedTraceRuntime,
} from "@nxtqr/architecture-execution";

type ObservabilityTab =
  | "overview"
  | "traces"
  | "logs"
  | "slos_alerts"
  | "incident_rca"
  | "invariants_metrics";

const COMPARE_PAIRS: Array<{
  id: string;
  label: string;
  baseline: ObservabilityPresetId;
  variant: ObservabilityPresetId;
}> = [
  {
    id: "db_mitigation",
    label: "DB Slowdown vs Successful Mitigation",
    baseline: "database_slowdown",
    variant: "successful_mitigation",
  },
  {
    id: "recovery",
    label: "Incomplete Recovery vs Successful Mitigation",
    baseline: "incomplete_recovery",
    variant: "successful_mitigation",
  },
  {
    id: "slo_burn",
    label: "Error Budget Burn vs Healthy Baseline",
    baseline: "error_budget_burn",
    variant: "healthy_baseline",
  },
  {
    id: "sampling",
    label: "Trace Sampling Gap vs High Request Latency",
    baseline: "trace_sampling_gap",
    variant: "high_request_latency",
  },
];

function ServiceSparkline({
  points,
  maxFallback,
}: {
  points: Array<{ timestampMs: number; value: number }>;
  maxFallback: number;
}) {
  if (points.length < 2) {
    return (
      <div className="h-7 w-full rounded-md bg-surface-01 border border-border-subtle flex items-center justify-center text-[9px] font-mono text-text-disabled">
        no samples
      </div>
    );
  }
  const width = 160;
  const height = 28;
  const maxVal = Math.max(maxFallback, ...points.map((p) => p.value), 0.001);
  const path = points
    .map((pt, idx) => {
      const x = (idx / Math.max(1, points.length - 1)) * width;
      const y = height - Math.min(1, Math.max(0, pt.value / maxVal)) * (height - 4) - 2;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-7 w-full rounded-md bg-surface-01 border border-border-subtle overflow-visible"
      preserveAspectRatio="none"
    >
      <path d={path} fill="none" stroke="#B5B5B5" strokeWidth="1.25" />
    </svg>
  );
}

function ServiceStatusBadge({ status }: { status: ServiceHealthRuntime["status"] }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded-md border text-[9px] font-mono uppercase",
        status === "healthy"
          ? "bg-surface-01 border-border-default text-text-secondary"
          : status === "degraded"
            ? "bg-surface-03 border-border-strong text-foreground"
            : status === "critical"
              ? "bg-surface-04 border-border-strong text-foreground font-semibold"
              : "bg-surface-01 border-border-subtle text-text-disabled"
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function ObservabilityWorkspace() {
  const toggleObservabilityWorkspace = useExecutionStore(
    (s) => s.toggleObservabilityWorkspace
  );
  const activeObservabilityScenario = useExecutionStore(
    (s) => s.activeObservabilityScenario
  );
  const setObservabilityScenario = useExecutionStore(
    (s) => s.setObservabilityScenario
  );
  const setScenarioPreset = useExecutionStore((s) => s.setScenarioPreset);
  const runObservabilitySimulation = useExecutionStore(
    (s) => s.runObservabilitySimulation
  );
  const currentFrame = useExecutionStore((s) => s.playbackState.currentFrame);
  const trace = useExecutionStore((s) => s.trace);

  const [activeTab, setActiveTab] =
    React.useState<ObservabilityTab>("overview");
  const [selectedTraceId, setSelectedTraceId] = React.useState<string | null>(
    null
  );
  const [logSeverityFilter, setLogSeverityFilter] = React.useState<string>("ALL");
  const [logSearch, setLogSearch] = React.useState<string>("");
  const [comparePairId, setComparePairId] =
    React.useState<string>("db_mitigation");

  React.useEffect(() => {
    if (!activeObservabilityScenario) {
      const def = createObservabilityPresetScenario("database_slowdown");
      setObservabilityScenario(def);
    }
  }, [activeObservabilityScenario, setObservabilityScenario]);

  const scenario =
    activeObservabilityScenario ??
    createObservabilityPresetScenario("database_slowdown");

  const obsState = React.useMemo(() => {
    if (currentFrame?.runtimeState?.observabilityState) {
      return currentFrame.runtimeState.observabilityState;
    }
    if (trace && trace.frames.length > 0) {
      for (let i = trace.frames.length - 1; i >= 0; i--) {
        if (trace.frames[i]?.runtimeState?.observabilityState) {
          return trace.frames[i]!.runtimeState!.observabilityState!;
        }
      }
    }
    return null;
  }, [currentFrame, trace]);

  const comparisonResult = React.useMemo(() => {
    const pair =
      COMPARE_PAIRS.find((p) => p.id === comparePairId) ?? COMPARE_PAIRS[0]!;
    return compareObservabilityScenarios(
      createObservabilityPresetScenario(pair.baseline),
      createObservabilityPresetScenario(pair.variant)
    );
  }, [comparePairId]);

  const selectedTrace: SimulatedTraceRuntime | null = React.useMemo(() => {
    if (!obsState || obsState.traces.length === 0) return null;
    if (selectedTraceId) {
      const found = obsState.traces.find((t) => t.traceId === selectedTraceId);
      if (found) return found;
    }
    return (
      obsState.traces.find((t) => t.status === "error") ??
      obsState.traces[obsState.traces.length - 1] ??
      null
    );
  }, [obsState, selectedTraceId]);

  const filteredLogs = React.useMemo(() => {
    if (!obsState) return [];
    const query = logSearch.trim().toLowerCase();
    return obsState.logs.filter((l) => {
      if (logSeverityFilter !== "ALL" && l.severity !== logSeverityFilter) {
        return false;
      }
      if (!query) return true;
      return (
        l.message.toLowerCase().includes(query) ||
        l.serviceId.toLowerCase().includes(query) ||
        (l.traceId?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [obsState, logSeverityFilter, logSearch]);

  const handleToggleInvestigationMode = () => {
    const nextMode: "investigation" | "explanation" =
      scenario.investigationMode === "investigation"
        ? "explanation"
        : "investigation";
    const updated = { ...scenario, investigationMode: nextMode };
    runObservabilitySimulation(updated);
  };

  const handleCycleSampling = () => {
    const nextTelemetry =
      scenario.telemetry.samplingMode === "none"
        ? { ...scenario.telemetry, samplingMode: "head" as const, samplingRate: 0.25 }
        : scenario.telemetry.samplingMode === "head"
          ? { ...scenario.telemetry, samplingMode: "tail" as const, samplingRate: 1 }
          : { ...scenario.telemetry, samplingMode: "none" as const, samplingRate: 1 };
    runObservabilitySimulation({ ...scenario, telemetry: nextTelemetry });
  };

  const handleApplyMitigation = () => {
    const primaryTarget =
      scenario.faults[0]?.targetServiceId ?? scenario.entryServiceId;
    const atMs = Math.min(
      scenario.traffic.endAtMs - 60,
      Math.max(120, Math.round((obsState?.virtualTimeMs ?? 200) + 40))
    );
    const updated = {
      ...scenario,
      mitigations: [
        ...scenario.mitigations,
        {
          id: `mit_manual_${scenario.mitigations.length + 1}`,
          atMs,
          action: "scale_capacity" as const,
          targetServiceId: primaryTarget,
          description: `Manual simulated capacity mitigation on ${primaryTarget}`,
        },
      ],
    };
    runObservabilitySimulation(updated);
  };

  const servicesList = React.useMemo(
    () => (obsState ? Object.values(obsState.services) : []),
    [obsState]
  );

  const activeIncident =
    obsState && obsState.incidents.length > 0 ? obsState.incidents[0]! : null;

  return (
    <div
      role="region"
      aria-label="Distributed Observability and Incident RCA Workspace"
      className="fixed bottom-4 right-4 z-40 w-[940px] max-w-[calc(100vw-2rem)] h-[650px] max-h-[calc(100vh-5rem)] flex flex-col rounded-md bg-surface-02 border border-border-default shadow-level-2 overflow-hidden select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <TerminalIcon className="w-4 h-4 text-foreground shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-mono font-semibold text-foreground truncate">
              Observability & Incident RCA Studio
            </h2>
            <p className="text-[10px] font-mono text-text-muted truncate">
              Traces · Logs · RED/USE · SLOs · Alerts · Correlation & Postmortem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <Select
            value={scenario.presetId ?? "database_slowdown"}
            onValueChange={(val) =>
              setScenarioPreset(val as ObservabilityPresetId)
            }
          >
            <SelectTrigger className="h-7 w-[195px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
              <SelectValue placeholder="Observability Preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default rounded-md max-h-[320px]">
              {OBS_PRESET_METADATA.map((meta) => (
                <SelectItem
                  key={meta.id}
                  value={meta.id}
                  className="text-[10px] font-mono"
                >
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleInvestigationMode}
            title="Toggle Investigation Mode (observable evidence only) vs Explanation Mode (verified simulated ground truth)"
            className={cn(
              "h-7 px-2 text-[10px] font-mono rounded-md border",
              scenario.investigationMode === "explanation"
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-surface-01 border-border-default text-text-secondary hover:bg-surface-03"
            )}
          >
            {scenario.investigationMode === "investigation"
              ? "Mode: Investigation"
              : "Mode: Explanation"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCycleSampling}
            title="Cycle Telemetry Sampling Mode"
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md"
          >
            Sample:{" "}
            {scenario.telemetry.samplingMode === "none"
              ? "100%"
              : scenario.telemetry.samplingMode === "head"
                ? "Head 25%"
                : "Tail"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyMitigation}
            title="Apply simulated capacity mitigation and verify recovery"
            className="h-7 px-2 text-[10px] font-mono bg-surface-01 border-border-default hover:bg-surface-03 rounded-md gap-1"
          >
            <ShieldIcon className="w-3 h-3" />
            Mitigate
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => runObservabilitySimulation(scenario)}
            className="h-7 px-2.5 text-[10px] font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleObservabilityWorkspace(false)}
            aria-label="Close Observability Workspace"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Modeled Metrics Strip */}
      <div className="grid grid-cols-6 gap-1.5 px-3 py-1.5 border-b border-border-subtle bg-surface-01 shrink-0">
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Virtual Time
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {obsState ? `${obsState.virtualTimeMs} ms` : "Not Run"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Error Rate
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {obsState
              ? `${(obsState.metrics.overallErrorRate * 100).toFixed(1)}%`
              : "0.0%"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            p95 Latency
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {obsState ? `${obsState.metrics.overallP95LatencyMs.toFixed(1)} ms` : "0 ms"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Coverage
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {obsState
              ? `${obsState.metrics.telemetryCoveragePct.toFixed(1)}%`
              : "100%"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            SLO / Alerts
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {obsState
              ? `${obsState.metrics.sloCompliancePct.toFixed(1)}% · ${obsState.metrics.activeAlerts}`
              : "100% · 0"}
          </div>
        </div>
        <div className="px-2 py-1 rounded-md bg-surface-02 border border-border-subtle">
          <div className="text-[9px] font-mono uppercase text-text-muted">
            Incidents
          </div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {obsState
              ? `${obsState.metrics.incidentsDetected} det / ${obsState.metrics.incidentsResolved} res`
              : "0 / 0"}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle bg-surface-01 shrink-0 overflow-x-auto">
        {(
          [
            { id: "overview", label: "Overview & Dependencies" },
            { id: "traces", label: "Traces & Waterfall" },
            { id: "logs", label: "Logs & Search" },
            { id: "slos_alerts", label: "SLOs & Alerts" },
            { id: "incident_rca", label: "Incident & RCA" },
            { id: "invariants_metrics", label: "Invariants & Metrics" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-mono transition-colors border whitespace-nowrap",
              activeTab === tab.id
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
        {!obsState ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6 rounded-md bg-surface-01 border border-border-subtle">
            <ActivityIcon className="w-6 h-6 text-text-secondary" />
            <div className="space-y-1 max-w-md">
              <p className="text-xs font-mono font-semibold text-foreground">
                Ready to run simulated observability scenario
              </p>
              <p className="text-[11px] font-mono text-text-muted">
                {scenario.label} — deterministic traces, logs, RED/USE metrics, SLO burn rate, alerts, and incident investigation.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => runObservabilitySimulation(scenario)}
              className="h-7 px-3 text-[11px] font-mono bg-foreground text-background hover:bg-neutral-200 rounded-md gap-1.5"
            >
              <PlayIcon className="w-3 h-3" />
              Run Simulation
            </Button>
          </div>
        ) : (
          <>
            {/* Caveats Banner */}
            {obsState.caveats.length > 0 && (
              <div className="px-2.5 py-1.5 rounded-md bg-surface-02 border border-border-default flex items-center justify-between gap-2">
                <div className="text-[10px] font-mono text-text-secondary space-y-0.5">
                  {obsState.caveats.map((cav, idx) => (
                    <div key={idx}>Caveat: {cav}</div>
                  ))}
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono border-border-default shrink-0"
                >
                  {obsState.collectorOnline ? "Collector Online" : "Collector Offline"}
                </Badge>
              </div>
            )}

            {/* TAB 1: Overview & Dependencies */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {servicesList.map((svc) => (
                    <div
                      key={svc.serviceId}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {svc.kind === "database" || svc.kind === "cache" ? (
                            <DatabaseIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                          ) : (
                            <CpuIcon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                          )}
                          <span className="text-xs font-mono font-semibold text-foreground truncate">
                            {svc.label}
                          </span>
                        </div>
                        <ServiceStatusBadge status={svc.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">RPS</div>
                          <div className="text-foreground font-semibold">
                            {svc.requestRatePerSec.toFixed(1)}
                          </div>
                        </div>
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">Err %</div>
                          <div className="text-foreground font-semibold">
                            {(svc.errorRate * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">p95</div>
                          <div className="text-foreground font-semibold">
                            {svc.p95LatencyMs.toFixed(0)}ms
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-mono text-text-muted">
                          <span>Saturation: {svc.saturationPct.toFixed(0)}%</span>
                          <span>
                            p50 {svc.p50LatencyMs.toFixed(0)}ms · p99{" "}
                            {svc.p99LatencyMs.toFixed(0)}ms
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-md bg-surface-01 border border-border-subtle overflow-hidden">
                          <div
                            className="h-full bg-foreground transition-all"
                            style={{
                              width: `${Math.min(100, svc.saturationPct)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-text-muted">
                          Latency trend (exemplars: {svc.exemplars.length})
                        </div>
                        <ServiceSparkline
                          points={svc.latencySeries}
                          maxFallback={100}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dependency Table */}
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                      <h3 className="text-[11px] font-mono font-semibold text-foreground">
                        Service Dependency Map & Call Telemetry
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">
                      {obsState.dependencies.length} observed edges
                    </span>
                  </div>
                  <div className="space-y-1">
                    {obsState.dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-surface-01 border border-border-subtle text-[10px] font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-foreground font-semibold">
                            {dep.callerId}
                          </span>
                          <span className="text-text-muted">→</span>
                          <span className="text-foreground font-semibold">
                            {dep.calleeId}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono border-border-default"
                          >
                            {dep.dependencyType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-text-secondary">
                          <span>calls: {dep.callCount}</span>
                          <span>errors: {dep.errorCount}</span>
                          <span>avg: {dep.avgLatencyMs.toFixed(1)}ms</span>
                          {dep.impacted && (
                            <span className="px-1.5 py-0.5 rounded-md bg-surface-04 border border-border-strong text-foreground font-semibold">
                              impacted
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Traces & Waterfall */}
            {activeTab === "traces" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                <div className="md:col-span-5 p-2 rounded-md bg-surface-02 border border-border-default space-y-1.5 max-h-[440px] overflow-y-auto">
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-border-subtle">
                    <span className="text-[10px] font-mono font-semibold text-foreground">
                      Traces ({obsState.traces.length})
                    </span>
                    <span className="text-[9px] font-mono text-text-muted">
                      sampled out: {obsState.metrics.sampledOutTraces}
                    </span>
                  </div>
                  {[...obsState.traces].reverse().map((tr) => {
                    const active = selectedTrace?.traceId === tr.traceId;
                    return (
                      <button
                        key={tr.traceId}
                        type="button"
                        onClick={() => setSelectedTraceId(tr.traceId)}
                        className={cn(
                          "w-full text-left p-2 rounded-md border text-[10px] font-mono space-y-0.5 transition-colors",
                          active
                            ? "bg-surface-04 border-border-strong text-foreground shadow-level-3"
                            : "bg-surface-01 border-border-subtle text-text-secondary hover:bg-surface-03"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-foreground truncate">
                            {tr.rootOperation}
                          </span>
                          <span className="px-1 py-0.5 rounded-md bg-surface-02 border border-border-default text-[9px] uppercase">
                            {tr.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-text-muted">
                          <span>{tr.traceId}</span>
                          <span>
                            {tr.durationMs.toFixed(1)}ms · {tr.spans.length} spans
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="md:col-span-7 p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 max-h-[440px] overflow-y-auto">
                  {!selectedTrace ? (
                    <div className="text-[11px] font-mono text-text-muted p-4 text-center">
                      No sampled traces available at current timestamp or sampling rate.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
                        <div>
                          <div className="text-xs font-mono font-semibold text-foreground">
                            {selectedTrace.traceId} — {selectedTrace.rootOperation}
                          </div>
                          <div className="text-[10px] font-mono text-text-muted">
                            Total: {selectedTrace.durationMs.toFixed(1)}ms · Critical Path:{" "}
                            {selectedTrace.criticalPathDurationMs.toFixed(1)}ms (
                            {selectedTrace.criticalPathSpanIds.length} spans)
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono border-border-default"
                        >
                          {selectedTrace.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        {selectedTrace.spans.map((sp) => {
                          const totalDur = Math.max(1, selectedTrace.durationMs);
                          const leftPct = Math.min(
                            98,
                            Math.max(
                              0,
                              ((sp.startTimeMs - selectedTrace.startTimeMs) /
                                totalDur) *
                                100
                            )
                          );
                          const widthPct = Math.max(
                            2,
                            Math.min(100 - leftPct, (sp.durationMs / totalDur) * 100)
                          );
                          const onCrit =
                            selectedTrace.criticalPathSpanIds.includes(sp.spanId);

                          return (
                            <div
                              key={sp.spanId}
                              className="p-2 rounded-md bg-surface-01 border border-border-subtle space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-foreground truncate">
                                    {sp.serviceId}
                                  </span>
                                  <span className="text-text-secondary truncate">
                                    {sp.name}
                                  </span>
                                  <span className="text-[9px] text-text-muted">
                                    ({sp.kind})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {onCrit && (
                                    <span className="px-1 py-0.5 rounded-md bg-surface-04 border border-border-strong text-[9px] text-foreground">
                                      crit
                                    </span>
                                  )}
                                  {sp.status === "error" && (
                                    <span className="px-1 py-0.5 rounded-md bg-surface-04 border border-border-strong text-[9px] text-foreground font-semibold">
                                      err
                                    </span>
                                  )}
                                  <span className="text-foreground">
                                    {sp.durationMs.toFixed(1)}ms
                                  </span>
                                </div>
                              </div>

                              {/* Waterfall bar */}
                              <div className="h-2.5 w-full rounded-md bg-surface-02 border border-border-subtle relative overflow-hidden">
                                <div
                                  className={cn(
                                    "absolute top-0 bottom-0 rounded-md",
                                    onCrit ? "bg-foreground" : "bg-neutral-500"
                                  )}
                                  style={{
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                  }}
                                />
                              </div>

                              {(sp.links.length > 0 || sp.events.length > 0) && (
                                <div className="text-[9px] font-mono text-text-muted space-y-0.5 pt-0.5">
                                  {sp.links.map((lk, idx) => (
                                    <div key={idx}>
                                      Link ({lk.relationship}): trace{" "}
                                      {lk.linkedTraceId} / span {lk.linkedSpanId}
                                    </div>
                                  ))}
                                  {sp.events.map((ev, idx) => (
                                    <div key={idx}>
                                      Event [{ev.name}] @ {ev.timestampMs}ms: {ev.detail}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Logs & Search */}
            {activeTab === "logs" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap p-2 rounded-md bg-surface-02 border border-border-default">
                  <div className="flex items-center gap-1">
                    {["ALL", "ERROR", "WARN", "INFO"].map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setLogSeverityFilter(sev)}
                        className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-mono border",
                          logSeverityFilter === sev
                            ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                            : "bg-surface-01 border-border-subtle text-text-muted hover:text-foreground"
                        )}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Filter message, service, traceId..."
                    className="h-7 px-2.5 w-[240px] rounded-md bg-surface-01 border border-border-default text-[10px] font-mono text-foreground placeholder:text-text-disabled focus:outline-none focus:border-border-strong"
                  />
                </div>

                {obsState.metrics.droppedLogs > 0 && (
                  <div className="px-2.5 py-1.5 rounded-md bg-surface-03 border border-border-strong text-[10px] font-mono text-foreground">
                    {obsState.metrics.droppedLogs} logs dropped or withheld due to collector outage / retention cap. Missing logs reflect observability blind spots, not silence of failures.
                  </div>
                )}

                <div className="space-y-1 max-h-[380px] overflow-y-auto">
                  {[...filteredLogs].reverse().map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-md bg-surface-02 border border-border-subtle flex items-start justify-between gap-2 text-[10px] font-mono"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1 py-0.5 rounded-md bg-surface-01 border border-border-default text-[9px] text-foreground">
                            {log.severity}
                          </span>
                          <span className="font-semibold text-foreground">
                            {log.serviceId}
                          </span>
                          <span className="text-text-muted">
                            evt {log.eventTimeMs}ms · ingest {log.ingestionTimeMs}ms
                          </span>
                        </div>
                        <div className="text-text-secondary break-words">
                          {log.message}
                        </div>
                      </div>
                      {log.traceId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTraceId(log.traceId ?? null);
                            setActiveTab("traces");
                          }}
                          className="px-1.5 py-0.5 rounded-md bg-surface-01 border border-border-default hover:border-border-strong text-[9px] text-foreground shrink-0"
                        >
                          {log.traceId}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SLOs & Alerts */}
            {activeTab === "slos_alerts" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {obsState.slos.map((slo) => (
                    <div
                      key={slo.id}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 text-[10px] font-mono"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {slo.name}
                          </div>
                          <div className="text-[9px] text-text-muted">
                            {slo.targetServiceId} · {slo.sliType} · {slo.windowType}{" "}
                            window ({slo.windowMs}ms)
                          </div>
                        </div>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-md border text-[9px] uppercase",
                            slo.breached
                              ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                              : "bg-surface-01 border-border-default text-text-secondary"
                          )}
                        >
                          {slo.breached ? "SLO Breached" : "Within SLO"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">Target</div>
                          <div className="text-foreground font-semibold">
                            {(slo.target * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">Current</div>
                          <div className="text-foreground font-semibold">
                            {(slo.compliance * 100).toFixed(2)}%
                          </div>
                        </div>
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">Burn Rate</div>
                          <div className="text-foreground font-semibold">
                            {slo.burnRate.toFixed(2)}x
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-text-muted">
                          <span>
                            Good {slo.goodRequests} / Eligible {slo.eligibleRequests} (bad{" "}
                            {slo.badRequests})
                          </span>
                          <span>
                            Budget left: {slo.errorBudgetRemainingPct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-md bg-surface-01 border border-border-subtle overflow-hidden">
                          <div
                            className="h-full bg-foreground"
                            style={{
                              width: `${Math.max(0, Math.min(100, slo.errorBudgetRemainingPct))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Alert State Machines */}
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <h3 className="text-[11px] font-mono font-semibold text-foreground">
                    Alert Evaluation State Machines ({obsState.alerts.length})
                  </h3>
                  <div className="space-y-2">
                    {obsState.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-2 rounded-md bg-surface-01 border border-border-subtle space-y-1.5 text-[10px] font-mono"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-foreground">
                              {alert.name}
                            </span>{" "}
                            <span className="text-text-muted">
                              ({alert.serviceId} · {alert.metric} &gt; {alert.threshold})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-text-muted">
                              missing: {alert.missingDataPolicy}
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded-md border text-[9px] font-semibold",
                                alert.state === "FIRING"
                                  ? "bg-surface-04 border-border-strong text-foreground"
                                  : "bg-surface-02 border-border-default text-text-secondary"
                              )}
                            >
                              {alert.state}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-text-muted">
                          <span>
                            Current value:{" "}
                            {alert.currentValue === null
                              ? "NO_DATA"
                              : alert.currentValue.toFixed(3)}
                          </span>
                          <span>Fire transitions: {alert.fireCount}</span>
                        </div>

                        {alert.recentEvaluations.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {alert.recentEvaluations.map((ev, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "px-1.5 py-0.5 rounded-md border text-[9px]",
                                  ev.state === "FIRING"
                                    ? "bg-surface-04 border-border-strong text-foreground"
                                    : "bg-surface-02 border-border-subtle text-text-muted"
                                )}
                              >
                                {ev.evaluatedAtMs}ms:{" "}
                                {ev.computedValue === null
                                  ? "NO_DATA"
                                  : ev.computedValue.toFixed(2)}{" "}
                                [{ev.state}]
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Incident & RCA */}
            {activeTab === "incident_rca" && (
              <div className="space-y-3">
                {!activeIncident ? (
                  <div className="p-4 rounded-md bg-surface-02 border border-border-default text-[11px] font-mono text-text-secondary text-center">
                    No active or historical incidents detected in this run. Healthy baseline or all signals remained below alert thresholds.
                  </div>
                ) : (
                  <>
                    {/* Incident Header & Blast Radius */}
                    <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 text-[10px] font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {activeIncident.title} ({activeIncident.id})
                          </div>
                          <div className="text-[9px] text-text-muted">
                            Detected @ {activeIncident.detectedAtMs}ms
                            {activeIncident.mitigatedAtMs !== undefined &&
                              ` · Mitigated @ ${activeIncident.mitigatedAtMs}ms`}
                            {activeIncident.resolvedAtMs !== undefined &&
                              ` · Resolved @ ${activeIncident.resolvedAtMs}ms`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono uppercase border-border-default"
                          >
                            {activeIncident.severity}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono uppercase border-border-strong text-foreground"
                          >
                            {activeIncident.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">
                            Direct Failing
                          </div>
                          <div className="text-foreground font-semibold">
                            {activeIncident.directFailingServiceIds.join(", ") ||
                              "None"}
                          </div>
                        </div>
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">
                            Downstream Impacted
                          </div>
                          <div className="text-foreground">
                            {activeIncident.downstreamImpactedIds.join(", ") ||
                              "None"}
                          </div>
                        </div>
                        <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                          <div className="text-[9px] text-text-muted">
                            Upstream Impacted
                          </div>
                          <div className="text-foreground">
                            {activeIncident.upstreamImpactedIds.join(", ") ||
                              "None"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hypotheses & Root-Cause Graph */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-mono font-semibold text-foreground">
                            Ranked Root-Cause Hypotheses
                          </h3>
                          <span className="text-[9px] font-mono text-text-muted">
                            {obsState.investigationMode === "investigation"
                              ? "Observable evidence only"
                              : "Verified ground truth revealed"}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {activeIncident.hypotheses.map((hyp) => (
                            <div
                              key={hyp.id}
                              className="p-2 rounded-md bg-surface-01 border border-border-subtle space-y-1 text-[10px] font-mono"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground">
                                  #{hyp.rank} {hyp.serviceId}
                                </span>
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-md border text-[9px] uppercase",
                                    hyp.status === "verified"
                                      ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                                      : "bg-surface-02 border-border-default text-text-secondary"
                                  )}
                                >
                                  {hyp.status}
                                </span>
                              </div>
                              <div className="text-foreground">{hyp.description}</div>
                              <div className="text-[9px] text-text-muted">
                                {hyp.rationale} · Supporting evidence:{" "}
                                {hyp.supportingEvidenceIds.length}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-mono font-semibold text-foreground">
                            Root-Cause Graph (Monochrome)
                          </h3>
                          <span className="text-[9px] font-mono text-text-muted">
                            dashed = correlation · solid = verified causal
                          </span>
                        </div>
                        <svg
                          viewBox="0 0 380 180"
                          className="w-full h-40 rounded-md bg-surface-01 border border-border-subtle"
                        >
                          {obsState.rootCauseGraph.edges.map((edge, idx) => {
                            const fromIdx = obsState.rootCauseGraph.nodes.findIndex(
                              (n) => n.id === edge.from
                            );
                            const toIdx = obsState.rootCauseGraph.nodes.findIndex(
                              (n) => n.id === edge.to
                            );
                            if (fromIdx < 0 || toIdx < 0) return null;
                            const x1 = 40 + (fromIdx % 3) * 140;
                            const y1 = 42 + Math.floor(fromIdx / 3) * 75;
                            const x2 = 40 + (toIdx % 3) * 140;
                            const y2 = 42 + Math.floor(toIdx / 3) * 75;
                            return (
                              <line
                                key={`${edge.id}_${idx}`}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={
                                  edge.relation === "verified_causal"
                                    ? "#FFFFFF"
                                    : "#666666"
                                }
                                strokeWidth={
                                  edge.relation === "verified_causal" ? 1.8 : 1.2
                                }
                                strokeDasharray={
                                  edge.relation === "observed_correlation"
                                    ? "4 3"
                                    : undefined
                                }
                              />
                            );
                          })}
                          {obsState.rootCauseGraph.nodes.map((node, idx) => {
                            const x = 14 + (idx % 3) * 124;
                            const y = 20 + Math.floor(idx / 3) * 75;
                            return (
                              <g key={node.id} transform={`translate(${x}, ${y})`}>
                                <rect
                                  width="112"
                                  height="36"
                                  rx="6"
                                  fill="#141414"
                                  stroke={
                                    node.kind === "fault" ? "#555555" : "#262626"
                                  }
                                  strokeWidth="1"
                                />
                                <text
                                  x="8"
                                  y="15"
                                  fill="#FFFFFF"
                                  fontSize="9"
                                  fontFamily="monospace"
                                >
                                  {node.label.slice(0, 18)}
                                </text>
                                <text
                                  x="8"
                                  y="28"
                                  fill="#858585"
                                  fontSize="8"
                                  fontFamily="monospace"
                                >
                                  {node.kind}
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        {/* Correlated Evidence */}
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {activeIncident.evidence.slice(0, 6).map((ev) => (
                            <div
                              key={ev.id}
                              className="px-2 py-1 rounded-md bg-surface-01 border border-border-subtle text-[9px] font-mono text-text-secondary flex items-center justify-between gap-2"
                            >
                              <span className="truncate">
                                [{ev.source}] {ev.observation}
                              </span>
                              <span className="text-text-muted shrink-0">
                                {ev.timestampMs}ms
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Fact-Only Postmortem */}
                    {activeIncident.postmortem && (
                      <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5 text-[10px] font-mono">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-semibold text-foreground">
                            {activeIncident.postmortem.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono border-border-default"
                          >
                            Fact-Only Output
                          </Badge>
                        </div>
                        <p className="text-text-secondary">
                          {activeIncident.postmortem.summary}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[9px] text-text-muted">
                          <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                            <span className="text-foreground font-semibold">
                              Root cause / hypotheses:{" "}
                            </span>
                            {activeIncident.postmortem.rootCauseOrHypotheses}
                          </div>
                          <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                            <span className="text-foreground font-semibold">
                              Recovery:{" "}
                            </span>
                            {activeIncident.postmortem.recoverySummary}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Side-by-Side Scenario Comparison */}
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 text-[10px] font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      Incident & Mitigation Scenario Comparison
                    </span>
                    <Select
                      value={comparePairId}
                      onValueChange={(v) => setComparePairId(v)}
                    >
                      <SelectTrigger className="h-7 w-[270px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-default rounded-md">
                        {COMPARE_PAIRS.map((pair) => (
                          <SelectItem
                            key={pair.id}
                            value={pair.id}
                            className="text-[10px] font-mono"
                          >
                            {pair.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Error Rate Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {(comparisonResult.deltas.errorRateDelta * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        p95 Latency Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {comparisonResult.deltas.p95LatencyMsDelta.toFixed(1)} ms
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        SLO Compliance Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {comparisonResult.deltas.sloCompliancePctDelta.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Resolved Delta
                      </div>
                      <div className="text-foreground font-semibold">
                        {comparisonResult.deltas.incidentsResolvedDelta > 0
                          ? `+${comparisonResult.deltas.incidentsResolvedDelta}`
                          : comparisonResult.deltas.incidentsResolvedDelta}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Invariants & Metrics */}
            {activeTab === "invariants_metrics" && (
              <div className="space-y-3 text-[10px] font-mono">
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Observability Correctness Invariants
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono border-border-strong text-foreground"
                    >
                      {obsState.invariants.allPassed
                        ? "9 / 9 PASSED"
                        : `${obsState.invariants.violations.length} VIOLATIONS`}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    {(
                      [
                        ["Spans Valid Trace", obsState.invariants.spansValidTraceOk],
                        [
                          "Parent-Child Acyclic",
                          obsState.invariants.parentChildAcyclicOk,
                        ],
                        [
                          "Non-Negative Durations",
                          obsState.invariants.nonNegativeDurationsOk,
                        ],
                        [
                          "Log Correlations Valid",
                          obsState.invariants.logCorrelationsValidOk,
                        ],
                        ["SLI Bounds [0,1]", obsState.invariants.sliBoundsOk],
                        [
                          "Missing-Data Safety",
                          obsState.invariants.missingDataSafeOk,
                        ],
                        [
                          "Incident Causal Order",
                          obsState.invariants.incidentCausalOrderOk,
                        ],
                        [
                          "Evidence Provenance",
                          obsState.invariants.evidenceProvenanceOk,
                        ],
                        [
                          "Ground Truth Separated",
                          obsState.invariants.groundTruthSeparatedOk,
                        ],
                      ] as const
                    ).map(([label, ok]) => (
                      <div
                        key={label}
                        className="px-2 py-1.5 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between"
                      >
                        <span className="text-text-secondary">{label}</span>
                        <span className="text-foreground font-semibold">
                          {ok ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {obsState.invariants.violations.length > 0 && (
                    <div className="p-2 rounded-md bg-surface-03 border border-border-strong text-foreground space-y-0.5">
                      {obsState.invariants.violations.map((v, i) => (
                        <div key={i}>• {v}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Modeled Observability Telemetry Summary
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runObservabilitySimulation(scenario)}
                      className="h-6 px-2 text-[9px] font-mono rounded-md gap-1 hover:bg-surface-03"
                    >
                      <RefreshIcon className="w-3 h-3" />
                      Re-verify
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                    <div className="p-2 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">Total Traces</div>
                      <div className="text-foreground font-semibold">
                        {obsState.metrics.totalTraces} (sampled:{" "}
                        {obsState.metrics.sampledTraces})
                      </div>
                    </div>
                    <div className="p-2 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">Total Spans</div>
                      <div className="text-foreground font-semibold">
                        {obsState.metrics.totalSpans}
                      </div>
                    </div>
                    <div className="p-2 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Logs / Dropped
                      </div>
                      <div className="text-foreground font-semibold">
                        {obsState.metrics.totalLogs} / {obsState.metrics.droppedLogs}
                      </div>
                    </div>
                    <div className="p-2 rounded-md bg-surface-01 border border-border-subtle">
                      <div className="text-[9px] text-text-muted">
                        Detection / Recovery
                      </div>
                      <div className="text-foreground font-semibold">
                        {obsState.metrics.detectionDelayMs ?? "—"}ms /{" "}
                        {obsState.metrics.recoveryDurationMs ?? "—"}ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

