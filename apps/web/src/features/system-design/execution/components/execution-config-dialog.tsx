"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { CloseIcon, SlidersIcon, PlayIcon } from "@nxtqr/icons";
import { useExecutionStore, type AllScenarioPresetId } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import type { HttpMethod } from "@nxtqr/architecture-execution";

export interface ExecutionConfigDialogProps {
  onClose?: () => void;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const PRESET_OPTIONS: { id: AllScenarioPresetId; label: string; description: string }[] = [
  {
    id: "parallel-fanout",
    label: "Parallel API Calls (Fan-Out / Fan-In)",
    description: "Concurrently dispatches parallel calls to Payment & Inventory services, synchronizing at a fan-in barrier.",
  },
  {
    id: "async-queue-workers",
    label: "Asynchronous Queue Workers (Pub/Sub)",
    description: "Publishes events to an async topic delivering to Email and Analytics workers independently with acknowledgments.",
  },
  {
    id: "message-retry-dlq",
    label: "Message Failure, Exponential Retry & DLQ",
    description: "Models worker failure, negative acknowledgment, exponential backoff retries, and dead-letter queue routing.",
  },
  {
    id: "fanin-partial-failure",
    label: "Fan-In Barrier with Partial Failure",
    description: "Evaluates fan-in policy when one parallel service fails and another succeeds.",
  },
  {
    id: "cache-miss",
    label: "Cache Miss → DB Read & Repopulate",
    description: "Evaluates Redis miss, fetches persistent row from PostgreSQL, stores in cache, and returns 200.",
  },
  {
    id: "cache-hit",
    label: "Cache Hit (DB Bypassed)",
    description: "Evaluates unexpired key in Redis and returns cached payload immediately, skipping database I/O.",
  },
  {
    id: "load-balancer",
    label: "Round-Robin Load Balancing",
    description: "Deterministically balances incoming traffic across downstream service instances.",
  },
  {
    id: "database-write",
    label: "Database Mutation (POST Write)",
    description: "Performs HTTP POST insert into database fixture table and returns 201 Created.",
  },
  {
    id: "external-error",
    label: "External Outage (HTTP 503)",
    description: "Simulates upstream third-party failure and propagates modeled error response.",
  },
  {
    id: "gateway-404",
    label: "Gateway Route Not Found (404)",
    description: "Path fails route table matching and returns HTTP 404 Not Found.",
  },
  {
    id: "database_outage",
    label: "Resilience: Database Outage",
    description: "Injected PostgreSQL hard outage; callers fail fast or timeout, testing database failure resilience.",
  },
  {
    id: "service_crash",
    label: "Resilience: Service Crash (Retried)",
    description: "Downstream service crashes; caller triggers exponential backoff retries with jitter.",
  },
  {
    id: "latency_spike",
    label: "Resilience: +800ms Latency Spike",
    description: "Cross-AZ network transit latency spike causes upstream SLA deadline timeout.",
  },
  {
    id: "circuit_breaker",
    label: "Resilience: 3-State Circuit Breaker",
    description: "Repeated failures trip circuit to OPEN, fast-failing subsequent requests until HALF-OPEN probe succeeds.",
  },
  {
    id: "failover",
    label: "Resilience: Standby Failover",
    description: "Primary service fails; traffic dynamically reroutes to healthy secondary replica.",
  },
  {
    id: "packet_loss",
    label: "Resilience: 50% Packet Loss",
    description: "Unstable network link drops packets deterministically, driving retry retransmissions.",
  },
  {
    id: "custom",
    label: "Custom Flow",
    description: "Manual path, method, and branch configuration.",
  },
];

export function ExecutionConfigDialog({ onClose }: ExecutionConfigDialogProps) {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);

  const configuration = useExecutionStore((s) => s.configuration);
  const activePresetId = useExecutionStore((s) => s.activePresetId);
  const setScenarioPreset = useExecutionStore((s) => s.setScenarioPreset);
  const updateConfiguration = useExecutionStore((s) => s.updateConfiguration);
  const setEntryNodeId = useExecutionStore((s) => s.setEntryNodeId);
  const setSelectedBranch = useExecutionStore((s) => s.setSelectedBranch);
  const toggleConfigDialog = useExecutionStore((s) => s.toggleConfigDialog);
  const runExecution = useExecutionStore((s) => s.runExecution);

