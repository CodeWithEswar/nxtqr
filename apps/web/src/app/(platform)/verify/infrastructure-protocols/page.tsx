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
  PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID,
  ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructureProtocolsVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("http-endpoint");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS[0]
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
              <span className="text-border-subtle hidden xs:inline">·</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-sky-400 border-sky-900/40 bg-sky-950/20 shrink-0"
              >
                20-Category Milestone (223 Components)
              </Badge>
            </div>
            <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5 flex-wrap">
              <span>Category 20 — Protocol &amp; Interface Components</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                12 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-utilities"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 19 Utilities
            </Link>
            <Link
              href="/verify/infrastructure-patterns"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 18 Patterns
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
                <span>Protocol Endpoints, Interface Contracts &amp; Communication Topology</span>
              </h2>
              <p className="font-mono text-xs text-text-muted">
                12 communication endpoints and interfaces modeling application-layer protocols, transport-layer protocols, API contracts, bidirectional streams, topic brokers, event subscriptions, and file uploads with zero live network calls or unvetted side-effects.
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
              <span className="text-[10px] text-text-muted uppercase block">Protocol Endpoints</span>
              <span className="text-foreground font-bold">12 Defined</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-[10px] text-text-muted uppercase block">Visual Variant</span>
              <span className="text-foreground font-bold capitalize">{variant}</span>
            </div>
            <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
              <span className="text-[10px] text-text-muted uppercase block">Execution Guard</span>
              <span className="text-emerald-400 font-bold">Interface Model / Safe</span>
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
              1. Component Inventory &amp; Iconography (12 Protocol Interfaces)
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Select component to inspect live canvas simulation
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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
                    {activeComponent.display.shortName} · {String((activeComponent.defaultConfig as any).protocolClassification || "Endpoint")}
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
                    ID: {activeComponent.id} · Category: {PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID}
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

        {/* 12 Canonical Architecture Presets (A–L) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              3. Canonical Architecture Presets (A–L)
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Verified end-to-end communication interface topologies
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Preset A */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">A. HTTP Internal API</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  HTTP Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Web Browser → HTTP Endpoint (port 8080) → Application Server. Cleartext request/response interface for local development or internal service mesh topologies.
              </p>
            </div>

            {/* Preset B */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">B. Secure HTTPS Ingress</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  HTTPS Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Web Browser → HTTPS Endpoint (port 443, TLS 1.3) → API Gateway → Backend Service. Edge-terminated encrypted traffic with mutual TLS verification.
              </p>
            </div>

            {/* Preset C */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">C. RESTful Resource API</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  REST Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Mobile Application → REST Endpoint (/api/v1/orders/{`{id}`}) → Backend Service → Database. Structured JSON contracts with cursor pagination and idempotency keys.
              </p>
            </div>

            {/* Preset D */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">D. Declarative GraphQL API</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  GraphQL Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Web Browser → GraphQL Endpoint (schema.graphql) → GraphQL Gateway → Microservices. Flexible field selection with max depth 10 and complexity limit 500.
              </p>
            </div>

            {/* Preset E */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">E. gRPC Microservices Mesh</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  gRPC Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Order Service → gRPC Endpoint (orders.v1.OrderService.proto) → Inventory Service. High-throughput bidirectional protobuf streaming with 3-second deadlines.
              </p>
            </div>

            {/* Preset F */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">F. Real-Time WebSocket Chat</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  WebSocket Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Web Browser → WebSocket Endpoint (/ws/v1/events) → WebSocket Server → Chat Service. Persistent full-duplex session tunnel with 30s heartbeats.
              </p>
            </div>

            {/* Preset G */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">G. Reliable Raw TCP Socket</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  TCP Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                TCP Client → TCP Endpoint (port 9000) → Custom Wire Protocol Service. Ordered byte stream with length-prefixed framing and keepalive probes.
              </p>
            </div>

            {/* Preset H */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">H. Fast UDP Telemetry Stream</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  UDP Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                IoT Sensor Devices → UDP Endpoint (port 5141) → Telemetry Ingestion Service. Connectionless 25,000 packets/sec bursts without handshake latency.
              </p>
            </div>

            {/* Preset I */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">I. MQTT IoT Pub/Sub Hub</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  MQTT Broker
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                IoT Fleet → MQTT Broker (MQTT 5.0, port 8883) → Subscribed Telemetry Services. Topic-based routing with QoS 1 guarantees for 50,000 devices.
              </p>
            </div>

            {/* Preset J */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">J. Event-Driven Subscription</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Event Subscription
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Orders Event Bus → Event Subscription (orders.events.v1) → Payment Worker Pool. Consumer group commits with manual ack and DLQ routing.
              </p>
            </div>

            {/* Preset K */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">K. Live Data Streaming Feed</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Streaming Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Market Ticker Engine → Streaming Endpoint (Server-Sent Events) → Web Browser Client. Continuous text/event-stream with flow backpressure.
              </p>
            </div>

            {/* Preset L */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">L. Resumable File Upload Pipe</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  File Transfer Endpoint
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Web Client → File Transfer Endpoint (HTTPS multipart / Tus.io) → Object Storage Bucket. 5GB chunked upload with SHA-256 integrity verification.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
