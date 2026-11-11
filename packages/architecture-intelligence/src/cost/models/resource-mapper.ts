import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { BillableResourceCategory } from "../contracts/cost.types";
import type { BillingUnit } from "../contracts/pricing.types";

export interface MappedBillableResource {
  nodeId: string;
  nodeLabel: string;
  subsystem: string;
  category: BillableResourceCategory;
  resourceName: string;
  suggestedSkuId: string;
  quantity: number;
  unit: BillingUnit;
  isShared: boolean;
  allocationPercentage?: number;
  assumptions: string[];
}

export class ResourceMapper {
  /**
   * Normalizes vendor and catalog shorthand SKU identifiers to canonical catalog SKUs.
   */
  public static normalizeSku(rawSku: string): string {
    const trimmed = rawSku.trim();
    if (trimmed === "ingress.alb") return "network.alb";
    if (trimmed.startsWith("db.rds.postgres.")) {
      return `database.db.${trimmed.replace("db.rds.postgres.", "")}`;
    }
    if (trimmed.startsWith("cache.redis.")) {
      return `cache.cache.${trimmed.replace("cache.redis.", "")}`;
    }
    return trimmed;
  }

  /**
   * Translates a system design diagram node into one or more billable resource items.
   */
  public static mapNodeToResources(node: BaseNode): MappedBillableResource[] {
    const type = (node.type || "").toLowerCase();
    const data = (node.data || {}) as Record<string, unknown>;
    const label = String(data.label || node.label || node.id);
    const subsystem = String(data.tier || data.subsystem || data.categoryId || "core");
    const replicas = Math.max(1, Number(data.replicas || 1));
    const hoursPerMonth = 730; // Standard 730 hours/month operating schedule

    const resources: MappedBillableResource[] = [];

    // Custom SKU override provided directly on node
    if (data.pricingSku) {
      const sku = ResourceMapper.normalizeSku(String(data.pricingSku));
      let category = data.category as BillableResourceCategory | undefined;
      if (!category) {
        if (sku.startsWith("cache.") || type.includes("cache") || type.includes("redis")) {
          category = "cache";
        } else if (
          sku.startsWith("database.") ||
          sku.startsWith("db.") ||
          type.includes("database") ||
          type.includes("postgres") ||
          type.includes("sql")
        ) {
          category = "database";
        } else if (
          sku.startsWith("network.") ||
          sku.startsWith("ingress.") ||
          type.includes("balancer") ||
          type.includes("gateway")
        ) {
          category = "network";
        } else if (sku.startsWith("storage.") || type.includes("storage") || type.includes("s3")) {
          category = "storage";
        } else if (
          sku.startsWith("messaging.") ||
          type.includes("queue") ||
          type.includes("kafka") ||
          type.includes("sqs")
        ) {
          category = "messaging";
        } else {
          category = "compute";
        }
      }

      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category,
        resourceName: `${label} (Instance / Unit)`,
        suggestedSkuId: sku,
        quantity: replicas * hoursPerMonth,
        unit: "instance_hour",
        isShared: Boolean(data.isShared),
        assumptions: ["Explicit SKU configured on node properties"],
      });

      // If database or storage volume is indicated, also map storage
      if (category === "database" || data.storageGb) {
        const storageGb = Math.max(20, Number(data.storageGb || 100));
        resources.push({
          nodeId: node.id,
          nodeLabel: label,
          subsystem,
          category: "storage",
          resourceName: `${label} Persistent Volume`,
          suggestedSkuId: "database.storage.gp3",
          quantity: storageGb * replicas,
          unit: "gb_month",
          isShared: Boolean(data.isShared),
          assumptions: [`${storageGb} GB GP3 storage allocated per instance`],
        });
      }

      // If compute service, include egress transfer
      if (category === "compute") {
        resources.push({
          nodeId: node.id,
          nodeLabel: label,
          subsystem,
          category: "network",
          resourceName: `${label} Egress`,
          suggestedSkuId: "network.egress.internet",
          quantity: Math.max(50, Number(data.egressGb || 100)),
          unit: "gb_transfer",
          isShared: false,
          assumptions: ["Standard outbound egress bandwidth allocation"],
        });
      }

