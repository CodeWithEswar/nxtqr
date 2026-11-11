/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Protocol Buffers & gRPC Protocol Adapter
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

export interface ProtoMessageField {
  name: string;
  type: string;
  fieldNumber: number;
  isRepeated: boolean;
  wireType: "varint" | "64-bit" | "length-delimited" | "32-bit";
}

export interface ProtoServiceRpc {
  name: string;
  requestType: string;
  responseType: string;
  isClientStreaming: boolean;
  isServerStreaming: boolean;
}

export interface ProtoParsedDocument {
  syntax: string;
  packageName?: string;
  services: Record<string, { name: string; rpcs: Record<string, ProtoServiceRpc> }>;
  messages: Record<string, {
    name: string;
    fields: Record<string, ProtoMessageField>;
    reservedNumbers: number[];
    reservedNames: string[];
  }>;
}

export class ProtobufAdapter implements ContractAdapter<ProtoParsedDocument, ProtoParsedDocument> {
  public readonly format: SpecificationFormat = "protobuf";

  public parse(input: string): ParseResult<ProtoParsedDocument> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { success: false, errors: ["Empty Protobuf definition input."] };
    }

    try {
      const doc = this.parseProto(trimmed);
      return { success: true, document: doc, errors: [] };
    } catch (err) {
      return { success: false, errors: [`Failed to parse Protobuf definition: ${(err as Error).message}`] };
    }
  }

  public validate(document: ProtoParsedDocument): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!document || !document.messages) {
      return { isValid: false, errors: ["Invalid Protobuf document."], warnings: [] };
    }

    // Check duplicate field numbers in same message
    for (const [msgName, msg] of Object.entries(document.messages)) {
      const seenNumbers = new Set<number>();
      for (const f of Object.values(msg.fields)) {
        if (seenNumbers.has(f.fieldNumber)) {
          errors.push(`Message "${msgName}" contains duplicate field number tag ${f.fieldNumber}.`);
        }
        seenNumbers.add(f.fieldNumber);

        if (msg.reservedNumbers.includes(f.fieldNumber)) {
          errors.push(`Message "${msgName}" uses field number ${f.fieldNumber} which is in the reserved list.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public normalize(
    document: ProtoParsedDocument,
    options?: { contractId?: string; graphRevision?: string }
  ): NormalizationResult<ProtoParsedDocument> {
    const operations: ContractOperation[] = [];
    const schemas: Record<string, NormalizedSchema> = {};
    const warnings: string[] = [];

    const now = new Date().toISOString();
    const graphRev = options?.graphRevision || "rev-1";

    // 1. Normalize Messages into Schemas
    for (const [msgName, msg] of Object.entries(document.messages)) {
      const properties: Record<string, NormalizedSchema> = {};

      for (const [fName, field] of Object.entries(msg.fields)) {
        properties[fName] = {
          id: `${msgName}.${fName}`,
          name: fName,
          type: field.isRepeated ? "array" : this.mapProtoType(field.type),
          fieldNumber: field.fieldNumber,
          wireType: field.wireType,
          isNullable: false,
        };
      }

      schemas[msgName] = {
        id: msgName,
        name: msgName,
        type: "object",
        properties,
        isNullable: false,
      };
    }

    // 2. Normalize Services and RPCs into Operations
    for (const [serviceName, service] of Object.entries(document.services)) {
      for (const [rpcName, rpc] of Object.entries(service.rpcs)) {
        operations.push({
          id: `op-grpc-${serviceName}-${rpcName}`,
          operationId: `${serviceName}.${rpcName}`,
          protocol: "grpc",
          rpcName,
          summary: `gRPC RPC ${serviceName}/${rpcName}`,
          requestSchemaRef: rpc.requestType,
          responseSchemas: { "200": rpc.responseType },
          isDeprecated: false,
          provenance: {
            source: "declared",
            sourceIdentifier: `protobuf:rpc ${serviceName}/${rpcName}`,
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

    // Removed RPC methods
    for (const opId of baseOpMap.keys()) {
      if (!candOpMap.has(opId)) {
        removedOperations.push(opId);
        findings.push({
          id: `find-grpc-removed-rpc-${opId}`,
          contractId,
          baselineRevisionId,
          candidateRevisionId,
          classification: "breaking",
          ruleId: "grpc_rpc_removed",
          affectedOperationIds: [opId],
          affectedConsumerIds: [],
          evidence: [`gRPC RPC method "${opId}" removed`],
          explanation: `RPC method "${opId}" was removed. gRPC clients invoking this RPC will receive UNIMPLEMENTED status.`,
          remediation: "Retain RPC method signature.",
        });
      }
    }

    // Added RPC methods (Safe)
    for (const opId of candOpMap.keys()) {
      if (!baseOpMap.has(opId)) {
        addedOperations.push(opId);
      }
    }

    // Modified RPC methods (signature change)
    for (const [opId, baseOp] of baseOpMap.entries()) {
      const candOp = candOpMap.get(opId);
      if (!candOp) continue;

      if (baseOp.requestSchemaRef !== candOp.requestSchemaRef) {
        modifiedOperations.push(opId);
        findings.push({
          id: `find-grpc-req-type-change-${opId}`,
          contractId,
          baselineRevisionId,
          candidateRevisionId,
          classification: "breaking",
          ruleId: "grpc_rpc_request_type_changed",
          affectedOperationIds: [opId],
          affectedConsumerIds: [],
          evidence: [`Request type changed from ${baseOp.requestSchemaRef} to ${candOp.requestSchemaRef}`],
          explanation: `RPC request message type was altered. Client stubs cannot invoke this method.`,
          remediation: "Create a new RPC method instead of altering existing parameter type.",
        });
      }
    }

    // Protobuf Message & Wire Tag Comparison (Crucial!)
    for (const [msgName, baseMsg] of Object.entries(baselineSchemas)) {
      const candMsg = candidateSchemas[msgName];
      if (!candMsg) continue;

      const baseTagToField = new Map<number, { name: string; schema: NormalizedSchema }>();
      for (const [fName, fSchema] of Object.entries(baseMsg.properties || {})) {
        if (fSchema.fieldNumber) {
          baseTagToField.set(fSchema.fieldNumber, { name: fName, schema: fSchema });
        }
      }

      const candTagToField = new Map<number, { name: string; schema: NormalizedSchema }>();
      for (const [fName, fSchema] of Object.entries(candMsg.properties || {})) {
        if (fSchema.fieldNumber) {
          candTagToField.set(fSchema.fieldNumber, { name: fName, schema: fSchema });
        }
      }

      // Check field number reuse or wire type changes
      for (const [tag, baseField] of baseTagToField.entries()) {
        const candField = candTagToField.get(tag);
        if (!candField) {
          // Field removed
          findings.push({
            id: `find-proto-field-removed-${msgName}-${tag}`,
            contractId,
            baselineRevisionId,
            candidateRevisionId,
            classification: "potentially_breaking",
            ruleId: "protobuf_field_removed_without_reserved",
            affectedOperationIds: [],
            affectedConsumerIds: [],
            evidence: [`Field "${baseField.name}" (tag: ${tag}) removed from message "${msgName}"`],
            explanation: `Field tag ${tag} was removed. If another field reuses tag ${tag} in the future, wire corruption will occur.`,
            remediation: `Add "reserved ${tag};" to message ${msgName}.`,
          });
        } else {
          // Check wire type compatibility
          if (baseField.schema.wireType && candField.schema.wireType && baseField.schema.wireType !== candField.schema.wireType) {
            findings.push({
              id: `find-proto-wiretype-changed-${msgName}-${tag}`,
              contractId,
              baselineRevisionId,
              candidateRevisionId,
              classification: "breaking",
              ruleId: "protobuf_wire_type_incompatible",
              affectedOperationIds: [],
              affectedConsumerIds: [],
              evidence: [
                `Field tag ${tag} changed wire type from ${baseField.schema.wireType} to ${candField.schema.wireType}`,
              ],
              explanation: `Field tag ${tag} (${candField.name}) wire encoding changed from ${baseField.schema.wireType} to ${candField.schema.wireType}. Wire decoding will fail with wire format corruption.`,
              remediation: "Never change wire types of an existing Protobuf field tag.",
            });
          }
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

  private mapProtoType(type: string): NormalizedSchema["type"] {
    switch (type) {
      case "int32":
      case "int64":
      case "uint32":
      case "uint64":
      case "sint32":
      case "sint64":
        return "integer";
      case "float":
      case "double":
        return "number";
      case "string":
        return "string";
      case "bool":
        return "boolean";
      case "bytes":
        return "string";
      default:
        return "object";
    }
  }

  private getWireType(type: string): ProtoMessageField["wireType"] {
    switch (type) {
      case "int32":
      case "int64":
      case "uint32":
      case "uint64":
      case "sint32":
      case "sint64":
      case "bool":
        return "varint";
      case "fixed64":
      case "sfixed64":
      case "double":
        return "64-bit";
      case "string":
      case "bytes":
        return "length-delimited";
      case "fixed32":
      case "sfixed32":
      case "float":
        return "32-bit";
      default:
        return "length-delimited"; // embedded messages are length-delimited
    }
  }

  private parseProto(protoStr: string): ProtoParsedDocument {
    const services: ProtoParsedDocument["services"] = {};
    const messages: ProtoParsedDocument["messages"] = {};
    let syntax = "proto3";
    let packageName: string | undefined;

    const lines = protoStr.split("\n");
    let currentService: string | null = null;
    let currentMessage: string | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//")) continue;

      if (line.startsWith("syntax")) {
        const m = line.match(/syntax\s*=\s*["']([^"']+)["']/);
        if (m) syntax = m[1];
        continue;
      }

      if (line.startsWith("package")) {
        const m = line.match(/package\s+([^;]+);/);
        if (m) packageName = m[1].trim();
        continue;
      }

      if (line.startsWith("service")) {
        const m = line.match(/service\s+([A-Za-z0-9_]+)\s*\{/);
        if (m) {
          currentService = m[1];
          services[currentService] = { name: currentService, rpcs: {} };
        }
        continue;
      }

      if (line.startsWith("message")) {
        const m = line.match(/message\s+([A-Za-z0-9_]+)\s*\{/);
        if (m) {
          currentMessage = m[1];
          messages[currentMessage] = {
            name: currentMessage,
            fields: {},
            reservedNumbers: [],
            reservedNames: [],
          };
        }
        continue;
      }

      if (line === "}") {
        currentService = null;
        currentMessage = null;
        continue;
      }

      // Parse RPC within service
      if (currentService && line.startsWith("rpc")) {
        // e.g. rpc GetOrder (GetOrderRequest) returns (OrderResponse);
        const rpcMatch = line.match(/rpc\s+([A-Za-z0-9_]+)\s*\(\s*([A-Za-z0-9_]+)\s*\)\s*returns\s*\(\s*([A-Za-z0-9_]+)\s*\)/);
        if (rpcMatch) {
          const rpcName = rpcMatch[1];
          const reqType = rpcMatch[2];
          const resType = rpcMatch[3];
          services[currentService].rpcs[rpcName] = {
            name: rpcName,
            requestType: reqType,
            responseType: resType,
            isClientStreaming: false,
            isServerStreaming: false,
          };
        }
        continue;
      }

      // Parse field within message
      if (currentMessage) {
        if (line.startsWith("reserved")) {
          const numbers = line.match(/\b\d+\b/g);
          if (numbers) {
            messages[currentMessage].reservedNumbers.push(...numbers.map(Number));
          }
          continue;
        }

        // e.g. string order_id = 1; or repeated string tags = 2;
        const isRepeated = line.startsWith("repeated");
        const cleanLine = isRepeated ? line.replace(/^repeated\s+/, "") : line;
        const fMatch = cleanLine.match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_]+)\s*=\s*(\d+);/);
        if (fMatch) {
          const fType = fMatch[1];
          const fName = fMatch[2];
          const fTag = parseInt(fMatch[3], 10);

          messages[currentMessage].fields[fName] = {
            name: fName,
            type: fType,
            fieldNumber: fTag,
            isRepeated,
            wireType: this.getWireType(fType),
          };
        }
      }
    }

    return { syntax, packageName, services, messages };
  }
}
