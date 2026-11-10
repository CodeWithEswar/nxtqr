import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  TutorialShell,
  tutorialRegistry,
  ComponentPreview,
  PropertiesExplorer,
  OpenInVisualizerButton,
} from "@/features/system-design-tutorials";
import { getExamplesForComponent } from "@/features/system-design-tutorials";
import { getInfrastructureIcon, CpuIcon, CheckCircleIcon, CloseIcon, ChevronRightIcon, ActivityIcon } from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { CURRENT_GRAPH_SCHEMA_VERSION, type GraphDocument } from "@nxtqr/graph-schema";

interface ComponentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const allComponents = tutorialRegistry.getAllComponentTutorials();
  return allComponents.map((c) => ({
    slug: c.id,
  }));
}

export default async function ComponentDetailPage({ params }: ComponentPageProps) {
  const { slug } = await params;
  const comp = tutorialRegistry.getComponentTutorial(slug);

  if (!comp) {
    notFound();
  }

  const IconComponent = getInfrastructureIcon(comp.iconSlug) || CpuIcon;
  const examples = getExamplesForComponent(comp.id);

  // Table of Contents navigation items
  const tocItems = [
    { id: "overview", label: "Overview & Problem" },
    { id: "live-preview", label: "Live Topology Preview" },
    { id: "how-it-works", label: "Internal Mechanics" },
    { id: "when-to-use", label: "When to Use / Avoid" },
    { id: "properties", label: "Properties Explorer" },
    { id: "connections", label: "Ports & Connections" },
    { id: "tradeoffs", label: "Trade-offs & Resilience" },
    ...(examples.length > 0 ? [{ id: "examples", label: "Architecture Blueprints" }] : []),
  ];

  const isolatedDoc: GraphDocument = {
    id: `doc_component_${comp.id}`,
    schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
    visualizerType: "generic",
    title: `${comp.name} Isolated Template`,
    nodes: comp.previewNodes.connected,
    edges: comp.previewEdges.connected,
    viewport: { x: 0, y: 0, zoom: 1.0 },
    metadata: { componentId: comp.id },
  };

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: comp.categoryName, href: `/tutorial/system-design/categories/${comp.categoryId}` },
        { label: comp.name },
      ]}
      tocItems={tocItems}
      relatedComponentIds={comp.relatedComponentIds}
    >
      <div className="space-y-12 pb-20">
        {/* Component Header */}
        <div className="space-y-4 border-b border-border-default pb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-surface-02 border border-border-default flex items-center justify-center text-text-secondary shrink-0 shadow-level-1">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-sans font-bold text-foreground">
                    {comp.name}
                  </h1>
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 border-border-default text-text-muted">
                    {comp.shortName}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Link
                    href={`/tutorial/system-design/categories/${comp.categoryId}`}
                    className="font-mono text-xs text-text-muted hover:text-text-secondary hover:underline"
                  >
                    {comp.categoryName}
                  </Link>
                  <span className="text-text-disabled">•</span>
                  <span className="font-sans text-xs text-text-disabled">
                    {comp.classification}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <OpenInVisualizerButton
                document={isolatedDoc}
                templateSlug={comp.id}
                size="sm"
                label="Open in Visualizer"
              />
            </div>
          </div>

          <p className="text-sm font-sans text-text-secondary leading-relaxed max-w-3xl pt-2">
            {comp.tagline}
          </p>
        </div>

        {/* 1. Overview & Problem Solved */}
        <section id="overview" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Overview & Engineering Problem
            </h2>
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Architectural Context
            </div>
          </div>

          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3 font-sans text-sm text-text-secondary leading-relaxed">
            <p>{comp.overview}</p>
            <div className="pt-2 border-t border-border-subtle">
              <div className="font-mono text-xs font-semibold text-foreground mb-1">
                Core Problem Solved:
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {comp.problemSolved}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Live Topology Preview */}
        <section id="live-preview" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Interactive Topology Preview
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Switch between isolated card inspection, connected ingress/egress, and full architectural context.
            </p>
          </div>

          <ComponentPreview
            componentId={comp.id}
            componentName={comp.name}
            previewNodes={comp.previewNodes}
            previewEdges={comp.previewEdges}
          />
        </section>

        {/* 3. Internal Mechanics & Sequence */}
        <section id="how-it-works" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              How It Works: Internal Mechanics
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Sequential flow of requests and state transitions through {comp.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {comp.howItWorks.steps.map((st) => (
              <div
                key={st.step}
                className="p-3.5 rounded-md bg-surface-01 border border-border-default space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-surface-02 font-mono text-[10px] font-bold text-foreground flex items-center justify-center">
                      {st.step}
                    </span>
                    <span className="font-sans text-xs font-semibold text-foreground">
                      {st.title}
                    </span>
                  </div>
                  {st.latency && (
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4 border-border-default text-text-muted">
                      {st.latency}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-sans text-text-muted leading-relaxed pl-7">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. When to Use & When to Avoid */}
        <section id="when-to-use" className="space-y-4">
          <h2 className="text-xl font-sans font-bold text-foreground">
            Usage Guidelines & Anti-Patterns
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* When to Use */}
            <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground border-b border-border-subtle pb-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>When to Use</span>
              </div>
              <ul className="space-y-2">
                {comp.whenToUse.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-sans text-text-muted leading-relaxed">
                    <span className="text-emerald-400 text-sm leading-none shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* When to Avoid */}
            <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground border-b border-border-subtle pb-2">
                <CloseIcon className="w-4 h-4 text-text-muted" />
                <span>When to Avoid</span>
              </div>
              <ul className="space-y-2">
                {comp.whenToAvoid.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-sans text-text-muted leading-relaxed">
                    <span className="text-text-disabled text-sm leading-none shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Live Properties Explorer */}
        <section id="properties" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Properties & Runtime Configuration
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Interact directly with the authoritative Zod configuration schema for {comp.name}.
            </p>
          </div>

          <PropertiesExplorer componentId={comp.id} />
        </section>

        {/* 6. Ports & Connections */}
        <section id="connections" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Ports & Connection Semantics
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Standardized graph handles that define valid topological relationships.
            </p>
          </div>

          <div className="overflow-x-auto rounded-md border border-border-default">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-surface-02 font-mono text-[10px] uppercase text-text-muted border-b border-border-default">
                <tr>
                  <th className="py-2.5 px-3">Port ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Data Type</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-01">
                {comp.ports.map((port) => (
                  <tr key={port.id} className="hover:bg-surface-02 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-text-secondary">{port.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">{port.name}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 border-border-default text-text-muted">
                        {port.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-text-muted">{port.dataType || "Any"}</td>
                    <td className="py-2.5 px-3 text-text-muted">{port.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Engineering Trade-offs & Failure Modes */}
        <section id="tradeoffs" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Engineering Trade-offs & Failure Modes
            </h2>
            <p className="text-xs text-text-muted font-sans">
              Balancing architectural constraints and preparing mitigations for production incidents.
            </p>
          </div>

          {/* Trade-offs */}
          {comp.tradeoffs.length > 0 && (
            <div className="space-y-3">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Architectural Trade-offs
              </div>
              <div className="space-y-3">
                {comp.tradeoffs.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-bold text-foreground">
                        {t.dimension}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
                        <span>{t.choiceA}</span>
                        <span className="text-text-disabled">vs</span>
                        <span>{t.choiceB}</span>
                      </div>
                    </div>
                    <p className="text-xs font-sans text-text-muted leading-relaxed">
                      {t.analysis}
                    </p>
                    <div className="p-2 rounded bg-surface-02 border border-border-subtle font-sans text-[11px] text-text-secondary">
                      <strong className="font-mono text-text-muted">Recommendation: </strong>
                      {t.recommendedContext}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failure Modes */}
          {comp.failureModes.length > 0 && (
            <div className="space-y-3">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Failure Modes & Mitigations
              </div>
              <div className="space-y-3">
                {comp.failureModes.map((fm, idx) => (
                  <div key={idx} className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-bold text-foreground flex items-center gap-2">
                        <ActivityIcon className="w-3.5 h-3.5 text-text-muted" />
                        <span>{fm.name}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                      <div className="p-2.5 rounded bg-surface-02 border border-border-subtle space-y-1">
                        <span className="font-mono text-[10px] uppercase text-text-disabled font-semibold">
                          Trigger & Impact
                        </span>
                        <p className="text-text-muted leading-snug">
                          <strong>Trigger:</strong> {fm.trigger}
                        </p>
                        <p className="text-text-muted leading-snug">
                          <strong>Impact:</strong> {fm.impact}
                        </p>
                      </div>
                      <div className="p-2.5 rounded bg-surface-02 border border-border-subtle space-y-1">
                        <span className="font-mono text-[10px] uppercase text-text-disabled font-semibold">
                          Mitigation Strategy
                        </span>
                        <p className="text-text-secondary leading-snug">
                          {fm.mitigation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 8. Architecture Blueprints */}
        {examples.length > 0 && (
          <section id="examples" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-sans font-bold text-foreground">
                Production Architecture Blueprints
              </h2>
              <p className="text-xs text-text-muted font-sans">
                Real-world distributed systems that deploy {comp.name} in mission-critical environments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-md bg-surface-01 border border-border-default hover:border-border-hover transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[9px] border-border-default text-text-muted">
                        {ex.category}
                      </Badge>
                      <span className="font-mono text-[10px] text-text-disabled">
                        {ex.difficulty}
                      </span>
                    </div>
                    <Link
                      href={`/tutorial/system-design/examples/${ex.slug}`}
                      className="block font-sans text-sm font-semibold text-foreground hover:underline"
                    >
                      {ex.title}
                    </Link>
                    <p className="text-xs font-sans text-text-muted line-clamp-2">
                      {ex.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                    <span className="font-mono text-[10px] text-text-disabled">
                      {ex.graphDocument.nodes.length} nodes in topology
                    </span>
                    <Link href={`/tutorial/system-design/examples/${ex.slug}`}>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] font-mono border-border-default gap-1">
                        <span>Inspect Architecture</span>
                        <ChevronRightIcon className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </TutorialShell>
  );
}
