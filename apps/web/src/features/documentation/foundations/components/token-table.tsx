"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { CopyIcon, CheckIcon } from "@nxtqr/icons";

export interface TokenTableRow {
  name: string;
  value: string;
  resolvedValue?: string;
  cssVar?: string;
  usage: string;
  badge?: string;
}

export interface TokenTableProps {
  rows: TokenTableRow[];
  showCssVar?: boolean;
  className?: string;
}

export function TokenTable({ rows, showCssVar = true, className }: TokenTableProps) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // clipboard access error
    }
  };

  return (
    <div
      className={cn(
        "my-6 w-full overflow-x-auto scrollbar-dense rounded-md border border-border bg-surface shadow-level-1",
        className,
      )}
    >
      <table className="w-full text-xs font-sans text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-secondary-surface/70">
            <th className="p-2.5 font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider">
              Token
            </th>
            <th className="p-2.5 font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider">
              Value
            </th>
            {showCssVar && (
              <th className="p-2.5 font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider hidden sm:table-cell">
                CSS Variable
              </th>
            )}
            <th className="p-2.5 font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider">
              Role & Usage
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle-border">
          {rows.map((row) => {
            const isCopied = copiedKey === row.name;

            return (
              <tr
                key={row.name}
                className="hover:bg-secondary-surface/40 transition-colors group"
              >
                <td className="p-2.5 font-mono text-[11px] font-medium text-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span>{row.name}</span>
                    {row.badge && (
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/60 border border-subtle-border text-neutral-400">
                        {row.badge}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleCopy(row.value, row.name)}
                    title={`Copy ${row.value}`}
                    className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-black/60 hover:text-foreground transition-colors group/copy"
                  >
                    <span>{row.value}</span>
                    {isCopied ? (
                      <CheckIcon className="h-3 w-3 text-accent" />
                    ) : (
                      <CopyIcon className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                    )}
                  </button>
                </td>
                {showCssVar && (
                  <td className="p-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                    {row.cssVar ? (
                      <code className="text-[10px] px-1 py-0.5 rounded bg-black/40 border border-subtle-border text-neutral-400">
                        {row.cssVar}
                      </code>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="p-2.5 text-xs text-muted-foreground leading-relaxed">
                  {row.usage}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

