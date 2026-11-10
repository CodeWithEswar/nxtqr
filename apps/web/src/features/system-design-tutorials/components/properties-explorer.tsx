"use client";

import * as React from "react";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import {
  Button,
  Input,
  Switch,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { CopyIcon, CheckIcon, SlidersIcon } from "@nxtqr/icons";

export interface PropertiesExplorerProps {
  componentId: string;
  className?: string;
}

export function PropertiesExplorer({ componentId, className = "" }: PropertiesExplorerProps) {
  const compDef = React.useMemo(() => {
    return infrastructureRegistry.getComponent(componentId);
  }, [componentId]);

  const [configValues, setConfigValues] = React.useState<Record<string, any>>(() => {
    return compDef?.defaultConfig ? { ...compDef.defaultConfig } : {};
  });

  const [copied, setCopied] = React.useState(false);

  // Update state when componentId changes
  React.useEffect(() => {
    if (compDef?.defaultConfig) {
      setConfigValues({ ...compDef.defaultConfig });
    }
  }, [compDef]);

  if (!compDef) {
    return (
      <div className="p-4 rounded-md bg-surface-02 border border-border-default font-mono text-xs text-text-muted">
        No properties definition available for &quot;{componentId}&quot;.
      </div>
    );
  }

  const handleFieldChange = (path: string, value: any) => {
    setConfigValues((prev) => {
      const updated = { ...prev };
      // Handle simple or single-level dot path
      if (path.includes(".")) {
        const [parent, child] = path.split(".");
        updated[parent] = {
          ...(updated[parent] || {}),
          [child]: value,
        };
      } else {
        updated[path] = value;
      }
      return updated;
    });
  };

  const getFieldValue = (path: string) => {
    if (path.includes(".")) {
      const [parent, child] = path.split(".");
      return configValues[parent]?.[child] ?? "";
    }
    return configValues[path] ?? "";
  };

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(configValues, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy JSON:", e);
    }
  };

  const sections = compDef.inspector || [];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border-default">
        <div className="flex items-center gap-2">
          <SlidersIcon className="w-4 h-4 text-text-muted" />
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
            Live Configuration Inspector
          </h4>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] border-border-default text-text-muted">
          Zod Schema Validated
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Interactive Field Controls */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="p-3.5 rounded-md bg-surface-01 border border-border-default space-y-3"
            >
              <div className="border-b border-border-subtle pb-2">
                <div className="text-xs font-semibold font-sans text-foreground">
                  {section.title}
                </div>
                {section.description && (
                  <div className="text-[11px] font-sans text-text-muted mt-0.5">
                    {section.description}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {section.fields.map((field) => {
                  const val = getFieldValue(field.path);

                  return (
                    <div
                      key={field.path}
                      className="flex flex-col gap-1 p-2 rounded bg-surface-02 border border-border-subtle"
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-text-secondary">
                          {field.label}
                        </label>
                        <span className="font-mono text-[9px] text-text-disabled">
                          {field.type}
                          {field.unit ? ` (${field.unit})` : ""}
                        </span>
                      </div>

                      {field.type === "boolean" ? (
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-[11px] text-text-muted">
                            {val ? "Enabled (true)" : "Disabled (false)"}
                          </span>
                          <Switch
                            checked={Boolean(val)}
                            onCheckedChange={(checked) => handleFieldChange(field.path, checked)}
                          />
                        </div>
                      ) : field.type === "select" && field.options ? (
                        <Select
                          value={val !== undefined && val !== null ? String(val) : undefined}
                          onValueChange={(selectedVal) => handleFieldChange(field.path, selectedVal)}
                        >
                          <SelectTrigger className="h-7 w-full px-2.5 font-mono text-xs bg-surface-03 border-border-default hover:border-border-hover text-foreground">
                            <SelectValue placeholder={`Select ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
                            {field.options.map((opt) => (
                              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                {opt.label} ({opt.value})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === "number" ? (
                        <Input
                          type="number"
                          value={val}
                          min={field.min}
                          max={field.max}
                          step={field.step || 1}
                          onChange={(e) =>
                            handleFieldChange(field.path, Number(e.target.value))
                          }
                          className="h-7 font-mono text-xs bg-surface-03 border-border-default"
                        />
                      ) : (
                        <Input
                          type="text"
                          value={val}
                          placeholder={field.placeholder || ""}
                          onChange={(e) => handleFieldChange(field.path, e.target.value)}
                          className="h-7 font-mono text-xs bg-surface-03 border-border-default"
                        />
                      )}

                      {field.description && (
                        <p className="text-[10px] text-text-muted font-sans mt-0.5">
                          {field.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Live Generated JSON Spec */}
        <div className="flex flex-col rounded-md bg-surface-01 border border-border-default overflow-hidden">
          <div className="h-9 px-3 bg-surface-02 border-b border-border-default flex items-center justify-between shrink-0">
            <span className="font-mono text-[11px] font-semibold text-text-secondary">
              runtime_config.json
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              className="h-6 px-2 text-[10px] font-mono gap-1 text-text-muted hover:text-foreground"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3 h-3 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3 h-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-3 bg-black flex-1 font-mono text-xs text-text-secondary overflow-auto max-h-[480px]">
            <pre className="text-[11px] leading-relaxed text-[#c9d1d9]">
              {JSON.stringify(configValues, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
