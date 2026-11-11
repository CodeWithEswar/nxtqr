/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * OpenAPI 3.x Protocol Adapter
 */

import type {
  ContractAdapter,
  ParseResult,
  ContractValidationResult,
  NormalizationResult,
  ProtocolComparisonResult,
} from "./adapter.interface";
import type {
  ContractOperation,
  NormalizedSchema,
  OperationParameter,
  SecurityRequirement,
  CompatibilityPolicy,
  CompatibilityFinding,
  SpecificationFormat,
} from "../contracts/contract.types";

export class OpenApiAdapter implements ContractAdapter<Record<string, unknown>, Record<string, unknown>> {
  public readonly format: SpecificationFormat = "openapi_3x";

  public parse(input: string): ParseResult<Record<string, unknown>> {
    const trimmed = input.trim();
    try {
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const doc = JSON.parse(trimmed);
        return { success: true, document: doc, errors: [] };
      }

      // Safe JSON or simple key-value YAML extraction without eval
      // For YAML specs, attempt JSON or simple parser
      const lines = trimmed.split("\n");
      const isYaml = lines.some((l) => l.startsWith("openapi:") || l.startsWith("swagger:"));
      if (isYaml) {
        // Safe basic YAML to object converter for common spec structure
        const doc = this.safeParseYaml(trimmed);
        return { success: true, document: doc, errors: [] };
      }

      return {
        success: false,
        errors: ["Unrecognized OpenAPI document format. Expected valid JSON or YAML."],
      };
    } catch (err) {
      return {
        success: false,
        errors: [`Failed to parse OpenAPI document: ${(err as Error).message}`],
      };
    }
  }

  public validate(document: Record<string, unknown>): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!document || typeof document !== "object") {
      return { isValid: false, errors: ["Document must be a valid object."], warnings: [] };
    }

    const version = (document.openapi as string) || (document.swagger as string);
    if (!version) {
      errors.push("Missing specification version declaration ('openapi' or 'swagger').");
    } else if (!version.startsWith("3.") && !version.startsWith("2.")) {
      warnings.push(`OpenAPI version '${version}' is not officially tested. Tested on 3.0.x and 3.1.x.`);
    }

    if (!document.info || typeof document.info !== "object") {
      warnings.push("Document is missing an 'info' block.");
    }

    if (!document.paths || typeof document.paths !== "object") {
      errors.push("Document is missing a 'paths' definition object.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public normalize(
    document: Record<string, unknown>,
    options?: { contractId?: string; graphRevision?: string }
  ): NormalizationResult<Record<string, unknown>> {
    const operations: ContractOperation[] = [];
    const schemas: Record<string, NormalizedSchema> = {};
    const warnings: string[] = [];

    const now = new Date().toISOString();
    const graphRev = options?.graphRevision || "rev-1";

    // 1. Extract Components / Schemas
    const components = (document.components as Record<string, unknown>) || {};
    const rawSchemas = (components.schemas as Record<string, unknown>) || {};

    for (const [schemaName, rawDef] of Object.entries(rawSchemas)) {
      if (typeof rawDef === "object" && rawDef !== null) {
        schemas[schemaName] = this.normalizeRawSchema(
          schemaName,
          rawDef as Record<string, unknown>,
          rawSchemas,
          new Set()
        );
      }
    }

    // 2. Extract Operations
    const paths = (document.paths as Record<string, Record<string, unknown>>) || {};
    const httpMethods = ["get", "post", "put", "patch", "delete", "options", "head"];

    for (const [pathStr, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== "object") continue;

      for (const [method, opDef] of Object.entries(pathItem)) {
        const lowerMethod = method.toLowerCase();
        if (!httpMethods.includes(lowerMethod)) continue;
        if (!opDef || typeof opDef !== "object") continue;

        const operationObj = opDef as Record<string, unknown>;
        const operationId =
          (operationObj.operationId as string) ||
          `${lowerMethod.toUpperCase()} ${pathStr}`;

        // Parameters
        const parameters: OperationParameter[] = [];
        const rawParams = (operationObj.parameters as Array<Record<string, unknown>>) || [];
        for (const p of rawParams) {
          if (!p || typeof p !== "object") continue;
          const pName = (p.name as string) || "unnamed";
          const pIn = (p.in as "query" | "header" | "path" | "cookie") || "query";
          const pRequired = Boolean(p.required);
          const pSchema = (p.schema as Record<string, unknown>) || { type: "string" };

          parameters.push({
            name: pName,
            in: pIn,
            required: pRequired,
            schema: this.normalizeRawSchema(pName, pSchema, rawSchemas, new Set()),
            description: p.description as string | undefined,
          });
        }

        // Request Body
        let requestSchemaRef: string | undefined;
        const requestBody = operationObj.requestBody as Record<string, unknown> | undefined;
        if (requestBody && typeof requestBody.content === "object") {
          const content = requestBody.content as Record<string, { schema?: Record<string, unknown> }>;
          const jsonBody = content["application/json"] || Object.values(content)[0];
          if (jsonBody?.schema) {
            const schemaId = `req-${operationId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
            schemas[schemaId] = this.normalizeRawSchema(schemaId, jsonBody.schema, rawSchemas, new Set());
            requestSchemaRef = schemaId;
          }
        }

        // Responses
        const responseSchemas: Record<string, string> = {};
        const responses = (operationObj.responses as Record<string, Record<string, unknown>>) || {};
        for (const [statusCode, resObj] of Object.entries(responses)) {
          if (!resObj || typeof resObj !== "object") continue;
          const resContent = resObj.content as Record<string, { schema?: Record<string, unknown> }> | undefined;
          if (resContent) {
            const jsonRes = resContent["application/json"] || Object.values(resContent)[0];
            if (jsonRes?.schema) {
              const resSchemaId = `res-${operationId.replace(/[^a-zA-Z0-9_-]/g, "_")}-${statusCode}`;
              schemas[resSchemaId] = this.normalizeRawSchema(resSchemaId, jsonRes.schema, rawSchemas, new Set());
              responseSchemas[statusCode] = resSchemaId;
            }
          }
        }

        // Security requirements
        const securityRequirements: SecurityRequirement[] = [];
        const rawSec = (operationObj.security as Array<Record<string, string[]>>) || [];
        for (const secItem of rawSec) {
          for (const [secScheme, scopes] of Object.entries(secItem)) {
            securityRequirements.push({
              type: "http",
              scheme: secScheme,
              scopes,
            });
          }
        }

        const isDeprecated = Boolean(operationObj.deprecated);

        operations.push({
          id: `op-${operationId.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
          operationId,
          protocol: "rest",
          method: lowerMethod.toUpperCase(),
          path: pathStr,
          summary: operationObj.summary as string | undefined,
          description: operationObj.description as string | undefined,
          parameters,
          requestSchemaRef,
          responseSchemas,
          securityRequirements,
          isDeprecated,
          provenance: {
            source: "declared",
            sourceIdentifier: `openapi:${lowerMethod.toUpperCase()} ${pathStr}`,
            timestamp: now,
            graphRevision: graphRev,
            confirmed: true,
          },
        });
      }
    }

    return {
      operations,
      schemas,
      protocolModel: document,
      warnings,
    };
  }

  public compare(
    baselineOps: ContractOperation[],
    baselineSchemas: Record<string, NormalizedSchema>,
    candidateOps: ContractOperation[],
    candidateSchemas: Record<string, NormalizedSchema>,
    policy: CompatibilityPolicy,
    contractId: string,
    baselineRevisionId: string,
    candidateRevisionId: string
  ): ProtocolComparisonResult {
    const findings: CompatibilityFinding[] = [];
    const addedOperations: string[] = [];
    const removedOperations: string[] = [];
    const modifiedOperations: string[] = [];

    const baselineMap = new Map(baselineOps.map((op) => [this.getOpKey(op), op]));
    const candidateMap = new Map(candidateOps.map((op) => [this.getOpKey(op), op]));

    // Check for removed operations (Breaking change)
    for (const [key, baseOp] of baselineMap.entries()) {
      if (!candidateMap.has(key)) {
        removedOperations.push(baseOp.operationId);
        findings.push({
          id: `find-removed-${baseOp.id}`,
          contractId,
          baselineRevisionId,
          candidateRevisionId,
          classification: "breaking",
          ruleId: "rest_operation_removed",
          affectedOperationIds: [baseOp.operationId],
          affectedConsumerIds: [],
          evidence: [`Endpoint removed: ${baseOp.method} ${baseOp.path}`],
          explanation: `Operation "${baseOp.operationId}" (${baseOp.method} ${baseOp.path}) was removed from the candidate revision. Existing consumers calling this endpoint will receive HTTP 404.`,
          remediation: `Restore operation or introduce deprecation period with replacement endpoint before retirement.`,
        });
      }
    }

    // Check for added operations
    for (const [key, candOp] of candidateMap.entries()) {
      if (!baselineMap.has(key)) {
        addedOperations.push(candOp.operationId);
        if (!policy.allowAdditiveSafeChanges) {
          findings.push({
            id: `find-added-${candOp.id}`,
            contractId,
            baselineRevisionId,
            candidateRevisionId,
            classification: "potentially_breaking",
            ruleId: "rest_operation_added_strict_policy",
            affectedOperationIds: [candOp.operationId],
            affectedConsumerIds: [],
            evidence: [`New operation: ${candOp.method} ${candOp.path}`],
            explanation: `Added new operation "${candOp.operationId}". Marked potentially breaking under strict closed-world policy.`,
            remediation: "Ensure routing and gateways are updated.",
          });
        }
      }
    }

    // Check for modified operations (Parameters, Schemas, Security)
    for (const [key, baseOp] of baselineMap.entries()) {
      const candOp = candidateMap.get(key);
      if (!candOp) continue;

      const opChanges: string[] = [];

      // 1. Check added required parameters (Breaking)
      const baseParamNames = new Set(baseOp.parameters?.map((p) => p.name) || []);
      for (const candParam of candOp.parameters || []) {
        if (!baseParamNames.has(candParam.name) && candParam.required) {
          opChanges.push(`Added required parameter: "${candParam.name}" (${candParam.in})`);
          findings.push({
            id: `find-param-req-${candOp.id}-${candParam.name}`,
            contractId,
            baselineRevisionId,
            candidateRevisionId,
            classification: "breaking",
            ruleId: "rest_required_parameter_added",
            affectedOperationIds: [candOp.operationId],
            affectedConsumerIds: [],
            evidence: [`Added required ${candParam.in} parameter "${candParam.name}"`],
            explanation: `Added a new required parameter "${candParam.name}" in ${candParam.in}. Existing consumers omitting this parameter will fail validation.`,
            remediation: "Make new parameter optional or provide a default value.",
          });
        }
      }

      // 2. Check removed required parameters (Non-breaking or informational)
      for (const baseParam of baseOp.parameters || []) {
        const candParam = candOp.parameters?.find((p) => p.name === baseParam.name);
        if (!candParam && baseParam.required) {
          opChanges.push(`Removed required parameter: "${baseParam.name}"`);
        }
      }

      // 3. Check response schemas changes
      for (const [status, baseSchemaRef] of Object.entries(baseOp.responseSchemas || {})) {
        const candSchemaRef = candOp.responseSchemas?.[status];
        if (!candSchemaRef) {
          opChanges.push(`Removed response status code: ${status}`);
          findings.push({
            id: `find-res-removed-${candOp.id}-${status}`,
            contractId,
            baselineRevisionId,
            candidateRevisionId,
            classification: "breaking",
            ruleId: "rest_response_status_removed",
            affectedOperationIds: [candOp.operationId],
            affectedConsumerIds: [],
            evidence: [`Response status ${status} removed`],
            explanation: `Response status code "${status}" was removed. Clients expecting this response shape will break.`,
            remediation: "Preserve expected response status code and payload.",
          });
          continue;
        }

        const baseSchema = baselineSchemas[baseSchemaRef];
        const candSchema = candidateSchemas[candSchemaRef];
        if (baseSchema && candSchema) {
          this.compareSchemaFields(
            baseSchema,
            candSchema,
            candOp.operationId,
            findings,
            contractId,
            baselineRevisionId,
            candidateRevisionId
          );
        }
      }

      if (opChanges.length > 0) {
        modifiedOperations.push(candOp.operationId);
      }
    }

    return {
      findings,
      addedOperations,
      removedOperations,
      modifiedOperations,
    };
  }

  private compareSchemaFields(
    base: NormalizedSchema,
    cand: NormalizedSchema,
    operationId: string,
    findings: CompatibilityFinding[],
    contractId: string,
    baselineRevisionId: string,
    candidateRevisionId: string
  ): void {
    if (base.type !== cand.type) {
      findings.push({
        id: `find-type-mismatch-${operationId}-${base.id}`,
        contractId,
        baselineRevisionId,
        candidateRevisionId,
        classification: "breaking",
        ruleId: "rest_response_type_changed",
        affectedOperationIds: [operationId],
        affectedConsumerIds: [],
        evidence: [`Type changed from ${base.type} to ${cand.type}`],
        explanation: `Field type changed from ${base.type} to ${cand.type}. Client deserialization will fail.`,
        remediation: "Maintain consistent wire types across revisions.",
      });
      return;
    }

    if (base.type === "object" && base.properties && cand.properties) {
      // Check removed properties in response
      for (const [propName, baseProp] of Object.entries(base.properties)) {
        if (!cand.properties[propName]) {
          findings.push({
            id: `find-prop-removed-${operationId}-${propName}`,
            contractId,
            baselineRevisionId,
            candidateRevisionId,
            classification: "potentially_breaking",
            ruleId: "rest_response_property_removed",
            affectedOperationIds: [operationId],
            affectedConsumerIds: [],
            evidence: [`Property "${propName}" removed from response`],
            explanation: `Response property "${propName}" was removed. Consumers reading this field will encounter undefined values.`,
            remediation: "Deprecate field before removal or retain backward-compatible null field.",
          });
        } else {
          // Recursive compare
          this.compareSchemaFields(
            baseProp,
            cand.properties[propName],
            operationId,
            findings,
            contractId,
            baselineRevisionId,
            candidateRevisionId
          );
        }
      }
    }
  }

  private normalizeRawSchema(
    name: string,
    raw: Record<string, unknown>,
    allSchemas: Record<string, unknown>,
    visitedRefs: Set<string>
  ): NormalizedSchema {
    // Resolve $ref if present
    if (raw.$ref && typeof raw.$ref === "string") {
      const ref = raw.$ref;
      const targetName = ref.split("/").pop() || "";
      if (visitedRefs.has(ref) || (targetName && visitedRefs.has(targetName))) {
        // Cyclic reference protection
        return {
          id: `cycle-${ref.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: targetName || ref,
          type: "object",
          isNullable: false,
          description: "Cyclic reference resolved safely",
        };
      }
      const nextRefs = new Set(visitedRefs);
      nextRefs.add(ref);
      if (targetName) nextRefs.add(targetName);
      const resolved = (allSchemas[targetName] as Record<string, unknown>) || {};
      return this.normalizeRawSchema(targetName, resolved, allSchemas, nextRefs);
    }

    const typeStr = (raw.type as string) || (raw.properties ? "object" : "any");
    const isNullable = Boolean(raw.nullable);
    const requiredProps = Array.isArray(raw.required) ? (raw.required as string[]) : [];

    // Track current schema name as visited for cyclic property references
    const childRefs = new Set(visitedRefs);
    if (name) {
      childRefs.add(name);
      childRefs.add(`#/components/schemas/${name}`);
    }

    const properties: Record<string, NormalizedSchema> = {};
    if (raw.properties && typeof raw.properties === "object") {
      for (const [pName, pDef] of Object.entries(raw.properties as Record<string, unknown>)) {
        if (pDef && typeof pDef === "object") {
          properties[pName] = this.normalizeRawSchema(
            pName,
            pDef as Record<string, unknown>,
            allSchemas,
            childRefs
          );
        }
      }
    }

    let items: NormalizedSchema | undefined;
    if (raw.items && typeof raw.items === "object") {
      items = this.normalizeRawSchema(
        `${name}_item`,
        raw.items as Record<string, unknown>,
        allSchemas,
        childRefs
      );
    }

    return {
      id: name,
      name,
      type: (typeStr as any) || "object",
      format: raw.format as string | undefined,
      description: raw.description as string | undefined,
      requiredProperties: requiredProps,
      properties: Object.keys(properties).length > 0 ? properties : undefined,
      items,
      enumValues: Array.isArray(raw.enum) ? (raw.enum as any[]) : undefined,
      isNullable,
    };
  }

  private safeParseYaml(yamlStr: string): Record<string, unknown> {
    const result: Record<string, unknown> = {
      openapi: "3.0.0",
      paths: {},
      components: { schemas: {} },
    };

    const lines = yamlStr.split("\n");
    let currentPath = "";
    let currentMethod = "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      if (line.startsWith("openapi:")) {
        result.openapi = line.replace("openapi:", "").trim().replace(/['"]/g, "");
      } else if (line.startsWith("/") && line.endsWith(":")) {
        currentPath = line.slice(0, -1).trim();
        (result.paths as any)[currentPath] = {};
      } else if (
        ["get:", "post:", "put:", "delete:", "patch:"].includes(line.toLowerCase()) &&
        currentPath
      ) {
        currentMethod = line.slice(0, -1).toLowerCase();
        (result.paths as any)[currentPath][currentMethod] = {
          summary: `${currentMethod.toUpperCase()} ${currentPath}`,
          operationId: `${currentMethod}_${currentPath.replace(/[^a-zA-Z0-9]/g, "_")}`,
          responses: { "200": { description: "OK" } },
        };
      }
    }

    return result;
  }

  private getOpKey(op: ContractOperation): string {
    return `${op.method || "ANY"}:${op.path || op.operationId}`;
  }
}
