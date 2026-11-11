/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * GraphQL SDL & Introspection Adapter
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
  CompatibilityPolicy,
  CompatibilityFinding,
  SpecificationFormat,
} from "../contracts/contract.types";

export interface GraphQLParsedDocument {
  types: Record<string, {
    kind: "OBJECT" | "INPUT_OBJECT" | "ENUM" | "INTERFACE" | "UNION" | "SCALAR";
    name: string;
    description?: string;
    fields?: Record<string, {
      name: string;
      type: string;
      isNonNull: boolean;
      isList: boolean;
      args?: Record<string, { name: string; type: string; isNonNull: boolean; defaultValue?: string }>;
    }>;
    enumValues?: string[];
  }>;
  rootQueries: string[];
  rootMutations: string[];
}

export class GraphQLAdapter implements ContractAdapter<GraphQLParsedDocument, GraphQLParsedDocument> {
  public readonly format: SpecificationFormat = "graphql_sdl";

  public parse(input: string): ParseResult<GraphQLParsedDocument> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { success: false, errors: ["Empty GraphQL specification input."] };
    }

    try {
      // Check if it's introspection JSON
      if (trimmed.startsWith("{")) {
        const json = JSON.parse(trimmed);
        const schema = json.data?.__schema || json.__schema;
        if (schema) {
          return { success: true, document: this.parseIntrospection(schema), errors: [] };
        }
      }

      // Parse SDL
      const doc = this.parseSDL(trimmed);
      return { success: true, document: doc, errors: [] };
    } catch (err) {
      return { success: false, errors: [`Failed to parse GraphQL specification: ${(err as Error).message}`] };
    }
  }

  public validate(document: GraphQLParsedDocument): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!document || !document.types) {
      return { isValid: false, errors: ["Invalid GraphQL document structure."], warnings: [] };
    }

    if (!document.types["Query"]) {
      warnings.push("GraphQL schema does not define a root 'Query' type.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public normalize(
    document: GraphQLParsedDocument,
    options?: { contractId?: string; graphRevision?: string }
  ): NormalizationResult<GraphQLParsedDocument> {
    const operations: ContractOperation[] = [];
    const schemas: Record<string, NormalizedSchema> = {};
    const warnings: string[] = [];

    const now = new Date().toISOString();
    const graphRev = options?.graphRevision || "rev-1";

    // Normalize types into schemas
    for (const [typeName, typeDef] of Object.entries(document.types)) {
      if (typeName === "Query" || typeName === "Mutation" || typeName === "Subscription") {
        continue; // Handled as operations
      }

      const properties: Record<string, NormalizedSchema> = {};
      const requiredProps: string[] = [];

      for (const [fName, field] of Object.entries(typeDef.fields || {})) {
        if (field.isNonNull) {
          requiredProps.push(fName);
        }
        properties[fName] = {
          id: `${typeName}.${fName}`,
          name: fName,
          type: field.isList ? "array" : this.mapGraphQLScalar(field.type),
          isNullable: !field.isNonNull,
        };
      }

      schemas[typeName] = {
        id: typeName,
        name: typeName,
        type: typeDef.kind === "ENUM" ? "enum" : "object",
        enumValues: typeDef.enumValues,
        requiredProperties: requiredProps.length > 0 ? requiredProps : undefined,
        properties: Object.keys(properties).length > 0 ? properties : undefined,
        isNullable: false,
      };
    }

    // Normalize root Query fields into operations
    const queryType = document.types["Query"];
    if (queryType?.fields) {
      for (const [fieldName, field] of Object.entries(queryType.fields)) {
        operations.push({
          id: `op-query-${fieldName}`,
          operationId: `query_${fieldName}`,
          protocol: "graphql",
          queryType: "query",
          summary: `Query ${fieldName}`,
          parameters: Object.values(field.args || {}).map((arg) => ({
            name: arg.name,
            in: "query",
            required: arg.isNonNull,
            schema: {
              id: `arg-${fieldName}-${arg.name}`,
              type: this.mapGraphQLScalar(arg.type),
              isNullable: !arg.isNonNull,
            },
          })),
          responseSchemas: { "200": field.type },
          isDeprecated: false,
          provenance: {
            source: "declared",
            sourceIdentifier: `graphql:query ${fieldName}`,
            timestamp: now,
            graphRevision: graphRev,
            confirmed: true,
          },
        });
      }
    }

    // Normalize root Mutation fields into operations
    const mutationType = document.types["Mutation"];
    if (mutationType?.fields) {
      for (const [fieldName, field] of Object.entries(mutationType.fields)) {
        operations.push({
          id: `op-mutation-${fieldName}`,
          operationId: `mutation_${fieldName}`,
          protocol: "graphql",
          queryType: "mutation",
          summary: `Mutation ${fieldName}`,
          parameters: Object.values(field.args || {}).map((arg) => ({
            name: arg.name,
            in: "query",
            required: arg.isNonNull,
            schema: {
              id: `arg-${fieldName}-${arg.name}`,
              type: this.mapGraphQLScalar(arg.type),
              isNullable: !arg.isNonNull,
            },
          })),
          responseSchemas: { "200": field.type },
          isDeprecated: false,
          provenance: {
            source: "declared",
            sourceIdentifier: `graphql:mutation ${fieldName}`,
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
    _policy: CompatibilityPolicy,
    contractId: string,
    baselineRevisionId: string,
    candidateRevisionId: string
  ): ProtocolComparisonResult {
    const findings: CompatibilityFinding[] = [];
    const addedOperations: string[] = [];
    const removedOperations: string[] = [];
    const modifiedOperations: string[] = [];

    const baseOpMap = new Map(baselineOps.map((o) => [o.operationId, o]));
    const candOpMap = new Map(candidateOps.map((o) => [o.operationId, o]));

    // Check removed operations (Breaking)
    for (const [opId, baseOp] of baseOpMap.entries()) {
      if (!candOpMap.has(opId)) {
        removedOperations.push(opId);
        findings.push({
          id: `find-graphql-removed-op-${opId}`,
          contractId,
          baselineRevisionId,
          candidateRevisionId,
          classification: "breaking",
          ruleId: "graphql_field_removed_from_query_root",
          affectedOperationIds: [opId],
          affectedConsumerIds: [],
          evidence: [`Field "${opId}" removed from root ${baseOp.queryType}`],
          explanation: `Root field "${opId}" was removed. Existing client queries requesting this field will encounter GraphQL execution errors.`,
          remediation: `Restore field or deprecate with @deprecated directive before removal.`,
        });
      }
    }

    // Check added operations (Non-breaking in GraphQL because clients specify selection sets)
    for (const opId of candOpMap.keys()) {
      if (!baseOpMap.has(opId)) {
        addedOperations.push(opId);
      }
    }

    // Check modified operations (Arguments)
    for (const [opId, baseOp] of baseOpMap.entries()) {
      const candOp = candOpMap.get(opId);
      if (!candOp) continue;

      const baseArgs = new Map(baseOp.parameters?.map((p) => [p.name, p]) || []);
      for (const candParam of candOp.parameters || []) {
        if (!baseArgs.has(candParam.name) && candParam.required) {
          modifiedOperations.push(opId);
          findings.push({
            id: `find-graphql-new-nonnull-arg-${opId}-${candParam.name}`,
            contractId,
            baselineRevisionId,
            candidateRevisionId,
            classification: "breaking",
            ruleId: "graphql_new_non_null_argument_added",
            affectedOperationIds: [opId],
            affectedConsumerIds: [],
            evidence: [`Added non-null argument "${candParam.name}" to "${opId}"`],
            explanation: `Added new required argument "${candParam.name}". Existing client queries omitting this argument will fail schema validation.`,
            remediation: "Make new argument nullable or provide a default value.",
          });
        }
      }
    }

    // Check Schema Types and Fields
    for (const [typeName, baseSchema] of Object.entries(baselineSchemas)) {
      const candSchema = candidateSchemas[typeName];
      if (!candSchema) {
        findings.push({
          id: `find-graphql-type-removed-${typeName}`,
          contractId,
          baselineRevisionId,
          candidateRevisionId,
          classification: "breaking",
          ruleId: "graphql_type_removed",
          affectedOperationIds: [],
          affectedConsumerIds: [],
          evidence: [`Type "${typeName}" removed`],
          explanation: `GraphQL type "${typeName}" was removed from the schema.`,
          remediation: "Preserve type definition.",
        });
        continue;
      }

      // Check removed fields on output type (Breaking)
      for (const [propName] of Object.entries(baseSchema.properties || {})) {
        if (!candSchema.properties || !candSchema.properties[propName]) {
          findings.push({
            id: `find-graphql-field-removed-${typeName}.${propName}`,
            contractId,
            baselineRevisionId,
            candidateRevisionId,
            classification: "breaking",
            ruleId: "graphql_output_field_removed",
            affectedOperationIds: [],
            affectedConsumerIds: [],
            evidence: [`Field "${typeName}.${propName}" removed`],
            explanation: `Field "${propName}" was removed from GraphQL type "${typeName}". Queries requesting this field will break.`,
            remediation: "Mark field with @deprecated instead of immediate deletion.",
          });
        }
      }
    }

    return {
      findings,
      addedOperations,
      removedOperations,
      modifiedOperations,
    };
  }

  private mapGraphQLScalar(type: string): NormalizedSchema["type"] {
    switch (type.replace(/[!\[\]]/g, "")) {
      case "Int":
        return "integer";
      case "Float":
        return "number";
      case "String":
      case "ID":
        return "string";
      case "Boolean":
        return "boolean";
      default:
        return "object";
    }
  }

  private parseSDL(sdl: string): GraphQLParsedDocument {
    const types: GraphQLParsedDocument["types"] = {};
    const rootQueries: string[] = [];
    const rootMutations: string[] = [];

    // Simple deterministic tokenizer for SDL types and fields
    const typeBlocks = sdl.split(/\btype\s+/).filter(Boolean);

    for (const block of typeBlocks) {
      const nameMatch = block.match(/^([A-Za-z0-9_]+)/);
      if (!nameMatch) continue;

      const typeName = nameMatch[1];
      const bodyMatch = block.match(/\{([^}]*)\}/);
      const fields: Record<string, any> = {};

      if (bodyMatch) {
        const fieldLines = bodyMatch[1].split("\n");
        for (const line of fieldLines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          // e.g. getUser(id: ID!): User
          const fMatch = trimmed.match(/^([A-Za-z0-9_]+)(\(([^)]*)\))?:\s*([A-Za-z0-9_!\[\]]+)/);
          if (fMatch) {
            const fName = fMatch[1];
            const rawArgs = fMatch[3] || "";
            const rawType = fMatch[4];
            const isNonNull = rawType.endsWith("!");
            const isList = rawType.startsWith("[");
            const cleanType = rawType.replace(/[!\[\]]/g, "");

            const args: Record<string, any> = {};
            if (rawArgs) {
              const argPairs = rawArgs.split(",");
              for (const argPair of argPairs) {
                const aParts = argPair.split(":");
                if (aParts.length === 2) {
                  const aName = aParts[0].trim();
                  const aType = aParts[1].trim();
                  args[aName] = {
                    name: aName,
                    type: aType.replace(/[!\[\]]/g, ""),
                    isNonNull: aType.endsWith("!"),
                  };
                }
              }
            }

            fields[fName] = {
              name: fName,
              type: cleanType,
              isNonNull,
              isList,
              args,
            };

            if (typeName === "Query") rootQueries.push(fName);
            if (typeName === "Mutation") rootMutations.push(fName);
          }
        }
      }

      types[typeName] = {
        kind: "OBJECT",
        name: typeName,
        fields,
      };
    }

    return { types, rootQueries, rootMutations };
  }

  private parseIntrospection(schema: Record<string, any>): GraphQLParsedDocument {
    const types: GraphQLParsedDocument["types"] = {};
    const rawTypes = (schema.types as Array<Record<string, any>>) || [];

    for (const t of rawTypes) {
      if (t.name?.startsWith("__")) continue; // Skip introspection meta types
      const fields: Record<string, any> = {};
      for (const f of t.fields || []) {
        fields[f.name] = {
          name: f.name,
          type: f.type?.name || "String",
          isNonNull: f.type?.kind === "NON_NULL",
          isList: f.type?.kind === "LIST",
        };
      }
      types[t.name] = {
        kind: t.kind || "OBJECT",
        name: t.name,
        fields,
      };
    }

    return { types, rootQueries: [], rootMutations: [] };
  }
}
