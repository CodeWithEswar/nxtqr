import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const ArchitectureNoteIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Architecture Note",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#FBBF24" : "#A3A3A3";
  const strokeAccent = isColored ? "#FEF08A" : "#E5E5E5";
  const fillFoundation = isColored ? "#451A03" : "#141414";
  const fillSurface = isColored ? "#78350F" : "#1F1F1F";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? "presentation" : "img"}
      {...props}
    >
      {!decorative && title && <title>{title}</title>}
      {/* Document Sheet with Dog-Ear Fold */}
      <path
        d="M6 5C6 3.89543 6.89543 3 8 3H20L26 9V27C26 28.1046 25.1046 29 24 29H8C6.89543 29 6 28.1046 6 27V5Z"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1.2"
      />

      {/* Dog-Ear Triangle */}
      <path
        d="M20 3V9H26"
        fill={fillSurface}
        stroke={strokePrimary}
        strokeWidth="1"
      />

      {/* Architectural Documentation Lines */}
      <path
        d="M10 9H16"
        stroke={strokeAccent}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M10 13H22"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M10 17H22"
        stroke={strokePrimary}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M10 21H18"
        stroke={strokePrimary}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Architecture Tag Marker Pin at bottom-right */}
      <circle cx="21" cy="24.5" r="1.5" fill={strokeAccent} />
      <path d="M21 24.5L19.5 26" stroke={strokePrimary} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};
