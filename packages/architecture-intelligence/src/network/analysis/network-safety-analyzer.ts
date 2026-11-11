/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Network Safety, Routing Loops, SPOFs & Bandwidth Saturation Analyzer
 */

import type {
  NetworkArchitectureTopology,
  NetworkFinding,
} from "../contracts/network.types";

export class NetworkSafetyAnalyzer {
  public static analyze(topology: NetworkArchitectureTopology): NetworkFinding[] {
    const findings: NetworkFinding[] = [];
    const now = new Date().toISOString();
    const prov = {
      source: "modeled_performance" as const,
      sourceIdentifier: "network_safety_analyzer",
      timestamp: now,
      graphRevision: topology.graphRevision,
      confirmed: true,
    };

    // 1. Single Ingress Gateway SPOF
    if (topology.gateways.length === 1) {
      const singleGw = topology.gateways[0];
      findings.push({
        id: `safety-finding-spof-gw-${singleGw.id}`,
        category: "single_ingress_spof",
        severity: "high",
        title: `Single Ingress Gateway SPOF: ${singleGw.name}`,
        summary: `The entire production ingress traffic depends on a single gateway instance '${singleGw.name}' without secondary gateway redundancy.`,
        rationale:
          "If this single ingress gateway experiences a memory leak, process crash, or configuration failure, all public client traffic is completely severed.",
        affectedResourceIds: [singleGw.id],
        remediation:
          "Deploy multi-instance active-active gateways fronted by an Anycast load balancer or multi-AZ ingress controller.",
        provenance: prov,
      });
    }

    // 2. Gateway-to-Gateway Forwarding Loop Detection
    // Map gateway -> upstream pools -> endpoints
    const gatewayByPoolId = new Map<string, string>();
    for (const gw of topology.gateways) {
      for (const route of gw.routes) {
        gatewayByPoolId.set(route.targetUpstreamPoolId, gw.id);
      }
    }

    for (const gw of topology.gateways) {
      for (const route of gw.routes) {
        // If an upstream pool's endpoint points back to another gateway's listener
        const pool = topology.upstreamPools.find(
          (p) => p.id === route.targetUpstreamPoolId
        );
        if (pool) {
          for (const ep of pool.endpoints) {
            // Check if endpoint address matches another gateway
            const targetGw = topology.gateways.find(
              (g) =>
                g.id !== gw.id &&
                (ep.address.toLowerCase().includes(g.id.toLowerCase()) ||
                  ep.address.toLowerCase().includes(g.name.toLowerCase()))
            );
            if (targetGw) {
              // Check if targetGw routes back to gw
              const loopsBack = targetGw.routes.some((r2) => {
                const p2 = topology.upstreamPools.find(
                  (pool2) => pool2.id === r2.targetUpstreamPoolId
                );
                return p2?.endpoints.some((ep2) =>
                  ep2.address.toLowerCase().includes(gw.id.toLowerCase()) ||
                  ep2.address.toLowerCase().includes(gw.name.toLowerCase())
                );
              });

              if (loopsBack) {
                findings.push({
                  id: `safety-finding-loop-${gw.id}-${targetGw.id}`,
                  category: "routing_loop_detected",
                  severity: "critical",
                  title: `Inter-Gateway Routing Loop: ${gw.name} <-> ${targetGw.name}`,
                  summary: `Circular request proxying detected between gateway '${gw.name}' and '${targetGw.name}'.`,
                  rationale:
                    "Requests will bounce indefinitely between the two gateways until client or proxy timeout budgets expire, causing 100% gateway thread starvation.",
                  affectedResourceIds: [gw.id, targetGw.id],
                  remediation:
                    "Ensure upstream targets resolve directly to application workloads rather than recirculating through ingress gateways.",
                  provenance: prov,
                });
              }
            }
          }
        }
      }
    }

    // 3. Bandwidth Saturation Risk Modeling
    for (const scenario of topology.scenarios) {
      const egressBytesPerSec =
        scenario.requestRateQps * (scenario.averagePayloadBytes + scenario.averageResponseBytes);
      const egressMbps = (egressBytesPerSec * 8) / (1024 * 1024);

      // Flag bandwidth $> 800\text{ Mbps}$ on standard 1 Gbps single gateway interface
      if (egressMbps > 800) {
        findings.push({
          id: `safety-finding-bandwidth-${scenario.id}`,
          category: "bandwidth_saturation_risk",
          severity: "high",
          title: `Egress Bandwidth Saturation Risk: ${scenario.name} (${egressMbps.toFixed(1)} Mbps)`,
          summary: `Scenario traffic demands ${egressMbps.toFixed(1)} Mbps of network throughput, exceeding 80% of standard 1 Gbps interface capacity.`,
          rationale:
            "Approaching interface bandwidth limits causes bufferbloat, severe packet drop, TCP retransmission storms, and tail latency collapse.",
          affectedResourceIds: [scenario.id],
          remediation:
            "Enable response compression (Gzip/Brotli), offload static media to a CDN, or provision 10 Gbps / 25 Gbps network interfaces.",
          provenance: prov,
        });
      }
    }

    return findings;
  }
}
