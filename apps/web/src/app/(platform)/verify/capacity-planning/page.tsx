"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { CapacityPlanningPanel } from "@/features/system-design/capacity-planning";
import { Button, Badge } from "@nxtqr/ui";
import {
  RefreshIcon,
} from "@nxtqr/icons";

interface TopologyScenario {
  id: string;
  name: string;
  description: string;
  defaultScenarioId: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
}

const VERIFY_TOPOLOGIES: Record<string, TopologyScenario> = {
  saas_growth: {
    id: "saas_growth",
    name: "Hyper-Growth SaaS (Monolith to Microservices)",
    description: "API Gateway directing traffic to Core Application Services and an un-cached PostgreSQL database. Under 15% compound monthly growth, database read saturation and compute exhaustion occur within months.",
    defaultScenarioId: "rapid_startup_growth",
    nodes: [
      {
        id: "api_gateway",
        type: "api-gateway",
        position: { x: 50, y: 150 },
        label: "API Gateway",
        data: { tier: "gateway", replicas: 2, capacityRps: 800, tlsTermination: true },
      },
      {
        id: "core_service",
        type: "compute-service",
        position: { x: 280, y: 150 },
        label: "Core API Service",
        data: { tier: "service", replicas: 2, capacityRps: 500, scalingEfficiency: 0.85 },
      },
      {
        id: "postgres_primary",
        type: "relational-database",
        position: { x: 520, y: 150 },
        label: "PostgreSQL Primary",
        data: { tier: "database", replicas: 1, capacityRps: 350, maxWriteRps: 150, maxReadRps: 500 },
      },
    ],
    edges: [
      { id: "e1", source: "api_gateway", target: "core_service", data: { protocol: "https" } },
      { id: "e2", source: "core_service", target: "postgres_primary", data: { protocol: "tcp" } },
    ],
  },
  ecommerce_surge: {
    id: "ecommerce_surge",
    name: "E-Commerce Flash Sale & Surge Tier",
    description: "Storefront edge routing through Checkout Services, Redis Cache tier, Order Database, and async Kafka event queue. Models a 4x traffic surge at Month 3.",
    defaultScenarioId: "black_friday_surge",
    nodes: [
      {
        id: "edge_lb",
        type: "api-gateway",
        position: { x: 50, y: 150 },
        label: "Edge Load Balancer",
        data: { tier: "gateway", replicas: 4, capacityRps: 2000 },
      },
      {
        id: "checkout_api",
        type: "compute-service",
        position: { x: 260, y: 100 },
        label: "Checkout Service",
        data: { tier: "service", replicas: 3, capacityRps: 600, scalingEfficiency: 0.85 },
      },
      {
        id: "redis_cart",
        type: "redis-cache",
        position: { x: 480, y: 50 },
        label: "Redis Session Cache",
        data: { tier: "cache", replicas: 2, capacityRps: 3000 },
      },
      {
        id: "order_db",
        type: "relational-database",
        position: { x: 480, y: 160 },
        label: "Orders Database",
        data: { tier: "database", replicas: 1, capacityRps: 400, maxWriteRps: 200 },
      },
      {
        id: "kafka_orders",
        type: "message-queue",
        position: { x: 260, y: 250 },
        label: "Order Event Bus",
        data: { tier: "messaging", replicas: 2, processingTimeMs: 20, capacityRps: 1500 },
      },
    ],
    edges: [
      { id: "e1", source: "edge_lb", target: "checkout_api", data: { protocol: "https" } },
      { id: "e2", source: "checkout_api", target: "redis_cart", data: { protocol: "redis" } },
      { id: "e3", source: "checkout_api", target: "order_db", data: { protocol: "tcp" } },
      { id: "e4", source: "checkout_api", target: "kafka_orders", data: { protocol: "kafka", isAsync: true } },
    ],
  },
  iot_pipeline: {
    id: "iot_pipeline",
    name: "High-Volume IoT Telemetry Ingestion",
    description: "Ingestion gateway receiving sensor telemetry, routing to a persistent message broker and async worker consumers writing into a time-series datastore.",
    defaultScenarioId: "linear_enterprise_scaling",
    nodes: [
      {
        id: "iot_gateway",
        type: "api-gateway",
        position: { x: 50, y: 150 },
        label: "Telemetry Ingestion Gateway",
        data: { tier: "gateway", replicas: 4, capacityRps: 1200 },
      },
      {
        id: "telemetry_queue",
        type: "message-queue",
        position: { x: 280, y: 150 },
        label: "Kafka Ingestion Topic",
        data: { tier: "messaging", replicas: 2, processingTimeMs: 30 },
      },
      {
        id: "stream_workers",
        type: "compute-service",
        position: { x: 490, y: 150 },
        label: "Stream Processors",
        data: { tier: "compute", replicas: 3, capacityRps: 450, scalingEfficiency: 0.9 },
      },
      {
        id: "timeseries_db",
        type: "relational-database",
        position: { x: 700, y: 150 },
        label: "Time-Series Storage",
        data: { tier: "database", replicas: 2, capacityRps: 1500 },
      },
    ],
    edges: [
      { id: "e1", source: "iot_gateway", target: "telemetry_queue", data: { protocol: "mqtt", isAsync: true } },
      { id: "e2", source: "telemetry_queue", target: "stream_workers", data: { protocol: "kafka" } },
      { id: "e3", source: "stream_workers", target: "timeseries_db", data: { protocol: "tcp" } },
    ],
  },
};

