"use client";

import * as React from "react";
import {
  ACCENT_PRESET_LIST,
  getAccessibleForeground,
} from "@nxtqr/design-system";
import { Button, Input, Switch } from "@nxtqr/ui";
import { CheckIcon, RefreshIcon } from "@nxtqr/icons";
import { ContrastMeter } from "../components/contrast-meter";
import { DeveloperColorPicker } from "../components/developer-color-picker";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function ColorPlayground() {
  const [selectedHex, setSelectedHex] = React.useState<string>("#0066FF");
  const [backgroundHex, setBackgroundHex] = React.useState<string>("#000000");

  const resolvedForeground = React.useMemo(
    () => getAccessibleForeground(selectedHex),
    [selectedHex],
  );

  const codeExample = `/* Resolved NXTQR Accent Tokens */
:root {
  --accent: ${selectedHex};
  --accent-foreground: ${resolvedForeground};
  --ring: ${selectedHex};
}

/* React / Tailwind Usage */
<Button className="bg-accent text-accent-foreground hover:opacity-95">
  Action Button
</Button>`;

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* 1. Header & Description */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Interactive Color & Accent Laboratory</span>
            <span className="sm:hidden">Color & Accent</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedHex("#0066FF");
              setBackgroundHex("#000000");
            }}
            className="h-7 text-xs font-mono gap-1.5 shrink-0 whitespace-nowrap"
          >
            <RefreshIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Lab</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Test calibrated saturated presets, derive accessible foreground text, and inspect WCAG 2.1 contrast math.
        </p>
      </div>

      {/* 2. Preset Selection & Custom Color Engine */}
      <div className="space-y-4">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
            1. Calibrated Preset Accents & Developer Color Engine
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a pure calibrated preset, sample any pixel with the eyedropper, or fine-tune exact hex, rgb, and hsl spectrums.
          </p>
        </div>

        {/* 8 Pure Calibrated Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {ACCENT_PRESET_LIST.map((preset) => {
            const isSelected = selectedHex.toLowerCase() === preset.hex.toLowerCase();
            const fg = getAccessibleForeground(preset.hex);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedHex(preset.hex)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border text-left transition-all duration-140 outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer select-none",
                  isSelected
                    ? "border-accent bg-secondary-surface shadow-level-3 font-semibold ring-1 ring-accent/60"
                    : "border-border bg-black/60 shadow-level-1 hover:bg-secondary-surface/70",
                )}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <CheckIcon className="h-2 w-2" style={{ color: fg }} />}
                </span>
                <span className="font-mono text-[10px] text-foreground truncate whitespace-nowrap">
                  {preset.label.replace(/^Pure\s+/, "").replace("Monochrome", "Mono")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Developer Custom Color Studio Component */}
        <DeveloperColorPicker
          color={selectedHex}
          onChange={(newHex) => setSelectedHex(newHex)}
          onReset={() => setSelectedHex("#0066FF")}
        />
      </div>

      {/* 3. Live Component Sandbox */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
          2. Live Component Preview Under Resolved Accent
        </span>

        <div
          className="p-6 rounded-md border border-border flex flex-wrap items-center gap-4 justify-center sm:justify-start transition-all"
          style={
            {
              backgroundColor: backgroundHex,
              "--accent": selectedHex,
              "--accent-foreground": resolvedForeground,
              "--ring": selectedHex,
            } as React.CSSProperties
          }
        >
          {/* Primary Action Button */}
          <Button
            style={{ backgroundColor: selectedHex, color: resolvedForeground }}
            className="font-medium shadow-level-1"
          >
            Accent Button
          </Button>

          {/* Secondary Button */}
          <Button variant="secondary">Secondary</Button>

          {/* Outline with Accent Ring */}
          <Button
            variant="outline"
            style={{ borderColor: selectedHex, color: selectedHex }}
          >
            Outline
          </Button>

          {/* Status Indicator Pill */}
          <span
            style={{ backgroundColor: selectedHex, color: resolvedForeground }}
            className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center"
          >
            ACTIVE
          </span>

          {/* Switch */}
          <div className="flex items-center gap-2 font-mono text-xs text-foreground">
            <span>Toggle</span>
            <Switch defaultChecked />
          </div>

          {/* Input Focus Ring */}
          <div className="w-40">
            <Input
              defaultValue="Focus ring test"
              className="h-8 text-xs font-mono"
              style={{ outlineColor: selectedHex }}
            />
          </div>
        </div>

        {/* Background Canvas Selector */}
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-1">
          <span>Test Background:</span>
          <div className="flex items-center gap-1.5">
            {[
              { label: "Pure Black (#000000)", hex: "#000000" },
              { label: "Surface (#0A0A0A)", hex: "#0A0A0A" },
              { label: "Elevated (#141414)", hex: "#141414" },
              { label: "Secondary (#1A1A1A)", hex: "#1A1A1A" },
            ].map((bg) => (
              <button
                key={bg.hex}
                type="button"
                onClick={() => setBackgroundHex(bg.hex)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono border transition-colors",
                  backgroundHex === bg.hex
                    ? "border-accent bg-secondary-surface text-foreground font-semibold"
                    : "border-subtle-border bg-black/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {bg.hex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Contrast Laboratory */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
          3. WCAG 2.1 Contrast Analysis
        </span>

        <ContrastMeter
          foreground={resolvedForeground}
          background={selectedHex}
          sampleText="Accent Text"
        />
      </div>

      {/* 5. Synchronized Code Block */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
          4. Generated Token Output
        </span>
        <CodeBlock code={codeExample} language="css" filename="tokens/theme.css" />
      </div>
    </div>
  );
}
