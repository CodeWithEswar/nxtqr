import { TutorialComponentIcon } from "@/features/system-design-tutorials/components/tutorial-component-icon";
import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  TutorialShell,
  getAllExamples,
  getExampleBySlug,
  ArchitectureDiagramView,
  OpenInVisualizerButton,
  tutorialRegistry,
} from "@/features/system-design-tutorials";
import { Badge } from "@nxtqr/ui";
import { ChevronRightIcon, CheckCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface ExamplePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const examples = getAllExamples();
  return examples.map((e) => ({
    slug: e.slug,
  }));
}

export default async function ExampleDetailPage({ params }: ExamplePageProps) {
  const { slug } = await params;
  const example = getExampleBySlug(slug);

  if (!example) {
    notFound();
  }

  const tocItems = [
    { id: "diagram", label: "Interactive Diagram" },
    { id: "requirements", label: "System Requirements" },
    { id: "request-flow", label: "Request Flow Sequence" },
    { id: "decisions", label: "Key Architectural Decisions" },
    { id: "tradeoffs", label: "Trade-offs Analysis" },
    { id: "components", label: "Component Breakdown" },
  ];

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: "Architectures", href: "/tutorial/system-design/examples" },
        { label: example.title.split(" (")[0] },
      ]}
      tocItems={tocItems}
    >
      <div className="space-y-12 pb-20">
        {/* Header */}
        <div className="space-y-4 border-b border-border-default pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[9px] border-border-default text-text-muted">
                  {example.category}
                </Badge>
                <Badge variant="outline" className="font-mono text-[9px] border-border-hover bg-surface-03 text-foreground font-semibold">
                  {example.difficulty}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-sans font-bold text-foreground">
                {example.title}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
                {example.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <OpenInVisualizerButton
                document={example.graphDocument}
                templateSlug={example.slug}
                size="default"
                label="Open in Visualizer"
              />
            </div>
          </div>

          {/* Scale telemetry pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 font-mono text-[11px]">
            {example.scale.requestsPerSec && (
              <div className="p-2.5 rounded bg-surface-01 border border-border-default">
                <span className="text-text-disabled block text-[9px] uppercase">Throughput</span>
                <span className="text-foreground font-semibold">{example.scale.requestsPerSec}</span>
              </div>
            )}
            {example.scale.storagePerDay && (
              <div className="p-2.5 rounded bg-surface-01 border border-border-default">
                <span className="text-text-disabled block text-[9px] uppercase">Storage Growth</span>
                <span className="text-foreground font-semibold">{example.scale.storagePerDay}</span>
              </div>
            )}
            {example.scale.latencyTarget && (
              <div className="p-2.5 rounded bg-surface-01 border border-border-default">
                <span className="text-text-disabled block text-[9px] uppercase">Target Latency</span>
                <span className="text-foreground font-semibold">{example.scale.latencyTarget}</span>
              </div>
            )}
            {example.scale.availabilityTarget && (
              <div className="p-2.5 rounded bg-surface-01 border border-border-default">
                <span className="text-text-disabled block text-[9px] uppercase">Availability SLA</span>
                <span className="text-foreground font-semibold">{example.scale.availabilityTarget}</span>
              </div>
            )}
          </div>
        </div>

        {/* 1. Interactive Diagram View */}
        <section id="diagram" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Architecture canvas
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Inspect all components, zoom and pan, or select any request step below to highlight the active path trace.
            </p>
          </div>

          <ArchitectureDiagramView example={example} />
        </section>

        {/* 2. System Requirements */}
        <section id="requirements" className="space-y-4">
          <h2 className="text-xl font-sans font-bold text-foreground">
            System Design Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border-subtle pb-2">
                Functional Requirements
              </div>
              <ul className="space-y-2">
                {example.requirements.functional.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-sans text-text-secondary leading-relaxed">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground border-b border-border-subtle pb-2">
                Non-Functional Requirements
              </div>
              <ul className="space-y-2">
                {example.requirements.nonFunctional.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-sans text-text-secondary leading-relaxed">
                    <ShieldIcon className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Key Architectural Decisions */}
        <section id="decisions" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Key Engineering Decisions
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Deliberate choices between competing designs and rejected alternatives.
            </p>
          </div>

          <div className="space-y-3">
            {example.keyDecisions.map((dec, idx) => (
              <div key={idx} className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-bold text-foreground">
                    {dec.topic}
                  </span>
                  <Badge variant="outline" className="font-mono text-[9px] border-border-hover bg-surface-02 text-foreground">
                    Decision: {dec.decision}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-sans">
                  <div className="p-2.5 rounded bg-surface-02 border border-border-subtle space-y-1">
                    <span className="font-mono text-[10px] text-text-disabled uppercase font-semibold">
                      Why this was chosen:
                    </span>
                    <p className="text-text-secondary leading-snug">{dec.why}</p>
                  </div>
                  <div className="p-2.5 rounded bg-surface-02 border border-border-subtle space-y-1">
                    <span className="font-mono text-[10px] text-text-disabled uppercase font-semibold">
                      Alternative Rejected:
                    </span>
                    <p className="text-text-muted leading-snug">{dec.alternativeRejected}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Trade-offs Analysis */}
        <section id="tradeoffs" className="space-y-4">
          <h2 className="text-xl font-sans font-bold text-foreground">
            Architectural Trade-offs
          </h2>
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
            <ul className="space-y-2 text-xs font-sans text-text-secondary list-disc pl-5 leading-relaxed">
              {example.tradeoffs.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Component Breakdown Table */}
        <section id="components" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Featured Infrastructure Components
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Core components powering this topology. Click any component to inspect its dedicated reference guide.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {example.featuredComponentIds.map((cId) => {
              const comp = tutorialRegistry.getComponentTutorial(cId);
              if (!comp) return null;


              return (
                <Link
                  key={comp.id}
                  href={`/tutorial/system-design/components/${comp.id}`}
                  className="p-3 rounded-md bg-surface-01 border border-border-default hover:border-border-hover hover:bg-surface-02 transition-colors flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded bg-surface-02 border border-border-default flex items-center justify-center shrink-0 text-text-secondary group-hover:text-foreground">
                    <TutorialComponentIcon slug={comp.iconSlug} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-xs font-semibold text-foreground group-hover:underline truncate">
                      {comp.name}
                    </div>
                    <div className="font-mono text-[9px] text-text-disabled truncate">
                      {comp.categoryName}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-text-disabled group-hover:text-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </TutorialShell>
  );
}
