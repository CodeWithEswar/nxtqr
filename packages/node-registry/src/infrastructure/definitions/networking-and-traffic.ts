import type { InfrastructureComponentDefinition, InfrastructureCategoryDefinition } from "../types";
import {
  LoadBalancerConfigSchema,
  Layer4LoadBalancerConfigSchema,
  Layer7LoadBalancerConfigSchema,
  ApiGatewayConfigSchema,
  IngressControllerConfigSchema,
  ForwardProxyConfigSchema,
  NatGatewayConfigSchema,
  VpcConfigSchema,
  SubnetConfigSchema,
  ServiceDiscoveryConfigSchema,
  ServiceMeshConfigSchema,
  NetworkFirewallConfigSchema,
  type LoadBalancerConfig,
  type Layer4LoadBalancerConfig,
  type Layer7LoadBalancerConfig,
  type ApiGatewayConfig,
  type IngressControllerConfig,
  type ForwardProxyConfig,
  type NatGatewayConfig,
  type VpcConfig,
  type SubnetConfig,
  type ServiceDiscoveryConfig,
  type ServiceMeshConfig,
  type NetworkFirewallConfig,
} from "../schemas/networking-and-traffic.schema";

export const NETWORKING_AND_TRAFFIC_CATEGORY_ID = "networking-and-traffic";

export const networkingAndTrafficCategoryDefinition: InfrastructureCategoryDefinition = {
  id: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  name: "Networking & Traffic",
  description: "Load balancers, API gateways, VPCs, subnets, service discovery, service mesh, and perimeter security.",
  iconSlug: "load-balancer",
  order: 3,
};

// 01 — Load Balancer
export const loadBalancerDefinition: InfrastructureComponentDefinition<LoadBalancerConfig> = {
  id: "load-balancer",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Load Balancer",
    shortName: "Load Balancer",
    description: "General traffic distributor balancing incoming request load across multiple backend server targets with health checks.",
    keywords: ["load-balancer", "traffic", "balancer", "round-robin", "health-check", "distributor"],
    iconSlug: "load-balancer",
  },
  configSchema: LoadBalancerConfigSchema,
  defaultConfig: {
    label: "Load Balancer",
    description: "Multi-target traffic load balancer",
    componentType: "load-balancer",
    environment: "production",
    tags: ["traffic", "load-balancer", "ha"],
    notes: "",
    enabled: true,
    strategy: "round-robin",
    targetPoolSize: 3,
    healthCheckProtocol: "HTTP",
    healthCheckIntervalSeconds: 15,
    sessionPersistence: "none",
    connectionTimeoutMs: 5000,
    idleTimeoutSeconds: 60,
    assumedRps: 10000,
  },
  ports: [
    { id: "traffic-in", name: "Traffic In", type: "input", dataType: "Traffic_Stream", description: "Inbound client traffic" },
    { id: "pool-out", name: "Pool Out", type: "output", dataType: "Target_Dispatch", description: "Egress to backend target pool instances" },
    { id: "health-probe", name: "Health Probe", type: "output", dataType: "Synthetic_Check", description: "Active health check probes to targets" },
  ],
  capabilities: ["load-balancing", "health-checking", "session-persistence", "traffic-distribution"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "balancing-policy",
      title: "Balancing Policy",
      fields: [
        {
          path: "strategy",
          label: "Distribution Algorithm",
          type: "select",
          options: [
            { label: "Round Robin", value: "round-robin" },
            { label: "Weighted Round Robin", value: "weighted-round-robin" },
            { label: "Least Connections", value: "least-connections" },
            { label: "IP Hash (Sticky Client)", value: "ip-hash" },
            { label: "Random", value: "random" },
          ],
        },
        { path: "targetPoolSize", label: "Target Pool Instances", type: "number", min: 1, max: 64 },
        {
          path: "sessionPersistence",
          label: "Session Stickiness",
          type: "select",
          options: [
            { label: "None (Stateless)", value: "none" },
            { label: "Application Cookie Stickiness", value: "cookie-stickiness" },
            { label: "Source IP Stickiness", value: "source-ip" },
          ],
        },
      ],
    },
    {
      id: "health-and-timeouts",
      title: "Health & Timeouts",
      fields: [
        {
          path: "healthCheckProtocol",
          label: "Probe Protocol",
          type: "select",
          options: [
            { label: "HTTP (Status 200-399)", value: "HTTP" },
            { label: "HTTPS (Encrypted TLS)", value: "HTTPS" },
            { label: "TCP Handshake", value: "TCP" },
          ],
        },
        { path: "healthCheckIntervalSeconds", label: "Check Interval", type: "number", min: 5, max: 300, unit: "seconds" },
        { path: "connectionTimeoutMs", label: "Connection Timeout", type: "number", min: 100, max: 60000, unit: "ms" },
        { path: "idleTimeoutSeconds", label: "Idle Timeout", type: "number", min: 5, max: 3600, unit: "seconds" },
      ],
    },
    {
      id: "assumptions",
      title: "Capacity Assumptions",
      fields: [
        { path: "assumedRps", label: "Expected Request Rate", type: "number", min: 1, max: 5000000, unit: "rps" },
      ],
    },
  ],
};

