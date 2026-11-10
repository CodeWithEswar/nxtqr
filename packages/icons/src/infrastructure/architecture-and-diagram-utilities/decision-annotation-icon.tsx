import * as React from "react";
import type { InfrastructureIconProps } from "../types";

export const DecisionAnnotationIcon: React.FC<InfrastructureIconProps> = ({
  size = 32,
  variant = "colored",
  decorative = true,
  title = "Decision Annotation",
  className,
  ...props
}) => {
  const isColored = variant === "colored";

  const strokePrimary = isColored ? "#C4B5FD" : "#A3A3A3";
  const strokeAccent = isColored ? "#EDE9FE" : "#E5E5E5";
  const fillFoundation = isColored ? "#2E1065" : "#141414";
  const approvedFill = isColored ? "#8B5CF6" : "#262626";

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
      {/* Outer Annotation Badge Card */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3.5"
        fill={fillFoundation}
        stroke={strokePrimary}
        strokeWidth="1.2"
      />

      {/* Decision Branching Fork: Root Node */}
      <circle cx="8" cy="16" r="2" fill={strokeAccent} />

      {/* Decision Path Fork Arms */}
      <path
        d="M10 16H14C15.5 16 16.5 12 18 10H20"
        stroke={strokePrimary}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M10 16H14C15.5 16 16.5 20 18 22H20"
        stroke={strokePrimary}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="1.5 1.5"
      />

      {/* Superseded / Rejected Option (Bottom) */}
      <circle cx="23" cy="22" r="2" fill="none" stroke={strokePrimary} strokeWidth="1" />
      <path d="M22 21L24 23M24 21L22 23" stroke={strokePrimary} strokeWidth="0.8" strokeLinecap="round" />

      {/* Accepted Architecture Option (Top Badge) */}
      <circle cx="23" cy="10" r="3" fill={approvedFill} stroke={strokeAccent} strokeWidth="1" />
      <path
        d="M21.5 10L22.5 11L24.5 9"
        stroke={strokeAccent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ADR Record Indicator Pill at Bottom Left */}
      <rect x="7" y="22" width="6" height="2" rx="0.5" fill={strokePrimary} />
    </svg>
  );
};
