"use client";

import * as React from "react";
import { TutorialHeader } from "./tutorial-header";
import { TutorialSidebar } from "./tutorial-sidebar";
import { TutorialToc, type TocItem } from "./tutorial-toc";
import { Sheet, SheetContent } from "@nxtqr/ui";

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

  const hasToc = !hideToc && tocItems && tocItems.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-foreground overflow-hidden select-text">
      {/* 1. Full-width sticky top header */}
      <TutorialHeader
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        breadcrumbs={breadcrumbs}
      />

      {/* 2. 3-Column Studio Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Column: Desktop Navigation Sidebar */}
        <div className="hidden md:block w-64 lg:w-72 h-full shrink-0">
          <TutorialSidebar />
        </div>

        {/* Mobile Navigation Drawer Sheet */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-80 bg-surface-01 border-r border-border-default">
            <TutorialSidebar onItemClick={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Center Column: Scrollable Documentation Canvas */}
        <main className="flex-1 h-full overflow-y-auto px-4 py-8 sm:px-8 lg:px-12 bg-black min-w-0">
          <div className={`mx-auto ${hasToc ? "max-w-4xl" : "max-w-5xl"}`}>
            {children}
          </div>
        </main>

        {/* Right Column: Table of Contents & Related Components */}
        {hasToc && (
          <aside className="hidden xl:block w-64 h-full shrink-0 border-l border-border-default bg-surface-01">
            <TutorialToc items={tocItems} relatedComponentIds={relatedComponentIds} />
          </aside>
        )}
      </div>
    </div>
  );
}
