/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Master Engine Facade
 */

import type {
  DatabaseArchitectureTopology,
  DatabaseArchitectureFinding,
  DatabaseAnalysisSummary,
  DatabaseProviderCapabilities,
  LockContentionScenario,
  DatabaseMigrationPlan,
  StorageForecast,
  DatabaseFindingSeverity,
} from "../contracts/database.types";
import { DatabaseArchitectureTopologySchema } from "../schemas/database.schemas";
import { DatabaseCapabilityRegistry } from "../providers/database-capability-registry";
import { SchemaAnalyzer } from "../analysis/schema-analyzer";
import { IndexAnalyzer } from "../analysis/index-analyzer";
import { QueryPlanAnalyzer } from "../analysis/query-plan-analyzer";
import { TransactionAnalyzer } from "../analysis/transaction-analyzer";
import { ConnectionAnalyzer } from "../analysis/connection-analyzer";
import { DistributionAnalyzer } from "../analysis/distribution-analyzer";
import { StorageGrowthAnalyzer } from "../analysis/storage-growth-analyzer";

export interface DatabaseAnalysisOutput {
  topology: DatabaseArchitectureTopology;
  summary: DatabaseAnalysisSummary;
  findings: DatabaseArchitectureFinding[];
  capabilities: Record<string, DatabaseProviderCapabilities>;
  storageForecast?: StorageForecast;
  deadlockScenarios: LockContentionScenario[];
  migrationPlan?: DatabaseMigrationPlan;
}

export class ArchitectureDatabaseEngine {
  private readonly capabilityRegistry = new DatabaseCapabilityRegistry();

  public analyzeTopology(rawTopology: DatabaseArchitectureTopology): DatabaseAnalysisOutput {
    // 1. Validate Schema
    const topology = DatabaseArchitectureTopologySchema.parse(rawTopology);

    const allFindings: DatabaseArchitectureFinding[] = [];
    let unindexedForeignKeysCount = 0;
    let redundantIndexCount = 0;

    // 2. Resolve Capabilities for each Asset
    const capabilities: Record<string, DatabaseProviderCapabilities> = {};
    for (const asset of topology.assets) {
      capabilities[asset.id] = this.capabilityRegistry.resolveCapabilities(asset);
    }

    // 3. Schema Analysis (Unindexed Foreign Keys, Missing Primary Keys, 1NF)
    for (const schema of topology.schemas) {
      const schemaRes = SchemaAnalyzer.analyze(schema);
      allFindings.push(...schemaRes.findings);
      unindexedForeignKeysCount += schemaRes.unindexedForeignKeysCount;

      // 4. Index Analysis (Redundancy, Write Amplification, Missing Indexes)
      const indexRes = IndexAnalyzer.analyze(schema, topology.workloads);
      allFindings.push(...indexRes.findings);
      redundantIndexCount += indexRes.redundantIndexCount;

      // 5. Distribution Analysis (Partition Pruning, Scatter-Gather Joins, Replica Lag)
      const distFindings = DistributionAnalyzer.analyze(
        schema,
        topology.workloads,
        topology.sharding,
        topology.readReplicaRouting
      );
      allFindings.push(...distFindings);
    }

    // 6. Query Plan Analysis (Sequential Scans, Estimation Mismatches, Nested Loops)
    const planFindings = QueryPlanAnalyzer.analyze(topology.executionPlans);
    allFindings.push(...planFindings);

    // 7. Transaction Analysis (Anomalies, Locks, Deadlock Wait-For Graph Cycles)
    const txRes = TransactionAnalyzer.analyze(topology.transactions);
    allFindings.push(...txRes.findings);
    const deadlockRiskCount = txRes.deadlockRiskCount;
    const deadlockScenarios = txRes.deadlockScenarios;

    // 8. Connection Pooling & Saturation Analysis
    for (const asset of topology.assets) {
      const assetCaps = capabilities[asset.id] ?? this.capabilityRegistry.getCapabilities("custom");
      const connFindings = ConnectionAnalyzer.analyze(
        asset,
        assetCaps,
        topology.workloads,
        topology.connectionPooling
      );
      allFindings.push(...connFindings);
    }

    // 9. Storage Growth & IOPS Analysis
    let storageForecast: StorageForecast | undefined = topology.storageForecast;
    if (topology.schemas.length > 0) {
      const primarySchema = topology.schemas[0];
      const storageRes = StorageGrowthAnalyzer.analyze(
        primarySchema,
        topology.workloads,
        topology.storageForecast?.allocatedDiskMb ?? 100000,
        topology.storageForecast?.provisionedIops ?? 3000
      );
      allFindings.push(...storageRes.findings);
      if (!storageForecast) {
        storageForecast = storageRes.forecast;
      }
    }

    // 10. Migration Plan & Expand-and-Contract Analysis
    let breakingMigrationCount = 0;
    const migrationPlan = topology.migrationPlan;
    if (migrationPlan) {
      const hasBreaking = migrationPlan.diffEntries.some((d) => d.isBreakingChange);
      if (hasBreaking) {
        breakingMigrationCount++;
      }
      for (let i = 0; i < migrationPlan.steps.length; i++) {
        const step = migrationPlan.steps[i];
        if (step.requiresLock) {
          allFindings.push({
            id: `finding-migration-step-${migrationPlan.id}-${i}`,
            category: "breaking_migration_table_rewrite",
            severity: "high",
            title: `Migration step "${step.name}" requires exclusive table lock`,
            explanation: `Step ${i + 1} (${step.name}, phase ${step.phase}) requires exclusive lock. Description: ${step.description}`,
            evidence: [
              `Phase: ${step.phase}`,
              `Reversible: ${step.reversible}`,
              `Requires lock: true`,
            ],
            riskAnalysis: `Acquiring an exclusive table lock blocks concurrent read/write transactions, creating connection queuing and latency spikes.`,
            remediation: `Implement expand-and-contract: add nullable or default columns without table rewrites, backfill rows in batches, and validate asynchronously before switching traffic.`,
          });
        }
      }
    }

    // Deduplicate findings by ID & sort by severity
    const uniqueFindingsMap = new Map<string, DatabaseArchitectureFinding>();
    for (const f of allFindings) {
      if (!uniqueFindingsMap.has(f.id)) {
        uniqueFindingsMap.set(f.id, f);
      }
    }

    const severityWeight: Record<DatabaseFindingSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
    };

