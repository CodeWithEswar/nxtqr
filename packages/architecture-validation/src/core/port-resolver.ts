import type { BaseNode, PortDefinition } from "@nxtqr/graph-schema";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import type {
  ArchitecturePort,
  PortDirection,
  PortRole,
  RelationshipKind,
} from "../contracts/validation.types";

export class PortResolver {
  public resolveNodePorts(node: BaseNode): readonly ArchitecturePort[] {
    const rawPorts = this.extractRawPorts(node);
    const categoryId = (node.data?.categoryId as string) || "";
    const componentId =
      (node.data?.componentType as string) ||
      (node.data?.componentId as string) ||
      node.type ||
      "";

    if (rawPorts.length === 0) {
      // Check if this component is a boundary or annotation (which don't need network ports)
      if (
        categoryId === "architecture-and-diagram-utilities" ||
        componentId.includes("boundary") ||
        componentId.includes("note")
      ) {
        return [];
      }

      // Generate default synthetic bidirectional port for graph nodes that have no explicit ports
      return [
        {
          id: "default",
          name: "Default Port",
          type: "bidirectional",
          direction: "bidirectional",
          roles: ["peer", "data"],
          protocols: ["http", "tcp", "custom"],
          relationshipKinds: ["request-response", "association"],
          description: "Default interface",
        },
      ];
    }

    return rawPorts.map((p) => this.enrichPort(p, categoryId, componentId));
  }

  public findPort(
    ports: readonly ArchitecturePort[],
    handleId?: string | null,
  ): ArchitecturePort | undefined {
    if (!handleId) {
      // If no handleId provided, return first port or default
      return ports[0];
    }
    return ports.find((p) => p.id === handleId);
  }

  private extractRawPorts(node: BaseNode): readonly PortDefinition[] {
    if (Array.isArray(node.ports) && node.ports.length > 0) {
      return node.ports;
    }
    const compId =
      (node.data?.componentType as string) ||
      (node.data?.componentId as string) ||
      node.type;
    const compDef = infrastructureRegistry.getComponent(compId);
    if (compDef && Array.isArray(compDef.ports) && compDef.ports.length > 0) {
      return compDef.ports;
    }
    return [];
  }

  private enrichPort(
    raw: PortDefinition,
    categoryId: string,
    _componentId: string,
  ): ArchitecturePort {
    const direction: PortDirection =
      raw.type === "input"
        ? "input"
        : raw.type === "output"
          ? "output"
          : "bidirectional";

    const roles: PortRole[] = [];
    const protocols: string[] = [];
    const relationshipKinds: RelationshipKind[] = [];

    const dataTypeLower = (raw.dataType || "").toLowerCase();
    const idLower = raw.id.toLowerCase();
    const nameLower = raw.name.toLowerCase();

    // 1. Infer protocol
    if (
      dataTypeLower.includes("http") ||
      idLower.includes("http") ||
      nameLower.includes("http")
    ) {
      protocols.push("http");
      if (
        dataTypeLower.includes("https") ||
        idLower.includes("https") ||
        nameLower.includes("https")
      ) {
        protocols.push("https");
      }
    }

    if (
      dataTypeLower.includes("grpc") ||
      idLower.includes("grpc") ||
      nameLower.includes("grpc")
    ) {
      protocols.push("grpc");
    }

    if (
      dataTypeLower.includes("ws") ||
      idLower.includes("ws") ||
      nameLower.includes("websocket")
    ) {
      protocols.push("websocket");
    }

    if (
      dataTypeLower.includes("tcp") ||
      idLower.includes("tcp") ||
      nameLower.includes("tcp")
    ) {
      protocols.push("tcp");
    }

    if (
      dataTypeLower.includes("udp") ||
      idLower.includes("udp") ||
      nameLower.includes("udp")
    ) {
      protocols.push("udp");
    }

    if (
      dataTypeLower.includes("mqtt") ||
      idLower.includes("mqtt") ||
      nameLower.includes("mqtt")
    ) {
      protocols.push("mqtt");
    }

    if (
      dataTypeLower.includes("sql") ||
      dataTypeLower.includes("postgres") ||
      dataTypeLower.includes("mysql") ||
      idLower.includes("query") ||
      idLower.includes("sql")
    ) {
      protocols.push("sql");
    }

    if (
      dataTypeLower.includes("redis") ||
      idLower.includes("cache") ||
      nameLower.includes("redis")
    ) {
      protocols.push("redis");
    }

    if (
      dataTypeLower.includes("dns") ||
      idLower.includes("dns") ||
      nameLower.includes("dns")
    ) {
      protocols.push("dns");
    }

    if (protocols.length === 0) {
      // Fallback protocol inference
      if (categoryId === "databases-and-persistence") protocols.push("sql");
      else if (categoryId === "caching-and-performance") protocols.push("redis");
      else protocols.push("http");
    }

    // 2. Infer roles
    if (direction === "output") {
      if (categoryId === "clients-and-user-interfaces") roles.push("client");
      else if (categoryId === "messaging-and-event-systems") roles.push("producer", "publisher");
      else roles.push("client", "producer");
    } else if (direction === "input") {
      if (categoryId === "messaging-and-event-systems") roles.push("consumer", "subscriber");
      else roles.push("server", "target");
    } else {
      roles.push("peer", "client", "server");
    }

    // 3. Infer relationship kinds
    if (protocols.includes("http") || protocols.includes("grpc") || protocols.includes("sql")) {
      relationshipKinds.push("request-response");
    }
    if (protocols.includes("websocket") || protocols.includes("udp") || dataTypeLower.includes("stream")) {
      relationshipKinds.push("stream");
    }
    if (protocols.includes("mqtt") || dataTypeLower.includes("event") || dataTypeLower.includes("msg")) {
      relationshipKinds.push("publish-subscribe", "event-delivery");
    }
    if (categoryId === "databases-and-persistence") {
      relationshipKinds.push("database-access");
      if (idLower.includes("repl") || nameLower.includes("repl")) {
        relationshipKinds.push("replication");
      }
    }
    if (categoryId === "caching-and-performance") {
      relationshipKinds.push("cache-access");
    }

    return {
      ...raw,
      direction,
      roles,
      protocols,
      relationshipKinds: relationshipKinds.length > 0 ? relationshipKinds : ["request-response"],
      maxConnections: raw.capacity ?? (direction === "input" ? 20 : 50),
    };
  }
}

export const portResolver = new PortResolver();
