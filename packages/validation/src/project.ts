import { z } from "zod";

export const VisualizerTypeSchema = z.enum([
  "generic",
  "system-design",
  "rag",
  "ai-agents",
  "database",
  "algorithms",
  "networking",
  "cloud",
  "cicd",
  "operating-systems",
]);

export const ProjectStatusSchema = z.enum(["active", "archived"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(64),
  description: z.string().nullable().optional(),
  visualizerType: VisualizerTypeSchema,
  status: ProjectStatusSchema.default("active"),
  workspaceId: z.string().uuid().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(64),
  description: z.string().trim().max(256).optional(),
  visualizerType: VisualizerTypeSchema,
});

export const UpdateProjectSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  description: z.string().trim().max(256).optional(),
  status: ProjectStatusSchema.optional(),
  graphDocument: z.record(z.unknown()).optional(),
});

export const ProjectFilterSchema = z.object({
  status: ProjectStatusSchema.optional(),
  search: z.string().trim().optional(),
  visualizerType: VisualizerTypeSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type ProjectFilterInput = z.infer<typeof ProjectFilterSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
