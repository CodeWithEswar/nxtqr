"use client";

import * as React from "react";
import {
  ACCENT_PRESET_LIST,
  getAccessibleForeground,
} from "@nxtqr/design-system";
import { Button, Input, Badge, Switch } from "@nxtqr/ui";
import { CheckIcon, RefreshIcon } from "@nxtqr/icons";
import { ContrastMeter } from "../components/contrast-meter";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function ColorPlayground() {
  const [selectedHex, setSelectedHex] = React.useState<string>("#0066FF");
  const [customInput, setCustomInput] = React.useState<string>("");
  const [backgroundHex, setBackgroundHex] = React.useState<string>("#000000");

  const resolvedForeground = React.useMemo(
    () => getAccessibleForeground(selectedHex),
    [selectedHex],
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
      setSelectedHex(clean.toUpperCase());
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div>
          <h3 className="text-sm font-semibold font-sans text-foreground">
            Interactive Color & Accent Laboratory
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test calibrated saturated presets, derive accessible foreground text, and inspect WCAG 2.1 contrast math.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedHex("#0066FF");
            setBackgroundHex("#000000");
            setCustomInput("");
          }}
          className="h-7 text-xs font-mono gap-1.5 self-start sm:self-auto"
        >
          <RefreshIcon className="h-3 w-3" />
          <span>Reset Lab</span>
        </Button>
      </div>

      {/* 2. Preset Selection & Custom Hex */}
      <div className="space-y-3">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
          1. Select Calibrated Accent Preset
        </span>

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
                  "flex items-center gap-2 p-2 rounded-md border text-left transition-all duration-140 outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isSelected
                    ? "border-accent bg-secondary-surface shadow-level-3 font-semibold"
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

        {/* Custom Hex Form */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 max-w-xs pt-1">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="#0066FF (Custom Hex)"
            className="h-8 font-mono text-xs uppercase"
          />
          <Button type="submit" variant="outline" size="sm" className="h-8 shrink-0 text-xs">
            Apply
          </Button>
        </form>
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

          {/* Badge */}
          <Badge
            style={{ backgroundColor: selectedHex, color: resolvedForeground }}
            className="font-mono"
          >
            ACTIVE
          </Badge>

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
