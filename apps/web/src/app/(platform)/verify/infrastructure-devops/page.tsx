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
  DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructureDevopsVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("git-repository");
  const [previewStatus, setPreviewStatus] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [isSelectedNode, setIsSelectedNode] = React.useState<boolean>(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(DEVOPS_AND_DEPLOYMENT_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS[0]
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
              <span>Category 15 — DevOps & Deployment</span>
              <span className="font-mono text-xs font-normal text-text-muted px-2 py-0.5 rounded bg-surface-02 border border-border-subtle shrink-0">
                12 Components
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Link
              href="/verify/infrastructure-media"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              ← Cat 14 Media
            </Link>
            <Link
              href="/verify/infrastructure-cloud"
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-surface-02 hover:bg-surface-03 border border-border-default text-xs font-mono text-text-muted hover:text-foreground transition-colors flex-1 sm:flex-initial text-center"
            >
              Cat 16 Cloud →
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
                Category 15 Implementation Status & Test Verification
              </h2>
              <p className="font-mono text-xs text-text-muted mt-0.5">
                Full delivery lifecycle: Git, automated CI testing, artifact/container registries, GitOps reconciliation, and progressive releases.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-text-secondary">Icon Rendering:</span>
              <div className="flex p-0.5 rounded-md bg-surface-02 border border-border-default">
                <button
                  type="button"
                  onClick={() => setVariant("colored")}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
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
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    variant === "monochrome"
                      ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                      : "text-text-muted hover:text-foreground"
                  }`}
                >
                  Monochrome
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 12 Component Catalog Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs uppercase tracking-wider font-semibold text-text-muted">
              DevOps & Deployment Component Inventory ({components.length})
            </h3>
            <span className="font-mono text-[11px] text-text-disabled">
              Click component to inspect specification & preview live node
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {components.map((comp) => {
              const Icon = getInfrastructureIcon(comp.id);
              const isSelected = comp.id === selectedSlug;

              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`p-3.5 rounded-md border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-surface-03 border-border-strong shadow-level-2 ring-1 ring-border-strong"
                      : "bg-surface-01 border-border-default hover:border-border-hover hover:bg-surface-02 shadow-level-1"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-md bg-surface-02 border border-border-default flex items-center justify-center shrink-0">
                      {Icon && <Icon size={22} variant={variant} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-sans text-xs font-semibold text-foreground truncate">
                          {comp.display.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-text-disabled block truncate">
                        {comp.display.shortName}
                      </span>
                    </div>
                  </div>

                  <p className="font-mono text-[11px] text-text-muted line-clamp-2 leading-relaxed">
                    {comp.display.description}
                  </p>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-text-disabled">
                    <span>{comp.ports.length} ports</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(comp.id, comp.id);
                      }}
                      className="hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <CopyIcon className="h-3 w-3" />
                      <span>{copiedKey === comp.id ? "Copied" : comp.id}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Node Simulator & Inspector */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Node Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-xs uppercase tracking-wider font-semibold text-text-muted">
                Canvas Node Simulator
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSelectedNode(!isSelectedNode)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                    isSelectedNode
                      ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                      : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
                  }`}
                >
                  {isSelectedNode ? "Selected Ring: ON" : "Selected Ring: OFF"}
                </button>
              </div>
            </div>

            <div className="p-8 rounded-md border border-border-default bg-[#030303] flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden shadow-level-2">
              <div
                className={`w-[220px] rounded-md border transition-all duration-150 select-none ${
                  isSelectedNode
                    ? "bg-surface-03 border-border-strong ring-1 ring-border-strong shadow-level-3"
                    : "bg-surface-02 border-border-default shadow-level-1"
                }`}
              >
                {/* Node Header */}
                <div className="p-2.5 flex items-start gap-2.5 border-b border-border-subtle/60">
                  <div
                    className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                      isSelectedNode
                        ? "bg-surface-03 border-border-strong text-foreground"
                        : "bg-surface-01 border-border-default text-text-secondary"
                    }`}
                  >
                    {ActiveIcon && <ActiveIcon size={18} variant={variant} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider font-semibold truncate">
                        DevOps & Deploy
                      </span>
                      <span className="font-mono text-[9px] text-text-disabled shrink-0">
                        #live
                      </span>
                    </div>
                    <h4
                      className={`font-sans text-xs leading-tight truncate ${
                        isSelectedNode ? "text-foreground font-semibold" : "text-text-primary font-medium"
                      }`}
                    >
                      {activeComponent.defaultConfig.label}
                    </h4>
                  </div>
                </div>

                {/* Node Body */}
                <div className="px-2.5 py-1.5 flex items-center justify-between font-mono text-[10px] text-text-muted bg-surface-01/40 rounded-b-md">
                  <span className="truncate max-w-[120px] text-text-secondary">
                    {activeComponent.display.shortName}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted">
                    {activeComponent.ports.filter((p) => p.type === "input").length}in ·{" "}
                    {activeComponent.ports.filter((p) => p.type === "output").length}out
                  </span>
                </div>
              </div>

              {/* Status Simulation Bar */}
              <div className="mt-6 flex items-center gap-1.5 p-1 rounded-md bg-surface-01 border border-border-default">
                {(["idle", "running", "success", "error"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setPreviewStatus(st)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors ${
                      previewStatus === st
                        ? "bg-surface-04 text-foreground font-semibold shadow-level-1"
                        : "text-text-muted hover:text-foreground"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Specification Inspector */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-sans text-xs uppercase tracking-wider font-semibold text-text-muted">
              Specification Inspector: {activeComponent.display.name}
            </h3>

            <div className="p-4 sm:p-5 rounded-md border border-border-default bg-surface-01 space-y-4 shadow-level-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
                  <span className="text-text-disabled block text-[10px]">Component Slug</span>
                  <span className="text-foreground font-semibold">{activeComponent.id}</span>
                </div>
                <div className="p-2.5 rounded bg-surface-02 border border-border-subtle">
                  <span className="text-text-disabled block text-[10px]">Node Variant</span>
                  <span className="text-foreground font-semibold">{activeComponent.node.variant}</span>
                </div>
              </div>

              {/* Ports Breakdown */}
              <div className="space-y-2">
                <span className="font-mono text-[11px] font-semibold text-text-secondary block">
                  Configured Ports ({activeComponent.ports.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {activeComponent.ports.map((port) => (
                    <div
                      key={port.id}
                      className="p-2 rounded bg-surface-02 border border-border-subtle flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            port.type === "input" ? "bg-sky-400" : "bg-emerald-400"
                          }`}
                        />
                        <span className="text-foreground">{port.name}</span>
                      </div>
                      <span className="text-text-disabled text-[10px] uppercase">
                        {port.type} ({port.capacity || "any"})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* JSON Configuration Preview */}
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] font-semibold text-text-secondary block">
                  Default Zod Configuration
                </span>
                <pre className="p-3 rounded bg-[#050505] border border-border-subtle text-[11px] font-mono text-text-secondary overflow-x-auto max-h-[160px] precision-rail">
                  {JSON.stringify(activeComponent.defaultConfig, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Canonical DevOps Topologies */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-xs uppercase tracking-wider font-semibold text-text-muted">
              Canonical DevOps Architectural Presets (3 Patterns)
            </h3>
            <span className="font-mono text-[11px] text-text-disabled">
              Valid continuous delivery architectures
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Pattern 1 */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">
                  1. Git-to-Container Automated Pipeline
                </h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Standard CI/CD
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Developer Git push triggers CI pipeline, invoking parallel build servers, compiling binaries, publishing to OCI container registry, and triggering CD deployment.
              </p>
              <div className="pt-2 border-t border-border-subtle font-mono text-[10px] text-text-secondary space-y-1">
                <div>• Git Repository → CI Pipeline</div>
                <div>• CI Pipeline → Build Server</div>
                <div>• Build Server → Container Registry</div>
                <div>• Container Registry → CD Pipeline</div>
              </div>
            </div>

            {/* Pattern 2 */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">
                  2. GitOps Reconciliation & Secrets Sync
                </h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Zero-Drift
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Deployment Controller pulls desired declarative manifests from Git, continuously syncs Kubernetes workloads, and injects ephemeral runtime credentials via CSI memory mounts.
              </p>
              <div className="pt-2 border-t border-border-subtle font-mono text-[10px] text-text-secondary space-y-1">
                <div>• Git Repo → Deployment Controller</div>
                <div>• Deployment Controller → K8s Cluster</div>
                <div>• Secrets Injection → Workload RAM</div>
                <div>• Auto Drift Remediation & Alerting</div>
              </div>
            </div>

            {/* Pattern 3 */}
            <div className="p-4 rounded-md border border-border-default bg-surface-01 space-y-3 shadow-level-1">
              <div className="flex items-center justify-between">
                <h4 className="font-sans text-xs font-semibold text-foreground">
                  3. Progressive Canary & Feature Gating
                </h4>
                <Badge variant="outline" className="font-mono text-[9px] text-text-muted border-border-subtle">
                  Safe Releases
                </Badge>
              </div>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                Release Manager controls production promotion gates, dynamically toggling percentage rollouts in Feature Flag Service, with automated rollback on error metric degradation.
              </p>
              <div className="pt-2 border-t border-border-subtle font-mono text-[10px] text-text-secondary space-y-1">
                <div>• Release Manager → CD Pipeline</div>
                <div>• CD Pipeline → Feature Flag Service</div>
                <div>• Percentage Canary → Live User Telemetry</div>
                <div>• Automated Rollback Safety Guard</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

