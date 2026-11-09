"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  TerminalIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  SettingsIcon,
} from "@nxtqr/icons";
import Link from "next/link";

interface EnvVarItem {
  name: string;
  purpose: string;
  required: boolean;
  target: "Client" | "Server";
  example: string;
}

const ENV_VARS: EnvVarItem[] = [
  {
    name: "NEXT_PUBLIC_SITE_URL",
    purpose: "Canonical URL for metadata, OpenGraph tags, and auth redirect URLs.",
    required: false,
    target: "Client",
    example: "http://localhost:3000",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    purpose: "Supabase project endpoint URL for client sessions and real-time sockets.",
    required: false,
    target: "Client",
    example: "http://127.0.0.1:54321",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    purpose: "Public anonymous API key for browser client authentication.",
    required: false,
    target: "Client",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    purpose: "Privileged server-side key for background jobs and admin migrations. NEVER expose to client.",
    required: false,
    target: "Server",
    example: "[REDACTED_SERVER_SECRET]",
  },
  {
    name: "NODE_ENV",
    purpose: "Runtime environment identifier.",
    required: false,
    target: "Server",
    example: "development",
  },
];

interface TroubleshootingItem {
  id: string;
  problem: string;
  symptom: string;
  solution: string;
  command?: string;
}

const TROUBLESHOOTING: TroubleshootingItem[] = [
  {
    id: "pnpm-lock",
    problem: "Frozen lockfile or workspace linking failure",
    symptom: "ERR_PNPM_LOCKFILE_CONFIG_MISMATCH or package resolution error on pnpm install",
    solution: "Re-link local workspace dependencies and ensure pnpm version is >= 9.x.",
    command: "pnpm store prune && pnpm install",
  },
  {
    id: "port-conflict",
    problem: "Port 3000 already in use",
    symptom: "Error: listen EADDRINUSE: address already in use :::3000",
    solution: "Run Next.js on an alternate port or terminate the lingering dev process.",
    command: "pnpm --filter @nxtqr/web dev -- -p 3001",
  },
  {
    id: "supabase-offline",
    problem: "Diagnostics /verify reports Database Connectivity warning",
    symptom: "Live daemon warning on port 54322; PostgreSQL socket unreachable",
    solution: "Start the local Supabase Docker stack, or provide remote credentials in .env.local.",
    command: "npx supabase start",
  },
  {
    id: "turbo-cache",
    problem: "Turborepo build cache stale after branch checkout",
    symptom: "TypeScript or lint checks replaying cached failures unexpectedly",
    solution: "Bypass Turborepo remote/local cache and execute a clean typecheck across all workspaces.",
    command: "pnpm typecheck --force",
  },
];

