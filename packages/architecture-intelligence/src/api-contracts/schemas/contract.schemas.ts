/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Zod Schemas for Runtime Validation
 */

import { z } from "zod";

export const ContractProtocolSchema = z.enum([
  "rest",
  "graphql",
  "grpc",
  "async_event",
  "webhook",
]);

export const SpecificationFormatSchema = z.enum([
  "openapi_3x",
  "graphql_sdl",
  "graphql_introspection",
  "protobuf",
  "asyncapi_2x",
  "asyncapi_3x",
  "json_schema",
  "custom",
]);

export const ContractLifecycleStatusSchema = z.enum([
  "draft",
  "proposed",
  "active",
  "deprecated",
  "retired",
  "archived",
]);

export const InterfaceExposureSchema = z.enum([
  "public",
  "partner",
  "internal",
  "private_network",
  "unknown",
]);

export const ContractEvidenceSourceSchema = z.enum([
  "declared",
  "implemented",
  "observed",
  "inferred",
  "unknown",
]);

export const ContractProvenanceSchema = z.object({
  source: ContractEvidenceSourceSchema,
  sourceIdentifier: z.string().optional(),
  author: z.string().optional(),
  timestamp: z.string(),
  graphRevision: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  confirmed: z.boolean(),
});

export const CompatibilityModeSchema = z.enum([
  "backward",
  "forward",
  "full",
  "consumer_specific",
  "protocol_specific",
]);

export const CompatibilityPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  mode: CompatibilityModeSchema,
  allowAdditiveSafeChanges: z.boolean(),
  requireDeprecationPeriod: z.boolean(),
  minDeprecationDays: z.number().int().min(0).optional(),
  strictNullability: z.boolean(),
  checkEnumExhaustiveness: z.boolean(),
  treatMissingConsumerAsRisky: z.boolean(),
});

export const CompatibilityClassificationSchema = z.enum([
  "breaking",
  "potentially_breaking",
  "non_breaking",
  "informational",
  "unknown",
]);

export const NormalizedSchemaSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string().optional(),
    type: z.enum([
      "string",
      "number",
      "integer",
      "boolean",
      "array",
      "object",
      "union",
      "enum",
      "null",
      "any",
    ]),
    format: z.string().optional(),
    description: z.string().optional(),
    requiredProperties: z.array(z.string()).optional(),
    properties: z.record(z.string(), NormalizedSchemaSchema).optional(),
    items: NormalizedSchemaSchema.optional(),
    enumValues: z.array(z.union([z.string(), z.number()])).optional(),
    isNullable: z.boolean(),
    fieldNumber: z.number().int().min(1).optional(),
    wireType: z.enum(["varint", "64-bit", "length-delimited", "32-bit"]).optional(),
    dataAssetRef: z.string().optional(),
    sensitivityLevel: z.enum(["public", "internal", "confidential", "restricted"]).optional(),
    rawSourceLocation: z.string().optional(),
  })
);

export const OperationParameterSchema = z.object({
  name: z.string(),
  in: z.enum(["query", "header", "path", "cookie"]),
  required: z.boolean(),
  schema: NormalizedSchemaSchema,
  description: z.string().optional(),
});

