import { CURRENT_GRAPH_SCHEMA_VERSION, type GraphDocument } from "@nxtqr/graph-schema";
import { ArchitectureAnalysisExecutionEngine } from "../analysis/analysis-execution-engine";
import {
  cloneRevisionImmutable,
  computeSemanticDiff,
  withComputedRevisionHash,
} from "../analysis/revisions/revision-diff-engine";
import {
  computeTemplateContentHash,
  resolveTemplateTopology,
  validateTemplateDefinition,
} from "./template-validation";
import type {
  ArchitectureTemplate,
  TemplateComparison,
  TemplateDiffReport,
  TemplateInstantiation,
  TemplatePermission,
  TemplateVariant,
} from "./template-schemas";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function evaluateTemplatePermission(params: {
  template: ArchitectureTemplate;
  userId?: string;
  workspaceIds?: string[];
}): TemplatePermission {
  const { template, userId, workspaceIds = [] } = params;
  const vis = template.manifest.visibility;
  const isOwner = Boolean(userId && userId === template.ownerId && template.source !== "builtin");
  const inWorkspace = Boolean(
    template.workspaceId && workspaceIds.includes(template.workspaceId)
  );

  const canView =
    vis === "system" ||
    (vis === "public" && template.publication.status === "PUBLISHED") ||
    (vis === "workspace" && (isOwner || inWorkspace)) ||
    (vis === "private" && isOwner);

  const isSystem = template.source === "builtin" || vis === "system";
  const isPublished = template.publication.status === "PUBLISHED";

  // Published versions are strictly immutable; edits create a draft/new semver revision
  const canEdit = !isSystem && isOwner && !isPublished;
  const canPublish = !isSystem && isOwner;
  const canDelete = !isSystem && isOwner;
  const canExport = canView;
  const canShareToWorkspace = !isSystem && isOwner;

  return {
    ownerId: template.ownerId,
    workspaceId: template.workspaceId,
    visibility: vis,
    canView,
    canEdit,
    canPublish,
    canDelete,
    canExport,
    canShareToWorkspace,
  };
}

/**
 * Instantiates an immutable published or workspace template into a project-scoped
 * architecture revision without ever mutating the source template.
 */
export function instantiateTemplate(params: {
  template: ArchitectureTemplate;
  userId: string;
  targetProjectId: string;
  targetDocumentId?: string;
  idempotencyKey?: string;
  nowIso?: string;
}): TemplateInstantiation {
  const validation = validateTemplateDefinition(params.template);
  if (!validation.valid) {
    throw new Error(
      `Cannot instantiate invalid template "${params.template.manifest.slug}": ${validation.errors.join("; ")}`
    );
  }

  const perm = evaluateTemplatePermission({
    template: params.template,
    userId: params.userId,
    workspaceIds: params.template.workspaceId ? [params.template.workspaceId] : [],
  });
  if (!perm.canView) {
    throw new Error(
      `Access denied: user "${params.userId}" cannot view template "${params.template.manifest.slug}".`
    );
  }

  const nowIso = params.nowIso ?? "2026-11-12T00:00:00.000Z";
  const suffix = (params.idempotencyKey || params.targetProjectId)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 16);

  const clonedNodes = deepClone(params.template.topology.resolvedNodes);
  const clonedEdges = deepClone(params.template.topology.resolvedEdges);
  const analysisRevision = cloneRevisionImmutable(
    params.template.topology.analysisRevision,
    `rev_${params.template.manifest.slug}_${suffix}`,
    `${params.template.manifest.title} (Instance)`
  );

  return {
    instantiationId: `inst_${params.template.manifest.id}_${suffix}`,
    idempotencyKey: params.idempotencyKey,
    templateId: params.template.manifest.id,
    templateVersionId: params.template.versionRecord.id,
    templateVersion: params.template.manifest.version,
    targetProjectId: params.targetProjectId,
    targetDocumentId: params.targetDocumentId ?? `doc_${params.targetProjectId}`,
    architectureRevisionId: analysisRevision.revisionId,
    createdByUserId: params.userId,
    createdAtIso: nowIso,
    sourceAttribution: {
      sourceTemplateId: params.template.manifest.id,
      sourceTemplateSlug: params.template.manifest.slug,
      sourceTemplateTitle: params.template.manifest.title,
      sourceTemplateVersion: params.template.manifest.version,
      sourceContentHash: params.template.versionRecord.contentHash,
    },
    nodes: clonedNodes,
    edges: clonedEdges,
    analysisRevision,
  };
}

