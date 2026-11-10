"use client";

import * as React from "react";
import Link from "next/link";
import {
  architectureHealthEngine,
  type HealthAssessmentReport,
  RULE_REGISTRY,
  RECOMMENDATION_REGISTRY,
} from "@nxtqr/architecture-intelligence";
import { CheckCircleIcon, ActivityIcon, RefreshIcon } from "@nxtqr/icons";
import { Button, Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@nxtqr/ui";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

const PRESET_TOPOLOGIES: Record<string, { name: string; description: string; nodes: BaseNode[]; edges: BaseEdge[] }> = {
  resilient_microservices: {
    name: "Resilient Microservices",
    description: "Multi-instance services with API gateway rate limiting, Multi-AZ database, distributed cache, and logging.",
    nodes: [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "gateway", type: "api-gateway", position: { x: 120, y: 0 }, data: { replicas: 3, highAvailability: true, rateLimitingEnabled: true } },
      { id: "svc_auth", type: "container-service", position: { x: 260, y: -40 }, data: { replicas: 2, highAvailability: true } },
      { id: "svc_order", type: "container-service", position: { x: 260, y: 60 }, data: { replicas: 2, highAvailability: true } },
      { id: "db_order", type: "relational-database", position: { x: 440, y: 60 }, data: { multiAz: true, readReplicas: 2, encryptionAtRest: true, backupEnabled: true } },
      { id: "cache", type: "distributed-cache", position: { x: 440, y: -40 }, data: { highAvailability: true } },
      { id: "logger", type: "log-aggregator", position: { x: 260, y: 160 }, data: {} },
    ],
    edges: [
      { id: "e1", source: "client", target: "gateway", data: { protocol: "HTTPS" } },
      { id: "e2", source: "gateway", target: "svc_auth", data: { protocol: "HTTPS" } },
      { id: "e3", source: "gateway", target: "svc_order", data: { protocol: "HTTPS" } },
      { id: "e4", source: "svc_order", target: "db_order", data: { protocol: "SQL" } },
      { id: "e5", source: "svc_auth", target: "cache", data: { protocol: "REDIS" } },
    ],
  },
  flawed_architecture: {
    name: "Flawed Architecture (High Risk)",
    description: "Single points of failure, direct client database exposure, plaintext HTTP ingress, and circular service coupling.",
    nodes: [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "db_direct", type: "relational-database", position: { x: 200, y: -80 }, data: { encryptionAtRest: false, backupEnabled: false, replicas: 1, multiAz: false } },
      { id: "svc_a", type: "container-service", position: { x: 200, y: 40 }, data: { replicas: 1 } },
      { id: "svc_b", type: "container-service", position: { x: 350, y: 40 }, data: { replicas: 1 } },
    ],
    edges: [
      { id: "e_leak", source: "client", target: "db_direct", data: { protocol: "HTTP" } },
      { id: "e_call1", source: "client", target: "svc_a", data: { protocol: "HTTP" } },
      { id: "e_c1", source: "svc_a", target: "svc_b", data: { protocol: "HTTPS" } },
      { id: "e_c2", source: "svc_b", target: "svc_a", data: { protocol: "HTTPS" } }, // Cycle
    ],
  },
  event_driven: {
    name: "Event-Driven Asynchronous Pipeline",
    description: "Ingress gateway buffering into a message queue with dead-letter queue, decoupled consumers, and metrics monitoring.",
    nodes: [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "gateway", type: "api-gateway", position: { x: 120, y: 0 }, data: { replicas: 2, rateLimitingEnabled: true } },
      { id: "queue", type: "message-queue", position: { x: 260, y: 0 }, data: { dlqEnabled: true } },
      { id: "worker_pool", type: "container-service", position: { x: 400, y: 0 }, data: { replicas: 4, autoscalingEnabled: true } },
      { id: "storage", type: "object-storage", position: { x: 540, y: 0 }, data: { encryptionAtRest: true, backupEnabled: true } },
      { id: "metrics", type: "metrics-collector", position: { x: 400, y: 120 }, data: {} },
      { id: "alert_mgr", type: "alert-manager", position: { x: 540, y: 120 }, data: {} },
    ],
    edges: [
      { id: "e1", source: "client", target: "gateway", data: { protocol: "HTTPS" } },
      { id: "e2", source: "gateway", target: "queue", data: { protocol: "HTTPS", relationshipKind: "event-delivery" } },
      { id: "e3", source: "queue", target: "worker_pool", data: { protocol: "TCP", relationshipKind: "stream" } },
      { id: "e4", source: "worker_pool", target: "storage", data: { protocol: "HTTPS", relationshipKind: "storage-access" } },
      { id: "e5", source: "metrics", target: "alert_mgr", data: { relationshipKind: "control-plane" } },
    ],
  },
  benchmark_100: {
    name: "100-Node Scale Benchmark",
    description: "Synthetic 100-node multi-tier graph to verify algorithm execution times and memory consumption.",
    nodes: Array.from({ length: 100 }, (_, i) => ({
      id: `bench_node_${i}`,
      type: i % 10 === 0 ? "api-gateway" : i % 5 === 0 ? "relational-database" : "container-service",
      position: { x: (i % 10) * 100, y: Math.floor(i / 10) * 80 },
      data: { replicas: 2, encryptionAtRest: true, multiAz: true },
    })),
    edges: Array.from({ length: 90 }, (_, i) => ({
      id: `bench_edge_${i}`,
      source: `bench_node_${i}`,
      target: `bench_node_${i + 1}`,
      data: { protocol: "HTTPS", relationshipKind: "request-response" },
    })),
  },
  insufficient_evidence: {
    name: "Insufficient Evidence (Single Node)",
    description: "Topology with 0 connections to test graceful handling of insufficient diagram evidence.",
    nodes: [{ id: "solo_node", type: "custom", position: { x: 0, y: 0 }, data: {} }],
    edges: [],
  },
};

