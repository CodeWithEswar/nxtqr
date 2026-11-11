/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Zod Validation Schemas
 */

import { z } from "zod";
import type {
  NetworkProtocol,
  NetworkResourceType,
  RoutingAlgorithm,
  HealthCheckProtocol,
  RateLimitAlgorithm,
  RateLimitScope,
  TLSMode,
  DNSRecordType,
  DNSRoutingPolicyType,
  TrafficShiftMode,
  NetworkBoundaryType,
  NetworkProviderTechnology,
  NetworkStateProvenance,
  NetworkProviderCapabilities,
  DNSRecord,
  DNSZone,
  CDNDistribution,
  HealthCheckPolicy,
  UpstreamPoolMember,
  UpstreamPool,
  LoadBalancerListener,
  LoadBalancer,
  RateLimitPolicy,
  TimeoutPolicy,
  NetworkRetryPolicy,
  CircuitBreakerPolicy,
  GatewayRouteMatch,
  RouteTrafficSplit,
  GatewayRoute,
  GatewayListener,
  ApiGateway,
  NetworkBoundaryRule,
  NetworkBoundary,
  ServiceMeshPolicy,
  ServiceMesh,
  TrafficScenario,
  NetworkPathHop,
  NetworkPath,
  NetworkFindingCategory,
  NetworkFinding,
  NetworkArchitectureTopology,
  NetworkAnalysisSummary,
  NetworkAnalysisResult,
} from "../contracts/network.types";

export const NetworkProtocolSchema: z.ZodType<NetworkProtocol> = z.enum([
  "http1",
  "http2",
  "http3",
  "https",
  "websocket",
  "grpc",
  "tcp",
  "udp",
  "dns",
  "tls",
]);

export const NetworkResourceTypeSchema: z.ZodType<NetworkResourceType> = z.enum([
  "dns_zone",
  "cdn_distribution",
  "waf",
  "reverse_proxy",
  "load_balancer",
  "api_gateway",
  "k8s_gateway",
  "k8s_ingress",
  "service_mesh_sidecar",
  "service_mesh_ingress",
  "nat_gateway",
  "vpn_gateway",
  "custom",
]);

export const RoutingAlgorithmSchema: z.ZodType<RoutingAlgorithm> = z.enum([
  "round_robin",
  "weighted_round_robin",
  "least_connections",
  "ip_hash",
  "consistent_hashing",
  "random",
  "latency_based",
  "geographic",
]);

export const HealthCheckProtocolSchema: z.ZodType<HealthCheckProtocol> = z.enum([
  "http",
  "https",
  "tcp",
  "grpc",
  "udp",
]);

export const RateLimitAlgorithmSchema: z.ZodType<RateLimitAlgorithm> = z.enum([
  "fixed_window",
  "sliding_window",
  "token_bucket",
  "leaky_bucket",
  "concurrency_limit",
]);

export const RateLimitScopeSchema: z.ZodType<RateLimitScope> = z.enum([
  "global",
  "ip",
  "user",
  "api_key",
  "tenant",
  "route",
  "header",
]);

export const TLSModeSchema: z.ZodType<TLSMode> = z.enum([
  "none",
  "passthrough",
  "edge_terminated",
  "re_encrypted",
  "mtls_strict",
  "mtls_permissive",
]);

export const DNSRecordTypeSchema: z.ZodType<DNSRecordType> = z.enum([
  "A",
  "AAAA",
  "CNAME",
  "ALIAS",
  "TXT",
  "SRV",
  "MX",
  "CAA",
]);

export const DNSRoutingPolicyTypeSchema: z.ZodType<DNSRoutingPolicyType> = z.enum([
  "simple",
  "weighted",
  "geographic",
  "latency",
  "failover",
  "multivalue_answer",
]);

export const TrafficShiftModeSchema: z.ZodType<TrafficShiftMode> = z.enum([
  "active_passive",
  "weighted_split",
  "canary",
  "blue_green",
]);