export function instantiationToGraphDocument(
  inst: TemplateInstantiation,
  title?: string
): GraphDocument {
  return {
    id: inst.targetDocumentId,
    schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
    visualizerType: "system-design",
    title: title ?? `${inst.sourceAttribution.sourceTemplateTitle}`,
    nodes: deepClone(inst.nodes),
    edges: deepClone(inst.edges),
    viewport: { x: 0, y: 0, zoom: 0.9 },
    metadata: {
      projectId: inst.targetProjectId,
      templateAttribution: deepClone(inst.sourceAttribution),
      instantiationId: inst.instantiationId,
      architectureRevisionId: inst.architectureRevisionId,
    },
  };
}

export function createTemplateVariant(params: {
  baseTemplate: ArchitectureTemplate;
  name: string;
  ownerId: string;
  variantId?: string;
  nowIso?: string;
}): TemplateVariant {
  const nowIso = params.nowIso ?? "2026-11-12T00:00:00.000Z";
  const vid =
    params.variantId ??
    `var_${params.baseTemplate.manifest.slug}_${params.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 24)}`;

  const analysisRevision = cloneRevisionImmutable(
    params.baseTemplate.topology.analysisRevision,
    `${vid}_rev`,
    params.name
  );

  return {
    variantId: vid,
    name: params.name,
    baseTemplateId: params.baseTemplate.manifest.id,
    baseTemplateVersion: params.baseTemplate.manifest.version,
    ownerId: params.ownerId,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    nodes: deepClone(params.baseTemplate.topology.resolvedNodes),
    edges: deepClone(params.baseTemplate.topology.resolvedEdges),
    analysisRevision,
  };
}

export function createNextTemplateVersionDraft(params: {
  sourceTemplate: ArchitectureTemplate;
  newVersion: string;
  ownerId: string;
  changelog: string;
  newTitle?: string;
  visibility?: ArchitectureTemplate["manifest"]["visibility"];
  nowIso?: string;
}): ArchitectureTemplate {
  if (!/^\d+\.\d+\.\d+$/.test(params.newVersion)) {
    throw new Error(`Invalid semantic version "${params.newVersion}". Expected X.Y.Z`);
  }
  const nowIso = params.nowIso ?? "2026-11-12T00:00:00.000Z";
  const cloned = deepClone(params.sourceTemplate);
  const newRevId = `${cloned.manifest.architectureRevisionId}_v${params.newVersion.replace(/\./g, "_")}`;

  const topology = resolveTemplateTopology({
    revisionId: newRevId,
    title: params.newTitle ?? cloned.manifest.title,
    nodes: cloned.topology.nodes,
    edges: cloned.topology.edges,
    dependencies: cloned.topology.dependencies,
    layout: cloned.topology.layout,
  });

  const manifest = {
    ...cloned.manifest,
    title: params.newTitle ?? cloned.manifest.title,
    version: params.newVersion,
    architectureRevisionId: newRevId,
    visibility:
      params.visibility ??
      (cloned.source === "builtin" ? "private" : cloned.manifest.visibility),
  };

  const scenarios = cloned.scenarios.map((s) => ({
    ...s,
    templateVersionId: `${manifest.id}_v${params.newVersion}`,
  }));
  const walkthroughs = cloned.walkthroughs.map((w) => ({
    ...w,
    templateVersionId: `${manifest.id}_v${params.newVersion}`,
  }));

  const contentHash = computeTemplateContentHash({
    manifest,
    nodes: topology.nodes,
    edges: topology.edges,
    scenarios,
    walkthroughs,
  });

  return {
    ...cloned,
    manifest,
    source: "user",
    ownerId: params.ownerId,
    publication: {
      status: "DRAFT",
      qualityGatePassed: false,
      validationErrors: [],
      validationWarnings: [],
    },
    versionRecord: {
      id: `${manifest.id}_v${params.newVersion}`,
      templateId: manifest.id,
      version: params.newVersion,
      changelog: params.changelog,
      immutable: false,
      contentHash,
      createdAtIso: nowIso,
      status: "DRAFT",
    },
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    topology,
    scenarios,
    walkthroughs,
    sourceAttribution: {
      sourceTemplateId: params.sourceTemplate.manifest.id,
      sourceTemplateSlug: params.sourceTemplate.manifest.slug,
      sourceTemplateVersion: params.sourceTemplate.manifest.version,
    },
  };
}

