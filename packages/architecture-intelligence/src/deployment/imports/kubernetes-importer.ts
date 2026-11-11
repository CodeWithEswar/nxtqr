/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Kubernetes Manifest Importer
 * Parses Kubernetes manifests (Deployments, StatefulSets, Services, Ingress, Namespaces)
 * into structured InfrastructureResources without runtime cluster communication.
 */

import type {
  InfrastructureResource,
  InfrastructureResourceType,
  ImportPreviewResult,
  ResourceProvenance,
} from "../contracts/deployment.types";

export interface KubernetesResourceObject {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec?: Record<string, unknown>;
  items?: KubernetesResourceObject[];
}

export class KubernetesImporter {
  /**
   * Parse Kubernetes YAML or JSON into normalized InfrastructureResources.
   */
  public static parse(
    rawContent: string,
    environmentId: string,
    clusterId?: string
  ): ImportPreviewResult {
    const documents = this.splitDocuments(rawContent);
    const newResources: InfrastructureResource[] = [];
    const updatedResources: InfrastructureResource[] = [];
    const conflicts: string[] = [];
    const notes: string[] = [];

    for (const doc of documents) {
      if (!doc || !doc.kind || !doc.metadata?.name) continue;

      // Handle Kubernetes List kind
      if (doc.kind === "List" && Array.isArray(doc.items)) {
        for (const item of doc.items) {
          const res = this.convertObject(item, environmentId, clusterId);
          if (res) newResources.push(res);
        }
        continue;
      }

      const res = this.convertObject(doc, environmentId, clusterId);
      if (res) newResources.push(res);
    }

    notes.push(
      `Parsed ${documents.length} Kubernetes manifest items. Generated ${newResources.length} infrastructure assets.`
    );

    return {
      sourceFormat: "kubernetes",
      totalParsed: documents.length,
      newResources,
      updatedResources,
      conflicts,
      detectedMappings: [],
      sensitiveFieldsRedacted: 0,
      notes,
    };
  }

  private static convertObject(
    doc: KubernetesResourceObject,
    environmentId: string,
    clusterId?: string
  ): InfrastructureResource | null {
    const kind = doc.kind || "";
    const name = doc.metadata?.name || "unnamed";
    const namespace = doc.metadata?.namespace || "default";

    const type = this.mapKindToType(kind, doc.spec);
    if (!type) return null;

    const resId = `k8s-${kind.toLowerCase()}-${namespace}-${name}`;
    const provenance: ResourceProvenance = {
      source: "imported_configuration",
      sourceIdentifier: `k8s:${kind}/${namespace}/${name}`,
      importTimestamp: new Date().toISOString(),
      confirmationStatus: "pending_review",
    };

    const configuration: Record<string, unknown> = {
      kind,
      namespace,
      ...(doc.spec || {}),
    };

    if (clusterId) {
      configuration.clusterId = clusterId;
    }

    return {
      id: resId,
      name,
      type,
      provider: "custom",
      environmentId,
      parentId: clusterId,
      externalId: `${kind}/${namespace}/${name}`,
      configuration,
      provenance,
      tags: doc.metadata?.labels || {},
    };
  }

  private static mapKindToType(
    kind: string,
    spec?: Record<string, unknown>
  ): InfrastructureResourceType | null {
    switch (kind) {
      case "Deployment":
      case "StatefulSet":
      case "DaemonSet":
      case "Job":
      case "CronJob":
        return "k8s_workload";

      case "Namespace":
        return "k8s_namespace";

      case "Service":
        if (spec?.type === "LoadBalancer") {
          return "load_balancer";
        }
        return "firewall_rule";

      case "Ingress":
        return "api_gateway";

      case "PersistentVolumeClaim":
      case "PersistentVolume":
        return "block_storage";

      case "Node":
      case "NodePool":
        return "k8s_nodepool";

      default:
        return null;
    }
  }

  private static splitDocuments(raw: string): KubernetesResourceObject[] {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return [JSON.parse(trimmed)];
      } catch {
        // Fall back to pseudo yaml split
      }
    }

    // Split YAML documents by '---'
    const docs = trimmed.split(/^---$/m);
    const results: KubernetesResourceObject[] = [];

    for (const docStr of docs) {
      const clean = docStr.trim();
      if (!clean) continue;

      const parsed = this.parseSimpleYamlLike(clean);
      if (parsed) results.push(parsed);
    }

    return results;
  }

  /**
   * Lightweight safe parser for YAML key-values and basic nested fields without external libraries.
   */
  private static parseSimpleYamlLike(text: string): KubernetesResourceObject | null {
    try {
      // First check if it parses as JSON
      return JSON.parse(text);
    } catch {
      // Basic YAML line parsing
      const lines = text.split("\n");
      const obj: Record<string, unknown> = {};
      let currentSection = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        if (trimmed.startsWith("kind:")) {
          obj.kind = trimmed.replace("kind:", "").trim();
        } else if (trimmed.startsWith("apiVersion:")) {
          obj.apiVersion = trimmed.replace("apiVersion:", "").trim();
        } else if (trimmed.startsWith("metadata:")) {
          currentSection = "metadata";
          if (!obj.metadata) obj.metadata = {};
        } else if (trimmed.startsWith("spec:")) {
          currentSection = "spec";
          if (!obj.spec) obj.spec = {};
        } else if (currentSection === "metadata" && trimmed.startsWith("name:")) {
          (obj.metadata as Record<string, unknown>).name = trimmed.replace("name:", "").trim();
        } else if (currentSection === "metadata" && trimmed.startsWith("namespace:")) {
          (obj.metadata as Record<string, unknown>).namespace = trimmed.replace("namespace:", "").trim();
        } else if (currentSection === "spec" && trimmed.startsWith("replicas:")) {
          const rep = parseInt(trimmed.replace("replicas:", "").trim(), 10);
          if (!isNaN(rep)) (obj.spec as Record<string, unknown>).replicas = rep;
        } else if (currentSection === "spec" && trimmed.startsWith("type:")) {
          (obj.spec as Record<string, unknown>).type = trimmed.replace("type:", "").trim();
        }
      }

      if (obj.kind && (obj.metadata as Record<string, unknown>)?.name) {
        return obj as KubernetesResourceObject;
      }
    }

    return null;
  }
}
