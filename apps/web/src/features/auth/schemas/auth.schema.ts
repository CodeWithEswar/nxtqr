import { z } from "zod";
export {
  AuthFlowStateSchema,
  AppErrorCodeSchema,
  type AuthFlowState,
  type AppErrorCode,
} from "@nxtqr/validation";

export const AuthAttemptSchema = z.object({
  attemptId: z.string().uuid(),
  createdAt: z.number(),
  targetUrl: z.string(),
  mode: z.enum(["popup", "redirect"]),
});

export type AuthAttempt = z.infer<typeof AuthAttemptSchema>;

export const AuthCallbackMessageSchema = z.object({
  type: z.literal("NXTQR_AUTH_SUCCESS"),
  attemptId: z.string().uuid().optional(),
});

export type AuthCallbackMessage = z.infer<typeof AuthCallbackMessageSchema>;

