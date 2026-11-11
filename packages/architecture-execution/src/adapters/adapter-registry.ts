import type {
  ComponentExecutionAdapter,
  ComponentExecutionContext,
  ComponentExecutionResult,
} from "./component-adapter";

export class ClientAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "client";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    return {
      durationMs: 120,
      stepOutcome: "pass",
      explanation: `Client synthesized outbound ${ctx.request.method} request to path "${ctx.request.path}".`,
      responseMetadata: {
        notes: "Outbound HTTP request formatted with client headers.",
      },
    };
  }
}

export class ApiGatewayAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "api-gateway";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    const rawData = (ctx.node.data || {}) as Record<string, unknown>;
    const rateLimit = rawData.rateLimitRps ? `Rate limit: ${rawData.rateLimitRps} rps.` : "";
    return {
      durationMs: 40,
      stepOutcome: "pass",
      explanation: `API Gateway performed TLS termination, JWT validation, and ingress path matching. ${rateLimit}`.trim(),
      responseMetadata: {
        statusCode: 200,
        statusText: "Authenticated & Routed",
      },
    };
  }
}

export class LoadBalancerAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "load-balancer";

  public plan(_ctx: ComponentExecutionContext): ComponentExecutionResult {
    return {
      durationMs: 25,
      stepOutcome: "pass",
      explanation: "Load Balancer evaluated healthy upstream targets using round-robin distribution.",
      responseMetadata: {
        statusText: "Upstream Target Selected",
      },
    };
  }
}

export class ServiceAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "service";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    const rawData = (ctx.node.data || {}) as Record<string, unknown>;
    const concurrency = rawData.concurrency ? ` Concurrency capacity: ${rawData.concurrency}.` : "";
    return {
      durationMs: 180,
      stepOutcome: "pass",
      explanation: `Application worker executed domain business logic for "${ctx.node.label || ctx.node.id}".${concurrency}`,
      responseMetadata: {
        statusCode: 200,
        statusText: "OK",
      },
    };
  }
}

export class DatabaseAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "database";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    const isWrite = ctx.request.method === "POST" || ctx.request.method === "PUT" || ctx.request.method === "DELETE";
    return {
      durationMs: 220,
      stepOutcome: "pass",
      explanation: isWrite
        ? `Database executed write transaction with WAL commit and index flush for "${ctx.node.label || ctx.node.id}".`
        : `Database executed indexed query scan and returned relation tuple set for "${ctx.node.label || ctx.node.id}".`,
      responseMetadata: {
        statusText: isWrite ? "Transaction Committed" : "Rows Fetched",
      },
    };
  }
}

export class CacheAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "cache";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    const rawData = (ctx.node.data || {}) as Record<string, unknown>;
    const ttl = rawData.ttlSeconds ? ` (TTL: ${rawData.ttlSeconds}s)` : "";
    return {
      durationMs: 15,
      stepOutcome: "pass",
      explanation: `In-memory cache completed key hash lookup in sub-millisecond RAM space${ttl}.`,
      responseMetadata: {
        cached: true,
        statusText: "Cache Hit",
      },
    };
  }
}

export class MessageQueueAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "queue";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    return {
      durationMs: 50,
      stepOutcome: "pass",
      explanation: `Message payload persisted to persistent partition log in queue "${ctx.node.label || ctx.node.id}". Awaiting consumer pull.`,
      responseMetadata: {
        queueDepth: 1,
        statusText: "Message Enqueued",
      },
    };
  }
}

export class ExternalServiceAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "external-service";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    return {
      durationMs: 310,
      stepOutcome: "pass",
      explanation: `Third-party external provider API invoked across public WAN boundary for "${ctx.node.label || ctx.node.id}".`,
      responseMetadata: {
        statusCode: 200,
        statusText: "Egress Success",
      },
    };
  }
}

export class GenericComponentAdapter implements ComponentExecutionAdapter {
  public readonly componentType = "generic";

  public plan(ctx: ComponentExecutionContext): ComponentExecutionResult {
    return {
      durationMs: 150,
      stepOutcome: "pass",
      explanation: `Component "${ctx.node.label || ctx.node.id}" successfully completed guided execution step.`,
      responseMetadata: {
        statusText: "Step Completed",
      },
    };
  }
}

export class ComponentAdapterRegistry {
  private adapters = new Map<string, ComponentExecutionAdapter>();
  private defaultAdapter = new GenericComponentAdapter();

  constructor() {
    this.register(new ClientAdapter());
    this.register(new ApiGatewayAdapter());
    this.register(new LoadBalancerAdapter());
    this.register(new ServiceAdapter());
    this.register(new DatabaseAdapter());
    this.register(new CacheAdapter());
    this.register(new MessageQueueAdapter());
    this.register(new ExternalServiceAdapter());
    this.register(new GenericComponentAdapter());
  }

  public register(adapter: ComponentExecutionAdapter): void {
    this.adapters.set(adapter.componentType.toLowerCase(), adapter);
  }

  public resolve(componentTypeOrNode: string): ComponentExecutionAdapter {
    const key = componentTypeOrNode.toLowerCase();

    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }

    // Heuristic resolution
    if (key.includes("client") || key.includes("input") || key.includes("ui")) {
      return this.adapters.get("client")!;
    }
    if (key.includes("gateway")) {
      return this.adapters.get("api-gateway")!;
    }
    if (key.includes("balancer") || key.includes("lb")) {
      return this.adapters.get("load-balancer")!;
    }
    if (key.includes("database") || key.includes("sql") || key.includes("db") || key.includes("postgres")) {
      return this.adapters.get("database")!;
    }
    if (key.includes("cache") || key.includes("redis")) {
      return this.adapters.get("cache")!;
    }
    if (key.includes("queue") || key.includes("kafka") || key.includes("topic") || key.includes("amqp")) {
      return this.adapters.get("queue")!;
    }
    if (key.includes("external") || key.includes("output") || key.includes("sink")) {
      return this.adapters.get("external-service")!;
    }
    if (key.includes("service") || key.includes("process") || key.includes("worker")) {
      return this.adapters.get("service")!;
    }

    return this.defaultAdapter;
  }
}

export const componentAdapterRegistry = new ComponentAdapterRegistry();
