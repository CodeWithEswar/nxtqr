"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@nxtqr/ui";
import { ChevronRightIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import type { ArchitectureExample } from "../schemas/tutorial.schema";

const TutorialCanvas = dynamic(
  () => import("./tutorial-canvas").then((module) => module.TutorialCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="grid h-[clamp(17rem,46vh,30rem)] place-items-center bg-black text-xs text-text-muted"
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
  const { nodes, edges } = example.graphDocument;
  const { flowSteps } = example;

  React.useEffect(() => {
    if (!playing || activeStep === null) return;
    const timer = window.setTimeout(() => {
      if (activeStep + 1 < flowSteps.length) setActiveStep(activeStep + 1);
      else setPlaying(false);
    }, 1450);
    return () => window.clearTimeout(timer);
  }, [activeStep, flowSteps.length, playing]);

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      <div className="overflow-hidden rounded-md border border-border-default bg-surface-01">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default px-3 py-2">
          <p className="font-mono text-[11px] tabular-nums text-text-muted">
            {nodes.length} nodes · {edges.length} connections
          </p>
          {flowSteps.length > 0 && (
            <div className="flex items-center gap-2">
              {activeStep !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    setPlaying(false);
                    setActiveStep(null);
                  }}
                >
                  Clear trace
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  if (playing) setPlaying(false);
                  else {
                    setActiveStep(0);
                    setPlaying(true);
                  }
                }}
              >
                {playing ? "Pause flow" : "Play flow"}
              </Button>
            </div>
          )}
        </div>
        <TutorialCanvas
          label={`${example.title} diagram`}
          nodes={nodes}
          edges={edges}
          activeEdgeIds={activeStep === null ? undefined : flowSteps[activeStep]?.edgeIds}
        />
      </div>

      {flowSteps.length > 0 && (
        <section id="request-flow" aria-label="Trace a request">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Trace a request</h3>
          <ol className="divide-y divide-border-subtle rounded-md border border-border-default bg-surface-01 p-1">
            {flowSteps.map((step, index) => (
              <li key={step.step}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-pressed={index === activeStep}
                  className="h-auto min-h-11 w-full justify-start gap-3 whitespace-normal border border-transparent px-2 py-2 text-left hover:bg-surface-03 aria-pressed:border-border-strong aria-pressed:bg-surface-04"
                  onClick={() => {
                    setPlaying(false);
                    setActiveStep(activeStep === index ? null : index);
                  }}
                >
                  <span className="shrink-0 self-start font-mono text-[11px] tabular-nums text-text-muted">
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-semibold">
                      {step.from}
                      <ChevronRightIcon className="size-3 shrink-0 text-text-muted" />
                      {step.to}
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
        </section>
      )}
    </div>
  );
}
