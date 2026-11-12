import {
  SUPPORTED_TEMPLATE_SCHEMA_VERSIONS,
  type ArchitectureTemplate,
  type TemplateExport,
  type TemplateImportPreview,
  type TemplateImportResult,
} from "./template-schemas";
import {
  computeTemplateContentHash,
  resolveTemplateTopology,
  validateTemplateDefinition,
} from "./template-validation";

export const TEMPLATE_IMPORT_LIMITS = {
  maxFileBytes: 512 * 1024, // 512 KB
  maxNodes: 120,
  maxEdges: 300,
  maxScenarios: 25,
  maxWalkthroughSteps: 40,
  maxObjectDepth: 14,
  maxStringLength: 8000,
} as const;

function sanitizeUntrustedText(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:[^\s]*/gi, "")
    .replace(/on\w+=\s*["'][^"']*["']/gi, "")
    .slice(0, TEMPLATE_IMPORT_LIMITS.maxStringLength);
}

function measureDepthAndCheckStrings(
  value: unknown,
  currentDepth = 0
): { maxDepth: number; oversizedStrings: number } {
  if (currentDepth > TEMPLATE_IMPORT_LIMITS.maxObjectDepth) {
    return { maxDepth: currentDepth, oversizedStrings: 0 };
  }
  if (typeof value === "string") {
    return {
      maxDepth: currentDepth,
      oversizedStrings: value.length > TEMPLATE_IMPORT_LIMITS.maxStringLength ? 1 : 0,
    };
  }
  if (Array.isArray(value)) {
    let maxD = currentDepth;
    let over = 0;
    for (const item of value) {
      const res = measureDepthAndCheckStrings(item, currentDepth + 1);
      maxD = Math.max(maxD, res.maxDepth);
      over += res.oversizedStrings;
      if (maxD > TEMPLATE_IMPORT_LIMITS.maxObjectDepth) break;
    }
    return { maxDepth: maxD, oversizedStrings: over };
  }
  if (value && typeof value === "object") {
    let maxD = currentDepth;
    let over = 0;
    for (const v of Object.values(value)) {
      const res = measureDepthAndCheckStrings(v, currentDepth + 1);
      maxD = Math.max(maxD, res.maxDepth);
      over += res.oversizedStrings;
      if (maxD > TEMPLATE_IMPORT_LIMITS.maxObjectDepth) break;
    }
    return { maxDepth: maxD, oversizedStrings: over };
  }
  return { maxDepth: currentDepth, oversizedStrings: 0 };
}

function deepSanitizeStrings<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeUntrustedText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepSanitizeStrings(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepSanitizeStrings(v);
    }
    return out as T;
  }
  return value;
}

export function exportTemplateToPayload(
  template: ArchitectureTemplate,
  schemaVersion: 1 | 2 = 1,
  nowIso = "2026-11-12T00:00:00.000Z"
): TemplateExport {
  const integrityHash = computeTemplateContentHash({
    manifest: template.manifest,
    nodes: template.topology.nodes,
    edges: template.topology.edges,
    scenarios: template.scenarios,
    walkthroughs: template.walkthroughs,
  });

  return {
    exportSchemaVersion: schemaVersion,
    exportedAtIso: nowIso,
    integrityHash,
    manifest: JSON.parse(JSON.stringify(template.manifest)),
    educationalMetadata: {
      problemSolved: template.problemSolved,
      learningObjectives: [...template.learningObjectives],
      requestFlowSummary: template.requestFlowSummary,
      dataFlowSummary: template.dataFlowSummary,
      consistencyGuarantees: template.consistencyGuarantees,
      failureBehaviorSummary: template.failureBehaviorSummary,
      securityBoundariesSummary: template.securityBoundariesSummary,
      operationalLimitations: [...template.operationalLimitations],
      tradeOffsSummary: [...template.tradeOffsSummary],
      constraints: JSON.parse(JSON.stringify(template.constraints)),
      componentExplanations: JSON.parse(
        JSON.stringify(template.componentExplanations)
      ),
      designDecisions: JSON.parse(JSON.stringify(template.designDecisions)),
      alternatives: JSON.parse(JSON.stringify(template.alternatives)),
      relatedTemplateIds: [...template.relatedTemplateIds],
      relatedChallengeIds: [...template.relatedChallengeIds],
      relatedLabIds: [...template.relatedLabIds],
    },
    topology: {
      nodes: JSON.parse(JSON.stringify(template.topology.nodes)),
      edges: JSON.parse(JSON.stringify(template.topology.edges)),
      dependencies: JSON.parse(JSON.stringify(template.topology.dependencies)),
      layout: JSON.parse(JSON.stringify(template.topology.layout)),
    },
    scenarios: JSON.parse(JSON.stringify(template.scenarios)),
    walkthroughs: JSON.parse(JSON.stringify(template.walkthroughs)),
  };
}

