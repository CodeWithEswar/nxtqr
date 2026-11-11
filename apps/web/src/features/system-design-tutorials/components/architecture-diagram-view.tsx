"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button, Card, Tooltip, TooltipContent, TooltipTrigger } from "@nxtqr/ui";
import { ActivityIcon, ChevronRightIcon, CloseIcon, PlayIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import type { ArchitectureExample } from "../schemas/tutorial.schema";
import { TUTORIAL_FLOW_HOP_MS } from "../lib/tutorial-flow";

const TutorialCanvas = dynamic(
  () => import("./tutorial-canvas").then((module) => module.TutorialCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="grid h-[clamp(14rem,50dvh,32rem)] place-items-center bg-black text-xs text-text-muted"
      >
        Loading canvas…
      </div>
    ),
  },
);

export interface ArchitectureDiagramViewProps {
  example: ArchitectureExample;
  className?: string;
}

export function ArchitectureDiagramView({ example, className }: ArchitectureDiagramViewProps) {
  const [activeStep, setActiveStep] = React.useState<number | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [traceRun, setTraceRun] = React.useState(0);
  const { nodes, edges } = example.graphDocument;
  const { flowSteps } = example;

  React.useEffect(() => {
    if (!playing || activeStep === null) return;
    const timer = window.setTimeout(
      () => {
        if (activeStep + 1 < flowSteps.length) setActiveStep(activeStep + 1);
        else setPlaying(false);
      },
      Math.max(1450, flowSteps[activeStep].edgeIds.length * TUTORIAL_FLOW_HOP_MS + 200),
    );
    return () => window.clearTimeout(timer);
  }, [activeStep, flowSteps, playing]);

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      <Card className="border-border-default bg-surface-01">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border-default px-2.5 py-1.5">
          <p className="min-w-0 text-xs tabular-nums text-text-muted">
            <span className="font-mono text-text-secondary">{nodes.length}</span>{" "}
            {nodes.length === 1 ? "node" : "nodes"} <span aria-hidden="true">·</span>{" "}
            <span className="font-mono text-text-secondary">{edges.length}</span>{" "}
            {edges.length === 1 ? "connection" : "connections"}
          </p>
          {flowSteps.length > 0 && (
            <div
              role="group"
              aria-label="Flow controls"
              className="ml-auto flex items-center gap-1"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-24 gap-1.5"
                onClick={() => {
                  if (playing) setPlaying(false);
                  else {
                    setTraceRun((run) => run + 1);
                    setActiveStep(0);
                    setPlaying(true);
                  }
                }}
              >
                {playing ? <ActivityIcon size={14} /> : <PlayIcon size={14} />}
                {playing ? "Stop flow" : "Play flow"}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="text-text-secondary"
                    aria-label="Clear trace"
                    disabled={activeStep === null}
                    onClick={() => {
                      setPlaying(false);
                      setActiveStep(null);
                    }}
                  >
                    <CloseIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end">
                  Clear trace
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        <TutorialCanvas
          label={`${example.title} diagram`}
          nodes={nodes}
          edges={edges}
          activeEdgeIds={activeStep === null ? undefined : flowSteps[activeStep]?.edgeIds}
          traceKey={`${traceRun}:${activeStep}`}
          className="h-[clamp(14rem,50dvh,32rem)] overflow-hidden rounded-b-md"
        />
      </Card>

      {flowSteps.length > 0 && (
        <section id="request-flow" aria-labelledby="request-flow-title" className="scroll-mt-4">
          <h3 id="request-flow-title" className="mb-2 text-sm font-semibold text-foreground">
            Trace a request
          </h3>
          <Card className="border-border-default bg-surface-01">
            <ol className="divide-y divide-border-subtle p-1">
              {flowSteps.map((step, index) => (
                <li key={step.step}>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={index === activeStep}
                    className="h-auto min-h-11 w-full items-start justify-start gap-2.5 whitespace-normal border border-transparent px-2 py-2 text-left hover:bg-surface-03 aria-pressed:border-border-strong aria-pressed:bg-surface-04 aria-pressed:shadow-level-3"
                    onClick={() => {
                      setPlaying(false);
                      setActiveStep(activeStep === index ? null : index);
                    }}
                  >
                    <span className="shrink-0 self-start font-mono text-[11px] tabular-nums text-text-muted">
                      {String(step.step).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5 break-words">
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-semibold">
                        <span className="min-w-0">{step.from}</span>
                        <ChevronRightIcon className="size-3 shrink-0 text-text-muted" />
                        <span className="min-w-0">{step.to}</span>
                      </span>
                      <span className="block font-normal leading-relaxed text-text-secondary">
                        {step.description}
                      </span>
                      <span className="block font-mono text-[10px] text-text-muted">
                        {step.protocol}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      )}
    </div>
  );
}
