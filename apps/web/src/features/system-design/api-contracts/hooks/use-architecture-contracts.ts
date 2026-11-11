"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * useArchitectureContracts Hook
 */

import { useState, useMemo, useCallback } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import {
  architectureContractEngine,
  adapterRegistry,
  type APIContract,
  type ContractRevision,
  type ServiceInterface,
  type ConsumerDependency,
  type ContractOperation,
  type SemanticContractDiff,
  type ConsumerImpactReport,
  type ContractCoverageReport,
  type ContractDriftFinding,
  type MigrationPlan,
  type ContractProtocol,
  type SpecificationFormat,
  type ContractLifecycleStatus,
  type InterfaceExposure,
  type ContractProvenance,
} from "@nxtqr/architecture-intelligence";

export type ProtocolFilter = "all" | ContractProtocol;
export type LifecycleFilter = "all" | ContractLifecycleStatus;

export interface UseArchitectureContractsOptions {
  projectId?: string;
  architectureId?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialContracts?: APIContract[];
  initialInterfaces?: ServiceInterface[];
  initialDependencies?: ConsumerDependency[];
}

const SAMPLE_OPENAPI_SPEC_V1 = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Order Checkout API", version: "1.0.0", description: "Core checkout operations" },
  paths: {
    "/orders": {
      post: {
        summary: "Create Order",
        operationId: "createOrder",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "items", "paymentToken"],
                properties: {
                  userId: { type: "string" },
                  items: { type: "array", items: { type: "object", properties: { sku: { type: "string" }, qty: { type: "integer" } } } },
                  paymentToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["orderId", "status", "totalAmount"],
                  properties: {
                    orderId: { type: "string" },
                    status: { type: "string" },
                    totalAmount: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/orders/{id}": {
      get: {
        summary: "Get Order by ID",
        operationId: "getOrderById",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    orderId: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Order: {
        type: "object",
        required: ["id", "status"],
        properties: {
          id: { type: "string" },
          status: { type: "string" },
        },
      },
    },
  },
}, null, 2);

const SAMPLE_OPENAPI_SPEC_V2_BREAKING = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Order Checkout API", version: "2.0.0", description: "v2 with breaking changes" },
  paths: {
    "/orders": {
      post: {
        summary: "Create Order",
        operationId: "createOrder",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId", "items", "paymentToken", "billingZipCode"],
                properties: {
                  userId: { type: "string" },
                  items: { type: "array", items: { type: "object", properties: { sku: { type: "string" }, qty: { type: "integer" } } } },
                  paymentToken: { type: "string" },
                  billingZipCode: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["orderId", "status"],
                  properties: {
                    orderId: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}, null, 2);

const SAMPLE_GRAPHQL_SDL = `
type Product {
  id: ID!
  title: String!
  priceCents: Int!
  inventoryCount: Int
}

type Query {
  product(id: ID!): Product
  listProducts(limit: Int): [Product]
}

type Mutation {
  createProduct(title: String!, priceCents: Int!): Product
}
`;

const SAMPLE_PROTOBUF_SPEC = `
syntax = "proto3";

package nxtqr.telemetry.v1;

message IngestionBatch {
  string batch_id = 1;
  int64 timestamp_ms = 2;
  repeated MetricPoint points = 3;
}

message MetricPoint {
  string metric_name = 1;
  double value = 2;
  map<string, string> tags = 3;
}

service TelemetryIngestionService {
  rpc IngestMetrics (IngestionBatch) returns (IngestionResponse);
}

message IngestionResponse {
  bool success = 1;
  int32 processed_count = 2;
}
`;

const SAMPLE_ASYNCAPI_SPEC = JSON.stringify({
  asyncapi: "2.6.0",
  info: { title: "Inventory Domain Events", version: "1.0.0" },
  channels: {
    "inventory.item.reserved": {
      publish: {
        operationId: "onInventoryReserved",
        message: {
          name: "InventoryReservedEvent",
          payload: {
            type: "object",
            required: ["orderId", "sku", "quantity"],
            properties: {
              orderId: { type: "string" },
              sku: { type: "string" },
              quantity: { type: "integer" },
            },
          },
        },
      },
    },
  },
}, null, 2);

export function useArchitectureContracts(options: UseArchitectureContractsOptions = {}) {
  const {
    projectId = "current-project",
    architectureId = "arch-contracts-1",
    nodes = [],
    edges: _edges = [],
    initialContracts,
    initialDependencies,
  } = options;

  const now = new Date().toISOString();

  const sampleProvenance: ContractProvenance = useMemo(
    () => ({
      source: "declared",
      timestamp: now,
      graphRevision: "rev-1",
      confirmed: true,
    }),
    [now]
  );

  // 1. Initial Contracts state
  const defaultContracts: APIContract[] = useMemo(() => {
    if (initialContracts && initialContracts.length > 0) return initialContracts;

    const parsedOpenApi = adapterRegistry.getAdapter("openapi_3x").normalize(JSON.parse(SAMPLE_OPENAPI_SPEC_V1), {
      contractId: "contract-order-checkout",
      graphRevision: "rev-1",
    });

    const parsedOpenApiV2 = adapterRegistry.getAdapter("openapi_3x").normalize(JSON.parse(SAMPLE_OPENAPI_SPEC_V2_BREAKING), {
      contractId: "contract-order-checkout",
      graphRevision: "rev-2",
    });

    const parsedGql = adapterRegistry.getAdapter("graphql_sdl").normalize(
      adapterRegistry.getAdapter("graphql_sdl").parse(SAMPLE_GRAPHQL_SDL).document!,
      { contractId: "contract-catalog-graphql", graphRevision: "rev-1" }
    );

    const parsedProto = adapterRegistry.getAdapter("protobuf").normalize(
      adapterRegistry.getAdapter("protobuf").parse(SAMPLE_PROTOBUF_SPEC).document!,
      { contractId: "contract-telemetry-grpc", graphRevision: "rev-1" }
    );

    const parsedAsync = adapterRegistry.getAdapter("asyncapi_2x").normalize(
      JSON.parse(SAMPLE_ASYNCAPI_SPEC),
      { contractId: "contract-inventory-events", graphRevision: "rev-1" }
    );

    const rev1: ContractRevision = {
      id: "rev-order-v1",
      contractId: "contract-order-checkout",
      revisionHash: "hash-order-v1",
      versionLabel: "1.0.0",
      specificationVersion: "3.0.0",
      operations: parsedOpenApi.operations,
      schemas: parsedOpenApi.schemas,
      validationStatus: "valid",
      createdAt: now,
      author: "Checkout Platform Team",
    };

    const rev2Candidate: ContractRevision = {
      id: "rev-order-v2-cand",
      contractId: "contract-order-checkout",
      revisionHash: "hash-order-v2",
      versionLabel: "2.0.0-rc1",
      specificationVersion: "3.0.0",
      operations: parsedOpenApiV2.operations,
      schemas: parsedOpenApiV2.schemas,
      validationStatus: "valid",
      createdAt: now,
      author: "Checkout Platform Team",
    };

    const contract1: APIContract = {
      id: "contract-order-checkout",
      projectId,
      architectureId,
      name: "Order Checkout REST API",
      description: "Synchronous HTTP/JSON interface for placing and querying customer orders.",
      protocol: "rest",
      specificationFormat: "openapi_3x",
      providerServiceId: "order-service",
      exposure: "internal",
      currentRevisionId: "rev-order-v1",
      revisions: [rev1, rev2Candidate],
      lifecycleStatus: "active",
      provenance: sampleProvenance,
      createdAt: now,
      updatedAt: now,
    };

    const contract2: APIContract = {
      id: "contract-catalog-graphql",
      projectId,
      architectureId,
      name: "Catalog Federation GraphQL API",
      description: "Unified Product & Inventory GraphQL query gateway.",
      protocol: "graphql",
      specificationFormat: "graphql_sdl",
      providerServiceId: "catalog-service",
      exposure: "public",
      currentRevisionId: "rev-catalog-v1",
      revisions: [
        {
          id: "rev-catalog-v1",
          contractId: "contract-catalog-graphql",
          revisionHash: "hash-catalog-v1",
          versionLabel: "1.0.0",
          specificationVersion: "October2021",
          operations: parsedGql.operations,
          schemas: parsedGql.schemas,
          validationStatus: "valid",
          createdAt: now,
          author: "Catalog Engineering",
        },
      ],
      lifecycleStatus: "active",
      provenance: sampleProvenance,
      createdAt: now,
      updatedAt: now,
    };

    const contract3: APIContract = {
      id: "contract-telemetry-grpc",
      projectId,
      architectureId,
      name: "Telemetry Ingestion gRPC Service",
      description: "High-throughput binary metric stream ingestion.",
      protocol: "grpc",
      specificationFormat: "protobuf",
      providerServiceId: "ingestion-service",
      exposure: "internal",
      currentRevisionId: "rev-telemetry-v1",
      revisions: [
        {
          id: "rev-telemetry-v1",
          contractId: "contract-telemetry-grpc",
          revisionHash: "hash-proto-v1",
          versionLabel: "1.0.0",
          specificationVersion: "proto3",
          operations: parsedProto.operations,
          schemas: parsedProto.schemas,
          validationStatus: "valid",
          createdAt: now,
          author: "Data Platform Team",
        },
      ],
      lifecycleStatus: "active",
      provenance: sampleProvenance,
      createdAt: now,
      updatedAt: now,
    };

    const contract4: APIContract = {
      id: "contract-inventory-events",
      projectId,
      architectureId,
      name: "Inventory Events (AsyncAPI)",
      description: "Kafka message specifications for inventory reservations.",
      protocol: "async_event",
      specificationFormat: "asyncapi_2x",
      providerServiceId: "inventory-service",
      exposure: "internal",
      currentRevisionId: "rev-inventory-v1",
      revisions: [
        {
          id: "rev-inventory-v1",
          contractId: "contract-inventory-events",
          revisionHash: "hash-async-v1",
          versionLabel: "1.0.0",
          specificationVersion: "2.6.0",
          operations: parsedAsync.operations,
          schemas: parsedAsync.schemas,
          validationStatus: "valid",
          createdAt: now,
          author: "Warehouse Operations",
        },
      ],
      lifecycleStatus: "active",
      provenance: sampleProvenance,
      createdAt: now,
      updatedAt: now,
    };

    return [contract1, contract2, contract3, contract4];
  }, [initialContracts, projectId, architectureId, now, sampleProvenance]);

  // 2. Initial Consumer Dependencies
  const defaultDependencies: ConsumerDependency[] = useMemo(() => {
    if (initialDependencies && initialDependencies.length > 0) return initialDependencies;

    return [
      {
        id: "dep-web-order",
        consumerServiceId: "web-frontend",
        providerServiceId: "order-service",
        contractId: "contract-order-checkout",
        operationIds: ["createOrder", "getOrderById"],
        source: "declared",
        confirmed: true,
      },
      {
        id: "dep-mobile-order",
        consumerServiceId: "mobile-app-gateway",
        providerServiceId: "order-service",
        contractId: "contract-order-checkout",
        operationIds: ["createOrder", "getOrderById"],
        source: "observed",
        confirmed: true,
      },
      {
        id: "dep-billing-order",
        consumerServiceId: "billing-worker",
        providerServiceId: "order-service",
        contractId: "contract-order-checkout",
        operationIds: ["createOrder"],
        source: "implemented",
        confirmed: true,
      },
      {
        id: "dep-web-catalog",
        consumerServiceId: "web-frontend",
        providerServiceId: "catalog-service",
        contractId: "contract-catalog-graphql",
        operationIds: ["product", "listProducts"],
        source: "observed",
        confirmed: true,
      },
      {
        id: "dep-agent-telemetry",
        consumerServiceId: "edge-agent-daemon",
        providerServiceId: "ingestion-service",
        contractId: "contract-telemetry-grpc",
        operationIds: ["IngestMetrics"],
        source: "implemented",
        confirmed: true,
      },
    ];
  }, [initialDependencies]);

  // State
  const [contracts, setContracts] = useState<APIContract[]>(defaultContracts);
  const [dependencies] = useState<ConsumerDependency[]>(defaultDependencies);
  const [selectedContractId, setSelectedContractId] = useState<string>("contract-order-checkout");
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>("createOrder");
  const [selectedSchemaName, setSelectedSchemaName] = useState<string | null>(null);
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [diffCandidateRevisionId, setDiffCandidateRevisionId] = useState<string | null>("rev-order-v2-cand");

  // Selected Contract & Revisions
  const selectedContract = useMemo(() => {
    return contracts.find((c) => c.id === selectedContractId) || contracts[0] || null;
  }, [contracts, selectedContractId]);

  const activeRevision = useMemo(() => {
    if (!selectedContract) return null;
    return selectedContract.revisions.find((r) => r.id === selectedContract.currentRevisionId) || selectedContract.revisions[0] || null;
  }, [selectedContract]);

  const candidateRevision = useMemo(() => {
    if (!selectedContract || !diffCandidateRevisionId) return null;
    return selectedContract.revisions.find((r) => r.id === diffCandidateRevisionId) || null;
  }, [selectedContract, diffCandidateRevisionId]);

  // Selected Operation & Schema
  const selectedOperation = useMemo(() => {
    if (!activeRevision || !selectedOperationId) return null;
    return activeRevision.operations.find(
      (op: ContractOperation) => op.operationId === selectedOperationId || op.id === selectedOperationId
    ) || null;
  }, [activeRevision, selectedOperationId]);

  const selectedSchema = useMemo(() => {
    if (!activeRevision || !selectedSchemaName) return null;
    return activeRevision.schemas[selectedSchemaName] || null;
  }, [activeRevision, selectedSchemaName]);

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (protocolFilter !== "all" && c.protocol !== protocolFilter) return false;
      if (lifecycleFilter !== "all" && c.lifecycleStatus !== lifecycleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        const matchesProvider = c.providerServiceId.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesProvider) return false;
      }
      return true;
    });
  }, [contracts, protocolFilter, lifecycleFilter, searchQuery]);

  // Semantic Diff (Active vs Candidate)
  const semanticDiff: SemanticContractDiff | null = useMemo(() => {
    if (!selectedContract || !activeRevision || !candidateRevision) return null;
    try {
      return architectureContractEngine.diffRevisions(
        selectedContract,
        activeRevision.id,
        candidateRevision.id
      );
    } catch {
      return null;
    }
  }, [selectedContract, activeRevision, candidateRevision]);

  // Consumer Impact Report
  const consumerImpactReport: ConsumerImpactReport | null = useMemo(() => {
    if (!semanticDiff || !selectedContract) return null;
    const contractDeps = dependencies.filter((d) => d.contractId === selectedContract.id);
    try {
      return architectureContractEngine.analyzeConsumerImpact(
        selectedContract,
        semanticDiff,
        contractDeps
      );
    } catch {
      return null;
    }
  }, [semanticDiff, selectedContract, dependencies]);

  // Migration Plan
  const migrationPlan: MigrationPlan | null = useMemo(() => {
    if (!consumerImpactReport || !selectedContract || !semanticDiff) return null;
    try {
      return architectureContractEngine.generateMigrationPlan(
        selectedContract,
        semanticDiff,
        consumerImpactReport,
        { compatibilityWindowDays: 30 }
      );
    } catch {
      return null;
    }
  }, [consumerImpactReport, selectedContract, semanticDiff]);

  // Contract Coverage Report
  const coverageReport: ContractCoverageReport = useMemo(() => {
    const serviceIds = nodes.map((n) => n.id);
    return architectureContractEngine.evaluateCoverage(
      serviceIds.length > 0 ? serviceIds : ["order-service", "catalog-service", "ingestion-service", "inventory-service"],
      contracts,
      dependencies
    );
  }, [nodes, contracts, dependencies]);

  // Drift Findings
  const driftFindings: ContractDriftFinding[] = useMemo(() => {
    if (!selectedContract) return [];
    const simulatedTraffic = [
      {
        operationId: "createOrder",
        endpoint: "/orders",
        protocol: selectedContract.protocol,
        observedRps: 142.5,
        observedCallCount: 15000,
        lastObservedAt: now,
        consumerServiceId: "web-frontend",
      },
      {
        operationId: "undeclaredCacheFlush",
        endpoint: "/internal/orders/cache-flush",
        protocol: selectedContract.protocol,
        observedRps: 12.0,
        observedCallCount: 120,
        lastObservedAt: now,
        consumerServiceId: "admin-ops",
      },
    ];
    try {
      return architectureContractEngine.detectDrift(selectedContract, simulatedTraffic);
    } catch {
      return [];
    }
  }, [selectedContract]);

  // Actions
  const importContract = useCallback(
    (params: {
      name: string;
      description?: string;
      protocol: ContractProtocol;
      format: SpecificationFormat;
      specText: string;
      providerServiceId: string;
      exposure: InterfaceExposure;
      versionLabel?: string;
    }) => {
      const adapter = adapterRegistry.getAdapter(params.format);
      const parseRes = adapter.parse(params.specText);
      if (!parseRes.success || !parseRes.document) {
        throw new Error(parseRes.errors?.join(", ") || "Failed to parse specification");
      }

      const contractId = `contract-${params.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
      const revId = `rev-${contractId}-v1`;
      const normRes = adapter.normalize(parseRes.document, { contractId, graphRevision: "rev-1" });

      const newRev: ContractRevision = {
        id: revId,
        contractId,
        revisionHash: `hash-${Math.random().toString(36).slice(2, 10)}`,
        versionLabel: params.versionLabel || "1.0.0",
        specificationVersion: params.format,
        operations: normRes.operations,
        schemas: normRes.schemas,
        validationStatus: "valid",
        createdAt: new Date().toISOString(),
      };

      const newContract: APIContract = {
        id: contractId,
        projectId,
        architectureId,
        name: params.name,
        description: params.description,
        protocol: params.protocol,
        specificationFormat: params.format,
        providerServiceId: params.providerServiceId,
        exposure: params.exposure,
        currentRevisionId: revId,
        revisions: [newRev],
        lifecycleStatus: "draft",
        provenance: {
          source: "declared",
          timestamp: new Date().toISOString(),
          graphRevision: "rev-1",
          confirmed: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setContracts((prev) => [newContract, ...prev]);
      setSelectedContractId(contractId);
      if (normRes.operations.length > 0) {
        setSelectedOperationId(normRes.operations[0].operationId);
      }
      return newContract;
    },
    [projectId, architectureId]
  );

  const addCandidateRevision = useCallback(
    (contractId: string, specText: string, versionLabel: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;

      const adapter = adapterRegistry.getAdapter(contract.specificationFormat);
      const parseRes = adapter.parse(specText);
      if (!parseRes.success || !parseRes.document) {
        throw new Error(parseRes.errors?.join(", ") || "Failed to parse candidate specification");
      }

      const revId = `rev-${contractId}-${Date.now().toString(36)}`;
      const normRes = adapter.normalize(parseRes.document, { contractId, graphRevision: "rev-candidate" });

      const candidateRev: ContractRevision = {
        id: revId,
        contractId,
        revisionHash: `hash-${Math.random().toString(36).slice(2, 10)}`,
        versionLabel,
        specificationVersion: contract.specificationFormat,
        operations: normRes.operations,
        schemas: normRes.schemas,
        validationStatus: "valid",
        createdAt: new Date().toISOString(),
      };

      setContracts((prev) =>
        prev.map((c) => {
          if (c.id !== contractId) return c;
          return {
            ...c,
            revisions: [...c.revisions, candidateRev],
            updatedAt: new Date().toISOString(),
          };
        })
      );
      setDiffCandidateRevisionId(revId);
    },
    [contracts]
  );

  const setContractLifecycle = useCallback((contractId: string, status: ContractLifecycleStatus) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        return {
          ...c,
          lifecycleStatus: status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  return {
    contracts,
    dependencies,
    selectedContractId,
    selectedContract,
    activeRevision,
    candidateRevision,
    diffCandidateRevisionId,
    selectedOperationId,
    selectedOperation,
    selectedSchemaName,
    selectedSchema,
    protocolFilter,
    lifecycleFilter,
    searchQuery,
    filteredContracts,
    semanticDiff,
    consumerImpactReport,
    migrationPlan,
    coverageReport,
    driftFindings,
    isImportModalOpen,
    setSelectedContractId,
    setSelectedOperationId,
    setSelectedSchemaName,
    setProtocolFilter,
    setLifecycleFilter,
    setSearchQuery,
    setIsImportModalOpen,
    setDiffCandidateRevisionId,
    importContract,
    addCandidateRevision,
    setContractLifecycle,
  };
}
