"use client";

import * as React from "react";
import { AccountTrigger } from "@/features/account";

export interface SidebarFooterProps {
  collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  return (
    <div className="p-2 border-t border-border-default bg-surface-01 select-none shrink-0 flex items-center justify-center">
      <AccountTrigger collapsed={collapsed} />
    </div>
  );
}
