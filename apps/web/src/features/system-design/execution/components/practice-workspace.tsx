"use client";

import * as React from "react";
import {
  ENGINEERING_LABS,
  PRACTICE_PRESET_METADATA,
  computeCapacityEstimation,
  createPracticePresetScenario,
  resetLabWorkingState,
  searchChallengeCatalog,
  type ChallengeDifficulty,
  type EstimationInput,
  type ModeledPracticeRuntimeState,
  type PracticeMode,
  type PracticePresetId,
  type PracticePressureMode,
  type PracticeScenario,
} from "@nxtqr/architecture-execution";
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
import {
  AlertTriangleIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CloseIcon,
  LayersIcon,
  PlayIcon,
  RefreshIcon,
  SearchIcon,
  ShieldIcon,
  TerminalIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";

type PracticeTabId =
  | "catalog"
  | "interview"
  | "design_artifacts"
  | "hints_pressure"
  | "evaluation"
  | "labs"
  | "progress_report";

export function PracticeWorkspace() {
  const isOpen = useExecutionStore((s) => s.isPracticeWorkspaceOpen);
  const toggleWorkspace = useExecutionStore((s) => s.togglePracticeWorkspace);
  const activeScenario = useExecutionStore((s) => s.activePracticeScenario);
  const trace = useExecutionStore((s) => s.trace);
  const runPracticeScenario = useExecutionStore((s) => s.runPracticeScenario);
  const practiceAttempts = useExecutionStore((s) => s.practiceAttempts);

  const [activeTab, setActiveTab] = React.useState<PracticeTabId>("catalog");
  const [searchText, setSearchText] = React.useState("");
  const [difficultyFilter, setDifficultyFilter] = React.useState<ChallengeDifficulty | "all">("all");
  const [clarificationDraft, setClarificationDraft] = React.useState("");
  const [reportFormat, setReportFormat] = React.useState<"markdown" | "json">("markdown");
  const [timerRunning, setTimerRunning] = React.useState(false);

  const practiceState: ModeledPracticeRuntimeState | undefined =
    trace?.frames[trace.frames.length - 1]?.runtimeState?.practiceState;

  // Monotonic elapsed timer tick while mock interview active
  React.useEffect(() => {
    if (!isOpen || !timerRunning || !activeScenario) return;
    const id = window.setInterval(() => {
      const current = useExecutionStore.getState().activePracticeScenario;
      if (!current) return;
      useExecutionStore.getState().setPracticeScenario({
        ...current,
        monotonicElapsedMs: current.monotonicElapsedMs + 1000,
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isOpen, timerRunning, activeScenario]);

  const catalogResult = React.useMemo(
    () =>
      searchChallengeCatalog({
        search: searchText,
        difficulty: difficultyFilter,
        page: 1,
        pageSize: 30,
      }),
    [searchText, difficultyFilter]
  );

  if (!isOpen) return null;

  const scenario =
    activeScenario || createPracticePresetScenario("prac_beginner_url_shortener");

  const runUpdatedScenario = (next: PracticeScenario) => {
    runPracticeScenario(next);
  };

  const handleSelectPreset = (presetId: string) => {
    const next = createPracticePresetScenario(presetId as PracticePresetId);
    runUpdatedScenario(next);
  };

  const handleLaunchChallenge = (challengeId: string, mode: PracticeMode) => {
    const matchingPreset = PRACTICE_PRESET_METADATA.find(
      (p) => p.challengeId === challengeId
    );
    const base = createPracticePresetScenario(
      matchingPreset?.id || "prac_beginner_url_shortener",
      mode
    );
    const next: PracticeScenario = {
      ...base,
      id: `custom_${challengeId}_${mode}`,
      challengeId,
      mode,
      pressureMode: mode === "mock-interview" ? "standard" : "relaxed",
      labId: undefined,
      monotonicElapsedMs: 0,
      revealHintUpToLevel: mode === "learn" ? 1 : 0,
    };
    setTimerRunning(mode === "mock-interview");
    runUpdatedScenario(next);
    setActiveTab("interview");
  };

  const handleLaunchLab = (labId: string) => {
    const lab = ENGINEERING_LABS.find((l) => l.id === labId) || ENGINEERING_LABS[0];
    const matchingPreset = PRACTICE_PRESET_METADATA.find((p) => p.labId === labId);
    const base = createPracticePresetScenario(
      matchingPreset?.id || "prac_reliability_drill_ha",
      "engineering-lab"
    );
    const next: PracticeScenario = {
      ...base,
      id: `lab_run_${lab.id}`,
      name: lab.title,
      mode: "engineering-lab",
      labId: lab.id,
      architectureComponents: lab.starterRevision.components,
      architectureEdges: lab.starterRevision.edges,
      completedLabStepIds: [lab.steps[0]?.id || "s1"],
      fault: {
        id: `f_${lab.id}`,
        type: lab.fault.type,
        targetComponentId: lab.fault.targetId || "db",
        atMs: 160,
        durationMs: 220,
      },
    };
    runUpdatedScenario(next);
    setActiveTab("labs");
  };

  const handleAskClarification = () => {
    const trimmed = clarificationDraft.trim();
    if (!trimmed) return;
    setClarificationDraft("");
    runUpdatedScenario({
      ...scenario,
      clarificationQuestions: [...scenario.clarificationQuestions, trimmed],
    });
  };

  const handleEstimationChange = (patch: Partial<EstimationInput>) => {
    const updatedInput = { ...scenario.estimationInput, ...patch };
    useExecutionStore.getState().setPracticeScenario({
      ...scenario,
      estimationInput: updatedInput,
    });
  };

  const liveEstimation = computeCapacityEstimation(scenario.estimationInput);
  const evalResult = practiceState?.evaluation;
  const pubChallenge = practiceState?.publicChallenge;
  const activeLab = practiceState?.activeLab;
  const labAttempt = practiceState?.labAttempt;

  const elapsedSeconds = Math.floor(scenario.monotonicElapsedMs / 1000);
  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedRemSec = elapsedSeconds % 60;

  return (
    <div
      className="fixed inset-3 md:inset-6 z-50 flex flex-col rounded-md border border-border-strong bg-surface-01 shadow-level-2 overflow-hidden"
      role="dialog"
      aria-label="System Design Interview Simulator and Guided Engineering Labs"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-surface-02 border-b border-border-default">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpenIcon className="w-4 h-4 text-text-secondary shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-mono font-semibold text-foreground truncate">
              {pubChallenge?.title || "System Design Interview Simulator & Guided Labs"}
            </h2>
            <p className="text-[10px] font-mono text-text-muted truncate">
              Mode: {scenario.mode} · Pressure: {scenario.pressureMode} ·{" "}
              {pubChallenge
                ? `${pubChallenge.difficulty} · v${pubChallenge.version}`
                : "Select a challenge or lab"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Monotonic Interview Timer (separate from simulation virtual clock) */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-03 border border-border-default text-[10px] font-mono text-text-secondary">
            <span>
              Timer: {String(elapsedMin).padStart(2, "0")}:
              {String(elapsedRemSec).padStart(2, "0")} / {scenario.durationLimitMinutes}m
            </span>
            {scenario.mode === "mock-interview" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimerRunning((v) => !v)}
                className="h-5 px-1.5 text-[10px] font-mono rounded-md bg-surface-04 hover:bg-surface-02 text-foreground"
              >
                {timerRunning ? "Pause" : "Start"}
              </Button>
            )}
          </div>

          <Select value={scenario.id} onValueChange={handleSelectPreset}>
            <SelectTrigger className="w-56 h-7 text-[11px] font-mono rounded-md bg-surface-03 border-border-default">
              <SelectValue placeholder="Choose Interview Preset" />
            </SelectTrigger>
            <SelectContent className="max-h-80 rounded-md bg-surface-02 border-border-strong">
              {PRACTICE_PRESET_METADATA.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-[11px] font-mono">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => runUpdatedScenario(scenario)}
            className="h-7 px-2.5 text-[11px] font-mono rounded-md gap-1 bg-surface-04 border border-border-strong text-foreground hover:bg-surface-03"
          >
            <PlayIcon className="w-3 h-3" />
            Evaluate Design
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleWorkspace(false)}
            aria-label="Close Practice Workspace"
            className="h-7 w-7 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 py-1.5 bg-surface-01 border-b border-border-subtle overflow-x-auto">
        {(
          [
            ["catalog", "1. Challenge Catalog (30)"],
            ["interview", "2. Requirements & Interview"],
            ["design_artifacts", "3. Estimate / API / Data"],
            ["hints_pressure", "4. Hints & Trade-Offs"],
            ["evaluation", "5. Rubric & Evidence"],
            ["labs", "6. Guided Labs (20)"],
            ["progress_report", "7. Progress & Export"],
          ] as Array<[PracticeTabId, string]>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "catalog" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <SearchIcon className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search challenges by title, concept, or category..."
                  className="pl-8 h-8 text-xs font-mono rounded-md bg-surface-02 border-border-default"
                />
              </div>

              <Select
                value={difficultyFilter}
                onValueChange={(v) => setDifficultyFilter(v as ChallengeDifficulty | "all")}
              >
                <SelectTrigger className="w-44 h-8 text-xs font-mono rounded-md bg-surface-02 border-border-default">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="rounded-md bg-surface-02 border-border-strong">
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catalogResult.items.map((ch) => {
                const attemptsForCh = practiceAttempts.filter(
                  (a) => a.challengeId === ch.id
                );
                return (
                  <div
                    key={ch.id}
                    className={cn(
                      "flex flex-col justify-between gap-2 p-3 rounded-md border bg-surface-02 shadow-level-1",
                      scenario.challengeId === ch.id
                        ? "border-border-strong bg-surface-03"
                        : "border-border-default"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {ch.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono rounded-md bg-surface-04 border border-border-default text-text-secondary"
                        >
                          {ch.difficulty}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-text-muted leading-snug">
                        {ch.description}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {ch.concepts.slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 text-[9px] font-mono rounded-md bg-surface-01 border border-border-subtle text-text-secondary"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-border-subtle">
                      <span className="text-[10px] font-mono text-text-muted">
                        ~{ch.estimatedMinutes}m · {attemptsForCh.length} run(s)
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLaunchChallenge(ch.id, "learn")}
                          className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-03 hover:bg-surface-04"
                        >
                          Learn
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLaunchChallenge(ch.id, "practice")}
                          className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-03 hover:bg-surface-04"
                        >
                          Practice
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleLaunchChallenge(ch.id, "mock-interview")}
                          className="h-6 px-2 text-[10px] font-mono rounded-md bg-surface-04 border border-border-strong"
                        >
                          Mock
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "interview" && pubChallenge && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold text-foreground">
                  Requirements Discovery ({pubChallenge.visibleRequirements.length} revealed)
                </h3>
                <Badge className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-default text-text-secondary">
                  Server-Validated Projection
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary">{pubChallenge.publicPrompt}</p>

              <div className="space-y-1.5">
                {pubChallenge.visibleRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-2 rounded-md border border-border-subtle bg-surface-01 space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-semibold text-foreground">
                        [{req.code}] {req.title}
                      </span>
                      <span className="text-text-muted uppercase">{req.kind}</span>
                    </div>
                    <p className="text-[11px] text-text-muted">{req.description}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border-subtle space-y-2">
                <div className="flex flex-wrap gap-1">
                  {pubChallenge.sampleClarificationPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setClarificationDraft(prompt)}
                      className="text-left px-2 py-1 text-[10px] font-mono rounded-md border border-border-default bg-surface-03 hover:bg-surface-04 text-text-secondary cursor-pointer"
                    >
                      Ask: {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={clarificationDraft}
                    onChange={(e) => setClarificationDraft(e.target.value)}
                    placeholder="Ask clarifying question about scale, latency, failure tolerance..."
                    className="h-8 text-xs font-mono rounded-md bg-surface-01 border-border-default"
                  />
                  <Button
                    size="sm"
                    onClick={handleAskClarification}
                    className="h-8 px-3 text-xs font-mono rounded-md bg-surface-04 border border-border-strong"
                  >
                    Ask
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              <h3 className="text-xs font-mono font-semibold text-foreground">
                Interviewer Conversation & Contextual Follow-Ups
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {(practiceState?.messages || []).map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "p-2 rounded-md border text-[11px]",
                      m.role === "interviewer"
                        ? "border-border-default bg-surface-01 text-text-secondary"
                        : "border-border-strong bg-surface-03 text-foreground"
                    )}
                  >
                    <div className="text-[9px] font-mono uppercase text-text-muted mb-0.5">
                      {m.role} · {m.phase.replace(/_/g, " ")}
                    </div>
                    <p>{m.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "design_artifacts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Capacity Estimation Panel */}
            <div className="space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              <h3 className="text-xs font-mono font-semibold text-foreground">
                Capacity & Bandwidth Estimation
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <label className="space-y-1">
                  <span className="text-text-muted">DAU</span>
                  <Input
                    type="number"
                    value={scenario.estimationInput.dailyActiveUsers}
                    onChange={(e) =>
                      handleEstimationChange({
                        dailyActiveUsers: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="h-7 text-xs font-mono rounded-md bg-surface-01 border-border-default"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-text-muted">Req / User / Day</span>
                  <Input
                    type="number"
                    value={scenario.estimationInput.requestsPerUserPerDay}
                    onChange={(e) =>
                      handleEstimationChange({
                        requestsPerUserPerDay: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="h-7 text-xs font-mono rounded-md bg-surface-01 border-border-default"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-text-muted">Peak Multiplier</span>
                  <Input
                    type="number"
                    value={scenario.estimationInput.peakMultiplier}
                    onChange={(e) =>
                      handleEstimationChange({
                        peakMultiplier: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-7 text-xs font-mono rounded-md bg-surface-01 border-border-default"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-text-muted">Replication Factor</span>
                  <Input
                    type="number"
                    value={scenario.estimationInput.replicationFactor}
                    onChange={(e) =>
                      handleEstimationChange({
                        replicationFactor: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="h-7 text-xs font-mono rounded-md bg-surface-01 border-border-default"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-xs font-mono">
                <div className="p-2 rounded-md bg-surface-01 border border-border-subtle">
                  <div className="text-[10px] text-text-muted">Avg / Peak RPS</div>
                  <div className="font-semibold text-foreground">
                    {liveEstimation.averageRps} / {liveEstimation.peakRps}
                  </div>
                </div>
                <div className="p-2 rounded-md bg-surface-01 border border-border-subtle">
                  <div className="text-[10px] text-text-muted">Replicated Storage</div>
                  <div className="font-semibold text-foreground">
                    {liveEstimation.formattedReplicatedTb} TB
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-text-muted">{liveEstimation.caveat}</p>
            </div>

            {/* API Contracts */}
            <div className="space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              <h3 className="text-xs font-mono font-semibold text-foreground">
                API Contracts ({scenario.apiDesign.endpoints.length})
              </h3>
              <div className="space-y-2">
                {scenario.apiDesign.endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-2 rounded-md border border-border-subtle bg-surface-01 space-y-1 text-[11px] font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {ep.method} {ep.path}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {ep.idempotent ? "idempotent" : "non-idemp"} · {ep.authRequired ? "auth" : "public"}
                      </span>
                    </div>
                    <p className="text-text-muted">{ep.purpose}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-text-muted">{scenario.apiDesign.notes}</p>
            </div>

            {/* Data Model */}
            <div className="space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              <h3 className="text-xs font-mono font-semibold text-foreground">
                Data Model ({scenario.dataModel.entities.length} entities)
              </h3>
              <div className="space-y-2">
                {scenario.dataModel.entities.map((ent) => (
                  <div
                    key={ent.id}
                    className="p-2 rounded-md border border-border-subtle bg-surface-01 space-y-1 text-[11px] font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{ent.name}</span>
                      <span className="text-[10px] text-text-muted">{ent.storageKind}</span>
                    </div>
                    <div className="text-[10px] text-text-secondary">
                      PK: {ent.primaryKey} · Shard: {ent.partitionKey || "none"} · Rep: {ent.replicationMode}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Indexes: {ent.indexes.join(", ") || "none"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "hints_pressure" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-semibold text-foreground">
                  Progressive Hints ({practiceState?.revealedHints.length || 0} revealed)
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    runUpdatedScenario({
                      ...scenario,
                      revealHintUpToLevel: Math.min(5, scenario.revealHintUpToLevel + 1),
                    })
                  }
                  className="h-7 px-2.5 text-[11px] font-mono rounded-md bg-surface-04 border border-border-strong"
                >
                  Reveal Next Hint Level
                </Button>
              </div>
              <div className="space-y-2">
                {(practiceState?.revealedHints || []).length === 0 ? (
                  <p className="text-xs text-text-muted font-mono">
                    No hints revealed yet. Hints unlock sequentially from Level 1 to Level 5.
                  </p>
                ) : (
                  (practiceState?.availableHints || [])
                    .filter((h) =>
                      practiceState?.revealedHints.some((r) => r.hintId === h.id)
                    )
                    .map((hint) => (
                      <div
                        key={hint.id}
                        className="p-2.5 rounded-md border border-border-default bg-surface-01 space-y-1"
                      >
                        <div className="text-[10px] font-mono text-text-secondary font-semibold">
                          Level {hint.level} · {hint.title}
                        </div>
                        <p className="text-xs text-text-muted">{hint.content}</p>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              <h3 className="text-xs font-mono font-semibold text-foreground">
                Pressure Policy & Trade-Off Explanation
              </h3>
              <Select
                value={scenario.pressureMode}
                onValueChange={(v) =>
                  runUpdatedScenario({
                    ...scenario,
                    pressureMode: v as PracticePressureMode,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs font-mono rounded-md bg-surface-01 border-border-default">
                  <SelectValue placeholder="Pressure mode" />
                </SelectTrigger>
                <SelectContent className="rounded-md bg-surface-02 border-border-strong">
                  <SelectItem value="relaxed">Relaxed (pause allowed, 0% hint penalty)</SelectItem>
                  <SelectItem value="standard">Standard (pause allowed, disclosed 2%/hint)</SelectItem>
                  <SelectItem value="strict">Strict (no pause, max 2 hints, auto-submit)</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={scenario.tradeOffExplanation}
                onChange={(e) =>
                  useExecutionStore.getState().setPracticeScenario({
                    ...scenario,
                    tradeOffExplanation: e.target.value,
                  })
                }
                rows={5}
                className="text-xs font-mono rounded-md bg-surface-01 border-border-default"
                placeholder="Explain your database, cache, reliability, and cost trade-offs..."
              />
            </div>
          </div>
        )}

        {activeTab === "evaluation" && evalResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-md border border-border-default bg-surface-02">
                <div className="text-[10px] font-mono text-text-muted">Evaluated Score</div>
                <div className="text-lg font-mono font-semibold text-foreground">
                  {evalResult.evaluatedWeightedScore}%
                </div>
                <div className="text-[10px] font-mono text-text-secondary">
                  Across {evalResult.evaluatedWeightPct}% deterministic/sim weight
                </div>
              </div>
              <div className="p-3 rounded-md border border-border-default bg-surface-02">
                <div className="text-[10px] font-mono text-text-muted">Evaluation Status</div>
                <div className="text-lg font-mono font-semibold text-foreground uppercase">
                  {evalResult.status}
                </div>
                <div className="text-[10px] font-mono text-text-secondary">
                  {evalResult.pendingWeightPct}% human review pending
                </div>
              </div>
              <div className="p-3 rounded-md border border-border-default bg-surface-02">
                <div className="text-[10px] font-mono text-text-muted">Evidence Records</div>
                <div className="text-lg font-mono font-semibold text-foreground">
                  {evalResult.evidences.length}
                </div>
                <div className="text-[10px] font-mono text-text-secondary">
                  {evalResult.findings.length} critical/warning finding(s)
                </div>
              </div>
              <div className="p-3 rounded-md border border-border-default bg-surface-02">
                <div className="text-[10px] font-mono text-text-muted">Invariants</div>
                <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-foreground mt-1">
                  {practiceState?.invariants.passed ? (
                    <CheckCircleIcon className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <AlertTriangleIcon className="w-4 h-4 text-text-secondary" />
                  )}
                  {practiceState?.invariants.passed ? "VERIFIED" : "VIOLATION"}
                </div>
              </div>
            </div>

            {/* Rubric Criterion Table */}
            <div className="rounded-md border border-border-default bg-surface-02 overflow-hidden">
              <div className="px-3 py-2 border-b border-border-subtle text-xs font-mono font-semibold text-foreground">
                Versioned Rubric Breakdown ({evalResult.rubricId} v{evalResult.rubricVersion})
              </div>
              <div className="divide-y divide-border-subtle">
                {evalResult.criterionResults.map((cr) => (
                  <div
                    key={cr.criterionId}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-3 py-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono font-semibold text-foreground">
                        {cr.title}{" "}
                        <span className="text-[10px] text-text-muted">
                          ({cr.weight}% · {cr.evaluationType})
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">{cr.rationale}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-default shrink-0"
                    >
                      {cr.status === "pending"
                        ? "PENDING HUMAN REVIEW"
                        : `${cr.score}/3 (${cr.normalizedScorePct}%)`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-md border border-border-default bg-surface-01 text-[11px] text-text-muted">
              <ShieldIcon className="w-3.5 h-3.5 inline mr-1.5 text-text-secondary" />
              {evalResult.confidenceSummary.qualitativeDisclaimer}
            </div>
          </div>
        )}

        {activeTab === "labs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2 p-3 rounded-md border border-border-default bg-surface-02 max-h-[500px] overflow-y-auto">
              <h3 className="text-xs font-mono font-semibold text-foreground">
                20 Guided Engineering Labs
              </h3>
              {ENGINEERING_LABS.map((lab) => (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => handleLaunchLab(lab.id)}
                  className={cn(
                    "w-full text-left p-2 rounded-md border text-[11px] font-mono transition-colors cursor-pointer",
                    activeLab?.id === lab.id
                      ? "bg-surface-04 border-border-strong text-foreground font-semibold"
                      : "bg-surface-01 border-border-subtle text-text-secondary hover:bg-surface-03"
                  )}
                >
                  <div>{lab.title}</div>
                  <div className="text-[10px] text-text-muted">
                    {lab.difficulty} · {lab.topic} · {lab.workloadRps} req/s
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2 space-y-3 p-3 rounded-md border border-border-default bg-surface-02">
              {activeLab ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-mono font-semibold text-foreground">
                        {activeLab.title}
                      </h3>
                      <p className="text-xs text-text-muted">{activeLab.explanation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const reset = resetLabWorkingState(activeLab);
                          runUpdatedScenario({
                            ...scenario,
                            architectureComponents: reset.components,
                            architectureEdges: reset.edges,
                            completedLabStepIds: reset.completedStepIds,
                          });
                        }}
                        className="h-7 px-2.5 text-[11px] font-mono rounded-md gap-1 bg-surface-03"
                      >
                        <RefreshIcon className="w-3 h-3" />
                        Reset Lab
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          runUpdatedScenario({
                            ...scenario,
                            completedLabStepIds: activeLab.steps.map((s) => s.id),
                          })
                        }
                        className="h-7 px-2.5 text-[11px] font-mono rounded-md gap-1 bg-surface-04 border border-border-strong"
                      >
                        <LayersIcon className="w-3 h-3" />
                        Validate All Steps
                      </Button>
                    </div>
                  </div>

                  {labAttempt && (
                    <div className="space-y-2 pt-2 border-t border-border-subtle">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-foreground">
                          Behavioral Validation Rules
                        </span>
                        <Badge className="text-[10px] font-mono rounded-md bg-surface-03 border border-border-default">
                          {labAttempt.completed ? "LAB COMPLETED" : "IN PROGRESS"}
                        </Badge>
                      </div>
                      {labAttempt.validationResults.map((vr) => (
                        <div
                          key={vr.ruleId}
                          className="flex items-center justify-between p-2 rounded-md border border-border-subtle bg-surface-01 text-[11px] font-mono"
                        >
                          <div>
                            <div className="text-foreground">{vr.description}</div>
                            <div className="text-[10px] text-text-muted">{vr.observedDetail}</div>
                          </div>
                          <span className="text-text-secondary font-semibold">
                            {vr.passed ? "PASS" : "PENDING"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs font-mono text-text-muted">
                  Select any engineering lab on the left to inspect its starter topology and run behavioral validation.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "progress_report" && practiceState && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-md border border-border-default bg-surface-02 space-y-1">
                <div className="text-[10px] font-mono text-text-muted">Challenge Attempts</div>
                <div className="text-lg font-mono font-semibold text-foreground">
                  {practiceState.learningProgress.attempts}
                </div>
                <p className="text-[10px] text-text-muted">
                  {practiceState.learningProgress.masteryExplanation}
                </p>
              </div>
              <div className="p-3 rounded-md border border-border-default bg-surface-02 space-y-1">
                <div className="text-[10px] font-mono text-text-muted">Mastered Dimensions</div>
                <div className="text-xs font-mono text-foreground">
                  {practiceState.learningProgress.masteredCriteria.join(", ") ||
                    "Requires >= 2 strong attempts"}
                </div>
              </div>
              <div className="p-3 rounded-md border border-border-default bg-surface-02 space-y-1">
                <div className="text-[10px] font-mono text-text-muted">
                  Recommended Next Challenges
                </div>
                <div className="text-xs font-mono text-foreground">
                  {practiceState.recommendedChallengeIds.join(", ") || "All explored"}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border-default bg-surface-02 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                  <TerminalIcon className="w-3.5 h-3.5 text-text-secondary" />
                  Exportable Session Report ({reportFormat.toUpperCase()})
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReportFormat("markdown")}
                    className={cn(
                      "h-6 px-2 text-[10px] font-mono rounded-md",
                      reportFormat === "markdown" ? "bg-surface-04 border border-border-strong" : ""
                    )}
                  >
                    Markdown
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReportFormat("json")}
                    className={cn(
                      "h-6 px-2 text-[10px] font-mono rounded-md",
                      reportFormat === "json" ? "bg-surface-04 border border-border-strong" : ""
                    )}
                  >
                    JSON
                  </Button>
                </div>
              </div>
              <pre className="p-3 text-[11px] font-mono text-text-secondary overflow-x-auto max-h-80">
                {reportFormat === "markdown"
                  ? practiceState.report.markdown
                  : practiceState.report.jsonPayload}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

