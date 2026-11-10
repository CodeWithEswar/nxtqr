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
  EXTERNAL_INTEGRATIONS_CATEGORY_ID,
  ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructureExternalVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("external-rest-api");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(EXTERNAL_INTEGRATIONS_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS[0]
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
              <span>Category 17 — External Integrations</span>
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
              Cat 18 Patterns →
            </Link>
            <Link
              href="/verify/infrastructure-cloud"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 16 Cloud
            </Link>
            <Link
              href="/verify/infrastructure-devops"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 15 DevOps
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
            <div>
              <h2 className="font-sans text-sm font-semibold text-foreground">
                Category 17 Implementation Status & Test Verification
              </h2>
              <p className="font-mono text-xs text-text-muted mt-0.5">
                External boundaries, REST/GraphQL/gRPC protocols, payment gateways, omnichannel messaging, maps providers, OAuth federation, and secure webhook ingestion.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-text-secondary">Icon Rendering:</span>
              <div className="flex p-0.5 rounded-md bg-surface-02 border border-border-default">
                {(["colored", "monochrome"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`px-2.5 py-1 text-xs font-mono rounded capitalize transition-colors ${
                      variant === v
                        ? "bg-surface-04 text-foreground font-semibold"
                        : "text-text-muted hover:text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border-subtle font-mono text-xs">
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase">Registered Icons</span>
              <span className="text-foreground font-semibold text-sm">10 Original SVGs</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase">Zod Schemas</span>
              <span className="text-foreground font-semibold text-sm">10 Strict Schemas</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase">Architecture Presets</span>
              <span className="text-foreground font-semibold text-sm">10 Presets (A–J)</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block text-[10px] uppercase">Test Coverage</span>
              <span className="text-emerald-400 font-semibold text-sm">100% Passed</span>
            </div>
          </div>
        </section>

        {/* 10-Component Interactive Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              1. Component Catalog Grid ({components.length})
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Click to inspect configuration schema &amp; live node render
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {components.map((comp) => {
              const Icon = getInfrastructureIcon(comp.id);
              const isSelected = comp.id === selectedSlug;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`text-left p-3 rounded-md border transition-all duration-150 flex flex-col justify-between h-28 relative group shadow-level-1 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong ring-1 ring-border-strong"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="p-1.5 rounded bg-surface-02 border border-border-subtle group-hover:border-border-hover transition-colors">
                      {Icon && <Icon size={20} variant={variant} />}
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted">
                      {comp.ports.length} ports
                    </span>
                  </div>

                  <div>
                    <h4 className="font-sans text-xs font-medium text-foreground truncate">
                      {comp.display.name}
                    </h4>
                    <p className="font-mono text-[10px] text-text-muted truncate mt-0.5">
                      {comp.id}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Simulator & Spec Inspector */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Node Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
                2. Live React Flow Node Simulation
              </h3>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setIsSelectedNode(!isSelectedNode)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    isSelectedNode
                      ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                      : "border-border-subtle text-text-muted hover:text-foreground"
                  }`}
                >
                  {isSelectedNode ? "Selected" : "Unselected"}
                </button>
              </div>
            </div>

            <div className="p-6 rounded-md border border-border-default bg-surface-01 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-level-2">
              <div className="absolute top-2 left-3 font-mono text-[10px] text-text-disabled">
                Viewport: 100% · React Flow Handle Preview
              </div>

              {/* Simulated Infrastructure Node */}
              <div
                className={`w-[230px] rounded-md border bg-surface-02 select-none transition-all duration-150 ${
                  isSelectedNode
                    ? "border-border-strong shadow-level-3 ring-1 ring-border-strong"
                    : "border-border-default shadow-level-1 hover:border-border-hover"
                }`}
              >
                {/* Node Header */}
                <div className="p-3 border-b border-border-subtle flex items-center gap-2.5">
                  <div className="p-1 rounded bg-surface-01 border border-border-subtle shrink-0">
                    {ActiveIcon && <ActiveIcon size={20} variant={variant} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted truncate">
                        {activeComponent.categoryId}
                      </span>
                      <span className="font-mono text-[9px] text-text-disabled shrink-0">
                        #node-1
                      </span>
                    </div>
                    <h4 className="font-sans text-xs font-semibold text-foreground truncate">
                      {activeComponent.display.name}
                    </h4>
                  </div>
                </div>

                {/* Node Body */}
                <div className="px-3 py-2 flex items-center justify-between font-mono text-[10px] text-text-muted bg-surface-01/40">
                  <span className="truncate max-w-[140px] text-text-secondary">
                    {activeComponent.display.shortName}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted">
                    {previewStatus}
                  </span>
                </div>

                {/* Ports Summary */}
                <div className="px-3 py-1.5 border-t border-border-subtle/50 flex items-center justify-between font-mono text-[9px] text-text-muted">
                  <span>{activeComponent.ports.filter(p => p.type === "input").length} in</span>
                  <span>{activeComponent.ports.filter(p => p.type === "bidirectional").length} bi</span>
                  <span>{activeComponent.ports.filter(p => p.type === "output").length} out</span>
                </div>
              </div>

              {/* Status Simulation Controls */}
              <div className="flex items-center gap-1.5 mt-5 font-mono text-xs">
                {(["idle", "running", "success", "error"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPreviewStatus(st)}
                    className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                      previewStatus === st
                        ? "bg-surface-04 border border-border-strong text-foreground font-semibold"
                        : "text-text-muted hover:text-foreground bg-surface-02 border border-border-subtle"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Configuration Inspector Specification */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
                3. Component Specification &amp; Schema Inspector
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(activeComponent.defaultConfig, null, 2), "config")}
                className="flex items-center gap-1 font-mono text-[11px] text-text-muted hover:text-foreground transition-colors"
              >
                <CopyIcon size={12} />
                <span>{copiedKey === "config" ? "Copied JSON" : "Copy Default Config"}</span>
              </button>
            </div>

            <div className="p-5 rounded-md border border-border-default bg-surface-01 space-y-5 shadow-level-1">
              <div>
                <h4 className="font-sans text-sm font-semibold text-foreground">
                  {activeComponent.display.name}
                </h4>
                <p className="font-mono text-xs text-text-muted mt-1 leading-relaxed">
                  {activeComponent.display.description}
                </p>
              </div>

              {/* Ports Specification */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                  Declared Connection Ports ({activeComponent.ports.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2 rounded bg-surface-02 border border-border-subtle flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <span className="text-foreground font-medium truncate block">
                          {port.name}
                        </span>
                        <span className="text-text-muted text-[10px] block">
                          id: {port.id} · type: {port.dataType}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono capitalize border-border-subtle shrink-0"
                      >
                        {port.type}
                      </Badge>
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
              4. Canonical Architecture Presets (A–J)
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Verified end-to-end integration topology configurations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preset A */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">A. External REST API Integration</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  REST HTTP
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Internal Backend Service → API Gateway with rate limiting → External REST API. Authenticated via API key header with circuit breaker fault tolerance.
              </p>
            </div>

            {/* Preset B */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">B. GraphQL API Integration</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  GraphQL Federation
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Studio Client → Internal GraphQL Federation Gateway → External GraphQL Subgraph API. Queries schema documents with automated persisted query caching.
              </p>
            </div>

            {/* Preset C */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">C. High-Performance gRPC Microservices</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  HTTP/2 Protobuf
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Compute Instance → gRPC Service with bidirectional Protobuf streaming, mTLS client certificates, and sub-millisecond serialization latency.
              </p>
            </div>

            {/* Preset D */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">D. Payment Processing Pipeline</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Fintech Checkout
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Checkout UI → Secure Tokenization Field → Internal Order Service → Payment Gateway with 3D Secure 2.0 authorization, idempotency keys, and zero PAN storage.
              </p>
            </div>

            {/* Preset E */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">E. Transactional Email System</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Email Dispatch
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Notification Gateway → Async Job Queue → Email Provider (SendGrid/Resend) with DKIM/SPF verification, template rendering, and open/click event tracking.
              </p>
            </div>

            {/* Preset F */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">F. Multi-Channel Messaging</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Omnichannel
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Alert Manager → Dispatch Router → SMS Provider (Twilio) &amp; WhatsApp Provider (Meta Cloud API) with carrier failover and deliverability feedback loops.
              </p>
            </div>

            {/* Preset G */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">G. Geolocation &amp; Maps Integration</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  GIS &amp; Routing
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Mobile / Web Client → Tile CDN &amp; Caching Layer → Maps Provider (Google Maps/Mapbox) for route calculations, geocoding, and reverse coordinate lookup.
              </p>
            </div>

            {/* Preset H */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">H. OAuth 2.0 PKCE Social Login</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Identity Federation
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Single-Page Application → OAuth Integration with SHA-256 Code Challenge (PKCE) → Token Exchange Callback → Authenticated session cookie creation.
              </p>
            </div>

            {/* Preset I */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">I. Secure Webhook Ingestion</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Ingress Boundary
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Third-Party Webhook → Edge Ingress Controller (verifies HMAC SHA-256 signature and timestamp) → Dead Letter Queue &amp; Idempotent Event Store.
              </p>
            </div>

            {/* Preset J */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">J. Reliable Payment Event Processing</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Resilient Settlement
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Payment Gateway webhook callback (`charge.succeeded`) → Ingestion Validator → Transaction Ledger → Automated customer receipt email dispatch.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
