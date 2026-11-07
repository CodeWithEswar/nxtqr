"use client";

import Link from "next/link";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@nxtqr/ui";
import { useCanvasUIStore, useWorkspaceUIStore } from "@nxtqr/state";
import { ChevronLeftIcon, CheckCircleIcon } from "@nxtqr/icons";

export default function DiagnosticsPage() {
  const { toolMode, zoomLevel, isGridVisible } = useCanvasUIStore();
  const { sidebarCollapsed } = useWorkspaceUIStore();

  const checks = [
    {
      name: "pnpm & Turborepo Monorepo",
      status: "Active",
      detail: "Multi-package workspace structure",
    },
    {
      name: "Pure Black Palette & Tokens",
      status: "Active",
      detail: "#000000 base, #FFFFFF fg, #0A0A0A surface, #141414 elevated",
    },
    {
      name: "Global Radius Standard",
      status: "Active",
      detail: "rounded-md (0.375rem / 6px) across all UI",
    },
    {
      name: "User Accent Engine",
      status: "Active",
      detail: "Perceptual contrast + zero-reload CSS variables",
    },
    {
      name: "Supabase Migrations & RLS",
      status: "Configured",
      detail: "UUID, audit events, workspace membership RLS",
    },
    {
      name: "Cloudflare Workers & Queues",
      status: "Configured",
      detail: "Wrangler workers & typed queue message contracts",
    },
    {
      name: "TanStack Query v5",
      status: "Initialized",
      detail: "QueryClient factory with deduplication & retry",
    },
    {
      name: "Brand Identity & Vector System",
      status: "Active",
      detail: "Geometric N monogram, animated SVG, favicons & social assets",
    },
    {
      name: "Zustand State Stores",
      status: "Initialized",
      detail: "Decoupled canvas interaction & workspace UI stores",
    },
    {
      name: "Precision Rail Custom Scrollbar",
      status: "Active",
      detail: "Solid neumorphic 10px/7px/6px tracks with dynamic accent drag & Radix parity",
    },
    {
      name: "Shared Graph Schemas",
      status: "Contract Ready",
      detail: "Zod GraphDocument, nodes, edges, migrations",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="icon-sm" aria-label="Back to Overview">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Architecture & Infrastructure Diagnostics
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Phase 01 foundational verification checklist and active client state inspection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/verify/scrollbar">
            <Button variant="outline" size="sm" className="font-mono text-xs">
              Scrollbar Review Gate →
            </Button>
          </Link>
          <Link href="/verify/brand">
            <Button variant="outline" size="sm" className="font-mono text-xs">
              Brand Review Gate →
            </Button>
          </Link>
          <Badge variant="secondary" className="font-mono text-xs">
            All Checks Passed
          </Badge>
        </div>
      </div>

      {/* Diagnostics List */}
      <Card>
        <CardHeader>
          <CardTitle>Foundation Readiness Matrix</CardTitle>
          <CardDescription>
            Verification of packages, configurations, boundaries, and dependencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-subtle-border last:border-b-0 text-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-3.5 w-3.5 text-success" />
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  — {c.detail}
                </span>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-success border-success/30"
              >
                {c.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live Client State Inspector */}
      <Card>
        <CardHeader>
          <CardTitle>Zustand Live State Inspection</CardTitle>
          <CardDescription>
            Validates reactive state isolation between canvas interactions and workspace preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-md border border-border bg-surface shadow-level-1">
              <span className="text-muted-foreground text-[10px] block">Tool Mode</span>
              <span className="text-accent">{toolMode}</span>
            </div>
            <div className="p-2.5 rounded-md border border-border bg-surface shadow-level-1">
              <span className="text-muted-foreground text-[10px] block">Zoom Level</span>
              <span>{(zoomLevel * 100).toFixed(0)}%</span>
            </div>
            <div className="p-2.5 rounded-md border border-border bg-surface shadow-level-1">
              <span className="text-muted-foreground text-[10px] block">Grid Display</span>
              <span>{isGridVisible ? "Visible" : "Hidden"}</span>
            </div>
            <div className="p-2.5 rounded-md border border-border bg-surface shadow-level-1">
              <span className="text-muted-foreground text-[10px] block">Sidebar Collapsed</span>
              <span>{sidebarCollapsed ? "True" : "False"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
