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
import { useThemeStore } from "@nxtqr/state";
import { SettingsIcon, CheckCircleIcon } from "@nxtqr/icons";

export default function RootVerificationPage() {
  const { themeMode, accentPreset, customHex } = useThemeStore();

  const activeColorLabel = customHex ? `Custom (${customHex})` : accentPreset;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col p-6 max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center text-accent-foreground font-mono font-bold text-xs">
            N
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              NXTQR — Engineering Foundation
            </h1>
            <p className="text-[11px] text-muted-foreground font-mono">
              Phase 01: Core Monorepo, Infrastructure & Pure Black Theme
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-success mr-1.5 inline-block" />
            Foundation Active
          </Badge>
          <Link href="/settings/theme">
            <Button variant="outline" size="sm">
              <SettingsIcon className="h-3.5 w-3.5 mr-1.5" />
              Accent Settings
            </Button>
          </Link>
        </div>
      </header>

      {/* Verification Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Theme & Accent</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px] capitalize">
                {themeMode}
              </Badge>
            </div>
            <CardDescription>Pure Black Monochrome foundation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-subtle-border">
              <span className="text-muted-foreground">Active Accent</span>
              <span className="font-mono font-medium text-accent capitalize">
                {activeColorLabel}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-subtle-border">
              <span className="text-muted-foreground">Radius Token</span>
              <span className="font-mono text-muted-foreground">rounded-md (6px)</span>
            </div>
            <div className="pt-2">
              <Link
                href="/settings/theme"
                className="text-accent text-[11px] hover:underline flex items-center gap-1"
              >
                Customize Accent & Preview →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Platform Packages</CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                18 Packages
              </Badge>
            </div>
            <CardDescription>Modular Turborepo architecture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-foreground">
              <CheckCircleIcon className="h-3.5 w-3.5 text-success" />
              <span>@nxtqr/ui & shadcn primitives</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <CheckCircleIcon className="h-3.5 w-3.5 text-success" />
              <span>@nxtqr/design-system & color engine</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <CheckCircleIcon className="h-3.5 w-3.5 text-success" />
              <span>@nxtqr/graph-schema & visualizer contracts</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Infrastructure</CardTitle>
              <Badge variant="outline" className="font-mono text-[10px]">
                Supabase & CF
              </Badge>
            </div>
            <CardDescription>Auth, Relational DB & Queues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-subtle-border">
              <span className="text-muted-foreground">PostgreSQL & RLS</span>
              <span className="font-mono text-success">Configured</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-subtle-border">
              <span className="text-muted-foreground">Workers & Queues</span>
              <span className="font-mono text-muted-foreground">Wrangler Ready</span>
            </div>
            <div className="pt-2">
              <Link
                href="/verify"
                className="text-accent text-[11px] hover:underline flex items-center gap-1"
              >
                Run Environment Diagnostics →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Component System Verification Bar */}
      <section className="rounded-md border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Interactive Component System Verification
          </h2>
          <span className="text-[10px] text-muted-foreground font-mono">
            Pure Black Monochrome + Dynamic Accent
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="default">Accent Primary</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Badge variant="default">Accent Badge</Badge>
          <Badge variant="secondary">Secondary Badge</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Quick Nav Footprint */}
      <footer className="border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <Link href="/settings/theme" className="hover:text-foreground">
            Theme Engine
          </Link>
          <Link href="/verify" className="hover:text-foreground">
            Diagnostics
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Auth Verification
          </Link>
        </div>
        <span className="font-mono text-[11px]">NXTQR Platform Foundation v0.1.0</span>
      </footer>
    </main>
  );
}
