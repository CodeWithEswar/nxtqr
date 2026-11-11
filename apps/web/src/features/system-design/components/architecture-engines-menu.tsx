"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Badge,
  Input,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import {
  LayersIcon,
  ChevronDownIcon,
  SearchIcon,
  CloseIcon,
  CheckCircleIcon,
  ShieldIcon,
  ActivityIcon,
  DatabaseIcon,
  CpuIcon,
  LockIcon,
  SlidersIcon,
  PlayIcon,
  TerminalIcon,
  BookOpenIcon,
  ArchiveIcon,
  AlertCircleIcon,
} from "@nxtqr/icons";
import {
  ARCHITECTURE_FEATURES,
  ARCHITECTURE_FEATURE_CATEGORIES,
  type ArchitectureFeature,
  type ArchitectureFeatureCategory,
} from "../feature-registry";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";

interface ArchitectureEnginesMenuProps {
  className?: string;
}

function EngineIcon({ iconName, className }: { iconName: string; className?: string }) {
  switch (iconName) {
    case "ShieldIcon":
      return <ShieldIcon className={className} />;
    case "ActivityIcon":
      return <ActivityIcon className={className} />;
    case "DatabaseIcon":
      return <DatabaseIcon className={className} />;
    case "CpuIcon":
      return <CpuIcon className={className} />;
    case "LockIcon":
      return <LockIcon className={className} />;
    case "SlidersIcon":
      return <SlidersIcon className={className} />;
    case "PlayIcon":
      return <PlayIcon className={className} />;
    case "TerminalIcon":
      return <TerminalIcon className={className} />;
    case "BookOpenIcon":
      return <BookOpenIcon className={className} />;
    case "ArchiveIcon":
      return <ArchiveIcon className={className} />;
    case "AlertCircleIcon":
      return <AlertCircleIcon className={className} />;
    case "CheckCircleIcon":
    default:
      return <CheckCircleIcon className={className} />;
  }
}

