"use client";

import * as React from "react";
import { type DocHeading } from "../schemas/docs-schema";
import { cn } from "@nxtqr/utils";

export interface DocsTocProps {
  headings?: DocHeading[];
}

const ROW_HEIGHT = 28; // px, matches h-7
const ELBOW_WIDTH = 16; // px

/**
 * Elbow connector for sub-navigation.
 * Runs down from the top of the row, bends with a rounded corner
 * and ends at the label. When another sibling follows, the vertical
 * trunk keeps going to the bottom so the tree stays connected.
 */
function Elbow({
  active,
  hasNext,
}: {
  active: boolean;
  hasNext: boolean;
}) {
  const mid = ROW_HEIGHT / 2;
  const r = 5;

  return (
    <svg
      aria-hidden="true"
      width={ELBOW_WIDTH}
      height={ROW_HEIGHT}
      viewBox={`0 0 ${ELBOW_WIDTH} ${ROW_HEIGHT}`}
      fill="none"
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
    >
      {hasNext && (
        <path
          d={`M1 ${mid} V${ROW_HEIGHT}`}
          className="stroke-border-subtle"
          strokeWidth="1"
        />
      )}
      <path
        d={`M1 0 V${mid - r} Q1 ${mid} ${1 + r} ${mid} H${ELBOW_WIDTH - 2}`}
        strokeWidth="1"
        strokeLinecap="round"
        className={cn(
          "transition-[stroke] duration-200",
          active ? "stroke-border-strong" : "stroke-border-subtle",
        )}
      />
    </svg>
  );
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
    <aside className="hidden xl:block w-60 shrink-0 h-full overflow-y-auto scrollbar-compact py-10 pl-7 pr-5 border-l border-subtle-border bg-black">
      <div className="space-y-5">
        <h4 className="flex items-center gap-2 font-sans text-[12px] font-medium tracking-tight text-foreground">
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-muted-foreground"
          >
            <path
              d="M1.5 3h9M1.5 6h6M1.5 9h4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          On this page
        </h4>

        <nav aria-label="Table of contents" className="relative font-sans">
          <ul>
            {headings.map((heading, i) => {
              const isActive = activeId === heading.id;
              const isSub = heading.level >= 3;
              const next = headings[i + 1];
              const hasNextSibling = isSub && !!next && next.level >= 3;

              return (
                <li
                  key={heading.id}
                  className={cn("relative", isSub && "ml-1.5")}
                  style={{ height: ROW_HEIGHT }}
                >
                  {isSub && (
                    <Elbow active={isActive} hasNext={hasNextSibling} />
                  )}

                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => handleClick(e, heading.id)}
                    title={heading.title}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "group relative flex h-full items-center truncate rounded-md outline-none",
                      "transition-colors duration-140",
                      "focus-visible:ring-1 focus-visible:ring-ring",
                      isSub
                        ? "pl-6 text-[12px] font-normal"
                        : "pl-0 text-[12.5px] font-medium",
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {!isSub && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mr-2.5 inline-block size-1 shrink-0 rounded-full transition-all duration-200",
                          isActive
                            ? "scale-125 bg-foreground"
                            : "bg-neutral-600 group-hover:bg-neutral-400",
                        )}
                      />
                    )}
                    <span className="truncate">{heading.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
