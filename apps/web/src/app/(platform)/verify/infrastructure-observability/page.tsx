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
  OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID,
  ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructureObservabilityVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("monitoring-service");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS[0]
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
              <span>Category 10 — Observability & Reliability</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                10 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-security"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 09 Security
            </Link>
            <Link
              href="/verify/infrastructure-storage"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 08 Storage
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

      {/* Main Verification Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">
        {/* Section 1: Original Colored SVG Icon System */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-default pb-3">
            <div>
              <h2 className="font-sans text-sm sm:text-base font-bold text-foreground tracking-tight">
                1. Original Colored SVG Icon System
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                10 custom vector assets crafted specifically for distributed telemetry, metric scraping, log indexing, tracing, and incident routing.
              </p>
            </div>

            {/* Variant Switcher */}
            <div className="flex items-center gap-1.5 bg-surface-02 p-1 rounded-md border border-border-subtle self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setVariant("colored")}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
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
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  variant === "monochrome"
                    ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Monochrome
              </button>
            </div>
          </div>

          {/* 10 Icon System Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {components.map((comp) => {
              const IconComp = getInfrastructureIcon(comp.id);
              const isSelected = comp.id === selectedSlug;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`group relative p-3 rounded-md border transition-all duration-150 cursor-pointer flex flex-col items-center text-center space-y-2 select-none ${
                    isSelected
                      ? "bg-surface-03 border-border-strong ring-1 ring-border-strong shadow-level-2"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02 shadow-level-1"
                  }`}
                >
                  <div className="h-10 w-10 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    {IconComp ? (
                      <IconComp size={24} variant={variant} />
                    ) : (
                      <div className="h-6 w-6 rounded bg-surface-03" />
                    )}
                  </div>

                  <div className="w-full min-w-0">
                    <div className="font-sans text-xs font-semibold text-foreground truncate">
                      {comp.display.name}
                    </div>
                    <div className="font-mono text-[9px] text-text-muted truncate mt-0.5">
                      {comp.id}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(comp.id, comp.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-04 text-text-muted hover:text-foreground text-[10px] font-mono flex items-center gap-1"
                    title="Copy Component ID"
                  >
                    {copiedKey === comp.id ? (
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    ) : (
                      <CopyIcon className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Live Interactive Node Component Preview */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-3">
            <h2 className="font-sans text-sm sm:text-base font-bold text-foreground tracking-tight">
              2. Live Interactive Node Component Preview
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5">
              Inspect React Flow node rendering, port capacities, and schema-driven configurations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Simulated React Flow Canvas Node */}
            <div className="lg:col-span-5 rounded-md border border-border-default bg-surface-01 p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted border-b border-border-subtle pb-2">
                  <span>Graph Canvas Node</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSelectedNode(!isSelectedNode)}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                        isSelectedNode
                          ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                          : "border-border-subtle text-text-muted hover:text-foreground"
                      }`}
                    >
                      {isSelectedNode ? "Selected" : "Unselected"}
                    </button>
                  </div>
                </div>

                {/* Simulated React Flow Node */}
                <div className="py-6 flex justify-center">
                  <div
                    className={`relative rounded-md border transition-all duration-150 select-none bg-surface-01 ${
                      isSelectedNode
                        ? "border-border-strong shadow-level-2 ring-1 ring-border-strong"
                        : "border-border-default hover:border-border-hover shadow-level-1"
                    }`}
                    style={{ minWidth: 230 }}
                  >
                    {/* Node Header */}
                    <div className="p-3 flex items-start gap-2.5 border-b border-border-subtle/60">
                      <div className="h-8 w-8 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                        {ActiveIcon && <ActiveIcon size={22} variant={variant} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted font-semibold truncate">
                            Observability & Reliability
                          </span>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              previewStatus === "success"
                                ? "bg-emerald-400"
                                : previewStatus === "running"
                                ? "bg-sky-400 animate-pulse"
                                : previewStatus === "error"
                                ? "bg-red-400"
                                : "bg-zinc-600"
                            }`}
                          />
                        </div>
                        <h4 className="font-sans text-xs font-semibold text-foreground truncate mt-0.5">
                          {activeComponent.display.name}
                        </h4>
                      </div>
                    </div>

                    {/* Node Body Details */}
                    <div className="p-2.5 space-y-2 bg-surface-01/50 rounded-b-md">
                      <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
                        <span>Environment</span>
                        <span className="text-foreground capitalize">
                          {activeComponent.defaultConfig.environment || "Production"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
                        <span>SLA Availability</span>
                        <span className="text-foreground">
                          {activeComponent.defaultConfig.slaTier || "99.99%"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
                        <span>Ports</span>
                        <span className="text-foreground">
                          {activeComponent.ports.length} Connected
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Simulation Controls with standard @nxtqr/ui Select */}
              <div className="space-y-2 border-t border-border-subtle pt-3">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                  Simulate Node State
                </span>
                <div className="w-full">
                  <Select
                    value={previewStatus}
                    onValueChange={(val) => setPreviewStatus(val as any)}
                  >
                    <SelectTrigger className="h-8 w-full bg-surface-02 border-border-default text-xs font-mono text-foreground shadow-level-1 hover:border-border-hover">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
                      <SelectItem value="idle">Status: Idle</SelectItem>
                      <SelectItem value="running">Status: Running</SelectItem>
                      <SelectItem value="success">Status: Healthy</SelectItem>
                      <SelectItem value="error">Status: Alert / Degraded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column: Typed Inspector & Capabilities */}
            <div className="lg:col-span-7 rounded-md border border-border-default bg-surface-01 p-4 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-text-muted border-b border-border-subtle pb-2">
                <span>Schema-Driven Inspector</span>
                <span>Config Schema v{activeComponent.version}</span>
              </div>

              {/* Inspector Section */}
              <div className="space-y-3">
                {activeComponent.inspector.map((section) => (
                  <div key={section.id} className="space-y-2.5">
                    <div>
                      <h3 className="font-sans text-xs font-semibold text-foreground">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="font-sans text-[11px] text-text-muted mt-0.5">
                          {section.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      {section.fields.map((field) => {
                        const val = (activeComponent.defaultConfig as any)[field.path];
                        return (
                          <div
                            key={field.path}
                            className="p-2.5 rounded-md bg-surface-02 border border-border-subtle space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-text-secondary font-medium">
                                {field.label}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                {field.path}
                              </span>
                            </div>

                            {field.type === "select" && field.options ? (
                              <Select defaultValue={String(val || field.options[0].value)}>
                                <SelectTrigger className="h-7 w-full bg-surface-01 border-border-default text-xs font-mono text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground">
                                  {field.options.map((opt) => (
                                    <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.type === "number" ? (
                              <input
                                type="number"
                                defaultValue={val}
                                readOnly
                                className="h-7 w-full px-2 rounded-md bg-surface-01 border border-border-default text-xs font-mono text-foreground outline-none"
                              />
                            ) : field.type === "boolean" ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block h-2 w-2 rounded-full ${
                                    val ? "bg-emerald-400" : "bg-zinc-600"
                                  }`}
                                />
                                <span className="font-mono text-xs text-foreground">
                                  {val ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                            ) : (
                              <input
                                type="text"
                                defaultValue={String(val || "")}
                                readOnly
                                className="h-7 w-full px-2 rounded-md bg-surface-01 border border-border-default text-xs font-mono text-foreground outline-none truncate"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Capabilities Badges */}
              <div className="border-t border-border-subtle pt-3 space-y-2">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                  Telemetric Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeComponent.capabilities.map((cap) => (
                    <Badge
                      key={cap}
                      variant="outline"
                      className="text-[10px] font-mono text-text-secondary border-border-subtle bg-surface-02"
                    >
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Observability Architecture & Connection Matrix */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-3">
            <h2 className="font-sans text-sm sm:text-base font-bold text-foreground tracking-tight">
              3. Telemetry Connection Matrix & Typed Ports
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5">
              Strict typed input/output ports enforcing telemetry flows across scraping, forwarding, indexing, and routing.
            </p>
          </div>

          <div className="overflow-x-auto rounded-md border border-border-default bg-surface-01">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface-02 border-b border-border-default text-text-muted text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Input Ports</th>
                  <th className="p-3">Output Ports</th>
                  <th className="p-3">Primary Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {components.map((comp) => {
                  const inputs = comp.ports.filter((p) => p.type === "input");
                  const outputs = comp.ports.filter((p) => p.type === "output");
                  return (
                    <tr key={comp.id} className="hover:bg-surface-02/50 transition-colors">
                      <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>{comp.display.name}</span>
                        </div>
                        <span className="text-[10px] text-text-muted block mt-0.5">
                          {comp.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {inputs.map((p) => (
                            <div key={p.id} className="text-[10px] text-text-secondary truncate">
                              <span className="text-text-muted">↳</span> {p.name}{" "}
                              <span className="text-text-disabled">({p.dataType})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {outputs.map((p) => (
                            <div key={p.id} className="text-[10px] text-text-secondary truncate">
                              <span className="text-text-muted">↳</span> {p.name}{" "}
                              <span className="text-text-disabled">({p.dataType})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-[11px] text-text-secondary whitespace-nowrap">
                        {comp.capabilities[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Real-World Distributed Telemetry Blueprints */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-3">
            <h2 className="font-sans text-sm sm:text-base font-bold text-foreground tracking-tight">
              4. Real-World Telemetry Architecture Blueprints
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5">
              Verified end-to-end telemetry topologies for metrics scraping, distributed tracing, log aggregation, and status publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blueprint 1: High-Throughput Metrics Scraping & Alerting */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-semibold text-foreground">
                  Metrics Ingestion & Incident Alerting
                </h3>
                <Badge variant="outline" className="font-mono text-[9px] text-sky-400 border-sky-900/40">
                  Prometheus / OTLP
                </Badge>
              </div>
              <p className="font-sans text-xs text-text-muted leading-relaxed">
                Instrumented services expose Prometheus scraping endpoints scraped by <code className="text-text-secondary">metrics-collector</code>. Metric samples are batched into TSDB storage while threshold breaches trigger <code className="text-text-secondary">alert-manager</code> for on-call notification.
              </p>
              <div className="p-2.5 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] text-text-muted space-y-1">
                <div>App Pods ➔ Metrics Collector [scrape-target-in]</div>
                <div>Metrics Collector ➔ Monitoring Service [metrics-stream-in]</div>
                <div>Monitoring Service ➔ Alert Manager [alert-signal-in]</div>
                <div>Alert Manager ➔ On-Call PagerDuty [notification-dispatch-out]</div>
              </div>
            </div>

            {/* Blueprint 2: Distributed Tracing & W3C Span Flow */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-semibold text-foreground">
                  Distributed Tracing & Service Graphs
                </h3>
                <Badge variant="outline" className="font-mono text-[9px] text-violet-400 border-violet-900/40">
                  W3C TraceContext
                </Badge>
              </div>
              <p className="font-sans text-xs text-text-muted leading-relaxed">
                Ingress gateways inject <code className="text-text-secondary">traceparent</code> headers propagated across downstream microservices and async message queues. Spans are assembled by <code className="text-text-secondary">distributed-tracing</code> to render latency waterfall graphs.
              </p>
              <div className="p-2.5 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] text-text-muted space-y-1">
                <div>API Gateway ➔ Distributed Tracing [w3c-context-in]</div>
                <div>Microservices ➔ Distributed Tracing [span-ingress-in]</div>
                <div>Distributed Tracing ➔ Trace Graph DAG [dag-reconstruction-out]</div>
                <div>Distributed Tracing ➔ Service Map Sync [service-map-out]</div>
              </div>
            </div>

            {/* Blueprint 3: Structured Log Ingestion & Cold Retention */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-semibold text-foreground">
                  Structured Logging & Cold Storage Tiering
                </h3>
                <Badge variant="outline" className="font-mono text-[9px] text-amber-400 border-amber-900/40">
                  Loki / OpenSearch
                </Badge>
              </div>
              <p className="font-sans text-xs text-text-muted leading-relaxed">
                Host agents tail container stdout and journald logs with disk-backed buffers, forwarding to <code className="text-text-secondary">log-aggregator</code> for inverted indexing and compressed archival to cold Object Storage.
              </p>
              <div className="p-2.5 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] text-text-muted space-y-1">
                <div>Container Stdout ➔ Log Collector [container-stdout-in]</div>
                <div>Log Collector ➔ Log Aggregator [log-ingress-in]</div>
                <div>Log Aggregator ➔ Search Index [structured-index-out]</div>
                <div>Log Aggregator ➔ Cold Object Storage [cold-storage-out]</div>
              </div>
            </div>

            {/* Blueprint 4: Synthetic Probing & Public Status Page */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-semibold text-foreground">
                  Synthetic Probing & Public Status Dashboard
                </h3>
                <Badge variant="outline" className="font-mono text-[9px] text-teal-400 border-teal-900/40">
                  Multi-Region Quorum
                </Badge>
              </div>
              <p className="font-sans text-xs text-text-muted leading-relaxed">
                Multi-region synthetic probes continuously ping ingress endpoints. Confirmed outages update <code className="text-text-secondary">status-page</code> deployed on decoupled edge CDN to guarantee availability during core datacenter failures.
              </p>
              <div className="p-2.5 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] text-text-muted space-y-1">
                <div>Health Check Service ➔ Target Endpoints [probe-target-out]</div>
                <div>Health Check Service ➔ Status Page [health-status-in]</div>
                <div>Alert Manager ➔ Status Page [incident-sync-in]</div>
                <div>Status Page ➔ Edge CDN Global Broadcast [public-cdn-out]</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

