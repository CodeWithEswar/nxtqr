import { z } from "zod";

export const docPropSchema = z.object({
  name: z.string(),
  type: z.string(),
  default: z.string().optional(),
  required: z.boolean().default(false),
  description: z.string(),
});

export type DocProp = z.infer<typeof docPropSchema>;

export const docHeadingSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.number().int().min(1).max(6),
});

export type DocHeading = z.infer<typeof docHeadingSchema>;

export const docEntrySchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  order: z.number().int().default(0),
  status: z.enum(["ready", "draft"]).default("ready"),
  sourcePath: z.string().optional(),
  relatedSlugs: z.array(z.string()).optional(),
  props: z.array(docPropSchema).optional(),
});

export type DocEntry = z.infer<typeof docEntrySchema>;

export const docFrontmatterSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  order: z.number().optional(),
  status: z.enum(["ready", "draft"]).optional(),
  sourcePath: z.string().optional(),
  relatedSlugs: z.array(z.string()).optional(),
});

export type DocFrontmatter = z.infer<typeof docFrontmatterSchema>;
