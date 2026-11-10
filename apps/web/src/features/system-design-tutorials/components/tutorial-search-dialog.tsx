"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, Input, Badge } from "@nxtqr/ui";
import { SearchIcon, CloseIcon, getInfrastructureIcon, CpuIcon } from "@nxtqr/icons";
import { searchSystemDesign, type SearchResultItem } from "../lib/search-index";

export interface TutorialSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TutorialSearchDialog({ open, onOpenChange }: TutorialSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Global keydown listener for Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const res = searchSystemDesign(val);
    setResults(res);
    setSelectedIndex(0);
  };

  const handleSelect = (item: SearchResultItem) => {
    onOpenChange(false);
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % Math.max(results.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + results.length) % Math.max(results.length, 1));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-surface-01 border border-border-default rounded-md overflow-hidden text-foreground shadow-level-2">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border-default bg-surface-02">
          <SearchIcon className="w-4 h-4 text-text-muted shrink-0 mr-3" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search 223 components, 20 categories, examples (LB, CDN, Kafka, TinyURL)..."
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-sm font-sans placeholder:text-text-disabled h-8"
          />
          {query && (
            <button
              onClick={() => handleQueryChange("")}
              className="p-1 rounded hover:bg-surface-03 text-text-muted hover:text-foreground"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="ml-2 px-1.5 py-0.5 rounded bg-surface-03 border border-border-default font-mono text-[10px] text-text-muted">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border-subtle">
          {query.trim().length === 0 ? (
            <div className="p-8 text-center text-text-muted font-sans text-xs space-y-2">
              <p>Type keywords, component names, or acronyms.</p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2 font-mono text-[11px]">
                {["load-balancer", "kafka", "redis", "tinyurl", "rag", "saga", "cdc", "websocket"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleQueryChange(tag)}
                    className="px-2 py-0.5 rounded bg-surface-02 border border-border-default hover:bg-surface-03 hover:text-foreground"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-text-muted font-sans text-xs">
              No matching components or architectures found for &quot;{query}&quot;.
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              const IconComponent = item.iconSlug ? getInfrastructureIcon(item.iconSlug) || CpuIcon : CpuIcon;

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-surface-03 border border-border-hover" : "hover:bg-surface-02"
                  }`}
                >
                  <div className="w-7 h-7 rounded bg-surface-02 border border-border-default flex items-center justify-center shrink-0 text-text-secondary">
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-semibold text-foreground truncate">
                        {item.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="font-mono text-[9px] px-1 py-0 h-4 border-border-default text-text-muted shrink-0"
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <div className="font-sans text-[11px] text-text-muted truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>

                  <span className="font-mono text-[10px] text-text-disabled shrink-0">
                    ↵
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="h-8 px-4 bg-surface-02 border-t border-border-default flex items-center justify-between font-mono text-[10px] text-text-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Open Link</span>
          <span>Esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
