import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(128, { message: "Password must not exceed 128 characters" }),
});

export const RegisterSchema = z
  .object({
    email: z.string().trim().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(128, { message: "Password must not exceed 128 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const PasswordResetSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
});

export const AuthFlowStateSchema = z.enum([
  "idle",
  "preparing",
  "popup_open",
  "awaiting_provider",
  "processing_callback",
  "verifying_session",
  "success",
  "cancelled",
  "failed",
  "timeout",
  "blocked",
]);

export const AppErrorCodeSchema = z.enum([
  "AUTH_CANCELLED",
  "AUTH_POPUP_BLOCKED",
  "AUTH_TIMEOUT",
  "AUTH_PROVIDER_ERROR",
  "AUTH_SESSION_EXPIRED",
  "NETWORK_UNAVAILABLE",
  "VALIDATION_ERROR",
  "PERMISSION_DENIED",
  "RESOURCE_NOT_FOUND",
  "RESOURCE_CONFLICT",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
  "UNKNOWN_ERROR",
]);

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AuthFlowState = z.infer<typeof AuthFlowStateSchema>;
export type AppErrorCode = z.infer<typeof AppErrorCodeSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
