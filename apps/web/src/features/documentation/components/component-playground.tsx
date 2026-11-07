"use client";

import * as React from "react";
import {
  Button,
  Input,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
import { CodeBlock } from "./code-block";

export interface PlaygroundButtonState {
  text: string;
  variant: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size: "default" | "sm" | "lg";
  disabled: boolean;
  isLoading: boolean;
}

export function ButtonPlayground() {
  const initialState: PlaygroundButtonState = {
    text: "Execute Command",
    variant: "default",
    size: "default",
    disabled: false,
    isLoading: false,
  };

  const [state, setState] = React.useState<PlaygroundButtonState>(initialState);

  const generatedCode = `<Button
  variant="${state.variant}"
  size="${state.size}"${state.disabled ? "\n  disabled" : ""}${state.isLoading ? "\n  isLoading" : ""}
>
  ${state.text}
</Button>`;

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1">
      <div className="flex items-center justify-between border-b border-border bg-secondary-surface/60 px-4 py-2">
        <span className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
          Interactive Button Playground
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setState(initialState)}
          className="h-6 px-2 text-[10px] font-mono"
        >
          <RefreshIcon className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Live Canvas Viewport */}
        <div className="md:col-span-2 min-h-[220px] flex items-center justify-center p-8 bg-black/60">
          <Button
            variant={state.variant}
            size={state.size}
            disabled={state.disabled}
            isLoading={state.isLoading}
          >
            {state.text}
          </Button>
        </div>

        {/* Typed Controls Panel */}
        <div className="p-4 bg-surface space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-muted-foreground uppercase">
              Button Label
            </label>
            <Input
              value={state.text}
              onChange={(e) => setState((prev) => ({ ...prev, text: e.target.value }))}
              className="h-7 text-xs font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-muted-foreground uppercase">Variant</label>
            <Select
              value={state.variant}
              onValueChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  variant: v as PlaygroundButtonState["variant"],
                }))
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Accent)</SelectItem>
                <SelectItem value="secondary">Secondary (Surface)</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
                <SelectItem value="destructive">Destructive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-muted-foreground uppercase">Size</label>
            <Select
              value={state.size}
              onValueChange={(v) =>
                setState((prev) => ({
                  ...prev,
                  size: v as PlaygroundButtonState["size"],
                }))
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Small (h-7)</SelectItem>
                <SelectItem value="default">Default (h-8)</SelectItem>
                <SelectItem value="lg">Large (h-9)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-subtle-border">
            <span className="text-xs text-foreground font-medium">Disabled</span>
            <Switch
              checked={state.disabled}
              onCheckedChange={(checked) => setState((prev) => ({ ...prev, disabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground font-medium">Loading Spinner</span>
            <Switch
              checked={state.isLoading}
              onCheckedChange={(checked) => setState((prev) => ({ ...prev, isLoading: checked }))}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3 bg-[#0A0A0A]">
        <CodeBlock language="tsx" code={generatedCode} />
      </div>
    </div>
  );
}