export const NetworkBoundaryTypeSchema: z.ZodType<NetworkBoundaryType> = z.enum([
  "public_internet",
  "edge_network",
  "dmz",
  "vpc_public",
  "vpc_private",
  "secure_enclave",
  "mesh_internal",
]);

export const NetworkProviderTechnologySchema: z.ZodType<NetworkProviderTechnology> = z.enum([
  "cloudflare",
  "aws",
  "gcp",
  "azure",
  "nginx",
  "envoy",
  "traefik",
  "kong",
  "kubernetes_gateway_api",
  "kubernetes_ingress",
  "istio",
  "linkerd",
  "custom",
]);

export const NetworkStateProvenanceSchema: z.ZodType<NetworkStateProvenance> = z.object({
  source: z.enum([
    "declared_design",
    "imported_configuration",
    "observed_performance",
    "modeled_performance",
    "unknown",
  ]),
  sourceIdentifier: z.string().optional(),
  timestamp: z.string(),
  graphRevision: z.string(),
  confirmed: z.boolean(),
});

export const NetworkProviderCapabilitiesSchema: z.ZodType<NetworkProviderCapabilities> = z.object({
  supportsAnycastRouting: z.boolean(),
  supportsLatencyRouting: z.boolean(),
  supportsGeographicRouting: z.boolean(),
  supportsWeightedSplitting: z.boolean(),
  supportsHealthCheckFailover: z.boolean(),
  supportsEdgeTlsTermination: z.boolean(),
  supportsMtls: z.boolean(),
  supportsWafIntegration: z.boolean(),
  supportsTokenBucketRateLimit: z.boolean(),
  supportsCircuitBreaker: z.boolean(),
  supportsHttp3: z.boolean(),
  supportsGrpc: z.boolean(),
  supportsWebSocket: z.boolean(),
  maxRoutesPerGateway: z.number().optional(),
  provenance: NetworkStateProvenanceSchema,
});

export const DNSRecordSchema: z.ZodType<DNSRecord> = z.object({
  id: z.string(),
  name: z.string(),
  recordType: DNSRecordTypeSchema,
  ttlSeconds: z.number().nonnegative(),
  values: z.array(z.string()),
  targetResourceId: z.string().optional(),
  routingPolicy: z
    .object({
      type: DNSRoutingPolicyTypeSchema,
      weight: z.number().optional(),
      region: z.string().optional(),
      isPrimary: z.boolean().optional(),
      healthCheckId: z.string().optional(),
    })
    .optional(),
  provenance: NetworkStateProvenanceSchema,
});

export const DNSZoneSchema: z.ZodType<DNSZone> = z.object({
  id: z.string(),
  domainName: z.string(),
  isPrivate: z.boolean(),
  vpcIds: z.array(z.string()).optional(),
  records: z.array(DNSRecordSchema),
  providerTechnology: NetworkProviderTechnologySchema,
  provenance: NetworkStateProvenanceSchema,
});

export const CDNDistributionSchema: z.ZodType<CDNDistribution> = z.object({
  id: z.string(),
  name: z.string(),
  domainNames: z.array(z.string()),
  originTargetIds: z.array(z.string()),
  wafEnabled: z.boolean(),
  tlsMode: TLSModeSchema,
  cachePolicyId: z.string().optional(),
  providerTechnology: NetworkProviderTechnologySchema,
  provenance: NetworkStateProvenanceSchema,
});

export const HealthCheckPolicySchema: z.ZodType<HealthCheckPolicy> = z.object({
  id: z.string(),
  protocol: HealthCheckProtocolSchema,
  path: z.string().optional(),
  port: z.number().optional(),
  intervalSeconds: z.number().positive(),
  timeoutSeconds: z.number().positive(),
  healthyThreshold: z.number().int().positive(),
  unhealthyThreshold: z.number().int().positive(),
  expectedStatusCodes: z.array(z.number()).optional(),
});

export const UpstreamPoolMemberSchema: z.ZodType<UpstreamPoolMember> = z.object({
  id: z.string(),
  targetNodeId: z.string().optional(),
  address: z.string(),
  port: z.number(),
  weight: z.number().nonnegative(),
  isHealthy: z.boolean(),
  isDraining: z.boolean().optional(),
});

