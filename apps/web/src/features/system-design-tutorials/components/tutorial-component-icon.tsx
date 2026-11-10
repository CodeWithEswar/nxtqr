import * as React from "react";
import { CpuIcon, getInfrastructureIcon } from "@nxtqr/icons";

export interface TutorialComponentIconProps {
  slug?: string;
  size?: number;
  variant?: "colored" | "monochrome";
  className?: string;
}

export function TutorialComponentIcon({
  slug,
  size = 32,
  variant = "colored",
  className = "",
}: TutorialComponentIconProps) {
  const Icon = slug ? getInfrastructureIcon(slug) : undefined;
  if (!Icon) {
    return <CpuIcon size={size} className={className} />;
  }
  return <Icon size={size} variant={variant} className={className} />;
}
