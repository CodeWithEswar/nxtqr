"use client";

import * as React from "react";
import { useGraphEditorStore } from "../store/graph-editor-store";
import {
  SlidersIcon,
  CopyIcon,
  TrashIcon,
  CloseIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  getInfrastructureIcon,
} from "@nxtqr/icons";
import {
  infrastructureRegistry,
  type InspectorFieldDefinition,
  type InspectorSectionDefinition,
} from "@nxtqr/node-registry";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@nxtqr/ui";

export interface NodeInspectorProps {
  className?: string;
  onClose?: () => void;
}

export function NodeInspector({ className, onClose }: NodeInspectorProps) {
  const selectedNodeIds = useGraphEditorStore((s) => s.selectedNodeIds);
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const updateNodeConfig = useGraphEditorStore((s) => s.updateNodeConfig);
  const deleteSelected = useGraphEditorStore((s) => s.deleteSelected);
  const duplicateSelected = useGraphEditorStore((s) => s.duplicateSelected);

  // Single selection target
  const selectedNode = React.useMemo(() => {
    if (selectedNodeIds.length === 1) {
      return nodes.find((n) => n.id === selectedNodeIds[0]) || null;
    }
    return null;
  }, [selectedNodeIds, nodes]);

  // Infrastructure component definition if applicable
  const infraDef = React.useMemo(() => {
    if (!selectedNode) return undefined;
    return infrastructureRegistry.getComponent(selectedNode.type);
  }, [selectedNode]);

  // Editable form state for single node
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"config" | "ports" | "assumptions">(
    "config"
  );

  React.useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.label || "");
      setDescription(selectedNode.description || "");
    }
  }, [selectedNode]);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (selectedNode) {
      updateNodeConfig(selectedNode.id, {
        label: val,
        data: {
          ...selectedNode.data,
          label: val,
        },
      });
    }
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (selectedNode) {
      updateNodeConfig(selectedNode.id, {
        description: val,
        data: {
          ...selectedNode.data,
          description: val,
        },
      });
    }
  };

  const handleDataFieldChange = (key: string, val: unknown) => {
    if (!selectedNode) return;
    updateNodeConfig(selectedNode.id, {
      data: {
        ...selectedNode.data,
        [key]: val,
      },
    });
  };

  // Real-time validation for infrastructure nodes
  const validationResult = React.useMemo(() => {
    if (!selectedNode || !infraDef) return null;
    return infrastructureRegistry.validateConfiguration(
      infraDef.id,
      selectedNode.data
    );
  }, [selectedNode, infraDef]);

  // Case 1: Empty Selection
  if (selectedNodeIds.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full p-6 text-center select-none bg-surface-01 ${
          className || ""
        }`}
      >
        <div className="h-10 w-10 rounded-md bg-surface-02 border border-border-default flex items-center justify-center mb-3 text-text-muted shadow-level-1">
          <SlidersIcon className="h-5 w-5" />
        </div>
        <h4 className="font-sans text-xs font-semibold text-foreground mb-1">
          No Selection
        </h4>
        <p className="font-sans text-[11px] text-text-muted max-w-[200px] leading-relaxed">
          Select a component on the canvas to inspect ports, configuration, and architecture assumptions.
        </p>
      </div>
    );
  }

  // Case 2: Multi-Selection
  if (selectedNodeIds.length > 1) {
    return (
      <div
        className={`flex flex-col h-full bg-surface-01 text-foreground select-none p-4 space-y-4 ${
          className || ""
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
              Bulk Selection
            </span>
            <h3 className="font-sans text-sm font-bold text-foreground">
              {selectedNodeIds.length} Nodes Selected
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="font-mono text-[9px] text-text-muted rounded-md border-border-subtle"
            >
              Batch Mode
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-6 w-6 rounded-md text-text-muted hover:text-foreground"
                title="Close Inspector"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 rounded-md bg-surface-02 border border-border-default text-xs font-mono space-y-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">
            Selected IDs:
          </span>
          <div className="flex flex-wrap gap-1">
            {selectedNodeIds.map((id) => (
              <span
                key={id}
                className="px-1.5 py-0.5 rounded bg-surface-03 border border-border-subtle text-[10px] text-text-secondary"
              >
                #{id.slice(-6)}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={duplicateSelected}
            className="w-full h-8 text-xs font-mono gap-1.5 rounded-md border-border-default hover:bg-surface-03"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            <span>Duplicate Selected ({selectedNodeIds.length})</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={deleteSelected}
            className="w-full h-8 text-xs font-mono gap-1.5 rounded-md"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            <span>Delete Selected ({selectedNodeIds.length})</span>
          </Button>
        </div>
      </div>
    );
  }

  // Case 3: Single Node Inspection
  if (!selectedNode) return null;

  const ports = selectedNode.ports || (infraDef ? infraDef.ports : []);
  const data = selectedNode.data || {};
  const IconComponent = infraDef
    ? getInfrastructureIcon(infraDef.id)
    : null;

  // Check which ports have active connections
  const activePortIds = new Set<string>();
  for (const edge of edges) {
    if (edge.source === selectedNode.id && edge.sourceHandle) {
      activePortIds.add(edge.sourceHandle);
    }
    if (edge.target === selectedNode.id && edge.targetHandle) {
      activePortIds.add(edge.targetHandle);
    }
  }

  return (
    <div
      className={`flex flex-col h-full bg-surface-01 text-foreground select-none overflow-hidden ${
        className || ""
      }`}
    >
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-border-subtle bg-surface-02 space-y-2.5 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {IconComponent ? (
              <div className="h-8 w-8 rounded-md bg-surface-03 border border-border-default flex items-center justify-center shrink-0 shadow-level-1">
                <IconComponent size={20} variant="colored" />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-md bg-surface-03 border border-border-default flex items-center justify-center shrink-0 text-text-muted shadow-level-1">
                <SlidersIcon className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
                <span className="truncate">{selectedNode.type}</span>
                <span className="text-border-subtle">·</span>
                <span className="shrink-0">v{infraDef?.version || "1.0.0"}</span>
              </div>
              <h3 className="font-sans text-sm font-bold text-foreground truncate">
                {selectedNode.label || selectedNode.type}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className="font-mono text-[9px] text-text-muted rounded-md border-border-default uppercase"
            >
              {selectedNode.status || "idle"}
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-6 w-6 rounded-md text-text-muted hover:text-foreground"
                title="Close Inspector"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Category & Capability Badges */}
        {infraDef && (
          <div className="flex flex-wrap items-center gap-1">
            {(() => {
              const category = infrastructureRegistry.getCategory(infraDef.categoryId);
              return (
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] text-text-secondary border-border-subtle bg-surface-01"
                >
                  {category ? `Cat 0${category.order} · ${category.name}` : infraDef.categoryId}
                </Badge>
              );
            })()}
            {infraDef.capabilities.map((cap) => (
              <Badge
                key={cap}
                variant="outline"
                className="font-mono text-[9px] text-text-muted border-border-subtle bg-surface-01"
              >
                {cap}
              </Badge>
            ))}
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-surface-01 rounded-md border border-border-subtle text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`flex-1 py-1 rounded text-center transition-colors ${
              activeTab === "config"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Config
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ports")}
            className={`flex-1 py-1 rounded text-center transition-colors ${
              activeTab === "ports"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Ports ({ports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assumptions")}
            className={`flex-1 py-1 rounded text-center transition-colors ${
              activeTab === "assumptions"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            SLA & Scale
          </button>
        </div>
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 precision-rail font-mono text-xs">
        {/* TAB 1: CONFIGURATION & IDENTITY */}
        {activeTab === "config" && (
          <div className="space-y-4">
            {/* Identity Group */}
            <div className="space-y-2.5 p-2.5 rounded-md bg-surface-02 border border-border-default">
              <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
                Identity & Environment
              </span>

              {/* Label */}
              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary block">
                  Component Name
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="w-full h-8 px-2.5 bg-surface-01 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs text-foreground outline-none transition-colors"
                />
              </div>

              {/* Environment */}
              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary block">
                  Environment
                </label>
                <Select
                  value={String(data.environment || "production")}
                  onValueChange={(val) => handleDataFieldChange("environment", val)}
                >
                  <SelectTrigger className="w-full h-8 px-2.5 bg-surface-01 border-border-default hover:border-border-hover text-xs text-foreground font-mono">
                    <SelectValue placeholder="Select Environment" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground">
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="edge">Edge Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary block">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="System role, client boundaries..."
                  className="w-full h-8 px-2.5 bg-surface-01 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs text-foreground placeholder:text-text-disabled outline-none transition-colors"
                />
              </div>
            </div>

            {/* Dynamic Schema Fields (if Infrastructure Component) */}
            {infraDef && infraDef.inspector.length > 0 ? (
              infraDef.inspector.map((section: InspectorSectionDefinition) => (
                <div
                  key={section.id}
                  className="space-y-3 p-2.5 rounded-md bg-surface-02 border border-border-default"
                >
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
                      {section.title}
                    </span>
                    {section.description && (
                      <p className="text-[10px] text-text-disabled font-sans mt-0.5">
                        {section.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {section.fields.map((field: InspectorFieldDefinition) => (
                      <FieldRenderer
                        key={field.path}
                        field={field}
                        value={data[field.path]}
                        onChange={(val) => handleDataFieldChange(field.path, val)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback Generic Data Fields */
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
                  Custom Properties
                </label>
                {Object.entries(data)
                  .filter(
                    ([k]) =>
                      ![
                        "label",
                        "description",
                        "isInfrastructure",
                        "categoryId",
                        "componentType",
                        "version",
                        "iconSlug",
                      ].includes(k)
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="p-2 rounded-md bg-surface-02 border border-border-default space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-text-muted uppercase font-semibold">
                          {key}
                        </span>
                        <span className="text-text-disabled text-[9px]">
                          {typeof value}
                        </span>
                      </div>
                      <input
                        type={typeof value === "number" ? "number" : "text"}
                        value={String(value ?? "")}
                        onChange={(e) =>
                          handleDataFieldChange(
                            key,
                            typeof value === "number"
                              ? Number(e.target.value)
                              : e.target.value
                          )
                        }
                        className="w-full h-7 px-2 bg-surface-01 border border-border-subtle hover:border-border-hover focus:border-border-strong rounded text-[11px] text-foreground outline-none transition-colors"
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Validation Feedback */}
            {validationResult && (
              <div
                className={`p-2.5 rounded-md border text-[11px] font-sans ${
                  validationResult.success
                    ? "bg-surface-02 border-border-default text-text-secondary"
                    : "bg-surface-02 border-amber-800/40 text-amber-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold">
                  {validationResult.success ? (
                    <>
                      <CheckCircleIcon className="h-3.5 w-3.5 text-text-secondary" />
                      <span className="text-foreground">Configuration Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-amber-400">Schema Validation Warning</span>
                    </>
                  )}
                </div>

                {!validationResult.success && validationResult.errors && (
                  <ul className="mt-1.5 space-y-1 text-[10px] font-mono text-amber-200/80 list-disc list-inside">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PORTS & CONNECTIVITY */}
        {activeTab === "ports" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                Defined Ports ({ports.length})
              </span>
              <span className="text-[10px] text-text-disabled">
                {activePortIds.size} Active
              </span>
            </div>

            <div className="space-y-2">
              {ports.length === 0 ? (
                <div className="p-3 text-center text-text-disabled text-[10px] bg-surface-02 border border-border-subtle rounded-md">
                  No connection ports defined
                </div>
              ) : (
                ports.map((port) => {
                  const isActive = activePortIds.has(port.id);
                  return (
                    <div
                      key={port.id}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isActive
                                ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                                : "bg-text-disabled"
                            }`}
                            title={isActive ? "Active connection" : "Unconnected"}
                          />
                          <span className="font-semibold text-foreground text-xs">
                            {port.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] uppercase border-border-subtle"
                        >
                          {port.type}
                        </Badge>
                      </div>

                      {port.description && (
                        <p className="font-sans text-[10px] text-text-muted">
                          {port.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {port.dataType && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-01 border border-border-subtle text-[9px] text-text-secondary">
                            {port.dataType}
                          </span>
                        )}
                        <span className="ml-auto text-[9px] text-text-disabled">
                          Cap: {port.capacity || "unlimited"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SLA & SCALE ASSUMPTIONS */}
        {activeTab === "assumptions" && (
          <div className="space-y-3">
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
              Architecture Assumptions
            </span>

            <div className="space-y-2.5 p-2.5 rounded-md bg-surface-02 border border-border-default">
              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary block">
                  Target Availability (SLA)
                </label>
                <Select
                  value={String(data.slaTarget || "99.9%")}
                  onValueChange={(val) => handleDataFieldChange("slaTarget", val)}
                >
                  <SelectTrigger className="w-full h-8 px-2.5 bg-surface-01 border-border-default hover:border-border-hover text-xs text-foreground font-mono">
                    <SelectValue placeholder="Select SLA" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground">
                    <SelectItem value="99.0%">99.0% (Best Effort)</SelectItem>
                    <SelectItem value="99.9%">99.9% (Standard Production)</SelectItem>
                    <SelectItem value="99.95%">99.95% (High Availability)</SelectItem>
                    <SelectItem value="99.99%">99.99% (Mission Critical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary block">
                  Expected Peak Concurrency
                </label>
                <input
                  type="number"
                  value={Number(data.peakConcurrency ?? 1000)}
                  onChange={(e) =>
                    handleDataFieldChange("peakConcurrency", Number(e.target.value))
                  }
                  className="w-full h-8 px-2.5 bg-surface-01 border border-border-default rounded-md text-xs text-foreground outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary block">
                  Latency Budget (p95 ms)
                </label>
                <input
                  type="number"
                  value={Number(data.latencyBudgetMs ?? 200)}
                  onChange={(e) =>
                    handleDataFieldChange("latencyBudgetMs", Number(e.target.value))
                  }
                  className="w-full h-8 px-2.5 bg-surface-01 border border-border-default rounded-md text-xs text-foreground outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Actions Footer */}
      <div className="p-3 border-t border-border-subtle bg-surface-02 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={duplicateSelected}
          className="flex-1 h-8 text-xs font-mono gap-1.5 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 shadow-level-1"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          <span>Duplicate</span>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={deleteSelected}
          className="flex-1 h-8 text-xs font-mono gap-1.5 rounded-md shadow-level-1"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  );
}

// Helper to render individual schema-defined fields
function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: InspectorFieldDefinition;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const isBool = field.type === "boolean";
  const isSelect = field.type === "select";
  const isNum = field.type === "number";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-text-secondary font-semibold">{field.label}</span>
        {field.unit && (
          <span className="text-text-disabled font-mono">{field.unit}</span>
        )}
      </div>

      {isBool ? (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`w-full py-1.5 px-3 rounded-md text-xs font-mono border transition-colors flex items-center justify-between ${
            value
              ? "bg-surface-04 border-border-strong text-foreground font-semibold"
              : "bg-surface-01 border-border-default text-text-muted"
          }`}
        >
          <span>{value ? "Enabled" : "Disabled"}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              value ? "bg-emerald-400" : "bg-text-disabled"
            }`}
          />
        </button>
      ) : isSelect ? (
        <Select
          value={String(value ?? (field.options?.[0]?.value ?? ""))}
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger className="w-full h-8 px-2.5 bg-surface-01 border-border-default hover:border-border-hover text-xs text-foreground font-mono">
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground">
            {field.options?.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : isNum ? (
        <div className="relative">
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={Number(value ?? 0)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-8 px-2.5 pr-10 bg-surface-01 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs text-foreground outline-none transition-colors"
          />
          {field.unit && (
            <span className="absolute right-2.5 top-2 text-[10px] text-text-disabled pointer-events-none font-mono">
              {field.unit}
            </span>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full h-8 px-2.5 bg-surface-01 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs text-foreground outline-none transition-colors"
        />
      )}

      {field.description && (
        <p className="font-sans text-[9px] text-text-disabled">
          {field.description}
        </p>
      )}
    </div>
  );
}
