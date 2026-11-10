"use client";

import * as React from "react";
import Link from "next/link";
import {
  bottleneckEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
  type BottleneckReport,
  type BottleneckFinding,
  type HealthSeverity,
  BOTTLENECK_RECOMMENDATION_REGISTRY,
} from "@nxtqr/architecture-intelligence";
import {
  CpuIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { CapacityUtilizationChart } from "@/features/system-design/bottlenecks/components/capacity-utilization-chart";

const PRESET_TOPOLOGIES: Record<
  string,
  { name: string; description: string; nodes: BaseNode[]; edges: BaseEdge[] }
> = {
  service_saturation: {
    name: "Service Saturation Topology",
    description: "Single-instance microservice overwhelmed by 3,000 req/s ingress against a 1,000 req/s ceiling.",
    nodes: [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "api_gw", type: "api-gateway", position: { x: 120, y: 0 }, data: { replicas: 2, capacityRps: 5000 } },
      { id: "monolith_svc", type: "container-service", position: { x: 280, y: 0 }, data: { replicas: 1, capacityRps: 1000 } },
      { id: "primary_db", type: "relational-database", position: { x: 440, y: 0 }, data: { capacityOps: 5000 } },
    ],
    edges: [
      { id: "e1", source: "client", target: "api_gw", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "api_gw", target: "monolith_svc", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "monolith_svc", target: "primary_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
  queue_backlog: {
    name: "Queue Backlog Accumulation",
    description: "Fast ingress event publisher producing 3,000 msg/s into a message queue with a single slow consumer at 400 msg/s.",
    nodes: [
      { id: "producer", type: "container-service", position: { x: 0, y: 0 }, data: { replicas: 3, capacityRps: 5000 } },
      { id: "event_queue", type: "message-queue", position: { x: 200, y: 0 }, data: { capacityMsgPerSec: 20000 } },
      { id: "slow_worker", type: "worker-service", position: { x: 400, y: 0 }, data: { replicas: 1, capacityMsgPerSec: 400 } },
      { id: "analytics_store", type: "data-warehouse", position: { x: 600, y: 0 }, data: {} },
    ],
    edges: [
      { id: "e1", source: "producer", target: "event_queue", data: { protocol: "AMQP", relationshipKind: "event-delivery" } },
      { id: "e2", source: "event_queue", target: "slow_worker", data: { protocol: "AMQP", relationshipKind: "stream" } },
      { id: "e3", source: "slow_worker", target: "analytics_store", data: { protocol: "SQL", relationshipKind: "storage-access" } },
    ],
  },
  cache_miss_stampede: {
    name: "Cache Miss & Stampede Risk",
    description: "Under-provisioned cache with a 35% hit rate causing heavy read leakage to a non-replicated database.",
    nodes: [
      { id: "web_client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "catalog_svc", type: "container-service", position: { x: 180, y: 0 }, data: { replicas: 4, capacityRps: 8000 } },
      { id: "catalog_cache", type: "distributed-cache", position: { x: 360, y: -60 }, data: { capacityRps: 10000 } },
      { id: "catalog_db", type: "relational-database", position: { x: 360, y: 60 }, data: { capacityOps: 600, readReplicas: 0 } },
    ],
    edges: [
      { id: "e1", source: "web_client", target: "catalog_svc", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "catalog_svc", target: "catalog_cache", data: { protocol: "REDIS", relationshipKind: "cache-access" } },
      { id: "e3", source: "catalog_svc", target: "catalog_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
  db_pool_exhaustion: {
    name: "Database Connection Pool Exhaustion",
    description: "Multiple microservices concurrently requesting DB connections exceeding the 60-connection pool limit.",
    nodes: [
      { id: "client_app", type: "mobile-application", position: { x: 0, y: 0 }, data: {} },
      { id: "svc_order", type: "container-service", position: { x: 180, y: -60 }, data: { replicas: 3, defaultConcurrency: 25 } },
      { id: "svc_billing", type: "container-service", position: { x: 180, y: 60 }, data: { replicas: 3, defaultConcurrency: 25 } },
      { id: "shared_db", type: "relational-database", position: { x: 400, y: 0 }, data: { maxConnections: 60, capacityOps: 3000 } },
    ],
    edges: [
      { id: "e1", source: "client_app", target: "svc_order", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "client_app", target: "svc_billing", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "svc_order", target: "shared_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
      { id: "e4", source: "svc_billing", target: "shared_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
  network_and_external: {
    name: "Network Bandwidth & External Quotas",
    description: "High-volume media service exhausting 1 Gbps network bandwidth and third-party payment API quota.",
    nodes: [
      { id: "media_client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "media_proxy", type: "reverse-proxy", position: { x: 160, y: 0 }, data: { bandwidthMbps: 800 } },
      { id: "payment_gw_ext", type: "third-party-api", position: { x: 380, y: 0 }, data: { rateLimitRps: 200 } },
    ],
    edges: [
      { id: "e1", source: "media_client", target: "media_proxy", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "media_proxy", target: "payment_gw_ext", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
    ],
  },
  optimal_scaled: {
    name: "Optimal Scaled Architecture",
    description: "Full elastic scaling, multi-replica container tiers, high cache hit rates, decoupled queues, and read replicas.",
    nodes: [
      { id: "cdn_edge", type: "cdn-distribution", position: { x: 0, y: 0 }, data: { capacityRps: 50000 } },
      { id: "load_balancer", type: "load-balancer", position: { x: 150, y: 0 }, data: { capacityRps: 25000 } },
      { id: "api_tier", type: "container-service", position: { x: 300, y: 0 }, data: { replicas: 5, capacityRps: 2500 } },
      { id: "redis_cluster", type: "distributed-cache", position: { x: 460, y: -50 }, data: { capacityRps: 30000 } },
      { id: "db_cluster", type: "relational-database", position: { x: 460, y: 50 }, data: { capacityOps: 8000, readReplicas: 3, maxConnections: 300 } },
    ],
    edges: [
      { id: "e1", source: "cdn_edge", target: "load_balancer", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "load_balancer", target: "api_tier", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "api_tier", target: "redis_cluster", data: { protocol: "REDIS", relationshipKind: "cache-access" } },
      { id: "e4", source: "api_tier", target: "db_cluster", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
};

const SEVERITY_STYLES: Record<HealthSeverity, { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { label: "Critical", badge: "border-rose-900/60 text-rose-400 bg-rose-950/20", icon: AlertCircleIcon },
  high: { label: "High", badge: "border-amber-900/60 text-amber-400 bg-amber-950/20", icon: AlertTriangleIcon },
  medium: { label: "Medium", badge: "border-amber-900/40 text-amber-300 bg-amber-950/10", icon: AlertTriangleIcon },
  low: { label: "Low", badge: "border-border-default text-text-muted bg-surface-03", icon: AlertTriangleIcon },
  info: { label: "Info", badge: "border-border-subtle text-text-muted bg-surface-02", icon: AlertTriangleIcon },
};

export default function ArchitectureBottlenecksVerificationPage() {
  const [selectedTopologyKey, setSelectedTopologyKey] = React.useState<string>("service_saturation");
  const [selectedScenarioKey, setSelectedScenarioKey] = React.useState<string>("peak_traffic");
  const [activeTab, setActiveTab] = React.useState<string>("findings");

  const topology = PRESET_TOPOLOGIES[selectedTopologyKey];
  const scenario = DEFAULT_WORKLOAD_SCENARIOS[selectedScenarioKey] || DEFAULT_WORKLOAD_SCENARIOS.normal_traffic;

  // Run deterministic bottleneck analysis
  const report: BottleneckReport = React.useMemo(() => {
    return bottleneckEngine.analyzeGraph(topology.nodes, topology.edges, scenario);
  }, [topology, scenario]);

  const criticalAndHigh = report.metrics.criticalCount + report.metrics.highCount;

  // Max utilization ratio
  const maxUtilNode = React.useMemo(() => {
    let maxRatio = 0;
    let nodeKey = "None";
    for (const [id, util] of Object.entries(report.nodeUtilization)) {
      if ((util.utilizationRatio ?? 0) > maxRatio) {
        maxRatio = util.utilizationRatio ?? 0;
        nodeKey = id;
      }
    }
    return { id: nodeKey, ratio: maxRatio };
  }, [report.nodeUtilization]);

  return (
    <div className="min-h-screen bg-surface-00 text-foreground font-sans p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono uppercase border-border-default text-text-secondary">
              Phase 05.3.3 Verification
            </Badge>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-text-muted text-xs font-mono">Architecture Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground flex items-center gap-2.5">
            <CpuIcon className="w-6 h-6 text-foreground" />
            Bottleneck Detection Engine
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Deterministic workload propagation and capacity analysis identifying service saturation, queue backlogs, database contention, and critical latency paths.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/verify/architecture-health">
            <Button variant="outline" size="sm" className="h-8 font-mono text-xs border-border-default bg-surface-02">
              Health Analysis
            </Button>
          </Link>
          <Link href="/verify/architecture-validation">
            <Button variant="outline" size="sm" className="h-8 font-mono text-xs border-border-default bg-surface-02">
              Validation Engine
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Scenario & Topology Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Topology Selector */}
        <div className="p-3.5 rounded-md bg-surface-01 border border-border-default space-y-2">
          <label className="text-xs font-mono text-text-muted uppercase tracking-wider block">
            Test Topology Preset
          </label>
          <Select value={selectedTopologyKey} onValueChange={setSelectedTopologyKey}>
            <SelectTrigger className="h-8 bg-surface-02 border-border-default font-mono text-xs text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-strong text-foreground font-mono text-xs shadow-level-2">
              {Object.entries(PRESET_TOPOLOGIES).map(([k, t]) => (
                <SelectItem key={k} value={k}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-text-muted leading-relaxed font-sans">
            {topology.description}
          </p>
        </div>

        {/* Workload Scenario Selector */}
        <div className="p-3.5 rounded-md bg-surface-01 border border-border-default space-y-2">
          <label className="text-xs font-mono text-text-muted uppercase tracking-wider block">
            Workload Scenario Preset
          </label>
          <Select value={selectedScenarioKey} onValueChange={setSelectedScenarioKey}>
            <SelectTrigger className="h-8 bg-surface-02 border-border-default font-mono text-xs text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-strong text-foreground font-mono text-xs shadow-level-2">
              {Object.entries(DEFAULT_WORKLOAD_SCENARIOS).map(([k, s]) => (
                <SelectItem key={k} value={k}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3 font-mono text-[11px] text-text-secondary pt-0.5">
            <span>Ingress: <strong className="text-foreground">{scenario.parameters.ingressRps.toLocaleString()}</strong> req/s</span>
            <span>Peak: <strong className="text-foreground">{scenario.parameters.peakMultiplier}x</strong></span>
            <span>Reads: <strong className="text-foreground">{Math.round(scenario.parameters.readRatio * 100)}%</strong></span>
            <span>Cache Hit: <strong className="text-foreground">{Math.round(scenario.parameters.cacheHitRate * 100)}%</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        {/* Metric 1 */}
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Bottlenecks Detected</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span>{report.metrics.bottlenecksDetectedCount}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] h-4 px-1 rounded uppercase",
                criticalAndHigh > 0
                  ? "border-rose-900/60 text-rose-400 bg-rose-950/20"
                  : report.findings.length > 0
                    ? "border-amber-900/60 text-amber-400 bg-amber-950/20"
                    : "border-border-default text-emerald-400 bg-emerald-950/20"
              )}
            >
              {criticalAndHigh > 0 ? `${criticalAndHigh} High/Crit` : "Stable"}
            </Badge>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Max Node Utilization</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span className={maxUtilNode.ratio > 1.0 ? "text-rose-400" : maxUtilNode.ratio >= 0.8 ? "text-amber-400" : "text-emerald-400"}>
              {Math.round(maxUtilNode.ratio * 100)}%
            </span>
            <span className="text-[10px] text-text-muted font-normal truncate max-w-[90px]">
              {maxUtilNode.id}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Critical Paths</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span>{report.criticalPaths.length}</span>
            <span className="text-[10px] text-text-muted font-normal">
              {report.criticalPaths.filter((p) => p.exceedsBudget).length} Over Budget
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Engine Execution</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span>{report.metrics.executionTimeMs} ms</span>
            <span className="text-[10px] text-text-muted font-normal">
              {report.metrics.analyzedNodesCount} Nodes Analyzed
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Investigation View */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-surface-01 border border-border-default p-0.5 rounded-md">
          <TabsTrigger
            value="findings"
            className="text-xs font-mono data-[state=active]:bg-surface-03 data-[state=active]:text-foreground"
          >
            Findings & Math ({report.findings.length})
          </TabsTrigger>
          <TabsTrigger
            value="capacity"
            className="text-xs font-mono data-[state=active]:bg-surface-03 data-[state=active]:text-foreground"
          >
            Capacity Utilization ({Object.keys(report.nodeUtilization).length})
          </TabsTrigger>
          <TabsTrigger
            value="paths"
            className="text-xs font-mono data-[state=active]:bg-surface-03 data-[state=active]:text-foreground"
          >
            Critical Latency Paths ({report.criticalPaths.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FINDINGS */}
        <TabsContent value="findings" className="space-y-3 m-0">
          {report.findings.length === 0 ? (
            <div className="p-8 rounded-md bg-surface-01 border border-border-default text-center space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-02 border border-border-default flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">Zero Capacity Bottlenecks Detected</h4>
              <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                Under the &quot;{scenario.name}&quot; workload assumptions, all nodes, queues, and databases operate well within their provisioned limits.
              </p>
            </div>
          ) : (
            report.findings.map((f: BottleneckFinding) => {
              const style = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.medium;
              const Icon = style.icon;
              const recs = (f.recommendationIds || [])
                .map((id) => BOTTLENECK_RECOMMENDATION_REGISTRY[id])
                .filter(Boolean);

              return (
                <div
                  key={f.id}
                  className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3 font-sans text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-text-muted">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <Badge variant="outline" className={cn("h-4 px-1 rounded uppercase", style.badge)}>
                            {style.label}
                          </Badge>
                          <Badge variant="outline" className="h-4 px-1 rounded uppercase border-border-subtle bg-surface-02 text-text-secondary">
                            {f.bottleneckType.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-text-disabled">{f.ruleId}</span>
                        </div>
                        <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                      </div>
                    </div>

                    <div className="font-mono text-[10px] text-text-muted shrink-0">
                      Nodes: {f.affectedNodeIds.join(", ") || "None"}
                    </div>
                  </div>

                  <p className="text-text-secondary leading-relaxed pl-6">
                    {f.explanation}
                  </p>

                  {/* Calculations breakdown */}
                  {f.calculations && f.calculations.length > 0 && (
                    <div className="pl-6 space-y-1.5">
                      <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                        Deterministic Formulas & Inputs
                      </span>
                      {f.calculations.map((calc, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] space-y-1"
                        >
                          <div className="text-emerald-400 font-bold">{calc.formula}</div>
                          <div className="text-text-muted text-[9px]">
                            Variables: {JSON.stringify(calc.variables)}
                          </div>
                          <div className="text-text-secondary border-t border-border-subtle pt-1">
                            Result: <span className="text-foreground font-bold">{calc.result} {calc.unit}</span> ({calc.explanation})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {recs.length > 0 && (
                    <div className="pl-6 space-y-1.5">
                      <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                        Actionable Architectural Fixes & Trade-Offs
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {recs.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-2.5 rounded bg-surface-02 border border-border-subtle space-y-1 font-sans text-[11px]"
                          >
                            <span className="font-semibold text-foreground block">{rec.title}</span>
                            <p className="text-text-secondary text-[10px] leading-relaxed">{rec.description}</p>
                            <div className="border-t border-border-subtle pt-1 text-[10px] text-text-muted font-mono">
                              Trade-offs: {rec.tradeOffs.join("; ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* TAB 2: CAPACITY */}
        <TabsContent value="capacity" className="m-0">
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
            <h4 className="font-sans font-semibold text-sm text-foreground">
              Node Capacity Utilization Breakdown
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed font-sans">
              Compares explicit workload demand against declared baseline capacity and replica multipliers for each node in the diagram.
            </p>
            <CapacityUtilizationChart utilizations={report.nodeUtilization} />
          </div>
        </TabsContent>

        {/* TAB 3: CRITICAL PATHS */}
        <TabsContent value="paths" className="space-y-3 m-0">
          {report.criticalPaths.length === 0 ? (
            <div className="p-8 rounded-md bg-surface-01 border border-border-default text-center space-y-2">
              <h4 className="font-semibold text-sm text-foreground">No Synchronous Critical Paths</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                The current topology does not contain synchronous request-response call chains.
              </p>
            </div>
          ) : (
            report.criticalPaths.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md bg-surface-01 border border-border-default space-y-2.5 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Critical Path #{idx + 1}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono h-4 px-1 rounded uppercase",
                      p.exceedsBudget
                        ? "border-rose-900/60 text-rose-400 bg-rose-950/20"
                        : "border-border-default text-emerald-400 bg-emerald-950/20"
                    )}
                  >
                    {p.estimatedLatencyMs} ms / Budget {p.latencyBudgetMs ?? 300} ms
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {p.pathNodeIds.map((nodeId, hopIdx) => (
                    <React.Fragment key={nodeId}>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded border text-[11px]",
                          nodeId === p.bottleneckNodeId
                            ? "border-amber-900/60 bg-amber-950/30 text-amber-300 font-bold"
                            : "border-border-subtle bg-surface-02 text-text-secondary"
                        )}
                      >
                        {nodeId}
                        {nodeId === p.bottleneckNodeId && " (Bottleneck)"}
                      </span>
                      {hopIdx < p.pathNodeIds.length - 1 && (
                        <span className="text-text-disabled">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
