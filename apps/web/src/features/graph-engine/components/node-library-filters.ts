interface ComponentTypeFilter {
  id: string;
  label: string;
  componentIds: readonly string[];
}

export const COMPONENT_TYPES: Record<string, readonly ComponentTypeFilter[] | undefined> = {
  "protocol-and-interface-components": [
    {
      id: "apis-endpoints",
      label: "APIs & Endpoints",
      componentIds: [
        "http-endpoint",
        "https-endpoint",
        "rest-endpoint",
        "graphql-endpoint",
        "grpc-endpoint",
      ],
    },
    { id: "transport-network", label: "TCP / UDP", componentIds: ["tcp-endpoint", "udp-endpoint"] },
    {
      id: "realtime-messaging",
      label: "WebSocket & MQTT",
      componentIds: ["websocket-endpoint", "mqtt-broker", "event-subscription"],
    },
    {
      id: "streaming-files",
      label: "Streaming & Files",
      componentIds: ["streaming-endpoint", "file-transfer-endpoint"],
    },
  ],
  "architecture-and-diagram-utilities": [
    {
      id: "boundaries-containers",
      label: "Boundaries & Groups",
      componentIds: ["system-boundary", "service-group", "network-boundary", "trust-boundary"],
    },
    {
      id: "annotations-docs",
      label: "Notes & Decisions",
      componentIds: ["architecture-note", "decision-annotation"],
    },
    {
      id: "routing-traffic",
      label: "Routing & Traffic",
      componentIds: ["traffic-label", "connection-junction"],
    },
    {
      id: "dependencies-failures",
      label: "Dependencies & Failure",
      componentIds: ["external-dependency", "failure-zone"],
    },
  ],
  "distributed-systems-patterns": [
    {
      id: "resilience",
      label: "Resilience",
      componentIds: ["circuit-breaker", "bulkhead", "retry-controller"],
    },
    {
      id: "orchestration",
      label: "Orchestration",
      componentIds: ["saga-orchestrator", "idempotency-service"],
    },
    {
      id: "coordination",
      label: "Coordination & Consensus",
      componentIds: ["leader-election", "distributed-lock", "consensus-coordinator"],
    },
    {
      id: "registry-scheduler",
      label: "Scheduler & Registry",
      componentIds: ["distributed-scheduler", "service-registry"],
    },
  ],
  "external-integrations": [
    {
      id: "apis-protocols",
      label: "REST, GraphQL, gRPC",
      componentIds: ["external-rest-api", "graphql-api", "grpc-service"],
    },
    { id: "payment-commerce", label: "Payments", componentIds: ["payment-gateway"] },
    {
      id: "messaging-notifications",
      label: "Email, SMS, WhatsApp",
      componentIds: ["email-provider", "sms-provider", "whatsapp-provider"],
    },
    {
      id: "auth-maps-webhooks",
      label: "Maps, OAuth, Webhooks",
      componentIds: ["maps-provider", "oauth-integration", "third-party-webhook"],
    },
  ],
  "cloud-infrastructure": [
    {
      id: "regions-zones-networks",
      label: "Regions, AZ & Net",
      componentIds: ["cloud-region", "availability-zone", "cloud-network", "cloud-load-balancer"],
    },
    {
      id: "compute-containers",
      label: "Compute & K8s",
      componentIds: ["compute-instance", "managed-kubernetes"],
    },
    {
      id: "managed-services",
      label: "Managed DB, Queue, Cache",
      componentIds: ["managed-database", "managed-queue", "managed-cache"],
    },
    {
      id: "storage-serverless-iam",
      label: "Storage, Fn & IAM",
      componentIds: ["cloud-function", "cloud-storage-bucket", "cloud-iam"],
    },
  ],
  "devops-and-deployment": [
    {
      id: "source-ci-cd",
      label: "Git & CI/CD",
      componentIds: ["git-repository", "ci-pipeline", "cd-pipeline"],
    },
    {
      id: "build-artifacts-containers",
      label: "Build & Registries",
      componentIds: ["build-server", "artifact-registry", "container-registry"],
    },
    {
      id: "deployment-iac",
      label: "GitOps & IaC",
      componentIds: ["deployment-controller", "infrastructure-as-code"],
    },
    {
      id: "flags-config-secrets-release",
      label: "Flags, Config & Release",
      componentIds: [
        "feature-flag-service",
        "configuration-service",
        "secrets-injection-service",
        "release-manager",
      ],
    },
  ],
  "media-and-real-time-communication": [
    {
      id: "realtime-comm",
      label: "Sockets & SFU",
      componentIds: ["websocket-server", "webrtc-signaling-server", "media-server"],
    },
    {
      id: "media-streaming",
      label: "Video & Streaming",
      componentIds: ["video-transcoder", "live-streaming-server", "media-cdn"],
    },
    {
      id: "notifications-chat-presence",
      label: "Notifs & Chat",
      componentIds: [
        "notification-gateway",
        "push-notification-service",
        "chat-service",
        "presence-service",
      ],
    },
  ],
  "data-engineering-and-analytics": [
    {
      id: "pipelines-etl",
      label: "Pipelines & ETL",
      componentIds: ["etl-pipeline", "elt-pipeline", "data-pipeline"],
    },
    {
      id: "lakes-lakehouse",
      label: "Lakes & Lakehouse",
      componentIds: ["data-lake", "data-lakehouse"],
    },
    {
      id: "engines-olap",
      label: "Engines & OLAP",
      componentIds: ["analytics-engine", "olap-engine"],
    },
    {
      id: "ingestion-cdc-orchestration",
      label: "Ingestion & CDC",
      componentIds: ["data-ingestion-service", "cdc-connector", "workflow-orchestrator"],
    },
  ],
  "search-and-discovery": [
    {
      id: "engines-indexes",
      label: "Engines & Indexes",
      componentIds: ["search-engine", "full-text-search-index", "search-indexer"],
    },
    {
      id: "query-cache",
      label: "Query & Cache",
      componentIds: ["query-processor", "search-cache"],
    },
    {
      id: "autocomplete-discovery",
      label: "Autocomplete & Discovery",
      componentIds: ["autocomplete-service", "discovery-service"],
    },
    { id: "recommendations", label: "Recommendations", componentIds: ["recommendation-engine"] },
  ],
  "ai-and-machine-learning": [
    {
      id: "serving-compute",
      label: "Serving & Compute",
      componentIds: ["model-serving", "gpu-cluster", "inference-cache"],
    },
    {
      id: "features-embeddings",
      label: "Features & Embeddings",
      componentIds: ["feature-store", "vector-embedding-pipeline"],
    },
    {
      id: "training-registry",
      label: "Training & Registry",
      componentIds: ["fine-tuning-job", "model-registry"],
    },
    {
      id: "safety-orchestration",
      label: "Safety & Orchestration",
      componentIds: ["evaluation-gateway", "guardrail-proxy", "agent-orchestrator"],
    },
  ],
  "observability-and-reliability": [
    { id: "metrics", label: "Metrics", componentIds: ["monitoring-service", "metrics-collector"] },
    { id: "logs", label: "Logs", componentIds: ["log-collector", "log-aggregator"] },
    {
      id: "traces-apm",
      label: "Traces & APM",
      componentIds: ["distributed-tracing", "apm-service", "error-tracker"],
    },
    {
      id: "alerts-health",
      label: "Alerts & Health",
      componentIds: ["alert-manager", "health-check-service", "status-page"],
    },
  ],
  "security-and-identity": [
    {
      id: "auth-idp",
      label: "Auth & IdP",
      componentIds: [
        "authentication-service",
        "authorization-service",
        "identity-provider",
        "oauth-provider",
        "openid-connect-provider",
        "policy-engine",
      ],
    },
    {
      id: "tokens-keys",
      label: "Tokens & Secrets",
      componentIds: ["token-service", "api-key-service", "secrets-manager"],
    },
    {
      id: "protection",
      label: "WAF & Defense",
      componentIds: ["web-application-firewall", "ddos-protection", "rate-limiter"],
    },
    {
      id: "crypto-pki",
      label: "Crypto & PKI",
      componentIds: ["key-management-service", "certificate-authority"],
    },
  ],
  "storage-and-file-systems": [
    { id: "object-blob", label: "Object & Blob", componentIds: ["object-storage", "blob-storage"] },
    { id: "block-file", label: "Block & File", componentIds: ["block-storage", "file-storage"] },
    { id: "distributed", label: "Distributed FS", componentIds: ["distributed-file-system"] },
    {
      id: "backup-archive",
      label: "Backup & Archive",
      componentIds: ["backup-storage", "archive-storage"],
    },
    {
      id: "gateways-repos",
      label: "Gateways & Content",
      componentIds: ["storage-gateway", "content-repository", "media-storage"],
    },
  ],
  "messaging-and-event-systems": [
    {
      id: "queues",
      label: "Queues",
      componentIds: ["message-queue", "dead-letter-queue", "retry-queue"],
    },
    {
      id: "brokers",
      label: "Brokers",
      componentIds: ["message-broker", "kafka-broker", "rabbitmq-broker"],
    },
    {
      id: "streaming-pubsub",
      label: "Streams & Topics",
      componentIds: ["pub-sub-topic", "event-stream", "event-bus"],
    },
    {
      id: "processors-consumers",
      label: "Processors",
      componentIds: ["event-consumer", "event-producer", "stream-processor", "webhook-dispatcher"],
    },
    {
      id: "reliability-stores",
      label: "Reliability & Stores",
      componentIds: ["event-store", "dead-letter-queue", "retry-queue"],
    },
  ],
  "caching-and-performance": [
    {
      id: "in-memory",
      label: "In-Memory",
      componentIds: ["redis-cache", "memcached-cache", "application-cache"],
    },
    { id: "distributed", label: "Distributed", componentIds: ["distributed-cache", "redis-cache"] },
    {
      id: "policies",
      label: "Policies",
      componentIds: ["read-through-cache", "write-through-cache", "write-behind-cache"],
    },
    {
      id: "specialized",
      label: "Specialized",
      componentIds: ["session-cache", "query-cache", "rate-limit-store"],
    },
  ],
  "databases-and-persistence": [
    {
      id: "relational",
      label: "Relational",
      componentIds: ["relational-database", "postgresql", "mysql", "distributed-sql-database"],
    },
    {
      id: "nosql",
      label: "NoSQL & Graph",
      componentIds: [
        "document-database",
        "key-value-database",
        "wide-column-database",
        "graph-database",
      ],
    },
    {
      id: "specialized",
      label: "Specialized",
      componentIds: [
        "time-series-database",
        "vector-database",
        "in-memory-database",
        "data-warehouse",
      ],
    },
    {
      id: "topology",
      label: "Topology",
      componentIds: ["database-primary", "read-replica", "database-cluster"],
    },
  ],
  "compute-and-application-services": [
    {
      id: "servers",
      label: "Servers",
      componentIds: ["web-server", "application-server", "virtual-machine"],
    },
    {
      id: "services",
      label: "Services",
      componentIds: ["backend-service", "microservice", "monolithic-application"],
    },
    {
      id: "containers",
      label: "Containers",
      componentIds: ["container", "container-cluster", "kubernetes-pod", "kubernetes-service"],
    },
    {
      id: "serverless-workers",
      label: "Functions/Workers",
      componentIds: ["serverless-function", "background-worker"],
    },
    { id: "batch-jobs", label: "Batch/Jobs", componentIds: ["scheduled-job", "batch-processor"] },
  ],
  "networking-and-traffic": [
    {
      id: "balancers",
      label: "Balancers",
      componentIds: ["load-balancer", "layer-4-load-balancer", "layer-7-load-balancer"],
    },
    {
      id: "gateways",
      label: "Gateways",
      componentIds: ["api-gateway", "ingress-controller", "nat-gateway"],
    },
    { id: "vpc-subnets", label: "VPC/Subnet", componentIds: ["vpc", "subnet"] },
    { id: "mesh-discovery", label: "Mesh", componentIds: ["service-discovery", "service-mesh"] },
    { id: "security", label: "Security", componentIds: ["forward-proxy", "network-firewall"] },
  ],
  "clients-and-user-interfaces": [
    {
      id: "web",
      label: "Web",
      componentIds: [
        "web-browser",
        "single-page-application",
        "server-side-rendered-app",
        "static-website",
        "progressive-web-app",
      ],
    },
    { id: "mobile", label: "Mobile", componentIds: ["mobile-application", "progressive-web-app"] },
    { id: "desktop", label: "Desktop", componentIds: ["desktop-application"] },
    { id: "headless", label: "Headless", componentIds: ["cli-client", "third-party-client"] },
    { id: "iot", label: "IoT", componentIds: ["iot-device"] },
  ],
  "dns-cdn-edge": [
    {
      id: "dns",
      label: "DNS",
      componentIds: ["dns-resolver", "authoritative-dns", "dns-load-balancing"],
    },
    { id: "cdn-cache", label: "CDN/Cache", componentIds: ["cdn", "edge-cache"] },
    { id: "compute", label: "Compute", componentIds: ["edge-worker"] },
    {
      id: "routing-proxy",
      label: "Routing/Proxy",
      componentIds: ["edge-router", "reverse-proxy", "global-traffic-manager", "anycast-network"],
    },
  ],
};
