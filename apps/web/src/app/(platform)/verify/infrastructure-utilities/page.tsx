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
  ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructureUtilitiesVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("system-boundary");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS[0]
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
                className="font-mono text-[10px] text-emerald-400 border-emerald-900/40 bg-emerald-950/20 shrink-0"
              >
                P0 Approved
              </Badge>
            </div>
            <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5 flex-wrap">
              <span>Category 19 — Architecture &amp; Diagram Utilities</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                10 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-patterns"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 18 Patterns
            </Link>
            <Link
              href="/verify/infrastructure-external"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 17 External
            </Link>
            <Link
              href="/workspace"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Verification Summary Banner */}
        <section className="p-4 sm:p-5 rounded-md border border-border-default bg-surface-01 space-y-3 shadow-level-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2">
                <span>Structural Boundaries, Documentation &amp; Diagram Semantics</span>
              </h2>
              <p className="font-mono text-xs text-text-muted">
                10 architectural utilities including system perimeters, service groups, network boundaries, trust zones, architecture notes, decision annotations (ADRs), traffic labels, connection junctions, external dependencies, and failure zones.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setVariant("colored")}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  variant === "colored"
                    ? "bg-surface-03 text-foreground font-semibold border border-border-strong shadow-level-1"
                    : "text-text-muted hover:text-foreground border border-transparent"
                }`}
              >
                Colored SVG
              </button>
              <button
                type="button"
                onClick={() => setVariant("monochrome")}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  variant === "monochrome"
                    ? "bg-surface-03 text-foreground font-semibold border border-border-strong shadow-level-1"
                    : "text-text-muted hover:text-foreground border border-transparent"
                }`}
              >
                Monochrome
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border-subtle font-mono text-xs">
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-[10px] text-text-muted uppercase block">Utility Components</span>
              <span className="text-foreground font-bold">10 Defined</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-[10px] text-text-muted uppercase block">Visual Variant</span>
              <span className="text-foreground font-bold capitalize">{variant}</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-[10px] text-text-muted uppercase block">Execution Guard</span>
              <span className="text-emerald-400 font-bold">Structural / Safe</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-[10px] text-text-muted uppercase block">Design Standards</span>
              <span className="text-foreground font-bold">Pure Black (0 White Borders)</span>
            </div>
          </div>
        </section>

        {/* 1. Component Grid Catalog */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              1. Component Inventory &amp; Iconography (10 Utilities)
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Select component to inspect live canvas simulation
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {components.map((comp) => {
              const Icon = getInfrastructureIcon(comp.id);
              const isSelected = selectedSlug === comp.id;

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`p-3 rounded-md text-left transition-all border flex flex-col justify-between gap-3 group relative ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2"
                      : "bg-surface-01 border-border-default hover:bg-surface-02 hover:border-border-hover shadow-level-1"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded bg-surface-02 border border-border-subtle flex items-center justify-center">
                      {Icon ? (
                        <Icon className="h-6 w-6" variant={variant} />
                      ) : (
                        <div className="h-6 w-6 bg-surface-03 rounded" />
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono text-text-muted border-border-subtle"
                    >
                      v{comp.version}
                    </Badge>
                  </div>

                  <div className="space-y-1 min-w-0 w-full">
                    <div className="font-sans text-xs font-semibold text-foreground truncate">
                      {comp.display.name}
                    </div>
                    <div className="font-mono text-[10px] text-text-muted truncate">
                      {comp.display.shortName}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Interactive Simulator & Inspector */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              2. Canvas Node Simulator &amp; Schema Inspector
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Active: <strong className="text-foreground">{activeComponent.display.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: React Flow Simulation Card */}
            <div className="lg:col-span-5 p-6 rounded-md border border-border-default bg-surface-01 space-y-4 shadow-level-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                    Canvas Node Representation
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSelectedNode(!isSelectedNode)}
                    className="font-mono text-[10px] text-text-secondary hover:text-foreground underline underline-offset-4"
                  >
                    {isSelectedNode ? "Deselect" : "Select Node"}
                  </button>
                </div>

                {/* Simulated Graph Node */}
                <div
                  className={`p-3.5 rounded-md border bg-surface-02 space-y-2.5 transition-colors shadow-level-1 ${
                    isSelectedNode
                      ? "border-border-strong bg-surface-03 shadow-level-3"
                      : "border-border-default hover:border-border-hover"
                  }`}
                  style={{ minWidth: 200 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded bg-surface-01 border border-border-subtle flex items-center justify-center shrink-0">
                        {ActiveIcon ? (
                          <ActiveIcon className="h-4 w-4" variant={variant} />
                        ) : (
                          <div className="h-4 w-4 bg-surface-03 rounded" />
                        )}
                      </div>
                      <span className="font-sans text-xs font-semibold truncate">
                        {activeComponent.display.name}
                      </span>
                    </div>
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        previewStatus === "running"
                          ? "bg-amber-400 animate-pulse"
                          : previewStatus === "success"
                            ? "bg-emerald-500"
                            : previewStatus === "error"
                              ? "bg-red-500"
                              : "bg-neutral-600"
                      }`}
                    />
                  </div>

                  <div className="text-[10px] font-mono text-text-muted truncate">
                    {activeComponent.display.shortName} · {String((activeComponent.defaultConfig as any).diagramUtilityClassification || "Utility")}
                  </div>

                  {/* Ports Rendering */}
                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[9px] font-mono text-text-muted">
                    <span>
                      IN: {activeComponent.ports.filter((p) => p.type === "input").length}
                    </span>
                    <span>
                      OUT: {activeComponent.ports.filter((p) => p.type === "output").length}
                    </span>
                  </div>
                </div>

                {/* Simulator Controls */}
                <div className="flex items-center gap-2 pt-2">
                  {(["idle", "running", "success", "error"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPreviewStatus(st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider transition-colors ${
                        previewStatus === st
                          ? "bg-surface-03 text-foreground font-bold border border-border-strong"
                          : "text-text-muted hover:text-foreground border border-transparent"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capabilities Pills */}
              <div className="space-y-1.5 pt-4 border-t border-border-subtle">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                  Capabilities &amp; Behaviors
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeComponent.capabilities.map((cap) => (
                    <Badge
                      key={cap}
                      variant="outline"
                      className="font-mono text-[10px] text-text-muted border-border-subtle bg-surface-02"
                    >
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Typed Configuration & Schema Inspector */}
            <div className="lg:col-span-7 p-6 rounded-md border border-border-default bg-surface-01 space-y-5 shadow-level-1">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="space-y-0.5">
                  <h4 className="font-sans text-sm font-semibold text-foreground">
                    {activeComponent.display.name}
                  </h4>
                  <span className="font-mono text-xs text-text-muted">
                    ID: {activeComponent.id} · Category: {ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(activeComponent.defaultConfig, null, 2),
                      activeComponent.id
                    )
                  }
                  className="px-2.5 py-1 rounded border border-border-subtle bg-surface-02 hover:bg-surface-03 text-xs font-mono text-text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <CopyIcon className="h-3 w-3" />
                  <span>{copiedKey === activeComponent.id ? "Copied" : "Copy JSON"}</span>
                </button>
              </div>

              {/* Typed Ports Inventory */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                  Declared Connection Ports ({activeComponent.ports.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-subtle space-y-1 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate">{port.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase ${
                            port.type === "input"
                              ? "text-sky-400 border-sky-900/40"
                              : port.type === "output"
                                ? "text-emerald-400 border-emerald-900/40"
                                : "text-violet-400 border-violet-900/40"
                          }`}
                        >
                          {port.type}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-text-muted truncate">
                        ID: {port.id} · Type: {port.dataType}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Configuration JSON */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                  Default Schema Configuration
                </span>
                <pre className="p-3 rounded-md bg-surface-02 border border-border-subtle font-mono text-[11px] text-text-secondary overflow-x-auto max-h-[160px] scrollbar-thin">
                  {JSON.stringify(activeComponent.defaultConfig, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 10 Canonical Architecture Presets (A–J) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              3. Canonical Architecture Presets (A–J)
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Verified end-to-end architecture &amp; diagram utility topologies
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preset A */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">A. System Context Boundary</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  System Boundary
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Core Banking Subsystem perimeter encapsulating accounts, ledger, and transaction services. Establishes VPC-isolated boundaries separating public clients, partner integrations, and external payment rails.
              </p>
            </div>

            {/* Preset B */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">B. Microservice Domain Grouping</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Service Group
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Order Processing Services group encapsulating Checkout Service, Order API, and Cart Worker within the Commerce Domain. Defines shared namespace policies, tier classifications, and targeted service capacities.
              </p>
            </div>

            {/* Preset C */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">C. Multi-Tier Network Segmentation</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Network Boundary
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Production VPC with private subnets (10.0.1.0/24) and public DMZ subnets (10.0.0.0/24). Models direct routing, NAT gateway egress rules, and private DNS resolution partitions across application tiers.
              </p>
            </div>

            {/* Preset D */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">D. Zero-Trust Security Demarcation</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Trust Boundary
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Demarcation from untrusted public internet to DMZ protected services. Enforces mutual TLS (mTLS), JWT token attestation, and strict SOC2 / PCI-DSS v4.0 boundary crossing audit logging.
              </p>
            </div>

            {/* Preset E */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">E. Architecture Decision Linkage</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Decision Annotation
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                ADR-0042: Adopt Event-Driven Microservices. Formally links message broker and consumer services to documented governance decisions, architectural rationale, and eventual consistency trade-offs.
              </p>
            </div>

            {/* Preset F */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">F. Annotated API Traffic Flow</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Traffic Label
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Edge-attached annotation across API Gateway and Checkout Service. Documents gRPC/HTTP2 transport, Protobuf serialization, 10k-100k req/sec throughput, and 50ms p99 SLA latency guarantees.
              </p>
            </div>

            {/* Preset G */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">G. Orthogonal Connection Routing Hub</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Connection Junction
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Orthogonal bus splitter routing high-throughput events to multiple consumers. Prevents visual clutter from diagonal overlapping edges, providing clean right-angle bus aggregation and tapping.
              </p>
            </div>

            {/* Preset H */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">H. Third-Party Dependency SLA Map</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  External Dependency
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Stripe Payment Processing SaaS reference with Tier-1 degraded criticality, 99.99% uptime contract, and automated local cache failover during upstream vendor degradation.
              </p>
            </div>

            {/* Preset I */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">I. Multi-AZ Disaster Recovery Domain</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Failure Zone
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Primary AZ Failure Domain modeling a 33% traffic blast radius, 15-minute RTO, and 0-minute RPO. Validated with automated chaos injection GameDays and automated read-replica promotion.
              </p>
            </div>

            {/* Preset J */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">J. Complete Architecture Blueprint</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Architecture Note
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Comprehensive C4-style architectural blueprint combining system boundaries, service domain groups, trust perimeters, ADR annotations, and contextual runbook sticky notes.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
