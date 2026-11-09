"use client";

import * as React from "react";
import {
  WorkspaceLayout,
  WorkspacePanel,
  useShellStore,
} from "@/features/app-shell";
import { Button, Badge } from "@nxtqr/ui";
import {
  SlidersIcon,
  TerminalIcon,
  CheckCircleIcon,
  CpuIcon,
  DatabaseIcon,
  ActivityIcon,
  PlusIcon,
} from "@nxtqr/icons";

export default function WorkspacePage() {
  const secondaryPanelOpen = useShellStore((s) => s.secondaryPanelOpen);
  const toggleSecondaryPanel = useShellStore((s) => s.toggleSecondaryPanel);
  const bottomPanelOpen = useShellStore((s) => s.bottomPanelOpen);
  const toggleBottomPanel = useShellStore((s) => s.toggleBottomPanel);

  const [selectedNode, setSelectedNode] = React.useState<string>("gateway-01");

  // Sample engineering palette entities (for future visualizer interaction)
  const paletteCategories = [
    {
      category: "Compute & Ingress",
      items: [
        { id: "gateway-01", name: "API Gateway", icon: CpuIcon, meta: "HTTP/gRPC · Envoy" },
        { id: "auth-svc", name: "Auth Service", icon: CpuIcon, meta: "JWT / RBAC Worker" },
        { id: "worker-pool", name: "Worker Pool", icon: CpuIcon, meta: "8x Goroutines · Tokio" },
      ],
    },
    {
      category: "Data & Storage",
      items: [
        { id: "postgres-primary", name: "PostgreSQL Primary", icon: DatabaseIcon, meta: "ACID · RLS Protected" },
        { id: "redis-cache", name: "Redis L2 Cache", icon: DatabaseIcon, meta: "Sub-ms In-Memory" },
      ],
    },
    {
      category: "Telemetry & Pipeline",
      items: [
        { id: "kafka-bus", name: "Event Bus (Kafka)", icon: ActivityIcon, meta: "Partitioned Stream" },
      ],
    },
  ];

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-background">
      <WorkspaceLayout
        leftPanel={
          <WorkspacePanel
            headerProps={{
              title: "Palette",
              icon: <CpuIcon className="h-3.5 w-3.5" />,
              badge: (
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] px-1 py-0 h-4 rounded-md border-border-subtle text-text-muted"
                >
                  6 Nodes
                </Badge>
              ),
              actions: (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-md text-text-muted hover:text-foreground"
                  aria-label="Add custom node"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </Button>
              ),
            }}
          >
            <div className="p-2 space-y-4 font-mono text-xs select-none">
              {paletteCategories.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="px-2 text-[10px] uppercase font-semibold text-text-muted tracking-wider">
                    {cat.category}
                  </div>
                  <div className="space-y-1">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedNode === item.id;
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedNode(item.id)}
                          onKeyDown={(e) => e.key === "Enter" && setSelectedNode(item.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-surface-04 border-border-strong text-foreground shadow-level-1 font-semibold"
                              : "bg-surface-01 border-border-default hover:bg-surface-02 text-text-secondary hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-text-muted" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate text-xs">{item.name}</span>
                            <span className="text-[10px] text-text-muted truncate">{item.meta}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </WorkspacePanel>
        }
        mainContent={
          <div className="relative h-full w-full flex flex-col bg-surface-00 overflow-hidden">
            {/* Canvas Toolbar Bar */}
            <div className="h-9 px-3 border-b border-border-default bg-surface-01 shrink-0 flex items-center justify-between text-xs font-mono select-none">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  Canvas: System Architecture
                </span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted text-[11px]">Zoom: 100%</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted text-[11px]">Grid: Precision Snap (16px)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant={bottomPanelOpen ? "default" : "outline"}
                  size="sm"
                  onClick={toggleBottomPanel}
                  className="h-6 px-2 text-[10px] font-mono rounded-md gap-1"
                >
                  <TerminalIcon className="h-3 w-3" />
                  <span>Trace</span>
                </Button>

                <Button
                  variant={secondaryPanelOpen ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSecondaryPanel}
                  className="h-6 px-2 text-[10px] font-mono rounded-md gap-1"
                >
                  <SlidersIcon className="h-3 w-3" />
                  <span>Inspector</span>
                </Button>
              </div>
            </div>

            {/* Canvas Viewport (Engineering Grid Background) */}
            <div
              className="flex-1 relative flex items-center justify-center p-8 overflow-hidden"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #262626 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              {/* Studio Canvas Status Card */}
              <div className="max-w-md w-full p-5 rounded-md border border-border-default bg-surface-01 shadow-level-2 select-none space-y-3">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                      Interactive Workspace Ready
                    </span>
                  </div>
                  <Badge variant="outline" className="font-mono text-[9px] text-text-muted rounded-md">
                    Phase 02
                  </Badge>
                </div>

                <p className="font-sans text-xs text-text-muted leading-relaxed">
                  The persistent resizable shell, topbar navigation, multi-panel workspace system, and
                  command palette are fully active. Future visualizer engines (System Design, Networking,
                  and Traces) mount inside this viewport.
                </p>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">HOTKEY: PALETTE</span>
                    <span className="text-foreground font-semibold">Ctrl + K</span>
                  </div>
                  <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">HOTKEY: SIDEBAR</span>
                    <span className="text-foreground font-semibold">Ctrl + B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        rightPanel={
          <WorkspacePanel
            headerProps={{
              title: "Inspector",
              icon: <SlidersIcon className="h-3.5 w-3.5" />,
              badge: (
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] px-1 py-0 h-4 rounded-md border-border-subtle text-emerald-400"
                >
                  ACTIVE
                </Badge>
              ),
              onClose: toggleSecondaryPanel,
            }}
          >
            <div className="p-3 space-y-4 font-mono text-xs select-none">
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                  SELECTED NODE
                </span>
                <span className="text-sm font-bold text-foreground uppercase">
                  {selectedNode}
                </span>
              </div>

              <div className="space-y-2 border-t border-border-subtle pt-3">
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">
                  Parameters
                </span>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-md bg-surface-02 border border-border-subtle">
                    <span className="text-text-muted">Concurrency Limit</span>
                    <span className="text-foreground font-semibold">1,024 req/s</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-surface-02 border border-border-subtle">
                    <span className="text-text-muted">Heap Budget</span>
                    <span className="text-foreground font-semibold">512 MB</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-surface-02 border border-border-subtle">
                    <span className="text-text-muted">Timeout Constraint</span>
                    <span className="text-foreground font-semibold">250 ms</span>
                  </div>
                </div>
              </div>
            </div>
          </WorkspacePanel>
        }
        bottomPanel={
          <WorkspacePanel
            headerProps={{
              title: "Execution Trace & Studio Logs",
              icon: <TerminalIcon className="h-3.5 w-3.5" />,
              onClose: toggleBottomPanel,
              actions: (
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] text-text-muted h-5 px-1.5 rounded-md"
                >
                  Live Telemetry
                </Badge>
              ),
            }}
          >
            <div className="p-3 font-mono text-[11px] space-y-1 text-text-secondary select-none">
              <div className="flex items-center gap-2">
                <span className="text-text-muted">[16:40:02.102]</span>
                <span className="text-emerald-400">INFO</span>
                <span>Workspace shell mounted. Layout preferences loaded from local storage.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">[16:40:02.189]</span>
                <span className="text-blue-400">SYSTEM</span>
                <span>Multi-panel resizable layout synchronized. Hit area margins: 8px.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">[16:40:02.245]</span>
                <span className="text-emerald-400">INFO</span>
                <span>Keyboard shortcuts registered: Ctrl+K (command palette), Ctrl+B (sidebar).</span>
              </div>
            </div>
          </WorkspacePanel>
        }
      />
    </div>
  );
}
