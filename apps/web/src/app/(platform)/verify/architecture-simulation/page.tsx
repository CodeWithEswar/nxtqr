"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { FailureScenario } from "@nxtqr/architecture-intelligence";
import { SIMULATION_PRESETS } from "@nxtqr/architecture-intelligence";
import { SimulationWorkspace } from "@/features/system-design/simulation";
import { Badge } from "@nxtqr/ui";
import { ActivityIcon, ShieldIcon, DatabaseIcon, CpuIcon } from "@nxtqr/icons";

interface VerifyScenarioData {
  id: string;
  title: string;
  subtitle: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  scenario: FailureScenario;
}

const VERIFY_SCENARIOS: Record<string, VerifyScenarioData> = {
  db_crash: {
    id: "db_crash",
    title: "Scenario 1: Primary Database Crash & Replica Failover",
    subtitle: "Simulates sudden database node termination, evaluates failover delay, upstream service degradation, and Checkout journey downtime.",
    nodes: [
      {
        id: "api_gw",
        type: "api_gateway",
        position: { x: 50, y: 150 },
        data: { label: "Public Ingress Gateway", componentType: "api_gateway", replicas: 2 },
      },
      {
        id: "order_svc",
        type: "service",
        position: { x: 300, y: 100 },
        data: { label: "Order & Checkout Service", componentType: "service", replicas: 3 },
      },
      {
        id: "inventory_svc",
        type: "service",
        position: { x: 300, y: 220 },
        data: { label: "Inventory Catalog Service", componentType: "service", replicas: 2 },
      },
      {
        id: "postgres_primary",
        type: "database",
        position: { x: 580, y: 100 },
        data: { label: "PostgreSQL Primary (Aurora)", componentType: "database", replicas: 1 },
      },
      {
        id: "redis_cache",
        type: "cache",
        position: { x: 580, y: 220 },
        data: { label: "Redis Cluster (Cache)", componentType: "cache", replicas: 2 },
      },
    ],
    edges: [
      { id: "e1", source: "api_gw", target: "order_svc", data: { protocol: "HTTP/REST" } },
      { id: "e2", source: "api_gw", target: "inventory_svc", data: { protocol: "HTTP/REST" } },
      { id: "e3", source: "order_svc", target: "postgres_primary", data: { protocol: "PostgreSQL Wire" } },
      { id: "e4", source: "inventory_svc", target: "redis_cache", data: { protocol: "RESP" } },
    ],
    scenario: SIMULATION_PRESETS.primary_database_outage.buildScenario({
      architectureId: "arch-verify-db",
      graphRevision: "rev-2026.11.11",
      targetNodeId: "postgres_primary",
      targetNodeLabel: "PostgreSQL Primary (Aurora)",
      criticalJourneys: [
        {
          id: "j_checkout",
          name: "Customer Checkout Journey",
          description: "End-to-end cart checkout and order persistence",
          entryNodeId: "api_gw",
          requiredNodeIds: ["api_gw", "order_svc", "postgres_primary"],
          criticality: "critical",
        },
        {
          id: "j_browse",
          name: "Product Catalog Browsing",
          description: "Catalog browsing served via fast cache",
          entryNodeId: "api_gw",
          requiredNodeIds: ["api_gw", "inventory_svc"],
          optionalNodeIds: ["redis_cache"],
          criticality: "high",
        },
      ],
    }),
  },

  cache_stampede: {
    id: "cache_stampede",
    title: "Scenario 2: Redis Cache Outage & Database Stampede",
    subtitle: "Simulates sudden cache cluster evictions causing 100% read requests to stampede directly into the primary database.",
    nodes: [
      {
        id: "ingress_alb",
        type: "api_gateway",
        position: { x: 50, y: 150 },
        data: { label: "AWS ALB Gateway", replicas: 2 },
      },
      {
        id: "catalog_svc",
        type: "service",
        position: { x: 300, y: 150 },
        data: { label: "Catalog Microservice", replicas: 4 },
      },
      {
        id: "redis_store",
        type: "cache",
        position: { x: 560, y: 80 },
        data: { label: "Redis Cluster (L2 Cache)", replicas: 1 },
      },
      {
        id: "backend_db",
        type: "database",
        position: { x: 560, y: 220 },
        data: { label: "Postgres RDS Storage", replicas: 1 },
      },
    ],
    edges: [
      { id: "e1", source: "ingress_alb", target: "catalog_svc", data: { protocol: "HTTPS" } },
      { id: "e2", source: "catalog_svc", target: "redis_store", data: { protocol: "RESP" } },
      { id: "e3", source: "catalog_svc", target: "backend_db", data: { protocol: "PostgreSQL" } },
    ],
    scenario: SIMULATION_PRESETS.cache_outage.buildScenario({
      architectureId: "arch-verify-cache",
      graphRevision: "rev-2026.11.11",
      targetNodeId: "redis_store",
      targetNodeLabel: "Redis Cluster (L2 Cache)",
      secondaryNodeId: "backend_db",
      criticalJourneys: [
        {
          id: "j_catalog",
          name: "Product Browsing Flow",
          description: "Customer reading catalog items",
          entryNodeId: "ingress_alb",
          requiredNodeIds: ["ingress_alb", "catalog_svc"],
          optionalNodeIds: ["redis_store", "backend_db"],
          criticality: "high",
        },
      ],
    }),
  },

  external_timeout: {
    id: "external_timeout",
    title: "Scenario 3: Payment Gateway Timeout & Circuit Breaker Isolation",
    subtitle: "Simulates third-party Stripe API hanging, evaluating whether configured circuit breakers open and fast-fail to preserve core order ingestion.",
    nodes: [
      {
        id: "mobile_api_gw",
        type: "api_gateway",
        position: { x: 50, y: 150 },
        data: { label: "Mobile API Gateway", replicas: 2 },
      },
      {
        id: "billing_svc",
        type: "service",
        position: { x: 300, y: 150 },
        data: { label: "Billing Microservice", replicas: 3 },
      },
      {
        id: "stripe_api",
        type: "service",
        position: { x: 580, y: 150 },
        data: { label: "Third-Party Payment Gateway", replicas: 1 },
      },
    ],
    edges: [
      { id: "e1", source: "mobile_api_gw", target: "billing_svc", data: { protocol: "HTTPS" } },
      { id: "e2", source: "billing_svc", target: "stripe_api", data: { protocol: "HTTPS / REST" } },
    ],
    scenario: SIMULATION_PRESETS.external_api_timeout.buildScenario({
      architectureId: "arch-verify-timeout",
      graphRevision: "rev-2026.11.11",
      targetNodeId: "stripe_api",
      targetNodeLabel: "Third-Party Payment Gateway",
      criticalJourneys: [
        {
          id: "j_payment",
          name: "Payment Settlement Flow",
          description: "Authorizing credit card transaction",
          entryNodeId: "mobile_api_gw",
          requiredNodeIds: ["mobile_api_gw", "billing_svc", "stripe_api"],
          criticality: "critical",
        },
      ],
    }),
  },
};