export const SecurityRequirementSchema = z.object({
  type: z.enum(["apiKey", "http", "oauth2", "openIdConnect", "mutualTLS", "custom"]),
  scheme: z.string().optional(),
  name: z.string().optional(),
  in: z.enum(["header", "query", "cookie"]).optional(),
  scopes: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const DeprecationNoticeSchema = z.object({
  deprecatedAt: z.string(),
  plannedRetirementDate: z.string().optional(),
  replacementOperationId: z.string().optional(),
  migrationGuidance: z.string().optional(),
  isEnforced: z.boolean(),
});

export const ContractOperationSchema = z.object({
  id: z.string(),
  operationId: z.string(),
  protocol: ContractProtocolSchema,
  method: z.string().optional(),
  path: z.string().optional(),
  rpcName: z.string().optional(),
  queryType: z.enum(["query", "mutation", "subscription"]).optional(),
  channelName: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  parameters: z.array(OperationParameterSchema).optional(),
  requestSchemaRef: z.string().optional(),
  responseSchemas: z.record(z.string(), z.string()).optional(),
  securityRequirements: z.array(SecurityRequirementSchema).optional(),
  isDeprecated: z.boolean(),
  deprecationNotice: DeprecationNoticeSchema.optional(),
  provenance: ContractProvenanceSchema,
});

export const ContractChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  direction: z.enum(["publish", "subscribe", "bidirectional"]),
  messageSchemaRef: z.string(),
  protocolType: z.enum(["kafka", "amqp", "sqs", "mqtt", "sns", "nats", "custom"]),
  partitionKeyField: z.string().optional(),
  deliveryGuarantee: z.enum(["at_least_once", "at_most_once", "exactly_once"]).optional(),
});

export const ContractRevisionSchema = z.object({
  id: z.string(),
  contractId: z.string(),
  revisionHash: z.string(),
  versionLabel: z.string(),
  specificationVersion: z.string(),
  author: z.string().optional(),
  sourceArtifactHash: z.string().optional(),
  operations: z.array(ContractOperationSchema),
  schemas: z.record(z.string(), NormalizedSchemaSchema),
  channels: z.array(ContractChannelSchema).optional(),
  validationStatus: z.enum(["valid", "warning", "error"]),
  validationErrors: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export const APIContractSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  architectureId: z.string(),
  name: z.string(),
  protocol: ContractProtocolSchema,
  specificationFormat: SpecificationFormatSchema,
  providerServiceId: z.string(),
  currentRevisionId: z.string(),
  lifecycleStatus: ContractLifecycleStatusSchema,
  exposure: InterfaceExposureSchema,
  description: z.string().optional(),
  owner: z
    .object({
      technicalOwner: z.string().optional(),
      businessOwner: z.string().optional(),
      team: z.string().optional(),
      contact: z.string().optional(),
    })
    .optional(),
  revisions: z.array(ContractRevisionSchema),
  provenance: ContractProvenanceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ServiceInterfaceSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  interfaceName: z.string(),
  protocol: ContractProtocolSchema,
  exposure: InterfaceExposureSchema,
  contractId: z.string().optional(),
  currentRevisionId: z.string().optional(),
  port: z.union([z.number(), z.string()]).optional(),
  pathPrefix: z.string().optional(),
  environmentIds: z.array(z.string()).optional(),
  provenance: ContractProvenanceSchema,
});

export const ConsumerDependencySchema = z.object({
  id: z.string(),
  providerServiceId: z.string(),
  consumerServiceId: z.string(),
  contractId: z.string(),
  operationIds: z.array(z.string()),
  expectedSchemaVersion: z.string().optional(),
  environmentId: z.string().optional(),
  source: ContractEvidenceSourceSchema,
  confirmed: z.boolean(),
});

export const CompatibilityFindingSchema = z.object({
  id: z.string(),
  contractId: z.string(),
  baselineRevisionId: z.string(),
  candidateRevisionId: z.string(),
  classification: CompatibilityClassificationSchema,
  ruleId: z.string(),
  affectedOperationIds: z.array(z.string()),
  affectedConsumerIds: z.array(z.string()),
  evidence: z.array(z.string()),
  explanation: z.string(),
  remediation: z.string(),
});

export const MigrationPlanSchema = z.object({
  id: z.string(),
  contractId: z.string(),
  contractName: z.string(),
  fromRevisionId: z.string(),
  toRevisionId: z.string(),
  breakingChangesCount: z.number().int().min(0),
  affectedConsumersCount: z.number().int().min(0),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().min(1),
      action: z.string(),
      targetServiceId: z.string(),
      description: z.string(),
      verificationCriteria: z.string(),
    })
  ),
  rollbackConsiderations: z.array(z.string()),
  compatibilityWindowDays: z.number().int().min(0).optional(),
});

