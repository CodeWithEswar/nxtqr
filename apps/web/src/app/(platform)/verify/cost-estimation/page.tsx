"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { CostWorkspacePanel } from "@/features/system-design/cost";
import { Badge } from "@nxtqr/ui";

interface TopologyScenario {
  id: string;
  name: string;
  description: string;
  providerId: "aws" | "gcp" | "azure" | "cloudflare";
  nodes: BaseNode[];
  edges: BaseEdge[];
}

const VERIFY_TOPOLOGIES: Record<string, TopologyScenario> = {
  startup_saas: {
    id: "startup_saas",
    name: "Startup SaaS (Overprovisioned Monolith)",
    description: "Application Load Balancer directing traffic to a 4-instance web service and an expensive RDS database (r6g.xlarge) without caching. Demonstrates compute rightsizing and cache-offload optimization opportunities.",
    providerId: "aws",
    nodes: [
      {
        id: "alb_ingress",
        type: "loadBalancer",
        position: { x: 50, y: 150 },
        label: "Application Load Balancer",
        data: { label: "Ingress ALB", pricingSku: "ingress.alb", replicas: 1 },
      },
      {
        id: "web_service",
        type: "service",
        position: { x: 280, y: 150 },
        label: "Web Fleet",
        data: { label: "Web Application Fleet", pricingSku: "compute.t3.medium", replicas: 6 },
      },
      {
        id: "postgres_db",
        type: "database",
        position: { x: 520, y: 150 },
        label: "PostgreSQL Database",
        data: { label: "RDS PostgreSQL Primary", pricingSku: "database.db.r6g.large", storageGb: 200, replicas: 1 },
      },
    ],
    edges: [
      { id: "e1", source: "alb_ingress", target: "web_service", data: {} },
      { id: "e2", source: "web_service", target: "postgres_db", data: {} },
    ],
  },
  ecommerce_multitier: {
    id: "ecommerce_multitier",
    name: "E-Commerce Multi-Tier (Compute, Cache, Storage & Queue)",
    description: "Complete modern microservices topology with Ingress Gateway, Checkout API, Redis Cache cluster, Orders Database, SQS Messaging Queue, and S3 Asset Bucket.",
    providerId: "aws",
    nodes: [
      {
        id: "alb_gateway",
        type: "loadBalancer",
        position: { x: 50, y: 150 },
        label: "Ingress Gateway",
        data: { label: "Ingress Gateway", pricingSku: "ingress.alb", replicas: 1 },
      },
      {
        id: "checkout_svc",
        type: "service",
        position: { x: 250, y: 100 },
        label: "Checkout Service",
        data: { label: "Checkout Service", pricingSku: "compute.c6g.large", replicas: 3 },
      },
      {
        id: "redis_tier",
        type: "cache",
        position: { x: 450, y: 50 },
        label: "Redis Cache",
        data: { label: "ElastiCache Redis", pricingSku: "cache.cache.t3.medium", replicas: 2 },
      },
      {
        id: "orders_database",
        type: "database",
        position: { x: 450, y: 180 },
        label: "Orders Database",
        data: { label: "PostgreSQL Orders DB", pricingSku: "database.db.t3.medium", storageGb: 150, replicas: 1 },
      },
      {
        id: "event_queue",
        type: "queue",
        position: { x: 250, y: 250 },
        label: "Order Events Queue",
        data: { label: "SQS Order Queue", pricingSku: "messaging.sqs.standard", monthlyMillionsRequests: 10 },
      },
      {
        id: "media_bucket",
        type: "storage",
        position: { x: 650, y: 180 },
        label: "Product Images Bucket",
        data: { label: "S3 Asset Storage", pricingSku: "storage.s3.standard", storageGb: 500 },
      },
    ],
    edges: [
      { id: "e1", source: "alb_gateway", target: "checkout_svc", data: {} },
      { id: "e2", source: "checkout_svc", target: "redis_tier", data: {} },
      { id: "e3", source: "checkout_svc", target: "orders_database", data: {} },
      { id: "e4", source: "checkout_svc", target: "event_queue", data: {} },
      { id: "e5", source: "orders_database", target: "media_bucket", data: {} },
    ],
  },
  data_pipeline: {
    id: "data_pipeline",
    name: "High-Throughput Analytics & Real-Time Pipeline",
    description: "Heavy streaming workload with 8 worker ingestion replicas, message queue, database, and cloud egress transfer. Demonstrates Graviton modernization and high-volume data egress modeling.",
    providerId: "aws",
    nodes: [
      {
        id: "ingest_lb",
        type: "loadBalancer",
        position: { x: 50, y: 150 },
        label: "Ingestion Gateway",
        data: { label: "Ingestion Gateway", pricingSku: "ingress.alb", replicas: 2 },
      },
      {
        id: "ingest_workers",
        type: "service",
        position: { x: 280, y: 150 },
        label: "Telemetry Ingestion Fleet",
        data: { label: "Telemetry Ingestion Fleet", pricingSku: "compute.t3.medium", replicas: 8 },
      },
      {
        id: "stream_broker",
        type: "queue",
        position: { x: 520, y: 150 },
        label: "Event Streaming Broker",
        data: { label: "Event Streaming Broker", pricingSku: "messaging.sqs.standard", monthlyMillionsRequests: 25 },
      },
      {
        id: "analytics_db",
        type: "database",
        position: { x: 750, y: 150 },
        label: "Time-Series Database",
        data: { label: "RDS PostgreSQL Time-Series", pricingSku: "database.db.r6g.large", storageGb: 800, replicas: 2 },
      },
    ],
    edges: [
      { id: "e1", source: "ingest_lb", target: "ingest_workers", data: {} },
      { id: "e2", source: "ingest_workers", target: "stream_broker", data: {} },
      { id: "e3", source: "stream_broker", target: "analytics_db", data: {} },
    ],
  },
};

