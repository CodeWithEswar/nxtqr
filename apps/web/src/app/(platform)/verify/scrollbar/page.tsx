"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ScrollArea,
} from "@nxtqr/ui";
import {
  LayersIcon,
  TerminalIcon,
  SettingsIcon,
} from "@nxtqr/icons";
import { AppLogo } from "@nxtqr/branding";
import { scrollbarTokens } from "@nxtqr/design-system";
import { VerificationHeader } from "@/features/verification";

export default function ScrollbarReviewGatePage() {
  const [activeThumbState, setActiveThumbState] = useState<string>("active");

  const monochromeStates = [
    { name: "Idle Thumb", token: "Border Default", hex: "#292929", desc: "Default rest state" },
    { name: "Hovered Thumb", token: "Border Strong", hex: "#404040", desc: "Pointer hover highlight" },
    { name: "Active Drag", token: "Foreground", hex: "#FFFFFF", desc: "Active drag state" },
    { name: "Inset Track", token: "Pure Black", hex: "#000000", desc: "Recessed rail surface" },
  ];

  const logLines = Array.from({ length: 40 }, (_, i) => ({
    timestamp: `2026-11-08T01:${String(Math.floor(i / 2)).padStart(2, "0")}:${String((i * 17) % 60).padStart(2, "0")}.000Z`,
    level: i % 7 === 0 ? "WARN" : i % 11 === 0 ? "ERROR" : "INFO",
    subsystem: ["engine.sim", "graph.dispatch", "queue.telemetry", "state.cache"][i % 4],
    message: `[Event ${1000 + i}] Processed node step execution payload trace #${i + 1} with delta=${((i * 1.34) % 15).toFixed(2)}ms`,
  }));

  const nodeLibrary = [
    { id: "node-1", group: "Trigger", name: "Webhook Inbound Receiver", status: "Active" },
    { id: "node-2", group: "Trigger", name: "Scheduled Cron Pulse", status: "Active" },
    { id: "node-3", group: "Transform", name: "Zod Schema Validator", status: "Active" },
    { id: "node-4", group: "Transform", name: "JSON Graph Projection", status: "Active" },
    { id: "node-5", group: "Transform", name: "Mask Sensitive Data Filter", status: "Active" },
    { id: "node-6", group: "Compute", name: "Simulation Kernel Step", status: "Active" },
    { id: "node-7", group: "Compute", name: "Deterministic Matrix Math", status: "Active" },
    { id: "node-8", group: "Output", name: "Cloudflare Queue Publisher", status: "Active" },
    { id: "node-9", group: "Output", name: "PostgreSQL Event Writer", status: "Active" },
    { id: "node-10", group: "Output", name: "WebSocket Trace Broadcaster", status: "Active" },
    {
      id: "node-11",
      group: "Observability",
      name: "OpenTelemetry Span Recorder",
      status: "Active",
    },
    {
      id: "node-12",
      group: "Observability",
      name: "Performance Metric Aggregator",
      status: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Verification Header */}
      <VerificationHeader
        title="Scrollbar Review Gate"
        shortTitle="Scrollbar Gate"
        subtitle="Pure monochrome · Solid neumorphic inset rail · Tactile drag feedback"
        version="System Verified"
        logo={<AppLogo variant="symbol" size={26} />}
        backHref="/verify"
        backLabel="Back to Diagnostics"
        showReviewGates={true}
      >
        <Link href="/verify/brand">
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 px-3 font-mono text-xs gap-1.5 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-foreground transition-all shadow-level-1"
          >
            <span>Brand Review</span>
            <span aria-hidden="true">→</span>
          </Button>
        </Link>
      </VerificationHeader>

      <main className="flex-1 w-full max-w-[2400px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6">

      {/* Interactive Monochrome Controller */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monochrome Scrollbar Tactical Feedback</CardTitle>
              <CardDescription>
                Verify scrollbar thumb states across the unified pure black monochrome standard (Idle, Hover, Active/Drag, Inset Track).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">Active Focus State:</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded border border-border bg-surface font-semibold flex items-center gap-1.5 text-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block border border-border"
                  style={{ backgroundColor: monochromeStates.find(s => s.token === activeThumbState)?.hex || "#FFFFFF" }}
                />
                {monochromeStates.find(s => s.token === activeThumbState)?.name || activeThumbState}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {monochromeStates.map((state) => (
              <Button
                key={state.token}
                variant={activeThumbState === state.token ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveThumbState(state.token)}
                className="font-mono text-xs flex items-center gap-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block border border-border"
                  style={{ backgroundColor: state.hex }}
                />
                <span>{state.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">({state.hex})</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variant Grid: 4 Precision Rail Variations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Variant 1: Default (10px) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono uppercase tracking-wider">
                Variant 1: Default (10px Rail)
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Main App · 10px / 6px radius
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Primary application scroll regions, documents, and large content surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 overflow-y-auto scrollbar-default p-4 bg-surface border border-border rounded-md shadow-level-1 space-y-3">
              <p className="text-xs font-mono text-foreground font-semibold">
                NXTQR Core Architectural Constitution
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The NXTQR Precision Rail scrollbar system is calibrated to provide tactile,
                solid-neumorphic depth without soft blurry decorative artifacts. The default 10px
                track employs an inset contrast border (#141414), solid dark thumb surface
                (#303030), and a 1px specular top highlight.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When hovered, the thumb transitions smoothly to a lighter shade (#404040). When
                actively dragged, the perimeter adopts the pure white monochrome highlight (#FFFFFF)
                while maintaining native pointer physics and keyboard scroll gestures.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Try dragging the thumb or scrolling via mouse wheel and arrow keys. Notice how the
                track has zero layout shift, no blurry glow, and matches the pure monochrome
                aesthetic of the engineering suite.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standards-based fallback rules ensure that Firefox renders matching colors via
                scrollbar-color, while WebKit and Chromium receive the full precision-machined
                visual rail.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variant 2: Compact (7px) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono uppercase tracking-wider">
                Variant 2: Compact (7px Rail)
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Inspectors & Sidebars · 7px / 4px radius
              </Badge>
            </div>
            <CardDescription className="text-xs">
              High information density sidebars, property panels, and nested file trees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 overflow-y-auto scrollbar-compact p-3 bg-surface border border-border rounded-md shadow-level-1 space-y-1.5">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LayersIcon className="h-3.5 w-3.5" />
                Workspace Node Registry
              </div>
              {nodeLibrary.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-subtle-border hover:border-border text-xs transition-colors"
                >
                  <span className="font-mono text-xs text-foreground">{item.name}</span>
                  <Badge variant="outline" className="text-[9px] font-mono py-0">
                    {item.group}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Variant 3: Canvas Panel (7px + Overscroll Contain) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono uppercase tracking-wider">
                Variant 3: Canvas Panel (7px)
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Canvas Protected · overscroll-contain
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Floating node palettes and inspectors with overscroll containment preventing canvas
              zoom bleeding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 overflow-y-auto scrollbar-canvas p-3 bg-surface border border-border rounded-md shadow-level-1 space-y-2">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <SettingsIcon className="h-3.5 w-3.5" />
                Simulation Node Inspector
              </div>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-black/50 border border-subtle-border text-xs space-y-1"
                >
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-foreground">Property.Param_{i + 1}</span>
                    <span className="text-muted-foreground">Type: Float64</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Value: {(Math.PI * (i + 1)).toFixed(6)} · Target: NodeHandle_{i}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Variant 4: Data Dense (6px) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-mono uppercase tracking-wider">
                Variant 4: Data Dense (6px Rail)
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Logs & Traces · 6px / 3px radius
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Ultra-compact 6px footprint for terminal streams, execution telemetry, and debug logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 overflow-y-auto scrollbar-dense p-3 bg-black border border-border rounded-md shadow-level-1 space-y-1 font-mono text-[10px]">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TerminalIcon className="h-3.5 w-3.5" />
                Execution Kernel Stream
              </div>
              {logLines.map((log, idx) => (
                <div key={idx} className="flex gap-2 text-muted-foreground hover:text-foreground">
                  <span className="text-neutral-500 shrink-0">{log.timestamp.slice(11, 23)}</span>
                  <span
                    className={
                      log.level === "ERROR"
                        ? "text-red-400 font-bold"
                        : log.level === "WARN"
                          ? "text-yellow-400"
                          : "text-emerald-400"
                    }
                  >
                    [{log.level}]
                  </span>
                  <span className="truncate">{log.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parity Comparison: shadcn/ui ScrollArea vs Native Overflow */}
      <Card>
        <CardHeader>
          <CardTitle>Architecture Parity: Radix ScrollArea vs Native Browser Scrollbar</CardTitle>
          <CardDescription>
            Demonstrates shared token inheritance and identical tactile solid neumorphism across
            both Radix UI ScrollArea and native browser overflow containers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radix UI ScrollArea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-foreground">Radix UI &lt;ScrollArea&gt;</span>
                <Badge variant="outline" className="text-[10px]">
                  Custom Virtual Track
                </Badge>
              </div>
              <ScrollArea
                className="h-48 border border-border rounded-md bg-surface p-3"
                orientation="both"
                variant="compact"
              >
                <div className="w-[600px] space-y-2 text-xs">
                  <p className="font-mono text-muted-foreground font-semibold">
                    Dual-Axis Scrollable Viewport (600px width × 20 items)
                  </p>
                  {Array.from({ length: 15 }, (_, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-black/40 border border-subtle-border font-mono text-[11px] flex justify-between"
                    >
                      <span>
                        Record #{100 + i}: Deterministic Execution Hash 0x
                        {((i + 1) * 8191).toString(16)}
                      </span>
                      <span className="text-muted-foreground">
                        Payload: {(i + 1) * 64} bytes · Status: OK
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Native Browser Overflow */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-foreground">
                  Native &lt;div overflow-auto&gt;
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Engine-Level CSS
                </Badge>
              </div>
              <div className="h-48 border border-border rounded-md bg-surface p-3 overflow-auto scrollbar-compact">
                <div className="w-[600px] space-y-2 text-xs">
                  <p className="font-mono text-muted-foreground font-semibold">
                    Dual-Axis Scrollable Viewport (600px width × 20 items)
                  </p>
                  {Array.from({ length: 15 }, (_, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-black/40 border border-subtle-border font-mono text-[11px] flex justify-between"
                    >
                      <span>
                        Record #{100 + i}: Deterministic Execution Hash 0x
                        {((i + 1) * 8191).toString(16)}
                      </span>
                      <span className="text-muted-foreground">
                        Payload: {(i + 1) * 64} bytes · Status: OK
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High-Density Data Table Demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Data Table Horizontal & Vertical Scroll Affordance</CardTitle>
          <CardDescription>
            High-density tabular scrolling using scrollbar-dense without clipped action menus or
            duplicate scrollbars.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto rounded-md border border-border scrollbar-dense max-h-56 bg-surface shadow-level-1">
            <table className="w-full text-xs caption-bottom font-mono">
              <thead className="[&_tr]:border-b bg-secondary-surface sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="h-8 px-3 text-left font-semibold text-foreground">Execution ID</th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">
                    Kernel Subsystem
                  </th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">Status</th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">Latency (ms)</th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">CPU Core</th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">Memory Delta</th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">
                    Queue Partition
                  </th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">
                    Worker Thread
                  </th>
                  <th className="h-8 px-3 text-left font-semibold text-foreground">
                    Verified Hash
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0 divide-y divide-subtle-border">
                {Array.from({ length: 16 }, (_, i) => (
                  <tr key={i} className="hover:bg-muted-surface transition-colors">
                    <td className="p-2 px-3 text-foreground font-semibold">TRC-{2000 + i}</td>
                    <td className="p-2 px-3 text-muted-foreground">simulation.step_{i % 3}</td>
                    <td className="p-2 px-3">
                      <Badge
                        variant="outline"
                        className="text-[9px] py-0 border-emerald-500/30 text-emerald-400"
                      >
                        SUCCESS
                      </Badge>
                    </td>
                    <td className="p-2 px-3 text-muted-foreground">
                      {(1.2 + i * 0.3).toFixed(2)}ms
                    </td>
                    <td className="p-2 px-3 text-muted-foreground">Core #{i % 8}</td>
                    <td className="p-2 px-3 text-muted-foreground">+{i * 128 + 64} KB</td>
                    <td className="p-2 px-3 text-muted-foreground">partition_{i % 4}</td>
                    <td className="p-2 px-3 text-muted-foreground">worker-thread-0{i % 4}</td>
                    <td className="p-2 px-3 text-neutral-500 font-mono text-[10px]">
                      0x{(987654321 * (i + 1)).toString(16).slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Design System Token Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>NXTQR Precision Rail Design Token Specification</CardTitle>
          <CardDescription>
            Standardized semantic tokens defined in @nxtqr/design-system and @nxtqr/ui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-surface border border-border rounded-md space-y-1">
              <span className="text-muted-foreground text-[10px]">Default Track</span>
              <div className="font-semibold text-foreground">
                {scrollbarTokens.sizes.default.px}px / {scrollbarTokens.radius.default}
              </div>
              <div className="text-[10px] text-neutral-500">
                {scrollbarTokens.sizes.default.cssVar}
              </div>
            </div>
            <div className="p-3 bg-surface border border-border rounded-md space-y-1">
              <span className="text-muted-foreground text-[10px]">Compact Track</span>
              <div className="font-semibold text-foreground">
                {scrollbarTokens.sizes.compact.px}px / {scrollbarTokens.radius.compact}
              </div>
              <div className="text-[10px] text-neutral-500">
                {scrollbarTokens.sizes.compact.cssVar}
              </div>
            </div>
            <div className="p-3 bg-surface border border-border rounded-md space-y-1">
              <span className="text-muted-foreground text-[10px]">Canvas Panel Track</span>
              <div className="font-semibold text-foreground">
                {scrollbarTokens.sizes.canvas.px}px / {scrollbarTokens.radius.compact}
              </div>
              <div className="text-[10px] text-neutral-500">overscroll: contain</div>
            </div>
            <div className="p-3 bg-surface border border-border rounded-md space-y-1">
              <span className="text-muted-foreground text-[10px]">Data Dense Track</span>
              <div className="font-semibold text-foreground">
                {scrollbarTokens.sizes.dense.px}px / {scrollbarTokens.radius.dense}
              </div>
              <div className="text-[10px] text-neutral-500">
                {scrollbarTokens.sizes.dense.cssVar}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
  );
}
