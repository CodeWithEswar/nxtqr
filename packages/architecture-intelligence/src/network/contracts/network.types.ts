/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Domain Types & Type Definitions
 */

export type NetworkProtocol =
  | "http1"
  | "http2"
  | "http3"
  | "https"
  | "websocket"
  | "grpc"
  | "tcp"
  | "udp"
  | "dns"
  | "tls";

export type NetworkResourceType =
  | "dns_zone"
  | "cdn_distribution"
  | "waf"
  | "reverse_proxy"
  | "load_balancer"
  | "api_gateway"
  | "k8s_gateway"
  | "k8s_ingress"
  | "service_mesh_sidecar"
  | "service_mesh_ingress"
  | "nat_gateway"
  | "vpn_gateway"
  | "custom";

export type RoutingAlgorithm =
  | "round_robin"
  | "weighted_round_robin"
  | "least_connections"
  | "ip_hash"
  | "consistent_hashing"
  | "random"
  | "latency_based"
  | "geographic";

export type HealthCheckProtocol = "http" | "https" | "tcp" | "grpc" | "udp";

export type RateLimitAlgorithm =
  | "fixed_window"
  | "sliding_window"
  | "token_bucket"
  | "leaky_bucket"
  | "concurrency_limit";

export type RateLimitScope =
  | "global"
  | "ip"
  | "user"
  | "api_key"
  | "tenant"
  | "route"
  | "header";

export type TLSMode =
  | "none"
  | "passthrough"
  | "edge_terminated"
  | "re_encrypted"
  | "mtls_strict"
  | "mtls_permissive";

export type DNSRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "ALIAS"
  | "TXT"
  | "SRV"
  | "MX"
  | "CAA";

export type DNSRoutingPolicyType =
  | "simple"
  | "weighted"
  | "geographic"
  | "latency"
  | "failover"
  | "multivalue_answer";

export type TrafficShiftMode =
  | "active_passive"
  | "weighted_split"
  | "canary"
  | "blue_green";

export type NetworkBoundaryType =
  | "public_internet"
  | "edge_network"
  | "dmz"
  | "vpc_public"
  | "vpc_private"
  | "secure_enclave"
  | "mesh_internal";

export type NetworkProviderTechnology =
  | "cloudflare"
  | "aws"
  | "gcp"
  | "azure"
  | "nginx"
  | "envoy"
  | "traefik"
  | "kong"
  | "kubernetes_gateway_api"
  | "kubernetes_ingress"
  | "istio"
  | "linkerd"
  | "custom";

export interface NetworkStateProvenance {
  source:
    | "declared_design"
    | "imported_configuration"
    | "observed_performance"
    | "modeled_performance"
    | "unknown";
  sourceIdentifier?: string;
  timestamp: string;
  graphRevision: string;
  confirmed: boolean;
}

export interface NetworkProviderCapabilities {
  supportsAnycastRouting: boolean;
  supportsLatencyRouting: boolean;
  supportsGeographicRouting: boolean;
  supportsWeightedSplitting: boolean;
  supportsHealthCheckFailover: boolean;
  supportsEdgeTlsTermination: boolean;
  supportsMtls: boolean;
  supportsWafIntegration: boolean;
  supportsTokenBucketRateLimit: boolean;
  supportsCircuitBreaker: boolean;
  supportsHttp3: boolean;
  supportsGrpc: boolean;
  supportsWebSocket: boolean;
  maxRoutesPerGateway?: number;
  provenance: NetworkStateProvenance;
}

export interface DNSRecord {
  id: string;
  name: string;
  recordType: DNSRecordType;
  ttlSeconds: number;
  values: string[];
  targetResourceId?: string;
  routingPolicy?: {
    type: DNSRoutingPolicyType;
    weight?: number;
    region?: string;
    isPrimary?: boolean;
    healthCheckId?: string;
  };
  provenance: NetworkStateProvenance;
}

export interface DNSZone {
  id: string;
  domainName: string;
  isPrivate: boolean;
  vpcIds?: string[];
  records: DNSRecord[];
  providerTechnology: NetworkProviderTechnology;
  provenance: NetworkStateProvenance;
}

export interface CDNDistribution {
  id: string;
  name: string;
  domainNames: string[];
  originTargetIds: string[];
  wafEnabled: boolean;
  tlsMode: TLSMode;
  cachePolicyId?: string;
  providerTechnology: NetworkProviderTechnology;
  provenance: NetworkStateProvenance;
}

