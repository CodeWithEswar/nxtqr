import * as React from "react";
import { cn } from "@nxtqr/utils";
import { CodeCopyButton } from "./code-copy-button";

export interface CodeBlockHeaderProps {
  filename?: string;
  language?: string;
  code: string;
  className?: string;
}

export function CodeBlockHeader({
  filename,
  language,
  code,
  className,
}: CodeBlockHeaderProps) {
  if (!filename && !language) {
    return (
      <div className="absolute right-3 top-3 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <CodeCopyButton code={code} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border bg-black/60 px-4 py-2 font-mono text-[11px]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {filename && (
          <span className="text-foreground/80 font-medium">{filename}</span>
        )}
        {language && (
          <span className="uppercase text-[9px] tracking-wider text-neutral-500 border border-subtle-border px-1.5 py-0.5 rounded bg-black/40">
            {language}
          </span>
        )}
      </div>

      <CodeCopyButton code={code} />
    </div>
  );
}
