"use client";

import * as React from "react";
import Link from "next/link";
import { TutorialShell, tutorialRegistry } from "@/features/system-design-tutorials";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import { getInfrastructureIcon, CpuIcon, SearchIcon, CloseIcon } from "@nxtqr/icons";
import { Input, Badge, Button } from "@nxtqr/ui";

export default function ComponentsDirectoryPage() {
  const allTutorials = React.useMemo(() => tutorialRegistry.getAllComponentTutorials(), []);
  const allCategories = React.useMemo(() => infrastructureRegistry.listCategories(), []);

  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filteredComponents = React.useMemo(() => {
    return allTutorials.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.categoryId !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesShort = item.shortName.toLowerCase().includes(q);
        const matchesCat = item.categoryName.toLowerCase().includes(q);
        const matchesClass = item.classification.toLowerCase().includes(q);
        return matchesId || matchesName || matchesShort || matchesCat || matchesClass;
      }
      return true;
    });
  }, [allTutorials, selectedCategory, searchQuery]);

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: "Components Directory" },
      ]}
      hideToc={true}
    >
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="space-y-2 border-b border-border-default pb-6">
          <div className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
            <CpuIcon className="w-4 h-4" />
            <span>Infrastructure Component Library</span>
          </div>
          <h1 className="text-3xl font-sans font-bold text-foreground">
            Complete Component Catalog
          </h1>
          <p className="text-sm font-sans text-text-secondary max-w-3xl leading-relaxed">
            All 223 typed infrastructure components with standardized input/output ports, live configuration schemas, and architecture topologies.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 rounded-md bg-surface-01 border border-border-default flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, keyword, or acronym..."
                className="pl-8 h-8 text-xs font-sans bg-surface-02 border-border-default"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-muted hover:text-foreground"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2.5 rounded-md bg-surface-02 border border-border-default text-xs font-mono text-foreground focus:outline-none focus:border-border-hover shrink-0"
            >
              <option value="all">All Categories (20)</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="font-mono text-xs text-text-muted shrink-0">
            Showing <strong className="text-foreground">{filteredComponents.length}</strong> of {allTutorials.length} components
          </div>
        </div>

        {/* Components Grid */}
        {filteredComponents.length === 0 ? (
          <div className="p-12 text-center rounded-md bg-surface-01 border border-border-default font-sans text-sm text-text-muted space-y-2">
            <p>No components matched your search &quot;{searchQuery}&quot;.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="font-mono text-xs border-border-default text-text-secondary"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredComponents.map((comp) => {
              const IconComponent = getInfrastructureIcon(comp.iconSlug) || CpuIcon;

              return (
                <Link
                  key={comp.id}
                  href={`/tutorial/system-design/components/${comp.id}`}
                  className="p-3.5 rounded-md bg-surface-01 border border-border-default hover:border-border-hover hover:bg-surface-02 transition-colors flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded bg-surface-02 border border-border-default flex items-center justify-center shrink-0 text-text-secondary group-hover:text-foreground">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono text-[9px] px-1.5 py-0 border-border-default text-text-muted truncate max-w-[140px]"
                      >
                        {comp.categoryName}
                      </Badge>
                    </div>

                    <div>
                      <div className="font-sans text-xs font-semibold text-foreground group-hover:underline truncate">
                        {comp.name}
                      </div>
                      <div className="font-mono text-[10px] text-text-disabled truncate">
                        {comp.id}
                      </div>
                    </div>

                    <p className="text-[11px] font-sans text-text-muted line-clamp-2 leading-snug">
                      {comp.tagline}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle font-mono text-[9px] text-text-disabled">
                    <span>
                      {comp.ports.filter((p) => p.type === "input" || p.type === "bidirectional").length} in •{" "}
                      {comp.ports.filter((p) => p.type === "output" || p.type === "bidirectional").length} out
                    </span>
                    <span className="text-text-muted group-hover:text-foreground">
                      View Guide →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </TutorialShell>
  );
}
