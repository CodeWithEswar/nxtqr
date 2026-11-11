/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Import Registry
 * Auto-detects input format and dispatches to appropriate importer.
 */

import type { ImportPreviewResult } from "../contracts/deployment.types";
import { TerraformImporter } from "./terraform-importer";
import { KubernetesImporter } from "./kubernetes-importer";

export class ImportRegistry {
  /**
   * Automatically detect format and parse into ImportPreviewResult.
   */
  public static parse(
    content: string,
    environmentId: string,
    format?: "terraform" | "kubernetes" | "docker_compose" | "auto"
  ): ImportPreviewResult {
    const detectedFormat = format && format !== "auto" ? format : this.detectFormat(content);

    switch (detectedFormat) {
      case "terraform":
        return TerraformImporter.parse(content, environmentId);

      case "kubernetes":
        return KubernetesImporter.parse(content, environmentId);

      default:
        throw new Error(
          `Unable to automatically detect format or unsupported format: ${detectedFormat}. Please select Terraform or Kubernetes explicitly.`
        );
    }
  }

  /**
   * Sniff format from content tokens.
   */
  public static detectFormat(content: string): "terraform" | "kubernetes" | "unknown" {
    const trimmed = content.trim();

    if (
      trimmed.includes('"resource_changes"') ||
      trimmed.includes('"format_version"') ||
      trimmed.includes('"terraform_version"')
    ) {
      return "terraform";
    }

    if (
      trimmed.includes("apiVersion:") ||
      trimmed.includes("kind: Deployment") ||
      trimmed.includes("kind: Service") ||
      trimmed.includes("kind: Ingress") ||
      trimmed.includes("kind: StatefulSet") ||
      trimmed.includes('"kind": "Deployment"')
    ) {
      return "kubernetes";
    }

    // Try parsing as JSON to check if it's terraform state
    try {
      const obj = JSON.parse(trimmed);
      if (obj.resource_changes || obj.terraform_version || obj.values?.root_module) {
        return "terraform";
      }
      if (obj.kind && obj.apiVersion) {
        return "kubernetes";
      }
    } catch {
      // not JSON
    }

    return "unknown";
  }
}

