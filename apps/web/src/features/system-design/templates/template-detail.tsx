"use client";

import * as React from "react";
import {
  TemplateWalkthroughEngine,
  compareTemplateDesigns,
  createTemplateVariant,
  exportTemplateToJson,
  instantiateTemplate,
  instantiationToGraphDocument,
  runTemplateScenarioIsolated,
  templateRegistry,
  type ArchitectureTemplate,
  type TemplateComparison,
  type TemplateScenarioExecutionResult,
  type WalkthroughProgressState,
} from "@nxtqr/architecture-execution";
import {
  ActivityIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  CpuIcon,
  ExternalLinkIcon,
  LayersIcon,
  PlayIcon,
  RefreshIcon,
} from "@nxtqr/icons";
import { Badge, Button, Input } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { useExecutionStore } from "../execution/store/execution-store";
import { TemplatePreview } from "./template-preview";

type DetailSection =
  | "overview"
  | "components"
  | "scenarios"
  | "walkthrough"
  | "tradeoffs";

export interface TemplateDetailProps {
  template: ArchitectureTemplate;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateDetail({
  template,
  onSelectTemplate,
}: TemplateDetailProps) {
  const projectId = useGraphEditorStore((s) => s.projectId);
  const loadDocument = useGraphEditorStore((s) => s.loadDocument);

  const favoriteTemplateIds = useExecutionStore((s) => s.favoriteTemplateIds);
  const completedTemplateIds = useExecutionStore((s) => s.completedTemplateIds);
  const toggleFavoriteTemplate = useExecutionStore((s) => s.toggleFavoriteTemplate);
  const markTemplateCompleted = useExecutionStore((s) => s.markTemplateCompleted);
  const savePersonalTemplate = useExecutionStore((s) => s.savePersonalTemplate);
  const saveTemplateVariant = useExecutionStore((s) => s.saveTemplateVariant);
  const runTemplateScenario = useExecutionStore((s) => s.runTemplateScenario);
  const toggleTemplatesWorkspace = useExecutionStore((s) => s.toggleTemplatesWorkspace);
  const togglePracticeWorkspace = useExecutionStore((s) => s.togglePracticeWorkspace);

  const [section, setSection] = React.useState<DetailSection>("overview");
  const [selectedNodeId, setSelectedNodeId] = React.useState<string>(
    template.topology.nodes[0]?.id ?? ""
  );
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>(
    template.scenarios[0]?.id ?? ""
  );
  const [seedInput, setSeedInput] = React.useState<number>(1);
  const [replicaOverride, setReplicaOverride] = React.useState<number | "">("");
  const [scenarioResult, setScenarioResult] =
    React.useState<TemplateScenarioExecutionResult | null>(null);
  const [comparison, setComparison] = React.useState<TemplateComparison | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string>("");

  const activeWalkthrough = template.walkthroughs[0];
  const [wtProgress, setWtProgress] = React.useState<WalkthroughProgressState>(() =>
    TemplateWalkthroughEngine.initialize(template.manifest.id, activeWalkthrough, 0)
  );

  // Sync defaults when user switches selected template
  React.useEffect(() => {
    setSelectedNodeId(template.topology.nodes[0]?.id ?? "");
    setSelectedScenarioId(template.scenarios[0]?.id ?? "");
    setScenarioResult(null);
    setComparison(null);
    setStatusMessage("");
    setReplicaOverride("");
    setWtProgress(
      TemplateWalkthroughEngine.initialize(template.manifest.id, template.walkthroughs[0], 0)
    );
  }, [template]);

  const isFavorite = favoriteTemplateIds.includes(template.manifest.id);
  const isCompleted = completedTemplateIds.includes(template.manifest.id);

  const selectedNode =
    template.topology.nodes.find((n) => n.id === selectedNodeId) ??
    template.topology.nodes[0];
  const selectedExplanation = template.componentExplanations.find(
    (c) => c.nodeId === selectedNode?.id
  );
  const activeStep = TemplateWalkthroughEngine.getCurrentStep(
    activeWalkthrough,
    wtProgress
  );

  const handleLoadIntoEditor = () => {
    const targetProject = projectId ?? "proj_studio_workspace";
    const instantiation = instantiateTemplate({
      template,
      userId: "studio-user",
      targetProjectId: targetProject,
      idempotencyKey: `ui_${template.manifest.id}_${Date.now()}`,
    });
    const doc = instantiationToGraphDocument(instantiation);
    loadDocument(doc, targetProject);
    templateRegistry.recordUsage(template.manifest.id, "instantiationsCount");
    setStatusMessage(
      `Loaded "${template.manifest.title}" into Visual Editor as a new isolated copy (source attribution preserved).`
    );
    toggleTemplatesWorkspace(false);
  };

  const handleForkPersonal = () => {
    const uniqueSuffix = Math.floor(Math.random() * 900 + 100);
    const forked = templateRegistry.duplicateAsPersonalTemplate({
      sourceTemplateId: template.manifest.id,
      userId: "studio-user",
      newId: `tpl_custom_${template.manifest.slug.slice(0, 24)}_${uniqueSuffix}`,
      newSlug: `${template.manifest.slug}-custom-${uniqueSuffix}`,
      visibility: "private",
    });
    savePersonalTemplate(forked);
    onSelectTemplate(forked.manifest.id);
    setStatusMessage(`Forked personal editable copy: ${forked.manifest.title}`);
  };

  const handleExportJson = () => {
    const json = exportTemplateToJson(template, 1);
    if (typeof window !== "undefined") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.manifest.slug}-v${template.versionRecord.version}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setStatusMessage(
      `Exported ${template.manifest.slug}-v${template.versionRecord.version}.json`
    );
  };

