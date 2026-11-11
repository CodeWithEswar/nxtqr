/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Protocol Adapter Registry & Dispatcher
 */

import type { ContractAdapter } from "./adapter.interface";
import type { SpecificationFormat } from "../contracts/contract.types";
import { OpenApiAdapter } from "./openapi-adapter";
import { GraphQLAdapter } from "./graphql-adapter";
import { ProtobufAdapter } from "./protobuf-adapter";
import { AsyncApiAdapter } from "./asyncapi-adapter";

export class ContractAdapterRegistry {
  private readonly adapters = new Map<SpecificationFormat, ContractAdapter>();

  constructor() {
    this.registerStandardAdapters();
  }

  public registerAdapter(adapter: ContractAdapter): void {
    this.adapters.set(adapter.format, adapter);
  }

  public getAdapter(format: SpecificationFormat): ContractAdapter {
    const adapter = this.adapters.get(format);
    if (!adapter) {
      throw new Error(`No contract adapter registered for specification format: "${format}".`);
    }
    return adapter;
  }

  /**
   * Deterministically infers the specification format from raw content.
   */
  public detectFormat(content: string): SpecificationFormat {
    const trimmed = content.trim();

    // Check Protobuf syntax
    if (trimmed.includes("syntax =") || trimmed.includes("syntax=") || (trimmed.includes("message ") && trimmed.includes("service "))) {
      return "protobuf";
    }

    // Check GraphQL SDL
    if (
      trimmed.includes("type Query") ||
      trimmed.includes("type Mutation") ||
      trimmed.includes("schema {") ||
      (trimmed.startsWith("type ") && trimmed.includes("{"))
    ) {
      return "graphql_sdl";
    }

    // Check JSON formats
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.openapi || parsed.swagger) return "openapi_3x";
        if (parsed.asyncapi) return "asyncapi_2x";
        if (parsed.data?.__schema || parsed.__schema) return "graphql_introspection";
        if (parsed.$schema) return "json_schema";
      } catch {
        // Fallback
      }
    }

    // Check AsyncAPI YAML
    if (trimmed.includes("asyncapi:")) {
      return "asyncapi_2x";
    }

    // Default to OpenAPI 3.x
    return "openapi_3x";
  }

  private registerStandardAdapters(): void {
    this.registerAdapter(new OpenApiAdapter());
    this.registerAdapter(new GraphQLAdapter());
    this.registerAdapter(new ProtobufAdapter());
    this.registerAdapter(new AsyncApiAdapter());
  }
}

export const contractAdapterRegistry = new ContractAdapterRegistry();
export const adapterRegistry = contractAdapterRegistry;

