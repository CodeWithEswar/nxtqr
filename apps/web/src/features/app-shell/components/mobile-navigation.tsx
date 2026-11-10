"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@nxtqr/ui";
import { AppLogo } from "@nxtqr/branding";
import { AccountTrigger } from "@/features/account";
import { useShellStore } from "../store/shell-store";
import { SHELL_NAVIGATION_GROUPS } from "../config/navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { cn } from "@nxtqr/utils";

export function MobileNavigation() {
  const pathname = usePathname();
  const open = useShellStore((s) => s.mobileNavOpen);
  const setOpen = useShellStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 bg-surface-01 border-r border-border-default text-foreground flex flex-col select-none"
      >
        <SheetHeader className="h-12 px-4 border-b border-border-default flex flex-row items-center justify-between space-y-0">
          <SheetTitle asChild>
            <Link
              href="/workspace"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 min-w-0"
            >
              <AppLogo variant="minimal" size={22} animated animationMode="interactive" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-sans text-xs font-bold tracking-tight text-foreground">
                  NXTQR
                </span>
                <span className="font-mono text-[9px] font-semibold text-text-muted px-1.5 py-0.5 rounded-md border border-border-subtle bg-surface-02 uppercase tracking-wider">
                  STUDIO
                </span>
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* Active Workspace Switcher */}
        <div className="px-3 pt-3 pb-2 border-b border-border-default bg-surface-01">
          <div className="px-1 pb-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted">
            Active Workspace
          </div>
          <WorkspaceSwitcher variant="button" className="w-full justify-between" />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {SHELL_NAVIGATION_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1.5">
              <div className="px-2.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-text-muted">
                {group.label}
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/workspace"
                      ? pathname === "/workspace"
                      : pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-sans transition-colors",
                        isActive
                          ? "bg-surface-03 text-foreground font-semibold border border-border-strong shadow-level-1"
                          : "text-text-secondary hover:text-foreground hover:bg-surface-02 border border-transparent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-foreground" : "text-text-muted"
                        )}
                      />
                      <span className="truncate flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded border border-border-subtle bg-surface-00 text-text-muted">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer account trigger */}
        <div className="p-3 border-t border-border-default bg-surface-01">
          <AccountTrigger />
        </div>
      </SheetContent>
    </Sheet>
  );
}
