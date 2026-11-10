"use client";

import * as React from "react";
import { TutorialHeader } from "./tutorial-header";
import { TutorialSidebar } from "./tutorial-sidebar";
import { TutorialToc, type TocItem } from "./tutorial-toc";
import { Sheet, SheetContent, SheetTitle } from "@nxtqr/ui";

export interface TutorialShellProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  tocItems?: TocItem[];
  relatedComponentIds?: string[];
  hideToc?: boolean;
}

export function TutorialShell({
  children,
  breadcrumbs,
  tocItems,
  relatedComponentIds,
  hideToc = false,
}: TutorialShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const hasToc = !hideToc && tocItems && tocItems.length > 0;

  return (
    <div className="flex h-dvh w-full flex-col bg-black text-foreground overflow-hidden select-text">
      {/* 1. Full-width sticky top header */}
      <TutorialHeader
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        breadcrumbs={breadcrumbs}
      />

      {/* 2. 3-Column Studio Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column: Desktop Navigation Sidebar */}
        <div className="hidden h-full w-56 shrink-0 lg:block 2xl:w-64">
          <TutorialSidebar />
        </div>

        {/* Mobile Navigation Drawer Sheet */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" aria-describedby={undefined} className="flex w-[min(19rem,calc(100vw-2rem))] flex-col gap-0 border-r border-border-default bg-surface-01 p-0">
            <SheetTitle className="border-b border-border-subtle px-4 py-4">Tutorial navigation</SheetTitle>
            <TutorialSidebar onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Center Column: Scrollable Documentation Canvas */}
        <main className="h-full min-w-0 flex-1 overflow-y-auto bg-black px-3 py-5 sm:px-6 sm:py-8 lg:px-8 2xl:px-12">
          <div className={`mx-auto ${hasToc ? "max-w-4xl" : "max-w-5xl"}`}>
            {children}
          </div>
        </main>

        {/* Right Column: Table of Contents & Related Components */}
        {hasToc && (
          <aside className="hidden h-full w-52 shrink-0 xl:block 2xl:w-60 border-l border-border-default bg-surface-01">
            <TutorialToc items={tocItems} relatedComponentIds={relatedComponentIds} />
          </aside>
        )}
      </div>
    </div>
  );
}
