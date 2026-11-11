import { TutorialComponentIcon } from "@/features/system-design-tutorials/components/tutorial-component-icon";
import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TutorialShell, tutorialRegistry } from "@/features/system-design-tutorials";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import { ChevronRightIcon } from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = infrastructureRegistry.listCategories();
  return categories.map((c) => ({
    slug: c.id,
  }));
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = infrastructureRegistry.getCategory(slug);

  if (!category) {
    notFound();
  }

  const components = tutorialRegistry.getTutorialsByCategory(category.id);
  const allCategories = infrastructureRegistry.listCategories();
  const currentIndex = allCategories.findIndex((c) => c.id === category.id);
  const prevCat = currentIndex > 0 ? allCategories[currentIndex - 1] : null;
  const nextCat = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null;

  const tocItems = [
    { id: "overview", label: "Category Overview" },
    { id: "components-grid", label: `Components (${components.length})` },
    { id: "patterns", label: "Architectural Patterns" },
  ];

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: "Categories" },
        { label: category.name },
      ]}
      tocItems={tocItems}
    >
      <div className="space-y-10 pb-16">
        {/* Header */}
        <div className="space-y-4 border-b border-border-default pb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-disabled">
              Category {category.order < 10 ? `0${category.order}` : category.order} of {allCategories.length}
            </span>
            <span className="text-text-disabled">•</span>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 border-border-default text-text-muted">
              {components.length} Typed Nodes
            </Badge>
          </div>

          <h1 className="text-3xl font-sans font-bold text-foreground">
            {category.name}
          </h1>

          <p className="text-sm font-sans text-text-secondary max-w-3xl leading-relaxed">
            {category.description}
          </p>
        </div>

        {/* Section 1: Overview */}
        <section id="overview" className="space-y-3">
          <h2 className="text-xl font-sans font-bold text-foreground">
            Role in Distributed Systems
          </h2>
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2 text-sm font-sans text-text-secondary leading-relaxed">
            <p>
              In production engineering architectures, components in the <strong>{category.name}</strong> category isolate specific operational responsibilities. They provide standard interfaces, health evaluations, and failover boundaries that allow services to scale horizontally without systemic bottlenecks.
            </p>
            <p className="text-xs text-text-muted">
              Every component below has a defined Zod configuration schema, typed input/output handles, and can be wired into visual graphs inside the NXTQR System Design Visualizer.
            </p>
          </div>
        </section>

        {/* Section 2: Components Grid */}
        <section id="components-grid" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-sans font-bold text-foreground">
              Components in this Category ({components.length})
            </h2>
            <span className="font-mono text-xs text-text-disabled">
              Select any component to inspect its architecture
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {components.map((comp) => {


              return (
                <Link
                  key={comp.id}
                  href={`/tutorial/system-design/components/${comp.id}`}
                  className="p-4 rounded-md bg-surface-01 border border-border-default hover:border-border-hover hover:bg-surface-02 transition-colors flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="size-14 sm:size-16 rounded-md bg-surface-02 border border-border-default group-hover:border-border-strong group-hover:bg-surface-03 transition-all flex items-center justify-center shrink-0 shadow-level-1 p-2">
                        <TutorialComponentIcon
                          slug={comp.iconSlug}
                          size={42}
                          className="transition-transform duration-150 group-hover:scale-105"
                        />
                      </div>
                      <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0.5 border-border-default text-text-muted shrink-0">
                        {comp.shortName}
                      </Badge>
                    </div>

                    <div>
                      <div className="font-sans text-sm font-semibold text-foreground group-hover:underline">
                        {comp.name}
                      </div>
                      <div className="font-mono text-[10px] text-text-disabled">
                        {comp.id}
                      </div>
                    </div>

                    <p className="text-xs font-sans text-text-muted line-clamp-2 leading-relaxed">
                      {comp.tagline}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle font-mono text-[10px] text-text-disabled">
                    <span>
                      {comp.ports.length} ports • {comp.tradeoffs.length} trade-offs
                    </span>
                    <span className="text-text-muted group-hover:text-foreground flex items-center gap-1">
                      <span>Guide</span>
                      <ChevronRightIcon className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Section 3: Common Patterns */}
        <section id="patterns" className="space-y-3">
          <h2 className="text-xl font-sans font-bold text-foreground">
            Architectural Synergy & Integration
          </h2>
          <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-2 text-xs font-sans text-text-muted leading-relaxed">
            <p>
              When designing topologies with {category.name} components, always consider upstream ingress boundaries, protocol serialization costs, and downscale graceful degradation.
            </p>
            <p>
              Combine these components with resilience controllers (Circuit Breakers, Rate Limiters, Retry Controllers) to prevent localized incidents from cascading across your entire application fleet.
            </p>
          </div>
        </section>

        {/* Next / Prev Navigation Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-border-default font-sans text-xs">
          {prevCat ? (
            <Link
              href={`/tutorial/system-design/categories/${prevCat.id}`}
              className="flex items-center gap-1.5 text-text-secondary hover:text-foreground"
            >
              <span>← Cat {prevCat.order}: {prevCat.name}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextCat && (
            <Link
              href={`/tutorial/system-design/categories/${nextCat.id}`}
              className="flex items-center gap-1.5 text-text-secondary hover:text-foreground ml-auto"
            >
              <span>Cat {nextCat.order}: {nextCat.name} →</span>
            </Link>
          )}
        </div>
      </div>
    </TutorialShell>
  );
}
