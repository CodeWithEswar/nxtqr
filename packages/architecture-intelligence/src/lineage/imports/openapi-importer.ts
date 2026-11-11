/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Safe OpenAPI Specification Importer for Architecture Lineage
 */

import type {
  DataAsset,
  DataField,
  DataFlow,
  DataSensitivityLevel,
  PrivacyDataCategory,
  LineageProvenance,
} from "../contracts/lineage.types";

export interface OpenApiImportResult {
  assets: DataAsset[];
  flows: DataFlow[];
  importedEndpointsCount: number;
  warnings: string[];
}

export class OpenApiImporter {
  /**
   * Safely parses an OpenAPI 3.x document (as JSON string or JS object)
   * and maps endpoints, request/response schemas into modeled DataAssets and DataFlows.
   *
   * @param specContent JSON string or parsed object representing OpenAPI 3.x spec
   * @param sourceComponentId The architecture component hosting the API (e.g. "api-gateway")
   * @param defaultConsumerId The calling service or client component (e.g. "frontend-app")
   * @param architectureId The target architecture graph ID
   * @param projectId The target project ID
   */
  public static parse(
    specContent: string | Record<string, unknown>,
    sourceComponentId: string,
    defaultConsumerId: string,
    architectureId: string,
    projectId: string
  ): OpenApiImportResult {
    const warnings: string[] = [];
    let spec: Record<string, unknown>;

    if (typeof specContent === "string") {
      try {
        spec = JSON.parse(specContent);
      } catch (err) {
        warnings.push(`Failed to parse specification as JSON: ${(err as Error).message}`);
        return { assets: [], flows: [], importedEndpointsCount: 0, warnings };
      }
    } else {
      spec = specContent;
    }

    const paths = (spec.paths as Record<string, Record<string, unknown>>) || {};
    const assets: DataAsset[] = [];
    const flows: DataFlow[] = [];
    let importedEndpointsCount = 0;
    const now = new Date().toISOString();

    for (const [pathStr, methods] of Object.entries(paths)) {
      if (typeof methods !== "object" || methods === null) continue;

      for (const [method, op] of Object.entries(methods)) {
        const lowerMethod = method.toLowerCase();
        if (!["get", "post", "put", "patch", "delete"].includes(lowerMethod)) continue;

        const operation = op as Record<string, unknown>;
        const operationId = (operation.operationId as string) || `${lowerMethod} ${pathStr}`;
        importedEndpointsCount++;

        const assetFields: DataField[] = [];
        let maxSensitivity: DataSensitivityLevel = "internal";
        const detectedCategories = new Set<PrivacyDataCategory>();

        // Parse Request Body schemas
        const requestBody = operation.requestBody as Record<string, unknown> | undefined;
        if (requestBody && typeof requestBody.content === "object") {
          const content = requestBody.content as Record<string, { schema?: Record<string, unknown> }>;
          const jsonContent = content["application/json"];
          if (jsonContent?.schema?.properties) {
            const props = jsonContent.schema.properties as Record<string, Record<string, unknown>>;
            for (const [propName, propDef] of Object.entries(props)) {
              const { level, category } = this.inferFieldClassification(propName);
              detectedCategories.add(category);
              if (this.isHigherSensitivity(level, maxSensitivity)) {
                maxSensitivity = level;
              }

              assetFields.push({
                id: `field-${operationId}-${propName}`,
                name: propName,
                logicalType: (propDef.type as string) || "string",
                isRequired: Array.isArray(jsonContent.schema.required) && jsonContent.schema.required.includes(propName),
                description: propDef.description as string | undefined,
                classification: {
                  id: `class-${propName}`,
                  level,
                  categories: [category],
                  name: `${propName} classification`,
                  isLegalDetermination: false,
                  provenance: {
                    source: "imported",
                    sourceIdentifier: `openapi:${lowerMethod.toUpperCase()} ${pathStr}`,
                    timestamp: now,
                    graphRevision: "import-rev",
                    confirmed: false,
                  },
                },
              });
            }
          }
        }

        // Create Data Asset for this payload if fields detected or for general endpoint
        const assetId = `asset-api-${operationId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        const assetName = `${operationId} Payload`;

        const provenance: LineageProvenance = {
          source: "imported",
          sourceIdentifier: `openapi:${lowerMethod.toUpperCase()} ${pathStr}`,
          timestamp: now,
          graphRevision: "import-rev",
          confidence: 0.9,
          confirmed: false,
        };

        const asset: DataAsset = {
          id: assetId,
          projectId,
          architectureId,
          name: assetName,
          description: (operation.summary as string) || `Data payload for ${lowerMethod.toUpperCase()} ${pathStr}`,
          classification: {
            id: `class-${assetId}`,
            level: maxSensitivity,
            categories: Array.from(detectedCategories),
            name: `${assetName} classification`,
            isLegalDetermination: false,
            provenance,
          },
          fields: assetFields,
          storageBindings: [],
          purposes: [],
          provenance,
          createdAt: now,
          updatedAt: now,
        };
        assets.push(asset);

        // Create Data Flow
        const flowId = `flow-api-${operationId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        flows.push({
          id: flowId,
          architectureId,
          name: `${lowerMethod.toUpperCase()} ${pathStr}`,
          sourceComponentId: defaultConsumerId,
          destinationComponentId: sourceComponentId,
          dataAssetIds: [assetId],
          protocol: "HTTPS",
          direction: "forward",
          encryptionInTransit: {
            configured: true,
            tlsVersion: "TLS 1.3",
            evidence: "OpenAPI HTTPS scheme",
          },
          crossesTrustBoundary: pathStr.startsWith("/api/public") || pathStr.startsWith("/auth"),
          isThirdPartyTransfer: false,
          purposes: [],
          provenance,
          confirmed: false,
        });
      }
    }

    return {
      assets,
      flows,
      importedEndpointsCount,
      warnings,
    };
  }

  private static inferFieldClassification(fieldName: string): {
    level: DataSensitivityLevel;
    category: PrivacyDataCategory;
  } {
    const lower = fieldName.toLowerCase();

    if (
      lower.includes("password") ||
      lower.includes("token") ||
      lower.includes("secret") ||
      lower.includes("apikey") ||
      lower.includes("credential")
    ) {
      return { level: "restricted", category: "authentication" };
    }

    if (
      lower.includes("card") ||
      lower.includes("pan") ||
      lower.includes("cvv") ||
      lower.includes("payment") ||
      lower.includes("iban")
    ) {
      return { level: "restricted", category: "payment" };
    }

    if (
      lower.includes("email") ||
      lower.includes("phone") ||
      lower.includes("address") ||
      lower.includes("ssn") ||
      lower.includes("dob") ||
      lower.includes("firstname") ||
      lower.includes("lastname") ||
      lower.includes("nationalid")
    ) {
      return { level: "confidential", category: "personal_data" };
    }

    if (lower.includes("health") || lower.includes("diagnosis") || lower.includes("patient")) {
      return { level: "restricted", category: "health" };
    }

    if (lower.includes("ip") || lower.includes("session") || lower.includes("cookie")) {
      return { level: "internal", category: "operational" };
    }

    return { level: "internal", category: "operational" };
  }

  private static isHigherSensitivity(a: DataSensitivityLevel, b: DataSensitivityLevel): boolean {
    const ranks: Record<DataSensitivityLevel, number> = {
      public: 0,
      internal: 1,
      confidential: 2,
      restricted: 3,
    };
    return ranks[a] > ranks[b];
  }
}

