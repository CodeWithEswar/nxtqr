"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Badge } from "@nxtqr/ui";
import { SearchIcon, ChevronDownIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { getDocsNavigation, type NavGroup } from "../registry/navigation";

export interface DocsSidebarProps {
  onSearchClick?: () => void;
  className?: string;
}

const EASE = [0.2, 0, 0, 1] as const;

export function DocsSidebar({ onSearchClick, className }: DocsSidebarProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const navGroups: NavGroup[] = React.useMemo(() => getDocsNavigation(), []);

  // Track collapsed categories (all open by default)
  const [collapsedGroups, setCollapsedGroups] = React.useState<
    Record<string, boolean>
  >({});

  const toggleGroup = (category: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // One shared transition so the active indicator glides between items
  const indicatorTransition = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 520, damping: 42, mass: 0.7 } as const);

  return (
    <aside
      className={cn(
        "w-60 shrink-0 h-full overflow-y-auto scrollbar-compact border-r border-subtle-border bg-black py-5 px-3.5 flex flex-col gap-6 select-none",
        className,
      )}
    >
      {/* Search trigger */}
      <button
        type="button"
        onClick={onSearchClick}
        className="group flex h-9 w-full items-center justify-between rounded-md border border-border bg-surface px-3 font-sans text-xs text-muted-foreground outline-none transition-colors duration-140 hover:border-border-hover hover:bg-secondary-surface hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring shadow-level-1 active:shadow-level-3"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 transition-colors duration-140 group-hover:text-foreground" />
          <span className="truncate">Search docs</span>
        </span>
        <kbd className="shrink-0 rounded-md border border-subtle-border bg-black px-1.5 py-0.5 font-sans text-[10px] leading-none text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Navigation groups */}
      <nav aria-label="Documentation" className="flex flex-1 flex-col gap-5 font-sans text-xs">
        {navGroups.map((group) => {
          const isCollapsed = Boolean(collapsedGroups[group.category]);
          const hasActive = group.items.some(
            (item) => pathname === `/docs/${item.slug}`,
          );

          return (
            <div key={group.category} className="flex flex-col">
              {/* Group header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.category)}
                aria-expanded={!isCollapsed}
                className={cn(
                  "group flex h-7 w-full items-center justify-between rounded-md px-2 text-[12px] font-medium tracking-tight outline-none transition-colors duration-140 focus-visible:ring-1 focus-visible:ring-ring",
                  hasActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1 shrink-0 rounded-full transition-all duration-200",
                      hasActive
                        ? "bg-foreground"
                        : "bg-neutral-600 group-hover:bg-neutral-400",
                    )}
                  />
                  <span className="truncate">{group.category}</span>
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {group.items.length}
                  </span>
                  <motion.span
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
                    className="flex"
                  >
                    <ChevronDownIcon className="h-3 w-3 text-muted-foreground transition-colors duration-140 group-hover:text-foreground" />
                  </motion.span>
                </span>
              </button>

              {/* Items */}
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { duration: reduceMotion ? 0 : 0.24, ease: EASE },
                      opacity: { duration: reduceMotion ? 0 : 0.16, ease: EASE },
                    }}
                    className="overflow-hidden"
                  >
                    <ul className="relative mt-1 ml-[7px] flex flex-col gap-px py-0.5">
                      {/* Rail */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-0 w-px bg-subtle-border"
                      />

                      {group.items.map((item) => {
                        const itemHref = `/docs/${item.slug}`;
                        const isActive = pathname === itemHref;

                        return (
                          <li key={item.slug} className="relative">
                            {isActive && (
                              <>
                                {/* Sliding solid neumorphic background */}
                                <motion.span
                                  layoutId="docs-sidebar-active-bg"
                                  aria-hidden="true"
                                  transition={indicatorTransition}
                                  className="absolute inset-0 rounded-r-md bg-surface-04 border-r border-y border-border-strong shadow-level-3"
                                />
                                {/* Sliding indicator bar on the rail */}
                                <motion.span
                                  layoutId="docs-sidebar-active-bar"
                                  aria-hidden="true"
                                  transition={indicatorTransition}
                                  className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-foreground"
                                />
                              </>
                            )}

                            <Link
                              href={itemHref}
                              aria-current={isActive ? "page" : undefined}
                              className={cn(
                                "group/item relative flex h-8 items-center justify-between gap-2 rounded-r-md pl-4 pr-2.5 text-[12.5px] outline-none transition-colors duration-140 focus-visible:ring-1 focus-visible:ring-ring",
                                isActive
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground hover:bg-secondary-surface hover:text-foreground",
                              )}
                            >
                              {/* Hover tick on the rail (inactive only) */}
                              {!isActive && (
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-y-2 left-0 w-px origin-center scale-y-0 bg-neutral-400 transition-transform duration-140 group-hover/item:scale-y-100 motion-reduce:transition-none"
                                />
                              )}

                              <span className="truncate">{item.title}</span>

                              {item.status === "draft" && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 border-subtle-border px-1.5 py-0 text-[9px] font-normal text-muted-foreground"
                                >
                                  Draft
                                </Badge>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
