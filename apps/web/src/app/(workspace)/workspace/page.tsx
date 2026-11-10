"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { AnimatedLogo } from "@nxtqr/branding";

import { useGraphEditorStore } from "@/features/graph-engine";
import { getExampleBySlug } from "@/features/system-design-tutorials";

const GraphEditor = dynamic(
  () => import("@/features/graph-engine").then((m) => m.GraphEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black select-none">
        <div role="status" className="flex flex-col items-center gap-3">
          <AnimatedLogo mode="loading" variant="minimal" size={48} />
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
  const templateSlug = searchParams.get("template");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for sessionStorage imported graph document from tutorials
    const storedDoc = window.sessionStorage.getItem("nxtqr_import_document");
    if (storedDoc) {
      try {
        const parsed = JSON.parse(storedDoc);
        window.sessionStorage.removeItem("nxtqr_import_document");
        useGraphEditorStore.getState().loadDocument(parsed);
        return;
      } catch (e) {
        console.error("[Workspace] Failed to parse sessionStorage template doc:", e);
      }
    }

    // Fallback: If template query parameter provided, load architecture example
    if (templateSlug) {
      const example = getExampleBySlug(templateSlug);
      if (example) {
        useGraphEditorStore.getState().loadDocument(example.graphDocument);
      }
    }
  }, [templateSlug]);

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
