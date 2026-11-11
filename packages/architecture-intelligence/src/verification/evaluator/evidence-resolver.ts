/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Evidence Resolver & Freshness Evaluator
 */

import type { VerificationEvidence } from "../contracts/verification.types";

export interface EvidenceEvaluation {
  evidenceType: string;
  isSupplied: boolean;
  isFresh: boolean;
  isVerified: boolean;
  ageHours?: number;
  evidenceItems: VerificationEvidence[];
  notes: string[];
}

export class VerificationEvidenceResolver {
  /**
   * Resolves and evaluates evidence requirements against the evidence catalog.
   */
  public static evaluateEvidence(
    requiredTypes: string[],
    catalog: VerificationEvidence[]
  ): EvidenceEvaluation[] {
    const now = Date.now();

    return requiredTypes.map((reqType) => {
      const matching = catalog.filter((e) => e.evidenceType === reqType);

      if (matching.length === 0) {
        return {
          evidenceType: reqType,
          isSupplied: false,
          isFresh: false,
          isVerified: false,
          evidenceItems: [],
          notes: [`Required evidence type '${reqType}' is absent from evidence catalog.`],
        };
      }

      const verifiedItems = matching.filter((e) => e.isVerified);
      const notes: string[] = [];

      // Calculate age of newest matching evidence
      const ages = matching
        .map((e) => {
          const t = Date.parse(e.observedAt);
          return isNaN(t) ? Infinity : (now - t) / (1000 * 60 * 60);
        })
        .filter((a) => a !== Infinity);

      const minAge = ages.length > 0 ? Math.min(...ages) : undefined;
      const newestItem = matching[0];
      const maxAllowedHours = newestItem.freshnessWindowHours || 24;
      const isFresh = minAge !== undefined && minAge <= maxAllowedHours;

      if (!isFresh) {
        notes.push(
          `Evidence '${reqType}' is stale: age is ${minAge ? minAge.toFixed(1) : "unknown"}h (window is ${maxAllowedHours}h).`
        );
      } else {
        notes.push(`Evidence '${reqType}' is fresh (${minAge ? minAge.toFixed(1) : 0}h old).`);
      }

      if (verifiedItems.length === 0) {
        notes.push(`Evidence '${reqType}' is unverified.`);
      }

      return {
        evidenceType: reqType,
        isSupplied: true,
        isFresh,
        isVerified: verifiedItems.length > 0,
        ageHours: minAge,
        evidenceItems: matching,
        notes,
      };
    });
  }
}
