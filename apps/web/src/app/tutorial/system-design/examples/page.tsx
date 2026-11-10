import * as React from "react";
import Link from "next/link";
import { TutorialShell, getAllExamples, OpenInVisualizerButton } from "@/features/system-design-tutorials";
import { ChevronRightIcon, LayersIcon } from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";

export default function ExamplesIndexPage() {
  const examples = getAllExamples();

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: "Architecture Blueprints" },
      ]}
      hideToc={true}
    >
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="space-y-3 border-b border-border-default pb-6">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
            <LayersIcon className="w-4 h-4" />
            <span>Production Blueprints</span>
          </div>
          <h1 className="text-3xl font-sans font-bold text-foreground">
            Real-World Architecture Blueprints
          </h1>
          <p className="text-sm font-sans text-text-secondary max-w-3xl leading-relaxed">
            12 battle-tested distributed system designs. Each blueprint includes verified throughput calculations, step-by-step request flow sequences, key architectural trade-offs, and an interactive graph that can be launched directly in the NXTQR Visualizer.
          </p>
        </div>

        {/* Blueprint Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examples.map((ex) => (
            <div
              key={ex.id}
              className="p-5 rounded-md bg-surface-01 border border-border-default hover:border-border-hover transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[9px] border-border-default text-text-muted">
                    {ex.category}
                  </Badge>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      ex.difficulty === "Beginner"
                        ? "bg-surface-02 border-border-default text-text-secondary"
                        : ex.difficulty === "Intermediate"
                        ? "bg-surface-02 border-border-default text-text-secondary"
                        : "bg-surface-03 border-border-hover text-foreground font-semibold"
                    }`}
                  >
                    {ex.difficulty}
                  </span>
                </div>

                <div>
                  <Link
                    href={`/tutorial/system-design/examples/${ex.slug}`}
                    className="block font-sans text-base font-bold text-foreground hover:underline"
                  >
                    {ex.title}
                  </Link>
                  <p className="font-sans text-xs text-text-muted mt-1 leading-snug">
                    {ex.subtitle}
                  </p>
                </div>

                <p className="text-xs font-sans text-text-secondary line-clamp-3 leading-relaxed">
                  {ex.summary}
                </p>

                {/* Scale Specs Badges */}
                {ex.scale.requestsPerSec && (
                  <div className="p-2.5 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] text-text-secondary space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-text-disabled">Scale:</span>
                      <span className="text-foreground">{ex.scale.requestsPerSec}</span>
                    </div>
                    {ex.scale.latencyTarget && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-disabled">Target Latency:</span>
                        <span className="text-foreground">{ex.scale.latencyTarget}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="font-mono text-[10px] text-text-disabled">
                  {ex.graphDocument.nodes.length} nodes • {ex.graphDocument.edges.length} edges
                </span>

                <div className="flex items-center gap-2">
                  <OpenInVisualizerButton
                    document={ex.graphDocument}
                    templateSlug={ex.slug}
                    size="sm"
                    label="Visualizer"
                    className="h-7 text-xs"
                  />
                  <Link href={`/tutorial/system-design/examples/${ex.slug}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs font-mono border-border-default gap-1">
                      <span>Deep Dive</span>
                      <ChevronRightIcon className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TutorialShell>
  );
}
