"use client";

import * as React from "react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_LEARNING_PATHS,
  TEMPLATE_PRESET_METADATA,
  computeTemplateContentHash,
  createTemplatePresetScenario,
  importTemplateFromJson,
  previewTemplateImportJson,
  resolveTemplateTopology,
  templateRegistry,
  type ArchitectureTemplate,
  type TemplateCategoryId,
  type TemplateDifficulty,
  type TemplateEdgeConfiguration,
  type TemplateImportPreview,
  type TemplateNodeConfiguration,
  type TemplatePresetId,
} from "@nxtqr/architecture-execution";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  FolderIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
} from "@nxtqr/icons";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { useExecutionStore } from "../execution/store/execution-store";
import { TemplateDetail } from "./template-detail";

type LibraryTab = "catalog" | "paths" | "saved" | "import";
type SortOrder = "recommended" | "alphabetical" | "difficulty" | "duration" | "recent";

const PAGE_SIZE = 24;

export function TemplatesWorkspace() {
  const toggleWorkspace = useExecutionStore((s) => s.toggleTemplatesWorkspace);
  const selectedTemplateId = useExecutionStore((s) => s.selectedTemplateId);
  const setSelectedTemplateId = useExecutionStore((s) => s.setSelectedTemplateId);
  const favoriteTemplateIds = useExecutionStore((s) => s.favoriteTemplateIds);
  const recentTemplateIds = useExecutionStore((s) => s.recentTemplateIds);
  const personalTemplates = useExecutionStore((s) => s.personalTemplates);
  const completedTemplateIds = useExecutionStore((s) => s.completedTemplateIds);
  const runTemplateScenario = useExecutionStore((s) => s.runTemplateScenario);
  const savePersonalTemplate = useExecutionStore((s) => s.savePersonalTemplate);

  const canvasNodes = useGraphEditorStore((s) => s.nodes);
  const canvasEdges = useGraphEditorStore((s) => s.edges);
  const canvasTitle = useGraphEditorStore((s) => s.title);

  const [activeTab, setActiveTab] = React.useState<LibraryTab>("catalog");
  const [searchText, setSearchText] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<TemplateCategoryId | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<TemplateDifficulty | "all">("all");
  const [ownershipFilter, setOwnershipFilter] = React.useState<"all" | "system" | "personal" | "workspace">("all");
  const [sortBy, setSortBy] = React.useState<SortOrder>("recommended");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [importJsonText, setImportJsonText] = React.useState("");
  const [importPreview, setImportPreview] = React.useState<TemplateImportPreview | null>(null);
  const [importBanner, setImportBanner] = React.useState<string>("");

  React.useEffect(() => {
    setPageIndex(0);
  }, [searchText, categoryFilter, difficultyFilter, ownershipFilter, sortBy]);

  const searchResult = React.useMemo(
    () =>
      templateRegistry.search({
        query: searchText,
        categoryId: categoryFilter,
        difficulty: difficultyFilter,
        ownership: ownershipFilter,
        sortBy,
        offset: pageIndex * PAGE_SIZE,
        limit: PAGE_SIZE,
        userId: "studio-user",
      }),
    [searchText, categoryFilter, difficultyFilter, ownershipFilter, sortBy, pageIndex, personalTemplates]
  );

  const activeTemplate: ArchitectureTemplate = React.useMemo(() => {
    return (
      templateRegistry.getById(selectedTemplateId) ??
      personalTemplates.find((p) => p.manifest.id === selectedTemplateId) ??
      templateRegistry.listAll()[0]
    );
  }, [selectedTemplateId, personalTemplates]);

  const handleSelectPreset = (presetId: string) => {
    const scenario = createTemplatePresetScenario(presetId as TemplatePresetId, 1);
    setSelectedTemplateId(scenario.templateId);
    runTemplateScenario(scenario);
    setActiveTab("catalog");
  };

  const handleSaveCurrentCanvas = () => {
    if (canvasNodes.length < 2) {
      setImportBanner("Add at least 2 connected nodes on the visual canvas before saving a template.");
      return;
    }

    const slugBase = canvasTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "custom-architecture";
    const uniq = Math.floor(Math.random() * 900 + 100);
    const tplId = `tpl_canvas_${slugBase}_${uniq}`;
    const slug = `${slugBase}-${uniq}`;
    const verId = `${tplId}_v1.0.0`;

    const tplNodes: TemplateNodeConfiguration[] = canvasNodes.map((n, idx) => {
      const compType = String(
        (n.data as Record<string, unknown>)?.componentType || n.type || "backend-service"
      );
      const analysisKind: TemplateNodeConfiguration["analysisKind"] = compType.includes("cache")
        ? "cache"
        : compType.includes("db") || compType.includes("postgres")
          ? "database"
          : compType.includes("queue") || compType.includes("kafka")
            ? "queue"
            : compType.includes("gateway") || compType.includes("balancer")
              ? "gateway"
              : "service";
      return {
        id: n.id,
        componentType: compType,
        label: String((n.data as Record<string, unknown>)?.label || n.id),
        description: String(
          (n.data as Record<string, unknown>)?.description || "Canvas component"
        ),
        environment: "production",
        position: n.position ?? { x: idx * 210, y: 120 },
        config: ((n.data as Record<string, unknown>)?.config as Record<string, unknown>) ?? {},
        analysisKind,
        analysisProfile: {
          replicas: 2,
          capacityPerReplicaRps: 400,
          baseLatencyMs: 8,
          maxConnectionsPerReplica: 500,
          replicationMode: "none",
          replicationLagSec: 0,
          cacheStrategy: "none",
          cacheHitRatio: 0,
          failureDomain: "az",
          multiAz: false,
          region: "us-east-1",
          zone: "us-east-1a",
          mtbfHours: 2400,
          mttrMinutes: 10,
          monthlyCostPerReplicaUsd: 45,
          hasBackup: true,
        },
      };
    });

    const tplEdges: TemplateEdgeConfiguration[] = canvasEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourcePortId: e.sourceHandle ?? undefined,
      targetPortId: e.targetHandle ?? undefined,
      label: e.label ?? "Flow",
      communicationMode: "sync_http",
      retryFactor: 1.0,
      protocol: "HTTP",
      edgeType: "bezier",
    }));

    const topology = resolveTemplateTopology({
      revisionId: `rev_${tplId}`,
      title: `${canvasTitle} Template`,
      nodes: tplNodes,
      edges: tplEdges,
      dependencies: [],
      layout: {
        direction: "LR",
        useAutoLayout: false,
        groups: [],
        viewport: { x: 0, y: 0, zoom: 0.9 },
      },
    });

    const firstId = tplNodes[0]?.id ?? "node_1";
    const secondId = tplNodes[1]?.id ?? firstId;
    const manifest: ArchitectureTemplate["manifest"] = {
      schemaVersion: 1,
      id: tplId,
      slug,
      title: `${canvasTitle} (${uniq})`,
      summary: "User-saved reference architecture captured directly from the NXTQR visual studio canvas.",
      description: `Saved custom architecture containing ${tplNodes.length} components and ${tplEdges.length} connections for replay and iteration.`,
      categoryIds: ["backend"],
      conceptIds: ["custom-architecture", "canvas-snapshot"],
      difficulty: "intermediate",
      estimatedLearningMinutes: 15,
      architectureRevisionId: `rev_${tplId}`,
      scenarioIds: [`sc_${tplId}_baseline`],
      walkthroughIds: [`wt_${tplId}`],
      requirements: [
        {
          id: "req_1",
          kind: "functional",
          title: "Reliable Service Availability",
          description: "Serve baseline request traffic reliably.",
          targetMetric: "availability >= 99.5%",
        },
        {
          id: "req_2",
          kind: "nonfunctional",
          title: "Bounded Tail Latency",
          description: "Maintain low tail latency under normal load.",
          targetMetric: "p95 < 120ms",
        },
      ],
      assumptions: [
        {
          id: "assump_1",
          statement: "Saved from interactive studio topology.",
          impact: "Assumes uniform baseline regional workload.",
        },
      ],
      visibility: "private",
      version: "1.0.0",
    };

    const scenarios: ArchitectureTemplate["scenarios"] = [
      {
        schemaVersion: 1,
        id: `sc_${tplId}_baseline`,
        templateVersionId: verId,
        title: "Normal Workload Baseline",
        description: "Baseline steady-state request simulation on saved topology.",
        category: "normal-traffic",
        durationMs: 1200,
        seed: 1,
        workloadConfig: {
          workloadRps: 250,
          readWriteRatio: "80:20",
          routingPolicy: "least_connections",
          scalingMode: "hpa_reactive",
          maxReplicas: 8,
        },
        faultSchedule: [{ type: "none", atMs: 0 }],
        configurationOverrides: {},
        parameters: [],
        expectedObservations: [
          {
            id: "obs_1",
            metric: "availability",
            operator: "gte",
            targetValue: 0.95,
            description: "Baseline availability remains healthy",
          },
        ],
        validationRuleIds: [],
      },
    ];

    const walkthroughs: ArchitectureTemplate["walkthroughs"] = [
      {
        id: `wt_${tplId}`,
        templateVersionId: verId,
        title: "Saved Architecture Walkthrough",
        description: "Inspect ingress and downstream components captured from the studio canvas.",
        steps: [
          {
            id: "st_1",
            order: 1,
            type: "focus-component",
            title: "Entry Component",
            explanation: `Traffic enters at ${tplNodes[0]?.label ?? firstId}.`,
            accessibilitySummary: `Step 1: focus ${tplNodes[0]?.label ?? firstId}.`,
            focusNodeId: firstId,
          },
          {
            id: "st_2",
            order: 2,
            type: "focus-component",
            title: "Downstream Dependency",
            explanation: `Requests flow onward to ${tplNodes[1]?.label ?? secondId}.`,
            accessibilitySummary: `Step 2: focus ${tplNodes[1]?.label ?? secondId}.`,
            focusNodeId: secondId,
            highlightEdgeId: tplEdges[0]?.id,
          },
        ],
      },
    ];

    const nowIso = new Date().toISOString();
    const contentHash = computeTemplateContentHash({
      manifest,
      nodes: tplNodes,
      edges: tplEdges,
      scenarios,
      walkthroughs,
    });

    const newTemplate: ArchitectureTemplate = {
      manifest,
      source: "user",
      ownerId: "studio-user",
      workspaceId: null,
      publication: {
        status: "DRAFT",
        qualityGatePassed: true,
        validationErrors: [],
        validationWarnings: [],
      },
      versionRecord: {
        id: verId,
        templateId: tplId,
        version: "1.0.0",
        changelog: "Saved from visual canvas",
        immutable: false,
        contentHash,
        createdAtIso: nowIso,
        status: "DRAFT",
      },
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      problemSolved: "Captures current visual studio architecture for reproducible scenario validation and comparison.",
      learningObjectives: ["Validate custom topology behavior under reproducible simulated load."],
      requestFlowSummary: `${tplNodes[0]?.label ?? "Client"} -> ${tplNodes[1]?.label ?? "Backend"}.`,
      dataFlowSummary: "Mirrors active studio node connections.",
      consistencyGuarantees: "Determined by selected node configurations.",
      failureBehaviorSummary: "Simulated via isolated fault injection.",
      securityBoundariesSummary: "Review trust boundaries across node links.",
      operationalLimitations: ["Review single points of failure before promoting to production."],
      tradeOffsSummary: ["Captured point-in-time topology snapshot for fast iteration."],
      constraints: [],
      componentExplanations: tplNodes.slice(0, 2).map((n) => ({
        nodeId: n.id,
        componentType: n.componentType,
        responsibility: `${n.label} (${n.componentType}) participates in primary request execution.`,
        whyUsed: "Placed in studio workspace.",
        dataOwnership: "Application/domain state as configured in canvas.",
        scalingBehavior: `Configured at x${n.analysisProfile.replicas} replicas.`,
        failureBehavior: "May degrade downstream availability if un-replicated.",
        relatedConcepts: ["custom-topology"],
      })),
      designDecisions: [
        {
          id: "dd_1",
          question: "Baseline topology capture",
          decision: `Snapshot ${tplNodes.length} components and ${tplEdges.length} edges.`,
          rationale: "Enables before/after simulation comparison.",
          tradeOffs: ["Manual updates needed as live canvas diverges"],
        },
      ],
      alternatives: [],
      topology,
      scenarios,
      walkthroughs,
      simulationCapabilities: ["latency", "throughput", "availability", "cost"],
      unsupportedCapabilities: [],
      relatedTemplateIds: [],
      relatedChallengeIds: [],
      relatedLabIds: [],
      learningPathIds: [],
    };

    savePersonalTemplate(newTemplate);
    setSelectedTemplateId(newTemplate.manifest.id);
    setActiveTab("saved");
    setImportBanner(`Saved "${newTemplate.manifest.title}" to Personal Templates.`);
  };

  const handlePreviewImport = () => {
    const preview = previewTemplateImportJson(importJsonText);
    setImportPreview(preview);
    setImportBanner(
      preview.valid
        ? `Preview valid: "${preview.title}" (${preview.nodeCount} nodes, ${preview.edgeCount} edges).`
        : "Import validation found issues — inspect errors below."
    );
  };

  const handleCommitImport = () => {
    const result = importTemplateFromJson({
      rawJson: importJsonText,
      ownerId: "studio-user",
      idempotencyKey: `ui_import_${importJsonText.length}`,
    });
    setImportPreview(result.preview);
    if (!result.accepted || !result.template) {
      setImportBanner("Import rejected due to validation errors.");
      return;
    }
    savePersonalTemplate(result.template);
    setSelectedTemplateId(result.template.manifest.id);
    setActiveTab("saved");
    setImportBanner(`Imported "${result.template.manifest.title}" cleanly.`);
  };

  const totalPages = Math.max(1, Math.ceil(searchResult.total / PAGE_SIZE));

  return (
    <div
      className="fixed inset-3 md:inset-6 z-50 flex flex-col rounded-md border border-border-strong bg-surface-01 shadow-level-2 overflow-hidden"
      role="dialog"
      aria-label="Architecture Templates and Scenario Library"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-surface-02 border-b border-border-default">
        <div className="flex items-center gap-2 min-w-0">
          <FolderIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-mono font-semibold text-foreground truncate">
              Architecture Templates & Interactive Scenario Library
            </h2>
            <p className="text-[10px] font-mono text-text-muted truncate">
              110 validated built-in reference architectures · 20 categories · 8 learning paths · Personal & imported designs
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select onValueChange={handleSelectPreset}>
            <SelectTrigger className="w-56 h-7 text-[11px] font-mono rounded-md bg-surface-03 border-border-default">
              <SelectValue placeholder="Quick Launch Template Preset" />
            </SelectTrigger>
            <SelectContent className="max-h-80 rounded-md bg-surface-02 border-border-strong">
              {TEMPLATE_PRESET_METADATA.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-[11px] font-mono">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSaveCurrentCanvas}
            className="h-7 px-2.5 text-[11px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary hover:bg-surface-04 hover:text-foreground gap-1"
          >
            <PlusIcon className="w-3 h-3" />
            Save Canvas as Template
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleWorkspace(false)}
            aria-label="Close Architecture Templates Library"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1 px-4 py-1.5 bg-surface-01 border-b border-border-subtle overflow-x-auto">
        {(
          [
            ["catalog", `Catalog (${templateRegistry.listAll().length})`],
            ["paths", `Learning Paths (${TEMPLATE_LEARNING_PATHS.length})`],
            [
              "saved",
              `Saved & Recent (${personalTemplates.length + favoriteTemplateIds.length})`,
            ],
            ["import", "Import JSON"],
          ] as Array<[LibraryTab, string]>
        ).map(([tabId, label]) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={cn(
              "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap cursor-pointer",
              activeTab === tabId
                ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
                : "text-text-muted hover:text-foreground hover:bg-surface-02 border border-transparent"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {importBanner && (
        <div className="px-4 py-1.5 bg-surface-03 border-b border-border-subtle text-[11px] font-mono text-foreground flex items-center justify-between">
          <span>{importBanner}</span>
          <button
            type="button"
            onClick={() => setImportBanner("")}
            className="text-text-muted hover:text-foreground ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Navigation Column */}
        <div className="w-full md:w-[360px] lg:w-[400px] shrink-0 border-b md:border-b-0 md:border-r border-border-default flex flex-col min-h-0 max-h-[45vh] md:max-h-none bg-surface-01">
          {activeTab === "catalog" && (
            <>
              {/* Search & Filter Controls */}
              <div className="p-3 border-b border-border-subtle space-y-2 bg-surface-02">
                <div className="relative">
                  <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2" />
                  <Input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search 110 templates, concepts, components..."
                    aria-label="Search architecture templates"
                    className="h-7 pl-8 text-[11px] font-mono rounded-md bg-surface-03 border-border-default"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Select
                    value={categoryFilter}
                    onValueChange={(v) =>
                      setCategoryFilter(v as TemplateCategoryId | "all")
                    }
                  >
                    <SelectTrigger className="h-7 text-[10px] font-mono rounded-md bg-surface-03 border-border-default">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 rounded-md bg-surface-02 border-border-strong">
                      <SelectItem value="all" className="text-[11px] font-mono">
                        All 20 Categories
                      </SelectItem>
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="text-[11px] font-mono"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={difficultyFilter}
                    onValueChange={(v) =>
                      setDifficultyFilter(v as TemplateDifficulty | "all")
                    }
                  >
                    <SelectTrigger className="h-7 text-[10px] font-mono rounded-md bg-surface-03 border-border-default">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md bg-surface-02 border-border-strong">
                      <SelectItem value="all" className="text-[11px] font-mono">
                        All Levels
                      </SelectItem>
                      <SelectItem value="beginner" className="text-[11px] font-mono">
                        Beginner
                      </SelectItem>
                      <SelectItem value="intermediate" className="text-[11px] font-mono">
                        Intermediate
                      </SelectItem>
                      <SelectItem value="advanced" className="text-[11px] font-mono">
                        Advanced
                      </SelectItem>
                      <SelectItem value="expert" className="text-[11px] font-mono">
                        Expert
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={ownershipFilter}
                    onValueChange={(v) =>
                      setOwnershipFilter(
                        v as "all" | "system" | "personal" | "workspace"
                      )
                    }
                  >
                    <SelectTrigger className="h-7 text-[10px] font-mono rounded-md bg-surface-03 border-border-default">
                      <SelectValue placeholder="Ownership" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md bg-surface-02 border-border-strong">
                      <SelectItem value="all" className="text-[11px] font-mono">
                        All Sources
                      </SelectItem>
                      <SelectItem value="system" className="text-[11px] font-mono">
                        Built-in Reference
                      </SelectItem>
                      <SelectItem value="personal" className="text-[11px] font-mono">
                        Personal Custom
                      </SelectItem>
                      <SelectItem value="workspace" className="text-[11px] font-mono">
                        Workspace Shared
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortOrder)}
                  >
                    <SelectTrigger className="h-7 text-[10px] font-mono rounded-md bg-surface-03 border-border-default">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md bg-surface-02 border-border-strong">
                      <SelectItem value="recommended" className="text-[11px] font-mono">
                        Recommended
                      </SelectItem>
                      <SelectItem value="alphabetical" className="text-[11px] font-mono">
                        Alphabetical (A-Z)
                      </SelectItem>
                      <SelectItem value="difficulty" className="text-[11px] font-mono">
                        Difficulty
                      </SelectItem>
                      <SelectItem value="duration" className="text-[11px] font-mono">
                        Duration
                      </SelectItem>
                      <SelectItem value="recent" className="text-[11px] font-mono">
                        Recently Updated
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Paginated Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {searchResult.items.length === 0 ? (
                  <div className="p-4 text-center text-xs font-mono text-text-muted">
                    No templates match your current filters.
                  </div>
                ) : (
                  searchResult.items.map((item) => {
                    const isSelected = activeTemplate?.manifest.id === item.id;
                    const done = completedTemplateIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(item.id)}
                        className={cn(
                          "w-full text-left p-2.5 rounded-md border font-mono transition-colors cursor-pointer space-y-1",
                          isSelected
                            ? "bg-surface-04 border-border-strong text-foreground shadow-level-3"
                            : "bg-surface-02 border-border-default text-text-secondary hover:bg-surface-03"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-foreground truncate">
                            {item.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[9px] font-mono rounded-md bg-surface-03 border border-border-default text-text-muted capitalize shrink-0"
                          >
                            {item.difficulty}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-text-muted line-clamp-2">
                          {item.summary}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-text-disabled pt-0.5">
                          <span>
                            {item.categoryIds[0]} · {item.estimatedLearningMinutes}m
                          </span>
                          <span>{done ? "Completed" : `v${item.version}`}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between px-3 py-2 bg-surface-02 border-t border-border-subtle text-[10px] font-mono text-text-secondary">
                <span>
                  {searchResult.total} matching · Page {pageIndex + 1}/{totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                    className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-03 border border-border-default disabled:opacity-40"
                  >
                    <ChevronLeftIcon className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!searchResult.hasMore}
                    onClick={() => setPageIndex((p) => p + 1)}
                    className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-03 border border-border-default disabled:opacity-40"
                  >
                    <ChevronRightIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeTab === "paths" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {TEMPLATE_LEARNING_PATHS.map((lp) => {
                const doneCount = lp.orderedTemplateIds.filter((id) =>
                  completedTemplateIds.includes(id)
                ).length;
                return (
                  <div
                    key={lp.id}
                    className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-2 font-mono"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {lp.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-mono rounded-md bg-surface-03 border border-border-default text-text-muted capitalize"
                      >
                        {doneCount}/{lp.orderedTemplateIds.length}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-text-secondary">{lp.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {lp.orderedTemplateIds.map((tid) => {
                        const t = templateRegistry.getById(tid);
                        if (!t) return null;
                        return (
                          <button
                            key={tid}
                            type="button"
                            onClick={() => setSelectedTemplateId(tid)}
                            className={cn(
                              "px-2 py-0.5 text-[10px] rounded-md border cursor-pointer transition-colors",
                              activeTemplate.manifest.id === tid
                                ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                                : "bg-surface-03 border-border-subtle text-text-secondary hover:text-foreground"
                            )}
                          >
                            {t.manifest.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "saved" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono">
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-foreground">
                  Personal & Imported Templates ({personalTemplates.length})
                </h4>
                {personalTemplates.length === 0 ? (
                  <p className="text-[10px] text-text-muted">
                    Use Duplicate or Save Canvas as Template to create custom editable designs.
                  </p>
                ) : (
                  personalTemplates.map((pt) => (
                    <button
                      key={pt.manifest.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(pt.manifest.id)}
                      className="w-full text-left p-2 rounded-md bg-surface-02 border border-border-default hover:bg-surface-03 text-[11px] cursor-pointer"
                    >
                      <div className="font-semibold text-foreground">{pt.manifest.title}</div>
                      <div className="text-[10px] text-text-muted">
                        {pt.source} · v{pt.versionRecord.version}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-foreground">
                  Favorites ({favoriteTemplateIds.length})
                </h4>
                {favoriteTemplateIds.map((fid) => {
                  const t = templateRegistry.getById(fid);
                  if (!t) return null;
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() => setSelectedTemplateId(fid)}
                      className="w-full text-left p-2 rounded-md bg-surface-02 border border-border-default hover:bg-surface-03 text-[11px] cursor-pointer"
                    >
                      <div className="font-semibold text-foreground">{t.manifest.title}</div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-foreground">
                  Recently Opened ({recentTemplateIds.length})
                </h4>
                {recentTemplateIds.map((rid) => {
                  const t = templateRegistry.getById(rid);
                  if (!t) return null;
                  return (
                    <button
                      key={rid}
                      type="button"
                      onClick={() => setSelectedTemplateId(rid)}
                      className="w-full text-left p-2 rounded-md bg-surface-02 border border-border-default hover:bg-surface-03 text-[11px] cursor-pointer"
                    >
                      <div className="text-foreground">{t.manifest.title}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "import" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <LayersIcon className="w-3.5 h-3.5 text-text-secondary" />
                Import External Template JSON
              </div>
              <p className="text-[10px] text-text-muted">
                Enforces 512 KB byte cap, max 120 nodes, depth guards, schema v1/v2 migration, and text sanitization.
              </p>
              <Textarea
                rows={9}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste exported template JSON payload here..."
                className="text-[11px] font-mono rounded-md bg-surface-03 border-border-default"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviewImport}
                  className="h-7 px-2.5 text-[11px] rounded-md bg-surface-03 border border-border-default text-foreground hover:bg-surface-04"
                >
                  Preview & Validate
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!importPreview?.valid}
                  onClick={handleCommitImport}
                  className="h-7 px-3 text-[11px] font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40"
                >
                  Import Template
                </Button>
              </div>

              {importPreview && (
                <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    {importPreview.valid ? (
                      <CheckCircleIcon className="w-3.5 h-3.5 text-text-secondary" />
                    ) : (
                      <AlertTriangleIcon className="w-3.5 h-3.5 text-text-secondary" />
                    )}
                    {importPreview.title} ({importPreview.nodeCount} nodes, {importPreview.edgeCount} edges)
                  </div>
                  {importPreview.validationErrors.map((err, i) => (
                    <div key={i} className="text-[10px] text-text-secondary">
                      Error: {err}
                    </div>
                  ))}
                  {importPreview.compatibilityWarnings.map((w, i) => (
                    <div key={i} className="text-[10px] text-text-muted">
                      Warning: {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Detail / Interactive Sandbox Column */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {activeTemplate ? (
            <TemplateDetail
              template={activeTemplate}
              onSelectTemplate={(tid) => setSelectedTemplateId(tid)}
            />
          ) : (
            <div className="p-6 text-xs font-mono text-text-muted">
              Select a template from the catalog to inspect, simulate, or load into the canvas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