// 02 — Layer 4 Load Balancer
export const layer4LoadBalancerDefinition: InfrastructureComponentDefinition<Layer4LoadBalancerConfig> = {
  id: "layer-4-load-balancer",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Layer 4 Load Balancer",
    shortName: "L4 Balancer",
    description: "High-performance transport-layer load balancer distributing raw TCP and UDP connections with ultra-low latency.",
    keywords: ["l4", "nlb", "tcp", "udp", "transport-layer", "flow-hash", "ultra-low-latency"],
    iconSlug: "layer-4-load-balancer",
  },
  configSchema: Layer4LoadBalancerConfigSchema,
  defaultConfig: {
    label: "Layer 4 Load Balancer",
    description: "Transport-layer TCP/UDP load balancer",
    componentType: "layer-4-load-balancer",
    environment: "production",
    tags: ["l4", "tcp", "udp", "high-throughput"],
    notes: "",
    enabled: true,
    transportProtocol: "TCP",
    listenerPort: 443,
    connectionAlgorithm: "flow-hash-5tuple",
    preserveClientIp: true,
    connectionTimeoutMs: 3000,
    idleTimeoutSeconds: 350,
    assumedConcurrentConnections: 50000,
  },
  ports: [
    { id: "tcp-udp-in", name: "Socket In", type: "input", dataType: "L4_Socket", description: "Inbound TCP or UDP socket stream" },
    { id: "target-stream-out", name: "Stream Out", type: "output", dataType: "L4_Stream", description: "Raw transport stream handoff to backend" },
    { id: "health-probe", name: "L4 Probe", type: "output", dataType: "TCP_SYN_Probe", description: "Synthetic TCP/UDP health check" },
  ],
  capabilities: ["layer4-switching", "tcp-udp-proxy", "ultra-low-latency", "source-ip-preservation"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "transport-config",
      title: "Transport Configuration",
      fields: [
        {
          path: "transportProtocol",
          label: "Transport Protocol",
          type: "select",
          options: [
            { label: "TCP (Transmission Control)", value: "TCP" },
            { label: "UDP (User Datagram)", value: "UDP" },
            { label: "TCP & UDP Dual Listener", value: "TCP-UDP-Dual" },
          ],
        },
        { path: "listenerPort", label: "Listener Port", type: "number", min: 1, max: 65535 },
        {
          path: "connectionAlgorithm",
          label: "Routing Algorithm",
          type: "select",
          options: [
            { label: "5-Tuple Flow Hash (IP+Port+Proto)", value: "flow-hash-5tuple" },
            { label: "Least Outstanding Requests", value: "least-outstanding-requests" },
            { label: "Round Robin Stream", value: "round-robin" },
          ],
        },
        { path: "preserveClientIp", label: "Preserve Client IP (Direct Return)", type: "boolean" },
      ],
    },
    {
      id: "performance-limits",
      title: "Performance & Timeouts",
      fields: [
        { path: "connectionTimeoutMs", label: "Handshake Timeout", type: "number", min: 100, max: 60000, unit: "ms" },
        { path: "idleTimeoutSeconds", label: "TCP Idle Timeout", type: "number", min: 10, max: 7200, unit: "seconds" },
        { path: "assumedConcurrentConnections", label: "Concurrent Connections", type: "number", min: 1, max: 10000000 },
      ],
    },
  ],
};

