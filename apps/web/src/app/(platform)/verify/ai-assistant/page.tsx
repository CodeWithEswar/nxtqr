"use client";

import * as React from "react";
import Link from "next/link";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { AIArchitectureProposal } from "@nxtqr/architecture-intelligence";
import { ProposalValidator } from "@nxtqr/architecture-intelligence";
import { AssistantPanel } from "@/features/system-design/ai-assistant";
import { Button, Badge } from "@nxtqr/ui";
import {
  LayersIcon,
  CheckCircleIcon,
  RefreshIcon,
} from "@nxtqr/icons";

interface TopologyScenario {
  id: string;
  name: string;
  description: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  sampleQuestions: string[];
}

const VERIFY_SCENARIOS: Record<string, TopologyScenario> = {
  ecommerce: {
    id: "ecommerce",
    name: "E-Commerce Checkout & Database Contention",
    description: "Checkout compute service synchronously calls a single-instance PostgreSQL database with heavy read demand and no caching tier.",
    nodes: [
      {
        id: "web_client",
        type: "web-app",
        position: { x: 50, y: 150 },
        label: "Storefront Web Client",
        data: { tier: "client", replicas: 1 },
      },
      {
        id: "api_gateway",
        type: "api-gateway",
        position: { x: 250, y: 150 },
        label: "Public API Gateway",
        data: { tier: "gateway", replicas: 2, tlsTermination: true, authRequired: true },
      },
      {
        id: "checkout_service",
        type: "compute-service",
        position: { x: 450, y: 150 },
        label: "Checkout Service",
        data: { tier: "service", replicas: 2, maxRps: 600 },
      },
      {
        id: "orders_database",
        type: "relational-database",
        position: { x: 650, y: 150 },
        label: "Orders PostgreSQL (Primary)",
        data: { tier: "data", replicas: 1, maxRps: 250, storageType: "ssd" },
      },
    ],
    edges: [
      { id: "e_client_gw", source: "web_client", target: "api_gateway", data: { protocol: "https", isAsync: false, tls: true } },
      { id: "e_gw_checkout", source: "api_gateway", target: "checkout_service", data: { protocol: "http", isAsync: false } },
      { id: "e_checkout_db", source: "checkout_service", target: "orders_database", data: { protocol: "tcp", isAsync: false } },
    ],
    sampleQuestions: [
      "Why is orders_database a bottleneck?",
      "Can you propose a Redis cache between checkout_service and orders_database?",
      "What are the single points of failure in this checkout flow?",
    ],
  },
  microservices: {
    id: "microservices",
    name: "Microservices Mesh & SPOF Cluster",
    description: "Multiple services (Auth, Catalog, Cart) sharing a single Redis cache instance without high availability or clustering.",
    nodes: [
      {
        id: "edge_router",
        type: "layer-7-load-balancer",
        position: { x: 50, y: 200 },
        label: "Edge Load Balancer",
        data: { tier: "gateway", replicas: 2 },
      },
      {
        id: "auth_service",
        type: "compute-service",
        position: { x: 250, y: 100 },
        label: "Auth & Identity Service",
        data: { tier: "service", replicas: 3 },
      },
      {
        id: "catalog_service",
        type: "compute-service",
        position: { x: 250, y: 200 },
        label: "Product Catalog Service",
        data: { tier: "service", replicas: 2 },
      },
      {
        id: "cart_service",
        type: "compute-service",
        position: { x: 250, y: 300 },
        label: "Shopping Cart Service",
        data: { tier: "service", replicas: 2 },
      },
      {
        id: "shared_redis",
        type: "redis-cache",
        position: { x: 500, y: 200 },
        label: "Shared Redis Cache (Single AZ)",
        data: { tier: "cache", replicas: 1, maxMemoryMb: 2048 },
      },
    ],
    edges: [
      { id: "e_lb_auth", source: "edge_router", target: "auth_service", data: { protocol: "http", isAsync: false } },
      { id: "e_lb_cat", source: "edge_router", target: "catalog_service", data: { protocol: "http", isAsync: false } },
      { id: "e_lb_cart", source: "edge_router", target: "cart_service", data: { protocol: "http", isAsync: false } },
      { id: "e_auth_redis", source: "auth_service", target: "shared_redis", data: { protocol: "tcp", isAsync: false } },
      { id: "e_cat_redis", source: "catalog_service", target: "shared_redis", data: { protocol: "tcp", isAsync: false } },
      { id: "e_cart_redis", source: "cart_service", target: "shared_redis", data: { protocol: "tcp", isAsync: false } },
    ],
    sampleQuestions: [
      "What is the blast radius if shared_redis fails?",
      "Which components depend on shared_redis?",
      "How can we eliminate the SPOF on shared_redis?",
    ],
  },
  security_review: {
    id: "security_review",
    name: "Zero Trust & Network Isolation Gap",
    description: "Database is directly exposed to external clients without TLS encryption and lacks authentication boundary controls.",
    nodes: [
      {
        id: "mobile_client",
        type: "mobile-app",
        position: { x: 50, y: 150 },
        label: "Mobile Native App",
        data: { tier: "client" },
      },
      {
        id: "ingress_proxy",
        type: "api-gateway",
        position: { x: 250, y: 150 },
        label: "Public Ingress Proxy",
        data: { tier: "gateway", tlsTermination: false },
      },
      {
        id: "backend_api",
        type: "compute-service",
        position: { x: 450, y: 150 },
        label: "Backend Core API",
        data: { tier: "service", authRequired: false },
      },
      {
        id: "analytics_db",
        type: "relational-database",
        position: { x: 650, y: 150 },
        label: "Analytics PostgreSQL",
        data: { tier: "data", publicAccess: true, tls: false },
      },
    ],
    edges: [
      { id: "e_mob_proxy", source: "mobile_client", target: "ingress_proxy", data: { protocol: "http", isAsync: false } },
      { id: "e_proxy_api", source: "ingress_proxy", target: "backend_api", data: { protocol: "http", isAsync: false } },
      { id: "e_api_adb", source: "backend_api", target: "analytics_db", data: { protocol: "tcp", isAsync: false, encrypted: false } },
    ],
    sampleQuestions: [
      "What security vulnerabilities exist in this architecture?",
      "Explain the trust boundary violations.",
      "How do we remediate the unencrypted database connection?",
    ],
  },
};

