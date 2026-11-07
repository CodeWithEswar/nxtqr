import { z } from "zod";

export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const PortTypeSchema = z.enum(["input", "output", "bidirectional"]);

export const PortDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: PortTypeSchema,
  dataType: z.string().optional(),
});

export const BaseNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: NodePositionSchema,
  data: z.record(z.unknown()).default({}),
  ports: z.array(PortDefinitionSchema).optional(),
});

export const BaseEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
  data: z.record(z.unknown()).default({}),
});

export const CanvasViewportSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  zoom: z.number().min(0.1).max(3.0).default(1.0),
});

export const CURRENT_GRAPH_SCHEMA_VERSION = 1;

export const GraphDocumentSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int().positive().default(CURRENT_GRAPH_SCHEMA_VERSION),
  visualizerType: z.string().min(1),
  title: z.string().min(1),
  nodes: z.array(BaseNodeSchema).default([]),
  edges: z.array(BaseEdgeSchema).default([]),
  viewport: CanvasViewportSchema.default({ x: 0, y: 0, zoom: 1.0 }),
  metadata: z.record(z.unknown()).default({}),
});

export type NodePosition = z.infer<typeof NodePositionSchema>;
export type PortDefinition = z.infer<typeof PortDefinitionSchema>;
export type BaseNode = z.infer<typeof BaseNodeSchema>;
export type BaseEdge = z.infer<typeof BaseEdgeSchema>;
export type CanvasViewport = z.infer<typeof CanvasViewportSchema>;
export type GraphDocument = z.infer<typeof GraphDocumentSchema>;
