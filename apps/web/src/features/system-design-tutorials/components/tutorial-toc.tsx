"use client";

import * as React from "react";
import Link from "next/link";
import { getInfrastructureIcon, CpuIcon } from "@nxtqr/icons";
import { tutorialRegistry } from "../lib/tutorial-registry";

export interface TocItem {
  id: string;
  label: string;
}

export interface TutorialTocProps {
  items: TocItem[];
  relatedComponentIds?: string[];
  className?: string;
}

export function TutorialToc({ items, relatedComponentIds = [], className = "" }: TutorialTocProps) {
  const [activeId, setActiveId] = React.useState<string>(items[0]?.id || "");

  // IntersectionObserver for active section highlight
  React.useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-20% 0% -60% 0%",
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
    }
  };

  const relatedComponents = React.useMemo(() => {
    return relatedComponentIds
      .map((id) => tutorialRegistry.getComponentTutorial(id))
      .filter(Boolean);
  }, [relatedComponentIds]);

  return (
    <div className={`h-full w-full p-4 space-y-6 text-foreground select-none overflow-y-auto ${className}`}>
      {/* Table of Contents */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
            On This Page
          </div>
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`block w-full text-left px-2 py-1 rounded text-xs font-sans transition-colors ${
                    isActive
                      ? "text-foreground font-semibold bg-surface-02 border-l-2 border-border-strong pl-2.5"
                      : "text-text-muted hover:text-text-secondary hover:bg-surface-01"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Related Infrastructure Components */}
      {relatedComponents.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border-default">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
            Related Components
          </div>
          <div className="space-y-1.5">
            {relatedComponents.map((comp) => {
              if (!comp) return null;
              const IconComponent = getInfrastructureIcon(comp.iconSlug) || CpuIcon;

              return (
                <Link
                  key={comp.id}
                  href={`/tutorial/system-design/components/${comp.id}`}
                  className="flex items-center gap-2 p-1.5 rounded-md bg-surface-01 border border-border-default hover:border-border-hover hover:bg-surface-02 transition-colors group"
                >
                  <div className="w-5 h-5 rounded bg-surface-02 flex items-center justify-center shrink-0 text-text-muted group-hover:text-foreground">
                    <IconComponent className="w-3 h-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-xs font-medium text-text-secondary group-hover:text-foreground truncate">
                      {comp.name}
                    </div>
                    <div className="font-mono text-[9px] text-text-disabled truncate">
                      {comp.classification}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Visualizer Tip */}
      <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1.5 text-[11px] font-sans text-text-muted">
        <div className="font-mono text-[10px] uppercase font-semibold text-text-secondary">
          Interactive Studio
        </div>
        <p>
          Every preview and architecture topology can be cloned directly into your live workspace for topology testing.
        </p>
      </div>
    </div>
  );
}
