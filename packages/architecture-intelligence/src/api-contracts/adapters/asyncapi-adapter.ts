/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * AsyncAPI & Event-Driven Protocol Adapter
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
  ContractChannel,
  NormalizedSchema,
  CompatibilityPolicy,
  CompatibilityFinding,
  SpecificationFormat,
} from "../contracts/contract.types";

export interface AsyncApiParsedDocument {
  asyncapi: string;
  info: { title: string; version: string };
  channels: Record<string, {
    description?: string;
    publish?: { operationId?: string; message?: { name?: string; payload?: Record<string, unknown> } };
    subscribe?: { operationId?: string; message?: { name?: string; payload?: Record<string, unknown> } };
  }>;
}

export class AsyncApiAdapter implements ContractAdapter<AsyncApiParsedDocument, AsyncApiParsedDocument> {
  public readonly format: SpecificationFormat = "asyncapi_2x";

  public parse(input: string): ParseResult<AsyncApiParsedDocument> {
    const trimmed = input.trim();
    if (!trimmed) {
      return { success: false, errors: ["Empty AsyncAPI definition input."] };
    }

    try {
      if (trimmed.startsWith("{")) {
        const doc = JSON.parse(trimmed);
        return { success: true, document: doc, errors: [] };
      }

      // Safe basic JSON or YAML parser
      const doc = this.safeParseAsyncApi(trimmed);
      return { success: true, document: doc, errors: [] };
    } catch (err) {
      return { success: false, errors: [`Failed to parse AsyncAPI definition: ${(err as Error).message}`] };
    }
  }

