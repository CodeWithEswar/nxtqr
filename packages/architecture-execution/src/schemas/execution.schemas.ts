import { z } from "zod";
import type { BehaviorScenario } from "./behavior.schemas";

export const HttpMethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const ExecutionRequestSchema = z.object({
  id: z.string(),
  method: HttpMethodSchema.default("GET"),
  path: z.string().min(1).default("/api/v1/resource"),
  headers: z.record(z.string()).default({
    "content-type": "application/json",
    "x-request-id": "req_nxtqr_init",
  }),
  body: z.unknown().optional(),
});
export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;

export const ExecutionLimitsSchema = z.object({
  maxEvents: z.number().int().min(5).max(1000).default(100),
  maxHops: z.number().int().min(1).max(200).default(50),
  maxDurationMs: z.number().int().min(1000).max(60000).default(30000),
});
export type ExecutionLimits = z.infer<typeof ExecutionLimitsSchema>;

export const ExecutionTimingSchema = z.object({
  nodeDurationMs: z.number().int().min(50).max(5000).default(250),
  edgeDurationMs: z.number().int().min(50).max(5000).default(400),
});
export type ExecutionTiming = z.infer<typeof ExecutionTimingSchema>;

export const ExecutionConfigurationSchema = z.object({
  version: z.literal(1).default(1),
  entryNodeId: z.string().min(1),
  request: ExecutionRequestSchema,
  routing: z.object({
    mode: z.literal("deterministic").default("deterministic"),
    selectedBranches: z.record(z.string()).default({}),
  }).default({
    mode: "deterministic",
    selectedBranches: {},
  }),
  limits: ExecutionLimitsSchema.default({
    maxEvents: 100,
    maxHops: 50,
    maxDurationMs: 30000,
  }),
  timing: ExecutionTimingSchema.default({
    nodeDurationMs: 250,
    edgeDurationMs: 400,
  }),
  scenario: z.unknown().optional(),
  presetId: z.string().optional(),
});
export type ExecutionConfiguration = z.infer<typeof ExecutionConfigurationSchema> & {
  scenario?: BehaviorScenario;
  presetId?: string;
};

export const ExecutionOutcomeSchema = z.enum([
  "success",
  "failure",
  "unsupported",
  "limit-exceeded",
]);
export type ExecutionOutcome = z.infer<typeof ExecutionOutcomeSchema>;

export const PlaybackStatusSchema = z.enum([
  "idle",
  "preparing",
  "ready",
  "playing",
  "paused",
  "completed",
  "stopped",
  "error",
]);
export type PlaybackStatus = z.infer<typeof PlaybackStatusSchema>;

export const PlaybackSpeedSchema = z.union([
  z.literal(0.25),
  z.literal(0.5),
  z.literal(1),
  z.literal(2),
  z.literal(4),
]);
export type PlaybackSpeed = z.infer<typeof PlaybackSpeedSchema>;

