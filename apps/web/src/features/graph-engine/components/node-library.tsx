"use client";

import * as React from "react";
import {
  nodeRegistry,
  infrastructureRegistry,
  type NodeDefinition,
  type InfrastructureComponentDefinition,
} from "@nxtqr/node-registry";
import { getClientInfrastructureIcon } from "@nxtqr/icons";
import { useGraphEditorStore } from "../store/graph-editor-store";
import {
  CpuIcon,
  DatabaseIcon,
  SearchIcon,
  PlusIcon,
  GridIcon,
  LayersIcon,
  ActivityIcon,
  CheckCircleIcon,
  SlidersIcon,
  CloseIcon,
} from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";
import type { BaseNode } from "../schemas/graph.schema";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  input: ActivityIcon,
  process: CpuIcon,
  output: CheckCircleIcon,
  group: GridIcon,
  decision: SlidersIcon,
  service: LayersIcon,
  database: DatabaseIcon,
  queue: SearchIcon,
};

type CategoryTab = "all" | "clients" | "foundations" | "domain";
type ClientSubtype = "all" | "web" | "mobile" | "desktop" | "headless" | "iot";

const CLIENT_SUBTYPES: Record<ClientSubtype, string[]> = {
  all: [],
  web: [
    "web-browser",
    "single-page-application",
    "server-side-rendered-app",
    "static-website",
    "progressive-web-app",
  ],
  mobile: ["mobile-application", "progressive-web-app"],
  desktop: ["desktop-application"],
  headless: ["cli-client", "third-party-client"],
  iot: ["iot-device"],
};

export interface NodeLibraryProps {
  onNodeAdded?: (node: BaseNode) => void;
  className?: string;
}

