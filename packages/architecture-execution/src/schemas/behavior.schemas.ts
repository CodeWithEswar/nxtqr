import { z } from "zod";
import { HttpMethodSchema } from "./execution.schemas";

export const ModeledHttpRequestSchema = z.object({
  id: z.string(),
  method: HttpMethodSchema.default("GET"),
  path: z.string().min(1).default("/api/v1/resource"),
  headers: z.record(z.string()).default({
    "content-type": "application/json",
    "x-correlation-id": "corr_nxtqr_init",
  }),
  query: z.record(z.string()).default({}),
  body: z.unknown().optional(),
  sourceNodeId: z.string(),
  targetNodeId: z.string().optional(),
  correlationId: z.string(),
  parentId: z.string().optional(),
});
export type ModeledHttpRequest = z.infer<typeof ModeledHttpRequestSchema>;

export const ModeledHttpResponseSchema = z.object({
  requestId: z.string(),
  status: z.number().int().min(100).max(599).default(200),
  headers: z.record(z.string()).default({
    "content-type": "application/json",
  }),
  body: z.unknown().optional(),
  sourceNodeId: z.string(),
  destinationNodeId: z.string(),
  latencyMs: z.number().default(0),
});
export type ModeledHttpResponse = z.infer<typeof ModeledHttpResponseSchema>;

export const GatewayRouteRuleSchema = z.object({
  id: z.string(),
  priority: z.number().default(100),
  pathPattern: z.string().min(1),
  matchType: z.enum(["exact", "parameterized", "prefix"]).default("exact"),
  methods: z.array(HttpMethodSchema).default(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  targetNodeId: z.string(),
  stripPrefix: z.string().optional(),
});
export type GatewayRouteRule = z.infer<typeof GatewayRouteRuleSchema>;

export const LoadBalancerConfigSchema = z.object({
  strategy: z.enum(["round-robin", "weighted", "explicit"]).default("round-robin"),
  weights: z.record(z.number().positive()).default({}),
  explicitTargetId: z.string().optional(),
});
export type LoadBalancerConfig = z.infer<typeof LoadBalancerConfigSchema>;

export const ServiceOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("validate.input"),
    description: z.string().optional(),
  }),
  z.object({
    type: z.literal("cache.get"),
    cacheNodeId: z.string().optional(),
    keyTemplate: z.string(),
  }),
  z.object({
    type: z.literal("cache.set"),
    cacheNodeId: z.string().optional(),
    keyTemplate: z.string(),
    ttlMs: z.number().default(60000),
  }),
  z.object({
    type: z.literal("database.get"),
    dbNodeId: z.string().optional(),
    table: z.string(),
    keyTemplate: z.string(),
  }),
  z.object({
    type: z.literal("database.insert"),
    dbNodeId: z.string().optional(),
    table: z.string(),
    rowTemplate: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("database.update"),
    dbNodeId: z.string().optional(),
    table: z.string(),
    keyTemplate: z.string(),
    updates: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("external.call"),
    externalNodeId: z.string().optional(),
    path: z.string(),
  }),
  z.object({
    type: z.literal("response.return"),
    status: z.number().int().default(200),
    bodyTemplate: z.unknown().optional(),
  }),
  z.object({
    type: z.literal("error.return"),
    status: z.number().int().default(500),
    message: z.string(),
  }),
]);
export type ServiceOperation = z.infer<typeof ServiceOperationSchema>;

export const CacheFixtureSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  ttlMs: z.number().default(300000), // 5 min default
});
export type CacheFixture = z.infer<typeof CacheFixtureSchema>;

export const DatabaseFixtureTableSchema = z.object({
  tableName: z.string(),
  primaryKey: z.string().default("id"),
  rows: z.record(z.record(z.unknown())).default({}),
});
export type DatabaseFixtureTable = z.infer<typeof DatabaseFixtureTableSchema>;

export const ScenarioPresetIdSchema = z.enum([
  "custom",
  "cache-miss",
  "cache-hit",
  "load-balancer",
  "database-write",
  "external-error",
  "gateway-404",
]);
export type ScenarioPresetId = z.infer<typeof ScenarioPresetIdSchema>;

export const BehaviorScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  presetId: ScenarioPresetIdSchema.default("custom"),
  initialCache: z.array(CacheFixtureSchema).default([]),
  initialDatabase: z.record(DatabaseFixtureTableSchema).default({}),
  gatewayRules: z.array(GatewayRouteRuleSchema).default([]),
  loadBalancerConfig: LoadBalancerConfigSchema.default({
    strategy: "round-robin",
    weights: {},
  }),
  servicePipeline: z.array(ServiceOperationSchema).default([]),
  externalStubConfig: z.object({
    status: z.number().default(200),
    delayMs: z.number().default(150),
    body: z.unknown().optional(),
    failure: z.boolean().default(false),
  }).default({
    status: 200,
    delayMs: 150,
    failure: false,
  }),
});
export type BehaviorScenario = z.infer<typeof BehaviorScenarioSchema>;
