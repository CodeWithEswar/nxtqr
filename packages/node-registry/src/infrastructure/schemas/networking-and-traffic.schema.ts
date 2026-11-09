import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Load Balancer
export const LoadBalancerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("load-balancer"),
  strategy: z
    .enum(["round-robin", "weighted-round-robin", "least-connections", "ip-hash", "random"])
    .default("round-robin"),
  targetPoolSize: z.number().int().min(1).max(64).default(3),
  healthCheckProtocol: z.enum(["HTTP", "HTTPS", "TCP"]).default("HTTP"),
  healthCheckIntervalSeconds: z.number().int().min(5).max(300).default(15),
  sessionPersistence: z.enum(["none", "cookie-stickiness", "source-ip"]).default("none"),
  connectionTimeoutMs: z.number().int().min(100).max(60000).default(5000),
  idleTimeoutSeconds: z.number().int().min(5).max(3600).default(60),
  assumedRps: z.number().int().min(1).max(5000000).default(10000),
});
export type LoadBalancerConfig = z.infer<typeof LoadBalancerConfigSchema>;

// 02 — Layer 4 Load Balancer
export const Layer4LoadBalancerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("layer-4-load-balancer"),
  transportProtocol: z.enum(["TCP", "UDP", "TCP-UDP-Dual"]).default("TCP"),
  listenerPort: z.number().int().min(1).max(65535).default(443),
  connectionAlgorithm: z
    .enum(["flow-hash-5tuple", "least-outstanding-requests", "round-robin"])
    .default("flow-hash-5tuple"),
  preserveClientIp: z.boolean().default(true),
  connectionTimeoutMs: z.number().int().min(100).max(60000).default(3000),
  idleTimeoutSeconds: z.number().int().min(10).max(7200).default(350),
  assumedConcurrentConnections: z.number().int().min(1).max(10000000).default(50000),
});
export type Layer4LoadBalancerConfig = z.infer<typeof Layer4LoadBalancerConfigSchema>;

// 03 — Layer 7 Load Balancer
export const Layer7LoadBalancerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("layer-7-load-balancer"),
  routingMethod: z
    .enum(["path-based", "host-header", "query-param", "http-header", "cookie"])
    .default("path-based"),
  tlsTermination: z.boolean().default(true),
  minTlsVersion: z.enum(["TLS-1.2", "TLS-1.3"]).default("TLS-1.3"),
  stickySessions: z.boolean().default(true),
  healthCheckPath: z.string().min(1).max(128).default("/healthz"),
  maxHeaderSizeKb: z.number().int().min(4).max(64).default(16),
  assumedRps: z.number().int().min(1).max(5000000).default(25000),
});
export type Layer7LoadBalancerConfig = z.infer<typeof Layer7LoadBalancerConfigSchema>;

// 04 — API Gateway
export const ApiGatewayConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("api-gateway"),
  authPolicy: z
    .enum(["oauth2-jwt", "api-key", "mutual-tls", "iam-rbac", "anonymous"])
    .default("oauth2-jwt"),
  rateLimitRps: z.number().int().min(1).max(100000).default(1000),
  burstCapacity: z.number().int().min(1).max(200000).default(2000),
  requestValidation: z.boolean().default(true),
  timeoutMs: z.number().int().min(100).max(120000).default(15000),
  retryCount: z.number().int().min(0).max(5).default(2),
  corsEnabled: z.boolean().default(true),
});
export type ApiGatewayConfig = z.infer<typeof ApiGatewayConfigSchema>;

// 05 — Ingress Controller
export const IngressControllerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("ingress-controller"),
  controllerType: z
    .enum(["nginx-ingress", "envoy-gateway", "traefik", "contour", "haproxy"])
    .default("nginx-ingress"),
  ingressClass: z.string().min(1).max(64).default("nginx"),
  sslRedirect: z.boolean().default(true),
  hostRulesCount: z.number().int().min(1).max(64).default(4),
  defaultBackendService: z.string().min(1).max(128).default("default-backend-service"),
  healthCheckPath: z.string().min(1).max(128).default("/healthz"),
  websocketSupport: z.boolean().default(true),
});
export type IngressControllerConfig = z.infer<typeof IngressControllerConfigSchema>;

// 06 — Forward Proxy
export const ForwardProxyConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("forward-proxy"),
  authRequired: z.boolean().default(false),
  sslInspection: z.boolean().default(false),
  cachingEnabled: z.boolean().default(true),
  cacheSizeGb: z.number().int().min(1).max(500).default(20),
  accessControlMode: z
    .enum(["whitelist-allow-only", "blacklist-block", "open-internal"])
    .default("whitelist-allow-only"),
  proxyChaining: z.boolean().default(false),
  connectionTimeoutMs: z.number().int().min(100).max(60000).default(10000),
});
export type ForwardProxyConfig = z.infer<typeof ForwardProxyConfigSchema>;

