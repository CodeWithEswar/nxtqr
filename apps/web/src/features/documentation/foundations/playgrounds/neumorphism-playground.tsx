"use client";

import * as React from "react";
import { Badge, Button } from "@nxtqr/ui";
import { RefreshIcon, CheckIcon, CloseIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

type TactileState = "raised" | "inset" | "accent-edge" | "hardware-switch";

export function NeumorphismPlayground() {
  const [activeTab, setActiveTab] = React.useState<TactileState>("raised");
  const [toggleState, setToggleState] = React.useState<boolean>(true);
  const [rockerState, setRockerState] = React.useState<"A" | "B">("A");
  const [potentiometerValue, setPotentiometerValue] = React.useState<number>(64);
  const [isPressed, setIsPressed] = React.useState<boolean>(false);

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold font-sans text-foreground">
              Solid Neumorphism Hardware Laboratory
            </h3>
            <Badge
              variant="outline"
              className="border-accent/40 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-wider"
            >
              Tactile Precision
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Physical instrumentation surfaces inspired by precision hardware: solid monochrome materials, micro-bevels, and zero GPU-heavy backdrop blur.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setToggleState(true);
            setRockerState("A");
            setPotentiometerValue(64);
            setIsPressed(false);
          }}
          className="h-7 text-xs font-mono gap-1.5 self-start sm:self-auto"
        >
          <RefreshIcon className="h-3 w-3" />
          Reset Controls
        </Button>
      </div>

      {/* Mode Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: "raised" as const, label: "Raised Extrusion", sub: "Resting level-1 elevation" },
          { id: "inset" as const, label: "Engraved Well", sub: "Recessed wells & inputs" },
          { id: "accent-edge" as const, label: "Accent Edge", sub: "Active circuit highlight" },
          { id: "hardware-switch" as const, label: "Tactile Controls", sub: "Interactive hardware toggles" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "p-3 rounded-md border text-left transition-all",
              activeTab === tab.id
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-border bg-elevated-surface text-muted-foreground hover:border-muted-border hover:text-foreground"
            )}
          >
            <div className="text-xs font-semibold text-foreground">{tab.label}</div>
            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{tab.sub}</div>
          </button>
        ))}
      </div>

      {/* Interactive Hardware Surface Stage */}
      <div className="p-8 bg-black border border-subtle-border rounded-md flex flex-col items-center justify-center min-h-[280px]">
        {activeTab === "raised" && (
          <div className="w-full max-w-sm space-y-4">
            <div
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              onMouseLeave={() => setIsPressed(false)}
              className={cn(
                "p-6 rounded-md border transition-all cursor-pointer select-none",
                isPressed
                  ? "bg-secondary-surface border-border shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.8),inset_0_0_1px_0_rgba(0,0,0,0.5)] translate-y-[1px]"
                  : "bg-elevated-surface border-border shadow-[0_2px_4px_0_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-muted-border"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-muted-foreground">PRESSABLE_BUTTON</span>
                <span className="text-[10px] font-mono text-accent">
                  {isPressed ? "STATE: PRESSED" : "STATE: RAISED (RESTING)"}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Tactile Push Element</h4>
              <p className="text-xs text-muted-foreground">
                Click and hold to feel the transition from Level 1 raised surface to Level 3 inset depth.
              </p>
            </div>
            <div className="text-center text-[10px] font-mono text-muted-foreground">
              Inset Rim Highlight: <code className="text-foreground">inset 0 1px 0 0 rgba(255, 255, 255, 0.06)</code>
            </div>
          </div>
        )}

        {activeTab === "inset" && (
          <div className="w-full max-w-sm space-y-4">
            <div className="p-6 rounded-md border border-border bg-secondary-surface shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.8),inset_0_0_2px_0_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-muted-foreground">INSTRUMENT_WELL</span>
                <span className="text-[10px] font-mono text-accent">INSET LEVEL-3</span>
              </div>
              <div className="p-3 bg-black/60 rounded-md border border-border/50 font-mono text-xs text-foreground space-y-1">
                <div className="text-muted-foreground">// Telemetry Recess</div>
                <div>SIGNAL_STRENGTH: 98.4 dBm</div>
                <div className="text-accent">PHASE_LOCK: ACQUIRED</div>
              </div>
            </div>
            <div className="text-center text-[10px] font-mono text-muted-foreground">
              Used for inputs, sunken wells, code blocks, and inactive toggle tracks.
            </div>
          </div>
        )}

        {activeTab === "accent-edge" && (
          <div className="w-full max-w-sm space-y-4">
            <div className="p-6 rounded-md border border-accent bg-elevated-surface shadow-[0_2px_8px_0_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-mono text-accent font-semibold">ACTIVE_CIRCUIT</span>
                <span className="text-[10px] font-mono text-muted-foreground">SOLID ACCENT</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Calibrated Edge Illumination</h4>
              <p className="text-xs text-muted-foreground">
                Accent color is applied strictly to functional borders and indicators, never as full-bleed decorative card backgrounds.
              </p>
            </div>
            <div className="text-center text-[10px] font-mono text-muted-foreground">
              Border: <code className="text-accent">border-accent</code> · Surface: <code className="text-foreground">#141414</code>
            </div>
          </div>
        )}

        {activeTab === "hardware-switch" && (
          <div className="w-full max-w-md space-y-6">
            {/* Rocker Switch & Toggle */}
            <div className="grid grid-cols-2 gap-4">
              {/* Hardware Rocker */}
              <div className="p-4 rounded-md border border-border bg-elevated-surface shadow-level-1">
                <div className="text-[11px] font-mono text-muted-foreground mb-2">ROCKER_SWITCH</div>
                <div className="inline-flex p-1 rounded-md bg-secondary-surface border border-border shadow-[inset_0_1px_3px_0_rgba(0,0,0,0.8)]">
                  <button
                    onClick={() => setRockerState("A")}
                    className={cn(
                      "px-3 py-1 text-xs font-mono rounded-md transition-all",
                      rockerState === "A"
                        ? "bg-elevated-surface text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] font-bold border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    POS_A
                  </button>
                  <button
                    onClick={() => setRockerState("B")}
                    className={cn(
                      "px-3 py-1 text-xs font-mono rounded-md transition-all",
                      rockerState === "B"
                        ? "bg-elevated-surface text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] font-bold border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    POS_B
                  </button>
                </div>
              </div>

              {/* Neumorphic Toggle Switch */}
              <div className="p-4 rounded-md border border-border bg-elevated-surface shadow-level-1">
                <div className="text-[11px] font-mono text-muted-foreground mb-2">POWER_TOGGLE</div>
                <button
                  type="button"
                  onClick={() => setToggleState(!toggleState)}
                  className={cn(
                    "w-12 h-6 rounded-full p-0.5 transition-colors border relative block",
                    toggleState
                      ? "bg-accent border-accent"
                      : "bg-secondary-surface border-border shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.8)]"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-md transition-transform",
                      toggleState ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Precision Slider Potentiometer */}
            <div className="p-4 rounded-md border border-border bg-elevated-surface shadow-level-1 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">GAIN_POTENTIOMETER</span>
                <span className="text-accent font-semibold">{potentiometerValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={potentiometerValue}
                onChange={(e) => setPotentiometerValue(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-secondary-surface rounded-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Solid Neumorphism vs Glassmorphism Comparison */}
      <div className="border-t border-subtle-border pt-4 space-y-3">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
          Architectural Standard: Solid Neumorphism vs Prohibited Glassmorphism
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-md border border-border bg-surface space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CheckIcon className="h-4 w-4 text-accent" />
              NXTQR Solid Neumorphism (Approved)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Solid, non-transparent surfaces (<code className="text-foreground">#0A0A0A</code>, <code className="text-foreground">#141414</code>).</li>
              <li>Crisp 1px inset highlights (<code className="text-foreground">inset 0 1px 0 rgba(255,255,255,0.05)</code>).</li>
              <li>Predictable contrast: WCAG AAA compliance guaranteed.</li>
              <li>Zero GPU rasterization spikes or scroll hitching.</li>
            </ul>
          </div>

          <div className="p-4 rounded-md border border-border bg-surface space-y-2 opacity-80">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CloseIcon className="h-4 w-4 text-red-500" />
              Generic Glassmorphism (Strictly Prohibited)
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Translucent cards with blur (<code className="text-foreground">backdrop-blur-md</code>).</li>
              <li>Fuzzy text edges and unpredictable text contrast.</li>
              <li>Severe framerate drops on dense graph visualizers.</li>
              <li>Gimmicky AI visual tropes prohibited by NXTQR Constitution §3.2.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Code Block */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          CSS & Tailwind Inset Formula
        </div>
        <CodeBlock
          code={`/* NXTQR Level 1 Raised Surface */
.surface-raised {
  background-color: #0A0A0A;
  border: 1px solid #262626;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.03);
}

/* NXTQR Level 3 Inset Tactile State */
.surface-inset {
  background-color: #1A1A1A;
  border: 1px solid #262626;
  box-shadow: inset 0 1px 3px 0 rgba(0, 0, 0, 0.6),
              inset 0 0 1px 0 rgba(0, 0, 0, 0.4);
}`}
          language="css"
          filename="solid-neumorphism.css"
        />
      </div>
    </div>
  );
}

