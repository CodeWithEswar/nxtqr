"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { ReportWorkspace } from "@/features/system-design/reports";
import { Badge } from "@nxtqr/ui";

interface TopologyScenario {
  id: string;
  name: string;
  description: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

const VERIFY_TOPOLOGIES: Record<string, TopologyScenario> = {
  startup_saas: {
    id: "startup_saas",
    name: "Startup SaaS Architecture",
    description: "Cloud ingress ALB with compute web fleet and relational PostgreSQL store.",
    nodes: [
      {
        id: "alb_ingress",
        type: "loadBalancer",
        position: { x: 50, y: 150 },
        data: { label: "Ingress ALB", category: "gateway", tier: "edge", replicas: 2, criticality: "critical" },
      },
      {
        id: "web_service",
        type: "service",
        position: { x: 280, y: 150 },
        data: { label: "Web Service Fleet", category: "compute", tier: "backend", technology: "Next.js / Node", replicas: 4, criticality: "high" },
      },
      {
        id: "postgres_db",
        type: "database",
        position: { x: 520, y: 150 },
        data: { label: "RDS PostgreSQL Primary", category: "database", tier: "storage", technology: "PostgreSQL 16", replicas: 1, criticality: "critical" },
      },
    ],
    edges: [
      { id: "e1", source: "alb_ingress", target: "web_service", data: { protocol: "HTTPS", isSynchronous: true, isEncrypted: true } },
      { id: "e2", source: "web_service", target: "postgres_db", data: { protocol: "PostgreSQL", isSynchronous: true, isEncrypted: true } },
    ],
  },
  ecommerce_multitier: {
    id: "ecommerce_multitier",
    name: "E-Commerce Multi-Tier Microservices",
    description: "Production topology with API gateway, checkout service, Redis cache, Orders DB, and async SQS order processing.",
    nodes: [
      {
        id: "api_gw",
        type: "api_gateway",
        position: { x: 50, y: 150 },
        data: { label: "Kong API Gateway", category: "gateway", tier: "edge", replicas: 3, criticality: "critical" },
      },
      {
        id: "checkout_svc",
        type: "service",
        position: { x: 280, y: 100 },
        data: { label: "Checkout & Order Service", category: "compute", tier: "backend", technology: "Go", replicas: 6, criticality: "critical" },
      },
      {
        id: "redis_cache",
        type: "cache",
        position: { x: 520, y: 60 },
        data: { label: "ElastiCache Redis Cluster", category: "cache", tier: "caching", replicas: 3, criticality: "high" },
      },
      {
        id: "aurora_db",
        type: "database",
        position: { x: 520, y: 160 },
        data: { label: "Aurora PostgreSQL Multi-AZ", category: "database", tier: "storage", replicas: 2, criticality: "critical" },
      },
      {
        id: "sqs_orders",
        type: "queue",
        position: { x: 520, y: 260 },
        data: { label: "SQS Orders FIFO Queue", category: "queue", tier: "messaging", replicas: 1, criticality: "high" },
      },
      {
        id: "fulfillment_worker",
        type: "service",
        position: { x: 760, y: 260 },
        data: { label: "Fulfillment Worker", category: "compute", tier: "worker", technology: "Rust", replicas: 2, criticality: "medium" },
      },
    ],
    edges: [
      { id: "e10", source: "api_gw", target: "checkout_svc", data: { protocol: "gRPC", isSynchronous: true, isEncrypted: true } },
      { id: "e11", source: "checkout_svc", target: "redis_cache", data: { protocol: "Redis", isSynchronous: true, isEncrypted: false } },
      { id: "e12", source: "checkout_svc", target: "aurora_db", data: { protocol: "PostgreSQL", isSynchronous: true, isEncrypted: true } },
      { id: "e13", source: "checkout_svc", target: "sqs_orders", data: { protocol: "HTTPS", isSynchronous: false, isEncrypted: true } },
      { id: "e14", source: "sqs_orders", target: "fulfillment_worker", data: { protocol: "SQS", isSynchronous: false, isEncrypted: true } },
    ],
  },
  global_fintech: {
    id: "global_fintech",
    name: "Global Distributed Fintech Core",
    description: "Highly regulated multi-region payment core with CockroachDB distributed consensus and Kafka event logging.",
    nodes: [
      {
        id: "edge_cdn",
        type: "cdn",
        position: { x: 50, y: 150 },
        data: { label: "Cloudflare Edge CDN", category: "edge", tier: "cdn", replicas: 1, criticality: "critical" },
      },
      {
        id: "ledger_svc",
        type: "service",
        position: { x: 300, y: 150 },
        data: { label: "Transactional Ledger Service", category: "compute", tier: "core", technology: "Java / Spring", replicas: 8, criticality: "critical" },
      },
      {
        id: "cockroach_db",
        type: "database",
        position: { x: 580, y: 100 },
        data: { label: "CockroachDB Multi-Region", category: "database", tier: "persistence", replicas: 9, criticality: "critical" },
      },
      {
        id: "kafka_audit",
        type: "event_stream",
        position: { x: 580, y: 220 },
        data: { label: "Kafka Audit & Compliance Log", category: "streaming", tier: "audit", replicas: 5, criticality: "critical" },
      },
    ],
    edges: [
      { id: "e20", source: "edge_cdn", target: "ledger_svc", data: { protocol: "mTLS", isSynchronous: true, isEncrypted: true } },
      { id: "e21", source: "ledger_svc", target: "cockroach_db", data: { protocol: "PostgreSQL-Wire", isSynchronous: true, isEncrypted: true } },
      { id: "e22", source: "ledger_svc", target: "kafka_audit", data: { protocol: "Kafka-TLS", isSynchronous: false, isEncrypted: true } },
    ],
  },
};

export default function ArchitectureReportsVerifyPage() {
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>("ecommerce_multitier");
  const activeScenario = VERIFY_TOPOLOGIES[selectedScenarioId] || VERIFY_TOPOLOGIES.ecommerce_multitier;

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden">
      {/* Top Verification Suite Header */}
      <div className="h-12 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="text-xs font-mono text-[#858585] hover:text-white transition-colors"
          >
            ← Verification Suites
          </Link>
          <span className="text-[#333333]">|</span>
          <span className="text-xs font-semibold text-white">Phase 05.3.12: Architecture Reports & Documentation</span>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#B5B5B5]">
            11 Engines Integrated
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#B5B5B5]">
            9 Templates
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] text-[#B5B5B5]">
            PDF • MD • HTML • JSON • DOCX
          </Badge>
        </div>

        {/* Topology Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#858585]">Test Topology:</span>
          <div className="flex items-center gap-1 bg-[#0D0D0D] border border-[#262626] rounded-md p-0.5">
            {Object.values(VERIFY_TOPOLOGIES).map((topo) => (
              <button
                key={topo.id}
                type="button"
                onClick={() => setSelectedScenarioId(topo.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors ${
                  selectedScenarioId === topo.id
                    ? "bg-[#1A1A1A] text-white font-medium shadow-sm"
                    : "text-[#858585] hover:text-[#B5B5B5]"
                }`}
              >
                {topo.id === "startup_saas"
                  ? "Startup SaaS"
                  : topo.id === "ecommerce_multitier"
                  ? "E-Commerce"
                  : "Global Fintech"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Report Workspace Shell */}
      <div className="flex-1 overflow-hidden">
        <ReportWorkspace
          key={activeScenario.id}
          projectId="verify-project-p12"
          architectureId={activeScenario.id}
          graphRevision="rev-verify-v1"
          nodes={activeScenario.nodes}
          edges={activeScenario.edges}
        />
      </div>
    </div>
  );
}
