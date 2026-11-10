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

type CategoryTab = "all" | "cloud" | "devops" | "media" | "data" | "search" | "observability" | "security" | "storage" | "messaging" | "caching" | "databases" | "compute" | "networking" | "dns-cdn-edge" | "clients" | "foundations";
type CloudSubtype = "all" | "regions-zones-networks" | "compute-containers" | "managed-services" | "storage-serverless-iam";
type DevopsSubtype = "all" | "source-ci-cd" | "build-artifacts-containers" | "deployment-iac" | "flags-config-secrets-release";
type MediaSubtype = "all" | "realtime-comm" | "media-streaming" | "notifications-chat-presence";
type DataSubtype = "all" | "pipelines-etl" | "lakes-lakehouse" | "engines-olap" | "ingestion-cdc-orchestration";
type SearchSubtype = "all" | "engines-indexes" | "query-cache" | "autocomplete-discovery" | "recommendations";
type ObservabilitySubtype = "all" | "metrics" | "logs" | "traces-apm" | "alerts-health";

const CLOUD_SUBTYPES: Record<CloudSubtype, string[]> = {
  all: [],
  "regions-zones-networks": ["cloud-region", "availability-zone", "cloud-network", "cloud-load-balancer"],
  "compute-containers": ["compute-instance", "managed-kubernetes"],
  "managed-services": ["managed-database", "managed-queue", "managed-cache"],
  "storage-serverless-iam": ["cloud-function", "cloud-storage-bucket", "cloud-iam"],
};

const DEVOPS_SUBTYPES: Record<DevopsSubtype, string[]> = {
  all: [],
  "source-ci-cd": ["git-repository", "ci-pipeline", "cd-pipeline"],
  "build-artifacts-containers": ["build-server", "artifact-registry", "container-registry"],
  "deployment-iac": ["deployment-controller", "infrastructure-as-code"],
  "flags-config-secrets-release": ["feature-flag-service", "configuration-service", "secrets-injection-service", "release-manager"],
};

const MEDIA_SUBTYPES: Record<MediaSubtype, string[]> = {
  all: [],
  "realtime-comm": ["websocket-server", "webrtc-signaling-server", "media-server"],
  "media-streaming": ["video-transcoder", "live-streaming-server", "media-cdn"],
  "notifications-chat-presence": ["notification-gateway", "push-notification-service", "chat-service", "presence-service"],
};

const DATA_SUBTYPES: Record<DataSubtype, string[]> = {
  all: [],
  "pipelines-etl": ["etl-pipeline", "elt-pipeline", "data-pipeline"],
  "lakes-lakehouse": ["data-lake", "data-lakehouse"],
  "engines-olap": ["analytics-engine", "olap-engine"],
  "ingestion-cdc-orchestration": ["data-ingestion-service", "cdc-connector", "workflow-orchestrator"],
};

const SEARCH_SUBTYPES: Record<SearchSubtype, string[]> = {
  all: [],
  "engines-indexes": ["search-engine", "full-text-search-index", "search-indexer"],
  "query-cache": ["query-processor", "search-cache"],
  "autocomplete-discovery": ["autocomplete-service", "discovery-service"],
  recommendations: ["recommendation-engine"],
};
type SecuritySubtype = "all" | "auth-idp" | "tokens-keys" | "protection" | "crypto-pki";
type StorageSubtype = "all" | "object-blob" | "block-file" | "distributed" | "backup-archive" | "gateways-repos";
type MessagingSubtype = "all" | "queues" | "brokers" | "streaming-pubsub" | "processors-consumers" | "reliability-stores";
type CachingSubtype = "all" | "in-memory" | "distributed" | "policies" | "specialized";
type DatabaseSubtype = "all" | "relational" | "nosql" | "specialized" | "topology";
type ComputeSubtype = "all" | "servers" | "services" | "containers" | "serverless-workers" | "batch-jobs";
type NetworkingSubtype = "all" | "balancers" | "gateways" | "vpc-subnets" | "mesh-discovery" | "security";
type ClientSubtype = "all" | "web" | "mobile" | "desktop" | "headless" | "iot";
type DnsEdgeSubtype = "all" | "dns" | "cdn-cache" | "compute" | "routing-proxy";

