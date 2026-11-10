import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { NodeSecurityProfile, DataSensitivity } from "../schemas/security.schemas";

export interface SensitiveDataFlowFindingInfo {
  sourceNodeId: string;
  targetNodeId: string;
  edgeId: string;
  dataSensitivity: DataSensitivity;
  flowIssue: "unencrypted-transit" | "unmasked-third-party" | "unscrubbed-telemetry";
}

const THIRD_PARTY_TYPES = new Set([
  "external-dependency",
  "payment-gateway",
  "sms-notification-service",
  "email-service",
  "push-notification-service",
  "social-media-integration",
]);

const TELEMETRY_TYPES = new Set([
  "centralized-log-management",
  "metrics-aggregation-service",
  "distributed-tracing-collector",
  "error-tracking-service",
  "observability-service",
  "data-analytics-warehouse",
]);

export class DataFlowResolver {
  public static analyzeSensitiveFlows(
    _nodes: BaseNode[],
    edges: BaseEdge[],
    profiles: Map<string, NodeSecurityProfile>
  ): SensitiveDataFlowFindingInfo[] {
    const issues: SensitiveDataFlowFindingInfo[] = [];

    for (const edge of edges) {
      const srcProfile = profiles.get(edge.source);
      const tgtProfile = profiles.get(edge.target);
      if (!srcProfile || !tgtProfile) continue;

      // Higher sensitivity of either source or target
      const isSensitive =
        srcProfile.dataSensitivity === "confidential" ||
        srcProfile.dataSensitivity === "restricted" ||
        tgtProfile.dataSensitivity === "confidential" ||
        tgtProfile.dataSensitivity === "restricted";

      if (!isSensitive) continue;

      const effectiveSensitivity =
        srcProfile.dataSensitivity === "restricted" || tgtProfile.dataSensitivity === "restricted"
          ? "restricted"
          : "confidential";

      const edgeData = (edge.data || {}) as Record<string, unknown>;
      const isEncrypted = Boolean(
        edgeData.encryptionInTransit ??
        edgeData.tls ??
        edgeData.ssl ??
        srcProfile.enforcesTls ??
        tgtProfile.enforcesTls
      );

      // Issue 1: Sensitive data traveling over unencrypted edge
      if (!isEncrypted) {
        issues.push({
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          edgeId: edge.id,
          dataSensitivity: effectiveSensitivity,
          flowIssue: "unencrypted-transit",
        });
      }

      // Issue 2: Sensitive data to third-party without masking/tokenization
      if (THIRD_PARTY_TYPES.has(tgtProfile.componentType)) {
        const hasTokenization = Boolean(
          edgeData.tokenized ??
          edgeData.masked ??
          srcProfile.controlsPresent.includes("secrets-vault")
        );
        if (!hasTokenization) {
          issues.push({
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            edgeId: edge.id,
            dataSensitivity: effectiveSensitivity,
            flowIssue: "unmasked-third-party",
          });
        }
      }

      // Issue 3: Sensitive data streamed to telemetry/logging without scrub/redact
      if (TELEMETRY_TYPES.has(tgtProfile.componentType)) {
        const hasRedaction = Boolean(
          edgeData.redacted ??
          edgeData.piiScrubbed ??
          (tgtProfile.nodeName.toLowerCase().includes("redact"))
        );
        if (!hasRedaction) {
          issues.push({
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            edgeId: edge.id,
            dataSensitivity: effectiveSensitivity,
            flowIssue: "unscrubbed-telemetry",
          });
        }
      }
    }

    return issues;
  }
}
