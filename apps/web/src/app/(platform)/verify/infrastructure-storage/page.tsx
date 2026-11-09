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
  STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID,
  ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureStorageVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("object-storage");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_STORAGE_AND_FILE_SYSTEMS_DEFINITIONS[0]
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
              <span>Category 08 — Storage & File Systems</span>
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
              ← Cat 07 Messaging
            </Link>
            <Link
              href="/verify/infrastructure-caching"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 06 Caching
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
                <span>1. Original Colored SVG Icon System</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
                >
                  32×32 viewBox · Clean Geometry
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Semantic palette: Storage Cyan (#38BDF8), Block Indigo (#818CF8), File Blue (#60A5FA), Distributed Teal (#2DD4BF), Blob Green (#34D399), Media Lavender (#C4B5FD), Backup Amber (#FBBF24), Archive Orange (#FB923C), Gateway Violet (#A78BFA).
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-surface-02 p-1 rounded-md border border-border-default self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setVariant("colored")}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  variant === "colored"
                    ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Colored Variant
              </button>
              <button
                type="button"
                onClick={() => setVariant("monochrome")}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  variant === "monochrome"
                    ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Monochrome
              </button>
            </div>
          </div>

          {/* Icon Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {components.map((comp) => {
              const IconComp = getInfrastructureIcon(comp.id);
              const isSelected = comp.id === selectedSlug;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`p-3 rounded-md border text-left cursor-pointer transition-all duration-140 flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2 ring-1 ring-border-strong"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02 shadow-level-1"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted uppercase">
                      {comp.id}
                    </span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-center py-2 min-h-[56px]">
                    {IconComp ? (
                      <IconComp size={40} variant={variant} />
                    ) : (
                      <div className="text-text-disabled text-xs">Missing Icon</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-sans text-xs font-semibold text-foreground truncate">
                      {comp.display.name}
                    </div>
                    <div className="font-mono text-[9px] text-text-muted truncate mt-0.5">
                      {comp.ports.length} ports · v{comp.version}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Icon Scaling Benchmark */}
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
                Scaling Precision: {activeComponent.display.name}
              </span>
              <span className="font-mono text-[11px] text-text-muted">
                16px · 20px · 24px · 32px · 48px
              </span>
            </div>

            <div className="flex items-center gap-6 overflow-x-auto py-2 precision-rail">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="h-14 w-14 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center">
                    {ActiveIcon && <ActiveIcon size={size} variant={variant} />}
                  </div>
                  <span className="font-mono text-[10px] text-text-muted">
                    {size}px
                  </span>
                </div>
              ))}
            </div>
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
                  <div className="h-7 w-7 rounded-md bg-surface-01 border border-border-default flex items-center justify-center shrink-0">
                    {ActiveIcon && <ActiveIcon size={20} variant={variant} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-xs font-semibold text-foreground truncate">
                      {activeComponent.display.name}
                    </div>
                    <div className="font-mono text-[9px] text-text-muted truncate mt-0.5">
                      {activeComponent.id}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        previewStatus === "success"
                          ? "bg-emerald-400"
                          : previewStatus === "running"
                          ? "bg-sky-400 animate-pulse"
                          : previewStatus === "error"
                          ? "bg-rose-400"
                          : "bg-neutral-600"
                      }`}
                    />
                  </div>
                </div>

                {/* Node Body & Specs */}
                <div className="p-2.5 space-y-2 text-[10.5px] font-mono">
                  <div className="flex justify-between text-text-muted">
                    <span>Category</span>
                    <span className="text-foreground">Cat 08 Storage</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Ports</span>
                    <span className="text-foreground">{activeComponent.ports.length} channels</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Protocol</span>
                    <span className="text-foreground truncate max-w-[140px]">
                      {activeComponent.ports[0]?.dataType || "Standard_Storage"}
                    </span>
                  </div>
                </div>

                {/* Node Egress Port Handle */}
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface-03 border border-border-strong flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-6 font-mono text-[11px] text-text-muted flex items-center gap-2">
                <span>Simulated status:</span>
                <span className="text-foreground uppercase font-semibold">
                  {previewStatus}
                </span>
              </div>
            </div>

            {/* Ports & Schema Inspector */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-sans text-xs font-semibold text-foreground uppercase tracking-wider">
                  Connection Ports ({activeComponent.ports.length})
                </h3>
                <p className="font-sans text-[11px] text-text-muted">
                  Storage-aware ports with data typing and capacity limits.
                </p>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto precision-rail pr-1">
                {activeComponent.ports.map((port) => (
                  <div
                    key={port.id}
                    className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {port.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] border-border-subtle text-text-muted"
                        >
                          {port.type}
                        </Badge>
                      </div>
                      <div className="font-mono text-[10px] text-text-muted mt-0.5">
                        {port.dataType}
                      </div>
                      <p className="font-sans text-[10.5px] text-text-disabled mt-1 line-clamp-1">
                        {port.description}
                      </p>
                    </div>

                    <div className="font-mono text-[10px] text-text-muted shrink-0 text-right">
                      {port.capacity ? `${port.capacity.toLocaleString()} ops` : "Dynamic"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Inspector Sections */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <h3 className="font-sans text-xs font-semibold text-foreground uppercase tracking-wider">
                  Inspector Schema Groups ({activeComponent.inspector.length})
                </h3>
                <div className="space-y-1.5">
                  {activeComponent.inspector.map((group) => (
                    <div
                      key={group.id}
                      className="p-2 rounded bg-surface-02 border border-border-subtle flex items-center justify-between text-xs"
                    >
                      <span className="font-sans text-text-secondary">
                        {group.title}
                      </span>
                      <span className="font-mono text-[10px] text-text-muted">
                        {group.fields.length} controls
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Storage Comparison Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                <span>3. Storage Protocols, Durability & Access Characteristics</span>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Comparative breakdown of storage abstractions, access semantics, and durability models.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border-default overflow-hidden bg-surface-01">
            <div className="overflow-x-auto precision-rail">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-02 border-b border-border-default text-text-muted">
                  <tr>
                    <th className="p-3 font-semibold">Component</th>
                    <th className="p-3 font-semibold">Identifier</th>
                    <th className="p-3 font-semibold">Protocol / Interface</th>
                    <th className="p-3 font-semibold">Latency Target</th>
                    <th className="p-3 font-semibold">Durability Model</th>
                    <th className="p-3 font-semibold">Tiering & Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-text-secondary">
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Object Storage</td>
                    <td className="p-3 text-[11px] text-text-muted">object-storage</td>
                    <td className="p-3">S3 / REST HTTPS</td>
                    <td className="p-3">10 – 30 ms</td>
                    <td className="p-3">11 9s Durability</td>
                    <td className="p-3">Standard → IA → Glacier</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Block Storage</td>
                    <td className="p-3 text-[11px] text-text-muted">block-storage</td>
                    <td className="p-3">NVMe-oF / iSCSI</td>
                    <td className="p-3">&lt; 1.5 ms</td>
                    <td className="p-3">Multi-AZ Synchronous</td>
                    <td className="p-3">EBS Snapshot Rolling</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">File Storage</td>
                    <td className="p-3 text-[11px] text-text-muted">file-storage</td>
                    <td className="p-3">NFSv4.1 / SMB 3.0</td>
                    <td className="p-3">2 – 5 ms</td>
                    <td className="p-3">Regional Replicated NAS</td>
                    <td className="p-3">Daily Snapshot 7d</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Distributed File System</td>
                    <td className="p-3 text-[11px] text-text-muted">distributed-file-system</td>
                    <td className="p-3">CephFS / HDFS Client</td>
                    <td className="p-3">3 – 8 ms</td>
                    <td className="p-3">Erasure Coded (k+m)</td>
                    <td className="p-3">CRUSH Map Rack-Aware</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Blob Storage</td>
                    <td className="p-3 text-[11px] text-text-muted">blob-storage</td>
                    <td className="p-3">Azure Blob REST</td>
                    <td className="p-3">10 – 25 ms</td>
                    <td className="p-3">ZRS (Zone-Redundant)</td>
                    <td className="p-3">Hot → Cool → Archive</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Media Storage</td>
                    <td className="p-3 text-[11px] text-text-muted">media-storage</td>
                    <td className="p-3">HLS/DASH + CDN Pull</td>
                    <td className="p-3">&lt; 10 ms (Origin Shield)</td>
                    <td className="p-3">Geo-Replicated Object Tier</td>
                    <td className="p-3">365d Transcoded Manifest</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Backup Storage</td>
                    <td className="p-3 text-[11px] text-text-muted">backup-storage</td>
                    <td className="p-3">Snapshot Feed / WAL</td>
                    <td className="p-3">Batch / Scheduled</td>
                    <td className="p-3">Air-Gapped Immutable WORM</td>
                    <td className="p-3">Target RPO 60m / RTO 120m</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Archive Storage</td>
                    <td className="p-3 text-[11px] text-text-muted">archive-storage</td>
                    <td className="p-3">Cold Vault Ingest</td>
                    <td className="p-3">3 – 12 hours (Thawed)</td>
                    <td className="p-3">Deep Cold Multi-AZ WORM</td>
                    <td className="p-3">7 – 100 Year Regulatory</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Storage Gateway</td>
                    <td className="p-3 text-[11px] text-text-muted">storage-gateway</td>
                    <td className="p-3">NFS/SMB to Cloud S3</td>
                    <td className="p-3">&lt; 1 ms (Local SSD Cache)</td>
                    <td className="p-3">Cloud-Backed Mirror</td>
                    <td className="p-3">Local SSD Write-Back</td>
                  </tr>
                  <tr className="hover:bg-surface-02 transition-colors">
                    <td className="p-3 font-sans font-semibold text-foreground">Content Repository</td>
                    <td className="p-3 text-[11px] text-text-muted">content-repository</td>
                    <td className="p-3">GraphQL / REST Headless</td>
                    <td className="p-3">5 – 15 ms</td>
                    <td className="p-3">Immutable Commit Journal</td>
                    <td className="p-3">Draft & Published States</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: Live Technical JSON Schema & Contract Snapshot */}
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
