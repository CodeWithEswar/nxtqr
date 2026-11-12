import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import type {
  AnalysisComponentConfig,
  AnalysisEdgeConfig,
} from "../analysis/analysis-schemas";
import { withComputedRevisionHash } from "../analysis/revisions/revision-diff-engine";
import {
  ArchitectureTemplateManifestSchema,
  GuidedWalkthroughSchema,
  TemplateScenarioSchema,
  type ArchitectureTemplate,
  type GuidedWalkthrough,
  type TemplateDependency,
  type TemplateEdgeConfiguration,
  type TemplateLayoutMetadata,
  type TemplateNodeConfiguration,
  type TemplatePublicationStatus,
  type TemplateScenario,
  type TemplateTopology,
  type TemplateValidationResult,
} from "./template-schemas";

function fnv1aHash(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `tpl_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function computeTemplateContentHash(template: {
  manifest: ArchitectureTemplate["manifest"];
  nodes: TemplateNodeConfiguration[];
  edges: TemplateEdgeConfiguration[];
  scenarios: TemplateScenario[];
  walkthroughs: GuidedWalkthrough[];
}): string {
  const canonical = JSON.stringify({
    schemaVersion: template.manifest.schemaVersion,
    id: template.manifest.id,
    title: template.manifest.title,
    version: template.manifest.version,
    nodes: [...template.nodes]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((n) => ({ id: n.id, type: n.componentType, config: n.config, analysisProfile: n.analysisProfile })),
    edges: [...template.edges]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((e) => ({ id: e.id, source: e.source, target: e.target, mode: e.communicationMode })),
    scenarios: [...template.scenarios].sort((a, b) => a.id.localeCompare(b.id)),
    walkthroughs: [...template.walkthroughs].sort((a, b) => a.id.localeCompare(b.id)),
  });
  return fnv1aHash(canonical);
}

/**
 * Resolves canonical NXTQR BaseNode[] + BaseEdge[] via @nxtqr/node-registry
 * and maps them cleanly to an executable Phase 05.4.22 AnalysisRevision.
 */
export function resolveTemplateTopology(input: {
  revisionId: string;
  title: string;
  nodes: TemplateNodeConfiguration[];
  edges: TemplateEdgeConfiguration[];
  dependencies: TemplateDependency[];
  layout: TemplateLayoutMetadata;
}): TemplateTopology {
  const nodeLookup = new Map<string, BaseNode>();
  const resolvedNodes: BaseNode[] = [];

  for (const nodeCfg of input.nodes) {
    const registered = infrastructureRegistry.getComponent(nodeCfg.componentType);
    let node: BaseNode;
    if (registered) {
      node = infrastructureRegistry.createInfrastructureNode(nodeCfg.componentType, {
        id: nodeCfg.id,
        label: nodeCfg.label,
        position: nodeCfg.position,
        environment: nodeCfg.environment,
        config: {
          ...nodeCfg.config,
          description: nodeCfg.description,
        },
      });
    } else {
      node = {
        id: nodeCfg.id,
        type: nodeCfg.componentType,
        position: { ...nodeCfg.position },
        dimensions: { width: 200, height: 84 },
        status: "idle",
        label: nodeCfg.label,
        description: nodeCfg.description,
        data: {
          ...nodeCfg.config,
          componentType: nodeCfg.componentType,
          environment: nodeCfg.environment,
          isInfrastructure: true,
        },
        ports: [
          { id: "in", name: "In", type: "input", dataType: "Any" },
          { id: "out", name: "Out", type: "output", dataType: "Any" },
        ],
      };
    }
    nodeLookup.set(node.id, node);
    resolvedNodes.push(node);
  }

  const resolvedEdges: BaseEdge[] = input.edges.map((edgeCfg) => {
    const srcNode = nodeLookup.get(edgeCfg.source);
    const tgtNode = nodeLookup.get(edgeCfg.target);

    const srcPort =
      (edgeCfg.sourcePortId &&
        srcNode?.ports?.find((p) => p.id === edgeCfg.sourcePortId)) ||
      srcNode?.ports?.find((p) => p.type === "output" || p.type === "bidirectional") ||
      srcNode?.ports?.[0];

    const tgtPort =
      (edgeCfg.targetPortId &&
        tgtNode?.ports?.find((p) => p.id === edgeCfg.targetPortId)) ||
      tgtNode?.ports?.find((p) => p.type === "input" || p.type === "bidirectional") ||
      tgtNode?.ports?.[0];

    return {
      id: edgeCfg.id,
      source: edgeCfg.source,
      target: edgeCfg.target,
      sourceHandle: srcPort?.id,
      targetHandle: tgtPort?.id,
      sourcePort: srcPort?.id,
      targetPort: tgtPort?.id,
      type: edgeCfg.edgeType,
      status: "idle",
      label: edgeCfg.label,
      data: {
        protocol: edgeCfg.protocol,
        communicationMode: edgeCfg.communicationMode,
        retryFactor: edgeCfg.retryFactor,
      },
    };
  });

  const dependencyMap = new Map<string, string[]>();
  for (const e of input.edges) {
    const arr = dependencyMap.get(e.source) ?? [];
    if (!arr.includes(e.target)) arr.push(e.target);
    dependencyMap.set(e.source, arr);
  }

  const analysisComponents: AnalysisComponentConfig[] = input.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    kind: n.analysisKind,
    failureDomain: n.analysisProfile.failureDomain,
    region: n.analysisProfile.region,
    zone: n.analysisProfile.zone,
    multiAz: n.analysisProfile.multiAz,
    replicas: n.analysisProfile.replicas,
    capacityPerReplicaRps: n.analysisProfile.capacityPerReplicaRps,
    baseLatencyMs: n.analysisProfile.baseLatencyMs,
    maxConnectionsPerReplica: n.analysisProfile.maxConnectionsPerReplica,
    mtbfHours: n.analysisProfile.mtbfHours,
    mttrMinutes: n.analysisProfile.mttrMinutes,
    replicationMode: n.analysisProfile.replicationMode,
    replicationLagSec: n.analysisProfile.replicationLagSec,
    cacheStrategy: n.analysisProfile.cacheStrategy,
    cacheHitRatio: n.analysisProfile.cacheHitRatio,
    monthlyCostPerReplicaUsd: n.analysisProfile.monthlyCostPerReplicaUsd,
    hasBackup: n.analysisProfile.hasBackup,
    dependencyIds: dependencyMap.get(n.id) ?? [],
  }));

  const analysisEdges: AnalysisEdgeConfig[] = input.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    communicationMode: e.communicationMode,
    retryFactor: e.retryFactor,
  }));

  const analysisRevision = withComputedRevisionHash({
    revisionId: input.revisionId,
    contentHash: "",
    label: input.title,
    routingPolicy: "least_connections",
    scalingMode: "hpa_reactive",
    maxReplicas: 24,
    components: analysisComponents,
    edges: analysisEdges,
  });

  return {
    nodes: input.nodes,
    edges: input.edges,
    dependencies: input.dependencies,
    layout: input.layout,
    resolvedNodes,
    resolvedEdges,
    analysisRevision,
  };
}

export function validateTemplateDefinition(
  template: ArchitectureTemplate
): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingReferences: string[] = [];

  // 1. Manifest Validation
  const manifestRes = ArchitectureTemplateManifestSchema.safeParse(template.manifest);
  const manifestValid = manifestRes.success;
  if (!manifestRes.success) {
    for (const issue of manifestRes.error.issues) {
      errors.push(`Manifest[${issue.path.join(".")}]: ${issue.message}`);
    }
  }

  // 2. Node Compatibility & Component Configuration Validation
  const nodeIds = new Set<string>();
  const resolvedNodeMap = new Map<string, BaseNode>();
  let configsValid = true;
  let topologyValid = template.topology.nodes.length >= 2;

  if (!topologyValid) {
    errors.push("Topology must include at least 2 nodes.");
  }

  for (const node of template.topology.nodes) {
    if (nodeIds.has(node.id)) {
      topologyValid = false;
      errors.push(`Duplicate node ID "${node.id}" in template topology.`);
    }
    nodeIds.add(node.id);

    const registered = infrastructureRegistry.getComponent(node.componentType);
    if (!registered) {
      topologyValid = false;
      errors.push(
        `Unsupported node type "${node.componentType}" on node "${node.id}" (not registered in @nxtqr/node-registry).`
      );
      continue;
    }

    const cfgValidation = infrastructureRegistry.validateConfiguration(
      node.componentType,
      {
        ...registered.defaultConfig,
        ...node.config,
        label: node.label,
        environment: node.environment,
      }
    );

    if (!cfgValidation.success) {
      configsValid = false;
      for (const err of cfgValidation.errors ?? []) {
        errors.push(`Node "${node.id}" (${node.componentType}) config invalid: ${err}`);
      }
    }

    const resolved = template.topology.resolvedNodes.find((r) => r.id === node.id);
    if (resolved) resolvedNodeMap.set(node.id, resolved);
  }

  // 3. Edge & Port Compatibility Validation
  const edgeIds = new Set<string>();
  for (const edge of template.topology.edges) {
    if (edgeIds.has(edge.id)) {
      topologyValid = false;
      errors.push(`Duplicate edge ID "${edge.id}" in template topology.`);
    }
    edgeIds.add(edge.id);

    if (edge.source === edge.target) {
      topologyValid = false;
      errors.push(`Self-connection prohibited on edge "${edge.id}" (${edge.source}).`);
    }

    if (!nodeIds.has(edge.source)) {
      topologyValid = false;
      missingReferences.push(edge.source);
      errors.push(`Edge "${edge.id}" references missing source node "${edge.source}".`);
    }
    if (!nodeIds.has(edge.target)) {
      topologyValid = false;
      missingReferences.push(edge.target);
      errors.push(`Edge "${edge.id}" references missing target node "${edge.target}".`);
    }

    const resolvedEdge = template.topology.resolvedEdges.find((re) => re.id === edge.id);
    const srcNode = resolvedNodeMap.get(edge.source);
    const tgtNode = resolvedNodeMap.get(edge.target);

    if (srcNode && tgtNode) {
      const srcPortId = resolvedEdge?.sourceHandle ?? edge.sourcePortId;
      const tgtPortId = resolvedEdge?.targetHandle ?? edge.targetPortId;

      const srcPort = srcNode.ports?.find((p) => p.id === srcPortId);
      const tgtPort = tgtNode.ports?.find((p) => p.id === tgtPortId);

      if (!srcPort) {
        topologyValid = false;
        errors.push(
          `Edge "${edge.id}" sourceHandle "${String(srcPortId)}" does not exist on "${edge.source}".`
        );
      } else if (srcPort.type === "input") {
        topologyValid = false;
        errors.push(
          `Edge "${edge.id}" originates from input-only port "${srcPort.id}" on "${edge.source}".`
        );
      }

      if (!tgtPort) {
        topologyValid = false;
        errors.push(
          `Edge "${edge.id}" targetHandle "${String(tgtPortId)}" does not exist on "${edge.target}".`
        );
      } else if (tgtPort.type === "output") {
        topologyValid = false;
        errors.push(
          `Edge "${edge.id}" targets output-only port "${tgtPort.id}" on "${edge.target}".`
        );
      }
    }
  }

  // Check connectivity / orphan warning
  for (const nodeId of nodeIds) {
    const connected = template.topology.edges.some(
      (e) => e.source === nodeId || e.target === nodeId
    );
    if (!connected && nodeIds.size > 1) {
      warnings.push(`Node "${nodeId}" is isolated with no edges.`);
    }
  }

  // 4. Scenarios Validation
  let scenariosValid = template.scenarios.length > 0;
  if (template.scenarios.length === 0) {
    errors.push("Template must define at least one executable scenario.");
  }
  const scenarioIds = new Set<string>();
  for (const scenario of template.scenarios) {
    scenarioIds.add(scenario.id);
    const sRes = TemplateScenarioSchema.safeParse(scenario);
    if (!sRes.success) {
      scenariosValid = false;
      for (const issue of sRes.error.issues) {
        errors.push(`Scenario "${scenario.id}" [${issue.path.join(".")}]: ${issue.message}`);
      }
    }
    for (const fault of scenario.faultSchedule) {
      if (
        fault.targetId &&
        fault.type !== "none" &&
        fault.type !== "az_outage" &&
        fault.type !== "region_outage" &&
        !nodeIds.has(fault.targetId)
      ) {
        scenariosValid = false;
        missingReferences.push(fault.targetId);
        errors.push(
          `Scenario "${scenario.id}" targets non-existent component "${fault.targetId}".`
        );
      }
    }
    for (const overrideNodeId of Object.keys(scenario.configurationOverrides)) {
      if (!nodeIds.has(overrideNodeId)) {
        scenariosValid = false;
        missingReferences.push(overrideNodeId);
        errors.push(
          `Scenario "${scenario.id}" overrides non-existent component "${overrideNodeId}".`
        );
      }
    }
  }
  for (const sid of template.manifest.scenarioIds) {
    if (!scenarioIds.has(sid)) {
      scenariosValid = false;
      missingReferences.push(sid);
      errors.push(`Manifest references missing scenario "${sid}".`);
    }
  }

  // 5. Walkthroughs Validation
  let walkthroughsValid = template.walkthroughs.length > 0;
  if (template.walkthroughs.length === 0) {
    errors.push("Template must include at least one guided walkthrough.");
  }
  const walkthroughIds = new Set<string>();
  for (const wt of template.walkthroughs) {
    walkthroughIds.add(wt.id);
    const wRes = GuidedWalkthroughSchema.safeParse(wt);
    if (!wRes.success) {
      walkthroughsValid = false;
      for (const issue of wRes.error.issues) {
        errors.push(`Walkthrough "${wt.id}" [${issue.path.join(".")}]: ${issue.message}`);
      }
    }
    for (const step of wt.steps) {
      if (step.focusNodeId && !nodeIds.has(step.focusNodeId)) {
        walkthroughsValid = false;
        missingReferences.push(step.focusNodeId);
        errors.push(
          `Walkthrough "${wt.id}" step "${step.id}" references missing node "${step.focusNodeId}".`
        );
      }
      if (step.highlightEdgeId && !edgeIds.has(step.highlightEdgeId)) {
        walkthroughsValid = false;
        missingReferences.push(step.highlightEdgeId);
        errors.push(
          `Walkthrough "${wt.id}" step "${step.id}" references missing edge "${step.highlightEdgeId}".`
        );
      }
      if (step.scenarioId && !scenarioIds.has(step.scenarioId)) {
        walkthroughsValid = false;
        missingReferences.push(step.scenarioId);
        errors.push(
          `Walkthrough "${wt.id}" step "${step.id}" references missing scenario "${step.scenarioId}".`
        );
      }
    }
  }
  for (const wid of template.manifest.walkthroughIds) {
    if (!walkthroughIds.has(wid)) {
      walkthroughsValid = false;
      missingReferences.push(wid);
      errors.push(`Manifest references missing walkthrough "${wid}".`);
    }
  }

  // 6. Five Core Educational Pillars / Quality Gates
  const hasEducationalContent =
    template.problemSolved.trim().length >= 15 &&
    template.tradeOffsSummary.length >= 1 &&
    template.designDecisions.length >= 1 &&
    template.componentExplanations.length >= Math.min(2, nodeIds.size);

  if (!hasEducationalContent) {
    errors.push(
      "Educational quality gate failed: problem statement, design decisions, trade-offs, and component explanations are required."
    );
  }

  const simulationCompatible = template.simulationCapabilities.length > 0;
  const schemaValid = manifestValid && topologyValid && configsValid;
  const qualityGatePassed =
    errors.length === 0 &&
    manifestValid &&
    topologyValid &&
    configsValid &&
    scenariosValid &&
    walkthroughsValid &&
    simulationCompatible &&
    hasEducationalContent;

  const publicationStatus: TemplatePublicationStatus =
    template.publication.status === "DEPRECATED"
      ? "DEPRECATED"
      : qualityGatePassed
        ? template.publication.status === "PUBLISHED"
          ? "PUBLISHED"
          : "READY"
        : "REJECTED";

  return {
    valid: errors.length === 0,
    publicationStatus,
    errors,
    warnings,
    unsupportedCapabilities: [...template.unsupportedCapabilities],
    missingReferences: Array.from(new Set(missingReferences)),
    checks: {
      manifestValid,
      schemaValid,
      topologyValid,
      configsValid,
      scenariosValid,
      walkthroughsValid,
      simulationCompatible,
      qualityGatePassed,
    },
  };
}

export class TemplatePublicationLifecycle {
  public static transition(
    template: ArchitectureTemplate,
    targetStatus: TemplatePublicationStatus,
    nowIso = "2026-11-12T00:00:00.000Z"
  ): ArchitectureTemplate {
    const current = template.publication.status;
    const allowedTransitions: Record<
      TemplatePublicationStatus,
      TemplatePublicationStatus[]
    > = {
      DRAFT: ["VALIDATING", "DEPRECATED"],
      VALIDATING: ["READY", "REJECTED", "DRAFT"],
      REJECTED: ["VALIDATING", "DRAFT", "DEPRECATED"],
      READY: ["PUBLISHED", "DRAFT", "DEPRECATED"],
      PUBLISHED: ["DEPRECATED"],
      DEPRECATED: [],
    };

    if (!allowedTransitions[current].includes(targetStatus)) {
      throw new Error(
        `Invalid template publication transition: ${current} -> ${targetStatus}`
      );
    }

    if (targetStatus === "READY" || targetStatus === "PUBLISHED") {
      const report = validateTemplateDefinition(template);
      if (!report.checks.qualityGatePassed) {
        return {
          ...template,
          publication: {
            ...template.publication,
            status: "REJECTED",
            qualityGatePassed: false,
            validationErrors: report.errors,
            validationWarnings: report.warnings,
          },
          versionRecord: {
            ...template.versionRecord,
            status: "REJECTED",
          },
          updatedAtIso: nowIso,
        };
      }
      return {
        ...template,
        publication: {
          ...template.publication,
          status: targetStatus,
          publishedAtIso:
            targetStatus === "PUBLISHED" ? nowIso : template.publication.publishedAtIso,
          qualityGatePassed: true,
          validationErrors: [],
          validationWarnings: report.warnings,
        },
        versionRecord: {
          ...template.versionRecord,
          status: targetStatus,
          immutable: targetStatus === "PUBLISHED",
        },
        updatedAtIso: nowIso,
      };
    }

    return {
      ...template,
      publication: {
        ...template.publication,
        status: targetStatus,
        deprecatedAtIso:
          targetStatus === "DEPRECATED" ? nowIso : template.publication.deprecatedAtIso,
      },
      versionRecord: {
        ...template.versionRecord,
        status: targetStatus,
      },
      updatedAtIso: nowIso,
    };
  }
}
