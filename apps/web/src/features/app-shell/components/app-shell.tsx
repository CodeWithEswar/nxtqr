"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";
import { MobileNavigation } from "./mobile-navigation";
import { CommandPalette } from "./command-palette";
import { ShellErrorBoundary } from "./shell-error-boundary";
import { useShellStore } from "../store/shell-store";
import { useCommandShortcuts } from "../hooks/use-command-shortcuts";
import { cn } from "@nxtqr/utils";

export interface AppShellProps {
  children: React.ReactNode;
  topbarActions?: React.ReactNode;
  className?: string;
}

export function AppShell({ children, topbarActions, className }: AppShellProps) {
  const initializeFromStorage = useShellStore((s) => s.initializeFromStorage);

  // Initialize layout preferences from storage on mount (avoids hydration mismatch)
  React.useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  // Register global shortcuts: Ctrl+K (command palette), Ctrl+B (sidebar)
  useCommandShortcuts();

  return (
    <div
      className={cn(
        "flex h-screen w-full bg-background text-foreground overflow-hidden select-none font-sans",
        className
      )}
    >
      {/* 1. Persistent Resizable Desktop Sidebar */}
      <AppSidebar />

      {/* 2. Primary Workspace Column */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Topbar: Breadcrumbs, search, actions */}
        <AppTopbar>{topbarActions}</AppTopbar>

        {/* Workspace Content Region */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <ShellErrorBoundary fallbackTitle="Workspace Shell Error">
            {children}
          </ShellErrorBoundary>
        </div>
      </div>

      {/* 3. Mobile Navigation Sheet */}
      <MobileNavigation />

      {/* 4. Global Command Palette Dialog */}
      <CommandPalette />
    </div>
  );
}

