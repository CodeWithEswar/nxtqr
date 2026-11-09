import { z } from "zod";
export { UserProfileSchema, type UserProfile } from "@nxtqr/validation";

export const UpdateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(64).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

