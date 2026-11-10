import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const GitRepositoryIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Git Repository",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokeColor = isColored ? "#FB923C" : "#A3A3A3";
  const strokeAccent = isColored ? "#FED7AA" : "#D4D4D4";
  const fillFoundation = isColored ? "#431407" : "#141414";
  const fillSurface = isColored ? "#7C2D12" : "#1F1F1F";

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
      {/* Repository Enclosure Vault */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3"
        fill={fillFoundation}
        stroke={strokeColor}
        strokeWidth="1.3"
      />

      {/* Main Branch Line (Left Spine) */}
      <line x1="11" y1="9" x2="11" y2="23" stroke={strokeColor} strokeWidth="1.4" />

      {/* Feature Branch Fork & Merge Trajectory */}
      <path
        d="M11 13C15 13 18 14 18 17V19C18 21 15 22 11 22"
        stroke={strokeAccent}
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Commit Nodes */}
      {/* Root Commit */}
      <circle cx="11" cy="9" r="2.2" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="11" cy="9" r="0.8" fill={strokeAccent} />

      {/* Fork Point Commit */}
      <circle cx="11" cy="14" r="1.8" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />

      {/* Feature Branch Commit */}
      <circle cx="18" cy="18" r="2.2" fill={fillSurface} stroke={strokeAccent} strokeWidth="1.2" />
      <circle cx="18" cy="18" r="0.8" fill={isColored ? "#FB923C" : "#FFFFFF"} />

      {/* Merge Commit (Head) */}
      <circle cx="11" cy="23" r="2.2" fill={fillSurface} stroke={strokeColor} strokeWidth="1.2" />
      <circle cx="11" cy="23" r="0.8" fill={strokeAccent} />
    </svg>
  );
};

