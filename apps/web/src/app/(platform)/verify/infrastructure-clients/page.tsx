"use client";

import * as React from "react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@nxtqr/ui";
import {
  CheckCircleIcon,
  CopyIcon,
  SlidersIcon,
  SearchIcon,
  LayersIcon,
} from "@nxtqr/icons";
import {
  clientIconRegistry,
  getClientInfrastructureIcon,
  type InfrastructureIconVariant,
} from "@nxtqr/icons";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import Link from "next/link";

const SIZES = [16, 20, 24, 32, 48] as const;

export default function InfrastructureClientsVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("web-browser");
  const [previewSize, setPreviewSize] = React.useState<number>(32);
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponents();
  }, []);

  const activeComponent = React.useMemo(() => {
    return infrastructureRegistry.getComponent(selectedSlug) || components[0];
  }, [selectedSlug, components]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const ActiveIcon = getClientInfrastructureIcon(activeComponent.id);

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
              <Badge variant="outline" className="font-mono text-[10px] text-emerald-400 border-emerald-900/40 bg-emerald-950/20">
                P0 Approved
              </Badge>
            </div>
            <h1 className="font-sans text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>Category 01 — Clients & User Interfaces</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle">
                10 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
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
                <Badge variant="outline" className="font-mono text-[10px] text-text-muted border-border-subtle">
                  32×32 viewBox · Clean Geometry
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Custom semantic color palette: Client Blue (#60A5FA), Deep Blue (#2563EB), Cyan (#38BDF8), Violet (#A78BFA), Neutral (#CBD5E1).
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
                Colored Variant
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {components.map((comp) => {
              const Icon = getClientInfrastructureIcon(comp.id);
              const isSelected = selectedSlug === comp.id;

              return (
                <div
                  key={comp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSlug(comp.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedSlug(comp.id)}
                  className={`p-3.5 rounded-md border text-left cursor-pointer transition-all duration-140 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                      {Icon && <Icon size={24} variant={variant} />}
                    </div>
                    <Badge variant="outline" className="font-mono text-[9px] text-text-disabled border-border-subtle">
                      32px
                    </Badge>
                  </div>

                  <h3 className="font-sans text-xs font-bold text-foreground truncate">
                    {comp.display.name}
                  </h3>
                  <p className="font-mono text-[10px] text-text-muted truncate mt-0.5">
                    {comp.id}
                  </p>

                  {/* Multi-Size Specimen Row */}
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border-subtle">
                    {SIZES.map((sz) => (
                      <div
                        key={sz}
                        className="flex flex-col items-center gap-1"
                        title={`${comp.display.name} @ ${sz}px`}
                      >
                        <div className="h-6 w-6 flex items-center justify-center">
                          {Icon && <Icon size={sz} variant={variant} />}
                        </div>
                        <span className="font-mono text-[8px] text-text-disabled">{sz}</span>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
                <span>2. Live React Flow Node Architecture Preview</span>
                <Badge variant="outline" className="font-mono text-[10px] text-text-muted border-border-subtle">
                  Pure Black Monochrome Shell
                </Badge>
              </h2>
              <p className="font-sans text-xs text-text-muted mt-0.5">
                Nodes maintain strict pure black surfaces, dark-gray boundaries, and zero white borders.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Canvas Node Simulation Card */}
            <div className="lg:col-span-7 rounded-md border border-border-default bg-surface-01 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  Interactive Node State Controls
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSelectedNode(!isSelectedNode)}
                    className={`px-2.5 py-1 rounded text-xs font-mono border transition-colors ${
                      isSelectedNode
                        ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                        : "bg-surface-02 border-border-subtle text-text-muted"
                    }`}
                  >
                    {isSelectedNode ? "Selected (Active)" : "Unselected"}
                  </button>

                  <select
                    value={previewStatus}
                    onChange={(e) => setPreviewStatus(e.target.value as any)}
                    className="h-7 px-2 bg-surface-02 border border-border-subtle rounded text-xs font-mono text-foreground outline-none"
                  >
                    <option value="idle">Status: idle</option>
                    <option value="running">Status: running</option>
                    <option value="success">Status: success</option>
                    <option value="error">Status: error</option>
                  </select>
                </div>
              </div>

              {/* Simulated Dark Studio Canvas */}
              <div className="h-64 rounded-md bg-black border border-border-subtle flex items-center justify-center p-6 relative overflow-hidden">
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
                  className={`relative min-w-[220px] max-w-[280px] rounded-md transition-all duration-140 select-none shadow-level-1 ${
                    isSelectedNode
                      ? "bg-surface-02 border border-border-strong shadow-level-3 ring-1 ring-border-strong"
                      : "bg-surface-02 border border-border-default hover:border-border-hover"
                  }`}
                >
                  {/* Left Ingress Handle */}
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface-03 border border-border-default flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                  </div>

                  {/* Node Header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border-subtle bg-surface-01 rounded-t-md">
                    <div className="h-6 w-6 rounded bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                      {ActiveIcon && <ActiveIcon size={18} variant={variant} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-mono text-[9px] text-text-muted">
                        <span className="truncate">{activeComponent.id}</span>
                      </div>
                      <h4 className="font-sans text-xs font-bold text-foreground truncate">
                        {activeComponent.display.name}
                      </h4>
                    </div>

                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
                  <div className="px-3 py-2 space-y-1.5 text-[10px] font-mono">
                    <div className="flex items-center justify-between text-text-muted">
                      <span>Ports</span>
                      <span className="text-text-secondary">{activeComponent.ports.length} Defined</span>
                    </div>
                    <div className="flex items-center justify-between text-text-muted">
                      <span>Environment</span>
                      <span className="text-text-secondary">Production</span>
                    </div>
                  </div>

                  {/* Right Egress Handle */}
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface-03 border border-border-default flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                  </div>
                </div>
              </div>

              {/* Code Snippet / Integration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-text-muted">React Component Import</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `import { ${activeComponent.display.name.replace(/\s+/g, "")}Icon } from "@nxtqr/icons";`,
                        "import"
                      )
                    }
                    className="flex items-center gap-1 text-[11px] font-mono text-text-secondary hover:text-foreground"
                  >
                    <CopyIcon className="h-3 w-3" />
                    <span>{copiedKey === "import" ? "Copied!" : "Copy Import"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-md bg-surface-02 border border-border-subtle font-mono text-xs text-text-secondary overflow-x-auto">
                  {`import { ${activeComponent.display.name.replace(/\s+/g, "")}Icon } from "@nxtqr/icons";`}
                </pre>
              </div>
            </div>

            {/* Component Schema & Port Telemetry */}
            <div className="lg:col-span-5 rounded-md border border-border-default bg-surface-01 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans text-sm font-bold text-foreground">
                    {activeComponent.display.name} Spec
                  </h3>
                  <span className="font-mono text-[10px] text-text-muted">
                    Registry ID: {activeComponent.id}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  v{activeComponent.version}
                </Badge>
              </div>

              <p className="font-sans text-xs text-text-secondary leading-relaxed">
                {activeComponent.display.description}
              </p>

              {/* Capabilities */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted font-semibold block">
                  Declared Capabilities
                </span>
                <div className="flex flex-wrap gap-1">
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

              {/* Ports List */}
              <div className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted font-semibold block">
                  Connection Ports ({activeComponent.ports.length})
                </span>
                <div className="space-y-1.5">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-between text-xs font-mono"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{port.name}</span>
                          <span className="text-[10px] text-text-muted">({port.type})</span>
                        </div>
                        {port.description && (
                          <p className="font-sans text-[10px] text-text-disabled">{port.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-text-secondary block">{port.dataType || "Any"}</span>
                        <span className="text-[9px] text-text-disabled">Cap: {port.capacity || "unlimited"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Port Compatibility & Downstream Matrix */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground flex items-center gap-2">
              <span>3. Infrastructure Interconnection Guide</span>
              <Badge variant="outline" className="font-mono text-[10px] text-text-muted border-border-subtle">
                Downstream Topologies
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5">
              Standardized topological routing between Category 01 (Clients) and upcoming platform layers.
            </p>
          </div>

          <div className="rounded-md border border-border-default bg-surface-01 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-default bg-surface-02 text-[10px] uppercase text-text-muted tracking-wider">
                    <th className="p-3">Client Component</th>
                    <th className="p-3">Primary Transport</th>
                    <th className="p-3">Typical Target Components</th>
                    <th className="p-3">Security & Auth Boundary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Web Browser / SPA</td>
                    <td className="p-3 text-text-secondary">HTTPS / WSS</td>
                    <td className="p-3 text-text-secondary">CDN, API Gateway, Reverse Proxy</td>
                    <td className="p-3 text-text-secondary">CORS, CSP, TLS 1.3, HttpOnly Cookies</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Mobile Application</td>
                    <td className="p-3 text-text-secondary">HTTPS / gRPC-Web</td>
                    <td className="p-3 text-text-secondary">API Gateway, Push Notification Service</td>
                    <td className="p-3 text-text-secondary">OAuth2 + PKCE, Certificate Pinning</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Desktop Application</td>
                    <td className="p-3 text-text-secondary">HTTPS / WSS / gRPC</td>
                    <td className="p-3 text-text-secondary">API Gateway, Update Server, Object Store</td>
                    <td className="p-3 text-text-secondary">OS Keychain, Code Signing, Token Store</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">SSR Application</td>
                    <td className="p-3 text-text-secondary">HTTP / gRPC</td>
                    <td className="p-3 text-text-secondary">Edge Cache, Microservices, Relational DB</td>
                    <td className="p-3 text-text-secondary">Server-side secrets, VPC Peering</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">CLI Client</td>
                    <td className="p-3 text-text-secondary">REST / gRPC / TCP</td>
                    <td className="p-3 text-text-secondary">Control Plane API, Telemetry Ingress</td>
                    <td className="p-3 text-text-secondary">API Tokens, SSH Keys, mTLS</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">IoT Device</td>
                    <td className="p-3 text-text-secondary">MQTT / CoAP / HTTPS</td>
                    <td className="p-3 text-text-secondary">IoT Message Broker, Time-Series Influx</td>
                    <td className="p-3 text-text-secondary">Hardware TPM, X.509 Device Certs</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-foreground">Third-Party Client</td>
                    <td className="p-3 text-text-secondary">HTTPS Webhooks / REST</td>
                    <td className="p-3 text-text-secondary">Partner Gateway, Ingress Rate Limiter</td>
                    <td className="p-3 text-text-secondary">HMAC Signatures, OAuth2 M2M, Scoped Tokens</td>
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
