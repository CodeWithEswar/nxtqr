"use client";

import React, { useEffect, useState } from "react";
import type { LegalSectionMeta } from "../config/legal-documents";

interface LegalTocProps {
  sections: LegalSectionMeta[];
}

export function LegalToc({ sections }: LegalTocProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible sections
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Take the highest visible section on page
          const sorted = visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          if (sorted[0]?.target?.id) {
            setActiveId(sorted[0].target.id);
          }
        }
      },
      {
        rootMargin: "-80px 0% -60% 0%",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <nav
      className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-dense pr-2 space-y-1 select-none"
      aria-label="Table of contents"
    >
      <div className="px-2 pb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted font-medium border-b border-border-subtle mb-2">
        Sections ({sections.length})
      </div>
      <div className="space-y-0.5">
        {sections.map((sec) => {
          const isActive = activeId === sec.id;
          return (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              onClick={(e) => handleScrollTo(e, sec.id)}
              className={`flex items-start gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                isActive
                  ? "bg-surface-03 font-semibold text-foreground border border-border-default shadow-level-1"
                  : "text-text-muted hover:text-foreground hover:bg-surface-02 border border-transparent"
              }`}
            >
              <span className="font-mono text-[10px] text-text-muted shrink-0 pt-0.5">
                {sec.number}
              </span>
              <span className="truncate leading-tight">{sec.title}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

