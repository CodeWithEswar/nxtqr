import { z } from "zod";

export const reliabilityCategorySchema = z.enum([
  "retry",
  "timeout",
  "circuit-breaker",
  "bulkhead",
  "idempotency",
  "messaging",
  "cascading-failure",
  "graceful-degradation",
  "backpressure",
  "recovery",
  "dependency",
]);
export type ReliabilityCategory = z.infer<typeof reliabilityCategorySchema>;

export const reliabilitySeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);
export type ReliabilitySeverity = z.infer<typeof reliabilitySeveritySchema>;

export const reliabilityClassificationSchema = z.enum([
  "modeled-conflict",
  "potential-risk",
  "configuration-gap",
  "insufficient-evidence",
]);
export type ReliabilityClassification = z.infer<typeof reliabilityClassificationSchema>;

export const evidenceItemSchema = z.object({
  kind: z.enum(["node", "edge", "property", "capability", "metric", "path"]),
  elementId: z.string().optional(),
  propertyKey: z.string().optional(),
  expectedValue: z.unknown().optional(),
  actualValue: z.unknown().optional(),
  description: z.string(),
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const reliabilityFindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  category: reliabilityCategorySchema,
  severity: reliabilitySeveritySchema,
  classification: reliabilityClassificationSchema,
  title: z.string(),
  explanation: z.string(),
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  evidence: z.array(evidenceItemSchema),
  assumptions: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  propagationChain: z.array(z.string()).default([]),
  remediation: z.string(),
  remediationAction: z.enum([
    "add_circuit_breaker",
    "configure_backoff",
    "align_timeouts",
    "enable_idempotency",
    "add_dlq",
    "isolate_bulkhead",
    "add_fallback",
    "enable_backpressure",
    "custom",
  ]).default("custom"),
  documentationId: z.string().optional(),
});
export type ReliabilityFinding = z.infer<typeof reliabilityFindingSchema>;

export const nodeReliabilityProfileSchema = z.object({
  nodeId: z.string(),
  criticality: z.enum(["mission-critical", "business-critical", "supporting", "optional"]),
  isIdempotent: z.boolean(),
  hasCircuitBreaker: z.boolean(),
  hasBulkhead: z.boolean(),
  hasFallback: z.boolean(),
  hasRateLimit: z.boolean(),
  hasDeadLetterQueue: z.boolean(),
  declaredTimeoutMs: z.number().nullable(),
  maxRetryAttempts: z.number().nullable(),
  provenance: z.record(z.string(), z.enum(["configured", "derived", "unknown", "not-applicable"])),
});
export type NodeReliabilityProfile = z.infer<typeof nodeReliabilityProfileSchema>;

export const propagationPathSchema = z.object({
  originNodeId: z.string(),
  targetNodeId: z.string(),
  chain: z.array(z.string()),
  riskType: z.enum([
    "timeout-accumulation",
    "retry-amplification",
    "cascading-collapse",
    "resource-starvation",
  ]),
  amplificationFactor: z.number().default(1.0),
  totalMaxTimeoutMs: z.number().default(0),
  isContained: z.boolean().default(false),
  containmentMechanism: z.enum(["circuit-breaker", "fallback", "queue", "none"]).default("none"),
});
export type PropagationPath = z.infer<typeof propagationPathSchema>;

export const reliabilitySummarySchema = z.object({
  score: z.number(), // 0 to 100
  totalFindings: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
  mediumCount: z.number(),
  lowCount: z.number(),
  categoryBreakdown: z.record(reliabilityCategorySchema, z.number()),
  unprotectedCriticalCount: z.number(),
  retryAmplificationRiskCount: z.number(),
  missingTimeoutCount: z.number(),
});
export type ReliabilitySummary = z.infer<typeof reliabilitySummarySchema>;

export const reliabilityAnalysisReportSchema = z.object({
  id: z.string(),
  analyzedAt: z.string(),
  revisionHash: z.string(),
  nodeCount: z.number(),
  edgeCount: z.number(),
  findings: z.array(reliabilityFindingSchema),
  nodeProfiles: z.record(z.string(), nodeReliabilityProfileSchema),
  propagationPaths: z.array(propagationPathSchema),
  summary: reliabilitySummarySchema,
});
export type ReliabilityAnalysisReport = z.infer<typeof reliabilityAnalysisReportSchema>;

