"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@nxtqr/ui";
import { ExternalLinkIcon, SpinnerIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { GraphDocumentSchema, type GraphDocument } from "@nxtqr/graph-schema";

export interface OpenInVisualizerButtonProps {
  document: GraphDocument;
  templateSlug?: string;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
  iconOnly?: boolean;
}

export function OpenInVisualizerButton({
  document,
  templateSlug,
  variant = "default",
  size = "default",
  className = "",
  label = "Open in Visualizer",
  iconOnly = false,
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

  const actionLabel = isLoading ? "Opening visualizer…" : label;
  const Icon = isLoading ? SpinnerIcon : ExternalLinkIcon;
  const action = (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon-sm" : size}
      onClick={handleOpen}
      disabled={isLoading}
      aria-label={iconOnly ? actionLabel : undefined}
      className={cn("gap-1.5", iconOnly && "text-text-secondary", className)}
    >
      <Icon size={14} className={cn("shrink-0", isLoading && "motion-safe:animate-spin")} />
      {!iconOnly && <span>{actionLabel}</span>}
    </Button>
  );

  return (
    <div className="min-w-0">
      {iconOnly ? (
        <Tooltip>
          <TooltipTrigger asChild>{action}</TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            {label}
          </TooltipContent>
        </Tooltip>
      ) : (
        action
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-text-secondary">
          {error}
        </p>
      )}
    </div>
  );
}