export default function ArchitectureHealthVerificationPage() {
  const [selectedTopologyKey, setSelectedTopologyKey] = React.useState<string>("resilient_microservices");
  const topology = PRESET_TOPOLOGIES[selectedTopologyKey];

  const report: HealthAssessmentReport = React.useMemo(() => {
    return architectureHealthEngine.assessGraph(topology.nodes, topology.edges);
  }, [topology]);

  const allRules = Object.values(RULE_REGISTRY);
  const allRecs = Object.values(RECOMMENDATION_REGISTRY);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-surface-03">
      {/* Top Banner */}
      <header className="h-12 border-b border-border-default bg-surface-01 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="text-xs font-mono text-text-muted hover:text-foreground transition-colors"
          >
            ← Back to Verification Gate
          </Link>
          <span className="text-border-subtle">/</span>
          <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
            <ActivityIcon className="w-3.5 h-3.5 text-emerald-400" />
            Phase 05.3.2: Architecture Health Analysis
          </span>
          <Badge variant="outline" className="text-[10px] font-mono border-border-default">
            P0 Engine
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => architectureHealthEngine.reset()}
            className="h-7 text-xs font-mono rounded-md border-border-default gap-1.5"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
            Clear Cache
          </Button>
          <Link href="/tutorial/system-design">
            <Button size="sm" variant="outline" className="h-7 text-xs font-mono rounded-md border-border-default">
              System Design Visualizer →
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Title & Introduction */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold font-sans tracking-tight text-foreground">
            Architecture Health Analysis Engine Verification
          </h1>
          <p className="text-xs font-sans text-text-muted max-w-3xl leading-relaxed">
            Deterministic, explainable multi-dimensional assessment covering Reliability, Scalability, Security, Performance, Maintainability, and Operational Readiness.
          </p>
        </div>

        {/* Topology Selector Bar */}
        <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-semibold text-foreground block">
                Select Architecture Topology
              </span>
              <p className="font-sans text-[11px] text-text-muted">
                {topology.description}
              </p>
            </div>

            <div className="w-72 shrink-0">
              <Select value={selectedTopologyKey} onValueChange={setSelectedTopologyKey}>
                <SelectTrigger className="h-8 font-mono text-xs bg-surface-02 border-border-default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono">
                  {Object.entries(PRESET_TOPOLOGIES).map(([k, top]) => (
                    <SelectItem key={k} value={k}>
                      {top.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border-subtle font-mono text-xs text-text-muted">
            <span>Nodes: <strong className="text-foreground">{topology.nodes.length}</strong></span>
            <span>Edges: <strong className="text-foreground">{topology.edges.length}</strong></span>
            <span>Revision: <span className="text-text-disabled">{report.graphRevision}</span></span>
            <span>Engine Time: <strong className="text-emerald-400">{report.metrics.executionTimeMs}ms</strong></span>
          </div>
        </div>

        {/* Assessment Score Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Overall Score */}
          <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-1.5 flex flex-col justify-between">
            <span className="font-mono text-xs text-text-muted uppercase">Overall Health</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-foreground">
                {report.overallScore !== null ? report.overallScore : "N/A"}
              </span>
              <span className="text-xs font-mono text-text-muted">/ 100</span>
              <Badge
                variant="outline"
                className="font-mono text-xs ml-auto border-border-default uppercase"
              >
                Grade {report.overallGrade}
              </Badge>
            </div>
            <span className="text-[10px] font-mono text-text-disabled">
              Status: {report.status}
            </span>
          </div>

          {/* Finding Counts */}
          <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-1.5 flex flex-col justify-between">
            <span className="font-mono text-xs text-text-muted uppercase">Health Findings</span>
            <div className="text-2xl font-bold font-mono text-foreground">
              {report.allFindings.length} Total
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-rose-400">
                {report.allFindings.filter((f) => f.severity === "critical").length} Crit
              </span>
              <span className="text-amber-400">
                {report.allFindings.filter((f) => f.severity === "high").length} High
              </span>
              <span className="text-text-muted">
                {report.allFindings.filter((f) => f.severity === "medium").length} Med
              </span>
            </div>
          </div>

          {/* Topology Algorithms */}
          <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-1.5 flex flex-col justify-between">
            <span className="font-mono text-xs text-text-muted uppercase">Graph Invariants</span>
            <div className="space-y-0.5 font-mono text-xs text-text-secondary">
              <div>Articulation Points (SPOFs): <strong>{report.metrics.articulationPointsCount}</strong></div>
              <div>Cycles Detected: <strong>{report.metrics.cyclesDetectedCount}</strong></div>
              <div>Critical Paths: <strong>{report.metrics.criticalPathsCount}</strong></div>
            </div>
            <span className="text-[10px] font-mono text-text-disabled">Tarjan & Hopcroft-Tarjan</span>
          </div>

          {/* Validation Engine Status */}
          <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-1.5 flex flex-col justify-between">
            <span className="font-mono text-xs text-text-muted uppercase">Phase 05.3.1 Validation</span>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-sm font-semibold text-foreground">
                {report.validationPassed ? "Validated" : "Issues Found"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-text-disabled">
              {report.validationErrorsCount} schema/port errors
            </span>
          </div>
        </div>

        {/* 6 Dimensions Breakdown */}
        <div className="space-y-2">
          <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wider">
            Dimension Health Breakdown (6 Analyzers)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(report.dimensions).map(([dimKey, dim]) => (
              <div
                key={dimKey}
                className="p-3 rounded-md border border-border-default bg-surface-01 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold uppercase text-foreground">
                    {dim.dimension}
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] border-border-subtle uppercase"
                  >
                    Grade {dim.grade} · {dim.score !== null ? `${dim.score}/100` : "N/A"}
                  </Badge>
                </div>

                <p className="font-sans text-[11px] text-text-secondary leading-relaxed">
                  {dim.summary}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-border-subtle font-mono text-[10px] text-text-disabled">
                  <span>Coverage: {dim.evidenceCoveragePercent}%</span>
                  <span>{dim.findings.length} findings</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Findings Inspection */}
        <div className="space-y-2">
          <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wider">
            Active Findings for Selected Topology ({report.allFindings.length})
          </h2>

          {report.allFindings.length === 0 ? (
            <div className="p-6 rounded-md border border-border-default bg-surface-01 text-center font-mono text-xs text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-4 h-4" />
              Zero architectural health violations or vulnerability risks detected.
            </div>
          ) : (
            <div className="space-y-2">
              {report.allFindings.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-md border border-border-default bg-surface-01 space-y-1.5"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase ${
                          f.severity === "critical"
                            ? "text-rose-400 border-rose-900/60"
                            : f.severity === "high"
                              ? "text-amber-400 border-amber-900/60"
                              : "text-text-muted border-border-subtle"
                        }`}
                      >
                        {f.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] uppercase border-border-subtle">
                        {f.dimension}
                      </Badge>
                      <span className="font-semibold text-foreground">{f.title}</span>
                    </div>
                    <span className="text-text-disabled">{f.ruleId}</span>
                  </div>

                  <p className="font-sans text-xs text-text-secondary leading-relaxed">
                    {f.explanation}
                  </p>

                  {f.assumptions.length > 0 && (
                    <div className="text-[11px] font-sans text-text-muted">
                      Assumption: {f.assumptions[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rule Registry Matrix */}
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wider">
            Registered Health Rules ({allRules.length})
          </h2>
          <div className="rounded-md border border-border-default overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-surface-02 border-b border-border-default text-text-muted">
                <tr>
                  <th className="p-2.5">Rule ID</th>
                  <th className="p-2.5">Dimension</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Rule Name</th>
                  <th className="p-2.5">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-01">
                {allRules.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-02 transition-colors">
                    <td className="p-2.5 font-semibold text-foreground">{r.id}</td>
                    <td className="p-2.5 uppercase text-text-secondary">{r.dimension}</td>
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-[9px] uppercase border-border-subtle">
                        {r.defaultSeverity}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-foreground">{r.name}</td>
                    <td className="p-2.5 font-sans text-[11px] text-text-muted">{r.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations Registry Matrix */}
        <div className="space-y-2 pt-4">
          <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wider">
            Registered Actionable Recommendations ({allRecs.length})
          </h2>
          <div className="rounded-md border border-border-default overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-surface-02 border-b border-border-default text-text-muted">
                <tr>
                  <th className="p-2.5">Recommendation ID</th>
                  <th className="p-2.5">Dimension</th>
                  <th className="p-2.5">Impact</th>
                  <th className="p-2.5">Title</th>
                  <th className="p-2.5">Actionable Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-01">
                {allRecs.map((rec) => (
                  <tr key={rec.id} className="hover:bg-surface-02 transition-colors">
                    <td className="p-2.5 font-semibold text-foreground">{rec.id}</td>
                    <td className="p-2.5 uppercase text-text-secondary">{rec.dimension}</td>
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-[9px] uppercase border-border-subtle">
                        {rec.impact}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-foreground">{rec.title}</td>
                    <td className="p-2.5 font-sans text-[11px] text-text-muted">{rec.actionableStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