// 03 — Layer 7 Load Balancer
export const layer7LoadBalancerDefinition: InfrastructureComponentDefinition<Layer7LoadBalancerConfig> = {
  id: "layer-7-load-balancer",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Layer 7 Load Balancer",
    shortName: "L7 Balancer",
    description: "Application-aware load balancer inspecting HTTP/HTTPS headers, paths, cookies, and gRPC methods for intelligent routing.",
    keywords: ["l7", "alb", "application-routing", "http", "https", "grpc", "path-routing", "tls-offload"],
    iconSlug: "layer-7-load-balancer",
  },
  configSchema: Layer7LoadBalancerConfigSchema,
  defaultConfig: {
    label: "Layer 7 Load Balancer",
    description: "Application-layer HTTP/HTTPS load balancer",
    componentType: "layer-7-load-balancer",
    environment: "production",
    tags: ["l7", "http", "https", "alb"],
    notes: "",
    enabled: true,
    routingMethod: "path-based",
    tlsTermination: true,
    minTlsVersion: "TLS-1.3",
    stickySessions: true,
    healthCheckPath: "/healthz",
    maxHeaderSizeKb: 16,
    assumedRps: 25000,
  },
  ports: [
    { id: "http-https-in", name: "HTTP(S) In", type: "input", dataType: "HTTP_Request", description: "Inbound HTTP/1.1, HTTP/2, or gRPC traffic" },
    { id: "app-routed-out", name: "Routed Out", type: "output", dataType: "Upstream_HTTP", description: "Path and host routed request egress" },
    { id: "tls-cert-in", name: "TLS Cert In", type: "input", dataType: "Cert_Bundle", description: "TLS certificate reference" },
  ],
  capabilities: ["layer7-routing", "path-dispatch", "tls-termination", "sticky-sessions"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "routing-logic",
      title: "Application Routing",
      fields: [
        {
          path: "routingMethod",
          label: "Routing Rule Target",
          type: "select",
          options: [
            { label: "Path-Based Prefix / URL", value: "path-based" },
            { label: "Host Header / Subdomain", value: "host-header" },
            { label: "Query Parameter Filter", value: "query-param" },
            { label: "HTTP Header Inspection", value: "http-header" },
            { label: "Session Cookie Sticky Hash", value: "cookie" },
          ],
        },
        { path: "tlsTermination", label: "SSL / TLS Termination", type: "boolean" },
        {
          path: "minTlsVersion",
          label: "Minimum TLS Security",
          type: "select",
          options: [
            { label: "TLS 1.3 (Strict Modern)", value: "TLS-1.3" },
            { label: "TLS 1.2 (Broad Compatibility)", value: "TLS-1.2" },
          ],
        },
        { path: "stickySessions", label: "Sticky Cookie Sessions", type: "boolean" },
      ],
    },
    {
      id: "limits-and-probes",
      title: "Health & Limits",
      fields: [
        { path: "healthCheckPath", label: "HTTP Probe Path", type: "text", placeholder: "/healthz" },
        { path: "maxHeaderSizeKb", label: "Max Header Buffer", type: "number", min: 4, max: 64, unit: "KB" },
        { path: "assumedRps", label: "Expected Request Load", type: "number", min: 1, max: 5000000, unit: "rps" },
      ],
    },
  ],
};

// 04 — API Gateway
export const apiGatewayDefinition: InfrastructureComponentDefinition<ApiGatewayConfig> = {
  id: "api-gateway",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "API Gateway",
    shortName: "API Gateway",
    description: "Central entry point handling API authentication, rate limiting, request validation, CORS, and upstream microservice orchestration.",
    keywords: ["api-gateway", "kong", "apigee", "jwt", "rate-limit", "microservices", "bff"],
    iconSlug: "api-gateway",
  },
  configSchema: ApiGatewayConfigSchema,
  defaultConfig: {
    label: "API Gateway",
    description: "Central microservices API gateway",
    componentType: "api-gateway",
    environment: "production",
    tags: ["api", "gateway", "auth", "rate-limit"],
    notes: "",
    enabled: true,
    authPolicy: "oauth2-jwt",
    rateLimitRps: 1000,
    burstCapacity: 2000,
    requestValidation: true,
    timeoutMs: 15000,
    retryCount: 2,
    corsEnabled: true,
  },
  ports: [
    { id: "client-api-in", name: "Client API In", type: "input", dataType: "API_Call", description: "External public API requests" },
    { id: "upstream-service-out", name: "Service Out", type: "output", dataType: "Internal_RPC", description: "Authenticated and validated calls to microservices" },
    { id: "auth-provider-conn", name: "Auth Provider", type: "bidirectional", dataType: "OAuth_OIDC", description: "Identity Provider / JWT verification" },
  ],
  capabilities: ["api-routing", "token-auth", "rate-limiting", "request-validation", "cors"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "security-auth",
      title: "Authentication & Policies",
      fields: [
        {
          path: "authPolicy",
          label: "Auth Verification",
          type: "select",
          options: [
            { label: "OAuth2 / JWT Bearer Validation", value: "oauth2-jwt" },
            { label: "API Key Header / Query", value: "api-key" },
            { label: "Mutual TLS (mTLS)", value: "mutual-tls" },
            { label: "IAM Role-Based Access Control", value: "iam-rbac" },
            { label: "Anonymous / Public Passthrough", value: "anonymous" },
          ],
        },
        { path: "requestValidation", label: "Schema Validation (OpenAPI/JSON)", type: "boolean" },
        { path: "corsEnabled", label: "CORS Headers Injection", type: "boolean" },
      ],
    },
    {
      id: "rate-limiting",
      title: "Rate Limiting & Resilience",
      fields: [
        { path: "rateLimitRps", label: "Rate Limit Quota", type: "number", min: 1, max: 100000, unit: "req/s" },
        { path: "burstCapacity", label: "Token Bucket Burst", type: "number", min: 1, max: 200000, unit: "tokens" },
        { path: "timeoutMs", label: "Upstream Timeout", type: "number", min: 100, max: 120000, unit: "ms" },
        { path: "retryCount", label: "Automated Retries", type: "number", min: 0, max: 5 },
      ],
    },
  ],
};

