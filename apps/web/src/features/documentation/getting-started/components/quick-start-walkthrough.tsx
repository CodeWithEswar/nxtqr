"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";
import {
  RefreshIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";
import type { SimulationEvent } from "@nxtqr/simulation-core";

export function QuickStartWalkthrough() {
  const [activeStep, setActiveStep] = React.useState<number>(1);
  const [simStep, setSimStep] = React.useState<number>(0);
  const [simEvents, setSimEvents] = React.useState<SimulationEvent[]>([]);

  // Quickstart pipeline definition
  const quickstartNodes = [
    { id: "node_ingress", label: "Gateway Ingress", type: "input", status: simStep >= 1 ? "completed" : "idle", x: 60, y: 50 },
    { id: "node_worker", label: "Lambda Compute", type: "process", status: simStep >= 2 ? "completed" : simStep === 1 ? "executing" : "idle", x: 260, y: 50 },
    { id: "node_db", label: "Postgres Storage", type: "database", status: simStep >= 3 ? "completed" : simStep === 2 ? "executing" : "idle", x: 460, y: 50 },
  ];

  const quickstartEdges = [
    { id: "edge_1", source: "node_ingress", target: "node_worker", label: "HTTP/2 [1.2ms]", status: simStep >= 1 ? "active" : "idle" },
    { id: "edge_2", source: "node_worker", target: "node_db", label: "SQL Write [3.4ms]", status: simStep >= 2 ? "active" : "idle" },
  ];

  const handleStepSimulation = () => {
    if (simStep >= 3) {
      setSimStep(0);
      setSimEvents([]);
      return;
    }

    const nextStep = simStep + 1;
    setSimStep(nextStep);

    const node = quickstartNodes[nextStep - 1];
    const newEvent: SimulationEvent = {
      id: `evt_${nextStep}_${Date.now()}`,
      step: nextStep,
      timestamp: nextStep * 18.5,
      type: nextStep === 1 ? "INGRESS_RECEIVED" : nextStep === 2 ? "NODE_EXECUTE" : "DATABASE_WRITE",
      targetNodeId: node.id,
      payload: {
        node: node.label,
        type: node.type,
        durationMs: (Math.random() * 4 + 1).toFixed(1),
        memoryMb: nextStep * 24,
      },
    };

    setSimEvents((prev) => [...prev, newEvent]);
  };

  const handleResetSimulation = () => {
    setSimStep(0);
    setSimEvents([]);
  };

  const stepsList = [
    { num: 1, title: "1. Instantiate Workspace", short: "1. Workspace" },
    { num: 2, title: "2. Define Nodes", short: "2. Nodes" },
    { num: 3, title: "3. Route Edges", short: "3. Edges" },
    { num: 4, title: "4. Validate Schema", short: "4. Schema" },
    { num: 5, title: "5. Run Simulation", short: "5. Simulation" },
  ];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Interactive Quick Start Studio</span>
            <span className="sm:hidden">Quick Start Studio</span>
          </h3>

          <div className="text-xs font-mono text-muted-foreground shrink-0 whitespace-nowrap">
            <span className="hidden sm:inline">Phase: </span>
            <span className="text-accent font-bold">0{activeStep} of 05</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Walk step-by-step through defining your first graph document, executing topological simulation, and inspecting telemetry traces.
        </p>
      </div>

      {/* Workflow Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {stepsList.map((st) => (
          <button
            key={st.num}
            onClick={() => setActiveStep(st.num)}
            className={cn(
              "p-2 rounded-md border text-left transition-all text-xs font-mono select-none",
              activeStep === st.num
                ? "border-accent bg-accent/10 ring-1 ring-accent font-semibold text-foreground"
                : "border-border bg-elevated-surface text-muted-foreground hover:border-muted-border hover:text-foreground"
            )}
          >
            <div className="truncate">
              <span className="hidden sm:inline">{st.title}</span>
              <span className="sm:hidden">{st.short}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Main Interactive Stage */}
      <div className="rounded-md border border-subtle-border bg-black p-4 sm:p-5 space-y-4">
        {/* Interactive Visual Graph Canvas Preview */}
        <div className="rounded-md border border-border bg-black p-4 relative min-h-[160px] overflow-x-auto flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 w-full max-w-2xl py-2">
            {quickstartNodes.map((n, idx) => (
              <React.Fragment key={n.id}>
                <div
                  className={cn(
                    "p-3 rounded-md border text-xs font-mono min-w-[130px] transition-all duration-200 select-none",
                    n.status === "completed"
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : n.status === "executing"
                        ? "border-accent bg-accent/10 text-accent ring-1 ring-accent animate-pulse"
                        : "border-border bg-elevated-surface text-foreground"
                  )}
                >
                  <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-between mb-1">
                    <span>{n.type}</span>
                    <span className="font-bold">{n.status.toUpperCase()}</span>
                  </div>
                  <div className="font-semibold text-foreground font-sans truncate">{n.label}</div>
                  <div className="text-[9px] text-muted-foreground truncate mt-0.5">{n.id}</div>
                </div>

                {idx < quickstartNodes.length - 1 && (
                  <div className="flex flex-col items-center justify-center text-muted-foreground shrink-0">
                    <span className="text-[9px] font-mono mb-0.5">{quickstartEdges[idx].label}</span>
                    <div
                      className={cn(
                        "h-0.5 w-8 sm:w-12 transition-colors",
                        quickstartEdges[idx].status === "active" ? "bg-accent" : "bg-zinc-700"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step-by-Step Instructions & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-border rounded-md text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[10px] uppercase font-bold">Current Action:</span>
            <div className="text-foreground font-semibold">
              {activeStep === 1 && "Create a typed GraphDocument schema instance."}
              {activeStep === 2 && "Add Ingress Gateway, Compute Worker, and State Database nodes."}
              {activeStep === 3 && "Route typed signal edges between input and output ports."}
              {activeStep === 4 && "Run Zod validation to ensure zero schema violations."}
              {activeStep === 5 && "Execute deterministic topological simulation steps."}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {activeStep === 5 ? (
              <>
                <Button
                  size="sm"
                  onClick={handleStepSimulation}
                  className="h-7 text-xs font-mono gap-1"
                >
                  <span>{simStep >= 3 ? "Restart" : `Step (${simStep}/3) →`}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSimulation}
                  disabled={simStep === 0}
                  className="h-7 text-xs font-mono gap-1"
                >
                  <RefreshIcon className="h-3 w-3" />
                  <span>Reset</span>
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                className="h-7 text-xs font-mono gap-1"
              >
                <span>Proceed to Step 0{activeStep + 1}</span>
                <ChevronRightIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Telemetry Stream Output (when simulation is stepped) */}
        {simEvents.length > 0 && (
          <div className="space-y-1.5 border-t border-subtle-border pt-3">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Emitted Execution Telemetry Trace</span>
              <span className="text-accent font-bold">{simEvents.length} Events</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-dense">
              {simEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2 rounded bg-surface border border-border flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-bold">#{evt.step}</span>
                    <span className="text-muted-foreground text-[10px]">+{evt.timestamp.toFixed(1)}ms</span>
                    <span className="text-foreground font-semibold">{evt.type}</span>
                    <span className="text-muted-foreground">({evt.targetNodeId})</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] uppercase font-bold">SUCCESS</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accompanying Code Implementation */}
        <div className="space-y-1.5 border-t border-subtle-border pt-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            TypeScript Implementation Code
          </div>
          <CodeBlock
            code={`import { DeterministicSimulationEngine } from "@nxtqr/simulation-core";
import { GraphDocumentSchema } from "@nxtqr/graph-schema";

// 1. Define document
const document = {
  id: "doc_quickstart",
  schemaVersion: 1,
  visualizerType: "system-design",
  title: "Quickstart Pipeline",
  nodes: [
    { id: "node_ingress", type: "input", position: { x: 60, y: 50 }, status: "idle", data: {} },
    { id: "node_worker", type: "process", position: { x: 260, y: 50 }, status: "idle", data: {} },
    { id: "node_db", type: "database", position: { x: 460, y: 50 }, status: "idle", data: {} },
  ],
  edges: [
    { id: "e1", source: "node_ingress", target: "node_worker", type: "bezier", status: "idle", data: {} },
    { id: "e2", source: "node_worker", target: "node_db", type: "bezier", status: "idle", data: {} },
  ],
  viewport: { x: 0, y: 0, zoom: 1.0 },
  metadata: {},
};

// 2. Validate with Zod
const valid = GraphDocumentSchema.safeParse(document);

// 3. Run simulation
const engine = new DeterministicSimulationEngine();
await engine.initialize(document);
const event = await engine.step();`}
            language="tsx"
            filename="quickstart-pipeline.ts"
          />
        </div>
      </div>
    </div>
  );
}
