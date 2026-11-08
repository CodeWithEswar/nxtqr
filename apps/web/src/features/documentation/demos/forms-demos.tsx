"use client";

import * as React from "react";
import {
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Slider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Calendar,
} from "@nxtqr/ui";

// ==========================================
// INPUT DEMO
// ==========================================
export function InputDemo() {
  const [val, setVal] = React.useState("api_live_94f83b12");

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Workspace API Key
        </label>
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Enter API key..."
        />
        <span className="text-[11px] font-mono text-muted-foreground">
          Never expose secret keys to client browser runtimes.
        </span>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Disabled Input
        </label>
        <Input disabled value="read_only_replica_01" />
      </div>
    </div>
  );
}

export const inputDemoCode = `import { Input } from "@nxtqr/ui";

export function InputDemo() {
  return (
    <div className="space-y-1.5 w-full max-w-sm">
      <label className="text-xs font-mono text-muted-foreground">Workspace Key</label>
      <Input placeholder="Enter API key..." defaultValue="api_live_94f83b12" />
    </div>
  );
}`;

// ==========================================
// TEXTAREA DEMO
// ==========================================
export function TextareaDemo() {
  const [text, setText] = React.useState(
    "SELECT node_id, execution_latency_ms FROM simulation_traces WHERE status = 'COMPLETED' LIMIT 10;",
  );

  return (
    <div className="w-full max-w-md space-y-2">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        SQL Query Console
      </label>
      <Textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="font-mono text-xs"
        placeholder="Enter SQL command..."
      />
      <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
        <span>PostgreSQL 16 · Supabase Dialect</span>
        <span>{text.length} chars</span>
      </div>
    </div>
  );
}

export const textareaDemoCode = `import { Textarea } from "@nxtqr/ui";

export function TextareaDemo() {
  return (
    <Textarea
      rows={4}
      placeholder="Enter SQL query..."
      defaultValue="SELECT * FROM nodes;"
    />
  );
}`;

// ==========================================
// CHECKBOX DEMO
// ==========================================
export function CheckboxDemo() {
  const [checked, setChecked] = React.useState(true);

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="strict-auth"
          checked={checked}
          onCheckedChange={(c) => setChecked(!!c)}
        />
        <label
          htmlFor="strict-auth"
          className="text-xs font-medium text-foreground cursor-pointer select-none"
        >
          Enforce Row-Level Security (RLS) on all PostgreSQL tables
        </label>
      </div>
      <div className="flex items-center space-x-2 opacity-60">
        <Checkbox id="mock-data" disabled />
        <label
          htmlFor="mock-data"
          className="text-xs font-medium text-muted-foreground select-none"
        >
          Generate simulated mock telemetry (Disabled in production)
        </label>
      </div>
    </div>
  );
}

export const checkboxDemoCode = `import { Checkbox } from "@nxtqr/ui";

export function CheckboxDemo() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="rls" defaultChecked />
      <label htmlFor="rls" className="text-xs font-medium">
        Enforce Row-Level Security
      </label>
    </div>
  );
}`;

// ==========================================
// RADIO GROUP DEMO
// ==========================================
export function RadioGroupDemo() {
  const [val, setVal] = React.useState("isolated");

  return (
    <RadioGroup value={val} onValueChange={setVal} className="space-y-2">
      <div className="flex items-center space-x-3 p-3 rounded-md border border-border bg-surface">
        <RadioGroupItem value="isolated" id="r1" />
        <label htmlFor="r1" className="cursor-pointer">
          <span className="block text-xs font-semibold text-foreground">Isolated Sandbox</span>
          <span className="block text-[11px] text-muted-foreground">
            Zero network outbound with memory heap capping.
          </span>
        </label>
      </div>
      <div className="flex items-center space-x-3 p-3 rounded-md border border-border bg-surface">
        <RadioGroupItem value="networked" id="r2" />
        <label htmlFor="r2" className="cursor-pointer">
          <span className="block text-xs font-semibold text-foreground">Clustered Network</span>
          <span className="block text-[11px] text-muted-foreground">
            Enables peer-to-peer dispatcher simulation.
          </span>
        </label>
      </div>
    </RadioGroup>
  );
}

export const radioGroupDemoCode = `import { RadioGroup, RadioGroupItem } from "@nxtqr/ui";

export function RadioGroupDemo() {
  return (
    <RadioGroup defaultValue="isolated" className="space-y-2">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="isolated" id="isolated" />
        <label htmlFor="isolated" className="text-xs">Isolated Sandbox</label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="clustered" id="clustered" />
        <label htmlFor="clustered" className="text-xs">Clustered Network</label>
      </div>
    </RadioGroup>
  );
}`;

// ==========================================
// SWITCH DEMO
// ==========================================
export function SwitchDemo() {
  const [active, setActive] = React.useState(true);

  return (
    <div className="flex items-center justify-between w-full max-w-sm p-4 rounded-md border border-border bg-surface">
      <div className="space-y-0.5">
        <span className="text-xs font-semibold text-foreground">Telemetry Streaming</span>
        <span className="text-[11px] text-muted-foreground block">
          Stream microsecond execution traces to the visualizer canvas.
        </span>
      </div>
      <Switch checked={active} onCheckedChange={setActive} />
    </div>
  );
}

export const switchDemoCode = `import { Switch } from "@nxtqr/ui";

export function SwitchDemo() {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-md">
      <span className="text-xs font-semibold">Telemetry Streaming</span>
      <Switch defaultChecked />
    </div>
  );
}`;

// ==========================================
// SLIDER DEMO
// ==========================================
export function SliderDemo() {
  const [val, setVal] = React.useState([60]);

  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">Simulation Throttle</span>
        <span className="text-foreground font-semibold">{val[0]} FPS</span>
      </div>
      <Slider value={val} min={10} max={120} step={5} onValueChange={setVal} />
    </div>
  );
}

export const sliderDemoCode = `import { Slider } from "@nxtqr/ui";

export function SliderDemo() {
  return (
    <Slider defaultValue={[60]} min={10} max={120} step={5} />
  );
}`;

// ==========================================
// SELECT DEMO
// ==========================================
export function SelectDemo() {
  const [env, setEnv] = React.useState("production");

  return (
    <div className="w-full max-w-xs space-y-2">
      <label className="text-xs font-mono text-muted-foreground uppercase">Target Environment</label>
      <Select value={env} onValueChange={setEnv}>
        <SelectTrigger>
          <SelectValue placeholder="Select an environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="development">Development (Localhost)</SelectItem>
          <SelectItem value="staging">Staging (Preview Branch)</SelectItem>
          <SelectItem value="production">Production (Global Edge)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const selectDemoCode = `import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";

export function SelectDemo() {
  return (
    <Select defaultValue="production">
      <SelectTrigger>
        <SelectValue placeholder="Select environment" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="development">Development</SelectItem>
        <SelectItem value="staging">Staging</SelectItem>
        <SelectItem value="production">Production</SelectItem>
      </SelectContent>
    </Select>
  );
}`;

// ==========================================
// CALENDAR DEMO
// ==========================================
export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-md border border-border bg-surface p-2 shadow-level-1">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        Selected Audit Date:{" "}
        <span className="text-foreground font-semibold">
          {date ? date.toLocaleDateString() : "None"}
        </span>
      </span>
    </div>
  );
}

export const calendarDemoCode = `import * as React from "react";
import { Calendar } from "@nxtqr/ui";

export function CalendarDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border border-border"
    />
  );
}`;