export default function CostEstimationVerifyPage() {
  const [selectedTopologyId, setSelectedTopologyId] = React.useState<string>("startup_saas");
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const activeTopology = VERIFY_TOPOLOGIES[selectedTopologyId] || VERIFY_TOPOLOGIES.startup_saas;

  return (
    <div className="flex h-screen w-screen flex-col bg-black text-white overflow-hidden">
      {/* Top Testbed Banner */}
      <header className="flex items-center justify-between border-b border-[#202020] bg-[#080808] px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="flex items-center gap-1.5 text-xs text-[#858585] transition-colors hover:text-white"
          >
            ← Testbed Index
          </Link>
          <span className="text-xs text-[#333333]">/</span>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold tracking-tight text-white uppercase">
              Phase 05.3.14 — Cost Estimation & Optimization Engine
            </h1>
            <Badge
              variant="outline"
              className="rounded-md border-[#333333] bg-[#141414] px-1.5 py-0 text-[10px] text-[#B5B5B5]"
            >
              Deterministic BigInt Scaled Arithmetic
            </Badge>
          </div>
        </div>

        {/* Other intelligence links */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/verify/capacity-planning"
            className="text-[11px] text-[#858585] transition-colors hover:text-white"
          >
            Capacity Planning →
          </Link>
          <Link
            href="/verify/ai-assistant"
            className="text-[11px] text-[#858585] transition-colors hover:text-white"
          >
            AI Assistant →
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Topology selector & Canvas preview */}
        <div className="flex w-1/2 flex-col border-r border-[#202020] bg-[#050505] p-4 overflow-y-auto">
          {/* Topology Selector Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#858585]">
              Select Architecture Topology
            </span>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(VERIFY_TOPOLOGIES).map((topo) => (
                <button
                  key={topo.id}
                  onClick={() => {
                    setSelectedTopologyId(topo.id);
                    setSelectedNodeId(null);
                  }}
                  className={`flex flex-col items-start rounded-md border p-2.5 text-left transition-all ${
                    selectedTopologyId === topo.id
                      ? "border-[#404040] bg-[#141414] text-white shadow-level-1"
                      : "border-[#1F1F1F] bg-[#0A0A0A] text-[#858585] hover:border-[#2E2E2E] hover:text-[#B5B5B5]"
                  }`}
                >
                  <span className="text-xs font-semibold">{topo.name}</span>
                  <span className="mt-1 line-clamp-2 text-[10px] text-[#666666]">
                    {topo.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Topology Description */}
          <div className="mt-4 rounded-md border border-[#202020] bg-[#0A0A0A] p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{activeTopology.name}</span>
              <span className="font-mono text-[11px] text-[#858585]">
                {activeTopology.nodes.length} nodes · {activeTopology.edges.length} edges
              </span>
            </div>
            <p className="mt-1 leading-relaxed text-[#858585]">{activeTopology.description}</p>
          </div>

          {/* Topology Components Visual List */}
          <div className="mt-4 flex flex-1 flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#858585]">
              Components & Mapped Pricing SKUs
            </span>
            <div className="grid grid-cols-2 gap-2">
              {activeTopology.nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const data = (node.data || {}) as Record<string, unknown>;

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`flex flex-col rounded-md border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-[#404040] bg-[#141414]"
                        : "border-[#202020] bg-[#0A0A0A] hover:border-[#2D2D2D]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">
                        {String(data.label || node.label || node.id)}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-md border-[#262626] bg-[#0E0E0E] px-1 py-0 text-[9px] uppercase text-[#858585]"
                      >
                        {node.type}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-col gap-0.5 font-mono text-[10px] text-[#858585]">
                      <span>SKU: {String(data.pricingSku || "auto-mapped")}</span>
                      <span>Replicas: {Number(data.replicas || 1)}</span>
                      {Boolean(data.storageGb) && <span>Storage: {Number(data.storageGb)} GB</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Interactive Cost Intelligence Studio Panel */}
        <div className="flex w-1/2 flex-col bg-black">
          <CostWorkspacePanel
            key={selectedTopologyId}
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
          />
        </div>
      </div>
    </div>
  );
}

