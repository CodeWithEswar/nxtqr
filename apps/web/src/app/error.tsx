"use client";

import * as React from "react";
import { ErrorLayout } from "@/features/errors";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log masked error details to observability
    console.error("[NXTQR App Error]", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <ErrorLayout
      code="500"
      title="Something went wrong"
      description="An unexpected error prevented this page from loading. Diagnostic telemetry has been recorded."
      primaryActionLabel="Try Again"
      onPrimaryAction={() => reset()}
      secondaryActionLabel="Return to Workspace"
      secondaryActionHref="/workspace"
      visualVariant="error"
      digest={error.digest}
    />
  );
}
