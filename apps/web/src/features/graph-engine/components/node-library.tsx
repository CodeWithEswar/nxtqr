"use client";

import * as React from "react";
import { nodeRegistry, type NodeDefinition } from "@nxtqr/node-registry";
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
} from "@nxtqr/icons";
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

export interface NodeLibraryProps {
  onNodeAdded?: (node: BaseNode) => void;
  className?: string;
}

export function NodeLibrary({ onNodeAdded, className }: NodeLibraryProps) {
  const visualizerType = useGraphEditorStore((s) => s.visualizerType);
  const addNode = useGraphEditorStore((s) => s.addNode);
  const nodes = useGraphEditorStore((s) => s.nodes);

  const [search, setSearch] = React.useState("");

  const allDefinitions = React.useMemo(() => {
    // List nodes for current visualizer + foundations
    const specific = nodeRegistry.listForVisualizer(visualizerType as any);
    const foundations = nodeRegistry.listFoundations();
    const combined = [...foundations, ...specific];

    // Deduplicate by type
    const seen = new Set<string>();
    return combined.filter((def) => {
      if (seen.has(def.type)) return false;
      seen.add(def.type);
      return true;
    });
  }, [visualizerType]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return allDefinitions;
    const query = search.toLowerCase();
    return allDefinitions.filter(
      (d) =>
        d.label.toLowerCase().includes(query) ||
        d.type.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query),
    );
  }, [allDefinitions, search]);

  const categories = React.useMemo(() => {
    const map = new Map<string, NodeDefinition[]>();
    for (const def of filtered) {
      const cat = def.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(def);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleCreateNode = (def: NodeDefinition) => {
    const id = `node_${def.type}_${crypto.randomUUID().slice(0, 6)}`;
    // Calculate initial placement with slight staggering based on current node count
    const offset = (nodes.length % 6) * 30;
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
    onNodeAdded?.(newNode);
  };

  return (
    <div className={`flex flex-col h-full bg-surface-01 text-foreground select-none ${className || ""}`}>
      {/* Search Header */}
      <div className="p-3 border-b border-border-subtle bg-surface-02 space-y-2 shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search node primitives..."
            className="w-full h-8 pl-8 pr-3 bg-surface-01 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs font-mono text-foreground placeholder:text-text-muted outline-none transition-colors"
          />
        </div>
      </div>

      {/* Categorized Node List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 precision-rail">
        {categories.length === 0 ? (
          <div className="p-6 text-center text-text-muted text-xs font-mono">
            No matching nodes found.
          </div>
        ) : (
          categories.map(([category, defs]) => (
            <div key={category} className="space-y-1.5">
              <div className="px-2 text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider">
                {category}
              </div>

              <div className="space-y-1">
                {defs.map((def) => {
                  const Icon = ICON_MAP[def.type] || CpuIcon;
                  return (
                    <div
                      key={def.type}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCreateNode(def)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateNode(def)}
                      className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                    >
                      <div className="h-6 w-6 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 text-text-muted group-hover:text-foreground">
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
          ))
        )}
      </div>
    </div>
  );
}

