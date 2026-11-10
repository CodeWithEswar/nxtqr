import type {
  CriticalityLevelSchema,
  DependencyKindSchema,
  RedundancyModeSchema,
  FailoverModeSchema,
  FailureDomainKindSchema,
  FailureClassificationSchema,
  BusinessCapabilitySchema,
  FailureFindingSchema,
} from "../schemas/failure.schemas";
import type { z } from "zod";

export type CriticalityLevel = z.infer<typeof CriticalityLevelSchema>;
export type DependencyKind = z.infer<typeof DependencyKindSchema>;
export type RedundancyMode = z.infer<typeof RedundancyModeSchema>;
export type FailoverMode = z.infer<typeof FailoverModeSchema>;
export type FailureDomainKind = z.infer<typeof FailureDomainKindSchema>;
export type FailureClassification = z.infer<typeof FailureClassificationSchema>;
export type BusinessCapability = z.infer<typeof BusinessCapabilitySchema>;
export type FailureFinding = z.infer<typeof FailureFindingSchema>;

export interface ResolvedDependency {
  edgeId: string;
  sourceId: string;
  targetId: string;
  kind: DependencyKind;
  isCritical: boolean;
  isSynchronous: boolean;
  isHardDependency: boolean;
  description: string;
}

export interface RedundancyGroup {
  groupId: string;
  name: string;
  mode: RedundancyMode;
  memberNodeIds: string[];
  deploymentDomains: string[];
  failoverMode: FailoverMode;
  stateSync: "synchronous" | "asynchronous" | "none";
  healthCheckConfigured: boolean;
  effectiveReplicas: number;
  hasSingleFailureDomain: boolean;
}

export interface FailureDomain {
  id: string;
  name: string;
  kind: FailureDomainKind;
  memberNodeIds: string[];
  boundaryNodeId?: string;
}

export interface BlastRadiusReport {
  targetId: string;
  targetType: "node" | "failure-domain";
  targetName: string;
  directImpactedNodeIds: string[];
  indirectImpactedNodeIds: string[];
  affectedCapabilityIds: string[];
  unaffectedCapabilityIds: string[];
  degradedCapabilityIds: string[];
  blastRadiusScore: number; // 0 - 100%
  survivingAlternativePaths: number;
  summary: string;
}

export interface FailureAnalysisReport {
  id: string;
  timestamp: string;
  graphRevision: string;
  findings: FailureFinding[];
  redundancyGroups: Record<string, RedundancyGroup>;
  failureDomains: Record<string, FailureDomain>;
  capabilities: Record<string, BusinessCapability>;
  blastRadiusProfiles: Record<string, BlastRadiusReport>;
  metrics: {
    totalComponents: number;
    totalDependencies: number;
    spofCount: number;
    sharedDependencyRisksCount: number;
    failoverGapsCount: number;
    failureDomainRisksCount: number;
    criticalCapabilitiesCount: number;
    executionTimeMs: number;
  };
}

export interface FailureRecommendation {
  id: string;
  title: string;
  description: string;
  tradeOffs: string[];
  implementationGuidance: string;
}

