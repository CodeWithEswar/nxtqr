"use client";

import * as React from "react";
import { TextWrapIcon, TextUnwrapIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface CodeWrapButtonProps {
  isWrapped: boolean;
  onToggle: () => void;
  className?: string;
}

export function CodeWrapButton({
  isWrapped,
  onToggle,
  className,
}: CodeWrapButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-label={isWrapped ? "Disable word wrap" : "Enable word wrap"}
      aria-pressed={isWrapped}
      title={isWrapped ? "Unwrap lines" : "Wrap lines"}
      className={cn(
        "h-7 px-2 font-mono text-[10px] bg-black/60 border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-all gap-1.5",
        isWrapped && "bg-surface border-subtle-border text-foreground shadow-level-3",
        className,
      )}
    >
      {isWrapped ? (
        <>
          <TextUnwrapIcon className="h-3.5 w-3.5 text-accent-foreground" />
          <span className="hidden sm:inline">Unwrap</span>
        </>
      ) : (
        <>
          <TextWrapIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Wrap</span>
        </>
      )}
    </Button>
  );
}
