/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Contract Coverage & Completeness Analysis
 */

import type {
  APIContract,
  ConsumerDependency,
  ContractCoverageReport,
} from "../contracts/contract.types";

export class ContractCoverageAnalyzer {
  /**
   * Evaluates the coverage and completeness of API contracts across all service nodes.
   */
  public static evaluateCoverage(
    serviceNodeIds: string[],
    contracts: APIContract[],
    dependencies: ConsumerDependency[]
  ): ContractCoverageReport {
    const contractedServiceIds = new Set<string>();
    let totalOperations = 0;
    const allOpIds = new Set<string>();
    const unversionedInterfaces: string[] = [];

    for (const contract of contracts) {
      contractedServiceIds.add(contract.providerServiceId);
      const currentRev = contract.revisions.find((r) => r.id === contract.currentRevisionId) || contract.revisions[0];
      if (currentRev) {
        totalOperations += currentRev.operations.length;
        for (const op of currentRev.operations) {
          allOpIds.add(op.operationId);
        }
        if (!currentRev.versionLabel || currentRev.versionLabel === "unversioned") {
          unversionedInterfaces.push(contract.name);
        }
      }
    }

    const servicesWithoutContracts = serviceNodeIds.filter((id) => !contractedServiceIds.has(id));

    // Consumer coverage
    const consumedOpIds = new Set<string>();
    for (const dep of dependencies) {
      for (const op of dep.operationIds) {
        consumedOpIds.add(op);
      }
    }

    const operationsWithoutConsumers = Array.from(allOpIds).filter((id) => !consumedOpIds.has(id));

    const totalServices = serviceNodeIds.length;
    const servicesWithContracts = totalServices - servicesWithoutContracts.length;
    const coveragePercentage = totalServices > 0 ? Math.round((servicesWithContracts / totalServices) * 100) : 100;

    return {
      totalServices,
      servicesWithContracts,
      servicesWithoutContracts,
      totalOperations,
      operationsWithoutConsumers,
      coveragePercentage,
      unversionedInterfaces,
    };
  }
}

