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
    <section className="space-y-2.5">
      {/* Group Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-accent">
            <IconComp className="h-3 w-3" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-sans text-foreground uppercase tracking-wider">
              {meta.title}
            </h2>
          </div>
        </div>

        {/* Group Counts */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-subtle-border bg-black text-muted-foreground">
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

      {/* Group Rows List */}
      <div className="space-y-1.5">
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