export default function ArchitectureSimulationVerifyPage() {
  const [selectedKey, setSelectedKey] = React.useState<string>("db_crash");
  const activeScenarioData = VERIFY_SCENARIOS[selectedKey];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-border-default bg-surface-01 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1 font-mono">
            <Link href="/verify" className="hover:text-white transition-colors">
              Platform Verification
            </Link>
            <span>/</span>
            <span className="text-white">Phase 05.3.15</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Architecture Simulation & Failure Testing Engine</span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono border-border-subtle bg-surface-02 text-text-secondary">
              Deterministic Replay
            </Badge>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/verify"
            className="px-3 py-1.5 rounded-md border border-border-subtle bg-surface-02 text-xs text-text-secondary hover:text-white hover:bg-surface-03 transition-colors"
          >
            ← Back to All Checks
          </Link>
        </div>
      </div>

      {/* Scenario Switcher Tabs */}
      <div className="border-b border-border-subtle bg-surface-02 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-mono text-text-muted mr-2 flex items-center gap-1">
          <ActivityIcon className="w-3.5 h-3.5" />
          Test Scenarios:
        </span>
        {Object.values(VERIFY_SCENARIOS).map((sc) => (
          <button
            key={sc.id}
            onClick={() => setSelectedKey(sc.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectedKey === sc.id
                ? "bg-surface-04 border border-border-strong text-white font-semibold shadow-level-3"
                : "bg-surface-01 border border-border-subtle text-text-secondary hover:bg-surface-03 hover:border-border-default"
            }`}
          >
            {sc.title.split(":")[0]}
          </button>
        ))}
      </div>

      {/* Scenario Brief Bar */}
      <div className="bg-surface-01 border-b border-border-subtle px-6 py-3">
        <h2 className="text-sm font-semibold text-white">{activeScenarioData.title}</h2>
        <p className="text-xs text-text-muted mt-0.5">{activeScenarioData.subtitle}</p>
      </div>

      {/* Master Interactive Workspace */}
      <div className="flex-1 min-h-[640px] border-b border-border-default">
        <SimulationWorkspace
          key={activeScenarioData.id}
          nodes={activeScenarioData.nodes}
          edges={activeScenarioData.edges}
          initialScenario={activeScenarioData.scenario}
          architectureId={activeScenarioData.scenario.architectureId}
        />
      </div>

      {/* Technical Specifications & Constitution Compliance Card */}
      <div className="p-6 bg-surface-01 space-y-4">
        <h3 className="text-sm font-semibold text-white">Engine Specifications & Architectural Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-surface-02 border border-border-subtle rounded-md space-y-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <ShieldIcon className="w-3.5 h-3.5 text-blue-400" />
              Model-Based Safety Guarantee
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Strictly model-based simulation. Never interacts with production infrastructure, cloud control planes, or real container runtimes. Safe for offline architecture exploration.
            </p>
          </div>

          <div className="p-4 bg-surface-02 border border-border-subtle rounded-md space-y-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <CpuIcon className="w-3.5 h-3.5 text-orange-400" />
              Deterministic Virtual Clock (PRNG)
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              VirtualClock operates in discrete time steps (1,000ms resolution) independent of wall clock. Seeded Mulberry32 PRNG ensures 100% reproducible event queues and jitter replay.
            </p>
          </div>

          <div className="p-4 bg-surface-02 border border-border-subtle rounded-md space-y-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <DatabaseIcon className="w-3.5 h-3.5 text-green-400" />
              Cyclic Convergence & Bounded Propagation
            </span>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Depth-capped traversal (&le;12) with visited node tracking guarantees termination on cyclical microservice graphs. Circuit breakers trip to OPEN, preventing synchronous blocking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
