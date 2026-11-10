import * as React from "react";
import Link from "next/link";
import { TutorialShell } from "@/features/system-design-tutorials";
import { tutorialRegistry } from "@/features/system-design-tutorials";
import { getAllExamples } from "@/features/system-design-tutorials";
import { Badge, Button } from "@nxtqr/ui";
import {
  LayersIcon,
  ChevronRightIcon,
  CpuIcon,
  ShieldIcon,
  ActivityIcon,
} from "@nxtqr/icons";

export default function SystemDesignHubPage() {
  const categoryGroups = tutorialRegistry.getAllCategoriesWithCounts();
  const examples = getAllExamples().slice(0, 4);

  return (
    <TutorialShell
      breadcrumbs={[{ label: "Tutorial" }, { label: "System Design Hub" }]}
      hideToc={true}
    >
      <div className="space-y-12 pb-16">
        {/* 1. Hero Section */}
        <div className="space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-02 border border-border-default font-mono text-[11px] text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>223 Infrastructure Components Registered</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-foreground">
            System Design Engineering Reference
          </h1>

          <p className="text-base text-text-secondary font-sans max-w-3xl leading-relaxed">
            The authoritative reference manual for modern distributed architectures. Explore all 223 typed infrastructure components across 20 categories, inspect live configuration schemas, experiment with topology scenarios, and open production-grade architectures directly in the System Design Visualizer.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3 rounded-md bg-surface-01 border border-border-default">
              <div className="font-mono text-2xl font-bold text-foreground">223</div>
              <div className="font-sans text-xs text-text-muted mt-0.5">Typed Components</div>
            </div>
            <div className="p-3 rounded-md bg-surface-01 border border-border-default">
              <div className="font-mono text-2xl font-bold text-foreground">20</div>
              <div className="font-sans text-xs text-text-muted mt-0.5">Canonical Categories</div>
            </div>
            <div className="p-3 rounded-md bg-surface-01 border border-border-default">
              <div className="font-mono text-2xl font-bold text-foreground">12</div>
              <div className="font-sans text-xs text-text-muted mt-0.5">Production Blueprints</div>
            </div>
            <div className="p-3 rounded-md bg-surface-01 border border-border-default">
              <div className="font-mono text-2xl font-bold text-foreground">100%</div>
              <div className="font-sans text-xs text-text-muted mt-0.5">Visualizer Compatible</div>
            </div>
          </div>
        </div>

        {/* 2. Getting Started & Learning Paths */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-sans font-semibold text-foreground">
                Structured Learning Paths
              </h2>
              <p className="text-xs text-text-muted font-sans">
                Follow recommended engineering paths based on your current architectural challenges.
              </p>
            </div>
            <Link href="/tutorial/system-design/getting-started">
              <Button variant="outline" size="sm" className="font-mono text-xs gap-1 border-border-default text-text-secondary">
                <span>Start Fundamentals</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/tutorial/system-design/getting-started"
              className="p-4 rounded-md bg-surface-01 border border-border-default hover:border-border-hover transition-colors space-y-2 group"
            >
              <div className="w-8 h-8 rounded bg-surface-02 flex items-center justify-center text-text-secondary group-hover:text-foreground">
                <LayersIcon className="w-4 h-4" />
              </div>
              <div className="font-sans text-sm font-semibold text-foreground">
                1. System Design Fundamentals
              </div>
              <p className="text-xs text-text-muted font-sans leading-relaxed">
                Core mental models: stateless compute tiers, persistence models, synchronous RPC vs asynchronous event brokers, and failure domains.
              </p>
            </Link>

            <Link
              href="/tutorial/system-design/concepts/cap-theorem"
              className="p-4 rounded-md bg-surface-01 border border-border-default hover:border-border-hover transition-colors space-y-2 group"
            >
              <div className="w-8 h-8 rounded bg-surface-02 flex items-center justify-center text-text-secondary group-hover:text-foreground">
                <ShieldIcon className="w-4 h-4" />
              </div>
              <div className="font-sans text-sm font-semibold text-foreground">
                2. Distributed Consistency & Sagas
              </div>
              <p className="text-xs text-text-muted font-sans leading-relaxed">
                CAP & PACELC theorem, distributed transactions, idempotency keys, and orchestrating multi-service sagas with compensation logic.
              </p>
            </Link>

            <Link
              href="/tutorial/system-design/concepts/caching-strategies"
              className="p-4 rounded-md bg-surface-01 border border-border-default hover:border-border-hover transition-colors space-y-2 group"
            >
              <div className="w-8 h-8 rounded bg-surface-02 flex items-center justify-center text-text-secondary group-hover:text-foreground">
                <ActivityIcon className="w-4 h-4" />
              </div>
              <div className="font-sans text-sm font-semibold text-foreground">
                3. High Throughput & Caching
              </div>
              <p className="text-xs text-text-muted font-sans leading-relaxed">
                Cache-aside patterns, write-behind buffers, preventing thundering herds, and sliding window rate limiting for high traffic.
              </p>
            </Link>
          </div>
        </div>

        {/* 3. Featured Real-World Architectures */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-sans font-semibold text-foreground">
                Featured Production Blueprints
              </h2>
              <p className="text-xs text-text-muted font-sans">
                Full-scale topologies that can be loaded directly into your NXTQR workspace with one click.
              </p>
            </div>
            <Link href="/tutorial/system-design/examples">
              <Button variant="ghost" size="sm" className="font-mono text-xs text-text-muted hover:text-foreground gap-1">
                <span>View All 12 Blueprints</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examples.map((ex) => (
              <div
                key={ex.id}
                className="p-4 rounded-md bg-surface-01 border border-border-default hover:border-border-hover transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[9px] border-border-default text-text-muted">
                      {ex.category}
                    </Badge>
                    <span className="font-mono text-[10px] text-text-disabled">
                      {ex.difficulty}
                    </span>
                  </div>
                  <Link
                    href={`/tutorial/system-design/examples/${ex.slug}`}
                    className="block font-sans text-sm font-semibold text-foreground hover:underline"
                  >
                    {ex.title}
                  </Link>
                  <p className="text-xs text-text-muted font-sans line-clamp-2 leading-relaxed">
                    {ex.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                  <span className="font-mono text-[10px] text-text-disabled">
                    {ex.graphDocument.nodes.length} nodes • {ex.graphDocument.edges.length} edges
                  </span>
                  <Link href={`/tutorial/system-design/examples/${ex.slug}`}>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] font-mono border-border-default gap-1">
                      <span>Explore Blueprint</span>
                      <ChevronRightIcon className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Complete 20 Categories Catalog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-sans font-semibold text-foreground">
                All 20 Infrastructure Categories
              </h2>
              <p className="text-xs text-text-muted font-sans">
                Browse our comprehensive catalog of 223 infrastructure components organized by architectural responsibility.
              </p>
            </div>
            <Link href="/tutorial/system-design/components">
              <Button variant="outline" size="sm" className="font-mono text-xs gap-1 border-border-default text-text-secondary">
                <CpuIcon className="w-3.5 h-3.5" />
                <span>Catalog Directory</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categoryGroups.map((group) => (
              <Link
                key={group.category.id}
                href={`/tutorial/system-design/categories/${group.category.id}`}
                className="p-3.5 rounded-md bg-surface-01 border border-border-default hover:border-border-hover hover:bg-surface-02 transition-colors flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-text-disabled">
                      Cat {group.category.order < 10 ? `0${group.category.order}` : group.category.order}
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4 border-border-default text-text-muted">
                      {group.count}
                    </Badge>
                  </div>
                  <div className="font-sans text-xs font-semibold text-foreground group-hover:underline">
                    {group.category.name}
                  </div>
                  <p className="text-[11px] font-sans text-text-muted line-clamp-2 mt-1 leading-snug">
                    {group.category.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 font-mono text-[10px] text-text-disabled pt-1">
                  <span>Explore category</span>
                  <ChevronRightIcon className="w-3 h-3 text-text-disabled group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </TutorialShell>
  );
}
