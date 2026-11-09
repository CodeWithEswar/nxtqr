"use client";

import * as React from "react";
import { ErrorLayout } from "@/features/errors";

export default function NotFound() {
  return (
    <ErrorLayout
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      primaryActionLabel="Return to Workspace"
      primaryActionHref="/workspace"
      secondaryActionLabel="Studio Documentation"
      secondaryActionHref="/docs"
      visualVariant="not-found"
    />
  );
}
