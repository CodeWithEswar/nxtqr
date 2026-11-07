import { z } from "zod";

export const VisualizerTypeSchema = z.enum([
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

export const CreateProjectSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(64),
  description: z.string().trim().max(256).optional(),
  visualizerType: VisualizerTypeSchema,
});

export const UpdateProjectSchema = z.object({
  name: z.string().trim().min(2).max(64).optional(),
  description: z.string().trim().max(256).optional(),
  graphDocument: z.record(z.unknown()).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
