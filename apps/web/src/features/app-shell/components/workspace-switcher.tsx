"use client";

import * as React from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@nxtqr/ui";
import { ChevronDownIcon, CheckIcon, FolderIcon, PlusIcon } from "@nxtqr/icons";
import { useShellStore } from "../store/shell-store";
import { cn } from "@nxtqr/utils";

export interface WorkspaceOption {
  id: string;
  name: string;
  role: string;
}

export interface WorkspaceSwitcherProps {
  variant?: "button" | "breadcrumb";
  className?: string;
}

const LOCAL_WORKSPACES: WorkspaceOption[] = [
  { id: "default", name: "Engineering Studio", role: "Primary" },
  { id: "distributed-systems", name: "Distributed Systems Lab", role: "Local" },
  { id: "runtime-verification", name: "Runtime Verification Gate", role: "Audit" },
];

export function WorkspaceSwitcher({
  variant = "button",
  className,
}: WorkspaceSwitcherProps = {}) {
  const activeWorkspaceId = useShellStore((s) => s.activeWorkspaceId);

  const [currentId, setCurrentId] = React.useState(activeWorkspaceId);

  const active =
    LOCAL_WORKSPACES.find((w) => w.id === currentId) ?? LOCAL_WORKSPACES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "breadcrumb" ? (
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 py-1 px-1.5 -ml-1 rounded-md font-sans text-xs font-semibold text-text-secondary hover:text-foreground hover:bg-surface-02 transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong truncate max-w-[130px] sm:max-w-[180px] md:max-w-[220px]",
              className
            )}
            aria-label="Switch workspace"
          >
            <FolderIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span className="truncate">{active.name}</span>
            <ChevronDownIcon className="h-3 w-3 text-text-muted shrink-0" />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-2.5 font-mono text-xs gap-2 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 text-foreground shadow-level-1 active:shadow-level-3 shrink-0 select-none max-w-[200px]",
              className
            )}
            aria-label="Switch workspace"
          >
            <FolderIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span className="truncate font-medium">{active.name}</span>
            <ChevronDownIcon className="h-3 w-3 text-text-muted shrink-0 ml-auto" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-56 rounded-md border border-border-strong bg-surface-02 p-1.5 shadow-level-2"
      >
        <DropdownMenuLabel className="px-2.5 py-1 text-[10px] font-mono text-text-muted uppercase tracking-wider">
          Workspaces
        </DropdownMenuLabel>
        {LOCAL_WORKSPACES.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onClick={() => setCurrentId(w.id)}
            className="flex items-center justify-between text-xs font-mono rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-surface-04 text-foreground transition-colors"
          >
            <div className="flex flex-col min-w-0">
              <span className="truncate font-medium">{w.name}</span>
              <span className="text-[10px] text-text-muted">{w.role}</span>
            </div>
            {w.id === currentId && (
              <CheckIcon className="h-3.5 w-3.5 text-foreground shrink-0 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-1 bg-border-subtle" />
        <DropdownMenuItem
          disabled
          className="flex items-center gap-2 text-xs font-mono rounded-md px-2.5 py-1.5 text-text-muted opacity-50 cursor-not-allowed"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>New Workspace (Phase 03)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
