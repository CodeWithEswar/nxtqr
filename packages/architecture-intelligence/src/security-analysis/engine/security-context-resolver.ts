import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  NodeSecurityProfile,
  ExposureClassification,
  TrustLevel,
  DataSensitivity,
  SecurityControlKind,
} from "../schemas/security.schemas";

// Well-known component types and their default security postures
const CLIENT_COMPONENT_TYPES = new Set([
  "web-browser",
  "mobile-application",
  "desktop-application",
  "single-page-application",
  "static-website",
]);

const EDGE_INGRESS_COMPONENT_TYPES = new Set([
  "api-gateway",
  "load-balancer",
  "reverse-proxy",
  "web-server",
  "content-delivery-network",
  "dns-server",
]);

const DATABASE_COMPONENT_TYPES = new Set([
  "relational-database",
  "nosql-database",
  "key-value-store",
  "graph-database",
  "time-series-database",
  "vector-database",
  "in-memory-cache",
  "object-storage",
  "block-storage",
]);

const AUTH_CONTROL_TYPES = new Set([
  "authentication-service",
  "identity-provider",
  "oauth-provider",
  "openid-connect-provider",
  "api-key-service",
  "token-service",
]);

const AUTHZ_CONTROL_TYPES = new Set([
  "authorization-service",
  "policy-engine",
]);

const SECRET_CONTROL_TYPES = new Set([
  "secrets-manager",
  "key-management-service",
  "certificate-authority",
]);

