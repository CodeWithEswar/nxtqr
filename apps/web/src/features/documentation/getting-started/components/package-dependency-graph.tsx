"use client";

import * as React from "react";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { ShieldIcon } from "@nxtqr/icons";

interface LayerItem {
  id: string;
  level: number;
  name: string;
  role: string;
  packages: string[];
  allowedToImport: string;
  forbiddenImports: string[];
}

const LAYERS: LayerItem[] = [
  {
    id: "app",
    level: 4,
    name: "Application Shell",
    role: "Next.js App Router, page routes, dynamic visualizer boundaries",
    packages: ["@nxtqr/web"],
    allowedToImport: "All packages below Layer 4",
    forbiddenImports: ["Other web apps (must remain single shell)"],
  },
  {
    id: "state",
    level: 3,
    name: "Reactive State & Query Layer",
    role: "Client-only Zustand stores, TanStack Query clients, telemetry selectors",
    packages: ["@nxtqr/state", "@nxtqr/query"],
    allowedToImport: "Domain engines, schemas, design tokens",
    forbiddenImports: ["Server-side datasets, direct PostgreSQL connections"],
  },
  {
    id: "domain",
    level: 2,
    name: "Domain Engines & Infrastructure",
    role: "Mathematical canvas conversions, deterministic simulation, trace filtering, node registry",
    packages: ["@nxtqr/simulation-core", "@nxtqr/canvas-core", "@nxtqr/execution-trace", "@nxtqr/node-registry"],
    allowedToImport: "Schemas, validation, design system tokens",
    forbiddenImports: ["React UI components, DOM event listeners"],
  },
  {
    id: "contracts",
    level: 1,
    name: "Contracts, Schemas & Security",
    role: "Zod discriminated union schemas, payload guards, database types",
    packages: ["@nxtqr/graph-schema", "@nxtqr/validation", "@nxtqr/security", "@nxtqr/database"],
    allowedToImport: "Pure utility libraries",
    forbiddenImports: ["React Flow internal types, presentation logic"],
  },
  {
    id: "primitives",
    level: 0,
    name: "Design Primitives & Tokens",
    role: "Headless UI components (shadcn/ui), CSS variables, Hugeicons, brand assets",
    packages: ["@nxtqr/ui", "@nxtqr/design-system", "@nxtqr/icons", "@nxtqr/branding", "@nxtqr/utils"],
    allowedToImport: "Utility functions only",
    forbiddenImports: ["Business logic, direct DB calls, fetch requests"],
  },
];

export function PackageDependencyGraph() {
  const [selectedLayerId, setSelectedLayerId] = React.useState<string>("domain");
  const activeLayer = LAYERS.find((l) => l.id === selectedLayerId) ?? LAYERS[2];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Monorepo Layered Dependency Architecture</span>
            <span className="sm:hidden">Dependency Hierarchy</span>
          </h3>

          <div className="text-xs font-mono text-muted-foreground shrink-0 whitespace-nowrap">
            <span className="hidden sm:inline">Active Tier: </span>
            <span className="text-foreground font-bold">Level {activeLayer.level}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Strict vertical dependency hierarchy. Higher layers may import lower layers, but lower layers never import upward.
        </p>
      </div>

      {/* Layer Stack */}
      <div className="space-y-2">
        {LAYERS.map((layer) => {
          const isSelected = layer.id === selectedLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={cn(
                "p-3 rounded-md border transition-all cursor-pointer text-xs font-mono select-none",
                isSelected
                  ? "border-border-strong bg-surface-04 ring-1 ring-border-default shadow-level-2"
                  : "border-border bg-elevated-surface hover:border-border-hover hover:bg-secondary-surface"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold",
                      isSelected ? "bg-white text-black font-bold" : "bg-black text-muted-foreground"
                    )}
                  >
                    L{layer.level}
                  </span>
                  <span className="font-bold text-foreground font-sans text-sm">{layer.name}</span>
                  <span className="text-muted-foreground hidden sm:inline text-[11px]">— {layer.role}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {layer.packages.map((pkg) => (
                    <span
                      key={pkg}
                      className="px-2 py-0.5 rounded text-[10px] bg-black border border-border text-foreground"
                    >
                      {pkg}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Layer Boundary Specifications */}
      <div className="rounded-md border border-subtle-border bg-black p-4 space-y-3 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-foreground" />
            <span className="font-bold text-foreground font-sans">
              Layer {activeLayer.level} Rules: {activeLayer.name}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {activeLayer.packages.length} Packages
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded bg-surface border border-border space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">
              Permitted Inbound Dependencies:
            </span>
            <p className="text-foreground/90 font-sans text-xs leading-relaxed">
              {activeLayer.allowedToImport}
            </p>
          </div>

          <div className="p-3 rounded bg-red-950/20 border border-red-900/40 space-y-1">
            <span className="text-[10px] text-red-400 uppercase font-bold block">
              Strictly Prohibited Imports (AGENTS.md):
            </span>
            <ul className="text-foreground/90 font-sans text-xs list-disc pl-4 space-y-0.5">
              {activeLayer.forbiddenImports.map((forbid, i) => (
                <li key={i}>{forbid}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
