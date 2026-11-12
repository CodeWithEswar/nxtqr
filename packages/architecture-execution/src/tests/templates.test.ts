import { describe, expect, it } from "vitest";
import {
  BUILTIN_ARCHITECTURE_TEMPLATES,
  SUPPORTED_TEMPLATE_SCHEMA_VERSIONS,
  TEMPLATE_CATEGORIES,
  TEMPLATE_LEARNING_PATHS,
  TEMPLATE_PRESET_METADATA,
  TemplateExecutionEngine,
  TemplateRegistry,
  TemplateWalkthroughEngine,
  compareTemplateDesigns,
  createTemplatePresetScenario,
  createTemplateVariant,
  evaluateTemplatePermission,
  exportTemplateToJson,
  exportTemplateToPayload,
  importTemplateFromJson,
  instantiateTemplate,
  instantiationToGraphDocument,
  previewTemplateImportJson,
  runTemplateScenarioIsolated,
  templateRegistry,
  validateTemplateDefinition,
} from "../index";

describe("Phase 05.4.24 — Architecture Templates & Scenario Library", () => {
  it("contains 110 validated built-in reference templates spanning 20 categories and 8 learning paths", () => {
    expect(TEMPLATE_CATEGORIES.length).toBe(20);
    expect(TEMPLATE_LEARNING_PATHS.length).toBe(8);
    expect(BUILTIN_ARCHITECTURE_TEMPLATES.length).toBe(110);

    const uniqueIds = new Set(BUILTIN_ARCHITECTURE_TEMPLATES.map((t) => t.manifest.id));
    const uniqueSlugs = new Set(BUILTIN_ARCHITECTURE_TEMPLATES.map((t) => t.manifest.slug));
    expect(uniqueIds.size).toBe(110);
    expect(uniqueSlugs.size).toBe(110);

    const failures: Array<{ id: string; errors: string[] }> = [];
    for (const tpl of BUILTIN_ARCHITECTURE_TEMPLATES) {
      const validation = validateTemplateDefinition(tpl);
      if (!validation.valid) {
        failures.push({ id: tpl.manifest.id, errors: validation.errors });
      }
      if (tpl.publication.status !== "PUBLISHED") {
        failures.push({
          id: tpl.manifest.id,
          errors: [
            `Status=${tpl.publication.status}`,
            ...tpl.publication.validationErrors,
          ],
        });
      }
      expect(tpl.scenarios.length).toBeGreaterThanOrEqual(2);
      expect(tpl.walkthroughs.length).toBeGreaterThanOrEqual(1);
      expect(tpl.walkthroughs[0].steps.length).toBeGreaterThanOrEqual(4);
    }

    expect(failures).toEqual([]);
  });

  it("executes all 110 built-in templates across all scenarios deterministically", () => {
    const executionErrors: Array<{ id: string; scenarioId: string; error: string }> = [];

    for (const tpl of BUILTIN_ARCHITECTURE_TEMPLATES) {
      for (const sc of tpl.scenarios) {
        try {
          const r1 = runTemplateScenarioIsolated({
            template: tpl,
            scenario: sc,
            seedOverride: sc.seed,
          });
          const r2 = runTemplateScenarioIsolated({
            template: tpl,
            scenario: sc,
            seedOverride: sc.seed,
          });
          expect(r1.deterministicHash).toBe(r2.deterministicHash);
          expect(r1.summary.p95LatencyMs).toBeGreaterThan(0);
          expect(r1.summary.simulatedAvailability).toBeGreaterThan(0);
          expect(r1.summary.simulatedAvailability).toBeLessThanOrEqual(1);
          expect(r1.observations.length).toBeGreaterThanOrEqual(1);
        } catch (err) {
          executionErrors.push({
            id: tpl.manifest.id,
            scenarioId: sc.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    expect(executionErrors).toEqual([]);
  });

  it("supports search, multi-criteria filtering, sorting, and pagination without leakage", () => {
    const page1 = templateRegistry.search({
      categoryId: "ai-application",
      limit: 5,
      offset: 0,
      sortBy: "alphabetical",
    });
    expect(page1.total).toBeGreaterThanOrEqual(5);
    expect(page1.items.length).toBe(5);
    expect(page1.hasMore).toBe(true);

    const page2 = templateRegistry.search({
      categoryId: "ai-application",
      limit: 5,
      offset: 5,
      sortBy: "alphabetical",
    });
    const combinedIds = new Set([
      ...page1.items.map((i) => i.id),
      ...page2.items.map((i) => i.id),
    ]);
    expect(combinedIds.size).toBe(page1.items.length + page2.items.length);

    const redisFilter = templateRegistry.search({
      componentType: "redis-cache",
      difficulty: "beginner",
      maxLearningMinutes: 30,
    });
    expect(redisFilter.total).toBeGreaterThan(0);
    for (const item of redisFilter.items) {
      expect(item.difficulty).toBe("beginner");
      expect(item.estimatedLearningMinutes).toBeLessThanOrEqual(30);
    }
  });

  it("instantiates templates immutably with attribution metadata and convertible GraphDocument", () => {
    const source = templateRegistry.getById("tpl_073_url_shortener");
    expect(source).toBeDefined();
    if (!source) return;

    const beforeHash = source.versionRecord.contentHash;
    const inst = instantiateTemplate({
      template: source,
      userId: "user_alice",
      targetProjectId: "proj_url_shortener_demo",
      idempotencyKey: "req_idem_1",
    });

    expect(inst.templateId).toBe("tpl_073_url_shortener");
    expect(inst.templateVersion).toBe("1.0.0");
    expect(inst.createdByUserId).toBe("user_alice");
    expect(inst.sourceAttribution.sourceTemplateSlug).toBe(source.manifest.slug);
    expect(inst.analysisRevision.components.length).toBe(source.topology.nodes.length);

    // Mutate instantiated revision and verify source template remains completely untouched
    inst.analysisRevision.components[0].label = "Mutated Copy Node";
    inst.analysisRevision.components[0].replicas = 42;
    expect(source.topology.nodes[0].label).not.toBe("Mutated Copy Node");
    expect(source.versionRecord.contentHash).toBe(beforeHash);

    const doc = instantiationToGraphDocument(inst, "URL Shortener Copy");
    expect(doc.title).toBe("URL Shortener Copy");
    expect(doc.nodes.length).toBe(source.topology.nodes.length);
    expect(doc.edges.length).toBe(source.topology.edges.length);
    expect(
      (doc.metadata?.templateAttribution as { sourceTemplateId?: string } | undefined)
        ?.sourceTemplateId
    ).toBe("tpl_073_url_shortener");
  });

  it("creates architecture variants and produces semantic diff & trade-off comparison", () => {
    const base = templateRegistry.getById("tpl_001_client_server");
    expect(base).toBeDefined();
    if (!base) return;

    const firstComputeComp = base.topology.analysisRevision.components[1] || base.topology.analysisRevision.components[0];
    expect(firstComputeComp).toBeDefined();

    const variant = createTemplateVariant({
      baseTemplate: base,
      name: "Scaled Multi-AZ App Tier",
      ownerId: "user_bob",
    });
    variant.analysisRevision = {
      ...variant.analysisRevision,
      components: variant.analysisRevision.components.map((c) =>
        c.id === firstComputeComp.id
          ? { ...c, replicas: 4, capacityPerReplicaRps: 450, multiAz: true }
          : c
      ),
    };

    const comparison = compareTemplateDesigns({
      baselineLabel: `${base.manifest.title} v${base.manifest.version}`,
      baselineRevision: base.topology.analysisRevision,
      candidateLabel: variant.name,
      candidateRevision: variant.analysisRevision,
    });

    expect(comparison.baselineLabel).toContain(base.manifest.title);
    expect(comparison.candidateMetrics?.estimatedMonthlyCostUsd).not.toBe(
      comparison.baselineMetrics?.estimatedMonthlyCostUsd
    );
    expect(comparison.diff.changedNodes.length).toBeGreaterThanOrEqual(1);
    expect(comparison.summary.length).toBeGreaterThan(0);
  });

  it("synchronizes guided walkthrough steps with canvas node & edge focus highlights", () => {
    const tpl = templateRegistry.getById("tpl_009_api_gateway")!;
    const wt = tpl.walkthroughs[0];
    let state = TemplateWalkthroughEngine.initialize(tpl.manifest.id, wt);
    expect(state.status).toBe("in_progress");
    expect(state.currentStepIndex).toBe(0);
    expect(state.selectedNodeId).toBe(wt.steps[0].focusNodeId);

    state = TemplateWalkthroughEngine.next(wt, state);
    expect(state.currentStepIndex).toBe(1);
    expect(state.completedStepIds).toContain(wt.steps[0].id);

    state = TemplateWalkthroughEngine.goToStep(wt, state, wt.steps.length - 1);
    expect(state.currentStepIndex).toBe(wt.steps.length - 1);
    state = TemplateWalkthroughEngine.next(wt, state);
    expect(state.status).toBe("completed");

    state = TemplateWalkthroughEngine.exit(state);
    expect(state.status).toBe("exited");
    state = TemplateWalkthroughEngine.resume(wt, state);
    expect(state.status).toBe("in_progress");

    state = TemplateWalkthroughEngine.restart(wt, state);
    expect(state.currentStepIndex).toBe(0);
    expect(state.completedStepIds).toEqual([]);
  });

  it("enforces publication immutability and private/workspace permission boundaries", () => {
    const reg = new TemplateRegistry([BUILTIN_ARCHITECTURE_TEMPLATES[0]]);
    const personal = reg.duplicateAsPersonalTemplate({
      sourceTemplateId: BUILTIN_ARCHITECTURE_TEMPLATES[0].manifest.id,
      userId: "user_alice",
      newId: "tpl_custom_alice_1",
      newSlug: "custom-alice-baseline",
      visibility: "private",
    });

    expect(personal.publication.status).toBe("DRAFT");
    const alicePerm = evaluateTemplatePermission({
      template: personal,
      userId: "user_alice",
    });
    const bobPerm = evaluateTemplatePermission({
      template: personal,
      userId: "user_bob",
    });
    expect(alicePerm.canView).toBe(true);
    expect(alicePerm.canEdit).toBe(true);
    expect(bobPerm.canView).toBe(false);
    expect(bobPerm.canEdit).toBe(false);

    // Bob cannot see Alice's private template in search
    expect(
      reg.search({ userId: "user_bob", ownership: "all" }).items.some(
        (i) => i.id === personal.manifest.id
      )
    ).toBe(false);

    // Publish personal template -> version becomes immutable
    const published = reg.publishTemplate(personal.manifest.id);
    expect(published.publication.status).toBe("PUBLISHED");
    expect(published.versionRecord.immutable).toBe(true);

    expect(() =>
      reg.register({
        ...published,
        problemSolved: "Tampered in-place mutation",
        versionRecord: {
          ...published.versionRecord,
          contentHash: "sha256:tampered",
        },
      })
    ).toThrow(/Immutability violation/);

    // Next version draft works cleanly while leaving v1.0.0 intact
    const v2Draft = reg.createNewVersionDraft({
      templateId: published.manifest.id,
      nextVersion: "1.1.0",
      changelog: "Added dedicated read replica guidance.",
    });
    expect(v2Draft.publication.status).toBe("DRAFT");
    expect(reg.listVersions(published.manifest.id).length).toBe(2);
  });

  it("enforces import/export integrity checksums, XSS sanitization, schema migration, and security limits", () => {
    const tpl = templateRegistry.getById("tpl_021_cache_aside")!;
    const rawJson = exportTemplateToJson(tpl);
    const preview = previewTemplateImportJson(rawJson);
    expect(preview.valid).toBe(true);
    expect(preview.nodeCount).toBe(tpl.topology.nodes.length);
    expect(SUPPORTED_TEMPLATE_SCHEMA_VERSIONS).toContain(1);
    expect(SUPPORTED_TEMPLATE_SCHEMA_VERSIONS).toContain(2);

    // Idempotent import replay returns same template cleanly
    const idemp = new Map<string, ReturnType<typeof importTemplateFromJson>["template"] & {}>();
    const res1 = importTemplateFromJson({
      rawJson,
      ownerId: "user_importer",
      idempotencyKey: "import_once_1",
      existingImportsByIdempotencyKey: idemp as Map<string, NonNullable<ReturnType<typeof importTemplateFromJson>["template"]>>,
    });
    expect(res1.accepted).toBe(true);
    const res2 = importTemplateFromJson({
      rawJson,
      ownerId: "user_importer",
      idempotencyKey: "import_once_1",
      existingImportsByIdempotencyKey: idemp as Map<string, NonNullable<ReturnType<typeof importTemplateFromJson>["template"]>>,
    });
    expect(res1.template?.manifest.id).toBe(res2.template?.manifest.id);
    expect(res2.idempotentReplay).toBe(true);

    // Schema v2 import migrates cleanly while surfacing compatibility warning
    const v2Payload = {
      ...exportTemplateToPayload(tpl, 2),
      extensions: { customOwnerTeam: "platform-core" },
    };
    const v2Preview = previewTemplateImportJson(JSON.stringify(v2Payload));
    expect(v2Preview.valid).toBe(true);
    expect(v2Preview.migratedFromVersion).toBe(2);

    // Tampered checksum emits integrity mismatch warning cleanly
    const tampered = exportTemplateToPayload(tpl);
    tampered.manifest.title = '<script>alert("xss")</script>Clean Cache Title';
    const xssImport = importTemplateFromJson({
      rawJson: JSON.stringify(tampered),
      ownerId: "user_importer",
    });
    expect(xssImport.preview.compatibilityWarnings.some((w) => w.includes("checksum"))).toBe(true);
    expect(xssImport.template?.manifest.title).not.toContain("<script>");

    // Oversized payload is rejected cleanly
    const huge = "x".repeat(600_000);
    const oversizedPreview = previewTemplateImportJson(huge);
    expect(oversizedPreview.valid).toBe(false);
    expect(oversizedPreview.validationErrors.some((e) => e.includes("byte size"))).toBe(true);

    // Deeply nested JSON is rejected cleanly
    let nested: Record<string, unknown> = { ok: true };
    for (let i = 0; i < 18; i++) {
      nested = { child: nested };
    }
    const deepPreview = previewTemplateImportJson(JSON.stringify(nested));
    expect(deepPreview.valid).toBe(false);
    expect(deepPreview.validationErrors.some((e) => e.includes("depth"))).toBe(true);
  });

  it("runs all 16 template presets via TemplateExecutionEngine with deterministic trace outputs", () => {
    expect(TEMPLATE_PRESET_METADATA.length).toBe(16);

    for (const preset of TEMPLATE_PRESET_METADATA) {
      const scenario = createTemplatePresetScenario(preset.id, 7);
      const run1 = TemplateExecutionEngine.runScenario(scenario);
      const run2 = TemplateExecutionEngine.runScenario(scenario);

      expect(run1.trace.outcome).toBe("success");
      expect(run1.state.invariants.passed).toBe(true);
      expect(run1.trace.events.length).toBeGreaterThanOrEqual(5);
      expect(run1.state.scenarioResult.deterministicHash).toBe(
        run2.state.scenarioResult.deterministicHash
      );
    }
  });
});
