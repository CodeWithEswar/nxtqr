/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Architecture Drift Detector
 * Compares planned architecture topology against imported/observed cloud inventory.
 */

import type {
  DeploymentTopology,
  InfrastructureResource,
  DriftFinding,
} from "../contracts/deployment.types";

export interface DriftDetectionOptions {
  ignoreTags?: boolean;
  ignoredResourceTypes?: string[];
  trackConfigurationKeys?: string[];
}

export class DriftDetector {
  /**
   * Compare planned topology with observed resources and detect drift findings.
   */
  public static detectDrift(
    plannedTopology: DeploymentTopology,
    observedResources: InfrastructureResource[],
    options: DriftDetectionOptions = {}
  ): DriftFinding[] {
    const findings: DriftFinding[] = [];
    const plannedMap = new Map<string, InfrastructureResource>();
    const observedMap = new Map<string, InfrastructureResource>();

    const ignoredTypes = new Set(options.ignoredResourceTypes || []);

    for (const r of plannedTopology.resources) {
      if (!ignoredTypes.has(r.type)) {
        plannedMap.set(r.id, r);
        if (r.externalId) {
          plannedMap.set(r.externalId, r);
        }
      }
    }

    for (const r of observedResources) {
      if (!ignoredTypes.has(r.type)) {
        observedMap.set(r.id, r);
        if (r.externalId) {
          observedMap.set(r.externalId, r);
        }
      }
    }

    // 1. Missing Resources (Planned but absent in observed)
    for (const planned of plannedTopology.resources) {
      if (ignoredTypes.has(planned.type)) continue;

      const found = observedMap.get(planned.id) || (planned.externalId ? observedMap.get(planned.externalId) : undefined);
      if (!found) {
        findings.push({
          id: `drift-missing-${planned.id}`,
          type: "missing_resource",
          severity: "high",
          title: `Planned resource missing: ${planned.name}`,
          description: `Resource "${planned.name}" (${planned.type}) is planned in topology but was not found in observed infrastructure.`,
          resourceId: planned.id,
          plannedValue: planned.name,
          actualValue: null,
        });
      }
    }

    // 2. Unexpected Resources (Observed but not planned)
    const plannedIds = new Set(plannedTopology.resources.map((r) => r.id));
    const plannedExternalIds = new Set(
      plannedTopology.resources.filter((r) => r.externalId).map((r) => r.externalId!)
    );

    for (const observed of observedResources) {
      if (ignoredTypes.has(observed.type)) continue;

      const isPlanned =
        plannedIds.has(observed.id) || (observed.externalId && plannedExternalIds.has(observed.externalId));

      if (!isPlanned) {
        findings.push({
          id: `drift-unexpected-${observed.id}`,
          type: "unexpected_resource",
          severity: "medium",
          title: `Unmanaged infrastructure resource: ${observed.name}`,
          description: `Resource "${observed.name}" (${observed.type}) is present in cloud environment but not modeled in planned topology.`,
          resourceId: observed.id,
          plannedValue: null,
          actualValue: observed.name,
        });
      }
    }

    // 3. Configuration & Placement Drift for matching resources
    const trackedKeys = options.trackConfigurationKeys || ["replicas", "instanceType", "multiAz", "engineVersion"];

    for (const planned of plannedTopology.resources) {
      if (ignoredTypes.has(planned.type)) continue;

      const observed =
        observedMap.get(planned.id) || (planned.externalId ? observedMap.get(planned.externalId) : undefined);
      if (!observed) continue;

      // Check placement drift (region or zone)
      if (planned.regionId && observed.regionId && planned.regionId !== observed.regionId) {
        findings.push({
          id: `drift-placement-region-${planned.id}`,
          type: "placement_drift",
          severity: "high",
          title: `Region mismatch on ${planned.name}`,
          description: `Resource "${planned.name}" is planned in region "${planned.regionId}" but running in region "${observed.regionId}".`,
          resourceId: planned.id,
          plannedValue: planned.regionId,
          actualValue: observed.regionId,
        });
      }

      if (planned.zoneId && observed.zoneId && planned.zoneId !== observed.zoneId) {
        findings.push({
          id: `drift-placement-zone-${planned.id}`,
          type: "placement_drift",
          severity: "medium",
          title: `Zone placement drift on ${planned.name}`,
          description: `Resource "${planned.name}" is planned in zone "${planned.zoneId}" but running in zone "${observed.zoneId}".`,
          resourceId: planned.id,
          plannedValue: planned.zoneId,
          actualValue: observed.zoneId,
        });
      }

      // Check configuration drift
      for (const key of trackedKeys) {
        const plannedVal = planned.configuration?.[key];
        const observedVal = observed.configuration?.[key];

        if (plannedVal !== undefined && observedVal !== undefined && plannedVal !== observedVal) {
          findings.push({
            id: `drift-config-${planned.id}-${key}`,
            type: "configuration_drift",
            severity: "medium",
            title: `Configuration drift on ${planned.name} (${key})`,
            description: `Attribute "${key}" has drifted. Planned: ${String(plannedVal)}, Observed: ${String(observedVal)}.`,
            resourceId: planned.id,
            plannedValue: plannedVal,
            actualValue: observedVal,
          });
        }
      }
    }

    // 4. Unmapped Workloads (Observed workloads with no logical mapping)
    const mappedResourceIds = new Set(plannedTopology.mappings.map((m) => m.infrastructureResourceId));
    const workloadTypes = new Set(["k8s_workload", "vm", "serverless_function"]);

    for (const observed of observedResources) {
      if (workloadTypes.has(observed.type) && !mappedResourceIds.has(observed.id)) {
        findings.push({
          id: `drift-unmapped-workload-${observed.id}`,
          type: "unmapped_workload",
          severity: "low",
          title: `Unmapped workload: ${observed.name}`,
          description: `Workload "${observed.name}" has no mapped logical service in the architecture model.`,
          resourceId: observed.id,
          plannedValue: null,
          actualValue: observed.name,
        });
      }
    }

    return findings;
  }
}

