"use client";

import * as React from "react";
import { ErrorLayout } from "./error-layout";

export interface ProjectUnavailableViewProps {
  className?: string;
}

export function ProjectUnavailableView({ className }: ProjectUnavailableViewProps) {
  return (
    <ErrorLayout
      code="404"
      title="Project unavailable"
      description="This project doesn't exist or you no longer have access to it."
      primaryActionLabel="View Projects"
      primaryActionHref="/workspace/projects"
      secondaryActionLabel="Return to Workspace"
      secondaryActionHref="/workspace"
      visualVariant="not-found"
      className={className}
    />
  );
}
