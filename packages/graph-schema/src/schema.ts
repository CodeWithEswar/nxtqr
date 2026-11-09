import { z } from "zod";

export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const NodeDimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const PortTypeSchema = z.enum(["input", "output", "bidirectional"]);

export const NodeTypeSchema = z.enum([
  "input",
  "process",
  "decision",
  "output",
  "group",
  "service",
  "database",
  "queue",
]);

export const NodeStatusSchema = z.enum([
  "idle",
  "executing",
  "completed",
  "failed",
]);

export const EdgeTypeSchema = z.enum([
  "straight",
  "smoothstep",
  "bezier",
  "step",
]);

export const EdgeStatusSchema = z.enum([
  "idle",
  "active",
  "completed",
  "failed",
]);

export const PortDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: PortTypeSchema,
  dataType: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const BaseNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: NodePositionSchema,
  dimensions: NodeDimensionsSchema.optional(),
  status: NodeStatusSchema.optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  data: z.record(z.unknown()).default({}),
  ports: z.array(PortDefinitionSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const BaseEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  sourcePort: z.string().optional(),
  targetPort: z.string().optional(),
  type: EdgeTypeSchema.optional(),
  status: EdgeStatusSchema.optional(),
  label: z.string().optional(),
  data: z.record(z.unknown()).default({}),
});

export const CanvasViewportSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  zoom: z.number().min(0.1).max(3.0).default(1.0),
});

export const CURRENT_GRAPH_SCHEMA_VERSION = 1;

export const ClipboardPayloadSchema = z.object({
  version: z.number().int().positive().default(CURRENT_GRAPH_SCHEMA_VERSION),
  nodes: z.array(BaseNodeSchema),
  edges: z.array(BaseEdgeSchema),
  copiedAt: z.string().datetime().optional(),
});

export const GraphErrorCodeSchema = z.enum([
  "INVALID_NODE",
  "INVALID_EDGE",
  "INVALID_PORT",
  "INCOMPATIBLE_CONNECTION",
  "GRAPH_VALIDATION_FAILED",
  "LAYOUT_FAILED",
  "SAVE_FAILED",
  "LOAD_FAILED",
  "VERSION_CONFLICT",
  "PERMISSION_DENIED",
  "UNSUPPORTED_SCHEMA",
  "UNKNOWN_ERROR",
]);

export const SimulationConfigSchema = z.object({
  speed: z.number().min(0.25).max(10).default(1.0),
  maxSteps: z.number().int().positive().default(100),
  autoStep: z.boolean().default(true),
});

export const TraceEventSchema = z.object({
  id: z.string().min(1),
  runId: z.string().min(1),
  step: z.number().int().nonnegative(),
  timestamp: z.number(),
  type: z.string().min(1),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
  status: z.enum(["pending", "running", "success", "failure"]),
  durationMs: z.number().nonnegative().optional(),
  payload: z.unknown().default({}),
  error: z.string().optional(),
});

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

export type NodeType = z.infer<typeof NodeTypeSchema>;
export type NodeStatus = z.infer<typeof NodeStatusSchema>;
export type EdgeType = z.infer<typeof EdgeTypeSchema>;
export type EdgeStatus = z.infer<typeof EdgeStatusSchema>;
export type NodePosition = z.infer<typeof NodePositionSchema>;
export type NodeDimensions = z.infer<typeof NodeDimensionsSchema>;
export type PortDefinition = z.infer<typeof PortDefinitionSchema>;
export type BaseNode = z.infer<typeof BaseNodeSchema>;
export type BaseEdge = z.infer<typeof BaseEdgeSchema>;
export type CanvasViewport = z.infer<typeof CanvasViewportSchema>;
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
export type TraceEvent = z.infer<typeof TraceEventSchema>;
export type GraphDocument = z.infer<typeof GraphDocumentSchema>;
export type ClipboardPayload = z.infer<typeof ClipboardPayloadSchema>;
export type GraphErrorCode = z.infer<typeof GraphErrorCodeSchema>;
