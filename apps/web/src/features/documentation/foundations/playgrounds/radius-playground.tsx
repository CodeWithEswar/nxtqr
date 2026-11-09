"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";
import { CheckIcon, RefreshIcon, CopyIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

interface RadiusPreset {
  id: string;
  name: string;
  value: string;
  px: number;
  tailwind: string;
  isStandard?: boolean;
}

const RADIUS_PRESETS: RadiusPreset[] = [
  { id: "square", name: "Square", value: "0px", px: 0, tailwind: "rounded-none" },
  { id: "subtle", name: "Subtle", value: "2px", px: 2, tailwind: "rounded-xs" },
  { id: "standard", name: "Standard", value: "6px", px: 6, tailwind: "rounded-md", isStandard: true },
  { id: "oversized", name: "Oversized", value: "12px", px: 12, tailwind: "rounded-lg" },
  { id: "full", name: "Pill", value: "9999px", px: 9999, tailwind: "rounded-full" },
];

export function RadiusPlayground() {
  const [selectedPreset, setSelectedPreset] = React.useState<RadiusPreset>(RADIUS_PRESETS[2]); // standard 6px
  const [outerPadding, setOuterPadding] = React.useState<number>(12);
  const [copied, setCopied] = React.useState(false);

  // Concentric nested radius calculation: R_inner = max(0, R_outer - Padding)
  const outerPx = selectedPreset.px === 9999 ? 9999 : selectedPreset.px;
  const innerPx = selectedPreset.px === 9999 ? 9999 : Math.max(0, outerPx - outerPadding);

  const copyCode = () => {
    navigator.clipboard.writeText(selectedPreset.tailwind);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Interactive Border Radius Laboratory</span>
            <span className="sm:hidden">Border Radius</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPreset(RADIUS_PRESETS[2])}
            className="h-7 text-xs font-mono gap-1.5 shrink-0 whitespace-nowrap"
          >
            <RefreshIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Reset to Standard</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Evaluate rectangular surface coherence, compare non-standard corner curves, and verify concentric nested geometry.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="space-y-3">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
          Corner Geometry Comparison
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {RADIUS_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all",
                  isSelected
                    ? "border-foreground bg-surface-04 text-foreground ring-1 ring-border-strong shadow-level-1"
                    : "border-border bg-elevated-surface text-muted-foreground hover:border-muted-border hover:text-foreground"
                )}
              >
                <div
                  className="w-10 h-10 border-2 border-foreground/70 bg-secondary-surface mb-2"
                  style={{ borderRadius: preset.value }}
                />
                <span className="text-xs font-semibold whitespace-nowrap">{preset.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{preset.value}</span>
                {preset.isStandard && (
                  <span className="mt-1 text-[9px] font-mono text-foreground font-semibold">
                    STRICT STANDARD
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Component Sandbox */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <span className="hidden sm:inline">Live Component Sandbox with Selected Radius: </span>
            <span className="sm:hidden">Sandbox: </span>
            <span className="text-foreground font-semibold">{selectedPreset.tailwind} ({selectedPreset.value})</span>
          </label>
          <button
            onClick={copyCode}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors shrink-0"
          >
            {copied ? <CheckIcon className="h-3 w-3 text-foreground" /> : <CopyIcon className="h-3 w-3" />}
            {copied ? "Copied" : "Copy class"}
          </button>
        </div>

        <div className="p-6 bg-black border border-subtle-border rounded-md grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Card & Controls */}
          <div
            className="border border-border bg-elevated-surface p-5 space-y-4 shadow-level-1 transition-all"
            style={{ borderRadius: selectedPreset.value }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">NODE_INSPECTOR</span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 border border-border bg-secondary-surface text-foreground"
                style={{ borderRadius: selectedPreset.value }}
              >
                LIVE PREVIEW
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Transformation Vector</label>
              <input
                type="text"
                defaultValue="[1.000, 0.000, 0.000, 1.000]"
                className="w-full text-xs font-mono px-3 py-2 bg-black border border-border text-foreground focus:outline-none focus:border-foreground"
                style={{ borderRadius: selectedPreset.value }}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                className="px-3 py-1.5 text-xs font-medium bg-white text-black font-semibold shadow-sm hover:bg-neutral-200 transition-colors"
                style={{ borderRadius: selectedPreset.value }}
              >
                Apply Transform
              </button>
              <button
                className="px-3 py-1.5 text-xs font-medium border border-border bg-surface text-foreground hover:bg-secondary-surface transition-colors"
                style={{ borderRadius: selectedPreset.value }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Concentric Geometry Visualizer */}
          <div className="border border-border bg-elevated-surface p-5 space-y-4 shadow-level-1 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Concentric Radius Math</span>
              <span className="text-[10px] font-mono text-muted-foreground">R_inner = R_outer - Padding</span>
            </div>

            <p className="text-xs text-muted-foreground">
              When nesting surfaces, inner corners appear distorted if they do not deduct padding from the outer radius.
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">Padding: {outerPadding}px</span>
              <input
                type="range"
                min="4"
                max="24"
                value={outerPadding}
                onChange={(e) => setOuterPadding(Number(e.target.value))}
                className="flex-1 accent-white h-1 bg-secondary-surface rounded-none cursor-pointer"
              />
            </div>

            <div
              className="border-2 border-dashed border-border-strong bg-black flex items-center justify-center transition-all"
              style={{
                borderRadius: `${outerPx}px`,
                padding: `${outerPadding}px`,
                height: "120px",
              }}
            >
              <div
                className="w-full h-full border border-border bg-surface flex flex-col items-center justify-center transition-all text-center p-2"
                style={{ borderRadius: `${innerPx}px` }}
              >
                <span className="text-xs font-mono text-foreground font-semibold">
                  Outer: {selectedPreset.value} · Inner: {innerPx}px
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {innerPx === 0 ? "Pure Sharp Corner (Square)" : `Smooth concentric radius: ${innerPx}px`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permitted Exceptions Section */}
      <div className="border-t border-subtle-border pt-4 space-y-3">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
          Permitted Circular Exceptions (Strict Standard)
        </label>
        <p className="text-xs text-muted-foreground">
          Per NXTQR Constitution §3.4, <code className="text-foreground">rounded-md</code> is mandatory for all rectangular cards, buttons, and modals. Circular geometry (<code className="text-foreground">rounded-full</code>) is strictly reserved for:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 border border-border bg-elevated-surface rounded-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center font-mono text-xs font-bold text-foreground">
              NX
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">User Avatars</div>
              <div className="text-[10px] font-mono text-muted-foreground">rounded-full (circular)</div>
            </div>
          </div>

          <div className="p-3 border border-border bg-elevated-surface rounded-md flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Radio Indicators</div>
              <div className="text-[10px] font-mono text-muted-foreground">rounded-full (circular)</div>
            </div>
          </div>

          <div className="p-3 border border-border bg-elevated-surface rounded-md flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-foreground border-r-transparent border-b-border border-l-transparent animate-spin" />
            <div>
              <div className="text-xs font-semibold text-foreground">Loading Spinners</div>
              <div className="text-[10px] font-mono text-muted-foreground">rounded-full (circular)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Tailwind CSS & Design System Implementation
        </div>
        <CodeBlock
          code={`// Standard Rectangular Control (Buttons, Inputs, Cards, Popovers)
<button className="rounded-md border border-border bg-surface px-4 py-2">
  Engineering Button
</button>

// Permitted Circular Exception (Avatars & Spinners Only)
<div className="rounded-full h-8 w-8 bg-surface border border-border flex items-center justify-center">
  <AvatarIcon className="h-4 w-4 text-foreground" />
</div>`}
          language="tsx"
          filename="radius-usage.tsx"
        />
      </div>
    </div>
  );
}
