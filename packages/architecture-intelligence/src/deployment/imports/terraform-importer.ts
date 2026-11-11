/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Terraform Plan / State Importer
 * Safely parses Terraform plan JSON / state representations without code execution.
 * Redacts secrets and builds preview of infrastructure resources and relationships.
 */

import type {
  InfrastructureResource,
  InfrastructureResourceType,
  CloudProviderId,
  ImportPreviewResult,
  ResourceProvenance,
} from "../contracts/deployment.types";

export interface TerraformResourceChange {
  address: string;
  type: string;
  name: string;
  provider_name?: string;
  change?: {
    actions: string[]; // ["create"], ["update"], ["delete"], ["no-op"]
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    after_unknown?: Record<string, unknown>;
  };
  values?: Record<string, unknown>;
}

export interface TerraformPlanJson {
  format_version?: string;
  terraform_version?: string;
  resource_changes?: TerraformResourceChange[];
  values?: {
    root_module?: {
      resources?: TerraformResourceChange[];
      child_modules?: Array<{
        resources?: TerraformResourceChange[];
      }>;
    };
  };
}

export class TerraformImporter {
  private static SENSITIVE_KEY_PATTERNS = [
    /pass(word)?/i,
    /secret/i,
    /key/i,
    /token/i,
    /credential/i,
    /cert(ificate)?/i,
    /private/i,
  ];

  /**
   * Parse a Terraform Plan JSON or state string into normalized InfrastructureResources.
   */
  public static parse(
    rawJson: string,
    environmentId: string
  ): ImportPreviewResult {
    let parsed: TerraformPlanJson;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      throw new Error(`Invalid JSON format: ${(e as Error).message}`);
    }

    const resources: TerraformResourceChange[] = [];
    if (Array.isArray(parsed.resource_changes)) {
      resources.push(...parsed.resource_changes);
    } else if (parsed.values?.root_module?.resources) {
      resources.push(...parsed.values.root_module.resources);
      if (parsed.values.root_module.child_modules) {
        for (const child of parsed.values.root_module.child_modules) {
          if (child.resources) resources.push(...child.resources);
        }
      }
    }

    const newResources: InfrastructureResource[] = [];
    const updatedResources: InfrastructureResource[] = [];
    let sensitiveFieldsRedacted = 0;
    const conflicts: string[] = [];
    const notes: string[] = [];

    for (const item of resources) {
      const type = this.mapTerraformType(item.type);
      if (!type) continue; // Unsupported or auxiliary resource type

      const provider = this.detectProvider(item.type, item.provider_name);
      const attrs = item.change?.after || item.values || {};

      // Redact sensitive values
      const sanitizedConfig: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (this.isSensitiveKey(key)) {
          sanitizedConfig[key] = "[REDACTED]";
          sensitiveFieldsRedacted++;
        } else {
          sanitizedConfig[key] = value;
        }
      }

      const resId = `tf-${item.type.replace(/_/g, "-")}-${item.name.replace(/_/g, "-")}`;
      const cidr = (attrs.cidr_block as string) || (attrs.cidr as string) || undefined;
      const regionId = (attrs.region as string) || undefined;
      const zoneId = (attrs.availability_zone as string) || (attrs.zone as string) || undefined;

      const provenance: ResourceProvenance = {
        source: "imported_configuration",
        sourceIdentifier: item.address,
        importTimestamp: new Date().toISOString(),
        confirmationStatus: "pending_review",
      };

      const infraRes: InfrastructureResource = {
        id: resId,
        name: (attrs.name as string) || item.name || item.address,
        type,
        provider,
        environmentId,
        regionId,
        zoneId,
        cidr,
        externalId: item.address,
        configuration: sanitizedConfig,
        provenance,
        tags: (attrs.tags as Record<string, string>) || {},
      };

      const actions = item.change?.actions || ["create"];
      if (actions.includes("create")) {
        newResources.push(infraRes);
      } else if (actions.includes("update")) {
        updatedResources.push(infraRes);
      } else {
        newResources.push(infraRes);
      }
    }

    notes.push(
      `Parsed ${resources.length} Terraform resources. Identified ${newResources.length + updatedResources.length} infrastructure assets.`
    );

    return {
      sourceFormat: "terraform",
      totalParsed: resources.length,
      newResources,
      updatedResources,
      conflicts,
      detectedMappings: [],
      sensitiveFieldsRedacted,
      notes,
    };
  }

  private static mapTerraformType(tfType: string): InfrastructureResourceType | null {
    const mapping: Record<string, InfrastructureResourceType> = {
      aws_instance: "vm",
      google_compute_instance: "vm",
      azurerm_virtual_machine: "vm",
      azurerm_linux_virtual_machine: "vm",
      aws_eks_cluster: "k8s_cluster",
      google_container_cluster: "k8s_cluster",
      azurerm_kubernetes_cluster: "k8s_cluster",
      aws_eks_node_group: "k8s_nodepool",
      google_container_node_pool: "k8s_nodepool",
      aws_vpc: "vpc",
      google_compute_network: "vpc",
      azurerm_virtual_network: "vpc",
      aws_subnet: "subnet",
      google_compute_subnetwork: "subnet",
      azurerm_subnet: "subnet",
      aws_lb: "load_balancer",
      aws_alb: "load_balancer",
      google_compute_url_map: "load_balancer",
      azurerm_lb: "load_balancer",
      aws_apigatewayv2_api: "api_gateway",
      aws_api_gateway_rest_api: "api_gateway",
      aws_lambda_function: "serverless_function",
      google_cloudfunctions_function: "serverless_function",
      azurerm_function_app: "serverless_function",
      aws_db_instance: "managed_db",
      google_sql_database_instance: "managed_db",
      azurerm_postgresql_server: "managed_db",
      azurerm_mssql_server: "managed_db",
      aws_elasticache_cluster: "cache_cluster",
      aws_elasticache_replication_group: "cache_cluster",
      aws_sqs_queue: "queue",
      aws_s3_bucket: "object_storage",
      google_storage_bucket: "object_storage",
      azurerm_storage_account: "object_storage",
      aws_security_group: "firewall_rule",
      aws_route_table: "route_table",
      aws_nat_gateway: "nat_gateway",
      aws_internet_gateway: "internet_gateway",
      aws_cloudfront_distribution: "cdn_distribution",
      cloudflare_record: "dns_zone",
    };

    return mapping[tfType] || null;
  }

  private static detectProvider(tfType: string, providerName?: string): CloudProviderId {
    if (providerName) {
      if (providerName.includes("aws")) return "aws";
      if (providerName.includes("google")) return "gcp";
      if (providerName.includes("azurerm")) return "azure";
      if (providerName.includes("cloudflare")) return "cloudflare";
    }

    if (tfType.startsWith("aws_")) return "aws";
    if (tfType.startsWith("google_")) return "gcp";
    if (tfType.startsWith("azurerm_")) return "azure";
    if (tfType.startsWith("cloudflare_")) return "cloudflare";

    return "custom";
  }

  private static isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }
}

