import { z } from "zod";

export const CriticalityLevelSchema = z.enum([
  "mission-critical",
  "high",
  "medium",
  "low",
  "informational",
]);

export const DependencyKindSchema = z.enum([
  "runtime-request",
  "data",
  "authentication",
  "authorization",
  "network",
  "storage",
  "messaging",
  "control-plane",
  "deployment",
  "observability",
  "structural",
]);

export const RedundancyModeSchema = z.enum([
  "active-active",
  "active-passive",
  "primary-replica",
  "multi-instance",
  "multi-zone",
  "multi-region",
  "manual-recovery",
  "none",
]);

export const FailoverModeSchema = z.enum([
  "automatic",
  "manual",
  "none",
  "unspecified",
]);

export const FailureDomainKindSchema = z.enum([
  "availability-zone",
  "cloud-region",
  "host",
  "rack",
  "network-segment",
  "shared-storage",
  "shared-service",
  "external-provider",
  "custom-domain",
]);

export const FailureClassificationSchema = z.enum([
  "modeled-spof",
  "potential-spof",
  "shared-dependency",
  "failover-gap",
  "failure-domain-risk",
  "insufficient-evidence",
]);

export const BusinessCapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  criticality: CriticalityLevelSchema.default("high"),
  entryPointNodeIds: z.array(z.string()).default([]),
  supportedNodeIds: z.array(z.string()).default([]),
});

export const FailureFindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  classification: FailureClassificationSchema,
  title: z.string(),
  explanation: z.string(),
  affectedNodeIds: z.array(z.string()).default([]),
  affectedEdgeIds: z.array(z.string()).default([]),
  affectedCapabilityIds: z.array(z.string()).default([]),
  evidence: z.array(
    z.object({
      targetType: z.enum(["node", "edge", "boundary", "property", "graph"]),
      targetId: z.string(),
      description: z.string(),
      value: z.unknown().optional(),
    })
  ).default([]),
  assumptions: z.array(z.string()).default([]),
  confidence: z.enum(["high", "medium", "low"]).default("high"),
  recommendationIds: z.array(z.string()).default([]),
  tradeOffs: z.array(z.string()).default([]),
});

