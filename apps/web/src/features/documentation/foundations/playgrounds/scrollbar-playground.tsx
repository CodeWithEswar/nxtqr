"use client";

import * as React from "react";
import { scrollbarTokens } from "@nxtqr/design-system";
import { CheckIcon, CopyIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function ScrollbarPlayground() {
  const [activeVariant, setActiveVariant] = React.useState<"default" | "compact" | "canvas" | "dense">("default");
  const [accentThumb, setAccentThumb] = React.useState<boolean>(false);
  const itemCount = 40;
  const [copied, setCopied] = React.useState<boolean>(false);

  const currentSize = scrollbarTokens.sizes[activeVariant];
  const currentRadius = scrollbarTokens.radius[activeVariant === "canvas" ? "compact" : activeVariant];

  const copyCssVar = () => {
    navigator.clipboard.writeText(currentSize.cssVar);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const variants: { id: "default" | "compact" | "canvas" | "dense"; label: string; px: number; use: string }[] = [
    { id: "default", label: "Default", px: 10, use: "Main page & documents" },
    { id: "compact", label: "Compact", px: 7, use: "Sidebars & popovers" },
    { id: "canvas", label: "Canvas", px: 7, use: "Node editor viewport" },
    { id: "dense", label: "Dense", px: 6, use: "Telemetry logs & tables" },
  ];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Precision Rail Scrollbar Laboratory</span>
            <span className="sm:hidden">Rail Scrollbar</span>
          </h3>

          <button
            onClick={() => setAccentThumb(!accentThumb)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-mono border transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap",
              accentThumb
                ? "border-accent bg-accent text-accent-foreground font-semibold"
                : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground"
            )}
          >
            {accentThumb && <CheckIcon className="h-3 w-3" />}
            <span className="hidden sm:inline">Accent Thumb: </span>
            <span>{accentThumb ? "ON" : "OFF"}</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Engineered hardware scroll rails. 10px / 7px / 6px precision scales, inset groove lighting, and dynamic user-accent drag feedback.
        </p>
      </div>

      {/* Variant Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveVariant(v.id)}
            className={cn(
              "p-3 rounded-md border text-left transition-all",
              activeVariant === v.id
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-border bg-elevated-surface hover:border-muted-border"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">{v.label}</span>
              <span className="text-[10px] font-mono text-accent whitespace-nowrap">{v.px}px</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground truncate">{v.use}</div>
          </button>
        ))}
      </div>

      {/* Interactive Scroll Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">
            SCROLL CONTAINER: <span className="text-foreground">{activeVariant.toUpperCase()} RAIL ({currentSize.px}px)</span>
          </span>
          <button
            onClick={copyCssVar}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {copied ? <CheckIcon className="h-3 w-3 text-accent" /> : <CopyIcon className="h-3 w-3" />}
            {copied ? "Copied" : currentSize.cssVar}
          </button>
        </div>

        <div className="p-4 bg-black border border-subtle-border rounded-md">
          {/* Custom Styled Scrollbox Container */}
          <div
            className={cn(
              "h-64 border border-border bg-elevated-surface rounded-md overflow-y-scroll overflow-x-auto p-4 transition-all",
              accentThumb && "precision-rail-accent"
            )}
            style={{
              scrollbarWidth: activeVariant === "dense" || activeVariant === "compact" ? "thin" : "auto",
              scrollbarColor: accentThumb ? "var(--accent) #080808" : "#303030 #080808",
            }}
          >
            <div className="w-[600px] space-y-2">
              <div className="text-xs font-mono text-accent font-semibold sticky top-0 bg-elevated-surface/90 py-1 backdrop-blur-none border-b border-subtle-border">
                Telemetry Log Stream — 2D Scrollable Surface
              </div>

              {Array.from({ length: itemCount }).map((_, i) => (
                <div
                  key={i}
                  className="p-2 rounded border border-border/60 bg-surface flex items-center justify-between font-mono text-xs text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                >
                  <span className="text-foreground font-semibold">LOG_PACKET_0x{i.toString(16).padStart(4, "0")}</span>
                  <span>TIME: +{(i * 12.4).toFixed(1)}ms</span>
                  <span className="text-accent">STATE: SYNCED</span>
                  <span>BUFFER_ADDR: 0x7FFF{i * 8}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Precision Rail Specs Table */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-subtle-border pt-4">
        <div className="p-3 border border-border bg-elevated-surface rounded-md space-y-1">
          <div className="text-xs font-semibold text-foreground">Rail Inset Groove</div>
          <p className="text-[11px] font-mono text-muted-foreground">
            Track: <code className="text-foreground">#080808</code> · Border: <code className="text-foreground">#141414</code>
          </p>
        </div>

        <div className="p-3 border border-border bg-elevated-surface rounded-md space-y-1">
          <div className="text-xs font-semibold text-foreground">Hardware Thumb</div>
          <p className="text-[11px] font-mono text-muted-foreground">
            Thumb: <code className="text-foreground">#303030</code> · Hover: <code className="text-foreground">#505050</code>
          </p>
        </div>

        <div className="p-3 border border-border bg-elevated-surface rounded-md space-y-1">
          <div className="text-xs font-semibold text-foreground">Concentric Radius</div>
          <p className="text-[11px] font-mono text-muted-foreground">
            Standard: <code className="text-foreground">{currentRadius}</code>
          </p>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          CSS Precision Rail Implementation
        </div>
        <CodeBlock
          code={`/* NXTQR Precision Rail Scrollbar */
::-webkit-scrollbar {
  width: var(--scrollbar-size, 10px);
  height: var(--scrollbar-size, 10px);
}

::-webkit-scrollbar-track {
  background: #080808;
  border-left: 1px solid #141414;
}

::-webkit-scrollbar-thumb {
  background: #303030;
  border: 2px solid #080808;
  border-radius: 6px;
}

::-webkit-scrollbar-thumb:hover {
  background: #505050;
}

::-webkit-scrollbar-thumb:active {
  background: var(--accent); /* Dynamic pure accent feedback */
}`}
          language="css"
          filename="precision-rail.css"
        />
      </div>
    </div>
  );
}