export interface HealthCheckPolicy {
  id: string;
  protocol: HealthCheckProtocol;
  path?: string;
  port?: number;
  intervalSeconds: number;
  timeoutSeconds: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
  expectedStatusCodes?: number[];
}

export interface UpstreamPoolMember {
  id: string;
  targetNodeId?: string;
  address: string;
  port: number;
  weight: number;
  isHealthy: boolean;
  isDraining?: boolean;
}

export interface UpstreamPool {
  id: string;
  name: string;
  endpoints: UpstreamPoolMember[];
  healthCheck: HealthCheckPolicy;
  connectionPool?: {
    maxConnections: number;
    maxIdleConnections: number;
    idleTimeoutSeconds: number;
    connectTimeoutMs: number;
  };
  provenance: NetworkStateProvenance;
}

export interface LoadBalancerListener {
  port: number;
  protocol: NetworkProtocol;
  tlsCertificateId?: string;
  targetPoolId: string;
}

export interface LoadBalancer {
  id: string;
  name: string;
  layer: "layer4" | "layer7";
  scheme: "internet_facing" | "internal";
  algorithm: RoutingAlgorithm;
  listeners: LoadBalancerListener[];
  upstreamPoolIds: string[];
  crossZoneLoadBalancing: boolean;
  providerTechnology: NetworkProviderTechnology;
  provenance: NetworkStateProvenance;
}

export interface RateLimitPolicy {
  id: string;
  algorithm: RateLimitAlgorithm;
  limit: number;
  windowSeconds: number;
  burstCapacity?: number;
  scope: RateLimitScope;
  customKeyHeader?: string;
}

export interface TimeoutPolicy {
  clientTimeoutMs?: number;
  gatewayTimeoutMs: number;
  upstreamTimeoutMs: number;
  idleTimeoutMs: number;
}

export interface NetworkRetryPolicy {
  maxRetries: number;
  backoffBaseMs: number;
  backoffMaxMs: number;
  jitter: boolean;
  retryableStatusCodes: number[];
  retryOnIdempotentMethodsOnly: boolean;
}

export interface CircuitBreakerPolicy {
  consecutiveErrorsThreshold: number;
  openTimeoutMs: number;
  halfOpenRequests: number;
  fallbackTargetId?: string;
}

export interface GatewayRouteMatch {
  hosts?: string[];
  pathPrefix?: string;
  pathExact?: string;
  pathRegex?: string;
  methods?: string[];
  headers?: Record<string, string>;
}

export interface RouteTrafficSplit {
  targetUpstreamPoolId: string;
  weight: number;
  versionLabel?: string;
}

export interface GatewayRoute {
  id: string;
  gatewayId: string;
  name: string;
  match: GatewayRouteMatch;
  precedenceOrder: number;
  targetUpstreamPoolId: string;
  targetNodeId?: string;
  policies: {
    authRequired?: boolean;
    rateLimit?: RateLimitPolicy;
    timeout?: TimeoutPolicy;
    retry?: NetworkRetryPolicy;
    circuitBreaker?: CircuitBreakerPolicy;
  };
  trafficSplit?: RouteTrafficSplit[];
  provenance: NetworkStateProvenance;
}

export interface GatewayListener {
  name: string;
  port: number;
  protocol: NetworkProtocol;
  hostname?: string;
  tlsMode: TLSMode;
}

export interface ApiGateway {
  id: string;
  name: string;
  gatewayType: "api_gateway" | "reverse_proxy" | "k8s_gateway" | "k8s_ingress";
  listeners: GatewayListener[];
  routes: GatewayRoute[];
  globalPolicies: {
    rateLimitId?: string;
    corsEnabled?: boolean;
    authRequired?: boolean;
  };
  providerTechnology: NetworkProviderTechnology;
  provenance: NetworkStateProvenance;
}

export interface NetworkBoundaryRule {
  sourceBoundaryId?: string;
  destinationBoundaryId?: string;
  cidr?: string;
  ports: number[];
  protocol: NetworkProtocol;
  action: "allow" | "deny";
}

