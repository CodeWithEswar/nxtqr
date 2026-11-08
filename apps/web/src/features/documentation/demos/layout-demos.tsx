"use client";

import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  ScrollArea,
  Separator,
  Button,
} from "@nxtqr/ui";
import { CanvasShell } from "@nxtqr/ui";
import { ChevronDownIcon, LayersIcon } from "@nxtqr/icons";

// ==========================================
// ACCORDION DEMO
// ==========================================
export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-md">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-xs font-semibold">
          Monochrome Architectural Baseline
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
          The default theme is pure black (#000000) with surface hierarchy (#0A0A0A, #141414, #1A1A1A). Colorful gradients and blurry glassmorphism are strictly prohibited.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger className="text-xs font-semibold">
          Solid Neumorphism Elevation
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
          Depth is produced via directional shadows (--shadow-level-1 through --shadow-level-3) with crisp 1px specular top highlights and solid opaque backdrops.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-xs font-semibold">
          Border Radius Standardization
        </AccordionTrigger>
        <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
          Every rectangular surface must strictly enforce rounded-md (0.375rem / 6px). No rounded-lg or rounded-xl are permitted.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const accordionDemoCode = `import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@nxtqr/ui";

export function AccordionDemo() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Architecture</AccordionTrigger>
        <AccordionContent>Pure black monochrome foundation.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}`;

// ==========================================
// COLLAPSIBLE DEMO
// ==========================================
export function CollapsibleDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="w-full max-w-sm rounded-md border border-border bg-surface p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-2">
          <LayersIcon className="h-4 w-4 text-accent" />
          Runtime Environment Variables
        </span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="text-[11px] font-mono text-muted-foreground">
        NEXT_PUBLIC_SUPABASE_URL: Configured
      </div>
      <CollapsibleContent className="space-y-2 pt-2 border-t border-subtle-border font-mono text-[11px] text-muted-foreground">
        <div>NEXT_PUBLIC_SIMULATION_WORKERS: 8</div>
        <div>NEXT_PUBLIC_MAX_PAYLOAD_BYTES: 10485760</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const collapsibleDemoCode = `import * as React from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Button,
} from "@nxtqr/ui";

export function CollapsibleDemo() {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline">Toggle Details</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p>Hidden variables</p>
      </CollapsibleContent>
    </Collapsible>
  );
}`;

// ==========================================
// SCROLL AREA DEMO
// ==========================================
export function ScrollAreaDemo() {
  const tags = Array.from({ length: 30 }).map(
    (_, i) => `event_trace_packet_seq_${i.toString().padStart(3, "0")}`,
  );

  return (
    <ScrollArea className="h-48 w-64 rounded-md border border-border bg-surface p-4" variant="compact">
      <div className="space-y-2">
        <h4 className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider mb-2">
          Precision Rail Events
        </h4>
        {tags.map((tag) => (
          <div
            key={tag}
            className="text-[11px] font-mono text-muted-foreground py-1 border-b border-subtle-border last:border-0 hover:text-foreground"
          >
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export const scrollAreaDemoCode = `import { ScrollArea } from "@nxtqr/ui";

export function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-48 w-64 border border-border rounded-md p-4" variant="compact">
      <p>Precision Rail scrollable viewport content</p>
    </ScrollArea>
  );
}`;

// ==========================================
// SEPARATOR DEMO
// ==========================================
export function SeparatorDemo() {
  return (
    <div className="w-full max-w-sm space-y-3 font-mono text-xs">
      <div>
        <h5 className="font-semibold text-foreground">Visualizer Core</h5>
        <p className="text-[11px] text-muted-foreground">Deterministic Canvas Engine</p>
      </div>
      <Separator />
      <div className="flex items-center space-x-4 text-[11px] text-muted-foreground">
        <span>60 FPS</span>
        <Separator orientation="vertical" className="h-4" />
        <span>ElkJS Layered</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Zero Blur</span>
      </div>
    </div>
  );
}

export const separatorDemoCode = `import { Separator } from "@nxtqr/ui";

export function SeparatorDemo() {
  return (
    <div>
      <h5>Core</h5>
      <Separator className="my-2" />
      <div className="flex gap-2">
        <span>Item 1</span>
        <Separator orientation="vertical" />
        <span>Item 2</span>
      </div>
    </div>
  );
}`;

// ==========================================
// CANVAS SHELL DEMO
// ==========================================
export function CanvasShellDemo() {
  return (
    <div className="w-full max-w-md h-56 rounded-md border border-border overflow-hidden relative shadow-level-1">
      <CanvasShell
        toolbar={
          <div className="text-[10px] font-mono bg-surface px-2 py-1 rounded border border-border text-foreground">
            Zoom: 100%
          </div>
        }
        sidebar={
          <div className="w-24 bg-surface p-2 text-[10px] font-mono text-muted-foreground border-r border-border">
            Inspector
          </div>
        }
      >
        <div className="w-full h-full flex items-center justify-center bg-black text-xs font-mono text-muted-foreground">
          Interactive Canvas Grid Viewport
        </div>
      </CanvasShell>
    </div>
  );
}

export const canvasShellDemoCode = `import { CanvasShell } from "@nxtqr/ui";

export function CanvasShellDemo() {
  return (
    <CanvasShell
      toolbar={<div>Toolbar</div>}
      sidebar={<div>Sidebar</div>}
    >
      <div>Canvas Grid</div>
    </CanvasShell>
  );
}`;
