"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { ObservabilityWorkspace } from "@/features/system-design/observability";
import { Badge } from "@nxtqr/ui";
import {
  ActivityIcon,
  CheckIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";

interface VerifyScenarioData {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

const VERIFY_SCENARIOS: Record<string, VerifyScenarioData> = {
  high_traffic: {
    id: "high_traffic",
    title: "Scenario 1: High-Traffic Microservices Ingress (Prometheus Metrics)",
    subtitle:
      "Evaluates 1,250 RPS live ingress throughput, P95 latency baseline (24ms), 42% CPU saturation, and 99.98% SLO error-budget compliance.",
    badge: "Prometheus Telemetry",
    nodes: [
      {
        id: "api_gateway",
        type: "api_gateway",
        position: { x: 50, y: 150 },
        data: { label: "Ingress Gateway", componentType: "api_gateway", replicas: 4 },
      },
      {
        id: "order_service",
        type: "service",
        position: { x: 300, y: 80 },
        data: { label: "Order Service", componentType: "service", replicas: 3 },
      },
      {
        id: "inventory_service",
        type: "service",
        position: { x: 300, y: 220 },
        data: { label: "Inventory Service", componentType: "service", replicas: 2 },
      },
      {
        id: "postgres_db",
        type: "database",
        position: { x: 560, y: 80 },
        data: { label: "PostgreSQL Primary", componentType: "database", replicas: 1 },
      },
      {
        id: "redis_cache",
        type: "cache",
        position: { x: 560, y: 220 },
        data: { label: "Redis Cluster", componentType: "cache", replicas: 3 },
      },
    ],
    edges: [
      { id: "e1", source: "api_gateway", target: "order_service", data: { protocol: "HTTP/REST" } },
      { id: "e2", source: "api_gateway", target: "inventory_service", data: { protocol: "HTTP/REST" } },
      { id: "e3", source: "order_service", target: "postgres_db", data: { protocol: "Postgres" } },
      { id: "e4", source: "inventory_service", target: "redis_cache", data: { protocol: "Redis" } },
    ],
  },

  distributed_trace: {
    id: "distributed_trace",
    title: "Scenario 2: Distributed Checkout Trace with Payment Degradation (OTel)",
    subtitle:
      "Captures distributed trace spans across 3 service hops with critical path latency (480ms) and correlated log errors during checkout persistence.",
    badge: "OpenTelemetry Traces & Logs",
    nodes: [
      {
        id: "api_gateway",
        type: "api_gateway",
        position: { x: 60, y: 140 },
        data: { label: "API Gateway", componentType: "api_gateway" },
      },
      {
        id: "checkout_service",
        type: "service",
        position: { x: 300, y: 80 },
        data: { label: "Checkout Service", componentType: "service" },
      },
      {
        id: "payment_service",
        type: "service",
        position: { x: 300, y: 220 },
        data: { label: "Payment Gateway", componentType: "service" },
      },
      {
        id: "postgres_db",
        type: "database",
        position: { x: 560, y: 150 },
        data: { label: "PostgreSQL Primary", componentType: "database" },
      },
    ],
    edges: [
      { id: "e1", source: "api_gateway", target: "checkout_service", data: { protocol: "HTTP/REST" } },
      { id: "e2", source: "checkout_service", target: "payment_service", data: { protocol: "gRPC" } },
      { id: "e3", source: "checkout_service", target: "postgres_db", data: { protocol: "Postgres" } },
    ],
  },

  topology_drift: {
    id: "topology_drift",
    title: "Scenario 3: Production Topology Drift & Model Calibration Discrepancy",
    subtitle:
      "Detects shadow production dependency calls unmodeled in architecture diagram, and flags +183% throughput divergence requiring capacity calibration.",
    badge: "Topology Drift & Calibration",
    nodes: [
      {
        id: "api_gateway",
        type: "api_gateway",
        position: { x: 50, y: 140 },
        data: { label: "API Gateway", componentType: "api_gateway" },
      },
      {
        id: "order_service",
        type: "service",
        position: { x: 280, y: 140 },
        data: { label: "Order Service", componentType: "service" },
      },
      {
        id: "postgres_db",
        type: "database",
        position: { x: 520, y: 140 },
        data: { label: "PostgreSQL Primary", componentType: "database" },
      },
    ],
    edges: [
      { id: "e1", source: "api_gateway", target: "order_service", data: { protocol: "HTTP/REST" } },
      { id: "e2", source: "order_service", target: "postgres_db", data: { protocol: "Postgres" } },
    ],
  },
};

export default function ArchitectureObservabilityVerifyPage() {
  const [activeScenarioId, setActiveScenarioId] = React.useState<string>("high_traffic");
  const activeScenario = VERIFY_SCENARIOS[activeScenarioId] || VERIFY_SCENARIOS.high_traffic;

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden select-none">
      {/* 1. Global Navigation Bar */}
      <nav className="flex items-center justify-between px-4 py-2 bg-[#080808] border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Link
            href="/verify"
            className="text-xs font-mono text-[#858585] hover:text-white transition-colors"
          >
            Verification Testbeds
          </Link>
          <ChevronRightIcon className="w-3 h-3 text-[#666666]" />
          <span className="text-xs font-bold text-white tracking-tight">
            Phase 05.3.16: Architecture Observability &amp; Telemetry Mapping
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono uppercase bg-[#141414] border-[#262626] text-emerald-400"
          >
            Production Ready
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#858585]">
          <span className="flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            SSRF Gateway Active
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            Strict Data Provenance
          </span>
        </div>
      </nav>

      {/* 2. Scenario Switcher Header */}
      <section className="flex flex-col gap-2 p-3 bg-[#0D0D0D] border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Telemetry Verification Scenarios
            </span>
          </div>

          <div className="flex items-center gap-2">
            {Object.values(VERIFY_SCENARIOS).map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveScenarioId(sc.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all border ${
                  activeScenarioId === sc.id
                    ? "bg-[#262626] border-[#404040] text-white shadow-level-1"
                    : "bg-[#141414] border-[#262626] text-[#858585] hover:text-white hover:border-[#333333]"
                }`}
              >
                {sc.title.split(":")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#B5B5B5]">
          <p>{activeScenario.subtitle}</p>
          <span className="px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] font-mono text-[10px] text-white">
            {activeScenario.badge}
          </span>
        </div>
      </section>

      {/* 3. Interactive Observability Workspace */}
      <main className="flex-1 min-h-0 relative">
        <ObservabilityWorkspace
          key={activeScenario.id}
          nodes={activeScenario.nodes}
          edges={activeScenario.edges}
          architectureId={`verify-arch-${activeScenario.id}`}
          projectId="verify-proj-observability"
        />
      </main>
    </div>
  );
}
