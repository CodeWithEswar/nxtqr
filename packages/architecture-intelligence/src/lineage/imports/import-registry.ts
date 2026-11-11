/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Import Registry and Format Dispatcher
 */

import type { OpenApiImportResult } from "./openapi-importer";
import { OpenApiImporter } from "./openapi-importer";

export type LineageImportFormat = "openapi_json" | "openapi_yaml" | "custom_lineage_json";

export class LineageImportRegistry {
  /**
   * Detects the format of raw input content.
   */
  public static detectFormat(content: string): LineageImportFormat {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.openapi || parsed.swagger) {
          return "openapi_json";
        }
        if (parsed.assets || parsed.flows) {
          return "custom_lineage_json";
        }
      } catch {
        // Fallback
      }
      return "openapi_json";
    }

    if (trimmed.includes("openapi:") || trimmed.includes("swagger:")) {
      return "openapi_yaml";
    }

    return "openapi_json";
  }

  /**
   * Dispatches import based on format.
   */
  public static importSpecification(
    content: string,
    sourceComponentId: string,
    defaultConsumerId: string,
    architectureId: string,
    projectId: string
  ): OpenApiImportResult {
    const format = this.detectFormat(content);

    if (format === "openapi_json" || format === "openapi_yaml") {
      return OpenApiImporter.parse(content, sourceComponentId, defaultConsumerId, architectureId, projectId);
    }

    return {
      assets: [],
      flows: [],
      importedEndpointsCount: 0,
      warnings: [`Unsupported lineage import format: ${format}`],
    };
  }
}

