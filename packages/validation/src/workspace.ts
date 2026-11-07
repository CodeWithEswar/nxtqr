import { z } from "zod";

export const WorkspaceSlugSchema = z
  .string()
  .trim()
  .min(3, { message: "Slug must be at least 3 characters" })
  .max(48, { message: "Slug must not exceed 48 characters" })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug can only contain lowercase letters, numbers, and single hyphens",
  });

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters").max(64),
  slug: WorkspaceSlugSchema,
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
});

export const WorkspaceRoleSchema = z.enum(["owner", "admin", "member", "viewer"]);

export const InviteWorkspaceMemberSchema = z.object({
  email: z.string().trim().email(),
  role: WorkspaceRoleSchema.default("member"),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
export type InviteWorkspaceMemberInput = z.infer<typeof InviteWorkspaceMemberSchema>;
