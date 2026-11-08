"use client";

import * as React from "react";
import {
  DatePicker,
  SearchField,
  FilterBar,
  ConfirmAction,
  SettingsField,
  Button,
  Switch,
  Kbd,
} from "@nxtqr/ui";
import { toast } from "sonner";
import { TrashIcon } from "@nxtqr/icons";

// ==========================================
// DATE PICKER DEMO
// ==========================================
export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date | null>(new Date());

  return (
    <div className="w-full max-w-xs space-y-2">
      <label className="text-xs font-mono text-muted-foreground uppercase">
        Simulation Audit Target
      </label>
      <DatePicker value={date} onChange={setDate} />
    </div>
  );
}

export const datePickerDemoCode = `import * as React from "react";
import { DatePicker } from "@nxtqr/ui";

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date | null>(new Date());

  return <DatePicker value={date} onChange={setDate} />;
}`;

// ==========================================
// SEARCH FIELD DEMO
// ==========================================
export function SearchFieldDemo() {
  const [query, setQuery] = React.useState("");

  return (
    <div className="w-full max-w-xs space-y-2">
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Filter node entities or traces..."
      />
      <div className="text-[11px] font-mono text-muted-foreground">
        Active Query: {query ? <span className="text-foreground font-semibold font-mono">"{query}"</span> : "None"}
      </div>
    </div>
  );
}

export const searchFieldDemoCode = `import * as React from "react";
import { SearchField } from "@nxtqr/ui";

export function SearchFieldDemo() {
  const [query, setQuery] = React.useState("");

  return (
    <SearchField
      value={query}
      onChange={setQuery}
      placeholder="Search nodes..."
    />
  );
}`;

// ==========================================
// FILTER BAR DEMO
// ==========================================
export function FilterBarDemo() {
  const [filters, setFilters] = React.useState([
    { id: "status", label: "Status", value: "ONLINE" },
    { id: "region", label: "Region", value: "US-East" },
  ]);

  return (
    <div className="w-full max-w-md p-3 rounded-md border border-border bg-surface">
      <FilterBar
        filters={filters}
        onRemove={(id) => setFilters((f) => f.filter((item) => item.id !== id))}
        onClearAll={() => setFilters([])}
      />
    </div>
  );
}

export const filterBarDemoCode = `import * as React from "react";
import { FilterBar } from "@nxtqr/ui";

export function FilterBarDemo() {
  const [filters, setFilters] = React.useState([
    { id: "status", label: "Status", value: "ONLINE" },
  ]);

  return (
    <FilterBar
      filters={filters}
      onRemove={(id) => setFilters((f) => f.filter((i) => i.id !== id))}
      onClearAll={() => setFilters([])}
    />
  );
}`;

// ==========================================
// CONFIRM ACTION DEMO
// ==========================================
export function ConfirmActionDemo() {
  return (
    <ConfirmAction
      trigger={
        <Button variant="destructive" size="sm" className="gap-2">
          <TrashIcon className="h-3.5 w-3.5" />
          Purge Telemetry History
        </Button>
      }
      title="Purge Telemetry Log Stream?"
      description="This will permanently delete all recorded simulation event frames from this workspace session."
      confirmLabel="Yes, Purge Stream"
      cancelLabel="Cancel"
      onConfirm={() => toast.success("Telemetry history purged.")}
    />
  );
}

export const confirmActionDemoCode = `import { ConfirmAction, Button } from "@nxtqr/ui";

export function ConfirmActionDemo() {
  return (
    <ConfirmAction
      trigger={<Button variant="destructive">Purge Telemetry</Button>}
      title="Purge Telemetry?"
      description="This action cannot be undone."
      confirmLabel="Purge"
      onConfirm={() => console.log("Purged")}
    />
  );
}`;

// ==========================================
// SETTINGS FIELD DEMO
// ==========================================
export function SettingsFieldDemo() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <div className="w-full max-w-md rounded-md border border-border bg-surface p-4">
      <SettingsField
        label="Strict RLS Audit Mode"
        description="Verify database role session credentials before dispatching edge tasks."
      >
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </SettingsField>
    </div>
  );
}

export const settingsFieldDemoCode = `import * as React from "react";
import { SettingsField, Switch } from "@nxtqr/ui";

export function SettingsFieldDemo() {
  const [enabled, setEnabled] = React.useState(true);

  return (
    <SettingsField
      label="Strict RLS Audit Mode"
      description="Verify database role session credentials."
    >
      <Switch checked={enabled} onCheckedChange={setEnabled} />
    </SettingsField>
  );
}`;

// ==========================================
// KBD DEMO
// ==========================================
export function KbdDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Command Palette:</span>
        <Kbd>⌘K</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Step Simulation:</span>
        <Kbd>Space</Kbd>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Zoom In:</span>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>+</Kbd>
      </div>
    </div>
  );
}

export const kbdDemoCode = `import { Kbd } from "@nxtqr/ui";

export function KbdDemo() {
  return (
    <div className="flex items-center gap-2">
      <Kbd>⌘K</Kbd>
      <Kbd>Space</Kbd>
    </div>
  );
}`;

