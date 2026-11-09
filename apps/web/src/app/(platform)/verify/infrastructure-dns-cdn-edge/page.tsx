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
  DNS_CDN_EDGE_CATEGORY_ID,
  ALL_DNS_CDN_EDGE_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureDnsCdnEdgeVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("dns-resolver");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(DNS_CDN_EDGE_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_DNS_CDN_EDGE_DEFINITIONS[0]
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
              <span>Category 02 — DNS, CDN & Edge Infrastructure</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle">
                10 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify/infrastructure-clients"
              className="px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors"
            >
              ← Cat 01 Clients
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
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle"
                >
                  32×32 viewBox · Network Palette
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Technical network palette: Network Blue (#60A5FA), Edge Cyan (#38BDF8), Routing Indigo (#818CF8), Compute Violet (#A78BFA), Cache Amber (#FBBF24), Proxy Teal (#2DD4BF), Structural Neutral (#CBD5E1).
              </p>
            </div>

            {/* Variant Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-surface-02 rounded-md border border-border-default text-xs font-mono">
              <button
                type="button"
                onClick={() => setVariant("colored")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
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
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  variant === "monochrome"
                    ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Pure Monochrome
              </button>
            </div>
          </div>

          {/* 10-Icon Inspection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ALL_DNS_CDN_EDGE_DEFINITIONS.map((def, idx) => {
              const Icon = getInfrastructureIcon(def.id);
              const isSelected = selectedSlug === def.id;
              return (
                <div
                  key={def.id}
                  onClick={() => setSelectedSlug(def.id)}
                  className={`p-3.5 rounded-md border cursor-pointer transition-all duration-150 space-y-3 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong ring-1 ring-border-strong shadow-level-3"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02 shadow-level-1"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] text-text-disabled border-border-subtle"
                    >
                      {def.ports.length} ports
                    </Badge>
                  </div>

                  {/* Multi-Size Icon Strip */}
                  <div className="flex items-center justify-around py-3 bg-black/60 rounded-md border border-border-subtle">
                    {SIZES.map((size) => (
                      <div
                        key={size}
                        className="flex flex-col items-center gap-1"
                        title={`${size}px preview`}
                      >
                        <div className="flex items-center justify-center">
                          {Icon ? (
                            <Icon size={size} variant={variant} />
                          ) : (
                            <div className="w-4 h-4 bg-surface-03" />
                          )}
                        </div>
                        <span className="font-mono text-[8px] text-text-disabled">
                          {size}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="font-sans text-xs font-semibold text-foreground truncate">
                      {def.display.name}
                    </div>
                    <div className="font-mono text-[9.5px] text-text-muted truncate">
                      {def.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Real-time React Flow Node Simulation */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
                <span>2. React Flow Graph Node Renderer</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle"
                >
                  Interactive Simulation
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Exact render fidelity matching the studio canvas. Respects pure black solid neumorphism, dark borders, and Geist typography.
              </p>
            </div>

            {/* Simulation Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 bg-surface-02 rounded-md border border-border-default text-xs font-mono">
                {(["idle", "running", "success", "error"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPreviewStatus(st)}
                    className={`px-2.5 py-1 rounded capitalize transition-colors ${
                      previewStatus === st
                        ? "bg-surface-04 text-foreground font-semibold"
                        : "text-text-muted hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsSelectedNode(!isSelectedNode)}
                className={`px-3 py-1.5 rounded-md border text-xs font-mono transition-colors ${
                  isSelectedNode
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "bg-surface-02 border-border-default text-text-muted hover:text-foreground"
                }`}
              >
                {isSelectedNode ? "Selected (Active)" : "Deselected"}
              </button>
            </div>
          </div>

          {/* Node Playground Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-md bg-surface-01 border border-border-default">
            {/* Visualizer Canvas Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[280px] bg-black rounded-md border border-border-subtle p-8 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #262626 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Rendered Graph Node */}
              <div
                className={`group relative min-w-[220px] max-w-[260px] rounded-md border transition-all duration-150 select-none text-foreground z-10 ${
                  isSelectedNode
                    ? "bg-surface-04 border-border-strong shadow-level-3 ring-1 ring-border-strong"
                    : "bg-surface-02 border-border-default hover:border-border-hover hover:bg-surface-03 shadow-level-1"
                }`}
              >
                {/* Simulated Input Ports (Top) */}
                <div className="absolute -top-1.5 left-0 right-0 flex justify-around pointer-events-none">
                  {activeComponent.ports
                    .filter((p) => p.type === "input" || p.type === "bidirectional")
                    .map((port) => (
                      <div
                        key={port.id}
                        title={`${port.name} (${port.dataType})`}
                        className="w-2.5 h-2.5 rounded-full bg-surface-03 border-2 border-border-strong shadow-sm"
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
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider font-semibold truncate">
                        DNS, CDN & EDGE
                      </span>
                      <span className="font-mono text-[9px] text-text-disabled shrink-0">
                        #e2e1
                      </span>
                    </div>
                    <h4
                      className={`font-sans text-xs leading-tight truncate ${
                        isSelectedNode
                          ? "text-foreground font-semibold"
                          : "text-text-primary font-medium"
                      }`}
                    >
                      {activeComponent.display.name}
                    </h4>
                  </div>
                </div>

                {/* Node Body / Metadata */}
                <div className="px-2.5 py-1.5 flex items-center justify-between font-mono text-[10px] text-text-muted bg-surface-01/40 rounded-b-md">
                  <span className="truncate max-w-[130px] text-text-secondary">
                    {activeComponent.display.description.slice(0, 24)}...
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted">
                    {
                      activeComponent.ports.filter(
                        (p) => p.type === "input" || p.type === "bidirectional"
                      ).length
                    }
                    in ·{" "}
                    {
                      activeComponent.ports.filter(
                        (p) => p.type === "output" || p.type === "bidirectional"
                      ).length
                    }
                    out
                  </span>
                </div>

                {/* Simulated Output Ports (Bottom) */}
                <div className="absolute -bottom-1.5 left-0 right-0 flex justify-around pointer-events-none">
                  {activeComponent.ports
                    .filter((p) => p.type === "output" || p.type === "bidirectional")
                    .map((port) => (
                      <div
                        key={port.id}
                        title={`${port.name} (${port.dataType})`}
                        className="w-2.5 h-2.5 rounded-full bg-surface-03 border-2 border-border-strong shadow-sm"
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* Component Schema & Spec Preview */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[11px] uppercase tracking-wider">
                  BaseNode Payload Spec
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(
                        infrastructureRegistry.createInfrastructureNode(
                          activeComponent.id
                        ),
                        null,
                        2
                      ),
                      "payload"
                    )
                  }
                  className="text-text-muted hover:text-foreground text-[10px] flex items-center gap-1"
                >
                  <CopyIcon className="h-3 w-3" />
                  <span>{copiedKey === "payload" ? "Copied!" : "Copy JSON"}</span>
                </button>
              </div>

              <pre className="p-3 rounded-md bg-surface-02 border border-border-default text-[10.5px] leading-relaxed text-text-secondary overflow-x-auto max-h-[260px] precision-rail">
                {JSON.stringify(
                  infrastructureRegistry.createInfrastructureNode(
                    activeComponent.id
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </section>

        {/* SECTION 3: Component Inventory & Protocol Ports Matrix */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
                <span>3. Component Inventory & Protocol Ports Matrix</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle"
                >
                  Strict Zod Contracts
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Protocol-accurate connection ports, architectural capabilities, and schema validation bounds.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border-default bg-surface-01 precision-rail">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-surface-02 border-b border-border-default font-mono text-[10.5px] text-text-muted">
                <tr>
                  <th className="py-2.5 px-3">Component</th>
                  <th className="py-2.5 px-3">Identifier</th>
                  <th className="py-2.5 px-3">Connection Ports</th>
                  <th className="py-2.5 px-3">Capabilities</th>
                  <th className="py-2.5 px-3">Default Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono text-[11px]">
                {ALL_DNS_CDN_EDGE_DEFINITIONS.map((def) => {
                  const Icon = getInfrastructureIcon(def.id);
                  return (
                    <tr
                      key={def.id}
                      className="hover:bg-surface-02/60 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                            {Icon && <Icon size={16} variant="colored" />}
                          </div>
                          <span className="font-sans font-medium text-foreground">
                            {def.display.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-text-muted font-mono">
                        {def.id}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {def.ports.map((p) => (
                            <span
                              key={p.id}
                              className="px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-[9px] text-text-secondary"
                              title={`${p.name} · ${p.description}`}
                            >
                              {p.type === "input"
                                ? "↓"
                                : p.type === "output"
                                  ? "↑"
                                  : "↕"}{" "}
                              {p.dataType}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {def.capabilities.map((c) => (
                            <span
                              key={c}
                              className="px-1 py-0.5 rounded bg-surface-03 text-[9px] text-text-muted"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-[280px]">
                        <div className="truncate text-text-disabled text-[10px]">
                          {JSON.stringify(def.defaultConfig).slice(0, 50)}...
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: Architecture Topology & Interconnection Spec */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
              <span>4. High-Performance Edge Ingress Topology</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-text-muted border-border-subtle"
              >
                Reference Architecture
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5">
              Production data path from global BGP Anycast routing down to origin compute instances.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
              <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-1">
                <div className="text-[10px] text-text-muted">TIER 1 — INGRESS</div>
                <div className="font-semibold text-foreground">Anycast Network</div>
                <div className="text-[9px] text-text-disabled">BGP Anycast PoP Routing</div>
              </div>

              <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-1">
                <div className="text-[10px] text-text-muted">TIER 2 — RESOLUTION</div>
                <div className="font-semibold text-foreground">Authoritative DNS</div>
                <div className="text-[9px] text-text-disabled">DNS Load Balancing & GSLB</div>
              </div>

              <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-1">
                <div className="text-[10px] text-text-muted">TIER 3 — ACCELERATION</div>
                <div className="font-semibold text-foreground">CDN & Edge Cache</div>
                <div className="text-[9px] text-text-disabled">TLS 1.3 & NVMe Caching</div>
              </div>

              <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-1">
                <div className="text-[10px] text-text-muted">TIER 4 — EDGE COMPUTE</div>
                <div className="font-semibold text-foreground">Edge Worker</div>
                <div className="text-[9px] text-text-disabled">V8 Isolates & Edge KV</div>
              </div>

              <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-1">
                <div className="text-[10px] text-text-muted">TIER 5 — ORIGIN PROXY</div>
                <div className="font-semibold text-foreground">Reverse Proxy</div>
                <div className="text-[9px] text-text-disabled">Layer 7 Routing & Pool Egress</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
