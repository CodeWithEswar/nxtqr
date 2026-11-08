"use client";

import * as React from "react";
import {
  CheckIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  TrashIcon,
  CopyIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  SettingsIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
  CalendarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  RefreshIcon,
  LayersIcon,
  TerminalIcon,
  SpinnerIcon,
  TextWrapIcon,
  TextUnwrapIcon,
  MenuIcon,
  PanelLeftIcon,
} from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

interface IconItem {
  name: string;
  component: React.ComponentType<{ className?: string }>;
  category: "Navigation" | "Action" | "Interface" | "System" | "Editor";
  tags: string[];
}

const ICON_REGISTRY: IconItem[] = [
  { name: "CheckIcon", component: CheckIcon, category: "Action", tags: ["confirm", "done", "success", "tick"] },
  { name: "CloseIcon", component: CloseIcon, category: "Action", tags: ["dismiss", "cancel", "x", "delete"] },
  { name: "CheckCircleIcon", component: CheckCircleIcon, category: "Interface", tags: ["status", "valid", "ready"] },
  { name: "AlertCircleIcon", component: AlertCircleIcon, category: "Interface", tags: ["warning", "error", "caution"] },
  { name: "SearchIcon", component: SearchIcon, category: "Interface", tags: ["find", "lookup", "filter", "query"] },
  { name: "FilterIcon", component: FilterIcon, category: "Interface", tags: ["sort", "refine", "funnel"] },
  { name: "PlusIcon", component: PlusIcon, category: "Action", tags: ["create", "add", "new"] },
  { name: "TrashIcon", component: TrashIcon, category: "Action", tags: ["delete", "remove", "bin"] },
  { name: "CopyIcon", component: CopyIcon, category: "Action", tags: ["clipboard", "duplicate", "clone"] },
  { name: "RefreshIcon", component: RefreshIcon, category: "Action", tags: ["reload", "sync", "reset"] },
  { name: "ChevronDownIcon", component: ChevronDownIcon, category: "Navigation", tags: ["arrow", "expand", "menu"] },
  { name: "ChevronUpIcon", component: ChevronUpIcon, category: "Navigation", tags: ["arrow", "collapse"] },
  { name: "ChevronRightIcon", component: ChevronRightIcon, category: "Navigation", tags: ["arrow", "forward", "next"] },
  { name: "ChevronLeftIcon", component: ChevronLeftIcon, category: "Navigation", tags: ["arrow", "back", "previous"] },
  { name: "MoreHorizontalIcon", component: MoreHorizontalIcon, category: "Navigation", tags: ["options", "dots", "menu"] },
  { name: "MoreVerticalIcon", component: MoreVerticalIcon, category: "Navigation", tags: ["options", "dots", "menu"] },
  { name: "MenuIcon", component: MenuIcon, category: "Navigation", tags: ["hamburger", "sidebar", "drawer"] },
  { name: "PanelLeftIcon", component: PanelLeftIcon, category: "Navigation", tags: ["sidebar", "drawer", "collapse"] },
  { name: "SettingsIcon", component: SettingsIcon, category: "System", tags: ["gear", "preferences", "config"] },
  { name: "MonitorIcon", component: MonitorIcon, category: "System", tags: ["display", "screen", "viewport", "desktop"] },
  { name: "MoonIcon", component: MoonIcon, category: "System", tags: ["theme", "dark", "night"] },
  { name: "SunIcon", component: SunIcon, category: "System", tags: ["theme", "light", "day"] },
  { name: "TerminalIcon", component: TerminalIcon, category: "System", tags: ["console", "cli", "shell", "logs"] },
  { name: "SpinnerIcon", component: SpinnerIcon, category: "System", tags: ["loader", "busy", "progress"] },
  { name: "CalendarIcon", component: CalendarIcon, category: "Interface", tags: ["date", "schedule", "time"] },
  { name: "LayersIcon", component: LayersIcon, category: "Interface", tags: ["stack", "elevation", "nodes"] },
  { name: "TextWrapIcon", component: TextWrapIcon, category: "Editor", tags: ["wrap", "typography", "formatting"] },
  { name: "TextUnwrapIcon", component: TextUnwrapIcon, category: "Editor", tags: ["unwrap", "singleline", "code"] },
];

