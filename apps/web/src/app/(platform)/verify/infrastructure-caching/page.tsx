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
  CACHING_AND_PERFORMANCE_CATEGORY_ID,
  ALL_CACHING_AND_PERFORMANCE_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureCachingVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("redis-cache");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(CACHING_AND_PERFORMANCE_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_CACHING_AND_PERFORMANCE_DEFINITIONS[0]
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
              <span>Category 06 — Caching & Performance</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                10 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-messaging"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Next: Cat 07 Messaging →
            </Link>
            <Link
              href="/verify/infrastructure-databases"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 05 Databases
            </Link>
            <Link
              href="/verify/infrastructure-compute"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 04 Compute
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
                <span>1. Original Colored SVG Caching & Performance Icon System</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  32×32 viewBox · Clean Geometry
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
                Semantic palette: Cache Amber (#FBBF24), Redis Red (#F87171), Memory Orange (#FB923C), Distributed Violet (#A78BFA), Application Cyan (#38BDF8), Session Green (#34D399), Query Teal (#2DD4BF), Read Blue (#60A5FA), Deferred Lavender (#C4B5FD).
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

          {/* 10 Icons Display Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
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
                  className={`p-3 sm:p-3.5 rounded-md border text-left cursor-pointer transition-all duration-140 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2 ring-1 ring-border-strong"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                      {Icon && <Icon size={24} variant={variant} />}
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] text-text-disabled border-border-subtle"
                    >
                      32px
                    </Badge>
                  </div>

                  <h3 className="font-sans text-xs font-semibold text-foreground truncate">
                    {comp.display.name}
                  </h3>
                  <p className="font-mono text-[10px] text-text-muted truncate mt-0.5">
                    {comp.id}
                  </p>

                  {/* Multi-Size Matrix Strip */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border-subtle">
                    {SIZES.map((sz) => (
                      <div
                        key={sz}
                        className="flex flex-col items-center gap-1"
                        title={`${comp.display.name} @ ${sz}px`}
                      >
                        <div className="flex items-center justify-center">
                          {Icon && <Icon size={Math.min(sz, 18)} variant={variant} />}
                        </div>
                        <span className="font-mono text-[8px] text-text-disabled">
                          {sz}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Interactive React Flow Node Renderer */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                <span>2. React Flow Canvas Node Renderer Fidelity</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  Pure Black Monochrome Frame
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
                Accurate rendering simulation adhering to AGENTS.md: dark neutral boundaries, restrained depth, and protocol-aware connection ports.
              </p>
            </div>

            {/* Simulation Controls */}
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsSelectedNode(!isSelectedNode)}
                className={`px-3 py-1.5 rounded-md border text-xs font-mono transition-colors flex-1 sm:flex-initial text-center ${
                  isSelectedNode
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-1"
                    : "bg-surface-02 border-border-default text-text-muted hover:text-foreground"
                }`}
              >
                {isSelectedNode ? "Selected (Active)" : "Deselected"}
              </button>

              {/* Design System UI Select Component */}
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
                <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border-subtle bg-surface-01 rounded-t-md">
                  <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                    {ActiveIcon && <ActiveIcon size={18} variant={variant} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-text-muted">
                      <span className="truncate uppercase">CACHING & PERF</span>
                      <span className="text-text-disabled">#6001</span>
                    </div>
                    <h4 className="font-sans text-xs font-semibold text-foreground truncate leading-tight">
                      {activeComponent.display.name}
                    </h4>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      previewStatus === "running"
                        ? "bg-blue-400 animate-pulse"
                        : previewStatus === "success"
                        ? "bg-emerald-400"
                        : previewStatus === "error"
                        ? "bg-red-400"
                        : "bg-text-disabled"
                    }`}
                  />
                </div>

                {/* Node Body */}
                <div className="px-3 py-2 space-y-1 text-[10px] font-mono bg-surface-01/50 rounded-b-md">
                  <div className="flex items-center justify-between text-text-muted">
                    <span>Ports</span>
                    <span className="text-text-secondary">{activeComponent.ports.length} Defined</span>
                  </div>
                  <div className="flex items-center justify-between text-text-muted">
                    <span>Capabilities</span>
                    <span className="text-text-secondary">{activeComponent.capabilities.length} Tags</span>
                  </div>
                  <div className="flex items-center justify-between text-text-muted">
                    <span>Eviction Policy</span>
                    <span className="text-text-secondary truncate max-w-[120px]">
                      {(activeComponent.defaultConfig as any).maxmemoryPolicy ||
                        (activeComponent.defaultConfig as any).evictionPolicy ||
                        (activeComponent.defaultConfig as any).invalidationStrategy ||
                        "Standard"}
                    </span>
                  </div>
                </div>

                {/* Node Egress Port Handle */}
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface-03 border border-border-strong flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                </div>
              </div>
            </div>

            {/* Active Component Inspector Pane */}
            <div className="lg:col-span-5 rounded-md border border-border-default bg-surface-01 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="min-w-0 pr-2">
                  <h3 className="font-sans text-sm font-bold text-foreground truncate">
                    {activeComponent.display.name}
                  </h3>
                  <span className="font-mono text-[10px] text-text-muted truncate block">
                    ID: {activeComponent.id}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0">
                  v{activeComponent.version}
                </Badge>
              </div>

              {/* Capabilities Badges */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted font-semibold block">
                  Capabilities & Features
                </span>
                <div className="flex flex-wrap gap-1">
                  {activeComponent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] text-text-secondary"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ports List */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted font-semibold block">
                  Connection Ports ({activeComponent.ports.length})
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto precision-rail pr-1">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-between text-xs font-mono"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">{port.name}</span>
                          <span className="text-[10px] text-text-muted shrink-0">({port.type})</span>
                        </div>
                        {port.description && (
                          <p className="font-sans text-[10px] text-text-disabled truncate">{port.description}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-text-secondary block">{port.dataType || "Any"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Caching Topology & Policy Matrix */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
              <span>3. Caching Topology & Write Policy Matrix</span>
              <Badge variant="outline" className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0">
                Architectural Semantics
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
              Standardized caching policies and operational trade-offs across Category 06 components.
            </p>
          </div>

          <div className="rounded-md border border-border-default bg-surface-01 overflow-hidden">
            <div className="overflow-x-auto precision-rail">
              <table className="w-full text-left font-mono text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-border-default bg-surface-02 text-[10px] uppercase text-text-muted tracking-wider">
                    <th className="p-3">Component</th>
                    <th className="p-3">Primary Concept</th>
                    <th className="p-3">Write Semantics</th>
                    <th className="p-3">Consistency / Durability</th>
                    <th className="p-3">Typical Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-text-secondary">
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Redis Cache</td>
                    <td className="p-3">In-memory data structures</td>
                    <td className="p-3">Sync in-memory + async replica</td>
                    <td className="p-3">RDB Snapshots & AOF</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 1 ms</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Memcached Cache</td>
                    <td className="p-3">Multithreaded slab allocator</td>
                    <td className="p-3">Direct memory write</td>
                    <td className="p-3 text-text-disabled">Ephemeral (No persistence)</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 0.5 ms</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Application Cache</td>
                    <td className="p-3">Embedded JVM/process heap</td>
                    <td className="p-3">Zero serialization pointer write</td>
                    <td className="p-3">Process-scoped memory</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 0.05 ms</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Distributed Cache</td>
                    <td className="p-3">Consistent hash cluster</td>
                    <td className="p-3">Partitioned mesh sync</td>
                    <td className="p-3">Configurable quorum (W+R&gt;N)</td>
                    <td className="p-3 text-emerald-400 font-mono">1 – 3 ms</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Session Cache</td>
                    <td className="p-3">User principal token store</td>
                    <td className="p-3">Sliding expiration update</td>
                    <td className="p-3">Multi-AZ replicated</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 1 ms</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Query Cache</td>
                    <td className="p-3">SQL/ORM result set cache</td>
                    <td className="p-3">Table mutation invalidation</td>
                    <td className="p-3">Stale-while-revalidate</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 2 ms</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Read-Through Cache</td>
                    <td className="p-3">Transparent cache miss loader</td>
                    <td className="p-3">Backing store lazy fetch</td>
                    <td className="p-3">Origin database source of truth</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 3 ms</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Write-Through Cache</td>
                    <td className="p-3">Synchronous lockstep write</td>
                    <td className="p-3">Cache + DB synchronous commit</td>
                    <td className="p-3">Strong durable consistency</td>
                    <td className="p-3 text-amber-400 font-mono">10 – 30 ms (DB bound)</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Write-Behind Cache</td>
                    <td className="p-3">Deferred asynchronous queue</td>
                    <td className="p-3">Immediate memory ACK + batch flush</td>
                    <td className="p-3">WAL-backed queue buffer</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 1 ms (ACK)</td>
                  </tr>
                  <tr className="hover:bg-surface-02/60 transition-colors">
                    <td className="p-3 font-semibold text-foreground">Rate Limit Store</td>
                    <td className="p-3">Sliding window token counter</td>
                    <td className="p-3">Atomic Lua script increment</td>
                    <td className="p-3">In-memory atomic counters</td>
                    <td className="p-3 text-emerald-400 font-mono">&lt; 0.8 ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: Live Technical JSON Schema & Contract Inspector */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                <span>4. Configuration Schema & Contract Snapshot</span>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Valid default payload verified against @nxtqr/validation and Zod contracts.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  JSON.stringify(activeComponent.defaultConfig, null, 2),
                  "schema-json"
                )
              }
              className="px-2.5 py-1 rounded bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <CopyIcon className="h-3 w-3" />
              <span>{copiedKey === "schema-json" ? "Copied!" : "Copy JSON"}</span>
            </button>
          </div>

          <pre className="p-4 rounded-md bg-surface-02 border border-border-subtle font-mono text-xs text-text-secondary overflow-x-auto precision-rail leading-relaxed">
            {JSON.stringify(activeComponent.defaultConfig, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}

