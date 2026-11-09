"use client";

import * as React from "react";
import { Badge } from "@nxtqr/ui";
import { CopyIcon } from "@nxtqr/icons";
import {
  getInfrastructureIcon,
  type InfrastructureIconVariant,
} from "@nxtqr/icons";
import {
  infrastructureRegistry,
  NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureNetworkingVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("load-balancer");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS[0]
    );
  }, [selectedSlug, components]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const ActiveIcon = getInfrastructureIcon(activeComponent.id);

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-surface-03">
      {/* Precision Header */}
      <header className="border-b border-border-default bg-surface-01 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">
                Infrastructure Architecture Verification Gate
              </span>
              <span className="text-border-subtle">·</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-sky-400 border-sky-900/40 bg-sky-950/20"
              >
                P0 Approved
              </Badge>
            </div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Category 03 — Networking & Traffic Infrastructure</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle">
                12 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify/infrastructure-dns-cdn-edge"
              className="px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors"
            >
              ← Cat 02 DNS/Edge
            </Link>
            <Link
              href="/verify/infrastructure-clients"
              className="px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors"
            >
              Cat 01 Clients
            </Link>
            <Link
              href="/workspace"
              className="px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-foreground transition-colors"
            >
              Open Studio Canvas
            </Link>
            <Link
              href="/verify"
              className="px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors"
            >
              All Diagnostics
            </Link>
          </div>
        </div>
      </header>

      {/* Main Review Body */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* SECTION 1: Icon Gallery & Geometry Matrix */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
                <span>1. Original Colored SVG Icon System</span>
                <span className="font-mono text-xs text-text-muted">(12 Icons · 32×32 Native ViewBox)</span>
              </h2>
              <p className="font-sans text-xs text-text-muted">
                Engineered with semantic network palette: Network Blue (#60A5FA), Indigo (#818CF8), Violet (#A78BFA), Cyan (#38BDF8), Teal (#2DD4BF), Amber (#FBBF24), Discovery Green (#34D399), and Security Red (#F87171).
              </p>
            </div>

            <div className="flex items-center gap-2 bg-surface-02 p-1 rounded-md border border-border-default self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setVariant("colored")}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  variant === "colored"
                    ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Semantic Colored
              </button>
              <button
                type="button"
                onClick={() => setVariant("monochrome")}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  variant === "monochrome"
                    ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Monochrome
              </button>
            </div>
          </div>

          {/* Icon Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {components.map((comp) => {
              const CompIcon = getInfrastructureIcon(comp.id);
              const isSelected = comp.id === selectedSlug;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`p-3.5 rounded-md border transition-all duration-150 cursor-pointer flex flex-col items-center text-center gap-2.5 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2 ring-1 ring-border-strong"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02"
                  }`}
                >
                  <div className="h-10 w-10 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                    {CompIcon && <CompIcon size={24} variant={variant} />}
                  </div>
                  <div className="min-w-0 w-full space-y-0.5">
                    <div className="font-sans text-xs font-semibold text-foreground truncate">
                      {comp.display.name}
                    </div>
                    <div className="font-mono text-[10px] text-text-muted truncate">
                      {comp.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Active Component Deep-Dive & Multi-Scale Matrix */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Multi-Scale Icon Renderings */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-md border border-border-default bg-surface-01 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
                  Multi-Scale Geometry Matrix
                </span>
                <span className="font-mono text-[10px] text-text-disabled">
                  16px → 48px
                </span>
              </div>

              <div className="flex items-center justify-around py-4 bg-surface-02 rounded-md border border-border-subtle">
                {SIZES.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center bg-surface-01 p-2 rounded border border-border-default min-h-[56px] min-w-[56px]">
                      {ActiveIcon && <ActiveIcon size={size} variant={variant} />}
                    </div>
                    <span className="font-mono text-[10px] text-text-muted">
                      {size}px
                    </span>
                  </div>
                ))}
              </div>

              {/* Component Metadata Sheet */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border-subtle font-mono">
                  <span className="text-text-muted">Canonical Identifier</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeComponent.id, "slug")}
                    className="text-foreground hover:underline flex items-center gap-1"
                  >
                    <span>{activeComponent.id}</span>
                    <CopyIcon className="h-3 w-3 text-text-disabled" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle font-mono">
                  <span className="text-text-muted">Short Label</span>
                  <span className="text-foreground font-semibold">{activeComponent.display.shortName}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle font-mono">
                  <span className="text-text-muted">Connection Ports</span>
                  <span className="text-foreground font-mono">{activeComponent.ports.length} typed ports</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border-subtle font-mono">
                  <span className="text-text-muted">Capability Flags</span>
                  <span className="text-foreground font-mono">{activeComponent.capabilities.length} capabilities</span>
                </div>
                <div className="pt-1">
                  <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block mb-1">Description</span>
                  <p className="font-sans text-xs text-text-secondary leading-relaxed">
                    {activeComponent.display.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: React Flow Live Node Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-md border border-border-default bg-surface-01 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
                  React Flow Node Visualizer
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSelectedNode(!isSelectedNode)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                      isSelectedNode
                        ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                        : "border-border-subtle text-text-muted hover:text-foreground"
                    }`}
                  >
                    {isSelectedNode ? "Selected State" : "Default State"}
                  </button>
                  <select
                    value={previewStatus}
                    onChange={(e) => setPreviewStatus(e.target.value as any)}
                    className="bg-surface-02 border border-border-default text-[11px] font-mono rounded px-2 py-0.5 text-foreground focus:outline-none"
                  >
                    <option value="idle">Status: Idle</option>
                    <option value="running">Status: Running</option>
                    <option value="success">Status: Healthy</option>
                    <option value="error">Status: Degraded</option>
                  </select>
                </div>
              </div>

              {/* Canvas Simulation Area */}
              <div className="h-64 bg-black rounded-md border border-border-subtle relative flex items-center justify-center p-6 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "radial-gradient(#404040 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* Simulated GraphNode Component */}
                <div
                  className={`group relative w-[240px] rounded-md border transition-all duration-150 select-none text-foreground z-10 ${
                    isSelectedNode
                      ? "bg-surface-04 border-border-strong shadow-level-3 ring-1 ring-border-strong"
                      : "bg-surface-02 border-border-default shadow-level-1 hover:border-border-hover"
                  }`}
                >
                  {/* Top Port Handles Simulation */}
                  <div className="absolute -top-1.5 left-0 right-0 flex justify-around pointer-events-none">
                    {activeComponent.ports
                      .filter((p) => p.type === "input" || p.type === "bidirectional")
                      .map((port) => (
                        <div
                          key={port.id}
                          className="w-2.5 h-2.5 rounded-full bg-surface-03 border-2 border-border-strong"
                          title={port.name}
                        />
                      ))}
                  </div>

                  {/* Node Header */}
                  <div className="p-2.5 flex items-start gap-2.5 border-b border-border-subtle/60">
                    <div
                      className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                        isSelectedNode
                          ? "bg-surface-03 border-border-strong text-foreground"
                          : "bg-surface-01 border-border-default text-text-secondary"
                      }`}
                    >
                      {ActiveIcon ? (
                        <ActiveIcon size={20} variant={variant} />
                      ) : (
                        <div className="h-4 w-4 bg-surface-03 rounded" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider font-semibold truncate">
                          NETWORKING & TRAFFIC
                        </span>
                        <span className="font-mono text-[9px] text-text-disabled shrink-0">
                          #3012
                        </span>
                      </div>
                      <h4
                        className={`font-sans text-xs leading-tight truncate ${
                          isSelectedNode ? "text-foreground font-semibold" : "text-text-primary font-medium"
                        }`}
                      >
                        {activeComponent.display.name}
                      </h4>
                    </div>
                  </div>

                  {/* Node Body / Metadata */}
                  <div className="px-2.5 py-1.5 flex items-center justify-between font-mono text-[10px] text-text-muted bg-surface-01/40 rounded-b-md">
                    <span className="truncate max-w-[130px] text-text-secondary">
                      {activeComponent.id}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted">
                      {activeComponent.ports.filter((p) => p.type === "input" || p.type === "bidirectional").length}in ·{" "}
                      {activeComponent.ports.filter((p) => p.type === "output" || p.type === "bidirectional").length}out
                    </span>
                  </div>

                  {/* Bottom Port Handles Simulation */}
                  <div className="absolute -bottom-1.5 left-0 right-0 flex justify-around pointer-events-none">
                    {activeComponent.ports
                      .filter((p) => p.type === "output" || p.type === "bidirectional")
                      .map((port) => (
                        <div
                          key={port.id}
                          className="w-2.5 h-2.5 rounded-full bg-surface-03 border-2 border-border-strong"
                          title={port.name}
                        />
                      ))}
                  </div>
                </div>
              </div>

              {/* Ports Specification Matrix */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold block">
                  Declared Connection Ports ({activeComponent.ports.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeComponent.ports.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded bg-surface-02 border border-border-subtle font-mono text-[11px] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-foreground font-semibold block">{p.name}</span>
                        <span className="text-text-disabled text-[9.5px] block">{p.id}</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-sky-400 text-[10px] block">{p.type}</span>
                        <span className="text-text-muted text-[9.5px] block">{p.dataType || "Any"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: System Topology Architectural Reference */}
        <section className="p-5 rounded-md border border-border-default bg-surface-01 space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground">
                3. End-to-End Enterprise Network Architecture Reference
              </h3>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Topological verification connecting Clients (Cat 01) → Edge/Anycast (Cat 02) → Networking & Traffic (Cat 03).
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] text-text-muted border-border-subtle">
              Phase 05.1 Integration
            </Badge>
          </div>

          <div className="p-4 rounded-md bg-surface-02 border border-border-subtle font-mono text-xs text-text-secondary overflow-x-auto">
            <pre className="text-[11px] leading-relaxed">
{`[ Web Client / Mobile App ] (Cat 01)
              │
              ▼
   [ Anycast Network / Edge Router ] (Cat 02)
              │
              ▼
    [ Layer 4 / Layer 7 Load Balancer ] (Cat 03)
              │
              ├──────────────────────────────────┐
              ▼                                  ▼
     [ API Gateway ]                   [ Ingress Controller ]
       (Auth/Throttle/JWT)               (K8s Path Routing)
              │                                  │
              └──────────────────┬───────────────┘
                                 ▼
                     [ Network Firewall / NAT ]
                                 │
                                 ▼
                [ VPC / Private Subnet Mesh ]
                     ┌───────────┴───────────┐
                     ▼                       ▼
            [ Service Discovery ]    [ Service Mesh ]
            (Consul / CoreDNS)       (Istio / Envoy mTLS)`}
            </pre>
          </div>
        </section>

        {/* SECTION 4: Validated Configuration Schema Inspector */}
        <section className="p-5 rounded-md border border-border-default bg-surface-01 space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
              4. Default Configuration Payload ({activeComponent.id})
            </span>
            <button
              type="button"
              onClick={() => handleCopy(JSON.stringify(activeComponent.defaultConfig, null, 2), "cfg")}
              className="text-xs font-mono text-text-muted hover:text-foreground flex items-center gap-1.5"
            >
              <CopyIcon className="h-3 w-3" />
              <span>{copiedKey === "cfg" ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-md bg-surface-02 border border-border-subtle font-mono text-xs text-text-secondary overflow-x-auto max-h-72">
            {JSON.stringify(activeComponent.defaultConfig, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}