  const [activeMethod, setActiveMethod] = React.useState<HttpMethod>(configuration.request.method);
  const [activePath, setActivePath] = React.useState<string>(configuration.request.path);
  const [bodyText, setBodyText] = React.useState<string>(
    configuration.request.body ? JSON.stringify(configuration.request.body, null, 2) : ""
  );

  const selectedEntryNodeId = configuration.entryNodeId || nodes[0]?.id || "";

  const handlePresetChange = (presetId: AllScenarioPresetId) => {
    setScenarioPreset(presetId, nodes, edges);
    if (presetId === "cache-miss" || presetId === "cache-hit") {
      setActiveMethod("GET");
      setActivePath("/api/products/42");
    } else if (presetId === "database-write") {
      setActiveMethod("POST");
      setActivePath("/api/orders");
      setBodyText(JSON.stringify({ item: "Enterprise NVMe Server", quantity: 2 }, null, 2));
    } else if (presetId === "gateway-404") {
      setActiveMethod("GET");
      setActivePath("/api/v2/secure-only");
    } else if (presetId === "parallel-fanout") {
      setActiveMethod("POST");
      setActivePath("/api/v1/orders");
      setBodyText(JSON.stringify({ item: "MacBook Pro M4 Max", amount: 3999.0 }, null, 2));
    } else if (presetId === "async-queue-workers") {
      setActiveMethod("POST");
      setActivePath("/api/v1/checkout");
      setBodyText(JSON.stringify({ orderId: "ord_9981", status: "confirmed" }, null, 2));
    } else if (presetId === "message-retry-dlq") {
      setActiveMethod("POST");
      setActivePath("/api/v1/settlements");
      setBodyText(JSON.stringify({ settlementId: "stl_550", amount: 15000.0 }, null, 2));
    } else if (presetId === "fanin-partial-failure") {
      setActiveMethod("POST");
      setActivePath("/api/v1/orders/sensitive");
      setBodyText(JSON.stringify({ flagged: true }, null, 2));
    }
  };

  React.useEffect(() => {
    if (!configuration.entryNodeId && nodes.length > 0) {
      setEntryNodeId(nodes[0].id);
    }
  }, [configuration.entryNodeId, nodes, setEntryNodeId]);

  // Identify components with multiple outgoing connections
  const branchingNodes = React.useMemo(() => {
    const map = new Map<string, typeof edges>();
    for (const edge of edges) {
      if (!map.has(edge.source)) map.set(edge.source, []);
      map.get(edge.source)!.push(edge);
    }
    return nodes
      .filter((n) => (map.get(n.id)?.length || 0) > 1)
      .map((n) => ({
        node: n,
        outEdges: map.get(n.id)!,
      }));
  }, [nodes, edges]);

  const handleSaveAndRun = () => {
    let parsedBody: unknown = undefined;
    if (bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    updateConfiguration({
      request: {
        ...configuration.request,
        method: activeMethod,
        path: activePath,
        body: parsedBody,
      },
    });

    toggleConfigDialog(false);
    runExecution(nodes, edges);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="execution-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-none p-4 select-none"
    >
      <div className="w-full max-w-lg bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-01 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <SlidersIcon className="w-4 h-4 text-text-secondary" />
            <h3 id="execution-config-title" className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Architecture Execution Configuration
            </h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleConfigDialog(false))}
            className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
            title="Close"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Scenario Preset */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-text-muted font-semibold uppercase tracking-wider block">
                Execution Scenario Preset
              </label>
              <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-secondary">
                Modeled Behavior
              </Badge>
            </div>
            <Select
              value={activePresetId}
              onValueChange={(val) => handlePresetChange(val as AllScenarioPresetId)}
            >
              <SelectTrigger className="h-8 w-full font-mono text-xs bg-surface-01 border-border-default hover:border-border-hover text-foreground">
                <SelectValue placeholder="Select scenario preset..." />
              </SelectTrigger>
              <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2 z-[60]">
                {PRESET_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] font-sans text-text-muted">
              {PRESET_OPTIONS.find((p) => p.id === activePresetId)?.description}
            </p>
          </div>

