"use client";

import * as React from "react";
import Link from "next/link";
import {
  scalabilityRecommendationsEngine,
  GraphProposalApplier,
  type ScalabilityAnalysisReport,
  type ScalabilityRecommendation,
  type WhatIfPlan,
} from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
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
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { PRESET_WORKLOAD_SCENARIOS } from "@/features/system-design/scalability/hooks/use-scalability-recommendations";
import { ScalabilityRecommendationCard } from "@/features/system-design/scalability/components/scalability-recommendation-card";
import { WhatIfPlannerView } from "@/features/system-design/scalability/components/what-if-planner-view";

const STRATEGY_DIRECTORY: Record<string, { title: string; description: string }> = {
  "horizontal-scaling": { title: "Horizontal Scaling", description: "Scale out stateless service instances" },
  "caching": { title: "Caching Layer", description: "Insert distributed cache in front of read-heavy databases" },
  "read-replication": { title: "Read Replicas", description: "Distribute SELECT queries across read replicas" },
  "sharding": { title: "Database Sharding", description: "Partition high-write databases across shards" },
  "asynchronous-processing": { title: "Asynchronous Queue", description: "Decouple synchronous critical paths with message queues" },
  "rate-limiting": { title: "Rate Limiting", description: "Protect public ingress from traffic surges" },
};

const PRESET_TOPOLOGIES: Record<
  string,
  { name: string; description: string; nodes: BaseNode[]; edges: BaseEdge[] }
> = {
  compute_saturation: {
    name: "Compute Saturation Under Peak Load",
    description: "Stateless API Gateway & Checkout Service running on single instance handling peak traffic surge.",
    nodes: [
      { id: "api_gw", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "api-gateway", label: "Public API Gateway", replicas: 1, maxThroughputRps: 500 } },
      { id: "checkout_svc", type: "infrastructure", position: { x: 220, y: 0 }, data: { componentType: "compute-instance", label: "Checkout Service", replicas: 1, isStateful: false, cpuUtilization: 0.92 } },
      { id: "orders_db", type: "infrastructure", position: { x: 440, y: 0 }, data: { componentType: "relational-database", label: "Orders DB" } },
    ],
    edges: [
      { id: "e1", source: "api_gw", target: "checkout_svc", data: {} },
      { id: "e2", source: "checkout_svc", target: "orders_db", data: {} },
    ],
  },
  read_heavy_catalog: {
    name: "Read-Heavy Catalog Without Cache or Replicas",
    description: "High-volume catalog service directly querying an un-replicated PostgreSQL database with 90% read ratio.",
    nodes: [
      { id: "catalog_api", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "compute-instance", label: "Catalog API", replicas: 2 } },
      { id: "products_db", type: "infrastructure", position: { x: 250, y: 0 }, data: { componentType: "relational-database", label: "Products Database", readRatio: 0.90, maxConnections: 100 } },
    ],
    edges: [
      { id: "e_cat_db", source: "catalog_api", target: "products_db", data: {} },
    ],
  },
  synchronous_intake: {
    name: "Synchronous Order Intake & Notification",
    description: "API directly invoking Order Processor over synchronous RPC without decoupling or load leveling.",
    nodes: [
      { id: "web_ingress", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "api-gateway", label: "Web Ingress" } },
      { id: "order_processor", type: "infrastructure", position: { x: 260, y: 0 }, data: { componentType: "compute-instance", label: "Order Processor" } },
    ],
    edges: [
      { id: "e_ingress_proc", source: "web_ingress", target: "order_processor", data: { protocol: "https", isSynchronous: true } },
    ],
  },
  unthrottled_ingress: {
    name: "Public API Without Rate Limiting",
    description: "Public edge gateway receiving unthrottled external web traffic without rate limiting or quota policy.",
    nodes: [
      { id: "edge_gw", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "api-gateway", label: "Public Edge Gateway", exposure: "public" } },
      { id: "backend_svc", type: "infrastructure", position: { x: 220, y: 0 }, data: { componentType: "compute-instance", label: "Core Backend" } },
    ],
    edges: [
      { id: "e_edge_back", source: "edge_gw", target: "backend_svc", data: {} },
    ],
  },
};