// 05 — Ingress Controller
export const ingressControllerDefinition: InfrastructureComponentDefinition<IngressControllerConfig> = {
  id: "ingress-controller",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Ingress Controller",
    shortName: "Ingress",
    description: "Kubernetes cluster ingress gateway fulfilling Ingress rules to route external HTTP/HTTPS traffic to internal cluster services.",
    keywords: ["ingress", "k8s", "kubernetes", "cluster-ingress", "nginx-ingress", "traefik", "contour"],
    iconSlug: "ingress-controller",
  },
  configSchema: IngressControllerConfigSchema,
  defaultConfig: {
    label: "Ingress Controller",
    description: "Cluster ingress controller gateway",
    componentType: "ingress-controller",
    environment: "production",
    tags: ["k8s", "ingress", "cluster"],
    notes: "",
    enabled: true,
    controllerType: "nginx-ingress",
    ingressClass: "nginx",
    sslRedirect: true,
    hostRulesCount: 4,
    defaultBackendService: "default-backend-service",
    healthCheckPath: "/healthz",
    websocketSupport: true,
  },
  ports: [
    { id: "ingress-traffic-in", name: "Traffic In", type: "input", dataType: "Cluster_Ingress", description: "Inbound external cluster HTTP/HTTPS traffic" },
    { id: "cluster-service-out", name: "Service Out", type: "output", dataType: "ClusterIP_Target", description: "Routing to internal ClusterIP services" },
    { id: "k8s-api-watch", name: "K8s API", type: "bidirectional", dataType: "K8s_Watch_Stream", description: "Ingress resource watcher connection" },
  ],
  capabilities: ["k8s-ingress", "service-dispatch", "ssl-redirect", "host-routing"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "controller-engine",
      title: "Controller Engine",
      fields: [
        {
          path: "controllerType",
          label: "Ingress Engine",
          type: "select",
          options: [
            { label: "NGINX Ingress Controller", value: "nginx-ingress" },
            { label: "Envoy Gateway (Gateway API)", value: "envoy-gateway" },
            { label: "Traefik Ingress", value: "traefik" },
            { label: "Contour / Envoy", value: "contour" },
            { label: "HAProxy Ingress", value: "haproxy" },
          ],
        },
        { path: "ingressClass", label: "Ingress Class", type: "text", placeholder: "nginx" },
        { path: "sslRedirect", label: "Enforce HTTPS Redirect", type: "boolean" },
        { path: "websocketSupport", label: "Upgrade WebSocket Connections", type: "boolean" },
      ],
    },
    {
      id: "routing-rules",
      title: "Cluster Rules",
      fields: [
        { path: "hostRulesCount", label: "Active Host Virtual Rules", type: "number", min: 1, max: 64 },
        { path: "defaultBackendService", label: "Default 404 Service", type: "text", placeholder: "default-backend" },
        { path: "healthCheckPath", label: "Probe Endpoint", type: "text", placeholder: "/healthz" },
      ],
    },
  ],
};

// 06 — Forward Proxy
export const forwardProxyDefinition: InfrastructureComponentDefinition<ForwardProxyConfig> = {
  id: "forward-proxy",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Forward Proxy",
    shortName: "Forward Proxy",
    description: "Internal gateway proxying outbound requests from private networks to external web destinations with caching and policy controls.",
    keywords: ["forward-proxy", "squid", "outbound", "egress-proxy", "whitelist", "content-filter"],
    iconSlug: "forward-proxy",
  },
  configSchema: ForwardProxyConfigSchema,
  defaultConfig: {
    label: "Forward Proxy",
    description: "Outbound egress proxy server",
    componentType: "forward-proxy",
    environment: "production",
    tags: ["proxy", "forward-proxy", "egress", "security"],
    notes: "",
    enabled: true,
    authRequired: false,
    sslInspection: false,
    cachingEnabled: true,
    cacheSizeGb: 20,
    accessControlMode: "whitelist-allow-only",
    proxyChaining: false,
    connectionTimeoutMs: 10000,
  },
  ports: [
    { id: "internal-client-in", name: "Client In", type: "input", dataType: "Internal_Traffic", description: "Outbound requests from internal clients" },
    { id: "internet-egress-out", name: "Internet Out", type: "output", dataType: "External_HTTP", description: "Proxied outbound traffic to internet" },
    { id: "acl-policy-in", name: "ACL Policy", type: "input", dataType: "Policy_Rules", description: "Corporate access control and whitelist policy" },
  ],
  capabilities: ["forward-proxy", "outbound-filtering", "ssl-inspection", "caching"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "filtering-policy",
      title: "Outbound Policy",
      fields: [
        {
          path: "accessControlMode",
          label: "Access Filter Mode",
          type: "select",
          options: [
            { label: "Whitelist Only (Block Untrusted)", value: "whitelist-allow-only" },
            { label: "Blacklist (Block Explicit Threat Sites)", value: "blacklist-block" },
            { label: "Open Internal Monitoring", value: "open-internal" },
          ],
        },
        { path: "authRequired", label: "Require Proxy User Authentication", type: "boolean" },
        { path: "sslInspection", label: "SSL / TLS Inspection (MitM Decrypt)", type: "boolean" },
        { path: "proxyChaining", label: "Upstream Proxy Chaining", type: "boolean" },
      ],
    },
    {
      id: "caching-storage",
      title: "Cache & Timeouts",
      fields: [
        { path: "cachingEnabled", label: "Response Object Caching", type: "boolean" },
        { path: "cacheSizeGb", label: "Cache Storage Capacity", type: "number", min: 1, max: 500, unit: "GB" },
        { path: "connectionTimeoutMs", label: "Connection Timeout", type: "number", min: 100, max: 60000, unit: "ms" },
      ],
    },
  ],
};

