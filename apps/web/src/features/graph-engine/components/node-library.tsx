"use client";

import * as React from "react";
import {
  nodeRegistry,
  infrastructureRegistry,
  type NodeDefinition,
  type InfrastructureComponentDefinition,
} from "@nxtqr/node-registry";
import {
  ActivityIcon,
  CheckCircleIcon,
  CloseIcon,
  CpuIcon,
  DatabaseIcon,
  getInfrastructureIcon,
  GridIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
} from "@nxtqr/icons";
import {
  Button,
  Input,
  Kbd,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useGraphEditorStore } from "../store/graph-editor-store";
import type { BaseNode } from "../schemas/graph.schema";
import { COMPONENT_TYPES } from "./node-library-filters";

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

type CatalogEntry = InfrastructureComponentDefinition | NodeDefinition;

interface CatalogGroup {
  id: string;
  name: string;
  entries: CatalogEntry[];
}

export interface NodeLibraryProps {
  onNodeAdded?: (node: BaseNode) => void;
  className?: string;
}

function ComponentRow({
  entry,
  onAdd,
}: {
  entry: CatalogEntry;
  onAdd: (entry: CatalogEntry) => void;
}) {
  const isInfra = "display" in entry;
  const id = isInfra ? entry.id : entry.type;
  const name = isInfra ? entry.display.name : entry.label;
  const description = isInfra ? entry.display.description : entry.description;
  const InfrastructureIcon = isInfra ? getInfrastructureIcon(id) : undefined;
  const Icon = (!isInfra && ICON_MAP[id]) || CpuIcon;
  const draggable = !isInfra || entry.categoryId !== "distributed-systems-patterns";

  return (
    <li className="border-b border-border-subtle last:border-b-0">
      <Button
        type="button"
        variant="ghost"
        aria-label={`Add ${name}`}
        title={description}
        draggable={draggable}
        onDragStart={(event) => {
          event.dataTransfer.setData("application/nxtqr-node-type", id);
          event.dataTransfer.setData("application/nxtqr-is-infra", String(isInfra));
          event.dataTransfer.effectAllowed = "copyMove";
        }}
        onClick={() => onAdd(entry)}
        className="group h-auto min-h-12 w-full justify-start gap-2 whitespace-normal border border-transparent px-2 py-2 text-left hover:border-border-hover hover:bg-surface-03 active:scale-100 focus-visible:relative focus-visible:z-10 focus-visible:ring-inset"
      >
        <span
          aria-hidden={true}
          className="grid size-8 shrink-0 place-items-center rounded-md border border-border-default bg-surface-02 text-text-secondary group-hover:text-foreground"
        >
          {InfrastructureIcon ? (
            <InfrastructureIcon size={18} variant="monochrome" />
          ) : (
            <Icon className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="block break-words text-xs font-semibold leading-snug text-foreground">
            {name}
          </span>
          <span className="line-clamp-2 break-words text-[11px] font-normal leading-snug text-text-muted">
            {description}
          </span>
        </span>
        <PlusIcon
          aria-hidden={true}
          className="size-3.5 shrink-0 text-text-muted group-hover:text-foreground group-focus-visible:text-foreground"
        />
      </Button>
    </li>
  );
}

export function NodeLibrary({ onNodeAdded, className }: NodeLibraryProps) {
  const visualizerType = useGraphEditorStore((state) => state.visualizerType);
  const addNode = useGraphEditorStore((state) => state.addNode);
  const selectNode = useGraphEditorStore((state) => state.selectNode);

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [typesByCategory, setTypesByCategory] = React.useState<Record<string, string>>({});
  const searchInput = React.useRef<HTMLInputElement>(null);
  const results = React.useRef<HTMLDivElement>(null);

  const categories = React.useMemo(() => infrastructureRegistry.listCategories().reverse(), []);
  const foundations = React.useMemo(() => nodeRegistry.listFoundations(), []);
  const visualizerEntries = React.useMemo(
    () =>
      nodeRegistry
        .listForVisualizer(visualizerType as NodeDefinition["visualizerType"])
        .filter((entry) => entry.visualizerType !== "generic"),
    [visualizerType],
  );
  const componentTypes = COMPONENT_TYPES[category];
  const selectedType = typesByCategory[category] ?? "all";

  React.useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const input = searchInput.current;
      const target = event.target instanceof Element ? event.target : null;
      const dialog = target?.closest('[role="dialog"]');
      if (
        event.key !== "/" ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target?.closest('input, textarea, select, [contenteditable], [role="listbox"]') ||
        (dialog && input && !dialog.contains(input)) ||
        !input?.getClientRects().length
      )
        return;

      event.preventDefault();
      input.focus();
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  React.useEffect(() => {
    results.current?.scrollTo({ top: 0 });
  }, [category, search, selectedType]);

  const groups = React.useMemo(() => {
    const allowed = componentTypes?.find((type) => type.id === selectedType)?.componentIds;
    const entriesByCategory = new Map<string, InfrastructureComponentDefinition[]>();
    for (const entry of infrastructureRegistry.searchComponents(search)) {
      if (category !== "all" && entry.categoryId !== category) continue;
      if (allowed && !allowed.includes(entry.id)) continue;
      const entries = entriesByCategory.get(entry.categoryId);
      if (entries) entries.push(entry);
      else entriesByCategory.set(entry.categoryId, [entry]);
    }

    const visibleGroups: CatalogGroup[] = categories.flatMap(({ id, name }) => {
      const entries = entriesByCategory.get(id);
      return entries ? [{ id, name, entries }] : [];
    });

    const query = search.trim().toLowerCase();
    const matches = (entry: NodeDefinition) =>
      [entry.type, entry.label, entry.description].some((value) =>
        value.toLowerCase().includes(query),
      );

    if (category === "all" || category === "foundations") {
      visibleGroups.push({
        id: "foundations",
        name: "Foundation primitives",
        entries: foundations.filter(matches),
      });
    }
    if (category === "all" || category === "visualizer") {
      visibleGroups.push({
        id: "visualizer",
        name: "Visualizer primitives",
        entries: visualizerEntries.filter(matches),
      });
    }
    return visibleGroups.filter((group) => group.entries.length > 0);
  }, [categories, category, componentTypes, foundations, search, selectedType, visualizerEntries]);

  const total = groups.reduce((count, group) => count + group.entries.length, 0);
  const hasFilters = category !== "all" || search !== "";

  const handleAdd = (entry: CatalogEntry) => {
    const offset = (useGraphEditorStore.getState().nodes.length % 6) * 32;
    const node: BaseNode =
      "display" in entry
        ? infrastructureRegistry.createInfrastructureNode(entry.id, {
            position: { x: 300 + offset, y: 180 + offset },
          })
        : {
            id: `node_${entry.type}_${crypto.randomUUID().slice(0, 6)}`,
            type: entry.type,
            position: { x: 260 + offset, y: 160 + offset },
            dimensions: { width: 200, height: 80 },
            status: "idle",
            label: entry.label,
            description: entry.description,
            data: { ...entry.defaultData },
            ports: entry.ports,
          };

    addNode(node);
    selectNode(node.id, false);
    onNodeAdded?.(node);
  };

  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col bg-surface-01 text-foreground [container-type:inline-size]",
        className,
      )}
    >
      <div className="shrink-0 space-y-2 border-b border-border-default bg-surface-02 px-3 pb-2 pt-3">
        <div className="relative">
          <SearchIcon
            aria-hidden={true}
            className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-text-muted"
          />
          <Input
            ref={searchInput}
            type="text"
            inputMode="search"
            aria-label="Search components"
            aria-keyshortcuts="/"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search components"
            className="h-11 border-border-default bg-surface-01 pl-9 pr-9 text-base placeholder:text-text-muted hover:border-border-hover md:h-9 md:text-sm"
          />
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear search"
              className="absolute inset-y-0 right-1 my-auto text-text-muted"
              onClick={() => {
                setSearch("");
                searchInput.current?.focus();
              }}
            >
              <CloseIcon aria-hidden={true} className="size-3.5" />
            </Button>
          ) : (
            <Kbd
              aria-hidden={true}
              className="pointer-events-none absolute inset-y-0 right-2 my-auto hidden md:inline-flex"
            >
              /
            </Kbd>
          )}
        </div>

        <div
          className={cn(
            "grid gap-2",
            componentTypes && "[@container(min-width:360px)]:grid-cols-2",
          )}
        >
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              aria-label="Component category"
              className="h-10 min-w-0 gap-2 font-sans md:h-8"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className="z-[60] max-h-[min(20rem,var(--radix-select-content-available-height))]"
              collisionPadding={8}
            >
              <SelectItem value="all" className="font-sans">
                All categories
              </SelectItem>
              {categories.map(({ id, name }) => (
                <SelectItem key={id} value={id} className="font-sans">
                  {name}
                </SelectItem>
              ))}
              <SelectItem value="foundations" className="font-sans">
                Foundation primitives
              </SelectItem>
              {visualizerEntries.length > 0 && (
                <SelectItem value="visualizer" className="font-sans">
                  Visualizer primitives
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {componentTypes && (
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setTypesByCategory((previous) => ({ ...previous, [category]: value }))
              }
            >
              <SelectTrigger
                aria-label="Component type"
                className="h-10 min-w-0 gap-2 font-sans md:h-8"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="z-[60] max-h-[min(20rem,var(--radix-select-content-available-height))]"
                collisionPadding={8}
              >
                <SelectItem value="all" className="font-sans">
                  All types
                </SelectItem>
                {componentTypes.map(({ id, label }) => (
                  <SelectItem key={id} value={id} className="font-sans">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex min-h-6 items-center justify-between gap-2">
          <p
            role="status"
            aria-atomic="true"
            className="font-mono text-[10px] tabular-nums text-text-muted"
          >
            {total} {total === 1 ? "component" : "components"}
          </p>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-text-secondary"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setTypesByCategory({});
                searchInput.current?.focus();
              }}
            >
              Reset filters
            </Button>
          )}
        </div>
      </div>

      <div
        ref={results}
        className="precision-rail min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3"
      >
        {groups.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <SearchIcon aria-hidden={true} className="mx-auto mb-3 size-5 text-text-muted" />
            <p className="text-sm font-semibold">No matching components</p>
            <p className="mt-1 text-xs leading-relaxed text-text-muted">
              Try a different search or reset your filters.
            </p>
          </div>
        ) : (
          groups.map(({ id, name, entries }) => (
            <section key={id} aria-label={name} className="mt-1">
              <h3 className="sticky top-0 z-10 flex items-baseline justify-between gap-2 border-b border-border-subtle bg-surface-01 px-2 py-2 text-[11px] font-semibold text-text-secondary">
                <span className="min-w-0 break-words">{name}</span>
                <span className="shrink-0 font-mono text-[10px] font-normal tabular-nums text-text-muted">
                  {entries.length}
                </span>
              </h3>
              <ul className="py-0.5">
                {entries.map((entry) => (
                  <ComponentRow
                    key={"display" in entry ? entry.id : entry.type}
                    entry={entry}
                    onAdd={handleAdd}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
