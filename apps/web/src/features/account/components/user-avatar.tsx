"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@nxtqr/ui";
import { UserIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface UserAvatarProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "SE";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SE";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({
  displayName,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  const initials = getInitials(displayName);

  return (
    <Avatar
      className={cn(
        "rounded-md border border-border-default bg-surface-02 select-none shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {avatarUrl ? (
        <AvatarImage
          src={avatarUrl}
          alt={displayName || "User avatar"}
          className="rounded-md object-cover"
        />
      ) : null}
      <AvatarFallback className="rounded-md bg-surface-03 text-text-secondary font-mono font-medium flex items-center justify-center">
        {initials || <UserIcon className="h-3.5 w-3.5 text-text-muted" />}
      </AvatarFallback>
    </Avatar>
  );
}

