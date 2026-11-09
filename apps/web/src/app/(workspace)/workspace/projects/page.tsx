"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from "@nxtqr/ui";
import { FolderIcon, PlusIcon } from "@nxtqr/icons";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  engine: string;
  nodes: number;
  updatedAt: string;
}

const LOCAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj_01",
    name: "Distributed Event Pipeline",
    description: "High-throughput Kafka streaming pipeline with partitioned consumer groups and dead-letter queues.",
    engine: "System Design Visualizer",
    nodes: 14,
    updatedAt: "10m ago",
  },
  {
    id: "proj_02",
    name: "Microservices Ingress Mesh",
    description: "Envoy gateway routing layer with JWT authentication filter and rate-limiting sidecars.",
    engine: "Networking Visualizer",
    nodes: 8,
    updatedAt: "1h ago",
  },
  {
    id: "proj_03",
    name: "Multi-Region Database Replication",
    description: "PostgreSQL active-passive cluster with read replicas and automated failover sentinel.",
    engine: "Database Visualizer",
    nodes: 6,
    updatedAt: "1d ago",
  },
];

export default function WorkspaceProjectsPage() {
  return (
    <div className="h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scrollbar-thin select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Workspace Projects
          </h1>
          <p className="font-sans text-xs text-text-muted">
            Manage persistent engineering architectures, diagrams, and simulation models.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          className="h-8 px-3 font-mono text-xs gap-1.5 rounded-md bg-foreground text-background shrink-0 self-start sm:self-auto"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>New Project</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {LOCAL_PROJECTS.map((proj) => (
          <Card
            key={proj.id}
            className="border border-border-default bg-surface-01 hover:bg-surface-02 transition-colors cursor-pointer group shadow-level-1"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-02 border border-border-default group-hover:border-border-strong text-foreground transition-colors shrink-0">
                    <FolderIcon className="h-3.5 w-3.5" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-foreground truncate">
                    {proj.name}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded-md border-border-subtle bg-surface-00 text-text-muted shrink-0"
                >
                  {proj.nodes} Nodes
                </Badge>
              </div>
              <CardDescription className="text-xs text-text-muted line-clamp-2 mt-1">
                {proj.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between border-t border-border-subtle pt-2 text-[10px] font-mono text-text-muted">
                <span>{proj.engine}</span>
                <span>{proj.updatedAt}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
