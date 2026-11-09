"use client";

import * as React from "react";
import { Slider, Button } from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function TypographyPlayground() {
  const [fontFamily, setFontFamily] = React.useState<"sans" | "mono">("sans");
  const [fontSize, setFontSize] = React.useState<number>(14);
  const [fontWeight, setFontWeight] = React.useState<number>(400);
  const [lineHeight, setLineHeight] = React.useState<number>(1.5);
  const [letterSpacing, setLetterSpacing] = React.useState<number>(-0.01);
  const [containerWidth, setContainerWidth] = React.useState<number>(560);
  const [sampleType, setSampleType] = React.useState<"spec" | "log" | "headline">("spec");

  const sampleTexts = {
    spec: "NXTQR enforces deterministic rendering boundaries across all visualizer panes. Surfaces use neutral grayscale hierarchy without dark blue or gradient backgrounds. Contrast math guarantees WCAG 2.1 AA/AAA compliance across all calibrated presets.",
    log: "2026-11-08T11:42:01.482Z [INFO] Worker pool initialized. 8 virtual threads active on channel #execution-trace. Peak memory footprint: 14.2 MB. Zero frame drop across 60 FPS viewport render.",
    headline: "Interactive Visual Engineering Studio for High-Density Systems",
  };

  const currentText = sampleTexts[sampleType];

  const resetTypography = () => {
    setFontFamily("sans");
    setFontSize(14);
    setFontWeight(400);
    setLineHeight(1.5);
    setLetterSpacing(-0.01);
    setContainerWidth(560);
    setSampleType("spec");
  };

  const generatedClasses = `font-${fontFamily} text-[${fontSize}px] font-[${fontWeight}] leading-[${lineHeight}] tracking-[${letterSpacing}em]`;

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Interactive Typography Laboratory</span>
            <span className="sm:hidden">Typography Scale</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={resetTypography}
            className="h-7 text-xs font-mono gap-1.5 shrink-0 whitespace-nowrap"
          >
            <RefreshIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Lab</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Test Geist Sans and Geist Mono across font scales, line heights, kerning tracking, and responsive widths.
        </p>
      </div>

      {/* Control Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-md border border-border bg-black/40 text-xs font-mono">
        {/* Font Family */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground uppercase text-[10px] tracking-wider block">
            Font Family
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setFontFamily("sans")}
              className={cn(
                "py-1.5 px-2 rounded-md border text-center transition-colors whitespace-nowrap",
                fontFamily === "sans"
                  ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-1"
                  : "border-subtle-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="hidden sm:inline">Geist Sans</span>
              <span className="sm:hidden">Sans</span>
            </button>
            <button
              type="button"
              onClick={() => setFontFamily("mono")}
              className={cn(
                "py-1.5 px-2 rounded-md border text-center transition-colors whitespace-nowrap",
                fontFamily === "mono"
                  ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-1"
                  : "border-subtle-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="hidden sm:inline">Geist Mono</span>
              <span className="sm:hidden">Mono</span>
            </button>
          </div>
        </div>

        {/* Font Weight */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground uppercase text-[10px] tracking-wider block">
            Font Weight: {fontWeight}
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[400, 500, 600, 700].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setFontWeight(w)}
                className={cn(
                  "py-1.5 rounded-md border text-center transition-colors text-[11px]",
                  fontWeight === w
                    ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "border-subtle-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Sample Content Switcher */}
        <div className="space-y-1.5">
          <label className="text-muted-foreground uppercase text-[10px] tracking-wider block">
            Sample Corpus
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: "spec", label: "Spec" },
              { id: "log", label: "Log" },
              { id: "headline", label: "Title" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSampleType(s.id as any)}
                className={cn(
                  "py-1.5 rounded-md border text-center transition-colors text-[11px]",
                  sampleType === s.id
                    ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-1"
                    : "border-subtle-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Size</span>
            <span className="text-foreground font-semibold">{fontSize}px</span>
          </div>
          <Slider
            min={11}
            max={32}
            step={1}
            value={[fontSize]}
            onValueChange={([val]) => setFontSize(val)}
          />
        </div>

        {/* Line Height Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Line Height</span>
            <span className="text-foreground font-semibold">{lineHeight.toFixed(2)}</span>
          </div>
          <Slider
            min={1}
            max={2}
            step={0.05}
            value={[lineHeight]}
            onValueChange={([val]) => setLineHeight(val)}
          />
        </div>

        {/* Letter Spacing Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Tracking</span>
            <span className="text-foreground font-semibold">
              {letterSpacing > 0 ? `+${letterSpacing.toFixed(2)}` : letterSpacing.toFixed(2)}em
            </span>
          </div>
          <Slider
            min={-0.05}
            max={0.05}
            step={0.005}
            value={[letterSpacing]}
            onValueChange={([val]) => setLetterSpacing(val)}
          />
        </div>
      </div>

      {/* Live Typography Canvas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Container Boundary ({containerWidth}px)</span>
          <div className="flex items-center gap-2">
            <span>Width:</span>
            <Slider
              min={280}
              max={800}
              step={10}
              value={[containerWidth]}
              onValueChange={([val]) => setContainerWidth(val)}
              className="w-32"
            />
          </div>
        </div>

        <div className="p-6 rounded-md border border-border bg-black flex justify-center overflow-x-auto scrollbar-dense">
          <div
            style={{
              width: `${containerWidth}px`,
              fontFamily: fontFamily === "mono" ? "var(--font-geist-mono), monospace" : "var(--font-geist-sans), sans-serif",
              fontSize: `${fontSize}px`,
              fontWeight,
              lineHeight,
              letterSpacing: `${letterSpacing}em`,
            }}
            className="text-foreground transition-all duration-140 select-all"
          >
            {currentText}
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded bg-black/40 border border-subtle-border">
          <span className="text-[10px] text-muted-foreground block">CSS Font Family</span>
          <span className="font-semibold text-foreground">
            {fontFamily === "mono" ? "Geist Mono" : "Geist Sans"}
          </span>
        </div>
        <div className="p-2.5 rounded bg-black/40 border border-subtle-border">
          <span className="text-[10px] text-muted-foreground block">Computed Metric</span>
          <span className="font-semibold text-foreground">
            {fontSize}px / {(fontSize * lineHeight).toFixed(1)}px
          </span>
        </div>
        <div className="p-2.5 rounded bg-black/40 border border-subtle-border">
          <span className="text-[10px] text-muted-foreground block">Relative Tracking</span>
          <span className="font-semibold text-foreground">
            {(letterSpacing * fontSize).toFixed(2)}px ({letterSpacing}em)
          </span>
        </div>
        <div className="p-2.5 rounded bg-black/40 border border-subtle-border">
          <span className="text-[10px] text-muted-foreground block">Glyph Character Count</span>
          <span className="font-semibold text-foreground">{currentText.length} chars</span>
        </div>
      </div>

      {/* Generated Code */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block">
          Tailwind & CSS Implementation
        </span>
        <CodeBlock
          code={`<p className="${generatedClasses}">\n  ${currentText.slice(0, 80)}...\n</p>`}
          language="tsx"
          filename="typography.tsx"
        />
      </div>
    </div>
  );
}
