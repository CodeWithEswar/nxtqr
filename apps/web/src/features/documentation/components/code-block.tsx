"use client";

import * as React from "react";
import { CopyIcon, CheckIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  language?: string;
  filename?: string;
  code?: string;
}

export function CodeBlock({
  className,
  language = "tsx",
  filename,
  code,
  children,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  // Extract raw text if code prop is not provided directly
  const rawCode =
    code ??
    (typeof children === "string"
      ? children
      : React.Children.toArray(children)
          .map((child) => (typeof child === "string" ? child : ""))
          .join(""));

  const handleCopy = async () => {
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative group my-4 rounded-md border border-border bg-[#0A0A0A] overflow-hidden shadow-level-1">
      {filename && (
        <div className="flex items-center justify-between border-b border-border bg-black/60 px-4 py-2 font-mono text-[11px] text-muted-foreground">
          <span>{filename}</span>
          <span className="uppercase text-[9px] tracking-wider text-neutral-500">{language}</span>
        </div>
      )}

      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? "Code copied" : "Copy code"}
          className="absolute right-3 top-3 h-7 px-2 font-mono text-[10px] opacity-70 group-hover:opacity-100 transition-opacity bg-surface/90 border-border"
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Copy
            </>
          )}
        </Button>

        <pre
          className={cn(
            "p-4 overflow-x-auto scrollbar-dense font-mono text-xs text-foreground/90 leading-relaxed",
            className,
          )}
          {...props}
        >
          <code>{children ?? code}</code>
        </pre>
      </div>
    </div>
  );
}