export function exportTemplateToJson(
  template: ArchitectureTemplate,
  schemaVersion: 1 | 2 = 1
): string {
  return JSON.stringify(exportTemplateToPayload(template, schemaVersion), null, 2);
}

/**
 * Migrates schema version 1 payloads cleanly to canonical version 1 internal
 * structure while preserving any extended metadata fields without silent drops.
 */
export function migrateTemplatePayload(
  raw: Record<string, unknown>
): {
  migrated: Record<string, unknown>;
  migratedFromVersion: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  const exportVersion =
    typeof raw.exportSchemaVersion === "number" ? raw.exportSchemaVersion : 1;

  if (
    !SUPPORTED_TEMPLATE_SCHEMA_VERSIONS.includes(
      exportVersion as (typeof SUPPORTED_TEMPLATE_SCHEMA_VERSIONS)[number]
    )
  ) {
    throw new Error(`Unsupported template exportSchemaVersion "${String(raw.exportSchemaVersion)}".`);
  }

  const migrated = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  if (exportVersion === 2) {
    // Preserve extra v2 fields in educationalMetadata assumptions rather than discarding silently
    if (raw.extensions && typeof raw.extensions === "object") {
      warnings.push(
        "Export schema v2 extensions preserved in imported template metadata."
      );
    }
    migrated.exportSchemaVersion = 1;
  }

  return {
    migrated,
    migratedFromVersion: exportVersion,
    warnings,
  };
}