// 07 — NAT Gateway
export const natGatewayDefinition: InfrastructureComponentDefinition<NatGatewayConfig> = {
  id: "nat-gateway",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "NAT Gateway",
    shortName: "NAT Gateway",
    description: "Network Address Translation service allowing private subnet instances to access the internet while blocking unsolicited incoming traffic.",
    keywords: ["nat", "nat-gateway", "snat", "egress-ip", "private-subnet", "masquerade"],
    iconSlug: "nat-gateway",
  },
  configSchema: NatGatewayConfigSchema,
  defaultConfig: {
    label: "NAT Gateway",
    description: "Managed outbound NAT service",
    componentType: "nat-gateway",
    environment: "production",
    tags: ["nat", "networking", "snat", "egress"],
    notes: "",
    enabled: true,
    natMode: "managed-snat",
    allocatedEipsCount: 1,
    idleTimeoutSeconds: 300,
    maxConcurrentSessions: 55000,
    highAvailabilityZone: true,
    privateIpRange: "10.0.0.0/16",
  },
  ports: [
    { id: "private-snat-in", name: "Private In", type: "input", dataType: "Private_Subnet_IP", description: "Outbound packets from private subnets" },
    { id: "public-egress-out", name: "Public Out", type: "output", dataType: "Translated_EIP", description: "Translated outbound public internet egress" },
  ],
  capabilities: ["snat", "egress-only-internet", "address-translation", "high-availability"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "nat-configuration",
      title: "Address Translation",
      fields: [
        {
          path: "natMode",
          label: "Translation Mode",
          type: "select",
          options: [
            { label: "Managed SNAT (Outbound Egress Only)", value: "managed-snat" },
            { label: "DNAT Port Forwarding", value: "dnat-port-forward" },
            { label: "Symmetric NAT Mapping", value: "symmetric-nat" },
          ],
        },
        { path: "allocatedEipsCount", label: "Allocated Elastic IPs", type: "number", min: 1, max: 8 },
        { path: "privateIpRange", label: "Private Source CIDR", type: "text", placeholder: "10.0.0.0/16" },
        { path: "highAvailabilityZone", label: "Multi-AZ Redundancy", type: "boolean" },
      ],
    },
    {
      id: "limits-capacity",
      title: "Capacity Limits",
      fields: [
        { path: "idleTimeoutSeconds", label: "TCP Idle Timeout", type: "number", min: 10, max: 600, unit: "seconds" },
        { path: "maxConcurrentSessions", label: "Concurrent Sessions", type: "number", min: 100, max: 2000000 },
      ],
    },
  ],
};

// 08 — Virtual Private Cloud (VPC)
export const vpcDefinition: InfrastructureComponentDefinition<VpcConfig> = {
  id: "vpc",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Virtual Private Cloud",
    shortName: "VPC",
    description: "Isolated virtual network boundary spanning availability zones with dedicated CIDR address space, route tables, and network ACLs.",
    keywords: ["vpc", "network", "cidr", "private-cloud", "routing", "isolation", "cloud-network"],
    iconSlug: "vpc",
  },
  configSchema: VpcConfigSchema,
  defaultConfig: {
    label: "Virtual Private Cloud",
    description: "Isolated private network boundary",
    componentType: "vpc",
    environment: "production",
    tags: ["vpc", "network", "isolation"],
    notes: "",
    enabled: true,
    primaryCidr: "10.0.0.0/16",
    ipFamily: "IPv4-Only",
    region: "us-east-1",
    dnsHostnamesEnabled: true,
    dnsResolutionEnabled: true,
    isolationLevel: "internet-routable",
    peeringConnectionsCount: 1,
  },
  ports: [
    { id: "igw-conn", name: "IGW Conn", type: "bidirectional", dataType: "Internet_Gateway", description: "Internet Gateway connection" },
    { id: "peering-conn", name: "VPC Peer", type: "bidirectional", dataType: "VPC_Peering", description: "Inter-VPC peering connection" },
    { id: "subnet-containment", name: "Subnets", type: "output", dataType: "Subnet_Membership", description: "Subnet association bus" },
  ],
  capabilities: ["isolated-network", "custom-cidr", "peering", "route-tables"],
  node: { variant: "standard", minWidth: 220, minHeight: 88 },
  inspector: [
    {
      id: "network-spec",
      title: "IP Addressing & Region",
      fields: [
        { path: "primaryCidr", label: "Primary IPv4 CIDR Block", type: "text", placeholder: "10.0.0.0/16" },
        {
          path: "ipFamily",
          label: "IP Protocol Family",
          type: "select",
          options: [
            { label: "IPv4 Only", value: "IPv4-Only" },
            { label: "Dual Stack (IPv4 + IPv6)", value: "Dual-Stack-IPv6" },
          ],
        },
        { path: "region", label: "Deployment Region", type: "text", placeholder: "us-east-1" },
        {
          path: "isolationLevel",
          label: "Network Isolation",
          type: "select",
          options: [
            { label: "Internet Routable (Default IGW)", value: "internet-routable" },
            { label: "Isolated Air-Gapped Private", value: "isolated-private" },
            { label: "Shared Services Transit Mesh", value: "shared-services" },
          ],
        },
      ],
    },
    {
      id: "dns-features",
      title: "DNS & Peering",
      fields: [
        { path: "dnsHostnamesEnabled", label: "Enable DNS Hostnames", type: "boolean" },
        { path: "dnsResolutionEnabled", label: "Enable Amazon/VPC DNS Resolution", type: "boolean" },
        { path: "peeringConnectionsCount", label: "Active VPC Peering Links", type: "number", min: 0, max: 16 },
      ],
    },
  ],
};