    const sortedFindings = Array.from(uniqueFindingsMap.values()).sort(
      (a, b) => severityWeight[b.severity] - severityWeight[a.severity]
    );

    const findingsCount = {
      critical: sortedFindings.filter((f) => f.severity === "critical").length,
      high: sortedFindings.filter((f) => f.severity === "high").length,
      medium: sortedFindings.filter((f) => f.severity === "medium").length,
      low: sortedFindings.filter((f) => f.severity === "low").length,
      info: sortedFindings.filter((f) => f.severity === "info").length,
      total: sortedFindings.length,
    };

    const tableCount = topology.schemas.reduce((sum, s) => sum + s.tables.length, 0);
    const indexCount = topology.schemas.reduce(
      (sum, s) => sum + s.tables.reduce((tSum, t) => tSum + t.indexes.length, 0),
      0
    );

    const summary: DatabaseAnalysisSummary = {
      assetCount: topology.assets.length,
      tableCount,
      indexCount,
      workloadCount: topology.workloads.length,
      planCount: topology.executionPlans.length,
      transactionCount: topology.transactions.length,
      unindexedForeignKeysCount,
      redundantIndexCount,
      deadlockRiskCount,
      breakingMigrationCount,
      findingsCount,
    };

    return {
      topology,
      summary,
      findings: sortedFindings,
      capabilities,
      storageForecast,
      deadlockScenarios,
      migrationPlan,
    };
  }

  public getCapabilityRegistry(): DatabaseCapabilityRegistry {
    return this.capabilityRegistry;
  }
}

export const architectureDatabaseEngine = new ArchitectureDatabaseEngine();
