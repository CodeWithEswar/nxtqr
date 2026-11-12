"use client";

import * as React from "react";
import {
  ActivityIcon,
  CloseIcon,
  CpuIcon,
  LayersIcon,
  PlayIcon,
  RefreshIcon,
  ShieldIcon,
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
  RATE_LIMIT_ALGORITHM_COMPARISON_TABLE,
  TRAFFIC_CONTROL_PRESET_METADATA,
  compareTrafficControlScenarios,
  createTrafficControlPresetScenario,
  type LimiterInstanceState,
  type TrafficControlAlgorithm,
  type TrafficControlPresetId,
} from "@nxtqr/architecture-execution";

type TrafficControlTab =
  | "flow_limiters"
  | "queue_concurrency"
  | "overload_retries"
  | "requests_log"
  | "fairness_tradeoffs"
  | "compare_invariants";

const ALGO_ORDER: TrafficControlAlgorithm[] = [
  "token_bucket",
  "leaky_bucket",
  "fixed_window",
  "sliding_window_log",
  "sliding_window_counter",
];

const ALGO_LABEL: Record<TrafficControlAlgorithm, string> = {
  token_bucket: "Token Bucket",
  leaky_bucket: "Leaky Bucket",
  fixed_window: "Fixed Window",
  sliding_window_log: "Sliding Log",
  sliding_window_counter: "Sliding Counter",
};

const COMPARE_PAIRS: Array<{
  id: string;
  label: string;
  baseline: TrafficControlPresetId;
  variant: TrafficControlPresetId;
}> = [
  {
    id: "retry",
    label: "Retry Storm vs Retry Budget",
    baseline: "retry_storm",
    variant: "retry_budget_protection",
  },
  {
    id: "window",
    label: "Fixed Window vs Sliding Window Log",
    baseline: "fixed_window_boundary_burst",
    variant: "sliding_window_log",
  },
  {
    id: "bucket",
    label: "Token Bucket vs Leaky Bucket",
    baseline: "token_bucket_burst",
    variant: "leaky_bucket_smoothing",
  },
  {
    id: "dist",
    label: "Centralized Global vs Local Overshoot",
    baseline: "global_distributed_limiter",
    variant: "local_limiter_overshoot",
  },
  {
    id: "fail",
    label: "Fail-Open vs Fail-Closed",
    baseline: "fail_open_behavior",
    variant: "fail_closed_behavior",
  },
];

