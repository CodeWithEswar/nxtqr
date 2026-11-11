/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Master Architecture Network Engine Orchestrator
 */

import type {
  NetworkArchitectureTopology,
  NetworkAnalysisResult,
  NetworkAnalysisSummary,
  NetworkFinding,
} from "../contracts/network.types";
import { DnsAnalyzer } from "../analysis/dns-analyzer";
import { RouteValidator } from "../analysis/route-validator";
import { LoadBalancingAnalyzer } from "../analysis/load-balancing-analyzer";
import { TrafficPolicyAnalyzer } from "../analysis/traffic-policy-analyzer";
import { PathTraversalEngine } from "../analysis/path-traversal-engine";
import { NetworkSafetyAnalyzer } from "../analysis/network-safety-analyzer";

export class ArchitectureNetworkEngine {
  public analyzeTopology(topology: NetworkArchitectureTopology): NetworkAnalysisResult {
    const findings: NetworkFinding[] = [];

    // 1. Run DNS Analysis
    findings.push(...DnsAnalyzer.analyze(topology));

    // 2. Run Route Validation
    findings.push(...RouteValidator.analyze(topology));

    // 3. Run Load Balancing & Upstream Health Analysis
    findings.push(...LoadBalancingAnalyzer.analyze(topology));

    // 4. Run Traffic Policies & Rate Limiting Analysis
    findings.push(...TrafficPolicyAnalyzer.analyze(topology));

    // 5. Run Path Traversal & Latency Budgeting
    const { paths, findings: pathFindings } = PathTraversalEngine.tracePaths(topology);
    findings.push(...pathFindings);

    // 6. Run Network Safety & Routing Loops Analysis
    findings.push(...NetworkSafetyAnalyzer.analyze(topology));

    // Calculate Summary Metrics
    let dnsRecordCount = 0;
    for (const z of topology.dnsZones) {
      dnsRecordCount += z.records.length;
    }

    let routeCount = 0;
    for (const g of topology.gateways) {
      routeCount += g.routes.length;
    }

    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;

    const summary: NetworkAnalysisSummary = {
      dnsZoneCount: topology.dnsZones.length,
      dnsRecordCount,
      cdnCount: topology.cdnDistributions.length,
      loadBalancerCount: topology.loadBalancers.length,
      gatewayCount: topology.gateways.length,
      routeCount,
      poolCount: topology.upstreamPools.length,
      boundaryCount: topology.boundaries.length,
      meshCount: topology.serviceMeshes.length,
      criticalFindingsCount: criticalCount,
      highFindingsCount: highCount,
      mediumFindingsCount: mediumCount,
      lowFindingsCount: lowCount,
      hasPlaintextExposure: findings.some((f) => f.category === "unencrypted_public_traffic"),
      hasRoutingLoops: findings.some((f) => f.category === "routing_loop_detected"),
      hasBlackHoles: findings.some((f) => f.category === "black_hole_route"),
      hasSingleIngressSpof: findings.some((f) => f.category === "single_ingress_spof"),
    };

    return {
      topologyId: topology.id,
      summary,
      findings,
      resolvedPaths: paths,
      analyzedAt: new Date().toISOString(),
    };
  }
}

export const architectureNetworkEngine = new ArchitectureNetworkEngine();
