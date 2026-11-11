/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Migration Requirement Extractor
 * Automatically extracts candidate migration requirements from semantic differences between source and target architecture snapshots.
 */

import type { BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";
import type { MigrationRequirement } from "../contracts/evolution.types";

export class RequirementExtractor {
  /**
   * Extracts candidate migration requirements from source and target architecture snapshots.
   */
  public static extractRequirements(
    sourceSnapshot: ArchitectureSnapshot,
    targetSnapshot: ArchitectureSnapshot,
    projectId: string = "migration-proj-1"
  ): MigrationRequirement[] {
    const requirements: MigrationRequirement[] = [];
    const sourceNodeMap = new Map<string, BaseNode>(sourceSnapshot.nodes.map((n) => [n.id, n]));
    const targetNodeMap = new Map<string, BaseNode>(targetSnapshot.nodes.map((n) => [n.id, n]));

    const addedTargetNodes = targetSnapshot.nodes.filter((n) => !sourceNodeMap.has(n.id));
    const removedSourceNodes = sourceSnapshot.nodes.filter((n) => !targetNodeMap.has(n.id));

    let reqIndex = 1;
    const generateId = (prefix: string) => `${projectId}-req-${prefix}-${reqIndex++}`;

    // 1. Check for Network Ingress / Gateway Facade requirement
    const targetGateways = addedTargetNodes.filter((n) => {
      const label = (n.data.label as string | undefined)?.toLowerCase();
      return n.data.nodeType === "gateway" || label?.includes("gateway") || label?.includes("ingress");
    });
    if (targetGateways.length > 0) {
      for (const gw of targetGateways) {
        requirements.push({
          id: generateId("net"),
          projectId,
          title: `Deploy Routing Facade & API Gateway (${gw.data.label || gw.id})`,
          description: `Provision and configure ${gw.data.label || gw.id} to intercept incoming traffic and enable progressive canary traffic shifting during migration.`,
          category: "network_routing",
          sourceNodeIds: sourceSnapshot.nodes.filter((n) => n.data.nodeType === "gateway" || n.data.nodeType === "service").map((n) => n.id).slice(0, 2),
          targetNodeIds: [gw.id],
          status: "accepted",
          priority: "critical",
          estimatedEffortHours: 40,
          rationale: "An API Gateway or routing facade is mandatory to implement Strangler Fig progressive traffic cutovers without consumer disruption.",
        });
      }
    }

    // 2. Identify Service Extractions & New Target Services
    const addedServices = addedTargetNodes.filter((n) => n.data.nodeType === "service");
    const sourceMonoliths = sourceSnapshot.nodes.filter((n) => {
      const label = (n.data.label as string | undefined)?.toLowerCase();
      return n.data.nodeType === "service" && (label?.includes("monolith") || removedSourceNodes.some(rn => rn.id === n.id));
    });

    for (const service of addedServices) {
      const parentMonolith = sourceMonoliths[0];
      const sourceIds = parentMonolith ? [parentMonolith.id] : [];
      requirements.push({
        id: generateId("svc"),
        projectId,
        title: `Extract Domain Service: ${service.data.label || service.id}`,
        description: `Carve out ${service.data.label || service.id} bounded context from legacy monolithic components into an independently deployable service.`,
        category: "service_extraction",
        sourceNodeIds: sourceIds,
        targetNodeIds: [service.id],
        status: "accepted",
        priority: "high",
        estimatedEffortHours: 80,
        rationale: "Isolates domain logic into microservices to eliminate deployment bottlenecks and enable independent scaling.",
      });
    }

    // 3. Identify Database Migrations & Polyglot Persistence
    const addedDatabases = addedTargetNodes.filter((n) => n.data.nodeType === "database");
    const sourceDatabases = sourceSnapshot.nodes.filter((n) => n.data.nodeType === "database");

    for (const targetDb of addedDatabases) {
      const sourceDb = sourceDatabases[0];
      const sourceIds = sourceDb ? [sourceDb.id] : [];
      requirements.push({
        id: generateId("db"),
        projectId,
        title: `Migrate Database Store: ${targetDb.data.label || targetDb.id}`,
        description: `Design schema, provision database instance, and establish CDC replication for ${targetDb.data.label || targetDb.id}.`,
        category: "database_migration",
        sourceNodeIds: sourceIds,
        targetNodeIds: [targetDb.id],
        status: "accepted",
        priority: "critical",
        estimatedEffortHours: 60,
        rationale: "Target architecture requires specialized database persistence for newly extracted services with clean bounded context isolation.",
      });

      // Pair with data synchronization requirement
      if (sourceIds.length > 0) {
        requirements.push({
          id: generateId("sync"),
          projectId,
          title: `Setup Dual-Write & Data Synchronization (${targetDb.data.label || targetDb.id})`,
          description: `Implement change data capture (CDC) or asynchronous dual-write pipeline to mirror transactions from legacy database to ${targetDb.data.label || targetDb.id} with automated reconciliation.`,
          category: "data_synchronization",
          sourceNodeIds: sourceIds,
          targetNodeIds: [targetDb.id],
          status: "accepted",
          priority: "high",
          estimatedEffortHours: 50,
          rationale: "Dual-write or CDC replication ensures zero data loss and validates transactional parity before full traffic cutover.",
        });
      }
    }

    // 4. Identify Messaging & Event-Driven Evolution
    const addedMessaging = addedTargetNodes.filter((n) => {
      const label = (n.data.label as string | undefined)?.toLowerCase();
      return n.data.nodeType === "queue" || label?.includes("kafka") || label?.includes("queue") || label?.includes("event");
    });
    for (const msg of addedMessaging) {
      requirements.push({
        id: generateId("msg"),
        projectId,
        title: `Provision Event Streaming & Messaging Broker (${msg.data.label || msg.id})`,
        description: `Deploy and configure ${msg.data.label || msg.id} topic topology, schema registry, and consumer group policies for asynchronous event exchange.`,
        category: "messaging_evolution",
        sourceNodeIds: [],
        targetNodeIds: [msg.id],
        status: "accepted",
        priority: "medium",
        estimatedEffortHours: 35,
        rationale: "Asynchronous decoupling enables resilient inter-service communication and eventual consistency across distributed domains.",
      });
    }

    // 5. Identify Infrastructure Modernization / Container Clusters
    const addedInfra = addedTargetNodes.filter((n) => {
      const label = (n.data.label as string | undefined)?.toLowerCase();
      return n.data.nodeType === "compute" || label?.includes("cluster") || label?.includes("k8s") || label?.includes("cloud");
    });
    for (const infra of addedInfra) {
      requirements.push({
        id: generateId("infra"),
        projectId,
        title: `Modernize Compute Infrastructure (${infra.data.label || infra.id})`,
        description: `Provision cloud-native containerized compute cluster ${infra.data.label || infra.id} with autoscaling, observability sidecars, and network policies.`,
        category: "infrastructure_modernization",
        sourceNodeIds: [],
        targetNodeIds: [infra.id],
        status: "accepted",
        priority: "high",
        estimatedEffortHours: 45,
        rationale: "Modern container orchestration guarantees consistent environments, high availability, and elastic capacity.",
      });
    }

    // 6. Identify API Replacements and Contract Transitions
    const targetEdges = targetSnapshot.edges;
    const sourceEdges = sourceSnapshot.edges;
    const addedEdges = targetEdges.filter(
      (te) => !sourceEdges.some((se) => se.source === te.source && se.target === te.target)
    );
    if (addedEdges.length > 0 && addedServices.length > 0) {
      requirements.push({
        id: generateId("api"),
        projectId,
        title: "Standardize Microservice API Contracts & Service Mesh",
        description: "Formulate OpenAPI and gRPC contracts for newly decoupled inter-service communications with versioning and backwards compatibility guarantees.",
        category: "api_replacement",
        sourceNodeIds: [],
        targetNodeIds: addedServices.map((s) => s.id),
        affectedEdgeIds: addedEdges.map((e) => e.id).slice(0, 5),
        status: "accepted",
        priority: "high",
        estimatedEffortHours: 30,
        rationale: "Typed service interfaces prevent breaking changes and ensure smooth service interoperability.",
      });
    }

    // 7. Security Transition
    const addedSecurityNodes = addedTargetNodes.filter((n) => {
      const label = (n.data.label as string | undefined)?.toLowerCase();
      return n.data.nodeType === "auth" || label?.includes("vault") || label?.includes("auth") || label?.includes("security");
    });
    if (addedSecurityNodes.length > 0 || addedServices.length > 2) {
      requirements.push({
        id: generateId("sec"),
        projectId,
        title: "Implement Zero Trust Security & Service Identity",
        description: "Deploy mutual TLS (mTLS) certificates, JWT token propagation, and role-based access control (RBAC) across extracted target microservices.",
        category: "security_transition",
        sourceNodeIds: [],
        targetNodeIds: addedSecurityNodes.map((n) => n.id),
        status: "accepted",
        priority: "high",
        estimatedEffortHours: 35,
        rationale: "Distributed architectures expand network surface area; Zero Trust service identities prevent unauthorized lateral movement.",
      });
    }

    // 8. Identify Decommissioning Requirements for Removed Source Nodes
    for (const legacyNode of removedSourceNodes) {
      requirements.push({
        id: generateId("decom"),
        projectId,
        title: `Decommission Legacy Component: ${legacyNode.data.label || legacyNode.id}`,
        description: `Gracefully drain traffic, revoke security credentials, archive final data snapshots, and shut down legacy ${legacyNode.data.label || legacyNode.id}.`,
        category: "decommissioning",
        sourceNodeIds: [legacyNode.id],
        targetNodeIds: [],
        status: "accepted",
        priority: "medium",
        estimatedEffortHours: 25,
        rationale: "Final decommissioning eliminates double infrastructure burn and completes the architecture evolution lifecycle.",
      });
    }

    // If source and target are identical or minimal changes detected, create at least a validation requirement
    if (requirements.length === 0) {
      requirements.push({
        id: generateId("parity"),
        projectId,
        title: "Architecture Parity & Performance Optimization",
        description: "Validate that current architecture matches operational baseline performance and security criteria.",
        category: "infrastructure_modernization",
        sourceNodeIds: sourceSnapshot.nodes.map((n) => n.id).slice(0, 2),
        targetNodeIds: targetSnapshot.nodes.map((n) => n.id).slice(0, 2),
        status: "accepted",
        priority: "low",
        estimatedEffortHours: 15,
        rationale: "Continuous verification ensures architectural alignment with operational standards.",
      });
    }

    return requirements;
  }
}
