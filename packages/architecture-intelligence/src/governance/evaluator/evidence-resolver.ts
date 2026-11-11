/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Evidence Artifact Freshness & Integrity Resolver
 */

import type {
  EvidenceArtifact,
  EvidenceType,
} from "../contracts/governance.types";

export interface EvidenceResolutionResult {
  isComplete: boolean;
  missingTypes: EvidenceType[];
  evidenceIds: string[];
  staleEvidenceIds: string[];
  resolvedContext: Record<string, any>;
}

export class EvidenceResolver {
  /**
   * Resolves required evidence artifacts for a policy, auditing presence, freshness, and integrity.
   */
  public static resolveEvidence(
    requiredTypes: EvidenceType[],
    availableEvidence: EvidenceArtifact[],
    resourceId?: string,
    currentTimestamp = new Date().toISOString()
  ): EvidenceResolutionResult {
    const missingTypes: EvidenceType[] = [];
    const evidenceIds: string[] = [];
    const staleEvidenceIds: string[] = [];
    const resolvedContext: Record<string, any> = {};

    const nowMs = new Date(currentTimestamp).getTime();

    for (const reqType of requiredTypes) {
      // Find matching evidence for resource or global
      const matching = availableEvidence.filter(
        (e) =>
          e.evidenceType === reqType &&
          (!resourceId || !e.resourceId || e.resourceId === resourceId)
      );

      if (matching.length === 0) {
        missingTypes.push(reqType);
        continue;
      }

      // Check freshness of matching artifacts
      for (const artifact of matching) {
        evidenceIds.push(artifact.id);
        const observedMs = new Date(artifact.observedAt).getTime();
        const ageSeconds = Math.max(0, (nowMs - observedMs) / 1000);

        if (ageSeconds > artifact.freshnessWindowSeconds) {
          staleEvidenceIds.push(artifact.id);
        }

        // Merge content into resolved context
        Object.assign(resolvedContext, artifact.content);
      }
    }

    const isComplete = missingTypes.length === 0 && staleEvidenceIds.length === 0;

    return {
      isComplete,
      missingTypes,
      evidenceIds,
      staleEvidenceIds,
      resolvedContext,
    };
  }

  /**
   * Generates a deterministic content hash for an evidence payload.
   */
  public static computeIntegrityHash(content: Record<string, any>): string {
    const serialized = JSON.stringify(content, Object.keys(content).sort());
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return `sha256-${hex}${hex}`;
  }
}
