"use client";

import * as React from "react";
import { Badge } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";
import {
  LayersIcon,
  CpuIcon,
  ActivityIcon,
  TerminalIcon,
  CheckCircleIcon,
  SettingsIcon,
} from "@nxtqr/icons";

interface PipelineStage {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  packages: string[];
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  inputContract: string;
  outputContract: string;
  codeSnippet: string;
}

const STAGES: PipelineStage[] = [
  {
    id: "definition",
    step: 1,
    title: "Graph Definition",
    subtitle: "Discriminated union schemas",
    packages: ["@nxtqr/graph-schema", "@nxtqr/node-registry"],
    icon: LayersIcon,
    description:
      "Engineers define nodes, typed ports, and signal edges adhering to strict Zod schemas. Zero React Flow internal types leak into storage contracts.",
    inputContract: "Raw JSON / Database record",
    outputContract: "GraphDocument { id, nodes, edges, viewport }",
    codeSnippet: `import type { GraphDocument, BaseNode } from "@nxtqr/graph-schema";

export const ingressNode: BaseNode = {
  id: "node_ingress",
  type: "input",
  status: "idle",
  position: { x: 100, y: 150 },
  label: "Cloudflare Ingress",
  ports: [{ id: "out", name: "Out", type: "output" }],
  data: { protocol: "HTTPS/3", rateLimitRps: 2500 },
};`,
  },
  {
    id: "validation",
    step: 2,
    title: "Schema & Size Guards",
    subtitle: "Zod runtime parsing",
    packages: ["@nxtqr/validation", "@nxtqr/security"],
    icon: CheckCircleIcon,
    description:
      "All inbound payloads assert strict byte-size bounds (assertPayloadSize) and validate against discriminated union schemas before execution.",
    inputContract: "GraphDocument / SimulationConfig",
    outputContract: "SafeParseReturnType<GraphDocument>",
    codeSnippet: `import { GraphDocumentSchema } from "@nxtqr/graph-schema";
import { assertPayloadSize } from "@nxtqr/security";

export function validateGraph(payload: unknown) {
  assertPayloadSize(payload, 5 * 1024 * 1024); // 5MB guard
  return GraphDocumentSchema.safeParse(payload);
}`,
  },
  {
    id: "rendering",
    step: 3,
    title: "Canvas & ELK Layout",
    subtitle: "Sub-pixel grid & layout",
    packages: ["@nxtqr/canvas-core", "@xyflow/react", "elkjs"],
    icon: SettingsIcon,
    description:
      "Coordinate mapping, zoom clamping (0.2x–2.5x), and automated hierarchical graph layout via ELK.js with sub-pixel dots/lines grid.",
    inputContract: "Validated GraphDocument",
    outputContract: "Rendered interactive SVG/DOM Canvas",
    codeSnippet: `import { calculateElkLayout } from "@nxtqr/web/features/visualizers";
import { clampZoom } from "@nxtqr/canvas-core";

const layouted = await calculateElkLayout(nodes, edges, "LR");
const validZoom = clampZoom(currentZoom);`,
  },
  {
    id: "simulation",
    step: 4,
    title: "Deterministic Engine",
    subtitle: "Topological stepping",
    packages: ["@nxtqr/simulation-core"],
    icon: CpuIcon,
    description:
      "Non-blocking runner traverses graph dependencies step-by-step. Supports Start, Pause, Step, and dynamic speed multipliers (0.5x–4.0x).",
    inputContract: "GraphDocument & SimulationOptions",
    outputContract: "Async generator of step transitions",
    codeSnippet: `import { DeterministicSimulationEngine } from "@nxtqr/simulation-core";

const engine = new DeterministicSimulationEngine({
  speed: 1.0,
  onEvent: (evt) => store.addTraceEvent(evt),
});
await engine.initialize(document);
await engine.run();`,
  },
  {
    id: "telemetry",
    step: 5,
    title: "Execution Events",
    subtitle: "Structured telemetry",
    packages: ["@nxtqr/simulation-core", "@nxtqr/observability"],
    icon: ActivityIcon,
    description:
      "Each node step emits typed telemetry events with relative timings, memory metrics, payload digests, and correlation IDs.",
    inputContract: "Node execution transition",
    outputContract: "SimulationEvent { id, step, timestamp, payload }",
    codeSnippet: `export interface SimulationEvent {
  id: string;
  step: number;
  timestamp: number; // delta in ms
  type: "NODE_EXECUTE" | "INGRESS_RECEIVED" | "DATABASE_WRITE";
  targetNodeId: string;
  payload: Record<string, unknown>;
}`,
  },
  {
    id: "trace",
    step: 6,
    title: "Execution Trace Stream",
    subtitle: "Chronological inspection",
    packages: ["@nxtqr/execution-trace", "@nxtqr/state"],
    icon: TerminalIcon,
    description:
      "Chronological stream viewer with text search filtering, relative timing formatters (+45.2ms), and formatted JSON telemetry payloads.",
    inputContract: "Array of SimulationEvent",
    outputContract: "Bidirectional synchronized studio UI",
    codeSnippet: `import { filterTraceEvents, formatRelativeTimestamp } from "@nxtqr/execution-trace";

const events = filterTraceEvents(stream, { searchQuery: "Database", status: "success" });
const timeStr = formatRelativeTimestamp(event.timestamp); // "+45.2ms"`,
  },
];

