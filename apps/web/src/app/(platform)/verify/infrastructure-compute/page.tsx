"use client";

import * as React from "react";
import {
  Badge,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@nxtqr/ui";
import { CopyIcon } from "@nxtqr/icons";
import {
  getInfrastructureIcon,
  type InfrastructureIconVariant,
} from "@nxtqr/icons";
import {
  infrastructureRegistry,
  COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID,
  ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureComputeVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("web-server");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS[0]
    );
  }, [selectedSlug, components]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const ActiveIcon = getInfrastructureIcon(activeComponent.id);

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-surface-03 overflow-x-hidden">
      {/* Precision Responsive Header */}
      <header className="border-b border-border-default bg-surface-01 px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 max-w-7xl mx-auto">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider truncate">
                Infrastructure Architecture Verification Gate
              </span>
              <span className="text-border-subtle hidden xs:inline">·</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-purple-400 border-purple-900/40 bg-purple-950/20 shrink-0"
              >
                P0 Approved
              </Badge>
            </div>
            <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5 flex-wrap">
              <span>Category 04 — Compute & Application Services</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                14 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-networking"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 03 Network
            </Link>
            <Link
              href="/verify/infrastructure-dns-cdn-edge"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 02 DNS/Edge
            </Link>
            <Link
              href="/workspace"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Studio Canvas
            </Link>
            <Link
              href="/verify"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              All Diagnostics
            </Link>
          </div>
        </div>
      </header>

      {/* Main Review Body */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-hidden">
        {/* SECTION 1: Icon Gallery & Geometry Matrix */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
                <span>1. Original Colored SVG Icon System</span>
                <span className="font-mono text-xs text-text-muted">(14 Icons · 32×32 Native ViewBox)</span>
              </h2>
              <p className="font-sans text-xs text-text-muted">
                Engineered with semantic technical compute palette: Compute Violet (#A78BFA), Service Indigo (#818CF8), Web Blue (#60A5FA), Container Cyan (#38BDF8), Cluster Teal (#2DD4BF), Serverless Amber (#FBBF24), Worker Orange (#FB923C), Processing Green (#34D399), and Structural Neutral (#CBD5E1).
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
                    <span>{copiedKey === "slug" ? "Copied!" : activeComponent.id}</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
                  React Flow Node Visualizer
                </span>
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsSelectedNode(!isSelectedNode)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors flex-1 sm:flex-initial text-center ${
                      isSelectedNode
                        ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-1"
                        : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
                    }`}
                  >
                    {isSelectedNode ? "Selected State" : "Default State"}
                  </button>

                  <div className="w-[140px] flex-1 sm:flex-initial">
                    <Select
                      value={previewStatus}
                      onValueChange={(val: any) => setPreviewStatus(val)}
                    >
                      <SelectTrigger className="h-8 w-full bg-surface-02 border-border-default text-xs font-mono text-foreground shadow-level-1 hover:border-border-hover">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
                        <SelectItem value="idle">Status: Idle</SelectItem>
                        <SelectItem value="running">Status: Running</SelectItem>
                        <SelectItem value="success">Status: Healthy</SelectItem>
                        <SelectItem value="error">Status: Degraded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                          COMPUTE & SERVICES
                        </span>
                        <span className="font-mono text-[9px] text-text-disabled shrink-0">
                          #4014
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
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        previewStatus === "running"
                          ? "text-sky-400 bg-sky-950/40"
                          : previewStatus === "success"
                          ? "text-emerald-400 bg-emerald-950/40"
                          : previewStatus === "error"
                          ? "text-rose-400 bg-rose-950/40"
                          : "text-text-muted bg-surface-03"
                      }`}
                    >
                      ● {previewStatus}
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
            </div>
          </div>
        </section>

        {/* SECTION 3: Port Semantics & Inspector Capability Matrix */}
        <section className="space-y-4">
          <div className="border-b border-border-subtle pb-2">
            <h3 className="font-sans text-sm font-semibold text-foreground">
              3. Port Semantics & Protocol Bindings for {activeComponent.display.name}
            </h3>
            <p className="font-sans text-xs text-text-muted">
              Typed network handles mapped to precise compute runtime protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeComponent.ports.map((port) => (
              <div
                key={port.id}
                className="p-3 rounded-md border border-border-default bg-surface-01 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-medium text-foreground">
                    {port.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-mono text-[9px] uppercase ${
                      port.type === "input"
                        ? "text-sky-400 border-sky-900/40"
                        : port.type === "output"
                        ? "text-purple-400 border-purple-900/40"
                        : "text-emerald-400 border-emerald-900/40"
                    }`}
                  >
                    {port.type}
                  </Badge>
                </div>
                <div className="font-mono text-[10px] text-text-muted flex items-center justify-between">
                  <span>Data Contract:</span>
                  <span className="text-text-secondary">{port.dataType}</span>
                </div>
                <p className="font-sans text-[11px] text-text-disabled leading-relaxed pt-1 border-t border-border-subtle">
                  {port.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Architecture Topology Reference */}
        <section className="p-5 rounded-md border border-border-default bg-surface-01 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
              4. Reference Architecture Topology Integration
            </span>
            <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
              Production Pattern
            </Badge>
          </div>
          <p className="font-sans text-xs text-text-secondary leading-relaxed">
            In modern distributed system design, Category 04 compute instances interface with upstream ingress load balancers and downstream databases:
          </p>
          <div className="p-3.5 bg-black rounded-md border border-border-subtle font-mono text-xs text-text-secondary space-y-1.5 overflow-x-auto">
            <div className="text-text-muted">// Inbound Request Flow & Distributed Compute Topology</div>
            <div className="text-sky-300">Browser / Mobile Client <span className="text-text-muted">──(HTTPS)──▶</span> Load Balancer / API Gateway</div>
            <div className="text-sky-300 ml-4">└──(Proxy)──▶ <span className="text-purple-400">Web Server / Ingress Controller</span></div>
            <div className="text-purple-300 ml-12">└──(Internal RPC)──▶ <span className="text-indigo-400">Kubernetes Pod / Microservice Cluster</span></div>
            <div className="text-indigo-300 ml-20">├──(Pub/Sub)──▶ <span className="text-amber-400">Serverless Function / Queue</span> ──▶ <span className="text-orange-400">Background Worker</span></div>
            <div className="text-indigo-300 ml-20">└──(Connection Pool)──▶ <span className="text-emerald-400">Database Engine (PostgreSQL / Redis)</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}