/**
 * Compares baseline template vs candidate template or modified variant
 * using Phase 05.4.22 revision diffing & deterministic simulation execution.
 */
export function compareTemplateDesigns(params: {
  baselineLabel: string;
  baselineRevision: ArchitectureTemplate["topology"]["analysisRevision"];
  candidateLabel: string;
  candidateRevision: ArchitectureTemplate["topology"]["analysisRevision"];
  workloadRps?: number;
  seed?: number;
}): TemplateComparison {
  const baseRev = withComputedRevisionHash(params.baselineRevision);
  const candRev = withComputedRevisionHash(params.candidateRevision);
  const revisionDiff = computeSemanticDiff(baseRev, candRev);

  const changedNodes = revisionDiff.modifiedComponents.map((m) => ({
    nodeId: m.componentId,
    changes: m.changes,
  }));

  const addedEdges = revisionDiff.changedEdges
    .filter((e) => e.startsWith("+"))
    .map((e) => e.slice(1));
  const removedEdges = revisionDiff.changedEdges
    .filter((e) => e.startsWith("-"))
    .map((e) => e.slice(1));

  const diff: TemplateDiffReport = {
    addedNodes: revisionDiff.addedComponents,
    removedNodes: revisionDiff.removedComponents,
    changedNodes,
    addedEdges,
    removedEdges,
    revisionDiff,
  };

  const workloadRps = params.workloadRps ?? 600;
  const seed = params.seed ?? 42;

  const sim = ArchitectureAnalysisExecutionEngine.runExperiment({
    version: 1,
    id: `cmp_${baseRev.revisionId}_${candRev.revisionId}`,
    projectId: "proj_template_comparison",
    label: `${params.baselineLabel} vs ${params.candidateLabel}`,
    architectureRevisionId: candRev.revisionId,
    workloadRps: Math.min(10000, Math.max(10, workloadRps)),
    durationMs: 600,
    seed,
    scoringEnabled: true,
    baselineRevision: baseRev,
    candidateRevision: candRev,
    fault: {
      id: "f_none",
      type: "none",
      targetComponentId: baseRev.components[0]?.id ?? "entry",
      atMs: 0,
      durationMs: 100,
    },
    constraints: [],
    objectives: [
      { id: "obj_perf", dimension: "performance", weight: 0.4, targetDirection: "minimize" },
      { id: "obj_rel", dimension: "reliability", weight: 0.35, targetDirection: "maximize" },
      { id: "obj_cost", dimension: "cost", weight: 0.25, targetDirection: "minimize" },
    ],
  });

  const baseMetrics = sim.finalState.baselineMetrics;
  const candMetrics = sim.finalState.candidateMetrics;
  const performanceDeltaPct =
    baseMetrics.p95LatencyMs > 0
      ? Number(
          (
            ((candMetrics.p95LatencyMs - baseMetrics.p95LatencyMs) /
              baseMetrics.p95LatencyMs) *
            100
          ).toFixed(2)
        )
      : 0;
  const costDeltaUsd = Number(
    (candMetrics.estimatedMonthlyCostUsd - baseMetrics.estimatedMonthlyCostUsd).toFixed(2)
  );
  const reliabilityDelta = Number(
    (candMetrics.simulatedAvailability - baseMetrics.simulatedAvailability).toFixed(5)
  );
  const complexityDelta =
    candRev.components.length -
    baseRev.components.length +
    (candRev.edges.length - baseRev.edges.length);

  return {
    baselineLabel: params.baselineLabel,
    candidateLabel: params.candidateLabel,
    diff,
    baselineMetrics: baseMetrics,
    candidateMetrics: candMetrics,
    performanceDeltaPct,
    costDeltaUsd,
    reliabilityDelta,
    complexityDelta,
    summary: `p95 delta ${performanceDeltaPct > 0 ? "+" : ""}${performanceDeltaPct}%, monthly cost delta ${costDeltaUsd >= 0 ? "+$" : "-$"}${Math.abs(costDeltaUsd)}, complexity delta ${complexityDelta >= 0 ? "+" : ""}${complexityDelta}.`,
  };
}