export default function CapacityPlanningVerifyPage() {
  const [activeTopologyKey, setActiveTopologyKey] = React.useState<string>("saas_growth");
  const topology = VERIFY_TOPOLOGIES[activeTopologyKey];

  const [activeNodes, setActiveNodes] = React.useState<BaseNode[]>(topology.nodes);
  const [activeEdges, setActiveEdges] = React.useState<BaseEdge[]>(topology.edges);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  // Switch topology handler
  const handleSelectTopology = (key: string) => {
    setActiveTopologyKey(key);
    const scen = VERIFY_TOPOLOGIES[key];
    setActiveNodes(scen.nodes);
    setActiveEdges(scen.edges);
    setSelectedNodeId(null);
  };

  // Live scaling adjustment
  const handleAdjustReplicas = (nodeId: string, delta: number) => {
    setActiveNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const cur = Number(n.data?.replicas || 1);
        const next = Math.max(1, cur + delta);
        return {
          ...n,
          data: {
            ...n.data,
            replicas: next,
          },
        };
      })
    );
  };

  const handleResetTopology = () => {
    const scen = VERIFY_TOPOLOGIES[activeTopologyKey];
    setActiveNodes(scen.nodes);
    setActiveEdges(scen.edges);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-foreground select-none overflow-hidden">
      {/* Top Header */}
      <header className="h-12 border-b border-[#202020] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="text-xs font-mono text-text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            ← Verification Suite
          </Link>
          <span className="text-[#333333]">/</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">
              Capacity Planning & Workload Forecasting
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-border-default bg-[#0D0D0D] text-text-secondary">
              Phase 05.3.11
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetTopology}
            className="h-7 text-xs font-mono text-text-muted hover:text-foreground rounded-md border border-border-subtle"
          >
            <RefreshIcon size={12} className="mr-1.5" /> Reset Topology
          </Button>
        </div>
      </header>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left 55%: Topology Configuration & Archetype Switcher */}
        <div className="flex-[3] border-r border-[#202020] bg-[#000000] flex flex-col overflow-hidden">
          {/* Topology Selector Tabs */}
          <div className="p-3 bg-[#080808] border-b border-[#202020] flex items-center gap-2">
            {Object.values(VERIFY_TOPOLOGIES).map((item) => (
              <Button
                key={item.id}
                variant={activeTopologyKey === item.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectTopology(item.id)}
                className={`h-7 text-xs font-mono rounded-md transition-all ${
                  activeTopologyKey === item.id
                    ? "bg-foreground text-background font-semibold"
                    : "bg-[#0D0D0D] border-[#262626] text-text-muted hover:text-foreground hover:bg-[#141414]"
                }`}
              >
                {item.name.split(" ")[0]} ({item.nodes.length} nodes)
              </Button>
            ))}
          </div>

          {/* Scenario Info */}
          <div className="p-4 border-b border-[#1A1A1A] bg-[#080808]/50">
            <h2 className="font-mono text-xs font-bold text-foreground mb-1">
              {topology.name}
            </h2>
            <p className="text-xs text-text-muted leading-relaxed font-sans">
              {topology.description}
            </p>
          </div>

          {/* Component Nodes & Active Scaling Tweaks */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-text-muted pb-1 border-b border-[#1A1A1A]">
              <span>Infrastructure Components ({activeNodes.length})</span>
              <span>Replicas & Declared Capacity</span>
            </div>

            <div className="space-y-2.5">
              {activeNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const replicas = Number(node.data?.replicas || 1);
                const cap = Number(node.data?.capacityRps || 0);

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3.5 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#141414] border-[#404040] shadow-level-3"
                        : "bg-[#0D0D0D] hover:bg-[#141414] border-[#262626] hover:border-[#333333]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {node.label || node.id}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono bg-[#080808] border-[#202020] text-text-muted">
                            {node.type}
                          </Badge>
                        </div>
                        <div className="font-mono text-[11px] text-text-muted space-x-3">
                          <span>
                            Replicas: <strong className="text-foreground">{replicas}</strong>
                          </span>
                          <span>
                            Capacity: <strong className="text-text-secondary">{cap ? `${cap} RPS` : "Undeclared"}</strong>
                          </span>
                          {node.data?.maxWriteRps !== undefined && (
                            <span>
                              Max Write: <strong className="text-amber-400">{String(node.data.maxWriteRps)} RPS</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Live Scale Controls */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="font-mono text-[10px] text-text-muted mr-1">Scale:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustReplicas(node.id, -1)}
                          disabled={replicas <= 1}
                          className="h-6 w-6 p-0 text-xs font-mono bg-[#141414] border-[#262626] text-text-secondary hover:text-foreground rounded-md disabled:opacity-30"
                        >
                          -
                        </Button>
                        <span className="font-mono text-xs text-foreground font-bold w-5 text-center">
                          {replicas}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustReplicas(node.id, 1)}
                          className="h-6 w-6 p-0 text-xs font-mono bg-[#141414] border-[#262626] text-text-secondary hover:text-foreground rounded-md"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Topology Connections Preview */}
            <div className="p-3 bg-[#080808] border border-[#202020] rounded-md font-mono text-xs">
              <span className="text-text-muted block text-[11px] uppercase mb-2">
                Network Connections ({activeEdges.length})
              </span>
              <div className="space-y-1.5 divide-y divide-[#1A1A1A]">
                {activeEdges.map((e) => (
                  <div key={e.id} className="pt-1.5 flex items-center justify-between text-text-secondary text-[11px]">
                    <span className="text-foreground">{e.source} → {e.target}</span>
                    <span className="text-text-muted">
                      protocol: {String(e.data?.protocol || "http")} | async: {e.data?.isAsync ? "true" : "false"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 45%: Fully Interactive Capacity Planning Studio Panel */}
        <div className="flex-[3] min-w-[420px] max-w-[620px] h-full flex flex-col bg-[#000000]">
          <CapacityPlanningPanel
            onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
          />
        </div>
      </div>
    </div>
  );
}
