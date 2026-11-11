/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * DNS Architecture, CNAME Loops, TTL & Failover Analyzer
 */

import type {
  NetworkArchitectureTopology,
  NetworkFinding,
  DNSZone,
  DNSRecord,
} from "../contracts/network.types";

export class DnsAnalyzer {
  public static analyze(topology: NetworkArchitectureTopology): NetworkFinding[] {
    const findings: NetworkFinding[] = [];
    const now = new Date().toISOString();
    const prov = {
      source: "modeled_performance" as const,
      sourceIdentifier: "dns_analyzer",
      timestamp: now,
      graphRevision: topology.graphRevision,
      confirmed: true,
    };

    const allRecords: DNSRecord[] = [];
    const zoneMap = new Map<string, DNSZone>();

    for (const zone of topology.dnsZones) {
      zoneMap.set(zone.domainName, zone);
      allRecords.push(...zone.records);
    }

    // 1. CNAME Loop & Deep Chain Detection
    for (const zone of topology.dnsZones) {
      for (const record of zone.records) {
        if (record.recordType === "CNAME") {
          const visited = new Set<string>();
          visited.add(record.name);

          let currentTarget = record.values[0];
          let chainLength = 1;
          let hasLoop = false;

          while (currentTarget) {
            if (visited.has(currentTarget)) {
              hasLoop = true;
              break;
            }
            visited.add(currentTarget);

            const nextRecord = allRecords.find((r) => r.name === currentTarget);
            if (nextRecord && nextRecord.recordType === "CNAME") {
              currentTarget = nextRecord.values[0];
              chainLength++;
            } else {
              break;
            }
          }

          if (hasLoop) {
            findings.push({
              id: `dns-finding-loop-${record.id}`,
              category: "routing_loop_detected",
              severity: "critical",
              title: `DNS CNAME Resolution Loop: ${record.name}`,
              summary: `Circular CNAME pointer detected starting at '${record.name}' referencing '${record.values[0]}'.`,
              rationale:
                "DNS resolvers encountering a circular CNAME chain exhaust recursion limits, causing resolution timeouts and total domain unreachability.",
              affectedResourceIds: [zone.id, record.id],
              remediation:
                "Break the circular CNAME dependency by pointing the terminal record directly to an A/AAAA record or valid CDN alias.",
              provenance: prov,
            });
          } else if (chainLength > 3) {
            findings.push({
              id: `dns-finding-chain-${record.id}`,
              category: "cross_region_latency_bottleneck",
              severity: "medium",
              title: `Excessive DNS CNAME Redirection Chain (${chainLength} Hops): ${record.name}`,
              summary: `CNAME resolution for '${record.name}' requires ${chainLength} sequential lookups.`,
              rationale:
                "Each recursive CNAME resolution adds DNS round-trip latency, especially for mobile and cold-cache clients.",
              affectedResourceIds: [zone.id, record.id],
              remediation:
                "Flatten CNAME chains using DNS apex flattening, ANAME/ALIAS records, or direct CNAME mapping to the CDN edge.",
              provenance: prov,
            });
          }
        }
      }
    }

    // 2. High TTL on Failover Records
    for (const zone of topology.dnsZones) {
      for (const record of zone.records) {
        if (record.routingPolicy?.type === "failover" && record.ttlSeconds > 300) {
          findings.push({
            id: `dns-finding-failover-ttl-${record.id}`,
            category: "failover_destination_unready",
            severity: "high",
            title: `Excessive TTL on Failover DNS Record: ${record.name} (${record.ttlSeconds}s)`,
            summary: `Failover routing policy on '${record.name}' has a TTL of ${record.ttlSeconds} seconds (> 300s).`,
            rationale:
              "When the primary region fails, client resolvers and intermediate recursive caches will continue routing traffic to the dead region until the TTL expires.",
            affectedResourceIds: [zone.id, record.id],
            remediation:
              "Reduce failover record TTL to 60 seconds or lower to ensure rapid traffic shifting during an incident.",
            provenance: prov,
          });
        }
      }
    }

    // 3. Single DNS Provider SPOF for Public Production Zones
    const publicZones = topology.dnsZones.filter((z) => !z.isPrivate);
    if (publicZones.length > 0) {
      const providers = new Set(publicZones.map((z) => z.providerTechnology));
      if (providers.size === 1) {
        const singleProvider = Array.from(providers)[0];
        findings.push({
          id: `dns-finding-spof-provider-${singleProvider}`,
          category: "single_ingress_spof",
          severity: "medium",
          title: `Single DNS Provider Dependency: ${singleProvider}`,
          summary: `All public DNS zones rely exclusively on '${singleProvider}' without secondary authoritative DNS delegation.`,
          rationale:
            "A global outage or DDoS attack against the primary DNS provider takes down all public endpoints regardless of multi-cloud compute resilience.",
          affectedResourceIds: publicZones.map((z) => z.id),
          remediation:
            "Implement dual-provider authoritative DNS (e.g. Route53 + Cloudflare) using multi-signer DNSSEC and zone transfer (AXFR).",
          provenance: prov,
        });
      }
    }

    return findings;
  }
}
