"use client";

import * as React from "react";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  LayersIcon,
  SearchIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
  TerminalIcon,
  DatabaseIcon,
  CpuIcon,
  SettingsIcon,
  ActivityIcon,
  ShieldIcon,
} from "@nxtqr/icons";

interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: "folder" | "package" | "file";
  responsibility?: string;
  prohibited?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: TreeNode[];
}

const REPOSITORY_TREE: TreeNode = {
  id: "root",
  name: "NXTQR Monorepo Root",
  path: "d:/NXTQR",
  type: "folder",
  children: [
    {
      id: "apps",
      name: "apps",
      path: "apps",
      type: "folder",
      children: [
        {
          id: "apps-web",
          name: "web (@nxtqr/web)",
          path: "apps/web",
          type: "package",
          badge: "Next.js 15",
          icon: TerminalIcon,
          responsibility: "Unified application shell, documentation platform, and visualizer feature modules.",
          prohibited: "Do not create separate Next.js applications for each visualizer. Consolidate within apps/web.",
          children: [
            { id: "web-src-app", name: "src/app (App Router routes & layouts)", path: "apps/web/src/app", type: "folder" },
            { id: "web-src-features", name: "src/features (Domain modules & shared visualizers)", path: "apps/web/src/features", type: "folder" },
            { id: "web-content-docs", name: "content/docs (MDX technical documentation)", path: "apps/web/content/docs", type: "folder" },
          ],
        },
      ],
    },
    {
      id: "packages",
      name: "packages",
      path: "packages",
      type: "folder",
      children: [
        {
          id: "pkg-ui",
          name: "@nxtqr/ui",
          path: "packages/ui",
          type: "package",
          badge: "37 Primitives",
          icon: LayersIcon,
          responsibility: "Primitives & composite components based on shadcn/ui and Radix UI.",
          prohibited: "Business logic, direct DB calls, API requests, fetch operations.",
        },
        {
          id: "pkg-design-system",
          name: "@nxtqr/design-system",
          path: "packages/design-system",
          type: "package",
          badge: "Tokens & Math",
          icon: SettingsIcon,
          responsibility: "Tokens, color contrast calculations (WCAG 2.1), typography, scrollbar, motion physics.",
          prohibited: "React state management, DOM event listeners, business components.",
        },
        {
          id: "pkg-icons",
          name: "@nxtqr/icons",
          path: "packages/icons",
          type: "package",
          badge: "Hugeicons",
          icon: ActivityIcon,
          responsibility: "Standardized Hugeicons wrappers with 1.5px stroke width and 16px default size.",
          prohibited: "Lucide icons, Heroicons, raw emoji, ad-hoc inline SVGs.",
        },
        {
          id: "pkg-graph-schema",
          name: "@nxtqr/graph-schema",
          path: "packages/graph-schema",
          type: "package",
          badge: "Zod Contracts",
          icon: ShieldIcon,
          responsibility: "Discriminated union Zod schemas for nodes, edges, documents, and simulation configs.",
          prohibited: "React Flow internal instance types, rendering code, DOM logic.",
        },
        {
          id: "pkg-canvas-core",
          name: "@nxtqr/canvas-core",
          path: "packages/canvas-core",
          type: "package",
          badge: "Math Engine",
          icon: CpuIcon,
          responsibility: "Coordinate conversions, zoom bounds (0.2x–2.5x), grid snapping, bounding box math.",
          prohibited: "UI presentation logic, CSS styles, JSX rendering.",
        },
        {
          id: "pkg-node-registry",
          name: "@nxtqr/node-registry",
          path: "packages/node-registry",
          type: "package",
          badge: "7 Archetypes",
          icon: LayersIcon,
          responsibility: "Standard node archetype definitions: input, process, decision, service, database, queue, output.",
          prohibited: "State management stores, database queries.",
        },
        {
          id: "pkg-simulation-core",
          name: "@nxtqr/simulation-core",
          path: "packages/simulation-core",
          type: "package",
          badge: "Deterministic Runner",
          icon: CpuIcon,
          responsibility: "Deterministic simulation runner, topological dependency stepping, event emission.",
          prohibited: "React hooks, direct canvas DOM manipulation.",
        },
        {
          id: "pkg-execution-trace",
          name: "@nxtqr/execution-trace",
          path: "packages/execution-trace",
          type: "package",
          badge: "Telemetry Engine",
          icon: TerminalIcon,
          responsibility: "Chronological event stream filtering, keyword queries, relative timestamp formatting.",
          prohibited: "Direct canvas node mutation.",
        },
        {
          id: "pkg-state",
          name: "@nxtqr/state",
          path: "packages/state",
          type: "package",
          badge: "Zustand Stores",
          icon: SettingsIcon,
          responsibility: "Decoupled Zustand stores for client-only reactive UI and studio interaction state.",
          prohibited: "Server datasets, database cache, un-persisted credentials.",
        },
        {
          id: "pkg-database",
          name: "@nxtqr/database",
          path: "packages/database",
          type: "package",
          badge: "Supabase SSR",
          icon: DatabaseIcon,
          responsibility: "Supabase SSR clients, generated DB types, and workspace membership queries.",
          prohibited: "UI presentation components, raw SQL in browser.",
        },
        {
          id: "pkg-validation",
          name: "@nxtqr/validation",
          path: "packages/validation",
          type: "package",
          badge: "Size & Payload Guards",
          icon: ShieldIcon,
          responsibility: "Source-of-truth Zod validation schemas and payload size guards (assertPayloadSize).",
          prohibited: "Complex runtime side-effects.",
        },
        {
          id: "pkg-branding",
          name: "@nxtqr/branding",
          path: "packages/branding",
          type: "package",
          badge: "Brand Identity",
          icon: ActivityIcon,
          responsibility: "Official brand vectors, AppLogo, AnimatedLogo, wordmark typography.",
          prohibited: "Functional UI icons, domain logic, DB calls, QR terminology.",
        },
      ],
    },
    {
      id: "workers",
      name: "workers",
      path: "workers",
      type: "folder",
      children: [
        {
          id: "wkr-api",
          name: "api (nxtqr-worker-api)",
          path: "workers/api",
          type: "package",
          badge: "Cloudflare Edge",
          icon: TerminalIcon,
          responsibility: "Edge API gateway, rate limiting, and simulation job producer queue bindings.",
        },
        {
          id: "wkr-simulation",
          name: "simulation (nxtqr-worker-simulation)",
          path: "workers/simulation",
          type: "package",
          badge: "Background Queue",
          icon: CpuIcon,
          responsibility: "Long-running asynchronous simulation job consumer.",
        },
        {
          id: "wkr-dispatcher",
          name: "dispatcher (nxtqr-worker-dispatcher)",
          path: "workers/dispatcher",
          type: "package",
          badge: "Event Router",
          icon: ActivityIcon,
          responsibility: "Event streaming and dispatching to registered webhooks.",
        },
      ],
    },
    {
      id: "supabase",
      name: "supabase",
      path: "supabase",
      type: "folder",
      children: [
        {
          id: "sub-migrations",
          name: "migrations (20261107000001_initial_schema.sql)",
          path: "supabase/migrations",
          type: "folder",
          badge: "Postgres DDL",
          responsibility: "PostgreSQL tables (workspaces, members, audit_events) and strict RLS policies.",
        },
        {
          id: "sub-tests",
          name: "tests (rls_test.sql)",
          path: "supabase/tests",
          type: "folder",
          badge: "RLS Test Suite",
          responsibility: "Automated pgTAP/SQL tests verifying tenant isolation and security boundaries.",
        },
      ],
    },
    {
      id: "tests",
      name: "tests",
      path: "tests",
      type: "folder",
      children: [
        {
          id: "tst-e2e",
          name: "e2e (Playwright test suites)",
          path: "tests/e2e",
          type: "folder",
          badge: "Playwright",
          responsibility: "End-to-end browser tests verifying foundations, visualizer components, and diagnostics.",
        },
      ],
    },
  ],
};

