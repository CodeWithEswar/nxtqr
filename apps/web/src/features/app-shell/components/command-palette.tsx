"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@nxtqr/ui";
import {
  PanelLeftIcon,
  RefreshIcon,
  SlidersIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";
import { useShellStore } from "../store/shell-store";
import { useExecutionStore } from "@/features/system-design/execution/store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { ALL_NAVIGATION_ITEMS } from "../config/navigation";

export function CommandPalette() {
  const router = useRouter();
  const open = useShellStore((s) => s.commandPaletteOpen);
  const setOpen = useShellStore((s) => s.setCommandPaletteOpen);
  const toggleSidebar = useShellStore((s) => s.toggleSidebar);
  const resetWorkspaceLayout = useShellStore((s) => s.resetWorkspaceLayout);
  const toggleSecondaryPanel = useShellStore((s) => s.toggleSecondaryPanel);
  const toggleUnifiedStudio = useExecutionStore((s) => s.toggleUnifiedStudio);
  const inspectTopologyCapabilities = useExecutionStore((s) => s.inspectTopologyCapabilities);
  const runCrossModulePipeline = useExecutionStore((s) => s.runCrossModulePipeline);

  const runCommand = React.useCallback(
    (action: () => void) => {
      setOpen(false);
      action();
    },
    [setOpen]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search workspace..." />
      <CommandList className="max-h-80 overflow-y-auto scrollbar-thin">
        <CommandEmpty className="py-6 text-center text-xs font-mono text-text-muted">
          No matching commands found.
        </CommandEmpty>

        {/* Navigation Group */}
        <CommandGroup heading="Navigation">
          {ALL_NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
              >
                <Icon className="h-4 w-4 text-text-muted" />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.shortLabel && (
                  <span className="text-[10px] text-text-muted">{item.href}</span>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Shell & Workspace Actions */}
        <CommandGroup heading="Shell & Workspace Actions">
          <CommandItem
            onSelect={() => runCommand(toggleSidebar)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <PanelLeftIcon className="h-4 w-4 text-text-muted" />
            <span className="flex-1 font-medium">Toggle Sidebar</span>
            <CommandShortcut>Ctrl+B</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(toggleSecondaryPanel)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <SlidersIcon className="h-4 w-4 text-text-muted" />
            <span className="flex-1 font-medium">Toggle Secondary Panel</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runCommand(resetWorkspaceLayout)}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <RefreshIcon className="h-4 w-4 text-text-muted" />
            <span className="flex-1 font-medium">Reset Workspace Layout</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Phase 05.4 Simulation Studio */}
        <CommandGroup heading="Simulation Studio (Phase 05.4)">
          <CommandItem
            onSelect={() => runCommand(() => toggleUnifiedStudio(true))}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <SlidersIcon className="h-4 w-4 text-text-muted" />
            <span className="flex-1 font-medium">Open Unified Simulation Studio</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                const { nodes, edges } = useGraphEditorStore.getState();
                inspectTopologyCapabilities(nodes, edges);
                toggleUnifiedStudio(true);
              })
            }
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <CheckCircleIcon className="h-4 w-4 text-text-muted" />
            <span className="flex-1 font-medium">Scan Topology Capabilities (24 Modules)</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                const { nodes, edges } = useGraphEditorStore.getState();
                if (nodes.length > 0) {
                  runCrossModulePipeline(nodes, edges, { incomingRps: 300, seed: 42 });
                } else {
                  toggleUnifiedStudio(true);
                }
              })
            }
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <CheckCircleIcon className="h-4 w-4 text-text-muted" />
            <span className="flex-1 font-medium">Run Cross-Module Pipeline</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Verification Gates */}
        <CommandGroup heading="Review Gates">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/verify/scrollbar"))}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
            <span className="flex-1 font-medium">Scrollbar Review Gate</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/verify/brand"))}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded-md cursor-pointer hover:bg-surface-03 transition-colors"
          >
            <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
            <span className="flex-1 font-medium">Brand Review Gate</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