// 09 — Subnet
export const subnetDefinition: InfrastructureComponentDefinition<SubnetConfig> = {
  id: "subnet",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Subnet",
    shortName: "Subnet",
    description: "Contained partition of a VPC's IP address space bound to a specific availability zone with dedicated routing and security policies.",
    keywords: ["subnet", "cidr", "public-subnet", "private-subnet", "availability-zone", "ip-block"],
    iconSlug: "subnet",
  },
  configSchema: SubnetConfigSchema,
  defaultConfig: {
    label: "Subnet",
    description: "VPC availability zone IP partition",
    componentType: "subnet",
    environment: "production",
    tags: ["subnet", "network", "az"],
    notes: "",
    enabled: true,
    subnetCidr: "10.0.1.0/24",
    parentVpcId: "vpc-primary",
    availabilityZone: "us-east-1a",
    subnetType: "private-with-nat",
    routeTableReference: "rtb-standard",
    naclReference: "nacl-default",
    availableIps: 251,
  },
  ports: [
    { id: "vpc-parent-in", name: "VPC Parent", type: "input", dataType: "VPC_Membership", description: "Parent VPC association" },
    { id: "instance-traffic", name: "ENI Traffic", type: "bidirectional", dataType: "ENI_Traffic", description: "Instance network interfaces" },
    { id: "nat-route-out", name: "Route Target", type: "output", dataType: "Route_Egress", description: "Egress route to NAT or IGW" },
  ],
  capabilities: ["cidr-partition", "az-placement", "nacl-filtering", "private-routing"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "subnet-geometry",
      title: "Subnet Partition",
      fields: [
        { path: "subnetCidr", label: "Subnet IPv4 CIDR", type: "text", placeholder: "10.0.1.0/24" },
        {
          path: "subnetType",
          label: "Routing Classification",
          type: "select",
          options: [
            { label: "Private (Egress via NAT Gateway)", value: "private-with-nat" },
            { label: "Public (Direct Route to IGW)", value: "public" },
            { label: "Isolated Private (No Internet Route)", value: "isolated-private" },
          ],
        },
        { path: "availabilityZone", label: "Availability Zone", type: "text", placeholder: "us-east-1a" },
        { path: "parentVpcId", label: "Parent VPC Identifier", type: "text", placeholder: "vpc-primary" },
      ],
    },
    {
      id: "security-routing",
      title: "Security & Capacity",
      fields: [
        { path: "routeTableReference", label: "Associated Route Table", type: "text", placeholder: "rtb-standard" },
        { path: "naclReference", label: "Network ACL", type: "text", placeholder: "nacl-default" },
        { path: "availableIps", label: "Available Usable Host IPs", type: "number", min: 1, max: 65536 },
      ],
    },
  ],
};

