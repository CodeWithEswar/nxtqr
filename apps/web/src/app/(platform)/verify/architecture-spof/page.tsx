"use client";

import * as React from "react";
import Link from "next/link";
import {
  failureAnalysisEngine,
  type FailureAnalysisReport,
  type FailureFinding,
  type HealthSeverity,
  FAILURE_RECOMMENDATION_REGISTRY,
} from "@nxtqr/architecture-intelligence";
import {
  ShieldIcon,
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
import { BlastRadiusExplorer } from "@/features/system-design/failure-analysis/components/blast-radius-explorer";

const PRESET_TOPOLOGIES: Record<
  string,
  { name: string; description: string; nodes: BaseNode[]; edges: BaseEdge[] }
> = {
  classic_spof: {
    name: "Classic Single Point of Failure",
    description: "Single-instance API gateway, single compute container, and non-replicated database creating cut-vertices.",
    nodes: [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "api_gw", type: "api-gateway", position: { x: 120, y: 0 }, data: { replicas: 1, multiAz: false } },
      { id: "monolith_svc", type: "container-service", position: { x: 260, y: 0 }, data: { replicas: 1 } },
      { id: "primary_db", type: "relational-database", position: { x: 400, y: 0 }, data: { multiAz: false, readReplicas: 0 } },
    ],
    edges: [
      { id: "e1", source: "client", target: "api_gw", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "api_gw", target: "monolith_svc", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "monolith_svc", target: "primary_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
  shared_dependency_trap: {
    name: "Shared Dependency Across Replicas",
    description: "Two horizontally scaled services both depending on a single non-replicated database instance.",
    nodes: [
      { id: "client", type: "web-browser", position: { x: 0, y: 0 }, data: {} },
      { id: "svc_order", type: "container-service", position: { x: 180, y: -50 }, data: { replicas: 3 } },
      { id: "svc_billing", type: "container-service", position: { x: 180, y: 50 }, data: { replicas: 3 } },
      { id: "shared_db", type: "relational-database", position: { x: 380, y: 0 }, data: { multiAz: false, readReplicas: 0 } },
    ],
    edges: [
      { id: "e1", source: "client", target: "svc_order", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "client", target: "svc_billing", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "svc_order", target: "shared_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
      { id: "e4", source: "svc_billing", target: "shared_db", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
  correlated_zone_risk: {
    name: "Correlated Availability Zone Risk",
    description: "Multiple replicas deployed within the identical Availability Zone (us-east-1a) susceptible to datacenter-wide outage.",
    nodes: [
      {
        id: "replica_1",
        type: "container-service",
        position: { x: 150, y: -40 },
        data: { redundancyGroupId: "rg_checkout", redundancyGroupName: "Checkout Service", availabilityZone: "us-east-1a" },
      },
      {
        id: "replica_2",
        type: "container-service",
        position: { x: 150, y: 40 },
        data: { redundancyGroupId: "rg_checkout", redundancyGroupName: "Checkout Service", availabilityZone: "us-east-1a" },
      },
      { id: "database", type: "relational-database", position: { x: 350, y: 0 }, data: { multiAz: true } },
    ],
    edges: [
      { id: "e1", source: "replica_1", target: "database", data: { protocol: "SQL", relationshipKind: "database-access" } },
      { id: "e2", source: "replica_2", target: "database", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
  unautomated_failover: {
    name: "Unautomated Failover Gap",
    description: "Primary database with read replicas where failover mode is manual, requiring human intervention during an outage.",
    nodes: [
      { id: "service", type: "container-service", position: { x: 100, y: 0 }, data: { replicas: 2 } },
      {
        id: "db_cluster",
        type: "relational-database",
        position: { x: 300, y: 0 },
        data: { readReplicas: 2, multiAz: false, failoverMode: "manual" },
      },
    ],
    edges: [
      { id: "e1", source: "service", target: "db_cluster", data: { protocol: "SQL", relationshipKind: "database-access" } },
    ],
  },
  resilient_architecture: {
    name: "High Availability Resilient Architecture",
    description: "Multi-zone load balancer, multi-instance compute tiers, multi-AZ database with automatic failover, and decoupled queues.",
    nodes: [
      { id: "dns_edge", type: "dns-routing", position: { x: 0, y: 0 }, data: { highAvailability: true } },
      { id: "load_balancer", type: "load-balancer", position: { x: 140, y: 0 }, data: { replicas: 2, multiAz: true, healthChecksEnabled: true } },
      { id: "api_tier", type: "container-service", position: { x: 280, y: 0 }, data: { replicas: 4, availabilityZones: ["zone-a", "zone-b"], healthChecksEnabled: true } },
      { id: "message_queue", type: "message-queue", position: { x: 420, y: -60 }, data: { isClustered: true, highAvailability: true } },
      { id: "db_ha", type: "relational-database", position: { x: 420, y: 60 }, data: { multiAz: true, failoverMode: "automatic", readReplicas: 2 } },
    ],
    edges: [
      { id: "e1", source: "dns_edge", target: "load_balancer", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e2", source: "load_balancer", target: "api_tier", data: { protocol: "HTTPS", relationshipKind: "request-response" } },
      { id: "e3", source: "api_tier", target: "message_queue", data: { protocol: "AMQP", relationshipKind: "event-delivery" } },
      { id: "e4", source: "api_tier", target: "db_ha", data: { protocol: "SQL", relationshipKind: "database-access" } },
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

export default function ArchitectureSPOFVerificationPage() {
  const [selectedTopologyKey, setSelectedTopologyKey] = React.useState<string>("classic_spof");
  const [selectedBlastNodeId, setSelectedBlastNodeId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("findings");

  const topology = PRESET_TOPOLOGIES[selectedTopologyKey];

  const report: FailureAnalysisReport = React.useMemo(() => {
    return failureAnalysisEngine.analyzeGraph(topology.nodes, topology.edges);
  }, [topology]);

  const activeBlastProfile = React.useMemo(() => {
    const targetId = selectedBlastNodeId || topology.nodes[1]?.id || topology.nodes[0]?.id;
    if (!targetId) return null;
    return report.blastRadiusProfiles[targetId] || null;
  }, [selectedBlastNodeId, topology, report]);

  return (
    <div className="min-h-screen bg-surface-00 text-foreground font-sans p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] font-mono uppercase border-border-default text-text-secondary">
              Phase 05.3.4 Verification
            </Badge>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-text-muted text-xs font-mono">Architecture Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldIcon className="w-6 h-6 text-foreground" />
            Single Point of Failure (SPOF) Detection Engine
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl leading-relaxed">
            Deterministic dependency analysis, shared failure domain correlation, automated failover verification, and blast radius calculation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/verify/architecture-bottlenecks">
            <Button variant="outline" size="sm" className="h-8 font-mono text-xs border-border-default bg-surface-02">
              Bottleneck Engine
            </Button>
          </Link>
          <Link href="/verify/architecture-health">
            <Button variant="outline" size="sm" className="h-8 font-mono text-xs border-border-default bg-surface-02">
              Health Analysis
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. Topology Selector */}
      <div className="p-3.5 rounded-md bg-surface-01 border border-border-default space-y-2">
        <label className="text-xs font-mono text-text-muted uppercase tracking-wider block">
          Select Failure Topology Preset
        </label>
        <Select value={selectedTopologyKey} onValueChange={(val) => {
          setSelectedTopologyKey(val);
          setSelectedBlastNodeId(null);
        }}>
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

      {/* 3. Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">SPOFs Detected</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span>{report.metrics.spofCount}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] h-4 px-1 rounded uppercase",
                report.metrics.spofCount > 0
                  ? "border-rose-900/60 text-rose-400 bg-rose-950/20"
                  : "border-border-default text-emerald-400 bg-emerald-950/20"
              )}
            >
              {report.metrics.spofCount > 0 ? "Vulnerable" : "Resilient"}
            </Badge>
          </div>
        </div>

        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Shared Dependency Risks</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span>{report.metrics.sharedDependencyRisksCount}</span>
            <span className="text-[10px] text-text-muted font-normal">
              {report.metrics.failureDomainRisksCount} Zone Risks
            </span>
          </div>
        </div>

        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Failover Gaps</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span>{report.metrics.failoverGapsCount}</span>
            <span className="text-[10px] text-text-muted font-normal">
              {Object.keys(report.redundancyGroups).length} Groups
            </span>
          </div>
        </div>

        <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1">
          <span className="text-[10px] text-text-muted uppercase">Engine Execution</span>
          <div className="text-xl font-bold text-foreground flex items-center justify-between">
            <span>{report.metrics.executionTimeMs} ms</span>
            <span className="text-[10px] text-text-muted font-normal">
              {report.metrics.totalComponents} Nodes
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tabbed Investigation Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-surface-01 border border-border-default p-0.5 rounded-md">
          <TabsTrigger
            value="findings"
            className="text-xs font-mono data-[state=active]:bg-surface-03 data-[state=active]:text-foreground"
          >
            Findings & Explanations ({report.findings.length})
          </TabsTrigger>
          <TabsTrigger
            value="blast"
            className="text-xs font-mono data-[state=active]:bg-surface-03 data-[state=active]:text-foreground"
          >
            Blast Radius Explorer
          </TabsTrigger>
          <TabsTrigger
            value="redundancy"
            className="text-xs font-mono data-[state=active]:bg-surface-03 data-[state=active]:text-foreground"
          >
            Redundancy & Domains ({Object.keys(report.redundancyGroups).length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FINDINGS */}
        <TabsContent value="findings" className="space-y-3 m-0">
          {report.findings.length === 0 ? (
            <div className="p-8 rounded-md bg-surface-01 border border-border-default text-center space-y-2">
              <div className="w-8 h-8 rounded-md bg-surface-02 border border-border-default flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">Zero Single Points of Failure Detected</h4>
              <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                All components are backed by multi-instance redundancy groups, independent failure domains, and automated failover policies.
              </p>
            </div>
          ) : (
            report.findings.map((f: FailureFinding) => {
              const style = SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.medium;
              const Icon = style.icon;
              const recs = (f.recommendationIds || [])
                .map((id) => FAILURE_RECOMMENDATION_REGISTRY[id])
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
                            {f.classification.replace(/-/g, " ")}
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

                  {/* Recommendations */}
                  {recs.length > 0 && (
                    <div className="pl-6 space-y-1.5">
                      <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                        Actionable Architecture Remediations & Trade-Offs
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

        {/* TAB 2: BLAST RADIUS */}
        <TabsContent value="blast" className="m-0">
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
            <h4 className="font-sans font-semibold text-sm text-foreground">
              Interactive Blast Radius Simulation
            </h4>
            <BlastRadiusExplorer
              nodes={topology.nodes}
              activeProfile={activeBlastProfile}
              capabilities={report.capabilities}
              onSelectNode={(nodeId) => setSelectedBlastNodeId(nodeId)}
            />
          </div>
        </TabsContent>

        {/* TAB 3: REDUNDANCY GROUPS */}
        <TabsContent value="redundancy" className="space-y-3 m-0 font-mono text-xs">
          {Object.keys(report.redundancyGroups).length === 0 ? (
            <div className="p-8 rounded-md bg-surface-01 border border-border-default text-center text-text-muted font-sans">
              No multi-instance redundancy groups or clusters modeled in this topology.
            </div>
          ) : (
            Object.values(report.redundancyGroups).map((group) => (
              <div
                key={group.groupId}
                className="p-3.5 rounded-md bg-surface-01 border border-border-default space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{group.name}</span>
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {group.mode.replace(/-/g, " ")} ({group.effectiveReplicas}x Replicas)
                  </Badge>
                </div>
                <div className="text-[11px] text-text-secondary space-y-1">
                  <div>Failover Mode: <strong className="text-foreground">{group.failoverMode}</strong></div>
                  <div>State Sync: <strong className="text-foreground">{group.stateSync}</strong></div>
                  <div>Deployment Domains: <span className="text-text-muted">{group.deploymentDomains.join(", ") || "Single Zone"}</span></div>
                  <div>Health Checks: <strong className={group.healthCheckConfigured ? "text-emerald-400" : "text-amber-400"}>{group.healthCheckConfigured ? "Configured" : "None"}</strong></div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
