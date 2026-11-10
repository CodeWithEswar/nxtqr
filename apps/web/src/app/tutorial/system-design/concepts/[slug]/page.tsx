import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  TutorialShell,
  getAllConcepts,
  getConceptBySlug,
  tutorialRegistry,
  getExampleBySlug,
} from "@/features/system-design-tutorials";
import { Badge } from "@nxtqr/ui";
import { ChevronRightIcon, LayersIcon, getInfrastructureIcon, CpuIcon } from "@nxtqr/icons";

interface ConceptPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const concepts = getAllConcepts();
  return concepts.map((c) => ({
    slug: c.slug,
  }));
}

export default async function ConceptDetailPage({ params }: ConceptPageProps) {
  const { slug } = await params;
  const concept = getConceptBySlug(slug);

  if (!concept) {
    notFound();
  }

  const tocItems = [
    { id: "summary", label: "Executive Summary" },
    ...concept.sections.map((s, idx) => ({
      id: `section-${idx}`,
      label: s.title,
    })),
    { id: "related-infra", label: "Related Infrastructure" },
  ];

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: "Core Concepts" },
        { label: concept.title.split(" &")[0] },
      ]}
      tocItems={tocItems}
    >
      <div className="space-y-10 pb-16">
        {/* Header */}
        <div className="space-y-4 border-b border-border-default pb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted flex items-center gap-1.5">
              <LayersIcon className="w-3.5 h-3.5" />
              <span>Core Architectural Concept</span>
            </span>
            <span className="text-text-disabled">•</span>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 border-border-default text-text-muted">
              {concept.readTime}
            </Badge>
          </div>

          <h1 className="text-3xl font-sans font-bold text-foreground">
            {concept.title}
          </h1>

          <p className="text-sm font-sans text-text-secondary max-w-3xl leading-relaxed">
            {concept.subtitle}
          </p>
        </div>

        {/* Executive Summary */}
        <section id="summary" className="space-y-3">
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Executive Summary
            </div>
            <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
              {concept.summary}
            </p>
          </div>
        </section>

        {/* Concept Sections */}
        {concept.sections.map((section, idx) => (
          <section key={idx} id={`section-${idx}`} className="space-y-3">
            <h2 className="text-xl font-sans font-bold text-foreground">
              {section.title}
            </h2>
            <p className="text-xs sm:text-sm font-sans text-text-secondary leading-relaxed">
              {section.content}
            </p>

            {section.codeOrFormula && (
              <div className="p-3 rounded-md bg-surface-02 border border-border-default font-mono text-xs text-text-secondary overflow-x-auto">
                <code>{section.codeOrFormula}</code>
              </div>
            )}
          </section>
        ))}

        {/* Related Infrastructure & Blueprints */}
        <section id="related-infra" className="space-y-6 pt-6 border-t border-border-default">
          <div className="space-y-3">
            <h3 className="text-base font-sans font-semibold text-foreground">
              Implementing Infrastructure Components
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concept.relatedComponentIds.map((cId) => {
                const comp = tutorialRegistry.getComponentTutorial(cId);
                if (!comp) return null;
                const IconComponent = getInfrastructureIcon(comp.iconSlug) || CpuIcon;

                return (
                  <Link
                    key={comp.id}
                    href={`/tutorial/system-design/components/${comp.id}`}
                    className="p-3 rounded-md bg-surface-01 border border-border-default hover:border-border-hover hover:bg-surface-02 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded bg-surface-02 border border-border-default flex items-center justify-center shrink-0 text-text-secondary group-hover:text-foreground">
                      <IconComponent className="w-4 h-4" />
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
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-sans font-semibold text-foreground">
              Related Architecture Blueprints
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concept.relatedExampleIds.map((exSlug) => {
                const ex = getExampleBySlug(exSlug);
                if (!ex) return null;

                return (
                  <Link
                    key={ex.id}
                    href={`/tutorial/system-design/examples/${ex.slug}`}
                    className="p-3.5 rounded-md bg-surface-01 border border-border-default hover:border-border-hover hover:bg-surface-02 transition-colors flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 border-border-default text-text-muted">
                          {ex.category}
                        </Badge>
                        <span className="font-mono text-[9px] text-text-disabled">{ex.difficulty}</span>
                      </div>
                      <div className="font-sans text-xs font-semibold text-foreground group-hover:underline">
                        {ex.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[10px] text-text-disabled pt-1">
                      <span>Explore blueprint</span>
                      <ChevronRightIcon className="w-3 h-3 text-text-disabled group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </TutorialShell>
  );
}
