"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@nxtqr/branding";
import { Button, Sheet, SheetContent, SheetTrigger } from "@nxtqr/ui";
import { SearchIcon, MenuIcon, TerminalIcon, ActivityIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { DocsSidebar } from "./docs-sidebar";

export interface DocsHeaderProps {
  onSearchClick?: () => void;
}

export function DocsHeader({ onSearchClick }: DocsHeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Auto-close mobile drawer when navigating to another route
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Auto-close mobile drawer when window expands to desktop viewport (>= 768px)
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setMobileOpen(false);
      }
    };

    if (mediaQuery.matches) {
      setMobileOpen(false);
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
      return () => mediaQuery.removeEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
      return () => mediaQuery.removeListener(handleMediaChange);
    }
  }, []);

  // Top-level section active checks
  const isGettingStarted =
    pathname.startsWith("/docs/getting-started") || pathname === "/docs";
  const isFoundations = pathname.startsWith("/docs/foundations");
  const isComponents = pathname.startsWith("/docs/components");

  const topNavLinks = [
    {
      label: "Docs",
      href: "/docs/getting-started/introduction",
      active: isGettingStarted,
    },
    {
      label: "Foundations",
      href: "/docs/foundations/colors",
      active: isFoundations,
    },
    {
      label: "Components",
      href: "/docs/components/button",
      active: isComponents,
    },
  ];

  return (
    <header className="sticky top-0 z-50 h-14 w-full border-b border-border bg-black/95 backdrop-blur px-3 sm:px-6 flex items-center justify-between shrink-0 select-none">
      {/* Left: Mobile Trigger, Brand Identity & Desktop Top Navigation */}
      <div className="flex items-center gap-2 sm:gap-6 min-w-0">
        {/* Mobile Sidebar Sheet Trigger */}
        <div className="md:hidden shrink-0">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Open documentation navigation"
                className="h-8 w-8 border-border bg-surface text-muted-foreground hover:text-foreground active:bg-secondary-surface active:shadow-level-3 shrink-0"
              >
                <MenuIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="md:hidden p-0 w-72 max-w-[85vw] bg-black border-border flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AppLogo variant="symbol" size={24} />
                  <span className="font-semibold text-xs tracking-tight text-foreground font-sans">
                    NXTQR Documentation
                  </span>
                </div>
              </div>

              {/* Mobile Quick Section Switcher */}
              <div className="p-3 border-b border-border bg-surface/50 grid grid-cols-3 gap-1">
                {topNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "text-center py-1.5 rounded-md text-[11px] font-sans font-medium transition-colors duration-140",
                      link.active
                        ? "bg-secondary-surface text-foreground font-semibold shadow-level-1 border border-subtle-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Drawer Scrollable Navigation Links */}
              <div className="flex-1 overflow-y-auto">
                <DocsSidebar
                  onSearchClick={() => {
                    setMobileOpen(false);
                    onSearchClick?.();
                  }}
                  className="w-full border-r-0 h-auto"
                />
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-3 border-t border-border bg-surface/40 flex items-center justify-between text-xs font-mono">
                <Link
                  href="/verify"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors"
                >
                  <TerminalIcon className="h-3.5 w-3.5" />
                  <span>Diagnostics</span>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Brand Link */}
        <Link
          href="/docs"
          className="flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md shrink-0"
        >
          <AppLogo variant="symbol" size={24} className="shrink-0" />
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-bold text-sm tracking-tight text-foreground font-sans">
              NXTQR
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              / Design System
            </span>
          </div>
        </Link>

        {/* Desktop Top-Level Navigation Links */}
        <nav className="hidden md:inline-flex items-center gap-1 font-sans text-xs">
          {topNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors duration-140 ease-standard font-medium",
                link.active
                  ? "bg-secondary-surface text-foreground font-semibold shadow-level-1 border border-subtle-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right: Quick Search, Diagnostics & Theme Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Search Trigger Button (Desktop) */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSearchClick}
          className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground bg-surface/70 border-border hover:bg-surface hover:text-foreground transition-all duration-140 shadow-level-1"
        >
          <SearchIcon className="h-3.5 w-3.5" />
          <span>Quick search</span>
          <kbd className="font-mono text-[10px] bg-black/60 border border-subtle-border px-1.5 py-0.5 rounded text-neutral-400">
            ⌘K
          </kbd>
        </Button>

        {/* Search Trigger Button (Mobile Icon-Only) */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onSearchClick}
          aria-label="Quick search"
          className="flex sm:hidden h-8 w-8 text-muted-foreground bg-surface/70 border-border hover:text-foreground active:bg-secondary-surface active:shadow-level-3 shrink-0"
        >
          <SearchIcon className="h-3.5 w-3.5" />
        </Button>

        {/* Diagnostics Review Gate */}
        <Link href="/verify" className="shrink-0">
          <Button
            variant="outline"
            size="sm"
            aria-label="System Diagnostics"
            className="h-8 px-2 sm:px-2.5 font-mono text-[11px] text-muted-foreground hover:text-foreground bg-surface/40 border-border flex items-center gap-1.5 shadow-level-1"
          >
            <ActivityIcon className="h-3.5 w-3.5 text-foreground shrink-0" />
            <span className="hidden sm:inline">Diagnostics</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