      return resources;
    }

    // 1. Relational Database & Storage
    if (type.includes("database") || type.includes("postgres") || type.includes("mysql") || type.includes("sql")) {
      const storageGb = Math.max(20, Number(data.storageGb || 100));

      // Compute tier
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "database",
        resourceName: `${label} Compute`,
        suggestedSkuId: replicas > 1 ? "database.db.r6g.large" : "database.db.t3.medium",
        quantity: replicas * hoursPerMonth,
        unit: "instance_hour",
        isShared: Boolean(data.isShared),
        assumptions: [`${replicas} instance(s) running 730 hrs/month`],
      });

      // Storage volume tier
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "storage",
        resourceName: `${label} Persistent Volume`,
        suggestedSkuId: "database.storage.gp3",
        quantity: storageGb * replicas,
        unit: "gb_month",
        isShared: Boolean(data.isShared),
        assumptions: [`${storageGb} GB GP3 storage allocated per instance`],
      });

      return resources;
    }

    // 2. In-Memory Cache (Redis)
    if (type.includes("cache") || type.includes("redis") || type.includes("memcached")) {
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "cache",
        resourceName: `${label} In-Memory Tier`,
        suggestedSkuId: "cache.cache.t3.medium",
        quantity: replicas * hoursPerMonth,
        unit: "instance_hour",
        isShared: Boolean(data.isShared),
        assumptions: [`${replicas} Redis node(s) running 730 hrs/month`],
      });
      return resources;
    }

    // 3. Object Storage (S3 / R2)
    if (type.includes("storage") || type.includes("s3") || type.includes("bucket") || type.includes("blob")) {
      const storageGb = Math.max(50, Number(data.storageGb || 250));
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "storage",
        resourceName: `${label} Object Storage`,
        suggestedSkuId: "storage.s3.standard",
        quantity: storageGb,
        unit: "gb_month",
        isShared: Boolean(data.isShared),
        assumptions: [`${storageGb} GB stored data volume`],
      });
      return resources;
    }

    // 4. Message Queues & Event Streams (SQS / Kafka)
    if (type.includes("queue") || type.includes("broker") || type.includes("kafka") || type.includes("sqs") || type.includes("pubsub")) {
      const estimatedMillions = Math.max(1, Number(data.monthlyMillionsRequests || 5));
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "messaging",
        resourceName: `${label} Requests`,
        suggestedSkuId: "messaging.sqs.standard",
        quantity: estimatedMillions,
        unit: "million_requests",
        isShared: Boolean(data.isShared),
        assumptions: [`${estimatedMillions}M message API operations per month`],
      });
      return resources;
    }

    // 5. Ingress & Gateways (ALB / Cloudflare)
    if (type.includes("gateway") || type.includes("balancer") || type.includes("router")) {
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "network",
        resourceName: `${label} Ingress`,
        suggestedSkuId: "network.alb",
        quantity: replicas * hoursPerMonth,
        unit: "instance_hour",
        isShared: Boolean(data.isShared),
        assumptions: [`${replicas} ingress controller(s) provisioned`],
      });

      // Egress traffic estimate
      const egressGb = Math.max(100, Number(data.egressGb || 500));
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "network",
        resourceName: `${label} Public Egress`,
        suggestedSkuId: "network.egress.internet",
        quantity: egressGb,
        unit: "gb_transfer",
        isShared: true,
        assumptions: [`${egressGb} GB public internet outbound transfer`],
      });

      return resources;
    }

    // 6. Serverless Functions
    if (type.includes("serverless") || type.includes("lambda") || type.includes("function") || type.includes("worker")) {
      const invocations = Math.max(1, Number(data.monthlyMillionsInvocations || 5));
      resources.push({
        nodeId: node.id,
        nodeLabel: label,
        subsystem,
        category: "serverless",
        resourceName: `${label} Execution`,
        suggestedSkuId: "serverless.lambda.invocations",
        quantity: invocations,
        unit: "million_invocations",
        isShared: false,
        assumptions: [`${invocations}M execution invocations/month`],
      });
      return resources;
    }

    // 7. Standard Compute Services (Default)
    resources.push({
      nodeId: node.id,
      nodeLabel: label,
      subsystem,
      category: "compute",
      resourceName: `${label} Cluster`,
      suggestedSkuId: replicas > 2 ? "compute.c6g.large" : "compute.t3.medium",
      quantity: replicas * hoursPerMonth,
      unit: "instance_hour",
      isShared: Boolean(data.isShared),
      assumptions: [`${replicas} instance(s) running 730 hrs/month`],
    });

    return resources;
  }

  /**
   * Maps an entire topology to a flat list of billable resources.
   */
  public static mapTopologyToResources(nodes: BaseNode[], _edges?: BaseEdge[]): MappedBillableResource[] {
    return nodes.flatMap((node) => ResourceMapper.mapNodeToResources(node));
  }
}
