/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Database Connection Pooling & Saturation Analyzer
 */

import type {
  ConnectionPoolingConfig,
  QueryWorkload,
  DatabaseAsset,
  DatabaseProviderCapabilities,
  DatabaseArchitectureFinding,
} from "../contracts/database.types";

export class ConnectionAnalyzer {
  public static analyze(
    asset: DatabaseAsset,
    capabilities: DatabaseProviderCapabilities,
    workloads: QueryWorkload[] = [],
    config?: ConnectionPoolingConfig
  ): DatabaseArchitectureFinding[] {
    const findings: DatabaseArchitectureFinding[] = [];

    // Calculate total concurrent client connections required by workloads
    const totalConcurrentClients = workloads.reduce((sum, w) => sum + w.concurrentClients, 0);
    const maxDbConnections = capabilities.maxConnectionsDefault ?? 100;

    // 1. Direct Connections Exceeding Database Limits
    if (!config || config.poolType === "direct") {
      if (totalConcurrentClients > maxDbConnections) {
        findings.push({
          id: `finding-conn-exhaustion-${asset.id}`,
          category: "connection_pool_exhaustion",
          severity: "critical",
          title: `Direct Connection Exhaustion on "${asset.name}" (${totalConcurrentClients} > ${maxDbConnections})`,
          explanation: `Workloads require ${totalConcurrentClients} concurrent client connections, but "${asset.name}" uses direct unpooled connections with a database engine capacity limit of ${maxDbConnections}. Excess client connection attempts will be rejected with "too many connections" errors.`,
          evidence: [
            `Database: ${asset.name} (${asset.providerTechnology})`,
            `Engine Max Connections: ${maxDbConnections}`,
            `Modeled Concurrent Clients: ${totalConcurrentClients}`,
            `Pooler: None (Direct connections)`,
          ],
          riskAnalysis:
            "Complete service outage as microservices fail to acquire database handles, leading to cascading HTTP 503 errors.",
          remediation:
            "Deploy a connection pooler (e.g. PgBouncer in transaction pooling mode or AWS RDS Proxy) to multiplex client connections.",
          deterministicCalculation: {
            metricName: "Connection Demand Ratio",
            value: Number((totalConcurrentClients / maxDbConnections).toFixed(2)),
            threshold: 1.0,
            formula: "concurrent_clients / max_db_connections",
          },
        });
      }
    } else {
      // 2. Pool Saturation Analysis
      const saturationRatio = totalConcurrentClients / config.maxPoolSize;
      if (saturationRatio > 2.0) {
        findings.push({
          id: `finding-pool-saturation-${asset.id}`,
          category: "connection_pool_exhaustion",
          severity: "high",
          title: `Connection Pool Bottleneck on "${asset.name}" (${saturationRatio.toFixed(1)}x Over-subscribed)`,
          explanation: `Connection pool "${config.poolManagerTechnology}" has a max pool size of ${config.maxPoolSize}, while concurrent client demand reaches ${totalConcurrentClients} (${saturationRatio.toFixed(1)}x over-subscription). Requests will spend prolonged periods waiting in pool queues for free connections.`,
          evidence: [
            `Pool Manager: ${config.poolManagerTechnology} (${config.poolType})`,
            `Max Pool Size: ${config.maxPoolSize}`,
            `Concurrent Clients: ${totalConcurrentClients}`,
            `Connection Timeout: ${config.connectionTimeoutMs}ms`,
          ],
          riskAnalysis:
            "High client-side latency and connection acquisition timeout exceptions under peak loads.",
          remediation:
            "Scale connection pool size or tune client query durations so connections are released back to the pool faster.",
        });
      }
    }

    return findings;
  }
}