export function RepositoryTree() {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    new Set(["apps", "packages", "apps-web"])
  );
  const [selectedNode, setSelectedNode] = React.useState<TreeNode>(
    REPOSITORY_TREE.children![1].children![0] // @nxtqr/ui
  );
  const [search, setSearch] = React.useState<string>("");
  const [copied, setCopied] = React.useState<boolean>(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyPath = async () => {
    if (!selectedNode) return;
    try {
      await navigator.clipboard.writeText(selectedNode.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const renderTree = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const IconComponent = node.icon ?? LayersIcon;

    // Filter match check
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSelf = node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);
      const matchesChild = node.children?.some(
        (c) => c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q)
      );
      if (!matchesSelf && !matchesChild && node.id !== "root") {
        return null;
      }
    }

    if (node.id === "root") {
      return (
        <div className="space-y-1">
          {node.children?.map((child) => renderTree(child, depth))}
        </div>
      );
    }

    return (
      <div key={node.id} className="space-y-1 select-none">
        <div
          onClick={() => {
            if (hasChildren) toggleExpand(node.id);
            setSelectedNode(node);
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={cn(
            "p-1.5 rounded-md text-xs font-mono flex items-center justify-between gap-2 cursor-pointer transition-all",
            isSelected
              ? "border border-accent bg-accent/10 text-foreground ring-1 ring-accent font-semibold"
              : "border border-transparent hover:bg-elevated-surface text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <span className="p-0.5 text-muted-foreground">
                {isExpanded ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}
              </span>
            ) : (
              <span className="w-4 inline-block" />
            )}
            <IconComponent className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-accent" : "text-muted-foreground")} />
            <span className="truncate">{node.name}</span>
          </div>

          {node.badge && (
            <Badge variant="outline" className="text-[9px] py-0 px-1 border-subtle-border bg-black text-muted-foreground shrink-0">
              {node.badge}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children!.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold font-sans text-foreground">
              NXTQR Monorepo Architecture Explorer
            </h3>
            <Badge
              variant="outline"
              className="border-accent/40 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-wider"
            >
              29 Workspaces
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Interactive repository directory tree. Click any package or folder to inspect its architectural ownership and boundary constraints.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedIds(new Set(["apps", "packages", "workers", "supabase", "tests", "apps-web"]))}
            className="h-7 text-xs font-mono"
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedIds(new Set())}
            className="h-7 text-xs font-mono"
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Tree Explorer, Right Boundary Spec */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Tree Explorer (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          {/* Quick Filter */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search packages, folders, or files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-md border border-border bg-black text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Tree Scroll Container */}
          <div className="rounded-md border border-border bg-black/60 p-2 max-h-[380px] overflow-y-auto scrollbar-dense">
            {renderTree(REPOSITORY_TREE)}
          </div>
        </div>

        {/* Right Boundary & Responsibility Inspector (5 cols) */}
        <div className="lg:col-span-5 rounded-md border border-border bg-elevated-surface p-4 space-y-3 font-mono text-xs shadow-level-1">
          <div className="flex items-start justify-between gap-2 border-b border-subtle-border pb-3">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Package / Target:</span>
              <div className="text-sm font-bold text-foreground font-sans mt-0.5">{selectedNode.name}</div>
            </div>
            <button
              onClick={handleCopyPath}
              className="flex items-center gap-1 text-[10px] p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary-surface transition-colors"
              title="Copy path"
            >
              {copied ? <CheckIcon className="h-3 w-3 text-emerald-400" /> : <CopyIcon className="h-3 w-3" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy Path"}</span>
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Filesystem Path:</span>
            <div className="p-2 rounded bg-black border border-border text-[11px] text-accent truncate">
              {selectedNode.path}
            </div>
          </div>

          {selectedNode.responsibility && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Architectural Responsibility:</span>
              <p className="text-foreground/90 font-sans text-xs leading-relaxed p-2.5 rounded bg-surface border border-border">
                {selectedNode.responsibility}
              </p>
            </div>
          )}

          {selectedNode.prohibited && (
            <div className="space-y-1">
              <span className="text-[10px] text-red-400 uppercase tracking-wider block font-bold">
                Constitution Prohibited Contents (AGENTS.md):
              </span>
              <p className="text-foreground/90 font-sans text-xs leading-relaxed p-2.5 rounded bg-red-950/20 border border-red-900/40">
                {selectedNode.prohibited}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
