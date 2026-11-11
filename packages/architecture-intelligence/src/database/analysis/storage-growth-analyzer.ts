/**
 * NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
 * Storage Capacity, IOPS & Throughput Saturation Analyzer
 */

import type {
  DatabaseSchema,
  QueryWorkload,
  StorageForecast,
  DatabaseArchitectureFinding,
} from "../contracts/database.types";

export interface StorageAnalysisResult {
  forecast: StorageForecast;
  findings: DatabaseArchitectureFinding[];
}

export class StorageGrowthAnalyzer {
  public static analyze(
    schema: DatabaseSchema,
    workloads: QueryWorkload[] = [],
    allocatedDiskMb: number = 100000, // 100 GB default
    provisionedIops: number = 3000 // 3000 IOPS default (e.g. AWS gp3 baseline)
  ): StorageAnalysisResult {
    const findings: DatabaseArchitectureFinding[] = [];

    let totalLogicalBytes = 0;
    let totalIndexBytes = 0;

    for (const table of schema.tables) {
      const tableDataBytes = table.estimatedRowCount * table.averageRowSizeBytes;
      totalLogicalBytes += tableDataBytes;

      for (const idx of table.indexes) {
        totalIndexBytes += idx.estimatedSizeBytes ?? (tableDataBytes * 0.15);
      }
    }

    const currentLogicalDataMb = Number((totalLogicalBytes / (1024 * 1024)).toFixed(1));
    const currentIndexDataMb = Number((totalIndexBytes / (1024 * 1024)).toFixed(1));
    const currentWalDataMb = Number(((currentLogicalDataMb + currentIndexDataMb) * 0.12).toFixed(1));
    const currentTotalMb = Number(
      (currentLogicalDataMb + currentIndexDataMb + currentWalDataMb).toFixed(1)
    );

    // Estimate monthly growth rate based on write workloads
    let monthlyWriteOperations = 0;
    for (const w of workloads) {
      if (w.queryType === "insert" || w.queryType === "mixed") {
        monthlyWriteOperations += w.frequencyPerMinute * 60 * 24 * 30;
      }
    }

    // Default growth assumption if no explicit write workload modeled
    const projectedMonthlyGrowthMb = monthlyWriteOperations > 0
      ? Number(((monthlyWriteOperations * 2048) / (1024 * 1024)).toFixed(1))
      : Number((currentTotalMb * 0.08).toFixed(1)); // 8% monthly growth

    // Calculate months until 85% capacity saturation
    const availableHeadroomMb = (allocatedDiskMb * 0.85) - currentTotalMb;
    const projectedSaturationMonths = projectedMonthlyGrowthMb > 0 && availableHeadroomMb > 0
      ? Number((availableHeadroomMb / projectedMonthlyGrowthMb).toFixed(1))
      : 0;

    // Model IOPS Demand
    let readIopsModeled = 0;
    let writeIopsModeled = 0;

    for (const w of workloads) {
      const opsPerSecond = w.frequencyPerMinute / 60;
      if (w.readWriteClassification === "read_only") {
        readIopsModeled += opsPerSecond * 2.5; // ~2.5 I/O page reads per query
      } else if (w.readWriteClassification === "write_only") {
        writeIopsModeled += opsPerSecond * 4.0; // table write + WAL + indexes
      } else {
        readIopsModeled += opsPerSecond * 1.5;
        writeIopsModeled += opsPerSecond * 2.5;
      }
    }

    const totalIopsModeled = Number((readIopsModeled + writeIopsModeled).toFixed(1));
    const iopsCapacitySaturationRatio = Number((totalIopsModeled / provisionedIops).toFixed(2));

    const forecast: StorageForecast = {
      currentLogicalDataMb,
      currentIndexDataMb,
      currentWalDataMb,
      currentTotalMb,
      projectedMonthlyGrowthMb,
      projectedSaturationMonths: projectedSaturationMonths > 0 ? projectedSaturationMonths : undefined,
      readIopsModeled: Number(readIopsModeled.toFixed(1)),
      writeIopsModeled: Number(writeIopsModeled.toFixed(1)),
      totalIopsModeled,
      iopsCapacitySaturationRatio,
    };

    // 1. Storage Capacity Saturation Warning (< 3 months headroom)
    if (projectedSaturationMonths !== undefined && projectedSaturationMonths < 3.0 && projectedSaturationMonths > 0) {
      findings.push({
        id: `finding-storage-saturation-${schema.id}`,
        category: "storage_iops_saturation",
        severity: "high",
        title: `Imminent Storage Saturation on Database (${projectedSaturationMonths} Months Remaining)`,
        explanation: `At current monthly growth rate of ${projectedMonthlyGrowthMb} MB/month, allocated disk storage (${allocatedDiskMb.toLocaleString()} MB) will exceed the 85% safety threshold in ${projectedSaturationMonths} months.`,
        evidence: [
          `Current Storage: ${currentTotalMb} MB`,
          `Allocated Disk: ${allocatedDiskMb} MB`,
          `Monthly Growth: ${projectedMonthlyGrowthMb} MB/month`,
          `Projected Saturation: ${projectedSaturationMonths} months`,
        ],
        riskAnalysis:
          "Emergency disk resize downtime, database read-only failover, or WAL disk-full crashes.",
        remediation:
          "Provision additional storage volume capacity or configure table partitioning with automated retention archival.",
        deterministicCalculation: {
          metricName: "Months to 85% Saturation",
          value: projectedSaturationMonths,
          threshold: 3.0,
          formula: "(allocated_mb * 0.85 - current_mb) / monthly_growth_mb",
        },
      });
    }

    // 2. IOPS Saturation Warning (> 80% IOPS capacity)
    if (iopsCapacitySaturationRatio >= 0.8) {
      findings.push({
        id: `finding-iops-saturation-${schema.id}`,
        category: "storage_iops_saturation",
        severity: iopsCapacitySaturationRatio >= 1.0 ? "critical" : "high",
        title: `Storage IOPS Saturation Risk (${(iopsCapacitySaturationRatio * 100).toFixed(0)}% Provisioned IOPS)`,
        explanation: `Modeled peak database operations generate ${totalIopsModeled} IOPS, consuming ${(iopsCapacitySaturationRatio * 100).toFixed(0)}% of the ${provisionedIops} provisioned IOPS. High I/O queue depth will cause query latency spikes.`,
        evidence: [
          `Modeled Read IOPS: ${forecast.readIopsModeled}`,
          `Modeled Write IOPS: ${forecast.writeIopsModeled}`,
          `Total Modeled IOPS: ${totalIopsModeled}`,
          `Provisioned IOPS Limit: ${provisionedIops}`,
          `Saturation Ratio: ${iopsCapacitySaturationRatio}x`,
        ],
        riskAnalysis:
          "Storage throttling, increased checkpoint latency, and cascading connection queueing.",
        remediation:
          "Upgrade storage volume IOPS tier (e.g. provisioned IOPS SSD), increase buffer cache to reduce disk reads, or offload read queries to replicas.",
        deterministicCalculation: {
          metricName: "IOPS Saturation Ratio",
          value: iopsCapacitySaturationRatio,
          threshold: 0.8,
          formula: "total_modeled_iops / provisioned_iops",
        },
      });
    }

    return { forecast, findings };
  }
}