export function TrafficControlWorkspace() {
  const toggleTrafficControlWorkspace = useExecutionStore(
    (s) => s.toggleTrafficControlWorkspace
  );
  const activeTrafficControlScenario = useExecutionStore(
    (s) => s.activeTrafficControlScenario
  );
  const setTrafficControlScenario = useExecutionStore(
    (s) => s.setTrafficControlScenario
  );
  const runTrafficControlSimulation = useExecutionStore(
    (s) => s.runTrafficControlSimulation
  );
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore(
    (s) => s.playbackState.currentStepIndex
  );

  const [activeTab, setActiveTab] =
    React.useState<TrafficControlTab>("flow_limiters");
  const [selectedPreset, setSelectedPreset] =
    React.useState<TrafficControlPresetId>(
      (activeTrafficControlScenario?.presetId as TrafficControlPresetId) ||
        "token_bucket_burst"
    );
  const [comparePairId, setComparePairId] = React.useState<string>("retry");

  React.useEffect(() => {
    if (!activeTrafficControlScenario) {
      const initial = createTrafficControlPresetScenario(selectedPreset);
      setTrafficControlScenario(initial);
    } else if (
      activeTrafficControlScenario.presetId &&
      TRAFFIC_CONTROL_PRESET_METADATA.some(
        (p) => p.id === activeTrafficControlScenario.presetId
      )
    ) {
      setSelectedPreset(
        activeTrafficControlScenario.presetId as TrafficControlPresetId
      );
    }
  }, [activeTrafficControlScenario, selectedPreset, setTrafficControlScenario]);

  const activeScenario =
    activeTrafficControlScenario ||
    createTrafficControlPresetScenario(selectedPreset);

  const currentFrame = trace?.frames?.[currentStepIndex];
  const tcState = currentFrame?.runtimeState?.trafficControlState;
  const metrics = tcState?.metrics;

  const limitersList: LimiterInstanceState[] = tcState
    ? Object.values(tcState.limiters)
    : [];
  const gatewaysList = tcState ? Object.values(tcState.gateways) : [];
  const tenantList = tcState ? Object.values(tcState.tenantFairness) : [];
  const recentRequests = tcState?.recentRequests ?? [];
  const invariants = tcState?.invariants;

  const comparisonResult = React.useMemo(() => {
    const pair =
      COMPARE_PAIRS.find((p) => p.id === comparePairId) ?? COMPARE_PAIRS[0]!;
    return compareTrafficControlScenarios(
      createTrafficControlPresetScenario(pair.baseline),
      createTrafficControlPresetScenario(pair.variant)
    );
  }, [comparePairId]);

  const handlePresetChange = (value: string) => {
    const presetId = value as TrafficControlPresetId;
    setSelectedPreset(presetId);
    const scenario = createTrafficControlPresetScenario(presetId);
    setTrafficControlScenario(scenario);
    runTrafficControlSimulation(scenario);
  };

  const handleCycleAlgorithm = () => {
    const first = activeScenario.policies[0];
    const currentAlgo = first?.algorithm ?? "token_bucket";
    const nextAlgo =
      ALGO_ORDER[(ALGO_ORDER.indexOf(currentAlgo) + 1) % ALGO_ORDER.length]!;
    const nextPolicies =
      activeScenario.policies.length > 0
        ? activeScenario.policies.map((p, idx) =>
            idx === 0 ? { ...p, algorithm: nextAlgo } : p
          )
        : [
            {
              id: "pol-primary",
              label: `${ALGO_LABEL[nextAlgo]} Limiter`,
              algorithm: nextAlgo,
              scope: "global" as const,
              limit: 6,
              windowMs: 250,
              capacity: 6,
              refillTokensPerSecond: 10,
              drainRatePerSecond: 10,
            },
          ];
    const next = { ...activeScenario, policies: nextPolicies };
    setTrafficControlScenario(next);
    runTrafficControlSimulation(next);
  };

  const handleToggleBackpressure = () => {
    const next = {
      ...activeScenario,
      overload: {
        ...activeScenario.overload,
        backpressureEnabled: !activeScenario.overload.backpressureEnabled,
      },
    };
    setTrafficControlScenario(next);
    runTrafficControlSimulation(next);
  };

  const handleToggleLoadShed = () => {
    const next = {
      ...activeScenario,
      overload: {
        ...activeScenario.overload,
        loadSheddingEnabled: !activeScenario.overload.loadSheddingEnabled,
      },
    };
    setTrafficControlScenario(next);
    runTrafficControlSimulation(next);
  };

  const handleRun = () => {
    runTrafficControlSimulation(activeScenario);
  };

  return (
    <div
      role="region"
      aria-label="Distributed Rate Limiting, Backpressure, Queueing & Load Shedding Workspace"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 h-[460px] max-w-[1260px] mx-auto",
        "bg-surface-01 border border-border-default rounded-md shadow-level-2 flex flex-col overflow-hidden"
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-02">
        <div className="flex items-center gap-2 min-w-0">
          <ActivityIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <span className="text-xs font-semibold text-foreground tracking-tight truncate">
            Rate Limiting, Backpressure, Queueing &amp; Load Shedding Engine
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border-default text-text-muted rounded-md shrink-0"
          >
            {activeScenario.policies[0]
              ? ALGO_LABEL[activeScenario.policies[0].algorithm]
              : "No Rate Limit"}
          </Badge>
          {invariants && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono rounded-md shrink-0",
                invariants.allPassed
                  ? "border-border-default text-text-secondary"
                  : "border-destructive text-destructive"
              )}
            >
              {invariants.allPassed
                ? "Invariants: PASS"
                : `Violations: ${invariants.violations.length}`}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-7 w-[250px] text-[11px] font-mono bg-surface-03 border-border-default text-foreground rounded-md">
              <SelectValue placeholder="Select traffic-control preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground rounded-md max-h-[300px]">
              {TRAFFIC_CONTROL_PRESET_METADATA.map((preset) => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                  className="text-[11px] font-mono focus:bg-surface-04 rounded-md"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCycleAlgorithm}
            className="h-7 px-2 text-[10px] font-mono bg-surface-03 border-border-default hover:border-border-hover text-foreground rounded-md gap-1"
            title="Cycle rate-limiting algorithm"
          >
            <RefreshIcon className="w-3 h-3 text-text-secondary" />
            Algo:{" "}
            {activeScenario.policies[0]
              ? ALGO_LABEL[activeScenario.policies[0].algorithm]
              : "Add Limiter"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleBackpressure}
            className={cn(
              "h-7 px-2 text-[10px] font-mono border rounded-md",
              activeScenario.overload.backpressureEnabled
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-surface-03 border-border-default text-text-muted"
            )}
          >
            BP: {activeScenario.overload.backpressureEnabled ? "ON" : "OFF"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLoadShed}
            className={cn(
              "h-7 px-2 text-[10px] font-mono border rounded-md",
              activeScenario.overload.loadSheddingEnabled
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-surface-03 border-border-default text-text-muted"
            )}
          >
            Shed: {activeScenario.overload.loadSheddingEnabled ? "ON" : "OFF"}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRun}
            className="h-7 px-2.5 text-[11px] font-medium bg-foreground text-background hover:bg-foreground/90 rounded-md gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Run
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleTrafficControlWorkspace(false)}
            className="h-7 w-7 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
            aria-label="Close Traffic Control Workspace"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs + Frame Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01">
        <div className="flex items-center gap-1 flex-wrap">
          {(
            [
              { id: "flow_limiters", label: "Flow & Limiters" },
              { id: "queue_concurrency", label: "Queue & Concurrency" },
              { id: "overload_retries", label: "Backpressure, Shed & Retries" },
              { id: "requests_log", label: "Decision Trace" },
              { id: "fairness_tradeoffs", label: "Fairness & Algorithms" },
              { id: "compare_invariants", label: "Compare & Invariants" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors border",
                activeTab === tab.id
                  ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                  : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
          <span>t = {tcState?.virtualTimeMs ?? 0}ms</span>
          <span>
            Offered:{" "}
            <span className="text-foreground">{metrics?.offeredRequests ?? 0}</span>
          </span>
          <span>
            Admitted:{" "}
            <span className="text-foreground">{metrics?.admittedRequests ?? 0}</span>
          </span>
          <span>
            Rejected:{" "}
            <span className="text-foreground">{metrics?.rejectionRatePct ?? 0}%</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 bg-black">
        {!tcState ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 border border-border-subtle bg-surface-01 rounded-md p-6">
            <ActivityIcon className="w-6 h-6 text-text-muted" />
            <p className="text-xs text-text-secondary font-medium">
              Click Run or choose one of 30 presets to simulate admission control, queueing, backpressure, and shedding.
            </p>
            <Button
              size="sm"
              onClick={handleRun}
              className="mt-1 h-7 px-3 text-[11px] bg-foreground text-background rounded-md"
            >
              Start Simulation
            </Button>
          </div>
        ) : (
          <>
            {/* Tab 1: Flow & Limiters */}
            {activeTab === "flow_limiters" && (
              <div className="space-y-3">
                {/* Monochrome Request Flow Pipeline */}
                <div className="border border-border-default bg-surface-02 rounded-md p-2.5">
                  <div className="text-[10px] font-mono text-text-muted mb-2 flex justify-between">
                    <span>SIMULATED ADMISSION PIPELINE (SYNTHETIC TRAFFIC)</span>
                    <span>
                      Dist Mode: {tcState.distributedMode} · Central Store:{" "}
                      {tcState.centralStoreOnline ? "ONLINE" : "DOWN"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px] font-mono">
                    {[
                      {
                        title: "1. Traffic Sources",
                        value: `${metrics?.offeredRequests ?? 0} reqs`,
                        sub: `${metrics?.offeredRatePerSec ?? 0}/s (${metrics?.retryAttempts ?? 0} retries)`,
                      },
                      {
                        title: "2. Circuit Breaker",
                        value: tcState.circuitBreaker.enabled
                          ? tcState.circuitBreaker.state
                          : "BYPASS",
                        sub: `${metrics?.circuitRejections ?? 0} rejected`,
                      },
                      {
                        title: "3. Rate Limiter",
                        value: `${limitersList.length} active`,
                        sub: `${metrics?.rateLimitRejections ?? 0} limited`,
                      },
                      {
                        title: "4. Load Shedder",
                        value: tcState.loadShedding.active ? "SHEDDING" : "IDLE",
                        sub: `${metrics?.loadShedCount ?? 0} shed`,
                      },
                      {
                        title: "5. Bounded Queue",
                        value: `${tcState.queue.depth}/${tcState.queue.capacity}`,
                        sub: `${metrics?.queueOverflows ?? 0} overflow`,
                      },
                      {
                        title: "6. Concurrency Pool",
                        value: `${tcState.concurrency.activeRequestIds.length}/${tcState.concurrency.effectiveMaxConcurrent}`,
                        sub: `${metrics?.completedRequests ?? 0} done`,
                      },
                    ].map((stage) => (
                      <div
                        key={stage.title}
                        className="border border-border-default bg-surface-01 rounded-md p-2 space-y-0.5"
                      >
                        <div className="text-text-muted">{stage.title}</div>
                        <div className="text-xs font-semibold text-foreground">
                          {stage.value}
                        </div>
                        <div className="text-text-secondary">{stage.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Rate Limiter State Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {limitersList.length === 0 ? (
                    <div className="border border-border-subtle bg-surface-02 rounded-md p-3 text-[11px] font-mono text-text-muted">
                      No active rate-limit policy configured in this scenario (isolating concurrency/queue mechanics).
                    </div>
                  ) : (
                    limitersList.map((lim) => (
                      <div
                        key={lim.instanceKey}
                        className="border border-border-default bg-surface-02 rounded-md p-2.5 space-y-2 text-[10px] font-mono"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-foreground font-semibold truncate">
                            {lim.label} ({lim.instanceKey})
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] rounded-md border-border-default text-text-muted shrink-0"
                          >
                            {lim.algorithm}
                          </Badge>
                        </div>

                        {lim.tokenBucket && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-text-secondary">
                              <span>
                                Tokens: {lim.tokenBucket.tokens}/{lim.tokenBucket.capacity}
                              </span>
                              <span>Refill: {lim.tokenBucket.refillTokensPerSecond}/s</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-04 rounded-md overflow-hidden border border-border-subtle">
                              <div
                                className="h-full bg-foreground transition-all"
                                style={{
                                  width: `${Math.min(100, Math.round((lim.tokenBucket.tokens / Math.max(1, lim.tokenBucket.capacity)) * 100))}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-text-muted">
                              <span>Consumed: {lim.tokenBucket.consumedTotal}</span>
                              <span>Rejected: {lim.tokenBucket.rejectedTotal}</span>
                            </div>
                          </div>
                        )}

                        {lim.fixedWindow && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-text-secondary">
                              <span>
                                Count: {lim.fixedWindow.used}/{lim.fixedWindow.limit}
                              </span>
                              <span>Window: {lim.fixedWindow.windowMs}ms</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-04 rounded-md overflow-hidden border border-border-subtle">
                              <div
                                className="h-full bg-foreground transition-all"
                                style={{
                                  width: `${Math.min(100, Math.round((lim.fixedWindow.used / Math.max(1, lim.fixedWindow.limit)) * 100))}%`,
                                }}
                              />
                            </div>
                            <div className="text-text-muted">
                              Window start: {lim.fixedWindow.windowStartMs}ms · Rejected:{" "}
                              {lim.fixedWindow.rejectedTotal}
                            </div>
                          </div>
                        )}

                        {lim.slidingWindow && (
                          <div className="space-y-1 text-text-secondary">
                            <div className="flex justify-between">
                              <span>
                                Effective: {lim.slidingWindow.effectiveCount}/
                                {lim.slidingWindow.limit}
                              </span>
                              <span>{lim.slidingWindow.kind}</span>
                            </div>
                            <div className="text-text-muted">
                              Active timestamps: {lim.slidingWindow.activeTimestampCount} ·
                              Prev: {lim.slidingWindow.previousCount} · Rejected:{" "}
                              {lim.slidingWindow.rejectedTotal}
                            </div>
                          </div>
                        )}

                        {lim.leakyBucket && (
                          <div className="space-y-1 text-text-secondary">
                            <div className="flex justify-between">
                              <span>
                                Queue: {lim.leakyBucket.queuedCount}/
                                {lim.leakyBucket.capacity}
                              </span>
                              <span>Drain: {lim.leakyBucket.drainRatePerSecond}/s</span>
                            </div>
                            <div className="text-text-muted">
                              Drained: {lim.leakyBucket.drainedTotal} · Overflow rejected:{" "}
                              {lim.leakyBucket.overflowRejectedTotal}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Distributed Gateways + Caveats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="border border-border-default bg-surface-02 rounded-md p-2.5 space-y-1.5">
                    <div className="text-xs font-semibold text-foreground">
                      Gateway Coordination View ({gatewaysList.length})
                    </div>
                    <div className="space-y-1">
                      {gatewaysList.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between px-2 py-1 bg-surface-01 border border-border-subtle rounded-md text-[10px] font-mono"
                        >
                          <span className="text-foreground">
                            {g.label} (skew {g.clockOffsetMs >= 0 ? `+${g.clockOffsetMs}` : g.clockOffsetMs}ms)
                          </span>
                          <span className="text-text-secondary">
                            Handled: {g.requestsHandled} · Local used: {g.localUsed}/
                            {g.allocatedQuota} · Rejected: {g.rejected}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-border-default bg-surface-02 rounded-md p-2.5 space-y-1.5">
                    <div className="text-xs font-semibold text-foreground">
                      Distributed &amp; Modeling Caveats
                    </div>
                    <ul className="space-y-1 text-[10px] font-mono text-text-muted list-disc pl-4">
                      {tcState.consistencyCaveats.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Queue & Concurrency */}
            {activeTab === "queue_concurrency" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CpuIcon className="w-3.5 h-3.5 text-text-secondary" />
                    Concurrency Permits
                  </div>
                  <div className="text-[11px] font-mono space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Active / Limit</span>
                      <span className="text-foreground font-semibold">
                        {tcState.concurrency.activeRequestIds.length}/
                        {tcState.concurrency.effectiveMaxConcurrent}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-04 rounded-md overflow-hidden border border-border-subtle">
                      <div
                        className="h-full bg-foreground transition-all"
                        style={{
                          width: `${Math.min(100, Math.round((tcState.concurrency.activeRequestIds.length / Math.max(1, tcState.concurrency.effectiveMaxConcurrent)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-text-muted">Permits Acquired / Released</span>
                      <span className="text-text-secondary">
                        {tcState.concurrency.permitsAcquired} /{" "}
                        {tcState.concurrency.permitsReleased}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-text-muted">Adaptive Controller</span>
                      <span className="text-foreground">
                        {tcState.concurrency.adaptiveEnabled
                          ? `ENABLED (base ${tcState.concurrency.maxConcurrent} -> ${tcState.concurrency.effectiveMaxConcurrent})`
                          : "STATIC"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border-subtle pt-2 space-y-1 text-[10px] font-mono">
                    <div className="text-foreground font-semibold">
                      Little&apos;s Law (L = λ × W)
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Avg in system (L)</span>
                      <span className="text-foreground">{tcState.littlesLaw.avgInSystemL}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Throughput (λ)</span>
                      <span className="text-foreground">
                        {tcState.littlesLaw.throughputPerSecLambda}/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Avg latency (W)</span>
                      <span className="text-foreground">
                        {tcState.littlesLaw.avgSystemTimeSecW}s
                      </span>
                    </div>
                    <div className="text-text-muted pt-1">
                      {tcState.littlesLaw.steadyStateCaveat}
                    </div>
                  </div>
                </div>

                {/* Bounded Queue Inspector */}
                <div className="lg:col-span-2 border border-border-default bg-surface-02 rounded-md p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                      Bounded Queue Inspector ({tcState.queue.policy.toUpperCase()})
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Depth: {tcState.queue.depth}/{tcState.queue.capacity} · Avg wait:{" "}
                      {tcState.queue.avgWaitMs}ms · p95: {tcState.queue.p95WaitMs}ms · Expired:{" "}
                      {tcState.queue.expiredCount}
                    </span>
                  </div>

                  <div className="divide-y divide-border-subtle border border-border-subtle bg-surface-01 rounded-md max-h-[240px] overflow-y-auto">
                    {tcState.queue.items.length === 0 ? (
                      <div className="p-3 text-[11px] font-mono text-text-muted">
                        Queue empty at t={tcState.virtualTimeMs}ms.
                      </div>
                    ) : (
                      tcState.queue.items.map((qi) => (
                        <div
                          key={qi.id}
                          className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono"
                        >
                          <span className="text-foreground font-semibold">{qi.id}</span>
                          <span className="text-text-secondary">
                            {qi.tenantId} · {qi.priority}
                          </span>
                          <span className="text-text-muted">
                            enqueued @{qi.enqueuedAtMs}ms
                            {qi.deadlineMs ? ` · dl @${qi.deadlineMs}ms` : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Backpressure, Shedding & Retries */}
            {activeTab === "overload_retries" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2 text-[10px] font-mono">
                  <div className="text-xs font-semibold text-foreground">
                    Backpressure Signal Propagation
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Status</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] rounded-md",
                        tcState.backpressure.active
                          ? "border-warning text-warning"
                          : "border-border-default text-text-muted"
                      )}
                    >
                      {tcState.backpressure.active ? "ACTIVE" : "IDLE"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Path</span>
                    <span className="text-foreground">
                      {tcState.backpressure.sourceComponent} -&gt;{" "}
                      {tcState.backpressure.targetComponent}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Signal Type</span>
                    <span className="text-foreground">{tcState.backpressure.signalType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Current Pressure</span>
                    <span className="text-foreground">
                      {(tcState.backpressure.level * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Producer Dispatch Rate</span>
                    <span className="text-foreground">
                      {Math.round(tcState.backpressure.producerRateMultiplier * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Hysteresis Enter / Exit</span>
                    <span>
                      {Math.round(tcState.backpressure.triggerThreshold * 100)}% /{" "}
                      {Math.round(tcState.backpressure.recoveryThreshold * 100)}%
                    </span>
                  </div>
                </div>

                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2 text-[10px] font-mono">
                  <div className="text-xs font-semibold text-foreground">
                    Load Shedding &amp; Circuit Breaker
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Load Shed Policy</span>
                    <span className="text-foreground">
                      {tcState.loadShedding.enabled
                        ? tcState.loadShedding.policy.toUpperCase()
                        : "DISABLED"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Requests Shed</span>
                    <span className="text-foreground font-semibold">
                      {tcState.loadShedding.shedCount}
                    </span>
                  </div>
                  <div className="text-text-muted">{tcState.loadShedding.triggerReason}</div>
                  <div className="border-t border-border-subtle pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Circuit Breaker</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] rounded-md",
                          tcState.circuitBreaker.state === "OPEN"
                            ? "border-destructive text-destructive"
                            : tcState.circuitBreaker.state === "HALF_OPEN"
                              ? "border-warning text-warning"
                              : "border-border-strong text-foreground"
                        )}
                      >
                        {tcState.circuitBreaker.enabled
                          ? tcState.circuitBreaker.state
                          : "DISABLED"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Trips / Failures</span>
                      <span>
                        {tcState.circuitBreaker.tripCount} /{" "}
                        {tcState.circuitBreaker.failureCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2 text-[10px] font-mono">
                  <div className="text-xs font-semibold text-foreground">
                    Retry Amplification &amp; Budget
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Amplification Factor</span>
                    <span className="text-foreground font-semibold">
                      {metrics?.retryAmplification ?? 1}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Original vs Retries</span>
                    <span className="text-foreground">
                      {metrics?.originalRequests ?? 0} orig + {metrics?.retryAttempts ?? 0}{" "}
                      retries
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Retry Budget Remaining</span>
                    <span className="text-foreground">{tcState.retryBudget.remaining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Suppressed Storm Retries</span>
                    <span className="text-foreground">
                      {tcState.retryBudget.suppressedRetries}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Decision Trace */}
            {activeTab === "requests_log" && (
              <div className="border border-border-default bg-surface-02 rounded-md overflow-hidden">
                <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-03 flex justify-between text-[11px] font-semibold text-foreground">
                  <span>Recent Synthetic Request Lifecycle ({recentRequests.length})</span>
                  <span className="text-[10px] font-mono text-text-muted">
                    Latest decisions
                  </span>
                </div>
                <div className="divide-y divide-border-subtle max-h-[300px] overflow-y-auto">
                  {[...recentRequests].reverse().map((req) => (
                    <div
                      key={req.id}
                      className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono"
                    >
                      <div className="space-x-2">
                        <span className="text-foreground font-semibold">{req.id}</span>
                        <span className="text-text-muted">
                          @{req.createdAtMs}ms · {req.tenantId} · {req.priority} · try{" "}
                          {req.attempt}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary max-w-[420px] truncate">
                          {req.reason}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] rounded-md",
                            req.state === "COMPLETED" || req.decision === "ALLOW"
                              ? "border-border-strong text-foreground"
                              : "border-destructive text-destructive"
                          )}
                        >
                          {req.decision ?? req.state}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Fairness & Algorithm Comparison Matrix */}
            {activeTab === "fairness_tradeoffs" && (
              <div className="space-y-3">
                <div className="border border-border-default bg-surface-02 rounded-md overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-03 text-[11px] font-semibold text-foreground">
                    Per-Tenant Fairness &amp; Starvation Monitor
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {tenantList.map((tf) => (
                      <div
                        key={tf.tenantId}
                        className="px-3 py-2 grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px] font-mono items-center"
                      >
                        <span className="text-foreground font-semibold">{tf.tenantId}</span>
                        <span className="text-text-secondary">Offered: {tf.offered}</span>
                        <span className="text-text-secondary">
                          Admitted/Completed: {tf.admitted}/{tf.completed}
                        </span>
                        <span className="text-text-muted">Rejected: {tf.rejected}</span>
                        <span className="text-text-muted">
                          Wait: {tf.avgWaitMs}ms · Share: {tf.capacitySharePct}%
                        </span>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] rounded-md",
                              tf.starving
                                ? "border-destructive text-destructive"
                                : "border-border-default text-text-secondary"
                            )}
                          >
                            {tf.starving ? "STARVING" : "FAIR"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-border-default bg-surface-02 rounded-md overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-border-subtle bg-surface-03 text-[11px] font-semibold text-foreground">
                    Rate-Limiting Algorithm Tradeoff Reference
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {RATE_LIMIT_ALGORITHM_COMPARISON_TABLE.map((row) => (
                      <div
                        key={row.algorithm}
                        className="px-3 py-1.5 grid grid-cols-2 md:grid-cols-6 gap-2 text-[10px] font-mono"
                      >
                        <span className="text-foreground font-semibold">{row.algorithm}</span>
                        <span className="text-text-secondary">{row.burstTolerance}</span>
                        <span className="text-text-muted">{row.memoryFootprint}</span>
                        <span className="text-text-muted">{row.approximation}</span>
                        <span className="text-text-secondary">{row.rejectionBehavior}</span>
                        <span className="text-text-muted text-right">{row.complexity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: Scenario Comparison & Invariants */}
            {activeTab === "compare_invariants" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Side-by-Side Scenario Comparison
                    </span>
                    <Select value={comparePairId} onValueChange={setComparePairId}>
                      <SelectTrigger className="h-7 w-[220px] text-[10px] font-mono bg-surface-03 border-border-default rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-default rounded-md">
                        {COMPARE_PAIRS.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            className="text-[10px] font-mono rounded-md"
                          >
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono border border-border-subtle bg-surface-01 rounded-md p-2.5">
                    <div className="text-text-muted">Metric</div>
                    <div className="text-foreground font-semibold truncate">
                      {comparisonResult.baselineLabel}
                    </div>
                    <div className="text-foreground font-semibold truncate">
                      {comparisonResult.variantLabel}
                    </div>

                    <div className="text-text-muted">Rejection %</div>
                    <div>{comparisonResult.baselineMetrics.rejectionRatePct}%</div>
                    <div>{comparisonResult.variantMetrics.rejectionRatePct}%</div>

                    <div className="text-text-muted">Throughput</div>
                    <div>{comparisonResult.baselineMetrics.completedThroughputPerSec}/s</div>
                    <div>{comparisonResult.variantMetrics.completedThroughputPerSec}/s</div>

                    <div className="text-text-muted">p95 Latency</div>
                    <div>{comparisonResult.baselineMetrics.p95LatencyMs}ms</div>
                    <div>{comparisonResult.variantMetrics.p95LatencyMs}ms</div>

                    <div className="text-text-muted">Retry Amp</div>
                    <div>{comparisonResult.baselineMetrics.retryAmplification}x</div>
                    <div>{comparisonResult.variantMetrics.retryAmplification}x</div>
                  </div>
                </div>

                {/* Invariants & Metrics Provenance */}
                <div className="border border-border-default bg-surface-02 rounded-md p-3 space-y-2">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
                    Correctness Invariants &amp; Synthetic Metrics
                  </div>
                  {invariants && (
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      {[
                        ["Token Bounds [0..Cap]", invariants.tokenBoundsOk],
                        ["Window Counter Bounds", invariants.windowBoundsOk],
                        ["Bounded Queue Cap", invariants.queueBoundsOk],
                        ["Concurrency Limit", invariants.concurrencyBoundsOk],
                        ["No Permit Leaks", invariants.permitsBalancedOk],
                        ["Atomic Multi-Policy", invariants.atomicMultiPolicyOk],
                        ["Expired Never Run", invariants.expiredNotExecutedOk],
                        ["Retry Budget Cap", invariants.retryBudgetRespectedOk],
                        ["Circuit Valid", invariants.circuitTransitionsOk],
                      ].map(([label, ok]) => (
                        <div
                          key={label as string}
                          className="flex items-center justify-between px-2 py-1 bg-surface-01 border border-border-subtle rounded-md"
                        >
                          <span className="text-text-secondary">{label as string}</span>
                          <span className={ok ? "text-foreground" : "text-destructive"}>
                            {ok ? "PASS" : "FAIL"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {metrics && (
                    <div className="text-[10px] font-mono text-text-muted pt-1">
                      p50/p95/p99 latency (modeled): {metrics.p50LatencyMs} /{" "}
                      {metrics.p95LatencyMs} / {metrics.p99LatencyMs}ms · Utilization:{" "}
                      {metrics.utilizationPct}%
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

