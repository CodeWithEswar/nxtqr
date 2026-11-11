/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Safe Bounded Gateway API & Ingress Parser
 */

import type {
  ApiGateway,
  GatewayRoute,
  GatewayListener,
  UpstreamPool,
  NetworkStateProvenance,
  NetworkProtocol,
} from "../contracts/network.types";

export interface GatewayApiParseResult {
  gateways: ApiGateway[];
  upstreamPools: UpstreamPool[];
  errors: string[];
}

export class GatewayApiParser {
  private static readonly MAX_INPUT_BYTES = 2 * 1024 * 1024; // 2 MB limit
  private static readonly MAX_OBJECTS = 500;

  /**
   * Safely parses Kubernetes Gateway API (Gateway, HTTPRoute) or Ingress YAML/JSON.
   * Strips YAML comments, splits documents, tokenizes key-value structures without eval.
   */
  public static parse(
    content: string,
    provenance?: NetworkStateProvenance
  ): GatewayApiParseResult {
    const prov: NetworkStateProvenance = provenance || {
      source: "imported_configuration",
      sourceIdentifier: "gateway_api_parser",
      timestamp: new Date().toISOString(),
      graphRevision: "rev-parsed",
      confirmed: true,
    };

    if (content.length > this.MAX_INPUT_BYTES) {
      return {
        gateways: [],
        upstreamPools: [],
        errors: [`Input exceeds maximum allowed size of ${this.MAX_INPUT_BYTES} bytes.`],
      };
    }

    const gateways: ApiGateway[] = [];
    const upstreamPools: UpstreamPool[] = [];
    const errors: string[] = [];

    try {
      // Split YAML multi-document streams on '---'
      const documents = content
        .split(/^---$/m)
        .map((doc) => doc.trim())
        .filter((doc) => doc.length > 0);

      if (documents.length > this.MAX_OBJECTS) {
        return {
          gateways: [],
          upstreamPools: [],
          errors: [`Input document count exceeds maximum allowed limit of ${this.MAX_OBJECTS}.`],
        };
      }

      for (const doc of documents) {
        const parsedDoc = this.parseDocument(doc);
        if (!parsedDoc) continue;

        const kind = parsedDoc.kind?.toLowerCase();

        if (kind === "gateway") {
          const gw = this.extractGateway(parsedDoc, prov);
          if (gw) gateways.push(gw);
        } else if (kind === "httproute") {
          const { route, pool } = this.extractHttpRoute(parsedDoc, prov);
          if (route) {
            // Attach route to matching gateway if exists or create stub gateway
            let targetGw = gateways.find((g) => g.id === route.gatewayId);
            if (!targetGw) {
              targetGw = {
                id: route.gatewayId,
                name: route.gatewayId,
                gatewayType: "k8s_gateway",
                listeners: [
                  {
                    name: "http",
                    port: 80,
                    protocol: "http1",
                    tlsMode: "none",
                  },
                ],
                routes: [],
                globalPolicies: {},
                providerTechnology: "kubernetes_gateway_api",
                provenance: prov,
              };
              gateways.push(targetGw);
            }
            targetGw.routes.push(route);
          }
          if (pool) upstreamPools.push(pool);
        } else if (kind === "ingress") {
          const { gateway, pools } = this.extractIngress(parsedDoc, prov);
          if (gateway) gateways.push(gateway);
          if (pools.length > 0) upstreamPools.push(...pools);
        }
      }
    } catch (err: unknown) {
      errors.push(`Parser error: ${(err as Error).message}`);
    }

    return { gateways, upstreamPools, errors };
  }

