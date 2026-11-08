import { z } from "zod";

export const VerificationStatusSchema = z.enum([
  "not_run",
  "running",
  "passed",
  "warning",
  "failed",
  "skipped",
  "unavailable",
]);

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const VerificationCategorySchema = z.enum([
  "architecture",
  "design-system",
  "infrastructure",
  "frontend",
]);

export type VerificationCategory = z.infer<typeof VerificationCategorySchema>;

export const VerificationTypeSchema = z.enum([
  "runtime_test",
  "client_state",
  "config_audit",
  "contract_check",
]);

export type VerificationType = z.infer<typeof VerificationTypeSchema>;

export const VerificationCheckSchema = z.object({
  id: z.string(),
  category: VerificationCategorySchema,
  title: z.string(),
  description: z.string(),
  verificationType: VerificationTypeSchema,
  status: VerificationStatusSchema,
  checkedAt: z.string().optional(),
  durationMs: z.number().optional(),
  evidence: z.record(z.unknown()).optional(),
  diagnostics: z.string().optional(),
  errorCode: z.string().optional(),
  remediation: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

export type VerificationCheck = z.infer<typeof VerificationCheckSchema>;

export const VerificationSummarySchema = z.object({
  total: z.number(),
  passed: z.number(),
  warning: z.number(),
  failed: z.number(),
  notRun: z.number(),
  durationMs: z.number(),
  lastCheckedAt: z.string().optional(),
});

export type VerificationSummary = z.infer<typeof VerificationSummarySchema>;

