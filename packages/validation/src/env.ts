import { z } from "zod";

export const WebEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  SUPABASE_DB_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const WorkerEnvSchema = z.object({
  ENVIRONMENT: z.enum(["development", "staging", "production"]).default("development"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CORS_ALLOWED_ORIGINS: z.string().default("*"),
});

export type WebEnv = z.infer<typeof WebEnvSchema>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