  /**
   * Safe minimal YAML/JSON hierarchical key-value parser without eval
   */
  private static parseDocument(raw: string): Record<string, any> | null {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // Fall back to line parser
      }
    }

    interface Line {
      indent: number;
      text: string;
      lineNum: number;
    }

    const lines: Line[] = [];
    const rawLines = trimmed.split("\n");
    for (let i = 0; i < rawLines.length; i++) {
      let l = rawLines[i];
      const commentIdx = l.indexOf("#");
      if (commentIdx !== -1) {
        l = l.substring(0, commentIdx);
      }
      l = l.trimEnd();
      if (!l.trim()) continue;
      const indent = l.search(/\S|$/);
      lines.push({ indent, text: l.trim(), lineNum: i });
    }

    if (lines.length === 0) return null;

    let idx = 0;

    function parseScalar(val: string): any {
      val = val.trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        return val.substring(1, val.length - 1);
      }
      if (val === "true") return true;
      if (val === "false") return false;
      if (val === "null") return null;
      if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
      return val;
    }

    function parseNode(minIndent: number): any {
      if (idx >= lines.length) return null;

      const currentLine = lines[idx];
      if (currentLine.indent < minIndent) return null;

      // Check if this is a list
      if (currentLine.text.startsWith("- ") || currentLine.text === "-") {
        const list: any[] = [];
        const listIndent = currentLine.indent;

        while (idx < lines.length && lines[idx].indent >= listIndent) {
          const l = lines[idx];
          if (l.indent !== listIndent && !l.text.startsWith("-")) {
            break;
          }
          if (l.indent === listIndent && (l.text.startsWith("- ") || l.text === "-")) {
            const afterDash = l.text.substring(1).trim();
            idx++;
            if (!afterDash) {
              if (idx < lines.length && lines[idx].indent > listIndent) {
                list.push(parseNode(lines[idx].indent));
              } else {
                list.push(null);
              }
            } else if (afterDash.includes(":")) {
              const firstColon = afterDash.indexOf(":");
              const k = afterDash.substring(0, firstColon).trim();
              const v = afterDash.substring(firstColon + 1).trim();
              const itemObj: Record<string, any> = {};

              if (v) {
                itemObj[k] = parseScalar(v);
              } else {
                if (idx < lines.length && lines[idx].indent > listIndent) {
                  itemObj[k] = parseNode(lines[idx].indent);
                } else {
                  itemObj[k] = null;
                }
              }

              while (
                idx < lines.length &&
                lines[idx].indent > listIndent &&
                !lines[idx].text.startsWith("-")
              ) {
                const subLine = lines[idx];
                if (subLine.text.includes(":")) {
                  const sc = subLine.text.indexOf(":");
                  const subK = subLine.text.substring(0, sc).trim();
                  const subV = subLine.text.substring(sc + 1).trim();
                  idx++;
                  if (subV) {
                    itemObj[subK] = parseScalar(subV);
                  } else {
                    if (
                      idx < lines.length &&
                      (lines[idx].indent > subLine.indent ||
                        (lines[idx].indent === subLine.indent &&
                          lines[idx].text.startsWith("-")))
                    ) {
                      itemObj[subK] = parseNode(lines[idx].indent);
                    } else {
                      itemObj[subK] = null;
                    }
                  }
                } else {
                  idx++;
                }
              }
              list.push(itemObj);
            } else {
              list.push(parseScalar(afterDash));
            }
          } else {
            break;
          }
        }
        return list;
      }

      // Otherwise, it's an object (mapping)
      const obj: Record<string, any> = {};
      const objIndent = currentLine.indent;

      while (idx < lines.length && lines[idx].indent >= objIndent) {
        const l = lines[idx];
        if (l.indent > objIndent) {
          break;
        }
        if (l.indent === objIndent) {
          if (l.text.startsWith("-")) break;
          const colonIdx = l.text.indexOf(":");
          if (colonIdx === -1) {
            idx++;
            continue;
          }
          const key = l.text.substring(0, colonIdx).trim();
          const valStr = l.text.substring(colonIdx + 1).trim();
          idx++;

          if (valStr) {
            obj[key] = parseScalar(valStr);
          } else {
            if (
              idx < lines.length &&
              (lines[idx].indent > objIndent || lines[idx].text.startsWith("-"))
            ) {
              obj[key] = parseNode(lines[idx].indent);
            } else {
              obj[key] = null;
            }
          }
        } else {
          break;
        }
      }
      return obj;
    }

    try {
      const parsed = parseNode(0);
      return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }

  private static extractGateway(
    doc: Record<string, any>,
    prov: NetworkStateProvenance
  ): ApiGateway | null {
    const name = doc.metadata?.name || doc.name || "k8s-gateway";
    const listeners: GatewayListener[] = [];

    // Extract listeners
    if (doc.spec?.listeners && Array.isArray(doc.spec.listeners)) {
      for (const l of doc.spec.listeners) {
        listeners.push({
          name: l.name || "listener",
          port: Number(l.port) || 80,
          protocol: this.mapProtocol(l.protocol),
          hostname: l.hostname,
          tlsMode: l.tls ? "edge_terminated" : "none",
        });
      }
    } else {
      listeners.push({
        name: "default-http",
        port: 80,
        protocol: "http1",
        tlsMode: "none",
      });
    }

    return {
      id: `gw-${name}`,
      name,
      gatewayType: "k8s_gateway",
      listeners,
      routes: [],
      globalPolicies: {},
      providerTechnology: "kubernetes_gateway_api",
      provenance: prov,
    };
  }

  private static extractHttpRoute(
    doc: Record<string, any>,
    prov: NetworkStateProvenance
  ): { route: GatewayRoute | null; pool: UpstreamPool | null } {
    const name = doc.metadata?.name || doc.name || "http-route";
    const parentRef =
      doc.spec?.parentRefs?.[0]?.name ||
      doc.spec?.parentRef ||
      "k8s-gateway";
    const gatewayId = `gw-${parentRef}`;

    const hostnames = Array.isArray(doc.spec?.hostnames)
      ? doc.spec.hostnames
      : doc.spec?.hostname
      ? [doc.spec.hostname]
      : [];

    const rule = doc.spec?.rules?.[0] || {};
    const match = rule.matches?.[0] || {};
    const backendRef = rule.backendRefs?.[0] || {};

    const backendName = backendRef.name || `${name}-svc`;
    const backendPort = Number(backendRef.port) || 8080;
    const poolId = `pool-${backendName}`;

    const route: GatewayRoute = {
      id: `route-${name}`,
      gatewayId,
      name,
      match: {
        hosts: hostnames.length > 0 ? hostnames : undefined,
        pathPrefix: match.path?.value || match.pathPrefix || "/",
        methods: match.method ? [match.method] : undefined,
      },
      precedenceOrder: 10,
      targetUpstreamPoolId: poolId,
      policies: {},
      provenance: prov,
    };

    const pool: UpstreamPool = {
      id: poolId,
      name: `Pool for ${backendName}`,
      endpoints: [
        {
          id: `ep-${backendName}-1`,
          address: `${backendName}.default.svc.cluster.local`,
          port: backendPort,
          weight: 100,
          isHealthy: true,
        },
      ],
      healthCheck: {
        id: `hc-${backendName}`,
        protocol: "http",
        path: "/healthz",
        port: backendPort,
        intervalSeconds: 10,
        timeoutSeconds: 3,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      provenance: prov,
    };

    return { route, pool };
  }

  private static extractIngress(
    doc: Record<string, any>,
    prov: NetworkStateProvenance
  ): { gateway: ApiGateway | null; pools: UpstreamPool[] } {
    const name = doc.metadata?.name || doc.name || "k8s-ingress";
    const gatewayId = `ingress-${name}`;
    const pools: UpstreamPool[] = [];
    const routes: GatewayRoute[] = [];

    const tlsConfig = doc.spec?.tls;
    const hasTls = Array.isArray(tlsConfig) && tlsConfig.length > 0;

    const listeners: GatewayListener[] = [
      {
        name: "http",
        port: 80,
        protocol: "http1",
        tlsMode: hasTls ? "edge_terminated" : "none",
      },
    ];

    if (hasTls) {
      listeners.push({
        name: "https",
        port: 443,
        protocol: "https",
        tlsMode: "edge_terminated",
      });
    }

    const rules = doc.spec?.rules || [];
    let order = 1;

    for (const r of rules) {
      const host = r.host;
      const httpPaths = r.http?.paths || [];

      for (const p of httpPaths) {
        const path = p.path || "/";
        const backendSvc =
          p.backend?.service?.name || p.backend?.serviceName || `${name}-backend`;
        const backendPort =
          Number(p.backend?.service?.port?.number) ||
          Number(p.backend?.servicePort) ||
          80;

        const poolId = `pool-${backendSvc}`;
        pools.push({
          id: poolId,
          name: `Pool for ${backendSvc}`,
          endpoints: [
            {
              id: `ep-${backendSvc}-1`,
              address: `${backendSvc}.default.svc.cluster.local`,
              port: backendPort,
              weight: 100,
              isHealthy: true,
            },
          ],
          healthCheck: {
            id: `hc-${backendSvc}`,
            protocol: "http",
            path: "/healthz",
            intervalSeconds: 15,
            timeoutSeconds: 5,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          provenance: prov,
        });

        routes.push({
          id: `route-${name}-${order}`,
          gatewayId,
          name: `${name} Path ${path}`,
          match: {
            hosts: host ? [host] : undefined,
            pathPrefix: path,
          },
          precedenceOrder: order++,
          targetUpstreamPoolId: poolId,
          policies: {},
          provenance: prov,
        });
      }
    }

    const gateway: ApiGateway = {
      id: gatewayId,
      name,
      gatewayType: "k8s_ingress",
      listeners,
      routes,
      globalPolicies: {},
      providerTechnology: "kubernetes_ingress",
      provenance: prov,
    };

    return { gateway, pools };
  }

  private static mapProtocol(proto?: string): NetworkProtocol {
    if (!proto) return "http1";
    const lower = proto.toLowerCase();
    if (lower.includes("https")) return "https";
    if (lower.includes("http2") || lower.includes("h2")) return "http2";
    if (lower.includes("http3") || lower.includes("h3") || lower.includes("quic")) return "http3";
    if (lower.includes("grpc")) return "grpc";
    if (lower.includes("ws")) return "websocket";
    if (lower.includes("tcp")) return "tcp";
    if (lower.includes("udp")) return "udp";
    return "http1";
  }
}
