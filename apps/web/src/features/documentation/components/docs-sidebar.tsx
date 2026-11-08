"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Badge, Button } from "@nxtqr/ui";
import { SearchIcon, ChevronDownIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { getDocsNavigation, type NavGroup } from "../registry/navigation";

export interface DocsSidebarProps {
  onSearchClick?: () => void;
  className?: string;
}

export function DocsSidebar({ onSearchClick, className }: DocsSidebarProps) {
  const pathname = usePathname();
  const navGroups: NavGroup[] = React.useMemo(() => getDocsNavigation(), []);

  // Track expanded categories (all open by default)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (category: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <aside
      className={cn(
        "w-64 shrink-0 h-full overflow-y-auto scrollbar-compact border-r border-border bg-black/40 py-6 px-4 flex flex-col space-y-6 select-none",
        className,
      )}
    >
      {/* Search Trigger Button */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSearchClick}
          className="w-full justify-between h-9 px-3 bg-surface/70 border-border font-sans text-xs text-muted-foreground hover:text-foreground transition-colors duration-140"
        >
          <span className="flex items-center gap-2">
            <SearchIcon className="h-3.5 w-3.5" />
            <span>Search docs...</span>
          </span>
          <kbd className="font-mono text-[10px] bg-black/60 border border-subtle-border px-1.5 py-0.5 rounded text-neutral-400">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Navigation Groups */}
      <nav className="space-y-5 text-xs font-sans flex-1">
        {navGroups.map((group) => {
          const isCollapsed = Boolean(collapsedGroups[group.category]);

          return (
            <div key={group.category} className="space-y-1.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.category)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between py-1 px-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-140 rounded-md outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <span>{group.category}</span>
                <ChevronDownIcon
                  className={cn(
                    "h-3 w-3 text-neutral-500 transition-transform duration-200 ease-standard motion-reduce:transition-none",
                    isCollapsed && "-rotate-90",
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      height: { duration: 0.2, ease: [0.2, 0, 0, 1] },
                      opacity: { duration: 0.14, ease: [0.2, 0, 0, 1] },
                    }}
                    className="space-y-0.5 pl-1 overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const itemHref = `/docs/${item.slug}`;
                      const isActive = pathname === itemHref;

                      return (
                        <Link
                          key={item.slug}
                          href={itemHref}
                          className={cn(
                            "flex items-center justify-between py-1.5 px-2.5 rounded-md text-xs transition-colors duration-140 ease-standard outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            isActive
                              ? "bg-secondary-surface text-foreground font-semibold shadow-level-1 border border-subtle-border"
                              : "text-muted-foreground hover:text-foreground hover:bg-surface/50",
                          )}
                        >
                          <span className="truncate">{item.title}</span>
                          {item.status === "draft" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono py-0 text-neutral-500"
                            >
                              Draft
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
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
