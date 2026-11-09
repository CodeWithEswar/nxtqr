"use client";

import * as React from "react";
import { AccountTrigger } from "@/features/account";

export interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  return (
    <div className="p-2 border-t border-border-default bg-surface-01 select-none shrink-0 space-y-1.5">
      <AccountTrigger collapsed={collapsed} />
      {!collapsed && (
        <div className="flex items-center justify-between px-2 pt-0.5 font-mono text-[9px] text-text-disabled">
          <span>v0.4 Studio</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Ready</span>
          </span>
        </div>
      )}
    </div>
  );
}
