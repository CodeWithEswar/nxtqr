"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@nxtqr/ui";
import { ExternalLinkIcon, SpinnerIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { GraphDocumentSchema, type GraphDocument } from "@nxtqr/graph-schema";
import { TUTORIAL_PREVIEW_STORAGE_KEY } from "../lib/tutorial-workspace";

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
      const params = new URLSearchParams();
      if (templateSlug) {
        params.set("template", templateSlug);
      } else {
        window.sessionStorage.setItem(TUTORIAL_PREVIEW_STORAGE_KEY, JSON.stringify(parsed.data));
        params.set("tutorialPreview", parsed.data.id);
      }
      router.push(`/workspace?${params}`);
    } catch (err) {
      console.error("[OpenInVisualizer] Failed to serialize template graph:", err);
      setIsLoading(false);
      setError("The workspace could not be opened. Try again.");
    }
  }, [document, templateSlug, router]);

  const loadingLabel = "Opening visualizer…";
  const actionLabel = isLoading ? loadingLabel : label;
  const Icon = isLoading ? SpinnerIcon : ExternalLinkIcon;
  const action = (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon-sm" : size}
      onClick={handleOpen}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={iconOnly ? actionLabel : undefined}
      className={cn("gap-1.5", iconOnly && "text-text-secondary", className)}
    >
      <Icon size={14} className={cn("shrink-0", isLoading && "motion-safe:animate-spin")} />
      {!iconOnly && (
        <span className="grid">
          <span className={cn("col-start-1 row-start-1", isLoading && "invisible")}>{label}</span>
          <span className={cn("col-start-1 row-start-1", !isLoading && "invisible")}>
            {loadingLabel}
          </span>
        </span>
      )}
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
      <span role="status" className="sr-only">
        {isLoading ? actionLabel : ""}
      </span>
      {error && (
        <p role="alert" className="mt-1 text-xs text-text-secondary">
          {error}
        </p>
      )}
    </div>
  );
}
