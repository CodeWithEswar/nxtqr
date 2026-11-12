import { describe, expect, it } from "vitest";
import {
  createTemplatePresetScenario,
  createTemplateVariant,
  instantiateTemplate,
  instantiationToGraphDocument,
  templateRegistry,
} from "@nxtqr/architecture-execution";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { useExecutionStore } from "../store/execution-store";

describe("Phase 05.4.24 — Execution Store & Graph Editor Template Integration", () => {
  it("runs template presets through useExecutionStore and populates trace templateState", () => {
    const store = useExecutionStore.getState();
    store.setScenarioPreset("tpl_url_shortener_scale");

    const updated = useExecutionStore.getState();
    expect(updated.activePresetId).toBe("tpl_url_shortener_scale");
    expect(updated.isTemplatesWorkspaceOpen).toBe(true);
    expect(updated.isExecutionModeActive).toBe(true);
    expect(updated.selectedTemplateId).toBe("tpl_073_url_shortener");
    expect(updated.recentTemplateIds).toContain("tpl_073_url_shortener");

    const lastFrameState =
      updated.trace?.frames[updated.trace.frames.length - 1]?.runtimeState
        ?.templateState;
    expect(lastFrameState?.template.manifest.id).toBe("tpl_073_url_shortener");
    expect(lastFrameState?.scenarioResult.summary.p95LatencyMs).toBeGreaterThan(0);
    expect(lastFrameState?.invariants.passed).toBe(true);
  });

  it("supports favorites, completion tracking, personal templates, and variant comparison runs", () => {
    const scenario = createTemplatePresetScenario("tpl_client_server_baseline", 3);
    const tpl = templateRegistry.getById(scenario.templateId)!;
    const firstNodeId = tpl.topology.nodes[0].id;

    const ok = useExecutionStore.getState().runTemplateScenario({
      ...scenario,
      variantComponentOverrides: [{ componentId: firstNodeId, replicas: 4 }],
    });
    expect(ok).toBe(true);

    const afterRun = useExecutionStore.getState();
    const tState =
      afterRun.trace?.frames[afterRun.trace.frames.length - 1]?.runtimeState
        ?.templateState;
    expect(tState?.comparisonWithBaseline).toBeDefined();

    afterRun.toggleFavoriteTemplate("tpl_001_client_server");
    expect(useExecutionStore.getState().favoriteTemplateIds).toContain(
      "tpl_001_client_server"
    );
    afterRun.toggleFavoriteTemplate("tpl_001_client_server");
    expect(useExecutionStore.getState().favoriteTemplateIds).not.toContain(
      "tpl_001_client_server"
    );

    afterRun.markTemplateCompleted("tpl_001_client_server");
    expect(useExecutionStore.getState().completedTemplateIds).toContain(
      "tpl_001_client_server"
    );

    const variant = createTemplateVariant({
      baseTemplate: tpl,
      name: "Unit Test Variant",
      ownerId: "user_test",
    });
    afterRun.saveTemplateVariant(variant);
    expect(
      useExecutionStore
        .getState()
        .savedTemplateVariants.some((v) => v.variantId === variant.variantId)
    ).toBe(true);
  });

  it("loads an instantiated template into useGraphEditorStore cleanly without mutating the registry template", () => {
    const source = templateRegistry.getById("tpl_077_ecommerce_checkout")!;
    const beforeHash = source.versionRecord.contentHash;

    const inst = instantiateTemplate({
      template: source,
      userId: "user_editor_test",
      targetProjectId: "proj_checkout_test",
      idempotencyKey: "store_test_idem_1",
    });
    const doc = instantiationToGraphDocument(inst, "Checkout Test Copy");

    useGraphEditorStore.getState().loadDocument(doc, "proj_checkout_test");

    const editor = useGraphEditorStore.getState();
    expect(editor.documentId).toBe(doc.id);
    expect(editor.projectId).toBe("proj_checkout_test");
    expect(editor.title).toBe("Checkout Test Copy");
    expect(editor.nodes.length).toBe(source.topology.nodes.length);
    expect(editor.edges.length).toBe(source.topology.edges.length);

    // Mutate loaded canvas title/nodes and confirm source registry template stays untouched
    useGraphEditorStore.getState().setNodesRaw([]);
    expect(source.topology.nodes.length).toBeGreaterThanOrEqual(3);
    expect(source.versionRecord.contentHash).toBe(beforeHash);
  });
});
