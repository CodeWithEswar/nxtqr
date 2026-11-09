"use client";

import * as React from "react";
import { AlertCircleIcon, RefreshIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <aside
      aria-label="Network status banner"
      role="status"
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-md border border-amber-500/30 bg-surface-02 text-foreground shadow-level-2 select-none font-sans text-xs",
        className
      )}
    >
      <AlertCircleIcon className="h-4 w-4 text-amber-400 shrink-0" />
      <span className="text-text-secondary">
        Working offline. Graph changes are saved locally.
      </span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => window.location.reload()}
        className="h-6 px-2 text-[11px] font-mono text-foreground hover:bg-surface-03 rounded gap-1 ml-1"
      >
        <RefreshIcon className="h-3 w-3" />
        <span>Reconnect</span>
      </Button>
    </aside>
  );
}

