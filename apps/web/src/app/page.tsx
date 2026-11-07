"use client";

import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@nxtqr/ui";
import { useThemeStore } from "@nxtqr/state";
import { SettingsIcon, CheckCircleIcon } from "@nxtqr/icons";
import { AppLogo } from "@nxtqr/branding";

export default function RootVerificationPage() {
  const { themeMode, accentPreset, customHex } = useThemeStore();

  const activeColorLabel = customHex ? `Custom (${customHex})` : accentPreset;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col p-6 max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <AppLogo variant="symbol" size={32} />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              NXTQR — Engineering Foundation
            </h1>
            <p className="text-[11px] text-muted-foreground font-mono">
              Pure Monochrome · Solid Neumorphism · Developer-Crafted Interface
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/verify/brand">
            <Button variant="outline" size="sm" className="font-mono text-xs">
              Brand Review Gate →
            </Button>
          </Link>
          <Link href="/settings/theme">
            <Button variant="secondary" size="sm">
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
              <span className="font-mono text-[11px] text-muted-foreground capitalize">
                {themeMode}
              </span>
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
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Surface System</span>
              <span className="font-mono text-muted-foreground">Solid Neumorphic</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Platform Packages</CardTitle>
              <span className="font-mono text-[11px] text-muted-foreground">18 packages</span>
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
              <span className="font-mono text-[11px] text-muted-foreground">Supabase & CF</span>
            </div>
            <CardDescription>Auth, Relational DB & Queues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-subtle-border">
              <span className="text-muted-foreground">PostgreSQL & RLS</span>
              <span className="font-mono text-success">Configured</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-subtle-border">
              <span className="text-muted-foreground">Cloudflare Queues & R2</span>
              <span className="font-mono text-success">Provisioned</span>
            </div>
            <div className="pt-2">
              <Link
                href="/verify"
                className="text-accent text-[11px] hover:underline flex items-center gap-1"
              >
                Environment Diagnostics →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Component System Verification Bar */}
      <section className="rounded-md border border-border bg-surface shadow-level-1 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Solid-Neumorphic Component System Verification
          </h2>
          <span className="text-[10px] text-muted-foreground font-mono">
            Pure Monochrome · Levels 0–3 · rounded-md
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="default">Accent Primary</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost Button</Button>
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