export function IconExplorer() {
  const [search, setSearch] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [iconSize, setIconSize] = React.useState<12 | 16 | 20 | 24>(16);
  const [colorMode, setColorMode] = React.useState<"mono" | "accent" | "muted">("mono");
  const [copiedIcon, setCopiedIcon] = React.useState<string | null>(null);

  const filteredIcons = ICON_REGISTRY.filter((icon) => {
    const matchesSearch =
      search === "" ||
      icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === "All" || icon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const copyImport = (name: string) => {
    navigator.clipboard.writeText(`import { ${name} } from "@nxtqr/icons";`);
    setCopiedIcon(name);
    setTimeout(() => setCopiedIcon(null), 2000);
  };

  const categories = ["All", "Navigation", "Action", "Interface", "System", "Editor"];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold font-sans text-foreground">
              Hugeicons Iconography System
            </h3>
            <Badge
              variant="outline"
              className="border-accent/40 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-wider"
            >
              1.5px Stroke Standard
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Strict standardized Hugeicons wrappers. Consistent 1.5px optical stroke width, semantic color inheritance, and zero emoji in functional controls.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
          {filteredIcons.length} of {ICON_REGISTRY.length} Icons
        </Badge>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search icons by name or tag (e.g. check, refresh, arrow)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-black border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Size Selector */}
          <div className="flex items-center gap-1 p-1 bg-secondary-surface border border-border rounded-md">
            {[12, 16, 20, 24].map((size) => (
              <button
                key={size}
                onClick={() => setIconSize(size as 12 | 16 | 20 | 24)}
                className={cn(
                  "flex-1 text-xs font-mono py-1 rounded transition-colors text-center",
                  iconSize === size
                    ? "bg-surface text-foreground font-semibold shadow-sm border border-subtle-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills & Color Tints */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono rounded-md border transition-all",
                  selectedCategory === cat
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-elevated-surface text-muted-foreground hover:border-muted-border hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <span>Color:</span>
            <button
              onClick={() => setColorMode("mono")}
              className={cn(
                "px-2 py-0.5 rounded border text-[11px]",
                colorMode === "mono" ? "border-foreground text-foreground bg-elevated-surface" : "border-border text-muted-foreground"
              )}
            >
              Mono
            </button>
            <button
              onClick={() => setColorMode("accent")}
              className={cn(
                "px-2 py-0.5 rounded border text-[11px]",
                colorMode === "accent" ? "border-accent text-accent bg-accent/10" : "border-border text-muted-foreground"
              )}
            >
              Accent
            </button>
            <button
              onClick={() => setColorMode("muted")}
              className={cn(
                "px-2 py-0.5 rounded border text-[11px]",
                colorMode === "muted" ? "border-muted-border text-muted-foreground bg-elevated-surface" : "border-border text-muted-foreground"
              )}
            >
              Muted
            </button>
          </div>
        </div>
      </div>

      {/* Icon Grid */}
      <div className="p-4 bg-black border border-subtle-border rounded-md min-h-[300px]">
        {filteredIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SearchIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No icons match &quot;{search}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
            {filteredIcons.map((icon) => {
              const IconComp = icon.component;
              const isCopied = copiedIcon === icon.name;

              const colorClass =
                colorMode === "accent"
                  ? "text-accent"
                  : colorMode === "muted"
                  ? "text-muted-foreground"
                  : "text-foreground";

              return (
                <button
                  key={icon.name}
                  onClick={() => copyImport(icon.name)}
                  className="p-3 rounded-md border border-border bg-elevated-surface hover:border-accent hover:bg-surface transition-all flex flex-col items-center justify-center gap-2 relative group text-center"
                  title={`Click to copy import statement for ${icon.name}`}
                >
                  <div
                    className={cn("flex items-center justify-center transition-colors", colorClass)}
                    style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                  >
                    <IconComp className="w-full h-full" />
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground group-hover:text-foreground truncate w-full">
                    {icon.name.replace("Icon", "")}
                  </span>

                  {isCopied && (
                    <span className="absolute inset-0 bg-accent text-accent-foreground rounded-md flex items-center justify-center text-[10px] font-mono font-bold animate-fade-in">
                      COPIED!
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Engineering Standards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-subtle-border pt-4">
        <div className="p-3 border border-border bg-elevated-surface rounded-md space-y-1">
          <div className="text-xs font-semibold text-foreground">Standard Stroke (1.5px)</div>
          <p className="text-[11px] text-muted-foreground">
            All SVGs use uniform 1.5px stroke width. Never introduce 2px (bold) or 1px (hairline) icons.
          </p>
        </div>

        <div className="p-3 border border-border bg-elevated-surface rounded-md space-y-1">
          <div className="text-xs font-semibold text-foreground">Color Inheritance</div>
          <p className="text-[11px] text-muted-foreground">
            Icons inherit text color via <code className="text-foreground">stroke=&quot;currentColor&quot;</code>. Dynamic accents apply seamlessly.
          </p>
        </div>

        <div className="p-3 border border-border bg-elevated-surface rounded-md space-y-1">
          <div className="text-xs font-semibold text-foreground">Strictly No Emoji</div>
          <p className="text-[11px] text-muted-foreground">
            Emoji are prohibited as UI controls. Always use standardized Hugeicons from <code className="text-foreground">@nxtqr/icons</code>.
          </p>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Import & Usage
        </div>
        <CodeBlock
          code={`import { SearchIcon, RefreshIcon, CheckIcon } from "@nxtqr/icons";

// Default standard 16px icon with current text color
<SearchIcon className="h-4 w-4 text-foreground" />

// Accent colored icon in notification or badge
<CheckIcon className="h-3.5 w-3.5 text-accent" />`}
          language="tsx"
          filename="icon-usage.tsx"
        />
      </div>
    </div>
  );
}