export function ArchitectureEnginesMenu({ className }: ArchitectureEnginesMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<ArchitectureFeatureCategory | "all">("all");

  const activeEngineId = useGraphEditorStore((s) => s.activeEngineId);
  const isValidationOpen = useGraphEditorStore((s) => s.isValidationOpen);
  const isHealthOpen = useGraphEditorStore((s) => s.isHealthOpen);
  const isBottlenecksOpen = useGraphEditorStore((s) => s.isBottlenecksOpen);
  const isFailureAnalysisOpen = useGraphEditorStore((s) => s.isFailureAnalysisOpen);
  const isSecurityOpen = useGraphEditorStore((s) => s.isSecurityOpen);
  const isScalabilityOpen = useGraphEditorStore((s) => s.isScalabilityOpen);

  const toggleEngineId = useGraphEditorStore((s) => s.toggleEngineId);

  // Check if a specific engine is considered "open/active"
  const isFeatureActive = React.useCallback(
    (id: string) => {
      if (activeEngineId === id) return true;
      if (id === "validation" && isValidationOpen) return true;
      if (id === "health" && isHealthOpen) return true;
      if (id === "bottlenecks" && isBottlenecksOpen) return true;
      if (id === "failure-analysis" && isFailureAnalysisOpen) return true;
      if (id === "security-analysis" && isSecurityOpen) return true;
      if (id === "scalability" && isScalabilityOpen) return true;
      return false;
    },
    [
      activeEngineId,
      isValidationOpen,
      isHealthOpen,
      isBottlenecksOpen,
      isFailureAnalysisOpen,
      isSecurityOpen,
      isScalabilityOpen,
    ]
  );

  // Filter features by search query and category
  const filteredFeatures = React.useMemo(() => {
    return ARCHITECTURE_FEATURES.filter((feature) => {
      if (selectedCategory !== "all" && feature.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        feature.name.toLowerCase().includes(q) ||
        feature.shortName.toLowerCase().includes(q) ||
        feature.description.toLowerCase().includes(q) ||
        feature.phase.toLowerCase().includes(q) ||
        feature.badgeTag.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectFeature = (feature: ArchitectureFeature) => {
    toggleEngineId(feature.id);
    setIsOpen(false);
  };

  // Check if any secondary engine is open
  const hasActiveSecondaryEngine =
    Boolean(activeEngineId) &&
    !["validation", "health", "bottlenecks", "failure-analysis", "security-analysis", "scalability"].includes(
      activeEngineId || ""
    );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 border transition-colors shadow-level-1",
            isOpen || hasActiveSecondaryEngine
              ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
              : "bg-surface-02 border-border-default text-text-secondary hover:text-foreground hover:bg-surface-03",
            className
          )}
          title="Open Architecture Intelligence Suite (30 Production Engines)"
        >
          <LayersIcon className="h-3.5 w-3.5 text-text-muted" />
          <span className="font-semibold">Engines</span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono rounded-md h-4 px-1 text-text-muted bg-surface-03 border-border-subtle"
          >
            {ARCHITECTURE_FEATURES.length}
          </Badge>
          <ChevronDownIcon className={cn("h-3 w-3 text-text-muted transition-transform", isOpen && "rotate-180")} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[490px] p-0 rounded-md border border-border-strong bg-surface-01 shadow-level-3 overflow-hidden text-foreground select-none"
      >
        {/* Header: Title + Engine Count */}
        <div className="p-3 bg-surface-02 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-surface-03 border border-border-default flex items-center justify-center text-text-secondary">
              <CpuIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold font-sans tracking-tight text-foreground flex items-center gap-1.5">
                Architecture Intelligence Suite
                <Badge variant="outline" className="text-[9px] font-mono rounded-md h-4 px-1 border-border-strong text-text-secondary">
                  30 Engines
                </Badge>
              </div>
              <p className="text-[10px] font-mono text-text-muted">
                Deterministic analyzers, release gates, and verification models
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 rounded-md flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors cursor-pointer"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-border-subtle bg-surface-01">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            <Input
              type="text"
              placeholder="Filter by name, phase, domain (e.g. database, finops, kafka)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-8 pr-7 text-xs font-mono bg-surface-02 border-border-subtle rounded-md text-foreground placeholder:text-text-muted focus-visible:ring-1 focus-visible:ring-border-strong"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-text-muted hover:text-foreground"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-2 py-1.5 bg-surface-02 border-b border-border-subtle flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px] font-mono">
          {ARCHITECTURE_FEATURE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-2 py-0.5 rounded-md transition-colors shrink-0 cursor-pointer border",
                selectedCategory === cat.id
                  ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-1"
                  : "bg-surface-01 border-border-subtle text-text-muted hover:text-foreground hover:bg-surface-03"
              )}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Features Scrollable List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5 focus:outline-none">
          {filteredFeatures.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-muted">
              No architecture engines match "{searchQuery}"
            </div>
          ) : (
            filteredFeatures.map((feature) => {
              const active = isFeatureActive(feature.id);
              return (
                <div
                  key={feature.id}
                  onClick={() => handleSelectFeature(feature)}
                  className={cn(
                    "p-2 rounded-md border transition-all cursor-pointer flex items-start gap-2.5",
                    active
                      ? "bg-surface-04 border-border-strong shadow-level-2"
                      : "bg-surface-02 border-border-subtle hover:bg-surface-03 hover:border-border-default"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                      active
                        ? "bg-surface-03 border-border-strong text-foreground"
                        : "bg-surface-01 border-border-subtle text-text-muted"
                    )}
                  >
                    <EngineIcon iconName={feature.iconName} className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold font-sans text-foreground truncate">
                        {feature.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-mono rounded-md h-4 px-1",
                            active
                              ? "bg-surface-03 border-border-strong text-foreground font-semibold"
                              : "border-border-subtle text-text-disabled"
                          )}
                        >
                          {active ? "ACTIVE" : feature.badgeTag}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-[11px] font-sans text-text-muted line-clamp-1 mt-0.5">
                      {feature.description}
                    </p>

                    <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-text-disabled">
                      <span>{feature.phase}</span>
                      <span>·</span>
                      <span className="capitalize">{feature.category}</span>
                      <span>·</span>
                      <span className="text-text-muted">{feature.badgeLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-surface-02 border-t border-border-subtle flex items-center justify-between font-mono text-[10px] text-text-muted">
          <span>{filteredFeatures.length} of {ARCHITECTURE_FEATURES.length} Engines</span>
          <span className="text-text-disabled">Click an engine to toggle its studio panel</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

