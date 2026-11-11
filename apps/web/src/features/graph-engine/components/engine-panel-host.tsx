"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useGraphEditorStore } from "../store/graph-editor-store";
import { getFeatureById } from "@/features/system-design/feature-registry";
import { PanelResizeHandle } from "./panel-resize-handle";
import { Badge } from "@nxtqr/ui";
import {
  CloseIcon,
  ShieldIcon,
  ActivityIcon,
  DatabaseIcon,
  CpuIcon,
  LockIcon,
  SlidersIcon,
  PlayIcon,
  TerminalIcon,
  BookOpenIcon,
  ArchiveIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SpinnerIcon,
} from "@nxtqr/icons";

interface EnginePanelHostProps {
  projectId?: string | null;
}

function EngineLoading({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 font-mono text-xs text-text-muted select-none">
      <SpinnerIcon className="h-4 w-4 animate-spin text-text-secondary" />
      <span>Loading {name} Engine...</span>
    </div>
  );
}

// Dynamic Workspaces
const CostWorkspacePanel = dynamic(
  () => import("@/features/system-design/cost").then((m) => m.CostWorkspacePanel),
  { ssr: false, loading: () => <EngineLoading name="Cost Intelligence" /> }
);

const DatabaseWorkspace = dynamic(
  () => import("@/features/system-design/database").then((m) => m.DatabaseWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Database Design" /> }
);

const NetworkWorkspace = dynamic(
  () => import("@/features/system-design/network").then((m) => m.NetworkWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Network & Traffic" /> }
);

const ReadinessWorkspace = dynamic(
  () => import("@/features/system-design/readiness").then((m) => m.ReadinessWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Production Readiness" /> }
);

const OrchestrationWorkspace = dynamic(
  () => import("@/features/system-design/orchestration").then((m) => m.OrchestrationWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Unified Orchestration" /> }
);

const SimulationWorkspace = dynamic(
  () => import("@/features/system-design/simulation").then((m) => m.SimulationWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Chaos Simulation" /> }
);

const ObservabilityWorkspace = dynamic(
  () => import("@/features/system-design/observability").then((m) => m.ObservabilityWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Observability" /> }
);

const PerformanceWorkspace = dynamic(
  () => import("@/features/system-design/performance").then((m) => m.PerformanceWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Performance Benchmarking" /> }
);

const DeploymentWorkspace = dynamic(
  () => import("@/features/system-design/deployment").then((m) => m.DeploymentWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Deployment Topology" /> }
);

const LineageWorkspace = dynamic(
  () => import("@/features/system-design/data-lineage").then((m) => m.LineageWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Data Lineage" /> }
);

const ContractsWorkspace = dynamic(
  () => import("@/features/system-design/api-contracts").then((m) => m.ContractsWorkspace),
  { ssr: false, loading: () => <EngineLoading name="API Contracts" /> }
);

const MessagingWorkspace = dynamic(
  () => import("@/features/system-design/messaging").then((m) => m.MessagingWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Messaging & Streaming" /> }
);

const CacheStateWorkspace = dynamic(
  () => import("@/features/system-design/cache-state").then((m) => m.CacheStateWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Caching & State" /> }
);

const GovernanceWorkspace = dynamic(
  () => import("@/features/system-design/governance").then((m) => m.GovernanceWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Governance & Policy" /> }
);

const EvolutionWorkspace = dynamic(
  () => import("@/features/system-design/evolution").then((m) => m.EvolutionWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Architecture Evolution" /> }
);

const OperationsWorkspace = dynamic(
  () => import("@/features/system-design/operations").then((m) => m.OperationsWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Incident Response & DR" /> }
);

const VerificationWorkspace = dynamic(
  () => import("@/features/system-design/verification").then((m) => m.VerificationWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Verification & Testing" /> }
);

const ReportWorkspace = dynamic(
  () => import("@/features/system-design/reports").then((m) => m.ReportWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Reports & ADRs" /> }
);

const ComparisonWorkspace = dynamic(
  () => import("@/features/system-design/comparison").then((m) => m.ComparisonWorkspace),
  { ssr: false, loading: () => <EngineLoading name="Architecture Diff" /> }
);

const CapacityPlanningPanel = dynamic(
  () => import("@/features/system-design/capacity-planning").then((m) => m.CapacityPlanningPanel),
  { ssr: false, loading: () => <EngineLoading name="Capacity Planning" /> }
);

const AssistantPanel = dynamic(
  () => import("@/features/system-design/ai-assistant").then((m) => m.AssistantPanel),
  { ssr: false, loading: () => <EngineLoading name="AI Copilot" /> }
);

const UnifiedRecommendationList = dynamic(
  () => import("@/features/system-design/recommendations").then((m) => m.UnifiedRecommendationList),
  { ssr: false, loading: () => <EngineLoading name="Recommendations" /> }
);

function EngineHeaderIcon({ iconName, className }: { iconName: string; className?: string }) {
  switch (iconName) {
    case "ShieldIcon":
      return <ShieldIcon className={className} />;
    case "ActivityIcon":
      return <ActivityIcon className={className} />;
    case "DatabaseIcon":
      return <DatabaseIcon className={className} />;
    case "CpuIcon":
      return <CpuIcon className={className} />;
    case "LockIcon":
      return <LockIcon className={className} />;
    case "SlidersIcon":
      return <SlidersIcon className={className} />;
    case "PlayIcon":
      return <PlayIcon className={className} />;
    case "TerminalIcon":
      return <TerminalIcon className={className} />;
    case "BookOpenIcon":
      return <BookOpenIcon className={className} />;
    case "ArchiveIcon":
      return <ArchiveIcon className={className} />;
    case "AlertCircleIcon":
      return <AlertCircleIcon className={className} />;
    case "CheckCircleIcon":
    default:
      return <CheckCircleIcon className={className} />;
  }
}

export function EnginePanelHost({ projectId }: EnginePanelHostProps) {
  const activeEngineId = useGraphEditorStore((s) => s.activeEngineId);
  const setActiveEngineId = useGraphEditorStore((s) => s.setActiveEngineId);
  const enginePanelWidth = useGraphEditorStore((s) => s.enginePanelWidth);
  const setEnginePanelWidth = useGraphEditorStore((s) => s.setEnginePanelWidth);

  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);

  // If activeEngineId is one of the 6 original ones, they are handled by their legacy panels
  if (
    !activeEngineId ||
    ["validation", "health", "bottlenecks", "failure-analysis", "security-analysis", "scalability"].includes(
      activeEngineId
    )
  ) {
    return null;
  }

  const feature = getFeatureById(activeEngineId);
  if (!feature) return null;

  const currentProjectId = projectId || "default-project";

  return (
    <aside
      style={{ width: `${enginePanelWidth}px` }}
      className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
    >
      {/* Top Header */}
      <div className="h-9 px-3 border-b border-border-subtle bg-surface-02 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-5 h-5 rounded-md bg-surface-03 border border-border-default flex items-center justify-center text-text-secondary shrink-0">
            <EngineHeaderIcon iconName={feature.iconName} className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold font-sans text-foreground truncate">
            {feature.name}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] font-mono rounded-md h-4 px-1 border-border-strong text-text-muted shrink-0"
          >
            {feature.phase}
          </Badge>
        </div>

        <button
          type="button"
          onClick={() => setActiveEngineId(null)}
          className="h-6 w-6 rounded-md flex items-center justify-center text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors cursor-pointer shrink-0"
          title="Close panel"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-surface-01">
        {activeEngineId === "cost" && (
          <CostWorkspacePanel onClose={() => setActiveEngineId(null)} />
        )}

        {activeEngineId === "database" && (
          <DatabaseWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "network" && (
          <NetworkWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "readiness" && (
          <ReadinessWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "orchestration" && (
          <OrchestrationWorkspace
            nodes={nodes}
            edges={edges}
            projectId={currentProjectId}
          />
        )}

        {activeEngineId === "simulation" && (
          <SimulationWorkspace
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "observability" && (
          <ObservabilityWorkspace
            nodes={nodes}
            edges={edges}
            projectId={currentProjectId}
          />
        )}

        {activeEngineId === "performance" && (
          <PerformanceWorkspace
            nodes={nodes}
            edges={edges}
            projectId={currentProjectId}
            architectureId="arch-head"
          />
        )}

        {activeEngineId === "deployment" && (
          <DeploymentWorkspace
            projectId={currentProjectId}
            logicalNodes={nodes}
          />
        )}

        {activeEngineId === "data-lineage" && (
          <LineageWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "api-contracts" && (
          <ContractsWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "messaging" && (
          <MessagingWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "cache-state" && (
          <CacheStateWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "governance" && (
          <GovernanceWorkspace
            projectId={currentProjectId}
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "evolution" && (
          <EvolutionWorkspace />
        )}

        {activeEngineId === "operations" && (
          <OperationsWorkspace />
        )}

        {activeEngineId === "verification" && (
          <VerificationWorkspace />
        )}

        {activeEngineId === "reports" && (
          <ReportWorkspace
            projectId={currentProjectId}
            architectureId="arch-head"
            graphRevision="rev-head"
            nodes={nodes}
            edges={edges}
          />
        )}

        {activeEngineId === "comparison" && (
          <ComparisonWorkspace />
        )}

        {activeEngineId === "capacity-planning" && (
          <CapacityPlanningPanel onClose={() => setActiveEngineId(null)} />
        )}

        {activeEngineId === "ai-assistant" && (
          <AssistantPanel
            nodes={nodes}
            edges={edges}
            projectId={currentProjectId}
            onClose={() => setActiveEngineId(null)}
          />
        )}

        {activeEngineId === "recommendations" && (
          <div className="p-3">
            <UnifiedRecommendationList />
          </div>
        )}
      </div>

      {/* Resize Handle on Left Edge of Engine Panel */}
      <PanelResizeHandle
        side="left"
        currentWidth={enginePanelWidth}
        minWidth={340}
        maxWidth={880}
        defaultWidth={480}
        onResize={setEnginePanelWidth}
        ariaLabel="Resize Engine panel"
      />
    </aside>
  );
}
