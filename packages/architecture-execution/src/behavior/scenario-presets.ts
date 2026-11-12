import type { BehaviorScenario } from "../schemas/behavior.schemas";

export const SCENARIO_PRESETS: Record<string, BehaviorScenario> = {
  "cache-miss": {
    id: "scen_cache_miss",
    name: "Cache Miss with Database Read & Repopulate",
    description: "Evaluates Redis cache miss, retrieves persistent row from PostgreSQL, stores it in cache, and returns HTTP 200.",
    presetId: "cache-miss",
    initialCache: [
      { key: "product:99", value: { id: "99", name: "Unrelated Item" }, ttlMs: 300000 },
    ],
    initialDatabase: {
      products: {
        tableName: "products",
        primaryKey: "id",
        rows: {
          "42": { id: "42", name: "Enterprise NVMe Server", price: 3499.0, category: "Hardware", inStock: true },
          "43": { id: "43", name: "10GbE Switch", price: 899.0, category: "Networking", inStock: true },
        },
      },
    },
    gatewayRules: [
      {
        id: "rule_products",
        priority: 100,
        pathPattern: "/api/products/:id",
        matchType: "parameterized",
        methods: ["GET", "POST"],
        targetNodeId: "product_service",
      },
    ],
    loadBalancerConfig: {
      strategy: "round-robin",
      weights: {},
    },
    servicePipeline: [],
    externalStubConfig: { status: 200, delayMs: 150, failure: false },
  },

  "cache-hit": {
    id: "scen_cache_hit",
    name: "Cache Hit (Database Bypassed)",
    description: "Evaluates unexpired key in Redis and returns cached payload immediately, bypassing database traversal.",
    presetId: "cache-hit",
    initialCache: [
      {
        key: "products:42",
        value: { id: "42", name: "Enterprise NVMe Server (Cached)", price: 3499.0, fromCache: true },
        ttlMs: 300000,
      },
      {
        key: "product:42",
        value: { id: "42", name: "Enterprise NVMe Server (Cached)", price: 3499.0, fromCache: true },
        ttlMs: 300000,
      },
    ],
    initialDatabase: {
      products: {
        tableName: "products",
        primaryKey: "id",
        rows: {
          "42": { id: "42", name: "Enterprise NVMe Server", price: 3499.0, inStock: true },
        },
      },
    },
    gatewayRules: [
      {
        id: "rule_products",
        priority: 100,
        pathPattern: "/api/products/:id",
        matchType: "parameterized",
        methods: ["GET"],
        targetNodeId: "product_service",
      },
    ],
    loadBalancerConfig: {
      strategy: "round-robin",
      weights: {},
    },
    servicePipeline: [],
    externalStubConfig: { status: 200, delayMs: 150, failure: false },
  },

  "load-balancer": {
    id: "scen_lb_rr",
    name: "Round-Robin Load Balancing",
    description: "Demonstrates deterministic round-robin upstream distribution across service workers.",
    presetId: "load-balancer",
    initialCache: [],
    initialDatabase: {},
    gatewayRules: [],
    loadBalancerConfig: {
      strategy: "round-robin",
      weights: {},
    },
    servicePipeline: [],
    externalStubConfig: { status: 200, delayMs: 150, failure: false },
  },

  "database-write": {
    id: "scen_db_write",
    name: "Database Mutation (POST Write)",
    description: "Simulates an HTTP POST write inserting a new row into the modeled database fixture and returning HTTP 201.",
    presetId: "database-write",
    initialCache: [],
    initialDatabase: {
      orders: {
        tableName: "orders",
        primaryKey: "id",
        rows: {},
      },
    },
    gatewayRules: [
      {
        id: "rule_orders",
        priority: 100,
        pathPattern: "/api/orders",
        matchType: "prefix",
        methods: ["POST", "GET"],
        targetNodeId: "order_service",
      },
    ],
    loadBalancerConfig: {
      strategy: "round-robin",
      weights: {},
    },
    servicePipeline: [],
    externalStubConfig: { status: 200, delayMs: 150, failure: false },
  },

  "external-error": {
    id: "scen_ext_err",
    name: "External Dependency Outage (HTTP 503)",
    description: "Simulates an upstream external dependency failure and validates error propagation back to the client.",
    presetId: "external-error",
    initialCache: [],
    initialDatabase: {},
    gatewayRules: [],
    loadBalancerConfig: {
      strategy: "round-robin",
      weights: {},
    },
    servicePipeline: [],
    externalStubConfig: { status: 503, delayMs: 200, failure: true },
  },

  "gateway-404": {
    id: "scen_gw_404",
    name: "Gateway Route Not Found (HTTP 404)",
    description: "Demonstrates route matching failure when incoming path does not match any configured route rule.",
    presetId: "gateway-404",
    initialCache: [],
    initialDatabase: {},
    gatewayRules: [
      {
        id: "rule_strict",
        priority: 100,
        pathPattern: "/api/v2/secure-only",
        matchType: "exact",
        methods: ["GET"],
        targetNodeId: "service_target",
      },
    ],
    loadBalancerConfig: {
      strategy: "round-robin",
      weights: {},
    },
    servicePipeline: [],
    externalStubConfig: { status: 200, delayMs: 150, failure: false },
  },
};

export function getScenarioPreset(presetId: string): BehaviorScenario {
  return SCENARIO_PRESETS[presetId] || SCENARIO_PRESETS["cache-miss"];
}