// 10 — Service Discovery
export const serviceDiscoveryDefinition: InfrastructureComponentDefinition<ServiceDiscoveryConfig> = {
  id: "service-discovery",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Service Discovery",
    shortName: "Service Discovery",
    description: "Dynamic registry tracking healthy microservice network instances and IP/port endpoints in distributed clusters.",
    keywords: ["service-discovery", "consul", "etcd", "eureka", "dns-sd", "dynamic-catalog", "registration"],
    iconSlug: "service-discovery",
  },
  configSchema: ServiceDiscoveryConfigSchema,
  defaultConfig: {
    label: "Service Discovery",
    description: "Dynamic microservice catalog registry",
    componentType: "service-discovery",
    environment: "production",
    tags: ["registry", "discovery", "microservices"],
    notes: "",
    enabled: true,
    registryType: "consul",
    registrationMode: "agent-sidecar",
    serviceHeartbeatIntervalSeconds: 10,
    deregisterCriticalServiceAfterSeconds: 60,
    discoveryNamespace: "production",
    consistencyLevel: "strong-raft",
  },
  ports: [
    { id: "registration-in", name: "Register In", type: "input", dataType: "Service_Registration", description: "Instance registration & heartbeat announcements" },
    { id: "dns-query-in", name: "Lookup Out", type: "bidirectional", dataType: "Endpoint_Lookup", description: "DNS/API endpoint query resolution" },
    { id: "cluster-sync", name: "Raft Sync", type: "bidirectional", dataType: "Consensus_Stream", description: "Consensus cluster replication" },
  ],
  capabilities: ["service-registry", "health-monitoring", "dynamic-endpoints", "dns-sd"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "registry-model",
      title: "Registry Model",
      fields: [
        {
          path: "registryType",
          label: "Registry Engine",
          type: "select",
          options: [
            { label: "HashiCorp Consul", value: "consul" },
            { label: "etcd Cluster", value: "etcd" },
            { label: "CoreDNS Kube-DNS", value: "core-dns" },
            { label: "Netflix Eureka", value: "eureka" },
            { label: "Kubernetes EndpointSlices", value: "k8s-dns" },
          ],
        },
        {
          path: "registrationMode",
          label: "Registration Mechanism",
          type: "select",
          options: [
            { label: "Local Agent / Sidecar Daemon", value: "agent-sidecar" },
            { label: "Application Self-Registration", value: "self-registration" },
            { label: "Third-Party Orchestrator Registrar", value: "third-party-registrar" },
          ],
        },
        { path: "discoveryNamespace", label: "Namespace Scope", type: "text", placeholder: "production" },
        {
          path: "consistencyLevel",
          label: "Consistency Protocol",
          type: "select",
          options: [
            { label: "Strong Consistency (Raft / Paxos)", value: "strong-raft" },
            { label: "Eventual Consistency (Gossip Protocol)", value: "eventual-gossip" },
          ],
        },
      ],
    },
    {
      id: "heartbeat-health",
      title: "Health & Eviction",
      fields: [
        { path: "serviceHeartbeatIntervalSeconds", label: "Heartbeat TTL", type: "number", min: 1, max: 60, unit: "seconds" },
        { path: "deregisterCriticalServiceAfterSeconds", label: "Auto Deregister Window", type: "number", min: 10, max: 3600, unit: "seconds" },
      ],
    },
  ],
};

// 11 — Service Mesh
export const serviceMeshDefinition: InfrastructureComponentDefinition<ServiceMeshConfig> = {
  id: "service-mesh",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Service Mesh",
    shortName: "Service Mesh",
    description: "Dedicated infrastructure layer for securing, observing, and routing microservice-to-microservice communication using mTLS and sidecars.",
    keywords: ["service-mesh", "istio", "linkerd", "envoy", "mtls", "circuit-breaker", "sidecar"],
    iconSlug: "service-mesh",
  },
  configSchema: ServiceMeshConfigSchema,
  defaultConfig: {
    label: "Service Mesh",
    description: "Zero-trust service mesh control plane",
    componentType: "service-mesh",
    environment: "production",
    tags: ["mesh", "istio", "mtls", "security"],
    notes: "",
    enabled: true,
    meshTechnology: "istio",
    dataPlaneArchitecture: "sidecar-proxy",
    mutualTlsMode: "strict-enforced",
    circuitBreakerEnabled: true,
    maxConnectionsPerService: 1024,
    telemetryProvider: "opentelemetry",
  },
  ports: [
    { id: "mesh-ingress", name: "Mesh Ingress", type: "input", dataType: "Mesh_Ingress", description: "External traffic entering the mesh data plane" },
    { id: "service-to-service", name: "mTLS Bus", type: "bidirectional", dataType: "mTLS_Traffic", description: "Encrypted inter-service communication" },
    { id: "control-plane-conn", name: "xDS Control", type: "bidirectional", dataType: "xDS_Config", description: "Control plane xDS configuration sync" },
  ],
  capabilities: ["mutual-tls", "sidecar-injection", "traffic-shifting", "distributed-tracing"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "mesh-architecture",
      title: "Architecture & Encryption",
      fields: [
        {
          path: "meshTechnology",
          label: "Mesh Technology",
          type: "select",
          options: [
            { label: "Istio (Envoy-based)", value: "istio" },
            { label: "Linkerd (Rust Micro-Proxy)", value: "linkerd" },
            { label: "Consul Connect", value: "consul-connect" },
            { label: "Envoy Kuma", value: "envoy-kuma" },
            { label: "Cilium Service Mesh (eBPF)", value: "cilium-service-mesh" },
          ],
        },
        {
          path: "dataPlaneArchitecture",
          label: "Data Plane Architecture",
          type: "select",
          options: [
            { label: "Dedicated Sidecar Proxy (Envoy per Pod)", value: "sidecar-proxy" },
            { label: "Ambient Sidecarless (eBPF Host Mode)", value: "ambient-sidecarless-ebpf" },
          ],
        },
        {
          path: "mutualTlsMode",
          label: "Mutual TLS (mTLS)",
          type: "select",
          options: [
            { label: "Strict Enforced (Zero-Trust)", value: "strict-enforced" },
            { label: "Permissive (Allow Plaintext Fallback)", value: "permissive" },
            { label: "Disabled", value: "disabled" },
          ],
        },
      ],
    },
    {
      id: "traffic-telemetry",
      title: "Resilience & Telemetry",
      fields: [
        { path: "circuitBreakerEnabled", label: "Circuit Breaker Protection", type: "boolean" },
        { path: "maxConnectionsPerService", label: "Max Conn per Service", type: "number", min: 10, max: 10000 },
        {
          path: "telemetryProvider",
          label: "Distributed Tracing",
          type: "select",
          options: [
            { label: "OpenTelemetry (OTel Standards)", value: "opentelemetry" },
            { label: "Prometheus Metrics", value: "prometheus" },
            { label: "Datadog APM", value: "datadog" },
          ],
        },
      ],
    },
  ],
};

