"use client";

import { type DocProp } from "../schemas/docs-schema";
import { Badge } from "@nxtqr/ui";

export interface PropsTableProps {
  props?: DocProp[];
}

export function PropsTable({ props = [] }: PropsTableProps) {
  if (!props || props.length === 0) {
    return (
      <div className="my-4 p-4 rounded-md border border-border bg-surface text-xs text-muted-foreground font-mono">
        No custom props specified. Inherits standard HTML and Radix UI primitive attributes.
      </div>
    );
  }

  return (
    <div className="my-4 relative w-full overflow-x-auto scrollbar-dense rounded-md border border-border bg-surface shadow-level-1">
      <table className="w-full text-xs caption-bottom font-sans">
        <thead className="[&_tr]:border-b bg-secondary-surface/70">
          <tr className="border-b border-border font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            <th className="h-9 px-4 text-left font-semibold">Property</th>
            <th className="h-9 px-4 text-left font-semibold">Type</th>
            <th className="h-9 px-4 text-left font-semibold">Default</th>
            <th className="h-9 px-4 text-left font-semibold">Required</th>
            <th className="h-9 px-4 text-left font-semibold">Description</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0 divide-y divide-subtle-border">
          {props.map((prop) => (
            <tr key={prop.name} className="hover:bg-muted-surface/40 transition-colors">
              <td className="p-3 px-4 font-mono font-semibold text-foreground whitespace-nowrap">
                {prop.name}
              </td>
              <td className="p-3 px-4 font-mono text-[11px] text-neutral-300">
                <span className="px-1.5 py-0.5 rounded bg-black/50 border border-subtle-border">
                  {prop.type}
                </span>
              </td>
              <td className="p-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                {prop.default ? (
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-subtle-border">
                    {prop.default}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="p-3 px-4 whitespace-nowrap">
                {prop.required ? (
                  <Badge variant="destructive" className="font-mono text-[10px] py-0">
                    Yes
                  </Badge>
                ) : (
                  <span className="font-mono text-[11px] text-muted-foreground">No</span>
                )}
              </td>
              <td className="p-3 px-4 text-muted-foreground text-xs leading-relaxed min-w-[200px]">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
