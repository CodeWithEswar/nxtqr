"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@nxtqr/ui";
import { DOCS_REGISTRY } from "../registry/docs-registry";

export interface DocsSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocsSearch({ open, onOpenChange }: DocsSearchProps) {
  const router = useRouter();

  // Keyboard shortcut listener
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    router.push(`/docs/${slug}`);
  };

  const categories = ["Getting Started", "Foundations", "Components", "Visualizer"];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search documentation, components, foundations..." />
      <CommandList>
        <CommandEmpty>No documentation matches found.</CommandEmpty>
        {categories.map((cat) => {
          const items = DOCS_REGISTRY.filter((d) => d.category === cat);
          if (items.length === 0) return null;

          return (
            <CommandGroup key={cat} heading={cat}>
              {items.map((doc) => (
                <CommandItem
                  key={doc.slug}
                  value={`${doc.title} ${doc.description} ${doc.category}`}
                  onSelect={() => handleSelect(doc.slug)}
                  onClick={() => handleSelect(doc.slug)}
                  className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-foreground text-xs truncate">{doc.title}</span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {doc.description}
                    </span>
                  </div>
                  <CommandShortcut className="shrink-0 text-[10px] hidden sm:inline-block">
                    {doc.category}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