  const handleRunScenario = () => {
    const scenario =
      template.scenarios.find((s) => s.id === selectedScenarioId) ??
      template.scenarios[0];
    if (!scenario) return;

    const overrideReplicas =
      typeof replicaOverride === "number" && replicaOverride >= 1
        ? replicaOverride
        : undefined;

    const overrides =
      overrideReplicas !== undefined && selectedNode
        ? [{ componentId: selectedNode.id, replicas: overrideReplicas }]
        : undefined;

    const isolated = runTemplateScenarioIsolated({
      template,
      scenario,
      seedOverride: seedInput,
      variantComponentOverrides: overrides,
    });
    setScenarioResult(isolated);

    // Also run through TemplateExecutionEngine into timeline store
    runTemplateScenario(
      {
        id: `ui_tpl_run_${template.manifest.id}_${scenario.id}_${seedInput}`,
        templateId: template.manifest.id,
        templateVersion: template.versionRecord.version,
        scenarioId: scenario.id,
        walkthroughId: activeWalkthrough?.id,
        walkthroughStepIndex: wtProgress.currentStepIndex,
        seed: seedInput,
        variantComponentOverrides: overrides,
      },
      template
    );

    if (overrides && overrideReplicas !== undefined) {
      const variant = createTemplateVariant({
        baseTemplate: template,
        name: `${template.manifest.title} (${selectedNode?.label} x${overrideReplicas})`,
        ownerId: "studio-user",
      });
      variant.analysisRevision = {
        ...variant.analysisRevision,
        components: variant.analysisRevision.components.map((c) =>
          c.id === selectedNode?.id ? { ...c, replicas: overrideReplicas } : c
        ),
      };
      saveTemplateVariant(variant);
      setComparison(
        compareTemplateDesigns({
          baselineLabel: `${template.manifest.title} Baseline`,
          baselineRevision: template.topology.analysisRevision,
          candidateLabel: variant.name,
          candidateRevision: variant.analysisRevision,
          workloadRps: scenario.workloadConfig.workloadRps,
          seed: seedInput,
        })
      );
    } else {
      setComparison(null);
    }
  };

  const advanceWalkthrough = (action: "next" | "prev" | "restart") => {
    if (!activeWalkthrough) return;
    let nextState = wtProgress;
    if (action === "next") {
      nextState = TemplateWalkthroughEngine.next(activeWalkthrough, wtProgress);
      if (nextState.status === "completed") {
        markTemplateCompleted(template.manifest.id);
      }
    } else if (action === "prev") {
      nextState = TemplateWalkthroughEngine.previous(activeWalkthrough, wtProgress);
    } else {
      nextState = TemplateWalkthroughEngine.restart(activeWalkthrough, wtProgress);
    }
    setWtProgress(nextState);
    if (nextState.selectedNodeId) {
      setSelectedNodeId(nextState.selectedNodeId);
    }
  };

