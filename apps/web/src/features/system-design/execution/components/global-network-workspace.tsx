"use client";

import * as React from "react";
import {
  ActivityIcon,
  CloseIcon,
  PlayIcon,
  LayersIcon,
  ShieldIcon,
  DatabaseIcon,
  RefreshIcon,
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
  GLOBAL_NETWORK_PRESET_METADATA,
  type GlobalNetworkPresetId,
  createGlobalNetworkPresetScenario,
  type DnsResolutionTrace,
  type RequestLatencyBreakdown,
} from "@nxtqr/architecture-execution";

type WorkspaceTab =
  | "topology"
  | "dns"
  | "cdn"
  | "origin"
  | "waterfall"
  | "purges_failover";

export function GlobalNetworkWorkspace() {
  const toggleGlobalNetworkWorkspace = useExecutionStore(
    (s) => s.toggleGlobalNetworkWorkspace
  );
  const activeGlobalNetworkScenario = useExecutionStore(
    (s) => s.activeGlobalNetworkScenario
  );
  const setGlobalNetworkScenario = useExecutionStore(
    (s) => s.setGlobalNetworkScenario
  );
  const runGlobalNetworkSimulation = useExecutionStore(
    (s) => s.runGlobalNetworkSimulation
  );
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore(
    (s) => s.playbackState.currentStepIndex
  );

  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("topology");
  const [selectedPreset, setSelectedPreset] =
    React.useState<GlobalNetworkPresetId>(
      (activeGlobalNetworkScenario?.presetId as GlobalNetworkPresetId) ||
        "cold_dns_lookup"
    );
  const [selectedRequestId, setSelectedRequestId] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    if (!activeGlobalNetworkScenario) {
      const initial = createGlobalNetworkPresetScenario(selectedPreset);
      setGlobalNetworkScenario(initial);
    }
  }, [activeGlobalNetworkScenario, selectedPreset, setGlobalNetworkScenario]);

  const activeScenario =
    activeGlobalNetworkScenario ||
    createGlobalNetworkPresetScenario(selectedPreset);

  const currentFrame = trace?.frames?.[currentStepIndex];
  const activeEvent = currentFrame?.activeEvent;
  const netState = currentFrame?.runtimeState?.globalNetworkState;

  const metrics = netState?.metrics;
  const resolversList = netState ? Object.values(netState.resolvers) : [];
  const edgesList = netState ? Object.values(netState.edges) : [];
  const originsList = netState ? Object.values(netState.origins) : [];
  const dnsTraces: DnsResolutionTrace[] = netState
    ? netState.recentDnsTraces
    : [];
  const requestsList: RequestLatencyBreakdown[] = netState
    ? netState.recentRequests
    : [];

  const inspectedRequest =
    (selectedRequestId &&
      requestsList.find((r) => r.requestId === selectedRequestId)) ||
    requestsList[requestsList.length - 1];

  const handlePresetChange = (presetId: string) => {
    const id = presetId as GlobalNetworkPresetId;
    setSelectedPreset(id);
    setSelectedRequestId(null);
    const scenario = createGlobalNetworkPresetScenario(id);
    setGlobalNetworkScenario(scenario);
    runGlobalNetworkSimulation(scenario);
  };

  const handleRoutingStrategyChange = (strategy: string) => {
    const nextScenario = {
      ...activeScenario,
      cdn: {
        ...activeScenario.cdn,
        routingStrategy: strategy as
          | "dns_directed"
          | "latency"
          | "geographic"
          | "anycast",
      },
    };
    setGlobalNetworkScenario(nextScenario);
    runGlobalNetworkSimulation(nextScenario);
  };

  const handleToggleOriginShield = () => {
    const nextScenario = {
      ...activeScenario,
      cdn: {
        ...activeScenario.cdn,
        originShield: {
          ...activeScenario.cdn.originShield,
          enabled: !activeScenario.cdn.originShield.enabled,
        },
      },
    };
    setGlobalNetworkScenario(nextScenario);
    runGlobalNetworkSimulation(nextScenario);
  };

  const handleToggleCoalescing = () => {
    const nextScenario = {
      ...activeScenario,
      cdn: {
        ...activeScenario.cdn,
        cachePolicy: {
          ...activeScenario.cdn.cachePolicy,
          coalesceRequests: !activeScenario.cdn.cachePolicy.coalesceRequests,
        },
      },
    };
    setGlobalNetworkScenario(nextScenario);
    runGlobalNetworkSimulation(nextScenario);
  };

  const handleRunSimulation = () => {
    setSelectedRequestId(null);
    runGlobalNetworkSimulation(activeScenario);
  };

  return (
    <div
      role="region"
      aria-label="Global DNS, CDN Edge & Traffic Distribution Workspace"
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 h-[440px] max-w-[1260px] mx-auto",
        "bg-surface-01 border border-border-default rounded-md shadow-level-2 flex flex-col overflow-hidden"
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-subtle bg-surface-02">
        <div className="flex items-center gap-2 min-w-0">
          <ActivityIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <span className="text-xs font-semibold text-foreground tracking-tight truncate">
            DNS, CDN Edge Routing &amp; Global Network Simulator
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-border-default text-text-muted rounded-md shrink-0"
          >
            {metrics
              ? `${metrics.totalHttpRequests} req · ${metrics.cdnHitRatioPct}% edge hit · ${metrics.originOffloadPct}% offload`
              : "Ready"}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-7 w-[220px] text-[11px] font-mono bg-surface-03 border-border-default text-foreground rounded-md">
              <SelectValue placeholder="Select global scenario preset" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground rounded-md max-h-[320px]">
              {GLOBAL_NETWORK_PRESET_METADATA.map((meta) => (
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

          <Select
            value={activeScenario.cdn.routingStrategy}
            onValueChange={handleRoutingStrategyChange}
          >
            <SelectTrigger className="h-7 w-[140px] text-[11px] font-mono bg-surface-03 border-border-default text-foreground rounded-md">
              <SelectValue placeholder="Edge Routing" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground rounded-md">
              <SelectItem
                value="latency"
                className="text-[11px] font-mono focus:bg-surface-04"
              >
                Latency RTT
              </SelectItem>
              <SelectItem
                value="geographic"
                className="text-[11px] font-mono focus:bg-surface-04"
              >
                Geographic
              </SelectItem>
              <SelectItem
                value="anycast"
                className="text-[11px] font-mono focus:bg-surface-04"
              >
                Anycast BGP
              </SelectItem>
              <SelectItem
                value="dns_directed"
                className="text-[11px] font-mono focus:bg-surface-04"
              >
                DNS Directed
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-2.5 text-[11px] font-mono bg-foreground text-background hover:bg-text-secondary rounded-md gap-1.5"
          >
            <PlayIcon className="w-3 h-3" />
            <span>Run Global Sim</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleGlobalNetworkWorkspace(false)}
            aria-label="Close Global Network Workspace"
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs + Policy Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-border-subtle bg-surface-01">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: "topology", label: "Topology & Requests" },
              { id: "dns", label: "DNS & Resolution Tree" },
              { id: "cdn", label: "CDN Edges & Cache" },
              { id: "origin", label: "Origin & Shield" },
              { id: "waterfall", label: "Latency Waterfall" },
              { id: "purges_failover", label: "Purges & Failover" },
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
            onClick={handleToggleOriginShield}
            className={cn(
              "px-2 py-1 rounded-md border transition-colors",
              activeScenario.cdn.originShield.enabled
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-text-secondary"
            )}
          >
            Shield: {activeScenario.cdn.originShield.enabled ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={handleToggleCoalescing}
            className={cn(
              "px-2 py-1 rounded-md border transition-colors",
              activeScenario.cdn.cachePolicy.coalesceRequests
                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                : "bg-surface-02 border-border-subtle text-text-muted hover:text-text-secondary"
            )}
          >
            Coalesce:{" "}
            {activeScenario.cdn.cachePolicy.coalesceRequests ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
        {/* Active Playback Step Banner */}
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
              T={netState?.virtualTimeMs ?? 0}ms
            </span>
          </div>
        )}

        {/* TAB 1: Topology & Requests */}
        {activeTab === "topology" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <MetricBox
                label="DNS Queries"
                value={String(metrics?.totalDnsQueries ?? 0)}
                sub={`${metrics?.dnsHitRatioPct ?? 0}% cache hit`}
              />
              <MetricBox
                label="HTTP Requests"
                value={String(metrics?.totalHttpRequests ?? 0)}
                sub={`${metrics?.successCount ?? 0} ok / ${metrics?.errorCount ?? 0} err`}
              />
              <MetricBox
                label="CDN Hit Ratio"
                value={`${metrics?.cdnHitRatioPct ?? 0}%`}
                sub={`${metrics?.cdnCacheHits ?? 0} hits / ${metrics?.cdnCacheMisses ?? 0} miss`}
              />
              <MetricBox
                label="Origin Offload"
                value={`${metrics?.originOffloadPct ?? 0}%`}
                sub={`${metrics?.originRequests ?? 0} origin calls`}
              />
              <MetricBox
                label="Latency p50"
                value={`${metrics?.p50LatencyMs ?? 0}ms`}
                sub={`p95: ${metrics?.p95LatencyMs ?? 0}ms`}
              />
              <MetricBox
                label="Latency p99"
                value={`${metrics?.p99LatencyMs ?? 0}ms`}
                sub={`Avg DNS: ${metrics?.avgDnsLatencyMs ?? 0}ms`}
              />
            </div>

            {/* Regional Traffic Distribution Bar */}
            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-text-secondary font-semibold">
                  Regional Traffic Distribution &amp; Request Flow
                </span>
                <span className="text-text-muted">
                  DNS: {activeScenario.dns.routingPolicy} · Edge:{" "}
                  {activeScenario.cdn.routingStrategy}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics?.regionalCounts ?? {}).map(
                  ([region, count]) => (
                    <div
                      key={region}
                      className="px-2.5 py-1 bg-surface-02 border border-border-subtle rounded-md text-[11px] font-mono flex items-center gap-2"
                    >
                      <span className="text-text-muted">{region}</span>
                      <span className="text-foreground font-semibold">
                        {count} req
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Recent Requests Table */}
            <div className="bg-surface-01 border border-border-default rounded-md overflow-hidden">
              <div className="px-3 py-1.5 bg-surface-02 border-b border-border-subtle text-[11px] font-mono font-semibold text-text-secondary flex items-center justify-between">
                <span>Client -&gt; DNS -&gt; CDN Edge -&gt; Origin Trace Log</span>
                <span className="text-text-muted font-normal">
                  Click row to inspect latency waterfall
                </span>
              </div>
              <div className="divide-y divide-border-subtle max-h-[175px] overflow-y-auto">
                {requestsList.length === 0 ? (
                  <div className="p-3 text-[11px] font-mono text-text-muted">
                    No requests executed at this frame yet. Advance playback or click Run Global Sim.
                  </div>
                ) : (
                  requestsList.map((req) => (
                    <button
                      key={req.requestId}
                      type="button"
                      onClick={() => {
                        setSelectedRequestId(req.requestId);
                        setActiveTab("waterfall");
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[11px] font-mono flex items-center justify-between gap-3 hover:bg-surface-02 transition-colors",
                        inspectedRequest?.requestId === req.requestId &&
                          "bg-surface-03"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-foreground font-semibold">
                          {req.requestId}
                        </span>
                        <span className="text-text-muted">
                          {req.clientRegion}
                        </span>
                        <span className="text-text-secondary truncate">
                          {req.domain}
                          {req.path}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-text-muted">
                          {req.selectedEdgeId ?? "direct"}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] rounded-md",
                            req.cacheStatus === "ERROR"
                              ? "border-destructive text-destructive"
                              : req.cacheStatus === "HIT" ||
                                  req.cacheStatus === "REVALIDATED"
                                ? "border-border-strong text-foreground bg-surface-04"
                                : "border-border-default text-text-secondary"
                          )}
                        >
                          {req.cacheStatus} · {req.statusCode}
                        </Badge>
                        <span className="text-foreground w-14 text-right">
                          {req.totalMs}ms
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DNS & Resolution Tree */}
        {activeTab === "dns" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-foreground">
                <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                <span>DNS Resolution Traces &amp; Delegation Chains</span>
              </div>
              <div className="space-y-2 max-h-[255px] overflow-y-auto">
                {dnsTraces.length === 0 ? (
                  <p className="text-[11px] font-mono text-text-muted">
                    No DNS lookups recorded yet.
                  </p>
                ) : (
                  dnsTraces.map((dt) => (
                    <div
                      key={dt.queryId}
                      className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-1 text-[11px] font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-semibold">
                          {dt.domain} ({dt.recordType})
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border-default text-text-secondary rounded-md"
                        >
                          {dt.rcode} · {dt.cacheOutcome} ·{" "}
                          {dt.resolutionLatencyMs}ms
                        </Badge>
                      </div>
                      <div className="text-text-muted">
                        Referrals: {dt.referralChain.join(" -> ")}
                      </div>
                      {dt.cnameChain.length > 0 && (
                        <div className="text-text-secondary">
                          CNAMEs: {dt.cnameChain.join(" -> ")}
                        </div>
                      )}
                      <div className="text-text-muted">
                        Answers:{" "}
                        <span className="text-foreground">
                          {dt.answers.length > 0
                            ? dt.answers.join(", ")
                            : "none"}
                        </span>{" "}
                        · TTL: {dt.ttlSeconds}s
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-foreground">
                <DatabaseIcon className="w-3.5 h-3.5 text-text-secondary" />
                <span>Recursive Resolver &amp; Stub Cache State</span>
              </div>
              <div className="space-y-2 max-h-[255px] overflow-y-auto">
                {resolversList.map((res) => {
                  const entries = Object.values(res.cache);
                  return (
                    <div
                      key={res.id}
                      className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-1 text-[11px] font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-semibold">
                          {res.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] rounded-md",
                            res.healthy
                              ? "border-border-default text-text-secondary"
                              : "border-destructive text-destructive"
                          )}
                        >
                          {res.healthy ? "Healthy" : "Unhealthy"} ·{" "}
                          {entries.length} entries
                        </Badge>
                      </div>
                      {entries.map((entry) => {
                        const remSec = Math.max(
                          0,
                          Math.round(
                            (entry.expiresAtMs -
                              (netState?.virtualTimeMs ?? 0)) /
                              1000
                          )
                        );
                        return (
                          <div
                            key={entry.cacheKey}
                            className="flex items-center justify-between text-text-muted pl-2 border-l border-border-default"
                          >
                            <span className="truncate">
                              {entry.cacheKey} -&gt;{" "}
                              {entry.isNegative
                                ? entry.negativeType
                                : entry.answers.join(", ")}
                            </span>
                            <span className="text-text-secondary shrink-0">
                              TTL {remSec}s
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CDN Edges & Cache */}
        {activeTab === "cdn" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {edgesList.map((edge) => {
              const entries = Object.values(edge.cacheEntries);
              return (
                <div
                  key={edge.id}
                  className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2 text-[11px] font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-foreground font-semibold">
                        {edge.name}
                      </span>{" "}
                      <span className="text-text-muted">({edge.region})</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] rounded-md",
                        edge.healthy
                          ? "border-border-default text-text-secondary"
                          : "border-destructive text-destructive"
                      )}
                    >
                      {edge.healthy ? "UP" : "DOWN"} · {edge.hitCount}H /{" "}
                      {edge.missCount}M / {edge.revalidatedCount}R
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-text-muted">
                    <span>
                      Capacity: {edge.activeRequests}/{edge.capacityRps} rps
                    </span>
                    <span>
                      Stale served: {edge.staleServedCount} · Rejected:{" "}
                      {edge.rejectedCapacityCount}
                    </span>
                  </div>
                  <div className="space-y-1 max-h-[115px] overflow-y-auto">
                    {entries.length === 0 ? (
                      <div className="text-text-muted">Cache empty</div>
                    ) : (
                      entries.map((ce) => (
                        <div
                          key={ce.cacheKey}
                          className="p-1.5 bg-surface-02 border border-border-subtle rounded-md flex items-center justify-between gap-2"
                        >
                          <span className="text-foreground truncate">
                            {ce.path}
                          </span>
                          <span className="text-text-muted shrink-0">
                            ETag {ce.etag} · hits {ce.hitCount}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: Origin & Shield */}
        {activeTab === "origin" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="text-foreground font-semibold">
                    Origin Shield Layer
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] border-border-default text-text-secondary rounded-md"
                >
                  {netState?.originShield.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="text-text-muted">
                Hits: {netState?.originShield.hitCount ?? 0} · Misses:{" "}
                {netState?.originShield.missCount ?? 0}
              </div>
              <div className="space-y-1">
                {Object.values(netState?.originShield.cacheEntries ?? {}).map(
                  (se) => (
                    <div
                      key={se.cacheKey}
                      className="p-1.5 bg-surface-02 border border-border-subtle rounded-md flex justify-between"
                    >
                      <span className="text-foreground truncate">
                        {se.path}
                      </span>
                      <span className="text-text-muted">hits {se.hitCount}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {originsList.map((origin) => (
              <div
                key={origin.id}
                className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2 text-[11px] font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold">
                    {origin.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] rounded-md",
                      origin.healthy
                        ? "border-border-default text-text-secondary"
                        : "border-destructive text-destructive"
                    )}
                  >
                    {origin.role} · {origin.healthy ? "Healthy" : "DOWN"}
                  </Badge>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Region: {origin.region}</span>
                  <span>
                    Requests: {origin.requestCount} · Errors:{" "}
                    {origin.errorCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: Latency Waterfall */}
        {activeTab === "waterfall" && (
          <div className="space-y-3">
            {!inspectedRequest ? (
              <div className="p-3 bg-surface-01 border border-border-default rounded-md text-[11px] font-mono text-text-muted">
                Select a request from Topology &amp; Requests or advance playback to view its latency breakdown.
              </div>
            ) : (
              <div className="bg-surface-01 border border-border-default rounded-md p-3 space-y-3 text-[11px] font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-foreground font-semibold">
                      {inspectedRequest.requestId}
                    </span>{" "}
                    <span className="text-text-muted">
                      ({inspectedRequest.clientRegion} -&gt;{" "}
                      {inspectedRequest.selectedEdgeId ?? "origin"} -&gt;{" "}
                      {inspectedRequest.selectedOriginId ?? "cache"})
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border-strong text-foreground rounded-md"
                  >
                    Total {inspectedRequest.totalMs}ms ·{" "}
                    {inspectedRequest.cacheStatus} ({inspectedRequest.statusCode})
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  {(
                    [
                      { label: "DNS Resolution", ms: inspectedRequest.dnsMs },
                      {
                        label: "Client-Edge Connect & TLS",
                        ms: inspectedRequest.connectTlsMs,
                      },
                      {
                        label: "Edge Cache Lookup",
                        ms: inspectedRequest.edgeLookupMs,
                      },
                      { label: "Origin Shield Hop", ms: inspectedRequest.shieldMs },
                      {
                        label: "Origin Fetch / Revalidate",
                        ms: inspectedRequest.originFetchMs,
                      },
                      { label: "Payload Transfer", ms: inspectedRequest.transferMs },
                    ] as const
                  ).map((stage) => {
                    const pct =
                      inspectedRequest.totalMs > 0
                        ? Math.max(
                            2,
                            Math.round((stage.ms / inspectedRequest.totalMs) * 100)
                          )
                        : 0;
                    return (
                      <div key={stage.label} className="space-y-0.5">
                        <div className="flex justify-between text-text-secondary">
                          <span>{stage.label}</span>
                          <span className="text-foreground">{stage.ms}ms</span>
                        </div>
                        <div className="h-2 bg-surface-02 border border-border-subtle rounded-md overflow-hidden">
                          <div
                            className="h-full bg-surface-04 border-r border-border-strong"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-text-muted">{inspectedRequest.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Purges & Failover */}
        {activeTab === "purges_failover" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <RefreshIcon className="w-3.5 h-3.5 text-text-secondary" />
                <span>Cache Policy &amp; Purge Schedule</span>
              </div>
              <div className="space-y-1 text-text-muted">
                <div>
                  Cache-Control: {activeScenario.cdn.cachePolicy.cacheControl} ·
                  max-age={activeScenario.cdn.cachePolicy.maxAgeSeconds}s ·
                  s-maxage={activeScenario.cdn.cachePolicy.sMaxAgeSeconds ?? "-"}
                  s
                </div>
                <div>
                  stale-while-revalidate=
                  {activeScenario.cdn.cachePolicy.staleWhileRevalidateSeconds}s
                  · stale-if-error=
                  {activeScenario.cdn.cachePolicy.staleIfErrorSeconds}s
                </div>
                <div>
                  Purge Propagation Delay:{" "}
                  {activeScenario.cdn.purgePropagationDelayMs}ms
                </div>
              </div>
              {activeScenario.purges.length === 0 ? (
                <div className="text-text-muted">
                  No scheduled purges in this scenario.
                </div>
              ) : (
                activeScenario.purges.map((purge) => (
                  <div
                    key={purge.id}
                    className="p-2 bg-surface-02 border border-border-subtle rounded-md flex justify-between"
                  >
                    <span className="text-foreground">
                      {purge.mode}: {purge.pathPattern}
                    </span>
                    <span className="text-text-muted">@{purge.atMs}ms</span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface-01 border border-border-default rounded-md p-2.5 space-y-2">
              <div className="text-foreground font-semibold">
                Injected Global Faults &amp; Failover Windows
              </div>
              {activeScenario.faults.length === 0 ? (
                <div className="text-text-muted">
                  No faults injected in this scenario.
                </div>
              ) : (
                activeScenario.faults.map((fault) => (
                  <div
                    key={fault.id}
                    className="p-2 bg-surface-02 border border-border-subtle rounded-md space-y-0.5"
                  >
                    <div className="flex justify-between text-foreground">
                      <span>
                        {fault.type} ({fault.targetId})
                      </span>
                      <span className="text-text-muted">
                        @{fault.atMs}ms
                        {fault.recoveryAtMs !== undefined
                          ? ` -> ${fault.recoveryAtMs}ms`
                          : ""}
                      </span>
                    </div>
                    <div className="text-text-muted">{fault.description}</div>
                  </div>
                ))
              )}
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
