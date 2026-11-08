"use client";

import * as React from "react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
} from "@nxtqr/ui";
import { EmptyState } from "@nxtqr/ui";
import { toast } from "sonner";
import {
  AlertCircleIcon,
  TerminalIcon,
  LayersIcon,
} from "@nxtqr/icons";

// ==========================================
// ALERT DEMO
// ==========================================
export function AlertDemo() {
  return (
    <div className="w-full max-w-md space-y-3">
      <Alert>
        <TerminalIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold text-xs">Informational Banner</AlertTitle>
        <AlertDescription className="text-xs">
          Simulation workers are currently synchronized with the host telemetry bus.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold text-xs">Payload Limit Exceeded</AlertTitle>
        <AlertDescription className="text-xs">
          Incoming graph schema exceeds the 10MB memory allocation threshold.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export const alertDemoCode = `import { Alert, AlertTitle, AlertDescription } from "@nxtqr/ui";

export function AlertDemo() {
  return (
    <Alert>
      <AlertTitle>Informational</AlertTitle>
      <AlertDescription>Simulation workers active.</AlertDescription>
    </Alert>
  );
}`;

// ==========================================
// SONNER DEMO
// ==========================================
export function SonnerDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="default"
        onClick={() => toast.success("Graph snapshot committed to database.")}
      >
        Success Toast
      </Button>

      <Button
        variant="destructive"
        onClick={() => toast.error("Connection lost to edge worker cluster.")}
      >
        Error Toast
      </Button>

      <Button
        variant="outline"
        onClick={() =>
          toast("Worker Telemetry Notice", {
            description: "High CPU usage detected on node #2.",
            action: {
              label: "Inspect",
              onClick: () => console.log("Inspect node"),
            },
          })
        }
      >
        Action Toast
      </Button>
    </div>
  );
}

export const sonnerDemoCode = `import { Button } from "@nxtqr/ui";
import { toast } from "sonner";

export function SonnerDemo() {
  return (
    <Button
      variant="default"
      onClick={() => toast.success("Graph snapshot committed.")}
    >
      Trigger Toast
    </Button>
  );
}`;

// ==========================================
// EMPTY STATE DEMO
// ==========================================
export function EmptyStateDemo() {
  return (
    <div className="w-full max-w-md">
      <EmptyState
        icon={<LayersIcon className="h-5 w-5" />}
        title="No Active Trace Recordings"
        description="Launch an execution simulation trace or connect an edge dispatcher to visualize live data packets."
        action={
          <Button variant="default" size="sm" className="gap-2">
            <TerminalIcon className="h-3.5 w-3.5" />
            Start Simulation
          </Button>
        }
      />
    </div>
  );
}

export const emptyStateDemoCode = `import { EmptyState, Button } from "@nxtqr/ui";
import { LayersIcon } from "@nxtqr/icons";

export function EmptyStateDemo() {
  return (
    <EmptyState
      icon={LayersIcon}
      title="No Active Recordings"
      description="Launch an execution trace to visualize live data packets."
      action={<Button variant="default">Start</Button>}
    />
  );
}`;
