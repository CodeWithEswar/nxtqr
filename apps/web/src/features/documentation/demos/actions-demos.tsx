"use client";

import * as React from "react";
import { Button, Toggle, ToggleGroup, ToggleGroupItem } from "@nxtqr/ui";
import {
  LayersIcon,
  RefreshIcon,
  SearchIcon,
  TerminalIcon,
} from "@nxtqr/icons";

// ==========================================
// BUTTON DEMO
// ==========================================
export function ButtonDemo() {
  const [loading, setLoading] = React.useState(false);

  const handleSimulateAction = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button
        variant="default"
        isLoading={loading}
        onClick={handleSimulateAction}
      >
        {loading ? "Executing..." : "Click to Load"}
      </Button>
    </div>
  );
}

export const buttonDemoCode = `import { Button } from "@nxtqr/ui";

export function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="default" isLoading={false}>
        Loading Button
      </Button>
    </div>
  );
}`;

// ==========================================
// TOGGLE DEMO
// ==========================================
export function ToggleDemo() {
  const [pressed, setPressed] = React.useState(false);

  return (
    <div className="flex items-center gap-3">
      <Toggle
        pressed={pressed}
        onPressedChange={setPressed}
        aria-label="Toggle execution simulation"
      >
        {pressed ? <LayersIcon className="h-4 w-4 mr-2" /> : <TerminalIcon className="h-4 w-4 mr-2 text-accent" />}
        <span>{pressed ? "Pause Trace" : "Run Trace"}</span>
      </Toggle>

      <Toggle variant="outline" aria-label="Toggle loop mode">
        <RefreshIcon className="h-4 w-4 mr-1.5" />
        Loop
      </Toggle>
    </div>
  );
}

export const toggleDemoCode = `import * as React from "react";
import { Toggle } from "@nxtqr/ui";
import { TerminalIcon, LayersIcon } from "@nxtqr/icons";

export function ToggleDemo() {
  const [pressed, setPressed] = React.useState(false);

  return (
    <Toggle pressed={pressed} onPressedChange={setPressed}>
      {pressed ? <LayersIcon className="h-4 w-4 mr-2" /> : <TerminalIcon className="h-4 w-4 mr-2 text-accent" />}
      <span>{pressed ? "Pause Trace" : "Run Trace"}</span>
    </Toggle>
  );
}`;

// ==========================================
// TOGGLE GROUP DEMO
// ==========================================
export function ToggleGroupDemo() {
  const [view, setView] = React.useState("grid");

  return (
    <div className="flex flex-col items-center gap-3">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(val) => val && setView(val)}
        className="border border-border rounded-md p-1 bg-surface"
      >
        <ToggleGroupItem value="grid" aria-label="Grid layout">
          <LayersIcon className="h-4 w-4 mr-1.5" />
          Grid
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List layout">
          <TerminalIcon className="h-4 w-4 mr-1.5" />
          Stream
        </ToggleGroupItem>
        <ToggleGroupItem value="inspect" aria-label="Inspection mode">
          <SearchIcon className="h-4 w-4 mr-1.5" />
          Inspect
        </ToggleGroupItem>
      </ToggleGroup>
      <span className="text-[11px] font-mono text-muted-foreground">
        Active Viewport Mode: <span className="text-foreground font-semibold uppercase">{view}</span>
      </span>
    </div>
  );
}

export const toggleGroupDemoCode = `import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@nxtqr/ui";

export function ToggleGroupDemo() {
  const [view, setView] = React.useState("grid");

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(val) => val && setView(val)}
      className="border border-border rounded-md p-1 bg-surface"
    >
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      <ToggleGroupItem value="list">Stream</ToggleGroupItem>
      <ToggleGroupItem value="inspect">Inspect</ToggleGroupItem>
    </ToggleGroup>
  );
}`;
