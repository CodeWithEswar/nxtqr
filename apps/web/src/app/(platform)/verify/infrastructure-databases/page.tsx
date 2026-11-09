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
  DATABASES_AND_PERSISTENCE_CATEGORY_ID,
  ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureDatabasesVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("relational-database");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(DATABASES_AND_PERSISTENCE_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS[0]
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
              <span>Category 05 — Databases & Persistence</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                15 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-compute"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 04 Compute
            </Link>
            <Link
              href="/verify/infrastructure-networking"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 03 Network
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
                <span>1. Original Colored SVG Database Icon System</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  32×32 viewBox · Clean Geometry
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
                Custom semantic technical database palette: Database Green (#34D399), PostgreSQL Blue (#60A5FA), Storage Cyan (#38BDF8), Distributed Indigo (#818CF8), Graph Violet (#A78BFA), Vector Lavender (#C4B5FD), Memory Orange (#FB923C), Key-Value Amber (#FBBF24), Cluster Teal (#2DD4BF), Structural Neutral (#CBD5E1).
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

          {/* 15 Icons Display Grid */}
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
                      {Icon && <Icon size={22} variant={variant} />}
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] text-text-disabled border-border-subtle"
                    >
                      32px
                    </Badge>
                  </div>

                  <h3 className="font-sans text-xs font-semibold text-foreground truncate leading-tight">
                    {comp.display.name}
                  </h3>
                  <p className="font-mono text-[9.5px] text-text-muted truncate mt-0.5">
                    {comp.id}
                  </p>

                  {/* Multi-Size Specimen Row */}
                  <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-border-subtle">
                    {SIZES.map((sz) => (
                      <div
                        key={sz}
                        className="flex flex-col items-center gap-0.5"
                        title={`${comp.display.name} @ ${sz}px`}
                      >
                        <div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                          {Icon && <Icon size={sz} variant={variant} />}
                        </div>
                        <span className="font-mono text-[7.5px] sm:text-[8px] text-text-disabled">
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

        {/* SECTION 2: Interactive Component Inspector & Node Renderer Preview */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border-subtle pb-3">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
                <span>2. Live React Flow Node Architecture Preview</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  Pure Black Monochrome Shell
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
                Nodes maintain strict pure black surfaces, dark-gray boundaries, and zero white borders.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Live Canvas Node Simulation Card */}
            <div className="lg:col-span-7 rounded-md border border-border-default bg-surface-01 p-4 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
                  Interactive Node Controls
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
                    {isSelectedNode ? "Selected (Active)" : "Unselected"}
                  </button>

                  {/* Standard Radix / NXTQR UI Select Component */}
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
                        <SelectItem value="error">Status: Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Simulated Dark Studio Canvas */}
              <div className="h-64 rounded-md bg-black border border-border-subtle flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
                {/* Engineering Dot Grid Background */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: "radial-gradient(#404040 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />

                {/* Simulated GraphNode */}
                <div
                  className={`relative w-full max-w-[260px] rounded-md transition-all duration-140 select-none shadow-level-1 ${
                    isSelectedNode
                      ? "bg-surface-04 border border-border-strong shadow-level-3 ring-1 ring-border-strong"
                      : "bg-surface-02 border border-border-default hover:border-border-hover"
                  }`}
                >
                  {/* Top Input Handles */}
                  <div className="absolute -top-1.5 left-0 right-0 flex justify-around pointer-events-none">
                    {activeComponent.ports
                      .filter((p) => p.type === "input" || p.type === "bidirectional")
                      .map((port, idx, arr) => {
                        const leftPercent = arr.length === 1 ? 50 : ((idx + 1) / (arr.length + 1)) * 100;
                        return (
                          <div
                            key={port.id}
                            style={{ left: `${leftPercent}%` }}
                            className="w-2.5 h-2.5 rounded-full bg-surface-03 border-2 border-border-strong transform -translate-x-1/2"
                            title={`${port.name} (${port.dataType})`}
                          />
                        );
                      })}
                  </div>

                  {/* Node Header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border-subtle bg-surface-01 rounded-t-md">
                    <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                      {ActiveIcon && <ActiveIcon size={18} variant={variant} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-mono text-[9px] text-text-muted">
                        <span className="truncate uppercase">DATABASES & PERSISTENCE</span>
                        <span className="text-text-disabled">#5001</span>
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

                  {/* Node Body / Metadata */}
                  <div className="px-3 py-2 flex items-center justify-between font-mono text-[10px] text-text-muted bg-surface-02 rounded-b-md">
                    <span className="truncate max-w-[140px] text-text-secondary">
                      {activeComponent.display.description.slice(0, 24)}...
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-03 border border-border-subtle text-text-muted">
                      {activeComponent.ports.filter((p) => p.type === "input" || p.type === "bidirectional").length}in ·{" "}
                      {activeComponent.ports.filter((p) => p.type === "output" || p.type === "bidirectional").length}out
                    </span>
                  </div>

                  {/* Bottom Output Handles */}
                  <div className="absolute -bottom-1.5 left-0 right-0 flex justify-around pointer-events-none">
                    {activeComponent.ports
                      .filter((p) => p.type === "output" || p.type === "bidirectional")
                      .map((port, idx, arr) => {
                        const leftPercent = arr.length === 1 ? 50 : ((idx + 1) / (arr.length + 1)) * 100;
                        return (
                          <div
                            key={port.id}
                            style={{ left: `${leftPercent}%` }}
                            className="w-2.5 h-2.5 rounded-full bg-surface-03 border-2 border-border-strong transform -translate-x-1/2"
                            title={`${port.name} (${port.dataType})`}
                          />
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 text-xs font-mono pt-2">
                <span className="text-text-muted text-[11px]">
                  Slug: <code className="text-foreground">{activeComponent.id}</code>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeComponent.id, "slug")}
                  className="px-2.5 py-1 rounded bg-surface-02 hover:bg-surface-03 border border-border-default text-text-secondary hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <CopyIcon className="h-3 w-3" />
                  <span>{copiedKey === "slug" ? "Copied!" : "Copy Slug"}</span>
                </button>
              </div>
            </div>

            {/* Component Inspector Configuration Details */}
            <div className="lg:col-span-5 rounded-md border border-border-default bg-surface-01 p-4 sm:p-6 space-y-4">
              <div className="border-b border-border-subtle pb-3">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
                  Inspector Properties & Ports
                </span>
                <h3 className="font-sans text-sm font-semibold text-foreground mt-1">
                  {activeComponent.display.name}
                </h3>
                <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
                  {activeComponent.display.description}
                </p>
              </div>

              {/* Connection Ports Matrix */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider font-semibold">
                  Defined Ports ({activeComponent.ports.length})
                </span>
                <div className="space-y-1.5">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2 rounded bg-surface-02 border border-border-subtle flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              port.type === "input"
                                ? "bg-blue-400"
                                : port.type === "output"
                                ? "bg-emerald-400"
                                : "bg-purple-400"
                            }`}
                          />
                          <span className="font-mono text-xs text-foreground font-semibold">
                            {port.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5 leading-tight">
                          {port.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono text-[9px] text-text-secondary border-border-subtle shrink-0"
                      >
                        {port.dataType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capabilities Badges */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <span className="font-mono text-[10px] uppercase text-text-muted tracking-wider font-semibold">
                  Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeComponent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface-02 border border-border-subtle text-text-secondary"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: End-to-End Enterprise Architecture Topology Guide */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
              <span>3. Databases & Persistence Interconnection Architecture</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-text-muted border-border-subtle"
              >
                End-to-End Reference
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5">
              Standardized topological data flow across Category 04 (Compute) and Category 05 (Databases & Persistence).
            </p>
          </div>

          <div className="rounded-md border border-border-default bg-surface-01 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-default bg-surface-02 text-[10px] uppercase text-text-muted tracking-wider">
                    <th className="p-3">Source Component</th>
                    <th className="p-3">Egress Port</th>
                    <th className="p-3">Transport Protocol</th>
                    <th className="p-3">Destination Component</th>
                    <th className="p-3">Ingress Port</th>
                    <th className="p-3">Topology Semantics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Backend Service</td>
                    <td className="p-3 text-text-secondary">data-egress-out</td>
                    <td className="p-3 text-text-secondary">Postgres / TLS</td>
                    <td className="p-3 font-semibold text-foreground">Database Primary</td>
                    <td className="p-3 text-text-secondary">primary-write-in</td>
                    <td className="p-3 text-text-muted">Authoritative write transactions & serialized commits</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Database Primary</td>
                    <td className="p-3 text-text-secondary">replication-stream-out</td>
                    <td className="p-3 text-text-secondary">WAL Streaming / Binlog</td>
                    <td className="p-3 font-semibold text-foreground">Read Replica</td>
                    <td className="p-3 text-text-secondary">replication-stream-in</td>
                    <td className="p-3 text-text-muted">Asynchronous physical streaming to scale query throughput</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Backend Service</td>
                    <td className="p-3 text-text-secondary">data-egress-out</td>
                    <td className="p-3 text-text-secondary">RESP / TCP</td>
                    <td className="p-3 font-semibold text-foreground">In-Memory Database</td>
                    <td className="p-3 text-text-secondary">memory-command-in</td>
                    <td className="p-3 text-text-muted">Sub-millisecond session caching & ephemeral key-value lookup</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Microservice</td>
                    <td className="p-3 text-text-secondary">event-egress-out</td>
                    <td className="p-3 text-text-secondary">gRPC / HTTPS</td>
                    <td className="p-3 font-semibold text-foreground">Vector Database</td>
                    <td className="p-3 text-text-secondary">embedding-ingest-in</td>
                    <td className="p-3 text-text-muted">Embedding vector ingestion for RAG and semantic search</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Scheduled Job</td>
                    <td className="p-3 text-text-secondary">job-output</td>
                    <td className="p-3 text-text-secondary">Snowpipe / Parquet</td>
                    <td className="p-3 font-semibold text-foreground">Data Warehouse</td>
                    <td className="p-3 text-text-secondary">data-ingest-in</td>
                    <td className="p-3 text-text-muted">Micro-batch analytical ingestion for BI and reporting</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Document Database</td>
                    <td className="p-3 text-text-secondary">change-stream-out</td>
                    <td className="p-3 text-text-secondary">CDC / Kafka Stream</td>
                    <td className="p-3 font-semibold text-foreground">Batch Processor</td>
                    <td className="p-3 text-text-secondary">batch-input-in</td>
                    <td className="p-3 text-text-muted">Change data capture event streaming to event pipelines</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

