"use client";

import * as React from "react";
import {
  ShieldIcon,
  CloseIcon,
  PlayIcon,
  LayersIcon,
  ActivityIcon,
  CpuIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  SERVICE_MESH_PRESET_METADATA,
  type ServiceMeshPresetId,
  createServiceMeshPresetScenario,
  type MeshRequestSummary,
} from "@nxtqr/architecture-execution";

type WorkspaceTab =
  | "topology"
  | "resilience"
  | "retries_timeouts"
  | "security"
  | "canary"
  | "trace_failures";

export function ServiceMeshWorkspace() {
  const toggleServiceMeshWorkspace = useExecutionStore(
    (s) => s.toggleServiceMeshWorkspace
  );
  const activeServiceMeshScenario = useExecutionStore(
    (s) => s.activeServiceMeshScenario
  );
  const setServiceMeshScenario = useExecutionStore(
    (s) => s.setServiceMeshScenario
  );
  const runServiceMeshSimulation = useExecutionStore(
    (s) => s.runServiceMeshSimulation
  );
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore(
    (s) => s.playbackState.currentStepIndex
  );

  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("topology");
  const [selectedPreset, setSelectedPreset] =
    React.useState<ServiceMeshPresetId>(
      (activeServiceMeshScenario?.presetId as ServiceMeshPresetId) ||
        "basic_service_request"
    );
  const [topologyMode, setTopologyMode] = React.useState<"logical" | "physical">(
    "logical"
  );
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (!activeServiceMeshScenario) {
      const initial = createServiceMeshPresetScenario(selectedPreset);
      setServiceMeshScenario(initial);
    }
  }, [activeServiceMeshScenario, selectedPreset, setServiceMeshScenario]);

  const activeScenario =
    activeServiceMeshScenario ||
    createServiceMeshPresetScenario(selectedPreset);

  const currentFrame = trace?.frames?.[currentStepIndex];
  const activeEvent = currentFrame?.activeEvent;
  const meshState = currentFrame?.runtimeState?.serviceMeshState;

  const metrics = meshState?.metrics;
  const instancesList = meshState ? Object.values(meshState.instances) : [];
  const proxiesList = meshState ? Object.values(meshState.proxies) : [];
  const discoveryList = meshState
    ? Object.values(meshState.discoveryCache)
    : [];
  const circuitsList = meshState ? Object.values(meshState.circuits) : [];
  const bulkheadsList = meshState ? Object.values(meshState.bulkheads) : [];
  const canaryState = meshState?.canary;
  const requestsList: MeshRequestSummary[] = meshState
    ? meshState.recentRequests
    : [];
  const failureChain = meshState ? meshState.failurePropagationChain : [];

  const inspectedRequest =
    (selectedRequestId &&
      requestsList.find((r) => r.requestId === selectedRequestId)) ||
    requestsList[requestsList.length - 1];

  const handlePresetChange = (presetId: string) => {
    const id = presetId as ServiceMeshPresetId;
    setSelectedPreset(id);
    setSelectedRequestId(null);
    const scenario = createServiceMeshPresetScenario(id);
    setServiceMeshScenario(scenario);
    runServiceMeshSimulation(scenario);
  };

  const handleToggleMtlsMode = () => {
    const nextMode =
      activeScenario.security.mtlsMode === "strict"
        ? "permissive"
        : activeScenario.security.mtlsMode === "permissive"
          ? "disabled"
          : "strict";
    const next = {
      ...activeScenario,
      security: {
        ...activeScenario.security,
        mtlsMode: nextMode as "strict" | "permissive" | "disabled",
      },
    };
    setServiceMeshScenario(next);
    runServiceMeshSimulation(next);
  };

  const handleToggleRetries = () => {
    const hasRetry = activeScenario.resilience.some((r) => r.retry.enabled);
    const nextResilience =
      activeScenario.resilience.length > 0
        ? activeScenario.resilience.map((r) => ({
            ...r,
            retry: {
              ...r.retry,
              enabled: !hasRetry,
              maxAttempts: !hasRetry ? Math.max(2, r.retry.maxAttempts) : 1,
            },
          }))
        : activeScenario.services.map((svc) => ({
            serviceId: svc.id,
            attemptTimeoutMs: svc.defaultTimeoutMs,
            overallDeadlineMs: Math.max(svc.defaultTimeoutMs * 2, 1800),
            retry: {
              enabled: true,
              maxAttempts: 3,
              initialBackoffMs: 50,
              maxBackoffMs: 250,
              exponentialFactor: 2,
              jitterRatio: 0.1,
              retryBudgetPct: 300,
              retryableHttpStatuses: [500, 502, 503, 504],
              retryableGrpcStatuses: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
            },
            circuitBreaker: {
              enabled: false,
              scope: "destination_service" as const,
              rollingWindowMs: 10000,
              minimumRequests: 4,
              failureRateThresholdPct: 50,
              openDurationMs: 1200,
              halfOpenProbeLimit: 2,
              successThreshold: 2,
            },
            bulkhead: {
              enabled: false,
              maxActive: 8,
              queueCapacity: 4,
              queueTimeoutMs: 60,
            },
          }));
    const next = { ...activeScenario, resilience: nextResilience };
    setServiceMeshScenario(next);
    runServiceMeshSimulation(next);
  };

  const handleToggleCircuitBreaker = () => {
    const hasCb = activeScenario.resilience.some(
      (r) => r.circuitBreaker.enabled
    );
    const nextResilience =
      activeScenario.resilience.length > 0
        ? activeScenario.resilience.map((r) => ({
            ...r,
            circuitBreaker: { ...r.circuitBreaker, enabled: !hasCb },
          }))
        : activeScenario.services.map((svc) => ({
            serviceId: svc.id,
            attemptTimeoutMs: svc.defaultTimeoutMs,
            overallDeadlineMs: Math.max(svc.defaultTimeoutMs * 2, 1800),
            retry: {
              enabled: false,
              maxAttempts: 1,
              initialBackoffMs: 50,
              maxBackoffMs: 250,
              exponentialFactor: 2,
              jitterRatio: 0.1,
              retryBudgetPct: 100,
              retryableHttpStatuses: [500, 502, 503, 504],
              retryableGrpcStatuses: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
            },
            circuitBreaker: {
              enabled: true,
              scope: "destination_service" as const,
              rollingWindowMs: 10000,
              minimumRequests: 4,
              failureRateThresholdPct: 50,
              openDurationMs: 1200,
              halfOpenProbeLimit: 2,
              successThreshold: 2,
            },
            bulkhead: {
              enabled: false,
              maxActive: 8,
              queueCapacity: 4,
              queueTimeoutMs: 60,
            },
          }));
    const next = { ...activeScenario, resilience: nextResilience };
    setServiceMeshScenario(next);
    runServiceMeshSimulation(next);
  };

  const handleRunSimulation = () => {
    setSelectedRequestId(null);
    runServiceMeshSimulation(activeScenario);
  };

  return (
    <div
      role="region"
      aria-label="Service Mesh & Distributed Resilience Workspace"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 h-[450px] max-w-[1260px] mx-auto",
        "bg-surface-01 border border-border-default rounded-md shadow-level-2 flex flex-col overflow-hidden"
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-02">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <span className="text-xs font-semibold text-foreground tracking-tight truncate">
            Microservices Communication, Service Mesh &amp; Resilience Simulator
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border-default text-text-muted rounded-md shrink-0"
          >
            {metrics
              ? `${metrics.totalRootRequests} root · ${metrics.retryAmplificationFactor}x calls · p95 ${metrics.p95LatencyMs}ms`
              : "Ready"}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-7 w-[240px] text-[11px] font-mono bg-surface-03 border-border-default text-foreground rounded-md">
              <SelectValue placeholder="Select service mesh scenario preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground rounded-md max-h-[340px]">
              {SERVICE_MESH_PRESET_METADATA.map((meta) => (
                <SelectItem
                  key={meta.id}
                  value={meta.id}
                  className="text-[11px] font-mono focus:bg-surface-04"
                >
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setTopologyMode(topologyMode === "logical" ? "physical" : "logical")
            }
            className="h-7 px-2 text-[11px] font-mono bg-surface-03 border border-border-default text-text-secondary hover:text-foreground rounded-md"
          >
            View: {topologyMode === "logical" ? "Logical" : "Physical Proxies"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-2.5 text-[11px] font-mono bg-foreground text-background hover:bg-text-secondary rounded-md gap-1.5"
          >
            <PlayIcon className="w-3 h-3" />
            <span>Run Mesh Sim</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleServiceMeshWorkspace(false)}
            aria-label="Close Service Mesh Workspace"
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs + Policy Comparison Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: "topology", label: "Topology & Discovery" },
              { id: "resilience", label: "Circuit, Bulkhead & Pools" },
              { id: "retries_timeouts", label: "Retries & Timeouts" },
              { id: "security", label: "mTLS & Auth" },
              { id: "canary", label: "Canary & Splits" },
              { id: "trace_failures", label: "Trace & Failure Tree" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-surface-04 text-foreground font-semibold border border-border-strong shadow-level-3"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-02 border border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={handleToggleMtlsMode}
            className="px-2 py-1 rounded-md border bg-surface-02 border-border-subtle text-text-secondary hover:text-foreground"
          >
            mTLS: {activeScenario.security.mtlsMode.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={handleToggleRetries}
            className={cn(
              "px-2 py-1 rounded-md border transition-colors",
              activeScenario.resilience.some((r) => r.retry.enabled)
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-text-secondary"
            )}
          >
            Retries:{" "}
            {activeScenario.resilience.some((r) => r.retry.enabled) ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={handleToggleCircuitBreaker}
            className={cn(
              "px-2 py-1 rounded-md border transition-colors",
              activeScenario.resilience.some((r) => r.circuitBreaker.enabled)
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-text-secondary"
            )}
          >
            Circuit:{" "}
            {activeScenario.resilience.some((r) => r.circuitBreaker.enabled)
              ? "ON"
              : "OFF"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
        {activeEvent && (
          <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-surface-02 border border-border-subtle rounded-md text-[11px] font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <Badge
                variant="outline"
                className="text-[10px] border-border-default text-text-secondary rounded-md shrink-0"
              >
                +{activeEvent.atMs}ms · {activeEvent.type}
              </Badge>
              <span className="text-foreground truncate">
                {activeEvent.explanation}
              </span>
            </div>
            <span className="text-text-muted shrink-0">
              T={meshState?.virtualTimeMs ?? 0}ms
            </span>
          </div>
        )}

        {/* TAB 1: Topology & Discovery */}
        {activeTab === "topology" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <MetricBox
                label="Root Requests"
                value={String(metrics?.totalRootRequests ?? 0)}
                sub={`${metrics?.successCount ?? 0} ok / ${metrics?.degradedCount ?? 0} deg / ${metrics?.failedCount ?? 0} err`}
              />
              <MetricBox
                label="Service Calls"
                value={String(metrics?.totalServiceCalls ?? 0)}
                sub={`${metrics?.retryAmplificationFactor ?? 1}x amplification`}
              />
              <MetricBox
                label="Retries / Timeouts"
                value={`${metrics?.retryCount ?? 0} / ${metrics?.timeoutCount ?? 0}`}
                sub={`Fallbacks: ${metrics?.fallbackCount ?? 0}`}
              />
              <MetricBox
                label="Circuit Rejects"
                value={String(metrics?.circuitRejectionCount ?? 0)}
                sub={`Bulkhead: ${metrics?.bulkheadRejectionCount ?? 0}`}
              />
              <MetricBox
                label="Security Drops"
                value={String((metrics?.authDeniedCount ?? 0) + (metrics?.mtlsFailedCount ?? 0))}
                sub={`Auth ${metrics?.authDeniedCount ?? 0} · mTLS ${metrics?.mtlsFailedCount ?? 0}`}
              />
              <MetricBox
                label="Latency p95"
                value={`${metrics?.p95LatencyMs ?? 0}ms`}
                sub={`p50 ${metrics?.p50LatencyMs ?? 0}ms · p99 ${metrics?.p99LatencyMs ?? 0}ms`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                  <span>
                    {topologyMode === "logical"
                      ? "Logical Service Dependency Graph"
                      : "Physical Sidecar Proxy & Instance Topology"}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-[195px] overflow-y-auto">
                  {activeScenario.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-semibold">
                          {svc.name} ({svc.protocol.toUpperCase()})
                        </span>
                        <span className="text-text-muted">
                          {topologyMode === "physical"
                            ? `proxy: ${svc.proxyMode}`
                            : `timeout ${svc.defaultTimeoutMs}ms`}
                        </span>
                      </div>
                      {svc.dependencies.length > 0 && (
                        <div className="text-text-secondary pl-2 border-l border-border-default">
                          calls:{" "}
                          {svc.dependencies
                            .map((d) =>
                              topologyMode === "physical"
                                ? `outbound-proxy -> ${d.targetServiceId} (${d.protocol})`
                                : `${d.targetServiceId} (${d.operation})`
                            )
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <ActivityIcon className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Service Instances &amp; Discovery Registry Cache</span>
                </div>
                <div className="space-y-1 max-h-[195px] overflow-y-auto">
                  {instancesList.map((inst) => (
                    <div
                      key={inst.id}
                      className="p-1.5 bg-surface-02 border border-border-subtle rounded-md flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-foreground font-semibold">
                          {inst.id}
                        </span>{" "}
                        <span className="text-text-muted">
                          ({inst.revision} · {inst.region})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">
                          {inst.totalHandled} calls · {inst.totalErrors} err
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] rounded-md",
                            inst.healthy
                              ? "border-border-default text-text-secondary"
                              : "border-destructive text-destructive"
                          )}
                        >
                          {inst.healthy ? "READY" : "UNHEALTHY"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {discoveryList.map((entry) => (
                    <div
                      key={entry.serviceId}
                      className="p-1.5 bg-surface-02 border border-border-subtle rounded-md flex justify-between text-text-muted"
                    >
                      <span>cache[{entry.serviceId}]</span>
                      <span className="text-text-secondary">
                        [{entry.endpointIds.join(", ")}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Circuit Breakers, Bulkheads & Connection Pools */}
        {activeTab === "resilience" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="text-foreground font-semibold">
                Circuit Breakers ({circuitsList.length})
              </div>
              {circuitsList.length === 0 ? (
                <div className="text-text-muted">
                  Circuit breakers disabled for this scenario. Toggle Circuit ON above to enable.
                </div>
              ) : (
                circuitsList.map((cb) => (
                  <div
                    key={cb.scopeKey}
                    className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-1"
                  >
                    <div className="flex justify-between">
                      <span className="text-foreground font-semibold">
                        {cb.scopeKey}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase rounded-md",
                          cb.state === "open"
                            ? "border-destructive text-destructive"
                            : "border-border-strong text-foreground"
                        )}
                      >
                        {cb.state}
                      </Badge>
                    </div>
                    <div className="text-text-muted">
                      Rejected: {cb.rejectedCount} · Rolling outcomes:{" "}
                      {cb.recentOutcomes.length}
                    </div>
                    {cb.transitions.map((tr, i) => (
                      <div
                        key={i}
                        className="text-text-secondary pl-2 border-l border-border-default"
                      >
                        +{tr.atMs}ms: {tr.from} -&gt; {tr.to} ({tr.reason})
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="text-foreground font-semibold">
                Bulkhead Isolation ({bulkheadsList.length})
              </div>
              {bulkheadsList.length === 0 ? (
                <div className="text-text-muted">
                  No bulkhead caps triggered in this scenario.
                </div>
              ) : (
                bulkheadsList.map((bh) => (
                  <div
                    key={bh.serviceId}
                    className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-1"
                  >
                    <div className="text-foreground font-semibold">
                      {bh.serviceId}
                    </div>
                    <div className="text-text-muted">
                      Max Active: {bh.maxActive} · Queue Cap: {bh.queueCapacity}
                    </div>
                    <div className="text-text-secondary">
                      Acquired: {bh.acquiredCount} · Rejected: {bh.rejectedCount}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="text-foreground font-semibold">
                Proxy Connection Pools ({proxiesList.length})
              </div>
              {proxiesList.map((proxy) => (
                <div
                  key={proxy.id}
                  className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-1"
                >
                  <div className="flex justify-between">
                    <span className="text-foreground font-semibold">
                      {proxy.id} ({proxy.mode})
                    </span>
                    <span className="text-text-muted">
                      {proxy.healthy ? "UP" : "DOWN"}
                    </span>
                  </div>
                  {Object.values(proxy.pools).map((pool) => (
                    <div
                      key={pool.targetServiceId}
                      className="text-text-muted pl-2 border-l border-border-default"
                    >
                      -&gt; {pool.targetServiceId}: max {pool.maxConnections} · reused{" "}
                      {pool.reusedCount} · rejected {pool.rejectedCount}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Retries & Timeouts */}
        {activeTab === "retries_timeouts" && (
          <div className="space-y-3 text-[11px] font-mono">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {activeScenario.resilience.length === 0 ? (
                <div className="col-span-3 p-3 bg-surface-01 border border-border-default rounded-md text-text-muted">
                  Default per-service timeouts active. Click &quot;Retries: ON&quot; above to compare retry &amp; backoff impact.
                </div>
              ) : (
                activeScenario.resilience.map((pol) => (
                  <div
                    key={pol.serviceId}
                    className="p-2.5 bg-surface-01 border border-border-default rounded-md space-y-1"
                  >
                    <div className="flex justify-between text-foreground font-semibold">
                      <span>{pol.serviceId}</span>
                      <span>
                        timeout {pol.attemptTimeoutMs}ms / deadline{" "}
                        {pol.overallDeadlineMs}ms
                      </span>
                    </div>
                    <div className="text-text-muted">
                      Retry: {pol.retry.enabled ? `max ${pol.retry.maxAttempts} attempts` : "disabled"} ·{" "}
                      backoff {pol.retry.initialBackoffMs}ms (x{pol.retry.exponentialFactor})
                    </div>
                    <div className="text-text-secondary">
                      Retry budget: {pol.retry.retryBudgetPct}% · Used retries:{" "}
                      {metrics?.retryCount ?? 0}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface-01 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-1.5 bg-surface-02 border-b border-border-subtle font-semibold text-text-secondary">
                Request Attempt &amp; Amplification Summary
              </div>
              <div className="divide-y divide-border-subtle max-h-[165px] overflow-y-auto">
                {requestsList.map((r) => (
                  <button
                    key={r.requestId}
                    type="button"
                    onClick={() => {
                      setSelectedRequestId(r.requestId);
                      setActiveTab("trace_failures");
                    }}
                    className="w-full text-left px-3 py-1.5 flex justify-between hover:bg-surface-02"
                  >
                    <span className="text-foreground">
                      {r.requestId} ({r.operation})
                    </span>
                    <span className="text-text-secondary">
                      {r.spans.length} spans · {r.status} ({r.statusCodeLabel}) ·{" "}
                      {r.totalDurationMs}ms
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: mTLS & Authorization */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="text-foreground font-semibold">
                SPIFFE Identities &amp; mTLS Policy ({activeScenario.security.mtlsMode})
              </div>
              <div className="text-text-muted">
                Trust Domain: {activeScenario.security.trustDomain} · Handshake{" "}
                {activeScenario.security.handshakeLatencyMs}ms
              </div>
              <div className="space-y-1">
                {activeScenario.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-1.5 bg-surface-02 border border-border-subtle rounded-md flex justify-between"
                  >
                    <span className="text-foreground">{svc.id}</span>
                    <span className="text-text-secondary truncate ml-2">
                      {svc.identity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="text-foreground font-semibold">
                Mesh Authorization Rules (Default:{" "}
                {activeScenario.security.defaultAllow ? "Allow" : "Deny"})
              </div>
              {activeScenario.security.authorizationRules.length === 0 ? (
                <div className="text-text-muted">
                  No explicit RBAC deny/allow rules configured in this preset.
                </div>
              ) : (
                activeScenario.security.authorizationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-0.5"
                  >
                    <div className="flex justify-between text-foreground font-semibold">
                      <span>{rule.id}</span>
                      <span className="uppercase">{rule.effect}</span>
                    </div>
                    <div className="text-text-muted">
                      {rule.sourceIdentityPattern} -&gt; {rule.destinationServiceId} (
                      {rule.operationPattern})
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Canary & Traffic Splitting */}
        {activeTab === "canary" && (
          <div className="space-y-3 text-[11px] font-mono">
            {!canaryState ? (
              <div className="p-3 bg-surface-01 border border-border-default rounded-md text-text-muted">
                Select &quot;Canary Staged Promotion&quot;, &quot;Canary Automatic Rollback&quot;, or &quot;Weighted Traffic Split (90/10)&quot; to inspect progressive rollout gates.
              </div>
            ) : (
              <div className="bg-surface-01 border border-border-default rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">
                    Canary Rollout: {canaryState.serviceId} (
                    {canaryState.stableRevision} vs {canaryState.canaryRevision})
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase rounded-md",
                      canaryState.status === "rolled_back"
                        ? "border-destructive text-destructive"
                        : "border-border-strong text-foreground"
                    )}
                  >
                    {canaryState.status} · {canaryState.currentCanaryPct}% canary
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-surface-02 border border-border-subtle rounded-md">
                    <div className="text-text-muted">
                      Stable ({canaryState.stableRevision})
                    </div>
                    <div className="text-foreground">
                      {canaryState.stableRequests} req ·{" "}
                      {canaryState.stableErrors} err · avg{" "}
                      {canaryState.stableAvgLatencyMs}ms
                    </div>
                  </div>
                  <div className="p-2 bg-surface-02 border border-border-subtle rounded-md">
                    <div className="text-text-muted">
                      Canary ({canaryState.canaryRevision})
                    </div>
                    <div className="text-foreground">
                      {canaryState.canaryRequests} req ·{" "}
                      {canaryState.canaryErrors} err · avg{" "}
                      {canaryState.canaryAvgLatencyMs}ms
                    </div>
                  </div>
                </div>
                <div className="text-text-secondary">{canaryState.reason}</div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Trace Waterfall & Failure Propagation Tree */}
        {activeTab === "trace_failures" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <CpuIcon className="w-3.5 h-3.5 text-text-secondary" />
                  <span>
                    Distributed Trace Spans (
                    {inspectedRequest?.requestId ?? "none"})
                  </span>
                </div>
                {inspectedRequest && (
                  <span className="text-text-muted">
                    Critical Path: {inspectedRequest.criticalPathMs}ms
                  </span>
                )}
              </div>
              <div className="space-y-1.5 max-h-[245px] overflow-y-auto">
                {!inspectedRequest ? (
                  <div className="text-text-muted">No request trace selected.</div>
                ) : (
                  inspectedRequest.spans.map((sp) => (
                    <div
                      key={sp.spanId}
                      className={cn(
                        "p-2 rounded-md border",
                        sp.onCriticalPath
                          ? "bg-surface-03 border-border-strong"
                          : "bg-surface-02 border-border-subtle"
                      )}
                    >
                      <div className="flex justify-between">
                        <span className="text-foreground font-semibold">
                          {sp.sourceServiceId} -&gt; {sp.destinationServiceId} (
                          {sp.protocol} #{sp.attempt})
                        </span>
                        <span className="text-text-secondary">
                          {sp.statusLabel} · {sp.durationMs}ms
                        </span>
                      </div>
                      <div className="text-text-muted flex justify-between">
                        <span>
                          {sp.instanceId ?? "-"} · mTLS {sp.mtlsMs}ms · proc{" "}
                          {sp.processingMs}ms
                        </span>
                        {sp.onCriticalPath && (
                          <span className="text-foreground">CRITICAL PATH</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="text-foreground font-semibold">
                Causal Failure Propagation Timeline ({failureChain.length})
              </div>
              <div className="space-y-1.5 max-h-[245px] overflow-y-auto">
                {failureChain.length === 0 ? (
                  <div className="text-text-muted">
                    No cascading failures recorded in this run.
                  </div>
                ) : (
                  failureChain.map((node) => (
                    <div
                      key={node.id}
                      className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-0.5"
                    >
                      <div className="flex justify-between text-foreground font-semibold">
                        <span>
                          {node.serviceId} ({node.stage})
                        </span>
                        <span className="text-text-muted">+{node.atMs}ms</span>
                      </div>
                      <div className="text-text-secondary">{node.summary}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-surface-01 border border-border-default rounded-md p-2 space-y-0.5">
      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="text-sm font-mono font-semibold text-foreground">
        {value}
      </div>
      <div className="text-[10px] font-mono text-text-secondary truncate">
        {sub}
      </div>
    </div>
  );
}

