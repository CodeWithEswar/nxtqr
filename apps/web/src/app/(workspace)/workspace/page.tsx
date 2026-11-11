"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatedLogo } from "@nxtqr/branding";
import { Button } from "@nxtqr/ui";

import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import { getTutorialWorkspaceDocument } from "@/features/system-design-tutorials/lib/tutorial-workspace";

const GraphEditor = dynamic(
  () => import("@/features/graph-engine/components/graph-editor").then((m) => m.GraphEditor),
  {
    ssr: false,
    loading: () => <WorkspaceLoading message="Initializing Graph Engine" />,
  },
);

function WorkspaceLoading({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black font-mono text-xs text-text-secondary"
    >
      <AnimatedLogo mode="loading" variant="minimal" size={48} />
      {message}
    </div>
  );
}

function TutorialWorkspace({
  templateSlug,
  previewId,
}: {
  templateSlug: string | null;
  previewId: string | null;
}) {
  const [status, setStatus] = React.useState<"loading" | "ready" | "unavailable">("loading");

  React.useEffect(() => {
    const document = getTutorialWorkspaceDocument(templateSlug, previewId);
    if (!document) {
      setStatus("unavailable");
      return;
    }
    useGraphEditorStore.getState().loadDocument(document, null);
    setStatus("ready");
  }, [templateSlug, previewId]);

  if (status === "loading") return <WorkspaceLoading message="Loading tutorial diagram…" />;
  if (status === "unavailable") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p role="status" className="text-sm text-text-secondary">
          This tutorial diagram is unavailable.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/tutorial/system-design">Return to tutorials</Link>
        </Button>
      </div>
    );
  }

  return <GraphEditor className="flex-1" fitViewOnMount />;
}

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const templateSlug = searchParams.get("template");
  const previewId = searchParams.get("tutorialPreview");

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black">
      {!projectId && (templateSlug || previewId) ? (
        <TutorialWorkspace
          key={templateSlug ? `template:${templateSlug}` : `preview:${previewId}`}
          templateSlug={templateSlug}
          previewId={previewId}
        />
      ) : (
        <GraphEditor projectId={projectId} className="flex-1" />
      )}
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
