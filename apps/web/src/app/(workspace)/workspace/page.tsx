"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const GraphEditor = dynamic(
  () => import("@/features/graph-engine").then((m) => m.GraphEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-border-default border-t-foreground rounded-full animate-spin" />
          <div className="flex flex-col items-center gap-1 font-mono text-xs text-text-muted">
            <span className="font-semibold text-text-secondary">Initializing Graph Engine</span>
            <span className="text-[10px] text-text-disabled">Mounting React Flow & ELK Layout Subsystems...</span>
          </div>
        </div>
      </div>
    ),
  },
);

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black">
      <GraphEditor projectId={projectId} className="flex-1" />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-full w-full flex items-center justify-center bg-black font-mono text-xs text-text-muted">
          Loading workspace...
        </div>
      }
    >
      <WorkspaceContent />
    </React.Suspense>
  );
}
