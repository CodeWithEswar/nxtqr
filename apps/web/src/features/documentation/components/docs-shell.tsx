"use client";

import * as React from "react";
import { DocsHeader } from "./docs-header";
import { DocsSidebar } from "./docs-sidebar";
import { DocsToc } from "./docs-toc";
import { DocsSearch } from "./docs-search";
import { type DocHeading } from "../schemas/docs-schema";

export interface DocsShellProps {
  children: React.ReactNode;
  headings?: DocHeading[];
}

export function DocsShell({ children, headings = [] }: DocsShellProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <div className="h-screen max-h-screen w-full bg-background text-foreground flex flex-col overflow-hidden">
      {/* 1. Fixed / Sticky Top Header */}
      <DocsHeader onSearchClick={() => setSearchOpen(true)} />

      {/* 2. Below Header Three-Column Viewport Shell */}
      <div className="flex-1 flex w-full min-h-0 overflow-hidden">
        {/* Column 1: Left Navigation Sidebar (Desktop/Laptop) */}
        <DocsSidebar onSearchClick={() => setSearchOpen(true)} className="hidden md:flex" />

        {/* Column 2: Central Primary Documentation Scroll Area */}
        <main
          id="docs-content"
          tabIndex={-1}
          className="flex-1 min-w-0 h-full overflow-y-auto scrollbar-default px-6 sm:px-10 py-10"
        >
          <div className="max-w-3xl mx-auto space-y-10">{children}</div>
        </main>

        {/* Column 3: Right On This Page Table of Contents */}
        <DocsToc headings={headings} />
      </div>

      {/* Global Command Palette Search */}
      <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
