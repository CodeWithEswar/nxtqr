"use client";

import * as React from "react";
import Link from "next/link";
import {
  recommendationEngine,
  architectureHealthEngine,
  bottleneckEngine,
  failureAnalysisEngine,
  securityAnalysisEngine,
  scalabilityRecommendationsEngine,
  reliabilityEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
  type UnifiedRecommendationReport,
  type MultiEngineAnalysisInputs,
} from "@nxtqr/architecture-intelligence";
import { architectureValidationEngine } from "@nxtqr/architecture-validation";
import {
  CheckCircleIcon,
  CopyIcon,
  CheckIcon,
} from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { UnifiedRecommendationCard } from "@/features/system-design/recommendations/components/unified-recommendation-card";
import { RecommendationConflictBanner } from "@/features/system-design/recommendations/components/recommendation-conflict-banner";

const PRESET_TOPOLOGIES: Record<
  string,
  { name: string; description: string; nodes: BaseNode[]; edges: BaseEdge[] }
> = {
  multi_engine_db_saturation: {
    name: "Multi-Engine Database Saturation & Single Point of Failure",
    description: "Single primary PostgreSQL database experiencing read saturation, high connection load, and single point of failure risk.",
    nodes: [
      {
        id: "api_gw",
        type: "infrastructure",
        position: { x: 50, y: 100 },
        data: { componentType: "api-gateway", label: "Public API Gateway", rateLimitingEnabled: false },
      },
      {
        id: "order_svc",
        type: "infrastructure",
        position: { x: 260, y: 100 },
        data: { componentType: "compute-instance", label: "Order Service", retries: 3 },
      },
      {
        id: "orders_db",
        type: "infrastructure",
        position: { x: 480, y: 100 },
        data: {
          componentType: "relational-database",
          label: "Orders Database",
          readReplicas: 0,
          criticality: "mission-critical",
        },
      },
    ],
    edges: [
      { id: "e1", source: "api_gw", target: "order_svc", data: { isSynchronous: true } },
      { id: "e2", source: "order_svc", target: "orders_db", data: { isSynchronous: true } },
    ],
  },
  competing_conflicts: {
    name: "Competing Recommendations: Caching vs Read Replicas",
    description: "Database under intense query pressure triggering both caching and read-replication strategies simultaneously, illustrating conflict detection.",
    nodes: [
      {
        id: "catalog_svc",
        type: "infrastructure",
        position: { x: 100, y: 100 },
        data: { componentType: "compute-instance", label: "Catalog Service" },
      },
      {
        id: "catalog_db",
        type: "infrastructure",
        position: { x: 380, y: 100 },
        data: { componentType: "relational-database", label: "Product Catalog DB" },
      },
    ],
    edges: [
      { id: "e1", source: "catalog_svc", target: "catalog_db", data: { isSynchronous: true } },
    ],
  },
  cascading_timeout_queue: {
    name: "Cascading Timeout Mismatch & Missing Circuit Breaker",
    description: "Deep synchronous call chain where caller timeout (500ms) is shorter than callee (2000ms), risking worker thread exhaustion without circuit breaking.",
    nodes: [
      {
        id: "ingress_gw",
        type: "infrastructure",
        position: { x: 50, y: 100 },
        data: { componentType: "api-gateway", label: "Ingress Gateway", timeoutMs: 500 },
      },
      {
        id: "checkout_svc",
        type: "infrastructure",
        position: { x: 250, y: 100 },
        data: { componentType: "compute-instance", label: "Checkout Service", timeoutMs: 2000, circuitBreakerEnabled: false },
      },
      {
        id: "payment_gw",
        type: "infrastructure",
        position: { x: 450, y: 100 },
        data: { componentType: "third-party-client", label: "Payment Processor", timeoutMs: 3000 },
      },
    ],
    edges: [
      { id: "e1", source: "ingress_gw", target: "checkout_svc", data: { isSynchronous: true } },
      { id: "e2", source: "checkout_svc", target: "payment_gw", data: { isSynchronous: true } },
    ],
  },
  stateful_scaling_blocker: {
    name: "Stateful Compute Node (Conditional Horizontal Scaling)",
    description: "Compute node under CPU pressure storing local in-memory session state, requiring session externalization before instances can be scaled.",
    nodes: [
      {
        id: "user_app",
        type: "infrastructure",
        position: { x: 150, y: 100 },
        data: {
          componentType: "compute-instance",
          label: "Web App Server",
          replicas: 1,
          sessionStorage: "local-memory",
          isStateful: true,
        },
      },
    ],
    edges: [],
  },
};

