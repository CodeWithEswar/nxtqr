"use client";

import * as React from "react";
import { Badge, Button } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";
import { CheckIcon, CopyIcon, LayersIcon } from "@nxtqr/icons";

interface SurfaceLevel {
  level: string;
  name: string;
  bg: string;
  border: string;
  shadow: string;
  role: string;
}

const SURFACES: SurfaceLevel[] = [
  { level: "L0", name: "Base", bg: "#000000", border: "transparent", shadow: "none", role: "Main canvas viewport & full-page background" },
  { level: "L1", name: "Raised Surface", bg: "#080808", border: "#202020", shadow: "var(--shadow-level-1)", role: "Toolbars, cards, compact button surfaces" },
  { level: "L2", name: "Elevated Surface", bg: "#141414", border: "#292929", shadow: "var(--shadow-level-2)", role: "Popovers, dialogs, floating node inspectors" },
  { level: "L3", name: "Pressed / Inset", bg: "#1A1A1A", border: "#404040", shadow: "var(--shadow-level-3)", role: "Active toolbar items, selected controls, inputs" },
];

export function AccentPlayground() {
  const [selectedLevel, setSelectedLevel] = React.useState<string>("L1");
  const [copied, setCopied] = React.useState<boolean>(false);

  const activeSurface = SURFACES.find((s) => s.level === selectedLevel) ?? SURFACES[1];

  const handleCopyTokens = () => {
    navigator.clipboard.writeText(`:root {
  --background: #000000;
  --surface-01: #080808;
  --surface-02: #0d0d0d;
  --surface-03: #141414;
  --surface-04: #1a1a1a;
  --border-subtle: #202020;
  --border-default: #292929;
  --border-strong: #404040;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --radius: 0.375rem;
}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
            <LayersIcon className="h-4 w-4 text-foreground" />
            <span className="hidden sm:inline">Unified Monochrome & Solid Neumorphic Showcase</span>
            <span className="sm:hidden">Monochrome Showcase</span>
          </h3>

          <Badge variant="outline" className="text-[10px] font-mono border-subtle-border text-foreground bg-elevated-surface">
            Pure Black Monochrome
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          NXTQR operates exclusively on a calibrated pure black monochrome identity with restrained solid neumorphism.
        </p>
      </div>

      {/* Surface Hierarchy Selector */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
          Neumorphic Depth Levels (Select to Inspect)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SURFACES.map((s) => {
            const isSelected = selectedLevel === s.level;
            return (
              <button
                key={s.level}
                onClick={() => setSelectedLevel(s.level)}
                className={cn(
                  "p-3 rounded-md border text-left transition-all duration-150 select-none relative",
                  isSelected
                    ? "border-border-strong bg-surface-04 ring-1 ring-border-default shadow-level-2"
                    : "border-border bg-elevated-surface hover:border-border-hover hover:bg-secondary-surface"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono font-bold text-foreground">{s.level}</span>
                  <div
                    className="w-3.5 h-3.5 rounded-sm border border-subtle-border"
                    style={{ backgroundColor: s.bg }}
                  />
                </div>
                <div className="text-xs font-semibold text-foreground truncate">{s.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{s.bg}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Hardware Surface Stage */}
      <div className="rounded-md border border-subtle-border bg-black p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle-border pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-foreground uppercase">{activeSurface.name} ({activeSurface.level})</span>
            <span className="text-[11px] text-muted-foreground block">{activeSurface.role}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground border border-subtle-border px-2 py-0.5 rounded bg-surface">
              WCAG AAA · 21:1 Contrast
            </span>
          </div>
        </div>

        {/* Live Interactive Component Samples */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Primary Action Button */}
          <div className="p-3 rounded-md border border-subtle-border bg-surface-01 space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Primary Action</span>
            <Button className="w-full bg-white text-black font-semibold hover:bg-neutral-200 shadow-level-1 h-8 text-xs">
              <CheckIcon className="h-3.5 w-3.5 mr-1" />
              Primary White
            </Button>
            <span className="text-[9px] font-mono text-muted-foreground block text-center">#FFFFFF on #000000</span>
          </div>

          {/* Secondary Raised Button */}
          <div className="p-3 rounded-md border border-subtle-border bg-surface-01 space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Secondary Raised</span>
            <Button variant="outline" className="w-full border-border bg-elevated-surface text-foreground hover:bg-secondary-surface h-8 text-xs font-mono">
              Secondary Button
            </Button>
            <span className="text-[9px] font-mono text-muted-foreground block text-center">#141414 + #292929 Border</span>
          </div>

          {/* Inset Hardware Input */}
          <div className="p-3 rounded-md border border-subtle-border bg-surface-01 space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Inset Input</span>
            <input
              type="text"
              readOnly
              value="node_cluster_alpha"
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-border bg-black text-foreground shadow-level-3 focus:outline-none"
            />
            <span className="text-[9px] font-mono text-muted-foreground block text-center">Level 3 Inset Depth</span>
          </div>
        </div>
      </div>

      {/* Copyable CSS Tokens */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Monochrome Architecture Tokens (globals.css)
          </span>
          <button
            onClick={handleCopyTokens}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {copied ? <CheckIcon className="h-3 w-3 text-foreground" /> : <CopyIcon className="h-3 w-3" />}
            {copied ? "Copied" : "Copy CSS"}
          </button>
        </div>

        <CodeBlock
          code={`:root {
  color-scheme: dark;
  --background: #000000;
  --foreground: #ffffff;
  --card: #0d0d0d;
  --popover: #141414;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: #141414;
  --secondary-foreground: #ffffff;
  --muted: #141414;
  --muted-foreground: #858585;
  --border: #292929;
  --radius: 0.375rem;
}`}
          language="css"
          filename="design-system-tokens.css"
        />
      </div>
    </div>
  );
}