export interface NetworkBoundary {
  id: string;
  name: string;
  boundaryType: NetworkBoundaryType;
  cidrBlock?: string;
  region?: string;
  zone?: string;
  memberNodeIds: string[];
  ingressRules: NetworkBoundaryRule[];
  egressRules: NetworkBoundaryRule[];
  provenance: NetworkStateProvenance;
}

export interface ServiceMeshPolicy {
  targetServiceId: string;
  circuitBreaker?: CircuitBreakerPolicy;
  retry?: NetworkRetryPolicy;
  rateLimit?: RateLimitPolicy;
}

export interface ServiceMesh {
  id: string;
  name: string;
  meshType: "istio" | "linkerd" | "consul" | "kuma" | "aws_app_mesh" | "custom";
  mode: "sidecar" | "ambient" | "proxyless";
  mtlsMode: TLSMode;
  participatingNodeIds: string[];
  trafficPolicies: ServiceMeshPolicy[];
  provenance: NetworkStateProvenance;
}

export interface TrafficScenario {
  id: string;
  name: string;
  sourceId: string;
  destinationId: string;
  protocol: NetworkProtocol;
  requestRateQps: number;
  averagePayloadBytes: number;
  averageResponseBytes: number;
  concurrency: number;
  geographicRegion?: string;
  shiftMode?: TrafficShiftMode;
  canaryPercentage?: number;
  simulatedFailures?: string[];
}

export interface NetworkPathHop {
  hopIndex: number;
  resourceId: string;
  resourceType: NetworkResourceType;
  resourceName: string;
  protocol: NetworkProtocol;
  tlsState: "plaintext" | "tls" | "mtls";
  crossesBoundary: boolean;
  sourceBoundaryName?: string;
  targetBoundaryName?: string;
  isCrossRegion: boolean;
  latencyBudgetMs?: {
    modeled: number;
    observed?: number;
    isUnknown: boolean;
  };
}

export interface NetworkPath {
  id: string;
  sourceNodeId: string;
  destinationNodeId: string;
  hops: NetworkPathHop[];
  totalModeledLatencyMs: number;
  totalObservedLatencyMs?: number;
  hasPlaintextHop: boolean;
  hasCrossRegionHop: boolean;
  isReachable: boolean;
  unreachableReason?: string;
}

export type NetworkFindingCategory =
  | "routing_loop_detected"
  | "black_hole_route"
  | "unhealthy_upstream_pool"
  | "conflicting_route_precedence"
  | "duplicate_route_path"
  | "unindexed_foreign_endpoint"
  | "timeout_budget_inversion"
  | "retry_amplification_hazard"
  | "rate_limit_scope_omission"
  | "unencrypted_public_traffic"
  | "missing_health_check"
  | "single_ingress_spof"
  | "cross_region_latency_bottleneck"
  | "bandwidth_saturation_risk"
  | "failover_destination_unready";

export interface NetworkFinding {
  id: string;
  category: NetworkFindingCategory;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  summary: string;
  rationale: string;
  affectedResourceIds: string[];
  remediation: string;
  provenance: NetworkStateProvenance;
}

export interface NetworkArchitectureTopology {
  id: string;
  projectId: string;
  architectureId: string;
  graphRevision: string;
  version: number;
  dnsZones: DNSZone[];
  cdnDistributions: CDNDistribution[];
  loadBalancers: LoadBalancer[];
  upstreamPools: UpstreamPool[];
  gateways: ApiGateway[];
  boundaries: NetworkBoundary[];
  serviceMeshes: ServiceMesh[];
  scenarios: TrafficScenario[];
  provenance?: NetworkStateProvenance;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkAnalysisSummary {
  dnsZoneCount: number;
  dnsRecordCount: number;
  cdnCount: number;
  loadBalancerCount: number;
  gatewayCount: number;
  routeCount: number;
  poolCount: number;
  boundaryCount: number;
  meshCount: number;
  criticalFindingsCount: number;
  highFindingsCount: number;
  mediumFindingsCount: number;
  lowFindingsCount: number;
  hasPlaintextExposure: boolean;
  hasRoutingLoops: boolean;
  hasBlackHoles: boolean;
  hasSingleIngressSpof: boolean;
}

export interface NetworkAnalysisResult {
  topologyId: string;
  summary: NetworkAnalysisSummary;
  findings: NetworkFinding[];
  resolvedPaths: NetworkPath[];
  analyzedAt: string;
}
