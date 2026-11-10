import type { BaseNode } from "@nxtqr/graph-schema";
import { infrastructureRegistry } from "@nxtqr/node-registry";

export class CapabilityResolver {
  private cache = new Map<string, { hash: string; capabilities: readonly string[] }>();

  public resolveNodeCapabilities(node: BaseNode): readonly string[] {
    const componentId = this.extractComponentId(node);
    const config = this.extractConfig(node);
    const stateHash = `${componentId}:${JSON.stringify(config)}`;

    const cached = this.cache.get(node.id);
    if (cached && cached.hash === stateHash) {
      return cached.capabilities;
    }

    const resolved = this.computeCapabilities(componentId, config, node);
    this.cache.set(node.id, { hash: stateHash, capabilities: resolved });
    return resolved;
  }

  public invalidate(nodeId?: string): void {
    if (nodeId) {
      this.cache.delete(nodeId);
    } else {
      this.cache.clear();
    }
  }

  private extractComponentId(node: BaseNode): string {
    return (
      (node.data?.componentType as string) ||
      (node.data?.componentId as string) ||
      node.type ||
      "custom"
    );
  }

  private extractConfig(node: BaseNode): Record<string, unknown> {
    return (node.data || {}) as Record<string, unknown>;
  }

  private computeCapabilities(
    componentId: string,
    config: Record<string, unknown>,
    node: BaseNode,
  ): readonly string[] {
    const baseCapabilities = new Set<string>();

    // 1. Registry defined capabilities
    const compDef = infrastructureRegistry.getComponent(componentId);
    if (compDef && compDef.capabilities) {
      for (const cap of compDef.capabilities) {
        baseCapabilities.add(cap);
      }
    }

    // 2. Infer dynamic capabilities from component category & ID
    const categoryId = compDef?.categoryId || (node.data?.categoryId as string) || "";

    if (categoryId === "clients-and-user-interfaces") {
      baseCapabilities.add("client-endpoint");
      if (componentId === "web-browser") {
        baseCapabilities.add("http-client");
        baseCapabilities.add("websocket-client");
        baseCapabilities.add("cookie-jar");
      } else if (componentId === "mobile-application") {
        baseCapabilities.add("http-client");
        baseCapabilities.add("websocket-client");
        baseCapabilities.add("push-receiver");
      } else if (componentId === "iot-device") {
        baseCapabilities.add("mqtt-client");
        baseCapabilities.add("udp-client");
        baseCapabilities.add("telemetry-emitter");
      }
    }

    if (categoryId === "networking-and-traffic") {
      if (componentId === "api-gateway") {
        baseCapabilities.add("http-server");
        baseCapabilities.add("http-client");
        baseCapabilities.add("reverse-proxy");
        baseCapabilities.add("tls-termination");
        baseCapabilities.add("rate-limiter");
      } else if (componentId === "load-balancer") {
        baseCapabilities.add("traffic-router");
        baseCapabilities.add("health-checker");
      }
    }

    if (categoryId === "compute-and-application-services") {
      baseCapabilities.add("compute-workload");
      baseCapabilities.add("application-server");
      // Default compute server exposes HTTP unless explicitly restricted
      baseCapabilities.add("http-server");
      baseCapabilities.add("http-client");
      baseCapabilities.add("database-client");
      baseCapabilities.add("cache-client");
    }

    if (categoryId === "databases-and-persistence") {
      baseCapabilities.add("database-server");
      baseCapabilities.add("persistence-target");
      if (componentId.includes("postgres") || componentId.includes("relational")) {
        baseCapabilities.add("sql-server");
        baseCapabilities.add("postgres-wire");
      } else if (componentId.includes("mysql")) {
        baseCapabilities.add("sql-server");
        baseCapabilities.add("mysql-wire");
      } else if (componentId.includes("vector")) {
        baseCapabilities.add("vector-index");
        baseCapabilities.add("similarity-search");
      }
    }

    if (categoryId === "caching-and-performance") {
      baseCapabilities.add("cache-server");
      baseCapabilities.add("in-memory-storage");
      if (componentId.includes("redis")) {
        baseCapabilities.add("redis-protocol");
        baseCapabilities.add("pubsub-broker");
      } else if (componentId.includes("memcached")) {
        baseCapabilities.add("memcached-protocol");
      }
    }

    if (categoryId === "messaging-and-event-systems") {
      baseCapabilities.add("message-broker");
      baseCapabilities.add("async-queue");
      if (componentId.includes("kafka") || componentId.includes("event-stream")) {
        baseCapabilities.add("event-stream-broker");
        baseCapabilities.add("partitioned-log");
      }
    }

    if (categoryId === "storage-and-file-systems") {
      baseCapabilities.add("storage-service");
      if (componentId.includes("object-storage") || componentId.includes("s3")) {
        baseCapabilities.add("s3-api");
        baseCapabilities.add("blob-storage");
      }
    }

    if (categoryId === "media-and-real-time-communication") {
      if (componentId.includes("websocket")) {
        baseCapabilities.add("websocket-server");
      }
      if (componentId.includes("webrtc") || componentId.includes("signaling")) {
        baseCapabilities.add("webrtc-signaling");
      }
      if (componentId.includes("media-server")) {
        baseCapabilities.add("media-streaming");
      }
    }

    if (categoryId === "architecture-and-diagram-utilities") {
      baseCapabilities.add("diagram-utility");
      if (componentId.includes("boundary") || componentId.includes("zone")) {
        baseCapabilities.add("boundary-container");
      }
      if (componentId.includes("note") || componentId.includes("annotation")) {
        baseCapabilities.add("annotation-element");
      }
    }

    // 3. Configuration overrides
    if (config.tlsTermination === true || config.tlsEnabled === true) {
      baseCapabilities.add("tls-termination");
      baseCapabilities.add("https-server");
    }

    if (Array.isArray(config.supportedTransports)) {
      for (const t of config.supportedTransports) {
        if (typeof t === "string") {
          baseCapabilities.add(`transport-${t.toLowerCase()}`);
        }
      }
    }

    if (Array.isArray(config.protocols)) {
      for (const p of config.protocols) {
        if (typeof p === "string") {
          const lower = p.toLowerCase();
          baseCapabilities.add(`protocol-${lower}`);
          if (lower === "grpc") baseCapabilities.add("grpc-server");
          if (lower === "websocket") baseCapabilities.add("websocket-server");
          if (lower === "http" || lower === "https") baseCapabilities.add("http-server");
        }
      }
    }

    return Object.freeze(Array.from(baseCapabilities));
  }
}

export const capabilityResolver = new CapabilityResolver();
