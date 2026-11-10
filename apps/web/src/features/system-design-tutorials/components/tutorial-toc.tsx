"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { getInfrastructureIcon, CpuIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
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

const ROW_HEIGHT = 28; // px, matches h-7
const EASE = [0.2, 0, 0, 1] as const;

export function TutorialToc({
  items,
  relatedComponentIds = [],
  className = "",
}: TutorialTocProps) {
  const reduceMotion = useReducedMotion();
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
      },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  const relatedComponents = React.useMemo(() => {
    return relatedComponentIds
      .map((id) => tutorialRegistry.getComponentTutorial(id))
      .filter(Boolean);
  }, [relatedComponentIds]);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );

  const spring = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 260, damping: 32, mass: 0.8 } as const);

  const reveal = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: EASE, delay },
        };

  return (
    <div
      className={cn(
        "h-full w-full select-none space-y-8 overflow-y-auto scrollbar-compact bg-black px-5 py-8 text-white",
        className,
      )}
    >
      {/* Table of contents */}
      {items.length > 0 && (
        <motion.section {...reveal(0)} className="space-y-4">
          <h4 className="flex items-center gap-2 font-sans text-[12px] font-medium tracking-tight text-white/90">
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-white/50"
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
            {/* Rail */}
            {items.length > 1 && (
              <>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[3px] w-px bg-white/10"
                  style={{
                    top: ROW_HEIGHT / 2,
                    height: (items.length - 1) * ROW_HEIGHT,
                  }}
                />
                {/* Progress fill, grows to the active section */}
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[3px] w-px bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ top: ROW_HEIGHT / 2 }}
                  initial={false}
                  animate={{ height: activeIndex * ROW_HEIGHT }}
                  transition={spring}
                />
              </>
            )}

            <ul>
              {items.map((item, i) => {
                const isActive = i === activeIndex;
                const isPassed = i < activeIndex;

                return (
                  <li
                    key={item.id}
                    className="relative"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Dot on the rail */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-1/2 size-[7px] -translate-y-1/2 rounded-full border transition-all duration-300",
                        isActive
                          ? "scale-125 border-white bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                          : isPassed
                            ? "border-white/70 bg-white/70"
                            : "border-white/20 bg-black",
                      )}
                    />

                    <a
                      href={`#${item.id}`}
                      onClick={(e) => scrollTo(e, item.id)}
                      title={item.label}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "flex h-full items-center truncate rounded-sm pl-5 text-[12.5px] outline-none transition-all duration-200",
                        "focus-visible:ring-1 focus-visible:ring-white/40",
                        isActive
                          ? "translate-x-0.5 font-medium text-white"
                          : "text-white/45 hover:translate-x-0.5 hover:text-white/90 motion-reduce:hover:translate-x-0",
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </motion.section>
      )}

      {/* Related infrastructure components */}
      {relatedComponents.length > 0 && (
        <motion.section
          {...reveal(0.08)}
          className="space-y-3 border-t border-white/10 pt-6"
        >
          <h4 className="font-sans text-[12px] font-medium tracking-tight text-white/90">
            Related components
          </h4>

          <ul className="space-y-1.5">
            {relatedComponents.map((comp) => {
              if (!comp) return null;
              const IconComponent =
                getInfrastructureIcon(comp.iconSlug) || CpuIcon;

              return (
                <li key={comp.id}>
                  <Link
                    href={`/tutorial/system-design/components/${comp.id}`}
                    className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2 outline-none transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-white/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black text-white/50 transition-colors duration-200 group-hover:border-white/25 group-hover:text-white">
                      <IconComponent className="h-3.5 w-3.5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-sans text-xs font-medium text-white/80 transition-colors duration-200 group-hover:text-white">
                        {comp.name}
                      </span>
                      <span className="block truncate font-sans text-[10.5px] text-white/35">
                        {comp.classification}
                      </span>
                    </span>

                    <svg
                      aria-hidden="true"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="shrink-0 -translate-x-1 text-white/0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-white/70 motion-reduce:transition-none"
                    >
                      <path
                        d="M2.5 6h7M6.5 3l3 3-3 3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      {/* Interactive studio note */}
      <motion.aside
        {...reveal(0.16)}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-4"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
        <div className="mb-1.5 flex items-center gap-2 font-sans text-[12px] font-medium tracking-tight text-white/90">
          <span
            aria-hidden="true"
            className="size-1 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          />
          Interactive studio
        </div>
        <p className="font-sans text-[11.5px] leading-relaxed text-white/45">
          Every preview and architecture topology can be cloned directly into
          your live workspace for topology testing.
        </p>
      </motion.aside>
    </div>
  );
}