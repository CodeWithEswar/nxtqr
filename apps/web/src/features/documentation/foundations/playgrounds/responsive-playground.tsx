"use client";

import * as React from "react";
import { Badge } from "@nxtqr/ui";
import { MenuIcon, RefreshIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

interface BreakpointPreset {
  name: string;
  width: number;
  label: string;
  token: string;
}

const PRESETS: BreakpointPreset[] = [
  { name: "Mobile", width: 375, label: "sm (< 640px)", token: "Default (Base)" },
  { name: "Tablet", width: 768, label: "md (768px)", token: "md: 768px" },
  { name: "Desktop", width: 1024, label: "lg (1024px)", token: "lg: 1024px" },
  { name: "Workstation", width: 1200, label: "xl (1280px)", token: "xl: 1280px" },
];

export function ResponsivePlayground() {
  const [frameWidth, setFrameWidth] = React.useState<number>(768);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);

  const getActiveBreakpoint = (w: number) => {
    if (w < 640) return { name: "xs / base", desc: "Mobile Viewport", col: 1 };
    if (w < 768) return { name: "sm (640px)", desc: "Large Phone / Phablet", col: 1 };
    if (w < 1024) return { name: "md (768px)", desc: "Tablet / Compact Split", col: 2 };
    if (w < 1280) return { name: "lg (1024px)", desc: "Standard Desktop", col: 3 };
    return { name: "xl (1280px+)", desc: "Workstation / Wide Canvas", col: 3 };
  };

  const bp = getActiveBreakpoint(frameWidth);

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Responsive Viewport Simulation Laboratory</span>
            <span className="sm:hidden">Viewport Simulator</span>
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">
              <span className="hidden sm:inline">Width: </span>
              <span className="text-accent font-bold">{frameWidth}px</span>
            </Badge>
            <Badge variant="outline" className="font-mono text-xs text-foreground whitespace-nowrap">
              <span className="hidden sm:inline">BP: </span>
              <span className="text-accent">{bp.name}</span>
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Test layout reflow, mobile drawer conversion, and fluid grid collapses across simulated viewport boundaries.
        </p>
      </div>

      {/* Preset Buttons & Width Slider */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setFrameWidth(preset.width)}
                className={cn(
                  "px-3 py-1 text-xs font-mono rounded-md border whitespace-nowrap transition-all",
                  frameWidth === preset.width
                    ? "border-accent bg-accent/10 text-foreground font-semibold"
                    : "border-border bg-elevated-surface text-muted-foreground hover:border-muted-border hover:text-foreground"
                )}
              >
                <span className="hidden sm:inline">{preset.name} ({preset.width}px)</span>
                <span className="sm:hidden">{preset.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setFrameWidth(768)}
            className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RefreshIcon className="h-3 w-3" />
            Reset Width
          </button>
        </div>

        {/* Manual Slider */}
        <div className="flex items-center gap-3 p-3 bg-secondary-surface border border-border rounded-md">
          <span className="text-xs font-mono text-muted-foreground shrink-0">320px</span>
          <input
            type="range"
            min="320"
            max="1200"
            step="8"
            value={frameWidth}
            onChange={(e) => setFrameWidth(Number(e.target.value))}
            className="w-full accent-accent h-1.5 bg-black rounded-none cursor-pointer"
          />
          <span className="text-xs font-mono text-muted-foreground shrink-0">1200px</span>
        </div>
      </div>

      {/* Simulated Viewport Frame */}
      <div className="p-4 bg-black border border-subtle-border rounded-md overflow-x-auto flex justify-center">
        <div
          className="border border-border bg-surface rounded-md shadow-level-2 transition-all duration-200 overflow-hidden flex flex-col"
          style={{ width: `${frameWidth}px`, minHeight: "360px" }}
        >
          {/* Simulated App Header */}
          <div className="h-11 px-4 border-b border-subtle-border bg-elevated-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center font-mono text-[10px] font-bold text-accent-foreground">
                NX
              </div>
              <span className="text-xs font-bold text-foreground font-sans">NXTQR STUDIO</span>
            </div>

            {/* Desktop Navigation vs Mobile Hamburger */}
            {frameWidth < 640 ? (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 rounded-md border border-border text-foreground hover:bg-secondary-surface"
              >
                <MenuIcon className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                <span className="text-foreground">Visualizer</span>
                <span>Schematics</span>
                <span>Telemetry</span>
                <span className="px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">LIVE</span>
              </div>
            )}
          </div>

          {/* Simulated Body Content */}
          <div className="p-4 flex-1 space-y-4">
            {/* Mobile Collapsible Drawer banner */}
            {frameWidth < 640 && mobileMenuOpen && (
              <div className="p-3 bg-secondary-surface border border-border rounded-md space-y-2 animate-fade-in">
                <div className="text-xs font-mono text-foreground font-semibold">Mobile Drawer Menu</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground">
                  <div className="p-2 bg-surface rounded border border-border">Visualizer</div>
                  <div className="p-2 bg-surface rounded border border-border">Telemetry</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">ENGINEERING_MODULES</span>
              <span className="text-accent">{bp.col} Column Reflow</span>
            </div>

            {/* Fluid Card Grid */}
            <div
              className={cn(
                "grid gap-3 transition-all",
                bp.col === 1 && "grid-cols-1",
                bp.col === 2 && "grid-cols-2",
                bp.col === 3 && "grid-cols-3"
              )}
            >
              {[
                { title: "Transformation Matrix", metric: "60 FPS", status: "STABLE" },
                { title: "Queue Telemetry", metric: "1.2ms", status: "NOMINAL" },
                { title: "Graph Memory Buffer", metric: "24.6 MB", status: "OPTIMIZED" },
              ].map((card) => (
                <div key={card.title} className="p-3.5 rounded-md border border-border bg-elevated-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{card.title}</span>
                    <span className="text-[10px] font-mono text-accent">{card.status}</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-foreground">{card.metric}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Tailwind Responsive Utility Guidelines
        </div>
        <CodeBlock
          code={`// Mobile: 1-col stacked -> Tablet: 2-col -> Desktop: 3-col
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <TelemetryCard />
</div>

// Mobile: Hidden drawer -> Desktop: Persistent Sidepane
<aside className="hidden lg:block w-64 border-r border-border">
  <SidebarNavigation />
</aside>`}
          language="tsx"
          filename="responsive-layout.tsx"
        />
      </div>
    </div>
  );
}
