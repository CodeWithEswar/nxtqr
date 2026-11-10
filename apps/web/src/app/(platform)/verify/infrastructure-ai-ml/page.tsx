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
  AI_AND_MACHINE_LEARNING_CATEGORY_ID,
  ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS,
} from "@nxtqr/node-registry";
import Link from "next/link";

export default function InfrastructureAiMlVerificationPage() {
  const [variant, setVariant] = React.useState<InfrastructureIconVariant>("colored");
  const [selectedSlug, setSelectedSlug] = React.useState<string>("model-serving");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const components = React.useMemo(() => {
    return infrastructureRegistry.listComponentsByCategory(AI_AND_MACHINE_LEARNING_CATEGORY_ID);
  }, []);

  const activeComponent = React.useMemo(() => {
    return (
      components.find((c) => c.id === selectedSlug) ||
      ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS[0]
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
              <Badge variant="outline" className="border-border-default bg-surface-02 font-mono text-[11px] text-text-secondary">
                Category 12 (10 Components)
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              AI &amp; Machine Learning Infrastructure
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-3xl leading-relaxed">
              Foundation model serving runtimes (vLLM, Triton), online/offline feature stores, vector embedding pipelines, distributed GPU clusters, semantic inference caches, fine-tuning jobs (LoRA/QLoRA), model registries, eval gateways, guardrail proxies, and autonomous multi-agent orchestrators.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/verify"
              className="rounded-md border border-border-default bg-surface-02 px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-foreground hover:bg-surface-03 transition-colors"
            >
              ← Back to Diagnostics
            </Link>
            <Link
              href="/tutorial/system-design"
              className="rounded-md border border-border-strong bg-surface-03 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-border-hover hover:bg-surface-04 transition-colors"
            >
              Tutorials Hub →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Interactive Inspection Grid */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Component Selector & Icon Variant Toggle */}
        <div className="rounded-md border border-border-default bg-surface-01 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-text-muted">Select Component:</span>
            <div className="w-64">
              <Select value={selectedSlug} onValueChange={setSelectedSlug}>
                <SelectTrigger className="w-full bg-surface-02 border-border-default text-xs font-medium text-foreground">
                  <SelectValue placeholder="Choose component..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-02 border-border-default text-foreground">
                  {components.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs hover:bg-surface-03 cursor-pointer">
                      {c.display.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted">Icon Variant:</span>
            <button
              onClick={() => setVariant("colored")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                variant === "colored"
                  ? "border-border-strong bg-surface-04 text-foreground font-semibold"
                  : "border-border-default bg-surface-02 text-text-muted hover:border-border-hover hover:text-foreground"
              }`}
            >
              Original Colored
            </button>
            <button
              onClick={() => setVariant("monochrome")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                variant === "monochrome"
                  ? "border-border-strong bg-surface-04 text-foreground font-semibold"
                  : "border-border-default bg-surface-02 text-text-muted hover:border-border-hover hover:text-foreground"
              }`}
            >
              Monochrome
            </button>
          </div>
        </div>

        {/* 10 Components Showcase Gallery */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
            All 10 Infrastructure Components (Icons &amp; Definitions)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {components.map((comp) => {
              const CompIcon = getInfrastructureIcon(comp.id);
              const isSelected = comp.id === selectedSlug;
              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedSlug(comp.id)}
                  className={`rounded-md border p-3 text-left transition-colors flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "border-border-strong bg-surface-03 shadow-level-2"
                      : "border-border-default bg-surface-01 hover:border-border-hover hover:bg-surface-02"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 place-items-center rounded-md border border-border-default bg-surface-02 text-foreground">
                      {CompIcon ? <CompIcon size={22} variant={variant} /> : <div className="size-4 bg-surface-04" />}
                    </span>
                    <Badge variant="outline" className="border-border-subtle bg-surface-02 font-mono text-[10px] text-text-muted">
                      v{comp.version}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-foreground leading-snug">{comp.display.name}</h3>
                    <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">{comp.display.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {comp.display.keywords.slice(0, 3).map((kw) => (
                      <span key={kw} className="rounded-md border border-border-subtle bg-surface-02 px-1.5 py-0.5 text-[9px] font-mono text-text-muted">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Component Deep Dive */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Technical Profile & Ports */}
          <div className="lg:col-span-2 space-y-6">
            {/* Component Card */}
            <div className="rounded-md border border-border-default bg-surface-01 p-5 space-y-4">
              <div className="flex items-start gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-md border border-border-default bg-surface-02 text-foreground">
                  {ActiveIcon ? <ActiveIcon size={36} variant={variant} /> : <div className="size-8 bg-surface-04" />}
                </span>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground truncate">{activeComponent.display.name}</h2>
                    <Badge variant="outline" className="border-border-default bg-surface-02 font-mono text-[11px] text-text-secondary">
                      ID: {activeComponent.id}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{activeComponent.display.description}</p>
                </div>
              </div>

              {/* Capabilities */}
              <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-text-muted mr-1">Capabilities:</span>
                {activeComponent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-md border border-border-default bg-surface-02 px-2 py-0.5 text-[10px] font-mono font-medium text-text-secondary"
                  >
                    ✓ {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Ports Specification Table */}
            <div className="rounded-md border border-border-default bg-surface-01 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  Typed Ports Specification ({activeComponent.ports.length} Ports)
                </h3>
                <span className="text-[11px] text-text-muted font-mono">Capacity &amp; Contract Safety</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-default text-text-muted font-mono text-[10px] uppercase">
                      <th className="py-2 px-3">Port ID</th>
                      <th className="py-2 px-3">Direction</th>
                      <th className="py-2 px-3">Data Contract</th>
                      <th className="py-2 px-3 text-right">Capacity (req/s)</th>
                      <th className="py-2 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {activeComponent.ports.map((port) => (
                      <tr key={port.id} className="hover:bg-surface-02 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-foreground">{port.id}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                              port.type === "input"
                                ? "border border-border-default bg-surface-03 text-text-secondary"
                                : "border border-border-strong bg-surface-04 text-foreground"
                            }`}
                          >
                            {port.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary">{port.dataType}</td>
                        <td className="py-2.5 px-3 font-mono text-right text-text-muted">
                          {port.capacity ? port.capacity.toLocaleString() : "N/A"}
                        </td>
                        <td className="py-2.5 px-3 text-text-muted text-[11px] max-w-xs">{port.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Col: Default Config Schema Inspector & Live JSON */}
          <div className="space-y-6">
            {/* Inspector Layout */}
            <div className="rounded-md border border-border-default bg-surface-01 p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                Inspector Schema Definition
              </h3>
              <div className="space-y-4">
                {activeComponent.inspector.map((sec) => (
                  <div key={sec.id} className="rounded-md border border-border-subtle bg-surface-02 p-3 space-y-2.5">
                    <h4 className="text-xs font-semibold text-foreground">{sec.title}</h4>
                    <div className="space-y-2">
                      {sec.fields.map((f) => (
                        <div key={f.path} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-text-secondary font-mono text-[11px]">{f.label}</span>
                          <span className="rounded-md border border-border-default bg-surface-03 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                            {f.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Runtime Default JSON */}
            <div className="rounded-md border border-border-default bg-surface-01 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  Default Runtime JSON Payload
                </h3>
                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(activeComponent.defaultConfig, null, 2),
                      activeComponent.id
                    )
                  }
                  className="rounded-md border border-border-default bg-surface-02 px-2.5 py-1 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <CopyIcon className="size-3.5" />
                  <span>{copiedKey === activeComponent.id ? "Copied!" : "Copy JSON"}</span>
                </button>
              </div>
              <pre className="rounded-md border border-border-subtle bg-surface-02 p-3 font-mono text-[11px] text-text-secondary overflow-x-auto max-h-72 leading-relaxed">
                {JSON.stringify(activeComponent.defaultConfig, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