export class SecurityContextResolver {
  public static resolveProfile(
    node: BaseNode,
    allNodes: BaseNode[],
    edges: BaseEdge[]
  ): NodeSecurityProfile {
    const rawData = (node.data || {}) as Record<string, unknown>;
    const componentType = (rawData.componentType as string) || node.type || "unknown";
    const label = (rawData.label as string) || (node.id as string);

    // 1. Exposure Classification
    let exposure: ExposureClassification = "unknown";
    if (rawData.exposure && typeof rawData.exposure === "string") {
      exposure = rawData.exposure as ExposureClassification;
    } else if (CLIENT_COMPONENT_TYPES.has(componentType)) {
      exposure = "public";
    } else if (EDGE_INGRESS_COMPONENT_TYPES.has(componentType)) {
      exposure = (rawData.isInternal as boolean) ? "internal" : "public";
    } else if (DATABASE_COMPONENT_TYPES.has(componentType)) {
      exposure = (rawData.publiclyAccessible as boolean) ? "public" : "private";
    } else if (AUTH_CONTROL_TYPES.has(componentType) || AUTHZ_CONTROL_TYPES.has(componentType)) {
      exposure = (rawData.isPublicEndpoint as boolean) ? "public" : "internal";
    } else {
      exposure = (rawData.isPublic as boolean) ? "public" : "internal";
    }

    // 2. Trust Level
    let trustLevel: TrustLevel = "internal-workload";
    if (rawData.trustLevel && typeof rawData.trustLevel === "string") {
      trustLevel = rawData.trustLevel as TrustLevel;
    } else if (CLIENT_COMPONENT_TYPES.has(componentType)) {
      trustLevel = "untrusted-public";
    } else if (EDGE_INGRESS_COMPONENT_TYPES.has(componentType)) {
      trustLevel = "dmz-protected";
    } else if (DATABASE_COMPONENT_TYPES.has(componentType)) {
      trustLevel = "high-security-vault";
    } else if (SECRET_CONTROL_TYPES.has(componentType)) {
      trustLevel = "root-isolated";
    }

    // 3. Data Sensitivity
    let dataSensitivity: DataSensitivity = "internal";
    if (rawData.dataSensitivity && typeof rawData.dataSensitivity === "string") {
      dataSensitivity = rawData.dataSensitivity as DataSensitivity;
    } else if (DATABASE_COMPONENT_TYPES.has(componentType)) {
      dataSensitivity = (rawData.dataSensitivity as DataSensitivity) || "confidential";
    } else if (SECRET_CONTROL_TYPES.has(componentType)) {
      dataSensitivity = "restricted";
    } else if (CLIENT_COMPONENT_TYPES.has(componentType)) {
      dataSensitivity = "public";
    }

    // 4. Authentication Requirements
    const isAnonymousAllowed = Boolean(
      rawData.isAnonymousAllowed ||
      rawData.allowAnonymous ||
      rawData.anonymousAccess === true ||
      componentType === "static-website" ||
      componentType === "content-delivery-network" ||
      componentType === "dns-server" ||
      componentType === "web-application-firewall" ||
      componentType === "ddos-protection" ||
      componentType === "network-firewall"
    );

    const requiresAuth = Boolean(
      !isAnonymousAllowed &&
      (rawData.requiresAuth ??
       rawData.authenticationRequired ??
       (exposure === "public" && !CLIENT_COMPONENT_TYPES.has(componentType)) ??
       false)
    );

    // 5. Authorization & Administration
    const isAdministrative = Boolean(
      rawData.isAdministrative ||
      rawData.adminOnly ||
      label.toLowerCase().includes("admin") ||
      label.toLowerCase().includes("management") ||
      componentType === "control-plane"
    );

    const requiresAuthz = Boolean(
      rawData.requiresAuthz ??
      rawData.authorizationRequired ??
      isAdministrative ??
      AUTHZ_CONTROL_TYPES.has(componentType)
    );

    // 6. Secrets & TLS
    const usesSecrets = Boolean(
      DATABASE_COMPONENT_TYPES.has(componentType) ||
      AUTH_CONTROL_TYPES.has(componentType) ||
      componentType === "payment-gateway" ||
      componentType === "compute-instance" ||
      componentType === "kubernetes-cluster" ||
      rawData.usesSecrets === true
    );

    // Check if connected to secrets manager or KMS
    const hasSecretManagerBound = edges.some((edge) => {
      const otherId = edge.source === node.id ? edge.target : edge.source;
      const otherNode = allNodes.find((n) => n.id === otherId);
      if (!otherNode) return false;
      const otherType = (otherNode.data?.componentType as string) || otherNode.type || "";
      return SECRET_CONTROL_TYPES.has(otherType);
    });

    const enforcesTls = Boolean(
      rawData.enforcesTls ??
      rawData.sslEnabled ??
      rawData.tlsTermination ??
      rawData.encryptionInTransit ??
      rawData.transportSecurity === "tls"
    );

    // 7. Security Controls Present directly on this node or neighboring proxy
    const controlsPresent: SecurityControlKind[] = [];
    if (componentType === "web-application-firewall") controlsPresent.push("waf");
    if (componentType === "ddos-protection") controlsPresent.push("ddos-shield");
    if (componentType === "api-gateway") controlsPresent.push("api-gateway");
    if (componentType === "reverse-proxy") controlsPresent.push("reverse-proxy");
    if (AUTH_CONTROL_TYPES.has(componentType)) controlsPresent.push("auth-service");
    if (AUTHZ_CONTROL_TYPES.has(componentType)) controlsPresent.push("authz-policy");
    if (SECRET_CONTROL_TYPES.has(componentType)) controlsPresent.push("secrets-vault");
    if (componentType === "rate-limiter") controlsPresent.push("rate-limiter");
    if (componentType === "network-firewall") controlsPresent.push("network-firewall");
    if (enforcesTls) controlsPresent.push("tls-enforced");

    // Boundary IDs (if explicitly tagged or child of boundary)
    const boundaryIds: string[] = [];
    const parentId = (node as { parentId?: string }).parentId || (rawData.parentId as string);
    if (parentId) boundaryIds.push(parentId);
    if (Array.isArray(rawData.boundaryIds)) {
      boundaryIds.push(...(rawData.boundaryIds as string[]));
    }
    if (typeof rawData.boundaryId === "string") {
      boundaryIds.push(rawData.boundaryId);
    }

    return {
      nodeId: node.id,
      nodeName: label,
      componentType,
      exposure,
      trustLevel,
      dataSensitivity,
      requiresAuth,
      isAnonymousAllowed,
      requiresAuthz,
      isAdministrative,
      usesSecrets,
      hasSecretManagerBound,
      enforcesTls,
      boundaryIds: Array.from(new Set(boundaryIds)),
      controlsPresent,
    };
  }

  public static resolveAllProfiles(
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): Map<string, NodeSecurityProfile> {
    const profileMap = new Map<string, NodeSecurityProfile>();
    for (const node of nodes) {
      profileMap.set(node.id, this.resolveProfile(node, nodes, edges));
    }
    return profileMap;
  }
}
