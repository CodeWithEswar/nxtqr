"use client";

import * as React from "react";
import { spacingTokens, type DensityMode } from "@nxtqr/design-system";
import { Slider, Button, Badge, Checkbox } from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function SpacingPlayground() {
  const [density, setDensity] = React.useState<DensityMode>("default");
  const [padding, setPadding] = React.useState<number>(16);
  const [gap, setGap] = React.useState<number>(12);
  const [showGuides, setShowGuides] = React.useState<boolean>(true);

  const densityConfig = spacingTokens.densityModes[density];

  const resetSpacing = () => {
    setDensity("default");
    setPadding(16);
    setGap(12);
    setShowGuides(true);
  };

  const sampleItems = [
    { id: "node_01", label: "Matrix Node", status: "ONLINE", latency: "1.2ms" },
    { id: "node_02", label: "Queue Worker", status: "PROCESSING", latency: "4.8ms" },
    { id: "node_03", label: "Telemetry Sink", status: "SYNCED", latency: "0.6ms" },
  ];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Interactive Spacing & Density Laboratory</span>
            <span className="sm:hidden">Spacing & Density</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={resetSpacing}
            className="h-7 text-xs font-mono gap-1.5 shrink-0 whitespace-nowrap"
          >
            <RefreshIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Lab</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Test NXTQR's 8px base grid, 4px sub-grid increments, and three standardized density tiers.
        </p>
      </div>

      {/* Density Mode Switcher */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            1. Standard Density Tiers
          </span>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-spatial-guides"
              checked={showGuides}
              onCheckedChange={(checked) => setShowGuides(checked === true)}
            />
            <label
              htmlFor="show-spatial-guides"
              className="text-xs font-mono text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Show Spatial Overlay Guides</span>
              <span className="sm:hidden">Spatial Guides</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {(["compact", "default", "comfortable"] as DensityMode[]).map((mode) => {
            const isSelected = density === mode;
            const item = spacingTokens.densityModes[mode];

            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setDensity(mode);
                  if (mode === "compact") {
                    setPadding(8);
                    setGap(6);
                  } else if (mode === "default") {
                    setPadding(16);
                    setGap(12);
                  } else {
                    setPadding(24);
                    setGap(16);
                  }
                }}
                className={cn(
                  "p-3 rounded-md border text-left transition-all duration-140 outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isSelected
                    ? "border-accent bg-secondary-surface shadow-level-3"
                    : "border-border bg-black/40 hover:bg-secondary-surface/60",
                )}
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {item.cellHeight}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md border border-border bg-black/40 text-xs font-mono">
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Internal Padding</span>
            <span className="text-foreground font-semibold">{padding}px (p-[{padding}px])</span>
          </div>
          <Slider
            min={4}
            max={32}
            step={2}
            value={[padding]}
            onValueChange={([val]) => setPadding(val)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Item Separation Gap</span>
            <span className="text-foreground font-semibold">{gap}px (gap-[{gap}px])</span>
          </div>
          <Slider
            min={2}
            max={24}
            step={2}
            value={[gap]}
            onValueChange={([val]) => setGap(val)}
          />
        </div>
      </div>

      {/* Live Density Component Simulation */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
          2. Live Spatial Visualization With Measurement Guides
        </span>

        <div
          className="rounded-md border border-border bg-black transition-all relative overflow-hidden"
          style={{ padding: `${padding}px` }}
        >
          {showGuides && (
            <div className="absolute inset-0 pointer-events-none border border-dashed border-accent/40 bg-accent/5 flex items-start justify-end p-1">
              <span className="font-mono text-[9px] bg-black/80 px-1 py-0.5 rounded text-accent border border-accent/30">
                padding: {padding}px
              </span>
            </div>
          )}

          {/* Interactive Table Container */}
          <div
            className="w-full flex flex-col transition-all relative z-10"
            style={{ gap: `${gap}px` }}
          >
            {sampleItems.map((item, idx) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-md border border-border bg-surface flex items-center justify-between shadow-level-1 relative",
                  densityConfig.rowPadding,
                  densityConfig.fontSize,
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <span className="text-muted-foreground text-[10px] font-mono">({item.id})</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {item.status}
                  </Badge>
                  <span className="text-muted-foreground font-mono">{item.latency}</span>
                </div>

                {showGuides && idx < sampleItems.length - 1 && (
                  <div
                    className="absolute -bottom-px left-0 right-0 pointer-events-none flex items-center justify-center"
                    style={{ height: `${gap}px`, transform: `translateY(${gap}px)` }}
                  >
                    <span className="font-mono text-[8px] bg-black px-1 py-0.2 rounded text-neutral-400 border border-subtle-border z-20">
                      gap: {gap}px
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Code */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
          Tailwind Spacing Implementation
        </span>
        <CodeBlock
          code={`/* ${densityConfig.label} Density Mode */\n<div className="p-[${padding}px] flex flex-col gap-[${gap}px] bg-black">\n  <div className="${densityConfig.rowPadding} rounded-md border border-border bg-surface">\n    ...\n  </div>\n</div>`}
          language="tsx"
          filename="spacing.tsx"
        />
      </div>
    </div>
  );
}
