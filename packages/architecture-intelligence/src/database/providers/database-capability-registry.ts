/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Provider Capability Registry
 */

import type {
  DatabaseProviderTechnology,
  DatabaseProviderCapabilities,
  DatabaseEvidenceSource,
  DatabaseAsset,
} from "../contracts/database.types";

export class DatabaseCapabilityRegistry {
  private readonly capabilities = new Map<DatabaseProviderTechnology, DatabaseProviderCapabilities>();

  constructor() {
    this.registerDefaults();
  }

  public getCapabilities(
    technology: DatabaseProviderTechnology,
    evidenceSource: DatabaseEvidenceSource = "modeled_performance"
  ): DatabaseProviderCapabilities {
    const base = this.capabilities.get(technology) || this.getDefaultCustomCapabilities();
    return {
      ...base,
      provenance: {
        source: evidenceSource,
        sourceIdentifier: `registry:${technology}`,
        timestamp: new Date().toISOString(),
        graphRevision: "rev-default",
        confirmed: evidenceSource !== "unknown",
      },
    };
  }

  public resolveCapabilities(asset: DatabaseAsset): DatabaseProviderCapabilities {
    return this.getCapabilities(asset.providerTechnology, asset.provenance?.source || "declared_design");
  }

  public registerCustomCapabilities(
    technology: DatabaseProviderTechnology,
    capabilities: DatabaseProviderCapabilities
  ): void {
    this.capabilities.set(technology, capabilities);
  }

  private registerDefaults(): void {
    const now = new Date().toISOString();
    const defaultProv = {
      source: "imported_configuration" as const,
      timestamp: now,
      graphRevision: "rev-capabilities-v1",
      confirmed: true,
    };

    // 1. PostgreSQL (Reference Implementation)
    this.capabilities.set("postgres", {
      supportsTransactions: true,
      supportedIsolationLevels: [
        "read_uncommitted", // mapped to read_committed in Postgres
        "read_committed",
        "repeatable_read",
        "serializable",
      ],
      supportedIndexTypes: ["btree", "hash", "gin", "gist", "brin", "inverted"],
      supportsPartitioning: true,
      supportedPartitioningTypes: ["range", "hash", "list", "composite"],
      supportsSharding: false, // native Postgres relies on Citus/FDW for sharding
      supportsExplainPlan: true,
      supportsPITR: true,
      supportsCDC: true,
      supportsFullTextSearch: true,
      supportsGeneratedColumns: true,
      maxConnectionsDefault: 100,
      provenance: defaultProv,
    });

    // 2. MySQL / MariaDB
    this.capabilities.set("mysql", {
      supportsTransactions: true,
      supportedIsolationLevels: [
        "read_uncommitted",
        "read_committed",
        "repeatable_read",
        "serializable",
      ],
      supportedIndexTypes: ["btree", "hash", "spatial"],
      supportsPartitioning: true,
      supportedPartitioningTypes: ["range", "hash", "list"],
      supportsSharding: false,
      supportsExplainPlan: true,
      supportsPITR: true,
      supportsCDC: true,
      supportsFullTextSearch: true,
      supportsGeneratedColumns: true,
      maxConnectionsDefault: 151,
      provenance: defaultProv,
    });

    // 3. SQLite
    this.capabilities.set("sqlite", {
      supportsTransactions: true,
      supportedIsolationLevels: ["serializable"],
      supportedIndexTypes: ["btree"],
      supportsPartitioning: false,
      supportedPartitioningTypes: ["none"],
      supportsSharding: false,
      supportsExplainPlan: true,
      supportsPITR: false,
      supportsCDC: false,
      supportsFullTextSearch: true,
      supportsGeneratedColumns: true,
      maxConnectionsDefault: 1, // Single-writer file lock
      provenance: defaultProv,
    });

    // 4. MongoDB (Document DB)
    this.capabilities.set("mongodb", {
      supportsTransactions: true, // Multi-document ACID in replica set
      supportedIsolationLevels: ["read_uncommitted", "read_committed", "snapshot"],
      supportedIndexTypes: ["btree", "hash", "inverted", "spatial"],
      supportsPartitioning: false,
      supportedPartitioningTypes: ["none"],
      supportsSharding: true,
      supportsExplainPlan: true,
      supportsPITR: true,
      supportsCDC: true, // Change Streams
      supportsFullTextSearch: true,
      supportsGeneratedColumns: false,
      maxConnectionsDefault: 1000,
      provenance: defaultProv,
    });

    // 5. Amazon DynamoDB (Key-Value / Document)
    this.capabilities.set("dynamodb", {
      supportsTransactions: true, // TransactWriteItems
      supportedIsolationLevels: ["serializable"],
      supportedIndexTypes: ["hash", "btree"], // Partition Key + Sort Key, LSI/GSI
      supportsPartitioning: true,
      supportedPartitioningTypes: ["hash", "range"],
      supportsSharding: true, // Automatic internal partitioning
      supportsExplainPlan: false,
      supportsPITR: true,
      supportsCDC: true, // DynamoDB Streams
      supportsFullTextSearch: false,
      supportsGeneratedColumns: false,
      maxConnectionsDefault: 10000,
      provenance: defaultProv,
    });

    // 6. ClickHouse (Analytical Column Store)
    this.capabilities.set("clickhouse", {
      supportsTransactions: false,
      supportedIsolationLevels: ["unknown"],
      supportedIndexTypes: ["brin", "btree"],
      supportsPartitioning: true,
      supportedPartitioningTypes: ["range", "hash", "list"],
      supportsSharding: true,
      supportsExplainPlan: true,
      supportsPITR: false,
      supportsCDC: true,
      supportsFullTextSearch: true,
      supportsGeneratedColumns: true,
      maxConnectionsDefault: 4096,
      provenance: defaultProv,
    });

    // 7. CockroachDB (Distributed SQL)
    this.capabilities.set("cockroachdb", {
      supportsTransactions: true,
      supportedIsolationLevels: ["serializable"],
      supportedIndexTypes: ["btree", "hash", "gin"],
      supportsPartitioning: true,
      supportedPartitioningTypes: ["range", "list"],
      supportsSharding: true, // Native automatic range splitting
      supportsExplainPlan: true,
      supportsPITR: true,
      supportsCDC: true,
      supportsFullTextSearch: false,
      supportsGeneratedColumns: true,
      maxConnectionsDefault: 500,
      provenance: defaultProv,
    });
  }

  private getDefaultCustomCapabilities(): DatabaseProviderCapabilities {
    return {
      supportsTransactions: true,
      supportedIsolationLevels: ["read_committed", "serializable"],
      supportedIndexTypes: ["btree"],
      supportsPartitioning: false,
      supportedPartitioningTypes: ["none"],
      supportsSharding: false,
      supportsExplainPlan: false,
      supportsPITR: false,
      supportsCDC: false,
      supportsFullTextSearch: false,
      supportsGeneratedColumns: false,
      maxConnectionsDefault: 100,
      provenance: {
        source: "unknown",
        timestamp: new Date().toISOString(),
        graphRevision: "rev-default",
        confirmed: false,
      },
    };
  }
}
