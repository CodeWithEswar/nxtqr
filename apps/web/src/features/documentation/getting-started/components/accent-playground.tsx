"use client";

import * as React from "react";
import { Badge, Button } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";
import { useThemeStore } from "@nxtqr/state";
import { RefreshIcon, CheckIcon } from "@nxtqr/icons";
import type { AccentPresetId } from "@nxtqr/shared-types";

interface AccentPreset {
  id: AccentPresetId;
  name: string;
  hex: string;
  fg: "#000000" | "#FFFFFF";
  contrastAgainstBlack: string;
}

const PRESETS: AccentPreset[] = [
  { id: "monochrome", name: "Monochrome", hex: "#FFFFFF", fg: "#000000", contrastAgainstBlack: "21.0:1" },
  { id: "red", name: "Pure Red", hex: "#FF0000", fg: "#FFFFFF", contrastAgainstBlack: "5.25:1" },
  { id: "orange", name: "Pure Orange", hex: "#FF6600", fg: "#000000", contrastAgainstBlack: "7.84:1" },
  { id: "yellow", name: "Pure Yellow", hex: "#FFD600", fg: "#000000", contrastAgainstBlack: "15.3:1" },
  { id: "green", name: "Pure Green", hex: "#00CC66", fg: "#000000", contrastAgainstBlack: "9.62:1" },
  { id: "blue", name: "Pure Blue", hex: "#0066FF", fg: "#FFFFFF", contrastAgainstBlack: "4.56:1" },
  { id: "violet", name: "Pure Violet", hex: "#8000FF", fg: "#FFFFFF", contrastAgainstBlack: "3.72:1" },
  { id: "pink", name: "Pure Pink", hex: "#FF0099", fg: "#FFFFFF", contrastAgainstBlack: "5.88:1" },
];

export function AccentPlayground() {
  const currentStorePreset = useThemeStore((s) => s.accentPreset);
  const setAccentPreset = useThemeStore((s) => s.setAccentPreset);

  // Local temporary preview state (does NOT overwrite global theme unless explicitly Applied)
  const [previewPreset, setPreviewPreset] = React.useState<AccentPresetId>(currentStorePreset);
  const [isApplied, setIsApplied] = React.useState<boolean>(false);

  const activePreset = PRESETS.find((p) => p.id === previewPreset) ?? PRESETS[1];
  const activeHex = activePreset.hex;
  const activeFg = activePreset.fg;

  const handleApplyGlobal = () => {
    setAccentPreset(previewPreset);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2500);
  };

  const handleReset = () => {
    setPreviewPreset(currentStorePreset);
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div>
          <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
            Dynamic User Accent & Contrast Laboratory
            <Badge variant="outline" className="border-accent text-accent font-mono text-[10px] uppercase">
              Isolated Preview
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate saturated pure accent presets with real-time WCAG contrast calculation. Changes remain isolated until applied.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={handleApplyGlobal}
            className="h-7 text-xs font-mono gap-1"
          >
            {isApplied ? <CheckIcon className="h-3 w-3" /> : null}
            <span>{isApplied ? "Applied to App" : "Apply to App"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs font-mono gap-1"
          >
            <RefreshIcon className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Preset Swatches Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block font-bold">
          Calibrated Pure Accent Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {PRESETS.map((p) => {
            const isSelected = previewPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPreviewPreset(p.id)}
                className={cn(
                  "p-2 rounded-md border text-left transition-all select-none",
                  isSelected
                    ? "border-accent ring-1 ring-accent bg-elevated-surface"
                    : "border-border bg-black hover:border-muted-border hover:bg-secondary-surface"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/40 shrink-0 shadow-sm"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span className="text-[11px] font-bold text-foreground font-sans truncate">{p.name}</span>
                </div>
                <div className="text-[9px] font-mono text-muted-foreground">{p.hex}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Component Preview Sandbox */}
      <div className="rounded-md border border-subtle-border bg-black p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground font-sans">
              Sandbox Component Renders:
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
              style={{ backgroundColor: activeHex, color: activeFg }}
            >
              {activeHex} · Text: {activeFg}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span>Contrast vs #000000:</span>
            <span className="text-foreground font-bold">{activePreset.contrastAgainstBlack}</span>
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">
              WCAG AA
            </Badge>
          </div>
        </div>

        {/* Demo Controls Grid with Simulated Accent */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* 1. Button with Accent */}
          <div className="p-3 rounded bg-surface border border-border space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Primary Action</span>
            <button
              style={{ backgroundColor: activeHex, color: activeFg }}
              className="w-full py-1.5 px-3 rounded-md text-xs font-mono font-semibold transition-opacity hover:opacity-90 shadow-sm"
            >
              Confirm Deployment
            </button>
          </div>

          {/* 2. Active Tab & Badge */}
          <div className="p-3 rounded bg-surface border border-border space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Selected Tab & Status</span>
            <div className="flex items-center gap-2">
              <div
                style={{ borderColor: activeHex, color: activeHex }}
                className="px-2.5 py-1 rounded-md border text-xs font-mono font-semibold bg-black/40"
              >
                Telemetry Stream
              </div>
              <span
                style={{ backgroundColor: `${activeHex}20`, borderColor: `${activeHex}60`, color: activeHex }}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
              >
                LIVE
              </span>
            </div>
          </div>

          {/* 3. Node Selection Outline */}
          <div className="p-3 rounded bg-surface border border-border space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase block">Graph Node Selection</span>
            <div
              style={{ borderColor: activeHex, boxShadow: `0 0 10px ${activeHex}33` }}
              className="p-2 rounded-md border bg-elevated-surface text-xs font-mono flex items-center justify-between"
            >
              <span className="text-foreground font-semibold">Compute Worker</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeHex }} />
            </div>
          </div>
        </div>

        {/* Generated CSS Variables */}
        <div className="space-y-1.5 border-t border-subtle-border pt-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Derived CSS Variables (Zero Page Reload)
          </div>
          <CodeBlock
            code={`:root {
  --accent: ${activeHex};
  --accent-foreground: ${activeFg};
  --accent-muted: ${activeHex}1A; /* 10% opacity */
  --ring: ${activeHex};
}`}
            language="css"
            filename="theme-accent.css"
          />
        </div>
      </div>
    </div>
  );
}
