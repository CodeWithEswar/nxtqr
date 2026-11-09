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
  MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID,
  ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureMessagingVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("message-queue");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(MESSAGING_AND_EVENT_SYSTEMS_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_MESSAGING_AND_EVENT_SYSTEMS_DEFINITIONS[0]
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
              <span>Category 07 — Messaging & Event Systems</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                14 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-storage"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Next: Cat 08 Storage →
            </Link>
            <Link
              href="/verify/infrastructure-caching"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 06 Caching
            </Link>
            <Link
              href="/verify/infrastructure-databases"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 05 Databases
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
              <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                <span>1. Original Colored SVG Messaging & Event Systems Icon System</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  32×32 viewBox · Clean Geometry
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
                Semantic color palette: Messaging Orange (#FB923C), Broker Amber (#FBBF24), Event Violet (#A78BFA), Pub/Sub Cyan (#38BDF8), Streaming Teal (#2DD4BF), Kafka Indigo (#818CF8), Failure Red (#F87171), Consumer Green (#34D399), Producer Blue (#60A5FA).
              </p>
            </div>

            {/* Variant Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-surface-02 rounded-md border border-border-default text-xs font-mono shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setVariant("colored")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  variant === "colored"
                    ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Colored
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
                Monochrome
              </button>
            </div>
          </div>

          {/* 14 Icons Display Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {components.map((comp) => {
              const Icon = getInfrastructureIcon(comp.id);
              const isSelected = selectedSlug === comp.id;

              return (
                <div
                  key={comp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSlug(comp.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedSlug(comp.id)}
                  className={`group p-3 rounded-md border text-left transition-all duration-150 flex flex-col justify-between cursor-pointer select-none ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-3 ring-1 ring-border-strong"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02 shadow-level-1"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                      {Icon ? (
                        <Icon size={24} variant={variant} />
                      ) : (
                        <span className="font-mono text-xs text-text-disabled">N/A</span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                    >
                      Cat 07
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-0.5 min-w-0">
                    <h3 className="font-sans text-xs font-semibold text-foreground truncate">
                      {comp.display.name}
                    </h3>
                    <p className="font-mono text-[9.5px] text-text-muted truncate">
                      {comp.id}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Active Component Inspector & React Flow Node Simulation */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                <span>2. React Flow Node Simulation & Port Architecture</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  Solid Neumorphic Frame · Zero White Borders
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Simulated React Flow node representation matching live studio canvas styling.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsSelectedNode(!isSelectedNode)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                  isSelectedNode
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-1"
                    : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
                }`}
              >
                {isSelectedNode ? "Selected (Active)" : "Unselected"}
              </button>

              <div className="w-[140px]">
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

          {/* Node Playground Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 rounded-md bg-surface-01 border border-border-default">
            {/* Visualizer Canvas Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[280px] bg-black rounded-md border border-border-subtle p-6 sm:p-8 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #262626 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Simulated React Flow Node Frame */}
              <div
                className={`relative w-full max-w-[280px] rounded-md transition-all duration-140 select-none shadow-level-1 ${
                  isSelectedNode
                    ? "bg-surface-04 border border-border-strong shadow-level-3 ring-1 ring-border-strong"
                    : "bg-surface-02 border border-border-default hover:border-border-hover"
                }`}
              >
                {/* Node Ingress Port Handle */}
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface-03 border border-border-strong flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                </div>

                {/* Node Header */}
                <div className="p-2.5 flex items-start gap-2.5 border-b border-border-subtle/60">
                  <div className="h-7 w-7 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-center shrink-0">
                    {ActiveIcon && <ActiveIcon size={20} variant={variant} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider font-semibold truncate">
                        MESSAGING & EVENTS
                      </span>
                      <span className="font-mono text-[9px] text-text-disabled shrink-0">
                        #7001
                      </span>
                    </div>
                    <h4 className="font-sans text-xs leading-tight font-semibold text-foreground truncate mt-0.5">
                      {activeComponent.display.name}
                    </h4>
                  </div>
                </div>

                {/* Node Body / Metadata */}
                <div className="px-2.5 py-1.5 flex items-center justify-between font-mono text-[10px] text-text-muted bg-surface-01/40 rounded-b-md">
                  <span className="truncate max-w-[140px] text-text-secondary">
                    {activeComponent.display.shortName}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted">
                    {activeComponent.ports.length} Ports
                  </span>
                </div>

                {/* Node Egress Port Handle */}
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface-03 border border-border-strong flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                </div>
              </div>

              {/* Optical Size Preview Rail */}
              <div className="flex items-center gap-4 mt-6 p-2 rounded-md bg-surface-01/80 border border-border-subtle">
                <span className="font-mono text-[10px] text-text-muted uppercase">
                  Optical Scale:
                </span>
                {SIZES.map((sz) => (
                  <div key={sz} className="flex flex-col items-center gap-1">
                    {ActiveIcon && <ActiveIcon size={sz} variant={variant} />}
                    <span className="font-mono text-[8px] text-text-disabled">{sz}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Ports & Capabilities Inspector Pane */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-sans text-sm font-semibold text-foreground">
                  {activeComponent.display.name} Specifications
                </h3>
                <p className="font-sans text-xs text-text-muted leading-relaxed">
                  {activeComponent.display.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase text-text-muted font-semibold tracking-wider block">
                  Declared Connection Ports ({activeComponent.ports.length})
                </span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto precision-rail pr-1">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2 rounded border border-border-subtle bg-surface-02 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-foreground font-semibold block truncate">
                          {port.name}
                        </span>
                        <span className="text-[10px] text-text-muted block truncate">
                          {port.dataType}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-mono border-border-strong shrink-0"
                      >
                        {port.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase text-text-muted font-semibold tracking-wider block">
                  Architectural Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeComponent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded bg-surface-02 border border-border-subtle text-[10px] font-mono text-text-secondary"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Messaging Protocols, Ordering & Delivery Semantics Matrix */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
              <span>3. Messaging Protocols, Ordering & Delivery Semantics Matrix</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
              >
                14 Production Profiles
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5">
              Comparison of asynchronous messaging semantics, ordering guarantees, retry topologies, and durability models.
            </p>
          </div>

          <div className="border border-border-default rounded-md overflow-x-auto bg-surface-01 precision-rail">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-border-default bg-surface-02 text-[10px] text-text-muted uppercase tracking-wider">
                  <th className="p-3 font-semibold">Component</th>
                  <th className="p-3 font-semibold">Registry Slug</th>
                  <th className="p-3 font-semibold">Pattern</th>
                  <th className="p-3 font-semibold">Ordering Guarantee</th>
                  <th className="p-3 font-semibold">Delivery Semantics</th>
                  <th className="p-3 font-semibold">Durability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-text-secondary">
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Message Queue</td>
                  <td className="p-3 text-[11px] text-text-muted">message-queue</td>
                  <td className="p-3">Point-to-Point Buffer</td>
                  <td className="p-3">Strict FIFO / Standard</td>
                  <td className="p-3">At-Least-Once</td>
                  <td className="p-3">Persistent Disk</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Message Broker</td>
                  <td className="p-3 text-[11px] text-text-muted">message-broker</td>
                  <td className="p-3">Multi-Protocol Routing</td>
                  <td className="p-3">Per-Channel Ordered</td>
                  <td className="p-3">At-Least-Once</td>
                  <td className="p-3">Durable Disk / Raft</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Event Bus</td>
                  <td className="p-3 text-[11px] text-text-muted">event-bus</td>
                  <td className="p-3">CloudEvents Backbone</td>
                  <td className="p-3">Event-Type Routed</td>
                  <td className="p-3">At-Least-Once</td>
                  <td className="p-3">24h Event Retention</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Pub/Sub Topic</td>
                  <td className="p-3 text-[11px] text-text-muted">pub-sub-topic</td>
                  <td className="p-3">Fan-Out Broadcast</td>
                  <td className="p-3">Per-Ordering Key</td>
                  <td className="p-3">At-Least-Once</td>
                  <td className="p-3">TTL-Purged</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Event Stream</td>
                  <td className="p-3 text-[11px] text-text-muted">event-stream</td>
                  <td className="p-3">Partitioned Log</td>
                  <td className="p-3">Per-Partition Strict</td>
                  <td className="p-3">Replayable Offsets</td>
                  <td className="p-3">7-Day Durable Log</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Kafka Broker</td>
                  <td className="p-3 text-[11px] text-text-muted">kafka-broker</td>
                  <td className="p-3">Distributed Commit Log</td>
                  <td className="p-3">Per-Partition Strict</td>
                  <td className="p-3">ISR Quorum Acks</td>
                  <td className="p-3">Durable Segment Storage</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">RabbitMQ Broker</td>
                  <td className="p-3 text-[11px] text-text-muted">rabbitmq-broker</td>
                  <td className="p-3">Exchange & Queue Bindings</td>
                  <td className="p-3">Queue-Level FIFO</td>
                  <td className="p-3">Basic.Ack Manual</td>
                  <td className="p-3">Quorum Queues (Raft)</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Dead-Letter Queue</td>
                  <td className="p-3 text-[11px] text-text-muted">dead-letter-queue</td>
                  <td className="p-3">Failure Quarantine</td>
                  <td className="p-3">Quarantine Log</td>
                  <td className="p-3">Manual Redrive</td>
                  <td className="p-3">14-Day Isolation</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Retry Queue</td>
                  <td className="p-3 text-[11px] text-text-muted">retry-queue</td>
                  <td className="p-3">Exponential Backoff</td>
                  <td className="p-3">Delay-Scheduled</td>
                  <td className="p-3">Bounded Retries (5x)</td>
                  <td className="p-3">Transient Queue</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Event Consumer</td>
                  <td className="p-3 text-[11px] text-text-muted">event-consumer</td>
                  <td className="p-3">Concurrent Listener</td>
                  <td className="p-3">Offset-Ordered</td>
                  <td className="p-3">Commit-After-Processing</td>
                  <td className="p-3">Idempotent Execution</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Event Producer</td>
                  <td className="p-3 text-[11px] text-text-muted">event-producer</td>
                  <td className="p-3">Client Emitter Batching</td>
                  <td className="p-3">Client-Buffered</td>
                  <td className="p-3">All ISR Replicas</td>
                  <td className="p-3">Snappy Compressed</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Webhook Dispatcher</td>
                  <td className="p-3 text-[11px] text-text-muted">webhook-dispatcher</td>
                  <td className="p-3">HTTP Push Fan-Out</td>
                  <td className="p-3">Endpoint Independent</td>
                  <td className="p-3">HMAC-SHA256 Signed</td>
                  <td className="p-3">Backoff Retry Tasks</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Stream Processor</td>
                  <td className="p-3 text-[11px] text-text-muted">stream-processor</td>
                  <td className="p-3">Windowed Event-Time Aggs</td>
                  <td className="p-3">Watermark Event Time</td>
                  <td className="p-3">Exactly-Once Checkpoints</td>
                  <td className="p-3">RocksDB Local NVMe</td>
                </tr>
                <tr className="hover:bg-surface-02 transition-colors">
                  <td className="p-3 font-sans font-semibold text-foreground">Event Store</td>
                  <td className="p-3 text-[11px] text-text-muted">event-store</td>
                  <td className="p-3">Event Sourcing Journal</td>
                  <td className="p-3">Monotonic Sequence</td>
                  <td className="p-3">Optimistic Concurrency</td>
                  <td className="p-3">Immutable Append-Only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: Live TypeScript Contract & Schema Explorer */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                <span>4. Component Schema & Zod Default Contract</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  Typed Contract
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Exact default JSON configuration payload asserted against Zod schemas.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopy(
                  JSON.stringify(activeComponent.defaultConfig, null, 2),
                  "contract"
                )
              }
              className="px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              <span>{copiedKey === "contract" ? "Copied Contract!" : "Copy JSON"}</span>
            </button>
          </div>

          <div className="p-4 rounded-md bg-surface-01 border border-border-default">
            <pre className="font-mono text-xs text-text-secondary overflow-x-auto precision-rail leading-relaxed">
              {JSON.stringify(activeComponent.defaultConfig, null, 2)}
            </pre>
          </div>
        </section>
      </main>
    </div>
  );
}

