"use client";

import * as React from "react";
import { useVerification } from "../hooks/use-verification";
import { VerificationHeader } from "./verification-header";
import { VerificationSummaryBar } from "./verification-summary";
import { VerificationFilters } from "./verification-filters";
import { VerificationGroup } from "./verification-group";
import { VerificationDetails } from "./verification-details";
import { VerificationEmptyState } from "./verification-empty-state";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@nxtqr/ui";
import type { VerificationCategory } from "../schemas/verification.schema";

const CATEGORIES: VerificationCategory[] = [
  "architecture",
  "design-system",
  "infrastructure",
  "frontend",
];

export function VerificationPage() {
  const {
    filteredChecks,
    selectedCheck,
    selectedCheckId,
    setSelectedCheckId,
    summary,
    isRunning,
    filter,
    setFilter,
    search,
    setSearch,
    runAllChecks,
    runSingleCheck,
  } = useVerification();

  const [mobileDetailOpen, setMobileDetailOpen] = React.useState<boolean>(false);

  const handleSelectCheck = (id: string) => {
    setSelectedCheckId(id);
    // On mobile & small tablet screens (< lg), open bottom details sheet
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* 1. Full-Width Edge-to-Edge Sticky Header (100% Solid, Zero Blur, Full Width) */}
      <VerificationHeader
        title="Architecture Diagnostics"
        shortTitle="Diagnostics"
        subtitle="Production verification console for workspace packages, design system tokens, database contracts, and live runtime systems."
        version="v0.1.0-alpha"
        backHref="/docs"
        backLabel="Back to Documentation"
        summary={summary}
        isRunning={isRunning}
        onRunDiagnostics={runAllChecks}
        showReviewGates={true}
      />

      {/* 2. Main Page Content (Expands Full Width up to 2400px) */}
      <main className="flex-1 w-full max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 space-y-6">
        {/* Compact Summary Metrics Strip */}
        <VerificationSummaryBar summary={summary} />

        {/* Filters & Quick Search */}
        <VerificationFilters
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          summary={summary}
        />

        {/* Dual-Pane Engineering Diagnostics Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-12 gap-6 items-start min-w-0">
          {/* Left Column: Categorized Verification Groups (7 cols on desktop) */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-7 space-y-6 min-w-0">
            {filteredChecks.length === 0 ? (
              <VerificationEmptyState
                onResetFilters={() => {
                  setFilter("all");
                  setSearch("");
                }}
              />
            ) : (
              CATEGORIES.map((category) => {
                const categoryChecks = filteredChecks.filter((c) => c.category === category);
                return (
                  <VerificationGroup
                    key={category}
                    category={category}
                    checks={categoryChecks}
                    selectedCheckId={selectedCheckId}
                    onSelectCheck={handleSelectCheck}
                  />
                );
              })
            )}
          </div>

          {/* Right Column: Diagnostic Evidence & Output Details (5 cols on desktop, sticky) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5 2xl:col-span-5 lg:sticky lg:top-20 min-w-0 max-h-[calc(100vh-6rem)]">
            <VerificationDetails
              check={selectedCheck}
              onRecheck={runSingleCheck}
              isRechecking={isRunning}
            />
          </div>
        </div>
      </main>

      {/* Mobile & Tablet Diagnostic Details Sheet */}
      <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="h-[88vh] max-h-[88vh] p-0 bg-surface-01 border-t border-border-strong rounded-t-md flex flex-col overflow-hidden shadow-level-3"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Diagnostic Details</SheetTitle>
          </SheetHeader>

          {/* Premium Bottom Sheet Drag Handle */}
          <div className="w-full flex justify-center pt-2.5 pb-1.5 shrink-0 bg-surface-02 border-b border-border-subtle/40">
            <div className="w-10 h-1 rounded-full bg-border-strong" />
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <VerificationDetails
              check={selectedCheck}
              onRecheck={runSingleCheck}
              isRechecking={isRunning}
              onClose={() => setMobileDetailOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
