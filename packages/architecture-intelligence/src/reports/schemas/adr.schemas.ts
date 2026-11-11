import { z } from "zod";

export const ADRStatusSchema = z.enum(["proposed", "accepted", "superseded", "deprecated"]);

export const ArchitectureDecisionRecordSchema = z.object({
  id: z.string().min(1),
  decisionNumber: z.number().int().min(1),
  title: z.string().min(1),
  status: ADRStatusSchema,
  context: z.string().min(1),
  decision: z.string().min(1),
  consequences: z.object({
    positive: z.array(z.string()),
    negative: z.array(z.string()),
    neutral: z.array(z.string()).optional(),
  }),
  alternativesConsidered: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      reasonRejected: z.string(),
    })
  ),
  relatedComponentIds: z.array(z.string()),
  relatedFindingIds: z.array(z.string()),
  date: z.string(),
  author: z.string().min(1),
  supersededBy: z.string().optional(),
  supersedes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
