/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Deterministic Privacy Risk Rules Analyzer
 */

import type {
  ArchitectureDataLineageModel,
  DataAsset,
  DataFlow,
  PrivacyFinding,
} from "../contracts/lineage.types";
import { LineageIndexes } from "../traversal/lineage-indexes";

export class PrivacyRiskAnalyzer {
  /**
   * Run full deterministic privacy risk analysis on the architecture data lineage model.
   */
  public static analyze(model: ArchitectureDataLineageModel): PrivacyFinding[] {
    const findings: PrivacyFinding[] = [];
    const indexes = new LineageIndexes(model);

    // Rule 1 & 2: Evaluate Data Assets (Ownership, Retention, Residency, Classification)
    for (const asset of model.assets) {
      this.checkAssetOwnership(asset, findings);
      this.checkAssetRetention(asset, findings);
      this.checkStorageResidency(asset, findings);
      this.checkDeletionPropagation(asset, findings);
    }

    // Rule 3, 4, 5: Evaluate Data Flows (Trust Boundaries, Third-party Sharing, Encryption, Cross-Border)
    for (const flow of model.flows) {
      this.checkFlowTrustBoundaries(flow, indexes, findings);
      this.checkThirdPartySharing(flow, indexes, findings);
      this.checkFlowEncryption(flow, indexes, findings);
      this.checkCrossBorderTransfers(flow, indexes, findings);
    }

    return findings;
  }

  /**
   * Asset lacks designated business or technical owner.
   */
  private static checkAssetOwnership(asset: DataAsset, findings: PrivacyFinding[]): void {
    if (!asset.owner || (!asset.owner.businessOwner && !asset.owner.technicalOwner)) {
      findings.push({
        id: `finding-owner-${asset.id}`,
        severity: "medium",
        category: "missing_data_ownership",
        title: `Unassigned Data Ownership: ${asset.name}`,
        description: `Data asset "${asset.name}" (${asset.classification.level}) has no documented business or technical owner. Clear ownership is required for governance and access approval.`,
        affectedAssetIds: [asset.id],
        affectedComponentIds: asset.storageBindings.map((s) => s.componentId),
        remediation: "Assign a business owner or technical engineering team responsible for this data asset.",
        isConfirmedRisk: false,
      });
    }
  }

  /**
   * Persistent data store holding sensitive data without a retention policy.
   */
  private static checkAssetRetention(asset: DataAsset, findings: PrivacyFinding[]): void {
    const durableStores = asset.storageBindings.filter((s) => !s.isTransient);
    if (durableStores.length > 0 && (!asset.retentionPolicy || asset.retentionPolicy.durationDays === -1)) {
      const isSensitive = asset.classification.level === "restricted" || asset.classification.level === "confidential";
      findings.push({
        id: `finding-retention-${asset.id}`,
        severity: isSensitive ? "high" : "medium",
        category: "missing_retention_policy",
        title: `Missing Retention Policy: ${asset.name}`,
        description: `Asset "${asset.name}" is persistently stored across ${durableStores.length} storage locations without an explicit retention schedule or expiration trigger.`,
        affectedAssetIds: [asset.id],
        affectedComponentIds: durableStores.map((s) => s.componentId),
        remediation: "Define an explicit retention policy specifying duration, expiration trigger, and deletion method.",
        isConfirmedRisk: false,
      });
    }
  }

  /**
   * Data storage location has undocumented region or jurisdiction.
   */
  private static checkStorageResidency(asset: DataAsset, findings: PrivacyFinding[]): void {
    const isSensitive = asset.classification.level === "restricted" || asset.classification.level === "confidential";
    if (!isSensitive) return;

    for (const store of asset.storageBindings) {
      if (!store.regionId && !store.jurisdictionCountry) {
        findings.push({
          id: `finding-residency-${asset.id}-${store.componentId}`,
          severity: "high",
          category: "unknown_storage_residency",
          title: `Undocumented Storage Residency: ${store.componentName}`,
          description: `Sensitive data asset "${asset.name}" is stored in "${store.componentName}" (${store.storeType}) without a documented geographic region or jurisdiction country.`,
          affectedAssetIds: [asset.id],
          affectedComponentIds: [store.componentId],
          remediation: "Document the cloud region and country code where this data store is provisioned.",
          isConfirmedRisk: false,
        });
      }
    }
  }

  /**
   * Asset has multiple copies but deletion policy does not propagate to replicas or caches.
   */
  private static checkDeletionPropagation(asset: DataAsset, findings: PrivacyFinding[]): void {
    if (asset.storageBindings.length <= 1) return;

    const hasReplicasOrCaches = asset.storageBindings.some(
      (s) => s.copyType === "read_replica" || s.copyType === "cache_copy"
    );

    if (hasReplicasOrCaches && (!asset.deletionPolicy || !asset.deletionPolicy.propagatesToReplicas)) {
      findings.push({
        id: `finding-deletion-prop-${asset.id}`,
        severity: "high",
        category: "incomplete_deletion_propagation",
        title: `Incomplete Deletion Propagation: ${asset.name}`,
        description: `Data asset "${asset.name}" maintains multiple copies/replicas across storage systems, but deletion workflows do not explicitly cascade or propagate to replicas and caches.`,
        affectedAssetIds: [asset.id],
        affectedComponentIds: asset.storageBindings.map((s) => s.componentId),
        remediation: "Configure deletion propagation policies to purge read replicas, caches, and search indexes upon user deletion requests.",
        isConfirmedRisk: true,
      });
    }
  }