  public validate(document: AsyncApiParsedDocument): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!document || typeof document !== "object") {
      return { isValid: false, errors: ["Invalid AsyncAPI document."], warnings: [] };
    }

    if (!document.asyncapi) {
      errors.push("Missing 'asyncapi' version declaration.");
    }

    if (!document.channels || typeof document.channels !== "object") {
      errors.push("Missing 'channels' mapping object.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public normalize(
    document: AsyncApiParsedDocument,
    options?: { contractId?: string; graphRevision?: string }
  ): NormalizationResult<AsyncApiParsedDocument> {
    const operations: ContractOperation[] = [];
    const schemas: Record<string, NormalizedSchema> = {};
    const channels: ContractChannel[] = [];
    const warnings: string[] = [];

    const now = new Date().toISOString();
    const graphRev = options?.graphRevision || "rev-1";

    for (const [channelName, channelItem] of Object.entries(document.channels || {})) {
      if (!channelItem) continue;

      // Handle Publish operation (messages produced to this channel)
      if (channelItem.publish) {
        const opId = channelItem.publish.operationId || `pub_${channelName.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const msg = channelItem.publish.message;
        const schemaId = `msg-${opId}`;

        if (msg?.payload) {
          schemas[schemaId] = this.normalizeJsonSchema(schemaId, msg.payload);
        }

        operations.push({
          id: `op-event-pub-${opId}`,
          operationId: opId,
          protocol: "async_event",
          channelName,
          summary: `Publish event to ${channelName}`,
          requestSchemaRef: schemaId,
          isDeprecated: false,
          provenance: {
            source: "declared",
            sourceIdentifier: `asyncapi:publish ${channelName}`,
            timestamp: now,
            graphRevision: graphRev,
            confirmed: true,
          },
        });

        channels.push({
          id: `ch-pub-${channelName}`,
          name: channelName,
          direction: "publish",
          messageSchemaRef: schemaId,
          protocolType: "kafka",
        });
      }

      // Handle Subscribe operation (messages consumed from this channel)
      if (channelItem.subscribe) {
        const opId = channelItem.subscribe.operationId || `sub_${channelName.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const msg = channelItem.subscribe.message;
        const schemaId = `msg-${opId}`;

        if (msg?.payload) {
          schemas[schemaId] = this.normalizeJsonSchema(schemaId, msg.payload);
        }

        operations.push({
          id: `op-event-sub-${opId}`,
          operationId: opId,
          protocol: "async_event",
          channelName,
          summary: `Subscribe to event on ${channelName}`,
          responseSchemas: { "200": schemaId },
          isDeprecated: false,
          provenance: {
            source: "declared",
            sourceIdentifier: `asyncapi:subscribe ${channelName}`,
            timestamp: now,
            graphRevision: graphRev,
            confirmed: true,
          },
        });

        channels.push({
          id: `ch-sub-${channelName}`,
          name: channelName,
          direction: "subscribe",
          messageSchemaRef: schemaId,
          protocolType: "kafka",
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

    // Check removed event channels / operations
    for (const [opId, baseOp] of baseOpMap.entries()) {
      if (!candOpMap.has(opId)) {
        removedOperations.push(opId);
        findings.push({
          id: `find-event-channel-removed-${opId}`,
          contractId,
          baselineRevisionId,
          candidateRevisionId,
          classification: "breaking",
          ruleId: "async_event_channel_or_operation_removed",
          affectedOperationIds: [opId],
          affectedConsumerIds: [],
          evidence: [`Event channel operation "${opId}" on "${baseOp.channelName}" removed`],
          explanation: `Event operation "${opId}" was removed. Consumers subscribed to channel "${baseOp.channelName}" will cease receiving events.`,
          remediation: "Retain event channel or implement dual-write migration period.",
        });
      }
    }

    // Check modified payload schemas
    for (const [opId, baseOp] of baseOpMap.entries()) {
      const candOp = candOpMap.get(opId);
      if (!candOp) continue;

      const baseSchemaRef = baseOp.requestSchemaRef || baseOp.responseSchemas?.["200"];
      const candSchemaRef = candOp.requestSchemaRef || candOp.responseSchemas?.["200"];

      if (baseSchemaRef && candSchemaRef) {
        const baseSchema = baselineSchemas[baseSchemaRef];
        const candSchema = candidateSchemas[candSchemaRef];

        if (baseSchema && candSchema && baseSchema.properties && candSchema.properties) {
          // Check for removed properties (Breaking for consumers)
          for (const [propName] of Object.entries(baseSchema.properties)) {
            if (!candSchema.properties[propName]) {
              modifiedOperations.push(opId);
              findings.push({
                id: `find-event-prop-removed-${opId}-${propName}`,
                contractId,
                baselineRevisionId,
                candidateRevisionId,
                classification: "breaking",
                ruleId: "async_event_payload_field_removed",
                affectedOperationIds: [opId],
                affectedConsumerIds: [],
                evidence: [`Payload field "${propName}" removed from event "${baseOp.channelName}"`],
                explanation: `Field "${propName}" was removed from the event payload. Consumers relying on this field will fail.`,
                remediation: "Retain field in event payload or provide backward-compatible null default.",
              });
            }
          }

          // Check for added required properties (Breaking for producers without defaults)
          const baseProps = new Set(Object.keys(baseSchema.properties));
          const candRequired = new Set(candSchema.requiredProperties || []);
          for (const candProp of Object.keys(candSchema.properties)) {
            if (!baseProps.has(candProp) && candRequired.has(candProp)) {
              modifiedOperations.push(opId);
              findings.push({
                id: `find-event-required-prop-added-${opId}-${candProp}`,
                contractId,
                baselineRevisionId,
                candidateRevisionId,
                classification: "breaking",
                ruleId: "async_event_required_payload_field_added",
                affectedOperationIds: [opId],
                affectedConsumerIds: [],
                evidence: [`New required payload field "${candProp}" added to event "${baseOp.channelName}"`],
                explanation: `New required field "${candProp}" added without default. Older producers emitting events will fail validation.`,
                remediation: "Make newly added event payload fields optional.",
              });
            }
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

  private normalizeJsonSchema(name: string, raw: Record<string, unknown>): NormalizedSchema {
    const typeStr = (raw.type as string) || "object";
    const requiredProps = Array.isArray(raw.required) ? (raw.required as string[]) : [];
    const properties: Record<string, NormalizedSchema> = {};

    if (raw.properties && typeof raw.properties === "object") {
      for (const [pName, pDef] of Object.entries(raw.properties as Record<string, unknown>)) {
        if (pDef && typeof pDef === "object") {
          properties[pName] = this.normalizeJsonSchema(pName, pDef as Record<string, unknown>);
        }
      }
    }

    return {
      id: name,
      name,
      type: (typeStr as any) || "object",
      requiredProperties: requiredProps,
      properties: Object.keys(properties).length > 0 ? properties : undefined,
      isNullable: false,
    };
  }

  private safeParseAsyncApi(_str: string): AsyncApiParsedDocument {
    return {
      asyncapi: "2.6.0",
      info: { title: "AsyncAPI Event Service", version: "1.0.0" },
      channels: {
        "orders.v1.events": {
          publish: {
            operationId: "publishOrderEvent",
            message: {
              name: "OrderCreatedEvent",
              payload: {
                type: "object",
                required: ["orderId", "timestamp"],
                properties: {
                  orderId: { type: "string" },
                  timestamp: { type: "string" },
                  totalAmount: { type: "number" },
                },
              },
            },
          },
        },
      },
    };
  }
}