const OBSERVABILITY_SUBTYPES: Record<ObservabilitySubtype, string[]> = {
  all: [],
  metrics: ["monitoring-service", "metrics-collector"],
  logs: ["log-collector", "log-aggregator"],
  "traces-apm": ["distributed-tracing", "apm-service", "error-tracker"],
  "alerts-health": ["alert-manager", "health-check-service", "status-page"],
};

const SECURITY_SUBTYPES: Record<SecuritySubtype, string[]> = {
  all: [],
  "auth-idp": [
    "authentication-service",
    "authorization-service",
    "identity-provider",
    "oauth-provider",
    "openid-connect-provider",
    "policy-engine",
  ],
  "tokens-keys": [
    "token-service",
    "api-key-service",
    "secrets-manager",
  ],
  protection: [
    "web-application-firewall",
    "ddos-protection",
    "rate-limiter",
  ],
  "crypto-pki": [
    "key-management-service",
    "certificate-authority",
  ],
};

const STORAGE_SUBTYPES: Record<StorageSubtype, string[]> = {
  all: [],
  "object-blob": ["object-storage", "blob-storage"],
  "block-file": ["block-storage", "file-storage"],
  distributed: ["distributed-file-system"],
  "backup-archive": ["backup-storage", "archive-storage"],
  "gateways-repos": ["storage-gateway", "content-repository", "media-storage"],
};

const MESSAGING_SUBTYPES: Record<MessagingSubtype, string[]> = {
  all: [],
  queues: ["message-queue", "dead-letter-queue", "retry-queue"],
  brokers: ["message-broker", "kafka-broker", "rabbitmq-broker"],
  "streaming-pubsub": ["pub-sub-topic", "event-stream", "event-bus"],
  "processors-consumers": [
    "event-consumer",
    "event-producer",
    "stream-processor",
    "webhook-dispatcher",
  ],
  "reliability-stores": ["event-store", "dead-letter-queue", "retry-queue"],
};

