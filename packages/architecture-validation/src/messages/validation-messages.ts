export interface DocumentationTarget {
  documentationId: string;
  path: string;
  title: string;
}

export const DOCUMENTATION_MAPPINGS: Record<string, DocumentationTarget> = {
  // Categories
  "clients-and-user-interfaces": {
    documentationId: "clients-and-user-interfaces",
    path: "/tutorial/system-design/categories/clients-and-user-interfaces",
    title: "Clients & User Interfaces",
  },
  "dns-cdn-edge": {
    documentationId: "dns-cdn-edge",
    path: "/tutorial/system-design/categories/dns-cdn-edge",
    title: "DNS, CDN & Edge",
  },
  "networking-and-traffic": {
    documentationId: "networking-and-traffic",
    path: "/tutorial/system-design/categories/networking-and-traffic",
    title: "Networking & Traffic Management",
  },
  "compute-and-application-services": {
    documentationId: "compute-and-application-services",
    path: "/tutorial/system-design/categories/compute-and-application-services",
    title: "Compute & Application Services",
  },
  "databases-and-persistence": {
    documentationId: "databases-and-persistence",
    path: "/tutorial/system-design/categories/databases-and-persistence",
    title: "Databases & Persistence",
  },
  "caching-and-performance": {
    documentationId: "caching-and-performance",
    path: "/tutorial/system-design/categories/caching-and-performance",
    title: "Caching & Performance",
  },
  "messaging-and-event-systems": {
    documentationId: "messaging-and-event-systems",
    path: "/tutorial/system-design/categories/messaging-and-event-systems",
    title: "Messaging & Event Systems",
  },
  "storage-and-file-systems": {
    documentationId: "storage-and-file-systems",
    path: "/tutorial/system-design/categories/storage-and-file-systems",
    title: "Storage & File Systems",
  },
  "security-and-identity": {
    documentationId: "security-and-identity",
    path: "/tutorial/system-design/categories/security-and-identity",
    title: "Security & Identity",
  },
  "observability-and-reliability": {
    documentationId: "observability-and-reliability",
    path: "/tutorial/system-design/categories/observability-and-reliability",
    title: "Observability & Reliability",
  },
  "search-and-discovery": {
    documentationId: "search-and-discovery",
    path: "/tutorial/system-design/categories/search-and-discovery",
    title: "Search & Discovery",
  },
  "ai-and-machine-learning": {
    documentationId: "ai-and-machine-learning",
    path: "/tutorial/system-design/categories/ai-and-machine-learning",
    title: "AI & Machine Learning Infrastructure",
  },
  "data-engineering-and-analytics": {
    documentationId: "data-engineering-and-analytics",
    path: "/tutorial/system-design/categories/data-engineering-and-analytics",
    title: "Data Engineering & Analytics",
  },
  "media-and-real-time-communication": {
    documentationId: "media-and-real-time-communication",
    path: "/tutorial/system-design/categories/media-and-real-time-communication",
    title: "Media & Real-Time Communication",
  },
  "devops-and-deployment": {
    documentationId: "devops-and-deployment",
    path: "/tutorial/system-design/categories/devops-and-deployment",
    title: "DevOps & Deployment",
  },
  "cloud-infrastructure": {
    documentationId: "cloud-infrastructure",
    path: "/tutorial/system-design/categories/cloud-infrastructure",
    title: "Cloud Infrastructure",
  },
  "external-integrations": {
    documentationId: "external-integrations",
    path: "/tutorial/system-design/categories/external-integrations",
    title: "External Integrations",
  },
  "distributed-systems-patterns": {
    documentationId: "distributed-systems-patterns",
    path: "/tutorial/system-design/categories/distributed-systems-patterns",
    title: "Distributed Systems Patterns",
  },
  "architecture-and-diagram-utilities": {
    documentationId: "architecture-and-diagram-utilities",
    path: "/tutorial/system-design/categories/architecture-and-diagram-utilities",
    title: "Architecture & Diagram Utilities",
  },
  "protocol-and-interface-components": {
    documentationId: "protocol-and-interface-components",
    path: "/tutorial/system-design/categories/protocol-and-interface-components",
    title: "Protocol & Interface Components",
  },

  // Key Concepts
  "caching-strategies": {
    documentationId: "caching-strategies",
    path: "/tutorial/system-design/concepts/caching-strategies",
    title: "Caching Strategies",
  },
  idempotency: {
    documentationId: "idempotency",
    path: "/tutorial/system-design/concepts/idempotency",
    title: "Idempotency",
  },
  "cap-theorem": {
    documentationId: "cap-theorem",
    path: "/tutorial/system-design/concepts/cap-theorem",
    title: "CAP Theorem",
  },

  // Protocols & Endpoints
  "http-endpoint": {
    documentationId: "http-endpoint",
    path: "/tutorial/system-design/components/http-endpoint",
    title: "HTTP Endpoint",
  },
  "https-endpoint": {
    documentationId: "https-endpoint",
    path: "/tutorial/system-design/components/https-endpoint",
    title: "HTTPS Endpoint",
  },
  "grpc-endpoint": {
    documentationId: "grpc-endpoint",
    path: "/tutorial/system-design/components/grpc-endpoint",
    title: "gRPC Endpoint",
  },
  "websocket-endpoint": {
    documentationId: "websocket-endpoint",
    path: "/tutorial/system-design/components/websocket-endpoint",
    title: "WebSocket Endpoint",
  },
  "mqtt-broker": {
    documentationId: "mqtt-broker",
    path: "/tutorial/system-design/components/mqtt-broker",
    title: "MQTT Broker",
  },
  "database-replication": {
    documentationId: "database-replication",
    path: "/tutorial/system-design/categories/databases-and-persistence",
    title: "Database Replication",
  },
  "trust-boundary": {
    documentationId: "trust-boundary",
    path: "/tutorial/system-design/components/trust-boundary",
    title: "Trust Boundary",
  },
  "circuit-breaker": {
    documentationId: "circuit-breaker",
    path: "/tutorial/system-design/components/circuit-breaker",
    title: "Circuit Breaker",
  },
  "api-gateway": {
    documentationId: "api-gateway",
    path: "/tutorial/system-design/components/api-gateway",
    title: "API Gateway",
  },
  "load-balancer": {
    documentationId: "load-balancer",
    path: "/tutorial/system-design/components/load-balancer",
    title: "Load Balancer",
  },
};

