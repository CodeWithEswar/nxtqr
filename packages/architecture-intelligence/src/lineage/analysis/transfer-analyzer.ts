/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Cross-Border and Third-Party Transfer Analyzer
 */

import type {
  ArchitectureDataLineageModel,
  CrossBorderTransferFinding,
} from "../contracts/lineage.types";
import { LineageIndexStore } from "../traversal/lineage-indexes";

export class TransferAnalyzer {
  /**
   * Identifies and catalogs all cross-border, cross-jurisdiction, and third-party data flows
   * within the architecture model that require engineering review or transfer impact assessment.
   */
  public static analyzeTransfers(model: ArchitectureDataLineageModel): CrossBorderTransferFinding[] {
    const indexes = new LineageIndexStore(model);
    const findings: CrossBorderTransferFinding[] = [];

    for (const flow of model.flows) {
      const isCrossJurisdiction =
        Boolean(flow.sourceJurisdiction &&
        flow.destinationJurisdiction &&
        flow.sourceJurisdiction.toUpperCase() !== flow.destinationJurisdiction.toUpperCase());

      const isCrossRegion =
        Boolean(flow.sourceRegion &&
        flow.destinationRegion &&
        flow.sourceRegion.toLowerCase() !== flow.destinationRegion.toLowerCase());

      const isThirdParty = Boolean(flow.isThirdPartyTransfer || flow.recipientOrganization);

      // Only flag flows that have cross-border, cross-jurisdiction, or third-party characteristics
      if (!isCrossJurisdiction && !isCrossRegion && !isThirdParty) {
        continue;
      }

      for (const assetId of flow.dataAssetIds) {
        const asset = indexes.getAsset(assetId);
        const assetLevel = asset?.classification.level ?? "internal";
        const isHighSensitivity = assetLevel === "restricted" || assetLevel === "confidential";

        let requiresReview = false;
        const notesParts: string[] = [];

        if (isThirdParty) {
          notesParts.push(`Transfers data to external organization "${flow.recipientOrganization || "unspecified"}".`);
          if (isHighSensitivity) {
            requiresReview = true;
            notesParts.push("Contains high-sensitivity data requiring data processing agreement (DPA) and transfer review.");
          }
        }

        if (isCrossJurisdiction) {
          notesParts.push(
            `Crosses legal jurisdictions from ${flow.sourceJurisdiction} to ${flow.destinationJurisdiction}.`
          );
          if (isHighSensitivity || flow.crossesTrustBoundary) {
            requiresReview = true;
            notesParts.push("Cross-jurisdiction transfer of sensitive or boundary-crossing payload.");
          }
        } else if (isCrossRegion) {
          notesParts.push(`Cross-region replication or egress between ${flow.sourceRegion} and ${flow.destinationRegion}.`);
        }

        if (flow.encryptionInTransit && !flow.encryptionInTransit.configured) {
          requiresReview = true;
          notesParts.push("Unencrypted transport detected on boundary/external transfer.");
        }

        findings.push({
          flowId: flow.id,
          assetId,
          sourceComponentId: flow.sourceComponentId,
          sourceRegion: flow.sourceRegion,
          sourceCountry: flow.sourceJurisdiction,
          destinationComponentId: flow.destinationComponentId,
          destinationRegion: flow.destinationRegion,
          destinationCountry: flow.destinationJurisdiction,
          isThirdParty,
          recipientName: flow.recipientOrganization,
          requiresReview,
          notes: notesParts.join(" "),
        });
      }
    }

    return findings;
  }
}

