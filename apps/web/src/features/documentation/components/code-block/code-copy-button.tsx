"use client";

import * as React from "react";
import { CopyIcon, CheckIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface CodeCopyButtonProps {
  code: string;
  className?: string;
}

export function CodeCopyButton({ code, className }: CodeCopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!code) return;
    const cleanCode = code.replace(/\/\/ \[!code [^\]]+\]/g, "").trim();

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanCode);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = cleanCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard copy fallback triggered:", err);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Code copied to clipboard" : "Copy code"}
      className={cn(
        "h-7 px-2 font-mono text-[10px] bg-black/60 border-border hover:bg-surface text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 sm:mr-1 text-emerald-400" />
          <span className="text-emerald-400 font-medium hidden sm:inline">Copied</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5 sm:mr-1 text-muted-foreground" />
          <span className="hidden sm:inline">Copy</span>
        </>
      )}
    </Button>
  );
}
