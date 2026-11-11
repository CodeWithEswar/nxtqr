"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * React Hook for Studio Network & Traffic Intelligence
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  type NetworkArchitectureTopology,
  type ApiGateway,
  type GatewayRoute,
  type UpstreamPool,
  type DNSZone,
  type NetworkAnalysisResult,
  architectureNetworkEngine,
  GatewayApiParser,
} from "@nxtqr/architecture-intelligence";

export interface UseArchitectureNetworkProps {
  projectId?: string;
  architectureId?: string;
  graphRevision?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialTopology?: NetworkArchitectureTopology;
}

export type NetworkTab =
  | "overview"
  | "dns"
  | "gateways"
  | "load_balancers"
  | "paths"
  | "policies"
  | "regional"
  | "findings";

export function useArchitectureNetwork(props: UseArchitectureNetworkProps) {
  const {
    projectId = "default-project",
    architectureId = "default-arch",
    graphRevision = "rev-default",
    nodes: _nodes = [],
    edges: _edges = [],
    initialTopology,
  } = props;

  // Build realistic production e-commerce & edge gateway topology default
  const defaultTopology: NetworkArchitectureTopology = useMemo(() => {
    if (initialTopology) return initialTopology;

    const now = new Date().toISOString();

    return {
      id: `topo-net-${architectureId}`,
      projectId,
      architectureId,
      graphRevision,
      version: 1,
      dnsZones: [
        {
          id: "zone-acme-public",
          domainName: "acme.corp",
          isPrivate: false,
          providerTechnology: "aws",
          records: [
            {
              id: "rec-apex-a",
              name: "api.acme.corp",
              recordType: "A",
              ttlSeconds: 60,
              values: ["198.51.100.1"],
              routingPolicy: {
                type: "failover",
                isPrimary: true,
                healthCheckId: "hc-primary-dns",
              },
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "rec-secondary-a",
              name: "api.acme.corp",
              recordType: "A",
              ttlSeconds: 60,
              values: ["203.0.113.1"],
              routingPolicy: {
                type: "failover",
                isPrimary: false,
                healthCheckId: "hc-secondary-dns",
              },
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "rec-cdn-cname",
              name: "static.acme.corp",
              recordType: "CNAME",
              ttlSeconds: 300,
              values: ["d111111abcdef8.cloudfront.net"],
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
          ],
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      cdnDistributions: [
        {
          id: "cdn-global-edge",
          name: "Global CloudFront Edge",
          domainNames: ["static.acme.corp", "api.acme.corp"],
          originTargetIds: ["alb-ingress-prod"],
          wafEnabled: true,
          tlsMode: "edge_terminated",
          providerTechnology: "cloudflare",
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      loadBalancers: [
        {
          id: "alb-ingress-prod",
          name: "Production Public Application Load Balancer",
          layer: "layer7",
          scheme: "internet_facing",
          algorithm: "round_robin",
          listeners: [
            {
              port: 443,
              protocol: "https",
              targetPoolId: "pool-edge-gw",
              tlsCertificateId: "cert-acme-corp",
            },
          ],
          upstreamPoolIds: ["pool-edge-gw"],
          crossZoneLoadBalancing: true,
          providerTechnology: "aws",
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      upstreamPools: [
        {
          id: "pool-edge-gw",
          name: "Envoy Edge Gateway Pool",
          endpoints: [
            { id: "ep-gw-1", address: "10.0.1.10", port: 8443, weight: 100, isHealthy: true },
            { id: "ep-gw-2", address: "10.0.2.10", port: 8443, weight: 100, isHealthy: true },
          ],
          healthCheck: {
            id: "hc-gw",
            protocol: "https",
            path: "/healthz/ready",
            port: 8443,
            intervalSeconds: 10,
            timeoutSeconds: 3,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "pool-checkout-v1",
          name: "Checkout Service Upstream (Primary v1)",
          endpoints: [
            { id: "ep-chk-1", address: "10.0.10.5", port: 8080, weight: 100, isHealthy: true },
            { id: "ep-chk-2", address: "10.0.10.6", port: 8080, weight: 100, isHealthy: true },
          ],
          healthCheck: {
            id: "hc-chk",
            protocol: "http",
            path: "/actuator/health",
            port: 8080,
            intervalSeconds: 15,
            timeoutSeconds: 4,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "pool-checkout-v2",
          name: "Checkout Service Upstream (Canary v2)",
          endpoints: [
            { id: "ep-chk-v2-1", address: "10.0.10.7", port: 8080, weight: 100, isHealthy: true },
          ],
          healthCheck: {
            id: "hc-chk-v2",
            protocol: "http",
            path: "/actuator/health",
            port: 8080,
            intervalSeconds: 15,
            timeoutSeconds: 4,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "pool-inventory",
          name: "Inventory & Catalog Pool",
          endpoints: [
            { id: "ep-inv-1", address: "10.0.20.12", port: 8080, weight: 100, isHealthy: true },
            { id: "ep-inv-2", address: "10.0.20.13", port: 8080, weight: 100, isHealthy: true },
          ],
          healthCheck: {
            id: "hc-inv",
            protocol: "http",
            path: "/healthz",
            port: 8080,
            intervalSeconds: 15,
            timeoutSeconds: 5,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      gateways: [
        {
          id: "gw-envoy-ingress",
          name: "Envoy Ingress Gateway (DMZ)",
          gatewayType: "api_gateway",
          listeners: [
            {
              name: "https-main",
              port: 8443,
              protocol: "https",
              hostname: "api.acme.corp",
              tlsMode: "edge_terminated",
            },
          ],
          routes: [
            {
              id: "route-checkout",
              gatewayId: "gw-envoy-ingress",
              name: "Checkout API Route",
              match: {
                hosts: ["api.acme.corp"],
                pathPrefix: "/v1/checkout",
                methods: ["POST", "PUT"],
              },
              precedenceOrder: 10,
              targetUpstreamPoolId: "pool-checkout-v1",
              trafficSplit: [
                { targetUpstreamPoolId: "pool-checkout-v1", weight: 80 },
                { targetUpstreamPoolId: "pool-checkout-v2", weight: 20 },
              ],
              policies: {
                timeout: {
                  gatewayTimeoutMs: 6000,
                  upstreamTimeoutMs: 4000,
                  idleTimeoutMs: 60000,
                  clientTimeoutMs: 6000,
                },
                retry: {
                  maxRetries: 3,
                  backoffBaseMs: 50,
                  backoffMaxMs: 500,
                  jitter: true,
                  retryableStatusCodes: [502, 503, 504],
                  retryOnIdempotentMethodsOnly: true,
                },
                rateLimit: {
                  id: "rl-checkout",
                  algorithm: "token_bucket",
                  limit: 200,
                  windowSeconds: 60,
                  scope: "ip",
                  burstCapacity: 50,
                },
                circuitBreaker: {
                  consecutiveErrorsThreshold: 5,
                  openTimeoutMs: 30000,
                  halfOpenRequests: 5,
                },
              },
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
            {
              id: "route-inventory",
              gatewayId: "gw-envoy-ingress",
              name: "Inventory Catalog Route",
              match: {
                hosts: ["api.acme.corp"],
                pathPrefix: "/v1/inventory",
                methods: ["GET"],
              },
              precedenceOrder: 20,
              targetUpstreamPoolId: "pool-inventory",
              policies: {
                timeout: {
                  gatewayTimeoutMs: 3000,
                  upstreamTimeoutMs: 2000,
                  idleTimeoutMs: 30000,
                },
                rateLimit: {
                  id: "rl-inventory",
                  algorithm: "sliding_window",
                  limit: 1000,
                  windowSeconds: 60,
                  scope: "ip",
                },
              },
              provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
            },
          ],
          globalPolicies: {
            authRequired: true,
            corsEnabled: true,
          },
          providerTechnology: "envoy",
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      boundaries: [
        {
          id: "boundary-internet",
          name: "Public Internet",
          boundaryType: "public_internet",
          memberNodeIds: ["rec-apex-a", "rec-cdn-cname"],
          ingressRules: [],
          egressRules: [],
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "boundary-dmz",
          name: "Edge DMZ / Ingress Network",
          boundaryType: "dmz",
          cidrBlock: "10.0.1.0/24",
          memberNodeIds: ["alb-ingress-prod", "gw-envoy-ingress"],
          ingressRules: [
            { ports: [443, 8443], protocol: "https", action: "allow" },
          ],
          egressRules: [],
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
        {
          id: "boundary-vpc-app",
          name: "Private Application VPC",
          boundaryType: "vpc_private",
          cidrBlock: "10.0.10.0/24",
          memberNodeIds: ["pool-checkout-v1", "pool-checkout-v2", "pool-inventory"],
          ingressRules: [
            { sourceBoundaryId: "boundary-dmz", ports: [8080], protocol: "http1", action: "allow" },
          ],
          egressRules: [],
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      serviceMeshes: [
        {
          id: "mesh-istio-prod",
          name: "Production Istio Service Mesh",
          meshType: "istio",
          mode: "sidecar",
          mtlsMode: "mtls_strict",
          participatingNodeIds: ["pool-checkout-v1", "pool-checkout-v2", "pool-inventory"],
          trafficPolicies: [],
          provenance: { source: "declared_design", timestamp: now, graphRevision, confirmed: true },
        },
      ],
      scenarios: [
        {
          id: "sc-checkout-flow",
          name: "E-Commerce Checkout Flow (User → CDN → ALB → Gateway → Checkout Pool)",
          sourceId: "client-browser",
          destinationId: "pool-checkout-v1",
          protocol: "https",
          requestRateQps: 150,
          averagePayloadBytes: 2048,
          averageResponseBytes: 4096,
          concurrency: 30,
          geographicRegion: "us-east-1",
        },
        {
          id: "sc-inventory-flow",
          name: "Catalog Search Flow (User → CDN → ALB → Gateway → Inventory)",
          sourceId: "client-mobile",
          destinationId: "pool-inventory",
          protocol: "https",
          requestRateQps: 600,
          averagePayloadBytes: 512,
          averageResponseBytes: 16384,
          concurrency: 80,
          geographicRegion: "us-east-1",
        },
        {
          id: "sc-cross-region-eu",
          name: "EU Customer Ingress (EU Client → US-East Gateway Backend)",
          sourceId: "client-eu-london",
          destinationId: "pool-checkout-v1",
          protocol: "https",
          requestRateQps: 40,
          averagePayloadBytes: 2048,
          averageResponseBytes: 4096,
          concurrency: 10,
          geographicRegion: "eu-west-1", // Cross-region transit
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
  }, [projectId, architectureId, graphRevision, initialTopology]);

  // Topology State
  const [topology, setTopology] = useState<NetworkArchitectureTopology>(defaultTopology);
  const [activeTab, setActiveTab] = useState<NetworkTab>("overview");
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>(
    topology.gateways[0]?.id || ""
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    topology.gateways[0]?.routes[0]?.id || ""
  );
  const [selectedPoolId, setSelectedPoolId] = useState<string>(
    topology.upstreamPools[0]?.id || ""
  );
  const [selectedDnsZoneId, setSelectedDnsZoneId] = useState<string>(
    topology.dnsZones[0]?.id || ""
  );
  const [selectedPathId, setSelectedPathId] = useState<string>("");

  // Deterministic Synchronous Analysis Engine Call
  const analysisResult: NetworkAnalysisResult = useMemo(() => {
    return architectureNetworkEngine.analyzeTopology(topology);
  }, [topology]);

  // Selected Resources Helpers
  const selectedGateway = useMemo(() => {
    return topology.gateways.find((g) => g.id === selectedGatewayId) || topology.gateways[0] || null;
  }, [topology.gateways, selectedGatewayId]);

  const selectedRoute = useMemo(() => {
    if (!selectedGateway) return null;
    return selectedGateway.routes.find((r) => r.id === selectedRouteId) || selectedGateway.routes[0] || null;
  }, [selectedGateway, selectedRouteId]);

  const selectedPool = useMemo(() => {
    return topology.upstreamPools.find((p) => p.id === selectedPoolId) || topology.upstreamPools[0] || null;
  }, [topology.upstreamPools, selectedPoolId]);

  const selectedDnsZone = useMemo(() => {
    return topology.dnsZones.find((z) => z.id === selectedDnsZoneId) || topology.dnsZones[0] || null;
  }, [topology.dnsZones, selectedDnsZoneId]);

  const selectedPath = useMemo(() => {
    if (!selectedPathId) return analysisResult.resolvedPaths[0] || null;
    return analysisResult.resolvedPaths.find((p) => p.id === selectedPathId) || analysisResult.resolvedPaths[0] || null;
  }, [analysisResult.resolvedPaths, selectedPathId]);

  // Actions
  const updateGateway = useCallback((updated: ApiGateway) => {
    setTopology((prev) => ({
      ...prev,
      gateways: prev.gateways.map((g) => (g.id === updated.id ? updated : g)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateRoute = useCallback((gatewayId: string, updatedRoute: GatewayRoute) => {
    setTopology((prev) => ({
      ...prev,
      gateways: prev.gateways.map((g) => {
        if (g.id !== gatewayId) return g;
        return {
          ...g,
          routes: g.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
        };
      }),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateUpstreamPool = useCallback((updated: UpstreamPool) => {
    setTopology((prev) => ({
      ...prev,
      upstreamPools: prev.upstreamPools.map((p) => (p.id === updated.id ? updated : p)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateDNSZone = useCallback((updated: DNSZone) => {
    setTopology((prev) => ({
      ...prev,
      dnsZones: prev.dnsZones.map((z) => (z.id === updated.id ? updated : z)),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const importKubernetesManifest = useCallback((yamlOrJson: string) => {
    const parseResult = GatewayApiParser.parse(yamlOrJson);
    if (parseResult.errors.length > 0) {
      return { success: false, errors: parseResult.errors };
    }
    setTopology((prev) => ({
      ...prev,
      gateways: [...prev.gateways, ...parseResult.gateways],
      upstreamPools: [...prev.upstreamPools, ...parseResult.upstreamPools],
      updatedAt: new Date().toISOString(),
    }));
    return { success: true, errors: [] };
  }, []);

  const resetTopology = useCallback(() => {
    setTopology(defaultTopology);
  }, [defaultTopology]);

  return {
    topology,
    setTopology,
    activeTab,
    setActiveTab,
    selectedGatewayId,
    setSelectedGatewayId,
    selectedGateway,
    selectedRouteId,
    setSelectedRouteId,
    selectedRoute,
    selectedPoolId,
    setSelectedPoolId,
    selectedPool,
    selectedDnsZoneId,
    setSelectedDnsZoneId,
    selectedDnsZone,
    selectedPathId,
    setSelectedPathId,
    selectedPath,
    analysisResult,
    updateGateway,
    updateRoute,
    updateUpstreamPool,
    updateDNSZone,
    importKubernetesManifest,
    resetTopology,
  };
}