export function previewTemplateImportJson(rawJson: string): TemplateImportPreview {
  const errors: string[] = [];
  const warnings: string[] = [];

  const bytes = new TextEncoder().encode(rawJson).length;
  if (bytes > TEMPLATE_IMPORT_LIMITS.maxFileBytes) {
    return {
      valid: false,
      title: "Oversized Import",
      slug: "oversized-import",
      nodeCount: 0,
      edgeCount: 0,
      scenarioCount: 0,
      walkthroughCount: 0,
      validationErrors: [
        `Payload byte size (${bytes}) exceeds limit of ${TEMPLATE_IMPORT_LIMITS.maxFileBytes} bytes.`,
      ],
      compatibilityWarnings: [],
    };
  }

  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(rawJson);
  } catch {
    return {
      valid: false,
      title: "Invalid JSON",
      slug: "invalid-json",
      nodeCount: 0,
      edgeCount: 0,
      scenarioCount: 0,
      walkthroughCount: 0,
      validationErrors: ["Malformed JSON payload."],
      compatibilityWarnings: [],
    };
  }

  if (!parsedUnknown || typeof parsedUnknown !== "object" || Array.isArray(parsedUnknown)) {
    return {
      valid: false,
      title: "Invalid Payload",
      slug: "invalid-payload",
      nodeCount: 0,
      edgeCount: 0,
      scenarioCount: 0,
      walkthroughCount: 0,
      validationErrors: ["Root JSON value must be an object."],
      compatibilityWarnings: [],
    };
  }

  const depthRes = measureDepthAndCheckStrings(parsedUnknown);
  if (depthRes.maxDepth > TEMPLATE_IMPORT_LIMITS.maxObjectDepth) {
    errors.push(
      `Nested object depth (${depthRes.maxDepth}) exceeds maximum allowed (${TEMPLATE_IMPORT_LIMITS.maxObjectDepth}).`
    );
  }
  if (depthRes.oversizedStrings > 0) {
    errors.push(
      `${depthRes.oversizedStrings} string field(s) exceeded maximum length of ${TEMPLATE_IMPORT_LIMITS.maxStringLength} chars.`
    );
  }

  let migratedFromVersion = 1;
  let obj = parsedUnknown as Record<string, unknown>;
  try {
    const mig = migrateTemplatePayload(obj);
    obj = mig.migrated;
    migratedFromVersion = mig.migratedFromVersion;
    warnings.push(...mig.warnings);
  } catch (err) {
    return {
      valid: false,
      title: "Unsupported Schema",
      slug: "unsupported-schema",
      nodeCount: 0,
      edgeCount: 0,
      scenarioCount: 0,
      walkthroughCount: 0,
      validationErrors: [err instanceof Error ? err.message : "Migration failed"],
      compatibilityWarnings: warnings,
    };
  }

  const sanitized = deepSanitizeStrings(obj) as Partial<TemplateExport>;
  const nodeCount = Array.isArray(sanitized.topology?.nodes)
    ? sanitized.topology!.nodes.length
    : 0;
  const edgeCount = Array.isArray(sanitized.topology?.edges)
    ? sanitized.topology!.edges.length
    : 0;
  const scenarioCount = Array.isArray(sanitized.scenarios)
    ? sanitized.scenarios.length
    : 0;
  const walkthroughCount = Array.isArray(sanitized.walkthroughs)
    ? sanitized.walkthroughs.length
    : 0;

  if (nodeCount > TEMPLATE_IMPORT_LIMITS.maxNodes) {
    errors.push(`Node count (${nodeCount}) exceeds maximum of ${TEMPLATE_IMPORT_LIMITS.maxNodes}.`);
  }
  if (edgeCount > TEMPLATE_IMPORT_LIMITS.maxEdges) {
    errors.push(`Edge count (${edgeCount}) exceeds maximum of ${TEMPLATE_IMPORT_LIMITS.maxEdges}.`);
  }
  if (scenarioCount > TEMPLATE_IMPORT_LIMITS.maxScenarios) {
    errors.push(`Scenario count (${scenarioCount}) exceeds maximum of ${TEMPLATE_IMPORT_LIMITS.maxScenarios}.`);
  }
  if (
    Array.isArray(sanitized.walkthroughs) &&
    sanitized.walkthroughs.some(
      (w) => Array.isArray(w.steps) && w.steps.length > TEMPLATE_IMPORT_LIMITS.maxWalkthroughSteps
    )
  ) {
    errors.push(
      `Walkthrough step count exceeds maximum of ${TEMPLATE_IMPORT_LIMITS.maxWalkthroughSteps}.`
    );
  }

  if (!sanitized.manifest || !sanitized.topology || !sanitized.educationalMetadata) {
    errors.push("Missing required manifest, topology, or educationalMetadata section.");
    return {
      valid: false,
      migratedFromVersion,
      title: String(sanitized.manifest?.title ?? "Incomplete Template"),
      slug: String(sanitized.manifest?.slug ?? "incomplete-template"),
      nodeCount,
      edgeCount,
      scenarioCount,
      walkthroughCount,
      validationErrors: errors,
      compatibilityWarnings: warnings,
    };
  }

  if (errors.length === 0) {
    const candidate = buildImportedTemplateObject(sanitized as TemplateExport, "preview_user");
    const validation = validateTemplateDefinition(candidate);
    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    const declaredHash =
      typeof sanitized.integrityHash === "string" ? sanitized.integrityHash : "";
    const recomputedHash = computeTemplateContentHash({
      manifest: candidate.manifest,
      nodes: candidate.topology.nodes,
      edges: candidate.topology.edges,
      scenarios: candidate.scenarios,
      walkthroughs: candidate.walkthroughs,
    });
    if (declaredHash && declaredHash !== recomputedHash) {
      warnings.push(
        "Integrity checksum mismatch: exported template contents differ from declared integrityHash."
      );
    }
  }

  return {
    valid: errors.length === 0,
    migratedFromVersion,
    title: sanitized.manifest.title,
    slug: sanitized.manifest.slug,
    nodeCount,
    edgeCount,
    scenarioCount,
    walkthroughCount,
    validationErrors: errors,
    compatibilityWarnings: warnings,
  };
}

