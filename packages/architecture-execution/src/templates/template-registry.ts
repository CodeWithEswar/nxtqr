import { BUILTIN_ARCHITECTURE_TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_LEARNING_PATHS } from "./template-catalog-data";
import { compareTemplateDesigns, createNextTemplateVersionDraft, createTemplateVariant, evaluateTemplatePermission, instantiateTemplate } from "./template-instantiation";
import type {
  ArchitectureTemplate,
  ArchitectureTemplateManifest,
  TemplateCategoryDefinition,
  TemplateCategoryId,
  TemplateComparison,
  TemplateDifficulty,
  TemplateInstantiation,
  TemplateLearningPath,
  TemplateSearchQuery,
  TemplateSearchResult,
  TemplateUsageMetrics,
  TemplateValidationResult,
  TemplateVariant,
} from "./template-schemas";
import { TemplatePublicationLifecycle, resolveTemplateTopology, validateTemplateDefinition } from "./template-validation";

const DIFFICULTY_RANK: Record<TemplateDifficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export class TemplateRegistry {
  private readonly templatesById = new Map<string, ArchitectureTemplate>();
  private readonly idBySlug = new Map<string, string>();
  private readonly versionsByTemplateId = new Map<string, Map<string, ArchitectureTemplate>>();
  private readonly usageByTemplateId = new Map<string, TemplateUsageMetrics>();

  constructor(initialTemplates: ArchitectureTemplate[] = BUILTIN_ARCHITECTURE_TEMPLATES) {
    for (const tpl of initialTemplates) {
      this.register(tpl);
    }
  }

  public getCategories(): TemplateCategoryDefinition[] {
    return [...TEMPLATE_CATEGORIES].sort((a, b) => a.order - b.order);
  }

  public getLearningPaths(): TemplateLearningPath[] {
    return TEMPLATE_LEARNING_PATHS.map((lp) => ({ ...lp }));
  }

  public getLearningPathById(pathId: string): TemplateLearningPath | undefined {
    return TEMPLATE_LEARNING_PATHS.find((lp) => lp.id === pathId);
  }

  public register(template: ArchitectureTemplate): TemplateValidationResult {
    const validation = validateTemplateDefinition(template);
    const stored: ArchitectureTemplate = {
      ...template,
      publication: {
        ...template.publication,
        qualityGatePassed: validation.valid,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
      },
    };

    const existing = this.templatesById.get(stored.manifest.id);
    if (
      existing &&
      existing.publication.status === "PUBLISHED" &&
      existing.versionRecord.version === stored.versionRecord.version &&
      existing.versionRecord.contentHash !== stored.versionRecord.contentHash
    ) {
      throw new Error(
        `Immutability violation: published template "${stored.manifest.slug}" v${stored.versionRecord.version} cannot be overwritten in place.`
      );
    }

    this.templatesById.set(stored.manifest.id, stored);
    this.idBySlug.set(stored.manifest.slug, stored.manifest.id);

    let verMap = this.versionsByTemplateId.get(stored.manifest.id);
    if (!verMap) {
      verMap = new Map();
      this.versionsByTemplateId.set(stored.manifest.id, verMap);
    }
    verMap.set(stored.versionRecord.version, stored);

    if (!this.usageByTemplateId.has(stored.manifest.id)) {
      this.usageByTemplateId.set(stored.manifest.id, {
        templateId: stored.manifest.id,
        opensCount: 0,
        instantiationsCount: 0,
        scenarioRunsCount: 0,
        walkthroughCompletionsCount: 0,
        labLaunchesCount: 0,
      });
    }

    return validation;
  }

  public getById(id: string, version?: string): ArchitectureTemplate | undefined {
    if (version) {
      return this.versionsByTemplateId.get(id)?.get(version);
    }
    return this.templatesById.get(id);
  }

  public getBySlug(slug: string, version?: string): ArchitectureTemplate | undefined {
    const id = this.idBySlug.get(slug);
    if (!id) return undefined;
    return this.getById(id, version);
  }

  public listVersions(id: string): ArchitectureTemplate[] {
    const verMap = this.versionsByTemplateId.get(id);
    if (!verMap) return [];
    return Array.from(verMap.values());
  }

  public listAll(): ArchitectureTemplate[] {
    return Array.from(this.templatesById.values());
  }

  public validateById(id: string): TemplateValidationResult | undefined {
    const tpl = this.templatesById.get(id);
    if (!tpl) return undefined;
    return validateTemplateDefinition(tpl);
  }

  public resolveById(id: string) {
    const tpl = this.templatesById.get(id);
    if (!tpl) return undefined;
    return resolveTemplateTopology({
      revisionId: tpl.manifest.architectureRevisionId,
      title: tpl.manifest.title,
      nodes: tpl.topology.nodes,
      edges: tpl.topology.edges,
      dependencies: tpl.topology.dependencies,
      layout: tpl.topology.layout,
    });
  }

  public publishTemplate(id: string, nowIso?: string): ArchitectureTemplate {
    const tpl = this.templatesById.get(id);
    if (!tpl) {
      throw new Error(`Template "${id}" not found.`);
    }
    const readyOrCurrent =
      tpl.publication.status === "DRAFT"
        ? TemplatePublicationLifecycle.transition(
            TemplatePublicationLifecycle.transition(tpl, "VALIDATING", nowIso),
            "READY",
            nowIso
          )
        : tpl;
    const published = TemplatePublicationLifecycle.transition(
      readyOrCurrent,
      "PUBLISHED",
      nowIso
    );
    this.templatesById.set(id, published);
    this.versionsByTemplateId.get(id)?.set(published.versionRecord.version, published);
    return published;
  }

  public deprecateTemplate(
    id: string,
    reason: string,
    nowIso?: string
  ): ArchitectureTemplate {
    const tpl = this.templatesById.get(id);
    if (!tpl) {
      throw new Error(`Template "${id}" not found.`);
    }
    const transitioned = TemplatePublicationLifecycle.transition(
      tpl,
      "DEPRECATED",
      nowIso
    );
    const deprecated: ArchitectureTemplate = {
      ...transitioned,
      publication: {
        ...transitioned.publication,
        deprecationReason: reason,
      },
    };
    this.templatesById.set(id, deprecated);
    this.versionsByTemplateId.get(id)?.set(deprecated.versionRecord.version, deprecated);
    return deprecated;
  }

  public createNewVersionDraft(params: {
    templateId: string;
    nextVersion: string;
    changelog: string;
    ownerId?: string;
    nowIso?: string;
  }): ArchitectureTemplate {
    const base = this.templatesById.get(params.templateId);
    if (!base) {
      throw new Error(`Template "${params.templateId}" not found.`);
    }
    const draft = createNextTemplateVersionDraft({
      sourceTemplate: base,
      newVersion: params.nextVersion,
      ownerId: params.ownerId ?? base.ownerId,
      changelog: params.changelog,
      nowIso: params.nowIso,
    });
    this.register(draft);
    return draft;
  }

  public duplicateAsPersonalTemplate(params: {
    sourceTemplateId: string;
    userId: string;
    newId: string;
    newSlug: string;
    title?: string;
    visibility?: "private" | "workspace";
    workspaceId?: string | null;
    nowIso?: string;
  }): ArchitectureTemplate {
    const source = this.templatesById.get(params.sourceTemplateId);
    if (!source) {
      throw new Error(`Source template "${params.sourceTemplateId}" not found.`);
    }
    const perm = evaluateTemplatePermission({
      template: source,
      userId: params.userId,
      workspaceIds: params.workspaceId ? [params.workspaceId] : [],
    });
    if (!perm.canView) {
      throw new Error(
        `Access denied: user "${params.userId}" cannot duplicate "${source.manifest.slug}".`
      );
    }

    const cloned: ArchitectureTemplate = JSON.parse(JSON.stringify(source));
    const nowIso = params.nowIso ?? "2026-11-12T00:00:00.000Z";
    cloned.manifest.id = params.newId;
    cloned.manifest.slug = params.newSlug;
    cloned.manifest.title = params.title ?? `${source.manifest.title} (Custom)`;
    cloned.manifest.visibility = params.visibility ?? "private";
    cloned.manifest.version = "1.0.0";
    cloned.source = params.visibility === "workspace" ? "workspace" : "user";
    cloned.ownerId = params.userId;
    cloned.workspaceId = params.workspaceId ?? null;
    cloned.createdAtIso = nowIso;
    cloned.updatedAtIso = nowIso;
    cloned.publication = {
      status: "DRAFT",
      qualityGatePassed: true,
      validationErrors: [],
      validationWarnings: [],
    };
    cloned.versionRecord = {
      id: `ver_${params.newId}_1.0.0`,
      templateId: params.newId,
      version: "1.0.0",
      changelog: `Duplicated from ${source.manifest.slug} v${source.manifest.version}`,
      immutable: false,
      contentHash: source.versionRecord.contentHash,
      createdAtIso: nowIso,
      status: "DRAFT",
    };

    this.register(cloned);
    return cloned;
  }

  public instantiate(params: {
    templateId: string;
    version?: string;
    userId: string;
    targetProjectId: string;
    idempotencyKey?: string;
    nowIso?: string;
  }): TemplateInstantiation {
    const tpl = this.getById(params.templateId, params.version);
    if (!tpl) {
      throw new Error(`Template "${params.templateId}" not found.`);
    }
    const result = instantiateTemplate({
      template: tpl,
      userId: params.userId,
      targetProjectId: params.targetProjectId,
      idempotencyKey: params.idempotencyKey,
      nowIso: params.nowIso,
    });
    this.recordUsage(tpl.manifest.id, "instantiationsCount");
    return result;
  }

  public createVariantAndCompare(params: {
    templateId: string;
    variantName: string;
    userId: string;
    componentOverrides?: Array<{
      componentId: string;
      replicas?: number;
      capacityPerReplicaRps?: number;
      cacheHitRatio?: number;
      multiAz?: boolean;
    }>;
  }): { variant: TemplateVariant; comparison: TemplateComparison } {
    const tpl = this.templatesById.get(params.templateId);
    if (!tpl) {
      throw new Error(`Template "${params.templateId}" not found.`);
    }
    const variant = createTemplateVariant({
      baseTemplate: tpl,
      name: params.variantName,
      ownerId: params.userId,
    });
    if (params.componentOverrides && params.componentOverrides.length > 0) {
      variant.analysisRevision = {
        ...variant.analysisRevision,
        components: variant.analysisRevision.components.map((c) => {
          const ov = params.componentOverrides?.find((o) => o.componentId === c.id);
          if (!ov) return c;
          return {
            ...c,
            replicas: ov.replicas ?? c.replicas,
            capacityPerReplicaRps: ov.capacityPerReplicaRps ?? c.capacityPerReplicaRps,
            cacheHitRatio: ov.cacheHitRatio ?? c.cacheHitRatio,
            multiAz: ov.multiAz ?? c.multiAz,
          };
        }),
      };
    }
    const comparison = compareTemplateDesigns({
      baselineLabel: `${tpl.manifest.title} v${tpl.manifest.version}`,
      baselineRevision: tpl.topology.analysisRevision,
      candidateLabel: variant.name,
      candidateRevision: variant.analysisRevision,
    });
    return { variant, comparison };
  }

  public search(query: TemplateSearchQuery = {}): TemplateSearchResult {
    const qText = (query.query || "").trim().toLowerCase();
    const ownership = query.ownership ?? "all";
    const completionFilter = query.completionFilter ?? "all";
    const completedSet = new Set(query.completedTemplateIds || []);
    const workspaceIds = query.workspaceIds || [];

    const filtered = this.listAll().filter((tpl) => {
      const perm = evaluateTemplatePermission({
        template: tpl,
        userId: query.userId,
        workspaceIds,
      });
      if (!perm.canView) return false;

      if (ownership === "system" && tpl.source !== "builtin") return false;
      if (ownership === "personal" && tpl.ownerId !== query.userId) return false;
      if (
        ownership === "workspace" &&
        !(tpl.manifest.visibility === "workspace" || tpl.source === "workspace")
      ) {
        return false;
      }

      if (query.categoryId && query.categoryId !== "all") {
        if (!tpl.manifest.categoryIds.includes(query.categoryId as TemplateCategoryId)) {
          return false;
        }
      }

      if (query.difficulty && query.difficulty !== "all") {
        if (tpl.manifest.difficulty !== query.difficulty) return false;
      }

      if (query.patternConcept) {
        const p = query.patternConcept.toLowerCase();
        const matchesConcept =
          tpl.manifest.conceptIds.some((c) => c.toLowerCase().includes(p)) ||
          tpl.manifest.categoryIds.some((c) => c.toLowerCase().includes(p));
        if (!matchesConcept) return false;
      }

      if (query.componentType) {
        const compType = query.componentType.toLowerCase();
        if (
          !tpl.topology.nodes.some(
            (n) =>
              n.componentType.toLowerCase() === compType ||
              n.label.toLowerCase().includes(compType)
          )
        ) {
          return false;
        }
      }

      if (query.simulationCapability) {
        if (!tpl.simulationCapabilities.includes(query.simulationCapability)) {
          return false;
        }
      }

      if (
        typeof query.maxLearningMinutes === "number" &&
        tpl.manifest.estimatedLearningMinutes > query.maxLearningMinutes
      ) {
        return false;
      }

      if (completionFilter === "completed" && !completedSet.has(tpl.manifest.id)) {
        return false;
      }
      if (completionFilter === "incomplete" && completedSet.has(tpl.manifest.id)) {
        return false;
      }

      if (qText.length > 0) {
        const haystack = [
          tpl.manifest.id,
          tpl.manifest.slug,
          tpl.manifest.title,
          tpl.manifest.summary,
          tpl.manifest.description,
          ...tpl.manifest.categoryIds,
          ...tpl.manifest.conceptIds,
          ...tpl.topology.nodes.map((n) => `${n.label} ${n.componentType}`),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(qText)) return false;
      }

      return true;
    });

    const sortBy = query.sortBy ?? "recommended";
    filtered.sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.manifest.title.localeCompare(b.manifest.title);
      }
      if (sortBy === "difficulty") {
        return (
          DIFFICULTY_RANK[a.manifest.difficulty] -
          DIFFICULTY_RANK[b.manifest.difficulty]
        );
      }
      if (sortBy === "duration") {
        return (
          a.manifest.estimatedLearningMinutes -
          b.manifest.estimatedLearningMinutes
        );
      }
      if (sortBy === "recent") {
        return b.updatedAtIso.localeCompare(a.updatedAtIso);
      }
      // recommended: foundational & system templates sorted deterministically
      return a.manifest.id.localeCompare(b.manifest.id);
    });

    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.max(1, Math.min(200, query.limit ?? 50));
    const page = filtered.slice(offset, offset + limit).map((t): ArchitectureTemplateManifest => t.manifest);

    return {
      items: page,
      total: filtered.length,
      offset,
      limit,
      hasMore: offset + page.length < filtered.length,
    };
  }

  public recordUsage(
    templateId: string,
    field: Exclude<keyof TemplateUsageMetrics, "templateId">
  ): TemplateUsageMetrics | undefined {
    const metrics = this.usageByTemplateId.get(templateId);
    if (!metrics) return undefined;
    metrics[field] += 1;
    return { ...metrics };
  }

  public getUsageMetrics(templateId: string): TemplateUsageMetrics | undefined {
    const metrics = this.usageByTemplateId.get(templateId);
    return metrics ? { ...metrics } : undefined;
  }
}

export const templateRegistry = new TemplateRegistry();