// 07 — NAT Gateway
export const NatGatewayConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("nat-gateway"),
  natMode: z.enum(["managed-snat", "dnat-port-forward", "symmetric-nat"]).default("managed-snat"),
  allocatedEipsCount: z.number().int().min(1).max(8).default(1),
  idleTimeoutSeconds: z.number().int().min(10).max(600).default(300),
  maxConcurrentSessions: z.number().int().min(100).max(2000000).default(55000),
  highAvailabilityZone: z.boolean().default(true),
  privateIpRange: z.string().min(7).max(32).default("10.0.0.0/16"),
});
export type NatGatewayConfig = z.infer<typeof NatGatewayConfigSchema>;

// 08 — Virtual Private Cloud (VPC)
export const VpcConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("vpc"),
  primaryCidr: z.string().min(7).max(32).default("10.0.0.0/16"),
  ipFamily: z.enum(["IPv4-Only", "Dual-Stack-IPv6"]).default("IPv4-Only"),
  region: z.string().min(1).max(64).default("us-east-1"),
  dnsHostnamesEnabled: z.boolean().default(true),
  dnsResolutionEnabled: z.boolean().default(true),
  isolationLevel: z
    .enum(["isolated-private", "internet-routable", "shared-services"])
    .default("internet-routable"),
  peeringConnectionsCount: z.number().int().min(0).max(16).default(1),
});
export type VpcConfig = z.infer<typeof VpcConfigSchema>;

// 09 — Subnet
export const SubnetConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("subnet"),
  subnetCidr: z.string().min(7).max(32).default("10.0.1.0/24"),
  parentVpcId: z.string().min(1).max(64).default("vpc-primary"),
  availabilityZone: z.string().min(1).max(64).default("us-east-1a"),
  subnetType: z
    .enum(["public", "private-with-nat", "isolated-private"])
    .default("private-with-nat"),
  routeTableReference: z.string().min(1).max(64).default("rtb-standard"),
  naclReference: z.string().min(1).max(64).default("nacl-default"),
  availableIps: z.number().int().min(1).max(65536).default(251),
});
export type SubnetConfig = z.infer<typeof SubnetConfigSchema>;

// 10 — Service Discovery
export const ServiceDiscoveryConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("service-discovery"),
  registryType: z
    .enum(["consul", "etcd", "core-dns", "eureka", "k8s-dns"])
    .default("consul"),
  registrationMode: z
    .enum(["agent-sidecar", "self-registration", "third-party-registrar"])
    .default("agent-sidecar"),
  serviceHeartbeatIntervalSeconds: z.number().int().min(1).max(60).default(10),
  deregisterCriticalServiceAfterSeconds: z.number().int().min(10).max(3600).default(60),
  discoveryNamespace: z.string().min(1).max(64).default("production"),
  consistencyLevel: z.enum(["strong-raft", "eventual-gossip"]).default("strong-raft"),
});
export type ServiceDiscoveryConfig = z.infer<typeof ServiceDiscoveryConfigSchema>;

// 11 — Service Mesh
export const ServiceMeshConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("service-mesh"),
  meshTechnology: z
    .enum(["istio", "linkerd", "consul-connect", "envoy-kuma", "cilium-service-mesh"])
    .default("istio"),
  dataPlaneArchitecture: z
    .enum(["sidecar-proxy", "ambient-sidecarless-ebpf"])
    .default("sidecar-proxy"),
  mutualTlsMode: z.enum(["strict-enforced", "permissive", "disabled"]).default("strict-enforced"),
  circuitBreakerEnabled: z.boolean().default(true),
  maxConnectionsPerService: z.number().int().min(10).max(10000).default(1024),
  telemetryProvider: z.enum(["opentelemetry", "prometheus", "datadog"]).default("opentelemetry"),
});
export type ServiceMeshConfig = z.infer<typeof ServiceMeshConfigSchema>;

// 12 — Network Firewall
export const NetworkFirewallConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("network-firewall"),
  firewallScope: z
    .enum(["vpc-perimeter", "stateful-inspection", "distributed-agent", "host-based"])
    .default("vpc-perimeter"),
  defaultAction: z.enum(["deny-all-drop", "allow-all"]).default("deny-all-drop"),
  statefulInspection: z.boolean().default(true),
  ruleCount: z.number().int().min(1).max(1000).default(16),
  intrusionPreventionEnabled: z.boolean().default(true),
  loggingDestination: z.enum(["cloudwatch-s3", "syslog-siem", "local-buffer"]).default("cloudwatch-s3"),
  throughputGbps: z.number().int().min(1).max(100).default(10),
});
export type NetworkFirewallConfig = z.infer<typeof NetworkFirewallConfigSchema>;
