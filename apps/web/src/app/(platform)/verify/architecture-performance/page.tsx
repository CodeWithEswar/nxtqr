"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { PerformanceWorkspace } from "@/features/system-design/performance";
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
  flash_sale: {
    id: "flash_sale",
    title: "Scenario 1: E-Commerce Flash Sale (Open-Loop Arrival Rate Spike Test)",
    subtitle:
      "Simulates sudden 1,800 RPS arrival rate spike, evaluates queue backlog accumulation, and isolates dropped iterations under target database saturation.",
    badge: "Open-Loop Spike Test",
    nodes: [
      {
        id: "api_gw",
        type: "api_gateway",
        position: { x: 50, y: 150 },
        data: { label: "Ingress Gateway", componentType: "api_gateway", replicas: 4, latencyMs: 8 },
      },
      {
        id: "catalog_service",
        type: "service",
        position: { x: 300, y: 80 },
        data: { label: "Catalog Service", componentType: "service", replicas: 4, latencyMs: 18 },
      },
      {
        id: "order_service",
        type: "service",
        position: { x: 300, y: 220 },
        data: { label: "Order Service", componentType: "service", replicas: 6, latencyMs: 35 },
      },
      {
        id: "postgres_primary",
        type: "database",
        position: { x: 560, y: 220 },
        data: { label: "PostgreSQL Primary", componentType: "database", replicas: 1, latencyMs: 25 },
      },
      {
        id: "redis_cache",
        type: "cache",
        position: { x: 560, y: 80 },
        data: { label: "Redis Cluster", componentType: "cache", replicas: 3, latencyMs: 2 },
      },
    ],
    edges: [
      { id: "e1", source: "api_gw", target: "catalog_service", data: { protocol: "HTTP/REST" } },
      { id: "e2", source: "api_gw", target: "order_service", data: { protocol: "HTTP/REST" } },
      { id: "e3", source: "catalog_service", target: "redis_cache", data: { protocol: "Redis" } },
      { id: "e4", source: "order_service", target: "postgres_primary", data: { protocol: "Postgres" } },
    ],
  },

  regression_load: {
    id: "regression_load",
    title: "Scenario 2: Microservices Baseline vs Candidate (Closed-Loop Concurrency Load Test)",
    subtitle:
      "Evaluates 250 concurrent VUs across deployment revisions, detecting +84ms P95 latency regression and -15% throughput degradation.",
    badge: "Closed-Loop Regression",
    nodes: [
      {
        id: "ingress_gw",
        type: "api_gateway",
        position: { x: 50, y: 140 },
        data: { label: "Ingress Gateway", componentType: "api_gateway", replicas: 3, latencyMs: 6 },
      },
      {
        id: "checkout_service",
        type: "service",
        position: { x: 280, y: 80 },
        data: { label: "Checkout Service", componentType: "service", replicas: 4, latencyMs: 22 },
      },
      {
        id: "inventory_service",
        type: "service",
        position: { x: 280, y: 220 },
        data: { label: "Inventory Service", componentType: "service", replicas: 3, latencyMs: 15 },
      },
      {
        id: "payment_service",
        type: "service",
        position: { x: 520, y: 80 },
        data: { label: "Payment Gateway", componentType: "service", replicas: 2, latencyMs: 60 },
      },
      {
        id: "cockroach_db",
        type: "database",
        position: { x: 520, y: 220 },
        data: { label: "CockroachDB Cluster", componentType: "database", replicas: 5, latencyMs: 18 },
      },
    ],
    edges: [
      { id: "e1", source: "ingress_gw", target: "checkout_service", data: { protocol: "gRPC" } },
      { id: "e2", source: "ingress_gw", target: "inventory_service", data: { protocol: "HTTP/REST" } },
      { id: "e3", source: "checkout_service", target: "payment_service", data: { protocol: "HTTPS" } },
      { id: "e4", source: "checkout_service", target: "cockroach_db", data: { protocol: "Postgres" } },
      { id: "e5", source: "inventory_service", target: "cockroach_db", data: { protocol: "Postgres" } },
    ],
  },

  soak_test: {
    id: "soak_test",
    title: "Scenario 3: Sustained Soak Test (24h Memory Leak & Queue Degradation Analysis)",
    subtitle:
      "Models continuous 850 RPS steady load to evaluate connection pool leaks, garbage collection pauses, and long-tail latency drift.",
    badge: "24h Soak Test",
    nodes: [
      {
        id: "edge_proxy",
        type: "api_gateway",
        position: { x: 50, y: 140 },
        data: { label: "Edge Proxy", componentType: "api_gateway", replicas: 4, latencyMs: 5 },
      },
      {
        id: "ingestion_service",
        type: "service",
        position: { x: 260, y: 140 },
        data: { label: "Event Ingestion", componentType: "service", replicas: 6, latencyMs: 12 },
      },
      {
        id: "kafka_bus",
        type: "queue",
        position: { x: 480, y: 140 },
        data: { label: "Kafka Event Cluster", componentType: "queue", replicas: 3, latencyMs: 8 },
      },
      {
        id: "stream_worker",
        type: "service",
        position: { x: 700, y: 140 },
        data: { label: "Stream Consumer", componentType: "service", replicas: 8, latencyMs: 25 },
      },
      {
        id: "clickhouse_db",
        type: "database",
        position: { x: 920, y: 140 },
        data: { label: "ClickHouse Warehouse", componentType: "database", replicas: 2, latencyMs: 40 },
      },
    ],
    edges: [
      { id: "e1", source: "edge_proxy", target: "ingestion_service", data: { protocol: "HTTP/2" } },
      { id: "e2", source: "ingestion_service", target: "kafka_bus", data: { protocol: "Kafka" } },
      { id: "e3", source: "kafka_bus", target: "stream_worker", data: { protocol: "Kafka" } },
      { id: "e4", source: "stream_worker", target: "clickhouse_db", data: { protocol: "Native" } },
    ],
  },
};

export default function ArchitecturePerformanceVerifyPage() {
  const [activeScenarioId, setActiveScenarioId] = React.useState<string>("flash_sale");
  const activeScenario = VERIFY_SCENARIOS[activeScenarioId] || VERIFY_SCENARIOS.flash_sale;

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
            Phase 05.3.17: Architecture Performance Benchmarking &amp; Load Testing Planner
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
            Zero White Borders
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            Safe k6 Generator
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
              Performance Verification Scenarios
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

      {/* 3. Interactive Performance Workspace */}
      <main className="flex-1 min-h-0 relative">
        <PerformanceWorkspace
          key={activeScenario.id}
          nodes={activeScenario.nodes}
          edges={activeScenario.edges}
          architectureId={`verify-arch-${activeScenario.id}`}
          projectId="verify-proj-performance"
        />
      </main>
    </div>
  );
}
