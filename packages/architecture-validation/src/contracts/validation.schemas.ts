import { z } from "zod";

export const ValidationSeveritySchema = z.enum(["error", "warning", "info"]);

export const ConnectionDecisionSchema = z.enum([
  "allowed",
  "allowed-with-warnings",
  "requires-configuration",
  "rejected",
]);

export const ValidationCategorySchema = z.enum([
  "component",
  "connection",
  "relationship",
  "structural",
  "dependency",
  "integrity",
]);

export const SuggestedActionSchema = z.object({
  label: z.string(),
  type: z.enum([
    "open-inspector",
    "open-docs",
    "reverse-direction",
    "insert-adapter",
    "reconfigure",
  ]),
  fieldPath: z.string().optional(),
  documentationPath: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

export const ValidationFindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  category: ValidationCategorySchema,
  severity: ValidationSeveritySchema,
  title: z.string(),
  message: z.string(),
  explanation: z.string().optional(),
  sourceNodeId: z.string().optional(),
  targetNodeId: z.string().optional(),
  sourcePortId: z.string().optional(),
  targetPortId: z.string().optional(),
  edgeId: z.string().optional(),
  documentationId: z.string().optional(),
  documentationPath: z.string().optional(),
  suggestedActions: z.array(SuggestedActionSchema).optional(),
  timestamp: z.number().optional(),
});

export const ConnectionValidationResultSchema = z.object({
  decision: ConnectionDecisionSchema,
  valid: z.boolean(),
  findings: z.array(ValidationFindingSchema),
  resolvedRelationship: z.string().optional(),
  resolvedProtocolId: z.string().optional(),
  resolvedSecurity: z.string().optional(),
});

export const GraphValidationSummarySchema = z.object({
  totalFindings: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  byCategory: z.record(z.number().int().nonnegative()),
  componentCount: z.number().int().nonnegative(),
  connectionCount: z.number().int().nonnegative(),
  isValid: z.boolean(),
});

export const GraphValidationResultSchema = z.object({
  valid: z.boolean(),
  findings: z.array(ValidationFindingSchema),
  summary: GraphValidationSummarySchema,
  findingsByNode: z.record(z.array(ValidationFindingSchema)),
  findingsByEdge: z.record(z.array(ValidationFindingSchema)),
  validatedAt: z.number(),
});
