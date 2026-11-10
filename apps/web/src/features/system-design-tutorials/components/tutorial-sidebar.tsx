"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tutorialRegistry } from "../lib/tutorial-registry";
import { getAllExamples } from "../lib/examples-registry";
import { getAllConcepts } from "../lib/concepts-registry";
import { ChevronDownIcon, ChevronRightIcon, LayersIcon, BookOpenIcon, CpuIcon } from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";

export interface TutorialSidebarProps {
  onItemClick?: () => void;
  className?: string;
}

export function TutorialSidebar({ onItemClick, className = "" }: TutorialSidebarProps) {
  const pathname = usePathname();
  const categoryGroups = React.useMemo(() => tutorialRegistry.getAllCategoriesWithCounts(), []);
  const examples = React.useMemo(() => getAllExamples(), []);
  const concepts = React.useMemo(() => getAllConcepts(), []);

  // Track expanded category accordions in the sidebar
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>(() => {
    // If on a component page, expand its parent category by default
    const match = pathname.match(/\/components\/([^\/]+)/);
    if (match) {
      const comp = tutorialRegistry.getComponentTutorial(match[1]);
      if (comp) {
        return { [comp.categoryId]: true };
      }
    }
    return {};
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const isLinkActive = (href: string) => pathname === href;

  return (
    <aside
      className={`h-full w-full flex flex-col bg-surface-01 border-r border-border-default select-none text-foreground overflow-y-auto ${className}`}
    >
      <div className="p-3 space-y-5">
        {/* Section 1: Overview & Getting Started */}
        <div>
          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
            Overview
          </div>
          <div className="mt-1 space-y-0.5">
            <Link
              href="/tutorial/system-design"
              onClick={onItemClick}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-sans transition-colors ${
                isLinkActive("/tutorial/system-design")
                  ? "bg-surface-03 text-foreground font-semibold border border-border-hover"
                  : "text-text-secondary hover:text-foreground hover:bg-surface-02"
              }`}
            >
              <BookOpenIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>System Design Hub</span>
            </Link>

            <Link
              href="/tutorial/system-design/getting-started"
              onClick={onItemClick}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-sans transition-colors ${
                isLinkActive("/tutorial/system-design/getting-started")
                  ? "bg-surface-03 text-foreground font-semibold border border-border-hover"
                  : "text-text-secondary hover:text-foreground hover:bg-surface-02"
              }`}
            >
              <LayersIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span>Getting Started</span>
            </Link>

            <Link
              href="/tutorial/system-design/components"
              onClick={onItemClick}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-sans transition-colors ${
                isLinkActive("/tutorial/system-design/components")
                  ? "bg-surface-03 text-foreground font-semibold border border-border-hover"
                  : "text-text-secondary hover:text-foreground hover:bg-surface-02"
              }`}
            >
              <div className="flex items-center gap-2">
                <CpuIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>All Components</span>
              </div>
              <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4 border-border-default text-text-muted">
                223
              </Badge>
            </Link>
          </div>
        </div>

        {/* Section 2: 20 Infrastructure Categories */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
              Categories (20)
            </span>
            <span className="font-mono text-[9px] text-text-disabled">223 Nodes</span>
          </div>

          <div className="mt-1 space-y-0.5">
            {categoryGroups.map((group) => {
              const isExpanded = Boolean(expandedCategories[group.category.id]);
              const isCatPage = pathname === `/tutorial/system-design/categories/${group.category.id}`;

              return (
                <div key={group.category.id} className="space-y-0.5">
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-sans cursor-pointer transition-colors ${
                      isCatPage
                        ? "bg-surface-03 text-foreground font-semibold border border-border-hover"
                        : "text-text-secondary hover:text-foreground hover:bg-surface-02"
                    }`}
                  >
                    <Link
                      href={`/tutorial/system-design/categories/${group.category.id}`}
                      onClick={onItemClick}
                      className="flex-1 truncate mr-1"
                    >
                      {group.category.name}
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[10px] text-text-disabled">
                        {group.count}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(group.category.id);
                        }}
                        className="p-0.5 hover:text-foreground text-text-muted"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="w-3 h-3" />
                        ) : (
                          <ChevronRightIcon className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Components in Category */}
                  {isExpanded && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-border-subtle ml-2">
                      {group.components.map((comp) => {
                        const isCompActive = pathname === `/tutorial/system-design/components/${comp.id}`;

                        return (
                          <Link
                            key={comp.id}
                            href={`/tutorial/system-design/components/${comp.id}`}
                            onClick={onItemClick}
                            className={`block px-2 py-1 rounded text-[11px] font-sans truncate transition-colors ${
                              isCompActive
                                ? "bg-surface-04 text-foreground font-medium border border-border-hover"
                                : "text-text-muted hover:text-text-secondary hover:bg-surface-02"
                            }`}
                          >
                            {comp.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Real-World Architecture Examples */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
              Architectures
            </span>
            <Link
              href="/tutorial/system-design/examples"
              className="font-mono text-[9px] text-text-muted hover:text-foreground"
            >
              View All ({examples.length})
            </Link>
          </div>

          <div className="mt-1 space-y-0.5">
            {examples.map((ex) => {
              const isExActive = pathname === `/tutorial/system-design/examples/${ex.slug}`;

              return (
                <Link
                  key={ex.id}
                  href={`/tutorial/system-design/examples/${ex.slug}`}
                  onClick={onItemClick}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-sans transition-colors ${
                    isExActive
                      ? "bg-surface-03 text-foreground font-semibold border border-border-hover"
                      : "text-text-secondary hover:text-foreground hover:bg-surface-02"
                  }`}
                >
                  <span className="truncate mr-1">{ex.title.split(" (")[0]}</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[8px] px-1 py-0 h-3.5 border-border-default text-text-disabled shrink-0"
                  >
                    {ex.difficulty[0]}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Section 4: Architectural Concepts */}
        <div>
          <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
            Core Concepts
          </div>
          <div className="mt-1 space-y-0.5">
            {concepts.map((c) => {
              const isConceptActive = pathname === `/tutorial/system-design/concepts/${c.slug}`;

              return (
                <Link
                  key={c.id}
                  href={`/tutorial/system-design/concepts/${c.slug}`}
                  onClick={onItemClick}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-sans transition-colors ${
                    isConceptActive
                      ? "bg-surface-03 text-foreground font-semibold border border-border-hover"
                      : "text-text-secondary hover:text-foreground hover:bg-surface-02"
                  }`}
                >
                  <LayersIcon className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="truncate">{c.title.split(" &")[0]}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