const CACHING_SUBTYPES: Record<CachingSubtype, string[]> = {
  all: [],
  "in-memory": ["redis-cache", "memcached-cache", "application-cache"],
  distributed: ["distributed-cache", "redis-cache"],
  policies: ["read-through-cache", "write-through-cache", "write-behind-cache"],
  specialized: ["session-cache", "query-cache", "rate-limit-store"],
};

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
  const [cloudSubtype, setCloudSubtype] = React.useState<CloudSubtype>("all");
  const [devopsSubtype, setDevopsSubtype] = React.useState<DevopsSubtype>("all");
  const [mediaSubtype, setMediaSubtype] = React.useState<MediaSubtype>("all");
  const [dataSubtype, setDataSubtype] = React.useState<DataSubtype>("all");
  const [searchSubtype, setSearchSubtype] = React.useState<SearchSubtype>("all");
  const [observabilitySubtype, setObservabilitySubtype] = React.useState<ObservabilitySubtype>("all");
  const [securitySubtype, setSecuritySubtype] = React.useState<SecuritySubtype>("all");
  const [storageSubtype, setStorageSubtype] = React.useState<StorageSubtype>("all");
  const [messagingSubtype, setMessagingSubtype] = React.useState<MessagingSubtype>("all");
  const [cachingSubtype, setCachingSubtype] = React.useState<CachingSubtype>("all");
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

  // Filter Cloud Infrastructure items
  const filteredCloud = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "cloud") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "cloud-infrastructure"
    );

    if (cloudSubtype !== "all") {
      const allowed = new Set(CLOUD_SUBTYPES[cloudSubtype]);
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
  }, [allInfraComponents, activeTab, cloudSubtype, search]);

  // Filter DevOps & Deployment items
  const filteredDevops = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "devops") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "devops-and-deployment"
    );

    if (devopsSubtype !== "all") {
      const allowed = new Set(DEVOPS_SUBTYPES[devopsSubtype]);
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
  }, [allInfraComponents, activeTab, devopsSubtype, search]);

  // Filter Media & Real-Time Communication items
  const filteredMedia = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "media") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "media-and-real-time-communication"
    );

    if (mediaSubtype !== "all") {
      const allowed = new Set(MEDIA_SUBTYPES[mediaSubtype]);
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
  }, [allInfraComponents, activeTab, mediaSubtype, search]);

  // Filter Data Engineering & Analytics items
  const filteredData = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "data") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "data-engineering-and-analytics"
    );

    if (dataSubtype !== "all") {
      const allowed = new Set(DATA_SUBTYPES[dataSubtype]);
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
  }, [allInfraComponents, activeTab, dataSubtype, search]);

  // Filter Search & Discovery items
  const filteredSearch = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "search") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "search-and-discovery"
    );

    if (searchSubtype !== "all") {
      const allowed = new Set(SEARCH_SUBTYPES[searchSubtype]);
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
  }, [allInfraComponents, activeTab, searchSubtype, search]);

  // Filter Observability & Reliability items
  const filteredObservability = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "observability") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "observability-and-reliability"
    );

    if (observabilitySubtype !== "all") {
      const allowed = new Set(OBSERVABILITY_SUBTYPES[observabilitySubtype]);
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
  }, [allInfraComponents, activeTab, observabilitySubtype, search]);

  // Filter Security & Identity items
  const filteredSecurity = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "security") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "security-and-identity"
    );

    if (securitySubtype !== "all") {
      const allowed = new Set(SECURITY_SUBTYPES[securitySubtype]);
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
  }, [allInfraComponents, activeTab, securitySubtype, search]);

  // Filter Storage & File Systems items
  const filteredStorage = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "storage") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "storage-and-file-systems"
    );

    if (storageSubtype !== "all") {
      const allowed = new Set(STORAGE_SUBTYPES[storageSubtype]);
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
  }, [allInfraComponents, activeTab, storageSubtype, search]);

  // Filter Messaging & Event Systems items
  const filteredMessaging = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "messaging") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "messaging-and-event-systems"
    );

    if (messagingSubtype !== "all") {
      const allowed = new Set(MESSAGING_SUBTYPES[messagingSubtype]);
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
  }, [allInfraComponents, activeTab, messagingSubtype, search]);

  // Filter Caching & Performance items
  const filteredCaching = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "caching") return [];

    let list = allInfraComponents.filter(
      (c) => c.categoryId === "caching-and-performance"
    );

    if (cachingSubtype !== "all") {
      const allowed = new Set(CACHING_SUBTYPES[cachingSubtype]);
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
  }, [allInfraComponents, activeTab, cachingSubtype, search]);

  // Filter Databases & Persistence items
  const filteredDatabases = React.useMemo(() => {
    if (activeTab !== "all" && activeTab !== "databases") return [];

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
    if (activeTab !== "all" && activeTab !== "compute") return [];

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
    if (activeTab !== "all" && activeTab !== "networking") return [];

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
    if (activeTab !== "all" && activeTab !== "dns-cdn-edge") return [];

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
    if (activeTab !== "all" && activeTab !== "clients") return [];

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
    if (activeTab !== "all" && activeTab !== "foundations") return [];

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
    if (activeTab === "messaging" || activeTab === "caching" || activeTab === "compute" || activeTab === "networking" || activeTab === "clients" || activeTab === "dns-cdn-edge") return [];

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
    filteredCloud.length +
    filteredDevops.length +
    filteredMedia.length +
    filteredData.length +
    filteredSearch.length +
    filteredObservability.length +
    filteredSecurity.length +
    filteredStorage.length +
    filteredMessaging.length +
    filteredCaching.length +
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
            onClick={() => setActiveTab("cloud")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "cloud"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Cloud
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("devops")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "devops"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            DevOps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "media"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Media
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "data"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "search"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("observability")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "observability"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Observability
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "security"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("storage")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "storage"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Storage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("messaging")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "messaging"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Messaging
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("caching")}
            className={`px-2 py-1 rounded text-center whitespace-nowrap transition-colors shrink-0 ${
              activeTab === "caching"
                ? "bg-surface-03 text-foreground font-semibold shadow-level-1"
                : "text-text-muted hover:text-foreground"
            }`}
          >
            Caching
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

        {/* Subtype Filter Pills: Cloud Infrastructure */}
        {activeTab === "cloud" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (12)" },
                { id: "regions-zones-networks", label: "Regions, AZ & Net (4)" },
                { id: "compute-containers", label: "Compute & K8s (2)" },
                { id: "managed-services", label: "Managed DB, Queue, Cache (3)" },
                { id: "storage-serverless-iam", label: "Storage, Fn & IAM (3)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setCloudSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border whitespace-nowrap transition-colors shrink-0 ${
                  cloudSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: DevOps & Deployment */}
        {activeTab === "devops" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (12)" },
                { id: "source-ci-cd", label: "Git & CI/CD (3)" },
                { id: "build-artifacts-containers", label: "Build & Registries (3)" },
                { id: "deployment-iac", label: "GitOps & IaC (2)" },
                { id: "flags-config-secrets-release", label: "Flags, Config & Release (4)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setDevopsSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border whitespace-nowrap transition-colors shrink-0 ${
                  devopsSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Media & Real-Time Communication */}
        {activeTab === "media" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (10)" },
                { id: "realtime-comm", label: "Sockets & SFU (3)" },
                { id: "media-streaming", label: "Video & Streaming (3)" },
                { id: "notifications-chat-presence", label: "Notifs & Chat (4)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setMediaSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border whitespace-nowrap transition-colors shrink-0 ${
                  mediaSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Data Engineering & Analytics */}
        {activeTab === "data" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (10)" },
                { id: "pipelines-etl", label: "Pipelines & ETL (3)" },
                { id: "lakes-lakehouse", label: "Lakes & Lakehouse (2)" },
                { id: "engines-olap", label: "Engines & OLAP (2)" },
                { id: "ingestion-cdc-orchestration", label: "Ingestion & CDC (3)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setDataSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border whitespace-nowrap transition-colors shrink-0 ${
                  dataSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Search & Discovery */}
        {activeTab === "search" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (8)" },
                { id: "engines-indexes", label: "Engines & Indexes (3)" },
                { id: "query-cache", label: "Query & Cache (2)" },
                { id: "autocomplete-discovery", label: "Autocomplete & Discovery (2)" },
                { id: "recommendations", label: "Recommendations (1)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSearchSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border whitespace-nowrap transition-colors shrink-0 ${
                  searchSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Observability & Reliability */}
        {activeTab === "observability" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (10)" },
                { id: "metrics", label: "Metrics (2)" },
                { id: "logs", label: "Logs (2)" },
                { id: "traces-apm", label: "Traces & APM (3)" },
                { id: "alerts-health", label: "Alerts & Health (3)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setObservabilitySubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  observabilitySubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Security & Identity */}
        {activeTab === "security" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (14)" },
                { id: "auth-idp", label: "Auth & IdP (6)" },
                { id: "tokens-keys", label: "Tokens & Secrets (3)" },
                { id: "protection", label: "WAF & Defense (3)" },
                { id: "crypto-pki", label: "Crypto & PKI (2)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSecuritySubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  securitySubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Storage & File Systems */}
        {activeTab === "storage" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (10)" },
                { id: "object-blob", label: "Object & Blob (2)" },
                { id: "block-file", label: "Block & File (2)" },
                { id: "distributed", label: "Distributed FS (1)" },
                { id: "backup-archive", label: "Backup & Archive (2)" },
                { id: "gateways-repos", label: "Gateways & Content (3)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setStorageSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  storageSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Messaging & Event Systems */}
        {activeTab === "messaging" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (14)" },
                { id: "queues", label: "Queues (3)" },
                { id: "brokers", label: "Brokers (3)" },
                { id: "streaming-pubsub", label: "Streams & Topics (3)" },
                { id: "processors-consumers", label: "Processors (4)" },
                { id: "reliability-stores", label: "Reliability & Stores (3)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setMessagingSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  messagingSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Subtype Filter Pills: Caching & Performance */}
        {activeTab === "caching" && (
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 precision-rail text-[10px] font-mono">
            {(
              [
                { id: "all", label: "All (10)" },
                { id: "in-memory", label: "In-Memory (3)" },
                { id: "distributed", label: "Distributed (2)" },
                { id: "policies", label: "Policies (3)" },
                { id: "specialized", label: "Specialized (3)" },
              ] as const
            ).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setCachingSubtype(sub.id)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 ${
                  cachingSubtype === sub.id
                    ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                    : "border-border-subtle text-text-muted hover:text-foreground bg-surface-01"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

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
            {(search || cloudSubtype !== "all" || devopsSubtype !== "all" || mediaSubtype !== "all" || dataSubtype !== "all" || searchSubtype !== "all" || observabilitySubtype !== "all" || securitySubtype !== "all" || storageSubtype !== "all" || messagingSubtype !== "all" || cachingSubtype !== "all" || databaseSubtype !== "all" || computeSubtype !== "all" || networkingSubtype !== "all" || clientSubtype !== "all" || dnsEdgeSubtype !== "all" || activeTab !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCloudSubtype("all");
                  setDevopsSubtype("all");
                  setMediaSubtype("all");
                  setDataSubtype("all");
                  setSearchSubtype("all");
                  setObservabilitySubtype("all");
                  setSecuritySubtype("all");
                  setStorageSubtype("all");
                  setMessagingSubtype("all");
                  setCachingSubtype("all");
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
            {/* Category 16: Cloud Infrastructure */}
            {filteredCloud.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Cloud Infrastructure ({filteredCloud.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 16
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredCloud.map((comp) => {
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
                            <LayersIcon className="w-4 h-4 text-text-muted" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-sans text-xs font-medium text-foreground truncate group-hover:text-text-primary">
                              {comp.display.name}
                            </h5>
                            <span className="font-mono text-[9px] text-text-disabled shrink-0">
                              {comp.node.variant}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-text-muted line-clamp-1 mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 15: DevOps & Deployment */}
            {filteredDevops.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    DevOps & Deployment ({filteredDevops.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 15
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredDevops.map((comp) => {
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
                            <LayersIcon className="w-4 h-4 text-text-muted" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-sans text-xs font-medium text-foreground truncate group-hover:text-text-primary">
                              {comp.display.name}
                            </h5>
                            <span className="font-mono text-[9px] text-text-disabled shrink-0">
                              {comp.node.variant}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-text-muted line-clamp-1 mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 14: Media & Real-Time Communication */}
            {filteredMedia.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Media & Real-Time ({filteredMedia.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 14
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredMedia.map((comp) => {
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
                            <LayersIcon className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-mono font-medium text-foreground truncate">
                              {comp.display.name}
                            </span>
                            <span className="text-[9px] font-mono text-text-muted shrink-0">
                              {comp.display.shortName}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 13: Data Engineering & Analytics */}
            {filteredData.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Data Engineering & Analytics ({filteredData.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 13
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredData.map((comp) => {
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
                            <LayersIcon className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-mono font-medium text-foreground truncate">
                              {comp.display.name}
                            </span>
                            <span className="text-[9px] font-mono text-text-muted shrink-0">
                              {comp.display.shortName}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                            {comp.display.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 11: Search & Discovery */}
            {filteredSearch.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Search & Discovery ({filteredSearch.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 11
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredSearch.map((comp) => {
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

                        <span className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-text-muted self-center transition-opacity">
                          +Add
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 10: Observability & Reliability */}
            {filteredObservability.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Observability & Reliability ({filteredObservability.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 10
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredObservability.map((comp) => {
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

            {/* Category 09: Security & Identity */}
            {filteredSecurity.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Security & Identity ({filteredSecurity.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 09
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredSecurity.map((comp) => {
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

            {/* Category 08: Storage & File Systems */}
            {filteredStorage.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Storage & File Systems ({filteredStorage.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 08
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredStorage.map((comp) => {
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

            {/* Category 07: Messaging & Event Systems */}
            {filteredMessaging.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Messaging & Events ({filteredMessaging.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 07
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredMessaging.map((comp) => {
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

            {/* Category 06: Caching & Performance */}
            {filteredCaching.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] uppercase font-mono font-semibold text-text-muted tracking-wider truncate">
                    Caching & Performance ({filteredCaching.length})
                  </span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] text-text-muted border-border-subtle shrink-0"
                  >
                    Cat 06
                  </Badge>
                </div>

                <div className="space-y-1">
                  {filteredCaching.map((comp) => {
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
