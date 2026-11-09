"use client";

import * as React from "react";
import type { VerificationCheck, VerificationCategory } from "../schemas/verification.schema";
import { VerificationRow } from "./verification-row";
import {
  LayersIcon,
  SettingsIcon,
  DatabaseIcon,
  CpuIcon,
} from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";

export interface VerificationGroupProps {
  category: VerificationCategory;
  checks: VerificationCheck[];
  selectedCheckId: string | null;
  onSelectCheck: (id: string) => void;
}

const CATEGORY_METADATA: Record<
  VerificationCategory,
  { title: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  architecture: {
    title: "Monorepo & Architecture Foundation",
    description: "pnpm workspaces, Turborepo pipelines, strict package boundaries, and TypeScript compiler integrity.",
    icon: LayersIcon,
  },
  "design-system": {
    title: "Design System & Theming Tokens",
    description: "Pure black monochrome palette (#000000), rounded-md 6px radius, accent contrast engine, and brand vectors.",
    icon: SettingsIcon,
  },
  infrastructure: {
    title: "Data & Infrastructure Services",
    description: "Supabase client setup, live PostgreSQL connectivity, schema migrations, and Cloudflare Edge workers.",
    icon: DatabaseIcon,
  },
  frontend: {
    title: "Frontend & Shared State Systems",
    description: "TanStack Query v5 client, Zustand reactive stores, Zod graph schema validation, and UI component registry.",
    icon: CpuIcon,
  },
};

export function VerificationGroup({
  category,
  checks,
  selectedCheckId,
  onSelectCheck,
}: VerificationGroupProps) {
  if (checks.length === 0) return null;

  const meta = CATEGORY_METADATA[category] ?? {
    title: category,
    description: "",
    icon: LayersIcon,
  };

  const IconComp = meta.icon;
  const passedCount = checks.filter((c) => c.status === "passed").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const failedCount = checks.filter((c) => c.status === "failed").length;

  return (
    <section className="space-y-3">
      {/* Group Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-surface border border-border-default flex items-center justify-center text-foreground shrink-0 shadow-level-1">
            <IconComp className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold font-sans text-foreground uppercase tracking-wider truncate">
              {meta.title}
            </h2>
          </div>
        </div>

        {/* Group Counts */}
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          <Badge variant="outline" className="text-[10px] py-0 px-2 rounded-md border-border-subtle bg-surface-00 text-muted-foreground">
            {checks.length} Checks
          </Badge>
          {warningCount > 0 && (
            <span className="text-amber-400 font-bold">
              {warningCount} warn
            </span>
          )}
          {failedCount > 0 && (
            <span className="text-red-400 font-bold">
              {failedCount} fail
            </span>
          )}
          {passedCount === checks.length && (
            <span className="text-emerald-400 font-bold">
              All pass
            </span>
          )}
        </div>
      </div>

      {/* Group Checks Rows */}
      <div className="space-y-2">
        {checks.map((check) => (
          <VerificationRow
            key={check.id}
            check={check}
            isSelected={check.id === selectedCheckId}
            onSelect={() => onSelectCheck(check.id)}
          />
        ))}
      </div>
    </section>
  );
}