  const validation = templateRegistry.validateById(template.manifest.id);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface-01">
      {/* Header & Action Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 bg-surface-02 border-b border-border-default">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-mono font-semibold text-foreground">
              {template.manifest.title}
            </h3>
            <Badge
              variant="secondary"
              className="text-[10px] font-mono rounded-md bg-surface-04 border border-border-default text-text-secondary"
            >
              v{template.versionRecord.version}
            </Badge>
            <Badge
              variant="secondary"
              className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary capitalize"
            >
              {template.manifest.difficulty}
            </Badge>
            <Badge
              variant="secondary"
              className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-subtle text-text-muted"
            >
              ~{template.manifest.estimatedLearningMinutes} min
            </Badge>
            {validation?.valid && (
              <Badge
                variant="secondary"
                className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary gap-1"
              >
                <CheckCircleIcon className="w-3 h-3" />
                Verified
              </Badge>
            )}
            {isCompleted && (
              <Badge
                variant="secondary"
                className="text-[10px] font-mono rounded-md bg-surface-04 border border-border-strong text-foreground gap-1"
              >
                <CheckIcon className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
          <p className="text-xs font-mono text-text-secondary max-w-3xl">
            {template.manifest.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleFavoriteTemplate(template.manifest.id)}
            className={cn(
              "h-7 px-2.5 text-[11px] font-mono rounded-md border transition-colors",
              isFavorite
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-surface-03 border-border-default text-text-secondary hover:bg-surface-04 hover:text-foreground"
            )}
          >
            {isFavorite ? "Saved" : "Favorite"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleForkPersonal}
            className="h-7 px-2.5 text-[11px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary hover:bg-surface-04 hover:text-foreground gap-1"
          >
            <CopyIcon className="w-3 h-3" />
            Duplicate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExportJson}
            className="h-7 px-2.5 text-[11px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary hover:bg-surface-04 hover:text-foreground gap-1"
          >
            <ExternalLinkIcon className="w-3 h-3" />
            Export JSON
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleLoadIntoEditor}
            className="h-7 px-3 text-[11px] font-mono font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 gap-1"
          >
            <LayersIcon className="w-3 h-3" />
            Load into Visual Editor
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-1.5 bg-surface-03 border-b border-border-subtle text-[11px] font-mono text-foreground flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage("")}
            className="text-text-muted hover:text-foreground ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Detail Sub-tabs */}
      <div className="flex items-center gap-1 px-4 py-1.5 bg-surface-01 border-b border-border-subtle overflow-x-auto">
        {(
          [
            ["overview", "Overview & Flows"],
            ["components", "Components & Config"],
            ["scenarios", "Scenarios & Compare"],
            ["walkthrough", "Guided Walkthrough"],
            ["tradeoffs", "Decisions & Alternatives"],
          ] as Array<[DetailSection, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap cursor-pointer",
              section === id
                ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-3"
                : "text-text-muted hover:text-foreground hover:bg-surface-02 border border-transparent"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <TemplatePreview
          template={template}
          selectedNodeId={selectedNodeId}
          highlightedNodeId={
            section === "walkthrough" ? wtProgress.selectedNodeId : selectedNodeId
          }
          highlightedEdgeId={
            section === "walkthrough" ? wtProgress.selectedEdgeId : undefined
          }
          onSelectNode={(nid) => {
            setSelectedNodeId(nid);
            if (section === "overview") setSection("components");
          }}
        />

        {section === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-2">
              <h4 className="text-xs font-mono font-semibold text-foreground">
                Problem Solved & Learning Objectives
              </h4>
              <p className="text-xs font-mono text-text-secondary">
                {template.problemSolved}
              </p>
              <ul className="space-y-1 text-[11px] font-mono text-text-secondary">
                {template.learningObjectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckIcon className="w-3 h-3 mt-0.5 text-text-muted shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-2">
              <h4 className="text-xs font-mono font-semibold text-foreground">
                Request, Data, Consistency & Failure Flows
              </h4>
              <div className="space-y-1.5 text-[11px] font-mono">
                <p className="text-text-secondary">
                  <span className="text-foreground font-semibold">Request Flow: </span>
                  {template.requestFlowSummary}
                </p>
                <p className="text-text-secondary">
                  <span className="text-foreground font-semibold">Data Flow: </span>
                  {template.dataFlowSummary}
                </p>
                <p className="text-text-secondary">
                  <span className="text-foreground font-semibold">Consistency: </span>
                  {template.consistencyGuarantees}
                </p>
                <p className="text-text-secondary">
                  <span className="text-foreground font-semibold">Failure Behavior: </span>
                  {template.failureBehaviorSummary}
                </p>
                <p className="text-text-secondary">
                  <span className="text-foreground font-semibold">Security Boundaries: </span>
                  {template.securityBoundariesSummary}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-2">
              <h4 className="text-xs font-mono font-semibold text-foreground">
                Requirements & Assumptions
              </h4>
              <div className="space-y-1 text-[11px] font-mono">
                {template.manifest.requirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start justify-between gap-2 p-1.5 rounded-md bg-surface-03 border border-border-subtle"
                  >
                    <span className="text-text-secondary">
                      <span className="text-foreground font-semibold">{req.title}: </span>
                      {req.description}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[9px] font-mono rounded-md bg-surface-04 border border-border-default text-text-muted shrink-0"
                    >
                      {req.targetMetric ?? req.kind}
                    </Badge>
                  </div>
                ))}
                {template.manifest.assumptions.map((a) => (
                  <p key={a.id} className="text-text-muted text-[10px]">
                    Assumption: {a.statement} ({a.impact})
                  </p>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-2">
              <h4 className="text-xs font-mono font-semibold text-foreground">
                Related Templates, Labs & Challenges
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {template.relatedTemplateIds.map((rid) => {
                  const rel = templateRegistry.getById(rid);
                  if (!rel) return null;
                  return (
                    <Button
                      key={rid}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectTemplate(rid)}
                      className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary hover:text-foreground hover:bg-surface-04"
                    >
                      {rel.manifest.title}
                    </Button>
                  );
                })}
                {template.relatedLabIds.map((lid) => (
                  <Button
                    key={lid}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleTemplatesWorkspace(false);
                      togglePracticeWorkspace(true);
                    }}
                    className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-03 border border-border-hover text-foreground hover:bg-surface-04 gap-1"
                  >
                    <BookOpenIcon className="w-3 h-3" />
                    Lab: {lid}
                  </Button>
                ))}
                {template.relatedChallengeIds.map((cid) => (
                  <Button
                    key={cid}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleTemplatesWorkspace(false);
                      togglePracticeWorkspace(true);
                    }}
                    className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-03 border border-border-hover text-foreground hover:bg-surface-04 gap-1"
                  >
                    <ActivityIcon className="w-3 h-3" />
                    Challenge: {cid}
                  </Button>
                ))}
              </div>
              {template.unsupportedCapabilities.length > 0 && (
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle text-[10px] font-mono text-text-muted">
                  Unsupported simulation aspects: {template.unsupportedCapabilities.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}

        {section === "components" && selectedNode && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-semibold text-foreground">
                Architecture Components ({template.topology.nodes.length})
              </h4>
              {template.topology.nodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={cn(
                    "w-full text-left p-2 rounded-md border font-mono text-[11px] transition-colors cursor-pointer",
                    selectedNode.id === node.id
                      ? "bg-surface-04 border-border-strong text-foreground shadow-level-3"
                      : "bg-surface-02 border-border-default text-text-secondary hover:bg-surface-03"
                  )}
                >
                  <div className="font-semibold text-foreground">{node.label}</div>
                  <div className="text-[10px] text-text-muted">
                    {node.componentType} · x{node.analysisProfile.replicas} ·{" "}
                    {node.analysisProfile.capacityPerReplicaRps} rps
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 p-3 rounded-md bg-surface-02 border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CpuIcon className="w-4 h-4 text-text-secondary" />
                  <h4 className="text-xs font-mono font-semibold text-foreground">
                    {selectedNode.label} ({selectedNode.componentType})
                  </h4>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary"
                >
                  {selectedNode.analysisKind}
                </Badge>
              </div>

              <p className="text-xs font-mono text-text-secondary">
                {selectedExplanation?.responsibility ?? selectedNode.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted text-[10px]">Replicas</div>
                  <div className="text-foreground font-semibold">
                    {selectedNode.analysisProfile.replicas}
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted text-[10px]">Capacity / Replica</div>
                  <div className="text-foreground font-semibold">
                    {selectedNode.analysisProfile.capacityPerReplicaRps} req/s
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted text-[10px]">Base Latency</div>
                  <div className="text-foreground font-semibold">
                    {selectedNode.analysisProfile.baseLatencyMs} ms
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted text-[10px]">Replication Mode</div>
                  <div className="text-foreground font-semibold">
                    {selectedNode.analysisProfile.replicationMode}
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted text-[10px]">Cache Hit Ratio</div>
                  <div className="text-foreground font-semibold">
                    {Math.round(selectedNode.analysisProfile.cacheHitRatio * 100)}%
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                  <div className="text-text-muted text-[10px]">Multi-AZ</div>
                  <div className="text-foreground font-semibold">
                    {selectedNode.analysisProfile.multiAz ? "Enabled" : "Single AZ"}
                  </div>
                </div>
              </div>

              {selectedExplanation && (
                <div className="p-2.5 rounded-md bg-surface-03 border border-border-subtle space-y-1 text-[11px] font-mono">
                  <div className="text-foreground font-semibold">
                    Key Config Choice & Failure Impact
                  </div>
                  <div className="text-text-secondary">
                    {selectedExplanation.whyUsed}
                  </div>
                  <div className="text-text-muted">
                    Failure Impact: {selectedExplanation.failureBehavior}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {section === "scenarios" && (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-mono font-semibold text-foreground">
                  Executable Template Scenarios ({template.scenarios.length})
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary">
                    Seed
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={seedInput}
                      onChange={(e) => setSeedInput(Math.max(1, Number(e.target.value) || 1))}
                      className="w-16 h-7 text-[11px] font-mono rounded-md bg-surface-03 border-border-default"
                    />
                  </label>
                  {selectedNode && (
                    <label className="flex items-center gap-1.5 text-[10px] font-mono text-text-secondary">
                      {selectedNode.label} Replicas
                      <Input
                        type="number"
                        min={1}
                        max={64}
                        placeholder={String(selectedNode.analysisProfile.replicas)}
                        value={replicaOverride}
                        onChange={(e) =>
                          setReplicaOverride(
                            e.target.value === "" ? "" : Math.max(1, Number(e.target.value))
                          )
                        }
                        className="w-16 h-7 text-[11px] font-mono rounded-md bg-surface-03 border-border-default"
                      />
                    </label>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRunScenario}
                    className="h-7 px-3 text-[11px] font-mono font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 gap-1"
                  >
                    <PlayIcon className="w-3 h-3" />
                    Run Scenario
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {template.scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={cn(
                      "text-left p-2.5 rounded-md border font-mono transition-colors cursor-pointer space-y-1",
                      selectedScenarioId === sc.id
                        ? "bg-surface-04 border-border-strong text-foreground shadow-level-3"
                        : "bg-surface-03 border-border-default text-text-secondary hover:bg-surface-04"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {sc.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-mono rounded-md bg-surface-02 border border-border-default text-text-muted"
                      >
                        {sc.workloadConfig.workloadRps} rps
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-muted">{sc.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {scenarioResult && (
              <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-semibold text-foreground">
                    Observed Execution Telemetry (Hash: {scenarioResult.deterministicHash})
                  </h4>
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary"
                  >
                    {scenarioResult.allExpectedMatched
                      ? "All Expectations Matched"
                      : "Partial Deviation Observed"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                    <div className="text-text-muted text-[10px]">Completed Throughput</div>
                    <div className="text-foreground font-semibold">
                      {Math.round(scenarioResult.summary.completedRps)} req/s
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                    <div className="text-text-muted text-[10px]">p95 Latency</div>
                    <div className="text-foreground font-semibold">
                      {scenarioResult.summary.p95LatencyMs} ms
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                    <div className="text-text-muted text-[10px]">Availability</div>
                    <div className="text-foreground font-semibold">
                      {(scenarioResult.summary.simulatedAvailability * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="p-2 rounded-md bg-surface-03 border border-border-subtle">
                    <div className="text-text-muted text-[10px]">Est. Monthly Cost</div>
                    <div className="text-foreground font-semibold">
                      ${scenarioResult.summary.estimatedMonthlyCostUsd}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {scenarioResult.observations.map((obs) => (
                    <div
                      key={obs.observationId}
                      className="flex items-center justify-between gap-2 p-2 rounded-md bg-surface-03 border border-border-subtle text-[11px] font-mono"
                    >
                      <div className="space-y-0.5">
                        <div className="text-foreground font-semibold">{obs.description}</div>
                        <div className="text-text-muted text-[10px]">{obs.detail}</div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono rounded-md bg-surface-04 border border-border-default text-foreground shrink-0 gap-1"
                      >
                        {obs.status === "matched" ? (
                          <CheckCircleIcon className="w-3 h-3" />
                        ) : (
                          <AlertTriangleIcon className="w-3 h-3" />
                        )}
                        {obs.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comparison && (
              <div className="p-3 rounded-md bg-surface-02 border border-border-strong space-y-2 text-[11px] font-mono">
                <h4 className="text-xs font-semibold text-foreground">
                  Variant Comparison vs Baseline
                </h4>
                <p className="text-text-secondary">{comparison.summary}</p>
                <div className="text-text-muted">
                  Changed components: {comparison.diff.changedNodes.map((n) => `${n.nodeId} (${n.changes.join(", ")})`).join(" · ") || "None"}
                </div>
              </div>
            )}
          </div>
        )}

        {section === "walkthrough" && activeWalkthrough && (
          <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-mono font-semibold text-foreground">
                  {activeWalkthrough.title}
                </h4>
                <p className="text-[11px] font-mono text-text-muted">
                  Step {wtProgress.currentStepIndex + 1} of {activeWalkthrough.steps.length} ·{" "}
                  Status: {wtProgress.status}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => advanceWalkthrough("prev")}
                  disabled={wtProgress.currentStepIndex === 0}
                  className="h-7 px-2 text-[11px] font-mono rounded-md bg-surface-03 border border-border-default text-foreground disabled:opacity-40 gap-1"
                >
                  <ChevronLeftIcon className="w-3 h-3" />
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => advanceWalkthrough("restart")}
                  className="h-7 px-2 text-[11px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary hover:text-foreground gap-1"
                >
                  <RefreshIcon className="w-3 h-3" />
                  Restart
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => advanceWalkthrough("next")}
                  className="h-7 px-3 text-[11px] font-mono font-semibold rounded-md bg-foreground text-background hover:bg-foreground/90 gap-1"
                >
                  {wtProgress.currentStepIndex >= activeWalkthrough.steps.length - 1
                    ? "Finish Walkthrough"
                    : "Next Step"}
                  <ChevronRightIcon className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {activeStep && (
              <div className="p-3 rounded-md bg-surface-03 border border-border-default space-y-1.5 font-mono">
                <div className="text-xs font-semibold text-foreground">
                  {activeStep.order}. {activeStep.title}
                </div>
                <p className="text-xs text-text-secondary">{activeStep.explanation}</p>
                {activeStep.promptQuestion && (
                  <div className="mt-2 p-2 rounded-md bg-surface-02 border border-border-subtle text-[11px]">
                    <div className="text-foreground font-semibold">
                      Check Your Understanding: {activeStep.promptQuestion}
                    </div>
                    {activeStep.suggestedAnswer && (
                      <div className="text-text-muted mt-0.5">
                        Key insight: {activeStep.suggestedAnswer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {activeWalkthrough.steps.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    const next = TemplateWalkthroughEngine.goToStep(
                      activeWalkthrough,
                      wtProgress,
                      idx
                    );
                    setWtProgress(next);
                    if (next.selectedNodeId) setSelectedNodeId(next.selectedNodeId);
                  }}
                  className={cn(
                    "p-2 rounded-md border text-left font-mono text-[10px] transition-colors cursor-pointer",
                    idx === wtProgress.currentStepIndex
                      ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                      : "bg-surface-03 border-border-subtle text-text-muted hover:text-foreground"
                  )}
                >
                  {st.order}. {st.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {section === "tradeoffs" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-2 font-mono">
              <h4 className="text-xs font-semibold text-foreground">
                Architectural Design Decisions & Trade-Offs
              </h4>
              {template.tradeOffsSummary.map((t, i) => (
                <p key={i} className="text-[11px] text-text-secondary">
                  • {t}
                </p>
              ))}
              {template.designDecisions.map((d) => (
                <div
                  key={d.id}
                  className="p-2 rounded-md bg-surface-03 border border-border-subtle space-y-1 text-[11px]"
                >
                  <div className="text-foreground font-semibold">{d.question}</div>
                  <div className="text-text-secondary">Decision: {d.decision}</div>
                  <div className="text-text-muted">Rationale: {d.rationale}</div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-2 font-mono">
              <h4 className="text-xs font-semibold text-foreground">
                Operational Limitations & Alternative Architectures
              </h4>
              {template.operationalLimitations.map((lim, i) => (
                <p key={i} className="text-[11px] text-text-secondary">
                  • {lim}
                </p>
              ))}
              {template.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  className="p-2 rounded-md bg-surface-03 border border-border-subtle space-y-1 text-[11px]"
                >
                  <div className="text-foreground font-semibold">{alt.title}</div>
                  <div className="text-text-secondary">{alt.summary}</div>
                  <div className="text-text-muted">
                    Perf: {alt.performanceImpact} · Cost: {alt.costImpact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
