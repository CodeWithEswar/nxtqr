/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Conservative Classification Propagation Engine
 * Ensures sensitive data does not silently downgrade without verified reduction transformations.
 */

import type {
  ArchitectureDataLineageModel,
  DataAsset,
  DataSensitivityLevel,
} from "../contracts/lineage.types";

export interface ClassificationPropagationResult {
  assetId: string;
  originalLevel: DataSensitivityLevel;
  effectiveDownstreamLevel: DataSensitivityLevel;
  downgradesDetected: Array<{
    transformationId: string;
    transformationType: string;
    fromLevel: DataSensitivityLevel;
    toLevel: DataSensitivityLevel;
    isVerified: boolean;
  }>;
  elevationEvents: Array<{
    combinedWithAssetId: string;
    resultingLevel: DataSensitivityLevel;
  }>;
}

export class ClassificationPropagation {
  private static readonly SENSITIVITY_RANK: Record<DataSensitivityLevel, number> = {
    public: 0,
    internal: 1,
    confidential: 2,
    restricted: 3,
  };

  /**
   * Evaluate propagation of classification through transformations and combinations.
   */
  public static evaluatePropagation(
    asset: DataAsset,
    model: ArchitectureDataLineageModel
  ): ClassificationPropagationResult {
    const originalLevel = asset.classification.level;
    let effectiveDownstreamLevel = originalLevel;

    const downgradesDetected: ClassificationPropagationResult["downgradesDetected"] = [];
    const elevationEvents: ClassificationPropagationResult["elevationEvents"] = [];

    // Find transformations where this asset is an input
    const downstreamTransformations = model.transformations.filter((t) =>
      t.inputAssetIds.includes(asset.id)
    );

    for (const trans of downstreamTransformations) {
      if (!trans.resultingSensitivity) continue;

      const inputRank = this.SENSITIVITY_RANK[originalLevel];
      const outputRank = this.SENSITIVITY_RANK[trans.resultingSensitivity];

      if (outputRank < inputRank) {
        // Potential downgrade
        const isVerifiedReduction =
          trans.type === "anonymization" ||
          trans.type === "tokenization" ||
          trans.type === "hashing";

        downgradesDetected.push({
          transformationId: trans.id,
          transformationType: trans.type,
          fromLevel: originalLevel,
          toLevel: trans.resultingSensitivity,
          isVerified: isVerifiedReduction,
        });

        // Conservative policy: if not a verified reduction transformation, do NOT downgrade effective level
        if (isVerifiedReduction) {
          effectiveDownstreamLevel = trans.resultingSensitivity;
        }
      } else if (outputRank > inputRank) {
        // Elevation
        effectiveDownstreamLevel = trans.resultingSensitivity;
        elevationEvents.push({
          combinedWithAssetId: trans.inputAssetIds.find((id) => id !== asset.id) || "enriched_context",
          resultingLevel: trans.resultingSensitivity,
        });
      }
    }

    return {
      assetId: asset.id,
      originalLevel,
      effectiveDownstreamLevel,
      downgradesDetected,
      elevationEvents,
    };
  }

  /**
   * Combine two sensitivity levels conservatively (returns the higher ranking level).
   */
  public static combineSensitivity(
    a: DataSensitivityLevel,
    b: DataSensitivityLevel
  ): DataSensitivityLevel {
    return this.SENSITIVITY_RANK[a] >= this.SENSITIVITY_RANK[b] ? a : b;
  }

  /**
   * Evaluates classification propagation across all assets and computes effective node sensitivity.
   */
  public static propagate(model: ArchitectureDataLineageModel): ModelClassificationPropagationResult {
    const assetResults = model.assets.map((a) => this.evaluatePropagation(a, model));
    const effectiveNodeSensitivity: Record<string, DataSensitivityLevel> = {};

    // Helper to upgrade node sensitivity
    const registerNodeLevel = (nodeId: string, level: DataSensitivityLevel) => {
      const current = effectiveNodeSensitivity[nodeId];
      if (!current) {
        effectiveNodeSensitivity[nodeId] = level;
      } else {
        effectiveNodeSensitivity[nodeId] = this.combineSensitivity(current, level);
      }
    };

    // 1. Consider storage bindings
    for (const asset of model.assets) {
      for (const storage of asset.storageBindings) {
        registerNodeLevel(storage.componentId, asset.classification.level);
      }
    }

    // 2. Consider flows
    const assetMap = new Map<string, DataAsset>();
    for (const asset of model.assets) {
      assetMap.set(asset.id, asset);
    }

    for (const flow of model.flows) {
      let flowMaxLevel: DataSensitivityLevel = "public";
      for (const aId of flow.dataAssetIds) {
        const a = assetMap.get(aId);
        if (a) {
          flowMaxLevel = this.combineSensitivity(flowMaxLevel, a.classification.level);
        }
      }
      registerNodeLevel(flow.sourceComponentId, flowMaxLevel);
      registerNodeLevel(flow.destinationComponentId, flowMaxLevel);
    }

    return {
      assetResults,
      effectiveNodeSensitivity,
      flowsEvaluated: model.flows.length,
    };
  }
}

export interface ModelClassificationPropagationResult {
  assetResults: ClassificationPropagationResult[];
  effectiveNodeSensitivity: Record<string, DataSensitivityLevel>;
  flowsEvaluated: number;
}

export { ClassificationPropagation as ClassificationPropagationEngine };
