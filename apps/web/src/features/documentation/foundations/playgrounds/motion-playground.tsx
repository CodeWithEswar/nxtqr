"use client";

import * as React from "react";
import {
  motionDurationMs,
  type MotionDurationToken,
  cssEasing,
  type MotionEasingToken,
} from "@nxtqr/design-system";
import { Button, Badge } from "@nxtqr/ui";
import { RefreshIcon, CheckIcon, LayersIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

type TransitionType = "dialog" | "sheet" | "dropdown" | "node-select";

export function MotionPlayground() {
  const [selectedDuration, setSelectedDuration] = React.useState<MotionDurationToken>("normal");
  const [selectedEasing, setSelectedEasing] = React.useState<MotionEasingToken>("standard");
  const [activeTransition, setActiveTransition] = React.useState<TransitionType>("dialog");
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = React.useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = React.useState<number>(1);

  const durationMs = reducedMotion ? 0 : Math.round(motionDurationMs[selectedDuration] / speedMultiplier);
  const easingCss = reducedMotion ? "linear" : cssEasing[selectedEasing];

  const replay = () => {
    setIsOpen(false);
    setTimeout(() => {
      setIsOpen(true);
    }, 120);
  };

  const durations: { key: MotionDurationToken; label: string; ms: number; use: string }[] = [
    { key: "instant", label: "Instant (80ms)", ms: 80, use: "Small state feedback, micro-clicks" },
    { key: "fast", label: "Fast (140ms)", ms: 140, use: "Hover states, press transitions" },
    { key: "normal", label: "Normal (200ms)", ms: 200, use: "Dropdowns, menus, tooltips" },
    { key: "smooth", label: "Smooth (280ms)", ms: 280, use: "Dialogs, modals, popovers" },
    { key: "panel", label: "Panel (340ms)", ms: 340, use: "Sidebars, drawers, slide sheets" },
    { key: "emphasis", label: "Emphasis (420ms)", ms: 420, use: "Complex layout reflows" },
  ];

  const easings: { key: MotionEasingToken; label: string; curve: string }[] = [
    { key: "standard", label: "Standard [0.2, 0, 0, 1]", curve: cssEasing.standard },
    { key: "enter", label: "Decelerate [0, 0, 0.2, 1]", curve: cssEasing.enter },
    { key: "exit", label: "Accelerate [0.4, 0, 1, 1]", curve: cssEasing.exit },
    { key: "linear", label: "Linear [0, 0, 1, 1]", curve: cssEasing.linear },
  ];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Interactive Motion & Physics Laboratory</span>
            <span className="sm:hidden">Motion & Physics</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={replay}
            className="h-7 text-xs font-mono gap-1.5 shrink-0 whitespace-nowrap"
          >
            <RefreshIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Replay Motion</span>
            <span className="sm:hidden">Replay</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Strict engineering timing scales, cubic-bezier deceleration curves, and instant zero-latency accessibility overrides.
        </p>
      </div>

      {/* Control Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Durations */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
            Duration Tokens
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {durations.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDuration(d.key)}
                className={cn(
                  "p-2.5 rounded-md border text-left transition-all",
                  selectedDuration === d.key
                    ? "border-accent bg-accent/10 ring-1 ring-accent"
                    : "border-border bg-elevated-surface hover:border-muted-border"
                )}
              >
                <div className="text-xs font-semibold text-foreground">{d.key}</div>
                <div className="text-[10px] font-mono text-accent">{d.ms}ms</div>
              </button>
            ))}
          </div>
        </div>

        {/* Easings */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
            Cubic-Bezier Easing Curves
          </label>
          <div className="grid grid-cols-2 gap-2">
            {easings.map((e) => (
              <button
                key={e.key}
                onClick={() => setSelectedEasing(e.key)}
                className={cn(
                  "p-2.5 rounded-md border text-left transition-all",
                  selectedEasing === e.key
                    ? "border-accent bg-accent/10 ring-1 ring-accent"
                    : "border-border bg-elevated-surface hover:border-muted-border"
                )}
              >
                <div className="text-xs font-semibold text-foreground">{e.key}</div>
                <div className="text-[10px] font-mono text-muted-foreground truncate">{e.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary-surface border border-border rounded-md">
        {/* Transition Component Selector */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "dialog" as const, label: "Dialog" },
            { id: "sheet" as const, label: "Sheet" },
            { id: "dropdown" as const, label: "Menu" },
            { id: "node-select" as const, label: "Node" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTransition(t.id);
                replay();
              }}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap transition-colors uppercase",
                activeTransition === t.id
                  ? "bg-surface text-foreground font-semibold border border-subtle-border shadow-level-1"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Speed Multiplier & Reduced Motion Simulator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <span>Speed:</span>
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px]",
                  speedMultiplier === s ? "bg-accent text-accent-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-mono border transition-all flex items-center gap-1.5",
              reducedMotion
                ? "border-accent bg-accent text-accent-foreground font-semibold"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            )}
          >
            {reducedMotion && <CheckIcon className="h-3 w-3" />}
            Reduced Motion: {reducedMotion ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Live Stage */}
      <div className="p-8 bg-black border border-subtle-border rounded-md min-h-[300px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-3 left-3 text-[10px] font-mono text-muted-foreground">
          TIMING: {durationMs}ms · EASING: {easingCss}
        </div>

        {/* Dialog Transition Demo */}
        {activeTransition === "dialog" && (
          <div
            className={cn(
              "w-full max-w-sm p-6 rounded-md border border-border bg-elevated-surface shadow-level-2 transition-all",
              isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
            )}
            style={{
              transitionDuration: `${durationMs}ms`,
              transitionTimingFunction: easingCss,
            }}
          >
            <div className="flex items-center justify-between mb-3 border-b border-subtle-border pb-2">
              <span className="text-xs font-mono font-semibold text-foreground">GRAPH_COMMIT_MODAL</span>
              <Badge variant="outline" className="text-[10px] font-mono text-accent">L2 DIALOG</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Modal surfaces scale from 95% with coordinated opacity fade.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-sans rounded-md border border-border bg-surface text-foreground hover:bg-secondary-surface"
              >
                Dismiss
              </button>
              <button
                onClick={replay}
                className="px-3 py-1.5 text-xs font-sans rounded-md bg-accent text-accent-foreground font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {/* Sheet Slide Demo */}
        {activeTransition === "sheet" && (
          <div className="w-full h-full min-h-[220px] relative border border-border bg-surface rounded-md overflow-hidden flex items-stretch">
            <div className="flex-1 p-4 text-xs font-mono text-muted-foreground">
              Main Canvas Viewport
            </div>
            <div
              className={cn(
                "w-64 border-l border-border bg-elevated-surface p-4 shadow-level-2 transition-transform",
                isOpen ? "translate-x-0" : "translate-x-full"
              )}
              style={{
                transitionDuration: `${durationMs}ms`,
                transitionTimingFunction: easingCss,
              }}
            >
              <div className="text-xs font-mono font-bold text-foreground mb-2">INSPECTOR_SHEET</div>
              <p className="text-xs text-muted-foreground mb-4">
                Sheets use standard 340ms slide deceleration curve.
              </p>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-1 text-xs font-mono border border-border rounded-md bg-surface text-foreground"
              >
                Toggle Panel
              </button>
            </div>
          </div>
        )}

        {/* Dropdown Menu Demo */}
        {activeTransition === "dropdown" && (
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-4 py-2 text-xs font-mono rounded-md border border-border bg-elevated-surface text-foreground shadow-level-1"
            >
              Click Trigger Menu
            </button>
            <div
              className={cn(
                "absolute top-full mt-2 left-0 w-48 p-1.5 rounded-md border border-border bg-elevated-surface shadow-level-2 transition-all origin-top",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              )}
              style={{
                transitionDuration: `${durationMs}ms`,
                transitionTimingFunction: easingCss,
              }}
            >
              {["Inspect Node", "Duplicate Branch", "Export Subgraph"].map((item) => (
                <div
                  key={item}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary-surface rounded cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Node Selection Pulse Demo */}
        {activeTransition === "node-select" && (
          <div
            onClick={replay}
            className={cn(
              "p-6 rounded-md border cursor-pointer select-none transition-all duration-200",
              isOpen
                ? "border-accent bg-elevated-surface ring-2 ring-accent/40 shadow-[0_0_16px_rgba(255,0,0,0.2)]"
                : "border-border bg-surface shadow-none"
            )}
            style={{
              transitionDuration: `${durationMs}ms`,
              transitionTimingFunction: easingCss,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <LayersIcon className="h-4 w-4 text-accent" />
              <span className="text-xs font-mono font-bold text-foreground">GRAPH_NODE_402</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click to toggle focus pulse with hardware-timed stroke ring.
            </p>
          </div>
        )}
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Motion Token Implementation
        </div>
        <CodeBlock
          code={`import { motionDuration, motionEasing } from "@nxtqr/design-system";

// Sheet / Drawer Animation Config
export const sheetVariants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: {
      duration: motionDuration.panel, // 0.34s
      ease: motionEasing.enter,       // [0, 0, 0.2, 1]
    },
  },
  exit: {
    x: "100%",
    transition: {
      duration: motionDuration.fast,  // 0.14s
      ease: motionEasing.exit,        // [0.4, 0, 1, 1]
    },
  },
};`}
          language="tsx"
          filename="motion-tokens.ts"
        />
      </div>
    </div>
  );
}