function buildImportedTemplateObject(
  exp: TemplateExport,
  ownerId: string,
  nowIso = "2026-11-12T00:00:00.000Z"
): ArchitectureTemplate {
  const topology = resolveTemplateTopology({
    revisionId: exp.manifest.architectureRevisionId,
    title: exp.manifest.title,
    nodes: exp.topology.nodes,
    edges: exp.topology.edges,
    dependencies: exp.topology.dependencies ?? [],
    layout: exp.topology.layout ?? {
      direction: "LR",
      useAutoLayout: false,
      groups: [],
      viewport: { x: 0, y: 0, zoom: 0.9 },
    },
  });

  const manifest = {
    ...exp.manifest,
    visibility:
      exp.manifest.visibility === "system" ? ("private" as const) : exp.manifest.visibility,
  };

  const contentHash = computeTemplateContentHash({
    manifest,
    nodes: topology.nodes,
    edges: topology.edges,
    scenarios: exp.scenarios,
    walkthroughs: exp.walkthroughs,
  });

  return {
    manifest,
    source: "imported",
    ownerId,
    workspaceId: null,
    publication: {
      status: "READY",
      qualityGatePassed: true,
      validationErrors: [],
      validationWarnings: [],
    },
    versionRecord: {
      id: `${manifest.id}_v${manifest.version}`,
      templateId: manifest.id,
      version: manifest.version,
      changelog: "Imported external template package",
      immutable: false,
      contentHash,
      createdAtIso: nowIso,
      status: "READY",
    },
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    problemSolved: exp.educationalMetadata.problemSolved,
    learningObjectives: exp.educationalMetadata.learningObjectives,
    requestFlowSummary: exp.educationalMetadata.requestFlowSummary,
    dataFlowSummary: exp.educationalMetadata.dataFlowSummary,
    consistencyGuarantees: exp.educationalMetadata.consistencyGuarantees,
    failureBehaviorSummary: exp.educationalMetadata.failureBehaviorSummary,
    securityBoundariesSummary: exp.educationalMetadata.securityBoundariesSummary,
    operationalLimitations: exp.educationalMetadata.operationalLimitations,
    tradeOffsSummary: exp.educationalMetadata.tradeOffsSummary,
    constraints: exp.educationalMetadata.constraints ?? [],
    componentExplanations: exp.educationalMetadata.componentExplanations,
    designDecisions: exp.educationalMetadata.designDecisions,
    alternatives: exp.educationalMetadata.alternatives ?? [],
    topology,
    scenarios: exp.scenarios,
    walkthroughs: exp.walkthroughs,
    simulationCapabilities: ["latency", "throughput", "availability", "cost", "fault-injection"],
    unsupportedCapabilities: [],
    relatedTemplateIds: exp.educationalMetadata.relatedTemplateIds ?? [],
    relatedChallengeIds: exp.educationalMetadata.relatedChallengeIds ?? [],
    relatedLabIds: exp.educationalMetadata.relatedLabIds ?? [],
    learningPathIds: [],
  };
}

export function importTemplateFromJson(params: {
  rawJson: string;
  ownerId: string;
  idempotencyKey?: string;
  existingImportsByIdempotencyKey?: Map<string, ArchitectureTemplate>;
  nowIso?: string;
}): TemplateImportResult {
  if (
    params.idempotencyKey &&
    params.existingImportsByIdempotencyKey?.has(params.idempotencyKey)
  ) {
    const existing = params.existingImportsByIdempotencyKey.get(params.idempotencyKey)!;
    return {
      accepted: true,
      idempotentReplay: true,
      preview: {
        valid: true,
        title: existing.manifest.title,
        slug: existing.manifest.slug,
        nodeCount: existing.topology.nodes.length,
        edgeCount: existing.topology.edges.length,
        scenarioCount: existing.scenarios.length,
        walkthroughCount: existing.walkthroughs.length,
        validationErrors: [],
        compatibilityWarnings: [],
      },
      template: existing,
    };
  }

  const preview = previewTemplateImportJson(params.rawJson);
  if (!preview.valid) {
    return {
      accepted: false,
      idempotentReplay: false,
      preview,
    };
  }

  const obj = migrateTemplatePayload(
    deepSanitizeStrings(JSON.parse(params.rawJson)) as Record<string, unknown>
  ).migrated as unknown as TemplateExport;

  const built = buildImportedTemplateObject(
    obj,
    params.ownerId,
    params.nowIso ?? "2026-11-12T00:00:00.000Z"
  );

  if (params.idempotencyKey && params.existingImportsByIdempotencyKey) {
    params.existingImportsByIdempotencyKey.set(params.idempotencyKey, built);
  }

  return {
    accepted: true,
    idempotentReplay: false,
    preview,
    template: built,
  };
}
