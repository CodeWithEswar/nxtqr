import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { DependencyKind, ResolvedDependency } from "../contracts/failure.types";

export class DependencyResolver {
  public static resolveDependencies(
    nodes: BaseNode[],
    edges: BaseEdge[],
    index: GraphIndex
  ): Map<string, ResolvedDependency[]> {
    const dependencyMap = new Map<string, ResolvedDependency[]>();

    for (const node of nodes) {
      dependencyMap.set(node.id, []);
    }

    for (const edge of edges) {
      const srcNode = index.nodeMap.get(edge.source);
      const tgtNode = index.nodeMap.get(edge.target);

      if (!srcNode || !tgtNode) continue;

      const relKind = (edge.data?.relationshipKind as string) || "request-response";
      const protocol = ((edge.data?.protocol as string) || "").toUpperCase();
      const tgtType = tgtNode.type.toLowerCase();
      const tgtDef = index.infraDefMap.get(tgtNode.id);
      const tgtCaps = tgtDef?.capabilities || [];

      let kind: DependencyKind = "runtime-request";
      let isHardDependency = true;
      let isCritical = true;

      // 1. Structural & Containment
      if (relKind === "containment" || relKind === "structural" || edge.data?.isGroupEdge) {
        kind = "structural";
        isHardDependency = false;
        isCritical = false;
      }
      // 2. Observability & Telemetry (Outage does not interrupt core data plane)
      else if (
        relKind === "observability" ||
        tgtType.includes("log") ||
        tgtType.includes("metric") ||
        tgtType.includes("trace") ||
        tgtType.includes("telemetry") ||
        tgtCaps.includes("metrics-collection") ||
        tgtCaps.includes("log-aggregation")
      ) {
        kind = "observability";
        isHardDependency = false;
        isCritical = false;
      }
      // 3. Control Plane & Management
      else if (
        relKind === "control-plane" ||
        tgtType.includes("service-mesh-control-plane") ||
        tgtType.includes("config-server") ||
        tgtCaps.includes("service-discovery")
      ) {
        kind = "control-plane";
        isHardDependency = false; // Existing traffic keeps flowing, new deployments or discovery impacted
        isCritical = false;
      }
      // 4. Authentication & Authorization
      else if (
        relKind === "authentication" ||
        tgtType.includes("identity") ||
        tgtType.includes("auth") ||
        tgtType.includes("oauth") ||
        tgtType.includes("sso") ||
        tgtCaps.includes("authentication")
      ) {
        kind = "authentication";
        isHardDependency = true;
        isCritical = true;
      } else if (relKind === "authorization" || tgtCaps.includes("authorization")) {
        kind = "authorization";
        isHardDependency = true;
        isCritical = true;
      }
      // 5. Data & Storage
      else if (
        relKind === "database-access" ||
        tgtType.includes("database") ||
        tgtType.includes("sql") ||
        tgtType.includes("postgres") ||
        tgtType.includes("mysql") ||
        tgtType.includes("dynamodb") ||
        tgtType.includes("nosql") ||
        tgtCaps.includes("relational-storage") ||
        tgtCaps.includes("nosql-storage")
      ) {
        kind = "data";
        isHardDependency = true;
        isCritical = true;
      } else if (
        relKind === "storage-access" ||
        tgtType.includes("object-storage") ||
        tgtType.includes("bucket") ||
        tgtType.includes("blob")
      ) {
        kind = "storage";
        isHardDependency = true;
        isCritical = true;
      }
      // 6. Messaging & Asynchronous Event Streaming
      else if (
        relKind === "event-delivery" ||
        relKind === "stream" ||
        tgtType.includes("queue") ||
        tgtType.includes("kafka") ||
        tgtType.includes("rabbitmq") ||
        tgtType.includes("topic") ||
        tgtCaps.includes("message-buffering") ||
        tgtCaps.includes("pub-sub")
      ) {
        kind = "messaging";
        // Asynchronous queues decouple consumers, but if publishing fails, producers may block
        isHardDependency = edge.data?.isSynchronousPublish === true;
        isCritical = true;
      }
      // 7. Network Gateways & Routing
      else if (
        tgtType.includes("gateway") ||
        tgtType.includes("load-balancer") ||
        tgtType.includes("reverse-proxy") ||
        tgtCaps.includes("traffic-distribution")
      ) {
        kind = "network";
        isHardDependency = true;
        isCritical = true;
      }

      const isSynchronous =
        relKind === "request-response" ||
        relKind === "database-access" ||
        kind === "authentication" ||
        protocol === "HTTP" ||
        protocol === "HTTPS" ||
        protocol === "REST" ||
        protocol === "GRPC" ||
        protocol === "SQL";

      const dep: ResolvedDependency = {
        edgeId: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        kind,
        isCritical,
        isSynchronous,
        isHardDependency,
        description: `${srcNode.label || srcNode.id} relies on ${tgtNode.label || tgtNode.id} for ${kind}`,
      };

      dependencyMap.get(edge.source)?.push(dep);
    }

    return dependencyMap;
  }
}

