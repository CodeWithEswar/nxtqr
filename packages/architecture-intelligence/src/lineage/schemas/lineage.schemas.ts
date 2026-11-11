/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Zod Validation Schemas
 */

import { z } from "zod";

export const LineageProvenanceSourceSchema = z.enum([
  "modeled",
  "imported",
  "observed",
  "inferred",
  "unknown",
]);

export const LineageProvenanceSchema = z.object({
  source: LineageProvenanceSourceSchema,
  sourceIdentifier: z.string().optional(),
  author: z.string().optional(),
  timestamp: z.string(),
  graphRevision: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  confirmed: z.boolean(),
});

export const DataSensitivityLevelSchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
]);

export const PrivacyDataCategorySchema = z.enum([
  "personal_data",
  "financial",
  "payment",
  "health",
  "authentication",
  "behavioral",
  "operational",
  "custom",
]);

export const DataClassificationSchema = z.object({
  id: z.string().min(1),
  level: DataSensitivityLevelSchema,
  categories: z.array(PrivacyDataCategorySchema),
  name: z.string().min(1),
  description: z.string().optional(),
  isLegalDetermination: z.literal(false),
  provenance: LineageProvenanceSchema,
});

export const DataFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  logicalType: z.string().min(1),
  classification: DataClassificationSchema,
  isRequired: z.boolean(),
  schemaReference: z.string().optional(),
  description: z.string().optional(),
});

export const DataOwnerSchema = z.object({
  id: z.string().min(1),
  businessOwner: z.string().optional(),
  technicalOwner: z.string().optional(),
  dataSteward: z.string().optional(),
  responsibleServiceId: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export const ProcessingPurposeCategorySchema = z.enum([
  "authentication",
  "transaction_processing",
  "fraud_prevention",
  "analytics",
  "notifications",
  "customer_support",
  "marketing",
  "legal_compliance",
  "custom",
]);

export const ProcessingPurposeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: ProcessingPurposeCategorySchema,
  description: z.string().optional(),
  lawfulBasisNotice: z.string().optional(),
});

export const StorageCopyTypeSchema = z.enum([
  "primary",
  "read_replica",
  "cache_copy",
  "backup_copy",
  "analytics_copy",
  "export_archive",
]);

export const StorageBindingSchema = z.object({
  componentId: z.string().min(1),
  componentName: z.string().min(1),
  storeType: z.enum([
    "relational_db",
    "nosql_db",
    "cache",
    "queue",
    "object_storage",
    "data_warehouse",
    "search_index",
    "backup",
    "external_provider",
  ]),
  copyType: StorageCopyTypeSchema,
  isTransient: z.boolean(),
  encryptionAtRest: z
    .object({
      configured: z.boolean(),
      mechanism: z.string().optional(),
      evidence: z.string().optional(),
    })
    .optional(),
  regionId: z.string().optional(),
  jurisdictionCountry: z.string().optional(),
});

export const DataRetentionPolicySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  durationDays: z.number().int(),
  trigger: z.enum([
    "creation_time",
    "account_closure",
    "transaction_completion",
    "inactivity_period",
    "explicit_request",
  ]),
  deletionMethod: z.enum([
    "hard_delete",
    "soft_delete",
    "anonymization",
    "crypto_shredding",
    "manual_purge",
  ]),
  hasBackupExemption: z.boolean(),
  policyOwner: z.string().optional(),
  description: z.string().optional(),
});

export const DataDeletionPolicySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetAssetId: z.string().min(1),
  authoritativeComponentId: z.string().min(1),
  cascadesToDestinations: z.boolean(),
  invalidatesCaches: z.boolean(),
  propagatesToReplicas: z.boolean(),
  notifiesThirdParties: z.boolean(),
  backupRetentionNote: z.string().optional(),
  verificationEvidence: z.string().optional(),
});

export const DataAssetSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  classification: DataClassificationSchema,
  owner: DataOwnerSchema.optional(),
  fields: z.array(DataFieldSchema).optional(),
  storageBindings: z.array(StorageBindingSchema),
  retentionPolicy: DataRetentionPolicySchema.optional(),
  deletionPolicy: DataDeletionPolicySchema.optional(),
  purposes: z.array(ProcessingPurposeSchema),
  provenance: LineageProvenanceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TransformationTypeSchema = z.enum([
  "filtering",
  "aggregation",
  "tokenization",
  "hashing",
  "encryption",
  "decryption",
  "masking",
  "pseudonymization",
  "anonymization",
  "enrichment",
  "schema_mapping",
  "pass_through",
]);

export const DataTransformationSchema = z.object({
  id: z.string().min(1),
  type: TransformationTypeSchema,
  componentId: z.string().min(1),
  name: z.string().min(1),
  inputAssetIds: z.array(z.string()),
  outputAssetIds: z.array(z.string()),
  resultingSensitivity: DataSensitivityLevelSchema.optional(),
  configurationReference: z.string().optional(),
  provenance: LineageProvenanceSchema,
});

export const DataFlowSchema = z.object({
  id: z.string().min(1),
  architectureId: z.string().min(1),
  name: z.string().optional(),
  sourceComponentId: z.string().min(1),
  destinationComponentId: z.string().min(1),
  dataAssetIds: z.array(z.string()),
  transformationIds: z.array(z.string()).optional(),
  protocol: z.string().optional(),
  direction: z.enum(["forward", "bidirectional"]),
  encryptionInTransit: z
    .object({
      configured: z.boolean(),
      tlsVersion: z.string().optional(),
      evidence: z.string().optional(),
    })
    .optional(),
  crossesTrustBoundary: z.boolean(),
  trustBoundaryDetails: z.string().optional(),
  isThirdPartyTransfer: z.boolean(),
  recipientOrganization: z.string().optional(),
  sourceRegion: z.string().optional(),
  destinationRegion: z.string().optional(),
  sourceJurisdiction: z.string().optional(),
  destinationJurisdiction: z.string().optional(),
  purposes: z.array(ProcessingPurposeSchema),
  provenance: LineageProvenanceSchema,
  confirmed: z.boolean(),
});

export const PrivacyRiskCategorySchema = z.enum([
  "unreviewed_trust_boundary",
  "external_sharing_unknown_purpose",
  "missing_retention_policy",
  "incomplete_deletion_propagation",
  "unknown_storage_residency",
  "unencrypted_sensitive_flow",
  "missing_data_ownership",
  "data_minimization_violation",
  "cross_border_unreviewed_transfer",
  "unclassified_asset",
]);

export const PrivacyFindingSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  category: PrivacyRiskCategorySchema,
  title: z.string().min(1),
  description: z.string(),
  affectedAssetIds: z.array(z.string()),
  affectedFlowIds: z.array(z.string()).optional(),
  affectedComponentIds: z.array(z.string()),
  remediation: z.string(),
  isConfirmedRisk: z.boolean(),
});

export const ArchitectureDataLineageModelSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  graphRevision: z.string().min(1),
  version: z.number().int().min(1),
  assets: z.array(DataAssetSchema),
  flows: z.array(DataFlowSchema),
  transformations: z.array(DataTransformationSchema),
  retentionPolicies: z.array(DataRetentionPolicySchema),
  purposes: z.array(ProcessingPurposeSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