// 12 — Network Firewall
export const networkFirewallDefinition: InfrastructureComponentDefinition<NetworkFirewallConfig> = {
  id: "network-firewall",
  version: 1,
  categoryId: NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  display: {
    name: "Network Firewall",
    shortName: "Firewall",
    description: "Stateful network barrier inspecting and filtering ingress and egress IP packets based on declarative security rules.",
    keywords: ["firewall", "security", "packet-filter", "stateful-inspection", "nacl", "ips", "network-security"],
    iconSlug: "network-firewall",
  },
  configSchema: NetworkFirewallConfigSchema,
  defaultConfig: {
    label: "Network Firewall",
    description: "Perimeter stateful packet inspection firewall",
    componentType: "network-firewall",
    environment: "production",
    tags: ["firewall", "security", "perimeter", "ips"],
    notes: "",
    enabled: true,
    firewallScope: "vpc-perimeter",
    defaultAction: "deny-all-drop",
    statefulInspection: true,
    ruleCount: 16,
    intrusionPreventionEnabled: true,
    loggingDestination: "cloudwatch-s3",
    throughputGbps: 10,
  },
  ports: [
    { id: "traffic-inspect-in", name: "Traffic In", type: "input", dataType: "Raw_Packet_Flow", description: "Inbound and outbound packet inspection stream" },
    { id: "allowed-egress", name: "Allowed Out", type: "output", dataType: "Filtered_Traffic", description: "Permitted traffic forwarding" },
    { id: "blocked-log-out", name: "Security Audit", type: "output", dataType: "Firewall_Drop_Event", description: "Dropped/rejected packet event stream" },
  ],
  capabilities: ["packet-filtering", "stateful-inspection", "ips-ids", "siem-logging"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "firewall-rules",
      title: "Firewall Inspection",
      fields: [
        {
          path: "firewallScope",
          label: "Deployment Scope",
          type: "select",
          options: [
            { label: "VPC Perimeter Boundary", value: "vpc-perimeter" },
            { label: "Stateful Network Core Inspection", value: "stateful-inspection" },
            { label: "Distributed Daemon / Node Agent", value: "distributed-agent" },
            { label: "Host-Based Local Firewall", value: "host-based" },
          ],
        },
        {
          path: "defaultAction",
          label: "Default Rule Action",
          type: "select",
          options: [
            { label: "Deny All (Drop by Default)", value: "deny-all-drop" },
            { label: "Allow All (Permissive Logging)", value: "allow-all" },
          ],
        },
        { path: "statefulInspection", label: "Stateful Packet Tracking", type: "boolean" },
        { path: "intrusionPreventionEnabled", label: "Intrusion Prevention (IPS/IDS)", type: "boolean" },
      ],
    },
    {
      id: "capacity-logging",
      title: "Capacity & Logging",
      fields: [
        { path: "ruleCount", label: "Configured Rules Count", type: "number", min: 1, max: 1000 },
        { path: "throughputGbps", label: "Maximum Throughput", type: "number", min: 1, max: 100, unit: "Gbps" },
        {
          path: "loggingDestination",
          label: "Audit Log Sink",
          type: "select",
          options: [
            { label: "Cloud Object Storage (S3 / CloudWatch)", value: "cloudwatch-s3" },
            { label: "SIEM / Syslog Central Stream", value: "syslog-siem" },
            { label: "Local Buffer Only", value: "local-buffer" },
          ],
        },
      ],
    },
  ],
};

export const ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS: readonly InfrastructureComponentDefinition[] = [
  loadBalancerDefinition,
  layer4LoadBalancerDefinition,
  layer7LoadBalancerDefinition,
  apiGatewayDefinition,
  ingressControllerDefinition,
  forwardProxyDefinition,
  natGatewayDefinition,
  vpcDefinition,
  subnetDefinition,
  serviceDiscoveryDefinition,
  serviceMeshDefinition,
  networkFirewallDefinition,
] as const;

