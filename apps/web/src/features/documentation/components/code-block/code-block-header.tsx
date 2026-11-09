import * as React from "react";
import { cn } from "@nxtqr/utils";
import { CodeCopyButton } from "./code-copy-button";
import { CodeWrapButton } from "./code-wrap-button";

export interface CodeBlockHeaderProps {
  filename?: string;
  language?: string;
  code: string;
  isWrapped?: boolean;
  onToggleWrap?: () => void;
  allowWrap?: boolean;
  className?: string;
}

export function CodeBlockHeader({
  filename,
  language,
  code,
  isWrapped = false,
  onToggleWrap,
  allowWrap = true,
  className,
}: CodeBlockHeaderProps) {
  if (!filename && !language) {
    return (
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
        {allowWrap && onToggleWrap && (
          <CodeWrapButton
            isWrapped={isWrapped}
            onToggle={onToggleWrap}
          />
        )}
        <CodeCopyButton code={code} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border bg-black/60 px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-[11px]",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        {filename && (
          <span className="text-foreground/80 font-medium truncate" title={filename}>
            {filename}
          </span>
        )}
        {language && (
          <span className="uppercase text-[9px] tracking-wider text-neutral-500 border border-subtle-border px-1.5 py-0.5 rounded bg-black/40 shrink-0 hidden sm:inline-block">
            {language}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {allowWrap && onToggleWrap && (
          <CodeWrapButton
            isWrapped={isWrapped}
            onToggle={onToggleWrap}
          />
        )}
        <CodeCopyButton code={code} />
      </div>
    </div>
  );
}
