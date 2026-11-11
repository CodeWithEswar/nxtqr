/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Retention Policy Coverage Analysis
 */

import type {
  ArchitectureDataLineageModel,
  DataAsset,
  StorageBinding,
} from "../contracts/lineage.types";

export interface StorageRetentionEvaluation {
  componentId: string;
  componentName: string;
  copyType: StorageBinding["copyType"];
  storeType: StorageBinding["storeType"];
  isTransient: boolean;
  isCovered: boolean;
  durationDays: number;
  trigger?: string;
  deletionMethod?: string;
  hasBackupExemption: boolean;
  warnings: string[];
}

export interface AssetRetentionCoverageResult {
  assetId: string;
  assetName: string;
  classificationLevel: string;
  hasRetentionPolicy: boolean;
  policyName?: string;
  primaryDurationDays?: number;
  storageEvaluations: StorageRetentionEvaluation[];
  isFullyCovered: boolean;
  uncoveredStorageCount: number;
  warnings: string[];
}

export interface ArchitectureRetentionReport {
  totalAssets: number;
  coveredAssets: number;
  uncoveredAssets: number;
  overallCoveragePct: number;
  assetResults: AssetRetentionCoverageResult[];
  criticalGaps: string[];
}

export class RetentionCoverageAnalyzer {
  /**
   * Evaluates retention coverage for a single data asset across all its storage bindings.
   */
  public static evaluateAsset(asset: DataAsset): AssetRetentionCoverageResult {
    const policy = asset.retentionPolicy;
    const hasPolicy = !!policy && policy.durationDays > 0;
    const warnings: string[] = [];

    if (!hasPolicy) {
      warnings.push(`Data asset "${asset.name}" has no active retention schedule or indefinite retention configured.`);
    }

    const storageEvaluations: StorageRetentionEvaluation[] = asset.storageBindings.map((storage) => {
      const storageWarnings: string[] = [];
      let isCovered = false;

      if (storage.isTransient) {
        // Transient storage (e.g. in-memory cache, volatile queue) is considered covered if transient
        isCovered = true;
      } else if (hasPolicy) {
        if (storage.copyType === "backup_copy") {
          if (policy.hasBackupExemption) {
            isCovered = true;
          } else {
            storageWarnings.push(
              `Backup store "${storage.componentName}" retains copies, but no backup exemption is documented for policy "${policy.name}".`
            );
          }
        } else if (storage.copyType === "analytics_copy" || storage.copyType === "export_archive") {
          storageWarnings.push(
            `Secondary store "${storage.componentName}" (${storage.copyType}) must explicitly mirror purge policy "${policy.name}" (${policy.durationDays} days).`
          );
          isCovered = true; // Covered with caution note
        } else {
          isCovered = true;
        }
      } else {
        storageWarnings.push(
          `Durable store "${storage.componentName}" (${storage.copyType}) stores asset "${asset.name}" without a lifecycle retention policy.`
        );
      }

      return {
        componentId: storage.componentId,
        componentName: storage.componentName,
        copyType: storage.copyType,
        storeType: storage.storeType,
        isTransient: storage.isTransient,
        isCovered,
        durationDays: policy ? policy.durationDays : -1,
        trigger: policy?.trigger,
        deletionMethod: policy?.deletionMethod,
        hasBackupExemption: policy?.hasBackupExemption ?? false,
        warnings: storageWarnings,
      };
    });

    const uncoveredCount = storageEvaluations.filter((s) => !s.isCovered).length;
    const isFullyCovered = hasPolicy && uncoveredCount === 0;

    return {
      assetId: asset.id,
      assetName: asset.name,
      classificationLevel: asset.classification.level,
      hasRetentionPolicy: hasPolicy,
      policyName: policy?.name,
      primaryDurationDays: policy?.durationDays,
      storageEvaluations,
      isFullyCovered,
      uncoveredStorageCount: uncoveredCount,
      warnings,
    };
  }

  /**
   * Evaluates retention coverage across all assets in the architecture model.
   */
  public static evaluateModel(model: ArchitectureDataLineageModel): ArchitectureRetentionReport {
    const assetResults = model.assets.map((asset) => this.evaluateAsset(asset));
    const totalAssets = assetResults.length;
    const coveredAssets = assetResults.filter((r) => r.isFullyCovered).length;
    const uncoveredAssets = totalAssets - coveredAssets;
    const overallCoveragePct = totalAssets > 0 ? Math.round((coveredAssets / totalAssets) * 100) : 100;

    const criticalGaps: string[] = [];
    for (const result of assetResults) {
      if (
        (result.classificationLevel === "restricted" || result.classificationLevel === "confidential") &&
        !result.hasRetentionPolicy
      ) {
        criticalGaps.push(
          `High-sensitivity asset "${result.assetName}" (${result.classificationLevel}) is stored indefinitely without a retention policy.`
        );
      }
    }

    return {
      totalAssets,
      coveredAssets,
      uncoveredAssets,
      overallCoveragePct,
      assetResults,
      criticalGaps,
    };
  }
}