export default function AIAssistantVerifyPage() {
  const [selectedScenarioKey, setSelectedScenarioKey] = React.useState<string>("ecommerce");
  const activeScenario = VERIFY_SCENARIOS[selectedScenarioKey];

  const [nodes, setNodes] = React.useState<BaseNode[]>(activeScenario.nodes);
  const [edges, setEdges] = React.useState<BaseEdge[]>(activeScenario.edges);
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<string[]>([]);
  const [graphRevision, setGraphRevision] = React.useState<string>("rev_001");
  const [appliedProposals, setAppliedProposals] = React.useState<AIArchitectureProposal[]>([]);

  // Sync state on scenario switch
  const handleSelectScenario = (key: string) => {
    setSelectedScenarioKey(key);
    const scen = VERIFY_SCENARIOS[key];
    setNodes(scen.nodes);
    setEdges(scen.edges);
    setSelectedNodeIds([]);
    setGraphRevision(`rev_${Date.now().toString(36).slice(-4)}`);
    setAppliedProposals([]);
  };

  const handleToggleNodeSelection = (id: string) => {
    setSelectedNodeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyProposal = (proposal: AIArchitectureProposal) => {
    const valResult = ProposalValidator.validate(proposal, nodes, edges, graphRevision);
    if (!valResult.isValid) {
      alert(`Cannot apply proposal: ${valResult.validationErrors.join("; ")}`);
      return;
    }

    setNodes(valResult.proposedNodes);
    setEdges(valResult.proposedEdges);
    setGraphRevision(`rev_${Date.now().toString(36).slice(-4)}`);
    setAppliedProposals((prev) => [...prev, proposal]);
  };

  const handleResetGraph = () => {
    setNodes(activeScenario.nodes);
    setEdges(activeScenario.edges);
    setSelectedNodeIds([]);
    setGraphRevision(`rev_${Date.now().toString(36).slice(-4)}`);
    setAppliedProposals([]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-foreground font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-12 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Verify Hub
          </Link>
          <span className="text-[#333333]">/</span>
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-foreground" />
            <span className="text-xs font-semibold tracking-tight">AI Architecture Assistant</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-[#333333] bg-[#141414] text-foreground/80">
            Phase 05.3.10
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-emerald-900/60 bg-emerald-950/30 text-emerald-400">
            Deterministic Grounding Authority
          </Badge>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-muted-foreground mr-1">Scenario:</span>
          {Object.entries(VERIFY_SCENARIOS).map(([key, scen]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectScenario(key)}
              className={`text-xs px-2.5 py-1 rounded-md font-mono transition-colors ${
                selectedScenarioKey === key
                  ? "bg-[#1A1A1A] border border-[#404040] text-foreground font-semibold"
                  : "bg-transparent text-secondary hover:bg-[#141414] hover:text-foreground border border-transparent"
              }`}
            >
              {scen.name.split(" ")[0]}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetGraph}
            className="h-7 px-2 ml-2 text-xs rounded-md border border-[#262626] hover:bg-[#141414] text-secondary hover:text-foreground"
            title="Reset Topology to Initial State"
          >
            <RefreshIcon className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left 60%: Architecture Visualizer Canvas Mockup */}
        <div className="flex-[3] flex flex-col bg-[#050505] overflow-hidden border-r border-[#262626]">
          {/* Canvas Top Bar */}
          <div className="px-4 py-2 bg-[#080808] border-b border-[#1A1A1A] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-foreground font-semibold">{activeScenario.name}</span>
              <p className="text-[11px] text-muted-foreground font-sans mt-0.5 max-w-xl">
                {activeScenario.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Revision:</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-foreground">
                {graphRevision}
              </span>
            </div>
          </div>

          {/* Interactive Topology Mockup */}
          <div className="flex-1 p-6 overflow-y-auto bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-muted-foreground">
                Topology Components ({nodes.length} nodes, {edges.length} edges)
              </span>
              <span className="text-[11px] text-secondary">
                Click a component to toggle focus scope for the Copilot.
              </span>
            </div>

            {/* Grid of Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {nodes.map((node) => {
                const isSelected = selectedNodeIds.includes(node.id);
                const isNew = appliedProposals.some((p) =>
                  p.operations.some((op) => op.type === "add_node" && op.node.id === node.id)
                );

                return (
                  <div
                    key={node.id}
                    onClick={() => handleToggleNodeSelection(node.id)}
                    className={`rounded-md p-3.5 border cursor-pointer transition-all select-none
                      ${
                        isSelected
                          ? "bg-[#1A1A1A] border-[#404040] ring-1 ring-[#333333] shadow-level-2"
                          : "bg-[#0A0A0A] border-[#262626] hover:border-[#333333] hover:bg-[#101010]"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <LayersIcon className="w-3.5 h-3.5 text-foreground/80 shrink-0" />
                        <span className="font-semibold text-xs text-foreground tracking-tight">
                          {node.label || node.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isNew && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-900/60 bg-emerald-950/30 text-emerald-400">
                            PROPOSED
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-[#262626] bg-[#141414] text-muted-foreground">
                          {node.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-muted-foreground space-y-0.5">
                      <div>id: <span className="text-foreground/90">{node.id}</span></div>
                      <div>replicas: <span className="text-sky-400 font-semibold">{(node.data as any)?.replicas ?? 1}</span></div>
                      {(node.data as any)?.maxRps && (
                        <div>maxRps: <span className="text-secondary">{(node.data as any).maxRps}</span></div>
                      )}
                      {(node.data as any)?.storageType && (
                        <div>storage: <span className="text-secondary">{(node.data as any).storageType}</span></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connections Table */}
            <div className="rounded-md border border-[#262626] bg-[#080808] p-3 mb-6">
              <span className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                Active Connections ({edges.length})
              </span>
              <div className="divide-y divide-[#1A1A1A] text-xs font-mono">
                {edges.map((e) => (
                  <div key={e.id} className="py-1.5 flex items-center justify-between text-secondary">
                    <span className="text-foreground/90 font-medium">{e.source} → {e.target}</span>
                    <span className="text-muted-foreground text-[11px]">
                      {(e.data as any)?.protocol || "http"} | {(e.data as any)?.isAsync ? "async" : "sync"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applied Proposals History */}
            {appliedProposals.length > 0 && (
              <div className="rounded-md border border-emerald-900/50 bg-emerald-950/10 p-3">
                <span className="text-xs font-mono uppercase text-emerald-400 block mb-2">
                  Applied What-If Proposals ({appliedProposals.length})
                </span>
                <ul className="space-y-1 text-xs">
                  {appliedProposals.map((p, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{p.title}:</span>
                      <span className="text-muted-foreground">{p.explanation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right 40%: The Assistant Panel */}
        <div className="flex-[2] min-w-[360px] max-w-[480px] h-full flex flex-col">
          <AssistantPanel
            nodes={nodes}
            edges={edges}
            selectedNodeIds={selectedNodeIds}
            graphRevision={graphRevision}
            activeScenarioId={activeScenario.id}
            projectId="verify-project"
            architectureId="verify-arch"
            onApplyProposal={handleApplyProposal}
            onSelectNode={(nodeId) => handleToggleNodeSelection(nodeId)}
          />
        </div>
      </div>
    </div>
  );
}
