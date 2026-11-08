"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Progress,
  Skeleton,
  Button,
} from "@nxtqr/ui";
import { DataTable, type ColumnDef } from "@nxtqr/ui";
import { TerminalIcon } from "@nxtqr/icons";

// ==========================================
// TABLE DEMO
// ==========================================
export function TableDemo() {
  const workers = [
    { id: "worker_edge_01", region: "us-east-1", status: "ONLINE", latency: "1.2ms" },
    { id: "worker_edge_02", region: "eu-west-1", status: "ONLINE", latency: "0.8ms" },
    { id: "worker_edge_03", region: "ap-northeast-1", status: "DEGRADED", latency: "8.4ms" },
  ];

  return (
    <div className="w-full max-w-lg rounded-md border border-border bg-surface overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-mono text-[11px]">Worker ID</TableHead>
            <TableHead className="font-mono text-[11px]">Region</TableHead>
            <TableHead className="font-mono text-[11px]">Status</TableHead>
            <TableHead className="font-mono text-[11px] text-right">Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((w) => (
            <TableRow key={w.id}>
              <TableCell className="font-mono text-xs font-semibold text-foreground">
                {w.id}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{w.region}</TableCell>
              <TableCell>
                <Badge
                  variant={w.status === "ONLINE" ? "default" : "destructive"}
                  className="text-[10px] py-0"
                >
                  {w.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-right text-foreground">
                {w.latency}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const tableDemoCode = `import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
} from "@nxtqr/ui";

export function TableDemo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Worker</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>worker_edge_01</TableCell>
          <TableCell><Badge variant="default">ONLINE</Badge></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}`;

// ==========================================
// DATA TABLE DEMO
// ==========================================
interface TraceRecord {
  id: string;
  operation: string;
  durationMs: number;
  status: "success" | "error";
}

const traceData: TraceRecord[] = [
  { id: "trace_9901", operation: "Graph Layout elkjs", durationMs: 14.2, status: "success" },
  { id: "trace_9902", operation: "State Hydration", durationMs: 1.8, status: "success" },
  { id: "trace_9903", operation: "Subagent Handshake", durationMs: 34.5, status: "success" },
  { id: "trace_9904", operation: "WebAssembly Exec", durationMs: 0.4, status: "success" },
];

const traceColumns: ColumnDef<TraceRecord>[] = [
  {
    accessorKey: "id",
    header: "Trace ID",
    cell: ({ row }: { row: { original: TraceRecord } }) => (
      <span className="font-mono text-xs font-semibold">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "operation",
    header: "Operation",
    cell: ({ row }: { row: { original: TraceRecord } }) => (
      <span className="text-xs text-muted-foreground">{row.original.operation}</span>
    ),
  },
  {
    accessorKey: "durationMs",
    header: "Duration",
    cell: ({ row }: { row: { original: TraceRecord } }) => (
      <span className="font-mono text-xs">{row.original.durationMs}ms</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Outcome",
    cell: ({ row }: { row: { original: TraceRecord } }) => (
      <Badge variant={row.original.status === "success" ? "default" : "destructive"}>
        {row.original.status.toUpperCase()}
      </Badge>
    ),
  },
];

export function DataTableDemo() {
  return (
    <div className="w-full max-w-lg">
      <DataTable columns={traceColumns} data={traceData} />
    </div>
  );
}

export const dataTableDemoCode = `import { DataTable } from "@nxtqr/ui";

export function DataTableDemo() {
  return (
    <DataTable columns={traceColumns} data={traceData} />
  );
}`;

// ==========================================
// CARD DEMO
// ==========================================
export function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-accent" />
            Cluster Node #4
          </CardTitle>
          <Badge variant="default">ACTIVE</Badge>
        </div>
        <CardDescription className="text-xs">
          High-performance Redis event queue for trace dispatcher.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">IOPS:</span>
          <span className="text-foreground">48,200 / sec</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Uptime:</span>
          <span className="text-foreground">99.99%</span>
        </div>
      </CardContent>
      <CardFooter className="border-t border-border pt-3">
        <Button variant="outline" size="sm" className="w-full text-xs">
          Inspect Node Telemetry
        </Button>
      </CardFooter>
    </Card>
  );
}

export const cardDemoCode = `import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from "@nxtqr/ui";

export function CardDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cluster Node</CardTitle>
        <CardDescription>Event queue worker</CardDescription>
      </CardHeader>
      <CardContent>
        <p>48,200 IOPS</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Inspect</Button>
      </CardFooter>
    </Card>
  );
}`;

// ==========================================
// BADGE DEMO
// ==========================================
export function BadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Accent Active</Badge>
      <Badge variant="secondary">Secondary Surface</Badge>
      <Badge variant="outline">v1.0.4-beta</Badge>
      <Badge variant="destructive">FAILED</Badge>
      <Badge variant="muted">STANDBY</Badge>
    </div>
  );
}

export const badgeDemoCode = `import { Badge } from "@nxtqr/ui";

export function BadgeDemo() {
  return (
    <div className="flex gap-2">
      <Badge variant="default">Accent</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">v1.0.0</Badge>
      <Badge variant="destructive">FAILED</Badge>
      <Badge variant="muted">STANDBY</Badge>
    </div>
  );
}`;

// ==========================================
// AVATAR DEMO
// ==========================================
export function AvatarDemo() {
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src="/brand/avatar-sample.png" alt="Lead Engineer" />
        <AvatarFallback>NQ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
          AG
        </AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-secondary-surface text-muted-foreground">
          SYS
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

export const avatarDemoCode = `import { Avatar, AvatarFallback, AvatarImage } from "@nxtqr/ui";

export function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="/avatar.png" />
      <AvatarFallback>NQ</AvatarFallback>
    </Avatar>
  );
}`;

// ==========================================
// PROGRESS DEMO
// ==========================================
export function ProgressDemo() {
  const [val, setVal] = React.useState(68);

  return (
    <div className="w-full max-w-xs space-y-2">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">Graph Layout Compilation</span>
        <span className="text-foreground font-semibold">{val}%</span>
      </div>
      <Progress value={val} className="h-2" />
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] font-mono px-2"
          onClick={() => setVal((v) => (v >= 100 ? 10 : v + 15))}
        >
          Advance Step
        </Button>
      </div>
    </div>
  );
}

export const progressDemoCode = `import { Progress } from "@nxtqr/ui";

export function ProgressDemo() {
  return <Progress value={68} className="h-2" />;
}`;

// ==========================================
// SKELETON DEMO
// ==========================================
export function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4 p-4 rounded-md border border-border bg-surface w-full max-w-sm">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export const skeletonDemoCode = `import { Skeleton } from "@nxtqr/ui";

export function SkeletonDemo() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}`;
