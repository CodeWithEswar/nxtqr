/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Deletion Propagation & "Right-to-be-Forgotten" Impact Analysis
 */

import type {
  ArchitectureDataLineageModel,
  DataAsset,
  DeletionPropagationImpact,
  LineageTraversalResult,
} from "../contracts/lineage.types";
import { LineageTraversalEngine } from "../traversal/lineage-traversal";

export class DeletionPropagationAnalyzer {
  /**
   * Analyzes how a deletion event on a given asset propagates through all its
   * downstream copies, replicas, caches, analytics tables, and external third parties.
   */
  public static analyzeAsset(
    asset: DataAsset,
    model: ArchitectureDataLineageModel,
    traversalResult?: LineageTraversalResult
  ): DeletionPropagationImpact {
    const traversal = traversalResult ?? LineageTraversalEngine.traverseAsset(asset.id, model);
    const policy = asset.deletionPolicy;

    const coveredDestinations: Array<{ componentId: string; componentName: string; storeType: string }> = [];
    const uncoveredDestinations: Array<{ componentId: string; componentName: string; storeType: string; risk: string }> = [];
    const backupExemptions: Array<{ componentId: string; componentName: string; retentionNote: string }> = [];

    // Identify authoritative store
    const authoritativeStore =
      asset.storageBindings.find((s) => s.copyType === "primary") ||
      asset.storageBindings[0];
    const authoritativeStoreId = policy?.authoritativeComponentId || authoritativeStore?.componentId;

    // Collect all reached stores from traversal and direct bindings
    const allStores = new Map<string, { componentId: string; componentName: string; storeType: string; copyType: string }>();

    for (const binding of asset.storageBindings) {
      allStores.set(binding.componentId, {
        componentId: binding.componentId,
        componentName: binding.componentName,
        storeType: binding.storeType,
        copyType: binding.copyType,
      });
    }

    for (const store of traversal.dataStoresReached) {
      if (!allStores.has(store.componentId)) {
        allStores.set(store.componentId, {
          componentId: store.componentId,
          componentName: store.componentName,
          storeType: store.storeType,
          copyType: store.copyType,
        });
      }
    }

    // Evaluate each storage destination
    for (const store of allStores.values()) {
      if (store.componentId === authoritativeStoreId) {
        // Authoritative store itself
        coveredDestinations.push({
          componentId: store.componentId,
          componentName: store.componentName,
          storeType: store.storeType,
        });
        continue;
      }

      if (store.copyType === "backup_copy") {
        const backupNote = policy?.backupRetentionNote || "Standard rolling backup retention cycle applies";
        backupExemptions.push({
          componentId: store.componentId,
          componentName: store.componentName,
          retentionNote: backupNote,
        });
        coveredDestinations.push({
          componentId: store.componentId,
          componentName: store.componentName,
          storeType: store.storeType,
        });
        continue;
      }

      if (store.copyType === "cache_copy" || store.storeType === "cache") {
        if (policy?.invalidatesCaches) {
          coveredDestinations.push({
            componentId: store.componentId,
            componentName: store.componentName,
            storeType: store.storeType,
          });
        } else {
          uncoveredDestinations.push({
            componentId: store.componentId,
            componentName: store.componentName,
            storeType: store.storeType,
            risk: "Cache entries are not automatically invalidated upon asset deletion; records remain readable until TTL expiration.",
          });
        }
        continue;
      }

      if (store.copyType === "read_replica") {
        if (policy?.propagatesToReplicas !== false) {
          // Replicas usually receive DB binlog/WAL events by default unless explicitly unmanaged
          coveredDestinations.push({
            componentId: store.componentId,
            componentName: store.componentName,
            storeType: store.storeType,
          });
        } else {
          uncoveredDestinations.push({
            componentId: store.componentId,
            componentName: store.componentName,
            storeType: store.storeType,
            risk: "Read replicas do not receive automated replication of deletion events.",
          });
        }
        continue;
      }

      // Analytics copies, search indexes, data warehouses
      if (store.copyType === "analytics_copy" || store.storeType === "data_warehouse" || store.storeType === "search_index") {
        if (policy?.cascadesToDestinations) {
          coveredDestinations.push({
            componentId: store.componentId,
            componentName: store.componentName,
            storeType: store.storeType,
          });
        } else {
          uncoveredDestinations.push({
            componentId: store.componentId,
            componentName: store.componentName,
            storeType: store.storeType,
            risk: `Secondary store (${store.storeType}) does not receive automated cascade deletions, leading to persistent stale personal data.`,
          });
        }
        continue;
      }

      // Default storage destination
      if (policy?.cascadesToDestinations) {
        coveredDestinations.push({
          componentId: store.componentId,
          componentName: store.componentName,
          storeType: store.storeType,
        });
      } else {
        uncoveredDestinations.push({
          componentId: store.componentId,
          componentName: store.componentName,
          storeType: store.storeType,
          risk: "Downstream storage destination lacks documented deletion propagation cascade.",
        });
      }
    }

    // Third party notifications
    const thirdPartyPurgesRequired = [...traversal.thirdPartiesReached];

    // Compute propagation readiness percentage
    const totalDestinations = coveredDestinations.length + uncoveredDestinations.length;
    let readinessPct = 100;
    if (totalDestinations > 0) {
      readinessPct = Math.round((coveredDestinations.length / totalDestinations) * 100);
    }

    // If there are third party purges required but no notification policy, deduct 15%
    if (thirdPartyPurgesRequired.length > 0 && !policy?.notifiesThirdParties) {
      readinessPct = Math.max(0, readinessPct - 15);
    }

    return {
      assetId: asset.id,
      assetName: asset.name,
      authoritativeStoreId,
      coveredDestinations,
      uncoveredDestinations,
      backupExemptions,
      thirdPartyPurgesRequired,
      propagationReadinessPct: readinessPct,
    };
  }
}