          {/* 2. Starting Component */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-text-muted font-semibold uppercase tracking-wider block">
              Starting Component (Entry Point)
            </label>
            <Select
              value={selectedEntryNodeId || undefined}
              onValueChange={(val) => setEntryNodeId(val)}
            >
              <SelectTrigger className="h-8 w-full font-mono text-xs bg-surface-01 border-border-default hover:border-border-hover text-foreground">
                <SelectValue placeholder="Select starting component..." />
              </SelectTrigger>
              <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2 z-[60]">
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.label || node.id} ({String((node.data as any)?.componentType || node.type || "service")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Request Details */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-text-muted font-semibold uppercase tracking-wider block">
              Simulated Request
            </label>
            <div className="flex items-center gap-2">
              {/* Method select */}
              <div className="flex items-center rounded-md border border-border-default bg-surface-01 p-0.5 shrink-0">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveMethod(m)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors",
                      activeMethod === m
                        ? "bg-surface-04 text-foreground shadow-level-3 border border-border-strong"
                        : "text-text-muted hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Path input */}
              <input
                type="text"
                value={activePath}
                onChange={(e) => setActivePath(e.target.value)}
                placeholder="/api/v1/resource"
                className="flex-1 h-8 px-2.5 rounded-md bg-surface-01 border border-border-default text-xs font-mono text-foreground focus:outline-none focus:border-border-strong"
              />
            </div>

            {/* Body Payload (POST/PUT/PATCH) */}
            {(activeMethod === "POST" || activeMethod === "PUT" || activeMethod === "PATCH") && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-mono text-text-muted block">JSON Request Body</span>
                <textarea
                  rows={3}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full p-2 rounded-md bg-surface-01 border border-border-default text-xs font-mono text-foreground focus:outline-none focus:border-border-strong resize-y"
                />
              </div>
            )}
          </div>

          {/* 3. Branch Routing Controls if branching exists */}
          {branchingNodes.length > 0 && (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              <label className="text-[11px] font-mono text-text-muted font-semibold uppercase tracking-wider block">
                Branch Routing Decisions
              </label>
              <div className="space-y-2">
                {branchingNodes.map(({ node, outEdges }) => (
                  <div key={node.id} className="p-2.5 rounded bg-surface-01 border border-border-subtle space-y-1.5">
                    <span className="text-xs font-mono font-semibold text-foreground block">
                      {node.label || node.id}
                    </span>
                    <Select
                      value={configuration.routing.selectedBranches?.[node.id] || outEdges[0]?.id || undefined}
                      onValueChange={(val) => setSelectedBranch(node.id, val)}
                    >
                      <SelectTrigger className="h-7 w-full px-2 font-mono text-[11px] bg-surface-02 border-border-default hover:border-border-hover text-foreground">
                        <SelectValue placeholder="Select outgoing route..." />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2 z-[60]">
                        {outEdges.map((e) => {
                          const targetNode = nodes.find((n) => n.id === e.target);
                          return (
                            <SelectItem key={e.id} value={e.id}>
                              Route along &quot;{e.label || e.id}&quot; → {targetNode?.label || e.target}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Safety Limits */}
          <div className="p-2.5 rounded bg-surface-01 border border-border-subtle grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Max Hops</span>
              <span className="text-foreground font-semibold">{configuration.limits.maxHops} hops</span>
            </div>
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Max Events</span>
              <span className="text-foreground font-semibold">{configuration.limits.maxEvents} events</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-surface-01 border-t border-border-subtle shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleConfigDialog(false))}
            className="h-7 text-xs font-mono text-text-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAndRun}
            className="h-7 px-3 text-xs font-mono font-medium rounded-md gap-1.5 bg-foreground text-background hover:bg-neutral-200"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>Apply & Run</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
