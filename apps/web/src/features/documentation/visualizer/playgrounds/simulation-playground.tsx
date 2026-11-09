"use client";

import * as React from "react";
import { SimulationControls } from "../../../visualizers/shared/simulation/simulation-controls";
import { useGraphEditorStore } from "@nxtqr/state";
import { Badge } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";

export function SimulationPlayground() {
  const simulationStatus = useGraphEditorStore((state) => state.simulationStatus);
  const currentStep = useGraphEditorStore((state) => state.currentStep);
  const traceEvents = useGraphEditorStore((state) => state.traceEvents);

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Simulation Controls Execution Laboratory</span>
            <span className="sm:hidden">Simulation Controls</span>
          </h3>

          <div className="flex items-center gap-2 font-mono text-xs shrink-0 whitespace-nowrap">
            <Badge variant="outline" className="border-accent/40 text-accent uppercase font-semibold">
              {simulationStatus}
            </Badge>
            <span className="text-muted-foreground">Step: {currentStep}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Transport controls for starting, pausing, stepping, and resetting graph simulations with bounded execution speeds.
        </p>
      </div>

      {/* Live Simulation Controls Stage */}
      <div className="p-4 bg-black border border-subtle-border rounded-md">
        <SimulationControls />
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-md border border-border bg-elevated-surface space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase whitespace-nowrap">State</div>
          <div className="text-sm font-mono font-bold text-accent uppercase">{simulationStatus}</div>
        </div>
        <div className="p-3 rounded-md border border-border bg-elevated-surface space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase whitespace-nowrap">Executed Steps</div>
          <div className="text-sm font-mono font-bold text-foreground tabular-nums">{currentStep}</div>
        </div>
        <div className="p-3 rounded-md border border-border bg-elevated-surface space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase whitespace-nowrap">Trace Events</div>
          <div className="text-sm font-mono font-bold text-foreground tabular-nums">{traceEvents.length}</div>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Simulation Engine Integration
        </div>
        <CodeBlock
          code={`import { DeterministicSimulationEngine } from "@nxtqr/simulation-core";

const engine = new DeterministicSimulationEngine({
  speed: 1.0,
  onEvent: (event) => console.log("Event:", event),
  onStatusChange: (status) => console.log("Status:", status),
});

await engine.initialize(graphDocument);
await engine.run();`}
          language="tsx"
          filename="simulation-example.ts"
        />
      </div>
    </div>
  );
}