export function NodeLibrary({ onNodeAdded, className }: NodeLibraryProps) {
  const visualizerType = useGraphEditorStore((s) => s.visualizerType);
  const addNode = useGraphEditorStore((s) => s.addNode);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const nodes = useGraphEditorStore((s) => s.nodes);

  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<CategoryTab>("clients");
  const [clientSubtype, setClientSubtype] = React.useState<ClientSubtype>("all");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press "/" to focus search input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Infrastructure Components
  const infraComponents = React.useMemo(() => {
    return infrastructureRegistry.listComponents();
  }, []);

  // Foundations & Domain Nodes
  const foundationDefinitions = React.useMemo(() => {
    return nodeRegistry.listFoundations();
  }, []);

  const domainDefinitions = React.useMemo(() => {
    return nodeRegistry.listForVisualizer(visualizerType as any);
  }, [visualizerType]);

  // Filter infrastructure items
  const filteredInfra = React.useMemo(() => {
    if (activeTab === "foundations" || activeTab === "domain") return [];

    let list = infraComponents;

    // Filter by subtype
    if (clientSubtype !== "all") {
      const allowed = new Set(CLIENT_SUBTYPES[clientSubtype]);
      list = list.filter((c) => allowed.has(c.id));
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.display.name.toLowerCase().includes(q) ||
          c.display.shortName.toLowerCase().includes(q) ||
          c.display.description.toLowerCase().includes(q) ||
          c.display.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [infraComponents, activeTab, clientSubtype, search]);

  // Filter legacy/foundations items
  const filteredFoundations = React.useMemo(() => {
    if (activeTab === "clients" || activeTab === "domain") return [];

    let list = foundationDefinitions;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.label.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [foundationDefinitions, activeTab, search]);

  // Filter domain items
  const filteredDomain = React.useMemo(() => {
    if (activeTab === "clients" || activeTab === "foundations") return [];

    let list = domainDefinitions;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.label.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [domainDefinitions, activeTab, search]);

  // Create infrastructure node
  const handleCreateInfraNode = (comp: InfrastructureComponentDefinition) => {
    const offset = (nodes.length % 6) * 32;
    const position = { x: 300 + offset, y: 180 + offset };
    const newNode = infrastructureRegistry.createInfrastructureNode(comp.id, {
      position,
    });
    addNode(newNode);
    selectNode(newNode.id, false);
    onNodeAdded?.(newNode);
  };

  // Create foundation or domain node
  const handleCreateLegacyNode = (def: NodeDefinition) => {
    const id = `node_${def.type}_${crypto.randomUUID().slice(0, 6)}`;
    const offset = (nodes.length % 6) * 32;
    const newNode: BaseNode = {
      id,
      type: def.type,
      position: { x: 260 + offset, y: 160 + offset },
      dimensions: { width: 200, height: 80 },
      status: "idle",
      label: def.label,
      description: def.description,
      data: { ...def.defaultData },
      ports: def.ports,
    };

    addNode(newNode);
    selectNode(newNode.id, false);
    onNodeAdded?.(newNode);
  };

  const totalResults =
    filteredInfra.length + filteredFoundations.length + filteredDomain.length;

  return (
    <div
      className={`flex flex-col h-full bg-surface-01 text-foreground select-none ${className || ""}`}
    >
      {/* Search Header */}
      <div className="p-3 border-b border-border-subtle bg-surface-02 space-y-2.5 shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog... (Press /)"
            className="w-full h-8 pl-8 pr-7 bg-surface-01 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs font-mono text-foreground placeholder:text-text-muted outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-2 text-text-muted hover:text-foreground"
              title="Clear search"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-surface-01 rounded-md border border-border-subtle text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            className={`flex-1 py-1 rounded text-center transition-colors ${
              activeTab === "clients"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Clients ({infraComponents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("foundations")}
            className={`flex-1 py-1 rounded text-center transition-colors ${
              activeTab === "foundations"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Foundations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1 rounded text-center transition-colors ${
              activeTab === "all"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            All
          </button>
        </div>

        {/* Subtype Filter Pills (Only visible when Clients or All is selected) */}
        {(activeTab === "clients" || activeTab === "all") && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All Types" },
                { id: "web", label: "Web" },
                { id: "mobile", label: "Mobile" },
                { id: "desktop", label: "Desktop" },
                { id: "headless", label: "Headless" },
                { id: "iot", label: "IoT" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setClientSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  clientSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Categorized Component List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 precision-rail">
        {totalResults === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-text-muted text-xs font-mono">
              No matching components found.
            </p>
            {(search || clientSubtype !== "all" || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setClientSubtype("all");
                  setActiveTab("all");
                }}
                className="text-[11px] font-mono text-text-secondary hover:text-foreground underline underline-offset-4"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 1. Clients & User Interfaces Category */}
            {filteredInfra.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider">
                    Clients & User Interfaces ({filteredInfra.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle"
                  >
                    Category 01
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredInfra.map((comp) => {
                    const IconComponent = getClientInfrastructureIcon(comp.id);
                    return (
                      <div
                        key={comp.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", comp.id);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "true");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateInfraNode(comp)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateInfraNode(comp)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        {/* Colored SVG Icon */}
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0">
                          {IconComponent ? (
                            <IconComponent size={20} variant="colored" />
                          ) : (
                            <CpuIcon className="h-4 w-4 text-text-muted" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-sans text-xs font-semibold text-foreground truncate">
                              {comp.display.name}
                            </span>
                            <span className="font-mono text-[9px] text-text-muted shrink-0">
                              {comp.id}
                            </span>
                          </div>
                          <p className="font-sans text-[10px] text-text-muted truncate leading-relaxed">
                            {comp.display.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Foundations Category */}
            {filteredFoundations.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider">
                  Foundation Primitives ({filteredFoundations.length})
                </div>

                <div className="space-y-1">
                  {filteredFoundations.map((def) => {
                    const Icon = ICON_MAP[def.type] || CpuIcon;
                    return (
                      <div
                        key={def.type}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", def.type);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "false");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateLegacyNode(def)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateLegacyNode(def)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 text-text-muted group-hover:text-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-sans text-xs font-medium text-text-secondary group-hover:text-foreground truncate">
                              {def.label}
                            </span>
                            <span className="font-mono text-[9px] text-text-disabled shrink-0 uppercase">
                              {def.type}
                            </span>
                          </div>
                          <p className="font-sans text-[10px] text-text-muted truncate leading-relaxed">
                            {def.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Visualizer / Domain Category */}
            {filteredDomain.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider">
                  Visualizer Primitives ({filteredDomain.length})
                </div>

                <div className="space-y-1">
                  {filteredDomain.map((def) => {
                    const Icon = ICON_MAP[def.type] || CpuIcon;
                    return (
                      <div
                        key={def.type}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", def.type);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "false");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateLegacyNode(def)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateLegacyNode(def)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 text-text-muted group-hover:text-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-sans text-xs font-medium text-text-secondary group-hover:text-foreground truncate">
                              {def.label}
                            </span>
                            <span className="font-mono text-[9px] text-text-disabled shrink-0 uppercase">
                              {def.type}
                            </span>
                          </div>
                          <p className="font-sans text-[10px] text-text-muted truncate leading-relaxed">
                            {def.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
