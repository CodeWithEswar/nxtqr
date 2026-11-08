"use client";

import * as React from "react";
import {
  Button,
  Badge,
  Input,
  Switch,
  Slider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
import { CodeBlock } from "../code-block";

// ==========================================
// 1. BUTTON PLAYGROUND
// ==========================================
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
    <PlaygroundContainer
      title="Interactive Button Playground"
      onReset={() => setState(initialState)}
      code={generatedCode}
      preview={
        <Button
          variant={state.variant}
          size={state.size}
          disabled={state.disabled}
          isLoading={state.isLoading}
        >
          {state.text}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">Label</label>
          <Input
            value={state.text}
            onChange={(e) => setState((prev) => ({ ...prev, text: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">Variant</label>
          <Select
            value={state.variant}
            onValueChange={(v) =>
              setState((prev) => ({ ...prev, variant: v as PlaygroundButtonState["variant"] }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Accent)</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
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
              setState((prev) => ({ ...prev, size: v as PlaygroundButtonState["size"] }))
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

        <div className="flex items-center justify-between pt-2 border-t border-subtle-border">
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
    </PlaygroundContainer>
  );
}

// ==========================================
// 2. BADGE PLAYGROUND
// ==========================================
export interface PlaygroundBadgeState {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive" | "muted";
}

export function BadgePlayground() {
  const [state, setState] = React.useState<PlaygroundBadgeState>({
    label: "ONLINE",
    variant: "default",
  });

  const generatedCode = `<Badge variant="${state.variant}">
  ${state.label}
</Badge>`;

  return (
    <PlaygroundContainer
      title="Badge Interactive Playground"
      onReset={() => setState({ label: "ONLINE", variant: "default" })}
      code={generatedCode}
      preview={<Badge variant={state.variant}>{state.label}</Badge>}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">Label</label>
          <Input
            value={state.label}
            onChange={(e) => setState((prev) => ({ ...prev, label: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">Variant</label>
          <Select
            value={state.variant}
            onValueChange={(v) =>
              setState((prev) => ({ ...prev, variant: v as PlaygroundBadgeState["variant"] }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Accent)</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="destructive">Destructive</SelectItem>
              <SelectItem value="muted">Muted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </PlaygroundContainer>
  );
}

// ==========================================
// 3. DIALOG PLAYGROUND
// ==========================================
export function DialogPlayground() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [title, setTitle] = React.useState("Confirm Deployment");
  const [description, setDescription] = React.useState(
    "This will deploy the current graph execution pipeline to production cluster nodes.",
  );

  const generatedCode = `<Dialog>
  <DialogTrigger asChild>
    <Button variant="default">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>${title}</DialogTitle>
      <DialogDescription>
        ${description}
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="default">Proceed</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`;

  return (
    <PlaygroundContainer
      title="Dialog Interactive Playground"
      onReset={() => {
        setTitle("Confirm Deployment");
        setDescription(
          "This will deploy the current graph execution pipeline to production cluster nodes.",
        );
      }}
      code={generatedCode}
      preview={
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="default">Open Dialog Preview</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={() => setIsOpen(false)}>
                Proceed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">Dialog Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </PlaygroundContainer>
  );
}

// ==========================================
// 4. SWITCH PLAYGROUND
// ==========================================
export function SwitchPlayground() {
  const [checked, setChecked] = React.useState(true);
  const [disabled, setDisabled] = React.useState(false);

  const generatedCode = `<div className="flex items-center gap-3">
  <Switch
    checked={${checked}}${disabled ? "\n    disabled" : ""}
    onCheckedChange={(checked) => setChecked(checked)}
  />
  <span className="text-xs font-mono">
    Telemetry: {${checked} ? "ACTIVE" : "STANDBY"}
  </span>
</div>`;

  return (
    <PlaygroundContainer
      title="Switch Interactive Playground"
      onReset={() => {
        setChecked(true);
        setDisabled(false);
      }}
      code={generatedCode}
      preview={
        <div className="flex items-center gap-3">
          <Switch
            checked={checked}
            disabled={disabled}
            onCheckedChange={(c) => setChecked(c)}
          />
          <span className="text-xs font-mono text-foreground">
            Telemetry: {checked ? "ACTIVE" : "STANDBY"}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground font-medium">Checked</span>
          <Switch checked={checked} onCheckedChange={setChecked} />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-subtle-border">
          <span className="text-xs text-foreground font-medium">Disabled</span>
          <Switch checked={disabled} onCheckedChange={setDisabled} />
        </div>
      </div>
    </PlaygroundContainer>
  );
}

// ==========================================
// 5. SLIDER PLAYGROUND
// ==========================================
export function SliderPlayground() {
  const [value, setValue] = React.useState([45]);
  const [step, setStep] = React.useState(5);

  const generatedCode = `<div className="space-y-2 w-64">
  <div className="flex justify-between text-xs font-mono">
    <span>Zoom Level</span>
    <span>{${value[0]}}%</span>
  </div>
  <Slider
    value={[${value[0]}]}
    min={0}
    max={100}
    step={${step}}
    onValueChange={setValue}
  />
</div>`;

  return (
    <PlaygroundContainer
      title="Slider Interactive Playground"
      onReset={() => {
        setValue([45]);
        setStep(5);
      }}
      code={generatedCode}
      preview={
        <div className="space-y-2 w-64">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>Simulation Clock</span>
            <span className="text-foreground font-semibold">{value[0]}ms</span>
          </div>
          <Slider
            value={value}
            min={0}
            max={100}
            step={step}
            onValueChange={setValue}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">
            Value ({value[0]})
          </label>
          <Slider
            value={value}
            min={0}
            max={100}
            step={1}
            onValueChange={setValue}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-muted-foreground uppercase">Step</label>
          <Select
            value={String(step)}
            onValueChange={(v) => setStep(Number(v))}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 (Continuous)</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </PlaygroundContainer>
  );
}

// ==========================================
// REUSABLE PLAYGROUND SHELL
// ==========================================
interface PlaygroundContainerProps {
  title: string;
  onReset: () => void;
  code: string;
  preview: React.ReactNode;
  children: React.ReactNode;
}

function PlaygroundContainer({
  title,
  onReset,
  code,
  preview,
  children,
}: PlaygroundContainerProps) {
  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1">
      <div className="flex items-center justify-between border-b border-border bg-secondary-surface/60 px-4 py-2">
        <span className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
          {title}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="h-6 px-2 text-[10px] font-mono"
        >
          <RefreshIcon className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Live Canvas Viewport */}
        <div className="md:col-span-2 min-h-[220px] flex items-center justify-center p-8 bg-black">
          {preview}
        </div>

        {/* Typed Controls Panel */}
        <div className="p-4 bg-surface">{children}</div>
      </div>

      <div className="border-t border-border p-3 bg-[#0A0A0A]">
        <CodeBlock language="tsx" code={code} className="my-0" />
      </div>
    </div>
  );
}
