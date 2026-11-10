"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  CpuIcon,
  DatabaseIcon,
  ActivityIcon,
  LayersIcon,
  SearchIcon,
  GridIcon,
  CheckCircleIcon,
  SlidersIcon,
  getInfrastructureIcon,
} from "@nxtqr/icons";
import { nodeRegistry, infrastructureRegistry } from "@nxtqr/node-registry";
import type { BaseNode, PortDefinition } from "../schemas/graph.schema";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  input: ActivityIcon,
  process: CpuIcon,
  output: CheckCircleIcon,
  group: GridIcon,
  decision: SlidersIcon,
  service: LayersIcon,
  database: DatabaseIcon,
  queue: SearchIcon,
};

export type GraphNodeData = {
  label?: string;
  description?: string;
  nodeType?: string;
  status?: BaseNode["status"];
  ports?: PortDefinition[];
  visualizerType?: string;
  [key: string]: unknown;
};

export const GraphNode = React.memo(function GraphNode({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = data as GraphNodeData;
  const nodeType = nodeData.nodeType || "process";
  const visualizerType = (nodeData.visualizerType as any) || "generic";

  const nodeDef = React.useMemo(() => {
    return nodeRegistry.get(visualizerType, nodeType);
  }, [visualizerType, nodeType]);

  const infraDef = React.useMemo(() => {
    return infrastructureRegistry.getComponent(nodeType);
  }, [nodeType]);

  const InfraIcon = React.useMemo(() => {
    return getInfrastructureIcon(infraDef?.display.iconSlug || nodeType);
  }, [infraDef, nodeType]);

  const IconComponent = ICON_MAP[nodeType] || CpuIcon;
  const label = nodeData.label || infraDef?.display.name || nodeDef?.label || "Node";
  const description = nodeData.description || infraDef?.display.description || nodeDef?.description || "";
  const categoryLabel = React.useMemo(() => {
    if (infraDef) {
      const cat = infrastructureRegistry.getCategory(infraDef.categoryId);
      return cat?.name.toUpperCase() || "INFRASTRUCTURE";
    }
    return nodeDef?.category?.toUpperCase() || nodeType.toUpperCase();
  }, [infraDef, nodeDef, nodeType]);

  // Merge registered ports with node instance ports
  const ports = React.useMemo(() => {
    if (nodeData.ports && nodeData.ports.length > 0) {
      return nodeData.ports;
    }
    if (infraDef && infraDef.ports) {
      return [...infraDef.ports];
    }
    return nodeDef?.ports || [
      { id: "in", name: "In", type: "input", dataType: "Any" },
      { id: "out", name: "Out", type: "output", dataType: "Any" },
    ];
  }, [nodeData.ports, infraDef, nodeDef]);

  const inputPorts = ports.filter((p) => p.type === "input" || p.type === "bidirectional");
  const outputPorts = ports.filter((p) => p.type === "output" || p.type === "bidirectional");

  // Pure Black Monochrome strict appearance:
  // Base: Surface 02 (#0D0D0D), Border Default (#262626)
  // Selected: Surface 04 (#1A1A1A), Border Strong (#404040), Shadow Level 3, bold foreground text
  return (
    <div
      data-node-id={id}
      className={`group relative min-w-[200px] max-w-[260px] rounded-md border transition-all duration-150 select-none text-foreground ${
        selected
          ? "bg-surface-04 border-border-strong shadow-level-3 ring-1 ring-border-strong"
          : "bg-surface-02 border-border-default hover:border-border-hover hover:bg-surface-03 shadow-level-1"
      }`}
    >
      {/* Input Ports (Top / Left) */}
      <div className="absolute -top-1.5 left-0 right-0 flex justify-around pointer-events-auto z-10">
        {inputPorts.map((port, index) => {
          const total = inputPorts.length;
          const leftPercent = total === 1 ? 50 : ((index + 1) / (total + 1)) * 100;
          return (
            <Handle
              key={port.id}
              id={port.id}
              type="target"
              position={Position.Top}
              style={{ left: `${leftPercent}%` }}
              className="!w-2.5 !h-2.5 !rounded-full !bg-surface-03 !border-2 !border-border-strong hover:!border-foreground hover:!scale-125 transition-all duration-150"
              title={`${port.name} (${port.dataType || "Any"})`}
            />
          );
        })}
      </div>

      {/* Node Header */}
      <div className="p-2.5 flex items-start gap-2.5 border-b border-border-subtle/60">
        <div
          className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
            selected
              ? "bg-surface-03 border-border-strong text-foreground"
              : "bg-surface-01 border-border-default text-text-secondary group-hover:text-foreground"
          }`}
        >
          {InfraIcon ? (
            <InfraIcon size={20} variant="colored" />
          ) : (
            <IconComponent className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider font-semibold truncate">
              {categoryLabel}
            </span>
            <span className="font-mono text-[9px] text-text-disabled shrink-0">
              #{id.slice(-4)}
            </span>
          </div>
          <h4
            className={`font-sans text-xs leading-tight truncate ${
              selected ? "text-foreground font-semibold" : "text-text-primary group-hover:text-foreground font-medium"
            }`}
          >
            {label}
          </h4>
        </div>
      </div>

      {/* Node Body / Metadata */}
      <div className="px-2.5 py-1.5 flex items-center justify-between font-mono text-[10px] text-text-muted bg-surface-01/40 rounded-b-md">
        <span className="truncate max-w-[130px] text-text-secondary">
          {description ? description.slice(0, 24) : nodeType}
        </span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted">
          {inputPorts.length}in · {outputPorts.length}out
        </span>
      </div>

      {/* Output Ports (Bottom / Right) */}
      <div className="absolute -bottom-1.5 left-0 right-0 flex justify-around pointer-events-auto z-10">
        {outputPorts.map((port, index) => {
          const total = outputPorts.length;
          const leftPercent = total === 1 ? 50 : ((index + 1) / (total + 1)) * 100;
          return (
            <Handle
              key={port.id}
              id={port.id}
              type="source"
              position={Position.Bottom}
              style={{ left: `${leftPercent}%` }}
              className="!w-2.5 !h-2.5 !rounded-full !bg-surface-03 !border-2 !border-border-strong hover:!border-foreground hover:!scale-125 transition-all duration-150"
              title={`${port.name} (${port.dataType || "Any"})`}
            />
          );
        })}
      </div>
    </div>
  );
});

export const nodeTypes = {
  default: GraphNode,
  input: GraphNode,
  process: GraphNode,
  output: GraphNode,
  group: GraphNode,
  decision: GraphNode,
  service: GraphNode,
  database: GraphNode,
  queue: GraphNode,
  generic: GraphNode,
  custom: GraphNode,
  // Infrastructure Category 01: Clients & User Interfaces
  "web-browser": GraphNode,
  "mobile-application": GraphNode,
  "desktop-application": GraphNode,
  "single-page-application": GraphNode,
  "server-side-rendered-app": GraphNode,
  "static-website": GraphNode,
  "progressive-web-app": GraphNode,
  "cli-client": GraphNode,
  "iot-device": GraphNode,
  "third-party-client": GraphNode,
  // Infrastructure Category 02: DNS, CDN & Edge
  "dns-resolver": GraphNode,
  "authoritative-dns": GraphNode,
  "dns-load-balancing": GraphNode,
  "cdn": GraphNode,
  "edge-cache": GraphNode,
  "edge-worker": GraphNode,
  "edge-router": GraphNode,
  "reverse-proxy": GraphNode,
  "global-traffic-manager": GraphNode,
  "anycast-network": GraphNode,
  // Infrastructure Category 03: Networking & Traffic
  "load-balancer": GraphNode,
  "layer-4-load-balancer": GraphNode,
  "layer-7-load-balancer": GraphNode,
  "api-gateway": GraphNode,
  "ingress-controller": GraphNode,
  "forward-proxy": GraphNode,
  "nat-gateway": GraphNode,
  "vpc": GraphNode,
  "subnet": GraphNode,
  "service-discovery": GraphNode,
  "service-mesh": GraphNode,
  "network-firewall": GraphNode,
  // Infrastructure Category 04: Compute & Application Services
  "web-server": GraphNode,
  "application-server": GraphNode,
  "backend-service": GraphNode,
  "microservice": GraphNode,
  "monolithic-application": GraphNode,
  "serverless-function": GraphNode,
  "container": GraphNode,
  "container-cluster": GraphNode,
  "kubernetes-pod": GraphNode,
  "kubernetes-service": GraphNode,
  "virtual-machine": GraphNode,
  "background-worker": GraphNode,
  "scheduled-job": GraphNode,
  "batch-processor": GraphNode,
  // Infrastructure Category 05: Databases & Persistence
  "relational-database": GraphNode,
  "postgresql": GraphNode,
  "mysql": GraphNode,
  "distributed-sql-database": GraphNode,
  "document-database": GraphNode,
  "key-value-database": GraphNode,
  "wide-column-database": GraphNode,
  "graph-database": GraphNode,
  "time-series-database": GraphNode,
  "vector-database": GraphNode,
  "in-memory-database": GraphNode,
  "database-primary": GraphNode,
  "read-replica": GraphNode,
  "database-cluster": GraphNode,
  "data-warehouse": GraphNode,
  // Infrastructure Category 06: Caching & Performance
  "redis-cache": GraphNode,
  "memcached-cache": GraphNode,
  "application-cache": GraphNode,
  "distributed-cache": GraphNode,
  "session-cache": GraphNode,
  "query-cache": GraphNode,
  "read-through-cache": GraphNode,
  "write-through-cache": GraphNode,
  "write-behind-cache": GraphNode,
  "rate-limit-store": GraphNode,
  // Infrastructure Category 07: Messaging & Event Systems
  "message-queue": GraphNode,
  "message-broker": GraphNode,
  "event-bus": GraphNode,
  "pub-sub-topic": GraphNode,
  "event-stream": GraphNode,
  "kafka-broker": GraphNode,
  "rabbitmq-broker": GraphNode,
  "dead-letter-queue": GraphNode,
  "retry-queue": GraphNode,
  "event-consumer": GraphNode,
  "event-producer": GraphNode,
  "webhook-dispatcher": GraphNode,
  "stream-processor": GraphNode,
  "event-store": GraphNode,
  // Infrastructure Category 08: Storage & File Systems
  "object-storage": GraphNode,
  "block-storage": GraphNode,
  "file-storage": GraphNode,
  "distributed-file-system": GraphNode,
  "blob-storage": GraphNode,
  "media-storage": GraphNode,
  "backup-storage": GraphNode,
  "archive-storage": GraphNode,
  "storage-gateway": GraphNode,
  "content-repository": GraphNode,
  // Infrastructure Category 09: Security & Identity
  "authentication-service": GraphNode,
  "authorization-service": GraphNode,
  "identity-provider": GraphNode,
  "oauth-provider": GraphNode,
  "openid-connect-provider": GraphNode,
  "api-key-service": GraphNode,
  "secrets-manager": GraphNode,
  "key-management-service": GraphNode,
  "web-application-firewall": GraphNode,
  "ddos-protection": GraphNode,
  "rate-limiter": GraphNode,
  "certificate-authority": GraphNode,
  "token-service": GraphNode,
  "policy-engine": GraphNode,
  // Infrastructure Category 10: Observability & Reliability
  "monitoring-service": GraphNode,
  "metrics-collector": GraphNode,
  "log-collector": GraphNode,
  "log-aggregator": GraphNode,
  "distributed-tracing": GraphNode,
  "alert-manager": GraphNode,
  "health-check-service": GraphNode,
  "error-tracker": GraphNode,
  "apm-service": GraphNode,
  "status-page": GraphNode,
  // Infrastructure Category 11: Search & Discovery
  "search-engine": GraphNode,
  "full-text-search-index": GraphNode,
  "search-indexer": GraphNode,
  "autocomplete-service": GraphNode,
  "recommendation-engine": GraphNode,
  "discovery-service": GraphNode,
  "search-cache": GraphNode,
  "query-processor": GraphNode,
  // Infrastructure Category 13: Data Engineering & Analytics
  "etl-pipeline": GraphNode,
  "elt-pipeline": GraphNode,
  "data-lake": GraphNode,
  "data-lakehouse": GraphNode,
  "data-pipeline": GraphNode,
  "data-ingestion-service": GraphNode,
  "analytics-engine": GraphNode,
  "olap-engine": GraphNode,
  "cdc-connector": GraphNode,
  "workflow-orchestrator": GraphNode,
  // Infrastructure Category 14: Media & Real-Time Communication
  "websocket-server": GraphNode,
  "webrtc-signaling-server": GraphNode,
  "media-server": GraphNode,
  "video-transcoder": GraphNode,
  "live-streaming-server": GraphNode,
  "media-cdn": GraphNode,
  "notification-gateway": GraphNode,
  "push-notification-service": GraphNode,
  "chat-service": GraphNode,
  "presence-service": GraphNode,
  // Infrastructure Category 15: DevOps & Deployment
  "git-repository": GraphNode,
  "ci-pipeline": GraphNode,
  "cd-pipeline": GraphNode,
  "build-server": GraphNode,
  "artifact-registry": GraphNode,
  "container-registry": GraphNode,
  "deployment-controller": GraphNode,
  "infrastructure-as-code": GraphNode,
  "feature-flag-service": GraphNode,
  "configuration-service": GraphNode,
  "secrets-injection-service": GraphNode,
  "release-manager": GraphNode,
  // Infrastructure Category 16: Cloud Infrastructure
  "cloud-region": GraphNode,
  "availability-zone": GraphNode,
  "compute-instance": GraphNode,
  "managed-database": GraphNode,
  "managed-kubernetes": GraphNode,
  "managed-queue": GraphNode,
  "managed-cache": GraphNode,
  "cloud-function": GraphNode,
  "cloud-storage-bucket": GraphNode,
  "cloud-load-balancer": GraphNode,
  "cloud-network": GraphNode,
  "cloud-iam": GraphNode,
  // Infrastructure Category 17: External Integrations
  "external-rest-api": GraphNode,
  "graphql-api": GraphNode,
  "grpc-service": GraphNode,
  "payment-gateway": GraphNode,
  "email-provider": GraphNode,
  "sms-provider": GraphNode,
  "whatsapp-provider": GraphNode,
  "maps-provider": GraphNode,
  "oauth-integration": GraphNode,
  "third-party-webhook": GraphNode,
  // Infrastructure Category 18: Distributed Systems Patterns
  "circuit-breaker": GraphNode,
  "bulkhead": GraphNode,
  "retry-controller": GraphNode,
  "saga-orchestrator": GraphNode,
  "leader-election": GraphNode,
  "distributed-lock": GraphNode,
  "consensus-coordinator": GraphNode,
  "idempotency-service": GraphNode,
  "distributed-scheduler": GraphNode,
  "service-registry": GraphNode,
  // Infrastructure Category 19: Architecture & Diagram Utilities
  "system-boundary": GraphNode,
  "service-group": GraphNode,
  "network-boundary": GraphNode,
  "trust-boundary": GraphNode,
  "architecture-note": GraphNode,
  "decision-annotation": GraphNode,
  "traffic-label": GraphNode,
  "connection-junction": GraphNode,
  "external-dependency": GraphNode,
  "failure-zone": GraphNode,
};

