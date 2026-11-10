"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDownIcon, LayersIcon, BookOpenIcon, CpuIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { tutorialRegistry } from "../lib/tutorial-registry";
import { getAllExamples } from "../lib/examples-registry";
import { getAllConcepts } from "../lib/concepts-registry";

export interface TutorialSidebarProps {
  /** Called when any link is clicked (use it to close a mobile drawer). */
  onItemClick?: () => void;
  /**
   * Called when the viewport grows to desktop width. Pass the function that
   * closes your mobile drawer so it auto-closes when the window is expanded.
   */
  onDesktopExpand?: () => void;
  /** Min width in px at which the layout counts as desktop. Defaults to 768. */
  desktopBreakpoint?: number;
  className?: string;
}

const EASE = [0.2, 0, 0, 1] as const;

type SpringTransition = { duration: number } | { type: "spring"; stiffness: number; damping: number; mass: number };

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                       */
/* -------------------------------------------------------------------------- */

function Indicator({
  id,
  transition,
}: {
  id: string;
  transition: SpringTransition;
}) {
  return (
    <>
      <motion.span
        layoutId={`${id}-bg`}
        aria-hidden="true"
        transition={transition}
        className="absolute inset-0 rounded-r-md bg-gradient-to-r from-white/[0.08] to-white/[0.02]"
      />
      <motion.span
        layoutId={`${id}-bar`}
        aria-hidden="true"
        transition={transition}
        className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.55)]"
      />
    </>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex h-6 items-center justify-between px-2">
        <h3 className="font-sans text-[11px] font-medium tracking-tight text-white/40">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Rail({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul className={cn("relative ml-[7px] flex flex-col gap-px py-0.5", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/10"
      />
      {children}
    </ul>
  );
}

interface NavLinkProps {
  href: string;
  isActive: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  indicatorId: string;
  transition: SpringTransition;
  compact?: boolean;
  children: React.ReactNode;
}

function NavLink({
  href,
  isActive,
  onClick,
  icon,
  trailing,
  indicatorId,
  transition,
  compact,
  children,
}: NavLinkProps) {
  return (
    <li className="relative">
      {isActive && <Indicator id={indicatorId} transition={transition} />}

      <Link
        href={href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group/item relative flex items-center justify-between gap-2 rounded-r-md pr-2.5 font-sans outline-none transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-white/40",
          compact ? "h-7 pl-4 text-[12px]" : "h-8 pl-4 text-[12.5px]",
          isActive
            ? "font-medium text-white"
            : "text-white/45 hover:bg-white/[0.04] hover:text-white/90",
        )}
      >
        {!isActive && (
          <span
            aria-hidden="true"
            className="absolute inset-y-2 left-0 w-px origin-center scale-y-0 bg-white/50 transition-transform duration-200 group-hover/item:scale-y-100 motion-reduce:transition-none"
          />
        )}

        <span className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span
              className={cn(
                "shrink-0 transition-colors duration-200",
                isActive ? "text-white" : "text-white/35 group-hover/item:text-white/70",
              )}
            >
              {icon}
            </span>
          )}
          <span className="truncate">{children}</span>
        </span>

        {trailing}
      </Link>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                     */
/* -------------------------------------------------------------------------- */

export function TutorialSidebar({
  onItemClick,
  onDesktopExpand,
  desktopBreakpoint = 768,
  className = "",
}: TutorialSidebarProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const categoryGroups = React.useMemo(() => tutorialRegistry.getAllCategoriesWithCounts(), []);
  const examples = React.useMemo(() => getAllExamples(), []);
  const concepts = React.useMemo(() => getAllConcepts(), []);

  const totalComponents = React.useMemo(
    () => categoryGroups.reduce((sum, g) => sum + g.count, 0),
    [categoryGroups],
  );

  const indicatorTransition: SpringTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 520, damping: 42, mass: 0.7 };

  /* Auto-close the mobile drawer when the viewport expands to desktop ---- */
  const desktopExpandRef = React.useRef(onDesktopExpand);
  React.useEffect(() => {
    desktopExpandRef.current = onDesktopExpand;
  }, [onDesktopExpand]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(`(min-width: ${desktopBreakpoint}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) desktopExpandRef.current?.();
    };

    handleChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [desktopBreakpoint]);

  /* Expanded category accordions --------------------------------------- */
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

  // Keep the parent category open when navigating to a component page
  React.useEffect(() => {
    const match = pathname.match(/\/components\/([^\/]+)/);
    if (!match) return;
    const comp = tutorialRegistry.getComponentTutorial(match[1]);
    if (comp) {
      setExpandedCategories((prev) =>
        prev[comp.categoryId] ? prev : { ...prev, [comp.categoryId]: true },
      );
    }
  }, [pathname]);

  // Bring the active link into view after navigation
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      document
        .querySelector<HTMLElement>('[data-tutorial-sidebar] [aria-current="page"]')
        ?.scrollIntoView({
          block: "nearest",
          behavior: reduceMotion ? "auto" : "smooth",
        });
    }, 280);
    return () => window.clearTimeout(id);
  }, [pathname, reduceMotion]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const isLinkActive = (href: string) => pathname === href;

  return (
    <aside
      data-tutorial-sidebar=""
      className={cn(
        "flex h-full w-full select-none flex-col overflow-y-auto scrollbar-compact border-r border-white/10 bg-black text-white",
        className,
      )}
    >
      <nav aria-label="System design tutorial" className="flex flex-col gap-6 p-3.5">
        {/* Overview */}
        <Section title="Overview">
          <Rail>
            <NavLink
              href="/tutorial/system-design"
              isActive={isLinkActive("/tutorial/system-design")}
              onClick={onItemClick}
              icon={<BookOpenIcon className="h-3.5 w-3.5" />}
              indicatorId="tutorial-sidebar-top"
              transition={indicatorTransition}
            >
              System design hub
            </NavLink>
            <NavLink
              href="/tutorial/system-design/getting-started"
              isActive={isLinkActive("/tutorial/system-design/getting-started")}
              onClick={onItemClick}
              icon={<LayersIcon className="h-3.5 w-3.5" />}
              indicatorId="tutorial-sidebar-top"
              transition={indicatorTransition}
            >
              Getting started
            </NavLink>
            <NavLink
              href="/tutorial/system-design/components"
              isActive={isLinkActive("/tutorial/system-design/components")}
              onClick={onItemClick}
              icon={<CpuIcon className="h-3.5 w-3.5" />}
              indicatorId="tutorial-sidebar-top"
              transition={indicatorTransition}
              trailing={
                <span className="font-sans text-[10px] tabular-nums text-white/35">
                  {totalComponents}
                </span>
              }
            >
              All components
            </NavLink>
          </Rail>
        </Section>

        {/* Categories */}
        <Section
          title={`Categories (${categoryGroups.length})`}
          aside={
            <span className="font-sans text-[10px] tabular-nums text-white/30">
              {totalComponents} nodes
            </span>
          }
        >
          <ul className="flex flex-col gap-px">
            {categoryGroups.map((group) => {
              const categoryHref = `/tutorial/system-design/categories/${group.category.id}`;
              const isExpanded = Boolean(expandedCategories[group.category.id]);
              const isCatPage = pathname === categoryHref;
              const hasActiveChild = group.components.some(
                (comp) => pathname === `/tutorial/system-design/components/${comp.id}`,
              );

              return (
                <li key={group.category.id}>
                  {/* Category row */}
                  <div
                    className={cn(
                      "group/cat relative flex items-center rounded-r-md transition-colors duration-200",
                      !isCatPage && "hover:bg-white/[0.04]",
                    )}
                  >
                    {isCatPage && (
                      <Indicator id="tutorial-sidebar-category" transition={indicatorTransition} />
                    )}

                    <Link
                      href={categoryHref}
                      onClick={onItemClick}
                      aria-current={isCatPage ? "page" : undefined}
                      className={cn(
                        "relative flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-r-md pl-4 pr-1 font-sans text-[12.5px] outline-none transition-colors duration-200 focus-visible:ring-1 focus-visible:ring-white/40",
                        isCatPage
                          ? "font-medium text-white"
                          : hasActiveChild
                            ? "text-white/85"
                            : "text-white/55 group-hover/cat:text-white/90",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1 shrink-0 rounded-full transition-all duration-300",
                            isCatPage || hasActiveChild
                              ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                              : "bg-white/20 group-hover/cat:bg-white/50",
                          )}
                        />
                        <span className="truncate">{group.category.name}</span>
                      </span>
                      <span className="font-sans text-[10px] tabular-nums text-white/30">
                        {group.count}
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleCategory(group.category.id)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.category.name}`}
                      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/40 outline-none transition-colors duration-200 hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
                    >
                      <motion.span
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE }}
                        className="flex"
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </motion.span>
                    </button>
                  </div>

                  {/* Components in category */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="components"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: reduceMotion ? 0 : 0.24, ease: EASE },
                          opacity: { duration: reduceMotion ? 0 : 0.16, ease: EASE },
                        }}
                        className="overflow-hidden"
                      >
                        <Rail className="ml-[11px] mt-0.5 mb-1">
                          {group.components.map((comp) => (
                            <NavLink
                              key={comp.id}
                              href={`/tutorial/system-design/components/${comp.id}`}
                              isActive={
                                pathname === `/tutorial/system-design/components/${comp.id}`
                              }
                              onClick={onItemClick}
                              indicatorId="tutorial-sidebar-nested"
                              transition={indicatorTransition}
                              compact
                            >
                              {comp.name}
                            </NavLink>
                          ))}
                        </Rail>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* Architectures */}
        <Section
          title="Architectures"
          aside={
            <Link
              href="/tutorial/system-design/examples"
              onClick={onItemClick}
              className="rounded font-sans text-[10px] text-white/40 outline-none transition-colors duration-200 hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
            >
              View all ({examples.length})
            </Link>
          }
        >
          <Rail>
            {examples.map((ex) => (
              <NavLink
                key={ex.id}
                href={`/tutorial/system-design/examples/${ex.slug}`}
                isActive={pathname === `/tutorial/system-design/examples/${ex.slug}`}
                onClick={onItemClick}
                indicatorId="tutorial-sidebar-top"
                transition={indicatorTransition}
                trailing={
                  <span
                    title={String(ex.difficulty)}
                    className="grid size-4 shrink-0 place-items-center rounded border border-white/15 font-sans text-[9px] font-medium uppercase leading-none text-white/45"
                  >
                    {String(ex.difficulty)[0]}
                  </span>
                }
              >
                {ex.title.split(" (")[0]}
              </NavLink>
            ))}
          </Rail>
        </Section>

        {/* Core concepts */}
        <Section title="Core concepts">
          <Rail>
            {concepts.map((c) => (
              <NavLink
                key={c.id}
                href={`/tutorial/system-design/concepts/${c.slug}`}
                isActive={pathname === `/tutorial/system-design/concepts/${c.slug}`}
                onClick={onItemClick}
                icon={<LayersIcon className="h-3.5 w-3.5" />}
                indicatorId="tutorial-sidebar-top"
                transition={indicatorTransition}
              >
                {c.title.split(" &")[0]}
              </NavLink>
            ))}
          </Rail>
        </Section>
      </nav>
    </aside>
  );
}