  /**
   * Sensitive data crosses a trust boundary without TLS / in-transit encryption.
   */
  private static checkFlowTrustBoundaries(
    flow: DataFlow,
    indexes: LineageIndexes,
    findings: PrivacyFinding[]
  ): void {
    if (!flow.crossesTrustBoundary) return;

    const assets = flow.dataAssetIds.map((id) => indexes.assetById.get(id)).filter(Boolean) as DataAsset[];
    const hasSensitiveData = assets.some(
      (a) => a.classification.level === "restricted" || a.classification.level === "confidential"
    );

    if (hasSensitiveData && (!flow.encryptionInTransit || !flow.encryptionInTransit.configured)) {
      findings.push({
        id: `finding-trust-boundary-${flow.id}`,
        severity: "critical",
        category: "unreviewed_trust_boundary",
        title: `Unencrypted Sensitive Flow Across Trust Boundary: ${flow.id}`,
        description: `Flow from ${flow.sourceComponentId} to ${flow.destinationComponentId} crosses trust boundary (${flow.trustBoundaryDetails || "Public to Private"}) carrying confidential/restricted data without verified in-transit encryption.`,
        affectedAssetIds: flow.dataAssetIds,
        affectedFlowIds: [flow.id],
        affectedComponentIds: [flow.sourceComponentId, flow.destinationComponentId],
        remediation: "Enforce TLS 1.3 encryption in transit across all network trust boundary crossings.",
        isConfirmedRisk: true,
      });
    }
  }

  /**
   * Third-party data sharing without explicit processing purpose.
   */
  private static checkThirdPartySharing(
    flow: DataFlow,
    _indexes: LineageIndexes,
    findings: PrivacyFinding[]
  ): void {
    if (!flow.isThirdPartyTransfer) return;

    if (!flow.purposes || flow.purposes.length === 0) {
      findings.push({
        id: `finding-3p-purpose-${flow.id}`,
        severity: "high",
        category: "external_sharing_unknown_purpose",
        title: `Third-Party Transfer Lacks Purpose: ${flow.recipientOrganization || flow.destinationComponentId}`,
        description: `Data is transmitted to external recipient "${flow.recipientOrganization || flow.destinationComponentId}" without an explicitly declared processing purpose.`,
        affectedAssetIds: flow.dataAssetIds,
        affectedFlowIds: [flow.id],
        affectedComponentIds: [flow.sourceComponentId, flow.destinationComponentId],
        remediation: "Specify the lawful business processing purpose and contract reference for this external transfer.",
        isConfirmedRisk: true,
      });
    }
  }

  /**
   * Unencrypted flow carrying restricted/confidential data.
   */
  private static checkFlowEncryption(
    flow: DataFlow,
    indexes: LineageIndexes,
    findings: PrivacyFinding[]
  ): void {
    const assets = flow.dataAssetIds.map((id) => indexes.assetById.get(id)).filter(Boolean) as DataAsset[];
    const isRestricted = assets.some((a) => a.classification.level === "restricted");

    if (isRestricted && (!flow.encryptionInTransit || !flow.encryptionInTransit.configured)) {
      findings.push({
        id: `finding-unencrypted-restricted-${flow.id}`,
        severity: "critical",
        category: "unencrypted_sensitive_flow",
        title: `Unencrypted Restricted Data in Transit: ${flow.id}`,
        description: `Restricted data assets (${assets.map((a) => a.name).join(", ")}) are transferred without in-transit transport security.`,
        affectedAssetIds: flow.dataAssetIds,
        affectedFlowIds: [flow.id],
        affectedComponentIds: [flow.sourceComponentId, flow.destinationComponentId],
        remediation: "Configure mutual TLS (mTLS) or TLS 1.3 transport security for all restricted data paths.",
        isConfirmedRisk: true,
      });
    }
  }

  /**
   * Cross-border / international transfer evaluation.
   */
  private static checkCrossBorderTransfers(
    flow: DataFlow,
    indexes: LineageIndexes,
    findings: PrivacyFinding[]
  ): void {
    if (!flow.sourceJurisdiction || !flow.destinationJurisdiction) return;

    if (flow.sourceJurisdiction !== flow.destinationJurisdiction) {
      const assets = flow.dataAssetIds.map((id) => indexes.assetById.get(id)).filter(Boolean) as DataAsset[];
      const isPersonal = assets.some((a) =>
        a.classification.categories.includes("personal_data") || a.classification.level === "restricted"
      );

      if (isPersonal) {
        findings.push({
          id: `finding-cross-border-${flow.id}`,
          severity: "high",
          category: "cross_border_unreviewed_transfer",
          title: `Cross-Border Transfer: ${flow.sourceJurisdiction} to ${flow.destinationJurisdiction}`,
          description: `Personal or restricted data moves from ${flow.sourceJurisdiction} to ${flow.destinationJurisdiction}. International transfers require privacy assessment and legal transfer mechanisms.`,
          affectedAssetIds: flow.dataAssetIds,
          affectedFlowIds: [flow.id],
          affectedComponentIds: [flow.sourceComponentId, flow.destinationComponentId],
          remediation: "Review international data transfer requirements and ensure Standard Contractual Clauses (SCCs) or adequacy decisions apply.",
          isConfirmedRisk: false,
        });
      }
    }
  }
}
