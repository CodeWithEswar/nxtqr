"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";
import { AlertCircleIcon } from "@nxtqr/icons";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to console/observability without crashing application
    console.error("[NXTQR App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 text-destructive mb-4">
        <AlertCircleIcon className="h-6 w-6" />
      </div>
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        An unexpected application error occurred
      </h2>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm font-mono">
        {error.message || "Unknown error encountered"}
      </p>
      {error.digest && (
        <span className="mt-1 text-[10px] text-muted-foreground font-mono">
          Digest: {error.digest}
        </span>
      )}
      <div className="mt-5 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button variant="default" size="sm" onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