export default function VerifyArchitectureRecommendationsPage() {
  const [activeTopologyId, setActiveTopologyId] = React.useState<string>("multi_engine_db_saturation");
  const [copied, setCopied] = React.useState(false);
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");

  const topology = PRESET_TOPOLOGIES[activeTopologyId];

  // Analyze multi-engine report
  const report: UnifiedRecommendationReport = React.useMemo(() => {
    const scenario = DEFAULT_WORKLOAD_SCENARIOS.normal_traffic;
    const { nodes, edges } = topology;

    const validation = architectureValidationEngine.validateGraph(nodes, edges);
    const health = architectureHealthEngine.assessGraph(nodes, edges);
    const bottlenecks = bottleneckEngine.analyzeGraph(nodes, edges, scenario);
    const failure = failureAnalysisEngine.analyzeGraph(nodes, edges);
    const security = securityAnalysisEngine.analyzeGraph(nodes, edges);
    const scalability = scalabilityRecommendationsEngine.evaluateGraph(nodes, edges, scenario);
    const reliability = reliabilityEngine.analyzeGraph(nodes, edges);

    const inputs: MultiEngineAnalysisInputs = {
      validation,
      healthFindings: health.allFindings,
      bottleneckFindings: bottlenecks.findings,
      failureFindings: failure.findings,
      securityFindings: security.findings,
      scalabilityRecommendations: scalability.recommendations,
      reliabilityFindings: reliability.findings,
    };

    return recommendationEngine.generateRecommendations(nodes, edges, inputs, {
      includeNotApplicable: true,
    });
  }, [topology]);

  const copySnapshot = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRecs = React.useMemo(() => {
    if (priorityFilter === "all") return report.recommendations;
    return report.recommendations.filter((r) => r.priority === priorityFilter);
  }, [report, priorityFilter]);

  return (
    <div className="min-h-screen bg-black text-foreground p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Header */}
      <header className="border-b border-border-default pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-text-muted">Phase 05.3.8 Verification</span>
            <Badge variant="outline" className="text-[10px] font-mono text-cyan-400 border-border-default bg-cyan-950/20">
              Cross-Engine Unified Intelligence
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Intelligent Architecture Recommendations</h1>
          <p className="text-xs text-text-secondary mt-1">
            Deterministic correlation, root-cause reasoning, conflict detection, and dependency-aware improvement planning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copySnapshot}
            className="h-8 text-xs font-mono border-border-default text-text-secondary hover:text-foreground"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? "Copied JSON" : "Copy Snapshot"}
          </Button>
          <Link href="/system-design">
            <Button size="sm" className="h-8 text-xs font-mono bg-foreground text-background hover:bg-neutral-200">
              Open Studio Canvas &rarr;
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Topology Presets Switcher */}
      <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
        <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider block font-semibold">
          Select Topology Scenario
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {Object.entries(PRESET_TOPOLOGIES).map(([id, t]) => {
            const isSelected = activeTopologyId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTopologyId(id)}
                className={`p-2.5 rounded-md border text-left transition-colors flex flex-col justify-between space-y-1 ${
                  isSelected
                    ? "bg-surface-03 border-border-strong shadow-level-2"
                    : "bg-surface-02 border-border-subtle hover:border-border-hover hover:bg-surface-03"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate">{t.name}</span>
                  {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-text-secondary line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Summary & Conflict Banner */}
      {report.conflicts.length > 0 && (
        <RecommendationConflictBanner conflicts={report.conflicts} />
      )}

      {/* 4. Intelligence Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1 font-mono">
          <span className="text-[10px] text-text-muted uppercase">Findings Normalized</span>
          <div className="text-xl font-bold text-foreground">{report.totalFindingsAnalyzed}</div>
          <span className="text-[10px] text-text-disabled">Across 7 Analyzers</span>
        </div>
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1 font-mono">
          <span className="text-[10px] text-text-muted uppercase">Correlated Groups</span>
          <div className="text-xl font-bold text-cyan-400">{report.correlatedGroups.length}</div>
          <span className="text-[10px] text-text-disabled">Root-cause mapped</span>
        </div>
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1 font-mono">
          <span className="text-[10px] text-text-muted uppercase">Active Recommendations</span>
          <div className="text-xl font-bold text-emerald-400">{report.recommendations.length}</div>
          <span className="text-[10px] text-text-disabled">Deduplicated</span>
        </div>
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1 font-mono">
          <span className="text-[10px] text-text-muted uppercase">Improvement Plan</span>
          <div className="text-xl font-bold text-purple-400">{report.plan.orderedSteps.length} Steps</div>
          <span className="text-[10px] text-text-disabled">{report.plan.estimatedComplexity} Complexity</span>
        </div>
      </div>

      {/* 5. Recommendations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-foreground">
              Prioritized Architecture Recommendations ({filteredRecs.length})
            </h2>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            {(["all", "critical", "high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-0.5 rounded border uppercase transition-colors ${
                  priorityFilter === p
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "bg-surface-01 border-border-subtle text-text-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRecs.map((rec) => (
            <UnifiedRecommendationCard
              key={rec.id}
              recommendation={rec}
              onPreview={() => alert(`What-If Preview: ${rec.title}\nOperations: ${rec.proposedOperations.length}`)}
              onApply={() => alert(`Applied Recommendation: ${rec.title}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