export function InstallationSteps() {
  const [activeStep, setActiveStep] = React.useState<number>(1);
  const [expandedTroubleshoot, setExpandedTroubleshoot] = React.useState<string | null>(null);

  const steps = [
    { num: 1, title: "Prerequisites" },
    { num: 2, title: "Clone & Install" },
    { num: 3, title: "Environment" },
    { num: 4, title: "Development Run" },
    { num: 5, title: "Diagnostics Verification" },
  ];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">NXTQR Installation & Environment Orchestration</span>
            <span className="sm:hidden">Monorepo Installation</span>
          </h3>

          <Link href="/verify" className="shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-xs font-mono gap-1.5 whitespace-nowrap">
              <span className="hidden sm:inline">Open /verify</span>
              <span className="sm:hidden">/verify</span>
              <ExternalLinkIcon className="h-3 w-3 text-muted-foreground" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Follow the guided steps below to set up the complete monorepo workspace and verify all services.
        </p>
      </div>

      {/* Step Tabs Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {steps.map((st) => (
          <button
            key={st.num}
            onClick={() => setActiveStep(st.num)}
            className={cn(
              "p-2.5 rounded-md border text-left transition-all select-none",
              activeStep === st.num
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-border bg-elevated-surface hover:border-muted-border hover:bg-secondary-surface"
            )}
          >
            <div className="text-[10px] font-mono text-muted-foreground font-bold mb-0.5">
              STEP 0{st.num}
            </div>
            <div className="text-xs font-semibold font-sans text-foreground truncate">
              {st.title}
            </div>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-md border border-subtle-border bg-black p-4 sm:p-5 space-y-4">
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold font-sans text-foreground flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Step 1: System Prerequisites</span>
                <span className="sm:hidden">Step 1: Prerequisites</span>
              </h4>
              <p className="text-xs text-muted-foreground font-sans">
                Verify that your local environment satisfies the minimum engine specifications:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-surface border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase block font-bold">Node.js Engine</span>
                <span className="text-foreground font-bold text-sm">&gt;= 20.10.0 LTS</span>
                <span className="text-[10px] text-muted-foreground block">Verified with v20 and v22</span>
              </div>
              <div className="p-3 rounded bg-surface border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase block font-bold">Package Manager</span>
                <span className="text-foreground font-bold text-sm">pnpm &gt;= 9.x</span>
                <span className="text-[10px] text-muted-foreground block">Mandatory monorepo manager</span>
              </div>
              <div className="p-3 rounded bg-surface border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase block font-bold">Version Control</span>
                <span className="text-foreground font-bold text-sm">Git &gt;= 2.30</span>
                <span className="text-[10px] text-muted-foreground block">Standard Git client</span>
              </div>
            </div>

            <CodeBlock
              code={`# Check local engine versions
node --version # should output >= v20.10.0
pnpm --version # should output >= 9.x
git --version`}
              language="bash"
              filename="check-prerequisites.sh"
            />
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold font-sans text-foreground flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 text-accent shrink-0" />
                <span className="hidden sm:inline">Step 2: Clone & Install Dependencies</span>
                <span className="sm:hidden">Step 2: Clone & Install</span>
              </h4>
              <p className="text-xs text-muted-foreground font-sans">
                Clone the repository and run pnpm to link all 29 monorepo workspaces:
              </p>
            </div>

            <CodeBlock
              code={`# 1. Clone the repository
git clone https://github.com/your-org/nxtqr.git
cd nxtqr

# 2. Install dependencies across all 29 workspaces
pnpm install`}
              language="bash"
              filename="clone-and-install.sh"
            />
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold font-sans text-foreground flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-accent shrink-0" />
                <span className="hidden sm:inline">Step 3: Environment Variables Configuration</span>
                <span className="sm:hidden">Step 3: Environment (.env)</span>
              </h4>
              <p className="text-xs text-muted-foreground font-sans">
                Create an <code>.env.local</code> file in <code>apps/web/</code>. Never commit secret credentials:
              </p>
            </div>

            {/* Table of environment variables */}
            <div className="rounded-md border border-border overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border bg-surface text-muted-foreground text-[10px] uppercase">
                    <th className="p-2.5">Variable Name</th>
                    <th className="p-2.5">Target</th>
                    <th className="p-2.5">Purpose</th>
                    <th className="p-2.5">Development Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-border">
                  {ENV_VARS.map((env) => (
                    <tr key={env.name} className="hover:bg-surface/50">
                      <td className="p-2.5 text-accent font-semibold">{env.name}</td>
                      <td className="p-2.5 text-muted-foreground">{env.target}</td>
                      <td className="p-2.5 text-foreground/80 font-sans text-[11px]">{env.purpose}</td>
                      <td className="p-2.5 text-muted-foreground text-[11px] truncate max-w-[160px]">{env.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CodeBlock
              code={`# apps/web/.env.local template
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=development`}
              language="bash"
              filename="apps/web/.env.local"
            />
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold font-sans text-foreground flex items-center gap-2">
                <TerminalIcon className="h-4 w-4 text-accent shrink-0" />
                <span className="hidden sm:inline">Step 4: Launching Development Services</span>
                <span className="sm:hidden">Step 4: Development Run</span>
              </h4>
              <p className="text-xs text-muted-foreground font-sans">
                Start the Next.js web application and optionally launch background Cloudflare workers:
              </p>
            </div>

            <CodeBlock
              code={`# Start the Next.js development server (default port: 3000)
pnpm dev

# Or start web app only
pnpm --filter @nxtqr/web dev

# In another terminal, run workers dev daemon (optional)
pnpm workers:dev`}
              language="bash"
              filename="start-dev.sh"
            />
          </div>
        )}

        {activeStep === 5 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold font-sans text-foreground flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Step 5: Automated Verification & Health Checks</span>
                <span className="sm:hidden">Step 5: Verification</span>
              </h4>
              <p className="text-xs text-muted-foreground font-sans">
                Verify compiler integrity, unit tests, and live architecture diagnostics:
              </p>
            </div>

            <CodeBlock
              code={`# 1. Monorepo TypeScript check (27 workspaces)
pnpm typecheck

# 2. Run unit test suite (vitest)
pnpm test:unit

# 3. Inspect live runtime diagnostics console in browser
open http://localhost:3000/verify`}
              language="bash"
              filename="verify.sh"
            />
          </div>
        )}
      </div>

      {/* Real Troubleshooting Collapsible Drawer */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span>
            <span className="hidden sm:inline">Troubleshooting & Remediation Guidance</span>
            <span className="sm:hidden">Troubleshooting</span>
          </span>
          <span className="text-[10px] text-muted-foreground">{TROUBLESHOOTING.length} Scenarios</span>
        </div>

        <div className="space-y-1.5">
          {TROUBLESHOOTING.map((t) => {
            const isExpanded = expandedTroubleshoot === t.id;
            return (
              <div
                key={t.id}
                className="rounded-md border border-border bg-elevated-surface overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedTroubleshoot(isExpanded ? null : t.id)}
                  className="w-full p-3 text-left flex items-center justify-between gap-3 text-xs font-mono hover:bg-secondary-surface select-none"
                >
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>{t.problem}</span>
                  </div>
                  <ChevronDownIcon
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 shrink-0",
                      isExpanded && "rotate-180 text-accent"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="p-3 border-t border-subtle-border bg-black/60 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground text-[10px] block uppercase">Symptom:</span>
                      <span className="text-red-400 text-[11px]">{t.symptom}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block uppercase">Solution:</span>
                      <p className="text-foreground/90 font-sans text-xs">{t.solution}</p>
                    </div>
                    {t.command && (
                      <div className="pt-1">
                        <CodeBlock code={t.command} language="bash" filename="remediation.sh" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