export const UpstreamPoolSchema: z.ZodType<UpstreamPool> = z.object({
  id: z.string(),
  name: z.string(),
  endpoints: z.array(UpstreamPoolMemberSchema),
  healthCheck: HealthCheckPolicySchema,
  connectionPool: z
    .object({
      maxConnections: z.number().int().positive(),
      maxIdleConnections: z.number().int().nonnegative(),
      idleTimeoutSeconds: z.number().nonnegative(),
      connectTimeoutMs: z.number().positive(),
    })
    .optional(),
  provenance: NetworkStateProvenanceSchema,
});

export const LoadBalancerListenerSchema: z.ZodType<LoadBalancerListener> = z.object({
  port: z.number(),
  protocol: NetworkProtocolSchema,
  tlsCertificateId: z.string().optional(),
  targetPoolId: z.string(),
});

export const LoadBalancerSchema: z.ZodType<LoadBalancer> = z.object({
  id: z.string(),
  name: z.string(),
  layer: z.enum(["layer4", "layer7"]),
  scheme: z.enum(["internet_facing", "internal"]),
  algorithm: RoutingAlgorithmSchema,
  listeners: z.array(LoadBalancerListenerSchema),
  upstreamPoolIds: z.array(z.string()),
  crossZoneLoadBalancing: z.boolean(),
  providerTechnology: NetworkProviderTechnologySchema,
  provenance: NetworkStateProvenanceSchema,
});

export const RateLimitPolicySchema: z.ZodType<RateLimitPolicy> = z.object({
  id: z.string(),
  algorithm: RateLimitAlgorithmSchema,
  limit: z.number().int().positive(),
  windowSeconds: z.number().int().positive(),
  burstCapacity: z.number().int().optional(),
  scope: RateLimitScopeSchema,
  customKeyHeader: z.string().optional(),
});

export const TimeoutPolicySchema: z.ZodType<TimeoutPolicy> = z.object({
  clientTimeoutMs: z.number().optional(),
  gatewayTimeoutMs: z.number().positive(),
  upstreamTimeoutMs: z.number().positive(),
  idleTimeoutMs: z.number().positive(),
});

export const NetworkRetryPolicySchema: z.ZodType<NetworkRetryPolicy> = z.object({
  maxRetries: z.number().int().nonnegative(),
  backoffBaseMs: z.number().positive(),
  backoffMaxMs: z.number().positive(),
  jitter: z.boolean(),
  retryableStatusCodes: z.array(z.number()),
  retryOnIdempotentMethodsOnly: z.boolean(),
});

export const CircuitBreakerPolicySchema: z.ZodType<CircuitBreakerPolicy> = z.object({
  consecutiveErrorsThreshold: z.number().int().positive(),
  openTimeoutMs: z.number().positive(),
  halfOpenRequests: z.number().int().positive(),
  fallbackTargetId: z.string().optional(),
});

