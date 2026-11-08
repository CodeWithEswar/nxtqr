"use client";

import * as React from "react";
import { type ElevationLevel } from "@nxtqr/design-system";
import { Button, Badge } from "@nxtqr/ui";
import { LayersIcon, CheckIcon, CopyIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

interface LevelDetail {
  id: ElevationLevel;
  levelNum: number;
  name: string;
  role: string;
  surface: string;
  shadow: string;
  zIndex: string;
  tailwind: string;
  usage: string;
}

const ELEVATION_LEVELS: LevelDetail[] = [
  {
    id: "level0",
    levelNum: 0,
    name: "Base",
    role: "Full page & infinite canvas backdrop",
    surface: "#000000",
    shadow: "none",
    zIndex: "z-0",
    tailwind: "bg-background shadow-none",
    usage: "Full application viewport, infinite node canvas, background canvas.",
  },
  {
    id: "level1",
    levelNum: 1,
    name: "Raised",
    role: "Buttons, toolbars, compact panels",
    surface: "#0A0A0A",
    shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)",
    zIndex: "z-10",
    tailwind: "bg-surface shadow-level-1 border border-border",
    usage: "Resting buttons, sidebar items, canvas node containers, card panels.",
  },
  {
    id: "level2",
    levelNum: 2,
    name: "Elevated",
    role: "Popovers, dialogs, floating inspectors",
    surface: "#141414",
    shadow: "0 4px 12px 0 rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
    zIndex: "z-30 / z-50",
    tailwind: "bg-elevated-surface shadow-level-2 border border-border",
    usage: "Modals, command palette, floating node config inspectors, dropdowns.",
  },
  {
    id: "level3",
    levelNum: 3,
    name: "Pressed",
    role: "Active buttons, toggle states, pressed inputs",
    surface: "#1A1A1A",
    shadow: "inset 0 1px 3px 0 rgba(0, 0, 0, 0.6), inset 0 0 1px 0 rgba(0, 0, 0, 0.4)",
    zIndex: "z-10",
    tailwind: "bg-secondary-surface shadow-level-3 border border-border",
    usage: "Selected toolbar toggles, pressed states, active tab triggers.",
  },
];

export function ElevationPlayground() {
  const [activeLevel, setActiveLevel] = React.useState<ElevationLevel>("level1");
  const [viewMode, setViewMode] = React.useState<"interactive" | "isometric">("interactive");
  const [copied, setCopied] = React.useState(false);

  const current = ELEVATION_LEVELS.find((l) => l.id === activeLevel) || ELEVATION_LEVELS[1];

  const copyShadow = () => {
    navigator.clipboard.writeText(current.shadow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Interactive Elevation & Shadow Laboratory</span>
            <span className="sm:hidden">Elevation & Shadow</span>
          </h3>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              variant={viewMode === "interactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("interactive")}
              className="h-7 text-xs font-mono px-2 sm:px-3 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Inspector</span>
              <span className="sm:hidden">Inspect</span>
            </Button>
            <Button
              variant={viewMode === "isometric" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("isometric")}
              className="h-7 text-xs font-mono px-2 sm:px-3 gap-1 whitespace-nowrap"
            >
              <LayersIcon className="h-3 w-3" />
              <span>Layers</span>
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Restrained physical depth using solid monochrome surfaces, subtle borders, and directional inset highlights. No blurry glassmorphism.
        </p>
      </div>

      {/* Level Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ELEVATION_LEVELS.map((level) => {
          const isSelected = activeLevel === level.id;
          return (
            <button
              key={level.id}
              onClick={() => setActiveLevel(level.id)}
              className={cn(
                "p-3 rounded-md border text-left transition-all relative overflow-hidden",
                isSelected
                  ? "border-accent bg-accent/10 ring-1 ring-accent"
                  : "border-border bg-elevated-surface hover:border-muted-border"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-semibold text-foreground">
                  L{level.levelNum}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {level.zIndex}
                </span>
              </div>
              <div className="text-xs font-medium text-foreground truncate">{level.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                {level.surface}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage */}
      {viewMode === "interactive" ? (
        <div className="p-4 sm:p-6 md:p-8 bg-black border border-subtle-border rounded-md flex flex-col items-center justify-center min-h-[260px] relative">
          <div className="absolute top-3 left-3 text-[10px] font-mono text-muted-foreground">
            STAGE: BASE CANVAS (#000000)
          </div>

          <div
            className="w-full max-w-md p-4 sm:p-6 rounded-md transition-all duration-200 border border-border"
            style={{
              backgroundColor: current.surface,
              boxShadow: current.shadow,
            }}
          >
            <div className="flex items-center justify-between mb-4 border-b border-subtle-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span className="text-xs font-mono font-semibold text-foreground">
                  {current.name}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {current.zIndex}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-4 font-sans leading-relaxed">
              {current.usage}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                className="px-3 py-1.5 text-xs font-sans font-medium rounded-md bg-accent text-accent-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                Simulate Action
              </button>
              <div className="text-[11px] font-mono text-muted-foreground">
                Surface: {current.surface}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Isometric Layer Stack View */
        <div className="p-4 sm:p-6 md:p-8 bg-black border border-subtle-border rounded-md flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-full max-w-lg space-y-3">
            {ELEVATION_LEVELS.slice().reverse().map((level) => (
              <div
                key={level.id}
                onClick={() => setActiveLevel(level.id)}
                className={cn(
                  "p-4 rounded-md border cursor-pointer transition-all flex items-center justify-between",
                  activeLevel === level.id
                    ? "border-accent ring-1 ring-accent"
                    : "border-border hover:border-muted-border"
                )}
                style={{
                  backgroundColor: level.surface,
                  boxShadow: level.shadow,
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-accent">L{level.levelNum}</span>
                    <span className="text-xs font-semibold text-foreground">{level.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{level.role}</div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-foreground font-semibold">{level.surface}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{level.zIndex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspector Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-subtle-border pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Box Shadow Formula</span>
            <button
              onClick={copyShadow}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {copied ? <CheckIcon className="h-3 w-3 text-accent" /> : <CopyIcon className="h-3 w-3" />}
              {copied ? "Copied" : "Copy CSS"}
            </button>
          </div>
          <div className="p-3 bg-black border border-border rounded-md font-mono text-xs text-foreground overflow-x-auto">
            {current.shadow}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono text-muted-foreground uppercase block">Tailwind Utility Class</span>
          <div className="p-3 bg-black border border-border rounded-md font-mono text-xs text-accent">
            {current.tailwind}
          </div>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Token & Shadow Implementation Reference
        </div>
        <CodeBlock
          code={`import { elevationTokens } from "@nxtqr/design-system";

// Level 1 — Resting Card / Toolbar
<div className="bg-surface border border-border shadow-level-1 rounded-md p-4">
  <span>Node Properties</span>
</div>

// Level 2 — Floating Popover / Dialog
<div className="bg-elevated-surface border border-border shadow-level-2 rounded-md p-6">
  <h2>Export Graph Schematic</h2>
</div>

// Level 3 — Inset Pressed State
<button className="bg-secondary-surface border border-border shadow-level-3 rounded-md px-3 py-1.5">
  Active Tool
</button>`}
          language="tsx"
          filename="elevation-usage.tsx"
        />
      </div>
    </div>
  );
}
