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
  DISTRIBUTED_SYSTEMS_PATTERNS_CATEGORY_ID,
  ALL_DISTRIBUTED_SYSTEMS_PATTERNS_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructurePatternsVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("circuit-breaker");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(DISTRIBUTED_SYSTEMS_PATTERNS_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_DISTRIBUTED_SYSTEMS_PATTERNS_DEFINITIONS[0]
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
              <span>Category 18 — Distributed Systems Patterns</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                10 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-external"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 17 External
            </Link>
            <Link
              href="/verify/infrastructure-utilities"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 19 Utilities →
            </Link>
            <Link
              href="/verify/infrastructure-cloud"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 16 Cloud
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
                <span>Resilience, Coordination &amp; Orchestration Semantics</span>
              </h2>
              <p className="font-mono text-xs text-text-muted">
                10 architectural patterns &amp; coordination mechanisms modeled with typed ports, safety bounds, zero live network side-effects, and Pure Black Monochrome visual identity.
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
                Colored
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
        </section>

        {/* Component Catalog Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              1. Component Catalog (10 Components)
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Click a pattern or coordination service to inspect configuration
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {components.map((comp) => {
              const Icon = getInfrastructureIcon(comp.id);
              const isSelected = comp.id === selectedSlug;
              return (
                <div
                  key={comp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSlug(comp.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedSlug(comp.id);
                    }
                  }}
                  className={`p-3.5 rounded-md border text-left transition-all select-none cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2 ring-1 ring-border-strong"
                      : "bg-surface-01 border-border-default hover:bg-surface-02 hover:border-border-hover shadow-level-1"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2 rounded-md bg-surface-02 border border-border-subtle shrink-0 flex items-center justify-center">
                      {Icon ? (
                        <Icon className="h-6 w-6" variant={variant} />
                      ) : (
                        <div className="h-6 w-6 bg-surface-04 rounded" />
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                    >
                      v{comp.version}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-semibold text-foreground truncate">
                      {comp.display.name}
                    </h4>
                    <p className="font-mono text-[10px] text-text-muted line-clamp-2 mt-0.5">
                      {comp.display.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Simulator & Inspector */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
              2. Interactive Simulator &amp; Inspector
            </h3>
            <span className="font-mono text-[11px] text-text-secondary">
              Pure Black Monochrome solid neumorphic depth &amp; status simulation
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Node Interactive Visualizer */}
            <div className="lg:col-span-5 p-6 rounded-md border border-border-default bg-surface-01 flex flex-col items-center justify-center min-h-[320px] relative space-y-6 shadow-level-1">
              <div className="flex items-center gap-2 absolute top-3 left-3">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
                  Live Canvas Node Preview
                </span>
              </div>

              {/* Node Rendering Preview with Pure Black Monochrome depth */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsSelectedNode(!isSelectedNode)}
                className={`w-[240px] rounded-md border transition-all p-3.5 space-y-2.5 cursor-pointer select-none ${
                  isSelectedNode
                    ? "bg-surface-04 border-border-strong shadow-level-3 ring-1 ring-border-strong text-foreground font-semibold"
                    : "bg-surface-02 border-border-default hover:border-border-hover shadow-level-1 text-foreground"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded bg-surface-01 text-foreground border border-border-subtle shrink-0 flex items-center justify-center">
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
                  {activeComponent.display.shortName} · {String((activeComponent.defaultConfig as any).patternClassification || "Pattern")}
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

            {/* Right: Typed Configuration & Schema Inspector */}
            <div className="lg:col-span-7 p-6 rounded-md border border-border-default bg-surface-01 space-y-5 shadow-level-1">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="space-y-0.5">
                  <h4 className="font-sans text-sm font-semibold text-foreground">
                    {activeComponent.display.name}
                  </h4>
                  <span className="font-mono text-xs text-text-muted">
                    ID: {activeComponent.id} · Category: {DISTRIBUTED_SYSTEMS_PATTERNS_CATEGORY_ID}
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
                              : "text-emerald-400 border-emerald-900/40"
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
              Verified end-to-end distributed system pattern topologies
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preset A */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">A. Resilient Microservice Call</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Circuit Breaker
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Application Server → Circuit Breaker → Backend Service. Inbound calls are protected by error-rate thresholds; trips open to fast-fail or degraded responses to prevent cascading outages.
              </p>
            </div>

            {/* Preset B */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">B. Bulkhead Resource Isolation</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Bulkhead
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                API Gateway → Isolated Service Pools with separate thread pools and concurrency quotas. Prevents runaway requests in one tenant/service from exhausting server threads.
              </p>
            </div>

            {/* Preset C */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">C. Reliable Retry with Jitter</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Retry Controller
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Message Queue → Event Consumer → Retry Controller → Backend Service. Retries transient failures with exponential backoff, decorrelated full jitter, and retry budget quotas.
              </p>
            </div>

            {/* Preset D */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">D. Distributed Saga Orchestration</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Saga Orchestrator
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Saga Orchestrator → Order Service → Payment Service → Inventory Service. Coordinates multi-step distributed transactions with automated backward compensations on failure.
              </p>
            </div>

            {/* Preset E */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">E. High-Availability Leader Election</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Leader Election
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Worker Cluster Nodes → Leader Election via etcd/Consul key-leases with monotonic term epochs, periodic heartbeats, and strict quorum split-brain protection.
              </p>
            </div>

            {/* Preset F */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">F. Distributed Mutual Exclusion Lock</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Distributed Lock
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Competing Workers → Distributed Lock (Redis Redlock / etcd lease) with auto-renewal leases and monotonic fencing tokens ensuring linearizable mutual exclusion.
              </p>
            </div>

            {/* Preset G */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">G. Consensus Replicated State Machine</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Consensus Coordinator
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Client Command Proposals → Consensus Coordinator across 5 replica nodes using Raft consensus log replication, majority quorum commits, and periodic state snapshots.
              </p>
            </div>

            {/* Preset H */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">H. Idempotent Payment Processing</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Idempotency Service
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Webhook Receiver → Idempotency Service (atomic SET NX EX with request fingerprinting) → Backend Order Service. Eliminates duplicate transactions and replays cached results.
              </p>
            </div>

            {/* Preset I */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">I. High-Precision Distributed Scheduler</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Distributed Scheduler
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Distributed Scheduler with cron/delayed triggers → HA scheduler lease coordination → Competing Consumer Worker Pool with misfire recovery and concurrency control.
              </p>
            </div>

            {/* Preset J */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2.5 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">J. Dynamic Service Registry &amp; Discovery</h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Service Registry
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Microservice Cluster Instances → Service Registry (Consul/etcd) with heartbeat leases and streaming watch updates → Client-side Discovery Router &amp; API Gateway.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