export const GatewayRouteMatchSchema: z.ZodType<GatewayRouteMatch> = z.object({
  hosts: z.array(z.string()).optional(),
  pathPrefix: z.string().optional(),
  pathExact: z.string().optional(),
  pathRegex: z.string().optional(),
  methods: z.array(z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const RouteTrafficSplitSchema: z.ZodType<RouteTrafficSplit> = z.object({
  targetUpstreamPoolId: z.string(),
  weight: z.number().nonnegative(),
  versionLabel: z.string().optional(),
});

export const GatewayRouteSchema: z.ZodType<GatewayRoute> = z.object({
  id: z.string(),
  gatewayId: z.string(),
  name: z.string(),
  match: GatewayRouteMatchSchema,
  precedenceOrder: z.number().int(),
  targetUpstreamPoolId: z.string(),
  targetNodeId: z.string().optional(),
  policies: z.object({
    authRequired: z.boolean().optional(),
    rateLimit: RateLimitPolicySchema.optional(),
    timeout: TimeoutPolicySchema.optional(),
    retry: NetworkRetryPolicySchema.optional(),
    circuitBreaker: CircuitBreakerPolicySchema.optional(),
  }),
  trafficSplit: z.array(RouteTrafficSplitSchema).optional(),
  provenance: NetworkStateProvenanceSchema,
});

export const GatewayListenerSchema: z.ZodType<GatewayListener> = z.object({
  name: z.string(),
  port: z.number(),
  protocol: NetworkProtocolSchema,
  hostname: z.string().optional(),
  tlsMode: TLSModeSchema,
});

export const ApiGatewaySchema: z.ZodType<ApiGateway> = z.object({
  id: z.string(),
  name: z.string(),
  gatewayType: z.enum(["api_gateway", "reverse_proxy", "k8s_gateway", "k8s_ingress"]),
  listeners: z.array(GatewayListenerSchema),
  routes: z.array(GatewayRouteSchema),
  globalPolicies: z.object({
    rateLimitId: z.string().optional(),
    corsEnabled: z.boolean().optional(),
    authRequired: z.boolean().optional(),
  }),
  providerTechnology: NetworkProviderTechnologySchema,
  provenance: NetworkStateProvenanceSchema,
});

export const NetworkBoundaryRuleSchema: z.ZodType<NetworkBoundaryRule> = z.object({
  sourceBoundaryId: z.string().optional(),
  destinationBoundaryId: z.string().optional(),
  cidr: z.string().optional(),
  ports: z.array(z.number()),
  protocol: NetworkProtocolSchema,
  action: z.enum(["allow", "deny"]),
});

export const NetworkBoundarySchema: z.ZodType<NetworkBoundary> = z.object({
  id: z.string(),
  name: z.string(),
  boundaryType: NetworkBoundaryTypeSchema,
  cidrBlock: z.string().optional(),
  region: z.string().optional(),
  zone: z.string().optional(),
  memberNodeIds: z.array(z.string()),
  ingressRules: z.array(NetworkBoundaryRuleSchema),
  egressRules: z.array(NetworkBoundaryRuleSchema),
  provenance: NetworkStateProvenanceSchema,
});

export const ServiceMeshPolicySchema: z.ZodType<ServiceMeshPolicy> = z.object({
  targetServiceId: z.string(),
  circuitBreaker: CircuitBreakerPolicySchema.optional(),
  retry: NetworkRetryPolicySchema.optional(),
  rateLimit: RateLimitPolicySchema.optional(),
});

export const ServiceMeshSchema: z.ZodType<ServiceMesh> = z.object({
  id: z.string(),
  name: z.string(),
  meshType: z.enum(["istio", "linkerd", "consul", "kuma", "aws_app_mesh", "custom"]),
  mode: z.enum(["sidecar", "ambient", "proxyless"]),
  mtlsMode: TLSModeSchema,
  participatingNodeIds: z.array(z.string()),
  trafficPolicies: z.array(ServiceMeshPolicySchema),
  provenance: NetworkStateProvenanceSchema,
});

export const TrafficScenarioSchema: z.ZodType<TrafficScenario> = z.object({
  id: z.string(),
  name: z.string(),
  sourceId: z.string(),
  destinationId: z.string(),
  protocol: NetworkProtocolSchema,
  requestRateQps: z.number().nonnegative(),
  averagePayloadBytes: z.number().nonnegative(),
  averageResponseBytes: z.number().nonnegative(),
  concurrency: z.number().nonnegative(),
  geographicRegion: z.string().optional(),
  shiftMode: TrafficShiftModeSchema.optional(),
  canaryPercentage: z.number().optional(),
  simulatedFailures: z.array(z.string()).optional(),
});

export const NetworkPathHopSchema: z.ZodType<NetworkPathHop> = z.object({
  hopIndex: z.number().int().nonnegative(),
  resourceId: z.string(),
  resourceType: NetworkResourceTypeSchema,
  resourceName: z.string(),
  protocol: NetworkProtocolSchema,
  tlsState: z.enum(["plaintext", "tls", "mtls"]),
  crossesBoundary: z.boolean(),
  sourceBoundaryName: z.string().optional(),
  targetBoundaryName: z.string().optional(),
  isCrossRegion: z.boolean(),
  latencyBudgetMs: z
    .object({
      modeled: z.number().nonnegative(),
      observed: z.number().nonnegative().optional(),
      isUnknown: z.boolean(),
    })
    .optional(),
});

export const NetworkPathSchema: z.ZodType<NetworkPath> = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  destinationNodeId: z.string(),
  hops: z.array(NetworkPathHopSchema),
  totalModeledLatencyMs: z.number().nonnegative(),
  totalObservedLatencyMs: z.number().nonnegative().optional(),
  hasPlaintextHop: z.boolean(),
  hasCrossRegionHop: z.boolean(),
  isReachable: z.boolean(),
  unreachableReason: z.string().optional(),
});

export const NetworkFindingCategorySchema: z.ZodType<NetworkFindingCategory> = z.enum([
  "routing_loop_detected",
  "black_hole_route",
  "unhealthy_upstream_pool",
  "conflicting_route_precedence",
  "duplicate_route_path",
  "unindexed_foreign_endpoint",
  "timeout_budget_inversion",
  "retry_amplification_hazard",
  "rate_limit_scope_omission",
  "unencrypted_public_traffic",
  "missing_health_check",
  "single_ingress_spof",
  "cross_region_latency_bottleneck",
  "bandwidth_saturation_risk",
  "failover_destination_unready",
]);

export const NetworkFindingSchema: z.ZodType<NetworkFinding> = z.object({
  id: z.string(),
  category: NetworkFindingCategorySchema,
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  title: z.string(),
  summary: z.string(),
  rationale: z.string(),
  affectedResourceIds: z.array(z.string()),
  remediation: z.string(),
  provenance: NetworkStateProvenanceSchema,
});

export const NetworkArchitectureTopologySchema: z.ZodType<NetworkArchitectureTopology> = z.object({
  id: z.string(),
  projectId: z.string(),
  architectureId: z.string(),
  graphRevision: z.string(),
  version: z.number().int().positive(),
  dnsZones: z.array(DNSZoneSchema),
  cdnDistributions: z.array(CDNDistributionSchema),
  loadBalancers: z.array(LoadBalancerSchema),
  upstreamPools: z.array(UpstreamPoolSchema),
  gateways: z.array(ApiGatewaySchema),
  boundaries: z.array(NetworkBoundarySchema),
  serviceMeshes: z.array(ServiceMeshSchema),
  scenarios: z.array(TrafficScenarioSchema),
  provenance: NetworkStateProvenanceSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const NetworkAnalysisSummarySchema: z.ZodType<NetworkAnalysisSummary> = z.object({
  dnsZoneCount: z.number().int().nonnegative(),
  dnsRecordCount: z.number().int().nonnegative(),
  cdnCount: z.number().int().nonnegative(),
  loadBalancerCount: z.number().int().nonnegative(),
  gatewayCount: z.number().int().nonnegative(),
  routeCount: z.number().int().nonnegative(),
  poolCount: z.number().int().nonnegative(),
  boundaryCount: z.number().int().nonnegative(),
  meshCount: z.number().int().nonnegative(),
  criticalFindingsCount: z.number().int().nonnegative(),
  highFindingsCount: z.number().int().nonnegative(),
  mediumFindingsCount: z.number().int().nonnegative(),
  lowFindingsCount: z.number().int().nonnegative(),
  hasPlaintextExposure: z.boolean(),
  hasRoutingLoops: z.boolean(),
  hasBlackHoles: z.boolean(),
  hasSingleIngressSpof: z.boolean(),
});

export const NetworkAnalysisResultSchema: z.ZodType<NetworkAnalysisResult> = z.object({
  topologyId: z.string(),
  summary: NetworkAnalysisSummarySchema,
  findings: z.array(NetworkFindingSchema),
  resolvedPaths: z.array(NetworkPathSchema),
  analyzedAt: z.string(),
});