export default function ArchitectureScalabilityVerifyPage() {
  const [selectedTopologyKey, setSelectedTopologyKey] = React.useState<string>("compute_saturation");
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>("peak_traffic");
  const [activePlan, setActivePlan] = React.useState<WhatIfPlan | null>(null);
  const [appliedNodes, setAppliedNodes] = React.useState<BaseNode[] | null>(null);
  const [appliedEdges, setAppliedEdges] = React.useState<BaseEdge[] | null>(null);
  const [copied, setCopied] = React.useState(false);

  const activeTopology = PRESET_TOPOLOGIES[selectedTopologyKey];
  const activeScenario =
    PRESET_WORKLOAD_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    PRESET_WORKLOAD_SCENARIOS[0];

  const currentNodes = appliedNodes ?? activeTopology.nodes;
  const currentEdges = appliedEdges ?? activeTopology.edges;

  // Evaluate Scalability Report
  const report: ScalabilityAnalysisReport = React.useMemo(() => {
    return scalabilityRecommendationsEngine.evaluateGraph(currentNodes, currentEdges, activeScenario);
  }, [currentNodes, currentEdges, activeScenario]);

  // Handle switching topology
  const handleSelectTopology = (key: string) => {
    setSelectedTopologyKey(key);
    setActivePlan(null);
    setAppliedNodes(null);
    setAppliedEdges(null);
  };

  const handlePreviewPlan = (rec: ScalabilityRecommendation) => {
    const plan = scalabilityRecommendationsEngine.createWhatIfPlan(
      currentNodes,
      currentEdges,
      rec,
      activeScenario
    );
    setActivePlan(plan);
  };

  const handleApplyPlan = () => {
    if (!activePlan) return;
    const result = GraphProposalApplier.applyOperations(currentNodes, currentEdges, activePlan.operations);
    setAppliedNodes(result.nodes);
    setAppliedEdges(result.edges);
    setActivePlan(null);
  };

  const handleResetTopology = () => {
    setActivePlan(null);
    setAppliedNodes(null);
    setAppliedEdges(null);
  };

  const copySnapshot = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSimulated = appliedNodes !== null;

  return (
    <div className="min-h-screen bg-[#000000] text-foreground p-6 font-sans space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted mb-1">
            <Link href="/" className="hover:text-foreground transition-colors">
              NXTQR
            </Link>
            <span>/</span>
            <span>Verify</span>
            <span>/</span>
            <span className="text-text-secondary">Architecture Scalability &amp; What-If Planner</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-mono font-semibold tracking-tight text-foreground">
              Scalability Recommendations Engine &amp; What-If Architecture Planner
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono border-sky-900/60 text-sky-400 bg-sky-950/20">
              Phase 05.3.6
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1 max-w-3xl">
            Evaluate architecture resilience against workload surges, generate deterministic scaling strategies,
            and preview What-If graph mutations with before/after capacity comparisons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSimulated && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTopology}
              className="h-8 px-3 text-xs font-mono border-border-default bg-surface-02 text-amber-400 hover:text-foreground"
            >
              Reset to Base Graph
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={copySnapshot}
            className="h-8 px-3 text-xs font-mono border-border-default bg-surface-02 text-text-muted hover:text-foreground gap-1.5"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5 text-white" /> : <CopyIcon className="w-3.5 h-3.5" />}
            <span>Copy Snapshot</span>
          </Button>

          <Link href="/graph/default">
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 text-xs font-mono bg-foreground text-background hover:bg-neutral-200 font-semibold"
            >
              Open Studio Canvas
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-surface-01 border border-border-default">
        {/* Preset Topology */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-text-muted block">
            1. Select Test Architecture Topology
          </label>
          <Select value={selectedTopologyKey} onValueChange={handleSelectTopology}>
            <SelectTrigger className="h-8 w-full font-mono text-xs bg-surface-02 border-border-default text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground">
              {Object.entries(PRESET_TOPOLOGIES).map(([key, item]) => (
                <SelectItem key={key} value={key}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-text-muted font-sans line-clamp-1">
            {activeTopology.description}
          </p>
        </div>

        {/* Workload Scenario */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-text-muted block">
            2. Select Workload Growth Scenario
          </label>
          <Select value={selectedScenarioId} onValueChange={setSelectedScenarioId}>
            <SelectTrigger className="h-8 w-full font-mono text-xs bg-surface-02 border-border-default text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground">
              {PRESET_WORKLOAD_SCENARIOS.map((sc) => (
                <SelectItem key={sc.id} value={sc.id}>
                  {sc.name} ({sc.trafficMultiplier}x Traffic, {sc.concurrentUsersMultiplier}x Users)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-text-muted font-sans line-clamp-1">
            {activeScenario.description}
          </p>
        </div>
      </div>

      {/* Top Telemetry / Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] font-mono uppercase text-text-muted block">
            Total Recs
          </span>
          <div className="text-xl font-mono font-semibold text-emerald-400">
            {report.summary.totalRecommendations}
          </div>
          <span className="text-[10px] font-mono text-text-disabled block">
            {isSimulated ? "Simulated Graph" : "Current Baseline"}
          </span>
        </div>

        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] font-mono uppercase text-text-muted block">
            Applicable Recs
          </span>
          <div className="text-xl font-mono font-semibold text-sky-400">
            {report.summary.applicableCount}
          </div>
          <span className="text-[10px] font-mono text-text-disabled block">
            Immediate Action
          </span>
        </div>

        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] font-mono uppercase text-text-muted block">
            Conditional Recs
          </span>
          <div className="text-xl font-mono font-semibold text-amber-400">
            {report.summary.conditionalCount}
          </div>
          <span className="text-[10px] font-mono text-text-disabled block">
            Requires Session/State Changes
          </span>
        </div>

        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] font-mono uppercase text-text-muted block">
            Active Nodes / Edges
          </span>
          <div className="text-xl font-mono font-semibold text-text-secondary">
            {currentNodes.length} / {currentEdges.length}
          </div>
          <span className="text-[10px] font-mono text-text-disabled block">
            High-confidence: {report.summary.highConfidenceCount}
          </span>
        </div>
      </div>

      {/* Main Content: Split View between Recommendations & What-If Active Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recommendations Catalog */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <div className="flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
                Evaluated Scaling Recommendations ({report.recommendations.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-text-muted">
              Ranked by Feasibility &amp; Estimated Gain
            </span>
          </div>

          {report.recommendations.length === 0 ? (
            <div className="p-8 text-center rounded-md bg-surface-01 border border-border-default space-y-2">
              <CheckCircleIcon className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-mono text-xs font-semibold text-foreground">
                No Bottlenecks or Scaling Deficits Detected
              </h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto font-sans">
                The current architecture is operating comfortably within capacity for the &quot;{activeScenario.name}&quot; scenario.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {report.recommendations.map((rec) => (
                <ScalabilityRecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  isActive={activePlan?.recommendationId === rec.id}
                  onPreviewWhatIf={() => handlePreviewPlan(rec)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: What-If Simulation View or Catalog Reference */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-default">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
              What-If Architecture Planner
            </h2>
            {activePlan && (
              <Badge variant="outline" className="text-[9px] font-mono border-sky-900/60 text-sky-400 bg-sky-950/20">
                Active Simulation
              </Badge>
            )}
          </div>

          {activePlan ? (
            <WhatIfPlannerView
              plan={activePlan}
              onCommit={handleApplyPlan}
              onDiscard={() => setActivePlan(null)}
            />
          ) : (
            <div className="p-6 rounded-md bg-surface-01 border border-border-default space-y-4">
              <div className="text-center space-y-2">
                <LayersIcon className="w-8 h-8 text-text-disabled mx-auto" />
                <h3 className="font-mono text-xs font-semibold text-foreground uppercase">
                  Select &quot;What-If Preview&quot; to Simulate
                </h3>
                <p className="text-xs text-text-muted font-sans">
                  Click the What-If Preview button on any recommendation card to model before vs after capacity gains,
                  inspect proposed graph additions or instance scaling, and review architectural validation.
                </p>
              </div>

              {/* Supported Strategies Reference */}
              <div className="pt-4 border-t border-border-subtle space-y-2">
                <span className="text-[10px] font-mono uppercase text-text-muted font-semibold block">
                  Engine Strategies ({Object.keys(STRATEGY_DIRECTORY).length})
                </span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                  {Object.entries(STRATEGY_DIRECTORY).map(([key, def]) => (
                    <div key={key} className="p-1.5 rounded bg-surface-02 border border-border-default truncate">
                      <span className="text-foreground">{def.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
