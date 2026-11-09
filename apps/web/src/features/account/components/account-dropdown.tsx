"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@nxtqr/ui";
import { UserIcon, SettingsIcon, LogOutIcon } from "@nxtqr/icons";
import { useAuthUser } from "../hooks/use-auth-user";

export interface AccountDropdownProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  side?: "top" | "right" | "bottom" | "left";
}

export function AccountDropdown({
  children,
  align = "end",
  side = "top",
}: AccountDropdownProps) {
  const { profile, signOut, isLoading } = useAuthUser();

  const displayName = profile?.displayName || "Studio Engineer";
  const email = profile?.email || "engineer@nxtqr.dev";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-60 rounded-md border border-border-default bg-surface-02 text-foreground shadow-level-2 p-1.5 font-sans z-50"
      >
        <DropdownMenuLabel className="px-2.5 py-2">
          <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
          <p className="text-[11px] font-mono text-text-muted truncate mt-0.5">{email}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border-subtle my-1" />

        <DropdownMenuItem
          asChild
          className="text-xs gap-2.5 cursor-pointer focus:bg-surface-03 focus:text-foreground rounded-md px-2.5 py-1.5"
        >
          <Link href="/settings/theme">
            <UserIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span>Profile & Account</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          asChild
          className="text-xs gap-2.5 cursor-pointer focus:bg-surface-03 focus:text-foreground rounded-md px-2.5 py-1.5"
        >
          <Link href="/settings/theme">
            <SettingsIcon className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span>Studio Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border-subtle my-1" />

        <DropdownMenuItem
          onClick={signOut}
          disabled={isLoading}
          className="text-xs gap-2.5 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive rounded-md px-2.5 py-1.5 font-medium"
        >
          <LogOutIcon className="h-3.5 w-3.5 text-destructive shrink-0" />
          <span>{isLoading ? "Signing out..." : "Sign Out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