export function ArchitectureOverview() {
  const [activeStageId, setActiveStageId] = React.useState<string>("definition");
  const stage = STAGES.find((s) => s.id === activeStageId) ?? STAGES[0];
  const IconComp = stage.icon;

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div>
          <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
            NXTQR Platform Architecture Lifecycle
            <Badge variant="outline" className="border-accent text-accent font-mono text-[10px] uppercase">
              End-to-End Flow
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any architectural stage below to inspect its data contract, package ownership, and runtime implementation.
          </p>
        </div>

        <div className="text-xs font-mono text-muted-foreground self-start sm:self-auto">
          Selected Stage: <span className="text-accent font-bold">0{stage.step} / 06</span>
        </div>
      </div>

      {/* Horizontal Pipeline Steps Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STAGES.map((s) => {
          const SIcon = s.icon;
          const isActive = s.id === activeStageId;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStageId(s.id)}
              className={cn(
                "p-2.5 rounded-md border text-left transition-all duration-150 relative select-none",
                isActive
                  ? "border-accent bg-accent/10 ring-1 ring-accent shadow-level-2"
                  : "border-border bg-elevated-surface hover:border-muted-border hover:bg-secondary-surface"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-muted-foreground font-bold">
                  0{s.step}
                </span>
                <SIcon className={cn("h-3.5 w-3.5", isActive ? "text-accent" : "text-muted-foreground")} />
              </div>
              <div className="text-xs font-semibold font-sans text-foreground truncate">
                {s.title}
              </div>
              <div className="text-[10px] text-muted-foreground truncate font-mono">
                {s.packages[0].replace("@nxtqr/", "")}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Stage Detail Console */}
      <div className="rounded-md border border-subtle-border bg-black p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-surface border border-border flex items-center justify-center text-accent">
              <IconComp className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground font-sans">{stage.title}</span>
                <span className="text-border">·</span>
                <span className="text-[11px] text-muted-foreground font-mono">{stage.subtitle}</span>
              </div>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">{stage.description}</p>
            </div>
          </div>

          {/* Package Badges */}
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {stage.packages.map((pkg) => (
              <span
                key={pkg}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-foreground font-semibold"
              >
                {pkg}
              </span>
            ))}
          </div>
        </div>

        {/* Contract Data Flow Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded bg-surface border border-border space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Inbound Contract:</span>
            <span className="text-foreground font-semibold">{stage.inputContract}</span>
          </div>
          <div className="p-2.5 rounded bg-surface border border-border space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Outbound Contract:</span>
            <span className="text-accent font-semibold">{stage.outputContract}</span>
          </div>
        </div>

        {/* Code Block */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Implementation Reference
          </div>
          <CodeBlock
            code={stage.codeSnippet}
            language="tsx"
            filename={`${stage.id}-contract.ts`}
          />
        </div>
      </div>
    </div>
  );
}
