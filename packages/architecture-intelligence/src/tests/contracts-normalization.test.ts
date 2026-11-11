/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Unit Tests: Protocol Parsing, Normalization, and Cycle-Safe Schema Resolution
 */

import { describe, it, expect } from "vitest";
import { OpenApiAdapter } from "../api-contracts/adapters/openapi-adapter";
import { GraphQLAdapter } from "../api-contracts/adapters/graphql-adapter";
import { ProtobufAdapter } from "../api-contracts/adapters/protobuf-adapter";
import { AsyncApiAdapter } from "../api-contracts/adapters/asyncapi-adapter";
import { contractAdapterRegistry } from "../api-contracts/adapters/adapter-registry";

describe("Phase 05.3.20: Contract Normalization & Protocol Adapters", () => {
  it("parses and normalizes OpenAPI 3.x specifications into REST operations and schemas", () => {
    const adapter = new OpenApiAdapter();
    const openApiJson = JSON.stringify({
      openapi: "3.0.3",
      info: { title: "Orders API", version: "1.0.0" },
      paths: {
        "/v1/orders": {
          get: {
            summary: "List Orders",
            operationId: "listOrders",
            parameters: [
              { name: "status", in: "query", required: false, schema: { type: "string" } },
              { name: "limit", in: "query", required: true, schema: { type: "integer" } },
            ],
            responses: {
              "200": {
                description: "Success",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["orders"],
                      properties: {
                        orders: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsed = adapter.parse(openApiJson);
    expect(parsed.success).toBe(true);

    const norm = adapter.normalize(parsed.document!);
    expect(norm.operations.length).toBe(1);

    const op = norm.operations[0];
    expect(op.operationId).toBe("listOrders");
    expect(op.method).toBe("GET");
    expect(op.path).toBe("/v1/orders");
    expect(op.parameters?.length).toBe(2);

    const limitParam = op.parameters?.find((p) => p.name === "limit");
    expect(limitParam?.required).toBe(true);
    expect(limitParam?.schema.type).toBe("integer");
  });

  it("safely handles cyclic schema references in OpenAPI without infinite recursion", () => {
    const adapter = new OpenApiAdapter();
    const cyclicSpec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Tree API", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          TreeNode: {
            type: "object",
            properties: {
              value: { type: "string" },
              parent: { $ref: "#/components/schemas/TreeNode" },
            },
          },
        },
      },
    });

    const parsed = adapter.parse(cyclicSpec);
    expect(parsed.success).toBe(true);

    const norm = adapter.normalize(parsed.document!);
    expect(norm.schemas["TreeNode"]).toBeDefined();
    expect(norm.schemas["TreeNode"].properties?.["parent"]).toBeDefined();
    expect(norm.schemas["TreeNode"].properties?.["parent"].description).toContain("Cyclic reference");
  });

  it("parses and normalizes GraphQL SDL into queries, mutations, and types", () => {
    const adapter = new GraphQLAdapter();
    const sdl = `
      type User {
        id: ID!
        username: String!
        email: String
      }

      type Query {
        getUser(id: ID!): User
        listUsers: [User]
      }

      type Mutation {
        createUser(username: String!, email: String): User
      }
    `;

    const parsed = adapter.parse(sdl);
    expect(parsed.success).toBe(true);
    expect(parsed.document?.rootQueries).toContain("getUser");
    expect(parsed.document?.rootMutations).toContain("createUser");

    const norm = adapter.normalize(parsed.document!);
    expect(norm.operations.length).toBe(3); // 2 queries, 1 mutation
    expect(norm.schemas["User"]).toBeDefined();
    expect(norm.schemas["User"].properties?.["id"].isNullable).toBe(false);
    expect(norm.schemas["User"].properties?.["email"].isNullable).toBe(true);
  });

  it("parses and normalizes Protobuf definitions into services, RPCs, and wire tags", () => {
    const adapter = new ProtobufAdapter();
    const proto = `
      syntax = "proto3";
      package payment.v1;

      message ChargeRequest {
        string customer_id = 1;
        int64 amount_cents = 2;
        repeated string tags = 3;
      }

      message ChargeResponse {
        string transaction_id = 1;
        bool is_success = 2;
      }

      service PaymentGateway {
        rpc ProcessCharge (ChargeRequest) returns (ChargeResponse);
      }
    `;

    const parsed = adapter.parse(proto);
    expect(parsed.success).toBe(true);
    expect(parsed.document?.services["PaymentGateway"]).toBeDefined();

    const norm = adapter.normalize(parsed.document!);
    expect(norm.operations.length).toBe(1);

    const rpcOp = norm.operations[0];
    expect(rpcOp.operationId).toBe("PaymentGateway.ProcessCharge");
    expect(rpcOp.protocol).toBe("grpc");
    expect(rpcOp.requestSchemaRef).toBe("ChargeRequest");

    // Verify wire tags and wire types
    const reqSchema = norm.schemas["ChargeRequest"];
    expect(reqSchema.properties?.["customer_id"].fieldNumber).toBe(1);
    expect(reqSchema.properties?.["customer_id"].wireType).toBe("length-delimited");
    expect(reqSchema.properties?.["amount_cents"].fieldNumber).toBe(2);
    expect(reqSchema.properties?.["amount_cents"].wireType).toBe("varint");
  });

  it("parses and normalizes AsyncAPI event contracts into channels and operations", () => {
    const adapter = new AsyncApiAdapter();
    const asyncJson = JSON.stringify({
      asyncapi: "2.6.0",
      info: { title: "Order Events", version: "1.0.0" },
      channels: {
        "orders.v1.placed": {
          publish: {
            operationId: "onOrderPlaced",
            message: {
              name: "OrderPlacedMessage",
              payload: {
                type: "object",
                required: ["orderId", "timestamp"],
                properties: {
                  orderId: { type: "string" },
                  timestamp: { type: "string" },
                  amount: { type: "number" },
                },
              },
            },
          },
        },
      },
    });

    const parsed = adapter.parse(asyncJson);
    expect(parsed.success).toBe(true);

    const norm = adapter.normalize(parsed.document!);
    expect(norm.operations.length).toBe(1);
    expect(norm.operations[0].channelName).toBe("orders.v1.placed");
    expect(norm.operations[0].protocol).toBe("async_event");
  });

  it("detects formats automatically in contract adapter registry", () => {
    expect(contractAdapterRegistry.detectFormat('{"openapi": "3.1.0"}')).toBe("openapi_3x");
    expect(contractAdapterRegistry.detectFormat("type Query { hello: String }")).toBe("graphql_sdl");
    expect(contractAdapterRegistry.detectFormat('syntax = "proto3"; message Foo { int32 a = 1; }')).toBe("protobuf");
    expect(contractAdapterRegistry.detectFormat('{"asyncapi": "2.6.0"}')).toBe("asyncapi_2x");
  });
});

