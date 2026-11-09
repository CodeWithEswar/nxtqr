"use client";

import * as React from "react";
import {
  nodeRegistry,
  infrastructureRegistry,
  type NodeDefinition,
  type InfrastructureComponentDefinition,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { useGraphEditorStore } from "../store/graph-editor-store";
import {
  CpuIcon,
  DatabaseIcon,
  SearchIcon,
  PlusIcon,
  GridIcon,
  LayersIcon,
  ActivityIcon,
  CheckCircleIcon,
  SlidersIcon,
  CloseIcon,
} from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";
import type { BaseNode } from "../schemas/graph.schema";

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

type CategoryTab = "all" | "databases" | "compute" | "networking" | "dns-cdn-edge" | "clients" | "foundations";
type DatabaseSubtype = "all" | "relational" | "nosql" | "specialized" | "topology";
type ComputeSubtype = "all" | "servers" | "services" | "containers" | "serverless-workers" | "batch-jobs";
type NetworkingSubtype = "all" | "balancers" | "gateways" | "vpc-subnets" | "mesh-discovery" | "security";
type ClientSubtype = "all" | "web" | "mobile" | "desktop" | "headless" | "iot";
type DnsEdgeSubtype = "all" | "dns" | "cdn-cache" | "compute" | "routing-proxy";

const DATABASE_SUBTYPES: Record<DatabaseSubtype, string[]> = {
  all: [],
  relational: [
    "relational-database",
    "postgresql",
    "mysql",
    "distributed-sql-database",
  ],
  nosql: [
    "document-database",
    "key-value-database",
    "wide-column-database",
    "graph-database",
  ],
  specialized: [
    "time-series-database",
    "vector-database",
    "in-memory-database",
    "data-warehouse",
  ],
  topology: [
    "database-primary",
    "read-replica",
    "database-cluster",
  ],
};

const COMPUTE_SUBTYPES: Record<ComputeSubtype, string[]> = {
  all: [],
  servers: ["web-server", "application-server", "virtual-machine"],
  services: ["backend-service", "microservice", "monolithic-application"],
  containers: ["container", "container-cluster", "kubernetes-pod", "kubernetes-service"],
  "serverless-workers": ["serverless-function", "background-worker"],
  "batch-jobs": ["scheduled-job", "batch-processor"],
};

const NETWORKING_SUBTYPES: Record<NetworkingSubtype, string[]> = {
  all: [],
  balancers: ["load-balancer", "layer-4-load-balancer", "layer-7-load-balancer"],
  gateways: ["api-gateway", "ingress-controller", "nat-gateway"],
  "vpc-subnets": ["vpc", "subnet"],
  "mesh-discovery": ["service-discovery", "service-mesh"],
  security: ["forward-proxy", "network-firewall"],
};

const CLIENT_SUBTYPES: Record<ClientSubtype, string[]> = {
  all: [],
  web: [
    "web-browser",
    "single-page-application",
    "server-side-rendered-app",
    "static-website",
    "progressive-web-app",
  ],
  mobile: ["mobile-application", "progressive-web-app"],
  desktop: ["desktop-application"],
  headless: ["cli-client", "third-party-client"],
  iot: ["iot-device"],
};

const DNS_EDGE_SUBTYPES: Record<DnsEdgeSubtype, string[]> = {
  all: [],
  dns: ["dns-resolver", "authoritative-dns", "dns-load-balancing"],
  "cdn-cache": ["cdn", "edge-cache"],
  compute: ["edge-worker"],
  "routing-proxy": [
    "edge-router",
    "reverse-proxy",
    "global-traffic-manager",
    "anycast-network",
  ],
};

export interface NodeLibraryProps {
  onNodeAdded?: (node: BaseNode) => void;
  className?: string;
}

export function NodeLibrary({ onNodeAdded, className }: NodeLibraryProps) {
  const visualizerType = useGraphEditorStore((s) => s.visualizerType);
  const addNode = useGraphEditorStore((s) => s.addNode);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const nodes = useGraphEditorStore((s) => s.nodes);

  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<CategoryTab>("all");
  const [databaseSubtype, setDatabaseSubtype] = React.useState<DatabaseSubtype>("all");
  const [computeSubtype, setComputeSubtype] = React.useState<ComputeSubtype>("all");
  const [networkingSubtype, setNetworkingSubtype] = React.useState<NetworkingSubtype>("all");
  const [clientSubtype, setClientSubtype] = React.useState<ClientSubtype>("all");
  const [dnsEdgeSubtype, setDnsEdgeSubtype] = React.useState<DnsEdgeSubtype>("all");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press "/" to focus search input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Infrastructure Components
  const allInfraComponents = React.useMemo(() => {
    return infrastructureRegistry.listComponents();
  }, []);

  // Foundations & Domain Nodes
  const foundationDefinitions = React.useMemo(() => {
    return nodeRegistry.listFoundations();
  }, []);

  const domainDefinitions = React.useMemo(() => {
    return nodeRegistry.listForVisualizer(visualizerType as any);
  }, [visualizerType]);

  // Filter Databases & Persistence items
  const filteredDatabases = React.useMemo(() => {
    if (
      activeTab === "compute" ||
      activeTab === "networking" ||
      activeTab === "dns-cdn-edge" ||
      activeTab === "clients" ||
      activeTab === "foundations"
    )
      return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "databases-and-persistence"
    );

    if (databaseSubtype !== "all") {
      const allowed = new Set(DATABASE_SUBTYPES[databaseSubtype]);
      list = list.filter((c) => allowed.has(c.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.display.name.toLowerCase().includes(q) ||
          c.display.shortName.toLowerCase().includes(q) ||
          c.display.description.toLowerCase().includes(q) ||
          c.display.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allInfraComponents, activeTab, databaseSubtype, search]);

  // Filter Compute & Application Services items
  const filteredCompute = React.useMemo(() => {
    if (activeTab === "databases" || activeTab === "networking" || activeTab === "dns-cdn-edge" || activeTab === "clients" || activeTab === "foundations") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "compute-and-application-services"
    );

    if (computeSubtype !== "all") {
      const allowed = new Set(COMPUTE_SUBTYPES[computeSubtype]);
      list = list.filter((c) => allowed.has(c.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.display.name.toLowerCase().includes(q) ||
          c.display.shortName.toLowerCase().includes(q) ||
          c.display.description.toLowerCase().includes(q) ||
          c.display.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allInfraComponents, activeTab, computeSubtype, search]);

  // Filter Networking & Traffic items
  const filteredNetworking = React.useMemo(() => {
    if (activeTab === "databases" || activeTab === "compute" || activeTab === "dns-cdn-edge" || activeTab === "clients" || activeTab === "foundations") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "networking-and-traffic"
    );

    if (networkingSubtype !== "all") {
      const allowed = new Set(NETWORKING_SUBTYPES[networkingSubtype]);
      list = list.filter((c) => allowed.has(c.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.display.name.toLowerCase().includes(q) ||
          c.display.shortName.toLowerCase().includes(q) ||
          c.display.description.toLowerCase().includes(q) ||
          c.display.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allInfraComponents, activeTab, networkingSubtype, search]);

  // Filter DNS, CDN & Edge items
  const filteredDnsEdge = React.useMemo(() => {
    if (activeTab === "databases" || activeTab === "compute" || activeTab === "networking" || activeTab === "clients" || activeTab === "foundations") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "dns-cdn-edge"
    );

    if (dnsEdgeSubtype !== "all") {
      const allowed = new Set(DNS_EDGE_SUBTYPES[dnsEdgeSubtype]);
      list = list.filter((c) => allowed.has(c.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.display.name.toLowerCase().includes(q) ||
          c.display.shortName.toLowerCase().includes(q) ||
          c.display.description.toLowerCase().includes(q) ||
          c.display.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allInfraComponents, activeTab, dnsEdgeSubtype, search]);

  // Filter Clients & UI items
  const filteredClients = React.useMemo(() => {
    if (activeTab === "databases" || activeTab === "compute" || activeTab === "networking" || activeTab === "dns-cdn-edge" || activeTab === "foundations") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "clients-and-user-interfaces"
    );

    if (clientSubtype !== "all") {
      const allowed = new Set(CLIENT_SUBTYPES[clientSubtype]);
      list = list.filter((c) => allowed.has(c.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.display.name.toLowerCase().includes(q) ||
          c.display.shortName.toLowerCase().includes(q) ||
          c.display.description.toLowerCase().includes(q) ||
          c.display.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allInfraComponents, activeTab, clientSubtype, search]);

  // Filter foundations items
  const filteredFoundations = React.useMemo(() => {
    if (activeTab === "databases" || activeTab === "compute" || activeTab === "networking" || activeTab === "clients" || activeTab === "dns-cdn-edge") return [];

    let list = foundationDefinitions;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.label.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [foundationDefinitions, activeTab, search]);

  // Filter domain items
  const filteredDomain = React.useMemo(() => {
    if (activeTab === "compute" || activeTab === "networking" || activeTab === "clients" || activeTab === "dns-cdn-edge") return [];

    let list = domainDefinitions;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.label.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [domainDefinitions, activeTab, search]);

  // Create infrastructure node
  const handleCreateInfraNode = (comp: InfrastructureComponentDefinition) => {
    const offset = (nodes.length % 6) * 32;
    const position = { x: 300 + offset, y: 180 + offset };
    const newNode = infrastructureRegistry.createInfrastructureNode(comp.id, {
      position,
    });
    addNode(newNode);
    selectNode(newNode.id, false);
    onNodeAdded?.(newNode);
  };

  // Create foundation or domain node
  const handleCreateLegacyNode = (def: NodeDefinition) => {
    const id = `node_${def.type}_${crypto.randomUUID().slice(0, 6)}`;
    const offset = (nodes.length % 6) * 32;
    const newNode: BaseNode = {
      id,
      type: def.type,
      position: { x: 260 + offset, y: 160 + offset },
      dimensions: { width: 200, height: 80 },
      status: "idle",
      label: def.label,
      description: def.description,
      data: { ...def.defaultData },
      ports: def.ports,
    };

    addNode(newNode);
    selectNode(newNode.id, false);
    onNodeAdded?.(newNode);
  };

  const totalResults =
    filteredDatabases.length +
    filteredCompute.length +
    filteredNetworking.length +
    filteredDnsEdge.length +
    filteredClients.length +
    filteredFoundations.length +
    filteredDomain.length;

  return (
    <div
      className={`flex flex-col h-full bg-surface-01 text-foreground select-none ${className || ""}`}
    >
      {/* Search Header */}
      <div className="p-3 border-b border-border-subtle bg-surface-02 space-y-2.5 shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog... (Press /)"
            className="w-full h-8 pl-8 pr-7 bg-surface-01 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs font-mono text-foreground placeholder:text-text-muted outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-2 text-text-muted hover:text-foreground"
              title="Clear search"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs: Precision Scrollable Rail */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-01 rounded-md border border-border-subtle text-[10px] font-mono precision-rail">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "all"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("databases")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "databases"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Databases
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compute")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "compute"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Compute
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("networking")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "networking"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Network
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dns-cdn-edge")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "dns-cdn-edge"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            DNS/Edge
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clients")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "clients"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("foundations")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "foundations"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Core
          </button>
        </div>

        {/* Subtype Filter Pills: Databases & Persistence */}
        {activeTab === "databases" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (15)" },
                { id: "relational", label: "Relational (4)" },
                { id: "nosql", label: "NoSQL & Graph (4)" },
                { id: "specialized", label: "Specialized (4)" },
                { id: "topology", label: "Topology (3)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setDatabaseSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  databaseSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Compute & Application Services */}
        {activeTab === "compute" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (14)" },
                { id: "servers", label: "Servers (3)" },
                { id: "services", label: "Services (3)" },
                { id: "containers", label: "Containers (4)" },
                { id: "serverless-workers", label: "Functions/Workers (2)" },
                { id: "batch-jobs", label: "Batch/Jobs (2)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setComputeSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  computeSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Networking & Traffic */}
        {activeTab === "networking" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (12)" },
                { id: "balancers", label: "Balancers (3)" },
                { id: "gateways", label: "Gateways (3)" },
                { id: "vpc-subnets", label: "VPC/Subnet (2)" },
                { id: "mesh-discovery", label: "Mesh (2)" },
                { id: "security", label: "Security (2)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setNetworkingSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  networkingSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: DNS, CDN & Edge */}
        {activeTab === "dns-cdn-edge" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (10)" },
                { id: "dns", label: "DNS (3)" },
                { id: "cdn-cache", label: "CDN/Cache (2)" },
                { id: "compute", label: "Compute (1)" },
                { id: "routing-proxy", label: "Routing/Proxy (4)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setDnsEdgeSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  dnsEdgeSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Clients */}
        {activeTab === "clients" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All Types" },
                { id: "web", label: "Web" },
                { id: "mobile", label: "Mobile" },
                { id: "desktop", label: "Desktop" },
                { id: "headless", label: "Headless" },
                { id: "iot", label: "IoT" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setClientSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  clientSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Categorized Component List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 precision-rail">
        {totalResults === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-text-muted text-xs font-mono">
              No matching components found.
            </p>
            {(search || databaseSubtype !== "all" || computeSubtype !== "all" || networkingSubtype !== "all" || clientSubtype !== "all" || dnsEdgeSubtype !== "all" || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDatabaseSubtype("all");
                  setComputeSubtype("all");
                  setNetworkingSubtype("all");
                  setClientSubtype("all");
                  setDnsEdgeSubtype("all");
                  setActiveTab("all");
                }}
                className="text-[11px] font-mono text-text-secondary hover:text-foreground underline underline-offset-4"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Category 05: Databases & Persistence */}
            {filteredDatabases.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Databases & Persistence ({filteredDatabases.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 05
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredDatabases.map((comp) => {
                    const IconComponent = getInfrastructureIcon(comp.id);
                    return (
                      <div
                        key={comp.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", comp.id);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "true");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateInfraNode(comp)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateInfraNode(comp)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        {/* Colored SVG Icon */}
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                          {IconComponent ? (
                            <IconComponent size={20} variant="colored" />
                          ) : (
                            <DatabaseIcon className="h-4 w-4 text-text-muted" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-xs font-semibold text-foreground leading-tight">
                            {comp.display.name}
                          </div>
                          <div className="font-mono text-[9.5px] text-text-muted truncate mt-0.5">
                            {comp.id}
                          </div>
                          <p className="font-sans text-[10px] text-text-disabled truncate leading-relaxed mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 04: Compute & Application Services */}
            {filteredCompute.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Compute & Services ({filteredCompute.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 04
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredCompute.map((comp) => {
                    const IconComponent = getInfrastructureIcon(comp.id);
                    return (
                      <div
                        key={comp.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", comp.id);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "true");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateInfraNode(comp)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateInfraNode(comp)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        {/* Colored SVG Icon */}
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                          {IconComponent ? (
                            <IconComponent size={20} variant="colored" />
                          ) : (
                            <CpuIcon className="h-4 w-4 text-text-muted" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-xs font-semibold text-foreground leading-tight">
                            {comp.display.name}
                          </div>
                          <div className="font-mono text-[9.5px] text-text-muted truncate mt-0.5">
                            {comp.id}
                          </div>
                          <p className="font-sans text-[10px] text-text-disabled truncate leading-relaxed mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. Category 03: Networking & Traffic Infrastructure */}
            {filteredNetworking.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Networking & Traffic ({filteredNetworking.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 03
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredNetworking.map((comp) => {
                    const IconComponent = getInfrastructureIcon(comp.id);
                    return (
                      <div
                        key={comp.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", comp.id);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "true");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateInfraNode(comp)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateInfraNode(comp)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        {/* Colored SVG Icon */}
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                          {IconComponent ? (
                            <IconComponent size={20} variant="colored" />
                          ) : (
                            <CpuIcon className="h-4 w-4 text-text-muted" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-xs font-semibold text-foreground leading-tight">
                            {comp.display.name}
                          </div>
                          <div className="font-mono text-[9.5px] text-text-muted truncate mt-0.5">
                            {comp.id}
                          </div>
                          <p className="font-sans text-[10px] text-text-disabled truncate leading-relaxed mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Category 02: DNS, CDN & Edge Infrastructure */}
            {filteredDnsEdge.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    DNS, CDN & Edge ({filteredDnsEdge.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 02
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredDnsEdge.map((comp) => {
                    const IconComponent = getInfrastructureIcon(comp.id);
                    return (
                      <div
                        key={comp.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", comp.id);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "true");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateInfraNode(comp)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateInfraNode(comp)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        {/* Colored SVG Icon */}
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                          {IconComponent ? (
                            <IconComponent size={20} variant="colored" />
                          ) : (
                            <CpuIcon className="h-4 w-4 text-text-muted" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-xs font-semibold text-foreground leading-tight">
                            {comp.display.name}
                          </div>
                          <div className="font-mono text-[9.5px] text-text-muted truncate mt-0.5">
                            {comp.id}
                          </div>
                          <p className="font-sans text-[10px] text-text-disabled truncate leading-relaxed mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Category 01: Clients & User Interfaces */}
            {filteredClients.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Clients & UI ({filteredClients.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 01
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredClients.map((comp) => {
                    const IconComponent = getInfrastructureIcon(comp.id);
                    return (
                      <div
                        key={comp.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", comp.id);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "true");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateInfraNode(comp)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateInfraNode(comp)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        {/* Colored SVG Icon */}
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                          {IconComponent ? (
                            <IconComponent size={20} variant="colored" />
                          ) : (
                            <CpuIcon className="h-4 w-4 text-text-muted" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-xs font-semibold text-foreground leading-tight">
                            {comp.display.name}
                          </div>
                          <div className="font-mono text-[9.5px] text-text-muted truncate mt-0.5">
                            {comp.id}
                          </div>
                          <p className="font-sans text-[10px] text-text-disabled truncate leading-relaxed mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Foundations Category */}
            {filteredFoundations.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 pt-1 text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider">
                  Foundation Primitives ({filteredFoundations.length})
                </div>

                <div className="space-y-1">
                  {filteredFoundations.map((def) => {
                    const Icon = ICON_MAP[def.type] || CpuIcon;
                    return (
                      <div
                        key={def.type}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", def.type);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "false");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateLegacyNode(def)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateLegacyNode(def)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 text-text-muted group-hover:text-foreground mt-0.5">
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-xs font-medium text-text-secondary group-hover:text-foreground leading-tight">
                            {def.label}
                          </div>
                          <div className="font-mono text-[9px] text-text-disabled uppercase truncate mt-0.5">
                            {def.type}
                          </div>
                          <p className="font-sans text-[10px] text-text-muted truncate leading-relaxed mt-0.5">
                            {def.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Visualizer / Domain Category */}
            {filteredDomain.length > 0 && (
              <div className="space-y-1.5">
                <div className="px-2 pt-1 text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider">
                  Visualizer Primitives ({filteredDomain.length})
                </div>

                <div className="space-y-1">
                  {filteredDomain.map((def) => {
                    const Icon = ICON_MAP[def.type] || CpuIcon;
                    return (
                      <div
                        key={def.type}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/nxtqr-node-type", def.type);
                          e.dataTransfer.setData("application/nxtqr-is-infra", "false");
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        onClick={() => handleCreateLegacyNode(def)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateLegacyNode(def)}
                        className="group flex items-start gap-2.5 p-2 rounded-md border border-border-default hover:border-border-hover bg-surface-01 hover:bg-surface-02 cursor-pointer transition-all duration-140 shadow-level-1 active:shadow-level-3"
                      >
                        <div className="h-7 w-7 rounded-md bg-surface-02 border border-border-subtle flex items-center justify-center shrink-0 text-text-muted group-hover:text-foreground mt-0.5">
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-sans text-xs font-medium text-text-secondary group-hover:text-foreground leading-tight">
                            {def.label}
                          </div>
                          <div className="font-mono text-[9px] text-text-disabled uppercase truncate mt-0.5">
                            {def.type}
                          </div>
                          <p className="font-sans text-[10px] text-text-muted truncate leading-relaxed mt-0.5">
                            {def.description}
                          </p>
                        </div>

                        <PlusIcon className="h-3.5 w-3.5 text-text-disabled group-hover:text-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
