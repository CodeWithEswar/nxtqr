"use client";

import * as React from "react";
import { type DocHeading } from "../schemas/docs-schema";
import { cn } from "@nxtqr/utils";

export interface DocsTocProps {
  headings?: DocHeading[];
}

export function DocsToc({ headings = [] }: DocsTocProps) {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    if (!headings || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-80px 0% -60% 0%",
        threshold: 0.1,
      },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings || headings.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <aside className="hidden xl:block w-56 shrink-0 h-full overflow-y-auto scrollbar-compact py-8 pl-6 pr-4 border-l border-border bg-black/40">
      <div className="space-y-3">
        <h4 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          On This Page
        </h4>
        <nav className="space-y-1 text-xs font-sans">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={cn(
                  "block py-1 transition-colors duration-140 ease-standard leading-snug truncate relative pl-2.5 border-l-2",
                  heading.level === 3 ? "ml-2 text-[11px]" : "font-medium",
                  isActive
                    ? "border-accent text-accent font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {heading.title}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
