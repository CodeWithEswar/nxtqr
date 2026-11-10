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
  SECURITY_AND_IDENTITY_CATEGORY_ID,
  ALL_SECURITY_AND_IDENTITY_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructureSecurityVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("authentication-service");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(SECURITY_AND_IDENTITY_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_SECURITY_AND_IDENTITY_DEFINITIONS[0]
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
              <span>Category 09 — Security & Identity</span>
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
              ← Cat 08 Storage
            </Link>
            <Link
              href="/verify/infrastructure-observability"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-foreground font-semibold transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 10 Observability →
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
              <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
                Semantic palette: Identity Blue (#60A5FA), Authorization Green (#34D399), Federation Violet (#A78BFA), OAuth Indigo (#818CF8), OIDC Cyan (#38BDF8), Credential Amber (#FBBF24), Secrets Lavender (#C4B5FD), Crypto Orange (#FB923C), Threat Red (#F87171), Rate Limit Teal (#2DD4BF).
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-surface-02 p-1 rounded-md border border-border-default self-start sm:self-auto shrink-0">
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

          {/* Grid of 14 Security Component Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {components.map((comp) => {
              const IconComp = getInfrastructureIcon(comp.id);
              const isSelected = selectedSlug === comp.id;

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`p-3 rounded-md border transition-all cursor-pointer flex flex-col items-center text-center gap-2 select-none ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02"
                  }`}
                >
                  <div className="h-10 w-10 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                    {IconComp ? (
                      <IconComp size={24} variant={variant} />
                    ) : (
                      <div className="h-4 w-4 bg-surface-04" />
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <span className="font-sans text-xs font-medium text-foreground block truncate">
                      {comp.display.shortName}
                    </span>
                    <span className="font-mono text-[9px] text-text-muted block truncate mt-0.5">
                      {comp.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Interactive React Flow Node & Inspector Preview */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
              <span>2. Interactive Node & Security Inspector Preview</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-emerald-400 border-emerald-900/40 bg-emerald-950/20 shrink-0"
              >
                Active: {activeComponent.display.name}
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
              Verify pure black monochrome node presentation, network handle bounds, and schema-driven inspector fields.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Interactive Node Preview Sandbox */}
            <div className="lg:col-span-5 rounded-md border border-border-default bg-surface-01 p-4 flex flex-col justify-between space-y-6">
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
                    style={{ minWidth: 220 }}
                  >
                    {/* Node Header */}
                    <div className="p-3 flex items-start gap-2.5 border-b border-border-subtle/60">
                      <div className="h-8 w-8 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                        {ActiveIcon && <ActiveIcon size={22} variant={variant} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted font-semibold truncate">
                            Security & Identity
                          </span>
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              previewStatus === "success"
                                ? "bg-emerald-400"
                                : previewStatus === "running"
                                ? "bg-amber-400 animate-pulse"
                                : previewStatus === "error"
                                ? "bg-rose-400"
                                : "bg-text-disabled"
                            }`}
                          />
                        </div>
                        <h4 className="font-sans text-xs font-semibold text-foreground truncate mt-0.5">
                          {activeComponent.display.name}
                        </h4>
                      </div>
                    </div>

                    {/* Node Body / Subtitle */}
                    <div className="p-2.5 bg-surface-02/40 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-text-muted">
                        <span>ID:</span>
                        <span className="text-foreground truncate max-w-[130px]">{activeComponent.id}</span>
                      </div>
                      <div className="flex items-center justify-between text-text-muted">
                        <span>Ports:</span>
                        <span className="text-text-secondary">{activeComponent.ports.length} typed</span>
                      </div>
                      <div className="flex items-center justify-between text-text-muted">
                        <span>Status:</span>
                        <span className="text-emerald-400 capitalize">{previewStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Simulation Controls */}
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
                      <SelectItem value="error">Status: Threat Blocked / Error</SelectItem>
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
                        <p className="font-sans text-[11px] text-text-muted">
                          {section.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {section.fields.map((field) => (
                        <div
                          key={field.path}
                          className="p-2 rounded bg-surface-02 border border-border-subtle space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] text-text-secondary truncate">
                              {field.label}
                            </span>
                            <span className="font-mono text-[9px] text-text-disabled uppercase">
                              {field.type}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-foreground truncate">
                            {String((activeComponent.defaultConfig as any)[field.path] ?? "—")}
                            {field.unit ? ` ${field.unit}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Capabilities Badges */}
              <div className="space-y-2 border-t border-border-subtle pt-3">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                  Declared Security Capabilities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeComponent.capabilities.map((cap) => (
                    <Badge
                      key={cap}
                      variant="outline"
                      className="font-mono text-[10px] bg-surface-02 border-border-subtle text-text-secondary"
                    >
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ports Details */}
              <div className="space-y-2 border-t border-border-subtle pt-3">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                  Security Connection Ports ({activeComponent.ports.length})
                </span>
                <div className="space-y-1.5">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2 rounded bg-surface-02/60 border border-border-subtle flex items-center justify-between text-xs font-mono"
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
                        <span className="text-[9px] text-text-disabled">
                          Cap: {port.capacity ? `${port.capacity.toLocaleString()} ops` : "Dynamic"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Security Architecture Topology & Protocols Matrix */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
              <span>3. Security Protocols, Trust Boundaries & Topologies</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-text-muted border-border-subtle shrink-0"
              >
                Topological Guidelines
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
              Standardized topological relationships separating identity verification, access evaluation, payload filtering, and cryptographic secrets.
            </p>
          </div>

          <div className="rounded-md border border-border-default bg-surface-01 overflow-hidden">
            <div className="overflow-x-auto precision-rail">
              <table className="w-full text-left font-mono text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-border-default bg-surface-02 text-[10px] uppercase text-text-muted tracking-wider">
                    <th className="p-3">Component</th>
                    <th className="p-3">Security Responsibility</th>
                    <th className="p-3">Primary Protocol</th>
                    <th className="p-3">Trust Boundary Scope</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {components.map((comp) => {
                    const isSelected = selectedSlug === comp.id;
                    const primaryProtocol =
                      comp.id === "oauth-provider"
                        ? "OAuth 2.0 + PKCE (RFC 6749)"
                        : comp.id === "openid-connect-provider"
                        ? "OIDC Core 1.0 (JWT/JWKS)"
                        : comp.id === "identity-provider"
                        ? "SAML 2.0 / SCIM / OIDC"
                        : comp.id === "web-application-firewall"
                        ? "HTTP/S (TLS Decrypted WAF)"
                        : comp.id === "ddos-protection"
                        ? "BGP Anycast / SYN Proxy"
                        : comp.id === "key-management-service"
                        ? "PKCS#11 / FIPS 140-2 L3"
                        : comp.id === "secrets-manager"
                        ? "KMS Envelope Vault API"
                        : comp.id === "certificate-authority"
                        ? "ACME v2 / X.509 / OCSP"
                        : comp.id === "policy-engine"
                        ? "Rego OPA / Cedar Query"
                        : comp.id === "rate-limiter"
                        ? "Token Bucket / Redis Cluster"
                        : comp.id === "token-service"
                        ? "RFC 7519 JWT / RFC 8693"
                        : "mTLS / Internal RPC";

                    const trustBoundary =
                      comp.id === "ddos-protection" || comp.id === "web-application-firewall"
                        ? "Public Internet Perimeter"
                        : comp.id === "identity-provider" || comp.id === "oauth-provider" || comp.id === "openid-connect-provider"
                        ? "Federated Identity Plane"
                        : comp.id === "key-management-service" || comp.id === "secrets-manager"
                        ? "Zero-Trust Cryptographic Core"
                        : "Internal Service Mesh";

                    return (
                      <tr
                        key={comp.id}
                        className={`hover:bg-surface-02/60 transition-colors ${
                          isSelected ? "bg-surface-02 font-medium" : ""
                        }`}
                      >
                        <td className="p-3 text-foreground font-semibold flex items-center gap-2">
                          <span className="truncate">{comp.display.name}</span>
                        </td>
                        <td className="p-3 text-text-secondary truncate max-w-[220px]">
                          {comp.display.description}
                        </td>
                        <td className="p-3 text-text-muted">{primaryProtocol}</td>
                        <td className="p-3 text-text-muted">{trustBoundary}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopy(comp.id, comp.id)}
                            className="px-2 py-1 rounded bg-surface-02 hover:bg-surface-03 border border-border-default text-[10px] text-text-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
                          >
                            <CopyIcon className="h-3 w-3" />
                            <span>{copiedKey === comp.id ? "Copied" : "Copy ID"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 4: Architectural Blueprint Examples */}
        <section className="space-y-4">
          <div>
            <h2 className="font-sans text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 flex-wrap">
              <span>4. Production Security Blueprint Topologies</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-emerald-400 border-emerald-900/40 bg-emerald-950/20 shrink-0"
              >
                Validated Patterns
              </Badge>
            </h2>
            <p className="font-sans text-xs text-text-muted mt-0.5 leading-relaxed">
              Recommended architectural configurations distinguishing perimeter defense, identity federation, and decoupled policy decision points.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Pattern A: Perimeter Protection */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2">
              <span className="text-text-muted uppercase text-[10px] tracking-wider block font-semibold">
                Pattern A — Layer 3/4 & Layer 7 Perimeter Shield
              </span>
              <div className="p-3 rounded bg-surface-02 border border-border-subtle text-emerald-400 space-y-1">
                <div>Client Ingress ──(Internet)──▶ DDoS Protection</div>
                <div className="text-text-muted pl-4">└──(Scrubbed Traffic)──▶ Web Application Firewall</div>
                <div className="text-text-muted pl-8">└──(OWASP Inspected)──▶ Rate Limiter ──▶ API Gateway</div>
              </div>
              <p className="font-sans text-[11px] text-text-disabled leading-relaxed">
                Volumetric floods are absorbed by the Anycast scrubbing mesh, while HTTP payloads are inspected for SQLi/XSS before rate limits are enforced.
              </p>
            </div>

            {/* Pattern B: Decoupled Auth & Policy PDP */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-2">
              <span className="text-text-muted uppercase text-[10px] tracking-wider block font-semibold">
                Pattern B — Decoupled Policy Decision (Zero-Trust)
              </span>
              <div className="p-3 rounded bg-surface-02 border border-border-subtle text-emerald-400 space-y-1">
                <div>API Gateway ──(Validate Bearer)──▶ Authentication Service</div>
                <div className="text-text-muted pl-4">└──(Verified Principal)──▶ Authorization Service</div>
                <div className="text-text-muted pl-8">└──(Query Policy)──▶ Policy Engine (OPA/Cedar)</div>
              </div>
              <p className="font-sans text-[11px] text-text-disabled leading-relaxed">
                Authentication validates identity credentials; Authorization Service queries the Policy Engine sidecar for compiled RBAC/ABAC decisions.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
