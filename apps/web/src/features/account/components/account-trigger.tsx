"use client";

import * as React from "react";
import { Button, Tooltip, TooltipTrigger, TooltipContent } from "@nxtqr/ui";
import { MoreHorizontalIcon } from "@nxtqr/icons";
import { useAuthUser } from "../hooks/use-auth-user";
import { UserAvatar } from "./user-avatar";
import { AccountDropdown } from "./account-dropdown";
import { cn } from "@nxtqr/utils";

export interface AccountTriggerProps {
  collapsed?: boolean;
  align?: "start" | "end" | "center";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function AccountTrigger({
  collapsed = false,
  align = "start",
  side = "right",
  className,
}: AccountTriggerProps) {
  const { profile } = useAuthUser();

  const displayName = profile?.displayName || "Studio Engineer";
  const email = profile?.email || "engineer@nxtqr.dev";

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <AccountDropdown align={align} side={side}>
              <Button
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "h-7 w-7 rounded-md p-0 hover:bg-surface-03 focus-visible:ring-1 focus-visible:ring-border-strong focus-visible:outline-none shrink-0",
                  className
                )}
                aria-label={`Studio Account: ${displayName}`}
              >
                <UserAvatar
                  displayName={displayName}
                  avatarUrl={profile?.avatarUrl}
                  size="sm"
                />
              </Button>
            </AccountDropdown>
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} className="font-mono text-xs">
          <div>
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-[10px] text-text-muted">{email}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AccountDropdown align={align} side={side === "right" ? "top" : side}>
      <button
        type="button"
        className={cn(
          "w-full flex items-center justify-between p-2 rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 hover:border-border-hover transition-colors text-left group select-none shadow-level-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong",
          className
        )}
        aria-label="User Account Menu"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <UserAvatar
            displayName={displayName}
            avatarUrl={profile?.avatarUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate leading-tight group-hover:text-white transition-colors">
              {displayName}
            </p>
            <p className="text-[11px] font-mono text-text-muted truncate mt-0.5">
              {email}
            </p>
          </div>
        </div>

        <div className="h-6 w-6 rounded flex items-center justify-center text-text-muted group-hover:text-foreground shrink-0 ml-1">
          <MoreHorizontalIcon className="h-4 w-4" />
        </div>
      </button>
    </AccountDropdown>
  );
}

