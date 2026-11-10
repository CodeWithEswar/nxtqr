import { z } from "zod";

export const securityCategorySchema = z.enum([
  "trust-boundary",
  "authentication",
  "authorization",
  "public-exposure",
  "transport-security",
  "sensitive-data",
  "secrets-management",
  "network-segmentation",
  "api-security",
  "third-party-integration",
]);
export type SecurityCategory = z.infer<typeof securityCategorySchema>;

export const strideCategorySchema = z.enum([
  "spoofing",
  "tampering",
  "repudiation",
  "information-disclosure",
  "denial-of-service",
  "elevation-of-privilege",
]);
export type STRIDECategory = z.infer<typeof strideCategorySchema>;

export const securityFindingClassificationSchema = z.enum([
  "modeled-conflict",
  "missing-configuration",
  "potential-risk",
  "unverified-control",
  "insufficient-evidence",
]);
export type SecurityFindingClassification = z.infer<typeof securityFindingClassificationSchema>;

export const exposureClassificationSchema = z.enum([
  "public",
  "private",
  "internal",
  "restricted",
  "unknown",
]);
export type ExposureClassification = z.infer<typeof exposureClassificationSchema>;

export const dataSensitivitySchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
]);
export type DataSensitivity = z.infer<typeof dataSensitivitySchema>;

export const trustLevelSchema = z.enum([
  "untrusted-public",
  "authenticated-user",
  "internal-workload",
  "dmz-protected",
  "high-security-vault",
  "root-isolated",
]);
export type TrustLevel = z.infer<typeof trustLevelSchema>;

export const securityControlKindSchema = z.enum([
  "waf",
  "ddos-shield",
  "api-gateway",
  "reverse-proxy",
  "auth-service",
  "idp",
  "authz-policy",
  "secrets-vault",
  "tls-enforced",
  "rate-limiter",
  "network-firewall",
]);
export type SecurityControlKind = z.infer<typeof securityControlKindSchema>;

export const evidenceReferenceSchema = z.object({
  kind: z.enum(["node", "edge", "property", "boundary", "capability", "metric"]),
  elementId: z.string().optional(),
  propertyKey: z.string().optional(),
  expectedValue: z.unknown().optional(),
  actualValue: z.unknown().optional(),
  description: z.string(),
});

export const securityFindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  dimension: z.literal("security").default("security"),
  category: securityCategorySchema,
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  classification: securityFindingClassificationSchema,
  strideCategory: strideCategorySchema.optional(),
  title: z.string(),
  explanation: z.string(),
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  evidence: z.array(evidenceReferenceSchema),
  assumptions: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  recommendationIds: z.array(z.string()),
  documentationId: z.string().optional(),
  deductionWeight: z.number().optional(),
});
export type SecurityFinding = z.infer<typeof securityFindingSchema>;

export const trustBoundaryCrossingSchema = z.object({
  edgeId: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  boundaryId: z.string(),
  boundaryName: z.string(),
  sourceTrustLevel: trustLevelSchema,
  targetTrustLevel: trustLevelSchema,
  protocol: z.string(),
  isEncryptedInTransit: z.boolean(),
  requiresAuthentication: z.boolean(),
  requiresAuthorization: z.boolean(),
  dataSensitivity: dataSensitivitySchema,
  hasCrossingControls: z.boolean(),
  missingControls: z.array(z.string()),
});
export type TrustBoundaryCrossing = z.infer<typeof trustBoundaryCrossingSchema>;

export const nodeSecurityProfileSchema = z.object({
  nodeId: z.string(),
  nodeName: z.string(),
  componentType: z.string(),
  exposure: exposureClassificationSchema,
  trustLevel: trustLevelSchema,
  dataSensitivity: dataSensitivitySchema,
  requiresAuth: z.boolean(),
  isAnonymousAllowed: z.boolean(),
  requiresAuthz: z.boolean(),
  isAdministrative: z.boolean(),
  usesSecrets: z.boolean(),
  hasSecretManagerBound: z.boolean(),
  enforcesTls: z.boolean(),
  boundaryIds: z.array(z.string()),
  controlsPresent: z.array(securityControlKindSchema),
});
export type NodeSecurityProfile = z.infer<typeof nodeSecurityProfileSchema>;

export const securityAnalysisReportSchema = z.object({
  id: z.string(),
  analyzedAt: z.string(),
  revisionHash: z.string(),
  nodeCount: z.number(),
  edgeCount: z.number(),
  findings: z.array(securityFindingSchema),
  summary: z.object({
    totalFindings: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
    infoCount: z.number(),
    publicExposureCount: z.number(),
    trustBoundaryCrossingsCount: z.number(),
    unverifiedControlsCount: z.number(),
    missingConfigsCount: z.number(),
    modeledConflictsCount: z.number(),
  }),
  trustBoundaries: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      zone: z.string(),
      containedNodeIds: z.array(z.string()),
      crossingEdgeIds: z.array(z.string()),
      findingsCount: z.number(),
    })
  ),
  crossings: z.array(trustBoundaryCrossingSchema),
  nodeProfiles: z.record(z.string(), nodeSecurityProfileSchema),
});
export type SecurityAnalysisReport = z.infer<typeof securityAnalysisReportSchema>;