export function getDocumentationLink(docId?: string): DocumentationTarget | undefined {
  if (!docId) return undefined;
  return DOCUMENTATION_MAPPINGS[docId];
}

export function getComponentDocumentationPath(componentId: string): string {
  return `/tutorial/system-design/components/${componentId}`;
}

export const VALIDATION_MESSAGES = {
  // Direction
  INVALID_DIRECTION_BOTH_OUTPUTS:
    "Both selected ports are outputs. Connect an output port to a compatible input or bidirectional port.",
  INVALID_DIRECTION_BOTH_INPUTS:
    "Both selected ports are inputs. Connect an output to a compatible input.",
  REVERSED_FLOW_WARNING:
    "Traffic appears to flow backward from downstream input to upstream output. Verify port roles.",

  // Cardinality & Duplicates
  DUPLICATE_EDGE:
    "This connection already exists between the selected ports.",
  PORT_CAPACITY_EXCEEDED: (portName: string, max: number) =>
    `Port "${portName}" has reached its maximum connection capacity of ${max}.`,

  // Protocol Mismatch
  PROTOCOL_MISMATCH_UDP_TCP:
    "This output uses UDP, but the selected input accepts TCP. Choose compatible interfaces or add an explicit protocol bridge.",
  PROTOCOL_MISMATCH_GENERIC: (srcProto: string, tgtProto: string) =>
    `Incompatible protocols: Source emits ${srcProto}, but target accepts ${tgtProto}. Add an adapter or intermediate proxy.`,
  MQTT_TO_HTTP_MISMATCH:
    "An MQTT publisher cannot connect directly to an HTTP-only endpoint. Connect to an MQTT Broker or add an IoT Gateway.",
  DATABASE_WIRE_MISMATCH: (srcEngine: string, tgtEngine: string) =>
    `Database protocol mismatch: Client configured for ${srcEngine} cannot communicate with ${tgtEngine} wire protocol.`,

  // Configuration Requirements
  MISSING_GRPC_CONFIGURATION: (targetName: string) =>
    `The target service "${targetName}" has no configured gRPC interface. Add gRPC to its supported protocols before connecting.`,
  MISSING_TLS_CONFIGURATION: (endpointName: string) =>
    `HTTPS client connects to "${endpointName}", but TLS termination is not documented on the target. Document TLS termination in the inspector.`,
  MISSING_RETRY_IDEMPOTENCY: (serviceName: string) =>
    `Retry Controller connects to "${serviceName}", but idempotency keys or safe semantics are not documented. Ensure endpoints are idempotent.`,

  // Relationships
  UNSUPPORTED_ROLE: (srcRole: string, tgtRole: string) =>
    `This port acts as ${srcRole}, but the target expects ${tgtRole}.`,
  INVALID_REPLICATION_TARGET:
    "Database read replica must connect to a valid primary database or cluster manager through a replication relationship.",
  WEBRTC_SIGNALING_MEDIA_NOTE:
    "WebRTC signaling only handles session negotiation. Audio/video media streams should route to a Media Server or direct peer.",
  PRODUCER_WITHOUT_BROKER:
    "Message producer must connect to a Message Broker, Event Stream, or Queue rather than directly to consumers.",

  // Security & Trust Boundaries
  TRUST_BOUNDARY_CROSSING_UNENCRYPTED: (srcName: string, tgtName: string) =>
    `This connection crosses a trust boundary from "${srcName}" to "${tgtName}" without documented transport security (TLS/mTLS).`,
  PUBLIC_INTERFACE_UNAUTHENTICATED: (endpointName: string) =>
    `Public interface "${endpointName}" has unspecified authentication. Document authentication requirements in the inspector.`,

  // Structure & Integrity
  CYCLIC_CONTAINMENT:
    "A group cannot contain itself or one of its ancestors.",
  NONEXISTENT_ENDPOINT:
    "One or more endpoints referenced by this connection no longer exist in the graph.",
  CANNOT_CONNECT_TO_SELF:
    "Direct self-connections are prohibited unless the component explicitly models local loopback processing.",
  BOUNDARY_NETWORK_PORTS:
    "Structural boundaries and notes do not expose network ports. Use membership associations instead.",
};
