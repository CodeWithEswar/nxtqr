"use client";

import * as React from "react";
import { ExecutionTraceViewer } from "../../../visualizers/shared/trace/execution-trace-viewer";
import { useGraphEditorStore } from "@nxtqr/state";
import { Button } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";

export function TracePlayground() {
  const addTraceEvent = useGraphEditorStore((state) => state.addTraceEvent);
  const clearTraceEvents = useGraphEditorStore((state) => state.clearTraceEvents);

  const handleInjectSampleTraces = () => {
    clearTraceEvents();
    const samples = [
      { id: "evt_1", runId: "run_01", step: 1, timestamp: 0, type: "INGRESS_RECEIVED", targetNodeId: "node_ingress", status: "success" as const, payload: { path: "/api/v1/telemetry", durationMs: 1.2, memoryMb: 24 } },
      { id: "evt_2", runId: "run_01", step: 2, timestamp: 14, type: "RATE_LIMIT_CHECK", targetNodeId: "node_ingress", status: "success" as const, payload: { allowed: true, clientIp: "192.168.1.1", durationMs: 0.8, memoryMb: 24 } },
      { id: "evt_3", runId: "run_01", step: 3, timestamp: 42, type: "LAMBDA_EXECUTE", targetNodeId: "node_worker", status: "success" as const, payload: { runtime: "NodeJS 20", durationMs: 6.4, memoryMb: 48 } },
      { id: "evt_4", runId: "run_01", step: 4, timestamp: 98, type: "DATABASE_WRITE", targetNodeId: "node_database", status: "success" as const, payload: { query: "INSERT INTO telemetry...", durationMs: 3.8, memoryMb: 52 } },
      { id: "evt_5", runId: "run_01", step: 5, timestamp: 145, type: "RESPONSE_DISPATCH", targetNodeId: "node_egress", status: "success" as const, payload: { status: 200, sizeBytes: 1048, durationMs: 1.1, memoryMb: 28 } },
    ];

    samples.forEach((s) => addTraceEvent(s));
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            Execution Trace Viewer Laboratory
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInjectSampleTraces}
              className="h-7 text-xs font-mono whitespace-nowrap"
            >
              <span className="hidden sm:inline">Load Samples</span>
              <span className="sm:hidden">Samples</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearTraceEvents}
              className="h-7 text-xs font-mono whitespace-nowrap"
            >
              Clear
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Chronological event stream with search query filtering, relative timestamp formatting, and structured payload inspection.
        </p>
      </div>

      {/* Live Execution Trace Viewer Stage */}
      <div className="p-4 bg-black border border-subtle-border rounded-md">
        <ExecutionTraceViewer />
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Trace Viewer Implementation
        </div>
        <CodeBlock
          code={`import { ExecutionTraceViewer } from "@nxtqr/web/features/visualizers";

// Render within studio telemetry drawer
<div className="h-64 border-t border-border">
  <ExecutionTraceViewer />
</div>`}
          language="tsx"
          filename="trace-usage.tsx"
        />
      </div>
    </div>
  );
}
