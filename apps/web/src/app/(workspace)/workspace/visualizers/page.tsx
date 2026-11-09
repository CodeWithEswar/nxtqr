"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from "@nxtqr/ui";
import { SlidersIcon, ChevronRightIcon } from "@nxtqr/icons";

interface VisualizerEngine {
  id: string;
  name: string;
  description: string;
  status: "Ready" | "Phase 02" | "Upcoming";
  nodesCount: number;
}

const VISUALIZERS: VisualizerEngine[] = [
  {
    id: "system-design",
    name: "System Design Visualizer",
    description: "Design distributed microservices, state machines, API gateways, and asynchronous queues.",
    status: "Ready",
    nodesCount: 18,
  },
  {
    id: "networking",
    name: "Networking & Mesh Visualizer",
    description: "Model packet flows, ingress controllers, subnet topologies, and zero-trust policies.",
    status: "Phase 02",
    nodesCount: 12,
  },
  {
    id: "database",
    name: "Database Cluster Visualizer",
    description: "Visualize read/write replication lags, sharding topologies, and transaction consensus.",
    status: "Phase 02",
    nodesCount: 8,
  },
  {
    id: "algorithms",
    name: "Algorithms & Data Structures",
    description: "Step through execution traces, graph traversals, and dynamic memory allocations.",
    status: "Upcoming",
    nodesCount: 10,
  },
  {
    id: "ai-agents",
    name: "AI Agents & Tool Pipelines",
    description: "Model multi-agent workflows, tool execution loops, context windows, and token budgets.",
    status: "Upcoming",
    nodesCount: 6,
  },
  {
    id: "cicd",
    name: "CI/CD Pipeline Engine",
    description: "DAG pipeline stages, parallel matrix builds, caching layers, and deployment gates.",
    status: "Upcoming",
    nodesCount: 9,
  },
];

export default function VisualizersIndexPage() {
  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scrollbar-thin select-none">
      <div className="space-y-1">
        <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Visualizer Engines
        </h1>
        <p className="font-sans text-xs text-text-muted">
          Domain-specific visualizer modules unified under the shared workspace shell.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {VISUALIZERS.map((viz) => (
          <Card
            key={viz.id}
            className="border border-border-default bg-surface-01 hover:bg-surface-02 transition-colors group shadow-level-1 flex flex-col justify-between"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-02 border border-border-default group-hover:border-border-strong text-foreground transition-colors shrink-0">
                    <SlidersIcon className="h-3.5 w-3.5" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground truncate">
                    {viz.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className={`font-mono text-[9px] px-1.5 py-0.5 rounded-md border-border-subtle shrink-0 ${
                    viz.status === "Ready"
                      ? "text-emerald-400 border-border-strong"
                      : "text-text-muted"
                  }`}
                >
                  {viz.status}
                </Badge>
              </div>
              <CardDescription className="text-xs text-text-muted line-clamp-2 mt-1">
                {viz.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between border-t border-border-subtle pt-2.5">
                <span className="font-mono text-[10px] text-text-muted">
                  {viz.nodesCount} Canonical Nodes
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] font-mono gap-1 text-text-muted group-hover:text-foreground"
                >
                  <Link href="/workspace">
                    <span>Open</span>
                    <ChevronRightIcon className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
