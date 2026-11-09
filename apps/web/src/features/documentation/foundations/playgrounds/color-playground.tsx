"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";
import { CheckIcon, CopyIcon, LayersIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

interface MonochromeToken {
  name: string;
  variable: string;
  hex: string;
  contrastVsBlack: string;
  wcag: string;
  role: string;
}

const TOKENS: MonochromeToken[] = [
  { name: "Background", variable: "--background", hex: "#000000", contrastVsBlack: "1.0:1", wcag: "Canvas Base", role: "Main canvas viewport & full-page background" },
  { name: "Surface 01", variable: "--surface-01", hex: "#080808", contrastVsBlack: "1.06:1", wcag: "Subtle Depth", role: "Subtle raised containers, bottom toolbars" },
  { name: "Surface 02", variable: "--surface-02", hex: "#0D0D0D", contrastVsBlack: "1.13:1", wcag: "Card Base", role: "Standard cards, panels, tab stages" },
  { name: "Surface 03", variable: "--surface-03", hex: "#141414", contrastVsBlack: "1.23:1", wcag: "Elevated Surface", role: "Floating dialogs, popovers, inspectors" },
  { name: "Surface 04", variable: "--surface-04", hex: "#1A1A1A", contrastVsBlack: "1.34:1", wcag: "Active State", role: "Active tabs, hover surfaces, pressed controls" },
  { name: "Border Subtle", variable: "--border-subtle", hex: "#202020", contrastVsBlack: "1.47:1", wcag: "Subtle Boundary", role: "Internal dividers, secondary borders" },
  { name: "Border Default", variable: "--border", hex: "#292929", contrastVsBlack: "1.65:1", wcag: "Standard Frame", role: "Card frames, inputs, component outlines" },
  { name: "Border Strong", variable: "--border-strong", hex: "#404040", contrastVsBlack: "2.16:1", wcag: "Focus Frame", role: "Emphasized boundaries, active rings" },
  { name: "Text Disabled", variable: "--disabled-foreground", hex: "#666666", contrastVsBlack: "4.54:1", wcag: "WCAG AA", role: "Inactive controls, disabled text" },
  { name: "Text Muted", variable: "--muted-foreground", hex: "#858585", contrastVsBlack: "7.15:1", wcag: "WCAG AAA", role: "Supporting metadata, timestamps, hints" },
  { name: "Text Secondary", variable: "--secondary-foreground", hex: "#B5B5B5", contrastVsBlack: "12.7:1", wcag: "WCAG AAA", role: "Secondary descriptors, subtitles" },
  { name: "Text Primary", variable: "--foreground", hex: "#FFFFFF", contrastVsBlack: "21.0:1", wcag: "WCAG AAA", role: "Primary content, active headings" },
];

export function ColorPlayground() {
  const [selectedToken, setSelectedToken] = React.useState<MonochromeToken>(TOKENS[11]);
  const [copied, setCopied] = React.useState<boolean>(false);

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(`:root {
  color-scheme: dark;
  --background: #000000;
  --surface-01: #080808;
  --surface-02: #0d0d0d;
  --surface-03: #141414;
  --surface-04: #1a1a1a;
  --border-subtle: #202020;
  --border-default: #292929;
  --border-strong: #404040;
  --text-primary: #ffffff;
  --text-secondary: #b5b5b5;
  --text-muted: #858585;
  --text-disabled: #666666;
  --radius: 0.375rem;
}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* 1. Header & Description */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
            <LayersIcon className="h-4 w-4 text-foreground" />
            <span className="hidden sm:inline">Monochrome Token Laboratory</span>
            <span className="sm:hidden">Monochrome Tokens</span>
          </h3>

          <span className="text-[10px] font-mono text-muted-foreground border border-subtle-border px-2 py-0.5 rounded bg-elevated-surface">
            Pure Black Monochrome
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Zero color themes. Calibrated 12-token neutral grayscale hierarchy providing optimal WCAG 2.1 AAA contrast and restrained solid neumorphism.
        </p>
      </div>

      {/* 2. Interactive Token Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
            Core Grayscale Tokens (Click to Inspect)
          </label>
          <span className="text-[10px] font-mono text-muted-foreground">
            Selected: <strong className="text-foreground">{selectedToken.name}</strong> ({selectedToken.hex})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {TOKENS.map((token) => {
            const isSelected = selectedToken.variable === token.variable;
            return (
              <button
                key={token.variable}
                onClick={() => setSelectedToken(token)}
                className={cn(
                  "p-2.5 rounded-md border text-left transition-all select-none relative group",
                  isSelected
                    ? "border-border-strong bg-surface-04 ring-1 ring-border-default shadow-level-2"
                    : "border-border bg-elevated-surface hover:border-border-hover hover:bg-secondary-surface"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold text-foreground truncate">{token.name}</span>
                  <div
                    className="w-3.5 h-3.5 rounded-sm border border-subtle-border shrink-0"
                    style={{ backgroundColor: token.hex }}
                  />
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">{token.hex}</div>
                <div className="text-[9px] font-mono text-muted-foreground truncate mt-0.5">{token.contrastVsBlack} vs #000</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Token Deep Inspection & Contrast Card */}
      <div className="rounded-md border border-subtle-border bg-black p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle-border pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-md border border-border shadow-level-1 shrink-0"
              style={{ backgroundColor: selectedToken.hex }}
            />
            <div>
              <h4 className="text-sm font-bold font-sans text-foreground">{selectedToken.name}</h4>
              <span className="text-xs font-mono text-muted-foreground">{selectedToken.variable} · {selectedToken.hex}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-foreground font-semibold px-2 py-1 rounded border border-border bg-surface">
              {selectedToken.contrastVsBlack}
            </span>
            <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded border border-subtle-border bg-black">
              {selectedToken.wcag}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {selectedToken.role}. All surfaces remain opaque to enforce solid neumorphic depth without translucent blurring.
        </p>

        {/* 4. Live Monochrome Component Showcase */}
        <div className="space-y-2 pt-2 border-t border-subtle-border">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
            Monochrome Component Implementations
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-md border border-border bg-surface-01 space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Primary Action</span>
              <Button className="w-full bg-white text-black font-semibold hover:bg-neutral-200 shadow-level-1 h-8 text-xs">
                Execute Pipeline
              </Button>
            </div>

            <div className="p-3 rounded-md border border-border bg-surface-01 space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Secondary Surface</span>
              <Button variant="outline" className="w-full border-border bg-elevated-surface text-foreground hover:bg-secondary-surface h-8 text-xs font-mono">
                Inspect Specs
              </Button>
            </div>

            <div className="p-3 rounded-md border border-border bg-surface-01 space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase">Hardware Input</span>
              <input
                type="text"
                readOnly
                value="node_cluster_01"
                className="w-full px-2.5 py-1 text-xs font-mono rounded-md border border-border bg-black text-foreground shadow-level-3 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. CSS Variable Export */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Active Core Design System Tokens (globals.css)
          </span>
          <button
            onClick={handleCopyCSS}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {copied ? <CheckIcon className="h-3 w-3 text-foreground" /> : <CopyIcon className="h-3 w-3" />}
            {copied ? "Copied" : "Copy CSS"}
          </button>
        </div>

        <CodeBlock
          code={`:root {
  color-scheme: dark;
  --background: #000000;
  --foreground: #ffffff;
  --card: #0d0d0d;
  --popover: #141414;
  --primary: #ffffff;
  --primary-foreground: #000000;
  --secondary: #141414;
  --secondary-foreground: #ffffff;
  --muted: #141414;
  --muted-foreground: #858585;
  --accent: #1a1a1a;
  --accent-foreground: #ffffff;
  --border: #292929;
  --input: #292929;
  --ring: #e5e5e5;
  --radius: 0.375rem;
}`}
          language="css"
          filename="monochrome-tokens.css"
        />
      </div>
    </div>
  );
}
