"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@nxtqr/ui";
import { ExternalLinkIcon } from "@nxtqr/icons";
import { GraphDocumentSchema, type GraphDocument } from "@nxtqr/graph-schema";

export interface OpenInVisualizerButtonProps {
  document: GraphDocument;
  templateSlug?: string;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}

export function OpenInVisualizerButton({
  document,
  templateSlug,
  variant = "default",
  size = "default",
  className = "",
  label = "Open in Visualizer",
}: OpenInVisualizerButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const handleOpen = React.useCallback(() => {
    setError(undefined);
    const parsed = GraphDocumentSchema.safeParse(document);
    if (!parsed.success) {
      setError("This diagram could not be opened.");
      return;
    }

    try {
      setIsLoading(true);
      // Store document in sessionStorage for immediate hydration in the workspace
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("nxtqr_import_document", JSON.stringify(parsed.data));
      }
      const targetUrl = templateSlug
        ? `/workspace?template=${encodeURIComponent(templateSlug)}`
        : "/workspace";
      router.push(targetUrl);
    } catch (err) {
      console.error("[OpenInVisualizer] Failed to serialize template graph:", err);
      setIsLoading(false);
      setError("The workspace could not be opened. Try again.");
    }
  }, [document, templateSlug, router]);

  return (
    <div className="min-w-0">
      <Button
        variant={variant}
        size={size}
        onClick={handleOpen}
        disabled={isLoading}
        className={`gap-2 font-mono text-xs ${className}`}
      >
        <ExternalLinkIcon className="w-3.5 h-3.5 text-current shrink-0" />
        <span>{isLoading ? "Loading Visualizer..." : label}</span>
      </Button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-text-secondary">
          {error}
        </p>
      )}
    </div>
  );
}
